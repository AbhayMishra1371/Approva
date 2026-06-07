import { NextResponse } from "next/server";
import { getLoggedInUser, createClient as createSupabaseServerClient } from "@/lib/supabase/server";


export const dynamic = "force-dynamic";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { user } = await getLoggedInUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: projectId } = await params;
        console.log(`[DEBUG] Starting cascade deletion for project: ${projectId}`);

        const supabase = await createSupabaseServerClient();

        // 1. Check if user is the owner in Supabase
        const { data: project, error: projErr } = await supabase
            .from("projects")
            .select("owner_id")
            .eq("id", projectId)
            .single();

        if (projErr || !project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        if (project.owner_id !== user.$id) {
            return NextResponse.json({ error: "Forbidden: Only owner can delete project" }, { status: 403 });
        }

        // 2. The project document itself in Supabase
        const { data: deleteData, error: deleteErr } = await supabase
            .from("projects")
            .delete()
            .eq("id", projectId)
            .select();

        if (deleteErr) {
            throw deleteErr;
        }
        console.log(`[CASCADE] Deleted project document ${projectId} from Supabase. Result data:`, deleteData);

        return NextResponse.json({ message: "Project deleted successfully", deletedData: deleteData }, { status: 200 });

    } catch (error: any) {
        console.error("Cascade Project Deletion Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { user } = await getLoggedInUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: projectId } = await params;
        const { name, clientName, deadline, status } = await request.json();

        const supabase = await createSupabaseServerClient();

        // 1. Verify owner
        const { data: project, error: fetchError } = await supabase
            .from("projects")
            .select("owner_id")
            .eq("id", projectId)
            .single();

        if (fetchError || !project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        if (project.owner_id !== user.$id) {
            return NextResponse.json({ error: "Forbidden: Only owner can update project" }, { status: 403 });
        }

        // 2. Perform update
        const updates: any = {};
        if (name) updates.name = name;
        if (clientName) updates.client_name = clientName;
        if (deadline) updates.deadline = new Date(deadline).toISOString();
        if (status) updates.status = status.toLowerCase();
        updates.updated_at = new Date().toISOString();

        const { data: updatedProject, error: updateError } = await supabase
            .from("projects")
            .update(updates)
            .eq("id", projectId)
            .select()
            .single();

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, project: updatedProject });
    } catch (error: any) {
        console.error("Project Update Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
