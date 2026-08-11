import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

export class AnnotationRepository {
    async getAnnotationsByAssetId(assetId: string) {
        console.time("ANNOTATIONS TOTAL");
        console.time("SUPABASE CLIENT [ANNOTATIONS]");
        const supabase = await createSupabaseServerClient();
        console.timeEnd("SUPABASE CLIENT [ANNOTATIONS]");

        console.time("SUPABASE QUERY [ANNOTATIONS]");
        const { data: annDocs, error: annErr } = await supabase
            .from("annotations")
            .select("*")
            .eq("asset_id", assetId)
            .neq("status", "resolved");
        console.timeEnd("SUPABASE QUERY [ANNOTATIONS]");
        console.timeEnd("ANNOTATIONS TOTAL");

        if (annErr) {
            console.error("Error fetching annotations from Supabase:", annErr);
            return [];
        }

        return (annDocs || []).map(doc => ({
            $id: doc.id,
            id: doc.id,
            x: Number(doc.x),
            y: Number(doc.y),
            width: Number(doc.width),
            height: Number(doc.height),
            status: doc.status,
            name: doc.name || undefined,
            color: doc.color || '#a855f7',
            user_id: doc.user_id,
            created_at: doc.created_at
        }));
    }

    async createAnnotation(assetId: string, userId: string, data: any) {
        const supabase = await createSupabaseServerClient();
        const { data: doc, error: insertErr } = await supabase
            .from("annotations")
            .insert({
                asset_id: assetId,
                name: data.name || undefined,
                x: data.x,
                y: data.y,
                width: data.width,
                height: data.height,
                status: 'pending',
                color: data.color || '#a855f7',
                user_id: userId
            })
            .select()
            .single();

        if (insertErr) {
            throw insertErr;
        }

        return {
            $id: doc.id,
            id: doc.id,
            x: Number(doc.x),
            y: Number(doc.y),
            width: Number(doc.width),
            height: Number(doc.height),
            status: doc.status,
            name: doc.name || undefined,
            color: doc.color || '#a855f7',
            user_id: doc.user_id,
            created_at: doc.created_at
        };
    }

    async updateAnnotation(annotationId: string, updates: any) {
        const supabase = await createSupabaseServerClient();
        const payload: any = {};
        if (updates.x !== undefined) payload.x = updates.x;
        if (updates.y !== undefined) payload.y = updates.y;
        if (updates.width !== undefined) payload.width = updates.width;
        if (updates.height !== undefined) payload.height = updates.height;
        if (updates.status !== undefined) payload.status = updates.status;
        if (updates.color !== undefined) payload.color = updates.color;
        if (updates.name !== undefined) payload.name = updates.name;

        const { data: doc, error: updateErr } = await supabase
            .from("annotations")
            .update(payload)
            .eq("id", annotationId)
            .select()
            .single();

        if (updateErr) {
            throw updateErr;
        }

        return doc;
    }

    async resolveAnnotation(annotationId: string) {
        const supabase = await createSupabaseServerClient();
        const { data: doc, error: updateErr } = await supabase
            .from("annotations")
            .update({ status: 'resolved' })
            .eq("id", annotationId)
            .select()
            .single();

        if (updateErr) {
            throw updateErr;
        }

        return doc;
    }

    async deleteAnnotation(annotationId: string) {
        const supabase = await createSupabaseServerClient();
        const { error: deleteErr } = await supabase
            .from("annotations")
            .delete()
            .eq("id", annotationId);

        if (deleteErr) {
            throw deleteErr;
        }

        return true;
    }
}
