'use server';

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';
import type {
    ItemReview,
    StudySession,
    UserLearningStats,
    ReviewStatus
} from './learning-stats';

// ============================================
// Types
// ============================================

type AwarenessMemo = Database['public']['Tables']['awareness_memos']['Row'];

export interface PhraseSetItemWithReview {
    id: string;
    target_text: string;
    translation: string;
    phrase_set_id: string;
    review: ItemReview | null;
}

export interface MasteryDistribution {
    awareness: {
        unverified: number;
        learning: number; // attempted + verified with strength < 3
        mastered: number; // verified with strength >= 4
    };
    phrases: {
        new: number;
        learning: number;
        reviewing: number;
        mastered: number;
    };
    combined: {
        weak: number;
        learning: number;
        strong: number;
        mastered: number;
    };
}

export interface UnifiedReviewQueue {
    awareness: AwarenessMemo[];
    phrases: PhraseSetItemWithReview[];
    totalDue: number;
}

export interface WeakItemsResult {
    awarenessWeak: AwarenessMemo[];
    phraseWeak: PhraseSetItemWithReview[];
}

export interface ReviewCalendar {
    [date: string]: {
        awarenessCount: number;
        phraseCount: number;
        total: number;
    };
}

export interface SessionHistoryResult {
    sessions: StudySession[];
    aggregates: {
        totalSessions: number;
        totalTime: number;
        avgAccuracy: number;
        bestStreak: number;
    };
}

// ============================================
// Server Actions
// ============================================

/**
 * Get unified review queue combining awareness memos and phrase set items
 */
export async function getUnifiedReviewQueue(
    timeframe: 'today' | 'week' | 'all',
    languageCode: string
): Promise<UnifiedReviewQueue | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const now = new Date();
    let endDate: Date;

    if (timeframe === 'today') {
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
    } else if (timeframe === 'week') {
        endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else {
        endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    }

    try {
        // Fetch awareness memos due for review
        const { data: awareness, error: awarenessError } = await supabase
            .from('awareness_memos')
            .select('*')
            .eq('user_id', user.id)
            .eq('language_code', languageCode)
            .not('next_review_at', 'is', null)
            .lte('next_review_at', endDate.toISOString())
            .order('next_review_at', { ascending: true });

        if (awarenessError) {
            console.error('Error fetching awareness memos:', awarenessError);
            return { awareness: [], phrases: [], totalDue: 0 };
        }

        // Fetch phrase set items due for review
        const { data: phraseReviews, error: phraseError } = await supabase
            .from('phrase_set_item_reviews')
            .select(`
                *,
                phrase_set_items!inner (
                    id,
                    target_text,
                    translation,
                    phrase_set_id,
                    phrase_sets!inner (
                        language_code
                    )
                )
            `)
            .eq('user_id', user.id)
            .eq('phrase_set_items.phrase_sets.language_code', languageCode)
            .not('next_review_at', 'is', null)
            .lte('next_review_at', endDate.toISOString())
            .order('next_review_at', { ascending: true }) as any;

        if (phraseError) {
            console.error('Error fetching phrase reviews:', phraseError);
        }

        // Transform phrase reviews to expected format
        const phrases: PhraseSetItemWithReview[] = (phraseReviews || []).map((pr: any) => ({
            id: pr.phrase_set_items?.id || '',
            target_text: pr.phrase_set_items?.target_text || '',
            translation: pr.phrase_set_items?.translation || '',
            phrase_set_id: pr.phrase_set_items?.phrase_set_id || '',
            review: {
                id: pr.id,
                phrase_set_item_id: pr.phrase_set_item_id,
                user_id: pr.user_id,
                status: pr.status,
                strength: pr.strength,
                ease_factor: pr.ease_factor,
                interval_days: pr.interval_days,
                last_reviewed_at: pr.last_reviewed_at,
                next_review_at: pr.next_review_at,
                review_count: pr.review_count,
                correct_count: pr.correct_count,
                incorrect_count: pr.incorrect_count,
            }
        }));

        return {
            awareness: awareness || [],
            phrases,
            totalDue: (awareness?.length || 0) + phrases.length
        };
    } catch (error) {
        console.error('Error in getUnifiedReviewQueue:', error);
        return { awareness: [], phrases: [], totalDue: 0 };
    }
}

/**
 * Get mastery distribution across awareness memos and phrase sets
 */
export async function getMasteryDistribution(
    languageCode: string
): Promise<MasteryDistribution | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    try {
        // Get awareness memo stats
        const { data: awarenessStats, error: awarenessError } = await supabase
            .from('awareness_memos')
            .select('status, strength')
            .eq('user_id', user.id)
            .eq('language_code', languageCode);

        if (awarenessError) {
            console.error('Error fetching awareness stats:', awarenessError);
        }

        const awareness = {
            unverified: awarenessStats?.filter(m => m.status === 'unverified').length || 0,
            learning: awarenessStats?.filter(m =>
                m.status === 'attempted' || (m.status === 'verified' && m.strength < 3)
            ).length || 0,
            mastered: awarenessStats?.filter(m =>
                m.status === 'verified' && m.strength >= 4
            ).length || 0,
        };

        // Get phrase set review stats
        const { data: phraseStats, error: phraseError } = await supabase
            .from('phrase_set_item_reviews')
            .select(`
                status,
                phrase_set_items!inner (
                    phrase_sets!inner (
                        language_code
                    )
                )
            `)
            .eq('user_id', user.id)
            .eq('phrase_set_items.phrase_sets.language_code', languageCode) as any;

        if (phraseError) {
            console.error('Error fetching phrase stats:', phraseError);
        }

        const phrases = {
            new: phraseStats?.filter((p: any) => p.status === 'new').length || 0,
            learning: phraseStats?.filter((p: any) => p.status === 'learning').length || 0,
            reviewing: phraseStats?.filter((p: any) => p.status === 'reviewing').length || 0,
            mastered: phraseStats?.filter((p: any) => p.status === 'mastered').length || 0,
        };

        // Combine into unified categories
        const combined = {
            weak: awareness.unverified + phrases.new,
            learning: awareness.learning + phrases.learning + phrases.reviewing,
            strong: 0, // Can add intermediate category later
            mastered: awareness.mastered + phrases.mastered
        };

        return { awareness, phrases, combined };
    } catch (error) {
        console.error('Error in getMasteryDistribution:', error);
        return null;
    }
}

/**
 * Get weak items that need practice
 */
export async function getWeakItems(
    languageCode: string,
    limit: number = 20
): Promise<WeakItemsResult | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    try {
        // Get weak awareness memos
        const { data: awarenessWeak, error: awarenessError } = await supabase
            .from('awareness_memos')
            .select('*')
            .eq('user_id', user.id)
            .eq('language_code', languageCode)
            .or('status.eq.unverified,and(strength.lt.2),and(usage_count.gt.5,strength.lt.3)')
            .order('strength', { ascending: true })
            .limit(limit);

        if (awarenessError) {
            console.error('Error fetching weak awareness memos:', awarenessError);
        }

        // Get weak phrase items
        const { data: phraseReviewsWeak, error: phraseError } = await supabase
            .from('phrase_set_item_reviews')
            .select(`
                *,
                phrase_set_items!inner (
                    id,
                    target_text,
                    translation,
                    phrase_set_id,
                    phrase_sets!inner (
                        language_code
                    )
                )
            `)
            .eq('user_id', user.id)
            .eq('phrase_set_items.phrase_sets.language_code', languageCode)
            .or('and(incorrect_count.gt.correct_count),and(strength.lt.2,review_count.gt.3),and(status.eq.learning,review_count.gt.5)')
            .order('strength', { ascending: true })
            .limit(limit) as any;

        if (phraseError) {
            console.error('Error fetching weak phrase items:', phraseError);
        }

        const phraseWeak: PhraseSetItemWithReview[] = (phraseReviewsWeak || []).map((pr: any) => ({
            id: pr.phrase_set_items?.id || '',
            target_text: pr.phrase_set_items?.target_text || '',
            translation: pr.phrase_set_items?.translation || '',
            phrase_set_id: pr.phrase_set_items?.phrase_set_id || '',
            review: {
                id: pr.id,
                phrase_set_item_id: pr.phrase_set_item_id,
                user_id: pr.user_id,
                status: pr.status,
                strength: pr.strength,
                ease_factor: pr.ease_factor,
                interval_days: pr.interval_days,
                last_reviewed_at: pr.last_reviewed_at,
                next_review_at: pr.next_review_at,
                review_count: pr.review_count,
                correct_count: pr.correct_count,
                incorrect_count: pr.incorrect_count,
            }
        }));

        return {
            awarenessWeak: awarenessWeak || [],
            phraseWeak
        };
    } catch (error) {
        console.error('Error in getWeakItems:', error);
        return { awarenessWeak: [], phraseWeak: [] };
    }
}

/**
 * Get session history with aggregated stats
 */
export async function getSessionHistory(
    languageCode: string,
    limit: number = 20
): Promise<SessionHistoryResult | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    try {
        const { data: sessions, error } = await supabase
            .from('study_sessions')
            .select('*')
            .eq('user_id', user.id)
            .eq('language_code', languageCode)
            .order('started_at', { ascending: false })
            .limit(limit) as any;

        if (error) {
            console.error('Error fetching study sessions:', error);
            return null;
        }

        if (!sessions || sessions.length === 0) {
            return {
                sessions: [],
                aggregates: {
                    totalSessions: 0,
                    totalTime: 0,
                    avgAccuracy: 0,
                    bestStreak: 0
                }
            };
        }

        // Calculate aggregates
        const totalTime = sessions.reduce((sum: number, s: any) => sum + (s.duration_seconds || 0), 0);
        const totalCorrect = sessions.reduce((sum: number, s: any) => sum + (s.items_correct || 0), 0);
        const totalReviewed = sessions.reduce((sum: number, s: any) => sum + (s.items_reviewed || 0), 0);
        const avgAccuracy = totalReviewed > 0 ? (totalCorrect / totalReviewed) * 100 : 0;

        // Calculate best streak (consecutive days with sessions)
        let bestStreak = 0;
        let currentStreak = 0;
        let lastDate: Date | null = null;

        for (const session of sessions) {
            const sessionDate = new Date(session.started_at);
            sessionDate.setHours(0, 0, 0, 0);

            if (!lastDate) {
                currentStreak = 1;
            } else {
                const diffDays = Math.floor((lastDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    currentStreak++;
                } else if (diffDays > 1) {
                    currentStreak = 1;
                }
            }

            bestStreak = Math.max(bestStreak, currentStreak);
            lastDate = sessionDate;
        }

        return {
            sessions: sessions as StudySession[],
            aggregates: {
                totalSessions: sessions.length,
                totalTime,
                avgAccuracy: Math.round(avgAccuracy),
                bestStreak
            }
        };
    } catch (error) {
        console.error('Error in getSessionHistory:', error);
        return null;
    }
}

/**
 * Get review calendar showing review density by date
 */
export async function getReviewCalendar(
    languageCode: string,
    days: number = 30
): Promise<ReviewCalendar | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const now = new Date();
    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    try {
        // Get awareness memos with next_review_at in range
        const { data: awareness, error: awarenessError } = await supabase
            .from('awareness_memos')
            .select('next_review_at')
            .eq('user_id', user.id)
            .eq('language_code', languageCode)
            .not('next_review_at', 'is', null)
            .gte('next_review_at', now.toISOString())
            .lte('next_review_at', endDate.toISOString());

        if (awarenessError) {
            console.error('Error fetching awareness calendar:', awarenessError);
        }

        // Get phrase reviews with next_review_at in range
        const { data: phrases, error: phraseError } = await supabase
            .from('phrase_set_item_reviews')
            .select(`
                next_review_at,
                phrase_set_items!inner (
                    phrase_sets!inner (
                        language_code
                    )
                )
            `)
            .eq('user_id', user.id)
            .eq('phrase_set_items.phrase_sets.language_code', languageCode)
            .not('next_review_at', 'is', null)
            .gte('next_review_at', now.toISOString())
            .lte('next_review_at', endDate.toISOString()) as any;

        if (phraseError) {
            console.error('Error fetching phrase calendar:', phraseError);
        }

        // Build calendar object
        const calendar: ReviewCalendar = {};

        // Count awareness memos by date
        (awareness || []).forEach(item => {
            if (item.next_review_at) {
                const date = item.next_review_at.split('T')[0];
                if (!calendar[date]) {
                    calendar[date] = { awarenessCount: 0, phraseCount: 0, total: 0 };
                }
                calendar[date].awarenessCount++;
                calendar[date].total++;
            }
        });

        // Count phrase items by date
        (phrases || []).forEach((item: any) => {
            if (item.next_review_at) {
                const date = item.next_review_at.split('T')[0];
                if (!calendar[date]) {
                    calendar[date] = { awarenessCount: 0, phraseCount: 0, total: 0 };
                }
                calendar[date].phraseCount++;
                calendar[date].total++;
            }
        });

        return calendar;
    } catch (error) {
        console.error('Error in getReviewCalendar:', error);
        return {};
    }
}
