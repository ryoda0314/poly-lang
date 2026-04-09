'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Filter, RefreshCw, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import type { PronunciationRun } from '@/types/pronunciation';
import { fetchRuns } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ScoreGauge } from '@/components/pronunciation/score-gauge';
import { DiffHighlight } from '@/components/pronunciation/diff-highlight';

export default function LogsPage() {
    const [runs, setRuns] = useState<PronunciationRun[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRun, setSelectedRun] = useState<PronunciationRun | null>(null);

    // Filters
    const [scoreMin, setScoreMin] = useState<string>('');
    const [scoreMax, setScoreMax] = useState<string>('');

    const loadRuns = async () => {
        setLoading(true);
        setError(null);

        const response = await fetchRuns({
            limit: 50,
            scoreMin: scoreMin ? parseInt(scoreMin, 10) : undefined,
            scoreMax: scoreMax ? parseInt(scoreMax, 10) : undefined,
        });

        if (response.success && response.data) {
            setRuns(response.data);
        } else {
            setError(response.error || 'Failed to load runs');
            toast.error('Failed to load logs', { description: response.error });
        }

        setLoading(false);
    };

    useEffect(() => {
        loadRuns();
    }, []);

    const handleFilter = () => {
        loadRuns();
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-400';
        if (score >= 60) return 'text-amber-400';
        return 'text-red-400';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="font-display text-3xl font-bold mb-2">Pronunciation Logs</h1>
                <p className="text-[var(--foreground-muted)] mb-6">
                    Review your past pronunciation evaluations
                </p>
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex flex-wrap gap-4 mb-6 p-4 rounded-lg"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[var(--foreground-muted)]" />
                    <span className="text-sm text-[var(--foreground-muted)]">Score:</span>
                    <Input
                        type="number"
                        placeholder="Min"
                        value={scoreMin}
                        onChange={(e) => setScoreMin(e.target.value)}
                        className="w-20 h-8 bg-transparent"
                        min="0"
                        max="100"
                    />
                    <span className="text-[var(--foreground-muted)]">-</span>
                    <Input
                        type="number"
                        placeholder="Max"
                        value={scoreMax}
                        onChange={(e) => setScoreMax(e.target.value)}
                        className="w-20 h-8 bg-transparent"
                        min="0"
                        max="100"
                    />
                </div>

                <Button onClick={handleFilter} size="sm" variant="outline">
                    Apply Filters
                </Button>

                <Button onClick={loadRuns} size="sm" variant="ghost">
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Refresh
                </Button>
            </motion.div>

            {/* Loading state */}
            {loading && (
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-lg" />
                    ))}
                </div>
            )}

            {/* Error state */}
            {error && !loading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                >
                    <p className="text-red-400 mb-4">{error}</p>
                    <Button onClick={loadRuns} variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                    </Button>
                </motion.div>
            )}

            {/* Empty state */}
            {!loading && !error && runs.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                >
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-[var(--foreground-muted)]" />
                    <p className="text-[var(--foreground-muted)]">No pronunciation logs yet</p>
                    <p className="text-sm text-[var(--foreground-muted)] mt-1">
                        Start practicing to see your history here
                    </p>
                </motion.div>
            )}

            {/* Runs list */}
            {!loading && !error && runs.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-3"
                >
                    {runs.map((run, index) => (
                        <motion.button
                            key={run.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            onClick={() => setSelectedRun(run)}
                            className="w-full text-left p-4 rounded-lg transition-all hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate mb-1">
                                        {run.expectedText}
                                    </p>
                                    <div className="flex items-center gap-3 text-xs text-[var(--foreground-muted)]">
                                        <span>{formatDate(run.createdAt)}</span>
                                        <Badge variant="outline" className="text-[10px]">
                                            {run.sentenceId}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`text-2xl font-bold ${getScoreColor(run.score)}`}>
                                        {run.score}
                                    </span>
                                    <Eye className="w-5 h-5 text-[var(--foreground-muted)]" />
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </motion.div>
            )}

            {/* Detail Modal */}
            <Dialog open={!!selectedRun} onOpenChange={() => setSelectedRun(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-[var(--background-elevated)] border-[var(--border)]">
                    <DialogHeader>
                        <DialogTitle className="font-display text-xl">
                            Evaluation Details
                        </DialogTitle>
                    </DialogHeader>

                    {selectedRun && (
                        <div className="space-y-6 py-4">
                            {/* Score */}
                            <div className="flex justify-center">
                                <ScoreGauge score={selectedRun.score} size={140} animated={false} />
                            </div>

                            {/* Diff */}
                            <div
                                className="p-4 rounded-lg"
                                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                            >
                                <DiffHighlight
                                    expectedText={selectedRun.expectedText}
                                    asrText={selectedRun.asrText}
                                    diffs={selectedRun.diffs}
                                />
                            </div>

                            {/* Feedback */}
                            <div
                                className="p-4 rounded-lg"
                                style={{ background: 'var(--accent-muted)', border: '1px solid var(--border)' }}
                            >
                                <h4 className="text-sm font-bold mb-2 uppercase tracking-wider text-[var(--accent)]">
                                    Feedback
                                </h4>
                                <p className="text-sm">{selectedRun.feedback}</p>
                            </div>

                            {/* Metadata */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-[var(--foreground-muted)]">Sentence ID:</span>
                                    <p className="font-mono text-xs">{selectedRun.sentenceId}</p>
                                </div>
                                <div>
                                    <span className="text-[var(--foreground-muted)]">Run ID:</span>
                                    <p className="font-mono text-xs">{selectedRun.id}</p>
                                </div>
                                <div>
                                    <span className="text-[var(--foreground-muted)]">Date:</span>
                                    <p>{new Date(selectedRun.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
