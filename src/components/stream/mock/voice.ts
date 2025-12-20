import { VoiceResult } from "@/types/stream";

export async function mockVoiceCheck(targetText: string, blob: Blob): Promise<VoiceResult> {
    await new Promise(r => setTimeout(r, 1500));

    const score = Math.floor(Math.random() * 30) + 70;

    return {
        asrText: targetText + (score < 100 ? "..." : ""),
        score,
        diff: score < 100 ? { before: targetText, after: targetText + "..." } : undefined,
        advice: score < 90 ? "Try articulating the end of the sentence more clearly." : "Great pronunciation!"
    };
}
