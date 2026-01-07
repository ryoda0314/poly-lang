export type Language = {
    code: string;
    name: string;
};

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
};

export type Category = {
    id: string;
    name: string;
};

import rawData from "../../dataset_tokenized_modeB.json";

export const LANGUAGES: Language[] = [
    { code: "en", name: "English" },
    { code: "ko", name: "Korean" },
    { code: "ja", name: "Japanese" },

    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "pt", name: "Portuguese" },
    { code: "ru", name: "Russian" },
    { code: "zh", name: "Chinese (Simplified)" },
    { code: "ar", name: "Arabic" },
    { code: "hi", name: "Hindi" },
    { code: "th", name: "Thai" },
    { code: "vi", name: "Vietnamese" },
    { code: "id", name: "Indonesian" },
    { code: "tr", name: "Turkish" },
    { code: "nl", name: "Dutch" },
    { code: "sv", name: "Swedish" },
    { code: "pl", name: "Polish" },
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
                }
            });
        }
    }

    return out;
}

export const PHRASES: Record<string, Phrase[]> = buildPhrases();

// Mock corpus for exploration - simple flat list
// (Here: 12 examples per language, picked from the phrase lists: 3 per category)
const CORPUS: Record<string, { text: string; translation: string; translation_ko?: string }[]> = (() => {
    const out: Record<string, { text: string; translation: string; translation_ko?: string }[]> = {};
    for (const lang of Object.keys(PHRASES)) {
        const list = PHRASES[lang];
        const pick: { text: string; translation: string; translation_ko?: string }[] = [];
        const byCat: Record<string, Phrase[]> = {};
        for (const p of list) {
            byCat[p.categoryId] ||= [];
            byCat[p.categoryId].push(p);
        }
        for (const cat of ["greeting", "dining", "travel", "emotions"]) {
            const arr = byCat[cat] || [];
            pick.push(
                { text: arr[0]?.targetText ?? "", translation: arr[0]?.translation ?? "", translation_ko: arr[0]?.translation_ko ?? "" },
                { text: arr[1]?.targetText ?? "", translation: arr[1]?.translation ?? "", translation_ko: arr[1]?.translation_ko ?? "" },
                { text: arr[2]?.targetText ?? "", translation: arr[2]?.translation ?? "", translation_ko: arr[2]?.translation_ko ?? "" }
            );
        }
        out[lang] = pick.filter(x => x.text && x.translation);
    }
    return out;
})();

export const searchExamples = async (
    lang: string,
    query: string
): Promise<{ id: string; text: string; translation: string; translation_ko?: string }[]> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    const corpus = CORPUS[lang] || [];
    const normalizedQuery = query.toLowerCase().trim();

    return corpus
        .filter(item => item.text.toLowerCase().includes(normalizedQuery))
        .map((item, index) => ({ id: `ex-${index}`, ...item }));
};
