import { AssetData } from "./asset.types";

export class AssetValidation {
    static validateAssetData(data: Partial<AssetData>): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!data.fileName) errors.push("fileName is required.");
        if (!data.filePath) errors.push("filePath is required.");
        if (!data.fileType) errors.push("fileType is required.");
        if (data.size === undefined || data.size < 0) errors.push("size is required and must be non-negative.");

        return {
            valid: errors.length === 0,
            errors
        };
    }
}
