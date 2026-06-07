import { NextResponse } from "next/server";
import { getLoggedInUser, createClient as createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { user } = await getLoggedInUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = await createSupabaseServerClient();

        // 1. Fetch projects the user has access to (owned + collaborated) from Supabase
        const url = new URL(request.url);
        const filterUserId = url.searchParams.get("userId");

        let ownedIds: string[] = [];
        try {
            const { data: ownedProjects } = await supabase
                .from("projects")
                .select("id")
                .eq("owner_id", user.$id);
            ownedIds = (ownedProjects || []).map(p => p.id);
        } catch (e) {
            console.warn("Could not query owned projects from Supabase for activity:", e);
        }

        let collabIds: string[] = [];
        try {
            const { data: collabs, error: collabsErr } = await supabase
                .from("project_collaborators")
                .select("project_id")
                .eq("user_id", user.$id);
            if (collabsErr) throw collabsErr;
            collabIds = (collabs || []).map((c: any) => c.project_id);
        } catch (e) {
            console.warn("Could not query collaborator projects from Supabase for activity:", e);
        }

        const projectIds = Array.from(new Set([...ownedIds, ...collabIds]));
        if (projectIds.length === 0) {
            return NextResponse.json({ documents: [] }, { status: 200 });
        }

        // 2. Fetch project names for these IDs from Supabase
        const { data: projectsRes, error: projErr } = await supabase
            .from("projects")
            .select("id, name")
            .in("id", projectIds);

        if (projErr) throw projErr;

        const projectMap = (projectsRes || []).reduce((acc: any, p: any) => {
            acc[p.id] = p.name;
            return acc;
        }, {});

        // 3. Fetch activity logs for these projects (with optional user filter) from Supabase
        let queryBuilder = supabase
            .from("activity_logs")
            .select(`
                *,
                profiles (name, email)
            `)
            .in("project_id", projectIds)
            .order("created_at", { ascending: false })
            .limit(100);

        if (filterUserId) {
            queryBuilder = queryBuilder.eq("user_id", filterUserId);
        }

        const { data: logsRes, error: logsErr } = await queryBuilder;
        if (logsErr) throw logsErr;

        // 4. Attach project names and user names to logs, formatting for frontend compatibility
        const enhancedLogs = (logsRes || []).map((log: any) => {
            const profile = log.profiles || {};
            return {
                ...log,
                $id: log.id,
                $createdAt: log.created_at,
                project_name: projectMap[log.project_id] || "Unknown Project",
                user_name: profile.name || log.user_email || "Unknown User"
            };
        });

        return NextResponse.json({ documents: enhancedLogs }, { status: 200 });

    } catch (error: any) {
        console.error("Global Activity API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
