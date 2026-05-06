export interface Project {
    id: string;
    name: string;
    client_name: string;
    deadline: string;
    status: string;
    owner_id: string;
    created_at: string;
    role?: 'owner' | 'admin' | 'reviewer' | 'viewer' | string;
    collaboratorCount?: number;
    pendingCount?: number;
}

export interface Asset {
    id: string;
    file_name: string;
    file_type: string;
    size: number;
    created_at: string;
    version: string;
    status: string;
    url: string;
    file_path: string;
    asset_group_id?: string;
    is_latest?: boolean;
}

export interface Collaborator {
    id: string;
    name: string;
    email: string;
    role: string;
    created_at: string;
}

export interface Invite {
    id: string;
    email: string;
    role: string;
    invited_at: string;
}

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
}
