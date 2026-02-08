'use server';

import { createAdminClient } from '@/lib/supabase/server';

// Pricing per 1M tokens by model
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
    // OpenAI
    'default': { input: 1.75, output: 14.00 },
    'gpt-5.2': { input: 1.75, output: 14.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    // Gemini Flash TTS: Input $0.50/1M text tokens, Output $10/1M audio tokens
    'gemini-2.5-flash-preview-tts': { input: 0.50, output: 10.00 },
    // Gemini Pro TTS
    'gemini-2.5-pro-preview-tts': { input: 1.00, output: 20.00 },
};

/**
 * Get pricing for a model
 */
function getPricing(model: string): { input: number; output: number } {
    return MODEL_PRICING[model] || MODEL_PRICING['default'];
}

/**
 * Calculate estimated cost from token counts (internal use only)
 */
function calculateCost(inputTokens: number, outputTokens: number, model?: string): number {
    const pricing = getPricing(model || 'default');
    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    return inputCost + outputCost;
}

export interface TokenUsageLog {
    id?: string;
    user_id: string | null;
    feature: string;
    model: string;
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    created_at?: string;
}

export interface TokenUsageSummary {
    feature: string;
    model: string;
    total_input_tokens: number;
    total_output_tokens: number;
    total_tokens: number;
    request_count: number;
    avg_input_tokens: number;
    avg_output_tokens: number;
    avg_total_tokens: number;
    estimated_cost: number;
    avg_cost_per_request: number;
}

export interface DailyTokenUsage {
    date: string;
    total_input_tokens: number;
    total_output_tokens: number;
    total_tokens: number;
    request_count: number;
}

/**
 * Log OpenAI API token usage to the database
 */
export async function logTokenUsage(
    userId: string | null,
    feature: string,
    model: string,
    inputTokens: number,
    outputTokens: number
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createAdminClient();

        const { error } = await (supabase as any)
            .from('api_token_usage')
            .insert({
                user_id: userId,
                feature,
                model,
                input_tokens: inputTokens,
                output_tokens: outputTokens,
                total_tokens: inputTokens + outputTokens,
            });

        if (error) {
            console.error('Failed to log token usage:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (e: any) {
        console.error('Token usage logging error:', e);
        return { success: false, error: e.message };
    }
}

/**
 * Get token usage summary by feature and model
 */
export async function getTokenUsageSummary(
    startDate?: string,
    endDate?: string
): Promise<{ data: TokenUsageSummary[] | null; error?: string }> {
    try {
        const supabase = await createAdminClient();

        let query = (supabase as any)
            .from('api_token_usage')
            .select('feature, model, input_tokens, output_tokens, total_tokens');

        if (startDate) {
            query = query.gte('created_at', startDate);
        }
        if (endDate) {
            query = query.lte('created_at', endDate);
        }

        const { data, error } = await query;

        if (error) {
            return { data: null, error: error.message };
        }

        // Aggregate by feature and model
        const summaryMap = new Map<string, any>();

        data?.forEach((row: any) => {
            const key = `${row.feature}:${row.model}`;
            const existing = summaryMap.get(key);

            if (existing) {
                existing.total_input_tokens += row.input_tokens;
                existing.total_output_tokens += row.output_tokens;
                existing.total_tokens += row.total_tokens;
                existing.request_count += 1;
            } else {
                summaryMap.set(key, {
                    feature: row.feature,
                    model: row.model,
                    total_input_tokens: row.input_tokens,
                    total_output_tokens: row.output_tokens,
                    total_tokens: row.total_tokens,
                    request_count: 1,
                });
            }
        });

        // Calculate averages and costs
        const result: TokenUsageSummary[] = Array.from(summaryMap.values()).map(item => {
            const estimatedCost = calculateCost(item.total_input_tokens, item.total_output_tokens, item.model);
            return {
                ...item,
                avg_input_tokens: Math.round(item.total_input_tokens / item.request_count),
                avg_output_tokens: Math.round(item.total_output_tokens / item.request_count),
                avg_total_tokens: Math.round(item.total_tokens / item.request_count),
                estimated_cost: estimatedCost,
                avg_cost_per_request: estimatedCost / item.request_count,
            };
        });

        return { data: result };
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

/**
 * Get daily token usage for charts
 */
export async function getDailyTokenUsage(
    days: number = 30
): Promise<{ data: DailyTokenUsage[] | null; error?: string }> {
    try {
        const supabase = await createAdminClient();

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await (supabase as any)
            .from('api_token_usage')
            .select('created_at, input_tokens, output_tokens, total_tokens')
            .gte('created_at', startDate.toISOString());

        if (error) {
            return { data: null, error: error.message };
        }

        // Aggregate by day
        const dailyMap = new Map<string, DailyTokenUsage>();

        data?.forEach((row: any) => {
            const date = new Date(row.created_at).toISOString().split('T')[0];
            const existing = dailyMap.get(date);

            if (existing) {
                existing.total_input_tokens += row.input_tokens;
                existing.total_output_tokens += row.output_tokens;
                existing.total_tokens += row.total_tokens;
                existing.request_count += 1;
            } else {
                dailyMap.set(date, {
                    date,
                    total_input_tokens: row.input_tokens,
                    total_output_tokens: row.output_tokens,
                    total_tokens: row.total_tokens,
                    request_count: 1,
                });
            }
        });

        // Sort by date
        const result = Array.from(dailyMap.values()).sort((a, b) =>
            a.date.localeCompare(b.date)
        );

        return { data: result };
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}

/**
 * Get recent token usage logs
 */
export async function getRecentTokenUsage(
    page: number = 1,
    limit: number = 50
): Promise<{ data: TokenUsageLog[] | null; count: number | null; error?: string }> {
    try {
        const supabase = await createAdminClient();
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error, count } = await (supabase as any)
            .from('api_token_usage')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            return { data: null, count: null, error: error.message };
        }

        return { data, count };
    } catch (e: any) {
        return { data: null, count: null, error: e.message };
    }
}

/**
 * Get total token usage stats
 */
export async function getTotalTokenStats(): Promise<{
    data: {
        total_input_tokens: number;
        total_output_tokens: number;
        total_tokens: number;
        total_requests: number;
        today_tokens: number;
        today_requests: number;
        avg_tokens_per_request: number;
        avg_input_per_request: number;
        avg_output_per_request: number;
        total_estimated_cost: number;
        today_estimated_cost: number;
        avg_cost_per_request: number;
    } | null;
    error?: string;
}> {
    try {
        const supabase = await createAdminClient();

        // Get all-time totals (include model for per-model cost calculation)
        const { data: allData, error: allError } = await (supabase as any)
            .from('api_token_usage')
            .select('input_tokens, output_tokens, total_tokens, model');

        if (allError) {
            return { data: null, error: allError.message };
        }

        // Get today's totals
        const today = new Date().toISOString().split('T')[0];
        const { data: todayData, error: todayError } = await (supabase as any)
            .from('api_token_usage')
            .select('input_tokens, output_tokens, total_tokens, model')
            .gte('created_at', today);

        if (todayError) {
            return { data: null, error: todayError.message };
        }

        let totalEstimatedCost = 0;
        const totals = (allData || []).reduce(
            (acc: any, row: any) => {
                totalEstimatedCost += calculateCost(row.input_tokens || 0, row.output_tokens || 0, row.model);
                return {
                    total_input_tokens: acc.total_input_tokens + (row.input_tokens || 0),
                    total_output_tokens: acc.total_output_tokens + (row.output_tokens || 0),
                    total_tokens: acc.total_tokens + (row.total_tokens || 0),
                    total_requests: acc.total_requests + 1,
                };
            },
            { total_input_tokens: 0, total_output_tokens: 0, total_tokens: 0, total_requests: 0 }
        );

        let todayEstimatedCost = 0;
        const todayTotals = (todayData || []).reduce(
            (acc: any, row: any) => {
                todayEstimatedCost += calculateCost(row.input_tokens || 0, row.output_tokens || 0, row.model);
                return {
                    today_tokens: acc.today_tokens + (row.total_tokens || 0),
                    today_input_tokens: acc.today_input_tokens + (row.input_tokens || 0),
                    today_output_tokens: acc.today_output_tokens + (row.output_tokens || 0),
                    today_requests: acc.today_requests + 1,
                };
            },
            { today_tokens: 0, today_input_tokens: 0, today_output_tokens: 0, today_requests: 0 }
        );

        const avgTokensPerRequest = totals.total_requests > 0
            ? Math.round(totals.total_tokens / totals.total_requests)
            : 0;
        const avgInputPerRequest = totals.total_requests > 0
            ? Math.round(totals.total_input_tokens / totals.total_requests)
            : 0;
        const avgOutputPerRequest = totals.total_requests > 0
            ? Math.round(totals.total_output_tokens / totals.total_requests)
            : 0;

        // Costs already calculated per-model above
        const avgCostPerRequest = totals.total_requests > 0
            ? totalEstimatedCost / totals.total_requests
            : 0;

        return {
            data: {
                ...totals,
                today_tokens: todayTotals.today_tokens,
                today_requests: todayTotals.today_requests,
                avg_tokens_per_request: avgTokensPerRequest,
                avg_input_per_request: avgInputPerRequest,
                avg_output_per_request: avgOutputPerRequest,
                total_estimated_cost: totalEstimatedCost,
                today_estimated_cost: todayEstimatedCost,
                avg_cost_per_request: avgCostPerRequest,
            },
        };
    } catch (e: any) {
        return { data: null, error: e.message };
    }
}
