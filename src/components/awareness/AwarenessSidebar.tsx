"use client";

import React, { useEffect, useState } from 'react';
import { useAwarenessStore } from '@/store/awareness-store';
import { useAppStore } from '@/store/app-context';
import { Search, StickyNote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AwarenessSidebar() {
    const { user } = useAppStore();
    const { memosByText, fetchMemos, isLoading } = useAwarenessStore();
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (user) {
            fetchMemos(user.id);
        }
    }, [user, fetchMemos]);

    const displayMemos = Object.entries(memosByText).flatMap(([text, memos]) =>
        memos.map(memo => ({ ...memo, tokenText: text }))
    )
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
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
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-sub)', borderRight: '1px solid var(--color-border)' }}>
            {/* Header */}
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                    <StickyNote size={16} /> Awareness Memos
                </h3>
                <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-fg-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search memos..."
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
                        {searchTerm ? "No matching memos found." : "No memos yet."}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <AnimatePresence>
                            {displayMemos.map((item) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    style={{
                                        background: 'var(--color-surface)',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--color-border)',
                                        boxShadow: 'var(--shadow-sm)'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-accent)' }}>
                                            {item.tokenText}
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-fg-muted)' }}>
                                            {new Date(item.created_at || 0).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-fg)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                                        {item.memo}
                                    </div>
                                    <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
                                        {item.confidence && (
                                            <span style={{
                                                fontSize: '0.65rem',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                background: `${CONFIDENCE_COLORS[item.confidence] || 'gray'}20`,
                                                color: CONFIDENCE_COLORS[item.confidence] || 'gray',
                                                border: `1px solid ${CONFIDENCE_COLORS[item.confidence] || 'gray'}40`
                                            }}>
                                                {item.confidence.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
