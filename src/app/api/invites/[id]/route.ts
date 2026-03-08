import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite/server";

export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // We'll keep the param name 'id' for the folder structure but treat it as a token
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
                import("node-appwrite").then(m => m.Query.equal("token", token))
            ] as any // Dynamic import for Query since it wasn't at the top
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
