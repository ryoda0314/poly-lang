'use client';

import { motion } from 'framer-motion';
import { FileText, Plus, Database } from 'lucide-react';
import { sentences, getCategories } from '@/data/sentences';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function SentencesPage() {
    const categories = getCategories();

    const difficultyColors = {
        easy: 'bg-emerald-500/20 text-emerald-400',
        medium: 'bg-amber-500/20 text-amber-400',
        hard: 'bg-red-500/20 text-red-400',
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start justify-between mb-6"
            >
                <div>
                    <h1 className="font-display text-3xl font-bold mb-2">Practice Sentences</h1>
                    <p className="text-[var(--foreground-muted)]">
                        {sentences.length} sentences across {categories.length} categories
                    </p>
                </div>

                {/* Future: Add sentence button */}
                <Button disabled className="gap-2" variant="outline">
                    <Plus className="w-4 h-4" />
                    Add Sentence
                    <Badge variant="secondary" className="ml-1 text-[10px]">Soon</Badge>
                </Button>
            </motion.div>

            {/* Info banner */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mb-6 p-4 rounded-lg flex items-start gap-3"
                style={{ background: 'var(--accent-muted)', border: '1px solid var(--border)' }}
            >
                <Database className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-medium text-[var(--accent)]">Local Data Mode</p>
                    <p className="text-xs text-[var(--foreground-muted)] mt-1">
                        Sentences are currently stored locally. Database integration for custom sentences is coming soon.
                    </p>
                </div>
            </motion.div>

            {/* Categories */}
            {categories.map((category, catIndex) => {
                const categorySentences = sentences.filter((s) => s.category === category);

                return (
                    <motion.div
                        key={category}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + catIndex * 0.05 }}
                        className="mb-8"
                    >
                        <h2 className="font-display text-lg font-bold capitalize mb-3 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-[var(--primary)]" />
                            {category}
                            <Badge variant="outline" className="ml-2 text-xs">
                                {categorySentences.length}
                            </Badge>
                        </h2>

                        <div className="space-y-2">
                            {categorySentences.map((sentence, index) => (
                                <motion.div
                                    key={sentence.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.15 + index * 0.02 }}
                                    className="p-4 rounded-lg group"
                                    style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <p className="text-sm leading-relaxed flex-1">{sentence.text}</p>
                                        <Badge
                                            className={`flex-shrink-0 ${difficultyColors[sentence.difficulty]}`}
                                        >
                                            {sentence.difficulty}
                                        </Badge>
                                    </div>

                                    {sentence.phonemes && sentence.phonemes.length > 0 && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-xs text-[var(--foreground-muted)]">Focus:</span>
                                            {sentence.phonemes.map((phoneme) => (
                                                <Badge
                                                    key={phoneme}
                                                    variant="outline"
                                                    className="text-[10px] font-mono"
                                                >
                                                    /{phoneme}/
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
