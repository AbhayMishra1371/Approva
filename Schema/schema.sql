/* For profile collection */

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    name text NOT NULL,

    email text UNIQUE NOT NULL,

    username text UNIQUE NOT NULL,

    avatar_url text,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()

);

/* For Porject table*/

create table projects (
    id uuid primary key default gen_random_uuid(),

    deadline timestamptz not null,

    owner_id uuid not null
        references profiles(id)
        on delete cascade,

    name varchar(100) not null,

    status varchar(32)
check (
    status in (
        'active',
        'completed',
        'archived'
    )
),

    client_name varchar(100) not null,

    created_at timestamptz default now(),

    updated_at timestamptz default now()
);

/* For Assets table */

CREATE TABLE assets (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL
        REFERENCES projects(id)
        ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    version TEXT NOT NULL,
    status TEXT NOT NULL,
    url TEXT NOT NULL,
    is_latest BOOLEAN DEFAULT TRUE,
    asset_group_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

/* For Annotations table */
CREATE TABLE annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    name TEXT,
    x NUMERIC NOT NULL,
    y NUMERIC NOT NULL,
    width NUMERIC NOT NULL,
    height NUMERIC NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'resolved')) DEFAULT 'pending',
    color TEXT NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

/* For Annotation Thread Comments table */
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    annotation_id UUID NOT NULL REFERENCES annotations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_email TEXT NOT NULL,
    text TEXT NOT NULL,
    mentions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

/* For General Comments table */
CREATE TABLE general_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_email TEXT NOT NULL,
    text TEXT NOT NULL,
    mentions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

/* For projects_innvite */
CREATE TABLE project_invites (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL
        REFERENCES projects(id)
        ON DELETE CASCADE,

    email TEXT NOT NULL,

    role TEXT NOT NULL,

    token TEXT NOT NULL UNIQUE,

    status TEXT NOT NULL
        DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'accepted',
                'rejected',
                'expired'
            )
        ),

    invited_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),
    invited_by UUID NOT NULL
    REFERENCES profiles(id)
    ON DELETE CASCADE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()
);

/* for collaborators*/
CREATE TABLE project_collaborators (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL
        REFERENCES projects(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES profiles(id)
        ON DELETE CASCADE,

    role TEXT NOT NULL
        CHECK (
            role IN (
                'admin',
                'member',
                'reviewer'
            )
        ),

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(project_id, user_id)
);

/* for activity logs */
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL
        REFERENCES projects(id)
        ON DELETE CASCADE,
    user_id UUID
        REFERENCES profiles(id)
        ON DELETE SET NULL,
    user_email TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


