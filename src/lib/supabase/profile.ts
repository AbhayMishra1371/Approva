import { createClient } from "@/lib/supabase/client";

export async function createUserProfile() {
    const supabase = createClient();
    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
        .from("profiles")
        .upsert({
            id: user.id,
            name:
                user.user_metadata?.full_name ||
                user.email?.split("@")[0],

            email: user.email,

            username:
                user.email?.split("@")[0],

            avatar_url:
                user.user_metadata?.avatar_url || ""
        });

    if (error) {
        console.log("Profile creation error:", error);
    }
}
