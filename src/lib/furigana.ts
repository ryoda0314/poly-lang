"use client";

import { getFuriganaReadings } from "@/actions/furigana";

// Constants
const STORAGE_KEY = "furigana_cache";
const STORAGE_VERSION = 1;
const MAX_CACHE_SIZE = 5000; // Maximum entries in localStorage
const BATCH_DELAY_MS = 50; // Debounce delay for batching

// Client-side memory cache (backed by localStorage)
const clientCache = new Map<string, string>();
let cacheInitialized = false;

// Batch queue for collecting requests from multiple components
type FuriganaCallback = (readings: Map<string, string>) => void;
interface PendingRequest {
    tokens: string[];
    callback: FuriganaCallback;
}
const pendingQueue: PendingRequest[] = [];
let batchTimeout: ReturnType<typeof setTimeout> | null = null;
let isFetching = false;

/**
 * Initialize cache from localStorage
 */
function initCache(): void {
    if (cacheInitialized || typeof window === "undefined") return;

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.version === STORAGE_VERSION && parsed.data) {
                Object.entries(parsed.data).forEach(([k, v]) => {
                    clientCache.set(k, v as string);
                });
            }
        }
    } catch {
        // Ignore localStorage errors
    }
    cacheInitialized = true;
}

/**
 * Persist cache to localStorage
 */
function persistCache(): void {
    if (typeof window === "undefined") return;

    try {
        // Limit cache size - keep most recent entries
        const entries = Array.from(clientCache.entries());
        const toStore = entries.slice(-MAX_CACHE_SIZE);

        const data: Record<string, string> = {};
        toStore.forEach(([k, v]) => {
            data[k] = v;
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            version: STORAGE_VERSION,
            data
        }));
    } catch {
        // Ignore localStorage errors (quota exceeded, etc.)
    }
}

/**
 * Check if a character is a kanji
 */
export function isKanji(char: string): boolean {
    const code = char.charCodeAt(0);
    return (code >= 0x4e00 && code <= 0x9faf) || (code >= 0x3400 && code <= 0x4dbf);
}

/**
 * Check if a string contains kanji characters
 */
export function containsKanji(text: string): boolean {
    for (const char of text) {
        if (isKanji(char)) return true;
    }
    return false;
}

/**
 * Get furigana for a single token (uses client cache)
 */
export function getCachedFurigana(text: string): string | undefined {
    initCache();
    return clientCache.get(text);
}

/**
 * Fetch furigana readings for multiple tokens from server
 * Updates client cache and returns the readings
 */
export async function fetchFuriganaForTokens(
    tokens: string[]
): Promise<Map<string, string>> {
    initCache();

    // Filter tokens that contain kanji
    const kanjiTokens = tokens.filter(t => containsKanji(t));

    if (kanjiTokens.length === 0) {
        return new Map();
    }

    // Check which tokens are not in cache
    const uncachedTokens = kanjiTokens.filter(t => !clientCache.has(t));

    // If all are cached, return from cache
    if (uncachedTokens.length === 0) {
        const result = new Map<string, string>();
        kanjiTokens.forEach(t => {
            const cached = clientCache.get(t);
            if (cached) result.set(t, cached);
        });
        return result;
    }

    try {
        // Fetch from server
        const readings = await getFuriganaReadings(uncachedTokens);

        // Update client cache
        let hasNewEntries = false;
        Object.entries(readings).forEach(([word, reading]) => {
            if (reading) {
                clientCache.set(word, reading);
                hasNewEntries = true;
            }
        });

        // Persist to localStorage if we got new entries
        if (hasNewEntries) {
            persistCache();
        }

        // Build result map
        const result = new Map<string, string>();
        kanjiTokens.forEach(t => {
            const reading = clientCache.get(t) || readings[t];
            if (reading) result.set(t, reading);
        });

        return result;
    } catch (error) {
        console.error("Failed to fetch furigana:", error);
        return new Map();
    }
}

/**
 * Get furigana (uses cache, returns empty if not cached)
 */
export function getFurigana(text: string): string {
    return clientCache.get(text) || "";
}

/**
 * Preload is no longer needed (no heavy dictionary)
 */
export async function preloadFurigana(): Promise<void> {
    // No-op - server-side processing now
}

/**
 * Process all pending requests in a single batch
 */
async function flushBatch(): Promise<void> {
    if (pendingQueue.length === 0 || isFetching) return;

    isFetching = true;
    const requests = [...pendingQueue];
    pendingQueue.length = 0;

    // Collect all unique tokens
    const allTokens = new Set<string>();
    requests.forEach(req => {
        req.tokens.forEach(t => {
            if (containsKanji(t)) allTokens.add(t);
        });
    });

    // Filter out cached tokens
    const uncachedTokens = Array.from(allTokens).filter(t => !clientCache.has(t));

    // Fetch uncached tokens from server
    if (uncachedTokens.length > 0) {
        try {
            const readings = await getFuriganaReadings(uncachedTokens);

            // Update cache
            let hasNewEntries = false;
            Object.entries(readings).forEach(([word, reading]) => {
                if (reading) {
                    clientCache.set(word, reading);
                    hasNewEntries = true;
                }
            });

            if (hasNewEntries) {
                persistCache();
            }
        } catch (error) {
            console.error("Batch furigana fetch error:", error);
        }
    }

    // Distribute results to all callbacks
    requests.forEach(req => {
        const result = new Map<string, string>();
        req.tokens.forEach(t => {
            const reading = clientCache.get(t);
            if (reading) result.set(t, reading);
        });
        req.callback(result);
    });

    isFetching = false;

    // Process any new requests that came in during fetch
    if (pendingQueue.length > 0) {
        flushBatch();
    }
}

/**
 * Queue furigana fetch request (batched with debounce)
 * Multiple components can call this and their requests will be combined
 */
export function queueFuriganaFetch(
    tokens: string[],
    callback: FuriganaCallback
): () => void {
    initCache();

    const kanjiTokens = tokens.filter(t => containsKanji(t));
    if (kanjiTokens.length === 0) {
        callback(new Map());
        return () => {};
    }

    // Check if all tokens are already cached
    const uncached = kanjiTokens.filter(t => !clientCache.has(t));
    if (uncached.length === 0) {
        const result = new Map<string, string>();
        kanjiTokens.forEach(t => {
            const reading = clientCache.get(t);
            if (reading) result.set(t, reading);
        });
        callback(result);
        return () => {};
    }

    // Add to pending queue
    const request: PendingRequest = { tokens: kanjiTokens, callback };
    pendingQueue.push(request);

    // Debounce the batch flush
    if (batchTimeout) {
        clearTimeout(batchTimeout);
    }
    batchTimeout = setTimeout(() => {
        batchTimeout = null;
        flushBatch();
    }, BATCH_DELAY_MS);

    // Return cleanup function
    return () => {
        const idx = pendingQueue.indexOf(request);
        if (idx !== -1) {
            pendingQueue.splice(idx, 1);
        }
    };
}