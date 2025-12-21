'use client';

import { motion } from 'framer-motion';
import { RefreshCw, ArrowRight } from 'lucide-react';
import type { EvaluationResult, ComparisonData } from '@/types/pronunciation';
import { Button } from '@/components/ui/button';
import { ScoreGauge } from './score-gauge';
import { DiffHighlight } from './diff-highlight';

interface ResultPanelProps {
    result: EvaluationResult | null;
    comparison: ComparisonData | null;
    onRetry: () => void;
    isSecondAttempt: boolean;
}

export function ResultPanel({ result, comparison, onRetry, isSecondAttempt }: ResultPanelProps) {
    if (!result) {
        return (
            <div className="h-full flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center"
                >
                    <div
                        className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                        style={{ background: 'var(--card)', border: '2px dashed var(--border)' }}
                    >
                        <ArrowRight className="w-8 h-8" style={{ color: 'var(--foreground-muted)' }} />
                    </div>
                    <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                        Your results will appear here
                    </p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                {/* Score section */}
                <div className="flex flex-col items-center py-4">
                    <ScoreGauge score={result.score} />

                    {/* Comparison badge if available */}
                    {comparison && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1 }}
                            className={`mt-6 px-4 py-2 rounded-full flex items-center gap-2 ${comparison.scoreDiff >= 0
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-red-500/20 text-red-400'
                                }`}
                        >
                            <span className="font-bold">
                                {comparison.scoreDiff >= 0 ? '+' : ''}{comparison.scoreDiff}
                            </span>
                            <span className="text-sm">
                                {comparison.scoreDiff >= 0 ? 'improvement' : 'decrease'}
                            </span>
                        </motion.div>
                    )}
                </div>

                {/* Diff highlight */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 rounded-lg"
                    style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                    <DiffHighlight
                        expectedText={result.expectedText}
                        asrText={result.asrText}
                        diffs={result.diffs}
                    />
                </motion.div>

                {/* Feedback */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="p-4 rounded-lg"
                    style={{ background: 'var(--accent-muted)', border: '1px solid var(--border)' }}
                >
                    <h4 className="font-display text-sm font-bold mb-2 uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                        Feedback
                    </h4>
                    <p className="text-sm leading-relaxed">{result.feedback}</p>
                </motion.div>

                {/* Comparison panel (if 2nd attempt) */}
                {comparison && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="p-4 rounded-lg"
                        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                    >
                        <h4 className="font-display text-sm font-bold mb-3 uppercase tracking-wider">
                            Comparison
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold" style={{ color: 'var(--foreground-muted)' }}>
                                    {comparison.firstRun.score}
                                </p>
                                <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--foreground-muted)' }}>
                                    1st Attempt
                                </p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
                                    {comparison.secondRun.score}
                                </p>
                                <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--foreground-muted)' }}>
                                    2nd Attempt
                                </p>
                            </div>
                        </div>

                        {comparison.improvedItems > 0 && (
                            <p className="mt-3 text-xs text-center text-emerald-400">
                                ✓ {comparison.improvedItems} word{comparison.improvedItems > 1 ? 's' : ''} improved
                            </p>
                        )}
                    </motion.div>
                )}

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="flex justify-center pt-4"
                >
                    <Button
                        onClick={onRetry}
                        className="rounded-full px-6"
                        style={{
                            background: isSecondAttempt ? 'var(--card)' : 'var(--primary)',
                            color: 'var(--foreground)',
                        }}
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {isSecondAttempt ? 'Try Again' : 'Record 2nd Attempt'}
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
}
