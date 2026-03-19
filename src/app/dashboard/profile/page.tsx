"use client";

import React, { useState, useEffect } from "react";
import {
    User,
    Mail,
    Calendar,
    IdCard,
    Camera,
    Edit2,
    Check,
    X,
    Upload,
    MessageSquare,
    CheckCircle2,
    Clock,
    UserPlus
} from "lucide-react";
import { getUser, updateName, getJwt } from "@/lib/auth/auth";
import { toast } from "sonner";

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const currentUser = await getUser();
                if (currentUser) {
                    setUser(currentUser);
                    setNewName(currentUser.name);

                    // Fetch user activity
                    const jwt = await getJwt();
                    const res = await fetch(`/api/activity?userId=${currentUser.$id}`, {
                        headers: { "Authorization": `Bearer ${jwt}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setActivities(data.documents);
                    }
                }
            } catch (error) {
                console.error("Profile Fetch Error:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSaveName = async () => {
        if (!newName.trim()) return;
        setIsUpdating(true);
        const { success, error } = await updateName(newName);
        if (success) {
            setUser({ ...user, name: newName });
            setIsEditingName(false);
            toast.success("Name updated successfully");
        } else {
            toast.error(error?.message || "Failed to update name");
        }
        setIsUpdating(false);
    };

    const handleAvatarChange = () => {
        toast.info("Avatar storage implementation coming soon!");
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });
    };

    const formatFullDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderActivityDescription = (activity: any) => {
        let metadata: any = {};
        try {
            metadata = typeof activity.metadata === 'string' ? JSON.parse(activity.metadata) : (activity.metadata || {});
        } catch (e) {
            console.warn("Failed to parse metadata", activity.metadata);
        }

        const fileName = metadata.file_name ? <span className="text-purple-400 font-bold">{metadata.file_name}</span> : "an asset";
        const projectName = metadata.project_name ? <span className="text-purple-400 font-bold">{metadata.project_name}</span> : "a project";
        const email = metadata.invited_email ? <span className="text-purple-400 font-bold">{metadata.invited_email}</span> : "a collaborator";
        const version = metadata.version ? ` (v${metadata.version})` : "";

        switch (activity.action) {
            case "uploaded_asset":
                return <span>uploaded {fileName}</span>;
            case "uploaded_new_version":
                return <span>uploaded a new version of {fileName}{version}</span>;
            case "added_annotation":
                return <span>added an annotation on {fileName}</span>;
            case "added_comment":
                return <span>commented on {fileName}</span>;
            case "approved_asset":
                return <span>approved {fileName}</span>;
            case "invited_user":
                return <span>invited {email} to the project</span>;
            case "created_project":
                return <span>created project {projectName}</span>;
            case "upload": // Fallback for old logs
                return <span>uploaded {fileName}</span>;
            case "comment": // Fallback for old logs
                return <span>commented on {fileName}</span>;
            case "approval": // Fallback for old logs
                return <span>approved {fileName}</span>;
            default:
                return <span>{activity.description || activity.action.replace('_', ' ')}</span>;
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                <p className="text-slate-400 font-medium">Loading your profile...</p>
            </div>
        );
    }

    if (!user) return null;

    const joinedDate = user.$createdAt ? formatDate(user.$createdAt) : "N/A";
    const userRole = user?.prefs?.role || "Member";
    const userAvatar = user?.prefs?.avatar_url || user?.prefs?.picture;
    const userInitial = user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase();

    return (
        <div className="h-full flex flex-col overflow-hidden pb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="mb-6 shrink-0">
                <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">Your Profile</h1>
                <p className="text-slate-400 text-sm">Manage your account settings and view your recent activity.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">
                {/* Left Column: Basic & Account Info */}
                <div className="lg:col-span-4 space-y-6 overflow-y-auto custom-scrollbar pr-2 lg:overflow-visible">
                    {/* Profile Summary Card */}
                    <div className="bg-[#12131a] border border-[#1f202b] rounded-2xl p-8 flex flex-col items-center text-center shadow-xl relative overflow-hidden group mb-4">
                        {/* Decorative Background */}
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-purple-500/10 to-transparent -z-10"></div>

                        <div className="relative mb-6">
                            <div className="w-28 h-28 rounded-full bg-[#1e1f2b] border-4 border-[#0b0c10] shadow-2xl flex items-center justify-center overflow-hidden">
                                {userAvatar ? (
                                    <img src={userAvatar} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl font-bold text-purple-400">{userInitial}</span>
                                )}
                            </div>
                            <button
                                onClick={handleAvatarChange}
                                className="absolute bottom-1 right-1 bg-purple-600 p-2 rounded-full text-white shadow-lg hover:bg-purple-700 transition-all hover:scale-110 active:scale-95"
                                title="Change Avatar"
                            >
                                <Camera className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="w-full space-y-4">
                            <div className="space-y-1">
                                {isEditingName ? (
                                    <div className="flex items-center gap-2 justify-center">
                                        <input
                                            type="text"
                                            autoFocus
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                                            className="bg-[#1e1f2b] border border-[#2a2b36] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 w-full max-w-[200px]"
                                        />
                                        <button onClick={handleSaveName} disabled={isUpdating} className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-colors">
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setIsEditingName(false)} className="p-1.5 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500/20 transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 justify-center">
                                        <h2 className="text-2xl font-bold text-white tracking-tight">{user.name}</h2>
                                        <button
                                            onClick={() => setIsEditingName(true)}
                                            className="p-1 text-slate-500 hover:text-white transition-colors"
                                            title="Edit Name"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                                <p className="text-slate-400 text-sm flex items-center justify-center gap-2">
                                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                                    {user.email}
                                </p>
                            </div>

                            <div className="inline-flex items-center px-4 py-1 bg-purple-500/10 text-purple-400 text-xs font-bold rounded-full border border-purple-500/20 uppercase tracking-wider">
                                {userRole}
                            </div>
                        </div>

                        {/* Account Stats / Details */}
                        <div className="w-full mt-10 grid grid-cols-1 gap-4 pt-8 border-t border-[#1f202b]">
                            <div className="flex items-center gap-4 bg-[#1e1f2b]/30 p-4 rounded-xl border border-transparent hover:border-[#2a2b36] hover:bg-[#1e1f2b]/50 transition-all">
                                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                    <IdCard className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div className="text-left min-w-0">
                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none mb-1">Account ID</p>
                                    <p className="text-xs text-slate-300 font-mono truncate">{user.$id}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-[#1e1f2b]/30 p-4 rounded-xl border border-transparent hover:border-[#2a2b36] hover:bg-[#1e1f2b]/50 transition-all">
                                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-amber-400" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none mb-1">Joined</p>
                                    <p className="text-xs text-slate-300 font-medium">{joinedDate}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8 flex flex-col min-h-0 pb-4">
                    <div className="bg-[#12131a] border border-[#1f202b] rounded-2xl p-8 shadow-xl flex flex-col h-full min-h-0 overflow-hidden mb-4">
                        <div className="flex items-center justify-between mb-8 shrink-0">
                            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                <ActivityIcon className="w-6 h-6 text-purple-500" />
                                My Activity Log
                            </h3>
                            <span className="text-xs text-slate-500 bg-[#1e1f2b] px-3 py-1 rounded-full border border-[#2a2b36]">
                                {activities.length} recent actions
                            </span>
                        </div>

                        {activities.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-[#1e1f2b] flex items-center justify-center">
                                    <Clock className="w-8 h-8 text-slate-600" />
                                </div>
                                <div className="max-w-xs">
                                    <p className="text-white font-bold text-lg">No activity yet</p>
                                    <p className="text-slate-400 text-sm mt-1">Start uploading files or approving assets to see your history here.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar scroll-smooth">
                                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:w-0.5 before:-z-10 before:bg-[#1f202b]">
                                    {activities.map((activity) => (
                                        <div key={activity.$id} className="group relative flex gap-6 items-start pb-4">
                                            <div className={`mt-1.5 w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 border-4 border-[#12131a] ${getActivityColor(activity.action)} shadow-lg transition-transform group-hover:scale-110`}>
                                                {getActivityIcon(activity.action)}
                                            </div>
                                            
                                            <div className="flex-1 bg-[#1e1f2b]/40 border border-[#2a2b36]/40 p-5 rounded-2xl hover:bg-[#1e1f2b]/80 hover:border-purple-500/20 transition-all group-hover:shadow-lg group-hover:-translate-y-1">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                                    <div className="text-sm text-slate-200 leading-relaxed">
                                                        <span className="text-white font-bold">You</span> {renderActivityDescription(activity)}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap bg-[#2a2b36]/50 px-2 py-1 rounded uppercase tracking-wider">
                                                        {activity.project_name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                        <Clock className="w-3 h-3" />
                                                        {formatFullDate(activity.$createdAt)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper components for Activity
function ActivityIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
    );
}

function getActivityIcon(action: string) {
    if (action.includes('upload')) return <Upload className="w-4 h-4" />;
    if (action.includes('comment')) return <MessageSquare className="w-4 h-4" />;
    if (action.includes('annotation')) return <Edit2 className="w-4 h-4" />;
    if (action.includes('approve')) return <CheckCircle2 className="w-4 h-4" />;
    if (action.includes('invite')) return <UserPlus className="w-4 h-4" />;
    if (action.includes('project')) return <IdCard className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
}

function getActivityColor(action: string) {
    if (action.includes('upload')) return "bg-blue-500/20 text-blue-400";
    if (action.includes('comment')) return "bg-purple-500/20 text-purple-400";
    if (action.includes('annotation')) return "bg-indigo-500/20 text-indigo-400";
    if (action.includes('approve')) return "bg-emerald-500/20 text-emerald-400";
    if (action.includes('invite')) return "bg-amber-500/20 text-amber-400";
    if (action.includes('project')) return "bg-pink-500/20 text-pink-400";
    return "bg-slate-500/20 text-slate-400";
}
