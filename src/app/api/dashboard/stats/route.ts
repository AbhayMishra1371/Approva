import { NextResponse } from "next/server";
import { getLoggedInUser } from "@/lib/supabase/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const { user } = await getLoggedInUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Get User's Project IDs (Owned + Collaborative) from Supabase
        const supabase = await createSupabaseServerClient();
        let ownedIds: string[] = [];
        try {
            const { data: ownedProjects } = await supabase
                .from("projects")
                .select("id")
                .eq("owner_id", user.$id);
            ownedIds = (ownedProjects || []).map(d => d.id);
        } catch (e) {
            console.warn("Could not query owned projects from Supabase for stats:", e);
        }

        let collabIds: string[] = [];
        try {
            const { data: collabs, error: collabsErr } = await supabase
                .from("project_collaborators")
                .select("project_id")
                .eq("user_id", user.$id);
            if (collabsErr) throw collabsErr;
            collabIds = (collabs || []).map((c: any) => c.project_id);
        } catch (e) {
            console.warn("Could not query collaborator projects from Supabase for stats:", e);
        }

        const allProjectIds = Array.from(new Set([...ownedIds, ...collabIds]));



        if (allProjectIds.length === 0) {
            return NextResponse.json({
                stats: { totalAssets: 0, pendingReview: 0, approvedToday: 0, rejectionRate: "0.0" },
                performanceData: [],
                assetTypesData: [],
                recentApprovals: [],
                invites: []
            });
        }

        // 2. Fetch Invites (Filter by email) from Supabase
        let formattedInvites: any[] = [];
        try {
            const { data: invitesRes, error: invitesErr } = await supabase
                .from("project_invites")
                .select("*")
                .eq("email", user.email)
                .eq("status", "pending");

            if (!invitesErr && invitesRes) {
                const invitesPromises = invitesRes.map(async (invite: any) => {
                    try {
                        const { data: proj } = await supabase
                            .from("projects")
                            .select("name")
                            .eq("id", invite.project_id)
                            .single();
                        return { ...invite, id: invite.id, projects: { name: proj?.name || "Unknown Project" } };
                    } catch {
                        return { ...invite, id: invite.id, projects: { name: "Unknown Project" } };
                    }
                });
                formattedInvites = await Promise.all(invitesPromises);
            }
        } catch (e) {
            console.warn("Could not query project invites from Supabase for stats:", e);
        }

        // 3. Stats for Filtered Projects
        const { count: totalAssets, error: totalErr } = await supabase
            .from("assets")
            .select("*", { count: 'exact', head: true })
            .in("project_id", allProjectIds);

        const { count: pendingReview, error: pendingErr } = await supabase
            .from("assets")
            .select("*", { count: 'exact', head: true })
            .in("project_id", allProjectIds)
            .in("status", ["draft", "in_review", "changes_requested", "Pending", "pending"]);

        // Approved Today: Accurate count from activity logs for today's approvals
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        
        let approvedToday = 0;
        try {
            const { count, error: approvedTodayErr } = await supabase
                .from("activity_logs")
                .select("*", { count: 'exact', head: true })
                .in("project_id", allProjectIds)
                .eq("action", "approved_asset")
                .gte("created_at", startOfDay.toISOString());
            
            if (!approvedTodayErr) {
                approvedToday = count || 0;
            }
        } catch (e) {
            console.warn("Could not query approved today stats from Supabase:", e);
        }

        const { count: rejectedCount } = await supabase
            .from("assets")
            .select("*", { count: 'exact', head: true })
            .in("project_id", allProjectIds)
            .eq("status", "rejected");
        const rejectionRate = totalAssets && totalAssets > 0 ? (((rejectedCount || 0) / totalAssets) * 100).toFixed(1) : "0.0";

        // 4. Trend Data (Last 7 Days) for these projects
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const { data: recentAssetsData } = await supabase
            .from("assets")
            .select("*")
            .in("project_id", allProjectIds)
            .gte("created_at", sevenDaysAgo.toISOString());

        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const trendMap: Record<string, { pending: number; approved: number; rejected: number }> = {};
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            trendMap[days[d.getDay()]] = { pending: 0, approved: 0, rejected: 0 };
        }

        const recentAssetsDocs = (recentAssetsData || []).map((doc: any) => ({ ...doc, $createdAt: doc.created_at }));
        recentAssetsDocs.forEach((doc: any) => {
            const date = new Date(doc.$createdAt);
            const dayName = days[date.getDay()];
            const status = (doc.status || "").toLowerCase();
            if (trendMap[dayName]) {
                if (status === "approved") trendMap[dayName].approved++;
                else if (status === "rejected") trendMap[dayName].rejected++;
                else trendMap[dayName].pending++;
            }
        });

        const todayIdx = new Date().getDay();
        const performanceData = [];
        for (let i = 6; i >= 0; i--) {
            const idx = (todayIdx - i + 7) % 7;
            const dayName = days[idx];
            performanceData.push({ name: dayName, ...trendMap[dayName] });
        }

        // 5. Asset Type Distribution
        const typeMap: Record<string, number> = { "Images": 0, "Videos": 0, "Documents": 0, "Other": 0 };
        const { data: allAssetsForTypesData } = await supabase
            .from("assets")
            .select("file_type")
            .in("project_id", allProjectIds)
            .limit(500);

        (allAssetsForTypesData || []).forEach((doc: any) => {
            const type = doc.file_type || "";
            if (type.startsWith("image/")) typeMap["Images"]++;
            else if (type.startsWith("video/")) typeMap["Videos"]++;
            else if (type.includes("pdf") || type.includes("doc") || type.includes("text") || type.includes("presentation")) typeMap["Documents"]++;
            else typeMap["Other"]++;
        });
        const assetTypesData = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

        // 6. Recent Approvals
        const { data: recentApprovalsDocs } = await supabase
            .from("assets")
            .select("*")
            .in("project_id", allProjectIds)
            .in("status", ["approved", "Approved"])
            .order("updated_at", { ascending: false })
            .limit(5);



        return NextResponse.json({
            stats: { totalAssets: totalAssets || 0, pendingReview: pendingReview || 0, approvedToday, rejectionRate },
            performanceData,
            assetTypesData,
            recentApprovals: (recentApprovalsDocs || []).map(doc => ({
                id: doc.id,
                title: doc.file_name,
                user: "System",
                time: "Recently", // Simplified for now
                status: "Approved",
                type: doc.file_type?.startsWith("image/") ? "image" : doc.file_type?.startsWith("video/") ? "video" : "document"
            })),
            invites: formattedInvites
        });

    } catch (error: any) {
        console.error("Dashboard Stats Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
