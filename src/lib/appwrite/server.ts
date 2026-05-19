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
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        
        if (!supabaseUser) throw new Error("No user");

        const user = {
            $id: supabaseUser.id,
            email: supabaseUser.email,
            name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0],
            prefs: supabaseUser.user_metadata?.prefs || {}
        } as any;

        const { databases, storage } = await createAdminClient();
        return { user, databases, storage };
    } catch (error) {
        return { user: null, databases: null, storage: null };
    }
}
