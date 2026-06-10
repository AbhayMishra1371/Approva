import { NextResponse } from "next/server";
import { getLoggedInUser, createClient as createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/notifications/[id]/accept-invite
 * Accepts a project invite directly from a notification (GitHub-style).
 * 1. Reads the invite token from notification metadata
 * 2. Validates and consumes the invite
 * 3. Adds user to project_collaborators
 * 4. Marks the notification as read
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getLoggedInUser();
    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: notificationId } = await params;
    const supabase = await createSupabaseServerClient();

    // 1. Fetch the notification (ensures it belongs to this user)
    const { data: notification, error: notifErr } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", notificationId)
      .eq("user_id", user.$id)
      .single();

    if (notifErr || !notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    const inviteToken = notification.metadata?.invite_token;
    if (!inviteToken) {
      return NextResponse.json({ error: "No invite token in notification" }, { status: 400 });
    }

    // 2. Fetch and validate the invite
    const { data: invite, error: inviteErr } = await supabase
      .from("project_invites")
      .select("*")
      .eq("token", inviteToken)
      .eq("status", "pending")
      .single();

    if (inviteErr || !invite) {
      return NextResponse.json({ error: "Invite not found or already accepted" }, { status: 404 });
    }

    if (invite.email !== user.email) {
      return NextResponse.json({ error: "Email mismatch" }, { status: 403 });
    }

    // 3. Check if already a collaborator
    const { data: existingCollab } = await supabase
      .from("project_collaborators")
      .select("id")
      .eq("project_id", invite.project_id)
      .eq("user_id", user.$id)
      .maybeSingle();

    if (!existingCollab) {
      const dbRole = invite.role === "viewer" ? "member" : invite.role;
      const { error: collabErr } = await supabase
        .from("project_collaborators")
        .insert({ project_id: invite.project_id, user_id: user.$id, role: dbRole });

      if (collabErr) throw collabErr;
    }

    // 4. Update invite status
    await supabase
      .from("project_invites")
      .update({ status: "accepted" })
      .eq("id", invite.id);

    // 5. Mark notification as read
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    return NextResponse.json({ success: true, project_id: invite.project_id });
  } catch (error: any) {
    console.error("accept-invite notification error:", error?.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/notifications/[id]/reject-invite
 * Declines a project invite from the notification panel.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getLoggedInUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: notificationId } = await params;
    const supabase = await createSupabaseServerClient();

    const { data: notification, error: notifErr } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", notificationId)
      .eq("user_id", user.$id)
      .single();

    if (notifErr || !notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    const inviteToken = notification.metadata?.invite_token;
    if (inviteToken) {
      await supabase
        .from("project_invites")
        .update({ status: "declined" })
        .eq("token", inviteToken);
    }

    // Mark notification as read (dismissed)
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("reject-invite notification error:", error?.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
