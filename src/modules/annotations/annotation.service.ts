import { AnnotationRepository } from "./annotation.repository";
import { getOrSetCache, invalidateCache } from "@/lib/cache";

export class AnnotationService {
    private repository: AnnotationRepository;

    constructor() {
        this.repository = new AnnotationRepository();
    }

    async getAnnotationsByAssetId(assetId: string) {
        const cacheKey = `asset:${assetId}:annotations`;
        return getOrSetCache(cacheKey, 300, () => this.repository.getAnnotationsByAssetId(assetId));
    }

    async createAnnotation(assetId: string, userId: string, data: any) {
        const result = await this.repository.createAnnotation(assetId, userId, data);
        await invalidateCache(`asset:${assetId}:annotations`);
        return result;
    }

    async updateAnnotation(assetId: string, annotationId: string, updates: any) {
        const result = await this.repository.updateAnnotation(annotationId, updates);
        await invalidateCache(`asset:${assetId}:annotations`);
        return result;
    }

    async resolveAnnotation(assetId: string, annotationId: string) {
        const result = await this.repository.resolveAnnotation(annotationId);
        await invalidateCache(`asset:${assetId}:annotations`);
        return result;
    }

    async deleteAnnotation(assetId: string, annotationId: string) {
        const result = await this.repository.deleteAnnotation(annotationId);
        await invalidateCache(`asset:${assetId}:annotations`);
        return result;
    }
}
