/**
 * Decode an audio Blob (WebM, etc.) to 16kHz mono PCM WAV using Web Audio API.
 * This runs entirely in the browser — no ffmpeg needed on the server.
 */
export async function encodeToWav(blob: Blob): Promise<Blob> {
    const arrayBuffer = await blob.arrayBuffer();

    // Use default sample rate (typically 48kHz) for reliable WebM/Opus decoding
    // Then manually resample to 16kHz
    const audioCtx = new AudioContext();

    try {
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        console.log(`[wav-encoder] Decoded: ${audioBuffer.numberOfChannels}ch, ${audioBuffer.sampleRate}Hz, ${audioBuffer.length} samples, ${(audioBuffer.length / audioBuffer.sampleRate).toFixed(2)}s`);

        // Mix down to mono
        const numSamples = audioBuffer.length;
        const mono = new Float32Array(numSamples);
        const numChannels = audioBuffer.numberOfChannels;

        for (let ch = 0; ch < numChannels; ch++) {
            const channelData = audioBuffer.getChannelData(ch);
            for (let i = 0; i < numSamples; i++) {
                mono[i] += channelData[i] / numChannels;
            }
        }

        // Resample to 16kHz
        let pcm: Float32Array;
        if (audioBuffer.sampleRate !== 16000) {
            const ratio = audioBuffer.sampleRate / 16000;
            const newLength = Math.round(numSamples / ratio);
            pcm = new Float32Array(newLength);
            for (let i = 0; i < newLength; i++) {
                const srcIdx = i * ratio;
                const idx = Math.floor(srcIdx);
                const frac = srcIdx - idx;
                const s0 = mono[idx] ?? 0;
                const s1 = mono[Math.min(idx + 1, numSamples - 1)] ?? 0;
                pcm[i] = s0 + frac * (s1 - s0);
            }
        } else {
            pcm = mono;
        }

        // Check for silent audio
        let maxAmp = 0;
        for (let i = 0; i < pcm.length; i++) {
            const abs = Math.abs(pcm[i]);
            if (abs > maxAmp) maxAmp = abs;
        }
        console.log(`[wav-encoder] Resampled: ${pcm.length} samples at 16kHz, peak amplitude: ${maxAmp.toFixed(4)}`);

        // Convert to 16-bit PCM
        const pcm16 = new Int16Array(pcm.length);
        for (let i = 0; i < pcm.length; i++) {
            const s = Math.max(-1, Math.min(1, pcm[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Build WAV file
        const wavBuffer = new ArrayBuffer(44 + pcm16.byteLength);
        const view = new DataView(wavBuffer);

        const writeString = (offset: number, str: string) => {
            for (let i = 0; i < str.length; i++) {
                view.setUint8(offset + i, str.charCodeAt(i));
            }
        };

        const sampleRate = 16000;
        const bitsPerSample = 16;
        const channels = 1;
        const byteRate = sampleRate * channels * (bitsPerSample / 8);
        const blockAlign = channels * (bitsPerSample / 8);

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + pcm16.byteLength, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);          // chunk size
        view.setUint16(20, 1, true);           // PCM format
        view.setUint16(22, channels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, byteRate, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitsPerSample, true);
        writeString(36, 'data');
        view.setUint32(40, pcm16.byteLength, true);

        new Uint8Array(wavBuffer, 44).set(new Uint8Array(pcm16.buffer));

        return new Blob([wavBuffer], { type: 'audio/wav' });
    } finally {
        await audioCtx.close();
    }
}
