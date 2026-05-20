import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useProfile() {
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        async function load() {
            const supabase = createClient();
            const {
                data: { user }
            } = await supabase.auth.getUser();

            if (!user) return;

            const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            setProfile(data);
        }

        load();
    }, []);

    return profile;
}
