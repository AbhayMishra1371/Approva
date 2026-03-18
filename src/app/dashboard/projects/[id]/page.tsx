"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    FolderIcon,
    Image as ImageIcon,
    Users,
    Activity,
    BarChart,
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
import { createBrowserClient } from "@/lib/appwrite/client";
import { Query } from "appwrite";
import { toast } from "sonner";
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

type Project = {
    id: string;
    name: string;
    client_name: string;
    deadline: string;
    status: string;
    owner_id: string;
    created_at: string;
};

type Asset = {
    id: string;
    file_name: string;
    file_type: string;
    size: number;
    created_at: string;
    version: string;
    status: string;
    url: string;
    file_path: string;
};

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
                const { account } = createBrowserClient();
                const { jwt } = await account.createJWT();
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
            const { databases } = createBrowserClient();
            const assetsResponse = await databases.listDocuments(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ASSETS_ID!,
                [
                    Query.equal("project_id", id),
                    Query.orderDesc("$createdAt")
                ]
            );
            const data = assetsResponse.documents.map((doc: any) => ({ ...doc, id: doc.$id }));
            setAssets(data);
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
            const { account } = createBrowserClient();
            const { jwt } = await account.createJWT();
            
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
            const { databases, storage } = createBrowserClient();
            const assetObj = await databases.getDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ASSETS_ID!,
                assetId
            );

            if (assetObj.file_path) {
                try {
                    await storage.deleteFile(
                        process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ASSETS_ID!,
                        assetObj.file_path
                    );
                } catch (err) { }
            }

            await databases.deleteDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ASSETS_ID!,
                assetId
            );

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
            const { account } = createBrowserClient();
            const { jwt } = await account.createJWT();
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
                setInviteEmail("");
                setInviteRole("reviewer");
                toast.success("Invitation sent successfully!");
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

    const handleDownload = (filePath: string) => {
        try {
            const { storage } = createBrowserClient();
            const downloadUrl = storage.getFileDownload(
                process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ASSETS_ID!,
                filePath
            ).toString();

            // Create a hidden link and click it to trigger download
            const link = document.createElement('a');
            link.href = downloadUrl;
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
                        <p className="text-slate-400 text-sm">
                            Project ID: {id}
                        </p>
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
                    active={activeTab === "analytics"}
                    onClick={() => setActiveTab("analytics")}
                    icon={<BarChart className="w-4 h-4" />}
                    label="Analytics"
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
                        {/* Folder Tree Placeholder */}
                        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#1f202b] p-4 flex flex-col shrink-0">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Folders</h3>
                            <div className="space-y-1">
                                <FolderItem name="All Assets" active />
                            </div>
                        </div>

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
                            ) : assets.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {assets.map((asset) => (
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
                                                            handleDownload(asset.file_path);
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

                {/* Other tabs placeholders */}
                {activeTab !== "assets" && activeTab !== "collaborators" && (
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
                                    <select
                                        id="role"
                                        className="w-full bg-[#0b0c10] border border-[#1f202b] rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium appearance-none"
                                        value={inviteRole}
                                        onChange={(e) => setInviteRole(e.target.value)}
                                        disabled={isInviting}
                                    >
                                        <option value="admin">Admin - Can manage roles and settings</option>
                                        <option value="reviewer">Reviewer - Can comment and approve</option>
                                        <option value="viewer">Viewer - Read-only access</option>
                                    </select>
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

function TabButton({
    active,
    onClick,
    icon,
    label
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-1 py-4 border-b-2 transition-colors text-sm font-medium ${active
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
        >
            {icon}
            {label}
        </button>
    );
}

function FolderItem({ name, active = false }: { name: string; active?: boolean }) {
    return (
        <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${active ? "bg-purple-500/10 text-purple-400 font-medium" : "text-slate-400 hover:bg-[#1e1f2b] hover:text-white"
            }`}>
            <FolderIcon className={`w-4 h-4 ${active ? "fill-purple-500/20" : ""}`} />
            <span className="text-sm">{name}</span>
        </div>
    );
}

function CollaboratorsTab({ projectId, currentRole }: { projectId: string; currentRole: string | null }) {
    const [collaborators, setCollaborators] = useState<any[]>([]);
    const [invites, setInvites] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCollaborators = async () => {
            try {
                const { account } = createBrowserClient();
                const { jwt } = await account.createJWT();
                const res = await fetch(`/api/projects/collaborators?projectId=${projectId}`, {
                    headers: { "Authorization": `Bearer ${jwt}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCollaborators(data.collaborators || []);
                    if (currentRole === 'owner' || currentRole === 'admin') {
                        setInvites(data.invites || []);
                    }
                } else {
                    console.error("Error fetching collaborators");
                }
            } catch (err) {
                console.error("Error fetching collaborators block:", err instanceof Error ? err.message : err);
            } finally {
                setIsLoading(false);
            }
        };

        if (currentRole) fetchCollaborators();
    }, [projectId, currentRole]);

    const updateRole = async (collaboratorId: string, newRole: string) => {
        try {
            const { account } = createBrowserClient();
            const { jwt } = await account.createJWT();

            const res = await fetch(`/api/projects/collaborators`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwt}`
                },
                body: JSON.stringify({
                    projectId,
                    collaboratorId,
                    newRole
                })
            });

            if (res.ok) {
                toast.success("Role updated successfully");
                setCollaborators(collaborators.map(c =>
                    c.id === collaboratorId ? { ...c, role: newRole } : c
                ));
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to update role");
            }
        } catch (err) {
            console.error("Error updating role:", err);
            toast.error("An error occurred while updating the role");
        }
    };

    if (isLoading) {
        return <div className="text-slate-500 text-sm animate-pulse">Loading collaborators...</div>;
    }

    return (
        <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto">
            {/* Active Collaborators */}
            <div>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-400" /> Active Members
                </h2>
                <div className="bg-[#1e1f2b] border border-[#2a2b36] rounded-xl overflow-hidden shadow-sm">
                    {collaborators.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 text-sm">No active members found.</div>
                    ) : (
                        <div className="divide-y divide-[#2a2b36]">
                            {collaborators.map(c => (
                                <div key={c.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#252634] transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md">
                                            {(c.name || c.email) ? (c.name || c.email).charAt(0).toUpperCase() : <Users className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium text-sm">{c.name || c.email || "Unknown User"}</p>
                                            <p className="text-slate-500 text-xs mt-0.5">Joined {new Date(c.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {(currentRole === 'owner' || currentRole === 'admin') && c.role !== 'owner' ? (
                                            <Select
                                                value={c.role}
                                                onValueChange={(val) => updateRole(c.id, val)}
                                            >
                                                <SelectTrigger className={`h-8 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border outline-none focus:ring-0 ${c.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                                    }`}>
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#12131a] border-[#2a2b36] text-white">
                                                    <SelectItem value="admin" className="focus:bg-[#1e1f2b] focus:text-white cursor-pointer">Admin</SelectItem>
                                                    <SelectItem value="reviewer" className="focus:bg-[#1e1f2b] focus:text-white cursor-pointer">Reviewer</SelectItem>
                                                    <SelectItem value="viewer" className="focus:bg-[#1e1f2b] focus:text-white cursor-pointer">Viewer</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider
                                                ${c.role === 'owner' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                                    c.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                                        'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                                                {c.role}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Pending Invites (Only visible to admin/owner) */}
            {(currentRole === 'owner' || currentRole === 'admin') && invites.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-amber-500" /> Pending Invites
                    </h2>
                    <div className="bg-[#1e1f2b] border border-[#2a2b36] border-dashed rounded-xl overflow-hidden shadow-sm">
                        <div className="divide-y divide-[#2a2b36]">
                            {invites.map(i => (
                                <div key={i.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#151720]/50 hover:bg-[#1a1c26] transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center text-slate-400">
                                            {i.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-slate-300 font-medium text-sm">{i.email}</p>
                                            <p className="text-slate-500 text-xs mt-0.5">Invited {new Date(i.invited_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="px-2.5 py-1 rounded-md text-xs font-bold text-slate-400 bg-slate-800/50 uppercase tracking-wider border border-slate-700/50">
                                            Pending {i.role}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
