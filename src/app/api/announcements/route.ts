import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Fetch user's profile to get registration date
        const { data: profile } = await (supabase as any)
            .from("profiles")
            .select("created_at")
            .eq("id", user.id)
            .single();

        const userCreatedAt = profile?.created_at ? new Date(profile.created_at) : new Date();
        const daysSinceRegistration = Math.floor(
            (Date.now() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Fetch active announcements (newest first)
        const { data: announcements, error } = await (supabase as any)
            .from("announcements")
            .select("*")
            .eq("is_active", true)
            .lte("starts_at", new Date().toISOString())
            .order("created_at", { ascending: false });

        if (error) throw error;

        // Filter announcements based on target audience
        const filteredAnnouncements = (announcements || []).filter((a: any) => {
            const targetAudience = a.target_audience || "all";
            const newUserDays = a.new_user_days || 7;

            if (targetAudience === "all") {
                return true;
            } else if (targetAudience === "new_users") {
                // Show to users registered within new_user_days
                return daysSinceRegistration <= newUserDays;
            } else if (targetAudience === "existing_users") {
                // Show to users registered more than new_user_days ago
                return daysSinceRegistration > newUserDays;
            }
            return true;
        });

        // Fetch user's read announcements
        const { data: readStatus } = await (supabase as any)
            .from("announcement_reads")
            .select("announcement_id, read_at")
            .eq("user_id", user.id);

        const readIds = new Set(
            (readStatus || []).map((r: any) => r.announcement_id)
        );

        // Add is_read flag to each announcement
        const announcementsWithReadStatus = filteredAnnouncements.map((a: any) => ({
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
