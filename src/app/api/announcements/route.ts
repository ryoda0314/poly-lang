import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Fetch active announcements
        const { data: announcements, error } = await (supabase as any)
            .from("announcements")
            .select("*")
            .eq("is_active", true)
            .lte("starts_at", new Date().toISOString())
            .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`)
            .order("created_at", { ascending: false });

        if (error) throw error;

        // Fetch user's read/dismissed announcements
        const { data: readStatus } = await (supabase as any)
            .from("announcement_reads")
            .select("announcement_id, dismissed")
            .eq("user_id", user.id);

        const dismissedIds = new Set(
            (readStatus || [])
                .filter((r: any) => r.dismissed)
                .map((r: any) => r.announcement_id)
        );

        // Filter out dismissed announcements
        const visibleAnnouncements = (announcements || []).filter(
            (a: any) => !dismissedIds.has(a.id)
        );

        return NextResponse.json({ announcements: visibleAnnouncements });
    } catch (e: any) {
        console.error("Announcements API Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Dismiss an announcement
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

        // Upsert read status with dismissed=true
        const { error } = await (supabase as any)
            .from("announcement_reads")
            .upsert({
                announcement_id: announcementId,
                user_id: user.id,
                dismissed: true,
                read_at: new Date().toISOString()
            }, {
                onConflict: "announcement_id,user_id"
            });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Dismiss Announcement Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
