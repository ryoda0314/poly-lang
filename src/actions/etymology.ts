"use server";

import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { checkAndConsumeCredit } from "@/lib/limits";
import { logTokenUsage } from "@/lib/token-usage";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// ── Language Constants ──

const WIKTIONARY_LANG_HEADERS: Record<string, string> = {
    en: "English", fr: "French", de: "German", es: "Spanish",
    ja: "Japanese", zh: "Chinese", ko: "Korean", ru: "Russian", vi: "Vietnamese",
};

const ETYMOLOGY_TIERS: Record<string, 1 | 2 | 3> = {
    en: 1, fr: 1, de: 1, es: 1,
    ja: 2, zh: 2, ko: 2, ru: 2,
    vi: 3,
};

const LANG_NAMES: Record<string, string> = {
    en: "English", fr: "French", de: "German", es: "Spanish",
    ja: "Japanese", zh: "Chinese", ko: "Korean", ru: "Russian", vi: "Vietnamese",
};

// Language family info for tree depth guidance
type LangFamily = "ie" | "cjk" | "koreanic" | "vietic";
const LANG_FAMILY: Record<string, LangFamily> = {
    en: "ie", fr: "ie", de: "ie", es: "ie", ru: "ie",
    ja: "cjk", zh: "cjk",
    ko: "koreanic",
    vi: "vietic",
};

function getTreeDepthGuidance(targetLang: string): string {
    const family = LANG_FAMILY[targetLang] ?? "ie";
    switch (family) {
        case "ie":
            return `Trace EVERY branch to Proto-Indo-European (PIE) reconstructed forms (*-prefixed). Use abbreviations: "PIE", "PGmc" (Proto-Germanic), "PItal" (Proto-Italic), "OE", "ME", "OF", "Lat", "Gk". Example leaf: { "word": "*ne", "language": "PIE", "meaning": "not" }`;
        case "cjk":
            return `Trace branches to the oldest known forms: Old Chinese / Middle Chinese for Sinitic roots, Old Japanese for native Japonic roots. For Sino-Japanese (漢語) words, show the Chinese character etymology and the borrowing path (Middle Chinese → Old Japanese → Modern). For native words (和語), trace to Proto-Japonic if known. Use abbreviations: "OC" (Old Chinese), "MC" (Middle Chinese), "OJ" (Old Japanese), "MJ" (Middle Japanese).`;
        case "koreanic":
            return `Trace branches to: Middle Korean (중세 한국어) or Proto-Koreanic for native roots; Middle Chinese for Sino-Korean (한자어). Show sound changes (e.g. ㅎ탈落, 모음조화). Use abbreviations: "MK" (Middle Korean), "MC" (Middle Chinese), "OC" (Old Chinese), "PKor" (Proto-Koreanic).`;
        case "vietic":
            return `Trace branches to: Proto-Vietic for native roots; Middle Chinese / Old Chinese for Sino-Vietnamese. Use abbreviations: "PViet" (Proto-Vietic), "MC" (Middle Chinese), "OC" (Old Chinese).`;
    }
}

// ── Language-Specific Critical Rules ──

function getCriticalRules(targetLang: string, normalizedWord: string): string {
    const family = LANG_FAMILY[targetLang] ?? "ie";

    // Shared tree rules (all languages)
    const sharedTreeRules = `- tree_data: ROOT = the modern word "${normalizedWord}". children = its etymological source(s). Each source's children = its morphological components OR older ancestors. STRICT RULES:
  (a) DIRECT ANCESTORS ONLY: The tree must contain ONLY the direct ancestral line — the chain of forms that the modern word actually descended from — plus its morphological decomposition (prefixes, roots, suffixes) at each historical stage. Parallel borrowings, cognate forms in sibling languages, and alternative transmission routes must be EXCLUDED from the tree and placed in the "cognates" field instead. However, morphological components MUST always be included — they are part of the word's internal structure, not parallel forms.
  (b) TEMPORAL DIRECTION: Every child node MUST be OLDER than its parent. The tree traces backwards in time. If a node's child would be from the same era or newer, it does not belong in the tree.
  (d) NEVER repeat the same word+language at two levels. Each node = a DISTINCT historical form.
  (e) Show ALL intermediate stages between the modern word and the oldest reconstructed form.
  (h) Aim for 8–15 nodes. 3–5 nodes is TOO SHALLOW.
  (i) Use the short language abbreviations specified in TREE DEPTH GUIDANCE.
  (j) NEVER duplicate: each unique word+language pair must appear EXACTLY ONCE in the entire tree.
  (k) PARALLEL ROUTES: When the etymology chain lists multiple intermediate languages (e.g. "via Nrf, Fr, and It"), pick the SINGLE most direct transmission route for the tree. Place the alternative routes in "cognates" instead. Do NOT chain parallel routes sequentially — that creates a false linear path.
  (l) PIE ROOT CONSISTENCY: The deepest leaves of tree_data MUST match the oldest forms in part_breakdown.ancestry. If part_breakdown traces a root to PIE *X, then tree_data MUST also reach PIE *X for that root. When a word derives from a compound number (e.g. Lat quadrāgintā = 4×10), include BOTH component roots (e.g. PIE *kʷetwóres "4" AND PIE *dékm̥t "10") as sibling children.`;

    const sharedOtherRules = `- cognates: include 3-5 cognates from different language families when available. IMPORTANT: parallel borrowing routes and sibling-language forms that were EXCLUDED from tree_data MUST be included here as cognates so the information is not lost.
- confidence: "high" = well-documented. "medium" = some uncertainty. "low" = debated or poorly documented. Be honest.`;

    let specificRules: string;

    if (family === "cjk" && targetLang === "ja") {
        specificRules = getJaRules();
    } else if (family === "cjk" && targetLang === "zh") {
        specificRules = getZhRules();
    } else if (family === "koreanic") {
        specificRules = getKoRules();
    } else if (family === "vietic") {
        specificRules = getViRules();
    } else {
        specificRules = getIeRules(normalizedWord);
    }

    return `CRITICAL RULES:\n${specificRules}\n${sharedTreeRules}\n${sharedOtherRules}`;
}

function getIeRules(normalizedWord: string): string {
    return `- part_breakdown: decompose into the SMALLEST meaningful morphemes. "incredible" = in- + cred- + -ible (3 parts). "unbreakable" = un- + break + -able. NEVER merge a root with its derivational suffix.
- part_breakdown.ancestry: trace each morpheme to the oldest reconstructed form. Use * for reconstructed forms. Example: cred- ancestry = [{ form: "*ḱerd-", language: "PIE", meaning: "heart" }, { form: "crēdō", language: "Lat", meaning: "believe" }].
  (c) For the MAIN etymological root(s), trace all the way to PIE. For prefixes and suffixes, trace back only 1–2 stages. NEVER fabricate a proto-language root — if unsure, stop at the oldest KNOWN form.
  (f) When a word has multiple morphemes (prefix + root + suffix), show EACH as a separate child — creating merge/split points.
  (g) Decompose morphologically at the SAME language level first. All sibling children of a node should be from the same language stage. THEN each child traces deeper independently. e.g. Lat "crēdibilis" → children: [Lat "crēdō", Lat "-ibilis"]. Then Lat "crēdō" → children: [PIE "*ḱerd-", PIE "*dʰeh₁-"]. NEVER mix Lat and PIE as siblings under the same parent.
- compound_tree: show how the MODERN morphemes from part_breakdown combine to form the word. ALL nodes must be in the TARGET language only — NEVER insert historical forms from other languages (e.g. no Greek or Latin intermediate nodes). Root = modern word, leaves = EXACTLY the same morphemes as part_breakdown. For 2-part words, the tree is simply: word → [part1, part2] with NO intermediate node. Only use intermediate nodes for 3+ parts to show grouping. Example: incredible → [in-, credible → [cred-, -ible]]. Example: philosophy → [philo-, -sophy] (NO Greek φιλοσοφία in between).`;
}

function getJaRules(): string {
    return `- WORD CLASSIFICATION: First classify the word as 漢語（Sino-Japanese）/ 和語（native Japanese）/ 外来語（loanword）/ 混種語（hybrid）. This classification MUST appear in etymology_summary.
- part_breakdown:
  • 漢語: each kanji = one morpheme. Example: "民主" = 民 (people) + 主 (master). "電話" = 電 (electricity) + 話 (speech).
  • 和語: decompose into stem + grammatical affixes. Example: "食べる" = 食べ (eat, stem) + る (verb ending). "美しい" = 美し (beautiful, stem) + い (adjective ending).
  • 外来語: treat as a single root morpheme and trace to the source language. Example: "パン" = パン (bread, from Portuguese).
  • 混種語: decompose into its 漢語/和語/外来語 components.
- part_breakdown.ancestry: trace each morpheme to the oldest known form. For 漢語 characters: trace to MC (Middle Chinese) and OC (Old Chinese). Example: 民 ancestry = [{ form: "mjin", language: "MC", meaning: "people" }, { form: "*miŋ", language: "OC", meaning: "people" }]. For 和語: trace to OJ (Old Japanese) or Proto-Japonic. For 外来語: trace to the source language form.
  (c) For 漢語, trace each character to OC/MC. For 和語, trace to OJ. For 外来語, trace to the source language. Stop at the oldest KNOWN form — do not fabricate.
  (f) For 漢語 compound words, show each kanji as a separate child. For 和語, show stem and affix as separate children.
  (g) Decompose at the SAME language level first. For 漢語: show kanji components at the Japanese level, THEN trace each to MC/OC independently.
- compound_tree: ALL nodes must be in the TARGET language only — NEVER insert historical forms from other languages. Root = modern word, leaves = EXACTLY the same morphemes as part_breakdown. For 2-part words: word → [part1, part2] with NO intermediate node. Example: 民主主義 → [民主 → [民, 主], 主義 → [主, 義]].
- pronunciation: use hiragana reading (e.g. "みんしゅ").`;
}

function getZhRules(): string {
    return `- part_breakdown: each character = one morpheme. Example: "民主" = 民 (people) + 主 (master). "电话" = 电 (electricity) + 话 (speech).
- part_breakdown.ancestry: trace each character to the oldest known form. Include MC (Middle Chinese) and OC (Old Chinese) reconstructions. Example: 民 ancestry = [{ form: "mjin", language: "MC", meaning: "people" }, { form: "*miŋ", language: "OC", meaning: "people" }]. Where well-documented, mention 部首 (radical) meaning to illuminate the character's semantic origin. Also note 字形 (character form) evolution stages (甲骨文→金文→篆書→楷書) if relevant.
  (c) Trace each character to OC/MC. Include 甲骨文 (oracle bone) or 金文 (bronze inscription) forms when well-documented. Stop at the oldest KNOWN form.
  (f) For compound words, show each character as a separate child.
  (g) Decompose at the modern Chinese level first, THEN trace each character to MC/OC independently.
- compound_tree: ALL nodes must be in the TARGET language only — NEVER insert historical forms from other languages. Root = modern word, leaves = EXACTLY the same morphemes as part_breakdown. For 2-part words: word → [part1, part2] with NO intermediate node. Example: 民主主义 → [民主 → [民, 主], 主义 → [主, 义]].
- 部首 ANALYSIS: when a character's radical provides meaningful etymological insight (e.g. 氵= water in 海), include this in the character's meaning field.
- pronunciation: use pinyin with tone marks (e.g. "mínzhǔ").`;
}

function getKoRules(): string {
    return `- WORD CLASSIFICATION: First classify the word as 한자어（Sino-Korean）/ 고유어（native Korean）/ 외래어（loanword）. This classification MUST appear in etymology_summary.
- part_breakdown:
  • 한자어: each syllable = one hanja = one morpheme. Include both 훈 (meaning reading) and 음 (sound reading). Example: "민주 (民主)" = 민 (民, people) + 주 (主, master). "전화 (電話)" = 전 (電, electricity) + 화 (話, speech).
  • 고유어: decompose into stem + grammatical affixes. Example: "아름답다" = 아름 (beauty, stem) + 답다 (adjective suffix). "어이없다" = 어이 (sense/reason) + 없다 (to lack).
  • 외래어: treat as a single root and trace to source language.
- part_breakdown.ancestry: For 한자어: trace each hanja to MC (Middle Chinese) and then to MK (Middle Korean) sound. Example: 민 ancestry = [{ form: "mjin", language: "MC", meaning: "people" }, { form: "민", language: "MK", meaning: "people" }]. For 고유어: trace to MK (Middle Korean) or PKor (Proto-Koreanic). Include sound changes (e.g. ㅎ탈락, 모음조화).
  (c) For 한자어, trace each hanja to MC/OC. For 고유어, trace to MK/PKor. Stop at the oldest KNOWN form.
  (f) For 한자어, show each syllable/hanja as a separate child. For 고유어, show stem and affixes separately.
  (g) Decompose at the modern Korean level first, THEN trace each component to MC/MK independently.
- compound_tree: ALL nodes must be in the TARGET language only — NEVER insert historical forms from other languages. Root = modern word, leaves = EXACTLY the same morphemes as part_breakdown. For 2-part words: word → [part1, part2] with NO intermediate node. Example: 민주주의 → [민주 → [민, 주], 주의 → [주, 의]].
- pronunciation: use Revised Romanization (e.g. "minju").`;
}

function getViRules(): string {
    return `- WORD CLASSIFICATION: First classify the word as Hán Việt（Sino-Vietnamese）/ thuần Việt（native Vietnamese）/ borrowed. This classification MUST appear in etymology_summary.
- part_breakdown:
  • Hán Việt: each syllable corresponds to one Chinese character = one morpheme. Example: "dân chủ (民主)" = dân (民, people) + chủ (主, master).
  • thuần Việt: treat as root morpheme(s). Decompose compound native words where possible.
  • Borrowed: trace to source language.
- part_breakdown.ancestry: For Hán Việt: trace each syllable to its Chinese character, then to MC/OC. Example: dân ancestry = [{ form: "mjin", language: "MC", meaning: "people" }]. For thuần Việt: trace to PViet (Proto-Vietic) when known.
  (c) For Hán Việt, trace to MC/OC. For thuần Việt, trace to Proto-Vietic. Stop at the oldest KNOWN form.
  (f) For Hán Việt compound words, show each syllable as a separate child.
  (g) Decompose at the modern Vietnamese level first, THEN trace each component to MC/OC or PViet independently.
- compound_tree: ALL nodes must be in the TARGET language only — NEVER insert historical forms from other languages. Root = modern word, leaves = EXACTLY the same morphemes as part_breakdown. For 2-part words: word → [part1, part2] with NO intermediate node.
- pronunciation: use Vietnamese spelling with diacritics (e.g. "dân chủ").`;
}

// ── Types ──

export interface PartAncestorNode {
    form: string;
    language: string;
    meaning: string;
}

export interface PartBreakdown {
    part: string;
    type: "prefix" | "suffix" | "root" | "combining_form";
    meaning: string;
    origin: string;
    ancestry?: PartAncestorNode[];
}

export interface LearningHint {
    part: string;
    hint: string;
}

export interface NuanceNote {
    words: string[];
    explanation: string;
}

export interface Cognate {
    word: string;
    language: string;
    meaning: string;
}

export interface TreeNode {
    word: string;
    language: string;
    meaning?: string;
    relation?: string;
    children?: TreeNode[];
}

export interface CompoundTree {
    form: string;
    language: string;
    meaning?: string;
    components?: CompoundTree[];
}

export type ConfidenceLevel = "high" | "medium" | "low";

export interface ConfidenceInfo {
    overall: ConfidenceLevel;
    etymology: ConfidenceLevel;
    parts: ConfidenceLevel;
    tree: ConfidenceLevel;
    reasoning?: string;
}

export interface EtymologyEntry {
    id: string;
    word: string;
    target_language: string;
    definition: string | null;
    origin_language: string | null;
    etymology_summary: string | null;
    pronunciation: string | null;
    part_breakdown: PartBreakdown[] | null;
    first_known_use: string | null;
    tree_data: TreeNode | null;
    etymology_story: string | null;
    learning_hints: LearningHint[] | null;
    nuance_notes: NuanceNote[] | null;
    cognates: Cognate[] | null;
    compound_tree: CompoundTree | null;
    confidence: ConfidenceInfo | null;
    has_wiktionary_data: boolean;
    source_type: "wiktionary" | "web_search" | "ai_only" | "expression";
}

export interface EtymologyResult {
    entry: EtymologyEntry | null;
    error?: string;
}

export interface WordPart {
    id: string;
    part: string;
    part_type: string;
    meaning: string;
    origin_language: string;
    examples: string[] | null;
    learning_hint: string | null;
}

// ── Admin Check ──

async function isAdmin(supabase: any, userId: string): Promise<boolean> {
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
    return profile?.role === "admin";
}

// ── Web Search (Admin-only) ──

async function fetchWebEtymology(word: string, targetLang: string): Promise<string | null> {
    const langName = LANG_NAMES[targetLang] || "English";
    try {
        const response = await openai.responses.create({
            model: "gpt-5.2",
            tools: [{ type: "web_search" as any }],
            input: `Search for the etymology of the ${langName} word "${word}" using authoritative linguistic sources. Prioritize: etymological dictionaries (e.g. Oxford English Dictionary, 국립국어원 표준국어대사전 for Korean, 大辞林/日本国語大辞典 for Japanese), academic papers on historical linguistics, and official language institute publications. Find: the earliest attested form, historical sound changes, the language of origin, and how the word evolved to its modern form. Cite specific sources when possible.`,
        });

        const text = (response as any).output_text;
        if (!text || text.length < 20) return null;

        console.log(`--- Web search result (${text.length} chars) ---\n${text.slice(0, 500)}...\n`);
        return text;
    } catch (e) {
        console.error("Web search error:", e);
        return null;
    }
}

// ── Wikitext Stock ──

async function getStockedWikitext(word: string, targetLang: string, supabase: any): Promise<string | null> {
    const { data, error } = await supabase
        .from("etymology_wikitext_stock")
        .select("raw_wikitext")
        .eq("word", word)
        .eq("target_language", targetLang)
        .single();
    if (error || !data) return null;
    return data.raw_wikitext;
}

// ── Wiktionary API ──

interface WiktionaryResult {
    pageExists: boolean;
    etymology: string | null;
}

async function fetchWiktionaryEtymology(word: string, targetLang: string): Promise<WiktionaryResult> {
    const tier = ETYMOLOGY_TIERS[targetLang] ?? 3;
    if (tier === 3) return { pageExists: false, etymology: null }; // Tier 3: AI-only

    try {
        const url = `https://en.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(word)}&prop=wikitext&format=json&origin=*`;
        const res = await fetch(url, {
            headers: { "User-Agent": "PolyLang/1.0 (language-learning-app)" },
        });

        if (!res.ok) return { pageExists: false, etymology: null };

        const data = await res.json();
        const wikitext = data?.parse?.wikitext?.["*"];
        if (!wikitext) return { pageExists: false, etymology: null };

        // Page exists in Wiktionary
        if (targetLang === "en") {
            // English: extract Etymology section directly
            const etymologyMatch = wikitext.match(/===?\s*Etymology\s*\d*\s*===?\s*\n([\s\S]*?)(?=\n===?\s*[A-Z]|\n----|$)/);
            return { pageExists: true, etymology: etymologyMatch ? etymologyMatch[1].trim() : null };
        }

        // Other languages: find language section header (e.g. ==French==), then extract Etymology within it
        const langHeader = WIKTIONARY_LANG_HEADERS[targetLang];
        if (!langHeader) return { pageExists: true, etymology: null };

        const langSectionRegex = new RegExp(
            `==\\s*${langHeader}\\s*==\\s*\\n([\\s\\S]*?)(?=\\n==\\s*[A-Z]|$)`
        );
        const langSection = wikitext.match(langSectionRegex);
        if (!langSection) return { pageExists: true, etymology: null };

        const etymologyMatch = langSection[1].match(/===?\s*Etymology\s*\d*\s*===?\s*\n([\s\S]*?)(?=\n===?\s*[A-Z]|\n----|$)/);
        return { pageExists: true, etymology: etymologyMatch ? etymologyMatch[1].trim() : null };
    } catch (e) {
        console.error("Wiktionary API error:", e);
        return { pageExists: false, etymology: null };
    }
}

// ── Wiktionary Template Parser ──

// Wiktionary language codes → short display names
const WIKI_LANG_DISPLAY: Record<string, string> = {
    en: "English", enm: "ME", ang: "OE",
    fr: "French", frm: "MF", fro: "OF",
    la: "Lat", "la-med": "Med.Lat", "la-lat": "LLat", "la-vul": "VLat",
    grc: "Gk", el: "Greek",
    "ine-pro": "PIE",
    "gem-pro": "PGmc", "gmw-pro": "PWGmc",
    "itc-pro": "PItal",
    "sla-pro": "PSl",
    non: "ON", goh: "OHG", odt: "ODu",
    de: "German", es: "Spanish", it: "Italian", pt: "Portuguese", nl: "Dutch",
    ar: "Arabic", fa: "Persian", sa: "Sanskrit", hi: "Hindi",
    ja: "Japanese", ojp: "OJ",
    zh: "Chinese", ltc: "MC", och: "OC",
    ko: "Korean", okm: "MK",
    ru: "Russian", orv: "OESl",
    vi: "Vietnamese",
};

function wikiLangName(code: string): string {
    return WIKI_LANG_DISPLAY[code] || code;
}

interface ParsedEtymLink {
    type: "inherited" | "borrowed" | "derived" | "mention" | "affix" | "root" | "cognate" | "surface";
    langCode: string;
    langDisplay: string;
    word: string;
    meaning?: string;
    components?: { word: string; langCode: string; langDisplay: string; meaning?: string }[];
}

/** Parse all {{template}} calls from a Wiktionary etymology section */
function parseWiktionaryTemplates(wikitext: string): ParsedEtymLink[] {
    const results: ParsedEtymLink[] = [];
    // Match all {{...}} templates (handling nested {{ }} by simple non-greedy match)
    const templateRegex = /\{\{([^{}]*(?:\{\{[^{}]*\}\}[^{}]*)*)\}\}/g;
    let match: RegExpExecArray | null;

    while ((match = templateRegex.exec(wikitext)) !== null) {
        const raw = match[1];
        const parts = raw.split("|");
        const templateName = parts[0].trim();

        // Extract named params (key=value) and positional params
        const named: Record<string, string> = {};
        const positional: string[] = [];
        for (let i = 1; i < parts.length; i++) {
            const part = parts[i].trim();
            const eqIdx = part.indexOf("=");
            if (eqIdx > 0 && !part.startsWith("*")) {
                named[part.slice(0, eqIdx).trim()] = part.slice(eqIdx + 1).trim();
            } else {
                positional.push(part);
            }
        }

        switch (templateName) {
            case "inh":   // {{inh|target|source_lang|word|...|t=meaning}}
            case "inherited": {
                if (positional.length >= 3) {
                    const meaning = named["t"] || named["gloss"] || (positional[3] === "" ? positional[4] : positional[3]) || undefined;
                    results.push({
                        type: "inherited",
                        langCode: positional[1],
                        langDisplay: wikiLangName(positional[1]),
                        word: positional[2],
                        meaning: meaning && meaning !== "" ? meaning : undefined,
                    });
                }
                break;
            }
            case "bor":   // {{bor|target|source_lang|word|...|t=meaning}}
            case "borrowed": {
                if (positional.length >= 3) {
                    const meaning = named["t"] || named["gloss"] || (positional[3] === "" ? positional[4] : positional[3]) || undefined;
                    results.push({
                        type: "borrowed",
                        langCode: positional[1],
                        langDisplay: wikiLangName(positional[1]),
                        word: positional[2],
                        meaning: meaning && meaning !== "" ? meaning : undefined,
                    });
                }
                break;
            }
            case "der":   // {{der|target|source_lang|word|...|t=meaning}}
            case "derived": {
                if (positional.length >= 3) {
                    const meaning = named["t"] || named["gloss"] || (positional[3] === "" ? positional[4] : positional[3]) || undefined;
                    results.push({
                        type: "derived",
                        langCode: positional[1],
                        langDisplay: wikiLangName(positional[1]),
                        word: positional[2],
                        meaning: meaning && meaning !== "" ? meaning : undefined,
                    });
                }
                break;
            }
            case "m":     // {{m|lang|word||meaning}} or {{m|lang|word|t=meaning}}
            case "mention":
            case "l":
            case "link": {
                if (positional.length >= 2) {
                    // Meaning can be: positional[2] is empty and positional[3] has meaning, or named t=
                    let meaning = named["t"] || named["gloss"];
                    if (!meaning && positional.length >= 4 && positional[2] === "") {
                        meaning = positional[3];
                    }
                    results.push({
                        type: "mention",
                        langCode: positional[0],
                        langDisplay: wikiLangName(positional[0]),
                        word: positional[1],
                        meaning: meaning && meaning !== "" ? meaning : undefined,
                    });
                }
                break;
            }
            case "root": { // {{root|target_lang|proto_lang|*root1|*root2|...}}
                if (positional.length >= 3) {
                    for (let i = 2; i < positional.length; i++) {
                        if (positional[i] && positional[i] !== "") {
                            results.push({
                                type: "root",
                                langCode: positional[1],
                                langDisplay: wikiLangName(positional[1]),
                                word: positional[i],
                            });
                        }
                    }
                }
                break;
            }
            case "af":    // {{af|lang|part1|part2|...|t1=|t2=|...}}
            case "affix":
            case "suf":
            case "suffix":
            case "pre":
            case "prefix":
            case "con":
            case "confix":
            case "surf":
            case "surface analysis": {
                if (positional.length >= 2) {
                    const lang = positional[0];
                    const components = [];
                    for (let i = 1; i < positional.length; i++) {
                        if (positional[i] && positional[i] !== "") {
                            components.push({
                                word: positional[i],
                                langCode: lang,
                                langDisplay: wikiLangName(lang),
                                meaning: named[`t${i}`] || undefined,
                            });
                        }
                    }
                    if (components.length > 0) {
                        results.push({
                            type: templateName === "surf" || templateName === "surface analysis" ? "surface" : "affix",
                            langCode: lang,
                            langDisplay: wikiLangName(lang),
                            word: components.map(c => c.word).join(" + "),
                            components,
                        });
                    }
                }
                break;
            }
            case "cog":   // {{cog|lang|word|t=meaning}}
            case "cognate": {
                if (positional.length >= 2) {
                    results.push({
                        type: "cognate",
                        langCode: positional[0],
                        langDisplay: wikiLangName(positional[0]),
                        word: positional[1],
                        meaning: named["t"] || named["gloss"] || undefined,
                    });
                }
                break;
            }
        }
    }

    return results;
}

/** Convert parsed links into a human-readable structured summary for the AI */
function formatParsedEtymology(links: ParsedEtymLink[]): string {
    if (links.length === 0) return "";

    const lines: string[] = ["PARSED WIKTIONARY DATA (structured):"];

    const roots = links.filter(l => l.type === "root");
    if (roots.length > 0) {
        lines.push(`Proto-roots (these are roots of the MAIN etymon/verbal root, NOT of affixes or suffixes): ${roots.map(r => `${r.word} [${r.langDisplay}]`).join(", ")}`);
    }

    const chain = links.filter(l => ["inherited", "borrowed", "derived"].includes(l.type));
    if (chain.length > 0) {
        lines.push("Etymology chain:");
        for (const link of chain) {
            const rel = link.type === "inherited" ? "inherited from" : link.type === "borrowed" ? "borrowed from" : "derived from";
            lines.push(`  → ${rel} ${link.langDisplay} "${link.word}"${link.meaning ? ` (${link.meaning})` : ""}`);
        }
    }

    const mentions = links.filter(l => l.type === "mention");
    if (mentions.length > 0) {
        lines.push("Morpheme mentions:");
        for (const m of mentions) {
            lines.push(`  • ${m.langDisplay} "${m.word}"${m.meaning ? ` = ${m.meaning}` : ""}`);
        }
    }

    const affixes = links.filter(l => l.type === "affix" || l.type === "surface");
    if (affixes.length > 0) {
        for (const a of affixes) {
            const label = a.type === "surface" ? "Surface analysis" : "Affix breakdown";
            lines.push(`${label} [${a.langDisplay}]: ${a.components?.map(c => `"${c.word}"${c.meaning ? ` (${c.meaning})` : ""}`).join(" + ")}`);
        }
    }

    const cognates = links.filter(l => l.type === "cognate");
    if (cognates.length > 0) {
        lines.push(`Cognates: ${cognates.map(c => `${c.langDisplay} "${c.word}"${c.meaning ? ` (${c.meaning})` : ""}`).join(", ")}`);
    }

    return lines.join("\n");
}

// ── Origin Language Normalization ──

const ORIGIN_ALIASES: Record<string, string> = {
    "greek": "Gk", "Greek": "Gk", "Ancient Greek": "Gk",
    "latin": "Lat", "Latin": "Lat",
    "old_english": "OE", "Old English": "OE", "Old_English": "OE",
    "middle_english": "ME", "Middle English": "ME", "Middle_English": "ME",
    "old_french": "OF", "Old French": "OF", "Old_French": "OF",
    "middle_french": "MF", "Middle French": "MF", "Middle_French": "MF",
    "italian": "It", "Italian": "It",
    "french": "French",
};

function normalizeOrigin(origin: string): string {
    return ORIGIN_ALIASES[origin] ?? origin;
}

// ── Input Validation ──

const MAX_WORD_LENGTH = 40;
// Allow letters (any script), CJK, kana, hangul, diacritics, hyphens, spaces, apostrophes
const VALID_WORD_PATTERN = /^[\p{L}\p{M}\s'\-·]+$/u;

function validateWordInput(word: string): string | null {
    if (word.length > MAX_WORD_LENGTH) {
        return `入力が長すぎます（最大${MAX_WORD_LENGTH}文字）`;
    }
    if (!VALID_WORD_PATTERN.test(word)) {
        return "使用できない文字が含まれています。単語を入力してください。";
    }
    return null;
}

/** Escape user input for safe embedding in AI prompts */
function sanitizeForPrompt(word: string): string {
    // Strip any characters that could be used for prompt manipulation
    return word.replace(/["""«»{}[\]<>\\|]/g, "").trim();
}

// ── Blocked Expressions ──

const BLOCKED_EXPRESSIONS: Record<string, string[]> = {
    ja: ["こんにちは", "こんばんは", "おはよう", "おはようございます", "さようなら", "ありがとう", "ありがとうございます", "すみません", "ごめんなさい", "いただきます", "ごちそうさま", "ごちそうさまでした", "おやすみ", "おやすみなさい", "いってきます", "いってらっしゃい", "ただいま", "おかえり", "おかえりなさい", "よろしくおねがいします"],
    ko: ["안녕하세요", "안녕", "감사합니다", "고마워", "미안합니다", "죄송합니다", "잘자", "안녕히가세요", "안녕히계세요", "잘먹겠습니다", "잘먹었습니다"],
    zh: ["你好", "谢谢", "对不起", "再见", "晚安", "早上好", "晚上好"],
    en: ["hello", "goodbye", "good morning", "good evening", "good night", "thank you", "thanks", "sorry", "excuse me", "how are you", "nice to meet you"],
    fr: ["bonjour", "bonsoir", "bonne nuit", "au revoir", "merci", "pardon", "excusez-moi", "enchanté"],
    de: ["Hallo", "Guten Morgen", "Guten Tag", "Guten Abend", "Gute Nacht", "Auf Wiedersehen", "Tschüss", "Danke", "Entschuldigung"],
    es: ["hola", "buenos días", "buenas tardes", "buenas noches", "adiós", "gracias", "perdón", "disculpe"],
    ru: ["привет", "здравствуйте", "доброе утро", "добрый день", "добрый вечер", "спокойной ночи", "до свидания", "спасибо", "извините"],
    vi: ["xin chào", "cảm ơn", "xin lỗi", "tạm biệt", "chào buổi sáng", "chúc ngủ ngon"],
};

function isBlockedExpression(word: string, targetLang: string): boolean {
    const list = BLOCKED_EXPRESSIONS[targetLang];
    if (!list) return false;
    const normalized = targetLang === "de" ? word.trim() : word.trim().toLowerCase();
    return list.some(expr => (targetLang === "de" ? expr : expr.toLowerCase()) === normalized);
}

// ── Expression Origin Lookup ──

async function lookupExpressionOrigin(
    normalizedWord: string,
    targetLang: string,
    nativeLang: string,
    user: { id: string },
    supabase: any,
): Promise<EtymologyResult> {
    // 1. Check cache
    const { data: cached } = await (supabase as any)
        .from("etymology_entries")
        .select("*")
        .eq("word", normalizedWord)
        .eq("target_language", targetLang)
        .single();

    if (cached) {
        (supabase as any).from("etymology_search_history")
            .insert({ user_id: user.id, word: normalizedWord, target_language: targetLang })
            .then(() => { });
        return { entry: cached as EtymologyEntry };
    }

    // 2. Consume credit
    const limitCheck = await checkAndConsumeCredit(user.id, "etymology", supabase);
    if (!limitCheck.allowed) {
        return { entry: null, error: limitCheck.error || "Insufficient credits" };
    }

    const langName = LANG_NAMES[targetLang] || "English";
    const nativeLangName = LANG_NAMES[nativeLang] || "English";
    const safeWord = sanitizeForPrompt(normalizedWord);

    // 3. AI prompt for expression origin
    try {
        const prompt = `You are a linguistics expert. Explain the historical origin and evolution of the ${langName} fixed expression "${safeWord}".

Focus on:
- The ORIGINAL full form before abbreviation/contraction (e.g. "今日は御機嫌いかがですか" → "こんにちは", "God be with ye" → "goodbye")
- The step-by-step process of how the expression was shortened or transformed over time
- The time period when the expression emerged and when it took its current form
- Cultural context: when and how it is used, formality levels, regional variations
- Component analysis: break down each part of the expression and explain its role

ACCURACY RULES:
1. Only include well-documented historical facts. Mark disputed claims with "（諸説あり）".
2. Do NOT include folk etymologies or unverified theories.

Respond in JSON. All text explanations in ${nativeLangName}.

{
  "definition": "Current meaning and usage of this expression",
  "origin_language": "${langName}",
  "etymology_summary": "STRICT FORMAT: sections separated by \\n. Each section starts with 【label】 on its own line, followed by FLAT bullet lines starting with ・. NEVER nest bullets or use sub-headers inside a section. Pick ONLY sections with content from: 【概要】【元の形】【歴史的変遷】【文化的背景】【類似表現】. Example format:\\n【概要】\\n・日常的な感謝表現。形容詞「有り難い」の連用形に由来する。\\n【元の形】\\n・古語「ありがたし」（有り難し）＝「存在することが難しい」→「稀である」→「貴重だ」→「感謝すべきだ」と意味が変遷。\\n【歴史的変遷】\\n・室町時代：「ありがたし」が感謝の意で使われ始める。\\n・江戸時代：「ありがとう」の終止形が一般化。丁寧形「ありがとうございます」も成立。\\n・明治以降：標準語として全国に定着。",
  "pronunciation": "${targetLang === "ja" ? "hiragana reading" : targetLang === "ko" ? "Revised Romanization" : targetLang === "zh" ? "pinyin with tones" : "IPA"}",
  "first_known_use": "Century or approximate date when this expression first appeared",
  "part_breakdown": [
    { "part": "component", "type": "root|particle|suffix|prefix", "meaning": "meaning of this component", "origin": "${langName}", "ancestry": [] }
  ],
  "etymology_story": "Engaging narrative about how this expression came to be. Include the full original form, the abbreviation process, and interesting historical anecdotes.",
  "nuance_notes": [{ "words": ["${safeWord}", "related expression"], "explanation": "How these expressions differ in formality, context, or nuance" }],
  "cognates": [{ "word": "equivalent greeting/expression", "language": "Language", "meaning": "meaning" }],
  "confidence": {
    "overall": "high|medium|low",
    "etymology": "high|medium|low",
    "parts": "high|medium|low",
    "tree": "high",
    "reasoning": "Why this confidence level"
  }
}

IMPORTANT: Do NOT include "tree_data" or "compound_tree" fields. These do not apply to fixed expressions.`;

        console.log(`\n=== [Expression Debug] Expression: "${normalizedWord}" (${langName}) ===`);

        const response = await openai.chat.completions.create({
            model: "gpt-5.2",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.2,
        });

        if (response.usage) {
            logTokenUsage(
                user.id,
                "etymology",
                "gpt-5.2",
                response.usage.prompt_tokens,
                response.usage.completion_tokens
            ).catch(console.error);
        }

        const content = response.choices[0].message.content;
        if (!content) return { entry: null, error: "Empty AI response" };

        console.log(`--- AI response ---\n${content}\n`);
        console.log(`--- Tokens: ${response.usage?.prompt_tokens ?? "?"} prompt, ${response.usage?.completion_tokens ?? "?"} completion ---\n`);

        const result = JSON.parse(content);

        // 4. Cache in Supabase
        const entryData = {
            word: normalizedWord,
            target_language: targetLang,
            definition: result.definition || null,
            origin_language: result.origin_language || null,
            etymology_summary: result.etymology_summary || null,
            pronunciation: result.pronunciation || null,
            part_breakdown: result.part_breakdown || null,
            first_known_use: result.first_known_use || null,
            tree_data: null,
            etymology_story: result.etymology_story || null,
            learning_hints: null,
            nuance_notes: result.nuance_notes || null,
            cognates: result.cognates || null,
            compound_tree: null,
            confidence: result.confidence || null,
            has_wiktionary_data: false,
            source_type: "expression",
            raw_wikitext: null,
        };

        const { data: inserted, error: insertError } = await (supabase as any)
            .from("etymology_entries")
            .insert(entryData)
            .select()
            .single();

        if (insertError) {
            console.error("Failed to cache expression origin:", insertError);
        }

        // 5. Save to search history
        (supabase as any).from("etymology_search_history")
            .insert({ user_id: user.id, word: normalizedWord, target_language: targetLang })
            .then(() => { });

        return { entry: (inserted || entryData) as EtymologyEntry };
    } catch (e: any) {
        console.error("Expression origin error:", e);
        return { entry: null, error: "表現の解析に失敗しました。" };
    }
}

// ── Main Lookup ──

export async function lookupEtymology(word: string, targetLang: string, nativeLang: string): Promise<EtymologyResult> {
    // German nouns are capitalized — preserve case for de
    const normalizedWord = targetLang === "de" ? word.trim() : word.trim().toLowerCase();
    if (!normalizedWord) return { entry: null, error: "Empty word" };

    // Input validation
    const validationError = validateWordInput(normalizedWord);
    if (validationError) return { entry: null, error: validationError };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { entry: null, error: "Not authenticated" };

    // Fixed expressions → dedicated prompt for historical development
    if (isBlockedExpression(normalizedWord, targetLang)) {
        return lookupExpressionOrigin(normalizedWord, targetLang, nativeLang, user, supabase);
    }

    // 1. Check cache (keyed by word + target_language)
    const { data: cached } = await (supabase as any)
        .from("etymology_entries")
        .select("*")
        .eq("word", normalizedWord)
        .eq("target_language", targetLang)
        .single();

    if (cached) {
        // Save to search history (fire-and-forget)
        (supabase as any).from("etymology_search_history")
            .insert({ user_id: user.id, word: normalizedWord, target_language: targetLang })
            .then(() => { });
        return { entry: cached as EtymologyEntry };
    }

    // 2. Consume credit
    const limitCheck = await checkAndConsumeCredit(user.id, "etymology", supabase);
    if (!limitCheck.allowed) {
        return { entry: null, error: limitCheck.error || "Insufficient credits" };
    }

    // 3. Check wikitext stock first, then fall back to Wiktionary API
    const stockedWikitext = await getStockedWikitext(normalizedWord, targetLang, supabase);
    let wikiResult: WiktionaryResult;
    if (stockedWikitext) {
        console.log(`[Etymology] Using stocked wikitext for "${normalizedWord}" (${targetLang})`);
        wikiResult = { pageExists: true, etymology: stockedWikitext };
    } else {
        wikiResult = await fetchWiktionaryEtymology(normalizedWord, targetLang);
    }
    const wikitext = wikiResult.etymology;

    const langName = LANG_NAMES[targetLang] || "English";
    const tier = ETYMOLOGY_TIERS[targetLang] ?? 3;
    console.log(`\n=== [Etymology Debug] Word: "${normalizedWord}" (${langName}) ===`);
    console.log(`--- Wiktionary raw ---\n${wikitext || "(no data)"}\n`);

    // 3a. Reject non-existent words for Tier 1/2 languages (Wiktionary coverage)
    if (tier <= 2 && !wikiResult.pageExists) {
        return { entry: null, error: "辞書に見つかりませんでした。スペルを確認してください。" };
    }

    // 3b. Web search for admin users when Wiktionary data is missing
    const hasWiktionaryData = !!wikitext;
    let webSearchResult: string | null = null;
    if (!hasWiktionaryData) {
        const adminUser = await isAdmin(supabase, user.id);
        if (adminUser) {
            console.log(`--- Admin user: running web search for "${normalizedWord}" ---`);
            webSearchResult = await fetchWebEtymology(normalizedWord, targetLang);
        }
    }

    const nativeLangName = LANG_NAMES[nativeLang] || "English";
    const safeWord = sanitizeForPrompt(normalizedWord);

    // 4. Parse Wiktionary templates + AI structuring
    try {
        let sourceGuidance: string;
        let parsedData = "";
        if (hasWiktionaryData) {
            const parsedLinks = parseWiktionaryTemplates(wikitext!);
            parsedData = formatParsedEtymology(parsedLinks);
            console.log(`--- Parsed templates (${parsedLinks.length} links) ---\n${parsedData}\n`);
            sourceGuidance = `${parsedData}\n\nRaw Wiktionary wikitext (for reference):\n${wikitext}\n\nYour job is to STRUCTURE the parsed data above into the JSON format below. Use the Wiktionary data as your PRIMARY source. Do NOT invent speculative etymology or folk etymologies. However, you MUST supplement the Wiktionary data with established linguistic scholarship to: (1) decompose compound words into their morphological components (e.g. Gk δημοκρᾰτῐ́ᾱ → δῆμος + κράτος), and (2) trace roots back to proto-languages as specified in TREE DEPTH GUIDANCE (e.g. Gk δῆμος → PIE *deh₂mos). These are well-established facts, not invention. For tree_data, build the tree from the etymology chain above AND add morphological decomposition + proto-language tracing to meet the 8–15 node target.`;
        } else if (webSearchResult) {
            sourceGuidance = `Web research data:\n${webSearchResult}\nUse this as reference but verify claims against your training data. Exclude any folk etymologies, urban legends, or unverified theories. Only include claims supported by multiple reliable sources.`;
        } else {
            sourceGuidance = `No Wiktionary data available. Only state what you are confident about from established linguistic scholarship. Do NOT include folk etymologies or urban legend-like theories.`;
        }

        const treeGuidance = getTreeDepthGuidance(targetLang);

        const prompt = `You are a data formatter. Convert the etymology data below into structured JSON for the ${langName} word "${safeWord}".

${sourceGuidance}

ACCURACY RULES (MUST follow):
1. If the origin is disputed, present the prevailing scholarly theory but add "（諸説あり）" to indicate debate. Never state debated theories as undisputed fact.
2. If multiple research sources agree on a theory, include it with a note like "〜とされる（諸説あり）". Only set a field to null if there is truly NO credible theory at all.
3. For part_breakdown: include morphemes even if their etymology is debated, as long as there is a prevailing scholarly view. Add "（諸説あり）" in the "meaning" field when needed.
4. Do NOT include folk etymologies, urban legends, or unverified popular theories. Only include claims from established linguistic scholarship.
5. For tree_data: only include attested historical forms. Mark reconstructed forms with *. Include sound changes between stages when known (e.g. "어히 (method/means)" → "어이 (ㅎ脱落)").
6. NEVER use archaic or obsolete Unicode characters (e.g. old Hangul jamo like ᅙᆞᆢ, Old English ð/þ ligatures, etc.) that may not render in standard web fonts. Always transliterate historical forms into modern script equivalents. For example, write "어히" not "어ᅙ이".

TREE DEPTH GUIDANCE for ${langName}:
${treeGuidance}

Respond in JSON. All text explanations in ${nativeLangName}.

{
  "definition": "Brief definition",
  "origin_language": "primary origin language",
  "etymology_summary": "Structured explanation using labeled sections separated by \\n. Pick ONLY sections that have substantive content from: 【概要】【歴史的発達】【意味の変遷】【音韻変化】. NEVER include a section just to say there is no information — simply omit it. Be thorough — include detail, historical context, and specific examples. Use ・ at line start for bullet lists.",
  "pronunciation": "Romanization for Korean (Revised Romanization, e.g. eo-i-eops-eo), hiragana reading for Japanese, pinyin for Chinese, IPA for all other languages",
  "first_known_use": "Century or approximate date",
  "part_breakdown": [
    { "part": "morpheme", "type": "prefix|suffix|root|combining_form", "meaning": "meaning", "origin": "origin language", "ancestry": [{ "form": "oldest reconstructed form", "language": "proto-lang", "meaning": "meaning" }, { "form": "intermediate form", "language": "language", "meaning": "meaning" }] }
  ],
  "tree_data": {
    "word": "${safeWord}",
    "language": "${langName}",
    "meaning": "meaning in ${nativeLangName}",
    "children": [
      {
        "word": "direct etymon",
        "language": "Lat|OF|OE|MC|MK|...",
        "meaning": "meaning",
        "relation": "borrowed from|inherited from",
        "children": [
          { "word": "morpheme1", "language": "abbrev", "meaning": "meaning", "relation": "prefix|suffix", "children": [{ "word": "*root", "language": "PIE|PKor|OC|...", "meaning": "meaning" }] },
          { "word": "morpheme2", "language": "abbrev", "meaning": "meaning", "relation": "root|base", "children": [
            { "word": "older form", "language": "abbrev", "meaning": "meaning", "children": [
              { "word": "*root", "language": "PIE|PKor|OC|...", "meaning": "meaning" }
            ]}
          ]}
        ]
      }
    ]
  },
  "etymology_story": "Engaging narrative about the word's history. Only include well-supported facts.",
  "learning_hints": [{ "part": "morpheme", "hint": "memory tip" }],
  "nuance_notes": [{ "words": ["${safeWord}", "synonym"], "explanation": "How etymological origins create usage differences" }],
  "cognates": [{ "word": "cognate", "language": "Language", "meaning": "meaning" }],
  "compound_tree": {
    "form": "${normalizedWord}",
    "language": "${langName}",
    "meaning": "current meaning",
    "components": [
      { "form": "historical form", "language": "language", "meaning": "meaning", "components": [
        { "form": "part1", "language": "language", "meaning": "meaning" },
        { "form": "part2", "language": "language", "meaning": "meaning" }
      ]}
    ]
  },
  "related_words": ["word1", "word2", "word3"],
  "confidence": {
    "overall": "high|medium|low",
    "etymology": "high|medium|low",
    "parts": "high|medium|low",
    "tree": "high|medium|low",
    "reasoning": "Why this confidence level"
  }
}

${getCriticalRules(targetLang, safeWord)}`;

        console.log(`--- AI prompt (first 500 chars) ---\n${prompt.slice(0, 500)}...\n`);

        const response = await openai.chat.completions.create({
            model: "gpt-5.2",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.2,
        });

        if (response.usage) {
            logTokenUsage(
                user.id,
                "etymology",
                "gpt-5.2",
                response.usage.prompt_tokens,
                response.usage.completion_tokens
            ).catch(console.error);
        }

        const content = response.choices[0].message.content;
        if (!content) return { entry: null, error: "Empty AI response" };

        console.log(`--- AI response ---\n${content}\n`);
        console.log(`--- Tokens: ${response.usage?.prompt_tokens ?? "?"} prompt, ${response.usage?.completion_tokens ?? "?"} completion ---\n`);

        const result = JSON.parse(content);

        // 5. Cache in Supabase
        const entryData = {
            word: normalizedWord,
            target_language: targetLang,
            definition: result.definition || null,
            origin_language: result.origin_language || null,
            etymology_summary: result.etymology_summary || null,
            pronunciation: result.pronunciation || null,
            part_breakdown: result.part_breakdown || null,
            first_known_use: result.first_known_use || null,
            tree_data: result.tree_data || null,
            etymology_story: result.etymology_story || null,
            learning_hints: result.learning_hints || null,
            nuance_notes: result.nuance_notes || null,
            cognates: result.cognates || null,
            compound_tree: result.compound_tree || null,
            confidence: result.confidence || null,
            has_wiktionary_data: hasWiktionaryData,
            source_type: hasWiktionaryData ? "wiktionary" : webSearchResult ? "web_search" : "ai_only",
            raw_wikitext: wikitext || webSearchResult || null,
        };

        const { data: inserted, error: insertError } = await (supabase as any)
            .from("etymology_entries")
            .insert(entryData)
            .select()
            .single();

        if (insertError) {
            console.error("Failed to cache etymology:", insertError);
        }

        // 6. Cache derivation relationships
        if (result.related_words && Array.isArray(result.related_words)) {
            const derivations = result.related_words.map((childWord: string) => ({
                parent_word: normalizedWord,
                child_word: targetLang === "de" ? childWord : childWord.toLowerCase(),
                relationship_type: "related",
                target_language: targetLang,
            }));

            if (derivations.length > 0) {
                (supabase as any).from("etymology_derivations")
                    .upsert(derivations, { onConflict: "parent_word,child_word,target_language" })
                    .then(() => { });
            }
        }

        // 7. Stock new word parts from part_breakdown + tree ancestors (English only)
        if (targetLang === "en") {
            const partsToStock: { part: string; part_type: string; meaning: string; origin_language: string; examples: string[]; learning_hint: string | null }[] = [];

            // 7a. From part_breakdown (modern morphemes)
            if (result.part_breakdown && Array.isArray(result.part_breakdown)) {
                for (const p of result.part_breakdown) {
                    if (p.part && p.type && p.meaning && p.origin) {
                        partsToStock.push({
                            part: p.part,
                            part_type: p.type,
                            meaning: p.meaning,
                            origin_language: normalizeOrigin(p.origin),
                            examples: [normalizedWord],
                            learning_hint: result.learning_hints?.find((h: any) => h.part === p.part)?.hint || null,
                        });
                    }
                }
            }

            // 7b. From tree_data (proto-language roots & intermediate forms)
            if (result.tree_data) {
                const seen = new Set<string>();
                const walk = (node: any) => {
                    if (!node || !node.word || !node.language) return;
                    const key = `${node.word}|${node.language}`;
                    if (seen.has(key)) return;
                    seen.add(key);
                    // Skip the modern target word itself (depth 0)
                    if (node.word.toLowerCase() !== normalizedWord.toLowerCase() && node.meaning) {
                        const isReconstructed = node.word.startsWith("*");
                        const partType = node.relation === "prefix" || node.relation === "suffix"
                            ? node.relation
                            : "root";
                        partsToStock.push({
                            part: node.word,
                            part_type: partType,
                            meaning: node.meaning,
                            origin_language: normalizeOrigin(node.language),
                            examples: [normalizedWord],
                            learning_hint: isReconstructed ? `${node.language} ${node.word} → ${normalizedWord}` : null,
                        });
                    }
                    if (node.children) node.children.forEach(walk);
                };
                walk(result.tree_data);
            }

            if (partsToStock.length > 0) {
                // Deduplicate by part+part_type before sending
                const deduped = new Map<string, typeof partsToStock[0]>();
                for (const p of partsToStock) {
                    const key = `${p.part}|${p.part_type}`;
                    if (!deduped.has(key)) deduped.set(key, p);
                }

                // Upsert parts: for existing parts, append the new word to examples
                const parts = [...deduped.values()];
                const { data: existing } = await (supabase as any)
                    .from("etymology_word_parts")
                    .select("part, part_type, examples")
                    .in("part", parts.map(p => p.part));

                const existingMap = new Map<string, string[]>();
                for (const e of existing || []) {
                    existingMap.set(`${e.part}|${e.part_type}`, e.examples || []);
                }

                const toUpsert = parts.map(p => {
                    const key = `${p.part}|${p.part_type}`;
                    const prev = existingMap.get(key) || [];
                    const merged = [...new Set([...prev, ...p.examples])];
                    return { ...p, examples: merged };
                });

                (supabase as any).from("etymology_word_parts")
                    .upsert(toUpsert, { onConflict: "part,part_type" })
                    .then(() => { });
            }
        }

        // 8. Save search history
        (supabase as any).from("etymology_search_history")
            .insert({ user_id: user.id, word: normalizedWord, target_language: targetLang })
            .then(() => { });

        return { entry: (inserted || entryData) as EtymologyEntry };

    } catch (e) {
        console.error("Etymology AI Error:", e);
        return { entry: null, error: "Failed to analyze etymology" };
    }
}

// ── Word Parts Search ──

export async function searchWordParts(
    query?: string,
    type?: string,
    origin?: string
): Promise<WordPart[]> {
    const supabase = await createClient();

    let q = (supabase as any)
        .from("etymology_word_parts")
        .select("*")
        .order("part", { ascending: true });

    if (type && type !== "all") {
        q = q.eq("part_type", type);
    }
    if (origin && origin !== "all") {
        q = q.eq("origin_language", origin);
    }
    if (query) {
        q = q.or(`part.ilike.%${query}%,meaning.ilike.%${query}%,learning_hint.ilike.%${query}%`);
    }

    const { data, error } = await q.limit(200);

    if (error) {
        console.error("Word parts search error:", error);
        return [];
    }

    return data as WordPart[];
}

// ── Words for Part ──

export interface PartDetailWord {
    word: string;
    definition: string | null;
    target_language: string;
}

export async function getWordsForPart(part: string, exampleWords?: string[]): Promise<PartDetailWord[]> {
    const supabase = await createClient();

    // Two-pronged search: JSONB containment on part_breakdown + known example words
    const queries: Promise<any>[] = [
        // 1. Search part_breakdown JSONB containment
        (supabase as any)
            .from("etymology_entries")
            .select("word, definition, target_language")
            .contains("part_breakdown", [{ part }])
            .order("word", { ascending: true })
            .limit(50),
    ];

    // 2. Also look up known example words (from etymology_word_parts.examples)
    if (exampleWords && exampleWords.length > 0) {
        queries.push(
            (supabase as any)
                .from("etymology_entries")
                .select("word, definition, target_language")
                .in("word", exampleWords)
                .order("word", { ascending: true })
                .limit(50)
        );
    }

    const results = await Promise.all(queries);

    // Merge and deduplicate
    const seen = new Set<string>();
    const merged: PartDetailWord[] = [];
    for (const { data } of results) {
        for (const item of data || []) {
            if (!seen.has(item.word)) {
                seen.add(item.word);
                merged.push(item);
            }
        }
    }

    return merged;
}

export async function getWordPartOrigins(): Promise<string[]> {
    const supabase = await createClient();
    const { data, error } = await (supabase as any)
        .from("etymology_word_parts")
        .select("origin_language")
        .order("origin_language", { ascending: true });

    if (error || !data) return [];

    const unique = [...new Set<string>(data.map((d: any) => d.origin_language).filter(Boolean))];
    return unique;
}

// ── Word Library ──

export interface LibraryEntry {
    word: string;
    target_language: string;
    definition: string | null;
    origin_language: string | null;
}

export async function getEtymologyEntryCount(targetLang?: string): Promise<number> {
    const supabase = await createClient();
    let q = (supabase as any)
        .from("etymology_entries")
        .select("*", { count: "exact", head: true });
    if (targetLang && targetLang !== "all") {
        q = q.eq("target_language", targetLang);
    }
    const { count, error } = await q;
    if (error) { console.error("Entry count error:", error); return 0; }
    return count || 0;
}

export async function listEtymologyEntries(options?: {
    targetLang?: string;
    search?: string;
    offset?: number;
    limit?: number;
}): Promise<LibraryEntry[]> {
    const supabase = await createClient();
    const { targetLang, search, offset = 0, limit = 50 } = options || {};

    let q = (supabase as any)
        .from("etymology_entries")
        .select("word, target_language, definition, origin_language")
        .order("word", { ascending: true })
        .range(offset, offset + limit - 1);

    if (targetLang && targetLang !== "all") {
        q = q.eq("target_language", targetLang);
    }
    if (search) {
        q = q.ilike("word", `%${search}%`);
    }

    const { data, error } = await q;
    if (error) { console.error("List entries error:", error); return []; }
    return (data || []) as LibraryEntry[];
}

export async function getEntryLanguages(): Promise<string[]> {
    const supabase = await createClient();
    const { data, error } = await (supabase as any)
        .from("etymology_entries")
        .select("target_language");
    if (error || !data) return [];
    return [...new Set<string>(data.map((d: any) => d.target_language).filter(Boolean))];
}

// ── Wikitext Stock Stats ──

export async function getStockCount(targetLang?: string): Promise<number> {
    const supabase = await createClient();
    let q = (supabase as any)
        .from("etymology_wikitext_stock")
        .select("*", { count: "exact", head: true });
    if (targetLang && targetLang !== "all") {
        q = q.eq("target_language", targetLang);
    }
    const { count, error } = await q;
    if (error) { console.error("Stock count error:", error); return 0; }
    return count || 0;
}

// ── Related Words ──

export async function getRelatedWords(word: string, targetLang: string): Promise<string[]> {
    const supabase = await createClient();
    const normalizedWord = targetLang === "de" ? word.trim() : word.trim().toLowerCase();

    const { data } = await (supabase as any)
        .from("etymology_derivations")
        .select("child_word")
        .eq("parent_word", normalizedWord)
        .eq("target_language", targetLang)
        .limit(20);

    return data?.map((d: any) => d.child_word) || [];
}

// ── Recent Searches ──

export interface RecentSearch {
    word: string;
    target_language: string;
}

export async function getRecentSearches(targetLang?: string): Promise<RecentSearch[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let q = (supabase as any)
        .from("etymology_search_history")
        .select("word, target_language")
        .eq("user_id", user.id)
        .order("searched_at", { ascending: false })
        .limit(30);

    if (targetLang) {
        q = q.eq("target_language", targetLang);
    }

    const { data } = await q;

    // Deduplicate by word+lang
    const seen = new Set<string>();
    return (data || [])
        .filter((d: any) => {
            const key = `${d.word}:${d.target_language}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .slice(0, 20)
        .map((d: any) => ({ word: d.word, target_language: d.target_language }));
}
