'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function purchaseShopItem(itemId: string, cost: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' };
    }

    // Get current profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('coins, settings')
        .eq('id', user.id)
        .single();

    if (profileError || !profile) {
        return { error: 'Profile not found' };
    }

    const currentCoins = profile.coins || 0;

    if (currentCoins < cost) {
        return { error: 'Insufficient funds' };
    }

    // Update coins and inventory
    // We treat 'settings' as a JSON object that might have 'inventory'
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
