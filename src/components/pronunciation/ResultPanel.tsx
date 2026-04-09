"use client";

import { motion } from 'framer-motion';
import { RefreshCcw } from 'lucide-react';
import type { EvaluationResult } from '@/types/pronunciation';
import { ScoreGauge } from './ScoreGauge';
import { DiffHighlight } from './DiffHighlight';

interface ResultPanelProps {
    result: EvaluationResult;
    onRetry: () => void;
}

export function ResultPanel({ result, onRetry }: ResultPanelProps) {
    return (
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%', overflowY: 'auto' }}>

            {/* Score Logic */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                style={{ display: 'flex', justifyContent: 'center' }}
            >
                <ScoreGauge score={result.score} />
            </motion.div>

            {/* Differences */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                style={{ background: 'var(--color-bg-sub)', padding: '1.5rem', borderRadius: '12px' }}
            >
                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-fg-muted)', marginBottom: '1rem', letterSpacing: '0.1em' }}>
                    Analysis
                </h4>
                <DiffHighlight
                    expectedText={result.expectedText}
                    asrText={result.asrText}
                    diffs={result.diffs}
                />
            </motion.div>

            {/* Feedback */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-sm)'
                }}
            >
                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-accent)', marginBottom: '0.5rem', letterSpacing: '0.1em', fontWeight: 900 }}>
                    Feedback
                </h4>
                <p style={{ lineHeight: 1.6, color: 'var(--color-fg)', fontSize: '1.1rem', fontFamily: 'var(--font-display)' }}>
                    {result.feedback}
                </p>
            </motion.div>

            {/* Actions */}
            <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                <button
                    onClick={onRetry}
                    style={{
                        padding: '12px 24px',
                        borderRadius: '999px',
                        background: 'var(--color-bg-panel)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-fg)',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        fontWeight: 600
                    }}
                >
                    <RefreshCcw size={16} />
                    Try Again
                </button>
            </div>
        </div>
    );
}
