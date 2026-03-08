import { NextResponse } from "next/server";
import { getLoggedInUser, createAdminClient } from "@/lib/appwrite/server";
import { ID, Query, Permission, Role } from "node-appwrite";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    try {
        const { user } = await getLoggedInUser();

        if (!user || !user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { databases: adminDatabases } = await createAdminClient();

        const json = await request.json();
        const { token } = json;

        if (!token) {
            return NextResponse.json({ error: "Missing required field (token)" }, { status: 400 });
        }

        // 1. Fetch the invite to verify it exists and matches user email
        const invitesRes = await adminDatabases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_INVITES_ID!,
            [Query.equal("token", token)]
        );

        if (invitesRes.total === 0) {
            return NextResponse.json({ error: "Invite not found or already accepted." }, { status: 404 });
        }

        const inviteObj = invitesRes.documents[0];

        if (inviteObj.email !== user.email) {
            console.log("INVITE EMAIL OR USER EMAIL MISMATCH:", { inviteEmail: inviteObj.email, userEmail: user.email });
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
                inviteObj.$id
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
                role: inviteObj.role,
            },
            [
                Permission.read(Role.user(user.$id)),
                Permission.update(Role.user(user.$id)),
                Permission.delete(Role.user(user.$id)),
            ]
        );

        // 4. Update the Project Document to grant this user read access
        try {
            // First fetch the project to get current explicit permissions
            const project = await adminDatabases.getDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_PROJECTS_ID!,
                inviteObj.project_id
            );

            const newPermissions = [
                ...(project.$permissions || []),
                Permission.read(Role.user(user.$id))
            ];

            // Use an empty object for data since we only want to update permissions
            await adminDatabases.updateDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_PROJECTS_ID!,
                inviteObj.project_id,
                {}, // Only mutating permissions
                newPermissions
            );
            console.log("Successfully granted project permissions to user");
        } catch (permError) {
            console.error("Failed to update project permissions:", permError);
        }

        // 4. Delete the pending invite now that it was successfully consumed
        await adminDatabases.deleteDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_INVITES_ID!,
            inviteObj.$id
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
