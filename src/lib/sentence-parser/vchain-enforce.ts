/**
 * V-Chain 強制適用。
 * LLM が非連続テキスト (e.g. "did acknowledge" when sentence has "did the committee acknowledge")
 * を V 要素として返した場合に分割する。
 * fixElementIndices の後、validate の前に実行する。
 */
import type { VChainResult } from "./types";

/**
 * V 要素の整合性を強制する。
 * 1. 非連続テキストの V を分割
 * 2. 同位置の V 重複を除去
 * 3. V-chain 内の単語が V 以外のロールなら補正
 */
export function enforceVChains(
    sentence: string,
    elements: any[],
    vchainResult?: VChainResult,
): { fixed: number } {
    let fixed = 0;
    fixed += splitNonContiguousElements(sentence, elements);
    fixed += deduplicateElements(sentence, elements);
    if (vchainResult) {
        fixed += enforceChainRoles(elements, vchainResult);
    }
    return { fixed };
}

/**
 * 非連続テキスト要素を分割する。
 * element.text が原文に連続部分文字列として見つからない場合、
 * 個別単語に分割して別々の要素にする。V 要素のみ対象。
 */
function splitNonContiguousElements(sentence: string, elements: any[]): number {
    let fixed = 0;

    for (let i = elements.length - 1; i >= 0; i--) {
        const elem = elements[i];
        if (elem.role !== "V" || elem.startIndex < 0) continue;

        // テキストが原文に連続部分文字列として存在するか
        if (sentence.indexOf(elem.text) !== -1) continue;

        // 非連続テキスト: 個別単語に分割
        const words = elem.text.split(/\s+/).filter(Boolean);
        if (words.length <= 1) continue;

        // 元の要素を削除
        elements.splice(i, 1);
        fixed++;

        // 各単語を個別の V 要素として挿入 (既存に同じものがなければ)
        let insertAt = i;
        for (const word of words) {
            const alreadyExists = elements.some(e =>
                e.role === "V"
                && e.text.toLowerCase() === word.toLowerCase()
                && e.startIndex >= 0,
            );
            if (alreadyExists) continue;

            // 原文から最寄りの位置を探す
            const bestIdx = findNearest(sentence, word, elem.startIndex);
            if (bestIdx === -1) continue;

            elements.splice(insertAt, 0, {
                role: "V",
                text: sentence.slice(bestIdx, bestIdx + word.length),
                startIndex: bestIdx,
                endIndex: bestIdx + word.length,
                expandsTo: null,
                modifiesIndex: null,
                arrowType: null,
            });
            insertAt++;
        }
    }

    return fixed;
}

/**
 * 同一テキスト・同一位置の要素を重複除去する。
 */
function deduplicateElements(sentence: string, elements: any[]): number {
    let fixed = 0;

    for (let i = elements.length - 1; i > 0; i--) {
        const a = elements[i];
        if (a.startIndex < 0) continue;

        for (let j = 0; j < i; j++) {
            const b = elements[j];
            if (b.startIndex < 0) continue;

            // 同一テキスト + 同一位置 → 後方を削除
            if (a.text === b.text && a.startIndex === b.startIndex && a.role === b.role) {
                elements.splice(i, 1);
                fixed++;
                break;
            }

            // 一方が他方の部分集合 (同じ role, 位置が重なる)
            // e.g. V:"did acknowledge" [7,36) と V:"acknowledge" [25,36)
            if (a.role === b.role && a.role === "V") {
                const aContainsB = a.startIndex <= b.startIndex && a.endIndex >= b.endIndex
                    && a.text.includes(b.text) && a.text !== b.text;
                const bContainsA = b.startIndex <= a.startIndex && b.endIndex >= a.endIndex
                    && b.text.includes(a.text) && b.text !== a.text;

                if (aContainsB || bContainsA) {
                    // 大きい方が非連続なら削除
                    const larger = aContainsB ? a : b;
                    const largerIdx = aContainsB ? i : j;
                    if (sentence.indexOf(larger.text) === -1) {
                        elements.splice(largerIdx, 1);
                        fixed++;
                        if (largerIdx < i) i--; // adjust if we removed before current
                        break;
                    }
                }
            }
        }
    }

    return fixed;
}

/**
 * V-chain 内の単語が V 以外のロールで LLM に分類された場合に補正する。
 */
function enforceChainRoles(elements: any[], vchainResult: VChainResult): number {
    let fixed = 0;

    for (const chain of vchainResult.chains) {
        for (const word of chain.words) {
            const wordLower = word.toLowerCase();
            for (const elem of elements) {
                if (elem.startIndex < 0) continue;
                if (elem.text.trim().toLowerCase() !== wordLower) continue;
                if (elem.startIndex < chain.startIndex || elem.endIndex > chain.endIndex) continue;
                if (elem.role === "V") continue;

                elem.role = "V";
                fixed++;
            }
        }
    }

    return fixed;
}

/**
 * Mark parenthetical insertion elements.
 * When a VChain has a parentheticalSpan, find the two V elements and mark
 * the first V with arrowType "insertion" pointing to the second V.
 * This enables the UI to draw a bracket arc connecting the discontinuous V-chain.
 */
export function markParentheticalInsertions(
    elements: any[],
    vchainResult: VChainResult,
): number {
    let marked = 0;

    for (const chain of vchainResult.chains) {
        if (!chain.parentheticalSpan || chain.words.length < 2) continue;

        const v1Word = chain.words[0].toLowerCase();
        const v2Word = chain.words[chain.words.length - 1].toLowerCase();

        let v1Idx = -1;
        let v2Idx = -1;

        for (let i = 0; i < elements.length; i++) {
            const e = elements[i];
            if (e.role !== "V" || e.startIndex < 0) continue;
            if (e.text.toLowerCase() === v1Word && v1Idx === -1) v1Idx = i;
            if (e.text.toLowerCase() === v2Word && i > v1Idx && v1Idx >= 0 && v2Idx === -1) v2Idx = i;
        }

        if (v1Idx >= 0 && v2Idx >= 0) {
            elements[v1Idx].arrowType = "insertion";
            elements[v1Idx].modifiesIndex = v2Idx;
            // Reclassify M elements between V1 and V2 as Insert
            for (let k = v1Idx + 1; k < v2Idx; k++) {
                if (elements[k].role === "M") {
                    elements[k].role = "Insert";
                }
            }
            marked++;
        }
    }

    // Second pass: catch bare adverbs between V elements even without parentheticalSpan.
    // Use sentence position (startIndex), not array order — LLM may output elements out of order.
    // e.g., "had once claimed" → V:"had", M:"once", V:"claimed" → M→Insert
    for (let i = 0; i < elements.length; i++) {
        const m = elements[i];
        if (m.role !== "M" || m.startIndex == null || m.startIndex < 0) continue;
        // V ending right before M (within 2 chars for whitespace)
        const vBefore = elements.some(e =>
            e.role === "V" && e.endIndex != null && e.startIndex >= 0
            && m.startIndex - e.endIndex >= 0 && m.startIndex - e.endIndex <= 2,
        );
        // V starting right after M (within 2 chars for whitespace)
        const vAfter = elements.some(e =>
            e.role === "V" && e.startIndex != null && e.startIndex >= 0
            && e.startIndex - m.endIndex >= 0 && e.startIndex - m.endIndex <= 2,
        );
        if (vBefore && vAfter) {
            m.role = "Insert";
            marked++;
        }
    }

    return marked;
}

/**
 * Stamp vChainId on V (and adjacent Comp) elements that belong to the same V-chain.
 * This enables the UI to visually group e.g. "had … come" + "to exclude" as one predicate.
 */
export function stampVChainIds(
    elements: any[],
    vchainResult: VChainResult,
): number {
    let stamped = 0;

    for (let ci = 0; ci < vchainResult.chains.length; ci++) {
        const chain = vchainResult.chains[ci];
        const vcId = `vc-${ci}`;
        let lastVIdx = -1;

        // Find V elements whose text matches a chain word and falls within chain span
        for (const word of chain.words) {
            const wordLower = word.toLowerCase();
            for (let i = 0; i < elements.length; i++) {
                const elem = elements[i];
                if (elem.role !== "V" || elem.startIndex < 0) continue;
                if (elem.text.trim().toLowerCase() !== wordLower) continue;
                // Must overlap with chain span
                if (elem.startIndex < chain.startIndex || elem.endIndex > chain.endIndex + (chain.parentheticalSpan ? 200 : 0)) continue;
                elem.vChainId = vcId;
                if (i > lastVIdx) lastVIdx = i;
                stamped++;
            }
        }

        // If a Comp element immediately follows the last V in the chain, include it
        if (lastVIdx >= 0 && lastVIdx + 1 < elements.length) {
            const next = elements[lastVIdx + 1];
            if (next.role === "Comp") {
                next.vChainId = vcId;
                stamped++;
            }
        }
    }

    return stamped;
}

/**
 * sentence 内で target 文字列の出現位置のうち、hint に最も近いものを返す。
 */
function findNearest(sentence: string, target: string, hint: number): number {
    let bestIdx = -1;
    let bestDist = Infinity;
    let searchFrom = 0;

    while (true) {
        const idx = sentence.indexOf(target, searchFrom);
        if (idx === -1) break;
        const dist = Math.abs(idx - hint);
        if (dist < bestDist) {
            bestDist = dist;
            bestIdx = idx;
        }
        searchFrom = idx + 1;
    }

    return bestIdx;
}
