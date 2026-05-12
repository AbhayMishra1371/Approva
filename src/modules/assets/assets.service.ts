import { Query, ID } from "node-appwrite";

export async function getAllAssetsForUser(user: any, databases: any) {
    // 1. Fetch owned projects
    let ownedProjects: any[] = [];
    try {
        const ownedRes = await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_PROJECTS_ID!,
            [
                Query.equal("owner_id", user.$id)
            ]
        );
        ownedProjects = ownedRes.documents
            .filter((doc: any) => doc.owner_id === user.$id)
            .map((doc: any) => ({ ...doc, id: doc.$id }));

    } catch (e) {
        console.warn("Could not query owned projects:", e);
    }

    const ownedIds = new Set(ownedProjects.map(p => p.id));

    // 2. Fetch collaborator project IDs
    let collabProjectIds: string[] = [];
    try {
        const collabsRes = await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLABORATORS_ID!,
            [Query.equal("user_id", user.$id)]
        );
        
        const filteredCollabs = collabsRes.documents.filter((doc: any) => doc.user_id === user.$id);
        
        if (filteredCollabs.length !== collabsRes.documents.length) {
            console.warn(`[SECURITY ALERT] Assets API: Collaborator query returned ${collabsRes.documents.length} docs, but only ${filteredCollabs.length} matched user_id ${user.$id}.`);
        }

        filteredCollabs.forEach((doc: any) => {
            collabProjectIds.push(doc.project_id);
        });

    } catch (err) {
        // Fallback
        const allCollabs = await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLABORATORS_ID!,
            [Query.limit(5000)]
        );
        allCollabs.documents
            .filter((doc: any) => doc.user_id === user.$id)
            .forEach((doc: any) => {
                collabProjectIds.push(doc.project_id);
            });
    }

    // 3. Combine project IDs
    const allProjectIds = Array.from(new Set([...Array.from(ownedIds), ...collabProjectIds]));

    if (allProjectIds.length === 0) {
        return [];
    }

    // Fetch project names mapping
    let projectNamesMap: Record<string, string> = {};
    for (const proj of ownedProjects) {
        projectNamesMap[proj.id] = proj.name;
    }

    // Fetch names for collab projects not owned
    const remainingIds = collabProjectIds.filter(id => !ownedIds.has(id));
    if (remainingIds.length > 0) {
        const projectPromises = remainingIds.map(id =>
            databases.getDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_PROJECTS_ID!,
                id
            ).catch(() => null)
        );
        const results = await Promise.all(projectPromises);
        results.filter(doc => doc !== null).forEach((doc: any) => {
            projectNamesMap[doc.$id] = doc.name;
        });
    }

    // 4. Fetch assets for all these projects
    let allAssets: any[] = [];
    const chunkSize = 50;
    for (let i = 0; i < allProjectIds.length; i += chunkSize) {
        const chunk = allProjectIds.slice(i, i + chunkSize);
        const assetsRes = await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ASSETS_ID!,
            [
                Query.equal("project_id", chunk),
                Query.orderDesc("$createdAt"),
                Query.limit(100)
            ]
        );
        allAssets.push(...assetsRes.documents);
    }

    // Add project name to each asset
    const formattedAssets = allAssets.map((doc: any) => ({
        ...doc,
        id: doc.$id,
        project_name: projectNamesMap[doc.project_id] || "Unknown Project"
    }));

    // Sort globally just in case chunks messed up the order
    formattedAssets.sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime());

    return formattedAssets;
}

export async function createAsset(user: any, databases: any, projectId: string, assetData: any) {
    const { fileName, filePath, fileType, size, url } = assetData;

    // Logic for Asset Versions
    const existingAssetsRes = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ASSETS_ID!,
        [
            Query.equal("project_id", projectId),
            Query.equal("file_name", fileName),
            Query.orderDesc("$createdAt"),
            Query.limit(1)
        ]
    );

    let nextVersion = "v1";
    if (existingAssetsRes.total > 0) {
        const latestAsset = existingAssetsRes.documents[0];
        const latestVersionNum = parseInt(latestAsset.version.replace('v', '')) || 0;
        nextVersion = `v${latestVersionNum + 1}`;
    }

    // Call Thumbnail Generation
    const thumbnailUrl = await generateThumbnail(filePath, fileType);

    const asset = await databases.createDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ASSETS_ID!,
        ID.unique(),
        {
            project_id: projectId,
            file_name: fileName,
            file_path: filePath,
            file_type: fileType || 'unknown',
            size: size || 0,
            status: "draft",
            version: nextVersion,
            url: url || "",
            // Appwrite requires columns to exist. If thumbnail_url isn't an attribute, this might fail, 
            // but we add it to demonstrate the logic.
            // thumbnail_url: thumbnailUrl 
        }
    );

    // We can attach the generated thumbnail url dynamically if not storing it
    return { ...asset, id: asset.$id, thumbnail_url: thumbnailUrl };
}

export async function updateAssetStatus(user: any, databases: any, projectId: string, assetId: string, status: string, comment?: string) {
    const updatedAsset = await databases.updateDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ASSETS_ID!,
        assetId,
        { status: status }
    );

    if (comment) {
        const generalCommentsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_GENERAL_COMMENTS_ID || 'general_comments';
        try {
            await databases.createDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                generalCommentsCollectionId,
                ID.unique(),
                {
                    asset_id: assetId,
                    user_id: user.$id,
                    user_email: user.email,
                    text: comment
                }
            );
        } catch (cmtErr) {
            console.warn("Failed to log status change as comment", cmtErr);
        }
    }

    return { ...updatedAsset, id: updatedAsset.$id };
}

export async function generateThumbnail(filePath: string, fileType: string): Promise<string> {
    if (fileType.startsWith('image/')) {
        const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
        const bucketId = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ASSETS_ID;
        const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;
        if (endpoint && bucketId && projectId) {
            return `${endpoint}/storage/buckets/${bucketId}/files/${filePath}/preview?project=${projectId}&width=400&height=400`;
        }
    }
    return ""; 
}
