"use client";

import React, { useEffect, useState, useRef } from "react";
import { Gift, X } from "lucide-react";
import { useAppStore } from "@/store/app-context";
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
    const { refreshProfile } = useAppStore();
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
                setError(data.error || 'エラーが発生しました');
            }
        } catch {
            setError('ネットワークエラーが発生しました');
        } finally {
            setClaimingId(null);
        }
    };

    const rewardTypeLabels: Record<string, string> = {
        coins: "コイン",
        audio_credits: "音声",
        explorer_credits: "単語解析",
        correction_credits: "添削",
        explanation_credits: "文法解説",
        extraction_credits: "画像抽出",
    };

    const recurrenceLabels: Record<string, string> = {
        once: "",
        daily: "毎日",
        weekly: "毎週",
        monthly: "毎月",
    };

    return (
        <div className={styles.container}>
            <button
                className={styles.giftButton}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="プレゼントを受け取る"
            >
                <Gift size={20} />
                {events.length > 0 && (
                    <span className={styles.badge}>{events.length > 9 ? "9+" : events.length}</span>
                )}
            </button>

            {isOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal} ref={modalRef}>
                        <div className={styles.modalHeader}>
                            <h3>プレゼント</h3>
                            <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

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
                                    <p>受け取れるプレゼントはありません</p>
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
                                            {isClaimed ? '✓' : isClaiming ? '...' : '受取'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
