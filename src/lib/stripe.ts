import Stripe from 'stripe';

let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
    if (!_stripe) {
        _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: '2026-01-28.clover',
        });
    }
    return _stripe;
}

// Plan ID → Stripe Price ID
export const PLAN_PRICE_MAP: Record<string, string> = {
    conversation: process.env.STRIPE_PRICE_CONVERSATION!,  // ¥980/月
    output: process.env.STRIPE_PRICE_OUTPUT!,              // ¥980/月
    input: process.env.STRIPE_PRICE_INPUT!,                // ¥1,480/月
    exam: process.env.STRIPE_PRICE_EXAM!,                  // ¥1,480/月
    pro: process.env.STRIPE_PRICE_PRO!,                    // ¥2,980/月
};

// コインパック（Stripe一括決済 → coins付与）
export interface CoinPack {
    id: string;
    coins: number;
    priceYen: number;
    bonus: number;
    stripePriceId: string;
}

export const COIN_PACKS: CoinPack[] = [
    { id: 'coin_100',   coins: 100,   priceYen: 100,   bonus: 0,  stripePriceId: process.env.STRIPE_PRICE_COIN_100! },
    { id: 'coin_300',   coins: 300,   priceYen: 300,   bonus: 0,  stripePriceId: process.env.STRIPE_PRICE_COIN_300! },
    { id: 'coin_500',   coins: 500,   priceYen: 500,   bonus: 0,  stripePriceId: process.env.STRIPE_PRICE_COIN_500! },
    { id: 'coin_1100',  coins: 1100,  priceYen: 1000,  bonus: 10, stripePriceId: process.env.STRIPE_PRICE_COIN_1100! },
    { id: 'coin_3600',  coins: 3600,  priceYen: 3000,  bonus: 20, stripePriceId: process.env.STRIPE_PRICE_COIN_3600! },
    { id: 'coin_6500',  coins: 6500,  priceYen: 5000,  bonus: 30, stripePriceId: process.env.STRIPE_PRICE_COIN_6500! },
];

export const COIN_PACK_MAP: Record<string, CoinPack> = Object.fromEntries(
    COIN_PACKS.map(p => [p.id, p])
);

// サブスク月間クレジットプール（プランID → カラム → 月間付与量）
// 全プラン100%使用でも粗利45%以上を確保
export const PLAN_MONTHLY_CREDITS: Record<string, Record<string, number>> = {
    // 会話強化 ¥980/月 — 粗利46%, 割引43%
    conversation: {
        speaking_credits: 150,
        pronunciation_credits: 300,
        audio_credits: 200,
        chat_credits: 200,
        correction_credits: 80,
        expression_credits: 80,
        script_credits: 1000,       // ユーティリティ（実質無料: ¥0.01/回）
        kanji_hanja_credits: 500,   // ユーティリティ（実質無料: ¥0.01/回）
    },
    // アウトプット強化 ¥980/月 — 粗利52%, 割引31%
    output: {
        correction_credits: 100,
        chat_credits: 200,
        speaking_credits: 120,
        expression_credits: 80,
        pronunciation_credits: 250,
        script_credits: 1000,
        kanji_hanja_credits: 500,
    },
    // インプット強化 ¥1,480/月 — 粗利46%, 割引35%
    input: {
        audio_credits: 500,
        explorer_credits: 500,
        explanation_credits: 80,
        expression_credits: 120,
        grammar_credits: 60,
        vocab_credits: 300,
        extraction_credits: 30,
        script_credits: 1000,
        kanji_hanja_credits: 500,
    },
    // 受験対策 ¥1,480/月 — 粗利45%, 割引32%
    exam: {
        sentence_credits: 15,
        explanation_credits: 40,
        vocab_credits: 600,
        etymology_credits: 20,
        correction_credits: 100,
        audio_credits: 500,
        ipa_credits: 200,
        script_credits: 1000,
        kanji_hanja_credits: 500,
    },
    // Pro ¥2,980/月 — 粗利47%, 割引28%
    pro: {
        audio_credits: 300,
        pronunciation_credits: 250,
        explorer_credits: 300,
        explanation_credits: 60,
        expression_credits: 150,
        ipa_credits: 300,
        vocab_credits: 300,
        grammar_credits: 80,
        extension_credits: 200,
        correction_credits: 120,
        chat_credits: 200,
        sentence_credits: 20,
        speaking_credits: 100,
        extraction_credits: 20,
        etymology_credits: 25,
        script_credits: 1000,
        kanji_hanja_credits: 500,
    },
};

// 単品購入クレジット付与量 (per ¥100)
// 実コストはダッシュボード実測値 (2026-02-19)
export const SINGLE_PURCHASE_CREDITS: Record<string, { column: string; amount: number }> = {
    // ── Core (¥1/回 = 100回/¥100) ──
    single_audio: { column: 'audio_credits', amount: 100 },           // 実コスト¥0.28, 粗利72%
    single_pronunciation: { column: 'pronunciation_credits', amount: 100 }, // 実コスト¥0.30, 粗利70%
    single_explorer: { column: 'explorer_credits', amount: 100 },     // 実コスト¥0.05, 粗利95% (mini化済)
    single_ipa: { column: 'ipa_credits', amount: 100 },               // 実コスト¥0.18, 粗利82%
    single_kanji_hanja: { column: 'kanji_hanja_credits', amount: 100 }, // 実コスト¥0.01, 粗利99%
    single_vocab: { column: 'vocab_credits', amount: 100 },           // 実コスト¥0.03, 粗利97%
    single_extension: { column: 'extension_credits', amount: 100 },   // 実コスト¥0.06, 粗利94%
    single_script: { column: 'script_credits', amount: 100 },         // 実コスト¥0.01, 粗利99%
    // ── Mid (¥2/回 = 50回/¥100) ──
    single_correction: { column: 'correction_credits', amount: 50 },  // 実コスト¥1.32, 粗利34%
    single_chat: { column: 'chat_credits', amount: 50 },              // 実コスト¥0.42, 粗利79%
    single_expression: { column: 'expression_credits', amount: 50 },  // 実コスト¥1.10, 粗利45%
    single_grammar: { column: 'grammar_credits', amount: 50 },        // 実コスト¥1.41, 粗利30%
    // ── High (¥3+/回) ──
    single_speaking: { column: 'speaking_credits', amount: 30 },      // ¥3.33/回, 実コスト¥0.60, 粗利82%
    single_explanation: { column: 'explanation_credits', amount: 20 }, // ¥5/回, 実コスト¥3.64, 粗利27%
    single_extract: { column: 'extraction_credits', amount: 15 },     // ¥6.67/回, 実コスト¥3.03, 粗利55%
    single_etymology: { column: 'etymology_credits', amount: 12 },    // ¥8.33/回, 実コスト¥5.00, 粗利40%
    single_sentence: { column: 'sentence_credits', amount: 5 },       // ¥20/回, 実コスト¥14.01, 粗利30%
};
