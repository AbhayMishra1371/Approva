import { NextResponse } from "next/server";
import { getLoggedInUser, createAdminClient } from "@/lib/appwrite/server";
import { Query } from "node-appwrite";

export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { user } = await getLoggedInUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: projectId } = await params;
        const { searchParams } = new URL(request.url);
        const assetId = searchParams.get("assetId");

        const { databases } = await createAdminClient();
        const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
        const collId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ACTIVITY_LOG_ID || "activity_logs";

        if (!dbId) {
             return NextResponse.json({ error: "Database ID not configured" }, { status: 500 });
        }

        const queries = [
            Query.equal("project_id", projectId),
            Query.orderDesc("$createdAt"),
            Query.limit(50)
        ];

        if (assetId) {
            queries.push(Query.equal("entity_id", assetId));
        }

        const response = await databases.listDocuments(
            dbId,
            collId,
            queries
        );

        return NextResponse.json({ documents: response.documents }, { status: 200 });

    } catch (error: any) {
        console.error("Error fetching activity logs API:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
