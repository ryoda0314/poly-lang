"use server";

import { createClient } from "@/lib/supabase/server";
import { parseUSFM, getChapterVerses, formatVersesAsText } from "@/lib/usfm-parser";
import { BIBLE_BOOKS, getBookById, getBookFileName, getBookDisplayName, getDirectory, type BibleBook, type BibleLanguage } from "@/data/bible-books";

type SupabaseClientAny = Awaited<ReturnType<typeof createClient>> & { from: (table: string) => any; storage: any };

// Cache for USFM content to avoid repeated fetches
const usfmCache = new Map<string, string>();

/**
 * Fetch USFM file content from Supabase Storage
 */
async function fetchUsfmFromStorage(language: BibleLanguage, fileName: string): Promise<string | null> {
    const cacheKey = `${language}/${fileName}`;

    // Check cache first
    if (usfmCache.has(cacheKey)) {
        return usfmCache.get(cacheKey)!;
    }

    const supabase = await createClient() as SupabaseClientAny;
    const directory = getDirectory(language);
    const storagePath = `${directory}/${fileName}`;

    try {
        const { data, error } = await supabase.storage
            .from('bible')
            .download(storagePath);

        if (error || !data) {
            console.error(`Failed to fetch ${storagePath}:`, error);
            return null;
        }

        const content = await data.text();

        // Cache the content
        usfmCache.set(cacheKey, content);

        return content;
    } catch (error) {
        console.error(`Error fetching ${storagePath}:`, error);
        return null;
    }
}

/**
 * Get list of available Bible books with chapter counts
 * Uses static chapter counts - no network requests needed
 */
export async function getAvailableBibleBooks(_language: BibleLanguage = 'en'): Promise<{
    books: Array<BibleBook & { chapters: number[] }>;
    error?: string;
}> {
    // Return static data - chapter counts are fixed for all Bible versions
    const result = BIBLE_BOOKS.map(book => ({
        ...book,
        chapters: Array.from({ length: book.chapters }, (_, i) => i + 1),
    }));

    return { books: result };
}

export interface ChapterProgress {
    chapter: number;
    textId: string;
    completedCount: number;
    totalCount: number;
}

export interface BookProgress {
    bookId: string;
    importedChapters: number;
    completedSentences: number;
    totalSentences: number;
}

/**
 * Get progress for all Bible books (for book list view)
 */
export async function getAllBooksProgress(language: BibleLanguage = 'en'): Promise<{
    progress: Map<string, BookProgress>;
    error?: string;
}> {
    const supabase = await createClient() as SupabaseClientAny;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { progress: new Map() };
    }

    try {
        // Get all Bible texts for this user
        const { data: textsData, error: textsError } = await supabase
            .from('long_texts')
            .select('id, title, sentence_count')
            .eq('user_id', user.id)
            .eq('category', 'Bible') as { data: Array<{ id: string; title: string; sentence_count: number }> | null; error: any };

        if (textsError) {
            console.error('Failed to get Bible texts:', textsError);
            return { progress: new Map(), error: 'Failed to load progress' };
        }

        if (!textsData || textsData.length === 0) {
            return { progress: new Map() };
        }

        // Get progress for all texts
        const textIds = textsData.map(t => t.id);
        const { data: progressData } = await supabase
            .from('user_long_text_progress')
            .select('long_text_id, completed_sentences')
            .eq('user_id', user.id)
            .in('long_text_id', textIds);

        const progressMap: Record<string, number[]> = {};
        for (const p of progressData || []) {
            progressMap[p.long_text_id] = p.completed_sentences || [];
        }

        // Aggregate by book
        const bookProgressMap = new Map<string, BookProgress>();

        for (const book of BIBLE_BOOKS) {
            const displayName = getBookDisplayName(book, language);
            const escapedName = displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pattern = new RegExp(`^${escapedName} \\d+$`);
            let importedChapters = 0;
            let completedSentences = 0;
            let totalSentences = 0;

            for (const text of textsData) {
                if (pattern.test(text.title)) {
                    importedChapters++;
                    totalSentences += text.sentence_count || 0;
                    completedSentences += (progressMap[text.id] || []).length;
                }
            }

            if (importedChapters > 0) {
                bookProgressMap.set(book.id, {
                    bookId: book.id,
                    importedChapters,
                    completedSentences,
                    totalSentences,
                });
            }
        }

        return { progress: bookProgressMap };
    } catch (error) {
        console.error('Failed to get books progress:', error);
        return { progress: new Map(), error: 'Failed to load progress' };
    }
}

/**
 * Get already imported chapters for a book with progress info
 */
export async function getImportedChapters(
    bookId: string,
    language: BibleLanguage = 'en'
): Promise<{
    chapters: ChapterProgress[];
    error?: string;
}> {
    const supabase = await createClient() as SupabaseClientAny;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { chapters: [], error: "User not authenticated" };
    }

    const book = getBookById(bookId);
    if (!book) {
        return { chapters: [], error: 'Book not found' };
    }

    try {
        // Query long_texts where title matches "BookName N" pattern
        const displayName = getBookDisplayName(book, language);
        const { data: textsData, error: textsError } = await supabase
            .from('long_texts')
            .select('id, title, sentence_count')
            .eq('user_id', user.id)
            .eq('category', 'Bible')
            .like('title', `${displayName} %`) as { data: Array<{ id: string; title: string; sentence_count: number }> | null; error: any };

        if (textsError) {
            console.error('Failed to get imported chapters:', textsError);
            return { chapters: [], error: 'Failed to check imported chapters' };
        }

        // Get progress for all these texts
        const textIds = (textsData || []).map(t => t.id);
        let progressMap: Record<string, number[]> = {};

        if (textIds.length > 0) {
            const { data: progressData } = await supabase
                .from('user_long_text_progress')
                .select('long_text_id, completed_sentences')
                .eq('user_id', user.id)
                .in('long_text_id', textIds);

            for (const p of progressData || []) {
                progressMap[p.long_text_id] = p.completed_sentences || [];
            }
        }

        // Extract chapter numbers and build progress info
        const chapters: ChapterProgress[] = [];
        const escapedName = displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`^${escapedName} (\\d+)$`);

        for (const item of textsData || []) {
            const match = item.title.match(pattern);
            if (match) {
                const chapterNum = parseInt(match[1], 10);
                const completed = progressMap[item.id] || [];
                chapters.push({
                    chapter: chapterNum,
                    textId: item.id,
                    completedCount: completed.length,
                    totalCount: item.sentence_count || 0,
                });
            }
        }

        // Sort by chapter number
        chapters.sort((a, b) => a.chapter - b.chapter);

        return { chapters };
    } catch (error) {
        console.error('Failed to get imported chapters:', error);
        return { chapters: [], error: 'Failed to check imported chapters' };
    }
}

/**
 * Get chapter content for preview
 */
export async function getBibleChapterPreview(
    bookId: string,
    chapter: number,
    language: BibleLanguage = 'en'
): Promise<{ text: string; verseCount: number; error?: string }> {
    const book = getBookById(bookId);
    if (!book) {
        return { text: '', verseCount: 0, error: 'Book not found' };
    }

    try {
        const fileName = getBookFileName(book, language);
        const content = await fetchUsfmFromStorage(language, fileName);

        if (!content) {
            return { text: '', verseCount: 0, error: 'Failed to load Bible file' };
        }

        const parsed = parseUSFM(content);
        const verses = getChapterVerses(parsed, chapter);

        if (verses.length === 0) {
            return { text: '', verseCount: 0, error: 'Chapter not found' };
        }

        const text = formatVersesAsText(verses, true);
        return { text, verseCount: verses.length };
    } catch (error) {
        console.error('Failed to get chapter preview:', error);
        return { text: '', verseCount: 0, error: 'Failed to load chapter' };
    }
}

/**
 * Import a Bible chapter as a long text
 */
export async function importBibleChapter(
    bookId: string,
    chapter: number,
    language: BibleLanguage = 'en'
): Promise<{ success: boolean; textId?: string; error?: string }> {
    const supabase = await createClient() as SupabaseClientAny;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "User not authenticated" };
    }

    const book = getBookById(bookId);
    if (!book) {
        return { success: false, error: 'Book not found' };
    }

    try {
        const fileName = getBookFileName(book, language);
        const content = await fetchUsfmFromStorage(language, fileName);

        if (!content) {
            return { success: false, error: 'Failed to load Bible file' };
        }

        const parsed = parseUSFM(content);
        const verses = getChapterVerses(parsed, chapter);

        if (verses.length === 0) {
            return { success: false, error: 'Chapter not found' };
        }

        // Create title using the display name for the selected language
        const displayName = getBookDisplayName(book, language);
        const title = `${displayName} ${chapter}`;
        const titleTranslation = `${book.nameJa} ${chapter}章`;

        // Create full text (verses joined, without verse numbers)
        const fullText = verses.map(v => v.text).join('\n');

        // Create the long text entry
        const { data: longText, error: textError } = await supabase
            .from('long_texts')
            .insert({
                user_id: user.id,
                title,
                title_translation: titleTranslation,
                language_code: language,
                difficulty_level: 'intermediate',
                category: 'Bible',
                full_text: fullText,
                sentence_count: verses.length,
                is_published: false,
            })
            .select('id')
            .single() as { data: { id: string } | null; error: any };

        if (textError || !longText) {
            console.error('Failed to create long text:', textError);
            return { success: false, error: `Failed to create long text: ${textError?.message || textError?.code || 'Unknown error'}` };
        }

        // Create sentence entries (one per verse, without verse numbers)
        const sentenceInserts = verses.map((verse, index) => ({
            long_text_id: longText.id,
            position: index,
            text: verse.text,
        }));

        const { error: sentencesError } = await supabase
            .from('long_text_sentences')
            .insert(sentenceInserts);

        if (sentencesError) {
            console.error('Failed to create sentences:', sentencesError);
            // Clean up
            await supabase.from('long_texts').delete().eq('id', longText.id);
            return { success: false, error: `Failed to create sentences: ${sentencesError?.message || sentencesError?.code || 'Unknown error'}` };
        }

        return { success: true, textId: longText.id };
    } catch (error) {
        console.error('Failed to import Bible chapter:', error);
        return { success: false, error: `Failed to import chapter: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
}

/**
 * Import multiple chapters at once
 */
export async function importBibleChapters(
    bookId: string,
    chapters: number[],
    language: BibleLanguage = 'en'
): Promise<{ success: boolean; textIds: string[]; errors: string[] }> {
    const textIds: string[] = [];
    const errors: string[] = [];

    for (const chapter of chapters) {
        const result = await importBibleChapter(bookId, chapter, language);
        if (result.success && result.textId) {
            textIds.push(result.textId);
        } else {
            errors.push(`Chapter ${chapter}: ${result.error || 'Unknown error'}`);
        }
    }

    return {
        success: errors.length === 0,
        textIds,
        errors,
    };
}

/**
 * Import an entire book
 */
export async function importEntireBook(
    bookId: string,
    language: BibleLanguage = 'en'
): Promise<{
    success: boolean;
    textId?: string;
    error?: string;
}> {
    const supabase = await createClient() as SupabaseClientAny;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "User not authenticated" };
    }

    const book = getBookById(bookId);
    if (!book) {
        return { success: false, error: 'Book not found' };
    }

    try {
        const fileName = getBookFileName(book, language);
        const content = await fetchUsfmFromStorage(language, fileName);

        if (!content) {
            return { success: false, error: 'Failed to load Bible file' };
        }

        const parsed = parseUSFM(content);

        if (parsed.verses.length === 0) {
            return { success: false, error: 'No verses found' };
        }

        // Create title using the display name for the selected language
        const displayName = getBookDisplayName(book, language);
        const title = displayName;
        const titleTranslation = book.nameJa;

        // Create full text with chapter markers (without verse numbers)
        let fullText = '';
        let currentChapter = 0;
        for (const verse of parsed.verses) {
            if (verse.chapter !== currentChapter) {
                if (fullText) fullText += '\n\n';
                fullText += `[Chapter ${verse.chapter}]\n`;
                currentChapter = verse.chapter;
            }
            fullText += `${verse.text}\n`;
        }

        // Create the long text entry
        const { data: longText, error: textError } = await supabase
            .from('long_texts')
            .insert({
                user_id: user.id,
                title,
                title_translation: titleTranslation,
                language_code: language,
                difficulty_level: 'advanced',
                category: 'Bible',
                full_text: fullText,
                sentence_count: parsed.verses.length,
                is_published: false,
            })
            .select('id')
            .single() as { data: { id: string } | null; error: any };

        if (textError || !longText) {
            console.error('Failed to create long text:', textError);
            return { success: false, error: `Failed to create long text: ${textError?.message || textError?.code || 'Unknown error'}` };
        }

        // Create sentence entries (one per verse, without verse numbers)
        const sentenceInserts = parsed.verses.map((verse, index) => ({
            long_text_id: longText.id,
            position: index,
            text: verse.text,
        }));

        const { error: sentencesError } = await supabase
            .from('long_text_sentences')
            .insert(sentenceInserts);

        if (sentencesError) {
            console.error('Failed to create sentences:', sentencesError);
            await supabase.from('long_texts').delete().eq('id', longText.id);
            return { success: false, error: `Failed to create sentences: ${sentencesError?.message || sentencesError?.code || 'Unknown error'}` };
        }

        return { success: true, textId: longText.id };
    } catch (error) {
        console.error('Failed to import book:', error);
        return { success: false, error: `Failed to import book: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
}
