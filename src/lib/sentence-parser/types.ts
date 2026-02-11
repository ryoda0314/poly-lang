// ── POS Token ──

export interface PosToken {
    text: string;
    lower: string;
    pos: "AUX" | "VERB" | "NOUN" | "PRON" | "ADJ" | "ADV" | "ADP" | "SCONJ" | "CCONJ" | "PART" | "PUNCT" | "DET" | "NUM" | "OTHER";
    lemma: string;
    startIndex: number;
    endIndex: number;
}

// ── Syntax Test ──

export type TestName =
    | "aux_in_v_chain"
    | "finite_verb_exists"
    | "pattern_consistency"
    | "relative_gap"
    | "noun_clause_completeness"
    | "to_inf_function"
    | "span_exact_match"
    | "expandsTo_integrity"
    | "m_has_target";

export type TestResultStatus = "pass" | "fail" | "warn";

export interface SyntaxTestEvidence {
    testName: TestName;
    status: TestResultStatus;
    clauseId: string;
    elementIndex?: number;
    message: string;
    evidenceText?: string;
    ruleId: string;
    confidence: number;
}

// ── To-Infinitive Function ──

export type InfFunction =
    | "purpose"
    | "result"
    | "complement"
    | "object"
    | "subject"
    | "noun_modifier";

// ── Gap Detection ──

export interface GapInfo {
    hasGap: boolean;
    gapRole: "S" | "Od" | "C" | null;
    confidence: number;
    /** True if gap is through long-distance extraction via bridge verb */
    isLongDistance?: boolean;
    /** Bridge verb enabling the extraction */
    bridgeVerb?: string;
    /** Sub-clause where the actual gap resides */
    gapClauseId?: string;
}

/** V-Chain: auxiliary + main verb の1連鎖 */
export interface VChain {
    /** 連結された V テキスト全体: "had been treated" */
    text: string;
    /** 構成 token テキスト配列: ["had", "been", "treated"] */
    words: string[];
    /** 先頭の charIndex (原文上) */
    startIndex: number;
    /** 末尾の charIndex (exclusive) */
    endIndex: number;
    voice: "active" | "passive";
    tense: string;
    isFinite: boolean;
    /** main verb の lemma (辞書引きに使う) */
    mainVerbLemma: string;
    /** Parenthetical insertion skipped within the chain (discontinuous constituency) */
    parentheticalSpan?: { startIndex: number; endIndex: number; text: string };
}

export interface VChainResult {
    sentence: string;
    chains: VChain[];
    /** プロンプト注入用サマリ文字列 */
    promptSummary: string;
}

/** Violation: 不変条件違反 */
export interface Violation {
    invariantId: string;
    severity: "error" | "warning";
    recoverable: boolean;
    message: string;
    clauseId: string;
    elementIndex?: number;
}

export interface ValidationReport {
    valid: boolean;
    violations: Violation[];
}

export interface RepairAction {
    type: string;
    clauseId: string;
    elementIndex?: number;
    before: Record<string, any>;
    after: Record<string, any>;
    reason: string;
}

export interface RepairLog {
    actions: RepairAction[];
    cascadeCount: number;
}
