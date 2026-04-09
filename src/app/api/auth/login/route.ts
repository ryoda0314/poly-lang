import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// --- Rate limiting ---
const IP_WINDOW_MS = 60 * 1000; // 1-minute window
const IP_MAX_REQUESTS = 5; // max 5 login checks per IP per minute
const MAX_MAP_SIZE = 5000;

const ipRateLimitMap = new Map<string, { count: number; resetTime: number }>();

function cleanupMap() {
    const now = Date.now();
    for (const [key, val] of ipRateLimitMap.entries()) {
        if (now > val.resetTime) ipRateLimitMap.delete(key);
    }
}

// Minimum response time to prevent timing attacks (in milliseconds)
const MIN_RESPONSE_TIME_MS = 200;

export async function POST(request: Request) {
    const startTime = Date.now();

    try {
        // Cleanup periodically
        if (ipRateLimitMap.size > MAX_MAP_SIZE) {
            cleanupMap();
            if (ipRateLimitMap.size >= MAX_MAP_SIZE) {
                return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
            }
        }

        // IP rate limiting
        const forwarded = request.headers.get("x-forwarded-for");
        const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
        const now = Date.now();
        const ipRecord = ipRateLimitMap.get(ip);

        if (ipRecord && now < ipRecord.resetTime) {
            if (ipRecord.count >= IP_MAX_REQUESTS) {
                return NextResponse.json(
                    { error: "Too many requests. Please try again later." },
                    { status: 429 }
                );
            }
            ipRecord.count++;
        } else {
            ipRateLimitMap.set(ip, { count: 1, resetTime: now + IP_WINDOW_MS });
        }

        const { email } = await request.json();

        if (!email || typeof email !== "string") {
            return NextResponse.json({ error: "Invalid email" }, { status: 400 });
        }

        const supabase = await createAdminClient();

        // Direct indexed lookup via database function (replaces listUsers)
        const { data, error } = await supabase.rpc("check_email_verified" as any, {
            p_email: email,
        }) as { data: { exists: boolean; email_verified?: boolean } | null; error: any };

        if (error) {
            console.error("check_email_verified error:", error);
            await ensureMinResponseTime(startTime);
            return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
        }

        // SECURITY: Same error message for both "not found" and "not verified"
        // Combined with constant-time response to prevent user enumeration via timing attacks
        if (!data?.exists || !data.email_verified) {
            await ensureMinResponseTime(startTime);
            return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
        }

        // Email is verified, allow login
        await ensureMinResponseTime(startTime);
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Login check error:", e);
        await ensureMinResponseTime(startTime);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Ensures response takes at least MIN_RESPONSE_TIME_MS to prevent timing attacks
async function ensureMinResponseTime(startTime: number): Promise<void> {
    const elapsed = Date.now() - startTime;
    const remaining = MIN_RESPONSE_TIME_MS - elapsed;
    if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining));
    }
}