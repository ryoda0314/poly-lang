import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// レート制限の設定
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1分
const MAX_REQUESTS_PER_WINDOW = 30; // 1分間に30リクエストまで

// メモリ内でIPごとのリクエスト数を追跡
// WARNING: In-memory rate limiting has limitations:
// - Not shared across serverless instances (Vercel, etc.)
// - Resets on deployment/restart
// For production, consider: Vercel KV, Upstash Redis, or Cloudflare Rate Limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Maximum map size to prevent memory issues
const MAX_MAP_SIZE = 10000;

// 定期的に古いエントリをクリーンアップ
function cleanupRateLimitMap() {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
        if (now > value.resetTime) {
            rateLimitMap.delete(key);
        }
    }
}

// Paths excluded from general rate limiting (they have their own limits or are high-frequency polling)
const RATE_LIMIT_EXCLUDED_PATHS = [
    '/api/auth/',  // Auth endpoints have their own per-IP + per-email rate limiting
    '/api/cron/',  // Cron endpoints use bearer token auth, not IP-based limits
    '/api/extraction-jobs/',  // Polling endpoint, high frequency but read-only
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // All /api/* paths are rate-limited by default, except excluded ones
    const isExcluded = RATE_LIMIT_EXCLUDED_PATHS.some(path => pathname.startsWith(path));

    if (isExcluded) {
        return NextResponse.next();
    }

    // クリーンアップ（100リクエストごと、または上限到達時に実行）
    if (rateLimitMap.size > 100 || rateLimitMap.size >= MAX_MAP_SIZE) {
        cleanupRateLimitMap();
        // If still at max after cleanup, reject to prevent memory exhaustion
        if (rateLimitMap.size >= MAX_MAP_SIZE) {
            return NextResponse.json(
                { error: 'Service temporarily unavailable. Please try again.' },
                { status: 503 }
            );
        }
    }

    // IPアドレスを取得（プロキシ経由の場合はx-forwarded-forを使用）
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';
    const key = `${ip}:${pathname}`;

    const now = Date.now();
    const record = rateLimitMap.get(key);

    if (record) {
        // ウィンドウがまだ有効な場合
        if (now < record.resetTime) {
            if (record.count >= MAX_REQUESTS_PER_WINDOW) {
                // レート制限を超過
                const retryAfter = Math.ceil((record.resetTime - now) / 1000);
                return NextResponse.json(
                    {
                        error: 'Too many requests. Please try again later.',
                        retryAfter,
                    },
                    {
                        status: 429,
                        headers: {
                            'Retry-After': retryAfter.toString(),
                            'X-RateLimit-Limit': MAX_REQUESTS_PER_WINDOW.toString(),
                            'X-RateLimit-Remaining': '0',
                            'X-RateLimit-Reset': record.resetTime.toString(),
                        },
                    }
                );
            }
            // カウントを増加
            record.count++;
        } else {
            // ウィンドウがリセットされた
            rateLimitMap.set(key, {
                count: 1,
                resetTime: now + RATE_LIMIT_WINDOW_MS,
            });
        }
    } else {
        // 新しいエントリを作成
        rateLimitMap.set(key, {
            count: 1,
            resetTime: now + RATE_LIMIT_WINDOW_MS,
        });
    }

    const currentRecord = rateLimitMap.get(key)!;
    const response = NextResponse.next();

    // レート制限情報をヘッダーに追加
    response.headers.set('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString());
    response.headers.set('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS_PER_WINDOW - currentRecord.count).toString());
    response.headers.set('X-RateLimit-Reset', currentRecord.resetTime.toString());

    return response;
}

export const config = {
    matcher: '/api/:path*',
};
