import { isAux, THAT_COMPLEMENT_VERBS, getLemma, matchesVerbSet } from "./verb-lexicon";
import type { Violation, ValidationReport } from "./types";

/**
 * 1つの clause の elements に対して不変条件を検査する。
 * validate は純粋関数 — 副作用なし。
 */
export function validateClause(
    clauseId: string,
    elements: Array<{ role: string; text: string; startIndex: number; endIndex: number; expandsTo?: string | null }>,
    sentence: string,
    isMainClause: boolean,
): Violation[] {
    const violations: Violation[] = [];

    // ── INV_06: AUX は必ず V ──
    for (let i = 0; i < elements.length; i++) {
        const elem = elements[i];
        if (elem.role === "V") continue;
        const words = elem.text.trim().split(/\s+/);

        // 単語 AUX が V 外にある
        if (words.length === 1 && isAux(words[0])) {
            violations.push({
                invariantId: "INV_06",
                severity: "error",
                recoverable: true,
                message: `AUX "${elem.text}" has role=${elem.role}, expected V`,
                clauseId,
                elementIndex: i,
            });
        }

        // 複合語の先頭が AUX で、残りが動詞的
        if (words.length >= 2 && isAux(words[0])) {
            const w1 = words[1].toLowerCase();
            const isVerbal = /ed$/i.test(w1) || /en$/i.test(w1)
                || /ing$/i.test(w1)
                || /^(been|being|come|go|get|got|make|made|take|taken|have|had|do|done)$/i.test(w1);
            if (isVerbal) {
                violations.push({
                    invariantId: "INV_06",
                    severity: "error",
                    recoverable: true,
                    message: `"${elem.text}" starts with AUX in role=${elem.role}, expected V`,
                    clauseId,
                    elementIndex: i,
                });
            }
        }
    }

    // ── INV_01: 有限節には V が必要 ──
    const hasV = elements.some(e => e.role === "V");
    if (!hasV) {
        const hasRealElements = elements.some(e => e.startIndex >= 0);
        if (hasRealElements) {
            violations.push({
                invariantId: "INV_01",
                severity: "error",
                recoverable: false,
                message: "No finite V found in clause",
                clauseId,
            });
        }
    }

    // ── INV_02: S が必要 (命令文を除く) ──
    const hasS = elements.some(e => e.role === "S");
    if (!hasS && hasV && isMainClause) {
        const firstReal = elements.find(e => e.startIndex >= 0);
        if (firstReal?.role !== "V") {
            violations.push({
                invariantId: "INV_02",
                severity: "error",
                recoverable: true,
                message: "No subject found in finite clause",
                clauseId,
            });
        }
    }

    // ── INV_09: charSpan がテキストと一致 ──
    for (let i = 0; i < elements.length; i++) {
        const elem = elements[i];
        if (elem.startIndex < 0) continue;
        const slice = sentence.slice(elem.startIndex, elem.endIndex);
        if (slice !== elem.text) {
            violations.push({
                invariantId: "INV_09",
                severity: "error",
                recoverable: true,
                message: `charSpan mismatch: text="${elem.text}", slice="${slice}"`,
                clauseId,
                elementIndex: i,
            });
        }
    }

    // ── INV_04: span 重複チェック ──
    const realElems = elements
        .map((e, i) => ({ ...e, idx: i }))
        .filter(e => e.startIndex >= 0)
        .sort((a, b) => a.startIndex - b.startIndex);

    for (let i = 0; i < realElems.length - 1; i++) {
        const curr = realElems[i];
        const next = realElems[i + 1];
        if (curr.endIndex > next.startIndex) {
            if (curr.expandsTo || next.expandsTo) continue;
            violations.push({
                invariantId: "INV_04",
                severity: "error",
                recoverable: true,
                message: `Span overlap: "${curr.text}" [${curr.startIndex},${curr.endIndex}) `
                    + `and "${next.text}" [${next.startIndex},${next.endIndex})`,
                clauseId,
                elementIndex: next.idx,
            });
        }
    }

    // ── INV_03: 非連続テキスト検出 (V要素のみ) ──
    for (let i = 0; i < elements.length; i++) {
        const elem = elements[i];
        if (elem.role !== "V") continue;
        if (elem.startIndex < 0) continue;
        const words = elem.text.split(/\s+/);
        if (words.length <= 1) continue;
        if (sentence.indexOf(elem.text) === -1) {
            violations.push({
                invariantId: "INV_03",
                severity: "error",
                recoverable: true,
                message: `Non-contiguous V text "${elem.text}" not found in sentence`,
                clauseId,
                elementIndex: i,
            });
        }
    }

    // ── INV_14: M は modifiesIndex を持つべき (warning) ──
    for (let i = 0; i < elements.length; i++) {
        const elem = elements[i] as any;
        if (elem.role !== "M") continue;
        if (elem.startIndex < 0) continue;
        if (elem.modifiesIndex == null) {
            violations.push({
                invariantId: "INV_14",
                severity: "warning",
                recoverable: false,
                message: `M element "${elem.text}" has no modifiesIndex`,
                clauseId,
                elementIndex: i,
            });
        }
    }

    // ── INV_15: That-clause completeness — Od starting with "that " (or Compz + Od) must contain a verb ──
    for (let i = 0; i < elements.length; i++) {
        const elem = elements[i] as any;
        if (elem.role !== "Od" || elem.startIndex < 0) continue;
        const text = elem.text.toLowerCase();
        // Check for "that " prefix in Od, or preceding Compz element
        const prevIsCompz = i > 0 && elements[i - 1].role === "Compz"
            && /^(that|whether|if)$/i.test(elements[i - 1].text.trim());
        if (!text.startsWith("that ") && !prevIsCompz) continue;

        // Check the preceding V element to see if it takes a that-clause
        const vElems = elements.filter((e: any) => e.role === "V" && e.startIndex >= 0);
        const mainVerbWord = vElems.flatMap((e: any) => e.text.toLowerCase().split(/\s+/)).pop() ?? "";
        if (!matchesVerbSet(mainVerbWord, THAT_COMPLEMENT_VERBS)) continue;

        // Check if the Od text contains a verb-like word (past tense, -ing, or common verbs)
        const skipLen = text.startsWith("that ") ? 5 : 0; // skip "that " if embedded, else full text (Compz case)
        const odWords = text.slice(skipLen).trim().split(/\s+/);
        const hasVerb = odWords.some((w: string) =>
            /ed$/.test(w) || /ing$/.test(w) || /^(is|are|was|were|has|have|had|do|does|did|can|could|will|would|shall|should|may|might|must)$/.test(w),
        );

        if (!hasVerb) {
            // Check if the next element after this Od contains verb-like content
            const nextElem = elements[i + 1];
            const nextHasVerb = nextElem && nextElem.startIndex >= 0
                && nextElem.text.split(/\s+/).some((w: string) =>
                    /ed$/i.test(w) || /ing$/i.test(w) || /^(is|are|was|were|has|have|had|do|does|did)$/i.test(w.toLowerCase()),
                );

            if (nextHasVerb) {
                violations.push({
                    invariantId: "INV_15",
                    severity: "error",
                    recoverable: false,
                    message: `Od "${elem.text}" starts with "that" but has no verb — likely a truncated that-clause (the predicate may have been split into a following element)`,
                    clauseId,
                    elementIndex: i,
                });
            }
        }
    }

    return violations;
}

/**
 * expandsTo の整合性チェック (INV_08)。
 * main clause の elements に expandsTo があるとき、対応する subClause が存在するか。
 */
function validateExpandsToIntegrity(
    stage1: any,
    stage2: any,
): Violation[] {
    const violations: Violation[] = [];
    const subClauseIds = new Set(
        (stage2.subClauses ?? []).map((sc: any) => sc.clauseId)
    );

    for (const [clauseId, elements] of getAllClauseElements(stage1, stage2)) {
        for (let i = 0; i < elements.length; i++) {
            const elem = elements[i] as any;
            if (!elem.expandsTo) continue;
            if (!subClauseIds.has(elem.expandsTo)) {
                violations.push({
                    invariantId: "INV_08",
                    severity: "error",
                    recoverable: true,
                    message: `expandsTo "${elem.expandsTo}" not found in subClauses`,
                    clauseId,
                    elementIndex: i,
                });
            }
        }
    }

    return violations;
}

/**
 * 文型パターンの整合性チェック (INV_07)。
 * sentencePattern が設定されている場合、roles と矛盾しないか。
 */
function validatePatternConsistency(
    stage1: any,
    stage2: any,
): Violation[] {
    const violations: Violation[] = [];

    for (const [clauseId, elements, stage] of getAllClauseElementsWithStage(stage1, stage2)) {
        const pattern = stage.sentencePattern;
        if (pattern == null) continue;

        const roles = new Set(elements.map((e: any) => e.role));

        // Comp counts as C for pattern consistency (Comp = verbal complement)
        const hasCorComp = roles.has("C") || roles.has("Comp");

        if (pattern === 2 && !hasCorComp && !roles.has("V")) {
            // pattern 2 で C/Comp がない — V もなければスキップ
        } else if (pattern === 2 && !hasCorComp) {
            violations.push({
                invariantId: "INV_07",
                severity: "error",
                recoverable: true,
                message: `Pattern ${pattern} (SVC) but no C or Comp found`,
                clauseId,
            });
        }

        if (pattern === 4 && (!roles.has("Oi") || !roles.has("Od"))) {
            violations.push({
                invariantId: "INV_07",
                severity: "error",
                recoverable: true,
                message: `Pattern ${pattern} (SVOO) but missing Oi or Od`,
                clauseId,
            });
        }

        if (pattern === 5 && (!roles.has("Od") || !hasCorComp)) {
            violations.push({
                invariantId: "INV_07",
                severity: "error",
                recoverable: true,
                message: `Pattern ${pattern} (SVOC) but missing Od or C/Comp`,
                clauseId,
            });
        }
    }

    return violations;
}

/** ヘルパー: 全 clause の elements を走査 */
function getAllClauseElements(stage1: any, stage2: any): Array<[string, any[]]> {
    const result: Array<[string, any[]]> = [];
    result.push(["main", stage1.elements ?? []]);
    for (const sc of stage2.subClauses ?? []) {
        result.push([sc.clauseId, sc.elements ?? []]);
    }
    return result;
}

function getAllClauseElementsWithStage(stage1: any, stage2: any): Array<[string, any[], any]> {
    const result: Array<[string, any[], any]> = [];
    result.push(["main", stage1.elements ?? [], stage1]);
    for (const sc of stage2.subClauses ?? []) {
        result.push([sc.clauseId, sc.elements ?? [], sc]);
    }
    return result;
}

/**
 * 全 clause を検査して ValidationReport を返す。
 */
export function validate(
    sentence: string,
    stage1: any,
    stage2: any,
): ValidationReport {
    const all: Violation[] = [];

    // main clause
    all.push(...validateClause("main", stage1.elements ?? [], sentence, true));

    // sub clauses
    for (const sc of stage2.subClauses ?? []) {
        all.push(...validateClause(sc.clauseId, sc.elements ?? [], sentence, false));
    }

    // cross-clause checks
    all.push(...validateExpandsToIntegrity(stage1, stage2));
    all.push(...validatePatternConsistency(stage1, stage2));

    return {
        valid: all.filter(v => v.severity === "error").length === 0,
        violations: all,
    };
}
