import { NextResponse } from "next/server";
import { getLoggedInUser, createAdminClient } from "@/lib/appwrite/server";
import { getAllAssetsForUser } from "@/modules/assets/assets.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { user } = await getLoggedInUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { databases } = await createAdminClient();

        const formattedAssets = await getAllAssetsForUser(user, databases);

        return NextResponse.json({ assets: formattedAssets });
    } catch (error: any) {
        console.error("API Fetch Assets Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
