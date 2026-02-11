import { isAux, getLemma } from "./verb-lexicon";
import type { VChain, VChainResult, PosToken } from "./types";

/** 簡易 tokenizer: 空白と句読点で分割し、charIndex を保持 */
interface SimpleToken {
    text: string;
    lower: string;
    startIndex: number;
    endIndex: number;
    /** POS ベースの追加情報 (posTokens がある場合のみ) */
    isNounByPOS?: boolean;
}

function tokenize(sentence: string): SimpleToken[] {
    const tokens: SimpleToken[] = [];
    const regex = /[a-zA-Z']+|[^\s]/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(sentence)) !== null) {
        tokens.push({
            text: m[0],
            lower: m[0].toLowerCase(),
            startIndex: m.index,
            endIndex: m.index + m[0].length,
        });
    }
    return tokens;
}

/** PosToken[] → SimpleToken[] 変換 (POS情報を保持) */
function posToSimple(posTokens: PosToken[]): SimpleToken[] {
    return posTokens
        .filter(t => t.pos !== "PUNCT" || /^[,;.!?]$/.test(t.text)) // keep structural punctuation for parenthetical detection
        .map(t => ({
            text: t.text,
            lower: t.lower,
            startIndex: t.startIndex,
            endIndex: t.endIndex,
            isNounByPOS: t.pos === "NOUN" || t.pos === "PRON" || t.pos === "DET",
        }));
}

const IRREGULAR_PP = new Set([
    "been", "done", "gone", "seen", "taken", "given", "known",
    "shown", "grown", "drawn", "thrown", "blown", "born", "borne",
    "broken", "chosen", "driven", "eaten", "fallen", "flown",
    "forgotten", "frozen", "gotten", "hidden", "ridden", "risen",
    "spoken", "stolen", "sworn", "torn", "worn", "written",
    "begun", "drunk", "rung", "sung", "sunk", "swum",
    "brought", "bought", "built", "caught", "fed", "felt",
    "found", "had", "heard", "held", "kept", "left", "lent",
    "lost", "made", "meant", "met", "paid", "said", "sent",
    "set", "shot", "shut", "slept", "sold", "sought", "spent",
    "stood", "struck", "taught", "thought", "told", "understood",
    "won", "wound", "bound", "cut", "hit", "hurt", "let",
    "put", "quit", "read", "rid", "split", "spread",
    "come", "become", "overcome", "run",
    "treated", "designed", "acknowledged", "delivered", "watched",
    "codified", "considered", "called", "named",
]);

function isPastParticiple(word: string): boolean {
    const w = word.toLowerCase();
    if (IRREGULAR_PP.has(w)) return true;
    if (/ed$/.test(w)) return true;
    if (/en$/.test(w) && w.length > 3) return true;
    return false;
}

function isPresentParticiple(word: string): boolean {
    return /ing$/i.test(word) && word.length > 4;
}

function isModal(word: string): boolean {
    return /^(can|could|will|would|shall|should|may|might|must)$/i.test(word);
}

/**
 * POS 情報を使ってインバージョンギャップを検出する。
 * AUX の後に名詞 (POS=NOUN/PRON/DET) が来て、その後に動詞が来るパターン。
 */
function hasInversionGap(tokens: SimpleToken[], auxIdx: number): boolean {
    // POS情報がなければ検出不可
    if (!tokens[auxIdx + 1]?.isNounByPOS) return false;

    // AUX の直後に名詞系が1つ以上続く
    let j = auxIdx + 1;
    while (j < tokens.length && tokens[j].isNounByPOS) j++;

    // 名詞系の後に動詞的なトークンがあるか
    if (j < tokens.length) {
        const next = tokens[j];
        return isPastParticiple(next.lower) || isPresentParticiple(next.lower)
            || (!isAux(next.lower) && !/^[,;.!?]$/.test(next.text));
    }
    return false;
}

/**
 * Parenthetical insertion detection.
 * Looks ahead from a comma to find a closing comma followed by a verb-like token.
 * Returns the verb token info if a parenthetical skip is possible.
 *
 * Example: "had, once codified into procedure, come"
 *   At first comma → finds closing comma → "come" (past participle) → skip parenthetical
 */
function trySkipParenthetical(
    tokens: SimpleToken[],
    commaIdx: number,
): { verbToken: SimpleToken; verbIdx: number; parenStart: number; parenEnd: number } | null {
    const MAX_PAREN_LEN = 15; // max tokens inside parenthetical
    const limit = Math.min(commaIdx + MAX_PAREN_LEN, tokens.length);

    for (let k = commaIdx + 1; k < limit; k++) {
        // Sentence boundary before finding closing comma → no parenthetical
        if (/^[.;!?]$/.test(tokens[k].text)) return null;

        if (tokens[k].text === ",") {
            // Found closing comma — check next token
            const nextIdx = k + 1;
            if (nextIdx >= tokens.length) return null;
            const next = tokens[nextIdx];
            if (isPastParticiple(next.lower) || isPresentParticiple(next.lower) || isAux(next.lower)) {
                return {
                    verbToken: next,
                    verbIdx: nextIdx,
                    parenStart: tokens[commaIdx].startIndex,
                    parenEnd: tokens[k].endIndex,
                };
            }
            return null; // Closing comma found but no verb after
        }
    }
    return null;
}

/**
 * V-Chain を検出する。
 *
 * 方針:
 *   1. 全 token を走査し、AUX を見つけたら右方向に chain を伸ばす
 *   2. 間に割り込む ADV は許容する (chain には含めず skip)
 *   3. chain の末尾が main verb (past/present participle or base form) になったら確定
 *   4. POS 情報がある場合、インバージョンギャップを検出してチェーン形成を抑制
 *   5. Parenthetical insertions (comma-delimited) can be skipped to find discontinuous chains
 */
export function resolveVChains(sentence: string, posTokens?: PosToken[]): VChainResult {
    const tokens = posTokens ? posToSimple(posTokens) : tokenize(sentence);
    const chains: VChain[] = [];
    const consumed = new Set<number>();
    const inversions: Array<{ auxWord: string; auxStart: number; auxEnd: number }> = [];

    for (let i = 0; i < tokens.length; i++) {
        if (consumed.has(i)) continue;
        const t = tokens[i];

        if (!isAux(t.lower) && !isModal(t.lower)) continue;

        // POS ベースのインバージョンギャップ検出
        if (t.isNounByPOS !== undefined && hasInversionGap(tokens, i)) {
            inversions.push({ auxWord: t.text, auxStart: t.startIndex, auxEnd: t.endIndex });
            continue;
        }

        const chainTokens: SimpleToken[] = [t];
        const chainIndices: number[] = [i];
        let j = i + 1;
        let foundMainVerb = false;
        let parenSpan: { startIndex: number; endIndex: number; text: string } | undefined;

        while (j < tokens.length) {
            const next = tokens[j];

            // Non-comma punctuation always breaks the chain
            if (/^[;.!?]$/.test(next.text)) break;

            // Comma: try to skip parenthetical insertion (discontinuous V-chain)
            if (next.text === ",") {
                if (!foundMainVerb && chainTokens.length >= 1) {
                    const parenResult = trySkipParenthetical(tokens, j);
                    if (parenResult) {
                        const verbT = parenResult.verbToken;
                        if (isPastParticiple(verbT.lower) || isPresentParticiple(verbT.lower)) {
                            // Parenthetical skipped, verb continues the chain
                            chainTokens.push(verbT);
                            chainIndices.push(parenResult.verbIdx);
                            // Capture parenthetical span text from original sentence
                            const parenTokens = tokens.slice(j, parenResult.verbIdx);
                            parenSpan = {
                                startIndex: parenResult.parenStart,
                                endIndex: parenResult.parenEnd,
                                text: parenTokens.map(pt => pt.text).join(" "),
                            };
                            foundMainVerb = true;
                            break;
                        }
                        if (isAux(verbT.lower)) {
                            // AUX after parenthetical — continue building chain
                            chainTokens.push(verbT);
                            chainIndices.push(parenResult.verbIdx);
                            const parenTokens = tokens.slice(j, parenResult.verbIdx);
                            parenSpan = {
                                startIndex: parenResult.parenStart,
                                endIndex: parenResult.parenEnd,
                                text: parenTokens.map(pt => pt.text).join(" "),
                            };
                            j = parenResult.verbIdx + 1;
                            continue;
                        }
                    }
                }
                break; // Default: comma breaks the chain
            }

            // AUX の連鎖 (have been, could have, etc.)
            if (isAux(next.lower)) {
                chainTokens.push(next);
                chainIndices.push(j);
                j++;
                continue;
            }

            // Past participle → chain に追加して終了
            if (isPastParticiple(next.lower)) {
                chainTokens.push(next);
                chainIndices.push(j);
                foundMainVerb = true;
                break;
            }

            // Present participle → chain に追加して終了
            if (isPresentParticiple(next.lower)) {
                chainTokens.push(next);
                chainIndices.push(j);
                foundMainVerb = true;
                break;
            }

            // ADV の割り込み: 次の token が AUX/VERB なら skip
            if (j + 1 < tokens.length) {
                const afterNext = tokens[j + 1];
                if (isAux(afterNext.lower) || isPastParticiple(afterNext.lower)
                    || isPresentParticiple(afterNext.lower)) {
                    j++;
                    continue;
                }
            }

            // chain 終了
            break;
        }

        // chain が AUX 単独の場合: 次の token が動詞的なら chain にする
        if (!foundMainVerb && chainTokens.length === 1) {
            const nextIdx = i + 1;
            if (nextIdx < tokens.length) {
                const next = tokens[nextIdx];
                // do/did/does + base form
                if (/^(do|does|did)$/i.test(t.lower) && !isAux(next.lower)
                    && !/^[,;.!?]$/.test(next.text)
                    && !isPastParticiple(next.lower)) {
                    chainTokens.push(next);
                    chainIndices.push(nextIdx);
                    foundMainVerb = true;
                }
                // modal + base form
                if (isModal(t.lower) && !isAux(next.lower)
                    && !/^[,;.!?]$/.test(next.text)) {
                    chainTokens.push(next);
                    chainIndices.push(nextIdx);
                    foundMainVerb = true;
                }
            }
        }

        // 2 token 以上の chain のみ採用
        if (chainTokens.length >= 2) {
            for (const idx of chainIndices) consumed.add(idx);

            const lastWord = chainTokens[chainTokens.length - 1].lower;
            const voice = isPastParticiple(lastWord) && chainTokens.some(ct =>
                /^(am|is|are|was|were|be|been|being)$/i.test(ct.lower)
            ) ? "passive" as const : "active" as const;

            const mainVerbToken = chainTokens[chainTokens.length - 1];
            const chain: VChain = {
                text: chainTokens.map(ct => ct.text).join(" "),
                words: chainTokens.map(ct => ct.text),
                startIndex: chainTokens[0].startIndex,
                endIndex: mainVerbToken.endIndex,
                voice,
                tense: inferTense(chainTokens),
                isFinite: true,
                mainVerbLemma: getLemma(mainVerbToken.lower),
            };
            if (parenSpan) {
                chain.parentheticalSpan = parenSpan;
            }
            chains.push(chain);
        }
    }

    const summaryLines = chains.map((c, i) => {
        const base = `  V-chain ${i + 1}: "${c.text}" [${c.startIndex},${c.endIndex}) → single V element (${c.voice}, ${c.tense})`;
        if (c.parentheticalSpan) {
            return `${base}\n    ⚠ DISCONTINUOUS: parenthetical insertion separates the V-chain. Create THREE elements: V:"${c.words[0]}", M:"${c.parentheticalSpan.text}", V:"${c.words[c.words.length - 1]}". Do NOT combine into one V element.`;
        }
        return base;
    });
    const inversionLines = inversions.map(inv =>
        `  INVERSION: "${inv.auxWord}" at [${inv.auxStart},${inv.auxEnd}) is SEPARATED from its main verb by the subject. Create SEPARATE V elements (V1:"${inv.auxWord}", V2:main verb).`
    );

    const parts: string[] = [];
    if (chains.length > 0) {
        parts.push(`Contiguous V-chains (each = one V element):\n${summaryLines.join("\n")}`);
    }
    if (inversions.length > 0) {
        parts.push(`Subject-auxiliary inversions (MUST be separate V elements, NEVER combine):\n${inversionLines.join("\n")}`);
    }
    const promptSummary = parts.join("\n\n");

    return { sentence, chains, promptSummary };
}

function inferTense(tokens: SimpleToken[]): string {
    const words = tokens.map(t => t.lower);
    const hasModal = words.some(w => isModal(w));
    const hasPastBe = words.some(w => /^(was|were)$/.test(w));
    const hasPresentBe = words.some(w => /^(am|is|are)$/.test(w));
    const hasDid = words.includes("did");
    const hasHad = words.includes("had");
    const hasHave = words.some(w => /^(have|has)$/.test(w));
    const hasBe = words.some(w => /^(am|is|are|was|were|be|been|being)$/.test(w));

    if (hasModal) return "modal";
    if (hasHad && !hasBe) return "past_perfect";
    if (hasHave && !hasBe && !hasHad) return "present_perfect";
    if (hasPastBe) return "past";
    if (hasPresentBe) return "present";
    if (hasDid) return "past_emphatic";
    return "simple";
}
