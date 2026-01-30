"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Clock,
    Loader2,
    CheckCircle,
    XCircle,
    ChevronDown,
    ChevronUp,
    Trash2,
    Plus,
    RefreshCw,
    Image as ImageIcon
} from "lucide-react";
import { useExtractionJobsStore } from "@/store/extraction-jobs-store";
import { useAppStore } from "@/store/app-context";
import { usePhraseSetStore } from "@/store/phrase-sets-store";
import { translations } from "@/lib/translations";
import styles from "./extraction-history.module.css";
import type { ExtractionJob } from "@/actions/extraction-job";

function formatDate(dateStr: string, nativeLang: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return nativeLang === 'ja' ? 'たった今' : 'Just now';
    if (diffMins < 60) return nativeLang === 'ja' ? `${diffMins}分前` : `${diffMins}m ago`;
    if (diffHours < 24) return nativeLang === 'ja' ? `${diffHours}時間前` : `${diffHours}h ago`;

    const locales: Record<string, string> = { ja: 'ja-JP', ko: 'ko-KR', en: 'en-US' };
    return date.toLocaleDateString(locales[nativeLang] || 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function JobCard({
    job,
    nativeLang,
    onDelete,
    onAddToSet
}: {
    job: ExtractionJob;
    nativeLang: string;
    onDelete: (id: string) => void;
    onAddToSet: (job: ExtractionJob) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const statusConfig = {
        pending: { icon: Clock, color: '#f59e0b', label: nativeLang === 'ja' ? '待機中' : 'Pending' },
        processing: { icon: Loader2, color: '#3b82f6', label: nativeLang === 'ja' ? '処理中' : 'Processing' },
        completed: { icon: CheckCircle, color: '#22c55e', label: nativeLang === 'ja' ? '完了' : 'Completed' },
        failed: { icon: XCircle, color: '#ef4444', label: nativeLang === 'ja' ? '失敗' : 'Failed' }
    };

    const config = statusConfig[job.status];
    const StatusIcon = config.icon;
    const isAnimated = job.status === 'processing';

    const handleDelete = async () => {
        setDeleting(true);
        await onDelete(job.id);
    };

    const phrases = job.extracted_phrases || [];

    return (
        <div className={styles.jobCard}>
            <div className={styles.jobHeader} onClick={() => setExpanded(!expanded)}>
                <div className={styles.jobStatus}>
                    <StatusIcon
                        size={20}
                        style={{
                            color: config.color,
                            animation: isAnimated ? 'spin 1s linear infinite' : 'none'
                        }}
                    />
                    <span className={styles.statusLabel} style={{ color: config.color }}>
                        {config.label}
                    </span>
                </div>
                <div className={styles.jobMeta}>
                    <span className={styles.phraseCount}>
                        {job.phrase_count > 0 ? `${job.phrase_count} phrases` : ''}
                    </span>
                    <span className={styles.jobDate}>
                        {formatDate(job.created_at, nativeLang)}
                    </span>
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
            </div>

            {expanded && (
                <div className={styles.jobContent}>
                    {job.status === 'failed' && job.error_message && (
                        <div className={styles.errorMessage}>
                            {job.error_message}
                        </div>
                    )}

                    {job.status === 'completed' && phrases.length > 0 && (
                        <>
                            <div className={styles.phrasesList}>
                                {phrases.slice(0, 10).map((phrase, idx) => (
                                    <div key={idx} className={styles.phraseItem}>
                                        <span className={styles.phraseTarget}>{phrase.target_text}</span>
                                        <span className={styles.phraseTranslation}>{phrase.translation}</span>
                                    </div>
                                ))}
                                {phrases.length > 10 && (
                                    <div className={styles.moreIndicator}>
                                        +{phrases.length - 10} more
                                    </div>
                                )}
                            </div>
                            <button
                                className={styles.addButton}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAddToSet(job);
                                }}
                            >
                                <Plus size={16} />
                                {nativeLang === 'ja' ? 'フレーズセットに追加' : 'Add to Phrase Set'}
                            </button>
                        </>
                    )}

                    {(job.status === 'pending' || job.status === 'processing') && (
                        <div className={styles.processingMessage}>
                            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                            <span>
                                {nativeLang === 'ja'
                                    ? 'バックグラウンドで処理中です...'
                                    : 'Processing in background...'}
                            </span>
                        </div>
                    )}

                    <div className={styles.jobActions}>
                        <button
                            className={styles.deleteButton}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDelete();
                            }}
                            disabled={deleting}
                        >
                            {deleting ? (
                                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                                <Trash2 size={14} />
                            )}
                            {nativeLang === 'ja' ? '削除' : 'Delete'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ExtractionHistoryPage() {
    const router = useRouter();
    const { jobs, isLoading, fetchJobs, deleteJob } = useExtractionJobsStore();
    const { addPhrases, phraseSets, fetchPhraseSets } = usePhraseSetStore();
    const { nativeLanguage, activeLanguageCode, user } = useAppStore();
    const t = translations[nativeLanguage] || translations.ja;

    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchJobs();
        if (user?.id && activeLanguageCode) {
            fetchPhraseSets(user.id, activeLanguageCode);
        }
    }, [fetchJobs, fetchPhraseSets, user?.id, activeLanguageCode]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchJobs();
        setRefreshing(false);
    };

    const handleDelete = async (jobId: string) => {
        await deleteJob(jobId);
    };

    const handleAddToSet = async (job: ExtractionJob) => {
        if (!job.extracted_phrases || job.extracted_phrases.length === 0) return;

        // Find the first custom phrase set or create a default one
        const customSets = phraseSets.filter(s => s.id !== 'builtin');
        if (customSets.length === 0) {
            alert(nativeLanguage === 'ja'
                ? 'フレーズセットを先に作成してください'
                : 'Please create a phrase set first');
            router.push('/app/phrases');
            return;
        }

        const targetSet = customSets[0];
        await addPhrases(targetSet.id, job.extracted_phrases.map(p => ({
            target_text: p.target_text,
            translation: p.translation,
            tokens: p.tokens
        })));

        alert(nativeLanguage === 'ja'
            ? `${job.phrase_count}個のフレーズを「${targetSet.name}」に追加しました`
            : `Added ${job.phrase_count} phrases to "${targetSet.name}"`);
    };

    const pendingCount = jobs.filter(j => j.status === 'pending' || j.status === 'processing').length;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <ImageIcon size={24} />
                    <h1 className={styles.title}>
                        {nativeLanguage === 'ja' ? '画像抽出履歴' : 'Extraction History'}
                    </h1>
                </div>
                <button
                    className={styles.refreshButton}
                    onClick={handleRefresh}
                    disabled={refreshing}
                >
                    <RefreshCw
                        size={18}
                        style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}
                    />
                </button>
            </div>

            {pendingCount > 0 && (
                <div className={styles.pendingBanner}>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>
                        {nativeLanguage === 'ja'
                            ? `${pendingCount}件の画像を処理中...`
                            : `Processing ${pendingCount} image${pendingCount > 1 ? 's' : ''}...`}
                    </span>
                </div>
            )}

            {isLoading && jobs.length === 0 ? (
                <div className={styles.loading}>
                    <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            ) : jobs.length === 0 ? (
                <div className={styles.emptyState}>
                    <ImageIcon size={48} style={{ opacity: 0.3 }} />
                    <p>
                        {nativeLanguage === 'ja'
                            ? '抽出履歴はまだありません'
                            : 'No extraction history yet'}
                    </p>
                    <span className={styles.emptyHint}>
                        {nativeLanguage === 'ja'
                            ? 'フレーズページから画像をアップロードしてください'
                            : 'Upload an image from the Phrases page'}
                    </span>
                </div>
            ) : (
                <div className={styles.jobsList}>
                    {jobs.map(job => (
                        <JobCard
                            key={job.id}
                            job={job}
                            nativeLang={nativeLanguage}
                            onDelete={handleDelete}
                            onAddToSet={handleAddToSet}
                        />
                    ))}
                </div>
            )}

            <style jsx global>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
