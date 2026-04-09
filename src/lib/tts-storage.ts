/**
 * Pre-generated TTS audio from Supabase Storage.
 *
 * Audio files are stored at: tts-audio/{voice}/{lang}/{sha256(text)}.wav
 * This module constructs the public URL and attempts playback,
 * returning whether it succeeded so callers can fall back to on-the-fly generation.
 */

const BUCKET = "tts-audio";
const DEFAULT_VOICE = "Kore";

function getSupabaseUrl(): string {
    return process.env.NEXT_PUBLIC_SUPABASE_URL || "";
}

async function sha256Hex(text: string): Promise<string> {
    const data = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

/**
 * Build the public URL for a pre-generated audio file.
 */
export async function getPreGeneratedAudioUrl(
    text: string,
    langCode: string,
    voiceName?: string,
    learnerMode?: boolean
): Promise<string> {
    const hash = await sha256Hex(text);
    const voice = learnerMode ? `${voiceName || DEFAULT_VOICE}-learner` : (voiceName || DEFAULT_VOICE);
    return `${getSupabaseUrl()}/storage/v1/object/public/${BUCKET}/${voice}/${langCode}/${hash}.wav`;
}

/**
 * Try to play pre-generated audio from Supabase Storage.
 *
 * Returns `true` if playback started successfully, `false` if the file
 * doesn't exist or playback failed (caller should fall back to API).
 */
export async function tryPlayPreGenerated(
    text: string,
    langCode: string,
    playbackRate?: number,
    existingAudio?: HTMLAudioElement,
    voiceName?: string,
    learnerMode?: boolean
): Promise<boolean> {
    try {
        const url = await getPreGeneratedAudioUrl(text, langCode, voiceName, learnerMode);

        // HEAD check to avoid loading a 404 body
        const res = await fetch(url, { method: "HEAD" });
        if (!res.ok) return false;

        return new Promise<boolean>((resolve) => {
            const audio = existingAudio || new Audio();
            audio.src = url;
            if (playbackRate) audio.playbackRate = playbackRate;

            audio.addEventListener("canplaythrough", () => {
                audio.play().then(() => resolve(true)).catch(() => resolve(false));
            }, { once: true });

            audio.addEventListener("error", () => resolve(false), { once: true });

            // Timeout: if nothing happens in 5s, give up
            setTimeout(() => resolve(false), 5000);
        });
    } catch {
        return false;
    }
}