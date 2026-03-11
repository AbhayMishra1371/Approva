
import { Client, Account, Databases, Storage, Users } from 'node-appwrite';
import { headers } from 'next/headers';

export async function createSessionClient() {
    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

    try {
        const requestHeaders = await headers();
        const authHeader = requestHeaders.get('authorization');

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const jwt = authHeader.split(' ')[1];
            client.setJWT(jwt);
        } else {
            console.warn("No Appwrite Authorization header found. authHeader:", authHeader);
        }
    } catch (e) {
        console.warn("Error accessing headers in server.ts:", e);
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
        const { account, databases, storage } = await createSessionClient();
        const user = await account.get();
        return { user, databases, storage };
    } catch (error) {
        return { user: null, databases: null, storage: null };
    }
}
