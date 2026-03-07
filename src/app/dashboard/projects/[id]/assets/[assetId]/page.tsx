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
    Info
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

    const handleAddAnnotation = (newAnn: Omit<Annotation, 'created_at' | 'status'>) => {
        const tempId = `temp-${ID.unique()}`;
        const added: Annotation = {
            $id: tempId,
            ...newAnn,
            status: 'pending',
            created_at: new Date().toISOString()
        };

        setAnnotations([...annotations, added]);
        setSelectedAnnotation(added);
        setComments([]); // New annotation has no comments
    };


    const handleAddComment = async (text: string) => {
        if (!selectedAnnotation?.$id) return;

        try {
            const { databases, account } = createBrowserClient();
            const user = await account.get();
            let finalAnnotationId = selectedAnnotation.$id;

            // If it's a temporary annotation, save it first
            if (selectedAnnotation.$id.startsWith('temp-')) {
                try {
                    const doc = await databases.createDocument(
                        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                        annotationsCollectionId,
                        ID.unique(),
                        {
                            asset_id: assetId,
                            name: selectedAnnotation.name || undefined,
                            x: selectedAnnotation.x,
                            y: selectedAnnotation.y,
                            width: selectedAnnotation.width,
                            height: selectedAnnotation.height,
                            status: 'pending',
                            color: selectedAnnotation.color
                        }
                    );
                    finalAnnotationId = doc.$id;

                    // Update local annotations state replace temp with real ID
                    setAnnotations(annotations.map(a =>
                        a.$id === selectedAnnotation.$id ? { ...a, $id: doc.$id } : a
                    ));
                    setSelectedAnnotation({ ...selectedAnnotation, $id: doc.$id });
                } catch (e) {
                    console.error("Failed to save annotation:", e);
                    alert("Failed to save annotation. Make sure the 'annotations' collection exists.");
                    return;
                }
            }

            const doc = await databases.createDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                commentsCollectionId,
                ID.unique(),
                {
                    annotation_id: finalAnnotationId,
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

        if (selectedAnnotation.$id.startsWith('temp-')) {
            setAnnotations(annotations.filter(a => a.$id !== selectedAnnotation.$id));
            setSelectedAnnotation(null);
            return;
        }

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
                                // Clean up temp annotation if switching away
                                if (selectedAnnotation?.$id?.startsWith('temp-') && selectedAnnotation.$id !== ann.$id) {
                                    setAnnotations(prev => prev.filter(a => a.$id !== selectedAnnotation.$id));
                                }
                                setSelectedAnnotation(ann);
                                if (ann.$id && !ann.$id.startsWith('temp-')) {
                                    fetchComments(ann.$id);
                                } else {
                                    setComments([]);
                                }
                            }}
                            selectedAnnotationId={selectedAnnotation?.$id}
                            currentColor={currentColor}
                        />

                        {/* Overlay Tip */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 flex items-center gap-2 text-[10px] text-slate-300 pointer-events-none">
                            <Maximize2 className="w-3 h-3 text-purple-400" />
                            Click and drag to create an annotation pin
                        </div>
                    </div>
                </div>

                {/* Info / Comment Sidebar */}
                {selectedAnnotation ? (
                    <CommentThread
                        annotationId={selectedAnnotation.$id!}
                        annotationName={selectedAnnotation.name}
                        comments={comments}
                        onAddComment={handleAddComment}
                        onClose={() => {
                            if (selectedAnnotation.$id?.startsWith('temp-')) {
                                setAnnotations(annotations.filter(a => a.$id !== selectedAnnotation.$id));
                            }
                            setSelectedAnnotation(null);
                        }}
                        onResolve={handleResolve}
                        onDelete={handleDeleteAnnotation}
                        onDeleteComment={handleDeleteComment}
                        status={selectedAnnotation.status}
                    />
                ) : (
                    <div className="w-80 bg-[#12131a] border-l border-[#1f202b] p-6 flex flex-col animate-in slide-in-from-right duration-300">
                        <h3 className="text-white font-bold text-sm mb-6 flex items-center gap-2">
                            <Info className="w-4 h-4 text-purple-400" /> Asset Info
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Status</label>
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                                    <Clock className="w-3 h-3" />
                                    Pending Review
                                </span>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Details</label>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400">File Type</span>
                                        <span className="text-white">{asset.file_type.split('/')[1].toUpperCase()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400">Size</span>
                                        <span className="text-white">{(asset.size / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400">Owner</span>
                                        <span className="text-white">Invision Studio</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-[#1f202b]">
                                <p className="text-[10px] text-slate-500 leading-relaxed italic">
                                    Select an annotation on the image to view comments and start a discussion.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
