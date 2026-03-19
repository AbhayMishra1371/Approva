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

        // Helper to delete all documents in a collection matching project_id
        const deleteCascade = async (collectionId: string | undefined, label: string) => {
            if (!collectionId) {
                console.log(`[CASCADE] Skipping ${label} - Collection ID not defined`);
                return;
            }

            try {
                let hasMore = true;
                let deletedCount = 0;

                while (hasMore) {
                    const response = await databases.listDocuments(
                        databaseId,
                        collectionId,
                        [
                            Query.equal("project_id", projectId),
                            Query.limit(100)
                        ]
                    );

                    console.log(`[CASCADE] Found ${response.documents.length} documents in ${label}`);

                    if (response.documents.length === 0) {
                        hasMore = false;
                        break;
                    }

                    for (const doc of response.documents) {
                        // For assets, we might need special handling if we want to delete storage files too
                        // But we'll handle that separately for assets
                        try {
                            await databases.deleteDocument(databaseId, collectionId, doc.$id);
                            deletedCount++;
                        } catch (err) {
                            console.error(`[CASCADE] Failed to delete ${label} document ${doc.$id}:`, err);
                        }
                    }

                    // If we got fewer than 100, we're likely done, but pagination loop ensures it
                    if (response.documents.length < 100) {
                        hasMore = false;
                    }
                }
                console.log(`[CASCADE] Deleted ${deletedCount} documents from ${label} (${collectionId})`);
            } catch (error) {
                console.error(`[CASCADE] Error deleting from ${label}:`, error);
            }
        };

        // Order of deletion:
        // 1. comments
        await deleteCascade(process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COMMENTS_ID, "comments");
        await deleteCascade(process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_GENERAL_COMMENTS_ID, "general_comments");

        // 2. annotations
        await deleteCascade(process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ANNOTATIONS_ID, "annotations");

        // 3. project_invites
        await deleteCascade(process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_INVITES_ID, "invites");

        // 4. project_collaborators (all except the owner record? or all including owner then project itself?)
        // Rules say delete all related docs, then project doc.
        await deleteCascade(process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLABORATORS_ID, "collaborators");

        // 5. asset_versions
        await deleteCascade(process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ASSET_VERSIONS_ID, "asset_versions");

        // 6. assets (with storage files)
        const assetsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ASSETS_ID;
        if (assetsCollectionId) {
            try {
                let hasMoreAssets = true;
                while (hasMoreAssets) {
                    const assetRes = await databases.listDocuments(
                        databaseId,
                        assetsCollectionId,
                        [Query.equal("project_id", projectId), Query.limit(100)]
                    );

                    if (assetRes.documents.length === 0) {
                        hasMoreAssets = false;
                        break;
                    }

                    for (const asset of assetRes.documents) {
                        // Delete file from storage
                        if (asset.file_path) {
                            try {
                                await storage.deleteFile(
                                    process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ASSETS_ID!,
                                    asset.file_path
                                );
                            } catch (err) {
                                console.warn(`[CASCADE] Failed to delete storage file ${asset.file_path}:`, err);
                            }
                        }
                        // Delete asset document
                        try {
                            await databases.deleteDocument(databaseId, assetsCollectionId, asset.$id);
                        } catch (err) {
                            console.error(`[CASCADE] Failed to delete asset document ${asset.$id}:`, err);
                        }
                    }

                    if (assetRes.documents.length < 100) hasMoreAssets = false;
                }
            } catch (err) {
                console.error("[CASCADE] Error during assets/storage deletion:", err);
            }
        }

        // 7. folders
        await deleteCascade(process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_FOLDERS_ID, "folders");

        // 8. activity_logs
        await deleteCascade(process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ACTIVITY_LOG_ID, "activity_logs");

        // 9. workflows
        await deleteCascade(process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_WORKFLOWS_ID, "workflows");

        // 10. approvals
        await deleteCascade(process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_APPROVALS_ID, "approvals");

        // 11. The project document itself
        await databases.deleteDocument(
            databaseId,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_PROJECTS_ID!,
            projectId
        );

        return NextResponse.json({ message: "Project and all related documents deleted successfully" }, { status: 200 });

    } catch (error: any) {
        console.error("Cascade Project Deletion Error:", error);
        if (error.code === 404) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
