"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Mic, Square, RotateCcw, X, MapPin, Volume2, ArrowLeft,
    UtensilsCrossed, Plane, Building2, ShoppingBag,
    Navigation, Briefcase, Phone, Home,
} from "lucide-react";
import { useAppStore } from "@/store/app-context";
import { useSpeakingPronunciation } from "@/hooks/use-speaking-pronunciation";
import { SITUATION_PRESETS, type ChatSettings } from "@/store/chat-store";
import type { SpeakingMessage, AzureWordResult } from "@/types/pronunciation";
import { generateSpeech } from "@/actions/speech";
import { playBase64Audio, unlockAudio } from "@/lib/audio";
import styles from "./page.module.css";

// ─── Pronunciation detail helpers ────────────────────────────────────
function scoreColor(s: number) {
    if (s >= 80) return "#10b981";
    if (s >= 60) return "#d97706";
    return "#dc2626";
}
function scoreBg(s: number) {
    if (s >= 80) return "rgba(16,185,129,0.1)";
    if (s >= 60) return "rgba(217,119,6,0.1)";
    return "rgba(220,38,38,0.1)";
}

function MiniRing({ score }: { score: number }) {
    const size = 92, stroke = 9;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const offset = c - (score / 100) * c;
    const color = scoreColor(score);
    return (
        <div className={styles.miniRing} style={{ width: size, height: size }}>
            <svg width={size} height={size} style={{ position: "absolute", inset: 0 }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-border)" strokeWidth={stroke} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                    strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{ transition: "stroke-dashoffset 0.8s ease" }}
                />
            </svg>
            <div className={styles.miniRingCenter}>
                <span className={styles.miniRingScore} style={{ color }}>{score}</span>
                <span className={styles.miniRingLabel}>score</span>
            </div>
        </div>
    );
}
function scoreBorder(s: number) {
    if (s >= 80) return "rgba(16,185,129,0.28)";
    if (s >= 60) return "rgba(217,119,6,0.28)";
    return "rgba(220,38,38,0.28)";
}

function WordChip({ word }: { word: AzureWordResult }) {
    const sc = word.accuracyScore;
    return (
        <div className={styles.wcWrapper}>
            <div className={styles.wcHeader} style={{ color: scoreColor(sc) }}>
                <span className={styles.wcWord}>{word.word}</span>
                {word.errorType !== "None" && <span className={styles.wcErr}>{word.errorType}</span>}
                <span className={styles.wcScore}>{Math.round(sc)}</span>
            </div>
            <div className={styles.wcBar}>
                <div className={styles.wcBarFill} style={{ width: `${sc}%`, background: scoreColor(sc) }} />
            </div>
            {word.phonemes.length > 0 && (
                <div className={styles.wcPhonemes}>
                    {word.phonemes.map((p, i) => (
                        <span key={i} className={styles.wcPhoneme}
                            style={{ color: scoreColor(p.accuracyScore), background: scoreBg(p.accuracyScore), borderColor: scoreBorder(p.accuracyScore) }}>
                            <span>/{p.phoneme}/</span>
                            <span className={styles.wcPhonemeScore}>{Math.round(p.accuracyScore)}</span>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── City layout ────────────────────────────────────────────────────
// 2 buildings per block × 4 blocks, separated by named roads

const CITY_BLOCKS: {
    buildings: { id: string; name: string; icon: React.ElementType; color: string; tag: string; npcName: string }[];
    road?: string;
}[] = [
    {
        buildings: [
            { id: "restaurant", name: "Restaurant", icon: UtensilsCrossed, color: "#f97316", tag: "Food & drink", npcName: "Waiter" },
            { id: "airport",    name: "Airport",     icon: Plane,           color: "#3b82f6", tag: "Travel",       npcName: "Staff" },
        ],
        road: "1st Avenue",
    },
    {
        buildings: [
            { id: "hotel",    name: "Hotel",    icon: Building2,   color: "#8b5cf6", tag: "Check in",    npcName: "Receptionist" },
            { id: "shopping", name: "Shopping", icon: ShoppingBag, color: "#ec4899", tag: "Buy things",  npcName: "Clerk" },
        ],
        road: "Market Street",
    },
    {
        buildings: [
            { id: "directions", name: "City",   icon: Navigation, color: "#10b981", tag: "Get around",   npcName: "Passerby" },
            { id: "interview",  name: "Office", icon: Briefcase,  color: "#64748b", tag: "Job interview", npcName: "Interviewer" },
        ],
        road: "Harbor Blvd",
    },
    {
        buildings: [
            { id: "phone", name: "Phone", icon: Phone, color: "#14b8a6", tag: "Call",       npcName: "Caller" },
            { id: "daily", name: "Home",  icon: Home,  color: "#d97706", tag: "Daily life", npcName: "Neighbor" },
        ],
    },
];

const SITUATION_LABELS = Object.fromEntries(
    SITUATION_PRESETS.map(s => [s.id, s.description])
);

function findBuilding(id: string) {
    for (const block of CITY_BLOCKS) {
        const b = block.buildings.find(b => b.id === id);
        if (b) return b;
    }
    return null;
}

const DEFAULT_PARTNER: ChatSettings["partner"] = {
    gender: "unspecified",
    relationship: "friend",
    ageGroup: "same",
    personality: "friendly",
    languageStyle: "standard",
};

// ─── Map screen ──────────────────────────────────────────────────────
function MapScreen({ loadingId, onSelect, onBack }: {
    loadingId: string | null;
    onSelect: (id: string) => void;
    onBack: () => void;
}) {
    return (
        <div className={styles.mapWrapper}>
            <div className={styles.cityMap}>
                {/* Header / Sky */}
                <div className={styles.mapHeaderRow}>
                    <button className={styles.mapBackBtn} onClick={onBack} aria-label="Back">
                        <ArrowLeft size={16} />
                    </button>
                    <div className={styles.sun} />
                    <div className={styles.mapPill}>
                        <MapPin size={12} className={styles.mapPinIcon} />
                        <span className={styles.mapPillText}>Where are you going?</span>
                    </div>
                </div>

                {/* City blocks with roads between them */}
                {CITY_BLOCKS.map((block, blockIdx) => (
                    <div key={blockIdx}>
                        {/* Buildings */}
                        <div className={styles.cityBlock}>
                            <div className={styles.lamp} />
                            <div className={styles.tree} />
                            {block.buildings.map(b => {
                                const Icon = b.icon;
                                const isLoading = loadingId === b.id;
                                return (
                                    <button
                                        key={b.id}
                                        data-bld={b.id}
                                        className={`${styles.building} ${isLoading ? styles.buildingLoading : ""}`}
                                        onClick={() => onSelect(b.id)}
                                        disabled={loadingId !== null}
                                        style={{ "--bc": b.color } as any}
                                    >
                                        {/* Roof */}
                                        <div className={styles.roof} />
                                        {/* Body */}
                                        <div className={styles.body}>
                                            {/* Signboard — main identifier */}
                                            <div className={styles.signboard}>
                                                <Icon size={16} color="white" strokeWidth={2.5} />
                                                <span className={styles.signboardText}>{b.name}</span>
                                            </div>
                                            {/* Windows */}
                                            <div className={styles.winGrid}>
                                                <div className={styles.w} />
                                                <div className={styles.w} />
                                                <div className={styles.w} />
                                                <div className={styles.w} />
                                            </div>
                                            <span className={styles.tagLabel}>{b.tag}</span>
                                        </div>
                                        {/* Door */}
                                        <div className={styles.door} />
                                    </button>
                                );
                            })}
                            <div className={styles.tree} />
                            <div className={styles.lamp} />
                        </div>

                        {/* Road between blocks */}
                        {block.road && (
                            <div className={styles.road}>
                                <span className={styles.roadSign}>{block.road}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Main page ───────────────────────────────────────────────────────
export default function SpeakingPage() {
    const router = useRouter();
    const { nativeLanguage, activeLanguageCode } = useAppStore();
    const pron = useSpeakingPronunciation();

    const [situationId, setSituationId] = useState<string | null>(null);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [messages, setMessages] = useState<SpeakingMessage[]>([]);
    const [latestSuggestions, setLatestSuggestions] = useState<string[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [waitingAI, setWaitingAI] = useState(false);
    const [pendingCorrection, setPendingCorrection] = useState<{
        original: string; corrected: string; explanation: string;
    } | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatSettings = useRef<ChatSettings>({
        partner: DEFAULT_PARTNER,
        situationId: "daily",
        customSituation: "",
    });
    const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
    const [detailMsgId, setDetailMsgId] = useState<string | null>(null);
    const currentAudio = useRef<HTMLAudioElement | null>(null);

    // Cleanup TTS on unmount
    useEffect(() => {
        return () => {
            if (currentAudio.current) {
                currentAudio.current.pause();
                currentAudio.current.src = "";
                currentAudio.current = null;
            }
        };
    }, []);

    // TTS helpers
    const stopSpeaking = useCallback(() => {
        if (currentAudio.current) {
            currentAudio.current.pause();
            currentAudio.current.src = "";
            currentAudio.current = null;
        }
        setSpeakingMsgId(null);
    }, []);

    const speakText = useCallback((text: string, msgId: string) => {
        stopSpeaking();
        // Unlock audio element synchronously inside user-gesture callstack
        const audio = unlockAudio();
        currentAudio.current = audio;
        setSpeakingMsgId(msgId);

        generateSpeech(text, "en", "Kore")
            .then(result => {
                if (!result || "error" in result) {
                    if (currentAudio.current === audio) {
                        setSpeakingMsgId(null);
                        currentAudio.current = null;
                    }
                    return;
                }
                audio.addEventListener("ended", () => {
                    if (currentAudio.current === audio) {
                        setSpeakingMsgId(null);
                        currentAudio.current = null;
                    }
                }, { once: true });
                audio.addEventListener("error", () => {
                    if (currentAudio.current === audio) {
                        setSpeakingMsgId(null);
                        currentAudio.current = null;
                    }
                }, { once: true });
                return playBase64Audio(result.data, { mimeType: result.mimeType }, audio);
            })
            .catch(() => {
                if (currentAudio.current === audio) {
                    setSpeakingMsgId(null);
                    currentAudio.current = null;
                }
            });
    }, [stopSpeaking]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, waitingAI]);

    // ── Start ──────────────────────────────────────────────────────
    const startConversation = useCallback(async (sitId: string) => {
        setLoadingId(sitId);
        const bldg = findBuilding(sitId);
        const npc = bldg?.npcName ?? "Partner";
        chatSettings.current = {
            partner: { ...DEFAULT_PARTNER, relationship: "stranger" },
            situationId: sitId,
            customSituation: `You are a ${npc}. Respond in ONE short sentence only. No long explanations.`,
        };

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [{ role: "user", content: "Open with one short greeting line." }],
                    settings: chatSettings.current,
                    learningLanguage: activeLanguageCode,
                    nativeLanguage,
                    assistMode: true,
                }),
            });
            if (!res.ok) throw new Error();
            const data = await res.json();

            const firstId = `ai-${Date.now()}`;
            setSituationId(sitId);
            setMessages([{
                id: firstId,
                role: "assistant",
                content: data.reply || "",
                timestamp: Date.now(),
                suggestions: data.suggestions ?? [],
            }]);
            setLatestSuggestions(data.suggestions ?? []);
            setSelected(null);
            setPendingCorrection(null);
            speakText(data.reply || "", firstId);
        } catch {
            // stay on map
        } finally {
            setLoadingId(null);
            setWaitingAI(false);
        }
    }, [activeLanguageCode, nativeLanguage, speakText]);

    // ── Mic ────────────────────────────────────────────────────────
    const handleMic = useCallback(async () => {
        if (pron.state === "recording") { pron.stop(); return; }
        stopSpeaking(); // stop NPC voice before recording
        if (selected) {
            await pron.startScripted(selected);
        } else {
            await pron.startFreeform();
        }
    }, [pron, selected, stopSpeaking]);

    // ── After speech → AI ──────────────────────────────────────────
    useEffect(() => {
        if (pron.state !== "done" || !pron.result) return;

        const { recognizedText, scores, words } = pron.result;
        const expectedText = pron.result.mode === "scripted" ? selected ?? undefined : undefined;

        const userMsg: SpeakingMessage = {
            id: `u-${Date.now()}`,
            role: "user",
            content: recognizedText,
            timestamp: Date.now(),
            pronunciationScore: scores ?? undefined,
            words: words.length > 0 ? words : undefined,
            expectedText,
        };

        setMessages(prev => [...prev, userMsg]);
        setLatestSuggestions([]);
        setSelected(null);
        setPendingCorrection(null);
        setWaitingAI(true);

        // Fire-and-forget: save pronunciation run to DB
        if (pron.result.runId && scores) {
            fetch('/api/pronunciation/save-result', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    runId: pron.result.runId,
                    phraseId: `speaking-${situationId}`,
                    expectedText: expectedText ?? recognizedText,
                    recognizedText,
                    scores,
                    words,
                    feedback: '',
                    durationSeconds: pron.result.durationSeconds,
                }),
            }).catch(() => {});
        }

        const history = [...messages, userMsg].map(m => ({
            role: m.role as "user" | "assistant",
            content: m.content,
        }));

        fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: history,
                settings: chatSettings.current,
                learningLanguage: activeLanguageCode,
                nativeLanguage,
                assistMode: true,
            }),
        })
            .then(r => (r.ok ? r.json() : Promise.reject()))
            .then(data => {
                const aiId = `ai-${Date.now()}`;
                setMessages(prev => [...prev, {
                    id: aiId,
                    role: "assistant" as const,
                    content: data.reply || "",
                    timestamp: Date.now(),
                    suggestions: data.suggestions ?? [],
                }]);
                setLatestSuggestions(data.suggestions ?? []);
                speakText(data.reply || "", aiId);
                if (data.correction?.hasError) {
                    setPendingCorrection({
                        original: data.correction.original,
                        corrected: data.correction.corrected,
                        explanation: data.correction.explanation,
                    });
                }
            })
            .catch(() => {
                setMessages(prev => [...prev, {
                    id: `ai-${Date.now()}`,
                    role: "assistant" as const,
                    content: "Connection error. Please try again.",
                    timestamp: Date.now(),
                }]);
            })
            .finally(() => setWaitingAI(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pron.state]);

    // ── Reset → map ────────────────────────────────────────────────
    const handleReset = useCallback(() => {
        stopSpeaking();
        pron.cancel();
        setSituationId(null);
        setMessages([]);
        setLatestSuggestions([]);
        setSelected(null);
        setPendingCorrection(null);
        setWaitingAI(false);
    }, [pron, stopSpeaking]);

    // ─── Map ────────────────────────────────────────────────────────
    if (!situationId) {
        return (
            <div className={styles.container} data-fullbleed>
                <MapScreen loadingId={loadingId} onSelect={startConversation} onBack={() => router.back()} />
            </div>
        );
    }

    // ─── Conversation ────────────────────────────────────────────────
    const isRecording = pron.state === "recording";
    const isProcessing = pron.state === "processing";
    const micDisabled = waitingAI || isProcessing;
    const lastMsgId = messages[messages.length - 1]?.id;
    const situationLabel = SITUATION_LABELS[situationId] ?? situationId;

    const building = findBuilding(situationId);
    const BuildingIcon = building?.icon ?? null;
    const buildingColor = building?.color ?? "var(--color-accent)";
    const npcName = building?.npcName ?? "Partner";

    return (
        <div className={styles.container} style={{ "--hc": buildingColor } as any} data-sit={situationId} data-fullbleed>
            {/* ── Header ── */}
            <div className={styles.header}>
                <div className={styles.headerInfo}>
                    {BuildingIcon && (
                        <span className={styles.headerIconBadge} style={{ background: buildingColor }}>
                            <BuildingIcon size={13} color="white" strokeWidth={2.5} />
                        </span>
                    )}
                    <div className={styles.headerText}>
                        <span className={styles.headerNpc}>{npcName}</span>
                        <span className={styles.headerSub}>{situationLabel}</span>
                    </div>
                </div>
                <button className={styles.headerBtn} onClick={handleReset} title="Back to map">
                    <RotateCcw size={15} />
                </button>
            </div>

            {/* ── Transcript ── */}
            <div className={styles.transcript}>
                {messages.map(msg => {
                    const isLast = msg.id === lastMsgId;
                    const sc = msg.pronunciationScore;
                    const isAI = msg.role === "assistant";
                    return (
                        <div
                            key={msg.id}
                            className={`${styles.line} ${isAI ? styles.lineAI : styles.lineUser} ${isLast ? styles.lineLast : ""}`}
                        >
                            <span className={styles.lineLabel}>{isAI ? npcName : "You"}</span>
                            <div className={styles.lineContent}>
                                <p className={styles.lineText}>{msg.content}</p>
                                {isAI && (
                                    <button
                                        className={`${styles.speakBtn} ${speakingMsgId === msg.id ? styles.speakBtnActive : ""}`}
                                        onClick={() => speakingMsgId === msg.id ? stopSpeaking() : speakText(msg.content, msg.id)}
                                        aria-label="Replay"
                                    >
                                        <Volume2 size={11} />
                                    </button>
                                )}
                                {sc && (
                                    <button
                                        className={styles.scoreCard}
                                        style={{ "--sc": scoreColor(sc.overall) } as any}
                                        onClick={() => setDetailMsgId(msg.id)}
                                    >
                                        <span className={styles.scoreMain}>{Math.round(sc.overall)}</span>
                                        <div className={styles.scoreSubs}>
                                            <span className={styles.scoreSub}>ACC {Math.round(sc.accuracy)}</span>
                                            <span className={styles.scoreSub}>FLU {Math.round(sc.fluency)}</span>
                                            <span className={styles.scoreDetail}>details →</span>
                                        </div>
                                    </button>
                                )}
                                {isAI && isLast && pendingCorrection && (
                                    <div className={styles.correctionBlock}>
                                        <div className={styles.correctionDiff}>
                                            <s>{pendingCorrection.original}</s>
                                            {" → "}
                                            <strong>{pendingCorrection.corrected}</strong>
                                        </div>
                                        <div className={styles.correctionNote}>{pendingCorrection.explanation}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {waitingAI && (
                    <div className={`${styles.line} ${styles.lineAI}`}>
                        <span className={styles.lineLabel}>{npcName}</span>
                        <div className={styles.lineContent}>
                            <div className={styles.typingRow}>
                                <span className={styles.typingDot} />
                                <span className={styles.typingDot} />
                                <span className={styles.typingDot} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* ── Pronunciation detail sheet ── */}
            {detailMsgId && (() => {
                const dm = messages.find(m => m.id === detailMsgId);
                if (!dm?.pronunciationScore) return null;
                const sc = dm.pronunciationScore;
                return (
                    <div className={styles.detailOverlay} onClick={() => setDetailMsgId(null)}>
                        <div className={styles.detailSheet} onClick={e => e.stopPropagation()}>
                            <div className={styles.detailHandle} />

                            {/* Header */}
                            <div className={styles.detailHeader}>
                                <span className={styles.detailTitle}>Pronunciation</span>
                                <button className={styles.detailClose} onClick={() => setDetailMsgId(null)}>
                                    <X size={15} />
                                </button>
                            </div>

                            {/* Hero: ring + 4 sub-scores */}
                            <div className={styles.detailHero}>
                                <MiniRing score={Math.round(sc.overall)} />
                                <div className={styles.detailAxes}>
                                    {([
                                        { label: "ACC", full: "Accuracy",     value: sc.accuracy },
                                        { label: "FLU", full: "Fluency",      value: sc.fluency },
                                        { label: "COM", full: "Completeness", value: sc.completeness },
                                        { label: "PRO", full: "Prosody",      value: sc.prosody },
                                    ] as const).map(({ label, value }) => (
                                        <div key={label} className={styles.detailAxis}>
                                            <span className={styles.detailAxisTag}>{label}</span>
                                            <div className={styles.detailAxisBar}>
                                                <div className={styles.detailAxisFill} style={{ width: `${value}%`, background: scoreColor(value) }} />
                                            </div>
                                            <span className={styles.detailAxisNum} style={{ color: scoreColor(value) }}>{Math.round(value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Reference phrase */}
                            {dm.expectedText && (
                                <div className={styles.detailPhrase}>
                                    <span className={styles.detailPhraseQuote}>"</span>
                                    <span className={styles.detailPhraseText}>{dm.expectedText}</span>
                                    <span className={styles.detailPhraseQuote}>"</span>
                                </div>
                            )}

                            {/* Word analysis */}
                            {dm.words && dm.words.length > 0 && (
                                <div className={styles.detailWords}>
                                    <div className={styles.detailSectionHeader}>
                                        <span className={styles.detailSectionLabel}>Word Analysis</span>
                                    </div>
                                    <div className={styles.detailWordFlow}>
                                        {dm.words.map((w, i) => <WordChip key={i} word={w} />)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}

            {/* ── Action panel ── */}
            <div className={styles.actionPanel}>
                {latestSuggestions.length > 0 && !waitingAI && !isRecording && !isProcessing && (
                    <div className={styles.chipPanel}>
                        <span className={styles.chipLabel}>Try saying</span>
                        {latestSuggestions.map((s, i) => (
                            <button
                                key={i}
                                className={`${styles.chipOption} ${selected === s ? styles.chipOptionSelected : ""}`}
                                onClick={() => setSelected(prev => prev === s ? null : s)}
                            >
                                <span className={styles.chipTxt}>{s}</span>
                            </button>
                        ))}
                    </div>
                )}
                <div className={styles.micSection}>
                    {pron.error && <span className={styles.errorInline}>{pron.error}</span>}
                    {selected && (
                        <div className={styles.selectedScript}>
                            <span className={styles.selectedScriptText}>{selected}</span>
                            {!isRecording && (
                                <button className={styles.clearScript} onClick={() => setSelected(null)}>
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    )}
                    <button
                        className={`${styles.micBtn} ${isRecording ? styles.micBtnRecording : ""} ${isProcessing ? styles.micBtnProcessing : ""}`}
                        onClick={handleMic}
                        disabled={micDisabled}
                    >
                        {isRecording ? <Square size={22} /> : <Mic size={26} />}
                    </button>
                    <span className={styles.micLabel}>
                        {isRecording ? "tap to stop" : isProcessing ? "processing…" : selected ? "read aloud" : "speak freely"}
                    </span>
                </div>
            </div>
        </div>
    );
}
