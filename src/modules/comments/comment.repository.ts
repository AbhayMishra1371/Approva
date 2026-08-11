import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

export class CommentRepository {
    constructor() {}

    async getCommentsByAssetId(assetId: string) {
        console.time("COMMENTS TOTAL");
        console.time("SUPABASE CLIENT [COMMENTS]");
        const supabase = await createSupabaseServerClient();
        console.timeEnd("SUPABASE CLIENT [COMMENTS]");

        console.time("SUPABASE QUERY [COMMENTS]");
        const { data, error } = await supabase
            .from("general_comments")
            .select(`
                *,
                profiles (
                    name,
                    avatar_url
                )
            `)
            .eq("asset_id", assetId)
            .order("created_at", { ascending: true });
        console.timeEnd("SUPABASE QUERY [COMMENTS]");
        console.timeEnd("COMMENTS TOTAL");

        if (error) {
            console.error("Error fetching general comments:", error);
            return [];
        }

        return (data || []).map(doc => ({
            $id: doc.id,
            id: doc.id,
            user_id: doc.user_id,
            user_email: doc.user_email,
            text: doc.text,
            created_at: doc.created_at,
            mentions: doc.mentions || [],
            profiles: doc.profiles
        }));
    }

    async createGeneralComment(assetId: string, userId: string, userEmail: string, text: string, mentions: string[] = []) {
        const supabase = await createSupabaseServerClient();
        const { data, error } = await supabase
            .from("general_comments")
            .insert({
                asset_id: assetId,
                user_id: userId,
                user_email: userEmail,
                text: text,
                mentions: mentions
            })
            .select(`
                *,
                profiles (
                    name,
                    avatar_url
                )
            `)
            .single();

        if (error) {
            throw error;
        }

        return data;
    }

    async updateComment(commentId: string, text: string) {
        const supabase = await createSupabaseServerClient();
        const { data, error } = await supabase
            .from("general_comments")
            .update({ text })
            .eq("id", commentId)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data;
    }

    async deleteComment(commentId: string) {
        const supabase = await createSupabaseServerClient();
        const { error } = await supabase
            .from("general_comments")
            .delete()
            .eq("id", commentId);

        if (error) {
            throw error;
        }

        return true;
    }
}
