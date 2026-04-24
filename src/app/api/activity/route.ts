import { NextResponse } from "next/server";
import { getLoggedInUser, createAdminClient } from "@/lib/appwrite/server";
import { Query } from "node-appwrite";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { user } = await getLoggedInUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { databases, users } = await createAdminClient();
        const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
        const projectsCollId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_PROJECTS_ID!;
        const collabsCollId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLABORATORS_ID!;
        const activityLogsCollId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ACTIVITY_LOG_ID || "activity_logs";

        if (!dbId || !projectsCollId || !collabsCollId) {
            return NextResponse.json({ error: "Configuration missing" }, { status: 500 });
        }

        // 1. Fetch projects the user is a collaborator on
        const url = new URL(request.url);
        const filterUserId = url.searchParams.get("userId");

        const collabsRes = await databases.listDocuments(
            dbId,
            collabsCollId,
            [Query.equal("user_id", user.$id)]
        );

        const projectIds = collabsRes.documents.map((doc: any) => doc.project_id);
        if (projectIds.length === 0) {
            return NextResponse.json({ documents: [] }, { status: 200 });
        }

        // 2. Fetch project names for these IDs (limit 100)
        const projectsRes = await databases.listDocuments(
            dbId,
            projectsCollId,
            [Query.equal("$id", projectIds), Query.limit(100)]
        );

        const projectMap = projectsRes.documents.reduce((acc: any, p: any) => {
            acc[p.$id] = p.name;
            return acc;
        }, {});

        // 3. Fetch activity logs for these projects (with optional user filter)
        const queries = [
            Query.equal("project_id", projectIds),
            Query.orderDesc("$createdAt"),
            Query.limit(100)
        ];

        if (filterUserId) {
            queries.push(Query.equal("user_id", filterUserId));
        }

        const logsRes = await databases.listDocuments(
            dbId,
            activityLogsCollId,
            queries
        );

        // Fetch user names
        const uniqueUserIds = Array.from(new Set(logsRes.documents.filter(log => log.user_id).map(log => log.user_id)));
        const userMap: Record<string, string> = {};

        await Promise.all(
            uniqueUserIds.map(async (uid: any) => {
                try {
                    const u = await users.get(uid);
                    userMap[uid] = u.name || u.email || 'Unknown User';
                } catch (e) {
                    console.warn(`Could not fetch user ${uid}`, e);
                    userMap[uid] = 'Unknown User';
                }
            })
        );

        // 4. Attach project names and user names to logs
        const enhancedLogs = logsRes.documents.map((log: any) => ({
            ...log,
            project_name: projectMap[log.project_id] || "Unknown Project",
            user_name: userMap[log.user_id] || log.user_email || log.user_id
        }));

        return NextResponse.json({ documents: enhancedLogs }, { status: 200 });

    } catch (error: any) {
        console.error("Global Activity API Error:", error);

        // Check for Appwrite missing index error (usually 400 or has specific message)
        if (error.code === 400 && error.message?.includes("index")) {
            return NextResponse.json({
                error: "Missing index on 'project_id' in activity_logs collection. Please add it in Appwrite console.",
                code: "missing_index"
            }, { status: 400 });
        }

        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
