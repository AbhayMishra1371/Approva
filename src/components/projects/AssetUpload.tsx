"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { v4 as uuidv4 } from "uuid";

interface AssetUploadProps {
    projectId: string;
    onUploadSuccess?: () => void;
    hideWhenIdle?: boolean;
    assetGroupId?: string;
    currentVersion?: number;
}

export function AssetUpload({ projectId, onUploadSuccess, hideWhenIdle, assetGroupId, currentVersion }: AssetUploadProps) {
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

            // 2. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop() || 'unknown';
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

            const supabase = createSupabaseClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No authenticated user session found");

            const { data: storageData, error: uploadError } = await supabase.storage
                .from("assets")
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            clearInterval(progressInterval);
            setProgress(95);

            // Get the public URL for the file (Supabase)
            const { data: { publicUrl } } = supabase.storage
                .from("assets")
                .getPublicUrl(fileName);

            // 3. Save metadata to Database
            const isNewVersion = !!assetGroupId;
            const groupId = assetGroupId || uuidv4();
            const newVersionNumber = isNewVersion ? (currentVersion || 1) + 1 : 1;

            if (isNewVersion) {
                try {
                    const { error: updateError } = await supabase
                        .from("assets")
                        .update({ is_latest: false })
                        .eq("asset_group_id", assetGroupId)
                        .eq("is_latest", true);

                    if (updateError) throw updateError;
                } catch (e) {
                    console.error("Failed to update previous version latest status:", e);
                }
            }

            const { data: assetDoc, error: dbError } = await supabase
                .from("assets")
                .insert({
                    project_id: projectId, // UUID with hyphens
                    file_name: file.name,
                    file_path: fileName,
                    file_type: file.type,
                    file_size: file.size,
                    url: publicUrl,
                    version: `v${newVersionNumber}`,
                    status: "Pending",
                    asset_group_id: groupId,
                    is_latest: true
                })
                .select()
                .single();

            if (dbError) throw dbError;

            // Create Activity Log in Supabase
            try {
                await supabase
                    .from("activity_logs")
                    .insert({
                        project_id: projectId,
                        user_id: user.id,
                        user_email: user.email || "",
                        action: isNewVersion ? "uploaded_new_version" : "uploaded_asset",
                        entity_type: "asset",
                        entity_id: assetDoc.id,
                        metadata: JSON.stringify({
                            file_name: file.name,
                            version: `v${newVersionNumber}`
                        })
                    });
            } catch (logError) {
                console.error("Failed to log asset upload activity:", logError);
            }

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
            console.error("Asset Upload Error Details:", err);
            let message = "An unexpected error occurred.";
            if (err) {
                message = err.message || err.error_description || err.error || (typeof err === 'object' ? JSON.stringify(err) : String(err));
            }
            setError(message);
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
