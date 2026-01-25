'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Credit pack definitions
const CREDIT_PACKS: Record<string, { type: 'audio' | 'explorer' | 'extraction' | 'correction', amount: number }> = {
    'audio_credits_50': { type: 'audio', amount: 50 },
    'explorer_credits_20': { type: 'explorer', amount: 20 },
    'extraction_credits_10': { type: 'extraction', amount: 10 },
    'correction_credits_5': { type: 'correction', amount: 5 },
};

export async function purchaseShopItem(itemId: string, cost: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' };
    }

    // Get current profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('coins, settings, audio_credits, explorer_credits, extraction_credits, correction_credits')
        .eq('id', user.id)
        .single();

    if (profileError || !profile) {
        return { error: 'Profile not found' };
    }

    const currentCoins = profile.coins || 0;

    if (currentCoins < cost) {
        return { error: 'Insufficient funds' };
    }

    // Check if this is a credit pack purchase
    const creditPack = CREDIT_PACKS[itemId];
    if (creditPack) {
        // Credit packs can be purchased multiple times
        const creditColumn = `${creditPack.type}_credits` as keyof typeof profile;
        const currentCredits = (profile[creditColumn] as number) || 0;

        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                coins: currentCoins - cost,
                [creditColumn]: currentCredits + creditPack.amount
            })
            .eq('id', user.id);

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

    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            coins: currentCoins - cost,
            settings: newSettings
        })
        .eq('id', user.id);

    if (updateError) {
        return { error: updateError.message };
    }

    revalidatePath('/app/shop');
    return { success: true, inventory: newInventory, newBalance: currentCoins - cost };
}
