"use server";

import { createClient } from "@/lib/supabase/server";
import { getOpenAI } from "@/lib/openai";
import { parseUSFM, getChapterVerses } from "@/lib/usfm-parser";
import { BIBLE_LANGUAGE_CONFIG, getBookFileName, getDirectory, type BibleLanguage } from "@/data/bible-books";

type SupabaseClientAny = Awaited<ReturnType<typeof createClient>> & { from: (table: string) => any; storage: any };

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

        // Get missing translations: prefer USFM data, fallback to AI
        if (versesToTranslate.length > 0) {
            let generated: VerseTranslation[] = [];

            // If target language has Bible USFM data, fetch directly (faster, free, more accurate)
            if (isBibleLanguage(targetLanguage)) {
                const { getBookById } = await import('@/data/bible-books');
                const book = getBookById(bookId);
                if (book) {
                    generated = await fetchUsfmVerses(book, chapter, targetLanguage, versesToTranslate.map(v => v.verse));
                }
            }

            // Fallback to AI translation for unsupported languages (ja, fi, etc.)
            if (generated.length === 0) {
                generated = await generateTranslations(versesToTranslate, targetLanguage);
            }

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
 * Check if a language has Bible USFM data available
 */
function isBibleLanguage(lang: string): lang is BibleLanguage {
    return lang in BIBLE_LANGUAGE_CONFIG;
}

/**
 * Fetch Bible verses from USFM files for a given language.
 * Returns translations directly from the published Bible text (no AI needed).
 */
async function fetchUsfmVerses(
    book: { id: string; filePrefix: string },
    chapter: number,
    targetLanguage: BibleLanguage,
    verseNumbers: number[]
): Promise<VerseTranslation[]> {
    const supabase = await createClient() as SupabaseClientAny;

    const fileName = getBookFileName(book as any, targetLanguage);
    const directory = getDirectory(targetLanguage);
    const storagePath = `${directory}/${fileName}`;

    try {
        const { data, error } = await supabase.storage
            .from('bible')
            .download(storagePath);

        if (error || !data) {
            console.error(`Failed to fetch USFM ${storagePath}:`, error);
            return [];
        }

        const content = await data.text();
        const parsed = parseUSFM(content);
        const verses = getChapterVerses(parsed, chapter);

        const verseSet = new Set(verseNumbers);
        return verses
            .filter(v => verseSet.has(v.verse))
            .map(v => ({ verse: v.verse, translation: v.text }));
    } catch (error) {
        console.error('Failed to fetch USFM verses:', error);
        return [];
    }
}

/**
 * Normalize fullwidth digits to halfwidth
 */
function normalizeDigits(s: string): string {
    return s.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFF10 + 0x30));
}

/**
 * Generate translations for verses using AI (fallback when no USFM data available)
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
        fi: 'Finnish',
    };

    const targetLangName = languageNames[targetLanguage] || targetLanguage;

    // Batch translate for efficiency
    const versesText = verses.map(v => `${v.verse}. ${v.text}`).join('\n');

    try {
        const response = await getOpenAI().chat.completions.create({
            model: 'gpt-5-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are a Bible translator. Translate the following Bible verses to ${targetLangName}.
Keep the verse numbers (in half-width Arabic numerals) at the start of each line followed by a period.
Maintain the sacred and reverent tone appropriate for scripture.
Output only the translations, one verse per line, in the format: "N. [translation]"`,
                },
                {
                    role: 'user',
                    content: versesText,
                },
            ],
            temperature: 0.3,
            max_tokens: 4096,
        });

        const content = response.choices[0]?.message?.content || '';
        const lines = content.split('\n').filter(line => line.trim());

        const results: VerseTranslation[] = [];
        for (const rawLine of lines) {
            // Normalize fullwidth digits to halfwidth before matching
            const line = normalizeDigits(rawLine);
            // Match various formats: "1. text", "1．text", "1) text", "1: text"
            const match = line.match(/^(\d+)[.．):：]\s*(.+)$/);
            if (match) {
                const verseNum = parseInt(match[1], 10);
                const translation = match[2].trim();
                if (verses.some(v => v.verse === verseNum)) {
                    results.push({ verse: verseNum, translation });
                }
            }
        }

        // If regex parsing missed many verses, try line-by-line fallback (assume same order as input)
        if (results.length < verses.length * 0.5 && lines.length >= verses.length) {
            console.warn(`Bible translation: regex matched only ${results.length}/${verses.length} verses, using line-order fallback`);
            const fallbackResults: VerseTranslation[] = [];
            for (let i = 0; i < Math.min(lines.length, verses.length); i++) {
                const text = normalizeDigits(lines[i]).replace(/^[\d.．):：\s]+/, '').trim();
                if (text) {
                    fallbackResults.push({ verse: verses[i].verse, translation: text });
                }
            }
            if (fallbackResults.length > results.length) {
                return fallbackResults;
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
