"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/auth/auth";

export default function ProfilePage() {
    const router = useRouter();

    useEffect(() => {
        const redirectToUserProfile = async () => {
            try {
                const user = await getUser();
                if (user) {
                    router.push(`/dashboard/profile/${user.id}`);
                } else {
                    // If not logged in, redirect to login
                    router.push("/login");
                }
            } catch (error) {
                console.error("Error redirecting to profile:", error);
                router.push("/login");
            }
        };

        redirectToUserProfile();
    }, [router]);

    return (
        <div className="flex flex-col items-center justify-center h-screen gap-4">
            <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-medium">Redirecting to your profile...</p>
        </div>
    );
}
