"use server";

import { createClient } from "@/lib/supabase/server";

// ============================================
// Types
// ============================================
// Note: These tables need to be created via migration and types regenerated.
// Using 'any' type assertions until then.
type SupabaseClientAny = Awaited<ReturnType<typeof createClient>> & { from: (table: string) => any };

export type ReviewStatus = 'new' | 'learning' | 'reviewing' | 'mastered';

export interface ItemReview {
    id: string;
    phrase_set_item_id: string;
    user_id: string;
    status: ReviewStatus;
    strength: number;
    ease_factor: number;
    interval_days: number;
    last_reviewed_at: string | null;
    next_review_at: string | null;
    review_count: number;
    correct_count: number;
    incorrect_count: number;
}

export interface PhraseSetProgress {
    phrase_set_id: string;
    new_count: number;
    learning_count: number;
    reviewing_count: number;
    mastered_count: number;
    total_reviews: number;
    total_correct: number;
    avg_strength: number;
    due_count: number;
    total_study_time_seconds: number;
    session_count: number;
    last_studied_at: string | null;
}

export interface UserLearningStats {
    language_code: string;
    total_items: number;
    mastered_items: number;
    learning_items: number;
    total_reviews: number;
    total_correct: number;
    current_streak: number;
    longest_streak: number;
    total_study_time_seconds: number;
    total_sessions: number;
    last_study_date: string | null;
}

export interface StudySession {
    id: string;
    phrase_set_id: string | null;
    language_code: string;
    started_at: string;
    ended_at: string | null;
    duration_seconds: number | null;
    items_reviewed: number;
    items_correct: number;
    items_incorrect: number;
    new_items_learned: number;
    items_mastered: number;
    accuracy_percentage: number;
}

// ============================================
// SM-2 Algorithm Implementation
// ============================================

interface SM2Result {
    newEaseFactor: number;
    newInterval: number;
    newStatus: ReviewStatus;
    newStrength: number;
}

/**
 * Simplified SM-2 algorithm for calculating next review interval
 * @param quality 0-5 rating (0-2 = incorrect, 3-5 = correct with varying ease)
 * @param currentEaseFactor Current ease factor (minimum 1.3)
 * @param currentInterval Current interval in days
 * @param currentStrength Current strength level 0-5
 * @param reviewCount Total number of reviews
 */
function calculateSM2(
    quality: number, // 0 = again, 1 = hard, 2 = good, 3 = easy
    currentEaseFactor: number,
    currentInterval: number,
    currentStrength: number,
    reviewCount: number
): SM2Result {
    // Convert 0-3 quality to 0-5 scale for SM-2
    const q = quality <= 0 ? 0 : quality === 1 ? 2 : quality === 2 ? 3 : 5;

    // Calculate new ease factor
    let newEaseFactor = currentEaseFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (newEaseFactor < 1.3) newEaseFactor = 1.3;

    let newInterval: number;
    let newStrength: number;
    let newStatus: ReviewStatus;

    if (q < 3) {
        // Incorrect response - reset to learning
        newInterval = 0;
        newStrength = Math.max(0, currentStrength - 1);
        newStatus = 'learning';
    } else {
        // Correct response
        if (currentInterval === 0) {
            newInterval = 1;
        } else if (currentInterval === 1) {
            newInterval = 3;
        } else {
            newInterval = Math.round(currentInterval * newEaseFactor);
        }

        // Update strength based on review history
        newStrength = Math.min(5, currentStrength + (q >= 4 ? 1 : 0.5));

        // Determine status based on interval and strength
        if (newStrength >= 4 && newInterval >= 21) {
            newStatus = 'mastered';
        } else if (reviewCount >= 2) {
            newStatus = 'reviewing';
        } else {
            newStatus = 'learning';
        }
    }

    return {
        newEaseFactor,
        newInterval,
        newStatus,
        newStrength: Math.round(newStrength * 10) / 10, // Round to 1 decimal
    };
}

// ============================================
// Server Actions
// ============================================

/**
 * Record a review result for a phrase set item
 */
export async function recordReview(
    phraseSetItemId: string,
    quality: number // 0 = again, 1 = hard, 2 = good, 3 = easy
): Promise<{ success: boolean; review?: ItemReview; error?: string }> {
    const supabase = await createClient() as SupabaseClientAny;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "User not authenticated" };
    }

    try {
        // Get or create review record
        let { data: review, error: fetchError } = await supabase
            .from('phrase_set_item_reviews')
            .select('*')
            .eq('phrase_set_item_id', phraseSetItemId)
            .eq('user_id', user.id)
            .single() as { data: ItemReview | null; error: any };

        const now = new Date().toISOString();

        if (fetchError && fetchError.code === 'PGRST116') {
            // No existing review, create new one
            const { data: newReview, error: insertError } = await supabase
                .from('phrase_set_item_reviews')
                .insert({
                    phrase_set_item_id: phraseSetItemId,
                    user_id: user.id,
                    status: 'new',
                    strength: 0,
                    ease_factor: 2.5,
                    interval_days: 0,
                    review_count: 0,
                    correct_count: 0,
                    incorrect_count: 0,
                })
                .select('*')
                .single() as { data: ItemReview | null; error: any };

            if (insertError) throw insertError;
            review = newReview;
        } else if (fetchError) {
            throw fetchError;
        }

        if (!review) {
            throw new Error('Failed to get or create review record');
        }

        // Calculate new SRS values
        const sm2Result = calculateSM2(
            quality,
            review.ease_factor,
            review.interval_days,
            review.strength,
            review.review_count
        );

        // Calculate next review date
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + sm2Result.newInterval);

        // Update review record
        const isCorrect = quality >= 2;
        const { data: updatedReview, error: updateError } = await supabase
            .from('phrase_set_item_reviews')
            .update({
                status: sm2Result.newStatus,
                strength: sm2Result.newStrength,
                ease_factor: sm2Result.newEaseFactor,
                interval_days: sm2Result.newInterval,
                last_reviewed_at: now,
                next_review_at: sm2Result.newInterval > 0 ? nextReviewDate.toISOString() : null,
                review_count: review.review_count + 1,
                correct_count: isCorrect ? review.correct_count + 1 : review.correct_count,
                incorrect_count: isCorrect ? review.incorrect_count : review.incorrect_count + 1,
            })
            .eq('id', review.id)
            .select('*')
            .single() as { data: ItemReview | null; error: any };

        if (updateError) throw updateError;

        return { success: true, review: updatedReview as ItemReview };
    } catch (error) {
        console.error('Failed to record review:', error);
        return { success: false, error: 'Failed to record review' };
    }
}

/**
 * Start a new study session
 */
export async function startStudySession(
    phraseSetId: string,
    languageCode: string
): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    const supabase = await createClient() as SupabaseClientAny;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "User not authenticated" };
    }

    const { data, error } = await supabase
        .from('study_sessions')
        .insert({
            user_id: user.id,
            phrase_set_id: phraseSetId,
            language_code: languageCode,
            started_at: new Date().toISOString(),
        })
        .select('id')
        .single() as { data: { id: string } | null; error: any };

    if (error) {
        console.error('Failed to start study session:', error);
        return { success: false, error: 'Failed to start study session' };
    }

    return { success: true, sessionId: data?.id };
}

/**
 * End a study session and record statistics
 */
export async function endStudySession(
    sessionId: string,
    stats: {
        itemsReviewed: number;
        itemsCorrect: number;
        itemsIncorrect: number;
        newItemsLearned: number;
        itemsMastered: number;
    }
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient() as SupabaseClientAny;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "User not authenticated" };
    }

    // Get session start time
    const { data: session, error: fetchError } = await supabase
        .from('study_sessions')
        .select('started_at, phrase_set_id, language_code')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single() as { data: { started_at: string; phrase_set_id: string | null; language_code: string } | null; error: any };

    if (fetchError || !session) {
        return { success: false, error: 'Session not found' };
    }

    const endedAt = new Date();
    const startedAt = new Date(session.started_at);
    const durationSeconds = Math.round((endedAt.getTime() - startedAt.getTime()) / 1000);

    // Update session
    const { error: updateError } = await supabase
        .from('study_sessions')
        .update({
            ended_at: endedAt.toISOString(),
            duration_seconds: durationSeconds,
            items_reviewed: stats.itemsReviewed,
            items_correct: stats.itemsCorrect,
            items_incorrect: stats.itemsIncorrect,
            new_items_learned: stats.newItemsLearned,
            items_mastered: stats.itemsMastered,
        })
        .eq('id', sessionId);

    if (updateError) {
        console.error('Failed to end study session:', updateError);
        return { success: false, error: 'Failed to end study session' };
    }

    // Update phrase set progress
    if (session.phrase_set_id) {
        await updatePhraseSetProgress(session.phrase_set_id, user.id, durationSeconds);
    }

    // Update user learning stats
    await updateUserLearningStats(user.id, session.language_code, stats, durationSeconds);

    return { success: true };
}

/**
 * Update phrase set progress after a session
 */
async function updatePhraseSetProgress(
    phraseSetId: string,
    userId: string,
    sessionDuration: number
): Promise<void> {
    const supabase = await createClient() as SupabaseClientAny;

    // Get all items in the phrase set first
    const { data: items } = await supabase
        .from('phrase_set_items')
        .select('id')
        .eq('phrase_set_id', phraseSetId) as { data: { id: string }[] | null };

    const itemIds = items?.map(i => i.id) || [];

    // Get current item counts by status
    const { data: reviewCounts } = await supabase
        .from('phrase_set_item_reviews')
        .select('status, strength')
        .eq('user_id', userId)
        .in('phrase_set_item_id', itemIds) as { data: { status: string; strength: number }[] | null };

    // Count items by status
    const counts = {
        new: 0,
        learning: 0,
        reviewing: 0,
        mastered: 0,
    };
    let totalStrength = 0;
    let reviewedCount = 0;

    if (reviewCounts) {
        reviewCounts.forEach(r => {
            counts[r.status as ReviewStatus]++;
            totalStrength += r.strength || 0;
            reviewedCount++;
        });
    }

    // Calculate new items (not yet reviewed)
    const newCount = itemIds.length - reviewedCount;

    // Get due count
    const now = new Date().toISOString();
    const { count: dueCount } = await supabase
        .from('phrase_set_item_reviews')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .lte('next_review_at', now)
        .in('phrase_set_item_id', itemIds) as { count: number | null };

    // Upsert progress
    await supabase
        .from('phrase_set_progress')
        .upsert({
            phrase_set_id: phraseSetId,
            user_id: userId,
            new_count: newCount + counts.new,
            learning_count: counts.learning,
            reviewing_count: counts.reviewing,
            mastered_count: counts.mastered,
            avg_strength: reviewedCount > 0 ? totalStrength / reviewedCount : 0,
            due_count: dueCount || 0,
            total_study_time_seconds: sessionDuration,
            session_count: 1,
            last_studied_at: new Date().toISOString(),
        }, {
            onConflict: 'phrase_set_id,user_id',
        });
}

/**
 * Update user learning statistics
 */
async function updateUserLearningStats(
    userId: string,
    languageCode: string,
    stats: {
        itemsReviewed: number;
        itemsCorrect: number;
        newItemsLearned: number;
        itemsMastered: number;
    },
    sessionDuration: number
): Promise<void> {
    const supabase = await createClient() as SupabaseClientAny;

    // Define the shape of existing stats
    interface ExistingStats {
        id: string;
        current_streak: number;
        longest_streak: number;
        streak_start_date: string | null;
        last_study_date: string | null;
        total_items: number;
        mastered_items: number;
        learning_items: number;
        total_reviews: number;
        total_correct: number;
        total_study_time_seconds: number;
        total_sessions: number;
    }

    // Get existing stats
    const { data: existing } = await supabase
        .from('user_learning_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('language_code', languageCode)
        .single() as { data: ExistingStats | null };

    const today = new Date().toISOString().split('T')[0];

    if (existing) {
        // Calculate streak
        let currentStreak = existing.current_streak;
        let longestStreak = existing.longest_streak;
        let streakStartDate = existing.streak_start_date;

        if (existing.last_study_date) {
            const lastStudy = new Date(existing.last_study_date);
            const todayDate = new Date(today);
            const diffDays = Math.floor((todayDate.getTime() - lastStudy.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Consecutive day
                currentStreak++;
                if (currentStreak > longestStreak) {
                    longestStreak = currentStreak;
                }
            } else if (diffDays > 1) {
                // Streak broken
                currentStreak = 1;
                streakStartDate = today;
            }
            // diffDays === 0 means same day, streak unchanged
        } else {
            // First study
            currentStreak = 1;
            streakStartDate = today;
        }

        await supabase
            .from('user_learning_stats')
            .update({
                total_items: existing.total_items + stats.newItemsLearned,
                mastered_items: existing.mastered_items + stats.itemsMastered,
                learning_items: existing.learning_items + stats.newItemsLearned - stats.itemsMastered,
                total_reviews: existing.total_reviews + stats.itemsReviewed,
                total_correct: existing.total_correct + stats.itemsCorrect,
                current_streak: currentStreak,
                longest_streak: longestStreak,
                total_study_time_seconds: existing.total_study_time_seconds + sessionDuration,
                total_sessions: existing.total_sessions + 1,
                last_study_date: today,
                streak_start_date: streakStartDate,
            })
            .eq('id', existing.id);
    } else {
        // Create new stats record
        await supabase
            .from('user_learning_stats')
            .insert({
                user_id: userId,
                language_code: languageCode,
                total_items: stats.newItemsLearned,
                mastered_items: stats.itemsMastered,
                learning_items: stats.newItemsLearned - stats.itemsMastered,
                total_reviews: stats.itemsReviewed,
                total_correct: stats.itemsCorrect,
                current_streak: 1,
                longest_streak: 1,
                total_study_time_seconds: sessionDuration,
                total_sessions: 1,
                last_study_date: today,
                streak_start_date: today,
            });
    }
}

/**
 * Get progress for a specific phrase set
 */
export async function getPhraseSetProgress(
    phraseSetId: string
): Promise<PhraseSetProgress | null> {
    const supabase = await createClient() as SupabaseClientAny;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
        .from('phrase_set_progress')
        .select('*')
        .eq('phrase_set_id', phraseSetId)
        .eq('user_id', user.id)
        .single() as { data: PhraseSetProgress | null; error: any };

    if (error) return null;
    return data;
}

/**
 * Get learning statistics for a language
 */
export async function getUserLearningStats(
    languageCode: string
): Promise<UserLearningStats | null> {
    const supabase = await createClient() as SupabaseClientAny;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
        .from('user_learning_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('language_code', languageCode)
        .single() as { data: UserLearningStats | null; error: any };

    if (error) return null;
    return data;
}

/**
 * Get recent study sessions
 */
export async function getRecentStudySessions(
    limit: number = 10
): Promise<StudySession[]> {
    const supabase = await createClient() as SupabaseClientAny;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(limit) as { data: StudySession[] | null; error: any };

    if (error) return [];
    return data || [];
}

/**
 * Get items due for review in a phrase set
 */
export async function getDueItems(
    phraseSetId: string
): Promise<string[]> {
    const supabase = await createClient() as SupabaseClientAny;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    // Get all items in the phrase set first
    const { data: items } = await supabase
        .from('phrase_set_items')
        .select('id')
        .eq('phrase_set_id', phraseSetId) as { data: { id: string }[] | null };

    const itemIds = items?.map(i => i.id) || [];
    if (itemIds.length === 0) return [];

    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('phrase_set_item_reviews')
        .select('phrase_set_item_id')
        .eq('user_id', user.id)
        .lte('next_review_at', now)
        .in('phrase_set_item_id', itemIds) as { data: { phrase_set_item_id: string }[] | null; error: any };

    if (error || !data) return [];
    return data.map(d => d.phrase_set_item_id);
}

/**
 * Get all item reviews for a phrase set
 */
export async function getItemReviews(
    phraseSetId: string
): Promise<ItemReview[]> {
    const supabase = await createClient() as SupabaseClientAny;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    // Get all items in the phrase set
    const { data: items } = await supabase
        .from('phrase_set_items')
        .select('id')
        .eq('phrase_set_id', phraseSetId) as { data: { id: string }[] | null };

    if (!items || items.length === 0) return [];

    const itemIds = items.map(i => i.id);

    const { data, error } = await supabase
        .from('phrase_set_item_reviews')
        .select('*')
        .eq('user_id', user.id)
        .in('phrase_set_item_id', itemIds) as { data: ItemReview[] | null; error: any };

    if (error) return [];
    return data || [];
}
