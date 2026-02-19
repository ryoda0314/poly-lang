
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

const PLAN_LIMITS: Record<string, Record<UsageType, number>> = {
    free: FREE_LIMITS,
    // 会話強化プラン ¥980/月 — speaking, pronunciation, chat, audio, correction, expression
    conversation: {
        ...FREE_LIMITS,
        speaking: 10, pronunciation: 20, chat: 10, audio: 15, correction: 5, expression: 10,
    },
    // アウトプット強化プラン ¥980/月 — correction, chat, speaking, expression, pronunciation
    output: {
        ...FREE_LIMITS,
        correction: 10, chat: 10, speaking: 8, expression: 10, pronunciation: 15,
    },
    // インプット強化プラン ¥980/月 — audio, explorer, extraction, explanation, vocab, expression, grammar
    input: {
        ...FREE_LIMITS,
        audio: 30, explorer: 30, extraction: 3, explanation: 20, vocab: 15, expression: 10, grammar: 10,
    },
    // 受験対策プラン ¥1,480/月 — sentence, explanation, etymology, correction, vocab, audio
    exam: {
        ...FREE_LIMITS,
        explanation: 5, vocab: 15, sentence: 5, etymology: 3, correction: 5, audio: 10,
    },
    // Proプラン ¥2,980/月 — 全機能（各特化プラン同等〜やや上）
    pro: {
        ...FREE_LIMITS,
        audio: 30, pronunciation: 25, explorer: 30, explanation: 10, expression: 15,
        ipa: 30, kanji_hanja: 30, vocab: 15, grammar: 15, extension: 15,
        correction: 10, chat: 15, sentence: 5,
        speaking: 12, extraction: 3, etymology: 5,
    },
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
        return {
            allowed: false,
            planRemaining: 0,
            creditsRemaining: 0,
            error: `今日の${type}上限に達しました。クレジットを購入してください。`
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
