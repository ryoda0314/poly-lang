'use client';

import { motion } from 'framer-motion';
import type { DiffItem } from '@/types/pronunciation';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface DiffHighlightProps {
    expectedText: string;
    asrText: string;
    diffs: DiffItem[];
}

export function DiffHighlight({ expectedText, asrText, diffs }: DiffHighlightProps) {
    const expectedWords = expectedText.split(/\s+/);
    const asrWords = asrText.split(/\s+/);

    // Map position to diff type
    const diffMap = new Map<number, DiffItem>();
    diffs.forEach((diff) => {
        diffMap.set(diff.position, diff);
    });

    const getStyleForType = (type: DiffItem['type']) => {
        switch (type) {
            case 'missing':
                return {
                    className: 'text-red-400 line-through decoration-2',
                    bgColor: 'rgba(239, 68, 68, 0.15)',
                    label: 'Missing',
                    description: 'This word was not pronounced',
                };
            case 'substitution':
                return {
                    className: 'text-amber-400',
                    bgColor: 'rgba(245, 158, 11, 0.15)',
                    label: 'Substituted',
                    description: 'Different word was recognized',
                };
            case 'insertion':
                return {
                    className: 'text-emerald-400',
                    bgColor: 'rgba(16, 185, 129, 0.15)',
                    label: 'Extra',
                    description: 'This word was added',
                };
            default:
                return {
                    className: '',
                    bgColor: 'transparent',
                    label: 'Correct',
                    description: 'Pronounced correctly',
                };
        }
    };

    return (
        <TooltipProvider delayDuration={200}>
            <div className="space-y-4">
                {/* Expected text with highlights */}
                <div>
                    <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--foreground-muted)' }}>
                        Expected
                    </p>
                    <p className="text-lg leading-relaxed">
                        {expectedWords.map((word, index) => {
                            const diff = diffMap.get(index);
                            const style = diff ? getStyleForType(diff.type) : getStyleForType('match');

                            return (
                                <Tooltip key={index}>
                                    <TooltipTrigger asChild>
                                        <motion.span
                                            className={`inline-block mr-1.5 px-1 py-0.5 rounded cursor-help ${style.className}`}
                                            style={{ backgroundColor: style.bgColor }}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                        >
                                            {word}
                                        </motion.span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="font-medium">{style.label}</p>
                                        {diff?.type === 'substitution' && diff.actual && (
                                            <p className="text-xs opacity-80">
                                                Heard: &quot;{diff.actual}&quot;
                                            </p>
                                        )}
                                        <p className="text-xs opacity-60">{style.description}</p>
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </p>
                </div>

                <div>
                    <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--foreground-muted)' }}>
                        What We Heard
                    </p>
                    <p className="text-base opacity-70 leading-relaxed">
                        {asrWords.map((word, index) => (
                            <motion.span
                                key={index}
                                className="inline-block mr-1.5"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 + index * 0.02 }}
                            >
                                {word}
                            </motion.span>
                        ))}
                    </p>
                </div>

                {/* Legend */}
                <motion.div
                    className="flex flex-wrap gap-4 pt-3 border-t"
                    style={{ borderColor: 'var(--border)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    <div className="flex items-center gap-2 text-xs">
                        <span className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(16, 185, 129, 0.3)' }} />
                        <span style={{ color: 'var(--foreground-muted)' }}>Correct</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.3)' }} />
                        <span style={{ color: 'var(--foreground-muted)' }}>Missing</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(245, 158, 11, 0.3)' }} />
                        <span style={{ color: 'var(--foreground-muted)' }}>Substituted</span>
                    </div>
                </motion.div>
            </div>
        </TooltipProvider>
    );
}
