/**
 * to 不定詞の機能分類。
 * POS トークンと辞書を使って、to-infinitive の文法的機能を判定する。
 */
import {
    TO_INF_OBJECT_VERBS,
    RAISING_VERBS,
    ASPECTUAL_TO_VERBS,
    getLemma,
} from "./verb-lexicon";
import type { InfFunction, PosToken } from "./types";

// ── 例外辞書 ──

/** result 用途の動詞パターン: "only to V", "never to V", "live to be" */
const RESULT_TRIGGERS = new Set([
    "only", "never", "merely",
]);
const RESULT_VERBS = new Set([
    "live", "wake", "awake",
]);

/** Verbs that form experiential predicates with aspectual verbs:
 * "come to know", "get to know", "grow to love" → complement (predicate unity)
 * Excludes verbs that are commonly purpose (see/learn/feel/enjoy) */
const ASPECTUAL_COMPLEMENT_INF_VERBS = new Set([
    "know", "understand", "realize", "appreciate", "like", "love",
    "believe", "accept", "fear", "hate", "respect", "trust",
    "want", "need",
]);

/** noun_modifier: to-inf を取る名詞 */
const NOUN_MODIFIER_HEADS = new Set([
    "ability", "attempt", "chance", "choice", "decision",
    "desire", "effort", "failure", "intention", "need",
    "obligation", "opportunity", "order", "permission", "plan",
    "power", "promise", "proposal", "reason", "refusal",
    "request", "right", "tendency", "time", "way",
    "wish", "capacity", "freedom", "urge", "willingness",
]);

/**
 * to 不定詞の機能を判定する。
 *
 * @param toIndex  "to" の element/token インデックス (clause 内)
 * @param elements clause 内の SVOC elements
 * @param tokens   PosToken[] (全文のトークン列)
 */
export function classifyToInfinitive(
    toIndex: number,
    elements: Array<{ role: string; text: string; startIndex: number; endIndex: number }>,
    tokens: PosToken[],
): InfFunction {
    const element = elements[toIndex];
    if (!element) return "purpose";

    const text = element.text.toLowerCase();

    // ── 1. 文頭主語位置 → subject ──
    if (element.role === "S") return "subject";
    if (toIndex === 0 && text.startsWith("to ")) return "subject";

    // ── V 要素を特定 ──
    const vElems = elements.filter(e => e.role === "V");
    const vWords = vElems.flatMap(e => e.text.toLowerCase().split(/\s+/));
    const mainVerbWord = vWords[vWords.length - 1] ?? "";
    const mainVerbLemma = getLemma(mainVerbWord);

    // ── 2. 動詞が TO_INF_OBJECT_VERBS → object ──
    if (TO_INF_OBJECT_VERBS.has(mainVerbLemma)) {
        // V の後の位置にあることを確認
        const vIdx = elements.findIndex(e => e.role === "V");
        if (vIdx >= 0 && toIndex > vIdx) return "object";
    }

    // ── 3. Raising verb → complement ──
    // Only raising verbs (seem/appear/happen/prove/tend/chance) take to-inf as complement.
    // Other linking verbs (come/go/grow) use to-inf as purpose, not complement.
    if (RAISING_VERBS.has(mainVerbLemma)) {
        const vIdx = elements.findIndex(e => e.role === "V");
        if (vIdx >= 0 && toIndex > vIdx) return "complement";
    }

    // ── 3b. Aspectual verb + to-inf → complement (predicate unity) ──
    // "come to be used" → complement (aspectual passive)
    // "get to know" → complement (experiential predicate)
    // "grow to love" → complement (gradual change)
    // But "came to see him" → purpose (not aspectual — falls through)
    if (ASPECTUAL_TO_VERBS.has(mainVerbLemma)) {
        const toText = text.replace(/^to\s+/i, "");
        const firstInfWord = toText.split(/\s+/)[0]?.toLowerCase() ?? "";
        const infLemma = getLemma(firstInfWord);
        // "come/get to be + ..." → complement (aspectual)
        if (firstInfWord === "be" || firstInfWord === "being") return "complement";
        // "come/get to know/love/..." → complement (experiential)
        if (ASPECTUAL_COMPLEMENT_INF_VERBS.has(firstInfWord) || ASPECTUAL_COMPLEMENT_INF_VERBS.has(infLemma)) {
            return "complement";
        }
    }

    // ── 4. 直前が名詞 (POS=NOUN) → noun_modifier ──
    if (element.startIndex >= 0 && tokens.length > 0) {
        // to の直前のトークンを見つける
        const toStartInSentence = element.startIndex;
        const prevToken = tokens.filter(t => t.endIndex <= toStartInSentence).pop();
        if (prevToken) {
            if (prevToken.pos === "NOUN" && NOUN_MODIFIER_HEADS.has(prevToken.lemma)) {
                return "noun_modifier";
            }
            // 汎用名詞後でもある程度判定
            if (prevToken.pos === "NOUN") return "noun_modifier";
        }
    }

    // ── 5. result パターン ──
    // "only to V", "never to V"
    if (element.startIndex >= 0 && tokens.length > 0) {
        const toStartInSentence = element.startIndex;
        const prevToken = tokens.filter(t => t.endIndex <= toStartInSentence).pop();
        if (prevToken && RESULT_TRIGGERS.has(prevToken.lower)) return "result";
    }
    // "live to be", "wake to find"
    if (RESULT_VERBS.has(mainVerbLemma)) return "result";

    // ── 6. それ以外 → purpose ──
    return "purpose";
}
