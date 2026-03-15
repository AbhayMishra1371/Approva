"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getUser, getJwt, logout } from "@/lib/auth/auth";
import { Loader2, LogOut, AlertTriangle, ArrowRight, Mail } from "lucide-react";

function InvitationAcceptHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState("Authenticating...");
    const [isMismatch, setIsMismatch] = useState(false);
    const [mismatchData, setMismatchData] = useState<{ expectedEmail?: string, currentUserEmail?: string, token?: string }>({});
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleInvite = async () => {
            const token = searchParams.get("token");

            if (!token) {
                setError("Invalid invite link. Missing token.");
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
                        localStorage.removeItem("pendingInviteToken");
                        router.push(`/dashboard/projects/${data.project_id}`);
                    } else {
                        const errorData = await res.json();

                        if (res.status === 403) {
                            setMismatchData({ 
                                token, 
                                expectedEmail: errorData.expectedEmail,
                                currentUserEmail: errorData.currentUserEmail || user.email
                            });
                            setIsMismatch(true);
                            setStatus("");
                        } else {
                            setError(errorData.error || "Failed to accept invitation.");
                        }
                    }
                } else {
                    // User is not logged in, redirect to login with token and email
                    setStatus("Redirecting to login...");
                    try {
                        const inviteRes = await fetch(`/api/invites/${token}`);
                        if (inviteRes.ok) {
                            const inviteData = await inviteRes.json();
                            router.push(`/login?token=${token}&email=${encodeURIComponent(inviteData.email)}`);
                        } else {
                            router.push(`/login?token=${token}`);
                        }
                    } catch (e) {
                        router.push(`/login?token=${token}`);
                    }
                }
            } catch (error) {
                console.error("Invite handler error:", error);
                setError("An error occurred processing your invite.");
            }
        };

        handleInvite();
    }, [router, searchParams]);

    const handleMismatchLogout = async () => {
        setStatus("Logging out...");
        try {
            await logout();
        } catch (e) {
            console.error("Logout error:", e);
        }
        
        const token = mismatchData.token;
        const email = mismatchData.expectedEmail;
        
        const targetUrl = email 
            ? `/login?token=${token}&email=${encodeURIComponent(email)}`
            : `/login?token=${token}`;
            
        // Hard refresh to ensure all states are cleared
        window.location.href = targetUrl;
    };

    const handleGoToDashboard = () => {
        localStorage.removeItem("pendingInviteToken");
        router.push("/dashboard");
    };

    if (error) {
        // ... (keeping error UI)
        return (
            <div className="h-screen w-full bg-[#0b0c10] flex items-center justify-center text-white p-4">
                <div className="max-w-md w-full glass p-8 rounded-3xl border border-rose-500/20 shadow-2xl text-center">
                    <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-8 h-8 text-rose-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3">Invite Error</h2>
                    <p className="text-slate-400 mb-8 text-sm">{error}</p>
                    <button
                        onClick={handleGoToDashboard}
                        className="w-full bg-[#1e1f2b] hover:bg-[#2a2b36] border border-[#2a2b36] text-white px-6 py-3 rounded-xl font-bold text-sm transition-all"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (isMismatch) {
        return (
            <div className="h-screen w-full bg-[#0b0c10] flex items-center justify-center text-white p-4">
                <div className="max-w-md w-full glass p-8 rounded-3xl border border-purple-500/20 shadow-2xl text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl -mr-16 -mt-16 rounded-full" />

                    <div className="w-16 h-16 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Mail className="w-8 h-8 text-purple-500" />
                    </div>

                    <h2 className="text-2xl font-bold mb-3 tracking-tight">Account Mismatch</h2>
                    <div className="text-slate-400 mb-6 text-sm space-y-4">
                        <p>
                            This invitation was sent to <span className="text-white font-semibold">{mismatchData.expectedEmail}</span>.
                        </p>
                        <p>
                            However, you are currently logged in as <span className="text-white font-semibold">{mismatchData.currentUserEmail}</span>.
                        </p>
                        <div className="bg-purple-500/5 border border-purple-500/10 p-4 rounded-2xl text-xs text-purple-200/60 italic mt-4">
                            Note: If using Google or GitHub, make sure to select the correct account during sign-in after switching.
                        </div>
                    </div>

                    <div className="space-y-3 relative z-10">
                        <button
                            onClick={handleMismatchLogout}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out & Switch Account
                        </button>
                        <button
                            onClick={handleGoToDashboard}
                            className="w-full bg-[#1e1f2b] hover:bg-[#2a2b36] border border-[#2a2b36] text-white px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                        >
                            <ArrowRight className="w-4 h-4" />
                            Continue as {mismatchData.currentUserEmail?.split('@')[0]}
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

export default function InvitationAcceptPage() {
    return (
        <Suspense fallback={
            <div className="h-screen w-full bg-[#0b0c10] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        }>
            <InvitationAcceptHandler />
        </Suspense>
    );
}
