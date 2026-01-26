'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const ADMIN_PAGE_PATH = '/app/admin/dashboard-data';

// User roles - centralized for consistency
const USER_ROLES = {
    ADMIN: 'admin',
    USER: 'user'
} as const;

// --- Utils ---

// Validate UUID format to prevent injection
function isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

// Sanitize string input (max length, trim)
function sanitizeString(str: string | null, maxLength = 255): string {
    if (!str) return '';
    return str.trim().slice(0, maxLength);
}

export async function checkAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== USER_ROLES.ADMIN) {
        return { success: false, error: 'Not authorized' };
    }

    return { success: true, user };
}

export async function updateUserCoins(formData: FormData) {
    const auth = await checkAdmin();
    if (!auth.success) return { error: auth.error };

    const supabase = await createAdminClient();
    const userId = formData.get('user_id') as string;
    const coins = parseInt(formData.get('coins') as string);

    // Security: Validate user_id format
    if (!userId || !isValidUUID(userId)) {
        return { error: "Invalid user ID format" };
    }

    if (isNaN(coins) || coins < 0) return { error: "Invalid coin amount" };

    const { error } = await supabase.from('profiles').update({ coins }).eq('id', userId);

    if (error) return { error: error.message };

    revalidatePath(ADMIN_PAGE_PATH);
    return { success: true };
}

// --- Levels ---

export async function getLevels() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('levels')
        .select('*')
        .order('level', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
}

export async function createLevel(formData: FormData) {
    const auth = await checkAdmin();
    if (!auth.success) return { error: auth.error };

    const supabase = await createClient();

    const level = parseInt(formData.get('level') as string);
    const xp_threshold = parseInt(formData.get('xp_threshold') as string);

    // Security: Validate numeric inputs
    if (isNaN(level) || level < 1 || level > 1000) {
        return { error: "Invalid level number" };
    }
    if (isNaN(xp_threshold) || xp_threshold < 0) {
        return { error: "Invalid XP threshold" };
    }

    const data = {
        level,
        xp_threshold,
        title: sanitizeString(formData.get('title') as string, 100),
        next_unlock_label: sanitizeString(formData.get('next_unlock_label') as string, 200),
    };

    const { error } = await supabase.from('levels').insert(data);
    if (error) return { error: error.message };

    revalidatePath(ADMIN_PAGE_PATH);
    return { success: true };
}

export async function updateLevel(formData: FormData) {
    const auth = await checkAdmin();
    if (!auth.success) return { error: auth.error };

    const supabase = await createClient();
    const levelId = parseInt(formData.get('level') as string); // PK

    const data = {
        xp_threshold: parseInt(formData.get('xp_threshold') as string),
        title: formData.get('title') as string,
        next_unlock_label: formData.get('next_unlock_label') as string,
    };

    const { error } = await supabase.from('levels').update(data).eq('level', levelId);
    if (error) return { error: error.message };

    revalidatePath(ADMIN_PAGE_PATH);
    return { success: true };
}

export async function deleteLevel(level: number) {
    const auth = await checkAdmin();
    if (!auth.success) return { error: auth.error };

    const supabase = await createClient();
    const { error } = await supabase.from('levels').delete().eq('level', level);
    if (error) return { error: error.message };

    revalidatePath(ADMIN_PAGE_PATH);
    return { success: true };
}

// --- Quests ---

export async function getQuests() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('daily_quest_templates')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
}

export async function createQuest(formData: FormData) {
    const auth = await checkAdmin();
    if (!auth.success) return { error: auth.error };

    const supabase = await createClient();
    const data = {
        quest_key: formData.get('quest_key') as string,
        title: formData.get('title') as string,
        event_type: formData.get('event_type') as string,
        required_count: parseInt(formData.get('required_count') as string) || 1,
        language_code: (formData.get('language_code') as string) || null,
        level_min: formData.get('level_min') ? parseInt(formData.get('level_min') as string) : null,
        level_max: formData.get('level_max') ? parseInt(formData.get('level_max') as string) : null,
        is_active: formData.get('is_active') === 'true',
    };

    const { error } = await supabase.from('daily_quest_templates').insert(data);
    if (error) return { error: error.message };

    revalidatePath(ADMIN_PAGE_PATH);
    return { success: true };
}

export async function updateQuest(formData: FormData) {
    const auth = await checkAdmin();
    if (!auth.success) return { error: auth.error };

    const supabase = await createClient();
    const id = formData.get('id') as string;

    const data = {
        quest_key: formData.get('quest_key') as string,
        title: formData.get('title') as string,
        event_type: formData.get('event_type') as string,
        required_count: parseInt(formData.get('required_count') as string) || 1,
        language_code: (formData.get('language_code') as string) || null,
        level_min: formData.get('level_min') ? parseInt(formData.get('level_min') as string) : null,
        level_max: formData.get('level_max') ? parseInt(formData.get('level_max') as string) : null,
        is_active: formData.get('is_active') === 'true',
    };

    const { error } = await supabase.from('daily_quest_templates').update(data).eq('id', id);
    if (error) return { error: error.message };

    revalidatePath(ADMIN_PAGE_PATH);
    return { success: true };
}

export async function deleteQuest(id: string) {
    const auth = await checkAdmin();
    if (!auth.success) return { error: auth.error };

    const supabase = await createClient();
    const { error } = await supabase.from('daily_quest_templates').delete().eq('id', id);
    if (error) return { error: error.message };

    revalidatePath(ADMIN_PAGE_PATH);
    return { success: true };
}

// --- Badges ---

export async function getBadges() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
}

export async function createBadge(formData: FormData) {
    const auth = await checkAdmin();
    if (!auth.success) return { error: auth.error };

    const supabase = await createClient();
    const data = {
        badge_key: formData.get('badge_key') as string,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        icon: (formData.get('icon') as string) || null,
        is_active: formData.get('is_active') === 'true',
    };

    const { error } = await supabase.from('badges').insert(data);
    if (error) return { error: error.message };

    revalidatePath(ADMIN_PAGE_PATH);
    return { success: true };
}

export async function updateBadge(formData: FormData) {
    const auth = await checkAdmin();
    if (!auth.success) return { error: auth.error };

    const supabase = await createClient();
    const id = formData.get('id') as string;

    const data = {
        badge_key: formData.get('badge_key') as string,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        icon: (formData.get('icon') as string) || null,
        is_active: formData.get('is_active') === 'true',
    };

    const { error } = await supabase.from('badges').update(data).eq('id', id);
    if (error) return { error: error.message };

    revalidatePath(ADMIN_PAGE_PATH);
    return { success: true };
}

export async function deleteBadge(id: string) {
    const auth = await checkAdmin();
    if (!auth.success) return { error: auth.error };

    const supabase = await createClient();
    const { error } = await supabase.from('badges').delete().eq('id', id);
    if (error) return { error: error.message };

    revalidatePath(ADMIN_PAGE_PATH);
    return { success: true };
}

// --- Events ---

export async function getEvents(page = 1, limit = 50, eventType?: string) {
    const auth = await checkAdmin();
    if (!auth.success) throw new Error('Unauthorized'); // Use Admin Bypass Policy

    const supabase = await createClient();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
        .from('learning_events')
        .select('*', { count: 'exact' })
        .order('occurred_at', { ascending: false })
        .range(from, to);

    if (eventType) {
        query = query.eq('event_type', eventType);
    }

    const { data, error, count } = await query;

    if (error) throw new Error(error.message);
    return { data, count };
}

export async function getEventStats() {
    const auth = await checkAdmin();
    if (!auth.success) return { error: 'Unauthorized' };

    const supabase = await createClient();

    // We want counts for specific types. 
    // Since Supabase doesn't do "GROUP BY" easily in JS client without RPC or getting all data,
    // we might need to make separate count calls or use a view. 
    // For now, let's just count the key ones.
    const keyMetrics = [
        'saved_phrase', 'correction_request', 'audio_play', 'text_copy',
        'word_explore', 'explanation_request', 'image_extract',
        'memo_created', 'memo_verified', 'category_select', 'tutorial_complete',
        'nuance_refinement'
    ];

    const stats: Record<string, number> = {};

    // Parallelize count queries
    await Promise.all(keyMetrics.map(async (type) => {
        const { count } = await supabase
            .from('learning_events')
            .select('*', { count: 'exact', head: true })
            .eq('event_type', type);
        stats[type] = count || 0;
    }));

    return { stats };
}

// --- Tools (Seeds) ---

export async function seedEvents(userId: string, languageCode: string, density: number) {
    const auth = await checkAdmin();
    if (!auth.success) return { error: auth.error };

    const supabase = await createClient();

    const events = [];
    const now = new Date();

    // Generate events for past 21 days
    for (let i = 0; i < 21; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        // Skip some days based on density (1=sparse, 3=dense)
        // Simple logic: 
        // Density 1: 30% chance of event
        // Density 2: 60% chance
        // Density 3: 90% chance
        if (Math.random() > (density * 0.3)) continue;

        // Number of events for that day
        const count = Math.floor(Math.random() * (density * 3)) + 1;

        for (let j = 0; j < count; j++) {
            // Random time during the day
            const eventTime = new Date(date);
            eventTime.setHours(8 + Math.floor(Math.random() * 14), Math.floor(Math.random() * 60)); // 8am - 10pm

            events.push({
                user_id: userId,
                language_code: languageCode,
                event_type: 'phrase_viewed', // Default simple event
                xp_delta: 1, // Simple XP
                occurred_at: eventTime.toISOString(),
                meta: { seeded: true }
            });
        }
    }

    if (events.length > 0) {
        const { error } = await supabase.from('learning_events').insert(events);
        if (error) return { error: error.message };
    }

    revalidatePath(ADMIN_PAGE_PATH);
    return { success: true, count: events.length };
}

// --- Users ---

export async function getUsers(page = 1, limit = 50) {
    const auth = await checkAdmin();
    if (!auth.success) throw new Error('Unauthorized');

    const supabase = await createClient();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) throw new Error(error.message);
    return { data, count };
}

export async function getUserStats(userId: string) {
    const auth = await checkAdmin();
    if (!auth.success) return { error: 'Unauthorized' };

    const supabase = await createClient();

    const keyMetrics = [
        'saved_phrase', 'correction_request', 'audio_play', 'text_copy',
        'word_explore', 'explanation_request', 'image_extract',
        'memo_created', 'memo_verified', 'category_select', 'tutorial_complete',
        'nuance_refinement'
    ];

    const stats: Record<string, number> = {};

    // Parallelize count queries
    await Promise.all(keyMetrics.map(async (type) => {
        const { count } = await supabase
            .from('learning_events')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('event_type', type);
        stats[type] = count || 0;
    }));

    return { stats };
}

export async function getUserActivityDetail(userId: string) {
    const auth = await checkAdmin();
    if (!auth.success) return { error: 'Unauthorized' };

    const supabase = await createAdminClient();
    const { data: events, error } = await supabase
        .from('learning_events')
        .select('event_type, language_code')
        .eq('user_id', userId);

    if (error) return { error: error.message };

    const total: Record<string, number> = {};
    const byLanguage: Record<string, Record<string, number>> = {};

    events?.forEach((ev: any) => {
        const type = ev.event_type;
        const lang = ev.language_code || 'unknown';

        total[type] = (total[type] || 0) + 1;

        if (!byLanguage[lang]) byLanguage[lang] = {};
        byLanguage[lang][type] = (byLanguage[lang][type] || 0) + 1;
    });

    return { total, byLanguage };
}

// --- XP Settings ---

export async function getXpSettings() {
    const auth = await checkAdmin();
    if (!auth.success) throw new Error('Unauthorized');

    const supabase = await createClient();
    const { data, error } = await (supabase as any)
        .from('xp_settings')
        .select('*')
        .order('event_type', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
}

export async function createXpSetting(formData: FormData) {
    const auth = await checkAdmin();
    if (!auth.success) return { error: auth.error };

    const supabase = await createClient();
    const data = {
        event_type: formData.get('event_type') as string,
        xp_value: parseInt(formData.get('xp_value') as string) || 0,
        label_ja: formData.get('label_ja') as string || null,
        description: formData.get('description') as string || null,
        is_active: formData.get('is_active') === 'true'
    };

    const { error } = await (supabase as any).from('xp_settings').insert(data);
    if (error) return { error: error.message };

    revalidatePath(ADMIN_PAGE_PATH);
    return { success: true };
}

export async function updateXpSetting(formData: FormData) {
    const auth = await checkAdmin();
    if (!auth.success) return { error: auth.error };

    const supabase = await createClient();
    const eventType = formData.get('event_type') as string;
    const data = {
        xp_value: parseInt(formData.get('xp_value') as string) || 0,
        label_ja: formData.get('label_ja') as string || null,
        description: formData.get('description') as string || null,
        is_active: formData.get('is_active') === 'true'
    };

    const { error } = await (supabase as any)
        .from('xp_settings')
        .update(data)
        .eq('event_type', eventType);

    if (error) return { error: error.message };

    revalidatePath(ADMIN_PAGE_PATH);
    return { success: true };
}

export async function deleteXpSetting(eventType: string) {
    const auth = await checkAdmin();
    if (!auth.success) return { error: auth.error };

    const supabase = await createClient();
    const { error } = await (supabase as any)
        .from('xp_settings')
        .delete()
        .eq('event_type', eventType);

    if (error) return { error: error.message };

    revalidatePath(ADMIN_PAGE_PATH);
    return { success: true };
}

export async function getUserProgress(userId: string) {
    const auth = await checkAdmin();
    if (!auth.success) throw new Error(auth.error);

    const supabase = await createAdminClient();
    const { data, error } = await (supabase as any)
        .from('user_progress')
        .select('*')
        .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return data;
}

export async function recalculateAllUserProgress() {
    const auth = await checkAdmin();
    if (!auth.success) return { error: auth.error };

    const supabase = await createAdminClient();

    // 1. Get XP Settings
    const { data: xpSettingsData } = await (supabase as any)
        .from('xp_settings')
        .select('event_type, xp_value');

    const xpMap = new Map<string, number>();
    xpSettingsData?.forEach((s: any) => xpMap.set(s.event_type, s.xp_value));

    // 2. Get Levels
    const { data: levelsData } = await supabase
        .from('levels')
        .select('*')
        .order('level', { ascending: true });

    // 3. Get All Events
    // Note: In production with millions of rows, use pagination or SQL aggregation.
    const { data: events, error } = await supabase
        .from('learning_events')
        .select('user_id, language_code, event_type, xp_delta, occurred_at');

    if (error) return { error: error.message };

    let matchCount = 0;
    let missCount = 0;
    let totalXpGenerated = 0;

    // 4. Aggregate
    type UserLangKey = string; // "userId:langCode"
    const progressMap = new Map<UserLangKey, {
        userId: string,
        langCode: string,
        xp: number,
        lastActivity: string
    }>();

    events?.forEach((ev: any) => {
        const key = `${ev.user_id}:${ev.language_code}`;
        let current = progressMap.get(key);
        if (!current) {
            current = {
                userId: ev.user_id,
                langCode: ev.language_code,
                xp: 0,
                lastActivity: ev.occurred_at
            };
            progressMap.set(key, current);
        }

        if (xpMap.has(ev.event_type)) matchCount++; else missCount++;
        // Use logged XP if > 0, otherwise lookup settings
        let delta = ev.xp_delta;
        if (!delta || delta === 0) {
            delta = xpMap.get(ev.event_type) || 0;
        }

        current.xp += delta;
        totalXpGenerated += delta;
        if (new Date(ev.occurred_at) > new Date(current.lastActivity)) {
            current.lastActivity = ev.occurred_at;
        }
    });

    // 5. Update DB
    let updateCount = 0;
    let errorCount = 0;
    let lastError = "";

    for (const [key, val] of Array.from(progressMap.entries())) {
        // Calculate Level
        let level = 1;
        if (levelsData) {
            const reachable = levelsData
                .filter((l: any) => l.xp_threshold <= val.xp)
                .pop();
            if (reachable) level = reachable.level;
        }

        const { error: upsertError } = await (supabase as any)
            .from('user_progress')
            .upsert({
                user_id: val.userId,
                language_code: val.langCode,
                xp_total: val.xp,
                current_level: level,
                last_activity_at: val.lastActivity
            }, { onConflict: 'user_id, language_code' });

        if (!upsertError) {
            updateCount++;
        } else {
            errorCount++;
            lastError = upsertError.message;
            console.error("Upsert Error:", upsertError);
        }
    }

    revalidatePath(ADMIN_PAGE_PATH);
    const details = `Events: ${events?.length}, Matched: ${matchCount}, Missed: ${missCount}, XP: ${totalXpGenerated}, Updates: ${updateCount}, Errors: ${errorCount}${lastError ? ` (${lastError})` : ''}`;
    return { success: true, count: updateCount, details };
}

export async function seedXpSettings() {
    const auth = await checkAdmin();
    if (!auth.success) return { error: auth.error };

    const supabase = await createAdminClient();
    // Default settings
    const defaults = [
        { event_type: 'phrase_view', xp_value: 1, label_ja: 'フレーズ閲覧', is_active: true },
        { event_type: 'audio_play', xp_value: 5, label_ja: '音声再生', is_active: true },
        { event_type: 'correction_request', xp_value: 30, label_ja: '添削依頼', is_active: true },
        { event_type: 'memo_created', xp_value: 20, label_ja: 'メモ作成', is_active: true },
        { event_type: 'memo_verified', xp_value: 10, label_ja: 'メモ確認', is_active: true },
        { event_type: 'explanation_request', xp_value: 5, label_ja: '解説リクエスト', is_active: true },
        { event_type: 'text_copy', xp_value: 2, label_ja: 'テキストコピー', is_active: true },
        { event_type: 'word_explore', xp_value: 2, label_ja: '単語探索', is_active: true },
        { event_type: 'tutorial_complete', xp_value: 50, label_ja: 'チュートリアル完了', is_active: true },

        // Compatibility for Seed Data (Space-separated, Camel Case)
        { event_type: 'Audio Play', xp_value: 5, label_ja: '音声再生(Seed)', is_active: true },
        { event_type: 'Text Copy', xp_value: 2, label_ja: 'テキストコピー(Seed)', is_active: true },
        { event_type: 'Saved Phrase', xp_value: 10, label_ja: 'フレーズ保存(Seed)', is_active: true },
        { event_type: 'Explanation Request', xp_value: 5, label_ja: '解説リクエスト(Seed)', is_active: true },
        { event_type: 'Word Explore', xp_value: 2, label_ja: '単語探索(Seed)', is_active: true },
        { event_type: 'Correction Request', xp_value: 30, label_ja: '添削依頼(Seed)', is_active: true },
        { event_type: 'Tutorial Complete', xp_value: 50, label_ja: 'チュートリアル完了(Seed)', is_active: true },
        { event_type: 'Memo Verified', xp_value: 10, label_ja: 'メモ確認(Seed)', is_active: true },
    ];

    const { error } = await (supabase as any).from('xp_settings').upsert(defaults, { onConflict: 'event_type' });

    if (error) return { error: error.message };

    revalidatePath(ADMIN_PAGE_PATH);
    return { success: true };
}



// --- User Credits ---

export async function getUserCredits(page = 1, limit = 50) {
    const auth = await checkAdmin();
    if (!auth.success) throw new Error('Unauthorized');

    const supabase = await createAdminClient();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await supabase
        .from('profiles')
        .select('id, username, audio_credits, explorer_credits, correction_credits, explanation_credits, extraction_credits', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) throw new Error(error.message);
    return { data, count };
}

export async function updateUserCreditBalance(userId: string, updates: { audio_credits?: number, explorer_credits?: number, correction_credits?: number, explanation_credits?: number, extraction_credits?: number }) {
    const auth = await checkAdmin();
    if (!auth.success) return { error: 'Unauthorized' };

    // Security: Validate user_id format
    if (!userId || !isValidUUID(userId)) {
        return { error: "Invalid user ID format" };
    }

    // Security: Validate credit values
    for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined && (typeof value !== 'number' || value < 0 || value > 1000000)) {
            return { error: `Invalid value for ${key}` };
        }
    }

    const supabase = await createAdminClient();

    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);

    if (error) return { error: error.message };

    revalidatePath(ADMIN_PAGE_PATH);
    return { success: true };
}

// --- Tutorials ---

export type TutorialStep = {
    title: string;
    description: string;
    demo_type?: string; // e.g., 'slide_select', 'drag_drop', 'tap_explore', 'prediction_memo', 'audio_play'
    demo_data?: Record<string, any>; // Custom data for the demo component
};

export type Tutorial = {
    id: string;
    native_language: string;
    learning_language: string;
    tutorial_type: string; // e.g., 'phrases', 'corrections', 'app_intro'
    title: string;
    description: string;
    steps: TutorialStep[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export async function getTutorials(nativeLanguage?: string, learningLanguage?: string) {
    const auth = await checkAdmin();
    if (!auth.success) throw new Error('Unauthorized');

    const supabase = await createAdminClient();
    let query = (supabase as any)
        .from('tutorials')
        .select('*')
        .order('created_at', { ascending: false });

    if (nativeLanguage) {
        query = query.eq('native_language', nativeLanguage);
    }
    if (learningLanguage) {
        query = query.eq('learning_language', learningLanguage);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return data as Tutorial[];
}

export async function getTutorial(id: string) {
    const auth = await checkAdmin();
    if (!auth.success) throw new Error('Unauthorized');

    if (!isValidUUID(id)) {
        throw new Error('Invalid tutorial ID');
    }

    const supabase = await createAdminClient();
    const { data, error } = await (supabase as any)
        .from('tutorials')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw new Error(error.message);
    return data as Tutorial;
}

export async function createTutorial(formData: FormData) {
    const auth = await checkAdmin();
    if (!auth.success) return { error: auth.error };

    const supabase = await createAdminClient();

    const stepsJson = formData.get('steps') as string;
    let steps: TutorialStep[] = [];
    try {
        steps = JSON.parse(stepsJson || '[]');
    } catch (e) {
        return { error: 'Invalid steps JSON format' };
    }

    const data = {
        native_language: sanitizeString(formData.get('native_language') as string, 10),
        learning_language: sanitizeString(formData.get('learning_language') as string, 10),
        tutorial_type: sanitizeString(formData.get('tutorial_type') as string, 50),
        title: sanitizeString(formData.get('title') as string, 200),
        description: sanitizeString(formData.get('description') as string, 1000),
        steps: steps,
        is_active: formData.get('is_active') === 'true',
    };

    if (!data.native_language || !data.learning_language || !data.tutorial_type || !data.title) {
        return { error: 'Required fields missing: native_language, learning_language, tutorial_type, title' };
    }

    const { error } = await (supabase as any).from('tutorials').insert(data);
    if (error) return { error: error.message };

    revalidatePath(ADMIN_PAGE_PATH);
    return { success: true };
}

export async function updateTutorial(formData: FormData) {
    const auth = await checkAdmin();
    if (!auth.success) return { error: auth.error };

    const supabase = await createAdminClient();
    const id = formData.get('id') as string;

    if (!isValidUUID(id)) {
        return { error: 'Invalid tutorial ID' };
    }

    const stepsJson = formData.get('steps') as string;
    let steps: TutorialStep[] = [];
    try {
        steps = JSON.parse(stepsJson || '[]');
    } catch (e) {
        return { error: 'Invalid steps JSON format' };
    }

    const data = {
        native_language: sanitizeString(formData.get('native_language') as string, 10),
        learning_language: sanitizeString(formData.get('learning_language') as string, 10),
        tutorial_type: sanitizeString(formData.get('tutorial_type') as string, 50),
        title: sanitizeString(formData.get('title') as string, 200),
        description: sanitizeString(formData.get('description') as string, 1000),
        steps: steps,
        is_active: formData.get('is_active') === 'true',
        updated_at: new Date().toISOString(),
    };

    const { error } = await (supabase as any)
        .from('tutorials')
        .update(data)
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath(ADMIN_PAGE_PATH);
    return { success: true };
}

export async function deleteTutorial(id: string) {
    const auth = await checkAdmin();
    if (!auth.success) return { error: auth.error };

    if (!isValidUUID(id)) {
        return { error: 'Invalid tutorial ID' };
    }

    const supabase = await createAdminClient();
    const { error } = await (supabase as any)
        .from('tutorials')
        .delete()
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath(ADMIN_PAGE_PATH);
    return { success: true };
}

export async function duplicateTutorial(id: string, targetNativeLanguage: string, targetLearningLanguage: string) {
    const auth = await checkAdmin();
    if (!auth.success) return { error: auth.error };

    if (!isValidUUID(id)) {
        return { error: 'Invalid tutorial ID' };
    }

    const supabase = await createAdminClient();

    // Get original tutorial
    const { data: original, error: fetchError } = await (supabase as any)
        .from('tutorials')
        .select('*')
        .eq('id', id)
        .single();

    if (fetchError) return { error: fetchError.message };
    if (!original) return { error: 'Tutorial not found' };

    // Create duplicate with new language pair
    const newTutorial = {
        native_language: sanitizeString(targetNativeLanguage, 10),
        learning_language: sanitizeString(targetLearningLanguage, 10),
        tutorial_type: original.tutorial_type,
        title: original.title + ' (Copy)',
        description: original.description,
        steps: original.steps,
        is_active: false, // Start as inactive
    };

    const { error: insertError } = await (supabase as any).from('tutorials').insert(newTutorial);
    if (insertError) return { error: insertError.message };

    revalidatePath(ADMIN_PAGE_PATH);
    return { success: true };
}
