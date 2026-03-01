"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Play, Pause, Loader2 } from "lucide-react";
import { generateSpeech } from "@/actions/speech";
import { unlockAudio } from "@/lib/audio";
import styles from "./AudioPlayer.module.css";

interface Props {
    text: string;
    langCode: string;
}

/** Convert base64 PCM to WAV blob URL (seekable). */
function pcmToWavUrl(base64: string, mimeType: string): string {
    const cleaned = base64.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
    const padLen = cleaned.length % 4;
    const padded = padLen === 0 ? cleaned : cleaned + "=".repeat(4 - padLen);
    const bin = atob(padded);
    const pcm = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) pcm[i] = bin.charCodeAt(i);

    const rateMatch = mimeType.match(/rate=(\d+)/i);
    const rate = rateMatch ? Number(rateMatch[1]) : 24000;
    const ch = 1, bps = 16;
    const blockAlign = (ch * bps) / 8;
    const byteRate = rate * blockAlign;
    const buf = new ArrayBuffer(44 + pcm.length);
    const v = new DataView(buf);
    const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, "RIFF"); v.setUint32(4, 36 + pcm.length, true); w(8, "WAVE");
    w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
    v.setUint16(22, ch, true); v.setUint32(24, rate, true);
    v.setUint32(28, byteRate, true); v.setUint16(32, blockAlign, true); v.setUint16(34, bps, true);
    w(36, "data"); v.setUint32(40, pcm.length, true);
    new Uint8Array(buf, 44).set(pcm);
    return URL.createObjectURL(new Blob([new Uint8Array(buf)], { type: "audio/wav" }));
}

export default function AudioPlayer({ text, langCode }: Props) {
    const [loading, setLoading] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [pos, setPos] = useState(0);
    const [dur, setDur] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [ready, setReady] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const rafRef = useRef(0);
    const urlRef = useRef<string | null>(null);

    useEffect(() => () => {
        cancelAnimationFrame(rafRef.current);
        audioRef.current?.pause();
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    }, []);

    useEffect(() => {
        audioRef.current?.pause();
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = null; audioRef.current = null;
        setReady(false); setPlaying(false); setPos(0); setDur(0); setError(null);
    }, [text]);

    const tick = useCallback(() => {
        const a = audioRef.current;
        if (!a || a.paused) return;
        setPos(a.currentTime);
        rafRef.current = requestAnimationFrame(tick);
    }, []);

    const wire = useCallback((a: HTMLAudioElement) => {
        a.onplay = () => { setPlaying(true); rafRef.current = requestAnimationFrame(tick); };
        a.onpause = () => { setPlaying(false); cancelAnimationFrame(rafRef.current); };
        a.onended = () => { setPlaying(false); setPos(0); cancelAnimationFrame(rafRef.current); };
        a.onloadedmetadata = () => setDur(a.duration);
    }, [tick]);

    const handlePlay = useCallback(async () => {
        setError(null);

        if (audioRef.current && ready) {
            if (playing) audioRef.current.pause();
            else await audioRef.current.play().catch(() => {});
            return;
        }

        setLoading(true);
        const audio = unlockAudio();
        audioRef.current = audio;
        wire(audio);

        try {
            const result = await generateSpeech(text, langCode, undefined, true);
            if (!result || "error" in result) {
                setError(typeof result === "object" && result && "error" in result ? result.error : "音声生成に失敗しました");
                setLoading(false);
                return;
            }

            const url = pcmToWavUrl(result.data, result.mimeType);
            urlRef.current = url;
            audio.src = url;

            await new Promise<void>((res, rej) => {
                audio.addEventListener("canplaythrough", () => res(), { once: true });
                audio.addEventListener("error", () => rej(), { once: true });
                setTimeout(res, 8000);
            });

            wire(audio);
            setDur(audio.duration);
            setReady(true);
            setLoading(false);
            await audio.play().catch(() => {});
        } catch {
            setError("音声生成に失敗しました");
            setLoading(false);
        }
    }, [text, langCode, playing, ready, wire]);

    const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const a = audioRef.current;
        if (!a) return;
        const t = parseFloat(e.target.value);
        a.currentTime = t;
        setPos(t);
    }, []);

    const fmt = (s: number) => {
        if (!isFinite(s) || s <= 0) return "0:00";
        return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
    };

    const pct = dur > 0 ? (pos / dur) * 100 : 0;

    return (
        <div className={styles.player}>
            <button className={styles.playButton} onClick={handlePlay} disabled={loading}>
                {loading ? <Loader2 size={16} className={styles.spinner} />
                    : playing ? <Pause size={16} />
                    : <Play size={16} style={{ marginLeft: 2 }} />}
            </button>

            <div className={styles.center}>
                <span className={styles.time}>{fmt(pos)}</span>
                <div className={styles.sliderWrap}>
                    <input
                        type="range" min={0} max={dur || 1} step={0.1}
                        value={pos} onChange={handleSeek}
                        className={styles.slider}
                        style={{ "--progress": `${pct}%` } as React.CSSProperties}
                        disabled={!ready}
                    />
                </div>
                <span className={styles.time}>{fmt(dur)}</span>
            </div>

            {error && <span className={styles.error}>{error}</span>}
        </div>
    );
}
