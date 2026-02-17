import {
    Map, Brain, BookOpen, MessageCircle, Languages, Layers,
    FileText, FolderOpen, GitBranch, PenTool, ScanText,
    Stethoscope, BookType, Sparkles, BookMarked, Target,
} from "lucide-react";
import { NavItemKey, LearningGoal } from "@/store/settings-store";

export type NavCategory = 'input' | 'output' | 'review' | 'dictionary';

export type NavItemDef = {
    key: NavItemKey;
    href: string;
    icon: any;
    getLabel: (t: any) => string;
    category: NavCategory;
    relatedKeys?: NavItemKey[]; // shown as long-press sub-menu
    englishOnly?: boolean; // only available when learning English
    hidden?: boolean; // temporarily hidden from all navigation
    languageSpecific?: { native: string; learning: string }; // only shown for specific language pair
};

export const NAV_ITEM_REGISTRY: Record<NavItemKey, Omit<NavItemDef, 'key'>> = {
    // --- Input ---
    phrases:              { href: "/app/phrases",              icon: Map,           getLabel: (t) => t.phrases,                                         category: "input", relatedKeys: ["swipe-deck", "script-learning", "long-text"] },
    "long-text":          { href: "/app/long-text",            icon: FileText,      getLabel: (t) => (t as any).longTextExplorer || "長文探索",            category: "input" },
    "sentence-analysis":  { href: "/app/sentence-analysis",    icon: ScanText,      getLabel: (t) => "英文解釈",                                         category: "input", relatedKeys: ["long-text", "grammar-diagnostic"], englishOnly: true },
    "script-learning":    { href: "/app/script-learning",      icon: PenTool,       getLabel: (t) => (t as any).scriptLearning || "文字学習",              category: "input" },
    "kanji-hanja":        { href: "/app/kanji-hanja",          icon: Languages,     getLabel: (t) => "漢字→한자",                                         category: "input", languageSpecific: { native: "ja", learning: "ko" } },
    expressions:          { href: "/app/expressions",          icon: Languages,     getLabel: (t) => (t as any).expressionPageTitle || "翻訳",             category: "input" },
    "grammar-diagnostic": { href: "/app/grammar-diagnostic",   icon: Stethoscope,   getLabel: (t) => (t as any).grammarDiagnostic || "構文診断",            category: "input" },
    "vocab-generator":    { href: "/app/vocab-generator",      icon: Sparkles,      getLabel: (t) => (t as any).vocabGenerator || "単語生成",               category: "input" },

    // --- Output ---
    corrections:          { href: "/app/corrections",          icon: BookOpen,      getLabel: (t) => t.corrections,                                     category: "output", relatedKeys: ["chat", "expressions", "sentence-analysis"] },
    chat:                 { href: "/app/chat",                 icon: MessageCircle, getLabel: (t) => (t as any).chat || "Chat",                          category: "output", relatedKeys: ["expressions", "corrections"] },

    // --- Dictionary ---
    etymology:            { href: "/app/etymology",            icon: GitBranch,     getLabel: (t) => (t as any).etymology || "語源辞典",                   category: "dictionary" },
    "phrasal-verbs":      { href: "/app/phrasal-verbs",        icon: BookType,      getLabel: (t) => (t as any).phrasalVerbs || "句動詞辞典",              category: "dictionary", englishOnly: true },
    "basic-phrases":      { href: "/app/basic-phrases",        icon: BookOpen,      getLabel: (t) => t.basicPhrases,                                    category: "dictionary" },
    "vocabulary-sets":    { href: "/app/vocabulary-sets",      icon: FolderOpen,    getLabel: (t) => (t as any).vocabularySets || "単語集",                category: "dictionary", relatedKeys: ["etymology", "awareness", "my-vocabulary"] },

    // --- Review ---
    awareness:            { href: "/app/awareness",            icon: Brain,         getLabel: (t) => t.awareness,                                       category: "review", relatedKeys: ["vocabulary-sets", "etymology"] },
    "swipe-deck":         { href: "/app/swipe-deck",           icon: Layers,        getLabel: (t) => (t as any).swipeLearning || "スワイプ学習",            category: "review", relatedKeys: ["phrasal-verbs", "vocab-generator"] },
    "my-vocabulary":      { href: "/app/my-vocabulary",        icon: BookMarked,    getLabel: (t) => (t as any).myVocabulary || "My単語帳",                category: "review" },
    "learning-review":    { href: "/app/learning-review",      icon: Target,        getLabel: (t) => t.learningReview,                                  category: "review", relatedKeys: ["awareness", "phrases"], hidden: true },

    // --- Dictionary (cont.) ---
    slang:                { href: "/app/slang",                icon: Sparkles,      getLabel: (t) => t.slangDatabase,                                   category: "dictionary" },
};

// Preset config per learning goal
export type GoalPreset = {
    navItems: NavItemKey[];
    relatedKeyOverrides?: Partial<Record<NavItemKey, NavItemKey[]>>;
};

export const GOAL_PRESETS: Record<LearningGoal, GoalPreset> = {
    beginner: {
        navItems: ["phrases", "corrections", "awareness"],
        relatedKeyOverrides: {
            phrases: ["swipe-deck", "script-learning"],
            corrections: ["chat", "expressions"],
            awareness: ["vocabulary-sets", "my-vocabulary"],
        },
    },
    conversation: {
        navItems: ["phrases", "chat", "awareness"],
    },
    balanced: {
        navItems: ["phrases", "corrections", "awareness"],
    },
    academic: {
        navItems: ["sentence-analysis", "corrections", "vocabulary-sets"],
    },
};

export function getMiddleNavKeys(
    goal: LearningGoal,
    customNavItems: NavItemKey[] | null
): NavItemKey[] {
    if (customNavItems && customNavItems.length >= 1) {
        return customNavItems.slice(0, 5); // max 5 custom items
    }
    return GOAL_PRESETS[goal].navItems;
}

/** Filter out hidden, englishOnly, and languageSpecific items */
export function filterByLanguage(keys: NavItemKey[], langCode: string, nativeLangCode?: string): NavItemKey[] {
    return keys.filter(k => {
        const def = NAV_ITEM_REGISTRY[k];
        if (!def || def.hidden) return false;
        if (def.englishOnly && langCode !== 'en') return false;
        if (def.languageSpecific) {
            if (!nativeLangCode) return false;
            if (def.languageSpecific.native !== nativeLangCode || def.languageSpecific.learning !== langCode) return false;
        }
        return true;
    });
}

export function getRelatedKeys(
    key: NavItemKey,
    goal: LearningGoal,
    customNavItems: NavItemKey[] | null
): NavItemKey[] | undefined {
    if (customNavItems && customNavItems.length >= 1) {
        return NAV_ITEM_REGISTRY[key].relatedKeys;
    }
    const preset = GOAL_PRESETS[goal];
    return preset.relatedKeyOverrides?.[key] ?? NAV_ITEM_REGISTRY[key].relatedKeys;
}

/** Group keys by category, preserving order within each category */
export function groupByCategory(keys: NavItemKey[]): Record<NavCategory, NavItemKey[]> {
    const groups: Record<NavCategory, NavItemKey[]> = {
        input: [], output: [], review: [], dictionary: [],
    };
    for (const k of keys) {
        const def = NAV_ITEM_REGISTRY[k];
        if (def) groups[def.category].push(k);
    }
    return groups;
}

/** Category display order */
export const CATEGORY_ORDER: NavCategory[] = ['input', 'output', 'review', 'dictionary'];

/** Parent (main) feature per category — dictionary has no parent */
export const CATEGORY_PARENT: Partial<Record<NavCategory, NavItemKey>> = {
    input: 'phrases',
    output: 'corrections',
    review: 'awareness',
};
