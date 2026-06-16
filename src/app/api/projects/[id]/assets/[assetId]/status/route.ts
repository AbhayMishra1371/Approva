import { NextResponse } from "next/server";
import { getLoggedInUser, createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { AssetController } from "@/modules/assets/asset.controller";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  try {
    const { user } = await getLoggedInUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Must await params in newer Next.js versions when used in App Router API routes
    const resolvedParams = await params;
    const projectId = resolvedParams.id;
    const assetId = resolvedParams.assetId;
    const { status, comment } = await request.json();

    if (!status || !['draft', 'in_review', 'changes_requested', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }



    // 1. Verify caller has access to this project and check their role in Supabase
    const supabase = await createSupabaseServerClient();
    const { data: project, error: projErr } = await supabase
      .from("projects")
      .select("owner_id")
      .eq("id", projectId)
      .single();

    if (projErr || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    let role = "";
    if (project.owner_id === user.$id) {
      role = "owner";
    } else {
      const { data: collab } = await supabase
        .from("project_collaborators")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", user.$id)
        .maybeSingle();

      if (collab) {
        role = collab.role === 'member' ? 'viewer' : collab.role;
      }
    }

    if (!role) {
      return NextResponse.json({ error: "Unauthorized access to project" }, { status: 403 });
    }

    // 2. Authorize state transition based on role
    if (role === "viewer") {
      return NextResponse.json({ error: "Viewers cannot change asset status" }, { status: 403 });
    }

    if (status === "approved" || status === "rejected" || status === "changes_requested") {
      if (role !== "owner" && role !== "admin" && role !== "reviewer") {
        return NextResponse.json({ error: "Insufficient permissions to review" }, { status: 403 });
      }
    }

    // 3. Update the Asset Document and optionally log it
    const assetController = new AssetController();
    const updatedAsset = await assetController.updateAssetStatus(user, projectId, assetId, status, comment);

    // 4. Notify the asset uploader (if they are not the reviewer themselves)
    try {
      const { data: assetDoc } = await supabase
        .from("assets")
        .select("uploaded_by, file_name")
        .eq("id", assetId)
        .maybeSingle();

      const uploaderId = assetDoc?.uploaded_by;
      if (uploaderId && uploaderId !== user.$id) {
        const typeMap: Record<string, "approval" | "rejection" | "changes_requested"> = {
          approved: "approval",
          rejected: "rejection",
          changes_requested: "changes_requested",
        };
        const titleMap: Record<string, string> = {
          approved: "Asset Approve ✅",
          rejected: "Asset Rejected",
          changes_requested: "Changes Requested",
        };
        const notifType = typeMap[status];
        if (notifType) {
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", user.$id)
            .maybeSingle();
          const senderName = senderProfile?.name || user.name || "A reviewer";
          const fileName = assetDoc?.file_name || "your asset";

          await createNotification({
            user_id: uploaderId,
            sender_id: user.$id,
            project_id: projectId,
            type: notifType,
            title: titleMap[status],
            message: `${senderName} marked "${fileName}" as ${status.replace("_", " ")}`,
            link: `/dashboard/projects/${projectId}/assets/${assetId}`,
            metadata: { asset_id: assetId, status },
          });
        }
      }
    } catch (notifErr) {
      console.error("Failed to create status notification:", notifErr);
    }

    return NextResponse.json({ success: true, asset: { ...updatedAsset, id: updatedAsset.$id } });

  } catch (error: any) {
    console.error("Error updating asset status:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
