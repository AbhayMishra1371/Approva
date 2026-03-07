"use client";

import { useState, useEffect } from "react";
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
    Send
} from "lucide-react";
import { createBrowserClient } from "@/lib/appwrite/client";
import { Query, ID } from "appwrite";
import { AnnotationCanvas, Annotation } from "@/components/projects/AnnotationCanvas";
import { CommentThread, Comment } from "@/components/projects/CommentThread";

type Asset = {
    id: string;
    file_name: string;
    file_type: string;
    size: number;
    created_at: string;
    version: string;
    status: string;
    url: string;
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

    const [asset, setAsset] = useState<Asset | null>(null);
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userEmail, setUserEmail] = useState<string>("");
    const [currentColor, setCurrentColor] = useState("#a855f7");
    const [activeSidebarTab, setActiveSidebarTab] = useState<'comments' | 'fields'>('fields');

    // General Comments States
    const [generalComments, setGeneralComments] = useState<GeneralComment[]>([]);
    const [newGeneralComment, setNewGeneralComment] = useState("");
    const [isSubmittingGeneralComment, setIsSubmittingGeneralComment] = useState(false);

    const colors = [
        { name: 'Purple', value: '#a855f7' },
        { name: 'Cyan', value: '#06b6d4' },
        { name: 'Emerald', value: '#10b981' },
        { name: 'Amber', value: '#f59e0b' },
        { name: 'Rose', value: '#f43f5e' }
    ];

    // Appwrite Collection IDs (Fallback to standard names if not in env)
    const annotationsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ANNOTATIONS_ID || 'annotations';
    const commentsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COMMENTS_ID || 'comments';
    const generalCommentsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_GENERAL_COMMENTS_ID || 'general_comments';

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const { databases, account } = createBrowserClient();

                // Fetch User
                const user = await account.get();
                setUserEmail(user.email);

                // Fetch Asset
                const assetDoc = await databases.getDocument(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                    process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ASSETS_ID!,
                    assetId
                );
                setAsset({ ...assetDoc as any, id: assetDoc.$id });

                // Fetch Annotations
                try {
                    const annDocs = await databases.listDocuments(
                        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                        annotationsCollectionId,
                        [Query.equal("asset_id", assetId)]
                    );
                    setAnnotations(annDocs.documents.map(doc => ({
                        $id: doc.$id,
                        x: doc.x,
                        y: doc.y,
                        width: doc.width,
                        height: doc.height,
                        status: doc.status,
                        name: doc.name || undefined,
                        color: doc.color || '#a855f7',
                        created_at: doc.$createdAt
                    })));
                } catch (e) {
                    console.warn("Annotations collection might not exist yet. Please create it in Appwrite console.", e);
                }

                // Fetch General Comments
                try {
                    const genCommDocs = await databases.listDocuments(
                        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                        generalCommentsCollectionId,
                        [Query.equal("asset_id", assetId), Query.orderAsc("$createdAt")]
                    );
                    setGeneralComments(genCommDocs.documents.map(doc => ({
                        $id: doc.$id,
                        user_id: doc.user_id,
                        user_email: doc.user_email,
                        text: doc.text,
                        created_at: doc.$createdAt
                    })));
                } catch (e) {
                    console.warn("General comments collection might not exist yet.", e);
                }

            } catch (error) {
                console.error("Error fetching asset detail:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [assetId, annotationsCollectionId]);

    const fetchComments = async (annotationId: string) => {
        try {
            const { databases } = createBrowserClient();
            const commentDocs = await databases.listDocuments(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                commentsCollectionId,
                [Query.equal("annotation_id", annotationId), Query.orderAsc("$createdAt")]
            );
            setComments(commentDocs.documents.map(doc => ({
                $id: doc.$id,
                user_id: doc.user_id,
                user_email: doc.user_email,
                text: doc.text,
                created_at: doc.$createdAt
            })));
        } catch (e) {
            console.warn("Comments collection might not exist yet.", e);
            setComments([]);
        }
    };

    const handleAddAnnotation = async (newAnn: Omit<Annotation, 'created_at' | 'status'>) => {
        try {
            const { databases } = createBrowserClient();

            // Immediately save the annotation to Appwrite
            const doc = await databases.createDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                annotationsCollectionId,
                ID.unique(),
                {
                    asset_id: assetId,
                    name: newAnn.name || undefined,
                    x: newAnn.x,
                    y: newAnn.y,
                    width: newAnn.width,
                    height: newAnn.height,
                    status: 'pending',
                    color: newAnn.color
                }
            );

            const added: Annotation = {
                $id: doc.$id,
                ...newAnn,
                status: 'pending',
                created_at: doc.$createdAt
            };

            setAnnotations([...annotations, added]);
            setSelectedAnnotation(added);
            setComments([]); // New annotation has no comments
        } catch (error) {
            console.error("Failed to save annotation:", error);
            alert("Failed to save annotation. Make sure the 'annotations' collection exists.");
        }
    };


    const handleAddComment = async (text: string) => {
        if (!selectedAnnotation?.$id) return;

        try {
            const { databases, account } = createBrowserClient();
            const user = await account.get();

            const doc = await databases.createDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                commentsCollectionId,
                ID.unique(),
                {
                    annotation_id: selectedAnnotation.$id,
                    user_id: user.$id,
                    user_email: user.email,
                    text: text
                }
            );

            setComments([...comments, {
                $id: doc.$id,
                user_id: user.$id,
                user_email: user.email,
                text: text,
                created_at: new Date().toISOString()
            }]);
        } catch (e) {
            console.error("Failed to save comment:", e);
            alert("Failed to save comment.");
        }
    };

    const handleResolve = async () => {
        if (!selectedAnnotation?.$id) return;

        try {
            const { databases } = createBrowserClient();
            await databases.updateDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                annotationsCollectionId,
                selectedAnnotation.$id,
                { status: 'resolved' }
            );

            setAnnotations(annotations.map(a =>
                a.$id === selectedAnnotation.$id ? { ...a, status: 'resolved' } : a
            ));
            setSelectedAnnotation({ ...selectedAnnotation, status: 'resolved' });
        } catch (e) {
            console.error("Failed to resolve annotation:", e);
        }
    };

    const handleDeleteAnnotation = async () => {
        if (!selectedAnnotation?.$id) return;

        try {
            const { databases } = createBrowserClient();

            // Delete associated comments first
            try {
                const commentDocs = await databases.listDocuments(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                    commentsCollectionId,
                    [Query.equal("annotation_id", selectedAnnotation.$id)]
                );

                for (const doc of commentDocs.documents) {
                    await databases.deleteDocument(
                        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                        commentsCollectionId,
                        doc.$id
                    );
                }
            } catch (e) {
                console.warn("Failed to delete comments or collection missing", e);
            }

            // Delete the annotation
            await databases.deleteDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                annotationsCollectionId,
                selectedAnnotation.$id
            );

            setAnnotations(annotations.filter(a => a.$id !== selectedAnnotation.$id));
            setSelectedAnnotation(null);
            setComments([]); // Clear comments
        } catch (e) {
            console.error("Failed to delete annotation:", e);
            alert("Failed to delete annotation.");
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            const { databases } = createBrowserClient();
            await databases.deleteDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                commentsCollectionId,
                commentId
            );

            setComments(comments.filter(c => c.$id !== commentId));
        } catch (e) {
            console.error("Failed to delete comment:", e);
            alert("Failed to delete comment.");
        }
    };

    const handleSendGeneralComment = async () => {
        if (!newGeneralComment.trim()) return;
        setIsSubmittingGeneralComment(true);

        try {
            const { databases, account } = createBrowserClient();
            const user = await account.get();

            const doc = await databases.createDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                generalCommentsCollectionId,
                ID.unique(),
                {
                    asset_id: assetId,
                    user_id: user.$id,
                    user_email: user.email,
                    text: newGeneralComment.trim()
                }
            );

            setGeneralComments([...generalComments, {
                $id: doc.$id,
                user_id: user.$id,
                user_email: user.email,
                text: newGeneralComment.trim(),
                created_at: new Date().toISOString()
            }]);
            setNewGeneralComment("");
        } catch (error) {
            console.error("Failed to save general comment:", error);
            alert("Failed to send comment. Ensure the 'general_comments' table is created with attributes 'asset_id', 'user_id', 'user_email', and 'text'.");
        } finally {
            setIsSubmittingGeneralComment(false);
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
            <header className="h-16 border-b border-[#1f202b] flex items-center justify-between px-6 bg-[#12131a] z-10">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/dashboard/projects/${projectId}`}
                        className="p-2 hover:bg-[#1e1f2b] rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-white font-bold text-sm leading-none mb-1">{asset.file_name}</h1>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 font-bold">{asset.version}</span>
                            <span>•</span>
                            <Clock className="w-3 h-3" />
                            <span>{new Date(asset.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
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

                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 bg-[#1e1f2b] hover:bg-[#2a2b36] border border-[#2a2b36] text-white rounded-lg px-3 py-1.5 transition-colors font-medium text-xs">
                            <Download className="w-3.5 h-3.5 text-purple-400" />
                            Download
                        </button>
                        <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-3 py-1.5 transition-colors font-medium text-xs">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Approve Asset
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden relative">
                {/* Canvas Area */}
                <div className="flex-1 overflow-hidden flex flex-col items-center justify-center p-8 bg-black/40">
                    <div className="w-full max-w-5xl aspect-video bg-[#12131a] rounded-xl shadow-2xl border border-[#1f202b] overflow-hidden relative group">
                        <AnnotationCanvas
                            assetUrl={asset.url}
                            assetType={asset.file_type}
                            annotations={annotations}
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
                                    onAddComment={handleAddComment}
                                    onClose={() => setSelectedAnnotation(null)}
                                    onResolve={handleResolve}
                                    onDelete={handleDeleteAnnotation}
                                    onDeleteComment={handleDeleteComment}
                                    status={ann.status}
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
                <div className="w-96 bg-[#1a1b23] border-l border-[#1f202b] flex flex-col z-20 overflow-hidden">
                    {/* Tabs */}
                    <div className="flex p-3 bg-[#1a1b23] border-b border-[#252632]">
                        <div className="flex w-full bg-[#12131a] rounded-lg p-1 border border-[#252632]">
                            <button
                                onClick={() => setActiveSidebarTab('comments')}
                                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeSidebarTab === 'comments' ? 'bg-[#252632] text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
                            >
                                Comments
                            </button>
                            <button
                                onClick={() => setActiveSidebarTab('fields')}
                                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${activeSidebarTab === 'fields' ? 'bg-[#252632] text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
                            >
                                Fields
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
                        {activeSidebarTab === 'comments' ? (
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
                                                <p className="text-xs text-slate-300 whitespace-pre-wrap ml-8">{comment.text}</p>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Input Box */}
                                <div className="mt-auto shrink-0 relative bg-[#12131a] border border-[#2a2b36] rounded-xl focus-within:border-purple-500 transition-colors">
                                    <textarea
                                        value={newGeneralComment}
                                        onChange={(e) => setNewGeneralComment(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendGeneralComment();
                                            }
                                        }}
                                        placeholder="Write a general comment..."
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
                                <div className="text-[10px] text-slate-500 mt-2 text-right">
                                    Press <span className="font-bold text-slate-400">Enter</span> to send
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Main Asset Card */}
                                <div className="bg-[#1f202b]/60 rounded-xl border border-[#2a2b36] p-4">
                                    <h2 className="text-white font-bold text-sm leading-tight mb-2 truncate">
                                        {asset.file_name}
                                    </h2>
                                    <p className="text-slate-400 text-xs mb-4">
                                        Uploaded on {new Date(asset.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(asset.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                    </p>

                                    <div className="grid grid-cols-2 gap-px bg-[#2a2b36] rounded-lg overflow-hidden border border-[#2a2b36]">
                                        <div className="bg-[#1f202b] p-3 text-center">
                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Format</div>
                                            <div className="text-white font-bold text-sm">{asset.file_type.split('/')[1]?.toUpperCase() || 'UNKNOWN'}</div>
                                        </div>
                                        <div className="bg-[#1f202b] p-3 text-center">
                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Resolution</div>
                                            <div className="text-white font-bold text-sm">--</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Mini Cards Row */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Seen By */}
                                    <div className="bg-[#1f202b]/60 rounded-xl border border-[#2a2b36] p-3">
                                        <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-2">
                                            <User className="w-3.5 h-3.5" />
                                            <span>Seen By</span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-[#2a2b36]/50 rounded-lg p-1.5 border border-[#2a2b36]">
                                            <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                                                IN
                                            </div>
                                            <span className="text-xs text-white font-medium truncate">Invision Studio</span>
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="bg-[#1f202b]/60 rounded-xl border border-[#2a2b36] p-3">
                                        <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-2">
                                            <SquareSquare className="w-3.5 h-3.5" />
                                            <span>Status</span>
                                        </div>
                                        <div className="inline-flex items-center bg-blue-500/10 text-blue-400 text-xs font-semibold px-2 py-1 rounded-md border border-blue-500/20">
                                            In Progress
                                        </div>
                                    </div>
                                </div>

                                {/* All Fields Section */}
                                <div className="pt-2">
                                    <div className="flex items-center justify-between mb-3 px-1">
                                        <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
                                            All Fields <span className="text-slate-500 font-normal">(7)</span>
                                        </h3>
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <button className="hover:text-white transition-colors"><ListFilter className="w-4 h-4" /></button>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 relative">
                                        {/* Field Items */}
                                        <div className="bg-[#1f202b]/60 rounded-lg border border-[#2a2b36] p-3 flex items-center justify-between group cursor-pointer hover:bg-[#252632] transition-colors">
                                            <div className="flex items-center gap-2 text-slate-300 text-xs font-medium">
                                                <div className="w-4 h-4 rounded border border-slate-600 flex items-center justify-center shrink-0">
                                                    <CheckCircle className="w-3 h-3 text-slate-400" />
                                                </div>
                                                Alpha Channel
                                            </div>
                                            <div className="w-4 h-4 rounded bg-indigo-500 flex items-center justify-center">
                                                <CheckCircle className="w-3 h-3 text-white" />
                                            </div>
                                        </div>

                                        <div className="bg-[#1f202b]/60 rounded-lg border border-[#2a2b36] p-[10px] pl-3 flex flex-col gap-1.5 group cursor-pointer hover:bg-[#252632] transition-colors min-h-[52px]">
                                            <div className="flex items-center gap-2 text-slate-300 text-xs font-medium">
                                                <User className="w-3.5 h-3.5 text-slate-500" />
                                                Assignee
                                            </div>
                                        </div>

                                        <div className="bg-[#1f202b]/60 rounded-lg border border-[#2a2b36] p-[10px] pl-3 flex items-center gap-2 group cursor-pointer hover:bg-[#252632] transition-colors">
                                            <div className="w-3.5 h-3.5 rounded border border-slate-600 flex items-center justify-center text-[8px] font-bold text-slate-400 shrink-0">1</div>
                                            <span className="text-slate-300 text-xs font-medium">Audio Bit Depth</span>
                                        </div>

                                        <div className="bg-[#1f202b]/60 rounded-lg border border-[#2a2b36] p-[10px] pl-3 flex items-center gap-2 group cursor-pointer hover:bg-[#252632] transition-colors">
                                            <div className="w-3.5 h-3.5 rounded border border-slate-600 flex items-center justify-center text-[8px] font-bold text-slate-400 shrink-0">1</div>
                                            <span className="text-slate-300 text-xs font-medium">Audio Bit Rate</span>
                                        </div>

                                        <div className="bg-[#1f202b]/60 rounded-lg border border-[#2a2b36] p-[10px] pl-3 flex items-center gap-2 group cursor-pointer hover:bg-[#252632] transition-colors">
                                            <div className="w-3.5 h-3.5 rounded border border-slate-600 flex items-center justify-center text-[8px] font-bold text-slate-400 shrink-0">1</div>
                                            <span className="text-slate-300 text-xs font-medium">Audio Channels</span>
                                        </div>

                                        <div className="bg-[#1f202b]/60 rounded-lg border border-[#2a2b36] p-[10px] pl-3 flex flex-col gap-1.5 group cursor-pointer hover:bg-[#252632] transition-colors min-h-[52px]">
                                            <div className="flex items-center gap-2 text-slate-300 text-xs font-medium">
                                                <div className="w-3.5 h-3.5 rounded border border-slate-600 flex items-center justify-center text-[8px] font-bold text-slate-400 shrink-0">T</div>
                                                Audio Codec
                                            </div>
                                        </div>

                                        <div className="bg-[#1f202b]/60 rounded-lg border border-[#2a2b36] p-[10px] pl-3 flex items-center gap-2 group cursor-pointer hover:bg-[#252632] transition-colors">
                                            <div className="w-3.5 h-3.5 rounded border border-slate-600 flex items-center justify-center text-[8px] font-bold text-slate-400 shrink-0">1</div>
                                            <span className="text-slate-300 text-xs font-medium">Audio Sample Rate</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
