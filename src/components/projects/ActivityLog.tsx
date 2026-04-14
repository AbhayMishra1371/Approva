"use client";

import { useState, useEffect } from "react";
import {
    Activity,
    UserPlus,
    MessageSquare,
    CheckCircle,
    UploadCloud,
    Pin,
    Clock,
    User,
    FolderOpen,
    IdCard
} from "lucide-react";
import { createBrowserClient } from "@/lib/appwrite/client";

interface ActivityLogProps {
    projectId?: string;
    assetId?: string;
}

type LogEntry = {
    $id: string;
    project_id: string;
    project_name?: string;
    user_id: string;
    user_email: string;
    user_name?: string;
    action: string;
    entity_type: string;
    entity_id: string;
    metadata: string;
    $createdAt: string;
};

export function ActivityLog({ projectId, assetId }: ActivityLogProps) {

    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLogs = async () => {

            setIsLoading(true);
            setError(null);
            try {
                const { account } = createBrowserClient();
                const { jwt } = await account.createJWT();

                // If no projectId, we fetch from the global activity API
                const url = projectId
                    ? `/api/projects/${projectId}/activity${assetId ? `?assetId=${assetId}` : ''}`
                    : '/api/activity';

                const fetchRes = await fetch(url, {
                    headers: {
                        "Authorization": `Bearer ${jwt}`
                    }
                });

                if (!fetchRes.ok) {
                    const errorData = await fetchRes.json();
                    throw new Error(errorData.error || "Failed to fetch activity logs");
                }

                const data = await fetchRes.json();

                setLogs(data.documents as unknown as LogEntry[]);
            } catch (err: any) {
                console.error("DEBUG: Error fetching activity logs:", err);
                setError(err.message || "Failed to fetch activity logs");
            } finally {
                setIsLoading(false);
            }
        };

        fetchLogs();
    }, [projectId, assetId]);

    const formatRelativeTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

            if (diffInSeconds < 60) return "just now";
            if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
            if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
            if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
            return date.toLocaleDateString();
        } catch (e) {
            return "some time ago";
        }
    };

    const getActionDetails = (log: LogEntry) => {
        let metadata: any = {};
        if (log.metadata) {
            try {
                metadata = typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata;
            } catch (e) {
                console.warn("Failed to parse metadata", log.metadata);
            }
        }

        const m = metadata;

        switch (log.action) {
            case "created_project":
                return {
                    icon: <IdCard className="w-4 h-4 text-pink-400" />,
                    text: `created the project: ${m.project_name || "a new project"}`,
                    color: "bg-pink-500/10 border-pink-500/20"
                };
            case "invited_user":
                return {
                    icon: <UserPlus className="w-4 h-4 text-blue-400" />,
                    text: `invited ${m.invited_email || "a user"} to the project`,
                    color: "bg-blue-500/10 border-blue-500/20"
                };
            case "added_annotation":
                return {
                    icon: <Pin className="w-4 h-4 text-purple-400" />,
                    text: `added an annotation on ${m.file_name || "an asset"}`,
                    color: "bg-purple-500/10 border-purple-500/20"
                };
            case "added_comment":
                return {
                    icon: <MessageSquare className="w-4 h-4 text-indigo-400" />,
                    text: `commented on ${m.file_name || "an asset"}`,
                    color: "bg-indigo-500/10 border-indigo-500/20"
                };
            case "approved_asset":
                return {
                    icon: <CheckCircle className="w-4 h-4 text-emerald-400" />,
                    text: `approved the asset ${m.file_name || ""}`,
                    color: "bg-emerald-500/10 border-emerald-500/20"
                };
            case "uploaded_asset":
            case "upload":
                return {
                    icon: <UploadCloud className="w-4 h-4 text-amber-400" />,
                    text: `uploaded a new asset: ${m.file_name || ""}`,
                    color: "bg-amber-500/10 border-amber-500/20"
                };
            case "uploaded_new_version":
                return {
                    icon: <UploadCloud className="w-4 h-4 text-blue-400" />,
                    text: `uploaded a new version of ${m.file_name || ""}${m.version ? ` (v${m.version})` : ""}`,
                    color: "bg-blue-500/10 border-blue-500/20"
                };
            default:
                return {
                    icon: <Activity className="w-4 h-4 text-slate-400" />,
                    text: `${log.action ? log.action.replace("_", " ") : "performed an action"}`,
                    color: "bg-slate-500/10 border-slate-500/20"
                };
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col gap-4 p-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-[#1a1c26] rounded-xl animate-pulse border border-[#2a2b36]" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
                <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-4 border border-rose-500/20">
                    <Activity className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-white font-bold mb-1">Failed to load activity</h3>
                <p className="text-sm max-w-xs mb-4">{error}</p>
                <p className="text-xs text-slate-500">
                    If this persists, verify the "activity_logs" collection has an index on "project_id".
                </p>
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 bg-[#1e1f2b] rounded-2xl flex items-center justify-center mb-4">
                    <Activity className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-white font-bold mb-1">No activity yet</h3>
                <p className="text-sm text-slate-400 max-w-xs">
                    {assetId
                        ? "Actions related to this asset will appear here."
                        : "Actions taken in this project will appear here in chronological order."}
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 p-6 max-w-4xl mx-auto w-full">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                {assetId ? "Asset Activity" : projectId ? "Project Activity" : "Global Activity Stream"}
            </h2>

            <div className="relative space-y-4">
                {/* Timeline Line */}
                <div className="absolute left-[19px] top-2 bottom-2 w-px bg-slate-800 hidden sm:block" />

                {logs.map((log) => {
                    const details = getActionDetails(log);
                    const userName = log.user_name || (log.user_email ? log.user_email.split('@')[0] : (log.user_id || "Someone"));

                    return (
                        <div key={log.$id} className="relative flex items-start gap-4 group">
                            {/* Icon Circle */}
                            <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border ${details.color} bg-[#12131a] z-10 sm:shadow-lg transition-transform group-hover:scale-110`}>
                                {details.icon}
                            </div>

                            {/* Content Card */}
                            <div className="flex-1 bg-[#1a1c26] border border-[#2a2b36] rounded-xl p-4 hover:border-slate-700 transition-colors shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-x-2 gap-y-1">
                                        <span className="text-sm font-bold text-white flex items-center gap-1.5">
                                            <User className="w-3 h-3 text-slate-500" />
                                            {userName}
                                        </span>
                                        <span className="text-sm text-slate-400 font-medium">
                                            {details.text}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {log.project_name && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-wider">
                                                <FolderOpen className="w-2.5 h-2.5" />
                                                {log.project_name}
                                            </span>
                                        )}
                                        <span className="text-[10px] sm:text-xs font-medium text-slate-500 flex items-center gap-1.5 whitespace-nowrap">
                                            <Clock className="w-3 h-3" />
                                            {formatRelativeTime(log.$createdAt)}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-1">
                                    <span className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">
                                        {log.entity_type}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
