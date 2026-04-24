import { createBrowserClient } from "@/lib/appwrite/client";
import { ID } from "appwrite";

export const signUp = async (email: string, password: string, name: string) => {
    const { account, databases } = createBrowserClient();
    try {
        const user = await account.create(ID.unique(), email, password, name);

        // Derive username from name (take only the name as requested, maybe remove spaces and lowercase)
        const username = name ? name.split(' ')[0].toLowerCase() : email.split('@')[0].toLowerCase();

        try {
            await databases.createDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                "profile", // Collection ID
                user.$id,   // Also use user ID as the document ID
                {
                    id: user.$id,
                    username: username,
                    full_name: name || "",
                    avatar_url: "",
                    created_at: new Date().toISOString()
                }
            );
        } catch (dbError) {
            console.error("Failed to create profile document:", dbError);
            // Optionally, we could delete the auth user if profile creation fails, 
            // but for now, we'll just log it.
        }

        return { user, error: null };
    } catch (error: any) {
        console.error("SignUp Error:", error?.message || error);
        return { user: null, error };
    }
};

export const login = async (email: string, password: string) => {
    const { account, databases } = createBrowserClient();
    try {
        const session = await account.createEmailPasswordSession(email, password);
        const user = await account.get();

        // Ensure a profile document exists (fixes accounts created before profile system)
        try {
            await databases.getDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                "profile",
                user.$id
            );
        } catch {
            // Profile missing — create it now
            const username = user.name
                ? user.name.split(' ')[0].toLowerCase()
                : email.split('@')[0].toLowerCase();
            try {
                await databases.createDocument(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                    "profile",
                    user.$id,
                    {
                        id: user.$id,
                        username,
                        full_name: user.name || "",
                        avatar_url: "",
                        created_at: new Date().toISOString()
                    }
                );
            } catch (createErr) {
                console.error("Failed to create missing profile on login:", createErr);
            }
        }

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