'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight } from 'lucide-react';
import type { Sentence } from '@/types/pronunciation';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SentenceListProps {
    sentences: Sentence[];
    selectedId: string | null;
    onSelect: (sentence: Sentence) => void;
}

export function SentenceList({ sentences, selectedId, onSelect }: SentenceListProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

    const filteredSentences = useMemo(() => {
        return sentences.filter((sentence) => {
            const matchesSearch =
                !searchQuery ||
                sentence.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sentence.category.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesDifficulty = !selectedDifficulty || sentence.difficulty === selectedDifficulty;

            return matchesSearch && matchesDifficulty;
        });
    }, [sentences, searchQuery, selectedDifficulty]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent, currentIndex: number) => {
            if (e.key === 'ArrowDown' && currentIndex < filteredSentences.length - 1) {
                e.preventDefault();
                onSelect(filteredSentences[currentIndex + 1]);
            } else if (e.key === 'ArrowUp' && currentIndex > 0) {
                e.preventDefault();
                onSelect(filteredSentences[currentIndex - 1]);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                onSelect(filteredSentences[currentIndex]);
            }
        },
        [filteredSentences, onSelect]
    );

    const difficulties = ['easy', 'medium', 'hard'] as const;
    const difficultyColors = {
        easy: 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30',
        medium: 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30',
        hard: 'bg-red-500/20 text-red-400 hover:bg-red-500/30',
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <h2 className="font-display text-xl font-bold mb-3">Practice Sentences</h2>

                {/* Search */}
                <div className="relative mb-3">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                        style={{ color: 'var(--foreground-muted)' }}
                    />
                    <Input
                        type="text"
                        placeholder="Search sentences..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-transparent border-[var(--border)] focus:border-[var(--primary)]"
                    />
                </div>

                {/* Difficulty filters */}
                <div className="flex gap-2">
                    {difficulties.map((difficulty) => (
                        <button
                            key={difficulty}
                            onClick={() =>
                                setSelectedDifficulty(selectedDifficulty === difficulty ? null : difficulty)
                            }
                            className={`px-3 py-1 text-xs rounded-full capitalize transition-all ${selectedDifficulty === difficulty
                                    ? difficultyColors[difficulty]
                                    : 'bg-[var(--card)] text-[var(--foreground-muted)] hover:bg-[var(--card-hover)]'
                                }`}
                        >
                            {difficulty}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sentence list */}
            <ScrollArea className="flex-1">
                <div className="p-2">
                    <AnimatePresence mode="popLayout">
                        {filteredSentences.map((sentence, index) => {
                            const isSelected = sentence.id === selectedId;

                            return (
                                <motion.button
                                    key={sentence.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ delay: index * 0.02 }}
                                    onClick={() => onSelect(sentence)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    className={`w-full text-left p-3 rounded-lg mb-1 transition-all group focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${isSelected
                                            ? 'bg-[var(--primary)]/10 border border-[var(--primary)]/30'
                                            : 'hover:bg-[var(--card-hover)] border border-transparent'
                                        }`}
                                    aria-selected={isSelected}
                                    role="option"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <p
                                            className={`text-sm leading-relaxed ${isSelected ? 'text-[var(--foreground)]' : 'text-[var(--foreground)]/80'
                                                }`}
                                        >
                                            {sentence.text.length > 60
                                                ? sentence.text.slice(0, 60) + '...'
                                                : sentence.text}
                                        </p>
                                        <ChevronRight
                                            className={`w-4 h-4 flex-shrink-0 mt-0.5 transition-transform ${isSelected ? 'text-[var(--primary)]' : 'text-[var(--foreground-muted)]'
                                                } ${isSelected ? 'translate-x-0' : '-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`}
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] capitalize ${difficultyColors[sentence.difficulty]}`}
                                        >
                                            {sentence.difficulty}
                                        </Badge>
                                        <span className="text-[10px] text-[var(--foreground-muted)] capitalize">
                                            {sentence.category}
                                        </span>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </AnimatePresence>

                    {filteredSentences.length === 0 && (
                        <div className="text-center py-8 text-[var(--foreground-muted)]">
                            <p>No sentences found</p>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Footer count */}
            <div
                className="p-3 border-t text-xs text-center"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground-muted)' }}
            >
                {filteredSentences.length} of {sentences.length} sentences
            </div>
        </div>
    );
}
