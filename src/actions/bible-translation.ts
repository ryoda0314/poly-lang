"use server";

import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

type SupabaseClientAny = Awaited<ReturnType<typeof createClient>> & { from: (table: string) => any };

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

interface VerseTranslation {
    verse: number;
    translation: string;
}

/**
 * Get or generate translations for Bible verses
 * Uses global cache - shared across all users
 */
export async function getBibleTranslations(
    bookId: string,
    chapter: number,
    verses: { verse: number; text: string }[],
    targetLanguage: string = 'ja'
): Promise<{
    translations: VerseTranslation[];
    generated: number;
    cached: number;
    error?: string;
}> {
    const supabase = await createClient() as SupabaseClientAny;

    try {
        // First, check what's already cached
        const verseNumbers = verses.map(v => v.verse);
        const { data: cachedData, error: cacheError } = await supabase
            .from('bible_verse_translations')
            .select('verse, translation')
            .eq('book_id', bookId)
            .eq('chapter', chapter)
            .eq('target_language', targetLanguage)
            .in('verse', verseNumbers) as { data: { verse: number; translation: string }[] | null; error: any };

        if (cacheError) {
            console.error('Failed to check translation cache:', cacheError);
        }

        const cachedMap = new Map<number, string>();
        for (const item of cachedData || []) {
            cachedMap.set(item.verse, item.translation);
        }

        // Find verses that need translation
        const versesToTranslate = verses.filter(v => !cachedMap.has(v.verse));

        const results: VerseTranslation[] = [];
        let generatedCount = 0;

        // Add cached translations to results
        for (const v of verses) {
            const cached = cachedMap.get(v.verse);
            if (cached) {
                results.push({ verse: v.verse, translation: cached });
            }
        }

        // Generate missing translations
        if (versesToTranslate.length > 0) {
            const generated = await generateTranslations(versesToTranslate, targetLanguage);
            generatedCount = generated.length;

            // Save to cache
            if (generated.length > 0) {
                const insertData = generated.map(g => {
                    const sourceVerse = versesToTranslate.find(v => v.verse === g.verse);
                    return {
                        book_id: bookId,
                        chapter,
                        verse: g.verse,
                        source_text: sourceVerse?.text || '',
                        translation: g.translation,
                        target_language: targetLanguage,
                    };
                });

                const { error: insertError } = await supabase
                    .from('bible_verse_translations')
                    .upsert(insertData, { onConflict: 'book_id,chapter,verse,target_language' });

                if (insertError) {
                    console.error('Failed to cache translations:', insertError);
                }
            }

            results.push(...generated);
        }

        // Sort by verse number
        results.sort((a, b) => a.verse - b.verse);

        return {
            translations: results,
            generated: generatedCount,
            cached: cachedMap.size,
        };
    } catch (error) {
        console.error('Failed to get Bible translations:', error);
        return {
            translations: [],
            generated: 0,
            cached: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Generate translations for verses using AI
 */
async function generateTranslations(
    verses: { verse: number; text: string }[],
    targetLanguage: string
): Promise<VerseTranslation[]> {
    if (verses.length === 0) return [];

    const languageNames: Record<string, string> = {
        ja: '日本語',
        ko: '韓国語',
        zh: '中国語',
    };

    const targetLangName = languageNames[targetLanguage] || targetLanguage;

    // Batch translate for efficiency
    const versesText = verses.map(v => `${v.verse}. ${v.text}`).join('\n');

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-5-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are a Bible translator. Translate the following Bible verses to ${targetLangName}.
Keep the verse numbers at the start of each line.
Maintain the sacred and reverent tone appropriate for scripture.
Output only the translations, one verse per line, in the format: "N. [translation]"`,
                },
                {
                    role: 'user',
                    content: versesText,
                },
            ],
            temperature: 0.3,
        });

        const content = response.choices[0]?.message?.content || '';
        const lines = content.split('\n').filter(line => line.trim());

        const results: VerseTranslation[] = [];
        for (const line of lines) {
            const match = line.match(/^(\d+)\.\s*(.+)$/);
            if (match) {
                const verseNum = parseInt(match[1], 10);
                const translation = match[2].trim();
                if (verses.some(v => v.verse === verseNum)) {
                    results.push({ verse: verseNum, translation });
                }
            }
        }

        return results;
    } catch (error) {
        console.error('Failed to generate translations:', error);
        return [];
    }
}

/**
 * Get translations for a long_text Bible chapter
 * Returns a map of position -> translation
 */
export async function getChapterTranslations(
    longTextId: string,
    targetLanguage: string = 'ja'
): Promise<{
    translations: Record<number, string>;
    error?: string;
}> {
    const supabase = await createClient() as SupabaseClientAny;

    try {
        // Get the long_text to determine book and chapter
        const { data: longText, error: textError } = await supabase
            .from('long_texts')
            .select('title, category')
            .eq('id', longTextId)
            .single() as { data: { title: string; category: string } | null; error: any };

        if (textError || !longText) {
            return { translations: {}, error: 'Text not found' };
        }

        if (longText.category !== 'Bible') {
            return { translations: {}, error: 'Not a Bible text' };
        }

        // Parse title to get book and chapter (format: "BookName Chapter")
        const titleMatch = longText.title.match(/^(.+)\s+(\d+)$/);
        if (!titleMatch) {
            return { translations: {}, error: 'Invalid Bible title format' };
        }

        const bookName = titleMatch[1];
        const chapter = parseInt(titleMatch[2], 10);

        // Find book ID from name (match any language name)
        const { BIBLE_BOOKS } = await import('@/data/bible-books');
        const book = BIBLE_BOOKS.find(b =>
            b.nameEn === bookName || b.nameJa === bookName ||
            b.nameKo === bookName || b.nameDe === bookName ||
            b.nameEs === bookName || b.nameFr === bookName ||
            b.nameZh === bookName || b.nameRu === bookName ||
            b.nameVi === bookName
        );
        if (!book) {
            return { translations: {}, error: 'Book not found' };
        }

        // Get all sentences for this text
        const { data: sentences, error: sentencesError } = await supabase
            .from('long_text_sentences')
            .select('position, text')
            .eq('long_text_id', longTextId)
            .order('position') as { data: { position: number; text: string }[] | null; error: any };

        if (sentencesError || !sentences) {
            return { translations: {}, error: 'Failed to load sentences' };
        }

        // Convert to verses format (position is 0-indexed, verse is 1-indexed)
        const verses = sentences.map(s => ({
            verse: s.position + 1,
            text: s.text,
        }));

        // Get/generate translations
        const result = await getBibleTranslations(book.id, chapter, verses, targetLanguage);

        if (result.error) {
            return { translations: {}, error: result.error };
        }

        // Convert to position-based record (0-indexed)
        const translationRecord: Record<number, string> = {};
        for (const t of result.translations) {
            translationRecord[t.verse - 1] = t.translation;
        }

        return { translations: translationRecord };
    } catch (error) {
        console.error('Failed to get chapter translations:', error);
        return {
            translations: {},
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Get a single verse translation (for on-demand loading)
 */
export async function getSingleVerseTranslation(
    bookId: string,
    chapter: number,
    verse: number,
    sourceText: string,
    targetLanguage: string = 'ja'
): Promise<{ translation: string | null; fromCache: boolean; error?: string }> {
    const result = await getBibleTranslations(
        bookId,
        chapter,
        [{ verse, text: sourceText }],
        targetLanguage
    );

    if (result.error) {
        return { translation: null, fromCache: false, error: result.error };
    }

    const found = result.translations.find(t => t.verse === verse);
    return {
        translation: found?.translation || null,
        fromCache: result.cached > 0,
    };
}
