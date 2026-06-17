import type { ProjectRole } from './project';

/**
 * A collaborator record as returned by GET /api/projects/collaborators.
 * Combines the `project_collaborators` row with the related `profiles` join.
 */
export interface Collaborator {
  /** `project_collaborators.id` UUID */
  id: string;
  /** References `auth.users.id` (Supabase Auth) */
  user_id: string;
  role: ProjectRole | string;
  /** ISO-8601 timestamp when the user joined the project */
  created_at: string;
  // ── From the joined profiles row ─────────────────────────────────────────
  email: string;
  name: string;
  username: string;
  avatar_url: string;
}

/**
 * A pending invite record as returned to owner / admin callers
 * by GET /api/projects/collaborators.
 */
export interface ProjectInvite {
  /** `project_invites.id` UUID */
  id: string;
  email: string;
  role: ProjectRole | string;
  /** ISO-8601 timestamp when the invite was created */
  invited_at: string;
}

/**
 * The full payload returned by GET /api/projects/collaborators.
 */
export interface CollaboratorsResponse {
  collaborators: Collaborator[];
  /** Only populated for owner / admin callers */
  invites: ProjectInvite[];
  callerRole: ProjectRole | string;
}

/**
 * Payload shape accepted by POST /api/projects/collaborators (send invite).
 */
export interface InviteCollaboratorPayload {
  projectId: string;
  email: string;
  role: ProjectRole;
}

/**
 * Payload shape accepted by PATCH /api/projects/collaborators (change role).
 */
export interface UpdateCollaboratorRolePayload {
  projectId: string;
  collaboratorId: string;
  newRole: ProjectRole;
}

/**
 * Lightweight collaborator shape used in the mention picker inside <CommentThread />.
 * Populated from the collaborators list fetch.
 */
export interface MentionableCollaborator {
  user_id: string;
  name: string;
  username?: string;
  email?: string;
  avatar_url?: string;
}
