"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus } from "lucide-react";
import { getJwt } from "@/lib/auth/auth";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Collaborator, Invite } from "@/types";

interface CollaboratorsTabProps {
    projectId: string;
    currentRole: string | null;
}

export function CollaboratorsTab({ projectId, currentRole }: CollaboratorsTabProps) {
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [invites, setInvites] = useState<Invite[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCollaborators = async () => {
            try {
                const jwt = await getJwt();
                const res = await fetch(`/api/projects/collaborators?projectId=${projectId}`, {
                    headers: { "Authorization": `Bearer ${jwt}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCollaborators(data.collaborators || []);
                    if (currentRole === 'owner' || currentRole === 'admin') {
                        setInvites(data.invites || []);
                    }
                } else {
                    console.error("Error fetching collaborators");
                }
            } catch (err) {
                console.error("Error fetching collaborators block:", err instanceof Error ? err.message : err);
            } finally {
                setIsLoading(false);
            }
        };

        if (currentRole) fetchCollaborators();
    }, [projectId, currentRole]);

    const updateRole = async (collaboratorId: string, newRole: string) => {
        try {
            const jwt = await getJwt();

            const res = await fetch(`/api/projects/collaborators`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwt}`
                },
                body: JSON.stringify({
                    projectId,
                    collaboratorId,
                    newRole
                })
            });

            if (res.ok) {
                toast.success("Role updated successfully");
                setCollaborators(collaborators.map(c =>
                    c.id === collaboratorId ? { ...c, role: newRole } : c
                ));
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to update role");
            }
        } catch (err) {
            console.error("Error updating role:", err);
            toast.error("An error occurred while updating the role");
        }
    };

    if (isLoading) {
        return <div className="text-slate-500 text-sm animate-pulse">Loading collaborators...</div>;
    }

    return (
        <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto">
            {/* Active Collaborators */}
            <div>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-400" /> Active Members
                </h2>
                <div className="bg-[#1e1f2b] border border-[#2a2b36] rounded-xl overflow-hidden shadow-sm">
                    {collaborators.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 text-sm">No active members found.</div>
                    ) : (
                        <div className="divide-y divide-[#2a2b36]">
                            {collaborators.map(c => (
                                <div key={c.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#252634] transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md">
                                            {(() => {
                                                const displayName = (c.name && c.name !== "Unknown User") ? c.name : (c.email || "Member");
                                                return displayName.charAt(0).toUpperCase();
                                            })()}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium text-sm">
                                                {(c.name && c.name !== "Unknown User") ? c.name : (c.email || "Member")}
                                            </p>
                                            <p className="text-slate-500 text-xs mt-0.5">Joined {new Date(c.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {(currentRole === 'owner' || currentRole === 'admin') && c.role !== 'owner' ? (
                                            <Select
                                                value={c.role}
                                                onValueChange={(val) => updateRole(c.id, val)}
                                            >
                                                <SelectTrigger className={`h-8 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border outline-none focus:ring-0 ${c.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                                    }`}>
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#12131a] border-[#2a2b36] text-white">
                                                    <SelectItem value="admin" className="focus:bg-[#1e1f2b] focus:text-white cursor-pointer">Admin</SelectItem>
                                                    <SelectItem value="reviewer" className="focus:bg-[#1e1f2b] focus:text-white cursor-pointer">Reviewer</SelectItem>
                                                    <SelectItem value="viewer" className="focus:bg-[#1e1f2b] focus:text-white cursor-pointer">Viewer</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider
                                                ${c.role === 'owner' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                                    c.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                                        'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                                                {c.role}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Pending Invites (Only visible to admin/owner) */}
            {(currentRole === 'owner' || currentRole === 'admin') && invites.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-amber-500" /> Pending Invites
                    </h2>
                    <div className="bg-[#1e1f2b] border border-[#2a2b36] border-dashed rounded-xl overflow-hidden shadow-sm">
                        <div className="divide-y divide-[#2a2b36]">
                            {invites.map(i => (
                                <div key={i.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#151720]/50 hover:bg-[#1a1c26] transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center text-slate-400">
                                            {i.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-slate-300 font-medium text-sm">{i.email}</p>
                                            <p className="text-slate-500 text-xs mt-0.5">Invited {new Date(i.invited_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="px-2.5 py-1 rounded-md text-xs font-bold text-slate-400 bg-slate-800/50 uppercase tracking-wider border border-slate-700/50">
                                            Pending {i.role}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
