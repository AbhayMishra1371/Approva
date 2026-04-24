"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, ExternalLink, Inbox, MessageSquare, UserPlus, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { getJwt } from '@/lib/auth/auth';

interface Notification {
    $id: string;
    type: string;
    title: string;
    message: string;
    link: string;
    is_read: boolean;
    created_at: string;
    actor_id?: string;
}

export const NotificationBell: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        try {
            const jwt = await getJwt();
            const res = await fetch('/api/notifications?limit=10', {
                headers: {
                    ...(jwt && { "Authorization": `Bearer ${jwt}` })
                }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
            }
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Set up polling every minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const markAsRead = async (id: string) => {
        try {
            const jwt = await getJwt();
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(jwt && { "Authorization": `Bearer ${jwt}` })
                },
                body: JSON.stringify({ id, is_read: true })
            });

            if (res.ok) {
                setNotifications(prev => prev.map(n => n.$id === id ? { ...n, is_read: true } : n));
            }
        } catch (err) {
            console.error("Failed to mark as read:", err);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const getIcon = (type: string) => {
        switch (type) {
            case 'invite': return <UserPlus className="w-4 h-4 text-blue-400" />;
            case 'status_change': return <Clock className="w-4 h-4 text-amber-400" />;
            case 'approval': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
            case 'mention': return <MessageSquare className="w-4 h-4 text-purple-400" />;
            default: return <Bell className="w-4 h-4 text-slate-400" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all duration-200"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-[#12131a] animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-[#1a1b23]/95 backdrop-blur-xl border border-[#2a2b36] rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-[#2a2b36] flex items-center justify-between bg-white/5">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            <Inbox className="w-4 h-4 text-purple-400" />
                            Notifications
                        </h3>
                        {unreadCount > 0 && (
                            <span className="text-xs text-slate-400">
                                {unreadCount} unread
                            </span>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-slate-500 italic">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-12 text-center">
                                <Bell className="w-8 h-8 text-slate-700 mx-auto mb-3 opacity-20" />
                                <p className="text-slate-500 text-sm">All caught up!</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.$id}
                                    className={`relative p-4 border-b border-[#2a2b36]/50 transition-colors group ${!n.is_read ? 'bg-purple-500/5' : 'hover:bg-white/5'}`}
                                >
                                    <div className="flex gap-3">
                                        <div className={`mt-1 shrink-0 w-8 h-8 rounded-full flex items-center justify-center border shadow-sm ${!n.is_read ? 'bg-purple-600/10 border-purple-500/30' : 'bg-slate-800 border-slate-700'}`}>
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={`text-sm font-medium ${!n.is_read ? 'text-white' : 'text-slate-300'}`}>
                                                    {n.title}
                                                </p>
                                                {!n.is_read && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); markAsRead(n.$id); }}
                                                        className="p-1 text-slate-500 hover:text-emerald-400 transition-colors"
                                                        title="Mark as read"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                                {n.message}
                                            </p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDistanceToNow(new Date(n.created_at || new Date()), { addSuffix: true })}
                                                </span>
                                                <Link
                                                    href={n.link}
                                                    onClick={() => { setIsOpen(false); markAsRead(n.$id); }}
                                                    className="text-[10px] text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
                                                >
                                                    View Details
                                                    <ExternalLink className="w-2.5 h-2.5" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                    {!n.is_read && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-500 rounded-r-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-3 border-t border-[#2a2b36] bg-black/20 text-center">
                        <Link
                            href="/dashboard/activity"
                            className="text-xs text-slate-400 hover:text-white transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            View all recent activity
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};
