'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const ADMIN_PAGE_PATH = '/app/admin/dashboard-data';

// --- Utils ---

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

    if (profile?.role !== 'admin') {
        return { success: false, error: 'Not authorized' };
    }

    return { success: true, user };
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
    const data = {
        level: parseInt(formData.get('level') as string),
        xp_threshold: parseInt(formData.get('xp_threshold') as string),
        title: formData.get('title') as string,
        next_unlock_label: formData.get('next_unlock_label') as string,
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
        'word_explore', 'explanation_request',
        'memo_created', 'memo_verified', 'category_select', 'tutorial_complete'
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
        'word_explore', 'explanation_request',
        'memo_created', 'memo_verified', 'category_select', 'tutorial_complete'
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
