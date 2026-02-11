/**
 * Gap 検出 + 節種別判定。
 * 関係詞節にはギャップ（欠損した文法的役割）があり、
 * 名詞節にはギャップがない — これを利用して節種別を検証する。
 */
import { THAT_COMPLEMENT_VERBS, getLemma, isLinkingVerb, isBridgeVerb, matchesVerbSet } from "./verb-lexicon";
import type { GapInfo, PosToken } from "./types";

/**
 * 節内のギャップを検出する。
 *
 * ギャップ = 節内の SVOC 要素で期待される役割が欠けている状態。
 * - S がない → gapRole="S" (主格関係代名詞が先行詞を指す)
 * - Od がない (他動詞なのに) → gapRole="Od" (目的格関係代名詞)
 * - C がない (リンク動詞なのに) → gapRole="C"
 */
export function detectGap(
    clauseElements: Array<{ role: string; text: string; startIndex: number; endIndex: number }>,
    _tokens: PosToken[],
): GapInfo {
    const roles = new Set(clauseElements.map(e => e.role));
    const hasV = roles.has("V");
    const hasS = roles.has("S");
    const hasOd = roles.has("Od");
    const hasC = roles.has("C");

    // elided 要素 (startIndex=-1) を除外して実在の要素のみチェック
    const realElements = clauseElements.filter(e => e.startIndex >= 0);
    const realRoles = new Set(realElements.map(e => e.role));
    const realHasS = realRoles.has("S");
    const realHasOd = realRoles.has("Od");

    if (!hasV) {
        return { hasGap: false, gapRole: null, confidence: 0.3 };
    }

    // S が elided (存在するが startIndex=-1) → gapRole=S
    if (hasS && !realHasS) {
        return { hasGap: true, gapRole: "S", confidence: 0.9 };
    }

    // S がまったくない → gapRole=S
    if (!hasS) {
        return { hasGap: true, gapRole: "S", confidence: 0.8 };
    }

    // Od が elided → gapRole=Od
    if (hasOd && !realHasOd) {
        return { hasGap: true, gapRole: "Od", confidence: 0.9 };
    }

    // S はあるが Od がない → 他動詞チェック
    // (この段階では動詞の下位範疇化は完全にはわからないので confidence は低め)
    if (!hasOd && !hasC) {
        return { hasGap: true, gapRole: "Od", confidence: 0.5 };
    }

    // ギャップなし
    return { hasGap: false, gapRole: null, confidence: 0.8 };
}

/**
 * 節種別の妥当性を検証する。
 * - relative 節にはギャップがあるべき
 * - noun 節にはギャップがないべき
 */
export function validateClauseType(
    clauseType: string,
    clauseElements: Array<{ role: string; text: string; startIndex: number; endIndex: number }>,
    parentVerb: string | null,
    tokens: PosToken[],
): { valid: boolean; suggestedType?: string; reason?: string } {
    const gap = detectGap(clauseElements, tokens);

    if (clauseType === "relative") {
        if (!gap.hasGap && gap.confidence >= 0.7) {
            // relative なのにギャップがない → noun clause の可能性
            if (parentVerb) {
                if (matchesVerbSet(parentVerb, THAT_COMPLEMENT_VERBS)) {
                    return {
                        valid: false,
                        suggestedType: "noun",
                        reason: `Relative clause has no gap but parent verb "${parentVerb}" takes that-complement`,
                    };
                }
            }
            return {
                valid: false,
                suggestedType: "noun",
                reason: "Relative clause has no gap — likely a noun clause",
            };
        }
        return { valid: true };
    }

    if (clauseType === "noun") {
        if (gap.hasGap && gap.confidence >= 0.7) {
            return {
                valid: false,
                suggestedType: "relative",
                reason: `Noun clause has gap at ${gap.gapRole} — likely a relative clause`,
            };
        }
        return { valid: true };
    }

    return { valid: true };
}

/**
 * What 節における what の文法的役割を推定する。
 * - what + V... → what = S (主語)
 * - what + S + linking V... → what = C (補語)
 * - what + S + transitive V... → what = Od (直接目的語)
 */
export function inferWhatRole(
    clauseElements: Array<{ role: string; text: string }>,
): "S" | "Od" | "C" | null {
    const whatIdx = clauseElements.findIndex(e =>
        e.text.toLowerCase() === "what" || e.text.toLowerCase() === "whatever"
    );
    if (whatIdx < 0) return null;

    const afterWhat = clauseElements.slice(whatIdx + 1);
    const firstAfter = afterWhat[0];

    if (!firstAfter) return "S";

    // what + V → what is Subject
    if (firstAfter.role === "V") return "S";

    // what + S + V → what is Od or C
    if (firstAfter.role === "S") {
        const vElem = afterWhat.find(e => e.role === "V");
        if (vElem) {
            // linking verb → C
            const vWords = vElem.text.toLowerCase().split(/\s+/);
            const lastVWord = vWords[vWords.length - 1] ?? "";
            if (isLinkingVerb(lastVWord)) return "C";
        }
        return "Od";
    }

    return "Od";
}

/**
 * Long-distance extraction detection.
 * When a relative clause's main verb is a bridge verb (claim/think/say/believe/...),
 * the gap may be in the complement clause (not the relative clause itself).
 *
 * Example: "the criteria [it had claimed [__ were designed to protect dissent]]"
 * - sub-1 (relative): S:"it", V:"had claimed", Od→sub-2
 * - sub-2 (complement): S:[gap=criteria], V:"were designed", M:"to protect dissent"
 * - The gap is at S of sub-2, NOT at Od of sub-1
 */
export function detectLongDistanceExtraction(
    relativeClauseElements: Array<{ role: string; text: string; startIndex: number; endIndex: number; expandsTo?: string | null }>,
    allSubClauses: Array<{ clauseId: string; elements: Array<{ role: string; text: string; startIndex: number; endIndex: number }> }>,
    tokens: PosToken[],
): GapInfo {
    // Find V elements of the relative clause
    const vElems = relativeClauseElements.filter(e => e.role === "V" && e.startIndex >= 0);
    if (vElems.length === 0) return { hasGap: false, gapRole: null, confidence: 0.3 };

    // Get the main verb (last V word)
    const allVWords = vElems.flatMap(e => e.text.toLowerCase().split(/\s+/));
    const mainVerb = allVWords[allVWords.length - 1] ?? "";

    // Check if it's a bridge verb
    if (!isBridgeVerb(mainVerb)) return { hasGap: false, gapRole: null, confidence: 0.3 };

    // Find element with expandsTo (the complement clause)
    const expandsToElem = relativeClauseElements.find(e => (e as any).expandsTo);
    if (!expandsToElem) return { hasGap: false, gapRole: null, confidence: 0.4 };

    const complementClause = allSubClauses.find(
        sc => sc.clauseId === (expandsToElem as any).expandsTo,
    );
    if (!complementClause) return { hasGap: false, gapRole: null, confidence: 0.4 };

    // Check for gap in the complement clause
    const complementGap = detectGap(complementClause.elements, tokens);
    if (complementGap.hasGap) {
        return {
            hasGap: true,
            gapRole: complementGap.gapRole,
            confidence: Math.min(complementGap.confidence, 0.85),
            isLongDistance: true,
            bridgeVerb: mainVerb,
            gapClauseId: complementClause.clauseId,
        };
    }

    return { hasGap: false, gapRole: null, confidence: 0.5 };
}

/**
 * Post-process Stage 2 sub-clauses to detect and label long-distance extraction.
 * Updates typeLabel for relative clauses where the gap is through a bridge verb.
 */
export function fixLongDistanceExtractionLabels(
    stage2: any,
    tokens: PosToken[],
): number {
    let fixed = 0;
    const subClauses: any[] = stage2.subClauses ?? [];

    for (const sc of subClauses) {
        if (sc.type !== "relative") continue;

        const gap = detectLongDistanceExtraction(sc.elements ?? [], subClauses, tokens);
        if (gap.isLongDistance && gap.gapRole) {
            const roleLabel = gap.gapRole === "S" ? "主語" : gap.gapRole === "Od" ? "目的語" : "補語";
            sc.typeLabel = `関係詞節（補文内${roleLabel}の取り出し：long-distance extraction via "${gap.bridgeVerb}")`;
            fixed++;
        }
    }

    return fixed;
}
