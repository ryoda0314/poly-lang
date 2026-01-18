/**
 * Simple word-level diff utility using Longest Common Subsequence (LCS).
 */

export type DiffType = "equal" | "insert" | "delete";

export interface DiffPart {
    type: DiffType;
    value: string;
}

export function computeDiff(original: string, corrected: string): DiffPart[] {
    // Tokenize by splitting on whitespace but keeping the whitespace attached or separate?
    // For simplicity, let's split by spaces.
    const originalTokens = original.split(/(\s+)/);
    const correctedTokens = corrected.split(/(\s+)/);

    // Filter out empty strings if any
    const tokens1 = originalTokens.filter(t => t.length > 0);
    const tokens2 = correctedTokens.filter(t => t.length > 0);

    const m = tokens1.length;
    const n = tokens2.length;

    // DP table for LCS
    const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (tokens1[i - 1] === tokens2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    // Backtrack to find diff
    const diffs: DiffPart[] = [];
    let i = m;
    let j = n;

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && tokens1[i - 1] === tokens2[j - 1]) {
            diffs.unshift({ type: "equal", value: tokens1[i - 1] });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            diffs.unshift({ type: "insert", value: tokens2[j - 1] });
            j--;
        } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
            diffs.unshift({ type: "delete", value: tokens1[i - 1] });
            i--;
        }
    }

    // Cleanup: Merge adjacent items of same type (optional, but good for rendering spans)
    // Actually for rendering, discrete tokens are fine.

    return diffs;
}
