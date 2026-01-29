import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { user_id, username, gender, native_language, learning_language } = body;

        // Validate required fields
        if (!user_id) {
            return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
        }

        // Use admin client to bypass RLS
        const supabase = await createAdminClient();

        // Upsert profile
        const { error: profileError } = await supabase.from("profiles").upsert({
            id: user_id,
            username: username || null,
            gender: gender || "unspecified",
            native_language: native_language || null,
            learning_language: learning_language || null,
        });

        if (profileError) {
            console.error("Profile upsert error:", profileError);
            return NextResponse.json({ error: profileError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (e: unknown) {
        console.error("API Route Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
