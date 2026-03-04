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

    const handleAddAnnotation = async (newAnn: Omit<Annotation, 'created_at' | 'status'>) => {
        try {
            const { databases } = createBrowserClient();
            const doc = await databases.createDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                annotationsCollectionId,
                ID.unique(),
                {
                    asset_id: assetId,
                    x: newAnn.x,
                    y: newAnn.y,
                    width: newAnn.width,
                    height: newAnn.height,
                    status: 'pending'
                }
            );

            const added: Annotation = {
                $id: doc.$id,
                ...newAnn,
                status: 'pending',
                created_at: new Date().toISOString()
            };

            setAnnotations([...annotations, added]);
            setSelectedAnnotation(added);
            setComments([]); // New annotation has no comments
        } catch (e) {
            console.error("Failed to save annotation:", e);
            alert("Failed to save annotation. Make sure the 'annotations' collection exists in Appwrite.");
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
            alert("Failed to save comment. Make sure the 'comments' collection exists in Appwrite.");
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
        } catch (e) {
            console.error("Failed to delete annotation:", e);
            alert("Failed to delete annotation.");
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
                                fetchComments(ann.$id!);
                            }}
                            selectedAnnotationId={selectedAnnotation?.$id}
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
                        comments={comments}
                        onAddComment={handleAddComment}
                        onClose={() => setSelectedAnnotation(null)}
                        onResolve={handleResolve}
                        onDelete={handleDeleteAnnotation}
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
