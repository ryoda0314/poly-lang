'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Credit pack definitions — IDはShopページのSinglePurchaseItem.idと一致
type CreditType = 'audio' | 'pronunciation' | 'speaking' | 'explorer' | 'correction'
    | 'extraction' | 'explanation' | 'expression' | 'ipa' | 'kanji_hanja'
    | 'vocab' | 'grammar' | 'extension' | 'script' | 'chat' | 'sentence' | 'etymology';

const CREDIT_PACKS: Record<string, { type: CreditType, amount: number }> = {
    // 1コイン/回 (100クレジット/100コイン)
    'single_audio': { type: 'audio', amount: 100 },
    'single_pronunciation': { type: 'pronunciation', amount: 100 },
    'single_explorer': { type: 'explorer', amount: 100 },
    'single_ipa': { type: 'ipa', amount: 100 },
    'single_kanji_hanja': { type: 'kanji_hanja', amount: 100 },
    'single_vocab': { type: 'vocab', amount: 100 },
    'single_extension': { type: 'extension', amount: 100 },
    'single_script': { type: 'script', amount: 100 },
    // 2コイン/回 (50クレジット/100コイン)
    'single_correction': { type: 'correction', amount: 50 },
    'single_chat': { type: 'chat', amount: 50 },
    'single_expression': { type: 'expression', amount: 50 },
    'single_grammar': { type: 'grammar', amount: 50 },
    // 3+コイン/回
    'single_speaking': { type: 'speaking', amount: 30 },
    'single_explanation': { type: 'explanation', amount: 20 },
    'single_extract': { type: 'extraction', amount: 15 },
    'single_etymology': { type: 'etymology', amount: 12 },
    'single_sentence': { type: 'sentence', amount: 5 },
};

export async function purchaseShopItem(itemId: string, cost: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' };
    }

    // Get current profile (extra_* = purchased credits)
    const { data: profile, error: profileError } = await (supabase as any)
        .from('profiles')
        .select('coins, settings, extra_audio_credits, extra_pronunciation_credits, extra_speaking_credits, extra_explorer_credits, extra_extraction_credits, extra_correction_credits, extra_explanation_credits, extra_expression_credits, extra_ipa_credits, extra_kanji_hanja_credits, extra_vocab_credits, extra_grammar_credits, extra_extension_credits, extra_script_credits, extra_chat_credits, extra_sentence_credits, extra_etymology_credits')
        .eq('id', user.id)
        .single();

    if (profileError || !profile) {
        console.error('[purchaseShopItem] Profile query failed:', profileError?.message, profileError?.code, profileError?.details);
        return { error: `Profile not found: ${profileError?.message || 'no data'}` };
    }

    const currentCoins = profile.coins || 0;

    if (currentCoins < cost) {
        return { error: 'Insufficient funds' };
    }

    // Check if this is a credit pack purchase
    const creditPack = CREDIT_PACKS[itemId];
    if (creditPack) {
        // Credit packs → extra_*_credits に加算（購入枠）
        const extraColumn = `extra_${creditPack.type}_credits` as keyof typeof profile;
        const currentCredits = (profile[extraColumn] as number) || 0;

        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                coins: currentCoins - cost,
                [extraColumn]: currentCredits + creditPack.amount
            })
            .eq('id', user.id)
            .gte('coins', cost);  // 楽観的排他制御: 二重消費防止

        if (updateError) {
            return { error: updateError.message };
        }

        revalidatePath('/app/shop');
        return { success: true, newBalance: currentCoins - cost, creditsAdded: creditPack.amount };
    }

    // Regular item purchase (one-time, goes to inventory)
    const settings = (profile.settings as any) || {};
    const inventory = (settings.inventory as string[]) || [];

    if (inventory.includes(itemId)) {
        return { error: 'Item already purchased' };
    }

    const newInventory = [...inventory, itemId];
    const newSettings = { ...settings, inventory: newInventory };

    // Special bonuses for premium items
    const updateData: Record<string, any> = {
        coins: currentCoins - cost,
        settings: newSettings
    };

    // study_set_creator includes 30 extraction credits (¥300 worth)
    if (itemId === 'study_set_creator') {
        const currentExtractionCredits = profile.extra_extraction_credits || 0;
        updateData.extra_extraction_credits = currentExtractionCredits + 30;
    }

    // audio_premium includes 150 audio credits (¥300 worth)
    if (itemId === 'audio_premium') {
        const currentAudioCredits = profile.extra_audio_credits || 0;
        updateData.extra_audio_credits = currentAudioCredits + 150;
    }

    const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .gte('coins', cost);  // 楽観的排他制御

    if (updateError) {
        return { error: updateError.message };
    }

    revalidatePath('/app/shop');
    return { success: true, inventory: newInventory, newBalance: currentCoins - cost };
}
