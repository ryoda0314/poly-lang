import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { cleanupOldTTSFiles } from "@/actions/speech";

function safeCompare(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
}

export async function GET(request: NextRequest) {
    // Verify cron secret from Vercel (timing-safe)
    const authHeader = request.headers.get("authorization") || "";
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || !safeCompare(authHeader, `Bearer ${cronSecret}`)) {
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
