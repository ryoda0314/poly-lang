import { NextRequest, NextResponse } from "next/server";
import { cleanupOldTTSFiles } from "@/actions/speech";

export async function GET(request: NextRequest) {
    // Verify cron secret from Vercel
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const result = await cleanupOldTTSFiles();

        return NextResponse.json({
            message: `TTS cleanup complete`,
            ...result
        });
    } catch (error) {
        console.error("TTS cleanup cron error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
