export interface ScriptCharacter {
    id: string;
    character: string;
    romanization: string;
    pronunciation: string;
    meaning?: string;
    category: string;
    order: number;
    mnemonic?: string;
    strokeCount?: number;
    strokeOrder?: string[];
    variants?: {
        isolated?: string;
        initial?: string;
        medial?: string;
        final?: string;
    };
    relatedCharacters?: string[];
    examples?: {
        word: string;
        reading: string;
        meaning: string;
    }[];
}

export interface ScriptCategory {
    id: string;
    name: string;
    nameNative: string;
}

export interface ScriptSet {
    id: string;
    languageCode: string;
    name: string;
    nameNative: string;
    description: string;
    totalCharacters: number;
    categories: ScriptCategory[];
    characters: ScriptCharacter[];
}

export interface LanguageScriptInfo {
    languageCode: string;
    languageName: string;
    scripts: string[];
}
