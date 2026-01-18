import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { event_type, xp, meta } = await request.json();

        // Server-side auth check
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!event_type) {
            return NextResponse.json({ error: "Missing event_type" }, { status: 400 });
        }

        // Get user's learning language from profile
        const { data: profile } = await supabase
            .from("profiles")
            .select("learning_language")
            .eq("id", user.id)
            .single();

        const { error } = await supabase
            .from("learning_events")
            .insert({
                user_id: user.id,
                language_code: profile?.learning_language || "en",
                event_type,
                xp_delta: xp || 0,
                occurred_at: new Date().toISOString(),
                meta: meta || {}
            });

        if (error) {
            console.error("Event Insert Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (e: any) {
        console.error("API Route Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
