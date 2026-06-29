import { AssetRepository } from "./asset.repository";
import { AssetData, UserContext } from "./asset.types";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { CommentRepository } from "../comments/comment.repository";

export class AssetService {
    private repository: AssetRepository;

    constructor() {
        this.repository = new AssetRepository();
    }

    async getAllAssetsForUser(user: UserContext) {
        // 1. Fetch owned projects from Supabase
        let ownedProjects: any[] = [];
        const supabase = await createSupabaseServerClient();
        try {
            const { data: ownedProjectsRes, error: ownedErr } = await supabase
                .from("projects")
                .select("*")
                .eq("owner_id", user.$id);

            if (ownedErr) throw ownedErr;

            ownedProjects = (ownedProjectsRes || []).map((doc: any) => ({ ...doc, id: doc.id, $id: doc.id }));
        } catch (e) {
            console.warn("Could not query owned projects:", e);
        }

        const ownedIds = new Set(ownedProjects.map(p => p.id));

        // 2. Fetch collaborator project IDs
        let collabProjectIds: string[] = [];
        try {
            const collabs = await this.repository.getCollaboratorProjects(user.$id);

            const filteredCollabs = collabs.filter((doc: any) => doc.user_id === user.$id);
            if (filteredCollabs.length !== collabs.length) {
                console.warn(`[SECURITY ALERT] Assets API: Collaborator query returned ${collabs.length} docs, but only ${filteredCollabs.length} matched user_id ${user.$id}.`);
            }

            filteredCollabs.forEach((doc: any) => {
                collabProjectIds.push(doc.project_id);
            });
        } catch (err) {
            console.warn("Could not query collaborator projects:", err);
        }

        // 3. Combine project IDs
        const allProjectIds = Array.from(new Set([...Array.from(ownedIds), ...collabProjectIds]));

        if (allProjectIds.length === 0) {
            return [];
        }

        // Fetch project names mapping
        let projectNamesMap: Record<string, string> = {};
        for (const proj of ownedProjects) {
            projectNamesMap[proj.id] = proj.name;
        }

        // Fetch names for collab projects not owned from Supabase
        const remainingIds = collabProjectIds.filter(id => !ownedIds.has(id));
        if (remainingIds.length > 0) {
            try {
                const { data: collabProjRes } = await supabase
                    .from("projects")
                    .select("id, name")
                    .in("id", remainingIds);
                (collabProjRes || []).forEach((doc: any) => {
                    projectNamesMap[doc.id] = doc.name;
                });
            } catch (e) {
                console.warn("Error fetching collab projects names from Supabase:", e);
            }
        }

        // 4. Fetch assets for all these projects
        const allAssets = await this.repository.getAssetsByProjectIds(allProjectIds);

        // Add project name to each asset
        const formattedAssets = allAssets.map((doc: any) => ({
            ...doc,
            id: doc.$id,
            project_name: projectNamesMap[doc.project_id] || "Unknown Project"
        }));

        // Sort globally just in case chunks messed up the order
        formattedAssets.sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime());

        return formattedAssets;
    }

    async createAsset(user: UserContext, projectId: string, assetData: AssetData) {
        const { fileName, filePath, fileType, size, url } = assetData;

        // Logic for Asset Versions
        let nextVersion = "v1";
        try {
            const latestAsset = await this.repository.getLatestAssetByName(projectId, fileName);
            if (latestAsset) {
                const latestVersionNum = parseInt(latestAsset.version.replace('v', '')) || 0;
                nextVersion = `v${latestVersionNum + 1}`;
            }
        } catch (e) {
            console.warn("Error finding latest asset version:", e);
        }

        // Call Thumbnail Generation
        const thumbnailUrl = await this.generateThumbnail(filePath, fileType);

        const asset = await this.repository.createAsset({
            project_id: projectId,
            file_name: fileName,
            file_path: filePath,
            file_type: fileType || 'unknown',
            size: size || 0,
            status: "draft",
            version: nextVersion,
            url: url || "",
        });

        // We can attach the generated thumbnail url dynamically if not storing it
        return { ...asset, id: asset.$id, thumbnail_url: thumbnailUrl };
    }

    async updateAssetStatus(user: UserContext, projectId: string, assetId: string, status: string, comment?: string) {
        const updatedAsset = await this.repository.updateAssetStatus(assetId, status);

        if (comment) {
            try {
                const commentRepo = new CommentRepository();
                await commentRepo.createGeneralComment(
                    assetId,
                    user.$id,
                    user.email || 'unknown',
                    comment
                );
            } catch (cmtErr) {
                console.warn("Failed to log status change as comment", cmtErr);
            }
        }

        return { ...updatedAsset, id: updatedAsset.$id };
    }

    private async generateThumbnail(filePath: string, fileType: string): Promise<string> {
        if (fileType.startsWith('image/')) {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            if (supabaseUrl) {
                return `${supabaseUrl}/storage/v1/object/public/assets/${filePath}`;
            }
        }
        return "";
    }
}
