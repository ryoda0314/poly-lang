"use client";

import React, { useEffect, useState } from 'react';
import { useAwarenessStore } from '@/store/awareness-store';
import { useAppStore } from '@/store/app-context';
import { Search, StickyNote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { translations } from "@/lib/translations";

export function AwarenessSidebar() {
    const { user, activeLanguageCode, nativeLanguage } = useAppStore();
    const { memosByText, fetchMemos, isLoading } = useAwarenessStore();
    const [searchTerm, setSearchTerm] = useState("");

    // Debug log to confirm HMR
    console.log("Rendering AwarenessSidebar");

    const t = translations[nativeLanguage] || translations.ja;

    useEffect(() => {
        if (user && activeLanguageCode) {
            fetchMemos(user.id, activeLanguageCode);
        }
    }, [user, activeLanguageCode, fetchMemos]);

    const now = new Date();

    const displayMemos = Object.entries(memosByText).flatMap(([text, memos]) =>
        memos.map(memo => {
            const isDue = memo.next_review_at && new Date(memo.next_review_at) <= now;
            return { ...memo, tokenText: text, isDue };
        })
    )
        .sort((a, b) => {
            // Priority 1: Due Review
            if (a.isDue && !b.isDue) return -1;
            if (!a.isDue && b.isDue) return 1;
            // Priority 2: Creation Date (Newest first)
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        })
        .filter(item =>
            (item.memo?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            item.tokenText.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const CONFIDENCE_COLORS: Record<string, string> = {
        high: "var(--color-success)",
        medium: "var(--color-warning)",
        low: "var(--color-danger)"
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-sub)' }}>
            {/* Header */}
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                    <StickyNote size={16} /> {t.awarenessTitle}
                </h3>
                <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-fg-muted)' }} />
                    <input
                        type="text"
                        placeholder={t.searchMemos}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 10px 8px 32px',
                            borderRadius: '6px',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg)',
                            fontSize: '0.9rem',
                            color: 'var(--color-fg)'
                        }}
                    />
                </div>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                {isLoading ? (
                    <div style={{ textAlign: 'center', color: 'var(--color-fg-muted)', fontSize: '0.8rem' }}>Loading...</div>
                ) : displayMemos.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--color-fg-muted)', fontSize: '0.8rem', padding: '2rem 0' }}>
                        {searchTerm ? t.noMatchingMemos : t.noMemos}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <AnimatePresence>
                            {displayMemos.map((item) => {
                                const confidence = item.confidence || 'low';
                                const color = confidence === 'low'
                                    ? 'var(--color-destructive)'
                                    : confidence === 'medium'
                                        ? 'var(--color-warning)'
                                        : 'var(--color-success)';

                                return (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        style={{
                                            background: 'var(--color-surface)',
                                            borderRadius: '8px',
                                            boxShadow: 'var(--shadow-sm)',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            border: '1px solid var(--color-border)',
                                            borderLeft: `6px solid ${color}`,
                                            position: 'relative'
                                        }}
                                    >
                                        <div style={{ flex: 1, padding: '12px 16px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-fg)' }}>
                                                    {item.tokenText}
                                                </h4>

                                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                    {item.isDue && (
                                                        <span style={{
                                                            fontSize: '0.65rem',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            background: '#38BDF8',
                                                            color: 'white',
                                                            fontWeight: 700,
                                                            textTransform: 'uppercase'
                                                        }}>
                                                            {t.review}
                                                        </span>
                                                    )}
                                                    <span style={{
                                                        fontSize: '0.7rem',
                                                        padding: '2px 8px',
                                                        borderRadius: '4px',
                                                        background: color,
                                                        color: 'white',
                                                        fontWeight: 700,
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {confidence}
                                                    </span>
                                                </div>
                                            </div>

                                            <div style={{ fontSize: '0.9rem', color: 'var(--color-fg)', lineHeight: 1.5, whiteSpace: 'pre-wrap', marginBottom: '12px' }}>
                                                {item.memo || <span style={{ color: 'var(--color-fg-muted)', fontStyle: 'italic' }}>{t.noNote}</span>}
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--color-fg-muted)' }}>
                                                    {new Date(item.created_at || 0).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
