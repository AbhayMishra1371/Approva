/**
 * All valid lifecycle statuses for an asset.
 * Values match the `status` column in the Supabase `assets` table.
 */
export type AssetStatus =
  | 'draft'
  | 'in_review'
  | 'changes_requested'
  | 'approved'
  | 'rejected'
  | 'pending'
  | 'Pending';

/**
 * Core asset record as returned by the API
 * (GET /api/projects/[id]/assets and related endpoints).
 */
export interface Asset {
  /** UUID primary key */
  id: string;
  file_name: string;
  file_type: string;
  /** File size in bytes */
  size: number;
  /** ISO-8601 timestamp */
  created_at: string;
  /** Semantic version string, e.g. "v1" or "1.2" */
  version: string;
  status: AssetStatus | string;
  /** Public URL to access / preview the file */
  url: string;
  /** Storage path used internally (Supabase Storage) */
  file_path: string;
  /** FK to the project this asset belongs to */
  project_id?: string;
  /** Groups multiple versions of the same logical asset */
  asset_group_id?: string;
  /** True when this is the most-recent version in its group */
  is_latest?: boolean;
  /** User ID of the person who uploaded the asset */
  uploaded_by?: string;
}

/**
 * Payload shape accepted by POST /api/projects/[id]/assets.
 */
export interface CreateAssetPayload {
  file_name: string;
  file_path: string;
  file_type: string;
  size: number;
  url?: string;
  version?: string;
  asset_group_id?: string;
}

/**
 * Payload sent to POST /api/projects/[id]/assets/[assetId]/status.
 */
export interface UpdateAssetStatusPayload {
  status: AssetStatus;
  /** Optional reviewer comment accompanying the status change */
  comment?: string;
}

/**
 * Internal data shape used by the asset module services.
 * Mirrors `AssetData` in `modules/assets/asset.types.ts`.
 */
export interface AssetData {
  fileName: string;
  filePath: string;
  fileType: string;
  size: number;
  url?: string;
}
