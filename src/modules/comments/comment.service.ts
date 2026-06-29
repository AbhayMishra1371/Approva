import { CommentRepository } from "./comment.repository";

export class CommentService {
    private repository: CommentRepository;

    constructor() {
        this.repository = new CommentRepository();
    }

    async createGeneralComment(assetId: string, userId: string, userEmail: string, text: string) {
        return this.repository.createGeneralComment(assetId, userId, userEmail, text);
    }
}
