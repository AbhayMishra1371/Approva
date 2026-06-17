/**
 * All notification type discriminators.
 * These must stay in sync with `NotificationType` in `lib/notifications.ts`
 * and the `type` column in the Supabase `notifications` table.
 */
export type NotificationType =
  | 'mention'
  | 'project_invite'
  | 'comment'
  | 'approval'
  | 'rejection'
  | 'changes_requested';

/**
 * A notification record as returned by GET /api/notifications.
 * Mirrors the `notifications` table schema in Supabase.
 */
export interface Notification {
  /** UUID primary key */
  id: string;
  /** Recipient user ID */
  user_id: string;
  /** ID of the user/system that triggered the notification */
  sender_id?: string | null;
  /** FK to the related project, when applicable */
  project_id?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  /** Deep-link URL inside the app, e.g. `/dashboard/projects/{id}/assets/{assetId}` */
  link?: string | null;
  /** Arbitrary key-value pairs for additional context */
  metadata?: Record<string, unknown>;
  is_read: boolean;
  /** ISO-8601 timestamp */
  created_at: string;
}

/**
 * Payload shape accepted by POST /api/notifications.
 * Also used by the server-side `createNotification()` helper in `lib/notifications.ts`.
 */
export interface CreateNotificationPayload {
  /** Recipient user ID */
  user_id: string;
  /** ID of the user who triggered the notification */
  sender_id?: string;
  project_id?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Payload shape for PATCH /api/notifications (mark-as-read).
 * Send either `id` (single) or `markAllRead: true` (bulk).
 */
export type MarkNotificationReadPayload =
  | { id: string; markAllRead?: never }
  | { markAllRead: true; id?: never };
