import {
    isLinkingVerb,
    getLemma,
    DITRANSITIVE_VERBS,
    COMPLEX_TRANSITIVE_VERBS,
    COPULAR_ADJ_SET,
    PASSIVE_PURPOSE_TO_INF_VERBS,
    ASPECTUAL_TO_VERBS,
    RAISING_VERBS,
    matchesVerbSet,
} from "./verb-lexicon";
import type { VChain } from "./types";

interface PatternResult {
    pattern: 1 | 2 | 3 | 4 | 5;
    label: string;
    /** applyCopularFix 相当の role 変更が必要な element index (なければ null) */
    odToCIndex: number | null;
}

const PATTERN_LABELS: Record<number, string> = {
    1: "第1文型 (SV)",
    2: "第2文型 (SVC)",
    3: "第3文型 (SVO)",
    4: "第4文型 (SVOO)",
    5: "第5文型 (SVOC)",
};

/**
 * V-chain + elements の role 集合から文型を判定する。
 */
export function determineSentencePattern(
    elements: Array<{ role: string; text: string; startIndex?: number }>,
    vchain?: VChain | null,
): PatternResult {
    // Exclude elided elements (startIndex === -1, i.e. gaps) from pattern determination.
    // Gaps exist for structural representation but don't affect surface sentence pattern.
    const surfaceElements = elements.filter(e => (e.startIndex ?? 0) >= 0);
    const roles = new Set(surfaceElements.map(e => e.role));
    const hasOd = roles.has("Od");
    const hasOi = roles.has("Oi");
    const hasC = roles.has("C");
    const hasComp = roles.has("Comp");

    // V テキストから main verb lemma を抽出 (surface elements only)
    const vElems = surfaceElements.filter(e => e.role === "V");
    const vWords = vElems.map(e => e.text.trim()).join(" ").toLowerCase().split(/\s+/).filter(Boolean);

    const mainVerbWord = vWords[vWords.length - 1] ?? "";
    const mainVerbLemma = vchain?.mainVerbLemma ?? getLemma(mainVerbWord);

    // Comp counts as C for pattern purposes, EXCEPT for aspectual verbs
    const compCountsAsC = hasComp && !ASPECTUAL_TO_VERBS.has(mainVerbLemma);
    const effectiveHasC = hasC || compCountsAsC;

    // Aspectual verb override: come/get/grow/live + to-inf → NOT linking
    const hasToInfElement = surfaceElements.some(e =>
        (e.role === "C" || e.role === "Od" || e.role === "Comp")
        && e.text.toLowerCase().startsWith("to "),
    );
    const mainIsLinking = isLinkingVerb(mainVerbWord)
        && !(ASPECTUAL_TO_VERBS.has(mainVerbLemma) && hasToInfElement);

    // copular fix: C がまだないが、Od の先頭が copular adj → Od→C に変更 (actual C only)
    // Use original elements array for odToCIndex (index into the full array)
    if (mainIsLinking && !hasC && hasOd) {
        const odIdx = elements.findIndex(e => e.role === "Od" && (e.startIndex ?? 0) >= 0);
        if (odIdx !== -1) {
            const firstWord = elements[odIdx].text.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
            if (COPULAR_ADJ_SET.has(firstWord)) {
                return { pattern: 2, label: PATTERN_LABELS[2], odToCIndex: odIdx };
            }
        }
    }

    // Linking verb + C/Comp → SVC
    if (mainIsLinking && effectiveHasC) {
        return { pattern: 2, label: PATTERN_LABELS[2], odToCIndex: null };
    }

    // Linking verb + no Od/C/Comp → SV
    if (mainIsLinking && !hasOd && !effectiveHasC) {
        return { pattern: 1, label: PATTERN_LABELS[1], odToCIndex: null };
    }

    // Ditransitive + Oi + Od → SVOO
    if (DITRANSITIVE_VERBS.has(mainVerbLemma) && hasOi && hasOd) {
        return { pattern: 4, label: PATTERN_LABELS[4], odToCIndex: null };
    }

    // Complex transitive + Od + C/Comp → SVOC
    if (COMPLEX_TRANSITIVE_VERBS.has(mainVerbLemma) && hasOd && effectiveHasC) {
        return { pattern: 5, label: PATTERN_LABELS[5], odToCIndex: null };
    }

    // Fallback: 統語パターン
    if (hasOi && hasOd) {
        return { pattern: 4, label: PATTERN_LABELS[4], odToCIndex: null };
    }
    if (hasOd && effectiveHasC) {
        return { pattern: 5, label: PATTERN_LABELS[5], odToCIndex: null };
    }
    if (hasOd) {
        return { pattern: 3, label: PATTERN_LABELS[3], odToCIndex: null };
    }
    if (effectiveHasC) {
        return { pattern: 2, label: PATTERN_LABELS[2], odToCIndex: null };
    }

    return { pattern: 1, label: PATTERN_LABELS[1], odToCIndex: null };
}

/**
 * stage の elements に対して文型判定 + copular fix を一括適用。
 * 現行の applyCopularFix() + fixSentencePattern() を統合した関数。
 */
export function applyPatternFix(
    stage: any,
    vchain?: VChain | null,
): void {
    const elements: any[] = stage.elements ?? [];

    // passive + to-inf fix: C→M for non-linking passive verbs (before pattern determination)
    fixPassiveToInf(elements, vchain);

    // aspectual verb + to-inf fix: C/Od→Comp (come/get/grow are intransitive)
    fixAspectualToInf(elements, vchain);

    // raising/causative/copular passive + to-inf: C→Comp
    fixRaisingToComp(elements, vchain);

    const result = determineSentencePattern(elements, vchain);

    // copular fix: Od → C (relabel only, no span mutation)
    if (result.odToCIndex !== null) {
        elements[result.odToCIndex].role = "C";
        elements[result.odToCIndex].arrowType = "complement";
    }

    // Dynamic label: reflect Comp in pattern label when C is absent
    const rolesAfterFix = new Set(elements.map((e: any) => e.role));
    if (result.pattern === 2 && rolesAfterFix.has("Comp") && !rolesAfterFix.has("C")) {
        result.label = "第2文型 (SV+Comp)";
    }
    if (result.pattern === 5 && rolesAfterFix.has("Comp") && !rolesAfterFix.has("C")) {
        result.label = "第5文型 (SVO+Comp)";
    }

    stage.sentencePattern = result.pattern;
    stage.sentencePatternLabel = result.label;
}

/**
 * Passive + to-infinitive fix (allowlist approach).
 * ONLY reclassify C→M when the main verb IS in PASSIVE_PURPOSE_TO_INF_VERBS.
 * All other passive + to-inf keep C as-is (conservative approach).
 *
 * Allowlist triggers (C→M): design, build, create, use, etc.
 *   "were designed to protect dissent" → M:"to protect dissent" (purpose)
 *
 * Everything else keeps C:
 *   "is believed to be guilty" → C (raising passive)
 *   "was made to confess" → C (causative passive)
 *   "was forced to leave" → C (causative passive)
 *   "had come to be used" → C (aspectual predicate)
 */
function fixPassiveToInf(elements: any[], vchain?: VChain | null): boolean {
    // Check for passive V
    let isPassive = false;
    if (vchain) {
        isPassive = vchain.voice === "passive";
    } else {
        // Fallback: check V elements for be-form + another word
        const vElems = elements.filter((e: any) => e.role === "V");
        const vText = vElems.map((e: any) => e.text.toLowerCase()).join(" ");
        const vWords = vText.split(/\s+/);
        isPassive = vWords.length >= 2
            && vWords.some(w => /^(am|is|are|was|were|be|been|being)$/.test(w));
    }
    if (!isPassive) return false;

    // Get main verb word (last word across V elements)
    const vElems = elements.filter((e: any) => e.role === "V");
    const vWords = vElems.flatMap((e: any) => e.text.toLowerCase().split(/\s+/));
    const mainVerbWord = vWords[vWords.length - 1] ?? "";

    // Linking verbs: C is valid (SVC pattern)
    if (isLinkingVerb(mainVerbWord)) return false;

    // Allowlist: ONLY reclassify if the verb is a purpose-taking verb
    if (!matchesVerbSet(mainVerbWord, PASSIVE_PURPOSE_TO_INF_VERBS)) return false;

    // Find C that is a to-infinitive
    const cIdx = elements.findIndex((e: any) =>
        e.role === "C" && e.text?.toLowerCase().startsWith("to "),
    );
    if (cIdx === -1) return false;

    // Reclassify C→M (purpose infinitive)
    elements[cIdx].role = "M";
    if (elements[cIdx].arrowType === "complement") {
        elements[cIdx].arrowType = "modifies";
    }
    return true;
}

/**
 * Aspectual verb + to-infinitive fix.
 * come/get/grow/live are INTRANSITIVE — to-inf is a verbal complement (Comp), not Od or C.
 * "had come to exclude the voices" → Comp:"to exclude the voices..." (Pattern 1 SV)
 */
function fixAspectualToInf(elements: any[], vchain?: VChain | null): boolean {
    const vElems = elements.filter((e: any) => e.role === "V");
    const vWords = vElems.flatMap((e: any) => e.text.toLowerCase().split(/\s+/));
    const mainVerbWord = vWords[vWords.length - 1] ?? "";
    const mainVerbLemma = vchain?.mainVerbLemma ?? getLemma(mainVerbWord);

    if (!ASPECTUAL_TO_VERBS.has(mainVerbLemma)) return false;

    // Find C or Od that is a to-infinitive
    const toInfIdx = elements.findIndex((e: any) =>
        (e.role === "C" || e.role === "Od") && e.text?.toLowerCase().startsWith("to "),
    );
    if (toInfIdx === -1) return false;

    // Reclassify to Comp (obligatory verbal complement of aspectual verb)
    elements[toInfIdx].role = "Comp";
    return true;
}

/**
 * Raising verb / causative passive / copular passive adj + to-infinitive → C → Comp.
 * These verbs take to-inf as a verbal complement, not an attribute complement.
 *
 * Raising: seem/appear/happen/prove/tend + to V → Comp
 * Causative passive: was made/forced/caused/allowed + to V → Comp
 * Copular passive adj: is meant/supposed/likely/bound + to V → Comp
 */
const CAUSATIVE_PASSIVE_VERBS = new Set([
    "make", "force", "cause", "allow", "compel", "enable", "permit",
    "lead", "drive", "get", "let", "help",
]);
const COPULAR_PASSIVE_ADJ_VERBS = new Set([
    "mean", "suppose", "say", "report", "think", "believe",
    "consider", "know", "find", "expect", "allege", "design",
]);

function fixRaisingToComp(elements: any[], vchain?: VChain | null): boolean {
    const vElems = elements.filter((e: any) => e.role === "V");
    const vWords = vElems.flatMap((e: any) => e.text.toLowerCase().split(/\s+/));
    const mainVerbWord = vWords[vWords.length - 1] ?? "";
    const mainVerbLemma = vchain?.mainVerbLemma ?? getLemma(mainVerbWord);

    // Find C that is a to-infinitive
    const cIdx = elements.findIndex((e: any) =>
        e.role === "C" && e.text?.toLowerCase().startsWith("to "),
    );
    if (cIdx === -1) return false;

    // Raising verbs: seem/appear/happen/prove/tend
    if (RAISING_VERBS.has(mainVerbLemma)) {
        elements[cIdx].role = "Comp";
        return true;
    }

    // Check for passive voice
    let isPassive = false;
    if (vchain) {
        isPassive = vchain.voice === "passive";
    } else {
        isPassive = vWords.some(w => /^(am|is|are|was|were|be|been|being)$/.test(w))
            && vWords.length >= 2;
    }

    if (isPassive) {
        // Causative passive: was made/forced/caused + to V
        if (matchesVerbSet(mainVerbWord, CAUSATIVE_PASSIVE_VERBS)) {
            elements[cIdx].role = "Comp";
            return true;
        }
        // Copular passive adj: is meant/supposed + to V
        if (matchesVerbSet(mainVerbWord, COPULAR_PASSIVE_ADJ_VERBS)) {
            elements[cIdx].role = "Comp";
            return true;
        }
    }

    return false;
}
