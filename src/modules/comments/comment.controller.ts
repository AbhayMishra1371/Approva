import { CommentService } from "./comment.service";

export class CommentController {
    private service: CommentService;

    constructor() {
        this.service = new CommentService();
    }

    async getCommentsByAssetId(assetId: string) {
        return this.service.getCommentsByAssetId(assetId);
    }

    async createGeneralComment(assetId: string, userId: string, userEmail: string, text: string, mentions: string[] = []) {
        return this.service.createGeneralComment(assetId, userId, userEmail, text, mentions);
    }

    async updateComment(assetId: string, commentId: string, text: string) {
        return this.service.updateComment(assetId, commentId, text);
    }

    async deleteComment(assetId: string, commentId: string) {
        return this.service.deleteComment(assetId, commentId);
    }
}
