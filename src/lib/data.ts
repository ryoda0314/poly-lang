export type Language = {
    code: string;
    name: string;
    nativeName: string;
};

// Languages where gender variants are supported (toggle should be shown)
export const GENDER_SUPPORTED_LANGUAGES = ['es', 'th', 'fr', 'pt', 'it', 'ru'];

export type Phrase = {
    id: string;
    categoryId: string;
    targetText: string;
    translation: string;
    // New fields from tokenized dataset
    mode: string;
    tokens: string[];
    tokensSlash: string;
    translation_ko?: string;
    translations: {
        [key: string]: string;
    };
    gender_variants?: {
        male?: { targetText: string; tokens: string[] };
        female?: { targetText: string; tokens: string[] };
    };
};

export type Category = {
    id: string;
    name: string;
};

import rawData from "../../dataset_tokenized_modeB.json";

export const LANGUAGES: Language[] = [
    { code: "en", name: "English", nativeName: "English" },
    { code: "ja", name: "Japanese", nativeName: "日本語" },
    { code: "ko", name: "Korean", nativeName: "한국어" },
    { code: "zh", name: "Chinese (Simplified)", nativeName: "中文 (简体)" },
    { code: "fr", name: "French", nativeName: "Français" },
    { code: "es", name: "Spanish", nativeName: "Español" },
    { code: "de", name: "German", nativeName: "Deutsch" },
    { code: "ru", name: "Russian", nativeName: "Русский" },
    { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
];

export const CATEGORIES: Category[] = [
    { id: "greeting", name: "Greeting" },
    { id: "dining", name: "Dining" },
    { id: "travel", name: "Travel" },
    { id: "emotions", name: "Emotions" },
];

// Mapping to Gemini 2.5 Pro Preview TTS Locales
export const LANGUAGE_LOCALES: Record<string, string> = {
    ar: "ar-EG", // Arabic (Egyptian)
    de: "de-DE", // German (Germany)
    en: "en-US", // English (US)
    es: "es-US", // Spanish (US)
    fr: "fr-FR", // French (France)
    hi: "hi-IN", // Hindi (India)
    id: "id-ID", // Indonesian (Indonesia)
    it: "it-IT", // Italian (Italy)
    ja: "ja-JP", // Japanese (Japan)
    ko: "ko-KR", // Korean (Korea)
    pt: "pt-BR", // Portuguese (Brazil)
    ru: "ru-RU", // Russian (Russia)
    nl: "nl-NL", // Dutch (Netherlands)
    pl: "pl-PL", // Polish (Poland)
    th: "th-TH", // Thai (Thailand)
    tr: "tr-TR", // Turkish (Turkey)
    vi: "vi-VN", // Vietnamese (Vietnam)
    ro: "ro-RO", // Romanian (Romania)
    uk: "uk-UA", // Ukrainian (Ukraine)
    bn: "bn-BD", // Bengali (Bangladesh)
    mr: "mr-IN", // Marathi (India)
    ta: "ta-IN", // Tamil (India)
    te: "te-IN", // Telugu (India)
    zh: "cmn-CN", // Chinese
    sv: "sv-SE", // Swedish
};

// Reconstruct PHRASES from the imported JSON
function buildPhrases(): Record<string, Phrase[]> {
    const out: Record<string, Phrase[]> = {};

    // Initialize empty arrays for all supported languages
    for (const lang of LANGUAGES) {
        out[lang.code] = [];
    }

    // Pass 1: Build Concept Map
    // Map: "greeting-01" -> { en: "Hello.", ja: "こんにちは。", ... }
    const conceptMap: Record<string, Record<string, string>> = {};

    for (const item of rawData.items) {
        // ID format: "lang-category-index" (e.g. "en-greeting-01")
        // We want to extract "greeting-01" as the key.
        const parts = item.id.split('-');
        if (parts.length >= 2) {
            // Remove the first part (lang code)
            const conceptKey = parts.slice(1).join('-');

            if (!conceptMap[conceptKey]) {
                conceptMap[conceptKey] = {};
            }
            // Store the target text for this language
            conceptMap[conceptKey][item.lang] = item.targetText;
        }
    }

    // Pass 2: Build Phrases with Full Translation Map
    for (const item of rawData.items) {
        if (out[item.lang]) {
            const parts = item.id.split('-');
            const conceptKey = parts.slice(1).join('-');
            const allTranslations = conceptMap[conceptKey] || {};

            out[item.lang].push({
                id: item.id,
                categoryId: item.categoryId,
                targetText: item.targetText,
                translation: item.translation,
                mode: item.mode,
                tokens: item.tokens,
                tokensSlash: item.tokensSlash,
                translation_ko: (item as any).translation_ko,
                translations: {
                    ...allTranslations,
                    // Keep explicit legacy overrides if needed, or rely purely on map
                    // For safety, ensure 'ja' and 'ko' from legacy fields are present if missing in map (unlikely)
                    ja: allTranslations['ja'] || item.translation,
                    ko: allTranslations['ko'] || (item as any).translation_ko || "",
                },
                gender_variants: (item as any).gender_variants || expandGenderVariants(item.targetText, item.lang, item.tokens)
            });
        }
    }

    return out;
}

// Helper to expand compact gender notation like "(e)" or "ครับ/ค่ะ"
function expandGenderVariants(text: string, lang: string, tokens: string[]): Phrase['gender_variants'] | undefined {
    if (lang === 'fr') {
        // Pattern: "word(e)" -> Male: "word", Female: "worde"
        // Also: "word(ne)" -> "word" / "wordne" (e.g. bon(ne))
        // Simple regex for "(e)" or "(ne)" or "(ère)" etc.
        // Let's handle simple "(e)" first as per user request "Enchanté(e)"
        const match = text.match(/(\w+)\((e|ne|ère|se)\)/);
        if (match) {
            const base = text.replace(/\((e|ne|ère|se)\)/g, "");
            const female = text.replace(/\((e|ne|ère|se)\)/g, "$1");
            return {
                male: { targetText: base, tokens: retokenize(base, tokens) },
                female: { targetText: female, tokens: retokenize(female, tokens) }
            };
        }
    }

    if (lang === 'th') {
        // Pattern: "ครับ/ค่ะ"
        if (text.includes("ครับ/ค่ะ")) {
            const male = text.replace("ครับ/ค่ะ", "ครับ");
            const female = text.replace("ครับ/ค่ะ", "ค่ะ");
            return {
                male: { targetText: male, tokens: retokenize(male, tokens) },
                female: { targetText: female, tokens: retokenize(female, tokens) }
            };
        }
    }

    // Default: no expansion
    return undefined;
}

// Naive re-tokenizer to try and preserve token structure for variants
// REAL implementation would need the tokenizer logic, but for now we might just split by spaces or keep as single token if simple?
// Actually, `tokens` in current dataset are pre-computed. Updating them dynamically is hard without the original tokenizer.
// Fallback: Just return [text] as a single token for the variant if exact token mapping is lost? 
// OR: Attempt to replace the changing part in the token list.
function retokenize(newText: string, originalTokens: string[]): string[] {
    // Strategy: If the change is small, maybe we can map it?
    // User request images show reasonably simple phrases. 
    // Risky to change tokens without knowing boundaries.
    // SAFE BET: Re-split by space for western, or just use [newText] for Asian if undetermined?
    // Better: Try to find the token that was changed.

    // For "Enchanté(e)" -> Tokens likely ["Enchanté(e)", "."] or similar.
    // If we replace text, we should just return [newText] if it's a short phrase, 
    // or try simple space splitting for now.
    // NOTE: The app uses `tokens` for click-to-speech and pinyin. 
    // If we break tokenization, pinyin might fail if it relies on index alignment.
    // However, `TokenizedSentence` handles string rendering well.
    // Let's try simple space split for Fr, and just [newText] for Thai (no spaces).

    if (newText.includes(" ")) {
        return newText.split(" ").filter(t => t.length > 0);
    }
    return [newText];
}

export const PHRASES: Record<string, Phrase[]> = buildPhrases();

// Mock corpus for exploration - simple flat list
// (Here: 12 examples per language, picked from the phrase lists: 3 per category)
// Mock corpus for exploration - simple flat list
// (Here: 12 examples per language, picked from the phrase lists: 3 per category)
const CORPUS: Record<string, Phrase[]> = (() => {
    const out: Record<string, Phrase[]> = {};
    for (const lang of Object.keys(PHRASES)) {
        const list = PHRASES[lang];
        const pick: Phrase[] = [];
        const byCat: Record<string, Phrase[]> = {};
        for (const p of list) {
            byCat[p.categoryId] ||= [];
            byCat[p.categoryId].push(p);
        }
        for (const cat of ["greeting", "dining", "travel", "emotions"]) {
            const arr = byCat[cat] || [];
            if (arr[0]) pick.push(arr[0]);
            if (arr[1]) pick.push(arr[1]);
            if (arr[2]) pick.push(arr[2]);
        }
        out[lang] = pick;
    }
    return out;
})();

export const searchExamples = async (
    lang: string,
    query: string
): Promise<Phrase[]> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    const corpus = CORPUS[lang] || [];
    const normalizedQuery = query.toLowerCase().trim();

    return corpus
        .filter(item => item.targetText.toLowerCase().includes(normalizedQuery))
        .map((item, index) => ({ ...item, id: `ex-${index}-${item.id}` }));
};
