/**
 * LLM が返した startIndex/endIndex を原文から再計算する。
 * nearest-match 方式。
 */
export function fixElementIndices(sentence: string, elements: any[]): void {
    const sorted = [...elements].sort((a, b) => (a.startIndex ?? 0) - (b.startIndex ?? 0));
    for (const elem of sorted) {
        if (!elem.text || elem.startIndex < 0) continue;
        const expected = sentence.slice(elem.startIndex, elem.endIndex);
        if (expected === elem.text) continue;

        const originalStart = elem.startIndex;
        let bestIdx = -1;
        let bestDist = Infinity;
        let searchFrom = 0;
        while (true) {
            const idx = sentence.indexOf(elem.text, searchFrom);
            if (idx === -1) break;
            const dist = Math.abs(idx - originalStart);
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
    }
}

/** Normalize bare "O" → "Od", and LLM full-name variants → abbreviated form */
export function normalizeRoles(elements: any[]): void {
    for (const elem of elements) {
        if (elem.role === "O") elem.role = "Od";
        if (elem.role === "Complement") elem.role = "Comp";
        if (elem.role === "Insertion" || elem.role === "Parenthetical") elem.role = "Insert";
        if (elem.role === "Complementizer") elem.role = "Compz";
    }
}
