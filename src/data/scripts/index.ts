import type { ScriptSet, LanguageScriptInfo } from './types';

export type { ScriptCharacter, ScriptSet, ScriptCategory, LanguageScriptInfo } from './types';

// Lazy-loaded script data registry
const SCRIPT_REGISTRY: Record<string, () => Promise<{ default: ScriptSet }>> = {
    'ja-hiragana': () => import('./ja-hiragana.json') as any,
    'ja-katakana': () => import('./ja-katakana.json') as any,
    'ko-jamo': () => import('./ko-jamo.json') as any,
    'zh-hsk1': () => import('./zh-hsk1.json') as any,
    'ru-cyrillic': () => import('./ru-cyrillic.json') as any,
    'th-consonants': () => import('./th-consonants.json') as any,
    'th-vowels': () => import('./th-vowels.json') as any,
    'hi-devanagari': () => import('./hi-devanagari.json') as any,
    'ar-alphabet': () => import('./ar-alphabet.json') as any,
    'en-alphabet': () => import('./en-alphabet.json') as any,
};

// Map language codes to their available script sets
export const LANGUAGE_SCRIPTS: Record<string, LanguageScriptInfo> = {
    ja: { languageCode: 'ja', languageName: 'Japanese', scripts: ['ja-hiragana', 'ja-katakana'] },
    ko: { languageCode: 'ko', languageName: 'Korean', scripts: ['ko-jamo'] },
    zh: { languageCode: 'zh', languageName: 'Chinese', scripts: ['zh-hsk1'] },
    ru: { languageCode: 'ru', languageName: 'Russian', scripts: ['ru-cyrillic'] },
    th: { languageCode: 'th', languageName: 'Thai', scripts: ['th-consonants', 'th-vowels'] },
    hi: { languageCode: 'hi', languageName: 'Hindi', scripts: ['hi-devanagari'] },
    ar: { languageCode: 'ar', languageName: 'Arabic', scripts: ['ar-alphabet'] },
    en: { languageCode: 'en', languageName: 'English', scripts: ['en-alphabet'] },
};

// All available language codes for script learning (including non-app languages)
export const SCRIPT_LANGUAGE_CODES = Object.keys(LANGUAGE_SCRIPTS);

// Load a script set by ID
export async function loadScriptSet(scriptId: string): Promise<ScriptSet | null> {
    const loader = SCRIPT_REGISTRY[scriptId];
    if (!loader) return null;
    const mod = await loader();
    return (mod as any).default ?? mod;
}

// Get all script set IDs for a language
export function getScriptIdsForLanguage(langCode: string): string[] {
    return LANGUAGE_SCRIPTS[langCode]?.scripts ?? [];
}
