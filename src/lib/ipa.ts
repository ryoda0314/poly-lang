"use client";

import { batchGetIPATranscriptions } from "@/actions/ipa";

// Constants
const STORAGE_KEY = "ipa_cache";
const STORAGE_VERSION = 1;
const MAX_CACHE_SIZE = 5000;
const BATCH_DELAY_MS = 100; // Slightly longer than furigana since IPA involves LLM calls

// Client-side memory cache (backed by localStorage)
const clientCache = new Map<string, string>();
let cacheInitialized = false;

// Batch queue for collecting requests from multiple components
type IPACallback = (ipa: string) => void;
interface PendingRequest {
    text: string;
    mode: "word" | "connected";
    callback: IPACallback;
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
 * Build cache key from text and mode
 */
function cacheKey(text: string, mode: "word" | "connected"): string {
    return `${mode}:${text.trim()}`;
}

/**
 * Get cached IPA for text (returns undefined if not cached)
 */
export function getCachedIPA(text: string, mode: "word" | "connected"): string | undefined {
    initCache();
    return clientCache.get(cacheKey(text, mode));
}

/**
 * Process all pending requests in a single batch
 */
async function flushBatch(): Promise<void> {
    if (pendingQueue.length === 0 || isFetching) return;

    isFetching = true;
    const requests = [...pendingQueue];
    pendingQueue.length = 0;

    // Group by mode
    const wordTexts = new Set<string>();
    const connectedTexts = new Set<string>();

    requests.forEach(req => {
        const key = cacheKey(req.text, req.mode);
        if (!clientCache.has(key)) {
            if (req.mode === "word") {
                wordTexts.add(req.text.trim());
            } else {
                connectedTexts.add(req.text.trim());
            }
        }
    });

    // Fetch uncached texts from server (in parallel for both modes)
    const fetches: Promise<void>[] = [];

    if (wordTexts.size > 0) {
        fetches.push(
            batchGetIPATranscriptions(Array.from(wordTexts), "word")
                .then(results => {
                    let hasNew = false;
                    Object.entries(results).forEach(([text, ipa]) => {
                        if (ipa) {
                            clientCache.set(cacheKey(text, "word"), ipa);
                            hasNew = true;
                        }
                    });
                    if (hasNew) persistCache();
                })
                .catch(console.error)
        );
    }

    if (connectedTexts.size > 0) {
        fetches.push(
            batchGetIPATranscriptions(Array.from(connectedTexts), "connected")
                .then(results => {
                    let hasNew = false;
                    Object.entries(results).forEach(([text, ipa]) => {
                        if (ipa) {
                            clientCache.set(cacheKey(text, "connected"), ipa);
                            hasNew = true;
                        }
                    });
                    if (hasNew) persistCache();
                })
                .catch(console.error)
        );
    }

    await Promise.all(fetches);

    // Distribute results to all callbacks
    requests.forEach(req => {
        const key = cacheKey(req.text, req.mode);
        const ipa = clientCache.get(key) || "";
        req.callback(ipa);
    });

    isFetching = false;

    // Process any new requests that came in during fetch
    if (pendingQueue.length > 0) {
        flushBatch();
    }
}

/**
 * Queue IPA fetch request (batched with debounce).
 * Multiple components can call this and their requests will be combined.
 * Returns a cleanup function.
 */
export function queueIPAFetch(
    text: string,
    mode: "word" | "connected",
    callback: IPACallback
): () => void {
    initCache();

    const trimmed = text.trim();
    if (!trimmed) {
        callback("");
        return () => {};
    }

    // Check if already cached
    const key = cacheKey(trimmed, mode);
    if (clientCache.has(key)) {
        callback(clientCache.get(key)!);
        return () => {};
    }

    // Add to pending queue
    const request: PendingRequest = { text: trimmed, mode, callback };
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
