/**
 * compromise.js ベースの POS トークナイザー。
 * サーバーサイドのみで使用。
 */
import nlp from "compromise";
import { AUX_VERBS, getLemma } from "./verb-lexicon";
import type { PosToken } from "./types";

// ── compromise タグ → POS マッピング ──

const SCONJ_WORDS = new Set([
    "if", "because", "although", "though", "unless", "while",
    "when", "since", "before", "after", "until", "once",
    "whereas", "whenever", "wherever", "provided", "supposing",
]);

const CCONJ_WORDS = new Set(["and", "but", "or", "nor", "yet", "so", "for"]);

const PART_WORDS = new Set(["to", "not", "n't", "'t"]);

function mapPOS(tags: string[], word: string): PosToken["pos"] {
    const lower = word.toLowerCase();

    // punctuation
    if (/^[,;.!?:'"()\-–—[\]{}]$/.test(word)) return "PUNCT";

    // 辞書ベースの AUX 補正 (compromise は did/do 等を Auxiliary とタグしないことがある)
    if (AUX_VERBS.has(lower)) return "AUX";
    if (tags.includes("Auxiliary")) return "AUX";

    // Pronoun は Noun の前にチェック (compromise は Pronoun + Noun 両方タグする)
    if (tags.includes("Pronoun")) return "PRON";

    // Verb
    if (tags.includes("Verb") || tags.includes("Copula")) return "VERB";

    // Adjective
    if (tags.includes("Adjective") || tags.includes("Comparable")) return "ADJ";

    // Adverb
    if (tags.includes("Adverb")) return "ADV";

    // Number
    if (tags.includes("Cardinal") || tags.includes("Ordinal") || tags.includes("NumericValue")) return "NUM";

    // Determiner
    if (tags.includes("Determiner")) return "DET";

    // Conjunction / Particle 判別
    if (tags.includes("Conjunction") || tags.includes("Preposition")) {
        if (PART_WORDS.has(lower)) return "PART";
        if (SCONJ_WORDS.has(lower)) return "SCONJ";
        if (CCONJ_WORDS.has(lower)) return "CCONJ";
        if (tags.includes("Preposition")) return "ADP";
        return "SCONJ";
    }

    if (tags.includes("Preposition")) return "ADP";

    // Noun (generic — after all specific checks)
    if (tags.includes("Noun") || tags.includes("Singular") || tags.includes("Plural")
        || tags.includes("Uncountable") || tags.includes("ProperNoun")) return "NOUN";

    // Date/Time terms → ADV (yesterday, today, etc.)
    if (tags.includes("Date") || tags.includes("Time")) return "ADV";

    return "OTHER";
}

/**
 * compromise.js で POS タグ付きトークン列を生成する。
 * AUX_VERBS セットで auxiliary 補正を上書きする。
 */
export function tokenizeWithPOS(sentence: string): PosToken[] {
    const doc = nlp(sentence);
    const termsJson = doc.terms().json({ offset: true });

    const tokens: PosToken[] = [];

    for (const term of termsJson) {
        const t = term.terms?.[0];
        if (!t) continue;

        const text: string = t.text;
        if (!text) continue;

        const tags: string[] = t.tags ?? [];
        const lower = text.toLowerCase();
        const offset = t.offset ?? term.offset;

        const startIndex = offset?.start ?? -1;
        const endIndex = startIndex >= 0 ? startIndex + (offset?.length ?? text.length) : -1;

        const pos = mapPOS(tags, text);

        // lemma: verb系は getLemma で、それ以外は normal
        const lemma = (pos === "VERB" || pos === "AUX")
            ? getLemma(lower)
            : (t.normal ?? lower);

        tokens.push({
            text,
            lower,
            pos,
            lemma,
            startIndex,
            endIndex,
        });
    }

    // Inject PUNCT tokens for structural punctuation (commas, semicolons, etc.)
    // that compromise.js may skip in its terms() output.
    const punctRegex = /[,;.!?]/g;
    let pm: RegExpExecArray | null;
    while ((pm = punctRegex.exec(sentence)) !== null) {
        const ch = pm[0];
        const idx = pm.index;
        // Skip if already covered by an existing token
        const alreadyCovered = tokens.some(t => t.startIndex <= idx && t.endIndex > idx);
        if (!alreadyCovered) {
            tokens.push({
                text: ch,
                lower: ch,
                pos: "PUNCT",
                lemma: ch,
                startIndex: idx,
                endIndex: idx + 1,
            });
        }
    }

    // Sort by startIndex for consistent ordering
    tokens.sort((a, b) => a.startIndex - b.startIndex);

    return tokens;
}
