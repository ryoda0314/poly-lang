import { validate } from "./invariants";
import { applyPatternFix } from "./sentence-pattern";
import type { RepairAction, RepairLog, Violation, ValidationReport } from "./types";

const PRIORITY: Record<string, number> = {
    INV_01: 0,  // fail-fast (repair しない)
    INV_03: 1,  // 非連続 V テキスト → 分割 (INV_06 の前に)
    INV_06: 2,  // AUX → V
    INV_02: 3,  // S 不在
    INV_09: 4,  // charSpan 不一致
    INV_04: 5,  // span 重複
    INV_07: 6,  // 文型不整合 → パターン再計算
    INV_08: 7,  // expandsTo 不整合 → null 化
    INV_14: 99, // M 係り先 (warning のみ、repair しない)
};

function violationPriority(v: Violation): number {
    return PRIORITY[v.invariantId] ?? 99;
}

/**
 * 単一の violation を修復する。
 */
function repairOne(
    v: Violation,
    sentence: string,
    stage1: any,
    stage2: any,
): RepairAction | null {
    const elements = v.clauseId === "main"
        ? (stage1.elements ?? [])
        : (stage2.subClauses ?? []).find((sc: any) => sc.clauseId === v.clauseId)?.elements ?? [];

    switch (v.invariantId) {
        case "INV_03": {
            // 非連続 V テキスト → 個別単語に分割
            if (v.elementIndex == null) return null;
            const ncElem = elements[v.elementIndex];
            if (!ncElem) return null;
            const words = ncElem.text.split(/\s+/).filter(Boolean);
            if (words.length <= 1) return null;

            const before = { text: ncElem.text };
            // 元の要素を削除
            elements.splice(v.elementIndex, 1);

            // 各単語を個別 V 要素として挿入
            let insertAt = v.elementIndex;
            const added: string[] = [];
            for (const word of words) {
                const exists = elements.some((e: any) =>
                    e.role === "V" && e.text.toLowerCase() === word.toLowerCase() && e.startIndex >= 0,
                );
                if (exists) continue;

                let bestIdx = -1;
                let bestDist = Infinity;
                let sf = 0;
                while (true) {
                    const idx = sentence.indexOf(word, sf);
                    if (idx === -1) break;
                    const dist = Math.abs(idx - (ncElem.startIndex ?? 0));
                    if (dist < bestDist) { bestDist = dist; bestIdx = idx; }
                    sf = idx + 1;
                }
                if (bestIdx !== -1) {
                    elements.splice(insertAt, 0, {
                        role: "V",
                        text: sentence.slice(bestIdx, bestIdx + word.length),
                        startIndex: bestIdx,
                        endIndex: bestIdx + word.length,
                        expandsTo: null,
                        modifiesIndex: null,
                        arrowType: null,
                    });
                    added.push(word);
                    insertAt++;
                }
            }
            return {
                type: "split_noncontiguous_v",
                clauseId: v.clauseId,
                elementIndex: v.elementIndex,
                before,
                after: { splitInto: added },
                reason: `INV_03: Non-contiguous "${ncElem.text}" split into [${added.join(", ")}]`,
            };
        }

        case "INV_06": {
            // AUX が V 外 → role を V に変更
            if (v.elementIndex == null) return null;
            const elem = elements[v.elementIndex];
            if (!elem) return null;
            const before = { role: elem.role };
            elem.role = "V";
            return {
                type: "reassign_role",
                clauseId: v.clauseId,
                elementIndex: v.elementIndex,
                before,
                after: { role: "V" },
                reason: `INV_06: AUX "${elem.text}" was role=${before.role}`,
            };
        }

        case "INV_09": {
            // charSpan 不一致 → nearest match で再計算
            if (v.elementIndex == null) return null;
            const elem = elements[v.elementIndex];
            if (!elem || !elem.text || elem.startIndex < 0) return null;

            const before = { startIndex: elem.startIndex, endIndex: elem.endIndex };
            let bestIdx = -1;
            let bestDist = Infinity;
            let searchFrom = 0;
            while (true) {
                const idx = sentence.indexOf(elem.text, searchFrom);
                if (idx === -1) break;
                const dist = Math.abs(idx - elem.startIndex);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestIdx = idx;
                }
                searchFrom = idx + 1;
            }
            if (bestIdx !== -1) {
                elem.startIndex = bestIdx;
                elem.endIndex = bestIdx + elem.text.length;
            }
            return {
                type: "fix_charspan",
                clauseId: v.clauseId,
                elementIndex: v.elementIndex,
                before,
                after: { startIndex: elem.startIndex, endIndex: elem.endIndex },
                reason: `INV_09: charSpan recalculated for "${elem.text}"`,
            };
        }

        case "INV_04": {
            // span 重複 → 後方要素の startIndex を前方要素の endIndex に詰める
            if (v.elementIndex == null) return null;
            const elem = elements[v.elementIndex];
            if (!elem) return null;
            const sorted = elements
                .filter((e: any) => e.startIndex >= 0 && e.startIndex < elem.startIndex)
                .sort((a: any, b: any) => b.startIndex - a.startIndex);
            if (sorted.length === 0) return null;
            const prev = sorted[0];
            if (prev.endIndex > elem.startIndex) {
                const before = { startIndex: elem.startIndex };
                elem.startIndex = prev.endIndex;
                return {
                    type: "merge_span",
                    clauseId: v.clauseId,
                    elementIndex: v.elementIndex,
                    before,
                    after: { startIndex: elem.startIndex },
                    reason: `INV_04: Moved startIndex to avoid overlap with "${prev.text}"`,
                };
            }
            return null;
        }

        case "INV_07": {
            // 文型不整合 → パターン再計算
            const stageObj = v.clauseId === "main"
                ? stage1
                : (stage2.subClauses ?? []).find((sc: any) => sc.clauseId === v.clauseId);
            if (!stageObj) return null;
            const before = { sentencePattern: stageObj.sentencePattern };
            applyPatternFix(stageObj);
            return {
                type: "recompute_pattern",
                clauseId: v.clauseId,
                before,
                after: { sentencePattern: stageObj.sentencePattern },
                reason: `INV_07: Pattern recalculated for clause "${v.clauseId}"`,
            };
        }

        case "INV_08": {
            // expandsTo 不整合 → expandsTo を null 化
            if (v.elementIndex == null) return null;
            const elem = elements[v.elementIndex];
            if (!elem) return null;
            const before = { expandsTo: elem.expandsTo };
            elem.expandsTo = null;
            return {
                type: "relink_expandsTo",
                clauseId: v.clauseId,
                elementIndex: v.elementIndex,
                before,
                after: { expandsTo: null },
                reason: `INV_08: Removed orphan expandsTo "${before.expandsTo}"`,
            };
        }

        default:
            return null;
    }
}

/**
 * validate → repair ループ。
 */
export function repairLoop(
    sentence: string,
    stage1: any,
    stage2: any,
    maxIterations: number = 5,
): { report: ValidationReport; log: RepairLog } {
    const log: RepairLog = { actions: [], cascadeCount: 0 };

    for (let i = 0; i < maxIterations; i++) {
        const report = validate(sentence, stage1, stage2);

        // fail-fast チェック (error severity のみ — warning は無視)
        const unrecoverable = report.violations.filter(v => !v.recoverable && v.severity === "error");
        if (unrecoverable.length > 0) {
            console.warn("  [repair] Unrecoverable violations:", unrecoverable.map(v => v.message));
            return { report, log };
        }

        if (report.valid) return { report, log };

        // 最高優先の recoverable error を1つ修復 (warning は skip)
        const sorted = report.violations
            .filter(v => v.severity === "error" && v.recoverable)
            .sort((a, b) => violationPriority(a) - violationPriority(b));
        if (sorted.length === 0) break;
        const target = sorted[0];
        const action = repairOne(target, sentence, stage1, stage2);

        if (action) {
            log.actions.push(action);
            if (i > 0) log.cascadeCount++;
        } else {
            break;
        }
    }

    // 最終文型判定 (repair 後)
    applyPatternFix(stage1);
    for (const sc of stage2.subClauses ?? []) {
        applyPatternFix(sc);
    }

    const finalReport = validate(sentence, stage1, stage2);
    return { report: finalReport, log };
}
