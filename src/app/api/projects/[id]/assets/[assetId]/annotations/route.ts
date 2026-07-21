import { NextResponse } from "next/server";
import { getLoggedInUser } from "@/lib/supabase/server";
import { AnnotationController } from "@/modules/annotations/annotation.controller";

export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string; assetId: string }> }
) {
    try {
        const resolvedParams = await params;
        const assetId = resolvedParams.assetId;

        const { user } = await getLoggedInUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const controller = new AnnotationController();
        const annotations = await controller.getAnnotationsByAssetId(assetId);

        return NextResponse.json(annotations);
    } catch (error: any) {
        console.error("API Error [Get Annotations]:", error?.message || error);
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string; assetId: string }> }
) {
    try {
        const resolvedParams = await params;
        const assetId = resolvedParams.assetId;

        const { user } = await getLoggedInUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        const controller = new AnnotationController();
        const newAnnotation = await controller.createAnnotation(assetId, user.$id, body);

        return NextResponse.json(newAnnotation);
    } catch (error: any) {
        console.error("API Error [Create Annotation]:", error?.message || error);
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string; assetId: string }> }
) {
    try {
        const resolvedParams = await params;
        const assetId = resolvedParams.assetId;

        const { user } = await getLoggedInUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { annotationId, action, ...updates } = await request.json();
        if (!annotationId) {
            return NextResponse.json({ error: "annotationId is required" }, { status: 400 });
        }

        const controller = new AnnotationController();
        let result;
        if (action === "resolve") {
            result = await controller.resolveAnnotation(assetId, annotationId);
        } else {
            result = await controller.updateAnnotation(assetId, annotationId, updates);
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("API Error [Update Annotation]:", error?.message || error);
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string; assetId: string }> }
) {
    try {
        const resolvedParams = await params;
        const assetId = resolvedParams.assetId;

        const { user } = await getLoggedInUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(request.url);
        const annotationId = url.searchParams.get("annotationId");
        if (!annotationId) {
            return NextResponse.json({ error: "annotationId is required" }, { status: 400 });
        }

        const controller = new AnnotationController();
        await controller.deleteAnnotation(assetId, annotationId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("API Error [Delete Annotation]:", error?.message || error);
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}
