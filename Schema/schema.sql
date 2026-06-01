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

