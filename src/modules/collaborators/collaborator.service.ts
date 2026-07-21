import { CollaboratorRepository } from "./collaborator.repository";
import { getOrSetCache, invalidateCache } from "@/lib/cache";

export class CollaboratorService {
    private repository: CollaboratorRepository;

    constructor() {
        this.repository = new CollaboratorRepository();
    }

    async getCollaborators(projectId: string) {
        const cacheKey = `project:${projectId}:collaborators`;
        return getOrSetCache(cacheKey, 3600, () => this.repository.getCollaboratorsByProjectId(projectId));
    }

    async invalidateCollaboratorCache(projectId: string) {
        const cacheKey = `project:${projectId}:collaborators`;
        await invalidateCache(cacheKey);
    }
}
