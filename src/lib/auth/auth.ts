import { createBrowserClient } from "@/lib/appwrite/client";
import { ID } from "appwrite";

export const signUp = async (email: string, password: string, name?: string) => {
    const { account } = createBrowserClient();
    try {
        const user = await account.create(ID.unique(), email, password, name);
        return { user, error: null };
    } catch (error: any) {
        console.error("SignUp Error:", error?.message || error);
        return { user: null, error };
    }
};

export const login = async (email: string, password: string) => {
    const { account } = createBrowserClient();
    try {
        const session = await account.createEmailPasswordSession(email, password);
        const user = await account.get();
        return { user, session, error: null };
    } catch (error: any) {
        console.error("Login Error:", error?.message || error);
        return { user: null, session: null, error };
    }
};

export const getUser = async () => {
    const { account } = createBrowserClient();
    try {
        const user = await account.get();
        return user;
    } catch (error: any) {
        // Only log errors that aren't related to being a guest (missing account scope)
        // This prevents console noise during redirects or unauthenticated states
        if (error?.code !== 401 && !error?.message?.includes('missing scopes')) {
            console.error("GetUser Error:", error?.message || error);
        }
        return null;
    }
};

export const getJwt = async () => {
    const { account } = createBrowserClient();
    try {
        const user = await account.get().catch(() => null);
        if (!user) return null;

        const jwt = await account.createJWT();
        return jwt.jwt;
    } catch (error: any) {
        console.error("GetJWT Error:", error?.message || error);
        return null;
    }
};

export const updateName = async (name: string) => {
    const { account } = createBrowserClient();
    try {
        await account.updateName(name);
        return { success: true, error: null };
    } catch (error: any) {
        console.error("UpdateName Error:", error?.message || error);
        return { success: false, error };
    }
};

export const updatePrefs = async (prefs: any) => {
    const { account } = createBrowserClient();
    try {
        const user = await account.get();
        await account.updatePrefs({ ...user.prefs, ...prefs });
        return { success: true, error: null };
    } catch (error: any) {
        console.error("UpdatePrefs Error:", error?.message || error);
        return { success: false, error };
    }
};

export const logout = async () => {
    const { account } = createBrowserClient();
    try {
        await account.deleteSession("current");
    } catch (error: any) {
        console.error("Logout Error:", error?.message || error);
    }
};