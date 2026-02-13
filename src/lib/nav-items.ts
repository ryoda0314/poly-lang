import {
    Map, Brain, BookOpen, MessageCircle, Languages, Layers,
    FileText, FolderOpen, GitBranch, PenTool, ScanText,
    Stethoscope, BookType, Sparkles, BookMarked, Target,
} from "lucide-react";
import { NavItemKey, LearningGoal } from "@/store/settings-store";

export type NavItemDef = {
    key: NavItemKey;
    href: string;
    icon: any;
    getLabel: (t: any) => string;
    relatedKeys?: NavItemKey[]; // shown as long-press sub-menu
};

export const NAV_ITEM_REGISTRY: Record<NavItemKey, Omit<NavItemDef, 'key'>> = {
    phrases:              { href: "/app/phrases",              icon: Map,         getLabel: (t) => t.phrases,                                         relatedKeys: ["swipe-deck", "script-learning", "long-text"] },
    corrections:          { href: "/app/corrections",          icon: BookOpen,    getLabel: (t) => t.corrections,                                     relatedKeys: ["chat", "expressions", "sentence-analysis"] },
    awareness:            { href: "/app/awareness",            icon: Brain,       getLabel: (t) => t.awareness,                                       relatedKeys: ["vocabulary-sets", "etymology"] },
    "learning-review":    { href: "/app/learning-review",      icon: Target,      getLabel: (t) => t.learningReview,                                  relatedKeys: ["awareness", "phrases"] },
    chat:                 { href: "/app/chat",                 icon: MessageCircle, getLabel: (t) => (t as any).chat || "Chat",                       relatedKeys: ["expressions", "corrections"] },
    expressions:          { href: "/app/expressions",          icon: Languages,   getLabel: (t) => (t as any).expressionPageTitle || "翻訳" },
    "sentence-analysis":  { href: "/app/sentence-analysis",    icon: ScanText,    getLabel: (t) => "英文解釈",                                         relatedKeys: ["long-text", "grammar-diagnostic"] },
    "vocabulary-sets":    { href: "/app/vocabulary-sets",      icon: FolderOpen,  getLabel: (t) => (t as any).vocabularySets || "単語集",                relatedKeys: ["etymology", "awareness", "my-vocabulary"] },
    etymology:            { href: "/app/etymology",            icon: GitBranch,   getLabel: (t) => (t as any).etymology || "語源辞典" },
    "swipe-deck":         { href: "/app/swipe-deck",           icon: Layers,      getLabel: (t) => (t as any).swipeLearning || "スワイプ学習",            relatedKeys: ["phrasal-verbs", "vocab-generator"] },
    "script-learning":    { href: "/app/script-learning",      icon: PenTool,     getLabel: (t) => (t as any).scriptLearning || "文字学習" },
    "long-text":          { href: "/app/long-text",            icon: FileText,    getLabel: (t) => (t as any).longTextExplorer || "長文探索" },
    "grammar-diagnostic": { href: "/app/grammar-diagnostic",   icon: Stethoscope, getLabel: (t) => (t as any).grammarDiagnostic || "構文診断" },
    "phrasal-verbs":      { href: "/app/phrasal-verbs",        icon: BookType,    getLabel: (t) => (t as any).phrasalVerbs || "句動詞辞典" },
    "vocab-generator":    { href: "/app/vocab-generator",      icon: Sparkles,    getLabel: (t) => (t as any).vocabGenerator || "単語生成" },
    "my-vocabulary":      { href: "/app/my-vocabulary",        icon: BookMarked,  getLabel: (t) => (t as any).myVocabulary || "My単語帳" },
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
