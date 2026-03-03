import { NextResponse } from "next/server";
import { getLoggedInUser, createAdminClient } from "@/lib/appwrite/server";
import { ID, Query } from "node-appwrite";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    try {
        const { user } = await getLoggedInUser();

        if (!user || !user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { databases: adminDatabases } = await createAdminClient();

        const json = await request.json();
        const { inviteId } = json;

        if (!inviteId) {
            return NextResponse.json({ error: "Missing required field (inviteId)" }, { status: 400 });
        }

        // 1. Fetch the invite to verify it exists and matches user email
        const inviteObj = await adminDatabases.getDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_INVITES_ID!,
            inviteId
        );

        if (!inviteObj) {
            return NextResponse.json({ error: "Invite not found" }, { status: 404 });
        }

        if (inviteObj.email !== user.email) {
            return NextResponse.json({ error: "This invite belongs to a different email address." }, { status: 403 });
        }

        // 2. Check if already a collaborator
        const existingCollab = await adminDatabases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLABORATORS_ID!,
            [
                Query.equal("project_id", inviteObj.project_id),
                Query.equal("user_id", user.$id)
            ]
        );

        if (existingCollab.total > 0) {
            // Cleanup the invite
            await adminDatabases.deleteDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_INVITES_ID!,
                inviteId
            );
            return NextResponse.json({ error: "You are already a collaborator on this project" }, { status: 409 });
        }

        // 3. Insert into project_collaborators
        const newCollab = await adminDatabases.createDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLABORATORS_ID!,
            ID.unique(),
            {
                project_id: inviteObj.project_id,
                user_id: user.$id,
                role: inviteObj.role
            }
        );

        // 4. Delete the pending invite
        await adminDatabases.deleteDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_INVITES_ID!,
            inviteId
        );

        return NextResponse.json({ ...newCollab, id: newCollab.$id });
    } catch (error: any) {
        if (error?.code === 404) {
            return NextResponse.json({ error: "Invite not found" }, { status: 404 });
        }
        console.error("Appwrite Accept Error:", error?.message || error);
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}
