"use client";

import React, { useState, useEffect } from "react";
import {
    FolderOpen,
    Clock,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    Image as ImageIcon,
    PlaySquare,
    FileText,
    UserPlus,
} from "lucide-react";
import { createBrowserClient } from "@/lib/appwrite/client";
import { Query } from "appwrite";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from "recharts";

const performanceData = [
    { name: "Mon", pending: 20, approved: 10, rejected: 5 },
    { name: "Tue", pending: 25, approved: 15, rejected: 8 },
    { name: "Wed", pending: 35, approved: 20, rejected: 4 },
    { name: "Thu", pending: 45, approved: 30, rejected: 6 },
    { name: "Fri", pending: 60, approved: 45, rejected: 10 },
    { name: "Sat", pending: 40, approved: 25, rejected: 3 },
    { name: "Sun", pending: 25, approved: 15, rejected: 2 },
];

const assetTypesData = [
    { name: "Images", value: 245 },
    { name: "Videos", value: 120 },
    { name: "Documents", value: 85 },
    { name: "Other", value: 15 },
];

const recentApprovalsData = [
    {
        id: 1,
        title: "Hero Banner v2",
        user: "Sarah K.",
        time: "2 min ago",
        status: "Approved",
        type: "image",
    },
    {
        id: 2,
        title: "Product Video",
        user: "Mike R.",
        time: "15 min ago",
        status: "Pending",
        type: "video",
    },
    {
        id: 3,
        title: "Brand Guidelines",
        user: "Lisa M.",
        time: "1 hour ago",
        status: "Rejected",
        type: "document",
    },
    {
        id: 4,
        title: "Social Media Kit",
        user: "Tom H.",
        time: "2 hours ago",
        status: "Approved",
        type: "image",
    },
];

export default function DashboardPage() {
    const [invites, setInvites] = useState<any[]>([]);
    const [isAccepting, setIsAccepting] = useState<string | null>(null);

    useEffect(() => {
        const fetchInvites = async () => {
            try {
                const { account, databases } = createBrowserClient();
                const user = await account.get();
                if (!user?.email) return;

                const invitesList = await databases.listDocuments(
                    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                    process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_INVITES_ID!,
                    [Query.equal("email", user.email)]
                );

                // Fetch project names for each invite
                const invitesWithProjectNames = await Promise.all(
                    invitesList.documents.map(async (invite: any) => {
                        try {
                            const project = await databases.getDocument(
                                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                                process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_PROJECTS_ID!,
                                invite.project_id
                            );
                            return { ...invite, projects: { name: project.name } };
                        } catch (err) {
                            return { ...invite, projects: { name: "Unknown Project" } };
                        }
                    })
                );

                setInvites(invitesWithProjectNames);
            } catch (err) {
                // User may not be logged in yet or other error
            }
        };
        fetchInvites();
    }, []);

    const handleAcceptInvite = async (inviteId: string) => {
        setIsAccepting(inviteId);
        try {
            const { account } = createBrowserClient();
            const { jwt } = await account.createJWT();
            const res = await fetch("/api/invites/accept", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${jwt}`
                },
                body: JSON.stringify({ inviteId })
            });
            if (res.ok) {
                setInvites(invites.filter((inv) => inv.id !== inviteId));
                // Optionally refresh other dashboard data here
            } else {
                const data = await res.json();
                alert(data.error || "Failed to accept invite");
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred while accepting");
        } finally {
            setIsAccepting(null);
        }
    };

    return (
        <div className="flex flex-col gap-8 w-full">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
                    <p className="text-slate-400">
                        Welcome back! Here's your approval overview.
                    </p>
                </div>
                <div className="text-sm text-slate-500">Last updated: Just now</div>
            </div>

            {/* Pending Invites Alert */}
            {invites.length > 0 && (
                <div className="flex flex-col gap-3">
                    {invites.map((invite) => (
                        <div key={invite.id} className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 flex items-center justify-between shadow-sm animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                    <UserPlus className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-sm">
                                        You have been invited to join <span className="text-purple-400">{invite.projects?.name}</span>
                                    </h3>
                                    <p className="text-slate-400 text-xs mt-0.5">
                                        Role: <span className="capitalize">{invite.role}</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleAcceptInvite(invite.id)}
                                disabled={isAccepting === invite.id}
                                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                            >
                                {isAccepting === invite.id ? "Accepting..." : "Accept Invite"}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard
                    title="Total Assets"
                    value="532"
                    trend="+12.5%"
                    trendUp={true}
                    icon={<FolderOpen className="w-5 h-5 text-purple-400" />}
                />
                <StatCard
                    title="Pending Review"
                    value="47"
                    trend="-8.2%"
                    trendUp={false}
                    icon={<Clock className="w-5 h-5 text-purple-400" />}
                />
                <StatCard
                    title="Approved Today"
                    value="128"
                    trend="+23.1%"
                    trendUp={true}
                    icon={<CheckCircle2 className="w-5 h-5 text-purple-400" />}
                />
                <StatCard
                    title="Rejection Rate"
                    value="3.2%"
                    trend="-1.5%"
                    trendUp={false}
                    icon={<AlertCircle className="w-5 h-5 text-red-400" />}
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Trend Chart (Takes up 2 columns on lg) */}
                <div className="lg:col-span-2 bg-[#12131a] border border-[#1f202b] rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-white">Approval Trends</h2>
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                                <span className="text-slate-400">Pending</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                                <span className="text-slate-400">Approved</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={performanceData}
                                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#1f202b"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="name"
                                    stroke="#64748b"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#64748b"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#1e1f2b",
                                        border: "none",
                                        borderRadius: "8px",
                                        color: "#f8fafc",
                                    }}
                                    itemStyle={{ color: "#f8fafc" }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="pending"
                                    stroke="#a855f7"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorPending)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="approved"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorApproved)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Asset Types Chart (Takes up 1 column on lg) */}
                <div className="bg-[#12131a] border border-[#1f202b] rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-white">Asset Types</h2>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={assetTypesData}
                                layout="vertical"
                                margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#1f202b"
                                    horizontal={false}
                                />
                                <XAxis
                                    type="number"
                                    stroke="#64748b"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    stroke="#fff"
                                    fontSize={13}
                                    tickLine={false}
                                    axisLine={false}
                                    width={80}
                                />
                                <Tooltip
                                    cursor={{ fill: "#1e1f2b" }}
                                    contentStyle={{
                                        backgroundColor: "#1e1f2b",
                                        border: "1px solid #334155",
                                        borderRadius: "8px",
                                        color: "#f8fafc",
                                    }}
                                />
                                <Bar
                                    dataKey="value"
                                    fill="#6366f1"
                                    radius={[0, 4, 4, 0]}
                                    barSize={24}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Approvals Section */}
            <div className="bg-[#12131a] border border-[#1f202b] rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-white">Recent Approvals</h2>
                    <button className="text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 font-medium">
                        View All <span className="text-lg leading-none">&rarr;</span>
                    </button>
                </div>

                <div className="flex flex-col gap-3">
                    {recentApprovalsData.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between p-4 rounded-xl bg-[#1e1f2b]/50 border border-[#1f202b] hover:bg-[#1e1f2b] transition-colors group cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-[#2a2b36] flex items-center justify-center text-slate-400 group-hover:text-purple-400 transition-colors">
                                    {item.type === "image" && <ImageIcon className="w-5 h-5" />}
                                    {item.type === "video" && <PlaySquare className="w-5 h-5" />}
                                    {item.type === "document" && <FileText className="w-5 h-5" />}
                                </div>
                                <div className="flex flex-col">
                                    <h4 className="text-white text-sm font-bold mb-0.5">{item.title}</h4>
                                    <div className="text-xs text-slate-500">
                                        {item.user} <span className="mx-1">•</span> {item.time}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <span
                                    className={`px-3 py-1 text-xs font-semibold rounded-full border ${item.status === "Approved"
                                        ? "text-emerald-400 border-emerald-400/20 bg-emerald-400/10"
                                        : item.status === "Pending"
                                            ? "text-amber-400 border-amber-400/20 bg-amber-400/10"
                                            : "text-rose-400 border-rose-400/20 bg-rose-400/10"
                                        }`}
                                >
                                    {item.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StatCard({
    title,
    value,
    trend,
    trendUp,
    icon,
}: {
    title: string;
    value: string;
    trend: string;
    trendUp: boolean;
    icon: React.ReactNode;
}) {
    return (
        <div className="bg-[#12131a] border border-[#1f202b] rounded-xl p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-400 font-medium text-sm">{title}</h3>
                <div className="w-10 h-10 rounded-lg bg-[#1e1f2b] flex items-center justify-center">
                    {icon}
                </div>
            </div>
            <div>
                <div className="text-3xl font-bold text-white mb-2">{value}</div>
                <div className="flex items-center gap-1.5 text-sm">
                    {trendUp ? (
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                    ) : (
                        <TrendingDown className="w-4 h-4 text-rose-400" />
                    )}
                    <span
                        className={trendUp ? "text-emerald-400 font-medium" : "text-rose-400 font-medium"}
                    >
                        {trend}
                    </span>
                    <span className="text-slate-500">vs last week</span>
                </div>
            </div>
        </div>
    );
}
