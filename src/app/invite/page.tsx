"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function InviteRedirectHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams.get("token");
        if (token) {
            router.replace(`/invitations/accept?token=${token}`);
        } else {
            router.replace("/dashboard");
        }
    }, [router, searchParams]);

    return (
        <div className="h-screen w-full bg-[#0b0c10] flex items-center justify-center text-white">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
    );
}

export default function InviteRedirectPage() {
    return (
        <Suspense fallback={
            <div className="h-screen w-full bg-[#0b0c10] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        }>
            <InviteRedirectHandler />
        </Suspense>
    );
}
