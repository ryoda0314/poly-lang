export type PlayBase64AudioOptions = {
    mimeType?: string;
};

const normalizeAudioMimeType = (mimeType?: string) => {
    if (!mimeType) return "audio/mpeg";
    const lower = mimeType.toLowerCase();
    if (lower === "audio/mp3") return "audio/mpeg";
    return mimeType;
};

const normalizeBase64 = (base64: string) => {
    const cleaned = base64.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
    const padLength = cleaned.length % 4;
    if (padLength === 0) return cleaned;
    return cleaned + "=".repeat(4 - padLength);
};

const base64ToBytes = (base64: string) => {
    const normalized = normalizeBase64(base64);
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
};

const parseSampleRate = (mimeType: string) => {
    // Examples:
    // - audio/l16;codec=pcm;rate=24000
    // - audio/pcm;rate=24000
    const match = mimeType.match(/(?:^|;)\s*rate=(\d+)/i);
    const rate = match ? Number(match[1]) : NaN;
    return Number.isFinite(rate) && rate > 0 ? rate : 24000;
};

const isLinear16Pcm = (mimeType: string) => {
    const lower = mimeType.toLowerCase();
    return lower.startsWith("audio/l16") || lower.includes("codec=pcm") || lower.startsWith("audio/pcm");
};

type Pcm16Endianness = "le" | "be";

const toLittleEndianPcm16 = (pcmBytes: Uint8Array, inputEndianness: Pcm16Endianness) => {
    if (inputEndianness === "le") return pcmBytes;
    const swapped = new Uint8Array(pcmBytes.length);
    for (let i = 0; i + 1 < pcmBytes.length; i += 2) {
        swapped[i] = pcmBytes[i + 1];
        swapped[i + 1] = pcmBytes[i];
    }
    if (pcmBytes.length % 2 === 1) {
        swapped[pcmBytes.length - 1] = pcmBytes[pcmBytes.length - 1];
    }
    return swapped;
};

const pcm16ToWav = (pcmBytes: Uint8Array, sampleRate: number, channels: number, inputEndianness: Pcm16Endianness) => {
    // WAV expects little-endian signed PCM16.
    const pcmLE = toLittleEndianPcm16(pcmBytes, inputEndianness);

    const bitsPerSample = 16;
    const blockAlign = (channels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;

    const dataSize = pcmLE.length;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    const writeString = (offset: number, value: string) => {
        for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, "WAVE");

    writeString(12, "fmt ");
    view.setUint32(16, 16, true); // PCM header size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    writeString(36, "data");
    view.setUint32(40, dataSize, true);

    new Uint8Array(buffer, 44).set(pcmLE);
    return new Uint8Array(buffer);
};

export const playBase64Audio = async (base64: string, options: PlayBase64AudioOptions = {}) => {
    const mimeType = normalizeAudioMimeType(options.mimeType);

    let bytes = base64ToBytes(base64);
    let blobType = mimeType;

    if (isLinear16Pcm(mimeType)) {
        const sampleRate = parseSampleRate(mimeType);
        const channels = 1;
        // Force little-endian interpretation for deterministic playback.
        bytes = pcm16ToWav(bytes, sampleRate, channels, "le");
        blobType = "audio/wav";
    }

    const blob = new Blob([bytes], { type: blobType });
    const url = URL.createObjectURL(blob);

    const audio = new Audio();
    audio.src = url;

    try {
        await audio.play();
    } finally {
        audio.addEventListener("ended", () => URL.revokeObjectURL(url), { once: true });
        audio.addEventListener("error", () => URL.revokeObjectURL(url), { once: true });
    }
};
