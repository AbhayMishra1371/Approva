import { NextResponse } from "next/server";
import { getLoggedInUser, createAdminClient } from "@/lib/appwrite/server";
import { Query } from "node-appwrite";

export const dynamic = "force-dynamic";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { user } = await getLoggedInUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: projectId } = await params;
        console.log(`[DEBUG] Starting cascade deletion for project: ${projectId}`);

        const { databases, storage } = await createAdminClient();

        // 1. Check if user is the owner
        const collabs = await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLABORATORS_ID!,
            [
                Query.equal("project_id", projectId),
                Query.equal("user_id", user.$id),
                Query.equal("role", "owner")
            ]
        );

        if (collabs.total === 0) {
            return NextResponse.json({ error: "Forbidden: Only owner can delete project" }, { status: 403 });
        }

        const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

        // Fallback-friendly Collection IDs
        const COLLECTIONS = {
            comments: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COMMENTS_ID || "comments",
            general_comments: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_GENERAL_COMMENTS_ID || "general_comments",
            annotations: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ANNOTATIONS_ID || "annotations",
            invites: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_INVITES_ID || "invites",
            collaborators: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLABORATORS_ID || "collaborators",
            assets: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ASSETS_ID || "assets",
            folders: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_FOLDERS_ID || "folders",
            activity: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ACTIVITY_LOG_ID || "activity_logs",
            asset_versions: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ASSET_VERSIONS_ID || "asset_versions",
            workflows: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_WORKFLOWS_ID || "workflows",
            approvals: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_APPROVALS_ID || "approvals",
        };

        // Helper to delete all documents in a collection matching a query
        const deleteByQuery = async (collectionId: string, queries: any[], label: string) => {
            try {
                let hasMore = true;
                let deletedCount = 0;
                while (hasMore) {
                    const response = await databases.listDocuments(databaseId, collectionId, [...queries, Query.limit(100)]);
                    if (response.documents.length === 0) {
                        hasMore = false;
                        break;
                    }
                    for (const doc of response.documents) {
                        try {
                            await databases.deleteDocument(databaseId, collectionId, doc.$id);
                            deletedCount++;
                        } catch (err) {
                            console.error(`[CASCADE] Failed to delete ${label} document ${doc.$id}:`, err);
                        }
                    }
                    if (response.documents.length < 100) hasMore = false;
                }
                if (deletedCount > 0) {
                    console.log(`[CASCADE] Deleted ${deletedCount} documents from ${label} (${collectionId})`);
                }
            } catch (err) {
                console.warn(`[CASCADE] Error in ${label} deletion:`, err);
            }
        };

        // 1. Fetch all assets to handle their specific dependencies (annotations, files)
        // We fetch in batches to avoid hitting Appwrite's 2000 document limit for listDocuments
        let allAssets: any[] = [];
        let offset = 0;
        const limit = 100;
        let hasMoreAssetsToFetch = true;

        while (hasMoreAssetsToFetch) {
            const assetResponse = await databases.listDocuments(
                databaseId,
                COLLECTIONS.assets,
                [Query.equal("project_id", projectId), Query.limit(limit), Query.offset(offset)]
            );
            allAssets = allAssets.concat(assetResponse.documents);
            if (assetResponse.documents.length < limit) {
                hasMoreAssetsToFetch = false;
            } else {
                offset += limit;
            }
        }
        console.log(`[CASCADE] Found ${allAssets.length} assets for project ${projectId}`);

        for (const asset of allAssets) {
            // Delete asset_versions linked to this asset
            await deleteByQuery(COLLECTIONS.asset_versions, [Query.equal("asset_id", asset.$id)], `asset_versions for asset ${asset.$id}`);

            // Delete annotations linked to this asset
            await deleteByQuery(COLLECTIONS.annotations, [Query.equal("asset_id", asset.$id)], `annotations for asset ${asset.$id}`);
            
            // Delete general comments linked to this asset
            await deleteByQuery(COLLECTIONS.general_comments, [Query.equal("asset_id", asset.$id)], `gen_comments for asset ${asset.$id}`);

            // Delete comments linked to this asset
            await deleteByQuery(COLLECTIONS.comments, [Query.equal("asset_id", asset.$id)], `comments for asset ${asset.$id}`);

            // Delete storage file
            if (asset.file_path) {
                try {
                    await storage.deleteFile(
                        process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ASSETS_ID!,
                        asset.file_path
                    );
                    console.log(`[CASCADE] Deleted storage file ${asset.file_path}`);
                } catch (err) {
                    console.warn(`[CASCADE] Storage file delete failed for ${asset.file_path}:`, err);
                }
            }
            
            // Delete the asset document
            try {
                await databases.deleteDocument(databaseId, COLLECTIONS.assets, asset.$id);
                console.log(`[CASCADE] Deleted asset document ${asset.$id}`);
            } catch (err) {
                console.error(`[CASCADE] Failed to delete asset doc ${asset.$id}:`, err);
            }
        }

        // 2. Global project-linked items (using project_id)
        await deleteByQuery(COLLECTIONS.invites, [Query.equal("project_id", projectId)], "invites");
        await deleteByQuery(COLLECTIONS.collaborators, [Query.equal("project_id", projectId)], "collaborators");
        await deleteByQuery(COLLECTIONS.activity, [Query.equal("project_id", projectId)], "activity_logs");
        await deleteByQuery(COLLECTIONS.folders, [Query.equal("project_id", projectId)], "folders");
        await deleteByQuery(COLLECTIONS.workflows, [Query.equal("project_id", projectId)], "workflows");
        await deleteByQuery(COLLECTIONS.approvals, [Query.equal("project_id", projectId)], "approvals");


        // 3. The project document itself
        await databases.deleteDocument(
            databaseId,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_PROJECTS_ID!,
            projectId
        );
        console.log(`[CASCADE] Deleted project document ${projectId}`);


        return NextResponse.json({ message: "Project and all related data deleted successfully" }, { status: 200 });

    } catch (error: any) {
        console.error("Cascade Project Deletion Error:", error);
        if (error.code === 404) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
