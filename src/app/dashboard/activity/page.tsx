"use client";

import { ActivityLog } from "@/components/projects/ActivityLog";
import { Activity } from "lucide-react";

export default function GlobalActivityPage() {
    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Activity Stream</h1>
                        <p className="text-slate-400">Recent events across all your projects.</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 bg-[#12131a] rounded-xl border border-[#1f202b] shadow-xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-[#1f202b] bg-[#1a1b23]">
                    <h2 className="text-sm font-semibold text-slate-300">Detailed History</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <ActivityLog /> {/* No projectId means Global Mode */}
                </div>
            </div>
        </div>
    );
}
