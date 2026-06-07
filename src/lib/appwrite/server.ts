import { Client, Account, Databases, Storage, Users } from "node-appwrite";
import { cookies, headers } from "next/headers";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

export async function createSessionClient() {
    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

    try {
        const requestHeaders = await headers();
        const authHeader = requestHeaders.get('authorization');
        
        const cookieStore = await cookies();
        const session = cookieStore.get(
            `a_session_${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
        );

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const jwt = authHeader.split(' ')[1];
            client.setJWT(jwt);
        } else if (session) {
            client.setSession(session.value);
        } else {
            console.warn("No Appwrite Auth header or session cookie found");
        }

    } catch (e) {
        console.warn("Error setting auth:", e);
    }

    return {
        get account() { return new Account(client); },
        get databases() { return new Databases(client); },
        get storage() { return new Storage(client); },
        client
    };
}

export async function createAdminClient() {
    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
        .setKey(process.env.APPWRITE_API_KEY!);

    return {
        get account() { return new Account(client); },
        get databases() { return new Databases(client); },
        get storage() { return new Storage(client); },
        get users() { return new Users(client); },
        client
    };
}


export async function getLoggedInUser() {
    try {
        const supabase = await createSupabaseServerClient();
        let supabaseUser = null;

        // Try getting user from session cookies first
        try {
            const { data: { user } } = await supabase.auth.getUser();
            supabaseUser = user;
        } catch (e) {
            console.warn("Session cookies retrieval failed:", e);
        }
        
        // Fallback: check Authorization Bearer header
        if (!supabaseUser) {
            try {
                const requestHeaders = await headers();
                const authHeader = requestHeaders.get('authorization');
                if (authHeader && authHeader.startsWith('Bearer ')) {
                    const token = authHeader.split(' ')[1];
                    const { data: { user: userFromToken }, error: tokenErr } = await supabase.auth.getUser(token);
                    if (tokenErr) {
                        console.warn("Token verification error:", tokenErr.message);
                    } else {
                        supabaseUser = userFromToken;
                    }
                }
            } catch (headerErr) {
                console.warn("Bearer token retrieval failed:", headerErr);
            }
        }
        
        if (!supabaseUser) throw new Error("No user found in cookies or Bearer token");

        const user = {
            $id: supabaseUser.id,
            email: supabaseUser.email,
            name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0],
            prefs: supabaseUser.user_metadata?.prefs || {}
        } as any;

        const { databases, storage } = await createAdminClient();
        return { user, databases, storage };
    } catch (error) {
        console.warn("getLoggedInUser auth failed:", error instanceof Error ? error.message : error);
        return { user: null, databases: null, storage: null };
    }
}
