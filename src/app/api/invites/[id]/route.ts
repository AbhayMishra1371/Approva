import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite/server";
import { Query } from "node-appwrite";

export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: token } = await params;

        if (!token) {
            return NextResponse.json({ error: "Missing invite token" }, { status: 400 });
        }

        const { databases: adminDatabases } = await createAdminClient();

        const invitesRes = await adminDatabases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_INVITES_ID!,
            [
                Query.equal("token", token)
            ]
        );

        if (invitesRes.total === 0) {
            return NextResponse.json({ error: "Invite not found" }, { status: 404 });
        }

        const inviteObj = invitesRes.documents[0];

        // Return only safe details (no sensitive project data, mainly just email and role for UX)
        return NextResponse.json({
            id: inviteObj.$id,
            email: inviteObj.email,
            role: inviteObj.role,
            project_id: inviteObj.project_id
        });
    } catch (error: any) {
        if (error?.code === 404) {
            return NextResponse.json({ error: "Invite not found" }, { status: 404 });
        }
        console.error("Fetch Invite Details Error:", error?.message || error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
