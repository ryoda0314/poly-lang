import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Valid language codes whitelist
const VALID_LANG_CODES = ["en", "ja", "ko", "zh", "fr", "es", "de", "ru", "vi"];

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");

    if (code) {
        const supabase = await createClient();
        const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && sessionData?.user) {
            // Get user's native language from metadata and validate
            const rawLang = sessionData.user.user_metadata?.native_language;
            const lang = VALID_LANG_CODES.includes(rawLang) ? rawLang : "en";

            // Redirect to open-app page with language
            return NextResponse.redirect(`${origin}/auth/open-app?lang=${lang}`);
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}