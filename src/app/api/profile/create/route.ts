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
        const { user_id, username, gender, native_language, learning_language, settings } = body;

        // Ensure user can only create/update their own profile
        if (user.id !== user_id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Use admin client to bypass RLS
        const supabase = await createAdminClient();

        // Validate fields
        const VALID_GENDERS = ["male", "female", "unspecified"];
        const { LANGUAGES } = await import('@/lib/data');
        const VALID_LANGUAGES = LANGUAGES.map(l => l.code);
        const safeUsername = typeof username === "string" ? username.slice(0, 50) : null;
        const safeGender = VALID_GENDERS.includes(gender) ? gender : "unspecified";
        const safeNativeLang = VALID_LANGUAGES.includes(native_language) ? native_language : null;
        const safeLearningLang = VALID_LANGUAGES.includes(learning_language) ? learning_language : null;

        // Only allow known keys and validate value types in settings
        const ALLOWED_SETTINGS: Record<string, 'boolean' | 'string'> = {
            theme: 'string',
            showPinyin: 'boolean',
            showFurigana: 'boolean',
            showIPA: 'boolean',
            showSyllables: 'boolean',
            learningGoal: 'string',
        };
        const safeSettings: Record<string, unknown> = {};
        if (settings && typeof settings === "object" && !Array.isArray(settings)) {
            for (const [key, expectedType] of Object.entries(ALLOWED_SETTINGS)) {
                if (key in settings) {
                    const val = settings[key];
                    // Validate type and sanitize strings
                    if (expectedType === 'boolean' && typeof val === 'boolean') {
                        safeSettings[key] = val;
                    } else if (expectedType === 'string' && typeof val === 'string') {
                        safeSettings[key] = val.slice(0, 100);
                    }
                    // Skip values with wrong types
                }
            }
        }

        // Check if profile already exists to preserve email_verified
        const { data: existingProfile } = await supabase
            .from("profiles")
            .select("email_verified")
            .eq("id", user_id)
            .single();

        const upsertData = {
            id: user_id as string,
            username: safeUsername,
            gender: safeGender,
            native_language: safeNativeLang,
            learning_language: safeLearningLang,
            settings: safeSettings as any,
            // Only set email_verified: false for new profiles, preserve for existing
            email_verified: existingProfile?.email_verified ?? false,
        };

        const { error: profileError } = await supabase.from("profiles").upsert(upsertData);

        if (profileError) {
            console.error("Profile upsert error:", profileError);
            return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (e: unknown) {
        console.error("API Route Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
