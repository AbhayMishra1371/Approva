"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { ID } from "appwrite";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/appwrite/client";

interface AssetUploadProps {
    projectId: string;
    onUploadSuccess?: () => void;
    hideWhenIdle?: boolean;
}

export function AssetUpload({ projectId, onUploadSuccess, hideWhenIdle }: AssetUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        const file = acceptedFiles[0];

        // 1. Validate File Size (e.g., max 50MB)
        const MAX_SIZE = 50 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            setError("File size exceeds the 50MB limit.");
            return;
        }

        setUploading(true);
        setError(null);
        setSuccess(false);
        setProgress(0);

        try {

            const progressInterval = setInterval(() => {
                setProgress(p => Math.min(p + 10, 90));
            }, 500);

            // 2. Upload to Appwrite Storage
            const fileExt = file.name.split('.').pop() || 'unknown';
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

            // Appwrite Storage expects standard File object, not a custom path like Supabase
            // We store the original file name and let Appwrite generate the ID

            const { account, storage, databases } = createBrowserClient();
            const user = await account.get();

            const storageData = await storage.createFile(
                process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ASSETS_ID!,
                ID.unique(),
                file
            );

            clearInterval(progressInterval);

            setProgress(95);

            // Get the public URL for the file (Appwrite)
            const publicUrl = storage.getFileView(
                process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ASSETS_ID!,
                storageData.$id
            ).toString();

            // 3. Save metadata to Database directly
            await databases.createDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ASSETS_ID!,
                ID.unique(),
                {
                    project_id: projectId,
                    file_name: file.name,
                    file_path: storageData.$id,
                    file_type: file.type,
                    size: file.size,
                    url: publicUrl,
                    version: "v1",
                    status: "Pending"
                }
            );

            setProgress(100);
            setSuccess(true);

            if (onUploadSuccess) {
                onUploadSuccess();
            } else {
                router.refresh();
            }


            setTimeout(() => {
                setSuccess(false);
                setProgress(0);
            }, 3000);

        } catch (err: any) {
            console.error("Asset Upload Error:", err instanceof Error ? err.message : err);
            setError(err.message || "An unexpected error occurred.");
            setProgress(0);
        } finally {
            setUploading(false);
        }
    }, [projectId, router, onUploadSuccess]);

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        maxFiles: 1,
        maxSize: 50 * 1024 * 1024,
        onDropRejected: (fileRejections) => {
            const rejection = fileRejections[0];
            if (rejection.errors[0]?.code === "file-too-large") {
                setError("File size exceeds the 50MB limit.");
            } else {
                setError("Invalid file.");
            }
        }
    });

    return (
        <div className={`w-full ${hideWhenIdle && !uploading && !success && !error && !isDragActive && !isDragReject ? 'hidden' : ''}`}>
            <div
                {...getRootProps()}
                className={`
                    w-full relative overflow-hidden transition-all duration-300 ease-in-out
                    border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer
                    ${isDragActive ? 'border-purple-500 bg-purple-500/5' : 'border-[#2a2b36] bg-[#1a1c26] hover:bg-[#1f202b] hover:border-[#3f404d]'}
                    ${isDragReject ? 'border-rose-500 bg-rose-500/5' : ''}
                    ${error ? 'border-rose-500 bg-rose-500/5' : ''}
                    ${success ? 'border-emerald-500 bg-emerald-500/5' : ''}
                `}
            >
                <input {...getInputProps()} disabled={uploading} />

                {/* Status Icons */}
                <div className="mb-4">
                    {uploading ? (
                        <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                    ) : success ? (
                        <CheckCircle className="w-10 h-10 text-emerald-500" />
                    ) : error ? (
                        <AlertCircle className="w-10 h-10 text-rose-500" />
                    ) : (
                        <div className="w-14 h-14 bg-[#1e1f2b] rounded-2xl flex items-center justify-center shadow-inner">
                            <UploadCloud className={`w-7 h-7 ${isDragActive ? 'text-purple-400' : 'text-slate-400'}`} />
                        </div>
                    )}
                </div>

                {/* Text Content */}
                {uploading ? (
                    <div>
                        <h3 className="text-white font-bold mb-1">Uploading Asset...</h3>
                        <p className="text-sm text-slate-400">Please wait while your file is securely uploaded.</p>
                    </div>
                ) : success ? (
                    <div>
                        <h3 className="text-emerald-400 font-bold mb-1">Upload Successful!</h3>
                        <p className="text-sm text-emerald-500/70">Your asset has been added to the project.</p>
                    </div>
                ) : (
                    <div>
                        <h3 className="text-white font-bold mb-1">
                            {isDragActive ? 'Drop your file here' : 'Click or drag file to upload'}
                        </h3>
                        <p className="text-sm text-slate-400 mb-2">
                            Supports any file type up to 50MB
                        </p>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mt-4 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                        <span className="text-sm text-rose-400 font-medium">{error}</span>
                        <button
                            onClick={(e) => { e.stopPropagation(); setError(null); }}
                            className="ml-2 hover:bg-rose-500/20 p-1 rounded-md transition-colors"
                        >
                            <X className="w-3 h-3 text-rose-400" />
                        </button>
                    </div>
                )}

                {/* Progress Bar Container */}
                {uploading && (
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#12131a]">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
