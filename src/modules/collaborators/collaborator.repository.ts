import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

export class CollaboratorRepository {
    async getCollaboratorsByProjectId(projectId: string) {
        const supabase = await createSupabaseServerClient();

        const { data: project, error: projectErr } = await supabase
            .from("projects")
            .select("owner_id, created_at")
            .eq("id", projectId)
            .single();

        if (projectErr || !project) {
            return null;
        }

        const { data: collabs, error: collabsErr } = await supabase
            .from("project_collaborators")
            .select(`
                id,
                user_id,
                role,
                created_at,
                profiles (
                    id,
                    name,
                    email,
                    username,
                    avatar_url
                )
            `)
            .eq("project_id", projectId);

        if (collabsErr) {
            throw collabsErr;
        }

        const collaborators = (collabs || []).map((collab: any) => {
            const profile = collab.profiles || {};
            return {
                id: collab.id,
                user_id: collab.user_id,
                role: collab.role === 'member' ? 'viewer' : collab.role,
                created_at: collab.created_at,
                email: profile.email || "Unknown",
                name: profile.name || "Unknown User",
                username: profile.username || "",
                avatar_url: profile.avatar_url || ""
            };
        });

        return {
            owner_id: project.owner_id,
            collaborators,
            collabsRaw: collabs || []
        };
    }
}
