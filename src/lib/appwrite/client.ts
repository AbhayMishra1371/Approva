"use client"
import { Client, Account, Databases, Storage } from 'appwrite';

export const createBrowserClient = () => {
    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

    return {
        get account() { return new Account(client); },
        get databases() { return new Databases(client); },
        get storage() { return new Storage(client); },
        client
    };
};
