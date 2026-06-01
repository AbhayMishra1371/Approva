import { NextResponse } from "next/server";
import { getLoggedInUser, createAdminClient } from "@/lib/appwrite/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { Query } from "node-appwrite";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const { user } = await getLoggedInUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { databases } = await createAdminClient();
        const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
        const assetsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ASSETS_ID!;
        const collaboratorsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLABORATORS_ID!;
        const invitesCollectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_INVITES_ID!;
        const activityLogCollectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ACTIVITY_LOG_ID || "activity_logs";

        // 1. Get User's Project IDs (Owned + Collaborative) from Supabase & Appwrite
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
            const collabRes = await databases.listDocuments(databaseId, collaboratorsCollectionId, [Query.equal("user_id", user.$id)]);
            collabIds = collabRes.documents.map(d => d.project_id);
        } catch (e) {
            console.warn("Could not query collaborator projects from Appwrite for stats:", e);
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

        // 2. Fetch Invites (Filter by email) - Move to server to avoid "Not Authorized" browser error
        const invitesRes = await databases.listDocuments(databaseId, invitesCollectionId, [Query.equal("email", user.email)]);
        const invitesPromises = invitesRes.documents.map(async (invite: any) => {
            try {
                const { data: proj } = await supabase
                    .from("projects")
                    .select("name")
                    .eq("id", invite.project_id)
                    .single();
                return { ...invite, id: invite.$id, projects: { name: proj?.name || "Unknown Project" } };
            } catch {
                return { ...invite, id: invite.$id, projects: { name: "Unknown Project" } };
            }
        });
        const formattedInvites = await Promise.all(invitesPromises);

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
        const approvedTodayLogRes = await databases.listDocuments(databaseId, activityLogCollectionId, [
            Query.equal("project_id", allProjectIds),
            Query.equal("action", "approved_asset"),
            Query.greaterThanEqual("$createdAt", startOfDay.toISOString()),
            Query.limit(1)
        ]);
        const approvedToday = approvedTodayLogRes.total;

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
