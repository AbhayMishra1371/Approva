import { NextResponse } from "next/server";
import { getLoggedInUser, createClient as createSupabaseServerClient } from "@/lib/supabase/server";

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

        const supabase = await createSupabaseServerClient();

        let queryBuilder = supabase
            .from("activity_logs")
            .select(`
                *,
                profiles (name, email)
            `)
            .eq("project_id", projectId)
            .order("created_at", { ascending: false })
            .limit(50);

        if (assetId) {
            queryBuilder = queryBuilder.eq("entity_id", assetId);
        }

        const { data: logsRes, error: logsErr } = await queryBuilder;
        if (logsErr) throw logsErr;

        const enhancedDocuments = (logsRes || []).map((log: any) => {
            const profile = log.profiles || {};
            return {
                ...log,
                $id: log.id,
                $createdAt: log.created_at,
                user_name: profile.name || log.user_email || "Unknown User"
            };
        });

        return NextResponse.json({ documents: enhancedDocuments }, { status: 200 });

    } catch (error: any) {
        console.error("Error fetching activity logs API:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
