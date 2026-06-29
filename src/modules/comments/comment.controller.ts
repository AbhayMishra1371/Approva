import { CommentService } from "./comment.service";

export class CommentController {
    private service: CommentService;

    constructor() {
        this.service = new CommentService();
    }

    async createGeneralComment(assetId: string, userId: string, userEmail: string, text: string) {
        return this.service.createGeneralComment(assetId, userId, userEmail, text);
    }
}
