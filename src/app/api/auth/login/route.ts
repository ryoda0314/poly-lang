import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
        }

        const supabase = await createAdminClient();

        // Find user by email
        const { data: userData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const user = userData?.users?.find(u => u.email === email);

        if (!user) {
            return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
        }

        // Check email_verified in profiles BEFORE attempting login
        const { data: profile } = await supabase
            .from("profiles")
            .select("email_verified")
            .eq("id", user.id)
            .single();

        if (!profile?.email_verified) {
            return NextResponse.json({
                error: "email_not_verified",
                message: "Please verify your email before logging in."
            }, { status: 403 });
        }

        // Email is verified, allow login
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Login check error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}