import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        // Verify the user is authenticated
        const supabaseAuth = await createClient();
        const { data: { user } } = await supabaseAuth.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { user_id, username, gender, native_language, learning_language } = body;

        // Ensure user can only create/update their own profile
        if (user.id !== user_id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Use admin client to bypass RLS
        const supabase = await createAdminClient();

        // Upsert profile with email_verified: false for new users
        const { error: profileError } = await supabase.from("profiles").upsert({
            id: user_id,
            username: username || null,
            gender: gender || "unspecified",
            native_language: native_language || null,
            learning_language: learning_language || null,
            email_verified: false,
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
