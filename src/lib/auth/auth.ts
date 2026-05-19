import { createClient } from "@/lib/supabase/client";

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
        return { user: data.user, session: data.session, error };
    } catch (error: any) {
        console.error("Login Error:", error?.message || error);
        return { user: null, session: null, error };
    }
};

export const getUser = async () => {
    const supabase = createClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    } catch (error: any) {
        console.error("GetUser Error:", error?.message || error);
        return null;
    }
};

export const getJwt = async () => {
    const supabase = createClient();
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token || null;
    } catch (error: any) {
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
        return { success: !error, error };
    } catch (error: any) {
        console.error("UpdateName Error:", error?.message || error);
        return { success: false, error };
    }
};

export const updatePrefs = async (prefs: any) => {
    const supabase = createClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: new Error("Not logged in") };
        
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