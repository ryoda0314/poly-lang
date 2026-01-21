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
    // Tokenize logic:
    // If text contains CJK characters, we split by character to ensure granular diffs.
    // Otherwise, we split by whitespace as before.

    const hasCJK = (str: string) => /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/.test(str);

    let tokens1: string[];
    let tokens2: string[];

    // We tokenize each string independently based on its content, 
    // but ideally we should use the same strategy. 
    // If either has CJK, we might want to default to char-based for both to align them?
    // Let's rely on each string's content.

    const tokenize = (text: string) => {
        if (hasCJK(text)) {
            // Split by char, but keep non-CJK sequences (like English words inside Chinese) together?
            // Simple approach: Split everything by boundary check or just separate chars.
            // Regex: Split between characters. 
            // Actually, just .split("") is fine for simple CJK diffs, but might break English words.
            // Better: Split by word boundary or CJK char.

            // Use Intl.Segmenter if available (browsers/node 16+)
            if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
                const segmenter = new Intl.Segmenter("zh-CN", { granularity: "word" });
                return Array.from(segmenter.segment(text)).map(s => s.segment);
            }

            // Fallback: simple char split for CJK, space for others?
            // Let's just do a simple split by empty string to treat every char as token if CJK is present.
            // This might split "apple" into "a","p","p","l","e" which is noisy but safe.
            return text.split("");
        } else {
            return text.split(/(\s+)/).filter(t => t.length > 0);
        }
    };

    tokens1 = tokenize(original);
    tokens2 = tokenize(corrected);

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
