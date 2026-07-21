import { CollaboratorService } from "./collaborator.service";

export class CollaboratorController {
    private service: CollaboratorService;

    constructor() {
        this.service = new CollaboratorService();
    }

    async getCollaborators(projectId: string) {
        return this.service.getCollaborators(projectId);
    }

    async invalidateCollaboratorCache(projectId: string) {
        return this.service.invalidateCollaboratorCache(projectId);
    }
}
