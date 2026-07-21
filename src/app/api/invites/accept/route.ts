import { NextResponse } from "next/server";
import { getLoggedInUser, createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { invalidateCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    try {
        const { user } = await getLoggedInUser();

        if (!user || !user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = await createSupabaseServerClient();

        const json = await request.json();
        const { token } = json;

        if (!token) {
            return NextResponse.json({ error: "Missing required field (token)" }, { status: 400 });
        }

        // 1. Fetch the invite to verify it exists and matches user email in Supabase
        const { data: inviteObj, error: inviteErr } = await supabase
            .from("project_invites")
            .select("*")
            .eq("token", token)
            .eq("status", "pending")
            .single();

        if (inviteErr || !inviteObj) {
            return NextResponse.json({ error: "Invite not found or already accepted." }, { status: 404 });
        }

        // 2. Email validation - strictly enforce that the logged in user matches the invite
        if (inviteObj.email !== user.email) {
            return NextResponse.json({
                error: "This invitation was sent to a different email address than the one you are currently logged in with.",
                expectedEmail: inviteObj.email,
                currentUserEmail: user.email
            }, { status: 403 });
        }

        // 3. Check if already a collaborator in Supabase
        const { data: existingCollab, error: collabErr } = await supabase
            .from("project_collaborators")
            .select("id")
            .eq("project_id", inviteObj.project_id)
            .eq("user_id", user.$id)
            .maybeSingle();

        // Also check if the user is the project owner
        const { data: project } = await supabase
            .from("projects")
            .select("owner_id")
            .eq("id", inviteObj.project_id)
            .single();

        if (existingCollab || (project && project.owner_id === user.$id)) {
            // Update the invite status to accepted since they are already in the project
            await supabase
                .from("project_invites")
                .update({ status: "accepted" })
                .eq("id", inviteObj.id);
            return NextResponse.json({ error: "You are already a collaborator on this project" }, { status: 409 });
        }

        // 4. Insert into project_collaborators in Supabase
        // Map the role from inviteObj.role ('viewer' -> 'member' for Supabase DB)
        const dbRole = inviteObj.role === 'viewer' ? 'member' : inviteObj.role;

        const { data: newCollab, error: insertCollabErr } = await supabase
            .from("project_collaborators")
            .insert({
                project_id: inviteObj.project_id,
                user_id: user.$id,
                role: dbRole,
            })
            .select()
            .single();

        if (insertCollabErr || !newCollab) {
            throw insertCollabErr || new Error("Failed to insert collaborator in Supabase");
        }

        // 5. Update the pending invite status to accepted now that it was successfully consumed
        await supabase
            .from("project_invites")
            .update({ status: "accepted" })
            .eq("id", inviteObj.id);

        // Invalidate project collaborators cache
        await invalidateCache(`project:${inviteObj.project_id}:collaborators`);

        return NextResponse.json({
            ...newCollab,
            id: newCollab.id,
            role: newCollab.role === 'member' ? 'viewer' : newCollab.role
        });
    } catch (error: any) {
        console.error("Accept Invite Error:", error?.message || error);
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}
