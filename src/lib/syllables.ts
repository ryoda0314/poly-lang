"use client";

import { batchGetSyllableBreakdowns } from "@/actions/syllables";

const STORAGE_KEY = "syllable_cache";
const STORAGE_VERSION = 1;
const MAX_CACHE_SIZE = 5000;
const BATCH_DELAY_MS = 100;

const clientCache = new Map<string, string>();
let cacheInitialized = false;

type SyllableCallback = (syllables: string) => void;
interface PendingRequest {
    text: string;
    callback: SyllableCallback;
}
const pendingQueue: PendingRequest[] = [];
let batchTimeout: ReturnType<typeof setTimeout> | null = null;
let isFetching = false;

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
        // Ignore
    }
    cacheInitialized = true;
}

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
        // Ignore
    }
}

function cacheKey(text: string): string {
    return text.trim();
}

export function getCachedSyllables(text: string): string | undefined {
    initCache();
    return clientCache.get(cacheKey(text));
}

async function flushBatch(): Promise<void> {
    if (pendingQueue.length === 0 || isFetching) return;

    isFetching = true;
    const requests = [...pendingQueue];
    pendingQueue.length = 0;

    const uncachedTexts = new Set<string>();
    requests.forEach(req => {
        const key = cacheKey(req.text);
        if (!clientCache.has(key)) {
            uncachedTexts.add(req.text.trim());
        }
    });

    if (uncachedTexts.size > 0) {
        try {
            const results = await batchGetSyllableBreakdowns(Array.from(uncachedTexts));
            let hasNew = false;
            Object.entries(results).forEach(([text, syllables]) => {
                if (syllables) {
                    clientCache.set(cacheKey(text), syllables);
                    hasNew = true;
                }
            });
            if (hasNew) persistCache();
        } catch (e) {
            console.error("Syllable batch fetch error:", e);
        }
    }

    requests.forEach(req => {
        const key = cacheKey(req.text);
        const syllables = clientCache.get(key) || "";
        req.callback(syllables);
    });

    isFetching = false;

    if (pendingQueue.length > 0) {
        flushBatch();
    }
}

/**
 * Queue syllable fetch request (batched with debounce).
 * Returns a cleanup function.
 */
export function queueSyllableFetch(
    text: string,
    callback: SyllableCallback
): () => void {
    initCache();

    const trimmed = text.trim();
    if (!trimmed) {
        callback("");
        return () => {};
    }

    const key = cacheKey(trimmed);
    if (clientCache.has(key)) {
        callback(clientCache.get(key)!);
        return () => {};
    }

    const request: PendingRequest = { text: trimmed, callback };
    pendingQueue.push(request);

    if (batchTimeout) {
        clearTimeout(batchTimeout);
    }
    batchTimeout = setTimeout(() => {
        batchTimeout = null;
        flushBatch();
    }, BATCH_DELAY_MS);

    return () => {
        const idx = pendingQueue.indexOf(request);
        if (idx !== -1) {
            pendingQueue.splice(idx, 1);
        }
    };
}
