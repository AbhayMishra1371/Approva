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

        const { databases } = await createAdminClient();
        const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
        const projectsCollId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_PROJECTS_ID!;
        const collabsCollId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLABORATORS_ID!;
        const activityLogsCollId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ACTIVITY_LOG_ID || "activity_logs";

        if (!dbId || !projectsCollId || !collabsCollId) {
             return NextResponse.json({ error: "Configuration missing" }, { status: 500 });
        }

        // 1. Fetch projects the user is a collaborator on
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

        // 3. Fetch activity logs for these projects
        const logsRes = await databases.listDocuments(
            dbId,
            activityLogsCollId,
            [
                Query.equal("project_id", projectIds),
                Query.orderDesc("$createdAt"),
                Query.limit(100)
            ]
        );

        // 4. Attach project names to logs
        const logsWithProjectNames = logsRes.documents.map((log: any) => ({
            ...log,
            project_name: projectMap[log.project_id] || "Unknown Project"
        }));

        return NextResponse.json({ documents: logsWithProjectNames }, { status: 200 });

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
