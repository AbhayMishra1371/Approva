import { NextResponse } from "next/server";
import { getLoggedInUser, createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";
import { CollaboratorController } from "@/modules/collaborators/collaborator.controller";

import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import ProjectInviteEmail from "@/emails/ProjectInviteEmail";
import * as React from "react";
import { v4 as uuidv4 } from 'uuid';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { user } = await getLoggedInUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, email, role } = await request.json();

    if (!projectId || !email || !role) {
      return NextResponse.json(
        { error: "Missing required fields (projectId, email, role)" },
        { status: 400 }
      );
    }

    if (!["owner", "admin", "reviewer", "viewer"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role specified" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    /* Fetch project details and check caller access */
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("name, owner_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    let callerRole = "";
    if (project.owner_id === user.$id) {
      callerRole = "owner";
    } else {
      const { data: collab } = await supabase
        .from("project_collaborators")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", user.$id)
        .maybeSingle();

      if (collab) {
        callerRole = collab.role === 'member' ? 'viewer' : collab.role;
      }
    }

    if (callerRole !== "owner" && callerRole !== "admin") {
      return NextResponse.json(
        { error: "Insufficient permissions to add collaborators" },
        { status: 403 }
      );
    }

    /* Prevent duplicate invites */
    const { data: existingInvite, error: existingInviteErr } = await supabase
      .from("project_invites")
      .select("id")
      .eq("project_id", projectId)
      .eq("email", email)
      .eq("status", "pending");

    if (!existingInviteErr && existingInvite && existingInvite.length > 0) {
      return NextResponse.json(
        { error: "Invite already sent to this email." },
        { status: 409 }
      );
    }

    /* Create invite in DB */
    const inviteToken = uuidv4();
    const { data: invite, error: inviteErr } = await supabase
      .from("project_invites")
      .insert({
        project_id: projectId,
        email,
        role,
        token: inviteToken,
        status: "pending",
        invited_by: user.$id
      })
      .select()
      .single();

    if (inviteErr || !invite) {
      return NextResponse.json({ error: "Failed to create invitation in Supabase" }, { status: 500 });
    }

    /* Send in-app notification to invitee (if they have an account) */
    try {
      const { data: inviteeProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (inviteeProfile) {
        const senderProfile = await supabase
          .from("profiles")
          .select("name")
          .eq("id", user.$id)
          .maybeSingle();
        const senderName = senderProfile?.data?.name || user.name || "Someone";
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const inviteLink = `${baseUrl}/invite?token=${inviteToken}`;

        await createNotification({
          user_id: inviteeProfile.id,
          sender_id: user.$id,
          project_id: projectId,
          type: "project_invite",
          title: "Project Invitation",
          message: `${senderName} invited you to collaborate on ${project.name}`,
          link: inviteLink,
          metadata: { invite_id: invite.id, invite_token: inviteToken },
        });
      }
    } catch (notifErr) {
      console.error("Failed to create invite notification:", notifErr);
    }

    /* Send email via Nodemailer */
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin") || "http://localhost:3000";
        const inviteLink = `${baseUrl}/invite?token=${inviteToken}`;

        try {
          await transporter.verify();
        } catch (verifyError) {
          console.error("SMTP Connection Failed:", verifyError);
        }

        const emailHtml = await render(
          React.createElement(ProjectInviteEmail, {
            inviterEmail: user.email || "Someone",
            targetEmail: email,
            projectName: project.name || "a project",
            role,
            inviteLink: inviteLink,
          })
        );

        await transporter.sendMail({
          from: process.env.SMTP_FROM || '"Approva" <noreply@approva.com>',
          to: email,
          subject: `You've been invited to collaborate on ${project.name}`,
          html: emailHtml,
        });
      } catch (err: any) {
        console.error("Email send failed:", err);
      }
    }

    // Invalidate project collaborators cache after invite/add
    const collabController = new CollaboratorController();
    await collabController.invalidateCollaboratorCache(projectId);

    return NextResponse.json({ ...invite, id: invite.id });
  } catch (error: any) {
    console.error("Collaborator POST Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// GET - fetch collaborators using Redis Cache
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const { user } = await getLoggedInUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collabController = new CollaboratorController();
    const data = await collabController.getCollaborators(projectId);

    if (!data) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    let callerRole = "";
    if (data.owner_id === user.$id) {
      callerRole = "owner";
    } else {
      const callerCollab = data.collabsRaw.find((c: any) => c.user_id === user.$id);
      if (callerCollab) {
        callerRole = callerCollab.role === 'member' ? 'viewer' : callerCollab.role;
      } else {
        return NextResponse.json(
          { error: "Unauthorized access to project" },
          { status: 403 }
        );
      }
    }

    /* Fetch invites if admin/owner */
    let invites: any[] = [];
    if (callerRole === "owner" || callerRole === "admin") {
      const supabase = await createSupabaseServerClient();
      const { data: invitesRes } = await supabase
        .from("project_invites")
        .select("*")
        .eq("project_id", projectId)
        .eq("status", "pending");

      invites = (invitesRes || []).map((doc) => ({
        id: doc.id,
        email: doc.email,
        role: doc.role,
        invited_at: doc.invited_at,
      }));
    }

    return NextResponse.json({
      collaborators: data.collaborators,
      invites,
      callerRole,
    });
  } catch (error: any) {
    console.error("Collaborator GET Error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PATCH - update collaborator role
export async function PATCH(request: Request) {
  try {
    const { user } = await getLoggedInUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, collaboratorId, newRole } = await request.json();

    if (!projectId || !collaboratorId || !newRole) {
      return NextResponse.json(
        { error: "Missing required fields (projectId, collaboratorId, newRole)" },
        { status: 400 }
      );
    }

    if (!["owner", "admin", "reviewer", "viewer"].includes(newRole)) {
      return NextResponse.json(
        { error: "Invalid role specified" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const { data: project, error: projectErr } = await supabase
      .from("projects")
      .select("owner_id")
      .eq("id", projectId)
      .single();

    if (projectErr || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    let callerRole = "";
    if (project.owner_id === user.$id) {
      callerRole = "owner";
    } else {
      const { data: collab } = await supabase
        .from("project_collaborators")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", user.$id)
        .maybeSingle();

      if (collab) {
        callerRole = collab.role === 'member' ? 'viewer' : collab.role;
      }
    }

    if (callerRole !== "owner" && callerRole !== "admin") {
      return NextResponse.json(
        { error: "Insufficient permissions to modify roles" },
        { status: 403 }
      );
    }

    const dbRole = newRole === 'viewer' ? 'member' : newRole;

    const { data: updatedCollab, error: updateErr } = await supabase
      .from("project_collaborators")
      .update({ role: dbRole })
      .eq("id", collaboratorId)
      .select()
      .single();

    if (updateErr) {
      throw updateErr;
    }

    // Invalidate project collaborators cache after role update
    const collabController = new CollaboratorController();
    await collabController.invalidateCollaboratorCache(projectId);

    return NextResponse.json({
      success: true,
      collaborator: {
        ...updatedCollab,
        id: updatedCollab.id,
        role: updatedCollab.role === 'member' ? 'viewer' : updatedCollab.role
      }
    });
  } catch (error: any) {
    console.error("Collaborator PATCH Error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE - remove collaborator
export async function DELETE(request: Request) {
  try {
    const { user } = await getLoggedInUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    const collaboratorId = url.searchParams.get("collaboratorId");

    if (!projectId || !collaboratorId) {
      return NextResponse.json(
        { error: "Missing required fields (projectId, collaboratorId)" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const { data: project, error: projectErr } = await supabase
      .from("projects")
      .select("owner_id")
      .eq("id", projectId)
      .single();

    if (projectErr || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    let callerRole = "";
    if (project.owner_id === user.$id) {
      callerRole = "owner";
    } else {
      const { data: collab } = await supabase
        .from("project_collaborators")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", user.$id)
        .maybeSingle();

      if (collab) {
        callerRole = collab.role === 'member' ? 'viewer' : collab.role;
      }
    }

    if (callerRole !== "owner" && callerRole !== "admin") {
      return NextResponse.json(
        { error: "Insufficient permissions to remove collaborators" },
        { status: 403 }
      );
    }

    const { error: deleteErr } = await supabase
      .from("project_collaborators")
      .delete()
      .eq("id", collaboratorId);

    if (deleteErr) {
      throw deleteErr;
    }

    // Invalidate project collaborators cache after collaborator removal
    const collabController = new CollaboratorController();
    await collabController.invalidateCollaboratorCache(projectId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Collaborator DELETE Error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}