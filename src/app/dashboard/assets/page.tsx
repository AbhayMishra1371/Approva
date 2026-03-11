"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    FileText,
    Image as ImageIcon,
    Video,
    File as FileIcon,
    Calendar,
    FolderGit2,
    Loader2
} from "lucide-react";
import { createBrowserClient } from "@/lib/appwrite/client";

interface Asset {
    id: string;
    file_name: string;
    file_type: string;
    size: number;
    created_at: string;
    version: string;
    status: string;
    url: string;
    project_id: string;
    project_name: string;
}

export default function AssetsPage() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        try {
            const { account } = createBrowserClient();
            const { jwt } = await account.createJWT();
            const res = await fetch("/api/assets", {
                headers: { "Authorization": `Bearer ${jwt}` }
            });

            if (res.ok) {
                const data = await res.json();
                setAssets(data.assets || []);
            } else {
                console.error("Failed to fetch assets");
            }
        } catch (err) {
            console.error("Error fetching assets:", err instanceof Error ? err.message : err);
        } finally {
            setIsLoading(false);
        }
    };

    const formatBytes = (bytes: number, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-purple-400" />;
        if (type.startsWith('video/')) return <Video className="w-8 h-8 text-rose-400" />;
        if (type.includes('pdf') || type.includes('document')) return <FileText className="w-8 h-8 text-blue-400" />;
        return <FileIcon className="w-8 h-8 text-slate-400" />;
    };

    return (
        <div className="flex flex-col gap-8 w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">All Assets</h1>
                    <p className="text-slate-400">
                        View all assets uploaded across your projects.
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                </div>
            ) : assets.length === 0 ? (
                <div className="bg-[#12131a] border border-[#1f202b] rounded-xl p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-[#1e1f2b] rounded-2xl flex items-center justify-center mb-4">
                        <ImageIcon className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No assets found</h3>
                    <p className="text-slate-400 max-w-sm">
                        You don't have any uploaded assets across your projects yet.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {assets.map((asset) => (
                        <Link key={asset.id} href={`/dashboard/projects/${asset.project_id}/assets/${asset.id}`}>
                            <div className="bg-[#1e1f2b] border border-[#2a2b36] hover:border-purple-500/50 rounded-xl overflow-hidden group cursor-pointer transition-all hover:shadow-lg hover:shadow-purple-500/10 h-full flex flex-col">
                                <div className="aspect-video bg-[#12131a] border-b border-[#2a2b36] flex items-center justify-center relative overflow-hidden">
                                    {asset.file_type.startsWith('image/') && asset.url ? (
                                        <img src={asset.url} alt={asset.file_name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                    ) : (
                                        getFileIcon(asset.file_type)
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#1e1f2b]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="p-4 flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="text-white font-medium text-sm truncate pr-4" title={asset.file_name}>
                                                {asset.file_name}
                                            </h3>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                                                {asset.version}
                                            </span>
                                        </div>
                                        <div className="flex items-center text-xs text-slate-400 mb-3 gap-1.5 truncate">
                                            <FolderGit2 className="w-3.5 h-3.5 flex-shrink-0" />
                                            <span className="truncate" title={asset.project_name}>{asset.project_name}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                            <div className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border 
                                                ${asset.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                    asset.status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                                        asset.status === 'changes_requested' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                            'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                                                {(!asset.status || asset.status === 'pending') ? 'IN REVIEW' : asset.status.replace('_', ' ')}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                            <span>{formatBytes(asset.size)}</span>
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{new Date(asset.created_at || (asset as any).$createdAt).toLocaleString(undefined, {
                                                    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                                                })}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
