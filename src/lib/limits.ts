
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

// Define resource types
export type UsageType = 'audio' | 'explorer' | 'correction' | 'explanation' | 'extraction' | 'etymology';

// Plan-based daily limits
const PLAN_LIMITS: Record<string, Record<UsageType, number>> = {
    free: { audio: 7, explorer: 7, correction: 3, extraction: 0, explanation: 1, etymology: 3 },
    standard: { audio: 30, explorer: 30, correction: 10, extraction: 10, explanation: 30, etymology: 15 },
    pro: { audio: 100, explorer: 100, correction: 30, extraction: 30, explanation: 100, etymology: 50 }
};

// Map UsageType to daily_usage column names
const USAGE_COLUMNS: Record<UsageType, string> = {
    audio: 'audio_count',
    explorer: 'explorer_count',
    correction: 'correction_count',
    extraction: 'extraction_count',
    explanation: 'explanation_count',
    etymology: 'etymology_count'
};

export interface ConsumeResult {
    allowed: boolean;
    source?: 'plan' | 'credits';  // Where the usage came from
    remaining?: number;           // Remaining (plan limit or credits depending on source)
    planRemaining?: number;       // Remaining plan limit for today
    creditsRemaining?: number;    // Remaining purchased credits
    error?: string;
}

export async function checkAndConsumeCredit(
    userId: string,
    type: UsageType,
    supabaseClient?: SupabaseClient
): Promise<ConsumeResult> {
    const supabase = supabaseClient || await createClient();
    const todayStr = new Date().toISOString().split('T')[0];
    const creditColumn = `${type}_credits`;
    const usageColumn = USAGE_COLUMNS[type];

    // 1. Get profile (plan + credits) and today's usage in parallel
    const [profileResult, usageResult] = await Promise.all([
        supabase
            .from('profiles')
            .select(`subscription_plan, ${creditColumn}`)
            .eq('id', userId)
            .single(),
        (supabase as any)
            .from('daily_usage')
            .select('*')
            .eq('user_id', userId)
            .eq('date', todayStr)
            .single()
    ]);

    if (profileResult.error) {
        console.error("Error fetching profile:", profileResult.error);
        // Fail closed - deny access if we can't verify limits
        return { allowed: false, remaining: 0, error: 'Failed to verify usage limits' };
    }

    const profile = profileResult.data;
    const dailyUsage = usageResult.data;

    const plan = (profile as any)?.subscription_plan || 'free';
    const planLimit = PLAN_LIMITS[plan]?.[type] ?? PLAN_LIMITS.free[type];
    const todayUsed = dailyUsage?.[usageColumn] || 0;
    const planRemaining = Math.max(0, planLimit - todayUsed);
    const credits = (profile as any)?.[creditColumn] || 0;

    // 2. Try to use plan limit first
    if (planRemaining > 0) {
        // Upsert daily_usage to increment the count (requires admin client due to RLS)
        const adminClient = await createAdminClient();
        const { error: upsertError } = await (adminClient as any)
            .from('daily_usage')
            .upsert(
                {
                    user_id: userId,
                    date: todayStr,
                    [usageColumn]: todayUsed + 1,
                    // Preserve other counts if row exists
                    ...(dailyUsage ? {} : {
                        audio_count: type === 'audio' ? 1 : 0,
                        explorer_count: type === 'explorer' ? 1 : 0,
                        correction_count: type === 'correction' ? 1 : 0,
                        extraction_count: type === 'extraction' ? 1 : 0,
                        explanation_count: type === 'explanation' ? 1 : 0,
                        etymology_count: type === 'etymology' ? 1 : 0
                    })
                },
                { onConflict: 'user_id,date' }
            );

        if (upsertError) {
            console.error("Error updating daily usage:", upsertError);
            return {
                allowed: false,
                planRemaining,
                creditsRemaining: credits,
                error: "使用量の記録に失敗しました。しばらくしてから再試行してください。"
            };
        }

        return {
            allowed: true,
            source: 'plan',
            remaining: planRemaining - 1,
            planRemaining: planRemaining - 1,
            creditsRemaining: credits
        };
    }

    // 3. Plan limit exhausted - try to consume credits
    if (credits <= 0) {
        return {
            allowed: false,
            planRemaining: 0,
            creditsRemaining: 0,
            error: `今日の${type}上限に達しました。クレジットを購入してください。`
        };
    }

    // 4. Consume credit atomically
    const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update({ [creditColumn]: credits - 1 })
        .eq('id', userId)
        .gt(creditColumn, 0)  // Only update if credits > 0 (atomic check)
        .select(creditColumn)
        .single();

    if (updateError || !updated) {
        return {
            allowed: false,
            planRemaining: 0,
            creditsRemaining: 0,
            error: `クレジットが不足しています。`
        };
    }

    const newCredits = (updated as any)?.[creditColumn] ?? 0;

    return {
        allowed: true,
        source: 'credits',
        remaining: newCredits,
        planRemaining: 0,
        creditsRemaining: newCredits
    };
}

/**
 * Get current usage status without consuming
 */
export async function getUsageStatus(
    userId: string,
    type: UsageType,
    supabaseClient?: SupabaseClient
) {
    const supabase = supabaseClient || await createClient();
    const todayStr = new Date().toISOString().split('T')[0];
    const creditColumn = `${type}_credits`;
    const usageColumn = USAGE_COLUMNS[type];

    const [profileResult, usageResult] = await Promise.all([
        supabase
            .from('profiles')
            .select(`subscription_plan, ${creditColumn}`)
            .eq('id', userId)
            .single(),
        (supabase as any)
            .from('daily_usage')
            .select('*')
            .eq('user_id', userId)
            .eq('date', todayStr)
            .single()
    ]);

    const profile = profileResult.data;
    const dailyUsage = usageResult.data;

    const plan = (profile as any)?.subscription_plan || 'free';
    const planLimit = PLAN_LIMITS[plan]?.[type] ?? PLAN_LIMITS.free[type];
    const todayUsed = dailyUsage?.[usageColumn] || 0;
    const planRemaining = Math.max(0, planLimit - todayUsed);
    const credits = (profile as any)?.[creditColumn] || 0;

    return {
        plan,
        planLimit,
        todayUsed,
        planRemaining,
        credits,
        canUse: planRemaining > 0 || credits > 0
    };
}
