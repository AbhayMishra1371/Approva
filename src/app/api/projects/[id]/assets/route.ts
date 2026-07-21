import { NextResponse } from "next/server";
import { getLoggedInUser, createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { invalidateCache } from "@/lib/cache";

import { AssetController } from "@/modules/assets/asset.controller";
import { AssetValidation } from "@/modules/assets/asset.validation";

export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const projectId = resolvedParams.id;

        const { user } = await getLoggedInUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify user has access to this project in Supabase
        const supabase = await createSupabaseServerClient();
        const { data: project, error: projErr } = await supabase
            .from("projects")
            .select("owner_id")
            .eq("id", projectId)
            .single();

        if (projErr || !project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        let hasAccess = project.owner_id === user.$id;

        if (!hasAccess) {
            const { data: collab } = await supabase
                .from("project_collaborators")
                .select("id")
                .eq("project_id", projectId)
                .eq("user_id", user.$id)
                .maybeSingle();

            if (collab) {
                hasAccess = true;
            }
        }

        if (!hasAccess) {
            return NextResponse.json({ error: "Unauthorized access to this project" }, { status: 403 });
        }

        const assetController = new AssetController();
        const assets = await assetController.getAssetsByProjectId(projectId);

        return NextResponse.json(assets);
    } catch (error: any) {
        console.error("API Error [Get Assets]:", error?.message || error);
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}

// Ensure the POST method we created is retained in this file
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const projectId = resolvedParams.id;

        const { user } = await getLoggedInUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify user has access to this project and their role in Supabase
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
            return NextResponse.json({ error: "Unauthorized access to this project" }, { status: 403 });
        }

        // Only viewers are blocked from uploading
        if (role === 'viewer') {
            return NextResponse.json({ error: "Insufficient permissions to upload assets" }, { status: 403 });
        }

        const json = await request.json();

        const validation = AssetValidation.validateAssetData(json);
        if (!validation.valid) {
            return NextResponse.json({ error: "Validation Error", details: validation.errors }, { status: 400 });
        }

        // Pass the request data to the new service
        // The service will handle versioning and thumbnail generation
        const assetController = new AssetController();
        const asset = await assetController.createAsset(user, projectId, json);

        return NextResponse.json(asset);
    } catch (error: any) {
        console.error("API Error [Create Asset]:", error?.message || error);
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const projectId = resolvedParams.id;

        const { user } = await getLoggedInUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(request.url);
        const assetId = url.searchParams.get("assetId");

        if (!assetId) {
            return NextResponse.json({ error: "Asset ID is required" }, { status: 400 });
        }

        // Verify user has 'owner' or 'admin' role in Supabase
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

        if (role !== 'owner' && role !== 'admin') {
            return NextResponse.json({ error: "Insufficient permissions to delete this asset" }, { status: 403 });
        }

        // Get asset details to find file_path
        const { data: assetObj, error: fetchErr } = await supabase
            .from("assets")
            .select("file_path")
            .eq("id", assetId)
            .single();

        if (fetchErr) throw fetchErr;

        // Delete from Supabase Storage
        if (assetObj?.file_path) {
            try {
                const { error: storageErr } = await supabase.storage
                    .from("assets")
                    .remove([assetObj.file_path]);
                if (storageErr) throw storageErr;
            } catch (storageError: any) {
                console.error("Storage delete error:", storageError?.message || storageError);
            }
        }

        // Delete from Supabase Database
        const { error: deleteErr } = await supabase
            .from("assets")
            .delete()
            .eq("id", assetId);

        if (deleteErr) throw deleteErr;

        // Invalidate asset cache for this project
        await invalidateCache(`project:${projectId}:assets`);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error?.code === 404) {
            return NextResponse.json({ error: "Asset not found" }, { status: 404 });
        }
        console.error("API Error [Delete Asset]:", error?.message || error);
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}
