import { AnnotationService } from "./annotation.service";

export class AnnotationController {
    private service: AnnotationService;

    constructor() {
        this.service = new AnnotationService();
    }

    async getAnnotationsByAssetId(assetId: string) {
        return this.service.getAnnotationsByAssetId(assetId);
    }

    async createAnnotation(assetId: string, userId: string, data: any) {
        return this.service.createAnnotation(assetId, userId, data);
    }

    async updateAnnotation(assetId: string, annotationId: string, updates: any) {
        return this.service.updateAnnotation(assetId, annotationId, updates);
    }

    async resolveAnnotation(assetId: string, annotationId: string) {
        return this.service.resolveAnnotation(assetId, annotationId);
    }

    async deleteAnnotation(assetId: string, annotationId: string) {
        return this.service.deleteAnnotation(assetId, annotationId);
    }
}
