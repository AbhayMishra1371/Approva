"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Image as ImageIcon,
    Users,
    Activity,
    Settings,
    UserPlus,
    Trash2,
    CheckCircle,
    X,
    FileText,
    Video,
    FileIcon,
    Download,
    Maximize2,
    UploadCloud
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { AssetUpload } from "@/components/projects/AssetUpload";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { ActivityLog } from "@/components/projects/ActivityLog";
import { toast } from "sonner";
import { getJwt } from "@/lib/auth/auth";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Modularized imports
import { Asset } from "@/types";
import { TabButton } from "@/components/projects/TabButton";
import { CollaboratorsTab } from "@/components/projects/CollaboratorsTab";

export default function ProjectDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [activeTab, setActiveTab] = useState("assets");
    const router = useRouter();
    const [role, setRole] = useState<'owner' | 'admin' | 'reviewer' | 'viewer' | null>(null);
    const [isLoadingRole, setIsLoadingRole] = useState(true);

    // Assets State
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoadingAssets, setIsLoadingAssets] = useState(true);

    // Invite Modal State
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("reviewer");
    const [isInviting, setIsInviting] = useState(false);

    useEffect(() => {
        const fetchRole = async () => {
            try {
                // Use hardened getJwt helper
                const jwt = await getJwt();
                if (!jwt) return;

                const res = await fetch(`/api/projects/collaborators?projectId=${id}`, {
                    headers: { "Authorization": `Bearer ${jwt}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.callerRole) {
                        setRole(data.callerRole as 'owner' | 'admin' | 'reviewer' | 'viewer');
                    }
                }
            } catch (error) {
                console.error("Error fetching user role", error);
            } finally {
                setIsLoadingRole(false);
            }
        };

        fetchRole();
    }, [id]);

    const fetchAssets = async () => {
        setIsLoadingAssets(true);
        try {
            const supabase = createSupabaseClient();
            const { data: assetsData, error } = await supabase
                .from("assets")
                .select("*")
                .eq("project_id", id)
                .eq("is_latest", true)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setAssets((assetsData || []).map((doc: any) => ({
                ...doc,
                size: doc.file_size
            })));
        } catch (error) {
            console.error("Error fetching assets", error);
        } finally {
            setIsLoadingAssets(false);
        }
    };

    useEffect(() => {
        if (activeTab === "assets") {
            fetchAssets();
        }
    }, [id, activeTab]);

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

    const handleDeleteProject = async (projectId: string) => {
        try {
            const jwt = await getJwt();

            const res = await fetch(`/api/projects/${projectId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${jwt}`
                }
            });

            if (res.ok) {
                router.push("/dashboard/projects");
                toast.success("Project deleted successfully");
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to delete project");
            }
        } catch (err) {
            console.error("Error deleting project:", err);
            toast.error("An error occurred while deleting the project.");
        }
    };

    const handleDeleteAsset = async (assetId: string) => {
        try {
            const supabase = createSupabaseClient();
            const { data: assetObj, error: fetchErr } = await supabase
                .from("assets")
                .select("file_path")
                .eq("id", assetId)
                .single();

            if (fetchErr) throw fetchErr;

            if (assetObj?.file_path) {
                try {
                    await supabase.storage
                        .from("assets")
                        .remove([assetObj.file_path]);
                } catch (err) { }
            }

            const { error: deleteErr } = await supabase
                .from("assets")
                .delete()
                .eq("id", assetId);

            if (deleteErr) throw deleteErr;

            fetchAssets();
            toast.success("Asset deleted successfully");
        } catch (err) {
            console.error("Error deleting asset:", err);
            toast.error("An error occurred while deleting the asset.");
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;
        setIsInviting(true);
        try {
            const jwt = await getJwt();
            const res = await fetch("/api/projects/collaborators", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${jwt}`
                },
                body: JSON.stringify({
                    projectId: id,
                    email: inviteEmail,
                    role: inviteRole
                }),
            });

            if (res.ok) {
                setIsInviteModalOpen(false);
                const invitedEmail = inviteEmail; // Store for logging
                setInviteEmail("");
                setInviteRole("reviewer");
                toast.success("Invitation sent successfully!");

                // Create Activity Log
                try {
                    const supabase = createSupabaseClient();
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        await supabase
                            .from("activity_logs")
                            .insert({
                                project_id: id,
                                user_id: user.id,
                                user_email: user.email || "",
                                action: "invited_user",
                                entity_type: "invite",
                                entity_id: id,
                                metadata: JSON.stringify({ invited_email: invitedEmail })
                            });
                    }
                } catch (logError) {
                    console.error("Failed to log invite activity:", logError);
                }
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to send invitation.");
            }
        } catch (err) {
            console.error("Error during project invitation:", err instanceof Error ? err.message : err);
            toast.error("An error occurred while sending the invitation.");
        } finally {
            setIsInviting(false);
        }
    };

    const handleDownload = (fileUrl: string) => {
        if (!fileUrl) return;
        try {
            const link = document.createElement('a');
            link.href = fileUrl;
            link.target = '_blank';
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Download error:", error);
            toast.error("Failed to start download.");
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full h-full pb-8">
            {/* Header Area */}
            <div>
                <Link
                    href="/dashboard/projects"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 text-sm font-medium group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Projects
                </Link>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-bold text-white">Project View</h1>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                                Active
                            </span>
                        </div>
                    </div>

                    {/* Role-based Actions */}
                    <div className="flex items-center gap-3">
                        {!isLoadingRole && (role === "owner" || role === "admin") && (
                            <>
                                <button
                                    onClick={() => setIsInviteModalOpen(true)}
                                    className="bg-[#1e1f2b] hover:bg-[#2a2b36] border border-[#2a2b36] text-white rounded-lg px-4 py-2.5 flex items-center gap-2 transition-colors font-medium text-sm"
                                >
                                    <UserPlus className="w-4 h-4 text-purple-400" />
                                    Invite
                                </button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <button className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg px-4 py-2.5 flex items-center gap-2 transition-colors font-medium text-sm">
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-[#12131a] border-[#1f202b] text-white">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete project?</AlertDialogTitle>
                                            <AlertDialogDescription className="text-slate-400">
                                                Are you sure you want to delete this project? This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className="bg-[#1e1f2b] border-[#2a2b36] hover:bg-[#2a2b36] hover:text-white text-slate-300">Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteProject(id)} className="bg-rose-500 hover:bg-rose-600 text-white">Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </>
                        )}
                        {/* Viewers see no action buttons here */}
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-4 sm:gap-6 border-b border-[#1f202b] overflow-x-auto no-scrollbar">
                <TabButton
                    active={activeTab === "assets"}
                    onClick={() => setActiveTab("assets")}
                    icon={<ImageIcon className="w-4 h-4" />}
                    label="Assets & Folders"
                />
                <TabButton
                    active={activeTab === "collaborators"}
                    onClick={() => setActiveTab("collaborators")}
                    icon={<Users className="w-4 h-4" />}
                    label="Collaborators"
                />
                <TabButton
                    active={activeTab === "activity"}
                    onClick={() => setActiveTab("activity")}
                    icon={<Activity className="w-4 h-4" />}
                    label="Activity Log"
                />
                <TabButton
                    active={activeTab === "approved"}
                    onClick={() => setActiveTab("approved")}
                    icon={<CheckCircle className="w-4 h-4" />}
                    label="Approved Assets"
                />
                <TabButton
                    active={activeTab === "settings"}
                    onClick={() => setActiveTab("settings")}
                    icon={<Settings className="w-4 h-4" />}
                    label="Settings"
                />
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-[#12131a] border border-[#1f202b] rounded-xl flex flex-col md:flex-row overflow-hidden min-h-[600px] md:min-h-0">
                {activeTab === "assets" && (
                    <>

                        {/* Asset Grid Placeholder */}
                        <div className="flex-1 p-4 md:p-6 flex flex-col min-w-0 overflow-y-auto">
                            <div className="flex items-center justify-between gap-2 sm:gap-4 mb-6">
                                <h2 className="text-lg font-bold text-white shrink-0">All Assets</h2>
                                <div className="flex gap-2 items-center justify-end flex-1">

                                    {(role === 'owner' || role === 'admin') && (
                                        <button
                                            onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                                            className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 flex items-center gap-1.5 sm:gap-2 transition-colors font-medium text-xs sm:text-sm shadow-lg shadow-purple-500/20 shrink-0"
                                        >
                                            <UploadCloud className="w-4 h-4" />
                                            <span>Upload Asset</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="mb-4 sm:mb-8">
                                {(role === 'owner' || role === 'admin') && (
                                    <AssetUpload projectId={id} onUploadSuccess={fetchAssets} hideWhenIdle={true} />
                                )}
                            </div>

                            {isLoadingAssets ? (
                                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-[#1f202b] rounded-xl bg-[#151720]">
                                    <div className="text-center text-slate-500 animate-pulse">Loading assets...</div>
                                </div>
                            ) : assets.filter(a => a.status !== 'approved').length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {assets.filter(a => a.status !== 'approved').map((asset) => (
                                        <div key={asset.id} className="bg-[#1a1c26] border border-[#2a2b36] rounded-xl overflow-hidden hover:border-purple-500/50 transition-colors group">
                                            <div className="h-32 bg-[#12131a] border-b border-[#2a2b36] rounded-md relative overflow-hidden">
                                                {asset.url && asset.file_type.startsWith("image/") ? (
                                                    <img
                                                        src={asset.url}
                                                        alt={asset.file_name}
                                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    />
                                                ) : asset.url && asset.file_type.startsWith("video/") ? (
                                                    <video
                                                        src={asset.url}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        {getFileIcon(asset.file_type)}
                                                    </div>
                                                )}

                                                {/* Hover Actions */}
                                                <div className="absolute inset-0 bg-[#12131a]/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                    <Link
                                                        href={`/dashboard/projects/${id}/assets/${asset.id}`}
                                                        className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white hover:bg-purple-600 transition-colors shadow-lg"
                                                        title="View & Annotate"
                                                    >
                                                        <Maximize2 className="w-5 h-5" />
                                                    </Link>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDownload(asset.url);
                                                        }}
                                                        className="w-10 h-10 rounded-full bg-slate-500/10 flex items-center justify-center text-slate-400 border border-slate-500/20 hover:bg-slate-500 hover:text-white transition-colors shadow-lg"
                                                        title="Download Asset"
                                                    >
                                                        <Download className="w-5 h-5" />
                                                    </button>
                                                    {(role === 'owner' || role === 'admin') && (
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <button
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-colors shadow-lg"
                                                                    title="Delete Asset"
                                                                >
                                                                    <Trash2 className="w-5 h-5" />
                                                                </button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent className="bg-[#12131a] border-[#1f202b] text-white" onClick={(e) => e.stopPropagation()}>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Delete asset?</AlertDialogTitle>
                                                                    <AlertDialogDescription className="text-slate-400">
                                                                        Are you sure you want to delete this asset? This action cannot be undone.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel className="bg-[#1e1f2b] border-[#2a2b36] hover:bg-[#2a2b36] hover:text-white text-slate-300">Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDeleteAsset(asset.id)} className="bg-rose-500 hover:bg-rose-600 text-white">Delete</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h3 className="text-white font-medium text-sm truncate pr-4" title={asset.file_name}>
                                                        {asset.file_name}
                                                    </h3>
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                                                        {asset.version}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
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
                                                    <span>{new Date(asset.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#1f202b] rounded-xl bg-[#151720]">
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-[#1e1f2b] rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <ImageIcon className="w-8 h-8 text-slate-500" />
                                        </div>
                                        <h3 className="text-white font-bold mb-1">No assets uploaded yet</h3>
                                        <p className="text-sm text-slate-400 mb-4 max-w-sm">
                                            Uploaded assets will appear here.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === "collaborators" && (
                    <div className="flex-1 w-full bg-[#12131a] p-6 lg:p-8 overflow-y-auto">
                        <CollaboratorsTab projectId={id} currentRole={role} />
                    </div>
                )}

                {/* Activity Log Tab */}
                {activeTab === "activity" && (
                    <div className="flex-1 w-full overflow-y-auto">
                        <ActivityLog projectId={id} />
                    </div>
                )}

                {activeTab === "approved" && (
                    <div className="flex-1 p-4 md:p-6 flex flex-col min-w-0 overflow-y-auto">
                        <div className="flex items-center justify-between gap-2 sm:gap-4 mb-6">
                            <h2 className="text-lg font-bold text-white shrink-0">Approved Assets</h2>
                        </div>

                        {assets.filter(a => a.status === 'approved').length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {assets.filter(a => a.status === 'approved').map((asset) => (
                                    <div key={asset.id} className="bg-[#1a1c26] border border-[#2a2b36] rounded-xl overflow-hidden hover:border-purple-500/50 transition-colors group">
                                        <div className="h-32 bg-[#12131a] flex items-center justify-center border-b border-[#2a2b36] relative">
                                            {getFileIcon(asset.file_type)}

                                            {/* Hover Actions */}
                                            <div className="absolute inset-0 bg-[#12131a]/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                <Link
                                                    href={`/dashboard/projects/${id}/assets/${asset.id}`}
                                                    className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white hover:bg-purple-600 transition-colors shadow-lg"
                                                    title="View & Annotate"
                                                >
                                                    <Maximize2 className="w-5 h-5" />
                                                </Link>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDownload(asset.url);
                                                    }}
                                                    className="w-10 h-10 rounded-full bg-slate-500/10 flex items-center justify-center text-slate-400 border border-slate-500/20 hover:bg-slate-500 hover:text-white transition-colors shadow-lg"
                                                    title="Download Asset"
                                                >
                                                    <Download className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <h3 className="text-white font-medium text-sm truncate pr-4" title={asset.file_name}>
                                                    {asset.file_name}
                                                </h3>
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                                                    {asset.version}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                                                <div className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                                    APPROVED
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-slate-500">
                                                <span>{formatBytes(asset.size)}</span>
                                                <span>{new Date(asset.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#1f202b] rounded-xl bg-[#151720]">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-[#1e1f2b] rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-8 h-8 text-slate-500" />
                                    </div>
                                    <h3 className="text-white font-bold mb-1">No approved assets</h3>
                                    <p className="text-sm text-slate-400 mb-4 max-w-sm">
                                        Assets marked as approved will appear here.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Other tabs placeholders */}
                {activeTab !== "assets" && activeTab !== "collaborators" && activeTab !== "activity" && activeTab !== "approved" && (
                    <div className="flex-1 flex items-center justify-center p-12">
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-white mb-2 capitalize">{activeTab}</h3>
                            <p className="text-slate-400 max-w-sm">
                                This section is currently under development. The {activeTab} features will be available soon.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Invite Modal */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-[#12131a] border border-[#1f202b] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-[#1f202b]">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-1">Invite Collaborator</h2>
                                <p className="text-sm text-slate-400">Add a new member to this project.</p>
                            </div>
                            <button
                                onClick={() => setIsInviteModalOpen(false)}
                                className="p-2 hover:bg-[#1e1f2b] rounded-lg transition-colors text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleInvite} className="p-6">
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
                                        Email Address
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        placeholder="colleague@example.com"
                                        className="w-full bg-[#0b0c10] border border-[#1f202b] rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        disabled={isInviting}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="role" className="block text-sm font-medium text-slate-300 mb-1.5">
                                        Role
                                    </label>
                                    <Select
                                        value={inviteRole}
                                        onValueChange={(val) => setInviteRole(val)}
                                        disabled={isInviting}
                                    >
                                        <SelectTrigger className="w-full bg-[#0b0c10] border-[#1f202b] rounded-xl h-11 text-white focus:ring-purple-500">
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#12131a] border-[#1f202b] text-white">
                                            <SelectItem value="admin">Admin - Can manage roles and settings</SelectItem>
                                            <SelectItem value="reviewer">Reviewer - Can comment and approve</SelectItem>
                                            <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                                        </SelectContent>
                                    </Select>

                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsInviteModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-[#1e1f2b] hover:bg-[#2a2b36] transition-colors"
                                    disabled={isInviting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    disabled={isInviting || !inviteEmail}
                                >
                                    {isInviting ? "Sending..." : "Send Invite"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
