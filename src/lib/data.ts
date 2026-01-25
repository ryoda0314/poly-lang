import {
    Phrase,
    Category,
    Language,
    loadAllPhrases,
    loadCategories,
    loadParentCategories,
    getPhraseByIdAsync,
    getPhrasesByCategoryAsync,
    getPhrasesByParentCategoryAsync,
    getParentCategoryId,
    LANGUAGES,
    LANGUAGE_LOCALES,
    GENDER_SUPPORTED_LANGUAGES,
} from "./data-loader";

// Re-export types
export type { Phrase, Category, Language };
export type { LangPackItem, LangPackItemItem } from "./data-loader";

// Re-export constants (these are small, no performance impact)
export { LANGUAGES, LANGUAGE_LOCALES, GENDER_SUPPORTED_LANGUAGES, getParentCategoryId };

// Lazy-loaded data with caching
let _phrases: Phrase[] | null = null;
let _categories: Category[] | null = null;
let _parentCategories: Category[] | null = null;
let _phraseMap: Map<string, Phrase> | null = null;
let _loadingPromise: Promise<void> | null = null;

// Ensure data is loaded (call this before accessing PHRASES/CATEGORIES)
async function ensureLoaded(): Promise<void> {
    if (_phrases !== null) return;

    if (_loadingPromise) {
        await _loadingPromise;
        return;
    }

    _loadingPromise = (async () => {
        _phrases = await loadAllPhrases();
        _categories = await loadCategories();
        _parentCategories = await loadParentCategories();
        _phraseMap = new Map(_phrases.map(p => [p.id, p]));
    })();

    await _loadingPromise;
}

// Start loading immediately when this module is imported
ensureLoaded().catch(console.error);

// Synchronous exports for backward compatibility
// These will be empty initially but populated after loading
// Components should handle the loading state appropriately
export let PHRASES: Phrase[] = [];
export let CATEGORIES: Category[] = [];
export let PARENT_CATEGORIES: Category[] = [];

// Update exports when data is loaded
ensureLoaded().then(() => {
    PHRASES = _phrases || [];
    CATEGORIES = _categories || [];
    PARENT_CATEGORIES = _parentCategories || [];
}).catch(console.error);

// Synchronous helper functions (use cached data if available)
export const getPhrasesByCategory = (categoryId: string): Phrase[] => {
    if (categoryId === "all") return PHRASES;
    return PHRASES.filter((phrase) => phrase.categoryId === categoryId);
};

export const getPhrasesByParentCategory = (parentCategoryId: string): Phrase[] => {
    const getParentCategory = (categoryId: string): string => {
        const parts = categoryId.split('_');
        return parts.length > 1 ? parts[1] : categoryId;
    };
    if (parentCategoryId === "all") return PHRASES;
    return PHRASES.filter((phrase) => getParentCategory(phrase.categoryId) === parentCategoryId);
};

export const getPhraseById = (id: string): Phrase | undefined => {
    if (_phraseMap) {
        return _phraseMap.get(id);
    }
    return PHRASES.find((phrase) => phrase.id === id);
};

// Async versions for components that can handle promises
export {
    loadAllPhrases,
    loadCategories,
    loadParentCategories,
    getPhraseByIdAsync,
    getPhrasesByCategoryAsync,
    getPhrasesByParentCategoryAsync,
};

// Helper to check if data is loaded
export const isDataLoaded = (): boolean => _phrases !== null;

// Helper to wait for data to be loaded
export const waitForData = (): Promise<void> => ensureLoaded();
