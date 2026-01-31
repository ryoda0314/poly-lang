import { createClient, createAdminClient } from "@/lib/supabase/server";
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
            // Mark email as verified in profiles table
            try {
                const adminClient = await createAdminClient();
                await adminClient.from("profiles").update({
                    email_verified: true,
                }).eq("id", sessionData.user.id);
            } catch (e) {
                console.error("Failed to verify email:", e);
            }

            // Get user's native language from metadata and validate
            const rawLang = sessionData.user.user_metadata?.native_language;
            const lang = VALID_LANG_CODES.includes(rawLang) ? rawLang : "en";

            // Sign out so user must log in from the app
            await supabase.auth.signOut();

            // Redirect to open-app page (tells user to return to the PWA)
            return NextResponse.redirect(`${origin}/auth/open-app?lang=${lang}`);
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}