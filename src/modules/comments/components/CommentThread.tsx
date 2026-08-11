"use client";

import React, { useState } from 'react';
import { Send, User, X, CheckCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
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

export type Comment = {
    $id: string;
    user_id: string;
    user_email: string;
    text: string;
    created_at: string;
    profiles?: {
        name: string;
        avatar_url: string | null;
    } | null;
};

interface CommentThreadProps {
    annotationId: string;
    comments: Comment[];
    onAddComment: (text: string, mentions?: string[]) => void;
    onClose: () => void;
    onResolve: () => void;
    onDelete: () => void;
    onDeleteComment: (commentId: string) => void;
    status: 'pending' | 'resolved';
    annotationName?: string;
    readOnly?: boolean;
    currentUserId?: string;
    annotationOwnerId?: string;
    role?: 'owner' | 'admin' | 'reviewer' | 'viewer' | null;
    collaborators?: any[];
}

export const CommentThread: React.FC<CommentThreadProps> = ({
    annotationId,
    comments,
    onAddComment,
    onClose,
    onResolve,
    onDelete,
    onDeleteComment,
    status,
    annotationName,
    readOnly = false,
    currentUserId,
    annotationOwnerId,
    role,
    collaborators = []
}) => {
    const [mentionSearch, setMentionSearch] = useState("");
    const [showMentions, setShowMentions] = useState(false);
    const [mentionIndex, setMentionIndex] = useState(-1);
    const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);

    const inputRef = React.useRef<HTMLDivElement>(null);
    const savedRangeRef = React.useRef<Range | null>(null);
    const [isEmpty, setIsEmpty] = useState(true);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputRef.current) return;

        // Parse child nodes to convert mention spans into @[Name](userId)
        let submitText = "";
        const childNodes = inputRef.current.childNodes;
        const submitUserIds: string[] = [];

        childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                submitText += node.textContent;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;
                if (el.tagName === "SPAN" && el.getAttribute("data-user-id")) {
                    const userId = el.getAttribute("data-user-id")!;
                    const name = el.getAttribute("data-name")!;
                    submitText += `@[${name}](${userId})`;
                    if (!submitUserIds.includes(userId)) {
                        submitUserIds.push(userId);
                    }
                } else {
                    submitText += el.innerText;
                }
            }
        });

        if (!submitText.trim()) return;

        onAddComment(submitText, submitUserIds);

        // Clear the input
        inputRef.current.innerHTML = "";
        setMentionedUserIds([]);
        setIsEmpty(true);
        setShowMentions(false);
    };

    const handleInputChange = () => {
        if (!inputRef.current) return;
        const text = inputRef.current.innerText || "";
        setIsEmpty(text.trim() === "");

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            savedRangeRef.current = range.cloneRange();

            const textNode = range.startContainer;
            if (textNode.nodeType === Node.TEXT_NODE) {
                const offset = range.startOffset;
                const textBeforeCursor = textNode.textContent?.substring(0, offset) || "";
                const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
                if (mentionMatch) {
                    setShowMentions(true);
                    setMentionSearch(mentionMatch[1]);
                    setMentionIndex(textBeforeCursor.lastIndexOf('@'));
                    return;
                }
            }
        }
        setShowMentions(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const insertMention = (user: any) => {
        if (!inputRef.current) return;
        inputRef.current.focus();

        const selection = window.getSelection();
        let range = savedRangeRef.current;

        if (!range && selection && selection.rangeCount > 0) {
            range = selection.getRangeAt(0);
        }

        if (range) {
            const textNode = range.startContainer;
            if (textNode.nodeType === Node.TEXT_NODE) {
                const offset = range.startOffset;
                // Go back to find the '@' symbol and delete it along with search term
                const start = Math.max(0, offset - mentionSearch.length - 1);
                range.setStart(textNode, start);
                range.deleteContents();
            }

            const span = document.createElement("span");
            span.contentEditable = "false";
            span.className = "bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded mx-0.5 inline-block font-semibold text-xs";
            span.setAttribute("data-user-id", user.user_id);
            span.setAttribute("data-name", user.name);
            span.innerText = user.name; // NO @ symbol in the input box!

            range.insertNode(span);

            // Insert a space after
            const space = document.createTextNode("\u00a0");
            range.collapse(false);
            range.insertNode(space);

            range.setStartAfter(space);
            range.setEndAfter(space);
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(range);
            }
        } else {
            const span = document.createElement("span");
            span.contentEditable = "false";
            span.className = "bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded mx-0.5 inline-block font-semibold text-xs";
            span.setAttribute("data-user-id", user.user_id);
            span.setAttribute("data-name", user.name);
            span.innerText = user.name;

            inputRef.current.appendChild(span);
            inputRef.current.appendChild(document.createTextNode("\u00a0"));
        }

        setShowMentions(false);
        setIsEmpty(false);
        if (!mentionedUserIds.includes(user.user_id)) {
            setMentionedUserIds([...mentionedUserIds, user.user_id]);
        }
    };

    const filteredCollaborators = collaborators.filter(c => {
        const search = mentionSearch.toLowerCase();
        const matchesUsername = c.username ? c.username.toLowerCase().includes(search) : false;
        const matchesName = c.name ? c.name.toLowerCase().includes(search) : false;
        return matchesUsername || matchesName;
    });

    const renderCommentText = (text: string) => {
        if (!text) return "";

        // Handle @[Name](userId) format
        const markdownMentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
        if (markdownMentionRegex.test(text)) {
            markdownMentionRegex.lastIndex = 0;
            const segments: React.ReactNode[] = [];
            let lastIdx = 0;
            let match;
            while ((match = markdownMentionRegex.exec(text)) !== null) {
                if (match.index > lastIdx) {
                    segments.push(<React.Fragment key={lastIdx}>{text.slice(lastIdx, match.index)}</React.Fragment>);
                }
                const displayName = match[1];
                const userId = match[2];
                segments.push(
                    <Link
                        key={match.index}
                        href={`/dashboard/profile/${userId}`}
                        className="text-purple-400 font-bold hover:underline cursor-pointer"
                    >
                        {displayName}
                    </Link>
                );
                lastIdx = match.index + match[0].length;
            }
            if (lastIdx < text.length) {
                segments.push(<React.Fragment key={lastIdx}>{text.slice(lastIdx)}</React.Fragment>);
            }
            return segments;
        }

        // Fallback: legacy plain-name mention format
        const escapeRegExp = (str: string) => {
            return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        };

        const patterns = (collaborators || [])
            .map(c => c.name)
            .filter(Boolean)
            .map(name => escapeRegExp(name));

        if (patterns.length === 0) return <>{text}</>;

        patterns.sort((a, b) => b.length - a.length);
        // Match name optionally preceded by @
        const regex = new RegExp(`(@?(?:${patterns.join('|')}))`, 'g');
        const parts = text.split(regex);

        return parts.map((part, index) => {
            const cleanPart = part.startsWith('@') ? part.substring(1) : part;
            const collaborator = (collaborators || []).find(c => c.name === cleanPart);
            if (collaborator) {
                return (
                    <Link
                        key={index}
                        href={`/dashboard/profile/${collaborator.user_id}`}
                        className="text-purple-400 font-bold hover:underline cursor-pointer"
                    >
                        {cleanPart}
                    </Link>
                );
            }
            return <React.Fragment key={index}>{part}</React.Fragment>;
        });
    };

    return (
        <div
            className="flex flex-col bg-[#1e1f2b]/95 backdrop-blur-xl border border-[#2a2b36] w-80 max-h-[450px] rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div className="p-4 border-b border-[#2a2b36] flex items-center justify-between">
                <h3 className="text-white font-bold text-sm">{annotationName || 'Annotation Thread'}</h3>
                <div className="flex items-center gap-2">
                    {!readOnly && status === 'pending' && (
                        <button
                            onClick={onResolve}
                            className="p-1.5 hover:bg-emerald-500/10 text-emerald-500 rounded-lg transition-colors"
                            title="Approve Annotation"
                        >
                            <CheckCircle className="w-4 h-4" />
                        </button>
                    )}
                    {!readOnly && (currentUserId === annotationOwnerId) && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <button
                                    className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors"
                                    title="Delete Annotation"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-[#12131a] border-[#1f202b] text-white">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-slate-400">
                                        This will permanently delete this annotation and all of its comments. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-[#12131a] border-[#2a2b36] hover:text-white text-slate-300">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={onDelete} className="bg-rose-500 hover:bg-rose-600 text-white">Delete Annotation</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
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
                    (() => {
                        const grouped: Array<{
                            user_id: string;
                            user_email: string;
                            profiles: any;
                            comments: Comment[];
                        }> = [];

                        comments.forEach(comment => {
                            const lastGroup = grouped[grouped.length - 1];
                            if (lastGroup && lastGroup.user_id === comment.user_id) {
                                lastGroup.comments.push(comment);
                            } else {
                                grouped.push({
                                    user_id: comment.user_id,
                                    user_email: comment.user_email,
                                    profiles: comment.profiles,
                                    comments: [comment]
                                });
                            }
                        });

                        return grouped.map((group, groupIndex) => (
                            <div key={groupIndex} className="flex gap-3 group/group-item">
                                {group.profiles?.avatar_url ? (
                                    <img
                                        src={group.profiles.avatar_url}
                                        alt={group.profiles.name || 'Avatar'}
                                        className="w-8 h-8 rounded-full object-cover shrink-0"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 font-bold text-xs text-purple-400 shrink-0">
                                        {(group.profiles?.name || group.user_email)?.[0]?.toUpperCase() || '?'}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0 space-y-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-white truncate max-w-[120px]">
                                            {group.profiles?.name || group.user_email.split('@')[0]}
                                        </span>
                                        <span className="text-[10px] text-slate-500">
                                            {new Date(group.comments[0].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="space-y-1.5">
                                        {group.comments.map((comment) => (
                                            <div key={comment.$id} className="flex items-center gap-2 group/comment-item">
                                                <div className="flex-1 bg-[#12131a] rounded-xl p-3 text-sm text-slate-300 break-words border border-[#2a2b36]">
                                                    {renderCommentText(comment.text)}
                                                </div>
                                                {!readOnly && currentUserId && comment.user_id === currentUserId && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <button
                                                                className="p-1 hover:bg-rose-500/10 text-rose-500 rounded transition-colors opacity-0 group-hover/comment-item:opacity-100 shrink-0"
                                                                title="Delete Comment"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent className="bg-[#12131a] border-[#1f202b] text-white max-w-sm rounded-[2rem]">
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete comment?</AlertDialogTitle>
                                                                <AlertDialogDescription className="text-slate-400">
                                                                    This will permanently delete this comment.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel className="bg-[#1e1f2b] border-[#2a2b36] hover:bg-[#2a2b36] hover:text-white text-slate-300 h-9 px-4 rounded-xl text-xs font-semibold">Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => onDeleteComment(comment.$id)} className="bg-rose-500 hover:bg-rose-600 text-white h-9 px-4 rounded-xl text-xs font-semibold shadow-xl shadow-rose-500/20">Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ));
                    })()
                )}
            </div>

            {!readOnly && (
                <div className="p-4 border-t border-[#2a2b36] relative">
                    {showMentions && (
                        <div className="absolute bottom-full left-4 right-4 mb-2 bg-[#1a1b23] border border-[#2a2b36] rounded-xl shadow-2xl z-50 animate-in slide-in-from-bottom-2 duration-200 max-h-48 overflow-y-auto">
                            {filteredCollaborators.length > 0 ? (
                                filteredCollaborators.map((collab) => (
                                    <button
                                        key={collab.user_id}
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => insertMention(collab)}
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
                    <form onSubmit={handleSubmit} className="relative">
                        {isEmpty && (
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-600 pointer-events-none">
                                Write a comment... (@mention)
                            </div>
                        )}
                        <div
                            ref={inputRef}
                            contentEditable={!readOnly}
                            onInput={handleInputChange}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-[#12131a] border border-[#2a2b36] rounded-xl pl-4 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors min-h-[40px] max-h-24 overflow-y-auto cursor-text"
                            style={{ outline: 'none', wordBreak: 'break-word', cursor: 'text' }}
                        />
                        <button
                            type="submit"
                            disabled={isEmpty}
                            className="absolute right-2 bottom-1.5 p-1.5 text-purple-500 hover:text-purple-400 disabled:text-slate-600 transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};
