import { NextResponse } from "next/server";
import { getLoggedInUser, createAdminClient } from "@/lib/appwrite/server";
import { ID, Query } from "node-appwrite";
import { Resend } from "resend";
import { render } from "@react-email/render";
import ProjectInviteEmail from "@/emails/ProjectInviteEmail";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");

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
    const invite = await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_INVITES_ID!,
      ID.unique(),
      {
        project_id: projectId,
        email,
        role,
        invited_at: new Date().toISOString(),
      }
    );

    /* Send email via Resend */
    if (
      process.env.RESEND_API_KEY &&
      process.env.RESEND_API_KEY.startsWith("re_")
    ) {
      try {
        const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const inviteLink = `${origin}/dashboard`;

        const { data, error } = await resend.emails.send({
          from: "Approva <onboarding@resend.dev>",
          to: email,
          subject: `You've been invited to collaborate on ${project.name}`,
          react: ProjectInviteEmail({
            inviterEmail: user.email || "Someone",
            targetEmail: email,
            projectName: project.name || "a project",
            role,
            inviteLink: inviteLink,
          }) as React.ReactElement,
        });

        if (error) {
          console.error("Resend Error:", error);
        } else {
          console.log("Email sent successfully:", data?.id);
        }
      } catch (err) {
        console.error("Email send failed:", err);
      }
    } else {
      console.log("Skipping email. Invalid RESEND_API_KEY.");
    }

    return NextResponse.json({ ...invite, id: invite.$id });
  } catch (error: any) {
    console.error("Collaborator POST Error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

/* =========================================
   GET → Fetch Collaborators
========================================= */
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