"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getUser, getJwt, logout } from "@/lib/auth/auth";
import { Loader2, LogOut, AlertTriangle, ArrowRight } from "lucide-react";

function InviteHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState("Authenticating...");
    const [isMismatch, setIsMismatch] = useState(false);
    const [mismatchData, setMismatchData] = useState<{ expectedEmail?: string, currentUserEmail?: string, token?: string }>({});

    useEffect(() => {
        const handleInvite = async () => {
            const token = searchParams.get("token");

            if (!token) {
                setStatus("Invalid invite link. Missing token.");
                setTimeout(() => router.push("/dashboard"), 2000);
                return;
            }

            try {
                // Check if user is logged in
                const user = await getUser();

                if (user) {
                    setStatus("Accepting invitation...");
                    // User is logged in, accept invite directly
                    const jwt = await getJwt();
                    const res = await fetch("/api/invites/accept", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            ...(jwt && { "Authorization": `Bearer ${jwt}` })
                        },
                        body: JSON.stringify({ token }),
                    });

                    if (res.ok) {
                        const data = await res.json();
                        setStatus("Success! Redirecting to project...");
                        router.push(`/dashboard/projects/${data.project_id}`);
                    } else {
                        const errorData = await res.json();

                        if (res.status === 403 && errorData.error.includes("different email address")) {
                            setIsMismatch(true);
                            setMismatchData({ token });
                            setStatus(`Invite mismatch: You are logged in with the wrong account.`);
                        } else {
                            setStatus(`Failed to accept: ${errorData.error}`);
                            setTimeout(() => router.push("/dashboard"), 3000);
                        }
                    }
                } else {
                    // User is not logged in, redirect to signup with token and email
                    setStatus("Loading invitation details...");
                    const inviteRes = await fetch(`/api/invites/${token}`);
                    if (inviteRes.ok) {
                        const inviteData = await inviteRes.json();
                        setStatus("Redirecting to create account...");
                        router.push(`/signup?token=${token}&email=${encodeURIComponent(inviteData.email)}`);
                    } else {
                        setStatus("Redirecting to create account...");
                        router.push(`/signup?token=${token}`); // Fallback
                    }
                }
            } catch (error) {
                console.error("Invite handler error:", error);
                setStatus("An error occurred processing your invite.");
                setTimeout(() => router.push("/"), 3000);
            }
        };

        handleInvite();
    }, [router, searchParams]);

    const handleMismatchLogout = async () => {
        setStatus("Logging out...");
        await logout();

        // Fetch invite to get the expected email
        let expectedEmail = "";
        try {
            const inviteRes = await fetch(`/api/invites/${mismatchData.token}`);
            if (inviteRes.ok) {
                const inviteData = await inviteRes.json();
                expectedEmail = inviteData.email;
            }
        } catch (e) { }

        setStatus("Redirecting to login...");
        if (expectedEmail) {
            router.push(`/login?token=${mismatchData.token}&email=${encodeURIComponent(expectedEmail)}`);
        } else {
            router.push(`/login?token=${mismatchData.token}`);
        }
    };

    if (isMismatch) {
        return (
            <div className="h-screen w-full bg-[#0b0c10] flex items-center justify-center text-white p-4">
                <div className="max-w-md w-full glass p-8 rounded-3xl border border-rose-500/20 shadow-2xl shadow-rose-500/10 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-3xl -mr-16 -mt-16 rounded-full" />

                    <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-8 h-8 text-rose-500" />
                    </div>

                    <h2 className="text-2xl font-bold mb-3 tracking-tight">Account Mismatch</h2>
                    <p className="text-slate-400 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
                        This invitation was sent to a different email address than the one you are currently logged in with.
                    </p>

                    <div className="space-y-3 relative z-10">
                        <button
                            onClick={handleMismatchLogout}
                            className="w-full bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out & Switch Account
                        </button>
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="w-full bg-[#1e1f2b] hover:bg-[#2a2b36] border border-[#2a2b36] text-white px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                        >
                            <ArrowRight className="w-4 h-4" />
                            Continue to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-[#0b0c10] flex items-center justify-center text-white">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                <p className="text-slate-300 font-medium">{status}</p>
            </div>
        </div>
    );
}

export default function InvitePage() {
    return (
        <Suspense fallback={
            <div className="h-screen w-full bg-[#0b0c10] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        }>
            <InviteHandler />
        </Suspense>
    );
}
