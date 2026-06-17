/**
 * Canonical project role literals used across the application.
 * "viewer" is the UI alias for the "member" role stored in the DB.
 */
export type ProjectRole = 'owner' | 'admin' | 'reviewer' | 'viewer';

/**
 * Possible lifecycle statuses for a project.
 * Values are title-cased to match what the API returns to the frontend.
 */
export type ProjectStatus = 'Active' | 'Completed' | 'Archived' | 'On Hold';

/**
 * Core project record as returned by the API (/api/projects and /api/projects/[id]).
 * Includes computed stat fields appended by the list endpoint.
 */
export interface Project {
  /** UUID primary key (Supabase `id` column, also aliased as `$id` in some responses) */
  id: string;
  name: string;
  client_name: string;
  /** ISO-8601 date string */
  deadline: string;
  /** Title-cased status string, e.g. "Active" */
  status: string;
  owner_id: string;
  /** ISO-8601 timestamp */
  created_at: string;
  /** ISO-8601 timestamp, present after an update */
  updated_at?: string;

  // ── Viewer-context fields (populated by the list endpoint) ─────────────────
  /** Caller's role in this project */
  role?: ProjectRole | string;
  /** Total number of collaborators (including the owner) */
  collaboratorCount?: number;
  /** Number of assets currently awaiting review */
  pendingCount?: number;
}

/**
 * Payload shape sent to POST /api/projects.
 */
export interface CreateProjectPayload {
  name: string;
  clientName: string;
  deadline: string;
  /** Defaults to "active" when omitted */
  status?: string;
}

/**
 * Payload shape sent to PATCH /api/projects/[id].
 */
export interface UpdateProjectPayload {
  name?: string;
  clientName?: string;
  deadline?: string;
  status?: string;
}
