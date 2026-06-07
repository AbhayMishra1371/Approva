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

export async function getProfileByUsername(username: string) {
    const supabase = createClient();
    try {
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("username", username)
            .single();

        if (error) {
            console.log("Profile fetch error:", error);
            return null;
        }

        return data;
    } catch (error) {
        console.log("Error fetching profile:", error);
        return null;
    }
}

export async function getUserAvatarByUsername(username: string) {
    try {
        const supabase = createClient();
        const profile = await getProfileByUsername(username);

        if (!profile) {
            return null;
        }

        // Check if avatar_url exists in profile
        if (profile.avatar_url) {
            return profile.avatar_url;
        }

        // If no avatar, return the initial letter of the name
        const userName = profile.name || username;
        const initialLetter = userName.charAt(0).toUpperCase();

        return initialLetter;
    } catch (error) {
        console.log("Error fetching user avatar:", error);
        return null;
    }
}

export async function getUserActivityByUsername(userId: string, jwtToken?: string) {
    try {
        const headers: any = {};
        if (jwtToken) {
            headers["Authorization"] = `Bearer ${jwtToken}`;
        }

        const response = await fetch(`/api/activity?userId=${userId}`, {
            headers,
        });

        if (response.ok) {
            const data = await response.json();
            return data.documents || [];
        }

        return [];
    } catch (error) {
        console.log("Error fetching user activity:", error);
        return [];
    }
}
