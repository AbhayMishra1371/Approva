import { NextResponse } from "next/server";
import { getLoggedInUser, createAdminClient } from "@/lib/appwrite/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { Query, ID, Permission, Role } from "node-appwrite";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { user } = await getLoggedInUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { databases } = await createAdminClient();
        const supabase = await createSupabaseServerClient();

        // 1. Fetch owned projects from Supabase
        let ownedProjects: any[] = [];
        try {
            const { data: ownedRes, error: ownedErr } = await supabase
                .from("projects")
                .select("*")
                .eq("owner_id", user.$id);

            if (ownedErr) throw ownedErr;

            ownedProjects = (ownedRes || []).map((doc: any) => ({
                ...doc,
                id: doc.id,
                $id: doc.id,
                role: 'owner',
                status: doc.status ? (doc.status.charAt(0).toUpperCase() + doc.status.slice(1)) : "Active"
            }));
        } catch (e) {
            console.warn("Could not query owned projects directly:", e);
        }

        const ownedIds = new Set(ownedProjects.map(p => p.id));

        // 2. Fetch collaborator links safely.
        let collabProjectIds: string[] = [];
        let collabRoles: Record<string, string> = {};

        try {
            const collabsRes = await databases.listDocuments(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLABORATORS_ID!,
                [Query.equal("user_id", user.$id)]
            );

            // SECURITY: Manual secondary filter to ensure user_id matches
            const filteredCollabs = collabsRes.documents.filter((doc: any) => doc.user_id === user.$id);

            if (filteredCollabs.length !== collabsRes.documents.length) {
                console.warn(`[SECURITY ALERT] Collaborator query returned ${collabsRes.documents.length} docs, but only ${filteredCollabs.length} matched user_id ${user.$id}. LEAK PREVENTED.`);
            }

            filteredCollabs.forEach((doc: any) => {
                collabProjectIds.push(doc.project_id);
                collabRoles[doc.project_id] = doc.role;
            });
        } catch (err) {
            console.warn("Index missing for user_id on project_collaborators, falling back to manual filter.");
            try {
                // Fallback: fetch up to 5000 and filter
                const allCollabs = await databases.listDocuments(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                    process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLABORATORS_ID!,
                    [Query.limit(5000)]
                );

                allCollabs.documents
                    .filter((doc: any) => doc.user_id === user.$id)
                    .forEach((doc: any) => {
                        collabProjectIds.push(doc.project_id);
                        collabRoles[doc.project_id] = doc.role;
                    });
            } catch (fallbackErr) {
                console.error("Collaborators fallback fetch failed (Appwrite might be paused/offline):", fallbackErr);
            }
        }

        // 3. Fetch missing projects from Supabase
        const remainingIds = collabProjectIds.filter(id => !ownedIds.has(id));
        let collabProjects: any[] = [];

        if (remainingIds.length > 0) {
            try {
                const { data: collabProjRes, error: collabProjErr } = await supabase
                    .from("projects")
                    .select("*")
                    .in("id", remainingIds);

                if (collabProjErr) throw collabProjErr;

                collabProjects = (collabProjRes || []).map((doc: any) => ({
                    ...doc,
                    id: doc.id,
                    $id: doc.id,
                    role: collabRoles[doc.id] || 'viewer',
                    status: doc.status ? (doc.status.charAt(0).toUpperCase() + doc.status.slice(1)) : "Active"
                }));
            } catch (e) {
                console.warn("Could not load collaborator projects from Supabase:", e);
            }
        }

        let allProjects = [...ownedProjects, ...collabProjects];
        // 4. Sort all descending
        allProjects.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        // 5. Fetch Real-time Counts for each project
        const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
        const collabCollId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLABORATORS_ID!;

        const projectsWithStats = await Promise.all(allProjects.map(async (project) => {
            try {
                // Get collaborator count
                const collabs = await databases.listDocuments(
                    databaseId,
                    collabCollId,
                    [Query.equal("project_id", project.id), Query.limit(1)]
                );

                // Get pending asset count from Supabase
                const { count: pendingCount } = await supabase
                    .from("assets")
                    .select("*", { count: 'exact', head: true })
                    .eq("project_id", project.id)
                    .in("status", ["draft", "in_review", "changes_requested", "pending", "Pending"]);

                return {
                    ...project,
                    collaboratorCount: collabs.total,
                    pendingCount: pendingCount || 0
                };
            } catch (err) {
                console.error(`Failed to fetch stats for project ${project.id}:`, err);
                return {
                    ...project,
                    collaboratorCount: 0,
                    pendingCount: 0
                };
            }
        }));

        return NextResponse.json({ projects: projectsWithStats });
    } catch (error: any) {
        console.error("API Fetch Projects Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error", stack: error.stack }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { user } = await getLoggedInUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, clientName, deadline, status } = await request.json();

        if (!name || !clientName || !deadline) {
            return NextResponse.json({ error: "Missing required fields (name, clientName, deadline)" }, { status: 400 });
        }

        const supabase = await createSupabaseServerClient();

        let deadlineDate: string;
        try {
            deadlineDate = new Date(deadline).toISOString();
        } catch (e) {
            deadlineDate = new Date().toISOString();
        }

        // 1. Create project in Supabase
        const { data: project, error: insertError } = await supabase
            .from("projects")
            .insert({
                name,
                client_name: clientName,
                deadline: deadlineDate,
                status: status?.toLowerCase() || "active",
                owner_id: user.$id,
            })
            .select()
            .single();

        if (insertError) {
            console.error("Supabase project insert failed:", insertError);
            return NextResponse.json({ error: insertError.message }, { status: 400 });
        }

        const mappedProject = {
            ...project,
            id: project.id,
            $id: project.id,
            created_at: project.created_at,
            updated_at: project.updated_at,
            status: project.status ? (project.status.charAt(0).toUpperCase() + project.status.slice(1)) : "Active",
        };

        const { databases } = await createAdminClient();

        // 2. Create collaborator in Appwrite using Admin Client (bypasses permission checks)
        try {
            await databases.createDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLABORATORS_ID!,
                ID.unique(),
                {
                    project_id: project.id,
                    user_id: user.$id,
                    role: "owner"
                }
            );
        } catch (collabError) {
            console.error("Failed to insert owner as collaborator in Appwrite:", collabError);
        }

        // 3. Create Activity Log in Appwrite
        try {
            await databases.createDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ACTIVITY_LOG_ID || "activity_logs",
                ID.unique(),
                {
                    project_id: project.id,
                    user_id: user.$id,
                    user_email: user.email,
                    action: "created_project",
                    entity_type: "project",
                    entity_id: project.id,
                    metadata: JSON.stringify({ project_name: name })
                },
                [
                    Permission.read(Role.users()),
                    Permission.update(Role.user(user.$id)),
                    Permission.delete(Role.user(user.$id))
                ]
            );
        } catch (logError) {
            console.error("Failed to log project creation activity in Appwrite:", logError);
        }

        return NextResponse.json(mappedProject);
    } catch (error: any) {
        console.error("API Create Project Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
