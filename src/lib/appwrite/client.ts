"use client"
import { Client, Account, Databases, Storage } from 'appwrite';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';

export const createBrowserClient = () => {
    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

    const supabase = createSupabaseClient();

    return {
        get account() { 
            return {
                get: async () => {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) throw new Error("No user");
                    return {
                        $id: user.id,
                        email: user.email,
                        name: user.user_metadata?.full_name || user.email?.split('@')[0],
                        prefs: user.user_metadata?.prefs || {}
                    } as any;
                },
                createJWT: async () => {
                    const { data: { session } } = await supabase.auth.getSession();
                    return { jwt: session?.access_token };
                }
            } as unknown as Account;
        },
        get databases() { return new Databases(client); },
        get storage() { return new Storage(client); },
        client
    };
};
