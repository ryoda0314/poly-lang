
import { createClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

// Define resource types
export type UsageType = 'audio' | 'explorer' | 'correction' | 'explanation';

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

    // 3. Consume
    // Note: This has a race condition (read-modify-write). For strict accounting, use an RPC or Postgres function.
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ [column]: credits - 1 })
        .eq('id', userId);

    if (updateError) {
        console.error("Failed to consume credit:", updateError);
        // Fail open
        return { allowed: true, remaining: credits };
    }

    return { allowed: true, remaining: credits - 1 };
}
