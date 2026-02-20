
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

// Define resource types
export type UsageType =
    | 'audio' | 'explorer' | 'correction' | 'explanation' | 'extraction' | 'etymology'
    | 'chat' | 'expression' | 'vocab' | 'grammar' | 'extension' | 'script' | 'sentence' | 'kanji_hanja' | 'ipa'
    | 'pronunciation' | 'speaking';

// Plan-based daily limits
// 含まれない機能は free と同じリミット
const FREE_LIMITS: Record<UsageType, number> = {
    // 課金対象機能（基本のみ）
    audio: 5, pronunciation: 0, speaking: 0, explorer: 5, chat: 0, correction: 2,
    expression: 0, explanation: 1, grammar: 0, vocab: 0, sentence: 0, extraction: 0, etymology: 0,
    // ユーティリティ（全プラン共通・実質無料）
    script: 50, kanji_hanja: 30, ipa: 5, extension: 0,
};

// 有料プランは日制限なし → 月間クレジットプール (PLAN_MONTHLY_CREDITS) で管理
// invoice.paid webhook で毎月クレジット付与
const PAID_ZERO: Record<UsageType, number> = {
    audio: 0, pronunciation: 0, speaking: 0, explorer: 0, chat: 0, correction: 0,
    expression: 0, explanation: 0, grammar: 0, vocab: 0, sentence: 0, extraction: 0,
    etymology: 0, script: 0, kanji_hanja: 0, ipa: 0, extension: 0,
};

const PLAN_LIMITS: Record<string, Record<UsageType, number>> = {
    free: FREE_LIMITS,
    conversation: PAID_ZERO,
    output: PAID_ZERO,
    input: PAID_ZERO,
    exam: PAID_ZERO,
    pro: PAID_ZERO,
};

// Map UsageType to daily_usage column names
const USAGE_COLUMNS: Record<UsageType, string> = {
    audio: 'audio_count',
    explorer: 'explorer_count',
    correction: 'correction_count',
    extraction: 'extraction_count',
    explanation: 'explanation_count',
    etymology: 'etymology_count',
    chat: 'chat_count',
    expression: 'expression_count',
    vocab: 'vocab_count',
    grammar: 'grammar_count',
    extension: 'extension_count',
    script: 'script_count',
    sentence: 'sentence_count',
    kanji_hanja: 'kanji_hanja_count',
    ipa: 'ipa_count',
    pronunciation: 'pronunciation_count',
    speaking: 'speaking_count'
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
    const extraCreditColumn = `extra_${type}_credits`;
    const usageColumn = USAGE_COLUMNS[type];

    // 1. Get profile (plan + extra credits) and today's usage in parallel
    const [profileResult, usageResult] = await Promise.all([
        supabase
            .from('profiles')
            .select(`subscription_plan, ${creditColumn}, ${extraCreditColumn}`)
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
    const planCredits = (profile as any)?.[creditColumn] || 0;
    const extraCredits = (profile as any)?.[extraCreditColumn] || 0;
    const credits = planCredits + extraCredits;

    // 2. Try to use plan limit first
    if (planRemaining > 0) {
        // Atomic increment via RPC to prevent race conditions (TOCTOU)
        // If row doesn't exist, INSERT with count=1; if exists, increment atomically
        const adminClient = await createAdminClient();
        const { data: rpcResult, error: rpcError } = await (adminClient as any)
            .rpc('increment_daily_usage', {
                p_user_id: userId,
                p_date: todayStr,
                p_column: usageColumn,
                p_limit: planLimit
            });

        if (rpcError) {
            // Fallback: if RPC fails due to missing function (42883) or missing column (42703), use upsert
            if (rpcError.code === '42883' || rpcError.code === '42703') {
                const { error: upsertError } = await (adminClient as any)
                    .from('daily_usage')
                    .upsert(
                        {
                            user_id: userId,
                            date: todayStr,
                            [usageColumn]: todayUsed + 1,
                            ...(dailyUsage ? {} : {
                                audio_count: type === 'audio' ? 1 : 0,
                                explorer_count: type === 'explorer' ? 1 : 0,
                                correction_count: type === 'correction' ? 1 : 0,
                                extraction_count: type === 'extraction' ? 1 : 0,
                                explanation_count: type === 'explanation' ? 1 : 0,
                                etymology_count: type === 'etymology' ? 1 : 0,
                                chat_count: type === 'chat' ? 1 : 0,
                                expression_count: type === 'expression' ? 1 : 0,
                                vocab_count: type === 'vocab' ? 1 : 0,
                                grammar_count: type === 'grammar' ? 1 : 0,
                                extension_count: type === 'extension' ? 1 : 0,
                                script_count: type === 'script' ? 1 : 0,
                                sentence_count: type === 'sentence' ? 1 : 0,
                                kanji_hanja_count: type === 'kanji_hanja' ? 1 : 0,
                                ipa_count: type === 'ipa' ? 1 : 0,
                                pronunciation_count: type === 'pronunciation' ? 1 : 0,
                                speaking_count: type === 'speaking' ? 1 : 0
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
            } else if (rpcError.message?.includes('limit exceeded')) {
                // RPC denied because concurrent request already hit the limit
                return {
                    allowed: false,
                    planRemaining: 0,
                    creditsRemaining: credits,
                    error: `今日の${type}上限に達しました。クレジットを購入してください。`
                };
            } else {
                console.error("Error in atomic increment:", rpcError);
                return {
                    allowed: false,
                    planRemaining,
                    creditsRemaining: credits,
                    error: "使用量の記録に失敗しました。しばらくしてから再試行してください。"
                };
            }
        } else if (rpcResult === false) {
            // RPC returned false = limit was already reached
            return {
                allowed: false,
                planRemaining: 0,
                creditsRemaining: credits,
                error: `今日の${type}上限に達しました。クレジットを購入してください。`
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
        const isFree = plan === 'free';
        return {
            allowed: false,
            planRemaining: 0,
            creditsRemaining: 0,
            error: isFree
                ? `今日の${type}上限に達しました。クレジットを購入してください。`
                : `${type}クレジットが不足しています。ショップで追加購入できます。`
        };
    }

    // 4. Consume credit atomically via RPC (prevents double-spend)
    const adminClient = await createAdminClient();
    const { data: rpcCredits, error: rpcCreditError } = await (adminClient as any)
        .rpc('consume_credit', {
            p_user_id: userId,
            p_credit_column: creditColumn
        });

    if (rpcCreditError) {
        // Fallback: if RPC fails due to missing function (42883) or missing column (42703), use direct update
        if (rpcCreditError.code === '42883' || rpcCreditError.code === '42703') {
            const { data: updated, error: updateError } = await supabase
                .from('profiles')
                .update({ [creditColumn]: credits - 1 })
                .eq('id', userId)
                .gt(creditColumn, 0)
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

        console.error("Error in atomic credit consumption:", rpcCreditError);
        return {
            allowed: false,
            planRemaining: 0,
            creditsRemaining: credits,
            error: `クレジットの消費に失敗しました。`
        };
    }

    if (rpcCredits === -1) {
        return {
            allowed: false,
            planRemaining: 0,
            creditsRemaining: 0,
            error: `クレジットが不足しています。`
        };
    }

    return {
        allowed: true,
        source: 'credits',
        remaining: rpcCredits,
        planRemaining: 0,
        creditsRemaining: rpcCredits
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
    const extraCreditColumn = `extra_${type}_credits`;
    const usageColumn = USAGE_COLUMNS[type];

    const [profileResult, usageResult] = await Promise.all([
        supabase
            .from('profiles')
            .select(`subscription_plan, ${creditColumn}, ${extraCreditColumn}`)
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
    const planCredits = (profile as any)?.[creditColumn] || 0;
    const extraCredits = (profile as any)?.[extraCreditColumn] || 0;

    return {
        plan,
        planLimit,
        todayUsed,
        planRemaining,
        credits: planCredits + extraCredits,
        planCredits,
        extraCredits,
        canUse: planRemaining > 0 || planCredits + extraCredits > 0
    };
}
