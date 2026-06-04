"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Download,
    Maximize2,
    Clock,
    CheckCircle,
    Info,
    SquareSquare,
    User,
    ListFilter,
    Send,
    ChevronDown,
    Plus,
    X
} from "lucide-react";
import { AssetUpload } from "@/components/projects/AssetUpload";
import { createBrowserClient } from "@/lib/appwrite/client";
import { getJwt } from "@/lib/auth/auth";
import { Query, ID, Permission, Role } from "appwrite";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { AnnotationCanvas, Annotation } from "@/components/projects/AnnotationCanvas";

import { CommentThread, Comment } from "@/components/projects/CommentThread";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";


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
    asset_group_id?: string;
    is_latest?: boolean;
};

export type GeneralComment = {
    $id: string;
    user_id: string;
    user_email: string;
    text: string;
    created_at: string;
};

export default function AssetDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;
    const assetId = params.assetId as string;
    const supabase = createSupabaseClient();

    const [asset, setAsset] = useState<Asset | null>(null);
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userEmail, setUserEmail] = useState<string>("");
    const [currentUserId, setCurrentUserId] = useState<string>("");
    const [currentColor, setCurrentColor] = useState("#a855f7");
    const [activeSidebarTab, setActiveSidebarTab] = useState<'comments' | 'fields'>('comments');


    // General Comments States
    const [generalComments, setGeneralComments] = useState<GeneralComment[]>([]);
    const [newGeneralComment, setNewGeneralComment] = useState("");
    const [isSubmittingGeneralComment, setIsSubmittingGeneralComment] = useState(false);

    const [collaborators, setCollaborators] = useState<any[]>([]);
    const [showGeneralMentions, setShowGeneralMentions] = useState(false);
    const [generalMentionSearch, setGeneralMentionSearch] = useState("");
    const [generalMentionIndex, setGeneralMentionIndex] = useState(-1);
    const [generalMentionedUserIds, setGeneralMentionedUserIds] = useState<string[]>([]);

    // Versions State
    const [versions, setVersions] = useState<Asset[]>([]);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    // Feedback Modal State
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [feedbackText, setFeedbackText] = useState("");
    const [pendingStatus, setPendingStatus] = useState<string | null>(null);


    // Role state
    const [role, setRole] = useState<'owner' | 'admin' | 'reviewer' | 'viewer' | null>(null);


    const colors = [
        { name: 'Purple', value: '#a855f7' },
        { name: 'Cyan', value: '#06b6d4' },
        { name: 'Emerald', value: '#10b981' },
        { name: 'Amber', value: '#f59e0b' },
        { name: 'Rose', value: '#f43f5e' }
    ];
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch User from Supabase
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setUserEmail(user.email || "");
                    setCurrentUserId(user.id);
                }

                // Fetch Asset
                const { data: assetDoc, error: assetErr } = await supabase
                    .from("assets")
                    .select("*")
                    .eq("id", assetId)
                    .single();

                if (assetErr) throw assetErr;
                setAsset({ ...assetDoc, size: assetDoc.file_size });

                // Fetch Annotations from Supabase
                try {
                    const { data: annDocs, error: annErr } = await supabase
                        .from("annotations")
                        .select("*")
                        .eq("asset_id", assetId)
                        .neq("status", "resolved");

                    if (annErr) throw annErr;

                    setAnnotations((annDocs || []).map(doc => ({
                        $id: doc.id,
                        x: Number(doc.x),
                        y: Number(doc.y),
                        width: Number(doc.width),
                        height: Number(doc.height),
                        status: doc.status,
                        name: doc.name || undefined,
                        color: doc.color || '#a855f7',
                        user_id: doc.user_id,
                        created_at: doc.created_at
                    })));
                } catch (e) {
                    console.error("Error fetching annotations from Supabase:", e);
                }

                // Fetch General Comments from Supabase
                try {
                    const { data: genCommDocs, error: genCommErr } = await supabase
                        .from("general_comments")
                        .select("*")
                        .eq("asset_id", assetId)
                        .order("created_at", { ascending: true });

                    if (genCommErr) throw genCommErr;

                    setGeneralComments((genCommDocs || []).map(doc => ({
                        $id: doc.id,
                        user_id: doc.user_id,
                        user_email: doc.user_email,
                        text: doc.text,
                        created_at: doc.created_at
                    })));
                } catch (e) {
                    console.error("Error fetching general comments from Supabase:", e);
                }

                // Fetch Versions if they exist
                if (assetDoc.asset_group_id) {
                    try {
                        const { data: versionDocs, error: versionErr } = await supabase
                            .from("assets")
                            .select("*")
                            .eq("asset_group_id", assetDoc.asset_group_id)
                            .order("version", { ascending: false });

                        if (versionErr) throw versionErr;
                        setVersions((versionDocs || []).map((doc: any) => ({ ...doc, id: doc.id, size: doc.file_size })));
                    } catch (e) {
                        console.error("Error fetching versions:", e);
                    }
                }

            } catch (error) {
                console.error("Error fetching asset detail:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [assetId]);

    useEffect(() => {
        const fetchRole = async () => {
            try {
                const jwt = await getJwt();
                const res = await fetch(`/api/projects/collaborators?projectId=${projectId}`, {
                    headers: { "Authorization": `Bearer ${jwt}` }
                });
                if (res.ok) {
                    const data = await res.json();

                    if (data.callerRole) {
                        setRole(data.callerRole as 'owner' | 'admin' | 'reviewer' | 'viewer');
                    }
                    if (data.collaborators) {
                        setCollaborators(data.collaborators);
                    }
                } else {
                    console.error("DEBUG: Failed to fetch role", await res.text());
                }
            } catch (error) {
                console.error("Error fetching user role", error);
            }
        };
        if (projectId) {
            fetchRole();
        }
    }, [projectId]);



    const fetchComments = async (annotationId: string) => {
        try {
            const { data: commentDocs, error: commentErr } = await supabase
                .from("comments")
                .select("*")
                .eq("annotation_id", annotationId)
                .order("created_at", { ascending: true });

            if (commentErr) throw commentErr;

            setComments((commentDocs || []).map(doc => ({
                $id: doc.id,
                user_id: doc.user_id,
                user_email: doc.user_email,
                text: doc.text,
                created_at: doc.created_at
            })));
        } catch (e) {
            console.error("Error fetching comments from Supabase:", e);
            setComments([]);
        }
    };
 
    const handleAddAnnotation = async (newAnn: Omit<Annotation, 'created_at' | 'status'>) => {
        try {
            const { data: doc, error: insertErr } = await supabase
                .from("annotations")
                .insert({
                    asset_id: assetId,
                    name: newAnn.name || undefined,
                    x: newAnn.x,
                    y: newAnn.y,
                    width: newAnn.width,
                    height: newAnn.height,
                    status: 'pending',
                    color: newAnn.color,
                    user_id: currentUserId
                })
                .select()
                .single();

            if (insertErr) throw insertErr;

            const added: Annotation = {
                $id: doc.id,
                ...newAnn,
                status: 'pending',
                created_at: doc.created_at
            };
 
            setAnnotations([...annotations, added]);
            setSelectedAnnotation(added);
            setComments([]); // New annotation has no comments
 
            // Create Activity Log
            try {
                await supabase
                    .from("activity_logs")
                    .insert({
                        project_id: projectId,
                        user_id: currentUserId,
                        user_email: userEmail,
                        action: "added_annotation",
                        entity_type: "annotation",
                        entity_id: doc.id,
                        metadata: JSON.stringify({ file_name: asset?.file_name })
                    });
            } catch (logError) {
                console.error("Failed to log annotation activity:", logError);
            }
        } catch (error: any) {
            console.error("Failed to save annotation in Supabase:", {
                message: error?.message,
                details: error?.details,
                hint: error?.hint,
                code: error?.code,
                error
            });
            toast.error(`Failed to save annotation: ${error?.message || "Unknown error"}`);
        }
    };
 
 
    const handleAddComment = async (text: string, mentions?: string[]) => {
        if (!selectedAnnotation?.$id) return;
 
        try {
            const { data: doc, error: insertErr } = await supabase
                .from("comments")
                .insert({
                    annotation_id: selectedAnnotation.$id,
                    user_id: currentUserId,
                    user_email: userEmail,
                    text: text,
                    mentions: mentions || []
                })
                .select()
                .single();

            if (insertErr) throw insertErr;
 
            setComments([...comments, {
                $id: doc.id,
                user_id: currentUserId,
                user_email: userEmail,
                text: text,
                created_at: doc.created_at,
                mentions: mentions || []
            } as any]);
 
            // Create Activity Log
            try {
                await supabase
                    .from("activity_logs")
                    .insert({
                        project_id: projectId,
                        user_id: currentUserId,
                        user_email: userEmail,
                        action: "added_comment",
                        entity_type: "comment",
                        entity_id: doc.id,
                        metadata: JSON.stringify({ file_name: asset?.file_name })
                    });
            } catch (logError) {
                console.error("Failed to log comment activity:", logError);
            }
 
 
        } catch (e: any) {
            console.error("Failed to save comment in Supabase:", {
                message: e?.message,
                details: e?.details,
                hint: e?.hint,
                code: e?.code,
                e
            });
            toast.error(`Failed to save comment: ${e?.message || "Unknown error"}`);
        }
    };
 
    const handleResolve = async () => {
        if (!selectedAnnotation?.$id) return;
 
        try {
            const { error: updateErr } = await supabase
                .from("annotations")
                .update({ status: 'resolved' })
                .eq("id", selectedAnnotation.$id);

            if (updateErr) throw updateErr;
 
            // Create Activity Log
            try {
                await supabase
                    .from("activity_logs")
                    .insert({
                        project_id: projectId,
                        user_id: currentUserId,
                        user_email: userEmail,
                        action: "resolved_annotation",
                        entity_type: "annotation",
                        entity_id: selectedAnnotation.$id,
                        metadata: JSON.stringify({
                            file_name: asset?.file_name,
                            annotation_name: selectedAnnotation.name
                        })
                    });
            } catch (logError) {
                console.error("Failed to log resolve activity:", logError);
            }
 
 
 
            setAnnotations(annotations.filter(a => a.$id !== selectedAnnotation.$id));
            setSelectedAnnotation(null);
            setComments([]);
            toast.success("Annotation approved and removed");
        } catch (e: any) {
            console.error("Failed to resolve annotation in Supabase:", {
                message: e?.message,
                details: e?.details,
                hint: e?.hint,
                code: e?.code,
                e
            });
            toast.error(`Failed to approve annotation: ${e?.message || "Unknown error"}`);
        }
    };
 
    const handleDeleteAnnotation = async () => {
        if (!selectedAnnotation?.$id) return;
 
        try {
            const { error: deleteErr } = await supabase
                .from("annotations")
                .delete()
                .eq("id", selectedAnnotation.$id);

            if (deleteErr) throw deleteErr;
 
            setAnnotations(annotations.filter(a => a.$id !== selectedAnnotation.$id));
            setSelectedAnnotation(null);
            setComments([]); // Clear comments
            toast.success("Annotation deleted successfully");
        } catch (e: any) {
            console.error("Failed to delete annotation in Supabase:", {
                message: e?.message,
                details: e?.details,
                hint: e?.hint,
                code: e?.code,
                e
            });
            toast.error(`Failed to delete annotation: ${e?.message || "Unknown error"}`);
        }
    };
 
    const handleDeleteComment = async (commentId: string) => {
        try {
            const { error: deleteErr } = await supabase
                .from("comments")
                .delete()
                .eq("id", commentId);

            if (deleteErr) throw deleteErr;
 
            setComments(comments.filter(c => c.$id !== commentId));
            toast.success("Comment deleted successfully");
        } catch (e: any) {
            console.error("Failed to delete comment in Supabase:", {
                message: e?.message,
                details: e?.details,
                hint: e?.hint,
                code: e?.code,
                e
            });
            toast.error(`Failed to delete comment: ${e?.message || "Unknown error"}`);
        }
    };
 
    const handleSendGeneralComment = async () => {
        if (!newGeneralComment.trim()) return;
        setIsSubmittingGeneralComment(true);
 
        try {
            const { data: doc, error: insertErr } = await supabase
                .from("general_comments")
                .insert({
                    asset_id: assetId,
                    user_id: currentUserId,
                    user_email: userEmail,
                    text: newGeneralComment.trim(),
                    mentions: generalMentionedUserIds
                })
                .select()
                .single();

            if (insertErr) throw insertErr;
 
            setGeneralComments([...generalComments, {
                $id: doc.id,
                user_id: currentUserId,
                user_email: userEmail,
                text: newGeneralComment.trim(),
                created_at: doc.created_at,
                mentions: generalMentionedUserIds
            } as any]);
 
 
 
            setNewGeneralComment("");
            setGeneralMentionedUserIds([]);
        } catch (error: any) {
            console.error("Failed to save general comment in Supabase:", {
                message: error?.message,
                details: error?.details,
                hint: error?.hint,
                code: error?.code,
                error
            });
            toast.error(`Failed to send comment: ${error?.message || "Unknown error"}`);
        } finally {
            setIsSubmittingGeneralComment(false);
        }
    };

    const handleGeneralInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        const cursorPosition = e.target.selectionStart || 0;
        const textBeforeCursor = value.substring(0, cursorPosition);

        const mentionMatch = textBeforeCursor.match(/(?:^|\s)@(\w*)$/);

        if (mentionMatch) {
            setShowGeneralMentions(true);
            setGeneralMentionSearch(mentionMatch[1]);
            setGeneralMentionIndex(textBeforeCursor.lastIndexOf('@'));
        } else {
            setShowGeneralMentions(false);
        }

        setNewGeneralComment(value);
    };

    const insertGeneralMention = (user: any) => {
        const beforeMention = newGeneralComment.substring(0, generalMentionIndex);
        const afterMention = newGeneralComment.substring(generalMentionIndex + generalMentionSearch.length + 1);
        const updatedComment = `${beforeMention}@${user.username || user.name.split(' ')[0]} ${afterMention}`;
        setNewGeneralComment(updatedComment);
        setShowGeneralMentions(false);
        if (!generalMentionedUserIds.includes(user.user_id)) {
            setGeneralMentionedUserIds([...generalMentionedUserIds, user.user_id]);
        }
    };

    const filteredGeneralCollaborators = collaborators.filter(c => {
        const search = generalMentionSearch.toLowerCase();
        const matchesUsername = c.username ? c.username.toLowerCase().includes(search) : false;
        const matchesName = c.name ? c.name.toLowerCase().includes(search) : false;
        return matchesUsername || matchesName;
    });

    const renderGeneralCommentText = (text: string) => {
        const parts = text.split(/(@\w+)/g);
        return parts.map((part, index) => {
            if (part.startsWith('@')) {
                const username = part.substring(1);
                return (
                    <span
                        key={index}
                        className="text-purple-400 font-medium"
                    >
                        {part}
                    </span>
                );
            }
            return <React.Fragment key={index}>{part}</React.Fragment>;
        });
    };


    const handleStatusChange = async (newStatus: string) => {
        if (newStatus === 'rejected' || newStatus === 'changes_requested') {
            setPendingStatus(newStatus);
            setFeedbackText("");
            setIsFeedbackModalOpen(true);
            return;
        }

        // Direct approval or other status
        await confirmStatusChange(newStatus, newStatus === 'approved' ? "Asset approved." : "");
    };

    const confirmStatusChange = async (newStatus: string, comment: string) => {
        setIsLoading(true);
        try {
            const jwt = await getJwt();

            const res = await fetch(`/api/projects/${projectId}/assets/${assetId}/status`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${jwt}`
                },
                body: JSON.stringify({ status: newStatus, comment })
            });

            if (res.ok) {
                const data = await res.json();
                setAsset(data.asset);
                // Optimistically add the generated comment to the UI
                if (comment) {
                    setGeneralComments([...generalComments, {
                        $id: Date.now().toString(),
                        user_id: currentUserId,
                        user_email: userEmail,
                        text: comment,
                        created_at: new Date().toISOString()
                    }]);

                    // Create Activity Log ONLY if approved
                    if (newStatus === 'approved') {
                        try {
                            await supabase
                                .from("activity_logs")
                                .insert({
                                    project_id: projectId,
                                    user_id: currentUserId,
                                    user_email: userEmail,
                                    action: "approved_asset",
                                    entity_type: "asset",
                                    entity_id: assetId,
                                    metadata: JSON.stringify({ file_name: data.asset?.file_name || asset?.file_name })
                                });
                        } catch (logError) {
                            console.error("Failed to log approval activity:", logError);
                        }
                    }
                }
                toast.success(`Asset marked as ${newStatus.replace('_', ' ')}`);
                setIsFeedbackModalOpen(false);
            } else {
                const errData = await res.json();
                toast.error(errData.error || "Failed to update status");
            }
        } catch (error) {
            console.error("Status update error", error);
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };


     const handleDownload = async (filePath: string) => {
        try {
            const supabase = createSupabaseClient();
            const { data, error } = await supabase.storage
                .from("assets")
                .download(filePath);

            if (error) throw error;

            const url = window.URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', asset?.file_name || 'download');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Download error:", error);
            toast.error("Failed to start download.");
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#0b0c10]">
                <div className="text-purple-500 animate-pulse font-bold">Loading asset...</div>
            </div>
        );
    }

    if (!asset) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#0b0c10] text-white">
                <p className="mb-4">Asset not found.</p>
                <Link href={`/dashboard/projects/${projectId}`} className="text-purple-400 hover:underline">
                    Back to Project
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-[#0b0c10] overflow-hidden">
            {/* Minimal Header */}
            <header className="min-h-[4rem] py-3 border-b border-[#1f202b] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 px-4 lg:px-6 bg-[#12131a] z-10">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/dashboard/projects/${projectId}`}
                        className="p-2 hover:bg-[#1e1f2b] rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-white font-bold text-sm leading-none">{asset.file_name}</h1>
                            {versions.length > 1 && (
                                <div className="relative group/version">
                                    <button className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-purple-400 hover:border-purple-500/50 transition-colors">
                                        {asset.version}
                                        <ChevronDown className="w-2.5 h-2.5" />
                                    </button>
                                    <div className="absolute top-full left-0 mt-1 w-32 bg-[#1a1c26] border border-[#2a2b36] rounded-lg shadow-xl opacity-0 invisible group-hover/version:opacity-100 group-hover/version:visible transition-all z-50 overflow-hidden">
                                        {versions.map((v) => (
                                            <button
                                                key={v.id}
                                                onClick={() => router.push(`/dashboard/projects/${projectId}/assets/${v.id}`)}
                                                className={`w-full px-3 py-2 text-left text-[10px] font-medium transition-colors hover:bg-white/5 flex items-center justify-between ${v.id === assetId ? 'text-purple-400 bg-purple-500/5' : 'text-slate-400'}`}
                                            >
                                                <span>{v.version}</span>
                                                {v.is_latest && <span className="text-[8px] bg-purple-500/20 px-1 rounded text-purple-400">LATEST</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {versions.length <= 1 && (
                                <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 font-bold text-[10px] text-slate-400">{asset.version}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(asset.created_at).toLocaleDateString()}</span>
                            {asset.is_latest && (
                                <>
                                    <span>•</span>
                                    <span className="text-emerald-400 font-bold uppercase tracking-wider">Latest Version</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 lg:gap-6 w-full lg:w-auto">
                    {/* Color Palette */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#12131a] rounded-lg border border-[#1f202b]">
                        <span className="text-[10px] text-slate-500 font-medium mr-1 uppercase tracking-wider">Color</span>
                        <div className="flex items-center gap-1.5">
                            {colors.map((color) => (
                                <button
                                    key={color.value}
                                    onClick={() => setCurrentColor(color.value)}
                                    className={`w-4 h-4 rounded-full transition-all ${currentColor === color.value ? 'ring-2 ring-offset-2 ring-offset-[#12131a] ring-white scale-110' : 'hover:scale-110'}`}
                                    style={{ backgroundColor: color.value }}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(asset.file_path);
                            }}
                            className="flex items-center gap-2 bg-[#1e1f2b] hover:bg-[#2a2b36] border border-[#2a2b36] text-white rounded-lg px-3 py-1.5 transition-colors font-medium text-xs"
                        >
                            <Download className="w-3.5 h-3.5 text-purple-400" />
                            Download
                        </button>

                        {(role === 'owner' || role === 'admin') && (
                            <button
                                onClick={() => setIsUploadModalOpen(true)}
                                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-3 py-1.5 transition-colors font-medium text-xs"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                New Version
                            </button>
                        )}

                        {(role === 'reviewer' || role === 'owner' || role === 'admin') && (!asset.status || asset.status === 'in_review' || asset.status === 'draft' || asset.status.toLowerCase() === 'pending') && (
                            <>
                                <button onClick={() => handleStatusChange('changes_requested')} className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 rounded-lg px-3 py-1.5 transition-colors font-medium text-xs">
                                    Request Changes
                                </button>
                                <button onClick={() => handleStatusChange('rejected')} className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-lg px-3 py-1.5 transition-colors font-medium text-xs">
                                    Reject
                                </button>
                                <button onClick={() => handleStatusChange('approved')} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3 py-1.5 transition-colors font-medium text-xs">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Approve Asset
                                </button>
                            </>
                        )}
                        {(role === 'reviewer' || role === 'owner' || role === 'admin') && asset.status === 'approved' && (
                            <button disabled className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg px-3 py-1.5 font-medium text-xs cursor-not-allowed">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Approved
                            </button>
                        )}
                        {(role === 'reviewer' || role === 'owner' || role === 'admin') && (asset.status === 'rejected' || asset.status === 'changes_requested') && (
                            <button onClick={() => handleStatusChange('in_review')} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-3 py-1.5 transition-colors font-medium text-xs">
                                Submit for Review
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
                {/* Canvas Area */}
                <div className="flex-1 overflow-hidden flex flex-col items-center justify-center p-4 lg:p-8 bg-black/40 min-h-[50vh] lg:min-h-0">
                    <div className="w-full max-w-5xl aspect-video bg-[#12131a] rounded-xl shadow-2xl border border-[#1f202b] overflow-hidden relative group">
                        <AnnotationCanvas
                            assetUrl={asset.url}
                            assetType={asset.file_type}
                            annotations={annotations}
                            readOnly={role === 'viewer'}
                            onAddAnnotation={handleAddAnnotation}
                            onSelectAnnotation={(ann) => {
                                setSelectedAnnotation(ann);
                                if (ann.$id) {
                                    fetchComments(ann.$id);
                                }
                            }}
                            selectedAnnotationId={selectedAnnotation?.$id}
                            currentColor={currentColor}
                            renderPopup={(ann) => (
                                <CommentThread
                                    annotationId={ann.$id!}
                                    annotationName={ann.name}
                                    comments={comments}
                                    readOnly={role === 'viewer'}
                                    onAddComment={handleAddComment}
                                    onClose={() => setSelectedAnnotation(null)}
                                    onResolve={handleResolve}
                                    onDelete={handleDeleteAnnotation}
                                    onDeleteComment={handleDeleteComment}
                                    status={ann.status}
                                    currentUserId={currentUserId}
                                    annotationOwnerId={ann.user_id}
                                    role={role}
                                    collaborators={collaborators}
                                />
                            )}
                        />

                        {/* Overlay Tip */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 flex items-center gap-2 text-[10px] text-slate-300 pointer-events-none">
                            <Maximize2 className="w-3 h-3 text-purple-400" />
                            Click and drag to create an annotation pin
                        </div>
                    </div>
                </div>

                {/* Enhanced Info / Comment Sidebar */}
                <div className="w-full lg:w-96 bg-[#1a1b23] border-t lg:border-t-0 lg:border-l border-[#1f202b] flex flex-col z-20 overflow-hidden h-full">
                    {/* Asset Info Summary (Always Visible) */}
                    <div className="p-4 border-b border-[#252632] space-y-4">
                        <div className="bg-[#1f202b]/60 rounded-xl border border-[#2a2b36] p-4">
                            <h2 className="text-white font-bold text-sm leading-tight mb-2 truncate">
                                {asset.file_name}
                            </h2>
                            <p className="text-slate-400 text-[10px] mb-4">
                                Uploaded on {new Date(asset.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(asset.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </p>

                            <div className="grid grid-cols-2 gap-px bg-[#2a2b36] rounded-lg overflow-hidden border border-[#2a2b36]">
                                <div className="bg-[#1f202b] p-2 text-center">
                                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Format</div>
                                    <div className="text-white font-bold text-xs">{asset.file_type.split('/')[1]?.toUpperCase() || 'UNKNOWN'}</div>
                                </div>
                                <div className="bg-[#1f202b] p-2 text-center">
                                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Status</div>
                                    <div className={`text-xs font-bold uppercase tracking-wider 
                                        ${asset.status === 'approved' ? 'text-emerald-400' :
                                            asset.status === 'rejected' ? 'text-rose-400' :
                                                asset.status === 'changes_requested' ? 'text-amber-400' :
                                                    'text-blue-400'}`}>
                                        {asset.status ? asset.status.replace('_', ' ') : 'Review'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Tab Content */}
                    <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
                        <div className="h-full flex flex-col">
                            <div className="bg-[#2a2b36]/30 p-3 rounded-lg border border-[#2a2b36]/50 mb-4 bg-stripes">
                                <h3 className="text-white font-medium text-xs flex items-center gap-1.5 mb-1">
                                    <Info className="w-3.5 h-3.5 text-purple-400" /> Canvas Annotations
                                </h3>
                                <p className="text-[10px] text-slate-400 leading-snug">
                                    Click a pin on the image to view specific canvas comments. Or, leave general feedback below.
                                </p>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 custom-scrollbar">
                                {generalComments.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500 text-xs italic border border-dashed border-[#2a2b36] rounded-xl relative">
                                        No general comments yet. Be the first to share your thoughts!
                                    </div>
                                ) : (
                                    generalComments.map(comment => (
                                        <div key={comment.$id} className="bg-[#1f202b] rounded-xl p-3 border border-[#2a2b36]">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0 uppercase">
                                                        {comment.user_email?.[0] || '?'}
                                                    </div>
                                                    <span className="text-xs font-bold text-white">{comment.user_email?.split('@')[0] || 'Unknown User'}</span>
                                                </div>
                                                <span className="text-[10px] text-slate-500 mt-0.5">
                                                    {new Date(comment.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-300 whitespace-pre-wrap ml-8">{renderGeneralCommentText(comment.text)}</p>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Input Box */}
                            {role !== 'viewer' && (
                                <>
                                    <div className="mt-auto shrink-0 relative">
                                        {showGeneralMentions && (
                                            <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#1a1b23] border border-[#2a2b36] rounded-xl shadow-2xl z-50 animate-in slide-in-from-bottom-2 duration-200 max-h-48 overflow-y-auto">
                                                {filteredGeneralCollaborators.length > 0 ? (
                                                    filteredGeneralCollaborators.map((collab) => (
                                                        <button
                                                            key={collab.user_id}
                                                            type="button"
                                                            onClick={() => insertGeneralMention(collab)}
                                                            className="w-full flex items-center gap-3 p-3 hover:bg-purple-500/10 transition-colors text-left border-b border-[#2a2b36]/50 last:border-0"
                                                        >
                                                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                                                <User className="w-4 h-4 text-purple-400" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-bold text-white truncate">{collab.name || 'User'}</p>
                                                                <p className="text-[10px] text-slate-500 truncate">@{collab.username || collab.email?.split('@')[0] || 'user'}</p>
                                                            </div>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="p-3 text-xs text-slate-500 text-center">
                                                        No matching users found.
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <div className="relative bg-[#12131a] border border-[#2a2b36] rounded-xl focus-within:border-purple-500 transition-colors">
                                            <textarea
                                                value={newGeneralComment}
                                                onChange={handleGeneralInputChange}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSendGeneralComment();
                                                    }
                                                }}
                                                placeholder="Write a general comment... (@mention)"
                                                className="w-full bg-transparent p-3 pr-10 text-sm text-white focus:outline-none resize-none placeholder-slate-600 custom-scrollbar block min-h-[80px]"
                                                disabled={isSubmittingGeneralComment}
                                            />
                                            <button
                                                onClick={handleSendGeneralComment}
                                                disabled={!newGeneralComment.trim() || isSubmittingGeneralComment}
                                                className="absolute bottom-2 right-2 p-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center"
                                            >
                                                {isSubmittingGeneralComment ? (
                                                    <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <Send className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-2 text-right">
                                        Press <span className="font-bold text-slate-400">Enter</span> to send
                                    </div>
                                </>
                            )}
                        </div>

                    </div>
                </div>
            </main>
            {/* Feedback Modal for Rejection/Changes */}
            <AlertDialog open={isFeedbackModalOpen} onOpenChange={setIsFeedbackModalOpen}>
                <AlertDialogContent className="bg-[#12131a] border-[#1f202b] text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Provide Feedback</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                            Please explain why you are {pendingStatus === 'rejected' ? 'rejecting' : 'requesting changes for'} this asset. This will be shared with the team.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Type your feedback here..."
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            className="bg-[#0b0c10] border-[#1f202b] text-white placeholder:text-slate-600 focus:border-purple-500 focus:ring-purple-500"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-[#1e1f2b] border-[#2a2b36] hover:bg-[#2a2b36] hover:text-white text-slate-300">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => pendingStatus && confirmStatusChange(pendingStatus, feedbackText)}
                            disabled={!feedbackText.trim() || isLoading}
                            className={`${pendingStatus === 'rejected' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-amber-500 hover:bg-amber-600'} text-white font-bold px-6`}
                        >
                            {isLoading ? "Submitting..." : "Submit Feedback"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* New Version Upload Modal */}

            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-[#12131a] border border-[#1f202b] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-[#1f202b]">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-1">Upload New Version</h2>
                                <p className="text-sm text-slate-400">Replace current asset with a new version.</p>
                            </div>
                            <button
                                onClick={() => setIsUploadModalOpen(false)}
                                className="p-2 hover:bg-[#1e1f2b] rounded-lg transition-colors text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <AssetUpload
                                projectId={projectId}
                                assetGroupId={asset.asset_group_id}
                                currentVersion={parseInt(asset.version.replace('v', ''))}
                                onUploadSuccess={() => {
                                    setIsUploadModalOpen(false);
                                    window.location.reload(); // Simplest way to refresh everything
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
