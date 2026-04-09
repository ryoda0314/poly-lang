import { createClient } from "@/lib/supa-client"; // Use shared client or create new
import { NextResponse } from "next/server";

export async function POST(request: Request) {
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

    try {
        const { error } = await (supabase as any)
            .from("learning_events")
            .insert({
                user_id: user.id,
                event_type,
                xp_earned: xp || 0,
                occurred_at: new Date().toISOString(),
                meta: meta || {}
            });

        if (error) {
            console.error("Event Insert Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
