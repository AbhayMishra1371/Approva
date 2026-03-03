-- ================================
-- EXTENSIONS
-- ================================
create extension if not exists "uuid-ossp";

-- ================================
-- PROJECTS TABLE
-- ================================
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  client_name text,
  deadline date,
  status text default 'active',
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.projects enable row level security;

-- Drop old policies if exist
drop policy if exists "Users manage their own projects" on public.projects;
drop policy if exists "Users can view accessible projects" on public.projects;
drop policy if exists "Users can create projects" on public.projects;
drop policy if exists "Only owner can update project" on public.projects;
drop policy if exists "Only owner can delete project" on public.projects;

-- SELECT (Owner + Collaborators)
create policy "Users can view accessible projects"
on public.projects
for select
using (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.project_collaborators pc
    WHERE pc.project_id = projects.id
    AND pc.user_id = auth.uid()
  )
);

-- INSERT (Only Owner Creates)
create policy "Users can create projects"
on public.projects
for insert
with check (owner_id = auth.uid());

-- UPDATE (Only Owner)
create policy "Only owner can update project"
on public.projects
for update
using (owner_id = auth.uid());

-- DELETE (Only Owner)
create policy "Only owner can delete project"
on public.projects
for delete
using (owner_id = auth.uid());


-- ================================
-- PROJECT_COLLABORATORS TABLE
-- ================================
create table if not exists public.project_collaborators (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','reviewer','viewer')),
  created_at timestamptz default now(),
  unique(project_id, user_id)
);

alter table public.project_collaborators enable row level security;

drop policy if exists "Users can view collaborators of their projects" on public.project_collaborators;
drop policy if exists "Users can insert their own collaboration records" on public.project_collaborators;
drop policy if exists "Owners and admins can add collaborators" on public.project_collaborators;

-- SELECT: Only allow users to see their own record to prevent infinite recursion loop with projects!
create policy "Users can view collaborators of their projects"
on public.project_collaborators
for select
using (
  user_id = auth.uid()
);

-- INSERT (Project Creator assigns themselves)
CREATE POLICY "Users can insert their own collaboration records"
ON public.project_collaborators
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- INSERT (Owner/Admin can add collaborators)
create policy "Owners and admins can add collaborators"
on public.project_collaborators
for insert
with check (
  EXISTS (
    SELECT 1 FROM public.project_collaborators pc
    WHERE pc.project_id = project_collaborators.project_id
    AND pc.user_id = auth.uid()
    AND pc.role IN ('owner','admin')
  )
);

-- ================================
-- PROJECT_INVITES TABLE
-- ================================
create table if not exists public.project_invites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin','reviewer','viewer')),
  invited_at timestamptz default now(),
  unique(project_id, email)
);

alter table public.project_invites enable row level security;

drop policy if exists "Owners and admins can insert invites" on public.project_invites;
drop policy if exists "Users can view their own invites" on public.project_invites;
drop policy if exists "Users can delete their own invites" on public.project_invites;

-- Owner/Admin can create invite
create policy "Owners and admins can insert invites"
on public.project_invites
for insert
with check (
  EXISTS (
    SELECT 1 FROM public.project_collaborators pc
    WHERE pc.project_id = project_invites.project_id
    AND pc.user_id = auth.uid()
    AND pc.role IN ('owner','admin')
  )
);

-- User can see their own invites OR Owners/Admins can see project invites
DROP POLICY IF EXISTS "Users can view invites" ON public.project_invites;
create policy "Users can view invites"
on public.project_invites
for select
using (
  email = (auth.jwt() ->> 'email')
  OR EXISTS (
    SELECT 1 FROM public.project_collaborators pc
    WHERE pc.project_id = project_invites.project_id
    AND pc.user_id = auth.uid()
    AND pc.role IN ('owner','admin')
  )
);

-- User can delete their own invite (accept/decline)
create policy "Users can delete their own invites"
on public.project_invites
for delete
using (
  email = (auth.jwt() ->> 'email')
);

-- ================================
-- FUNCTIONS
-- ================================
-- This securely fetches collaborators with their emails from auth.users
CREATE OR REPLACE FUNCTION get_project_collaborators(p_id uuid)
RETURNS TABLE (
    id uuid,
    project_id uuid,
    user_id uuid,
    role text,
    created_at timestamptz,
    email text
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Security check: only allow project collaborators to run this
    IF NOT EXISTS (
        SELECT 1 FROM public.project_collaborators pc 
        WHERE pc.project_id = p_id AND pc.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    RETURN QUERY
    SELECT 
        pc.id,
        pc.project_id,
        pc.user_id,
        pc.role,
        pc.created_at,
        au.email::text
    FROM public.project_collaborators pc
    JOIN auth.users au ON pc.user_id = au.id
    WHERE pc.project_id = p_id;
END;
$$;
