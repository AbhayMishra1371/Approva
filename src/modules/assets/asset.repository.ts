import { Query, ID } from "node-appwrite";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

export class AssetRepository {
    private databases: any;
    private databaseId: string;
    private collectionAssetsId: string;

    constructor(databases: any) {
        this.databases = databases;
        this.databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
        this.collectionAssetsId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ASSETS_ID!;
    }


    async getCollaboratorProjects(userId: string) {
        const supabase = await createSupabaseServerClient();
        const { data, error } = await supabase
            .from("project_collaborators")
            .select("project_id")
            .eq("user_id", userId);

        if (error) {
            console.error("Error fetching collaborator projects from Supabase:", error);
            return [];
        }

        return (data || []).map((doc: any) => ({
            project_id: doc.project_id,
            user_id: userId
        }));
    }


    async getAssetsByProjectIds(projectIds: string[]) {
        const supabase = await createSupabaseServerClient();
        const { data, error } = await supabase
            .from("assets")
            .select("*")
            .in("project_id", projectIds)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching assets by project IDs:", error);
            return [];
        }

        return (data || []).map((doc: any) => ({
            ...doc,
            size: doc.file_size,
            $id: doc.id,
            $createdAt: doc.created_at,
            $updatedAt: doc.updated_at
        }));
    }

    async getLatestAssetByName(projectId: string, fileName: string) {
        const supabase = await createSupabaseServerClient();
        const { data, error } = await supabase
            .from("assets")
            .select("*")
            .eq("project_id", projectId)
            .eq("file_name", fileName)
            .order("created_at", { ascending: false })
            .limit(1);

        if (error) {
            console.error("Error fetching latest asset by name:", error);
            return null;
        }

        if (!data || data.length === 0) return null;
        const doc = data[0];
        return {
            ...doc,
            size: doc.file_size,
            $id: doc.id,
            $createdAt: doc.created_at,
            $updatedAt: doc.updated_at
        };
    }

    async createAsset(data: any) {
        const supabase = await createSupabaseServerClient();
        const { data: newDoc, error } = await supabase
            .from("assets")
            .insert({
                project_id: data.project_id,
                file_name: data.file_name,
                file_path: data.file_path,
                file_type: data.file_type,
                file_size: data.size,
                url: data.url,
                version: data.version,
                status: data.status || 'Pending',
                asset_group_id: data.asset_group_id,
                is_latest: data.is_latest !== undefined ? data.is_latest : true
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return {
            ...newDoc,
            size: newDoc.file_size,
            $id: newDoc.id,
            $createdAt: newDoc.created_at,
            $updatedAt: newDoc.updated_at
        };
    }

    async updateAssetStatus(assetId: string, status: string) {
        const supabase = await createSupabaseServerClient();
        const { data: updatedDoc, error } = await supabase
            .from("assets")
            .update({ status: status })
            .eq("id", assetId)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return {
            ...updatedDoc,
            size: updatedDoc.file_size,
            $id: updatedDoc.id,
            $createdAt: updatedDoc.created_at,
            $updatedAt: updatedDoc.updated_at
        };
    }

    async createGeneralComment(assetId: string, userId: string, userEmail: string, text: string) {
        const supabase = await createSupabaseServerClient();
        const { data, error } = await supabase
            .from("general_comments")
            .insert({
                asset_id: assetId,
                user_id: userId,
                user_email: userEmail,
                text: text,
                mentions: []
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    }
}
