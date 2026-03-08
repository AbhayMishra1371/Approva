import { NextResponse } from "next/server";
import { getLoggedInUser, createAdminClient } from "@/lib/appwrite/server";
import { ID, Query } from "node-appwrite";
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
});

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { user } = await getLoggedInUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { databases } = await createAdminClient();
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

    /* Ensure caller is collaborator */
    const callerAccess = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLABORATORS_ID!,
      [
        Query.equal("project_id", projectId),
        Query.equal("user_id", user.$id),
        Query.limit(1),
      ]
    );

    if (callerAccess.total === 0) {
      return NextResponse.json(
        { error: "Unauthorized access to project" },
        { status: 403 }
      );
    }

    const callerRole = callerAccess.documents[0].role;

    if (callerRole !== "owner" && callerRole !== "admin") {
      return NextResponse.json(
        { error: "Insufficient permissions to add collaborators" },
        { status: 403 }
      );
    }

    /* Prevent duplicate invites */
    const existingInvite = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_INVITES_ID!,
      [
        Query.equal("project_id", projectId),
        Query.equal("email", email),
      ]
    );

    if (existingInvite.total > 0) {
      return NextResponse.json(
        { error: "Invite already sent to this email." },
        { status: 409 }
      );
    }

    /* Fetch project details for email */
    const project = await databases.getDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_PROJECTS_ID!,
      projectId
    );

    /* Create invite in DB */
    const inviteToken = uuidv4();
    const invite = await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_INVITES_ID!,
      ID.unique(),
      {
        project_id: projectId,
        email,
        role,
        token: inviteToken,
        status: "pending",
        invited_at: new Date().toISOString(),
      }
    );

    /* Send email via Nodemailer */
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin") || "http://localhost:3000";
        const inviteLink = `${baseUrl}/invite?token=${inviteToken}`;

        let targetEmail = email;
        const testMatch = email.match(/\+(.*?)@/);
        if (process.env.SMTP_USER === "test@example.com") {
          console.log("Mock Environment");
        }

        // Add verification to check if SMTP connection works before trying to send
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
        console.log("Accepted domains:", info.accepted);
        console.log("Rejected domains:", info.rejected);
      } catch (err: any) {
        console.error("Email send failed:", err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : err);
      }
    } else {
      console.log("Skipping email. Missing SMTP configuration.");
    }

    return NextResponse.json({ ...invite, id: invite.$id });
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

    const { databases } = await createAdminClient();

    /* AUTO-SEED OWNER IF MISSING */
    const existingAccess = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLABORATORS_ID!,
      [
        Query.equal("project_id", projectId),
        Query.equal("user_id", user.$id),
        Query.limit(1),
      ]
    );

    if (existingAccess.total === 0) {
      // Assume project creator → seed as owner
      await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLABORATORS_ID!,
        ID.unique(),
        {
          project_id: projectId,
          user_id: user.$id,
          role: "owner",
        }
      );
    }

    /* Re-check access */
    const callerAccess = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLABORATORS_ID!,
      [
        Query.equal("project_id", projectId),
        Query.equal("user_id", user.$id),
        Query.limit(1),
      ]
    );

    if (callerAccess.total === 0) {
      return NextResponse.json(
        { error: "Unauthorized access to project" },
        { status: 403 }
      );
    }

    const callerRole = callerAccess.documents[0].role;

    /* Fetch collaborators */
    const collabsRes = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLABORATORS_ID!,
      [Query.equal("project_id", projectId)]
    );

    const collaborators = collabsRes.documents.map((doc) => ({
      id: doc.$id,
      user_id: doc.user_id,
      role: doc.role,
      created_at: doc.$createdAt,
      email:
        doc.user_id === user.$id
          ? user.email
          : "User_" + doc.user_id.substring(0, 4),
    }));

    /* Fetch invites if admin/owner */
    let invites: any[] = [];

    if (callerRole === "owner" || callerRole === "admin") {
      const invitesRes = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_INVITES_ID!,
        [Query.equal("project_id", projectId)]
      );

      invites = invitesRes.documents.map((doc) => ({
        id: doc.$id,
        email: doc.email,
        role: doc.role,
        invited_at: doc.$createdAt,
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