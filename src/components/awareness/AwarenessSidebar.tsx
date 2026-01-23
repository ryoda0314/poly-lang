"use client";

import React, { useEffect, useState } from 'react';
import { useAwarenessStore } from '@/store/awareness-store';
import { useAppStore } from '@/store/app-context';
import { Search, StickyNote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExplorer } from '@/hooks/use-explorer';

import { translations } from "@/lib/translations";

export function AwarenessSidebar() {
    const { user, activeLanguageCode, nativeLanguage } = useAppStore();
    const { memosByText, fetchMemos, isLoading, selectToken } = useAwarenessStore();
    const { openExplorer } = useExplorer();
    const [searchTerm, setSearchTerm] = useState("");
    const [showOnlyReview, setShowOnlyReview] = useState(false);

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
            const isUnverified = memo.status === 'unverified';
            return { ...memo, tokenText: text, isDue, isUnverified };
        })
    )
        .filter(item => {
            // Filter by review mode: only show items due for review OR unverified
            if (showOnlyReview && !item.isDue && !item.isUnverified) return false;
            return true;
        })
        .sort((a, b) => {
            // Priority 1: Due Review
            if (a.isDue && !b.isDue) return -1;
            if (!a.isDue && b.isDue) return 1;
            // Priority 2: Unverified (未確認) first
            if (a.isUnverified && !b.isUnverified) return -1;
            if (!a.isUnverified && b.isUnverified) return 1;
            // Priority 3: Creation Date (Newest first)
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
            <div style={{
                padding: '1rem',
                borderBottom: '1px solid var(--color-border)',
                flexShrink: 0, // Prevent header from shrinking
                zIndex: 10,
                background: 'var(--color-bg-sub)' // Ensure background covers scrolling content
            }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
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
                    <button
                        onClick={() => setShowOnlyReview(!showOnlyReview)}
                        style={{
                            background: showOnlyReview ? 'var(--color-accent)' : 'var(--color-bg)',
                            border: '1px solid var(--color-border)',
                            color: showOnlyReview ? '#fff' : 'var(--color-fg-muted)',
                            cursor: 'pointer',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s'
                        }}
                        title="復習・未確認のみ表示"
                    >
                        復習・未確認
                    </button>
                </div>
            </div>

            {/* List */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem',
                minHeight: 0 // Crucial for nested flex scrolling
            }}>
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
                                        onClick={() => {
                                            if (item.phrase_id && item.token_index !== undefined) {
                                                selectToken(item.phrase_id, item.token_index, item.token_index, item.tokenText, 'stats');
                                                openExplorer(item.tokenText);
                                            }
                                        }}
                                        style={{
                                            background: 'var(--color-surface)',
                                            borderRadius: '8px',
                                            boxShadow: 'var(--shadow-sm)',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            border: '1px solid var(--color-border)',
                                            borderLeft: `6px solid ${color}`,
                                            position: 'relative',
                                            cursor: 'pointer'
                                        }}
                                        whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
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
                                                    {item.isUnverified && (
                                                        <span style={{
                                                            fontSize: '0.65rem',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            background: 'var(--color-fg-muted)',
                                                            color: 'white',
                                                            fontWeight: 700
                                                        }}>
                                                            未確認
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
