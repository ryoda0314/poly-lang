/**
 * USFM (Unified Standard Format Markers) Parser
 * Parses Bible text files in USFM format
 */

export interface USFMVerse {
    chapter: number;
    verse: number;
    text: string;
}

export interface USFMBook {
    id: string;
    title: string;
    shortTitle: string;
    chapters: number[];
    verses: USFMVerse[];
}

/**
 * Clean USFM markers and extract plain text from a verse
 */
function cleanVerseText(text: string): string {
    let cleaned = text;

    // Remove footnotes: \f ... \f* (can contain nested markers, so match until \f*)
    cleaned = cleaned.replace(/\\f\s+[\s\S]*?\\f\*/g, '');

    // Remove cross-references: \x ... \x* (can contain nested markers)
    cleaned = cleaned.replace(/\\x\s+[\s\S]*?\\x\*/g, '');

    // Remove word markers with Strong's numbers: \w word|strong="H1234"\w*
    cleaned = cleaned.replace(/\\w\s+([^|]*?)\|[^\\]*\\w\*/g, '$1');
    // Handle simpler \w word\w* format
    cleaned = cleaned.replace(/\\w\s+([^\\]*?)\\w\*/g, '$1');

    // Remove Hebrew/Greek word markers: \+wh ... \+wh*
    cleaned = cleaned.replace(/\\\+wh\s+([^\\]*?)\\\+wh\*/g, '$1');

    // Remove any remaining inline markers
    cleaned = cleaned.replace(/\\add\s*/g, '');
    cleaned = cleaned.replace(/\\add\*/g, '');
    cleaned = cleaned.replace(/\\nd\s*/g, '');
    cleaned = cleaned.replace(/\\nd\*/g, '');
    cleaned = cleaned.replace(/\\wj\s*/g, '');
    cleaned = cleaned.replace(/\\wj\*/g, '');
    cleaned = cleaned.replace(/\\qs\s*/g, '');
    cleaned = cleaned.replace(/\\qs\*/g, '');

    // Remove paragraph markers
    cleaned = cleaned.replace(/\\p\s*/g, '');
    cleaned = cleaned.replace(/\\q[1-9]?\s*/g, '');
    cleaned = cleaned.replace(/\\m\s*/g, '');
    cleaned = cleaned.replace(/\\pi[1-9]?\s*/g, '');
    cleaned = cleaned.replace(/\\li[1-9]?\s*/g, '');
    cleaned = cleaned.replace(/\\nb\s*/g, '');
    cleaned = cleaned.replace(/\\b\s*/g, '');

    // Remove section markers
    cleaned = cleaned.replace(/\\s[1-9]?\s+[^\n]*/g, '');
    cleaned = cleaned.replace(/\\r\s+[^\n]*/g, '');
    cleaned = cleaned.replace(/\\d\s+[^\n]*/g, '');
    cleaned = cleaned.replace(/\\sp\s+[^\n]*/g, '');

    // Clean up whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
}

/**
 * Parse USFM content and extract verses
 */
export function parseUSFM(content: string): USFMBook {
    const lines = content.split('\n');

    let bookId = '';
    let bookTitle = '';
    let shortTitle = '';
    let currentChapter = 0;
    const verses: USFMVerse[] = [];
    const chaptersSet = new Set<number>();

    let currentVerseText = '';
    let currentVerse = 0;

    const flushVerse = () => {
        if (currentVerse > 0 && currentVerseText.trim()) {
            const cleanedText = cleanVerseText(currentVerseText);
            if (cleanedText) {
                verses.push({
                    chapter: currentChapter,
                    verse: currentVerse,
                    text: cleanedText,
                });
            }
        }
        currentVerseText = '';
    };

    for (const line of lines) {
        const trimmedLine = line.trim();

        // Book ID
        if (trimmedLine.startsWith('\\id ')) {
            bookId = trimmedLine.substring(4).split(' ')[0].trim();
        }
        // Book title (from toc2 - shorter version)
        else if (trimmedLine.startsWith('\\toc2 ')) {
            shortTitle = trimmedLine.substring(6).trim();
        }
        // Book title (from h - header)
        else if (trimmedLine.startsWith('\\h ')) {
            bookTitle = trimmedLine.substring(3).trim();
        }
        // Main title (fallback)
        else if (trimmedLine.startsWith('\\mt1 ') || trimmedLine.startsWith('\\mt ')) {
            if (!bookTitle) {
                bookTitle = trimmedLine.replace(/\\mt[1-9]?\s+/, '').trim();
            }
        }
        // Chapter marker
        else if (trimmedLine.startsWith('\\c ')) {
            flushVerse();
            currentChapter = parseInt(trimmedLine.substring(3).trim(), 10);
            chaptersSet.add(currentChapter);
            currentVerse = 0;
        }
        // Verse marker
        else if (trimmedLine.match(/^\\v\s+\d+/)) {
            flushVerse();
            const verseMatch = trimmedLine.match(/^\\v\s+(\d+)\s*(.*)/);
            if (verseMatch) {
                currentVerse = parseInt(verseMatch[1], 10);
                currentVerseText = verseMatch[2] || '';
            }
        }
        // Continuation of verse text (paragraph markers, etc.)
        else if (currentVerse > 0) {
            // Skip header/title markers
            if (!trimmedLine.match(/^\\(id|ide|h|toc|mt|ms|mr|s[1-9]?|r|c)\s/)) {
                currentVerseText += ' ' + trimmedLine;
            }
        }
    }

    // Flush last verse
    flushVerse();

    return {
        id: bookId,
        title: bookTitle || shortTitle || bookId,
        shortTitle: shortTitle || bookTitle || bookId,
        chapters: Array.from(chaptersSet).sort((a, b) => a - b),
        verses,
    };
}

/**
 * Get verses for a specific chapter
 */
export function getChapterVerses(book: USFMBook, chapter: number): USFMVerse[] {
    return book.verses.filter(v => v.chapter === chapter);
}

/**
 * Format verses as readable text (one verse per line)
 */
export function formatVersesAsText(verses: USFMVerse[], includeNumbers: boolean = true): string {
    return verses
        .map(v => includeNumbers ? `${v.verse}. ${v.text}` : v.text)
        .join('\n');
}

/**
 * Format a chapter as readable text
 */
export function formatChapterAsText(book: USFMBook, chapter: number, includeVerseNumbers: boolean = true): string {
    const verses = getChapterVerses(book, chapter);
    return formatVersesAsText(verses, includeVerseNumbers);
}
