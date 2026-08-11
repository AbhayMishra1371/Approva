-- Performance Optimization Indexes for Approva DB (Supabase Postgres)
-- Addresses slow (~9 sec) RLS and SELECT queries on Comments, Annotations, Collaborators, and Notifications

-- 1. General Comments Index
CREATE INDEX IF NOT EXISTS idx_general_comments_asset_id ON general_comments(asset_id);
CREATE INDEX IF NOT EXISTS idx_general_comments_created_at ON general_comments(created_at);

-- 2. Annotations Indexes
CREATE INDEX IF NOT EXISTS idx_annotations_asset_id ON annotations(asset_id);
CREATE INDEX IF NOT EXISTS idx_annotations_asset_status ON annotations(asset_id, status);

-- 3. Annotation Thread Comments Index
CREATE INDEX IF NOT EXISTS idx_comments_annotation_id ON comments(annotation_id);

-- 4. Assets Indexes
CREATE INDEX IF NOT EXISTS idx_assets_project_id ON assets(project_id);

-- 5. Collaborators Indexes
CREATE INDEX IF NOT EXISTS idx_collaborators_project_id ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user_id ON project_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_proj_user ON project_collaborators(project_id, user_id);

-- 6. Notifications Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
