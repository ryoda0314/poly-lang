/**
 * 統語テストランナー。
 * validate() の結果に加え、各テスト項目ごとに pass/fail/warn を返す。
 * 根拠 (evidenceText) と信頼度 (confidence) を付与する。
 */
import { isAux } from "./verb-lexicon";
import { validateClause } from "./invariants";
import { detectGap, validateClauseType } from "./gap-detector";
import { classifyToInfinitive } from "./to-inf-classifier";
import type { SyntaxTestEvidence, PosToken } from "./types";

/** 全テスト実行 */
export function runSyntaxTests(
    sentence: string,
    stage1: any,
    stage2: any,
    tokens: PosToken[],
): SyntaxTestEvidence[] {
    const results: SyntaxTestEvidence[] = [];

    // 全 clause を列挙
    const clauses: Array<{ clauseId: string; elements: any[]; isMain: boolean; type?: string; parentElement?: any }> = [];
    clauses.push({ clauseId: "main", elements: stage1.elements ?? [], isMain: true });
    for (const sc of stage2.subClauses ?? []) {
        const parentElem = (stage1.elements ?? []).find((e: any) => e.expandsTo === sc.clauseId);
        clauses.push({
            clauseId: sc.clauseId,
            elements: sc.elements ?? [],
            isMain: false,
            type: sc.type,
            parentElement: parentElem,
        });
    }

    for (const clause of clauses) {
        results.push(...testAuxInVChain(clause));
        results.push(...testFiniteVerbExists(clause));
        results.push(...testSpanExactMatch(sentence, clause));
        results.push(...testMHasTarget(clause));
    }

    results.push(...testExpandsToIntegrity(stage1, stage2));
    results.push(...testPatternConsistency(stage1, stage2));
    results.push(...testRelativeGap(stage2, tokens));
    results.push(...testNounClauseCompleteness(stage2, tokens, stage1));
    results.push(...testToInfFunction(stage1, stage2, tokens));

    return results;
}

// ── 1. aux_in_v_chain ──

function testAuxInVChain(
    clause: { clauseId: string; elements: any[] },
): SyntaxTestEvidence[] {
    const results: SyntaxTestEvidence[] = [];
    let allPass = true;

    for (let i = 0; i < clause.elements.length; i++) {
        const elem = clause.elements[i];
        if (elem.role === "V") continue;
        const words = elem.text.trim().split(/\s+/);
        if (words.length === 1 && isAux(words[0])) {
            allPass = false;
            results.push({
                testName: "aux_in_v_chain",
                status: "fail",
                clauseId: clause.clauseId,
                elementIndex: i,
                message: `AUX "${elem.text}" is not in V role (found: ${elem.role})`,
                evidenceText: elem.text,
                ruleId: "INV_06_AUX_IN_V",
                confidence: 1.0,
            });
        }
    }

    if (allPass) {
        results.push({
            testName: "aux_in_v_chain",
            status: "pass",
            clauseId: clause.clauseId,
            message: "All auxiliary verbs are correctly in V elements",
            ruleId: "INV_06_AUX_IN_V",
            confidence: 1.0,
        });
    }

    return results;
}

// ── 2. finite_verb_exists ──

function testFiniteVerbExists(
    clause: { clauseId: string; elements: any[] },
): SyntaxTestEvidence[] {
    const hasV = clause.elements.some((e: any) => e.role === "V");
    const hasReal = clause.elements.some((e: any) => e.startIndex >= 0);

    if (!hasV && hasReal) {
        return [{
            testName: "finite_verb_exists",
            status: "fail",
            clauseId: clause.clauseId,
            message: "No finite verb found in clause",
            ruleId: "INV_01_FINITE_V",
            confidence: 1.0,
        }];
    }

    return [{
        testName: "finite_verb_exists",
        status: "pass",
        clauseId: clause.clauseId,
        message: "Finite verb present",
        ruleId: "INV_01_FINITE_V",
        confidence: 1.0,
    }];
}

// ── 3. span_exact_match ──

function testSpanExactMatch(
    sentence: string,
    clause: { clauseId: string; elements: any[] },
): SyntaxTestEvidence[] {
    const results: SyntaxTestEvidence[] = [];
    let allPass = true;

    for (let i = 0; i < clause.elements.length; i++) {
        const elem = clause.elements[i];
        if (elem.startIndex < 0) continue;
        const slice = sentence.slice(elem.startIndex, elem.endIndex);
        if (slice !== elem.text) {
            allPass = false;
            results.push({
                testName: "span_exact_match",
                status: "fail",
                clauseId: clause.clauseId,
                elementIndex: i,
                message: `Span mismatch: expected "${elem.text}", got "${slice}"`,
                evidenceText: `[${elem.startIndex},${elem.endIndex}) = "${slice}"`,
                ruleId: "INV_09_SPAN_MATCH",
                confidence: 1.0,
            });
        }
    }

    if (allPass) {
        results.push({
            testName: "span_exact_match",
            status: "pass",
            clauseId: clause.clauseId,
            message: "All spans match text",
            ruleId: "INV_09_SPAN_MATCH",
            confidence: 1.0,
        });
    }

    return results;
}

// ── 4. m_has_target ──

function testMHasTarget(
    clause: { clauseId: string; elements: any[] },
): SyntaxTestEvidence[] {
    const results: SyntaxTestEvidence[] = [];
    let hasUnlinkedM = false;

    for (let i = 0; i < clause.elements.length; i++) {
        const elem = clause.elements[i];
        if (elem.role !== "M") continue;
        if (elem.startIndex < 0) continue;
        if (elem.modifiesIndex == null) {
            hasUnlinkedM = true;
            results.push({
                testName: "m_has_target",
                status: "warn",
                clauseId: clause.clauseId,
                elementIndex: i,
                message: `M element "${elem.text}" has no modifiesIndex`,
                evidenceText: elem.text,
                ruleId: "INV_14_M_TARGET",
                confidence: 0.7,
            });
        }
    }

    if (!hasUnlinkedM) {
        results.push({
            testName: "m_has_target",
            status: "pass",
            clauseId: clause.clauseId,
            message: "All M elements have targets",
            ruleId: "INV_14_M_TARGET",
            confidence: 1.0,
        });
    }

    return results;
}

// ── 5. expandsTo_integrity ──

function testExpandsToIntegrity(
    stage1: any,
    stage2: any,
): SyntaxTestEvidence[] {
    const results: SyntaxTestEvidence[] = [];
    const subClauseIds = new Set(
        (stage2.subClauses ?? []).map((sc: any) => sc.clauseId)
    );
    let allPass = true;

    const allElements: Array<[string, any[]]> = [
        ["main", stage1.elements ?? []],
        ...(stage2.subClauses ?? []).map((sc: any) => [sc.clauseId, sc.elements ?? []] as [string, any[]]),
    ];

    for (const [clauseId, elements] of allElements) {
        for (let i = 0; i < elements.length; i++) {
            const elem = elements[i];
            if (!elem.expandsTo) continue;
            if (!subClauseIds.has(elem.expandsTo)) {
                allPass = false;
                results.push({
                    testName: "expandsTo_integrity",
                    status: "fail",
                    clauseId,
                    elementIndex: i,
                    message: `expandsTo "${elem.expandsTo}" not found in subClauses`,
                    evidenceText: `${elem.text} → ${elem.expandsTo}`,
                    ruleId: "INV_08_EXPANDS_TO",
                    confidence: 1.0,
                });
            }
        }
    }

    if (allPass) {
        results.push({
            testName: "expandsTo_integrity",
            status: "pass",
            clauseId: "main",
            message: "All expandsTo references are valid",
            ruleId: "INV_08_EXPANDS_TO",
            confidence: 1.0,
        });
    }

    return results;
}

// ── 6. pattern_consistency ──

function testPatternConsistency(
    stage1: any,
    stage2: any,
): SyntaxTestEvidence[] {
    const results: SyntaxTestEvidence[] = [];

    const clauseStages: Array<[string, any]> = [
        ["main", stage1],
        ...(stage2.subClauses ?? []).map((sc: any) => [sc.clauseId, sc] as [string, any]),
    ];

    for (const [clauseId, stage] of clauseStages) {
        const pattern = stage.sentencePattern;
        if (pattern == null) continue;

        const roles = new Set((stage.elements ?? []).map((e: any) => e.role));
        let consistent = true;
        let msg = "";

        // Comp counts as C for pattern consistency
        const hasCorComp = roles.has("C") || roles.has("Comp");

        if (pattern === 2 && !hasCorComp && roles.has("V")) {
            consistent = false;
            msg = "Pattern 2 (SVC) but no C or Comp found";
        }
        if (pattern === 4 && (!roles.has("Oi") || !roles.has("Od"))) {
            consistent = false;
            msg = "Pattern 4 (SVOO) but missing Oi or Od";
        }
        if (pattern === 5 && (!roles.has("Od") || !hasCorComp)) {
            consistent = false;
            msg = "Pattern 5 (SVOC) but missing Od or C/Comp";
        }

        results.push({
            testName: "pattern_consistency",
            status: consistent ? "pass" : "fail",
            clauseId,
            message: consistent ? `Pattern ${pattern} is consistent with roles` : msg,
            ruleId: "INV_07_PATTERN",
            confidence: consistent ? 1.0 : 0.9,
        });
    }

    return results;
}

// ── 7. relative_gap ──

function testRelativeGap(
    stage2: any,
    tokens: PosToken[],
): SyntaxTestEvidence[] {
    const results: SyntaxTestEvidence[] = [];

    for (const sc of stage2.subClauses ?? []) {
        if (sc.type !== "relative") continue;

        const gap = detectGap(sc.elements ?? [], tokens);

        if (gap.hasGap) {
            results.push({
                testName: "relative_gap",
                status: "pass",
                clauseId: sc.clauseId,
                message: `Relative clause has gap at ${gap.gapRole}`,
                evidenceText: `gap: ${gap.gapRole}`,
                ruleId: "INV_11_REL_GAP",
                confidence: gap.confidence,
            });
        } else {
            results.push({
                testName: "relative_gap",
                status: "warn",
                clauseId: sc.clauseId,
                message: "Relative clause has no identifiable gap — may be a noun clause",
                ruleId: "INV_11_REL_GAP",
                confidence: gap.confidence,
            });
        }
    }

    return results;
}

// ── 8. noun_clause_completeness ──

function testNounClauseCompleteness(
    stage2: any,
    tokens: PosToken[],
    stage1: any,
): SyntaxTestEvidence[] {
    const results: SyntaxTestEvidence[] = [];

    for (const sc of stage2.subClauses ?? []) {
        if (sc.type !== "noun") continue;

        const gap = detectGap(sc.elements ?? [], tokens);

        if (!gap.hasGap) {
            results.push({
                testName: "noun_clause_completeness",
                status: "pass",
                clauseId: sc.clauseId,
                message: "Noun clause is complete (no gap)",
                ruleId: "INV_12_NOUN_COMPLETE",
                confidence: gap.confidence,
            });
        } else {
            // noun clause にギャップ → 関係節の可能性
            const parentElem = (stage1.elements ?? []).find((e: any) => e.expandsTo === sc.clauseId);
            const parentVerb = (stage1.elements ?? []).find((e: any) => e.role === "V")?.text;

            const validation = validateClauseType("noun", sc.elements ?? [], parentVerb, tokens);

            results.push({
                testName: "noun_clause_completeness",
                status: "warn",
                clauseId: sc.clauseId,
                message: `Noun clause has gap at ${gap.gapRole} — ${validation.reason || "may be a relative clause"}`,
                evidenceText: `gap: ${gap.gapRole}`,
                ruleId: "INV_12_NOUN_COMPLETE",
                confidence: gap.confidence,
            });
        }
    }

    return results;
}

// ── 9. to_inf_function ──

function testToInfFunction(
    stage1: any,
    stage2: any,
    tokens: PosToken[],
): SyntaxTestEvidence[] {
    const results: SyntaxTestEvidence[] = [];

    const allClauses: Array<[string, any[]]> = [
        ["main", stage1.elements ?? []],
        ...(stage2.subClauses ?? []).map((sc: any) => [sc.clauseId, sc.elements ?? []] as [string, any[]]),
    ];

    for (const [clauseId, elements] of allClauses) {
        for (let i = 0; i < elements.length; i++) {
            const elem = elements[i];
            // to-infinitive 要素を検出 ("to " で始まるか type="infinitive")
            if (!elem.text?.toLowerCase().startsWith("to ")) continue;

            const classified = classifyToInfinitive(i, elements, tokens);

            results.push({
                testName: "to_inf_function",
                status: "pass",
                clauseId,
                elementIndex: i,
                message: `to-infinitive "${elem.text}" classified as ${classified}`,
                evidenceText: `${elem.text} → ${classified}`,
                ruleId: "TO_INF_FUNC",
                confidence: 0.8,
            });
        }
    }

    return results;
}
