import { NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

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

        const supabase = await createSupabaseServerClient();
        const { data: inviteObj, error: inviteErr } = await supabase
            .from("project_invites")
            .select("*")
            .eq("token", token)
            .eq("status", "pending")
            .single();

        if (inviteErr || !inviteObj) {
            return NextResponse.json({ error: "Invite not found" }, { status: 404 });
        }

        // Return only safe details (no sensitive project data, mainly just email and role for UX)
        return NextResponse.json({
            id: inviteObj.id,
            email: inviteObj.email,
            role: inviteObj.role,
            project_id: inviteObj.project_id
        });
    } catch (error: any) {
        console.error("Fetch Invite Details Error:", error?.message || error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
