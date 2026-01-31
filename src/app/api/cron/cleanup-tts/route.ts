import { NextRequest, NextResponse } from "next/server";
import { cleanupOldTTSFiles } from "@/actions/speech";

export async function GET(request: NextRequest) {
    // Verify cron secret from Vercel
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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
