import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Fetch active announcements (newest first)
        const { data: announcements, error } = await (supabase as any)
            .from("announcements")
            .select("*")
            .eq("is_active", true)
            .lte("starts_at", new Date().toISOString())
            .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`)
            .order("created_at", { ascending: false });

        if (error) throw error;

        // Fetch user's read announcements
        const { data: readStatus } = await (supabase as any)
            .from("announcement_reads")
            .select("announcement_id, read_at")
            .eq("user_id", user.id);

        const readIds = new Set(
            (readStatus || []).map((r: any) => r.announcement_id)
        );

        // Add is_read flag to each announcement
        const announcementsWithReadStatus = (announcements || []).map((a: any) => ({
            ...a,
            is_read: readIds.has(a.id)
        }));

        // Count unread announcements
        const unreadCount = announcementsWithReadStatus.filter((a: any) => !a.is_read).length;

        return NextResponse.json({
            announcements: announcementsWithReadStatus,
            unreadCount
        });
    } catch (e: any) {
        console.error("Announcements API Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Mark an announcement as read
export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { announcementId } = await request.json();

        if (!announcementId) {
            return NextResponse.json({ error: "Missing announcementId" }, { status: 400 });
        }

        // Upsert read status (mark as read)
        const { error } = await (supabase as any)
            .from("announcement_reads")
            .upsert({
                announcement_id: announcementId,
                user_id: user.id,
                dismissed: false,
                read_at: new Date().toISOString()
            }, {
                onConflict: "announcement_id,user_id"
            });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Mark Announcement Read Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
