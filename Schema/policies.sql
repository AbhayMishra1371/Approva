-- SQL script to configure policies for the projects table in Supabase.
-- Run this in your Supabase Dashboard SQL Editor (https://supabase.com/dashboard/project/rmlggwsszvicvpxheusn/sql/new)

-- OPTION 1: Disable Row Level Security (Recommended for easy development/testing)
-- This removes all read/write/delete restrictions from the table.
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;

-- OPTION 2: If you want to keep Row Level Security enabled, run the following instead:

-- 1. Enable RLS (if not already enabled)
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;

-- 2. Allow authenticated users to insert projects (setting themselves as owner)
CREATE POLICY "Enable insert for authenticated users" ON public.projects
    FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = owner_id);

-- 3. Allow authenticated users to view all projects 
-- (Since collaborators are stored in Appwrite, we allow general authenticated reads)
CREATE POLICY "Enable read for authenticated users" ON public.projects
    FOR SELECT 
    TO authenticated 
    USING (true);

-- 4. Allow owners to update their own projects
CREATE POLICY "Enable update for owners" ON public.projects
    FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- 5. Allow owners to delete their own projects
CREATE POLICY "Enable delete for owners" ON public.projects
    FOR DELETE 
    TO authenticated 
    USING (auth.uid() = owner_id);

/* policies for collaborators to CURD assets */
ALTER TABLE assets
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read own project assets"
ON assets
FOR SELECT
TO authenticated
USING (
    public.is_project_collaborator(project_id, auth.uid())
);

CREATE POLICY "Insert own project assets"
ON assets
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_project_collaborator(project_id, auth.uid())
);

CREATE POLICY "Update own project assets"
ON assets
FOR UPDATE
TO authenticated
USING (
    public.is_project_collaborator(project_id, auth.uid())
)
WITH CHECK (
    public.is_project_collaborator(project_id, auth.uid())
);

CREATE POLICY "Delete own project assets"
ON assets
FOR DELETE
TO authenticated
USING (
    public.is_project_collaborator(project_id, auth.uid())
);


-- Policies for Annotations, Comments, and General Comments

-- Enable RLS
ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.general_comments ENABLE ROW LEVEL SECURITY;

-- 1. Annotations Policies
CREATE POLICY "Enable read annotations for authenticated users" ON public.annotations
    FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Enable insert annotations for authenticated users" ON public.annotations
    FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update annotations for creators and project owners" ON public.annotations
    FOR UPDATE 
    TO authenticated 
    USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM assets
            JOIN projects ON projects.id = assets.project_id
            WHERE assets.id = annotations.asset_id AND projects.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM assets
            JOIN projects ON projects.id = assets.project_id
            WHERE assets.id = annotations.asset_id AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Enable delete annotations for creators and project owners" ON public.annotations
    FOR DELETE 
    TO authenticated 
    USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM assets
            JOIN projects ON projects.id = assets.project_id
            WHERE assets.id = annotations.asset_id AND projects.owner_id = auth.uid()
        )
    );

-- 2. Comments Policies (Annotation thread comments)
CREATE POLICY "Enable read comments for authenticated users" ON public.comments
    FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Enable insert comments for authenticated users" ON public.comments
    FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete comments for authors and project owners" ON public.comments
    FOR DELETE 
    TO authenticated 
    USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM annotations
            JOIN assets ON assets.id = annotations.asset_id
            JOIN projects ON projects.id = assets.project_id
            WHERE annotations.id = comments.annotation_id AND projects.owner_id = auth.uid()
        )
    );

-- 3. General Comments Policies
CREATE POLICY "Enable read general_comments for authenticated users" ON public.general_comments
    FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Enable insert general_comments for authenticated users" ON public.general_comments
    FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete general_comments for authors and project owners" ON public.general_comments
    FOR DELETE 
    TO authenticated 
    USING (
        auth.uid() = user_id OR 
        EXISTS (
            SELECT 1 FROM assets
            JOIN projects ON projects.id = assets.project_id
            WHERE assets.id = general_comments.asset_id AND projects.owner_id = auth.uid()
        )
    );


-- Policies for Project Invites
ALTER TABLE public.project_invites DISABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read project_invites for all users" ON public.project_invites
    FOR SELECT 
    USING (true);

CREATE POLICY "Enable insert project_invites for authenticated users" ON public.project_invites
    FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = invited_by);

CREATE POLICY "Enable update project_invites for authenticated users" ON public.project_invites
    FOR UPDATE 
    TO authenticated 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete project_invites for inviters" ON public.project_invites
    FOR DELETE 
    TO authenticated 
    USING (auth.uid() = invited_by);


-- Helper function to check project membership without causing infinite recursion in SELECT policy.
-- Defined with SECURITY DEFINER to bypass Row-Level Security checks on project_collaborators.
CREATE OR REPLACE FUNCTION public.is_project_collaborator(proj_id uuid, usr_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.projects WHERE id = proj_id AND owner_id = usr_id
        UNION
        SELECT 1 FROM public.project_collaborators WHERE project_id = proj_id AND user_id = usr_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/* policy for collaborator table*/
ALTER TABLE project_collaborators
DISABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can read collaborators"
ON project_collaborators
FOR SELECT
TO authenticated
USING (
    public.is_project_collaborator(project_id, auth.uid())
);

CREATE POLICY "Owner can add collaborators"
ON project_collaborators
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM projects p
        WHERE p.id = project_collaborators.project_id
        AND p.owner_id = auth.uid()
    )
);

CREATE POLICY "Owner can update collaborators"
ON project_collaborators
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM projects p
        WHERE p.id = project_collaborators.project_id
        AND p.owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM projects p
        WHERE p.id = project_collaborators.project_id
        AND p.owner_id = auth.uid()
    )
);

CREATE POLICY "Owner can remove collaborators"
ON project_collaborators
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM projects p
        WHERE p.id = project_collaborators.project_id
        AND p.owner_id = auth.uid()
    )
);

CREATE POLICY "Invited users can insert themselves"
ON project_collaborators
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM public.project_invites pi
        WHERE pi.project_id = project_collaborators.project_id
          AND pi.email = (auth.jwt() ->> 'email')
          AND pi.status = 'pending'
    )
);

-- Policies for Activity Logs
ALTER TABLE public.activity_logs DISABLE ROW LEVEL SECURITY;

CREATE POLICY "Collaborators can read activity logs"
ON public.activity_logs
FOR SELECT
TO authenticated
USING (
    public.is_project_collaborator(project_id, auth.uid())
);

CREATE POLICY "Collaborators can insert activity logs"
ON public.activity_logs
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_project_collaborator(project_id, auth.uid())
);