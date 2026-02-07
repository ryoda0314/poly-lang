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
    source_type: "wiktionary" | "web_search" | "ai_only";
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

// ── Wiktionary API ──

async function fetchWiktionaryEtymology(word: string, targetLang: string): Promise<string | null> {
    const tier = ETYMOLOGY_TIERS[targetLang] ?? 3;
    if (tier === 3) return null; // Tier 3: AI-only

    try {
        const url = `https://en.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(word)}&prop=wikitext&format=json&origin=*`;
        const res = await fetch(url, {
            headers: { "User-Agent": "PolyLang/1.0 (language-learning-app)" },
        });

        if (!res.ok) return null;

        const data = await res.json();
        const wikitext = data?.parse?.wikitext?.["*"];
        if (!wikitext) return null;

        if (targetLang === "en") {
            // English: extract Etymology section directly
            const etymologyMatch = wikitext.match(/===?\s*Etymology\s*\d*\s*===?\s*\n([\s\S]*?)(?=\n===?\s*[A-Z]|\n----|$)/);
            return etymologyMatch ? etymologyMatch[1].trim() : null;
        }

        // Other languages: find language section header (e.g. ==French==), then extract Etymology within it
        const langHeader = WIKTIONARY_LANG_HEADERS[targetLang];
        if (!langHeader) return null;

        const langSectionRegex = new RegExp(
            `==\\s*${langHeader}\\s*==\\s*\\n([\\s\\S]*?)(?=\\n==\\s*[A-Z]|$)`
        );
        const langSection = wikitext.match(langSectionRegex);
        if (!langSection) return null;

        const etymologyMatch = langSection[1].match(/===?\s*Etymology\s*\d*\s*===?\s*\n([\s\S]*?)(?=\n===?\s*[A-Z]|\n----|$)/);
        return etymologyMatch ? etymologyMatch[1].trim() : null;
    } catch (e) {
        console.error("Wiktionary API error:", e);
        return null;
    }
}

// ── Wiktionary Template Parser ──

// Wiktionary language codes → short display names
const WIKI_LANG_DISPLAY: Record<string, string> = {
    en: "English", enm: "ME", ang: "OE",
    fr: "French", frm: "MF", fro: "OF",
    la: "Lat", "la-med": "Med.Lat",
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

// ── Main Lookup ──

export async function lookupEtymology(word: string, targetLang: string, nativeLang: string): Promise<EtymologyResult> {
    // German nouns are capitalized — preserve case for de
    const normalizedWord = targetLang === "de" ? word.trim() : word.trim().toLowerCase();
    if (!normalizedWord) return { entry: null, error: "Empty word" };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { entry: null, error: "Not authenticated" };

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
    const limitCheck = await checkAndConsumeCredit(user.id, "explanation", supabase);
    if (!limitCheck.allowed) {
        return { entry: null, error: limitCheck.error || "Insufficient credits" };
    }

    // 3. Fetch from Wiktionary (tier-based)
    const wikitext = await fetchWiktionaryEtymology(normalizedWord, targetLang);

    const langName = LANG_NAMES[targetLang] || "English";
    console.log(`\n=== [Etymology Debug] Word: "${normalizedWord}" (${langName}) ===`);
    console.log(`--- Wiktionary raw ---\n${wikitext || "(no data)"}\n`);

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

    // 4. Parse Wiktionary templates + AI structuring
    try {
        let sourceGuidance: string;
        let parsedData = "";
        if (hasWiktionaryData) {
            const parsedLinks = parseWiktionaryTemplates(wikitext!);
            parsedData = formatParsedEtymology(parsedLinks);
            console.log(`--- Parsed templates (${parsedLinks.length} links) ---\n${parsedData}\n`);
            sourceGuidance = `${parsedData}\n\nRaw Wiktionary wikitext (for reference):\n${wikitext}\n\nYour job is to STRUCTURE the parsed data above into the JSON format below. Do NOT invent etymology — use ONLY what the Wiktionary data provides. For tree_data, build the tree directly from the etymology chain and morpheme mentions above.`;
        } else if (webSearchResult) {
            sourceGuidance = `Web research data:\n${webSearchResult}\nUse this as reference but verify claims against your training data. Exclude any folk etymologies, urban legends, or unverified theories. Only include claims supported by multiple reliable sources.`;
        } else {
            sourceGuidance = `No Wiktionary data available. Only state what you are confident about from established linguistic scholarship. Do NOT include folk etymologies or urban legend-like theories.`;
        }

        const treeGuidance = getTreeDepthGuidance(targetLang);

        const prompt = `You are a data formatter. Convert the etymology data below into structured JSON for the ${langName} word "${normalizedWord}".

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
    "word": "${normalizedWord}",
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
  "nuance_notes": [{ "words": ["${normalizedWord}", "synonym"], "explanation": "How etymological origins create usage differences" }],
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

CRITICAL RULES:
- part_breakdown: decompose into the SMALLEST meaningful morphemes. "incredible" = in- + cred- + -ible (3 parts). "unbreakable" = un- + break + -able. NEVER merge a root with its derivational suffix.
- part_breakdown.ancestry: trace each morpheme to the oldest reconstructed form as specified in TREE DEPTH GUIDANCE above. Use * for reconstructed forms. Example for English: cred- ancestry = [{ form: "*ḱerd-", language: "PIE", meaning: "heart" }, { form: "crēdō", language: "Lat", meaning: "believe" }].
- tree_data: ROOT = the modern word "${normalizedWord}". children = its etymological source(s). Each source's children = its morphological components OR older ancestors. STRICT RULES:
  (a) For the MAIN etymological root(s), trace all the way to the deepest proto-language specified in TREE DEPTH GUIDANCE. For prefixes and suffixes, trace back only 1–2 stages (e.g. Lat "-ibilis" → Proto-Italic "*-ðlis" is fine; do NOT guess a PIE form unless you are certain). NEVER fabricate a proto-language root — if unsure, stop at the oldest KNOWN form.
  (b) NEVER repeat the same word+language at two levels. Each node = a DISTINCT historical form. e.g. Lat "in-" → Lat "in-" is WRONG — instead Lat "in-" → PIE "*ne".
  (c) Show ALL intermediate stages between the modern word and the proto-language root.
  (d) When a word has multiple morphemes (prefix + root + suffix), show EACH as a separate child — creating merge/split points.
  (e) Decompose morphologically at the SAME language level first. All sibling children of a node should be from the same language stage. THEN each child traces deeper independently. e.g. Lat "crēdibilis" → children: [Lat "crēdō", Lat "-ibilis"]. Then Lat "crēdō" → children: [PIE "*ḱerd-", PIE "*dʰeh₁-"]. NEVER mix Lat and PIE as siblings under the same parent.
  (f) Aim for 8–15 nodes. 3–5 nodes is TOO SHALLOW.
  (g) Use the short language abbreviations specified in TREE DEPTH GUIDANCE. NEVER use full names like "Proto-Indo-European" or "Middle English" — use "PIE", "ME", etc.
  (h) NEVER duplicate: each unique word+language pair must appear EXACTLY ONCE in the entire tree. If a PIE root (e.g. *dʰeh₁-) is already a child of one node, do NOT place it under another node. Proto-roots listed in the parsed data belong to the main verbal/root morpheme — assign them ONLY there, not to affixes or suffixes.
- compound_tree: show how the MODERN morphemes from part_breakdown were historically combined to form the word. Root = modern word, leaves = EXACTLY the same morphemes as part_breakdown. e.g. if part_breakdown has [in-, cred-, -ible], then compound_tree leaves MUST be "in-", "cred-", "-ible" — NOT their Latin ancestors. Example: incredible → [in-, credible → [cred-, -ible]]. The intermediate nodes can show how they merged, but the LEAVES must use the SAME strings as part_breakdown.
- cognates: include 3-5 cognates from different language families when available.
- confidence: "high" = well-documented. "medium" = some uncertainty. "low" = debated or poorly documented. Be honest.`;

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
                "explanation",
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

        // 7. Stock new word parts from part_breakdown + tree ancestors
        {
            const partsToStock: { part: string; part_type: string; meaning: string; origin_language: string; examples: string[]; learning_hint: string | null }[] = [];

            // 7a. From part_breakdown (modern morphemes)
            if (result.part_breakdown && Array.isArray(result.part_breakdown)) {
                for (const p of result.part_breakdown) {
                    if (p.part && p.type && p.meaning && p.origin) {
                        partsToStock.push({
                            part: p.part,
                            part_type: p.type,
                            meaning: p.meaning,
                            origin_language: p.origin,
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
                            origin_language: node.language,
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
                (supabase as any).from("etymology_word_parts")
                    .upsert([...deduped.values()], { onConflict: "part,part_type", ignoreDuplicates: true })
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
