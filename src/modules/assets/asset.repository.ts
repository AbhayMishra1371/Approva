import { Query, ID } from "node-appwrite";

export class AssetRepository {
    private databases: any;
    private databaseId: string;
    private collectionAssetsId: string;
    private collectionProjectsId: string;
    private collectionCollaboratorsId: string;
    private collectionGeneralCommentsId: string;

    constructor(databases: any) {
        this.databases = databases;
        this.databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
        this.collectionAssetsId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ASSETS_ID!;
        this.collectionProjectsId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_PROJECTS_ID!;
        this.collectionCollaboratorsId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_COLLABORATORS_ID!;
        this.collectionGeneralCommentsId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_GENERAL_COMMENTS_ID || 'general_comments';
    }

    async getOwnedProjects(userId: string) {
        const res = await this.databases.listDocuments(this.databaseId, this.collectionProjectsId, [
            Query.equal("owner_id", userId)
        ]);
        return res.documents;
    }

    async getCollaboratorProjects(userId: string) {
        try {
            const res = await this.databases.listDocuments(this.databaseId, this.collectionCollaboratorsId, [
                Query.equal("user_id", userId)
            ]);
            return res.documents;
        } catch (err) {
            // Fallback
            const allCollabs = await this.databases.listDocuments(this.databaseId, this.collectionCollaboratorsId, [
                Query.limit(5000)
            ]);
            return allCollabs.documents.filter((doc: any) => doc.user_id === userId);
        }
    }

    async getProjectById(projectId: string) {
        return this.databases.getDocument(this.databaseId, this.collectionProjectsId, projectId).catch(() => null);
    }

    async getAssetsByProjectIds(projectIds: string[], chunkSize = 50) {
        let allAssets: any[] = [];
        for (let i = 0; i < projectIds.length; i += chunkSize) {
            const chunk = projectIds.slice(i, i + chunkSize);
            const res = await this.databases.listDocuments(this.databaseId, this.collectionAssetsId, [
                Query.equal("project_id", chunk),
                Query.orderDesc("$createdAt"),
                Query.limit(100)
            ]);
            allAssets.push(...res.documents);
        }
        return allAssets;
    }

    async getLatestAssetByName(projectId: string, fileName: string) {
        const res = await this.databases.listDocuments(this.databaseId, this.collectionAssetsId, [
            Query.equal("project_id", projectId),
            Query.equal("file_name", fileName),
            Query.orderDesc("$createdAt"),
            Query.limit(1)
        ]);
        return res.total > 0 ? res.documents[0] : null;
    }

    async createAsset(data: any) {
        return this.databases.createDocument(
            this.databaseId,
            this.collectionAssetsId,
            ID.unique(),
            data
        );
    }

    async updateAssetStatus(assetId: string, status: string) {
        return this.databases.updateDocument(
            this.databaseId,
            this.collectionAssetsId,
            assetId,
            { status: status }
        );
    }

    async createGeneralComment(assetId: string, userId: string, userEmail: string, text: string) {
        return this.databases.createDocument(
            this.databaseId,
            this.collectionGeneralCommentsId,
            ID.unique(),
            {
                asset_id: assetId,
                user_id: userId,
                user_email: userEmail,
                text: text
            }
        );
    }
}
