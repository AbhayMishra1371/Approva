import { NextResponse } from "next/server";
import { getLoggedInUser } from "@/lib/supabase/server";
import { CommentController } from "@/modules/comments/comment.controller";

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

        const controller = new CommentController();
        const comments = await controller.getCommentsByAssetId(assetId);

        return NextResponse.json(comments);
    } catch (error: any) {
        console.error("API Error [Get Comments]:", error?.message || error);
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

        const { text, mentions } = await request.json();
        if (!text || !text.trim()) {
            return NextResponse.json({ error: "Text is required" }, { status: 400 });
        }

        const controller = new CommentController();
        const newComment = await controller.createGeneralComment(
            assetId,
            user.$id,
            user.email || "unknown",
            text,
            mentions || []
        );

        return NextResponse.json(newComment);
    } catch (error: any) {
        console.error("API Error [Create Comment]:", error?.message || error);
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

        const { commentId, text } = await request.json();
        if (!commentId || !text) {
            return NextResponse.json({ error: "commentId and text are required" }, { status: 400 });
        }

        const controller = new CommentController();
        const updated = await controller.updateComment(assetId, commentId, text);

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("API Error [Update Comment]:", error?.message || error);
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
        const commentId = url.searchParams.get("commentId");
        if (!commentId) {
            return NextResponse.json({ error: "commentId is required" }, { status: 400 });
        }

        const controller = new CommentController();
        await controller.deleteComment(assetId, commentId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("API Error [Delete Comment]:", error?.message || error);
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}
