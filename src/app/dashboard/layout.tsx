"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getUser, logout, getJwt } from "@/lib/auth/auth";
import {
    LayoutDashboard,
    FolderOpen,
    CheckCircle,
    Activity,
    Settings,
    HelpCircle,
    User,
    LogOut,
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

    const userName = user?.name || user?.email?.split("@")[0] || "User";
    const userInitial = userName.charAt(0).toUpperCase();
    const userRole = user?.prefs?.role || "Member";
    const userAvatar = user?.prefs?.avatar_url || user?.prefs?.picture;

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
            <aside className={`fixed inset-y-0 right-0 md:left-0 md:right-auto z-50 w-64 bg-[#12131a] flex flex-col border-l md:border-l-0 md:border-r border-[#1f202b] transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
                {/* Logo Area */}
                <div className="p-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            className="w-5 h-5 text-white"
                            strokeWidth="2"
                        >
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="font-bold text-lg text-white leading-tight">
                            ApproveFlow
                        </h1>
                        <p className="text-xs text-slate-400">Asset Approval</p>
                    </div>
                </div>



                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                    {[
                        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
                        { name: "Projects", href: "/dashboard/projects", icon: FolderOpen },
                        { name: "Assets", href: "/dashboard/assets", icon: FolderOpen },
                        { name: "Approvals", href: "/dashboard/approvals", icon: CheckCircle },
                        { name: "Activity", href: "/dashboard/activity", icon: Activity },
                    ].map((link) => {
                        const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname?.startsWith(link.href));
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? "bg-[#1e1f2b] text-white"
                                    : "text-slate-400 hover:bg-[#1e1f2b] hover:text-white"
                                    }`}
                            >
                                <link.icon className={`w-4 h-4 ${isActive ? "text-purple-400" : ""}`} />
                                {link.name}
                            </Link>
                        );
                    })}

                    <div className="pt-8 pb-2">
                        <div className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            System
                        </div>
                    </div>
                    {[
                        { name: "Settings", href: "/dashboard/settings", icon: Settings },
                        { name: "Help & Support", href: "/dashboard/support", icon: HelpCircle },
                    ].map((link) => {
                        const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname?.startsWith(link.href));
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? "bg-[#1e1f2b] text-white"
                                    : "text-slate-400 hover:bg-[#1e1f2b] hover:text-white"
                                    }`}
                            >
                                <link.icon className={`w-4 h-4 ${isActive ? "text-purple-400" : ""}`} />
                                {link.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t border-[#1f202b] relative" ref={dropdownRef}>
                    <div
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer ${isDropdownOpen ? 'bg-[#1e1f2b]' : 'hover:bg-[#1e1f2b]'}`}
                    >
                        <div className="w-9 h-9 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center font-semibold text-sm shrink-0 overflow-hidden">
                            {userAvatar ? (
                                <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                            ) : (
                                userInitial
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-white truncate">
                                {userName}
                            </h3>
                            <p className="text-xs text-slate-400 truncate">{userRole}</p>
                        </div>
                        <Settings className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-90' : ''}`} />
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
                                href="/dashboard/settings"
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
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between p-4 border-b border-[#1f202b] bg-[#12131a] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 text-white" strokeWidth="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <h1 className="font-bold text-lg text-white leading-tight">ApproveFlow</h1>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 -mr-2 text-slate-400 hover:text-white"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto">
                    <div className="h-full px-4 py-4 md:px-8 md:py-6">{children}</div>
                </div>
            </main>
        </div>
    );
}
