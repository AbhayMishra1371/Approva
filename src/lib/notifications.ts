import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

export type NotificationType =
  | "mention"
  | "project_invite"
  | "comment"
  | "approval"
  | "rejection"
  | "changes_requested";

export interface CreateNotificationPayload {
  user_id: string;       // recipient
  sender_id?: string;    // who triggered it
  project_id?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}

/**
 * Server-side helper — inserts a row into the notifications table.
 * Silently logs errors so a notification failure never breaks the primary flow.
 */
export async function createNotification(payload: CreateNotificationPayload) {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("notifications").insert({
      user_id: payload.user_id,
      sender_id: payload.sender_id ?? null,
      project_id: payload.project_id ?? null,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      link: payload.link ?? null,
      metadata: payload.metadata ?? {},
      is_read: false,
    });
    if (error) {
      console.error("[notifications] Failed to insert notification:", error.message);
    }
  } catch (err: any) {
    console.error("[notifications] Unexpected error creating notification:", err?.message ?? err);
  }
}
