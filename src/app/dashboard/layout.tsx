"use client";

import Link from "next/link";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getUser, logout, getJwt } from "@/lib/auth/auth";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import {
    LayoutDashboard,
    FolderOpen,
    Activity,
    Settings,
    HelpCircle,
    User,
    LogOut,
    Bell,
    CheckCheck,
    UserPlus,
    CheckCircle2,
    XCircle,
    MessageSquare,
    ThumbsUp,
    ThumbsDown,
    GitPullRequestDraft,
} from "lucide-react";


export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [user, setUser] = useState<any>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createSupabaseClient();

    // ── Notification state ──────────────────────────────────────────────────
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [notifLoading, setNotifLoading] = useState(false);
    const [processingNotif, setProcessingNotif] = useState<string | null>(null);
    const notifRef = useRef<HTMLDivElement>(null);
    const unreadCount = notifications.filter((n) => !n.is_read).length;

    const fetchNotifications = useCallback(async () => {
        setNotifLoading(true);
        try {
            const jwt = await getJwt();
            const res = await fetch("/api/notifications", {
                headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications ?? []);
            }
        } catch (e) {
            console.error("Failed to fetch notifications:", e);
        } finally {
            setNotifLoading(false);
        }
    }, []);

    const markAllRead = async () => {
        try {
            const jwt = await getJwt();
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json", ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}) },
                body: JSON.stringify({ markAllRead: true }),
            });
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        } catch (e) {
            console.error("Failed to mark all read:", e);
        }
    };

    const markOneRead = async (id: string) => {
        try {
            const jwt = await getJwt();
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json", ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}) },
                body: JSON.stringify({ id }),
            });
            setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
        } catch (e) {
            console.error("Failed to mark read:", e);
        }
    };

    const acceptInvite = async (notifId: string) => {
        setProcessingNotif(notifId);
        try {
            const jwt = await getJwt();
            const res = await fetch(`/api/notifications/${notifId}`, {
                method: "POST",
                headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications((prev) => prev.map((n) => n.id === notifId ? { ...n, is_read: true } : n));
                if (data.project_id) {
                    router.push(`/dashboard/projects/${data.project_id}`);
                }
            }
        } catch (e) {
            console.error("Failed to accept invite:", e);
        } finally {
            setProcessingNotif(null);
        }
    };

    const declineInvite = async (notifId: string) => {
        setProcessingNotif(notifId);
        try {
            const jwt = await getJwt();
            await fetch(`/api/notifications/${notifId}`, {
                method: "DELETE",
                headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
            });
            setNotifications((prev) => prev.map((n) => n.id === notifId ? { ...n, is_read: true } : n));
        } catch (e) {
            console.error("Failed to decline invite:", e);
        } finally {
            setProcessingNotif(null);
        }
    };
    // ────────────────────────────────────────────────────────────────────────

    // Determine if sidebar should be minimized
    const isAssetPage = pathname?.includes("/projects/") && pathname?.includes("/assets/");
    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        if (isAssetPage) {
            setIsMinimized(true);
        } else {
            setIsMinimized(false);
        }
    }, [isAssetPage]);

    useEffect(() => {
        const fetchUser = async () => {
            const currentUser = await getUser();
            if (currentUser) {
                setUser(currentUser);

                // Check if they came from an invite
                const pendingInviteToken = localStorage.getItem("pendingInviteToken");
                if (pendingInviteToken) {
                    try {
                        const jwt = await getJwt();
                        const res = await fetch("/api/invites/accept", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                ...(jwt && { "Authorization": `Bearer ${jwt}` })
                            },
                            body: JSON.stringify({ token: pendingInviteToken })
                        });

                        if (res.ok) {
                            const data = await res.json();
                            localStorage.removeItem("pendingInviteToken");
                            router.push(`/dashboard/projects/${data.project_id}`);
                        } else if (res.status === 403) {
                            // Email mismatch - redirect to the specialized accept page to show the mismatch UI
                            // Keep the token in localStorage so it can be picked up after a successful switch
                            router.push(`/invitations/accept?token=${pendingInviteToken}`);
                        } else {
                            // Other error (e.g. 404), clear it
                            localStorage.removeItem("pendingInviteToken");
                        }
                    } catch (error) {
                        console.error("Failed to accept pending invite", error);
                        localStorage.removeItem("pendingInviteToken");
                    }
                }
            } else {
                router.push("/login");
            }
        };
        fetchUser();
    }, [router]);

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // Fetch notifications on mount & subscribe to real-time inserts
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Polling fallback: refetch every 30 s in case Realtime isn't enabled
    useEffect(() => {
        const interval = setInterval(fetchNotifications, 30_000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Tab-visibility fallback: refetch whenever the user switches back to this tab
    useEffect(() => {
        const onVisible = () => {
            if (!document.hidden) fetchNotifications();
        };
        document.addEventListener("visibilitychange", onVisible);
        return () => document.removeEventListener("visibilitychange", onVisible);
    }, [fetchNotifications]);

    useEffect(() => {
        let channel: any = null;
        let isMounted = true;

        const setupChannel = async () => {
            const { data } = await supabase.auth.getUser();
            const userId = data.user?.id;
            if (!userId || !isMounted) return;

            // Append Date.now() so each mount gets a truly fresh channel.
            // The Supabase browser client is a singleton — reusing the same
            // channel name on a re-mount returns the already-subscribed channel
            // and throws "cannot add callbacks after subscribe()".
            channel = supabase
                .channel(`notifications-${userId}-${Date.now()}`)
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "notifications",
                        filter: `user_id=eq.${userId}`,
                    },
                    (payload) => {
                        setNotifications((prev) => [payload.new as any, ...prev]);
                    }
                )
                .subscribe();
        };

        setupChannel();

        return () => {
            isMounted = false;
            if (channel) {
                supabase.removeChannel(channel);
                channel = null;
            }
        };
    }, []);

    // Close notification panel on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await logout();
        router.push("/");
    };

    const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
    const userInitial = userName.charAt(0).toUpperCase();
    const userRole = user?.user_metadata?.prefs?.role || "Member";
    const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || user?.user_metadata?.prefs?.avatar_url || user?.user_metadata?.prefs?.picture;

    return (
        <div className="flex h-screen w-full bg-[#0b0c10] text-slate-200 font-sans overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 right-0 md:left-0 md:right-auto z-50 ${isMinimized ? "md:w-20" : "md:w-64"} bg-[#12131a] flex flex-col border-l md:border-l-0 md:border-r border-[#1f202b] transform transition-all duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
                {/* Logo Area */}
                <div className={`p-6 flex items-center ${isMinimized ? "justify-center" : "gap-3"}`}>
                    <div className="w-9 h-9 rounded-xl bg-purple-600/10 flex items-center justify-center overflow-hidden border border-purple-500/20 shrink-0">
                        <img
                            src="/approva-logo.svg"
                            alt="Approva Logo"
                            className="w-6 h-6 object-contain"
                        />
                    </div>
                    {!isMinimized && (
                        <div className="animate-fade-in whitespace-nowrap overflow-hidden">
                            <h1 className="font-bold text-lg text-white leading-tight">
                                Hello {userName}
                            </h1>
                            <p className="text-xs text-slate-400">Asset Approval</p>
                        </div>
                    )}
                </div>



                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                    {[
                        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
                        { name: "Projects", href: "/dashboard/projects", icon: FolderOpen },
                        { name: "Assets", href: "/dashboard/assets", icon: FolderOpen },
                        { name: "Activity", href: "/dashboard/activity", icon: Activity },
                    ].map((link) => {
                        const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname?.startsWith(link.href));
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center ${isMinimized ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? "bg-[#1e1f2b] text-white"
                                    : "text-slate-400 hover:bg-[#1e1f2b] hover:text-white"
                                    }`}
                                title={isMinimized ? link.name : ""}
                            >
                                <link.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-purple-400" : ""}`} />
                                {!isMinimized && <span className="animate-fade-in whitespace-nowrap overflow-hidden">{link.name}</span>}
                            </Link>
                        );
                    })}

                    <div className={`pt-8 pb-2 ${isMinimized ? "flex justify-center" : ""}`}>
                        <div className={`px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider ${isMinimized ? "w-8 border-b border-slate-700/50 pb-1 text-[0px]" : ""}`}>
                            {!isMinimized && "System"}
                        </div>
                    </div>
                    {[
                        { name: "Settings", href: "/dashboard/profile", icon: Settings },
                        { name: "Help & Support", href: "/dashboard/support", icon: HelpCircle },
                    ].map((link) => {
                        const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname?.startsWith(link.href));
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center ${isMinimized ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? "bg-[#1e1f2b] text-white"
                                    : "text-slate-400 hover:bg-[#1e1f2b] hover:text-white"
                                    }`}
                                title={isMinimized ? link.name : ""}
                            >
                                <link.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-purple-400" : ""}`} />
                                {!isMinimized && <span className="animate-fade-in whitespace-nowrap overflow-hidden">{link.name}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t border-[#1f202b] relative" ref={dropdownRef}>
                    <div
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`flex items-center ${isMinimized ? "justify-center" : "gap-3"} p-2 rounded-lg transition-colors cursor-pointer ${isDropdownOpen ? 'bg-[#1e1f2b]' : 'hover:bg-[#1e1f2b]'}`}
                    >
                        <div className="w-9 h-9 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center font-semibold text-sm shrink-0 overflow-hidden">
                            {userAvatar ? (
                                <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                            ) : (
                                userInitial
                            )}
                        </div>
                        {!isMinimized && (
                            <div className="flex-1 min-w-0 animate-fade-in overflow-hidden">
                                <h3 className="text-sm font-medium text-white truncate">
                                    {userName}
                                </h3>
                                <p className="text-xs text-slate-400 truncate">{userRole}</p>
                            </div>
                        )}
                        {!isMinimized && <Settings className={`w-4 h-4 text-slate-500 transition-transform duration-200 shrink-0 ${isDropdownOpen ? 'rotate-90' : ''}`} />}
                    </div>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute bottom-full left-4 right-4 mb-2 bg-[#1a1b23] border border-[#2a2b36] rounded-xl shadow-xl overflow-hidden z-50 py-1">
                            <div className="px-3 py-3 border-b border-[#2a2b36] mb-1 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center font-semibold text-base shrink-0 overflow-hidden">
                                    {userAvatar ? (
                                        <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                                    ) : (
                                        userInitial
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{userName}</p>
                                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                                </div>
                            </div>
                            <Link
                                href="/dashboard/profile"
                                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-[#2a2b36] hover:text-white transition-colors"
                                onClick={() => setIsDropdownOpen(false)}
                            >
                                <User className="w-4 h-4" />
                                Profile Page
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors text-left"
                            >
                                <LogOut className="w-4 h-4" />
                                Log out
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col w-full min-w-0 overflow-hidden">
                {/* Desktop Top Header – hidden on asset detail pages */}
                {!isAssetPage && (
                    <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-[#1f202b] bg-[#0b0c10]/50 backdrop-blur-md sticky top-0 z-40 shrink-0">
                        <div className="flex items-center gap-4 flex-1">
                            {/* Search bar */}
                            <div className="h-9 w-64 bg-[#12131a] border border-[#1f202b] rounded-xl flex items-center px-3 gap-2 text-slate-500 italic text-sm">
                                <Activity className="w-4 h-4" />
                                Search projects or assets...
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* ── Bell Icon ── */}
                            <div className="relative" ref={notifRef}>
                                <button
                                    id="notification-bell-btn"
                                    onClick={() => {
                                        setIsNotifOpen((v) => !v);
                                        if (!isNotifOpen) fetchNotifications();
                                    }}
                                    className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#1e1f2b] text-slate-400 hover:text-white transition-colors"
                                    title="Notifications"
                                >
                                    <Bell className="w-5 h-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-4.5 h-4.5 min-w-[18px] min-h-[18px] bg-purple-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                                            {unreadCount > 9 ? "9+" : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {/* Notification Dropdown Panel */}
                                {isNotifOpen && (
                                    <div className="absolute right-0 top-12 w-96 max-h-[520px] bg-[#12131a] border border-[#1f202b] rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
                                        {/* Header */}
                                        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f202b] shrink-0">
                                            <div className="flex items-center gap-2">
                                                <Bell className="w-4 h-4 text-purple-400" />
                                                <span className="text-sm font-semibold text-white">Notifications</span>
                                                {unreadCount > 0 && (
                                                    <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] font-bold rounded-full border border-purple-500/30">
                                                        {unreadCount} new
                                                    </span>
                                                )}
                                            </div>
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={markAllRead}
                                                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-purple-400 transition-colors"
                                                >
                                                    <CheckCheck className="w-3.5 h-3.5" />
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>

                                        {/* Notifications list */}
                                        <div className="overflow-y-auto flex-1">
                                            {notifLoading ? (
                                                <div className="flex items-center justify-center py-12 text-slate-500 text-sm animate-pulse">
                                                    Loading...
                                                </div>
                                            ) : notifications.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-sm gap-2">
                                                    <Bell className="w-8 h-8 opacity-30" />
                                                    <span>No notifications yet</span>
                                                </div>
                                            ) : (
                                                notifications.map((notif) => {
                                                    const iconMap: Record<string, React.ReactNode> = {
                                                        mention: <MessageSquare className="w-4 h-4 text-blue-400" />,
                                                        project_invite: <UserPlus className="w-4 h-4 text-purple-400" />,
                                                        approval: <ThumbsUp className="w-4 h-4 text-emerald-400" />,
                                                        rejection: <ThumbsDown className="w-4 h-4 text-rose-400" />,
                                                        changes_requested: <GitPullRequestDraft className="w-4 h-4 text-amber-400" />,
                                                        comment: <MessageSquare className="w-4 h-4 text-blue-400" />,
                                                    };
                                                    const isInvite = notif.type === "project_invite" && !notif.is_read;
                                                    const isProcessing = processingNotif === notif.id;

                                                    return (
                                                        <div
                                                            key={notif.id}
                                                            className={`px-4 py-3 border-b border-[#1a1b23] last:border-0 transition-colors ${
                                                                notif.is_read ? "opacity-60" : "bg-purple-500/5"
                                                            }`}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-[#1e1f2b] flex items-center justify-center shrink-0 mt-0.5">
                                                                    {iconMap[notif.type] ?? <Bell className="w-4 h-4 text-slate-400" />}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <p className="text-sm font-semibold text-white truncate">{notif.title}</p>
                                                                        {!notif.is_read && (
                                                                            <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed line-clamp-2">{notif.message}</p>
                                                                    <p className="text-[10px] text-slate-600 mt-1">
                                                                        {new Date(notif.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                                                                    </p>

                                                                    {/* Accept/Decline for invite notifications */}
                                                                    {isInvite && (
                                                                        <div className="flex gap-2 mt-2">
                                                                            <button
                                                                                disabled={isProcessing}
                                                                                onClick={() => acceptInvite(notif.id)}
                                                                                className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                                                                            >
                                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                                                {isProcessing ? "..." : "Accept"}
                                                                            </button>
                                                                            <button
                                                                                disabled={isProcessing}
                                                                                onClick={() => declineInvite(notif.id)}
                                                                                className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
                                                                            >
                                                                                <XCircle className="w-3.5 h-3.5" />
                                                                                {isProcessing ? "..." : "Decline"}
                                                                            </button>
                                                                        </div>
                                                                    )}

                                                                    {/* Click to navigate for non-invite notifications with a link */}
                                                                    {!isInvite && notif.link && !notif.is_read && (
                                                                        <Link
                                                                            href={notif.link}
                                                                            onClick={() => { markOneRead(notif.id); setIsNotifOpen(false); }}
                                                                            className="inline-block mt-1.5 text-[11px] text-purple-400 hover:text-purple-300 hover:underline"
                                                                        >
                                                                            View →
                                                                        </Link>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>
                )}


                {/* Mobile Header – hidden on asset detail pages */}
                {!isAssetPage && (
                    <header className="md:hidden flex items-center justify-between p-4 border-b border-[#1f202b] bg-[#12131a] shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-600/10 flex items-center justify-center overflow-hidden">
                                <img src="/approva-logo.svg" alt="Approva Logo" className="w-5 h-5 object-contain" />
                            </div>
                            <h1 className="font-bold text-lg text-white leading-tight truncate max-w-[120px]">Hello {userName}</h1>
                        </div>
                        <div className="flex items-center gap-2">

                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="p-2 -mr-2 text-slate-400 hover:text-white"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </header>
                )}

                <div className="flex-1 overflow-y-auto">
                    <div className="h-full px-4 py-4 md:px-8 md:py-6">{children}</div>
                </div>
            </main>
        </div>
    );
}
