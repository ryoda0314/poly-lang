import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supa-client";

export async function POST(request: NextRequest) {
    try {
        const supabase = createClient();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "認証が必要です" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { type, category, message } = body;

        if (!type || !category || !message) {
            return NextResponse.json(
                { error: "必須項目が不足しています" },
                { status: 400 }
            );
        }

        // Validate type
        if (!["contact", "safety"].includes(type)) {
            return NextResponse.json(
                { error: "無効なタイプです" },
                { status: 400 }
            );
        }

        // Sanitize message (max 2000 chars)
        const sanitizedMessage = message.slice(0, 2000).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");

        const { data, error } = await (supabase as any)
            .from("support_tickets")
            .insert({
                user_id: user.id,
                user_email: user.email,
                type,
                category,
                message: sanitizedMessage,
                status: "new",
            })
            .select()
            .single();

        if (error) {
            console.error("Failed to create support ticket:", error);
            return NextResponse.json(
                { error: "送信に失敗しました" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, id: data.id });
    } catch (error) {
        console.error("Support API error:", error);
        return NextResponse.json(
            { error: "サーバーエラーが発生しました" },
            { status: 500 }
        );
    }
}

// GET - Admin only: fetch all tickets
export async function GET(request: NextRequest) {
    try {
        const supabase = createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "認証が必要です" },
                { status: 401 }
            );
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "admin") {
            return NextResponse.json(
                { error: "管理者権限が必要です" },
                { status: 403 }
            );
        }

        const url = new URL(request.url);
        const status = url.searchParams.get("status");
        const type = url.searchParams.get("type");

        let query = (supabase as any)
            .from("support_tickets")
            .select("*")
            .order("created_at", { ascending: false });

        if (status && status !== "all") {
            query = query.eq("status", status);
        }

        if (type && type !== "all") {
            query = query.eq("type", type);
        }

        const { data, error } = await query;

        if (error) {
            console.error("Failed to fetch support tickets:", error);
            return NextResponse.json(
                { error: "取得に失敗しました" },
                { status: 500 }
            );
        }

        return NextResponse.json({ tickets: data });
    } catch (error) {
        console.error("Support API error:", error);
        return NextResponse.json(
            { error: "サーバーエラーが発生しました" },
            { status: 500 }
        );
    }
}

// PATCH - Admin only: update ticket status
export async function PATCH(request: NextRequest) {
    try {
        const supabase = createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "認証が必要です" },
                { status: 401 }
            );
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "admin") {
            return NextResponse.json(
                { error: "管理者権限が必要です" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { id, status, admin_note } = body;

        if (!id || !status) {
            return NextResponse.json(
                { error: "必須項目が不足しています" },
                { status: 400 }
            );
        }

        const updateData: any = { status };
        if (admin_note !== undefined) {
            updateData.admin_note = admin_note;
        }

        const { error } = await (supabase as any)
            .from("support_tickets")
            .update(updateData)
            .eq("id", id);

        if (error) {
            console.error("Failed to update support ticket:", error);
            return NextResponse.json(
                { error: "更新に失敗しました" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Support API error:", error);
        return NextResponse.json(
            { error: "サーバーエラーが発生しました" },
            { status: 500 }
        );
    }
}
