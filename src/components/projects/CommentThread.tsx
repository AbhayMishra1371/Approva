"use client";

import React, { useState } from 'react';
import { Send, User, X, CheckCircle, Trash2 } from 'lucide-react';

export type Comment = {
    $id: string;
    user_id: string;
    user_email: string;
    text: string;
    created_at: string;
};

interface CommentThreadProps {
    annotationId: string;
    comments: Comment[];
    onAddComment: (text: string) => void;
    onClose: () => void;
    onResolve: () => void;
    onDelete: () => void;
    onDeleteComment: (commentId: string) => void;
    status: 'pending' | 'resolved';
}

export const CommentThread: React.FC<CommentThreadProps> = ({
    annotationId,
    comments,
    onAddComment,
    onClose,
    onResolve,
    onDelete,
    onDeleteComment,
    status
}) => {
    const [newComment, setNewComment] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        onAddComment(newComment);
        setNewComment("");
    };

    return (
        <div className="flex flex-col h-full bg-[#1e1f2b] border-l border-[#2a2b36] w-80 animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-[#2a2b36] flex items-center justify-between">
                <h3 className="text-white font-bold text-sm">Annotation Thread</h3>
                <div className="flex items-center gap-2">
                    {status === 'pending' && (
                        <button
                            onClick={onResolve}
                            className="p-1.5 hover:bg-emerald-500/10 text-emerald-500 rounded-lg transition-colors"
                            title="Mark as Resolved"
                        >
                            <CheckCircle className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={() => {
                            if (confirm("Are you sure you want to delete this annotation and all its comments?")) {
                                onDelete();
                            }
                        }}
                        className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors"
                        title="Delete Annotation"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-white/10 text-slate-400 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {comments.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-12 h-12 bg-[#12131a] rounded-full flex items-center justify-center mx-auto mb-3">
                            <Send className="w-5 h-5 text-slate-600" />
                        </div>
                        <p className="text-slate-500 text-xs">No comments yet. Start the conversation!</p>
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.$id} className="flex gap-3 group">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-purple-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-white truncate max-w-[120px]">
                                            {comment.user_email.split('@')[0]}
                                        </span>
                                        <span className="text-[10px] text-slate-500">
                                            {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (confirm("Delete this comment?")) {
                                                onDeleteComment(comment.$id);
                                            }
                                        }}
                                        className="p-1 hover:bg-rose-500/10 text-rose-500 rounded transition-colors opacity-0 group-hover:opacity-100"
                                        title="Delete Comment"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="bg-[#12131a] rounded-xl p-3 text-sm text-slate-300 break-words border border-[#2a2b36]">
                                    {comment.text}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 border-t border-[#2a2b36]">
                <form onSubmit={handleSubmit} className="relative">
                    <input
                        type="text"
                        placeholder="Write a comment..."
                        className="w-full bg-[#12131a] border border-[#2a2b36] rounded-xl pl-4 pr-10 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-purple-500 hover:text-purple-400 disabled:text-slate-600 transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
};
