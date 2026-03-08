"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    FolderGit2,
    Plus,
    Calendar,
    Users,
    AlertCircle,
    MoreVertical,
    Trash2,
    X,
    Loader2
} from "lucide-react";
import { createBrowserClient } from "@/lib/appwrite/client";
import { Query, ID } from "appwrite";

type Project = {
    id: string;
    name: string;
    client_name: string;
    deadline: string;
    status: string;
    owner_id: string;
    created_at: string;
};

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const { account } = createBrowserClient();
            const { jwt } = await account.createJWT();
            const res = await fetch("/api/projects", {
                headers: { "Authorization": `Bearer ${jwt}` }
            });

            if (res.ok) {
                const data = await res.json();
                setProjects(data.projects);
            } else {
                console.error("Failed to fetch projects");
            }
        } catch (err) {
            console.error("Error fetching projects:", err instanceof Error ? err.message : err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteProject = async (id: string) => {
        try {
            const { databases } = createBrowserClient();
            await databases.deleteDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_PROJECTS_ID!,
                id
            );
            setProjects(projects.filter(p => p.id !== id));
        } catch (err) {
            console.error("Error deleting project:", err);
        }
    };

    return (
        <div className="flex flex-col gap-8 w-full">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Projects</h1>
                    <p className="text-slate-400">
                        Manage your asset approval workspaces.
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2.5 flex items-center gap-2 transition-colors font-medium text-sm"
                >
                    <Plus className="w-4 h-4" />
                    Create Project
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                </div>
            ) : projects.length === 0 ? (
                <div className="bg-[#12131a] border border-[#1f202b] rounded-xl p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-[#1e1f2b] rounded-2xl flex items-center justify-center mb-4">
                        <FolderGit2 className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No projects yet</h3>
                    <p className="text-slate-400 max-w-sm mb-6">
                        Create your first project to start organizing assets and managing approvals with your clients.
                    </p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-6 py-3 flex items-center gap-2 transition-colors font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        Create Project
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <ProjectCard key={project.id} project={project} onDelete={handleDeleteProject} />
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {isModalOpen && (
                <CreateProjectModal
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={(newProject) => {
                        setProjects([newProject, ...projects]);
                        setIsModalOpen(false);
                    }}
                />
            )}
        </div>
    );
}

function ProjectCard({ project, onDelete }: { project: Project; onDelete?: (id: string) => void }) {
    // Mock data for counts where not in spec
    const collabCount = Math.floor(Math.random() * 5) + 1;
    const pendingApprovals = Math.floor(Math.random() * 8);

    return (
        <Link href={`/dashboard/projects/${project.id}`}>
            <div className="bg-[#12131a] hover:bg-[#151720] border border-[#1f202b] hover:border-purple-500/30 rounded-xl p-5 flex flex-col gap-4 transition-all group cursor-pointer h-full">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                            <FolderGit2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold leading-tight group-hover:text-purple-400 transition-colors">
                                {project.name}
                            </h3>
                            <p className="text-slate-400 text-xs mt-0.5">{project.client_name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 relative z-10">
                        <button
                            className="text-slate-500 hover:text-rose-400 p-1.5 rounded-md hover:bg-rose-500/10 transition-colors"
                            onClick={(e) => {
                                e.preventDefault();
                                if (onDelete && confirm(`Are you sure you want to delete ${project.name}?`)) {
                                    onDelete(project.id);
                                }
                            }}
                            title="Delete Project"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="text-slate-500 hover:text-white p-1.5 rounded-md hover:bg-[#1e1f2b] transition-colors" onClick={(e) => e.preventDefault()}>
                            <MoreVertical className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-2.5 mt-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full font-medium ${project.status === "Active" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-400"
                            }`}>
                            {project.status}
                        </span>
                    </div>

                    <div className="h-px w-full bg-[#1f202b] my-1" />

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                            <Users className="w-3.5 h-3.5" />
                            <span>{collabCount} Collaborators</span>
                        </div>

                        {pendingApprovals > 0 ? (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 px-2 py-1 bg-amber-400/10 rounded-lg">
                                <AlertCircle className="w-3.5 h-3.5" />
                                {pendingApprovals} pending
                            </div>
                        ) : (
                            <div className="text-xs text-slate-500">Up to date</div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}

function CreateProjectModal({
    onClose,
    onSuccess
}: {
    onClose: () => void;
    onSuccess: (project: Project) => void;
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name"),
            clientName: formData.get("clientName"),
            deadline: formData.get("deadline"),
            status: formData.get("status"),
        };

        try {
            const { account, databases } = createBrowserClient();
            const user = await account.get();

            const project = await databases.createDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_PROJECTS_ID!,
                ID.unique(),
                {
                    name: data.name,
                    client_name: data.clientName,
                    deadline: data.deadline,
                    status: data.status || "Active",
                    owner_id: user.$id,
                }
            );

            try {
                await databases.createDocument(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                    process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLABORATORS_ID!,
                    ID.unique(),
                    {
                        project_id: project.$id,
                        user_id: user.$id,
                        role: "owner"
                    }
                );
            } catch (collabError) {
                console.error("Failed to insert owner as collaborator (check permissions):", collabError);
            }

            onSuccess({ ...project, id: project.$id } as any);
        } catch (err) {
            console.error("Error creating project:", err instanceof Error ? err.message : err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#12131a] border border-[#1f202b] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-5 border-b border-[#1f202b]">
                    <h2 className="text-lg font-bold text-white">Create New Project</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-[#1e1f2b] transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Project Name</label>
                        <input
                            required
                            name="name"
                            placeholder="e.g., Summer Campaign 2026"
                            className="w-full bg-[#1e1f2b] border border-[#2a2b36] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-slate-600"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Client Name</label>
                        <input
                            required
                            name="clientName"
                            placeholder="e.g., Acme Corp"
                            className="w-full bg-[#1e1f2b] border border-[#2a2b36] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-slate-600"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Deadline</label>
                            <input
                                required
                                type="date"
                                name="deadline"
                                className="w-full bg-[#1e1f2b] border border-[#2a2b36] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Status</label>
                            <select
                                name="status"
                                className="w-full bg-[#1e1f2b] border border-[#2a2b36] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all appearance-none"
                            >
                                <option value="Active">Active</option>
                                <option value="Archived">Archived</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-4 pt-4 border-t border-[#1f202b]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-transparent hover:bg-[#1e1f2b] border border-[#2a2b36] text-white rounded-xl py-2.5 font-bold text-sm transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-2.5 font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Project"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
