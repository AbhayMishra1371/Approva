export interface AssetData {
    fileName: string;
    filePath: string;
    fileType: string;
    size: number;
    url?: string;
}

export interface UserContext {
    $id: string;
    email?: string;
    [key: string]: any;
}
