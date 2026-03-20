import { NextResponse } from "next/server";
import { getLoggedInUser, createAdminClient } from "@/lib/appwrite/server";
import { Query } from "node-appwrite";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { user } = await getLoggedInUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { databases } = await createAdminClient();



        // 1. Fetch owned projects
        let ownedProjects: any[] = [];
        try {
            const ownedRes = await databases.listDocuments(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_PROJECTS_ID!,
                [
                    Query.equal("owner_id", user.$id),
                    Query.orderDesc("$createdAt")
                ]
            );
            
            // SECURITY: Manual secondary filter to double check owner_id matches
            ownedProjects = ownedRes.documents
                .filter((doc: any) => doc.owner_id === user.$id)
                .map((doc: any) => ({ ...doc, id: doc.$id, role: 'owner' }));
            

        } catch (e) {
            console.warn("Could not query owned projects directly:", e);
        }

        const ownedIds = new Set(ownedProjects.map(p => p.id));

        // 2. Fetch collaborator links safely. Because 'user_id' might not be indexed in 'project_collaborators',
        // we fetch all collaborators and filter in memory if the direct query fails.
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

        }

        // 3. Fetch missing projects
        const remainingIds = collabProjectIds.filter(id => !ownedIds.has(id));
        let collabProjects: any[] = [];

        if (remainingIds.length > 0) {
            const projectPromises = remainingIds.map(id =>
                databases.getDocument(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                    process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_PROJECTS_ID!,
                    id
                ).catch((e) => {
                    console.warn(`Could not load project document ${id}`, e);
                    return null;
                })
            );
            const results = await Promise.all(projectPromises);
            collabProjects = results.filter(doc => doc !== null).map((doc: any) => ({ ...doc, id: doc.$id, role: collabRoles[doc.$id] || 'viewer' }));
        }

        let allProjects = [...ownedProjects, ...collabProjects];
        // 4. Sort all descending
        allProjects.sort((a, b) => new Date(b.created_at || b.$createdAt).getTime() - new Date(a.created_at || a.$createdAt).getTime());

        // 5. Fetch Real-time Counts for each project
        const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
        const collabCollId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLABORATORS_ID!;
        const assetsCollId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ASSETS_ID!;

        const projectsWithStats = await Promise.all(allProjects.map(async (project) => {
            try {
                // Get collaborator count
                const collabs = await databases.listDocuments(
                    databaseId,
                    collabCollId,
                    [Query.equal("project_id", project.id), Query.limit(1)]
                );
                
                // Get pending asset count
                const pending = await databases.listDocuments(
                    databaseId,
                    assetsCollId,
                    [
                        Query.equal("project_id", project.id),
                        Query.equal("status", ["draft", "in_review", "changes_requested", "pending", "Pending"]),
                        Query.limit(1)
                    ]
                );
                
                return {
                    ...project,
                    collaboratorCount: collabs.total,
                    pendingCount: pending.total
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
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
