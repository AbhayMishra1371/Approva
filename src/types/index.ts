/**
 * Centralized type barrel.
 *
 * Import from here rather than from individual files wherever possible:
 *
 *   import type { Project, Asset, Comment, Notification, Collaborator } from '@/types';
 *
 * The individual domain files are the source of truth; this file only
 * re-exports them for convenience.
 */

export type {
  ProjectRole,
  ProjectStatus,
  Project,
  CreateProjectPayload,
  UpdateProjectPayload,
} from './project';

export type {
  AssetStatus,
  Asset,
  CreateAssetPayload,
  UpdateAssetStatusPayload,
  AssetData,
} from './asset';

export type {
  Comment,
  CommentAuthorProfile,
  Annotation,
  CreateAnnotationPayload,
  AddCommentPayload,
} from './comment';

export type {
  NotificationType,
  Notification,
  CreateNotificationPayload,
  MarkNotificationReadPayload,
} from './notification';

export type {
  Collaborator,
  ProjectInvite,
  CollaboratorsResponse,
  InviteCollaboratorPayload,
  UpdateCollaboratorRolePayload,
  MentionableCollaborator,
} from './collaborator';

// ── Legacy types kept for backward compatibility ───────────────────────────
// These were originally defined inline in this file.
// They can be gradually replaced by the domain-specific equivalents above.

/** @deprecated Use {@link Collaborator} from './collaborator' instead */
export interface LegacyCollaborator {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

/** @deprecated Use {@link ProjectInvite} from './collaborator' instead */
export interface Invite {
  id: string;
  email: string;
  role: string;
  invited_at: string;
}

/** Activity log record returned by GET /api/activity */
export interface Activity {
  $id: string;
  $createdAt: string;
  user_id: string;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: string;
  project_name?: string;
  description?: string;
  user_name?: string;
}
