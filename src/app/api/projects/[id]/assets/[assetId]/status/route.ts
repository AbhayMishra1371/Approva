import { NextResponse } from "next/server";
import { getLoggedInUser, createAdminClient } from "@/lib/appwrite/server";
import { Query, ID } from "node-appwrite";
import { AssetController } from "@/modules/assets/asset.controller";

export const dynamic = "force-dynamic";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string; assetId: string }> }
) {
    try {
        const { user } = await getLoggedInUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Must await params in newer Next.js versions when used in App Router API routes
        const resolvedParams = await params;
        const projectId = resolvedParams.id;
        const assetId = resolvedParams.assetId;
        const { status, comment } = await request.json();

        if (!status || !['draft', 'in_review', 'changes_requested', 'approved', 'rejected'].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const { databases } = await createAdminClient();

        // 1. Verify caller has access to this project and sufficient role
        const callerAccess = await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLABORATORS_ID!,
            [
                Query.equal("project_id", projectId),
                Query.equal("user_id", user.$id),
                Query.limit(1)
            ]
        );

        let role = "viewer";
        // Also check if caller is the owner
        const project = await databases.getDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_PROJECTS_ID!,
            projectId
        );

        if (project.owner_id === user.$id) {
            role = "owner";
        } else if (callerAccess.total > 0) {
            role = callerAccess.documents[0].role;
        } else {
            return NextResponse.json({ error: "Unauthorized access to project" }, { status: 403 });
        }

        // 2. Authorize state transition based on role
        if (role === "viewer") {
            return NextResponse.json({ error: "Viewers cannot change asset status" }, { status: 403 });
        }

        if (status === "approved" || status === "rejected" || status === "changes_requested") {
            if (role !== "owner" && role !== "admin" && role !== "reviewer") {
                return NextResponse.json({ error: "Insufficient permissions to review" }, { status: 403 });
            }
        }

        // 3. Update the Asset Document and optionally log it
        const assetController = new AssetController(databases);
        const updatedAsset = await assetController.updateAssetStatus(user, projectId, assetId, status, comment);

        return NextResponse.json({ success: true, asset: { ...updatedAsset, id: updatedAsset.$id } });

    } catch (error: any) {
        console.error("Error updating asset status:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
