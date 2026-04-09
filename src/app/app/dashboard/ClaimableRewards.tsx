"use client";

import React, { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-context";
import { useHistoryStore } from "@/store/history-store";
import { TRACKING_EVENTS } from "@/lib/tracking_constants";
import { Gift } from "lucide-react";

type RewardEntry = { type: string; amount: number };

type ClaimableEvent = {
    id: string;
    title: string;
    description: string | null;
    rewards: RewardEntry[];
    recurrence: string;
};

export default function ClaimableRewards() {
    const { refreshProfile } = useAppStore();
    const { logEvent } = useHistoryStore();
    const [events, setEvents] = useState<ClaimableEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [claimingId, setClaimingId] = useState<string | null>(null);
    const [claimedId, setClaimedId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/distributions/available')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.events) setEvents(data.events);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

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
                // Remove the claimed event after a brief animation
                setTimeout(() => {
                    setEvents(prev => prev.filter(e => e.id !== eventId));
                    setClaimedId(null);
                }, 1200);
                // Refresh profile to update coins/credits
                await refreshProfile();
                // Log event
                const claimedEvent = events.find(e => e.id === eventId);
                logEvent(TRACKING_EVENTS.REWARD_CLAIMED, 0, {
                    eventId,
                    title: claimedEvent?.title,
                    rewards: claimedEvent?.rewards,
                });
            } else {
                const data = await res.json().catch(() => ({}));
                setError(data.error || `エラーが発生しました (${res.status})`);
            }
        } catch (e) {
            setError('ネットワークエラーが発生しました');
            console.error('Claim error:', e);
        } finally {
            setClaimingId(null);
        }
    };

    if (loading || events.length === 0) return null;

    const recurrenceLabels: Record<string, string> = {
        once: "",
        daily: "Daily",
        weekly: "Weekly",
        monthly: "Monthly",
    };

    const rewardTypeLabels: Record<string, string> = {
        coins: "Coins",
        audio_credits: "Audio",
        explorer_credits: "Explorer",
        correction_credits: "Correction",
        explanation_credits: "Explanation",
        extraction_credits: "Extraction",
    };

    return (
        <div style={{
            marginBottom: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
        }}>
            {error && (
                <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    color: '#dc2626',
                    fontSize: '0.9rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                    <span>{error}</span>
                    <button
                        onClick={() => setError(null)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#dc2626',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                            padding: '0 4px',
                        }}
                    >
                        ×
                    </button>
                </div>
            )}
            {events.map(event => {
                const isClaiming = claimingId === event.id;
                const isClaimed = claimedId === event.id;

                return (
                    <div
                        key={event.id}
                        style={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                            borderRadius: '16px',
                            padding: '20px',
                            color: 'white',
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'all 0.4s ease',
                            opacity: isClaimed ? 0 : 1,
                            transform: isClaimed ? 'scale(0.95) translateY(-10px)' : 'none',
                        }}
                    >
                        {/* Background decoration */}
                        <div style={{
                            position: 'absolute',
                            top: '-20px', right: '-20px',
                            width: '120px', height: '120px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.1)',
                            pointerEvents: 'none',
                        }} />

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                            <div style={{
                                width: '44px', height: '44px',
                                borderRadius: '12px',
                                background: 'rgba(255,255,255,0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <Gift size={22} />
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <h3 style={{
                                        margin: 0, fontSize: '1.05rem', fontWeight: 700,
                                        fontFamily: 'var(--font-display)',
                                    }}>
                                        {event.title}
                                    </h3>
                                    {recurrenceLabels[event.recurrence] && (
                                        <span style={{
                                            fontSize: '0.7rem', fontWeight: 600,
                                            background: 'rgba(255,255,255,0.2)',
                                            padding: '2px 8px', borderRadius: '6px',
                                        }}>
                                            {recurrenceLabels[event.recurrence]}
                                        </span>
                                    )}
                                </div>

                                {event.description && (
                                    <p style={{
                                        margin: '0 0 10px', fontSize: '0.85rem',
                                        opacity: 0.85, lineHeight: 1.4,
                                    }}>
                                        {event.description}
                                    </p>
                                )}

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                                    {event.rewards.map((r, i) => (
                                        <span key={i} style={{
                                            background: 'rgba(255,255,255,0.2)',
                                            padding: '4px 10px',
                                            borderRadius: '8px',
                                            fontSize: '0.82rem',
                                            fontWeight: 600,
                                        }}>
                                            +{r.amount} {rewardTypeLabels[r.type] || r.type}
                                        </span>
                                    ))}
                                </div>

                                <button
                                    onClick={() => handleClaim(event.id)}
                                    disabled={isClaiming || isClaimed}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: isClaimed ? '#22c55e' : 'rgba(255,255,255,0.95)',
                                        color: isClaimed ? 'white' : '#6366f1',
                                        fontWeight: 700,
                                        fontSize: '0.95rem',
                                        cursor: isClaiming || isClaimed ? 'default' : 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontFamily: 'var(--font-display)',
                                    }}
                                >
                                    {isClaimed ? '✓ Claimed!' : isClaiming ? '...' : '受け取る'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
