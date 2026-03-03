import { NextResponse } from "next/server";
import { getLoggedInUser } from "@/lib/appwrite/server";
import { ID, Query } from "node-appwrite";

export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const projectId = resolvedParams.id;

        const { user, databases } = await getLoggedInUser();

        if (!user || !databases) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify user has access to this project
        const collabs = await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLABORATORS_ID!,
            [
                Query.equal("project_id", projectId),
                Query.equal("user_id", user.$id),
                Query.limit(1)
            ]
        );

        if (collabs.total === 0) {
            return NextResponse.json({ error: "Unauthorized access to this project" }, { status: 403 });
        }

        const assetsResponse = await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ASSETS_ID!,
            [
                Query.equal("project_id", projectId),
                Query.orderDesc("$createdAt")
            ]
        );

        // Map Appwrite documents to replace $id with id for frontend
        const assets = assetsResponse.documents.map((doc: any) => ({ ...doc, id: doc.$id }));

        return NextResponse.json(assets);
    } catch (error: any) {
        console.error("API Error [Get Assets]:", error?.message || error);
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}

// Ensure the POST method we created is retained in this file
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const projectId = resolvedParams.id;

        const { user, databases } = await getLoggedInUser();

        if (!user || !databases) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify user has access to this project (owner, admin, or reviewer)
        const collabs = await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLABORATORS_ID!,
            [
                Query.equal("project_id", projectId),
                Query.equal("user_id", user.$id),
                Query.limit(1)
            ]
        );

        if (collabs.total === 0) {
            console.error("Authorization error: User is not a collaborator");
            return NextResponse.json({ error: "Unauthorized access to this project" }, { status: 403 });
        }

        const colData = collabs.documents[0];

        // Only viewers are blocked from uploading
        if (colData.role === 'viewer') {
            return NextResponse.json({ error: "Insufficient permissions to upload assets" }, { status: 403 });
        }

        const json = await request.json();
        const { fileName, filePath, fileType, size, url } = json;

        if (!fileName || !filePath) {
            return NextResponse.json({ error: "Missing required file information" }, { status: 400 });
        }

        const asset = await databases.createDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ASSETS_ID!,
            ID.unique(),
            {
                project_id: projectId,
                file_name: fileName,
                file_path: filePath,
                file_type: fileType || 'unknown',
                size: size || 0,
                status: "draft",
                version: "v1"
                // `url` might be needed here later for storage if public
            }
        );

        return NextResponse.json({ ...asset, id: asset.$id });
    } catch (error: any) {
        console.error("API Error [Create Asset]:", error?.message || error);
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const projectId = resolvedParams.id;

        const { user, databases, storage } = await getLoggedInUser();

        if (!user || !databases || !storage) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(request.url);
        const assetId = url.searchParams.get("assetId");

        if (!assetId) {
            return NextResponse.json({ error: "Asset ID is required" }, { status: 400 });
        }

        // Verify user has 'owner' or 'admin' role
        const collabs = await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLABORATORS_ID!,
            [
                Query.equal("project_id", projectId),
                Query.equal("user_id", user.$id),
                Query.limit(1)
            ]
        );

        if (collabs.total === 0) {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
        }

        const colData = collabs.documents[0];

        if (colData.role !== 'owner' && colData.role !== 'admin') {
            return NextResponse.json({ error: "Insufficient permissions to delete this asset" }, { status: 403 });
        }

        // Get asset details to find file_path
        const assetObj = await databases.getDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ASSETS_ID!,
            assetId
        );

        // Delete from Appwrite Storage
        if (assetObj.file_path) {
            try {
                await storage.deleteFile(
                    process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ASSETS_ID!,
                    assetObj.file_path
                );
            } catch (storageError: any) {
                console.error("Storage delete error:", storageError?.message || storageError);
            }
        }

        // Delete from Appwrite Database
        await databases.deleteDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ASSETS_ID!,
            assetId
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error?.code === 404) {
            return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        }
        console.error("API Error [Delete Asset]:", error?.message || error);
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}
