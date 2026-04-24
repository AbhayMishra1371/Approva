import { NextResponse } from "next/server";
import { getLoggedInUser, createAdminClient } from "@/lib/appwrite/server";
import { Query } from "node-appwrite";

export const dynamic = "force-dynamic";

// GET /api/notifications - Fetch notifications for the logged-in user
export async function GET(request: Request) {
    try {
        const { user } = await getLoggedInUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { databases } = await createAdminClient();
        const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
        const collId = process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATION_COLLECTION_ID || "notification";

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "10");

        const response = await databases.listDocuments(
            dbId,
            collId,
            [
                Query.equal("user_id", user.$id),
                Query.orderDesc("$createdAt"),
                Query.limit(limit)
            ]
        );

        console.log("FETCH: Found", response.total, "notifications for user:", user.$id);
        return NextResponse.json({ notifications: response.documents }, { status: 200 });
    } catch (error: any) {
        console.error("Notifications GET Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

// PATCH /api/notifications - Mark a notification as read
export async function PATCH(request: Request) {
    try {
        const { user } = await getLoggedInUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id, is_read } = await request.json();
        if (!id) {
            return NextResponse.json({ error: "Missing notification ID" }, { status: 400 });
        }

        const { databases } = await createAdminClient();
        const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
        const collId = process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATION_COLLECTION_ID || "notification";

        // Optional: Verify ownership before update
        const notification = await databases.getDocument(dbId, collId, id);
        if (notification.user_id !== user.$id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const updated = await databases.updateDocument(
            dbId,
            collId,
            id,
            { is_read: is_read ?? true }
        );

        return NextResponse.json({ notification: updated }, { status: 200 });
    } catch (error: any) {
        console.error("Notifications PATCH Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
