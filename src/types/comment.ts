/**
 * Represents a single comment inside an annotation thread.
 * Matches the shape returned by the Supabase `comments` query
 * (joined with `profiles`) and used by <CommentThread />.
 */
export interface Comment {
  /** Supabase row id (also aliased as `$id` in some responses) */
  $id: string;
  /** ID of the user who wrote the comment */
  user_id: string;
  user_email: string;
  /**
   * Raw comment text.
   * Mentions are stored as `@[Display Name](userId)` markdown-style tokens.
   */
  text: string;
  /** ISO-8601 timestamp */
  created_at: string;
  /** Optional profile join; null when the user has no profile row */
  profiles?: CommentAuthorProfile | null;
}

/** Subset of the `profiles` table joined onto a comment row */
export interface CommentAuthorProfile {
  name: string;
  avatar_url: string | null;
}

/**
 * An annotation pin placed on an asset.
 * Contains one or more {@link Comment} objects in its thread.
 */
export interface Annotation {
  id: string;
  asset_id: string;
  /** X position as a percentage (0–100) of the asset width */
  x: number;
  /** Y position as a percentage (0–100) of the asset height */
  y: number;
  status: 'pending' | 'resolved';
  created_at: string;
  /** ID of the user who created the annotation */
  created_by: string;
  /** Display label for the annotation (e.g. "Pin 1") */
  name?: string;
  comments: Comment[];
}

/**
 * Payload for creating a new annotation.
 */
export interface CreateAnnotationPayload {
  asset_id: string;
  x: number;
  y: number;
  /** Optional initial comment text */
  comment?: string;
}

/**
 * Payload for adding a comment to an existing annotation.
 */
export interface AddCommentPayload {
  text: string;
  /** User IDs that were @-mentioned in the comment */
  mentions?: string[];
}
