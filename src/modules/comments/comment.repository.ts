import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

export class CommentRepository {
    constructor() {}

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
