import { NextResponse } from "next/server";
import { getLoggedInUser, createAdminClient } from "@/lib/appwrite/server";
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
        const projectsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_PROJECTS_ID!;
        const collaboratorsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLABORATORS_ID!;
        const invitesCollectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_INVITES_ID!;
        const activityLogCollectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ACTIVITY_LOG_ID || "activity_logs";

        // 1. Get User's Project IDs (Owned + Collaborative)
        const ownedRes = await databases.listDocuments(databaseId, projectsCollectionId, [Query.equal("owner_id", user.$id)]);
        const collabRes = await databases.listDocuments(databaseId, collaboratorsCollectionId, [Query.equal("user_id", user.$id)]);
        
        const ownedIds = ownedRes.documents.map(d => d.$id);
        const collabIds = collabRes.documents.map(d => d.project_id);
        const allProjectIds = Array.from(new Set([...ownedIds, ...collabIds]));

        console.log(`[DEBUG] API: Dashboard for ${user.email} (${user.$id}) | Projects: ${allProjectIds.join(', ')}`);

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
                const proj = await databases.getDocument(databaseId, projectsCollectionId, invite.project_id);
                return { ...invite, id: invite.$id, projects: { name: proj.name } };
            } catch {
                return { ...invite, id: invite.$id, projects: { name: "Unknown Project" } };
            }
        });
        const formattedInvites = await Promise.all(invitesPromises);

        // 3. Stats for Filtered Projects
        const totalAssetsRes = await databases.listDocuments(databaseId, assetsCollectionId, [
            Query.equal("project_id", allProjectIds),
            Query.limit(1)
        ]);
        const totalAssets = totalAssetsRes.total;

        const pendingRes = await databases.listDocuments(databaseId, assetsCollectionId, [
            Query.equal("project_id", allProjectIds),
            Query.equal("status", ["draft", "in_review", "changes_requested", "Pending", "pending"]),
            Query.limit(1)
        ]);
        const pendingReview = pendingRes.total;

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

        const rejectedRes = await databases.listDocuments(databaseId, assetsCollectionId, [
            Query.equal("project_id", allProjectIds),
            Query.equal("status", "rejected"),
            Query.limit(1)
        ]);
        const rejectionRate = totalAssets > 0 ? ((rejectedRes.total / totalAssets) * 100).toFixed(1) : "0.0";

        // 4. Trend Data (Last 7 Days) for these projects
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const recentAssetsRes = await databases.listDocuments(databaseId, assetsCollectionId, [
            Query.equal("project_id", allProjectIds),
            Query.greaterThanEqual("$createdAt", sevenDaysAgo.toISOString()),
            Query.limit(1000)
        ]);

        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const trendMap: Record<string, { pending: number; approved: number; rejected: number }> = {};
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            trendMap[days[d.getDay()]] = { pending: 0, approved: 0, rejected: 0 };
        }

        recentAssetsRes.documents.forEach((doc: any) => {
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
        const allAssetsForTypes = await databases.listDocuments(databaseId, assetsCollectionId, [
            Query.equal("project_id", allProjectIds),
            Query.limit(500)
        ]);
        allAssetsForTypes.documents.forEach((doc: any) => {
            const type = doc.file_type || "";
            if (type.startsWith("image/")) typeMap["Images"]++;
            else if (type.startsWith("video/")) typeMap["Videos"]++;
            else if (type.includes("pdf") || type.includes("doc") || type.includes("text") || type.includes("presentation")) typeMap["Documents"]++;
            else typeMap["Other"]++;
        });
        const assetTypesData = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

        // 6. Recent Approvals
        const recentApprovalsRes = await databases.listDocuments(databaseId, assetsCollectionId, [
            Query.equal("project_id", allProjectIds),
            Query.equal("status", ["approved", "Approved"]),
            Query.orderDesc("$updatedAt"),
            Query.limit(5)
        ]);

        console.log(`[DEBUG] Dashboard Stats: Total=${totalAssets}, Pending=${pendingReview}, ApprovedToday=${approvedToday}, Recent=${recentApprovalsRes.documents.length}`);

        return NextResponse.json({
            stats: { totalAssets, pendingReview, approvedToday, rejectionRate },
            performanceData,
            assetTypesData,
            recentApprovals: recentApprovalsRes.documents.map(doc => ({
                id: doc.$id,
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
