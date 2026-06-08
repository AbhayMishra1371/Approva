import { NextResponse } from "next/server";
import { getLoggedInUser, createClient as createSupabaseServerClient } from "@/lib/supabase/server";

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
    // Allow self-signed certificates in the chain (common behind proxies/VPNs)
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

    /* Send email via Nodemailer */
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin") || "http://localhost:3000";
        const inviteLink = `${baseUrl}/invite?token=${inviteToken}`;

        try {
          await transporter.verify();
          console.log("SMTP Connection verified successfully");
        } catch (verifyError) {
          console.error("SMTP Connection Failed. Please check your .env.local credentials:", verifyError);
          throw verifyError;
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

        const info = await transporter.sendMail({
          from: process.env.SMTP_FROM || '"Approva" <noreply@approva.com>',
          to: email,
          subject: `You've been invited to collaborate on ${project.name}`,
          html: emailHtml,
        });

        console.log("Email sent successfully! Message ID:", info.messageId);
      } catch (err: any) {
        console.error("Email send failed:", err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : err);
      }
    } else {
      console.log("Skipping email. Missing SMTP configuration.");
    }

    return NextResponse.json({ ...invite, id: invite.id });
  } catch (error: any) {
    console.error("Collaborator POST Error:", error instanceof Error ? { message: error.message, stack: error.stack } : error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

//GET-fetch collaborators
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

    const supabase = await createSupabaseServerClient();

    /* Fetch project to verify caller access and to get owner_id */
    const { data: project, error: projectErr } = await supabase
      .from("projects")
      .select("owner_id, created_at")
      .eq("id", projectId)
      .single();

    if (projectErr || !project) {
      console.error("Collaborators API - Project fetch failed:", {
        error: projectErr,
        data: project,
        projectId,
        userId: user.$id
      });
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    /* Fetch collaborators from Supabase joined with profiles */
    const { data: collabs, error: collabsErr } = await supabase
      .from("project_collaborators")
      .select(`
        id,
        user_id,
        role,
        created_at,
        profiles (
          id,
          name,
          email,
          username,
          avatar_url
        )
      `)
      .eq("project_id", projectId);

    if (collabsErr) {
      throw collabsErr;
    }

    let callerRole = "";
    if (project.owner_id === user.$id) {
      callerRole = "owner";
    } else {
      const callerCollab = (collabs || []).find((c: any) => c.user_id === user.$id);
      if (callerCollab) {
        callerRole = callerCollab.role === 'member' ? 'viewer' : callerCollab.role;
      } else {
        return NextResponse.json(
          { error: "Unauthorized access to project" },
          { status: 403 }
        );
      }
    }

    // Map collaborators from Supabase schema
    const collaborators = (collabs || []).map((collab: any) => {
      const profile = collab.profiles || {};
      return {
        id: collab.id,
        user_id: collab.user_id,
        role: collab.role === 'member' ? 'viewer' : collab.role,
        created_at: collab.created_at,
        email: profile.email || "Unknown",
        name: profile.name || "Unknown User",
        username: profile.username || "",
        avatar_url: profile.avatar_url || ""
      };
    });

    /* Fetch invites if admin/owner */
    let invites: any[] = [];

    if (callerRole === "owner" || callerRole === "admin") {
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
      collaborators,
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

// PATCH-update collaborator role
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

    // Verify project exists and fetch owner
    const { data: project, error: projectErr } = await supabase
      .from("projects")
      .select("owner_id")
      .eq("id", projectId)
      .single();

    if (projectErr || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verify caller is owner or admin in Supabase
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

    // Map role: 'viewer' -> 'member' for Supabase
    const dbRole = newRole === 'viewer' ? 'member' : newRole;

    // Update the collaborator role in Supabase
    const { data: updatedCollab, error: updateErr } = await supabase
      .from("project_collaborators")
      .update({ role: dbRole })
      .eq("id", collaboratorId)
      .select()
      .single();

    if (updateErr) {
      throw updateErr;
    }

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