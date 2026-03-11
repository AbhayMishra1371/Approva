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
                    Query.equal("owner_id", user.$id)
                ]
            );
            ownedProjects = ownedRes.documents.map((doc: any) => ({ ...doc, id: doc.$id }));
        } catch (e) {
            console.warn("Could not query owned projects:", e);
        }

        const ownedIds = new Set(ownedProjects.map(p => p.id));

        // 2. Fetch collaborator project IDs
        let collabProjectIds: string[] = [];
        try {
            const collabsRes = await databases.listDocuments(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLABORATORS_ID!,
                [Query.equal("user_id", user.$id)]
            );
            collabsRes.documents.forEach((doc: any) => {
                collabProjectIds.push(doc.project_id);
            });
        } catch (err) {
            // Fallback
            const allCollabs = await databases.listDocuments(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLABORATORS_ID!,
                [Query.limit(5000)]
            );
            allCollabs.documents
                .filter((doc: any) => doc.user_id === user.$id)
                .forEach((doc: any) => {
                    collabProjectIds.push(doc.project_id);
                });
        }

        // 3. Combine project IDs
        const allProjectIds = Array.from(new Set([...Array.from(ownedIds), ...collabProjectIds]));

        if (allProjectIds.length === 0) {
            return NextResponse.json({ assets: [] });
        }

        // Fetch project names mapping
        let projectNamesMap: Record<string, string> = {};
        for (const proj of ownedProjects) {
            projectNamesMap[proj.id] = proj.name;
        }

        // Fetch names for collab projects not owned
        const remainingIds = collabProjectIds.filter(id => !ownedIds.has(id));
        if (remainingIds.length > 0) {
            const projectPromises = remainingIds.map(id =>
                databases.getDocument(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                    process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_PROJECTS_ID!,
                    id
                ).catch(() => null)
            );
            const results = await Promise.all(projectPromises);
            results.filter(doc => doc !== null).forEach((doc: any) => {
                projectNamesMap[doc.$id] = doc.name;
            });
        }

        // 4. Fetch assets for all these projects
        // We might need to split queries if there are more than 100 projects, but normally it's fine.
        let allAssets: any[] = [];
        const chunkSize = 50;
        for (let i = 0; i < allProjectIds.length; i += chunkSize) {
            const chunk = allProjectIds.slice(i, i + chunkSize);
            const assetsRes = await databases.listDocuments(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ASSETS_ID!,
                [
                    Query.equal("project_id", chunk),
                    Query.orderDesc("$createdAt"),
                    Query.limit(100)
                ]
            );
            allAssets.push(...assetsRes.documents);
        }

        // Add project name to each asset
        const formattedAssets = allAssets.map((doc: any) => ({
            ...doc,
            id: doc.$id,
            project_name: projectNamesMap[doc.project_id] || "Unknown Project"
        }));

        // Sort globally just in case chunks messed up the order
        formattedAssets.sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime());

        return NextResponse.json({ assets: formattedAssets });
    } catch (error: any) {
        console.error("API Fetch Assets Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
