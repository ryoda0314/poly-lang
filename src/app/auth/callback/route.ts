import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Valid language codes whitelist
const VALID_LANG_CODES = ["en", "ja", "ko", "zh", "fr", "es", "de", "ru", "vi"];

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    // Log minimal info (no PII)
    console.log("Callback received:", {
        hasCode: !!code,
        hasTokenHash: !!token_hash,
        type,
    });

    const supabase = await createClient();
    let userId: string | undefined;
    let userLang: string | undefined;

    // Handle token_hash (from admin-generated magic links)
    if (token_hash && type) {
        // Validate OTP type
        if (type !== "magiclink" && type !== "email") {
            return NextResponse.redirect(`${origin}/login?error=invalid_type`);
        }
        const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type,
        });

        if (error) {
            console.error("verifyOtp error:", error);
            return NextResponse.redirect(`${origin}/login?error=verification_failed`);
        }

        userId = data.user?.id;
        userLang = data.user?.user_metadata?.native_language;
    }
    // Handle code (standard PKCE flow)
    else if (code) {
        const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error("exchangeCodeForSession error:", error);
            return NextResponse.redirect(`${origin}/login?error=code_exchange_failed`);
        }

        userId = sessionData?.user?.id;
        userLang = sessionData?.user?.user_metadata?.native_language;
    }

    if (userId) {
        // Mark email as verified in profiles table
        try {
            const adminClient = await createAdminClient();

            // Check if profile exists
            const { data: existingProfile } = await adminClient
                .from("profiles")
                .select("id, email_verified")
                .eq("id", userId)
                .single();

            // Update email_verified
            const { error: updateError } = await adminClient
                .from("profiles")
                .update({ email_verified: true })
                .eq("id", userId);

            if (updateError) {
                console.error("Failed to update email_verified:", updateError);
            }
        } catch (e) {
            console.error("Failed to verify email (exception):", e);
        }

        // Get user's native language and validate
        const lang = VALID_LANG_CODES.includes(userLang || "") ? userLang : "en";

        // Sign out so user must log in from the app
        await supabase.auth.signOut();

        // Redirect to open-app page (tells user to return to the PWA)
        return NextResponse.redirect(`${origin}/auth/open-app?lang=${lang}`);
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}