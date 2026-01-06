"use client";

import React, { useEffect, useState } from "react";
import { Clock, Bookmark, Volume2, Eye, EyeOff } from "lucide-react";
import { useHistoryStore } from "@/store/history-store";
import { useAppStore } from "@/store/app-context";

// ------------------------------------------------------------------
// Date Helper
// ------------------------------------------------------------------
function getDateLabel(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    if (isToday) return "Today";

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();
    if (isYesterday) return "Yesterday";

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// ------------------------------------------------------------------
// Interactive History Card
// ------------------------------------------------------------------
function HistoryCard({ event }: { event: any }) {
    const meta = event.meta || {};
    const [isRevealed, setIsRevealed] = useState(false);

    const handlePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if ('speechSynthesis' in window) {
            const u = new SpeechSynthesisUtterance(meta.text);
            u.lang = 'en'; // Assuming English for now, could be passed from event
            window.speechSynthesis.speak(u);
        }
    };

    const toggleReveal = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsRevealed(!isRevealed);
    };

    return (
        <div
            onClick={toggleReveal}
            style={{
                background: "var(--color-surface)",
                borderRadius: "16px",
                border: "1px solid var(--color-border)",
                padding: "20px",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
                position: "relative",
                overflow: "hidden"
            }}
            className="hover:shadow-md active:scale-[0.99] transition-all"
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <span style={{
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    color: "var(--color-fg-muted)",
                    background: "var(--color-bg-sub)",
                    padding: "4px 8px",
                    borderRadius: "4px"
                }}>
                    Saved Phrase
                </span>
                <button
                    onClick={handlePlay}
                    style={{
                        background: "var(--color-accent)",
                        border: "none",
                        borderRadius: "50%",
                        width: "32px",
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        cursor: "pointer"
                    }}
                >
                    <Volume2 size={16} />
                </button>
            </div>

            <div style={{
                fontSize: "1.4rem",
                fontWeight: 600,
                color: "var(--color-fg)",
                marginBottom: "16px",
                lineHeight: 1.3
            }}>
                {meta.text}
            </div>

            <div style={{
                borderTop: "1px dashed var(--color-border)",
                paddingTop: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: isRevealed ? "var(--color-fg-muted)" : "transparent",
                transition: "color 0.3s"
            }}>
                <span style={{
                    fontSize: "1rem",
                    filter: isRevealed ? "none" : "blur(4px)",
                    transition: "filter 0.3s",
                    userSelect: isRevealed ? "text" : "none"
                }}>
                    {meta.translation || "No translation"}
                </span>
                <div style={{ color: "var(--color-fg-muted)" }}>
                    {isRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                </div>
            </div>
        </div>
    );
}

// ------------------------------------------------------------------
// Main Page
// ------------------------------------------------------------------
export default function HistoryPage() {
    const { events, isLoading, fetchHistory } = useHistoryStore();
    const { user, activeLanguageCode } = useAppStore();

    useEffect(() => {
        if (user) {
            fetchHistory(user.id, activeLanguageCode);
        }
    }, [user, activeLanguageCode, fetchHistory]);

    if (isLoading) {
        return <div style={{ padding: "40px", textAlign: "center", color: "var(--color-fg-muted)" }}>Loading history...</div>;
    }

    const savedPhrases = events.filter(e => e.event_type === 'saved_phrase');

    // Group by Date
    const groupedGroups: Record<string, typeof savedPhrases> = {};
    savedPhrases.forEach(e => {
        const label = getDateLabel(e.occurred_at);
        if (!groupedGroups[label]) groupedGroups[label] = [];
        groupedGroups[label].push(e);
    });

    const sortedLabels = Object.keys(groupedGroups).sort((a, b) => {
        if (a === "Today") return -1;
        if (b === "Today") return 1;
        if (a === "Yesterday") return -1;
        if (b === "Yesterday") return 1;
        return 0; // Keep roughly in order of discovery if they key insertion order holds, or parse dates properly.
        // For simplicity, we are relying on fetch order (descending) so keys should be created in order.
    });

    return (
        <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto", paddingBottom: "100px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
                <Clock size={32} color="var(--color-primary)" />
                <h1 style={{ fontSize: "2rem", margin: 0 }}>Review History</h1>
            </div>

            {savedPhrases.length === 0 ? (
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "40vh",
                    color: "var(--color-fg-muted)",
                    background: "var(--color-surface)",
                    borderRadius: "16px",
                    border: "1px dashed var(--color-border)"
                }}>
                    <Bookmark size={48} style={{ marginBottom: "var(--space-4)", opacity: 0.5 }} />
                    <h2 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>Your collection is empty</h2>
                    <p>Save better phrased sentences from corrections to see them here.</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                    {sortedLabels.map(label => (
                        <div key={label}>
                            <h3 style={{
                                fontSize: "1rem",
                                color: "var(--color-fg-muted)",
                                marginBottom: "16px",
                                borderLeft: "4px solid var(--color-primary)",
                                paddingLeft: "12px",
                                lineHeight: 1
                            }}>
                                {label}
                            </h3>
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                                gap: "16px"
                            }}>
                                {groupedGroups[label].map(event => (
                                    <HistoryCard key={event.id} event={event} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
