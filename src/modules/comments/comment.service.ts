import { CommentRepository } from "./comment.repository";
import { getOrSetCache, invalidateCache } from "@/lib/cache";

export class CommentService {
    private repository: CommentRepository;

    constructor() {
        this.repository = new CommentRepository();
    }

    async getCommentsByAssetId(assetId: string) {
        const cacheKey = `asset:${assetId}:comments`;
        return getOrSetCache(cacheKey, 120, () => this.repository.getCommentsByAssetId(assetId));
    }

    async createGeneralComment(assetId: string, userId: string, userEmail: string, text: string, mentions: string[] = []) {
        const res = await this.repository.createGeneralComment(assetId, userId, userEmail, text, mentions);
        await invalidateCache(`asset:${assetId}:comments`);
        return res;
    }

    async updateComment(assetId: string, commentId: string, text: string) {
        const res = await this.repository.updateComment(commentId, text);
        await invalidateCache(`asset:${assetId}:comments`);
        return res;
    }

    async deleteComment(assetId: string, commentId: string) {
        const res = await this.repository.deleteComment(commentId);
        await invalidateCache(`asset:${assetId}:comments`);
        return res;
    }
}
