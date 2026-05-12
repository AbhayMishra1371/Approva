import { AssetService } from "./asset.service";
import { AssetData, UserContext } from "./asset.types";

export class AssetController {
    private service: AssetService;

    constructor(databases: any) {
        this.service = new AssetService(databases);
    }

    async getAllAssetsForUser(user: UserContext) {
        return this.service.getAllAssetsForUser(user);
    }

    async createAsset(user: UserContext, projectId: string, assetData: AssetData) {
        return this.service.createAsset(user, projectId, assetData);
    }

    async updateAssetStatus(user: UserContext, projectId: string, assetId: string, status: string, comment?: string) {
        return this.service.updateAssetStatus(user, projectId, assetId, status, comment);
    }
}
