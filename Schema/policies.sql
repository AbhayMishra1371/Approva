-- SQL script to configure policies for the projects table in Supabase.
-- Run this in your Supabase Dashboard SQL Editor (https://supabase.com/dashboard/project/rmlggwsszvicvpxheusn/sql/new)

-- OPTION 1: Disable Row Level Security (Recommended for easy development/testing)
-- This removes all read/write/delete restrictions from the table.
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;

-- OPTION 2: If you want to keep Row Level Security enabled, run the following instead:
/*
-- 1. Enable RLS (if not already enabled)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

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
*/
