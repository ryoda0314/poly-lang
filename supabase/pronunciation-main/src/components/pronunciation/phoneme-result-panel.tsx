'use client';

import { motion } from 'framer-motion';
import type { PhonemeEvaluationResult } from '@/types/pronunciation';
import { ScoreGauge } from './score-gauge';

interface PhonemeResultPanelProps {
    result: PhonemeEvaluationResult | null;
    onRetry: () => void;
}

export function PhonemeResultPanel({ result, onRetry }: PhonemeResultPanelProps) {
    if (!result) {
        return (
            <div className="h-full flex items-center justify-center p-6">
                <div className="text-center">
                    <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                        Phoneme results will appear here
                    </p>
                </div>
            </div>
        );
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-400 bg-emerald-500/20';
        if (score >= 60) return 'text-amber-400 bg-amber-500/20';
        return 'text-red-400 bg-red-500/20';
    };

    const getErrorTypeStyle = (errorType: string) => {
        switch (errorType) {
            case 'Omission':
                return 'bg-red-500/20 text-red-400 border-red-500/50';
            case 'Insertion':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
            case 'Mispronunciation':
                return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
            default:
                return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
        }
    };

    return (
        <div className="h-full overflow-y-auto p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                {/* Main Score */}
                <div className="flex flex-col items-center py-4">
                    <ScoreGauge score={result.pronunciationScore} />
                </div>

                {/* Sub-scores */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-3 gap-3"
                >
                    {[
                        { label: 'Accuracy', score: result.accuracyScore },
                        { label: 'Fluency', score: result.fluencyScore },
                        { label: 'Completeness', score: result.completenessScore },
                    ].map((item, i) => (
                        <div
                            key={item.label}
                            className="text-center p-3 rounded-lg"
                            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                        >
                            <p className={`text-xl font-bold ${getScoreColor(item.score).split(' ')[0]}`}>
                                {Math.round(item.score)}
                            </p>
                            <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--foreground-muted)' }}>
                                {item.label}
                            </p>
                        </div>
                    ))}
                </motion.div>

                {/* Word-by-word breakdown with phonemes */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-3"
                >
                    <h4 className="font-display text-sm font-bold uppercase tracking-wider">
                        Word Analysis
                    </h4>

                    {result.words.map((wordResult, wordIndex) => (
                        <motion.div
                            key={wordIndex}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + wordIndex * 0.05 }}
                            className={`p-3 rounded-lg border ${getErrorTypeStyle(wordResult.errorType)}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{wordResult.word}</span>
                                <div className="flex items-center gap-2">
                                    {wordResult.errorType !== 'None' && (
                                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/20">
                                            {wordResult.errorType}
                                        </span>
                                    )}
                                    <span className={`text-sm font-bold ${getScoreColor(wordResult.accuracyScore).split(' ')[0]}`}>
                                        {Math.round(wordResult.accuracyScore)}
                                    </span>
                                </div>
                            </div>

                            {/* Phonemes */}
                            <div className="flex flex-wrap gap-1">
                                {wordResult.phonemes.map((phoneme, phoneIndex) => (
                                    <span
                                        key={phoneIndex}
                                        className={`px-2 py-0.5 rounded text-xs font-mono ${getScoreColor(phoneme.score)}`}
                                        title={`Score: ${Math.round(phoneme.score)}`}
                                    >
                                        /{phoneme.phoneme}/
                                        <sup className="ml-0.5 opacity-70">{Math.round(phoneme.score)}</sup>
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Feedback */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="p-4 rounded-lg"
                    style={{ background: 'var(--accent-muted)', border: '1px solid var(--border)' }}
                >
                    <h4 className="font-display text-sm font-bold mb-2 uppercase tracking-wider text-[var(--accent)]">
                        Feedback
                    </h4>
                    <p className="text-sm leading-relaxed">{result.feedback}</p>
                </motion.div>

                {/* Legend */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="flex flex-wrap gap-3 text-xs"
                    style={{ color: 'var(--foreground-muted)' }}
                >
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-emerald-500/30" />
                        Good (≥80)
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-amber-500/30" />
                        Fair (≥60)
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-red-500/30" />
                        Needs Work (&lt;60)
                    </div>
                </motion.div>

                {/* Retry button */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="flex justify-center pt-4"
                >
                    <button
                        onClick={onRetry}
                        className="px-6 py-2 rounded-full text-sm font-medium transition-all"
                        style={{ background: 'var(--primary)', color: 'white' }}
                    >
                        Try Again
                    </button>
                </motion.div>
            </motion.div>
        </div>
    );
}
