import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
});

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
    { id: 'coin_500',  coins: 500,  priceYen: 500,  bonus: 0,  stripePriceId: process.env.STRIPE_PRICE_COIN_500! },
    { id: 'coin_1100', coins: 1100, priceYen: 1000, bonus: 10, stripePriceId: process.env.STRIPE_PRICE_COIN_1100! },
    { id: 'coin_3600', coins: 3600, priceYen: 3000, bonus: 20, stripePriceId: process.env.STRIPE_PRICE_COIN_3600! },
    { id: 'coin_6500', coins: 6500, priceYen: 5000, bonus: 30, stripePriceId: process.env.STRIPE_PRICE_COIN_6500! },
];

export const COIN_PACK_MAP: Record<string, CoinPack> = Object.fromEntries(
    COIN_PACKS.map(p => [p.id, p])
);

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
