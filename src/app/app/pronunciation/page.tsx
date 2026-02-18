"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Search, ChevronLeft, X, Zap, Folder } from "lucide-react";
import { sentences } from "@/data/pronunciation-sentences";
import { useAzurePronunciation } from "@/hooks/use-azure-pronunciation";
import { RecorderPanel } from "@/components/pronunciation/RecorderPanel";
import { SentenceResult } from "@/components/pronunciation/SentenceResult";
import { AzureResultPanel } from "@/components/pronunciation/AzureResultPanel";
import { WeakPhonemesPanel } from "@/components/pronunciation/WeakPhonemesPanel";
import { PhonemeEncyclopedia } from "@/components/pronunciation/PhonemeEncyclopedia";
import { PronunciationHome } from "@/components/pronunciation/PronunciationHome";
import { FreeSpeechPanel } from "@/components/pronunciation/FreeSpeechPanel";
import { LanguageRequestPanel } from "@/components/pronunciation/LanguageRequestPanel";
import { createClient } from "@/lib/supa-client";
import { useAppStore } from "@/store/app-context";
import type { PracticeSentence } from "@/types/pronunciation";
import styles from "./page.module.css";

type ListSource = "preset" | "saved" | "folder";

const DIFFICULTY_COLORS: Record<string, string> = {
    easy: "#10b981",
    medium: "#f59e0b",
    hard: "#ef4444",
};

function getScoreColor(score: number): string {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#b45309";
    return "#ef4444";
}

function MasteryDots({ attempts, bestScore }: { attempts: number; bestScore: number }) {
    const filled = attempts >= 5 ? 4 : attempts >= 3 ? 3 : attempts >= 1 ? Math.min(attempts, 2) : 0;
    const isGold = bestScore >= 90;
    const color = isGold ? "#f59e0b" : "var(--color-fg-muted)";
    return (
        <div className={styles.masteryDots}>
            {[0, 1, 2, 3].map(i => (
                <span
                    key={i}
                    className={styles.masteryDot}
                    style={{
                        background: i < filled ? color : "transparent",
                        borderColor: i < filled ? color : "var(--color-border)",
                    }}
                />
            ))}
        </div>
    );
}

export default function PronunciationPage() {
    const { activeLanguageCode } = useAppStore();
    if (activeLanguageCode !== "en") return <LanguageRequestPanel />;
    return <PronunciationContent />;
}

function PronunciationContent() {
    const { user, activeLanguageCode } = useAppStore();

    const [viewMode, setViewMode] = useState<"home" | "practice" | "free" | "encyclopedia">("home");
    const [selected, setSelected] = useState<PracticeSentence | null>(null);
    const [search, setSearch] = useState("");
    const [difficulty, setDifficulty] = useState<string | null>(null);
    const [phonemeFilter, setPhonemeFilter] = useState<string | null>(null);
    const [mobileView, setMobileView] = useState<"list" | "recorder" | "result">("list");

    // Source tabs
    const [source, setSource] = useState<ListSource>("preset");
    const [selectedFolder, setSelectedFolder] = useState<{ id: string; name: string } | null>(null);
    const [savedPhrases, setSavedPhrases] = useState<PracticeSentence[]>([]);
    const [folders, setFolders] = useState<{ id: string; name: string; color: string | null; icon: string | null }[]>([]);
    const [folderPhrases, setFolderPhrases] = useState<PracticeSentence[]>([]);
    const [loadingSaved, setLoadingSaved] = useState(false);

    const pronunciation = useAzurePronunciation();
    const recordingState = pronunciation.state;
    const [refreshWeakKey, setRefreshWeakKey] = useState(0);

    const [sentenceScores, setSentenceScores] = useState<Record<string, { bestScore: number; attempts: number }>>({});
    const [weakPhonemes, setWeakPhonemes] = useState<string[]>([]);

    // Fetch scores and weak phonemes
    useEffect(() => {
        fetch("/api/pronunciation/sentence-scores")
            .then(r => r.json())
            .then(data => setSentenceScores(data.scores ?? {}))
            .catch(() => {});

        fetch("/api/pronunciation/weak-phonemes")
            .then(r => r.json())
            .then(data => {
                const weak = (data.phonemes ?? [])
                    .filter((p: { avgScore: number }) => p.avgScore < 70)
                    .map((p: { phoneme: string }) => p.phoneme);
                setWeakPhonemes(weak);
            })
            .catch(() => {});
    }, []);

    // Fetch saved phrases when tab selected
    useEffect(() => {
        if (source !== "saved" || !user) return;
        setLoadingSaved(true);
        const supabase = createClient();
        (async () => {
            try {
                const { data } = await supabase
                    .from("learning_events")
                    .select("*")
                    .eq("user_id", user.id)
                    .eq("language_code", activeLanguageCode)
                    .eq("event_type", "saved_phrase")
                    .order("occurred_at", { ascending: false });
                const phrases = (data || [])
                    .map(e => ({
                        id: e.id,
                        text: (e.meta as Record<string, string>)?.text ?? "",
                        difficulty: "easy" as const,
                        category: "saved",
                        source: "saved" as const,
                    }))
                    .filter(p => p.text);
                setSavedPhrases(phrases);
            } finally {
                setLoadingSaved(false);
            }
        })();
    }, [source, user, activeLanguageCode]);

    // Fetch folders when tab selected
    useEffect(() => {
        if (source !== "folder" || !user) return;
        const supabase = createClient();
        (async () => {
            const { data } = await supabase
                .from("phrase_collections")
                .select("*")
                .eq("user_id", user.id)
                .eq("language_code", activeLanguageCode)
                .order("position", { ascending: true });
            setFolders((data || []).map(c => ({
                id: c.id,
                name: c.name,
                color: c.color,
                icon: c.icon,
            })));
        })();
    }, [source, user, activeLanguageCode]);

    // Fetch phrases inside selected folder
    useEffect(() => {
        if (!selectedFolder || !user) return;
        const supabase = createClient();
        (async () => {
            const { data } = await supabase
                .from("learning_events")
                .select("*")
                .eq("user_id", user.id)
                .eq("collection_id", selectedFolder.id)
                .eq("event_type", "saved_phrase")
                .order("occurred_at", { ascending: false });
            const phrases = (data || [])
                .map(e => ({
                    id: e.id,
                    text: (e.meta as Record<string, string>)?.text ?? "",
                    difficulty: "easy" as const,
                    category: "folder",
                    source: "folder" as const,
                }))
                .filter(p => p.text);
            setFolderPhrases(phrases);
        })();
    }, [selectedFolder, user]);

    // Keyboard shortcut
    useEffect(() => {
        if (viewMode !== "practice") return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.code === "Space" && e.target === document.body && selected) {
                e.preventDefault();
                if (recordingState === "recording") {
                    pronunciation.stopEvaluation();
                } else if (recordingState === "idle" || recordingState === "done" || recordingState === "error") {
                    pronunciation.startEvaluation(selected.id, selected.text);
                }
            }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [viewMode, recordingState, selected, pronunciation]);

    // Active list based on source
    const activeList = useMemo<PracticeSentence[]>(() => {
        if (source === "saved") return savedPhrases;
        if (source === "folder") return folderPhrases;
        return sentences;
    }, [source, savedPhrases, folderPhrases]);

    // Filter sentences
    const filtered = useMemo(() => activeList.filter((s) => {
        if (source === "preset" && difficulty && s.difficulty !== difficulty) return false;
        if (search && !s.text.toLowerCase().includes(search.toLowerCase())) return false;
        if (phonemeFilter && !(s.phonemes ?? []).includes(phonemeFilter)) return false;
        return true;
    }), [activeList, source, difficulty, search, phonemeFilter]);

    // Recommended (preset only)
    const recommended = useMemo(() => {
        if (source !== "preset" || weakPhonemes.length === 0) return [];
        return sentences
            .filter(s => {
                const sp = s.phonemes ?? [];
                const hasWeak = sp.some(p => weakPhonemes.includes(p));
                const score = sentenceScores[s.id];
                const notMastered = !score || score.bestScore < 85;
                return hasWeak && notMastered;
            })
            .slice(0, 3);
    }, [source, weakPhonemes, sentenceScores]);

    const currentIndex = useMemo(() => {
        if (!selected) return -1;
        return filtered.findIndex(s => s.id === selected.id);
    }, [selected, filtered]);

    const handleSelect = useCallback((s: PracticeSentence) => {
        setSelected(s);
        pronunciation.reset();
        setMobileView("recorder");
    }, [pronunciation]);

    const handleRetry = useCallback(() => {
        pronunciation.setState("idle");
        setMobileView("recorder");
    }, [pronunciation]);

    const handleStartRecording = useCallback(() => {
        if (selected) {
            pronunciation.startEvaluation(selected.id, selected.text);
        }
    }, [selected, pronunciation]);

    const handleStopRecording = useCallback(() => {
        pronunciation.stopEvaluation();
    }, [pronunciation]);

    const handleNext = useCallback(() => {
        const nextIdx = currentIndex + 1;
        if (nextIdx < filtered.length) {
            handleSelect(filtered[nextIdx]);
        }
    }, [currentIndex, filtered, handleSelect]);

    const handlePracticePhoneme = useCallback((symbol: string) => {
        setPhonemeFilter(symbol);
        setSource("preset");
        setViewMode("practice");
        setMobileView("list");
    }, []);

    const handleSourceChange = useCallback((s: ListSource) => {
        setSource(s);
        setSelectedFolder(null);
        setSelected(null);
        pronunciation.reset();
    }, [pronunciation]);

    useEffect(() => {
        if (pronunciation.state === "done" && pronunciation.currentResult) {
            setMobileView("result");
            setRefreshWeakKey(k => k + 1);

            if (selected) {
                const newScore = Math.round(pronunciation.currentResult.scores.overall);
                setSentenceScores(prev => {
                    const existing = prev[selected.id];
                    return {
                        ...prev,
                        [selected.id]: {
                            bestScore: Math.max(existing?.bestScore ?? 0, newScore),
                            attempts: (existing?.attempts ?? 0) + 1,
                        },
                    };
                });
            }
        }
    }, [pronunciation.state, pronunciation.currentResult, selected]);

    const isDone = pronunciation.state === "done" && pronunciation.currentResult;

    return (
        <div className={styles.container}>
            {viewMode === "home" ? (
                <PronunciationHome
                    onStartPractice={() => setViewMode("practice")}
                    onOpenEncyclopedia={() => setViewMode("encyclopedia")}
                    onFreeSpeech={() => setViewMode("free")}
                    onPracticePhoneme={handlePracticePhoneme}
                />
            ) : viewMode === "free" ? (
                <FreeSpeechPanel onBack={() => setViewMode("home")} />
            ) : viewMode === "practice" ? (
                <div className={styles.practiceGrid}>
                    {/* === Sentence List === */}
                    <aside className={`${styles.listPanel} ${mobileView === "list" ? styles.mobileShow : styles.mobileHide}`}>
                        <div className={styles.listHeader}>
                            <div className={styles.listTitleRow}>
                                <button className={styles.backToHome} onClick={() => setViewMode("home")}>
                                    <ChevronLeft size={16} />
                                </button>
                                <h2 className={styles.listTitle}>
                                    {source === "folder" && selectedFolder
                                        ? selectedFolder.name
                                        : "文章一覧"}
                                </h2>
                            </div>

                            {/* Source tabs */}
                            <div className={styles.sourceTabs}>
                                {(["preset", "saved", "folder"] as ListSource[]).map(s => {
                                    const labels: Record<ListSource, string> = {
                                        preset: "例文",
                                        saved: "マイフレーズ",
                                        folder: "フォルダ",
                                    };
                                    return (
                                        <button
                                            key={s}
                                            className={`${styles.sourceTab} ${source === s ? styles.sourceTabActive : ""}`}
                                            onClick={() => handleSourceChange(s)}
                                        >
                                            {labels[s]}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Folder back button */}
                            {source === "folder" && selectedFolder && (
                                <button
                                    className={styles.folderBack}
                                    onClick={() => setSelectedFolder(null)}
                                >
                                    <ChevronLeft size={13} />
                                    フォルダ一覧
                                </button>
                            )}

                            {/* Phoneme filter indicator (preset only) */}
                            {source === "preset" && phonemeFilter && (
                                <div className={styles.phonemeFilterBar}>
                                    <span className={styles.phonemeFilterLabel}>
                                        フィルター: /{phonemeFilter}/
                                    </span>
                                    <button
                                        className={styles.phonemeFilterClear}
                                        onClick={() => setPhonemeFilter(null)}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}

                            <div className={styles.searchBox}>
                                <Search size={14} />
                                <input
                                    type="text"
                                    placeholder="検索..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className={styles.searchInput}
                                />
                            </div>

                            {/* Difficulty filter (preset only) */}
                            {source === "preset" && (
                                <div className={styles.filterRow}>
                                    <button
                                        className={`${styles.filterBtn} ${!difficulty ? styles.filterActive : ""}`}
                                        onClick={() => setDifficulty(null)}
                                    >
                                        全て
                                    </button>
                                    {(["easy", "medium", "hard"] as const).map((d) => {
                                        const labels: Record<string, string> = { easy: "簡単", medium: "普通", hard: "難しい" };
                                        return (
                                            <button
                                                key={d}
                                                className={`${styles.filterBtn} ${difficulty === d ? styles.filterActive : ""}`}
                                                onClick={() => setDifficulty(difficulty === d ? null : d)}
                                                style={difficulty === d ? { background: DIFFICULTY_COLORS[d], color: "#fff" } : undefined}
                                            >
                                                {labels[d]}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Folder grid (when folder tab and no folder selected) */}
                        {source === "folder" && !selectedFolder ? (
                            <div className={styles.folderGrid}>
                                {folders.length === 0 ? (
                                    <div className={styles.emptyState}>
                                        <p>フォルダがありません</p>
                                    </div>
                                ) : (
                                    folders.map(f => (
                                        <button
                                            key={f.id}
                                            className={styles.folderCard}
                                            onClick={() => setSelectedFolder(f)}
                                        >
                                            <span className={styles.folderIcon}>
                                                {f.icon ?? <Folder size={20} />}
                                            </span>
                                            <span className={styles.folderName}>{f.name}</span>
                                        </button>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className={styles.sentenceList}>
                                {/* Loading */}
                                {loadingSaved && (
                                    <div className={styles.emptyState}>
                                        <p>読み込み中...</p>
                                    </div>
                                )}

                                {/* Recommended (preset only) */}
                                {recommended.length > 0 && !phonemeFilter && !search && !difficulty && (
                                    <div className={styles.recommendedSection}>
                                        <div className={styles.recommendedHeader}>
                                            <Zap size={13} />
                                            <span>おすすめ</span>
                                        </div>
                                        {recommended.map(s => (
                                            <button
                                                key={`rec-${s.id}`}
                                                className={`${styles.sentenceCard} ${styles.recommendedCard} ${selected?.id === s.id ? styles.sentenceActive : ""}`}
                                                onClick={() => handleSelect(s)}
                                            >
                                                <span className={styles.sentenceText}>{s.text}</span>
                                                {s.phonemes && s.phonemes.length > 0 && (
                                                    <div className={styles.phonemeHints}>
                                                        {s.phonemes.map((p) => (
                                                            <span
                                                                key={p}
                                                                className={`${styles.phonemeHint} ${weakPhonemes.includes(p) ? styles.phonemeHintWeak : ""}`}
                                                            >
                                                                /{p}/
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Empty state */}
                                {!loadingSaved && filtered.length === 0 && (
                                    <div className={styles.emptyState}>
                                        {phonemeFilter ? (
                                            <>
                                                <p>/{phonemeFilter}/ の文章なし</p>
                                                <button className={styles.filterBtn} onClick={() => setPhonemeFilter(null)}>
                                                    フィルター解除
                                                </button>
                                            </>
                                        ) : source === "saved" ? (
                                            <p>保存済みフレーズがありません</p>
                                        ) : source === "folder" ? (
                                            <p>このフォルダにフレーズがありません</p>
                                        ) : (
                                            <p>文章が見つかりません</p>
                                        )}
                                    </div>
                                )}

                                {/* Sentence cards */}
                                {filtered.map((s) => {
                                    const scoreData = sentenceScores[s.id];
                                    return (
                                        <button
                                            key={s.id}
                                            className={`${styles.sentenceCard} ${selected?.id === s.id ? styles.sentenceActive : ""}`}
                                            onClick={() => handleSelect(s)}
                                        >
                                            <div className={styles.sentenceCardTop}>
                                                <span className={styles.sentenceText}>{s.text}</span>
                                                {scoreData && (
                                                    <span
                                                        className={styles.bestScore}
                                                        style={{ color: getScoreColor(scoreData.bestScore) }}
                                                    >
                                                        {Math.round(scoreData.bestScore)}
                                                    </span>
                                                )}
                                            </div>
                                            {source === "preset" && (
                                                <div className={styles.sentenceMeta}>
                                                    <span
                                                        className={styles.diffBadge}
                                                        style={{ color: DIFFICULTY_COLORS[s.difficulty], background: `${DIFFICULTY_COLORS[s.difficulty]}15` }}
                                                    >
                                                        {s.difficulty}
                                                    </span>
                                                    <span className={styles.categoryBadge}>{s.category}</span>
                                                    {scoreData && (
                                                        <MasteryDots attempts={scoreData.attempts} bestScore={scoreData.bestScore} />
                                                    )}
                                                </div>
                                            )}
                                            {source !== "preset" && scoreData && (
                                                <div className={styles.sentenceMeta}>
                                                    <MasteryDots attempts={scoreData.attempts} bestScore={scoreData.bestScore} />
                                                </div>
                                            )}
                                            {s.phonemes && s.phonemes.length > 0 && (
                                                <div className={styles.phonemeHints}>
                                                    {s.phonemes.map((p) => (
                                                        <span key={p} className={styles.phonemeHint}>/{p}/</span>
                                                    ))}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </aside>

                    {/* === Center: Recorder or Result === */}
                    <main className={`${styles.recorderPanel} ${mobileView === "recorder" ? styles.mobileShow : styles.mobileHide}`}>
                        <button className={styles.mobileBack} onClick={() => setMobileView("list")}>
                            <ChevronLeft size={18} /> 戻る
                        </button>

                        {selected && filtered.length > 1 && (
                            <div className={styles.progressBar}>
                                <span className={styles.progressText}>
                                    {currentIndex + 1} / {filtered.length}
                                </span>
                                <div className={styles.progressTrack}>
                                    <div
                                        className={styles.progressFill}
                                        style={{ width: `${((currentIndex + 1) / filtered.length) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {isDone ? (
                            <SentenceResult
                                result={pronunciation.currentResult!}
                                previousScore={selected ? sentenceScores[selected.id]?.bestScore : undefined}
                                onRetry={handleRetry}
                                onNext={handleNext}
                                hasNext={currentIndex < filtered.length - 1}
                            />
                        ) : selected ? (
                            <RecorderPanel
                                text={selected.text}
                                recordingState={recordingState}
                                onStartRecording={handleStartRecording}
                                onStopRecording={handleStopRecording}
                                error={pronunciation.error}
                                audioLevel={pronunciation.audioLevel}
                            />
                        ) : (
                            <div className={styles.emptyState}>
                                <p>文章を選んで練習を開始</p>
                            </div>
                        )}

                        {selected && !isDone && (
                            <p className={styles.hint}>
                                <kbd>Space</kbd> で開始 / 停止
                            </p>
                        )}
                    </main>

                    {/* === Right: Results === */}
                    <aside className={`${styles.resultPanel} ${mobileView === "result" ? styles.mobileShow : styles.mobileHide}`}>
                        <button className={styles.mobileBack} onClick={() => setMobileView("recorder")}>
                            <ChevronLeft size={18} /> 戻る
                        </button>

                        {pronunciation.currentResult ? (
                            <AzureResultPanel
                                result={pronunciation.currentResult}
                                onRetry={handleRetry}
                            />
                        ) : (
                            <WeakPhonemesPanel key={refreshWeakKey} />
                        )}
                    </aside>
                </div>
            ) : (
                <div className={styles.encyclopediaView}>
                    <div className={styles.encyclopediaBack}>
                        <button className={styles.backToHome} onClick={() => setViewMode("home")}>
                            <ChevronLeft size={16} />
                        </button>
                    </div>
                    <PhonemeEncyclopedia onPracticePhoneme={handlePracticePhoneme} />
                </div>
            )}
        </div>
    );
}
