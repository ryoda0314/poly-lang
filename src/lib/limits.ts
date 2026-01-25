
import { createClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

// Define resource types
export type UsageType = 'audio' | 'explorer' | 'correction' | 'explanation' | 'extraction';

export async function checkAndConsumeCredit(
    userId: string,
    type: UsageType,
    supabaseClient?: SupabaseClient
) {
    const supabase = supabaseClient || await createClient();

    const column = `${type}_credits`;

    // 1. Get current credits
    const { data: profile, error } = await supabase
        .from('profiles')
        .select(column)
        .eq('id', userId)
        .single();

    if (error) {
        console.error("Error fetching credits:", error);
        // Fail open if we can't check
        return { allowed: true, remaining: 999 };
    }

    const credits = (profile as any)?.[column] || 0;

    // 2. Check balance
    if (credits <= 0) {
        return {
            allowed: false,
            error: `Insufficient ${type} credits.`
        };
    }

    // 3. Consume atomically using conditional update
    // This prevents race conditions by only decrementing if credits > 0
    const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update({ [column]: credits - 1 })
        .eq('id', userId)
        .gt(column, 0)  // Only update if credits > 0 (atomic check)
        .select(column)
        .single();

    if (updateError || !updated) {
        // Update failed - likely race condition, credits already depleted
        return {
            allowed: false,
            error: `Insufficient ${type} credits.`
        };
    }

    return { allowed: true, remaining: (updated as any)?.[column] ?? 0 };
}
