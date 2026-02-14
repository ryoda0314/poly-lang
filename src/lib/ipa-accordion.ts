"use client";

/**
 * Simple event-based accordion for IPA displays.
 * Only one IPA can be open at a time across the entire page.
 * When one opens, all others close.
 */

type Listener = (activeId: string) => void;

const listeners = new Set<Listener>();
let currentActiveId: string | null = null;

/** Notify all listeners that a new IPA was opened */
export function openIPA(id: string): void {
    currentActiveId = id;
    listeners.forEach(fn => fn(id));
}

/** Close the active IPA (if any) */
export function closeIPA(): void {
    currentActiveId = null;
}

/** Subscribe to IPA open events. Returns unsubscribe function. */
export function onIPAChange(fn: Listener): () => void {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
}

/** Get a stable unique ID for an IPA instance */
let counter = 0;
export function getIPAId(): string {
    return `ipa-${++counter}`;
}
