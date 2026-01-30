import { create } from 'zustand';
import {
    createExtractionJob,
    getExtractionJobs,
    getExtractionJob,
    markJobAsViewed,
    deleteExtractionJob,
    type ExtractionJob
} from '@/actions/extraction-job';

export interface Toast {
    id: string;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    jobId?: string;
}

interface ExtractionJobsState {
    jobs: ExtractionJob[];
    isLoading: boolean;
    lastPolledAt: Date | null;

    // Toast state
    toasts: Toast[];

    // Actions
    fetchJobs: () => Promise<void>;
    createJob: (imageBase64: string, targetLang: string, nativeLang: string, phraseSetId?: string) => Promise<{ success: boolean; jobId?: string; error?: string }>;
    pollForCompleted: () => Promise<void>;
    markAsViewed: (jobId: string) => Promise<void>;
    deleteJob: (jobId: string) => Promise<boolean>;
    refreshJob: (jobId: string) => Promise<void>;

    // Toast actions
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
    clearToasts: () => void;
}

export const useExtractionJobsStore = create<ExtractionJobsState>((set, get) => ({
    jobs: [],
    isLoading: false,
    lastPolledAt: null,
    toasts: [],

    fetchJobs: async () => {
        set({ isLoading: true });
        try {
            const jobs = await getExtractionJobs(50);
            set({ jobs });
        } catch (error) {
            console.error('Failed to fetch extraction jobs:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    createJob: async (imageBase64, targetLang, nativeLang, phraseSetId) => {
        const result = await createExtractionJob(imageBase64, targetLang, nativeLang, phraseSetId);

        if (result.success && result.jobId) {
            // Refresh jobs list to include the new job
            get().fetchJobs();
        }

        return result;
    },

    pollForCompleted: async () => {
        try {
            const response = await fetch('/api/extraction-jobs/pending');
            const data = await response.json();

            if (data.jobs && data.jobs.length > 0) {
                const completedJobIds: string[] = [];

                for (const job of data.jobs) {
                    if (job.status === 'completed') {
                        get().addToast({
                            type: 'success',
                            title: '抽出完了',
                            message: `${job.phrase_count}個のフレーズを抽出しました`,
                            jobId: job.id
                        });
                        completedJobIds.push(job.id);
                    } else if (job.status === 'failed') {
                        get().addToast({
                            type: 'error',
                            title: '抽出失敗',
                            message: '画像からフレーズを抽出できませんでした',
                            jobId: job.id
                        });
                        completedJobIds.push(job.id);
                    }
                }

                // Mark as notified
                if (completedJobIds.length > 0) {
                    await fetch('/api/extraction-jobs/pending', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ jobIds: completedJobIds })
                    });

                    // Refresh jobs list
                    get().fetchJobs();
                }
            }

            set({ lastPolledAt: new Date() });
        } catch (error) {
            console.error('Failed to poll for completed jobs:', error);
        }
    },

    markAsViewed: async (jobId) => {
        await markJobAsViewed(jobId);
        // Update local state
        set(state => ({
            jobs: state.jobs.map(job =>
                job.id === jobId ? { ...job, viewed_at: new Date().toISOString() } : job
            )
        }));
    },

    deleteJob: async (jobId) => {
        const success = await deleteExtractionJob(jobId);
        if (success) {
            set(state => ({
                jobs: state.jobs.filter(job => job.id !== jobId)
            }));
        }
        return success;
    },

    refreshJob: async (jobId) => {
        const job = await getExtractionJob(jobId);
        if (job) {
            set(state => ({
                jobs: state.jobs.map(j => j.id === jobId ? job : j)
            }));
        }
    },

    // Toast actions
    addToast: (toast) => {
        const id = Math.random().toString(36).substring(2, 9);
        set(state => ({
            toasts: [...state.toasts, { ...toast, id }].slice(-5) // Keep max 5 toasts
        }));

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            get().removeToast(id);
        }, 5000);
    },

    removeToast: (id) => {
        set(state => ({
            toasts: state.toasts.filter(t => t.id !== id)
        }));
    },

    clearToasts: () => {
        set({ toasts: [] });
    }
}));
