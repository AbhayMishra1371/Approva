import { NextResponse } from "next/server";
import { getLoggedInUser } from "@/lib/supabase/server";
import { AssetController } from "@/modules/assets/asset.controller";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { user } = await getLoggedInUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const assetController = new AssetController(null);

        const formattedAssets = await assetController.getAllAssetsForUser(user);

        return NextResponse.json({ assets: formattedAssets });
    } catch (error: any) {
        console.error("API Fetch Assets Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
