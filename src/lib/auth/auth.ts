import { createClient } from "@/lib/supabase/client";
import { createUserProfile } from "@/lib/supabase/profile";

export const signUp = async (email: string, password: string, name: string) => {
    const supabase = createClient();
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                }
            }
        });
        if (data?.user) {
            await createUserProfile();
        }
        return { user: data.user, error };
    } catch (error: any) {
        console.error("SignUp Error:", error?.message || error);
        return { user: null, error };
    }
};

export const login = async (email: string, password: string) => {
    const supabase = createClient();
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (data?.user) {
            await createUserProfile();
        }
        return { user: data.user, session: data.session, error };
    } catch (error: any) {
        console.error("Login Error:", error?.message || error);
        return { user: null, session: null, error };
    }
};

export const getUser = async () => {
    const supabase = createClient();
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
            if (error.message.includes("Refresh Token Not Found") || error.message.includes("refresh token") || error.message.includes("session missing")) {
                await supabase.auth.signOut().catch(() => {});
            } else {
                console.error("GetUser API Error:", error.message);
            }
            return null;
        }
        return user;
    } catch (error: any) {
        if (error?.name === "AuthApiError" && error?.message?.includes("Refresh Token Not Found")) {
            await supabase.auth.signOut().catch(() => {});
            return null;
        }
        console.error("GetUser Error:", error?.message || error);
        return null;
    }
};

export const getJwt = async () => {
    const supabase = createClient();
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            if (error.message.includes("Refresh Token Not Found") || error.message.includes("refresh token") || error.message.includes("session missing")) {
                await supabase.auth.signOut().catch(() => {});
            } else {
                console.error("GetJWT API Error:", error.message);
            }
            return null;
        }
        return session?.access_token || null;
    } catch (error: any) {
        if (error?.name === "AuthApiError" && error?.message?.includes("Refresh Token Not Found")) {
            await supabase.auth.signOut().catch(() => {});
            return null;
        }
        console.error("GetJWT Error:", error?.message || error);
        return null;
    }
};

export const updateName = async (name: string) => {
    const supabase = createClient();
    try {
        const { error } = await supabase.auth.updateUser({
            data: { full_name: name }
        });
        if (!error) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from("profiles").update({ name }).eq("id", user.id);
            }
        }
        return { success: !error, error };
    } catch (error: any) {
        console.error("UpdateName Error:", error?.message || error);
        return { success: false, error };
    }
};

export const updatePrefs = async (prefs: any) => {
    const supabase = createClient();
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return { success: false, error: authError || new Error("Not logged in") };
        
        const { error } = await supabase.auth.updateUser({
            data: { prefs: { ...(user.user_metadata?.prefs || {}), ...prefs } }
        });
        return { success: !error, error };
    } catch (error: any) {
        console.error("UpdatePrefs Error:", error?.message || error);
        return { success: false, error };
    }
};

export const logout = async () => {
    const supabase = createClient();
    try {
        await supabase.auth.signOut();
    } catch (error: any) {
        console.error("Logout Error:", error?.message || error);
    }
};

export const getUserAvatar = async () => {
    try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
            return null;
        }

        // Check if user logged in via Google
        const googleIdentity = user.identities?.find((identity) => identity.provider === "google");
        
        if (googleIdentity && user.user_metadata?.picture) {
            // Return Google avatar URL from metadata
            return user.user_metadata.picture;
        }

        // Generate avatar from user's initial letter
        const userName = user.user_metadata?.full_name || user.email || "User";
        const initialLetter = userName.charAt(0).toUpperCase();
        
        return initialLetter;
    } catch (error: any) {
        console.error("GetUserAvatar Error:", error?.message || error);
        return null;
    }
};