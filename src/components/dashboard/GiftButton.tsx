"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Gift } from "lucide-react";
import { useAppStore } from "@/store/app-context";
import { translations } from "@/lib/translations";
import styles from "./GiftButton.module.css";

type RewardEntry = { type: string; amount: number };

type ClaimableEvent = {
    id: string;
    title: string;
    description: string | null;
    rewards: RewardEntry[];
    recurrence: string;
};

export default function GiftButton() {
    const { refreshProfile, nativeLanguage } = useAppStore();
    const t = translations[nativeLanguage] as any;
    const [events, setEvents] = useState<ClaimableEvent[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [claimingId, setClaimingId] = useState<string | null>(null);
    const [claimedId, setClaimedId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function fetchEvents() {
            try {
                const res = await fetch("/api/distributions/available");
                if (res.ok) {
                    const data = await res.json();
                    setEvents(data.events || []);
                }
            } catch (e) {
                console.error("Failed to fetch rewards:", e);
            }
        }
        fetchEvents();
    }, []);

    // Close modal on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const handleClaim = async (eventId: string) => {
        setClaimingId(eventId);
        setError(null);
        try {
            const res = await fetch('/api/distributions/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId }),
            });

            if (res.ok) {
                setClaimedId(eventId);
                setTimeout(() => {
                    setEvents(prev => prev.filter(e => e.id !== eventId));
                    setClaimedId(null);
                    // Close modal if no more events
                    if (events.length <= 1) {
                        setIsOpen(false);
                    }
                }, 1200);
                await refreshProfile();
            } else {
                const data = await res.json().catch(() => ({}));
                setError(data.error || t.errorOccurred || 'エラーが発生しました');
            }
        } catch {
            setError(t.networkError || 'ネットワークエラーが発生しました');
        } finally {
            setClaimingId(null);
        }
    };

    const rewardTypeLabels: Record<string, string> = useMemo(() => ({
        coins: t.rewardCoins || "コイン",
        audio_credits: t.rewardAudio || "音声",
        explorer_credits: t.rewardExplorer || "単語解析",
        correction_credits: t.rewardCorrection || "添削",
        explanation_credits: t.rewardExplanation || "文法解説",
        extraction_credits: t.rewardExtraction || "画像抽出",
    }), [t]);

    const recurrenceLabels: Record<string, string> = useMemo(() => ({
        once: "",
        daily: t.recurrenceDaily || "毎日",
        weekly: t.recurrenceWeekly || "毎週",
        monthly: t.recurrenceMonthly || "毎月",
    }), [t]);

    return (
        <div className={styles.container}>
            <button
                className={styles.giftButton}
                onClick={() => setIsOpen(!isOpen)}
                aria-label={t.receiveGift || "プレゼントを受け取る"}
            >
                <Gift size={20} />
                {events.length > 0 && (
                    <span className={styles.badge}>{events.length > 9 ? "9+" : events.length}</span>
                )}
            </button>

            {isOpen && createPortal(
                <div className={styles.overlay} onClick={() => setIsOpen(false)}>
                    <div className={styles.dropdown} ref={modalRef} onClick={e => e.stopPropagation()}>
                        {error && (
                            <div className={styles.error}>
                                {error}
                                <button onClick={() => setError(null)}>×</button>
                            </div>
                        )}

                        <div className={styles.eventList}>
                            {events.length === 0 && (
                                <div className={styles.emptyState}>
                                    <Gift size={40} className={styles.emptyIcon} />
                                    <p>{t.noGiftsAvailable || "受け取れるプレゼントはありません"}</p>
                                </div>
                            )}
                            {events.map(event => {
                                const isClaiming = claimingId === event.id;
                                const isClaimed = claimedId === event.id;

                                return (
                                    <div
                                        key={event.id}
                                        className={`${styles.eventCard} ${isClaimed ? styles.claimed : ''}`}
                                    >
                                        <div className={styles.eventIcon}>
                                            <Gift size={20} />
                                        </div>
                                        <div className={styles.eventContent}>
                                            <div className={styles.eventTitle}>
                                                {event.title}
                                                {recurrenceLabels[event.recurrence] && (
                                                    <span className={styles.recurrenceBadge}>
                                                        {recurrenceLabels[event.recurrence]}
                                                    </span>
                                                )}
                                            </div>
                                            {event.description && (
                                                <p className={styles.eventDesc}>{event.description}</p>
                                            )}
                                            <div className={styles.rewards}>
                                                {event.rewards.map((r, i) => (
                                                    <span key={i} className={styles.rewardTag}>
                                                        +{r.amount} {rewardTypeLabels[r.type] || r.type}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <button
                                            className={`${styles.claimBtn} ${isClaimed ? styles.claimedBtn : ''}`}
                                            onClick={() => handleClaim(event.id)}
                                            disabled={isClaiming || isClaimed}
                                        >
                                            {isClaimed ? '✓' : isClaiming ? '...' : (t.claim || '受取')}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
