import { Phrase } from '@/lib/data';
import { Database } from '@/types/supabase';

type PhraseSetItem = Database['public']['Tables']['phrase_set_items']['Row'];

/**
 * Adapts a PhraseSetItem from the database to the Phrase format
 * expected by PhraseCard and TokenizedSentence components.
 */
export function adaptToPhrase(item: PhraseSetItem, currentLang: string): Phrase {
    return {
        id: item.id,
        categoryId: item.category_id || 'custom',
        translation: item.translation,
        translations: {
            [currentLang]: item.target_text
        },
        tokens: item.tokens || undefined,
        tokensMap: {
            [currentLang]: item.tokens || []
        },
        tokensSlashMap: {},
        // Include the phrase set item ID for learning statistics tracking
        phraseSetItemId: item.id,
    };
}

/**
 * Adapts an array of PhraseSetItems to Phrase format.
 */
export function adaptPhrasesToPhraseFormat(
    items: PhraseSetItem[],
    currentLang: string
): Phrase[] {
    return items.map(item => adaptToPhrase(item, currentLang));
}
