import { NextResponse } from "next/server";
import { getLoggedInUser, createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createNotification, NotificationType } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/** POST /api/notifications — create a notification (used by client for mentions) */
export async function POST(request: Request) {
  try {
    const { user } = await getLoggedInUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { user_id, project_id, type, title, message, link, metadata } = body;

    if (!user_id || !type || !title || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await createNotification({
      user_id,
      sender_id: user.$id,
      project_id: project_id ?? null,
      type: type as NotificationType,
      title,
      message,
      link: link ?? null,
      metadata: metadata ?? {},
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/notifications error:", error?.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/** GET /api/notifications — returns all notifications for the current user */
export async function GET() {
  try {
    const { user } = await getLoggedInUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.$id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ notifications: data ?? [] });
  } catch (error: any) {
    console.error("GET /api/notifications error:", error?.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications
 * Body: { id: string } — mark single notification as read
 *       { markAllRead: true } — mark all as read
 */
export async function PATCH(request: Request) {
  try {
    const { user } = await getLoggedInUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const supabase = await createSupabaseServerClient();

    if (body.markAllRead) {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.$id)
        .eq("is_read", false);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (body.id) {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", body.id)
        .eq("user_id", user.$id); // ensure ownership

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Missing id or markAllRead" }, { status: 400 });
  } catch (error: any) {
    console.error("PATCH /api/notifications error:", error?.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
