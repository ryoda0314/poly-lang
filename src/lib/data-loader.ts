import { NativeLanguage } from "./translations";

export interface LangPackItemItem {
    lang: string;
    targetText: string;
    tokens: string[] | string[][];
    tokensSlash: string;
}

export interface LangPackItem {
    level: string;
    studyType: string;
    deckId: string;
    categoryId: string;
    frameId: string;
    tags: string[];
    gloss_en: string;
    item: LangPackItemItem;
}

export type Phrase = {
    id: string;
    categoryId: string;
    translation: string;
    translations: {
        [key: string]: string;
    };
    tokens?: string[];
    tokensMap: {
        [key: string]: string[] | string[][];
    };
    tokensSlashMap: {
        [key: string]: string;
    };
};

export type Category = {
    id: string;
    name: string;
};

export type Language = {
    code: NativeLanguage;
    name: string;
    nativeName: string;
};

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

export const LANGUAGE_LOCALES: Record<string, string> = {
    en: "en-US",
    ja: "ja-JP",
    ko: "ko-KR",
    zh: "zh-CN",
    fr: "fr-FR",
    es: "es-ES",
    de: "de-DE",
    ru: "ru-RU",
    vi: "vi-VN",
};

export const GENDER_SUPPORTED_LANGUAGES = ["fr", "es", "ru", "de", "ar", "he", "hi"];

export type VoiceGender = "female" | "male";

export interface TtsVoice {
    name: string;
    gender: VoiceGender;
    label: string;
}

export const TTS_VOICES: TtsVoice[] = [
    // Female
    { name: "Achernar", gender: "female", label: "Soft" },
    { name: "Aoede", gender: "female", label: "Breezy" },
    { name: "Autonoe", gender: "female", label: "Bright" },
    { name: "Callirrhoe", gender: "female", label: "Easy-going" },
    { name: "Despina", gender: "female", label: "Smooth" },
    { name: "Erinome", gender: "female", label: "Clear" },
    { name: "Gacrux", gender: "female", label: "Mature" },
    { name: "Kore", gender: "female", label: "Firm" },
    { name: "Laomedeia", gender: "female", label: "Upbeat" },
    { name: "Leda", gender: "female", label: "Youthful" },
    { name: "Pulcherrima", gender: "female", label: "Forward" },
    { name: "Sulafat", gender: "female", label: "Warm" },
    { name: "Vindemiatrix", gender: "female", label: "Gentle" },
    { name: "Zephyr", gender: "female", label: "Bright" },
    // Male
    { name: "Achird", gender: "male", label: "Friendly" },
    { name: "Algenib", gender: "male", label: "Gravelly" },
    { name: "Algieba", gender: "male", label: "Smooth" },
    { name: "Alnilam", gender: "male", label: "Firm" },
    { name: "Charon", gender: "male", label: "Informative" },
    { name: "Enceladus", gender: "male", label: "Breathy" },
    { name: "Fenrir", gender: "male", label: "Excitable" },
    { name: "Iapetus", gender: "male", label: "Clear" },
    { name: "Orus", gender: "male", label: "Firm" },
    { name: "Puck", gender: "male", label: "Upbeat" },
    { name: "Rasalgethi", gender: "male", label: "Informative" },
    { name: "Sadachbia", gender: "male", label: "Lively" },
    { name: "Sadaltager", gender: "male", label: "Knowledgeable" },
    { name: "Schedar", gender: "male", label: "Even" },
    { name: "Umbriel", gender: "male", label: "Easy-going" },
    { name: "Zubenelgenubi", gender: "male", label: "Casual" },
];

// Cache for loaded language packs
const langPackCache: Record<string, LangPackItem[]> = {};

// Dynamic import functions for each language
const langPackImporters: Record<string, () => Promise<LangPackItem[]>> = {
    en: async () => {
        const [v1, v2, v3, v4, v5, v6, v7, v8, v9] = await Promise.all([
            import("../../langpack/phase2_L1_langpack/phase2_L1_en.json"),
            import("../../langpack/phase2_L1_v2_langpack/phase2_L1_v2_en.json"),
            import("../../langpack/phase2_L1_v3_langpack/phase2_L1_v3_en.json"),
            import("../../langpack/phase2_L1_v4_langpack/phase2_L1_v4_en.json"),
            import("../../langpack/phase2_L1_v5_langpack/phase2_L1_v5_en.json"),
            import("../../langpack/phase2_L1_v6_langpack/phase2_L1_v6_en.json"),
            import("../../langpack/phase2_L1_v7_langpack/phase2_L1_v7_en.json"),
            import("../../langpack/phase2_L1_v8_langpack/phase2_L1_v8_en.json"),
            import("../../langpack/phase2_L1_v9_langpack/phase2_L1_v9_en.json"),
        ]);
        return [...v1.default, ...v2.default, ...v3.default, ...v4.default, ...v5.default, ...v6.default, ...v7.default, ...v8.default, ...v9.default];
    },
    ja: async () => {
        const [v1, v2, v3, v4, v5, v6, v7, v8, v9] = await Promise.all([
            import("../../langpack/phase2_L1_langpack/phase2_L1_ja.json"),
            import("../../langpack/phase2_L1_v2_langpack/phase2_L1_v2_ja.json"),
            import("../../langpack/phase2_L1_v3_langpack/phase2_L1_v3_ja.json"),
            import("../../langpack/phase2_L1_v4_langpack/phase2_L1_v4_ja.json"),
            import("../../langpack/phase2_L1_v5_langpack/phase2_L1_v5_ja.json"),
            import("../../langpack/phase2_L1_v6_langpack/phase2_L1_v6_ja.json"),
            import("../../langpack/phase2_L1_v7_langpack/phase2_L1_v7_ja.json"),
            import("../../langpack/phase2_L1_v8_langpack/phase2_L1_v8_ja.json"),
            import("../../langpack/phase2_L1_v9_langpack/phase2_L1_v9_ja.json"),
        ]);
        return [...v1.default, ...v2.default, ...v3.default, ...v4.default, ...v5.default, ...v6.default, ...v7.default, ...v8.default, ...v9.default];
    },
    ko: async () => {
        const [v1, v2, v3, v4, v5, v6, v7, v8, v9] = await Promise.all([
            import("../../langpack/phase2_L1_langpack/phase2_L1_ko.json"),
            import("../../langpack/phase2_L1_v2_langpack/phase2_L1_v2_ko.json"),
            import("../../langpack/phase2_L1_v3_langpack/phase2_L1_v3_ko.json"),
            import("../../langpack/phase2_L1_v4_langpack/phase2_L1_v4_ko.json"),
            import("../../langpack/phase2_L1_v5_langpack/phase2_L1_v5_ko.json"),
            import("../../langpack/phase2_L1_v6_langpack/phase2_L1_v6_ko.json"),
            import("../../langpack/phase2_L1_v7_langpack/phase2_L1_v7_ko.json"),
            import("../../langpack/phase2_L1_v8_langpack/phase2_L1_v8_ko.json"),
            import("../../langpack/phase2_L1_v9_langpack/phase2_L1_v9_ko.json"),
        ]);
        return [...v1.default, ...v2.default, ...v3.default, ...v4.default, ...v5.default, ...v6.default, ...v7.default, ...v8.default, ...v9.default];
    },
    zh: async () => {
        const [v1, v2, v3, v4, v5, v6, v7, v8, v9] = await Promise.all([
            import("../../langpack/phase2_L1_langpack/phase2_L1_zh.json"),
            import("../../langpack/phase2_L1_v2_langpack/phase2_L1_v2_zh.json"),
            import("../../langpack/phase2_L1_v3_langpack/phase2_L1_v3_zh.json"),
            import("../../langpack/phase2_L1_v4_langpack/phase2_L1_v4_zh.json"),
            import("../../langpack/phase2_L1_v5_langpack/phase2_L1_v5_zh.json"),
            import("../../langpack/phase2_L1_v6_langpack/phase2_L1_v6_zh.json"),
            import("../../langpack/phase2_L1_v7_langpack/phase2_L1_v7_zh.json"),
            import("../../langpack/phase2_L1_v8_langpack/phase2_L1_v8_zh.json"),
            import("../../langpack/phase2_L1_v9_langpack/phase2_L1_v9_zh.json"),
        ]);
        return [...v1.default, ...v2.default, ...v3.default, ...v4.default, ...v5.default, ...v6.default, ...v7.default, ...v8.default, ...v9.default];
    },
    fr: async () => {
        const [v1, v2, v3, v4, v5, v6, v7, v8, v9] = await Promise.all([
            import("../../langpack/phase2_L1_langpack/phase2_L1_fr.json"),
            import("../../langpack/phase2_L1_v2_langpack/phase2_L1_v2_fr.json"),
            import("../../langpack/phase2_L1_v3_langpack/phase2_L1_v3_fr.json"),
            import("../../langpack/phase2_L1_v4_langpack/phase2_L1_v4_fr.json"),
            import("../../langpack/phase2_L1_v5_langpack/phase2_L1_v5_fr.json"),
            import("../../langpack/phase2_L1_v6_langpack/phase2_L1_v6_fr.json"),
            import("../../langpack/phase2_L1_v7_langpack/phase2_L1_v7_fr.json"),
            import("../../langpack/phase2_L1_v8_langpack/phase2_L1_v8_fr.json"),
            import("../../langpack/phase2_L1_v9_langpack/phase2_L1_v9_fr.json"),
        ]);
        return [...v1.default, ...v2.default, ...v3.default, ...v4.default, ...v5.default, ...v6.default, ...v7.default, ...v8.default, ...v9.default];
    },
    es: async () => {
        const [v1, v2, v3, v4, v5, v6, v7, v8, v9] = await Promise.all([
            import("../../langpack/phase2_L1_langpack/phase2_L1_es.json"),
            import("../../langpack/phase2_L1_v2_langpack/phase2_L1_v2_es.json"),
            import("../../langpack/phase2_L1_v3_langpack/phase2_L1_v3_es.json"),
            import("../../langpack/phase2_L1_v4_langpack/phase2_L1_v4_es.json"),
            import("../../langpack/phase2_L1_v5_langpack/phase2_L1_v5_es.json"),
            import("../../langpack/phase2_L1_v6_langpack/phase2_L1_v6_es.json"),
            import("../../langpack/phase2_L1_v7_langpack/phase2_L1_v7_es.json"),
            import("../../langpack/phase2_L1_v8_langpack/phase2_L1_v8_es.json"),
            import("../../langpack/phase2_L1_v9_langpack/phase2_L1_v9_es.json"),
        ]);
        return [...v1.default, ...v2.default, ...v3.default, ...v4.default, ...v5.default, ...v6.default, ...v7.default, ...v8.default, ...v9.default];
    },
    de: async () => {
        const [v1, v2, v3, v4, v5, v6, v7, v8, v9] = await Promise.all([
            import("../../langpack/phase2_L1_langpack/phase2_L1_de.json"),
            import("../../langpack/phase2_L1_v2_langpack/phase2_L1_v2_de.json"),
            import("../../langpack/phase2_L1_v3_langpack/phase2_L1_v3_de.json"),
            import("../../langpack/phase2_L1_v4_langpack/phase2_L1_v4_de.json"),
            import("../../langpack/phase2_L1_v5_langpack/phase2_L1_v5_de.json"),
            import("../../langpack/phase2_L1_v6_langpack/phase2_L1_v6_de.json"),
            import("../../langpack/phase2_L1_v7_langpack/phase2_L1_v7_de.json"),
            import("../../langpack/phase2_L1_v8_langpack/phase2_L1_v8_de.json"),
            import("../../langpack/phase2_L1_v9_langpack/phase2_L1_v9_de.json"),
        ]);
        return [...v1.default, ...v2.default, ...v3.default, ...v4.default, ...v5.default, ...v6.default, ...v7.default, ...v8.default, ...v9.default];
    },
    ru: async () => {
        const [v1, v2, v3, v4, v5, v6, v7, v8, v9] = await Promise.all([
            import("../../langpack/phase2_L1_langpack/phase2_L1_ru.json"),
            import("../../langpack/phase2_L1_v2_langpack/phase2_L1_v2_ru.json"),
            import("../../langpack/phase2_L1_v3_langpack/phase2_L1_v3_ru.json"),
            import("../../langpack/phase2_L1_v4_langpack/phase2_L1_v4_ru.json"),
            import("../../langpack/phase2_L1_v5_langpack/phase2_L1_v5_ru.json"),
            import("../../langpack/phase2_L1_v6_langpack/phase2_L1_v6_ru.json"),
            import("../../langpack/phase2_L1_v7_langpack/phase2_L1_v7_ru.json"),
            import("../../langpack/phase2_L1_v8_langpack/phase2_L1_v8_ru.json"),
            import("../../langpack/phase2_L1_v9_langpack/phase2_L1_v9_ru.json"),
        ]);
        return [...v1.default, ...v2.default, ...v3.default, ...v4.default, ...v5.default, ...v6.default, ...v7.default, ...v8.default, ...v9.default];
    },
    vi: async () => {
        const [v1, v2, v3, v4, v5, v6, v7, v8, v9] = await Promise.all([
            import("../../langpack/phase2_L1_langpack/phase2_L1_vi.json"),
            import("../../langpack/phase2_L1_v2_langpack/phase2_L1_v2_vi.json"),
            import("../../langpack/phase2_L1_v3_langpack/phase2_L1_v3_vi.json"),
            import("../../langpack/phase2_L1_v4_langpack/phase2_L1_v4_vi.json"),
            import("../../langpack/phase2_L1_v5_langpack/phase2_L1_v5_vi.json"),
            import("../../langpack/phase2_L1_v6_langpack/phase2_L1_v6_vi.json"),
            import("../../langpack/phase2_L1_v7_langpack/phase2_L1_v7_vi.json"),
            import("../../langpack/phase2_L1_v8_langpack/phase2_L1_v8_vi.json"),
            import("../../langpack/phase2_L1_v9_langpack/phase2_L1_v9_vi.json"),
        ]);
        return [...v1.default, ...v2.default, ...v3.default, ...v4.default, ...v5.default, ...v6.default, ...v7.default, ...v8.default, ...v9.default];
    },
};

// Load a specific language pack (with caching)
export async function loadLangPack(lang: string): Promise<LangPackItem[]> {
    if (langPackCache[lang]) {
        return langPackCache[lang];
    }

    const importer = langPackImporters[lang];
    if (!importer) {
        console.warn(`No language pack for: ${lang}`);
        return [];
    }

    const data = await importer();
    langPackCache[lang] = data;
    return data;
}

// Load multiple language packs in parallel
export async function loadLangPacks(langs: string[]): Promise<Record<string, LangPackItem[]>> {
    const results = await Promise.all(
        langs.map(async (lang) => {
            const data = await loadLangPack(lang);
            return [lang, data] as const;
        })
    );
    return Object.fromEntries(results);
}

// Cache for built phrases
let phrasesCache: Phrase[] | null = null;
let categoriesCache: Category[] | null = null;
let parentCategoriesCache: Category[] | null = null;
let phraseByIdCache: Map<string, Phrase> | null = null;

// Build phrases from loaded language packs
function buildPhrasesFromPacks(langPacks: Record<string, LangPackItem[]>): { phrases: Phrase[]; categories: Category[]; parentCategories: Category[] } {
    const phraseMap: Record<string, Phrase> = {};
    const categorySet = new Set<string>();

    const allKeys = Object.keys(langPacks);

    const frameIds = new Set<string>();
    allKeys.forEach(lang => {
        const pack = langPacks[lang];
        pack.forEach(p => frameIds.add(p.frameId));
    });

    frameIds.forEach(frameId => {
        const koItem = langPacks['ko']?.find(p => p.frameId === frameId);
        const enItem = langPacks['en']?.find(p => p.frameId === frameId);

        let numParts = 1;
        if (koItem && Array.isArray(koItem.item.tokens) && Array.isArray(koItem.item.tokens[0])) {
            numParts = koItem.item.tokens.length;
        } else if (enItem && enItem.item.targetText.includes('/')) {
            numParts = enItem.item.targetText.split('/').length;
        }

        for (let i = 0; i < numParts; i++) {
            const subId = numParts > 1 ? `${frameId}-${i}` : frameId;
            const baseItem = enItem || koItem || allKeys.map(k => langPacks[k]?.find(p => p.frameId === frameId)).find(Boolean);

            if (!baseItem) return;

            const newPhrase: Phrase = {
                id: subId,
                categoryId: baseItem.categoryId,
                translation: "",
                translations: {},
                tokensMap: {},
                tokensSlashMap: {}
            };

            allKeys.forEach(lang => {
                const p = langPacks[lang]?.find(p => p.frameId === frameId);
                if (!p) return;

                const parts = p.item.targetText.split('/');
                let textPart = parts[i] || parts[0];
                textPart = textPart.trim();
                newPhrase.translations[lang] = textPart;

                if (lang === 'en' && p.gloss_en) {
                    const glossParts = p.gloss_en.split('/');
                    newPhrase.translation = (glossParts[i] || glossParts[0]).trim();
                }

                let tokensPart: string[] = [];
                const rawTokens = p.item.tokens;

                if (Array.isArray(rawTokens) && Array.isArray(rawTokens[0])) {
                    tokensPart = (rawTokens as string[][])[i] || [];
                } else if (Array.isArray(rawTokens)) {
                    const flatTokens = rawTokens as string[];

                    if (numParts === 1) {
                        tokensPart = flatTokens;
                    } else {
                        const splitIndices: number[] = [0];
                        flatTokens.forEach((t, idx) => {
                            if (idx > 0 && t.startsWith('/')) {
                                splitIndices.push(idx);
                            }
                        });
                        splitIndices.push(flatTokens.length);

                        const start = splitIndices[i];
                        const end = splitIndices[i + 1];

                        if (start !== undefined && end !== undefined) {
                            tokensPart = flatTokens.slice(start, end);
                            if (tokensPart.length > 0 && tokensPart[0].startsWith('/')) {
                                tokensPart[0] = tokensPart[0].substring(1);
                            }
                        } else {
                            tokensPart = flatTokens;
                        }
                    }
                }
                newPhrase.tokensMap[lang] = tokensPart;

                const slashSegments = p.item.tokensSlash.split('//');
                newPhrase.tokensSlashMap[lang] = (slashSegments[i] || slashSegments[0]).trim();
            });

            if (!newPhrase.translation && newPhrase.translations['en']) {
                newPhrase.translation = newPhrase.translations['en'];
            }

            phraseMap[subId] = newPhrase;
            categorySet.add(baseItem.categoryId);
        }
    });

    const phrases = Object.values(phraseMap);
    const categories = Array.from(categorySet).map(id => ({
        id,
        name: formatCategoryName(id)
    }));

    const parentCategorySet = new Set<string>();
    phrases.forEach(p => {
        parentCategorySet.add(getParentCategory(p.categoryId));
    });

    const parentCategories: Category[] = Array.from(parentCategorySet).map(id => ({
        id,
        name: formatParentCategoryName(id)
    }));

    return { phrases, categories, parentCategories };
}

const formatCategoryName = (id: string) => {
    const parts = id.split('_');
    if (parts.length > 1) {
        return parts.slice(1).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
    }
    return id;
};

const getParentCategory = (categoryId: string): string => {
    const parts = categoryId.split('_');
    if (parts.length > 1) {
        return parts[1];
    }
    return categoryId;
};

const formatParentCategoryName = (id: string): string => {
    return id.charAt(0).toUpperCase() + id.slice(1);
};

// Load all phrases (loads all language packs)
export async function loadAllPhrases(): Promise<Phrase[]> {
    if (phrasesCache) {
        return phrasesCache;
    }

    const allLangs = ['en', 'ja', 'ko', 'zh', 'fr', 'es', 'de', 'ru', 'vi'];
    const langPacks = await loadLangPacks(allLangs);
    const { phrases, categories, parentCategories } = buildPhrasesFromPacks(langPacks);

    phrasesCache = phrases;
    categoriesCache = categories;
    parentCategoriesCache = parentCategories;
    phraseByIdCache = new Map(phrases.map(p => [p.id, p]));

    return phrases;
}

// Get categories (requires phrases to be loaded first)
export async function loadCategories(): Promise<Category[]> {
    if (categoriesCache) {
        return categoriesCache;
    }
    await loadAllPhrases();
    return categoriesCache!;
}

// Get parent categories
export async function loadParentCategories(): Promise<Category[]> {
    if (parentCategoriesCache) {
        return parentCategoriesCache;
    }
    await loadAllPhrases();
    return parentCategoriesCache!;
}

// Get phrase by ID (async)
export async function getPhraseByIdAsync(id: string): Promise<Phrase | undefined> {
    if (phraseByIdCache) {
        return phraseByIdCache.get(id);
    }
    await loadAllPhrases();
    return phraseByIdCache!.get(id);
}

// Get phrases by category (async)
export async function getPhrasesByCategoryAsync(categoryId: string): Promise<Phrase[]> {
    const phrases = await loadAllPhrases();
    if (categoryId === "all") return phrases;
    return phrases.filter((phrase) => phrase.categoryId === categoryId);
}

// Get phrases by parent category (async)
export async function getPhrasesByParentCategoryAsync(parentCategoryId: string): Promise<Phrase[]> {
    const phrases = await loadAllPhrases();
    if (parentCategoryId === "all") return phrases;
    return phrases.filter((phrase) => getParentCategory(phrase.categoryId) === parentCategoryId);
}

// Helper to get parent category for a phrase
export const getParentCategoryId = (categoryId: string): string => {
    return getParentCategory(categoryId);
};

// Preload phrases in the background (call this early in app lifecycle)
export function preloadPhrases(): void {
    loadAllPhrases().catch(console.error);
}
