/**
 * Regression tests for sentence-analysis pipeline helpers.
 *
 * Tests the new lib/sentence-parser modules directly.
 *
 * Run: npx tsx --test src/actions/__tests__/sentence-analysis-helpers.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { resolveVChains } from "../../lib/sentence-parser/vchain";
import { determineSentencePattern, applyPatternFix } from "../../lib/sentence-parser/sentence-pattern";
import { validateClause, validate } from "../../lib/sentence-parser/invariants";
import { repairLoop } from "../../lib/sentence-parser/repair";
import { fixElementIndices, normalizeRoles } from "../../lib/sentence-parser/fix-indices";
import { isAux, isLinkingVerb, getLemma } from "../../lib/sentence-parser/verb-lexicon";
import { tokenizeWithPOS } from "../../lib/sentence-parser/tokenizer";
import { classifyToInfinitive } from "../../lib/sentence-parser/to-inf-classifier";
import { detectGap, validateClauseType, inferWhatRole, detectLongDistanceExtraction, fixLongDistanceExtractionLabels } from "../../lib/sentence-parser/gap-detector";
import { runSyntaxTests } from "../../lib/sentence-parser/syntax-tests";
import { enforceVChains, markParentheticalInsertions, stampVChainIds } from "../../lib/sentence-parser/vchain-enforce";
import { isBridgeVerb, matchesVerbSet, BRIDGE_VERBS, THAT_COMPLEMENT_VERBS } from "../../lib/sentence-parser/verb-lexicon";

// ── verb-lexicon ──

describe("verb-lexicon", () => {
    it("identifies auxiliaries", () => {
        assert.ok(isAux("had"));
        assert.ok(isAux("Was"));
        assert.ok(isAux("COULD"));
        assert.ok(!isAux("gave"));
        assert.ok(!isAux("run"));
    });

    it("identifies linking verbs", () => {
        assert.ok(isLinkingVerb("was"));
        assert.ok(isLinkingVerb("seemed"));
        assert.ok(isLinkingVerb("became"));
        assert.ok(!isLinkingVerb("gave"));
    });

    it("gets lemma for inflected forms", () => {
        assert.strictEqual(getLemma("was"), "be");
        assert.strictEqual(getLemma("became"), "become");
        assert.strictEqual(getLemma("felt"), "feel");
        assert.strictEqual(getLemma("run"), "run"); // already base
    });
});

// ── vchain ──

describe("resolveVChains", () => {
    it("detects 'had come' as active past_perfect", () => {
        const result = resolveVChains("She had come to see him");
        assert.ok(result.chains.length >= 1);
        const chain = result.chains.find(c => c.text.includes("had come"));
        assert.ok(chain, "should find 'had come' chain");
        assert.strictEqual(chain!.voice, "active");
        assert.strictEqual(chain!.tense, "past_perfect");
    });

    it("detects 'was treated' as passive", () => {
        const result = resolveVChains("He was treated unfairly");
        assert.strictEqual(result.chains.length, 1);
        assert.strictEqual(result.chains[0].text, "was treated");
        assert.strictEqual(result.chains[0].voice, "passive");
    });

    it("detects contiguous 'did acknowledge' as active", () => {
        // Contiguous: did + acknowledge (no inversion gap)
        const result = resolveVChains("She did acknowledge the problem");
        const chain = result.chains.find(c => c.text === "did acknowledge");
        assert.ok(chain, "should find contiguous 'did acknowledge'");
        assert.strictEqual(chain!.voice, "active");
    });

    it("does NOT chain 'did...acknowledge' across inversion gap", () => {
        // "Rarely did the committee acknowledge" — did and acknowledge are split by subject
        const result = resolveVChains("Rarely did the committee acknowledge");
        const chain = result.chains.find(c => c.text === "did acknowledge");
        assert.strictEqual(chain, undefined, "should NOT form chain across inversion gap");
    });

    it("does not create chain for 'She made him run' (make is not AUX)", () => {
        const result = resolveVChains("She made him run");
        // "made" is not in AUX_VERBS, so no chain starting with "made"
        const madeChain = result.chains.find(c => c.words[0]?.toLowerCase() === "made");
        assert.strictEqual(madeChain, undefined);
    });

    it("generates non-empty promptSummary when chains exist", () => {
        const result = resolveVChains("She had been watching");
        assert.ok(result.promptSummary.length > 0);
        assert.ok(result.promptSummary.includes("V-chain"));
    });

    it("generates empty promptSummary when no chains", () => {
        const result = resolveVChains("She ran quickly");
        assert.strictEqual(result.promptSummary, "");
    });
});

// ── sentence-pattern ──

describe("determineSentencePattern", () => {
    it("linking verb + C → SVC (pattern 2)", () => {
        const result = determineSentencePattern([
            { role: "S", text: "She" },
            { role: "V", text: "was" },
            { role: "C", text: "happy" },
        ]);
        assert.strictEqual(result.pattern, 2);
        assert.strictEqual(result.odToCIndex, null);
    });

    it("linking verb + Od with copular adj → converts Od→C, pattern 2", () => {
        const result = determineSentencePattern([
            { role: "S", text: "She" },
            { role: "V", text: "was" },
            { role: "Od", text: "likely to succeed" },
        ]);
        assert.strictEqual(result.pattern, 2);
        assert.strictEqual(result.odToCIndex, 2);
    });

    it("ditransitive + Oi + Od → SVOO (pattern 4)", () => {
        const result = determineSentencePattern([
            { role: "S", text: "She" },
            { role: "V", text: "gave" },
            { role: "Oi", text: "him" },
            { role: "Od", text: "a book" },
        ]);
        assert.strictEqual(result.pattern, 4);
    });

    it("complex transitive + Od + C → SVOC (pattern 5)", () => {
        const result = determineSentencePattern([
            { role: "S", text: "They" },
            { role: "V", text: "made" },
            { role: "Od", text: "him" },
            { role: "C", text: "president" },
        ]);
        assert.strictEqual(result.pattern, 5);
    });

    it("regular verb + Od → SVO (pattern 3)", () => {
        const result = determineSentencePattern([
            { role: "S", text: "She" },
            { role: "V", text: "acknowledged" },
            { role: "Od", text: "the problem" },
        ]);
        assert.strictEqual(result.pattern, 3);
    });

    it("intransitive → SV (pattern 1)", () => {
        const result = determineSentencePattern([
            { role: "S", text: "She" },
            { role: "V", text: "arrived" },
        ]);
        assert.strictEqual(result.pattern, 1);
    });
});

describe("applyPatternFix", () => {
    it("mutates stage in-place with pattern and label", () => {
        const stage = {
            elements: [
                { text: "She", role: "S" },
                { text: "gave", role: "V" },
                { text: "him", role: "Oi" },
                { text: "a book", role: "Od" },
            ],
        } as any;
        applyPatternFix(stage);
        assert.strictEqual(stage.sentencePattern, 4);
        assert.ok(stage.sentencePatternLabel.includes("SVOO"));
    });

    it("performs Od→C relabel for copular pattern", () => {
        const stage = {
            elements: [
                { text: "She", role: "S", startIndex: 0, endIndex: 3 },
                { text: "was", role: "V", startIndex: 4, endIndex: 7 },
                { text: "likely to succeed", role: "Od", startIndex: 8, endIndex: 25, arrowType: null },
            ],
        } as any;
        applyPatternFix(stage);
        assert.strictEqual(stage.elements[2].role, "C");
        assert.strictEqual(stage.elements[2].arrowType, "complement");
        // text and span NOT mutated
        assert.strictEqual(stage.elements[2].text, "likely to succeed");
        assert.strictEqual(stage.elements[2].startIndex, 8);
        assert.strictEqual(stage.sentencePattern, 2);
    });
});

// ── invariants ──

describe("validateClause", () => {
    it("detects AUX classified as M (INV_06)", () => {
        const violations = validateClause("main", [
            { role: "M", text: "Rarely", startIndex: 0, endIndex: 6 },
            { role: "M", text: "did", startIndex: 7, endIndex: 10 },
            { role: "S", text: "the committee", startIndex: 11, endIndex: 24 },
            { role: "V", text: "acknowledge", startIndex: 25, endIndex: 36 },
        ], "Rarely did the committee acknowledge that", true);

        const inv06 = violations.filter(v => v.invariantId === "INV_06");
        assert.ok(inv06.length > 0, "should detect 'did' as AUX in M role");
        assert.strictEqual(inv06[0].elementIndex, 1);
    });

    it("detects missing V (INV_01)", () => {
        const violations = validateClause("sub-1", [
            { role: "S", text: "he", startIndex: 0, endIndex: 2 },
            { role: "M", text: "quickly", startIndex: 3, endIndex: 10 },
        ], "he quickly", false);

        assert.ok(violations.some(v => v.invariantId === "INV_01"));
    });

    it("detects charSpan mismatch (INV_09)", () => {
        const violations = validateClause("main", [
            { role: "S", text: "She", startIndex: 0, endIndex: 5 }, // wrong endIndex
            { role: "V", text: "ran", startIndex: 6, endIndex: 9 },
        ], "She ran fast", true);

        assert.ok(violations.some(v => v.invariantId === "INV_09"));
    });

    it("passes for correct clause", () => {
        const violations = validateClause("main", [
            { role: "S", text: "She", startIndex: 0, endIndex: 3 },
            { role: "V", text: "ran", startIndex: 4, endIndex: 7 },
        ], "She ran", true);

        assert.strictEqual(violations.length, 0);
    });
});

// ── repair ──

describe("repairLoop", () => {
    it("repairs AUX as M → V (INV_06)", () => {
        const sentence = "Rarely did the committee acknowledge that";
        const stage1 = {
            elements: [
                { role: "M", text: "Rarely", startIndex: 0, endIndex: 6 },
                { role: "M", text: "did", startIndex: 7, endIndex: 10 },
                { role: "S", text: "the committee", startIndex: 11, endIndex: 24 },
                { role: "V", text: "acknowledge", startIndex: 25, endIndex: 36 },
                { role: "Od", text: "that", startIndex: 37, endIndex: 41 },
            ],
        };
        const stage2 = { subClauses: [] };

        const { log } = repairLoop(sentence, stage1, stage2);
        assert.strictEqual(stage1.elements[1].role, "V"); // "did" repaired to V
        assert.ok(log.actions.length > 0);
    });

    it("repairs charSpan mismatch (INV_09)", () => {
        const sentence = "She ran fast";
        const stage1 = {
            elements: [
                { role: "S", text: "She", startIndex: 0, endIndex: 5 }, // wrong endIndex
                { role: "V", text: "ran", startIndex: 6, endIndex: 9 },
            ],
        };
        const stage2 = { subClauses: [] };

        repairLoop(sentence, stage1, stage2);
        assert.strictEqual(stage1.elements[0].startIndex, 0);
        assert.strictEqual(stage1.elements[0].endIndex, 3); // repaired
    });
});

// ── fixElementIndices ──

describe("fixElementIndices — nearest match", () => {
    it("picks nearest occurrence when multiple exist", () => {
        const sentence = "the cat sat on the mat";
        const elems = [{ text: "the", startIndex: 15, endIndex: 18 }];
        fixElementIndices(sentence, elems);
        assert.strictEqual(elems[0].startIndex, 15);
    });

    it("fixes wrong index to nearest", () => {
        const sentence = "She gave him a book that she had bought yesterday";
        const elems = [{ text: "she", startIndex: 0, endIndex: 3 }];
        fixElementIndices(sentence, elems);
        assert.strictEqual(elems[0].startIndex, 25);
    });
});

describe("normalizeRoles", () => {
    it("converts bare O to Od", () => {
        const elems = [{ role: "O", text: "a book" }, { role: "S", text: "She" }];
        normalizeRoles(elems);
        assert.strictEqual(elems[0].role, "Od");
        assert.strictEqual(elems[1].role, "S");
    });
});

// ── Regression tests ──

describe("Regression: a book that she had bought", () => {
    it("correct roles and pattern for explicit relative pronoun", () => {
        const subClause = {
            elements: [
                { text: "that", role: "Od", startIndex: 16, endIndex: 20 },
                { text: "she", role: "S", startIndex: 21, endIndex: 24 },
                { text: "had bought", role: "V", startIndex: 25, endIndex: 35 },
            ],
        } as any;
        applyPatternFix(subClause);
        assert.strictEqual(subClause.sentencePattern, 3); // SVO
        assert.ok(!subClause.elements.some((e: any) => e.startIndex === -1));
    });
});

describe("Regression: the man standing there", () => {
    it("reduced relative clause validates correctly", () => {
        const subClause = {
            elements: [
                { text: "(who)", role: "S", startIndex: -1, endIndex: -1 },
                { text: "(is)", role: "V", startIndex: -1, endIndex: -1 },
                { text: "standing there", role: "C", startIndex: 8, endIndex: 22 },
            ],
        } as any;
        const violations = validateClause("sub-1", subClause.elements, "the man standing there", false);
        assert.strictEqual(violations.length, 0);
        applyPatternFix(subClause);
        assert.strictEqual(subClause.sentencePattern, 2); // SVC
    });
});

describe("Regression: Rarely did the committee acknowledge", () => {
    it("detects 'were designed' V-chain (contiguous)", () => {
        const sentence = "Rarely did the committee acknowledge that the criteria were designed";
        const vchains = resolveVChains(sentence);

        // "were designed" is contiguous → should be a V-chain
        const wereDesigned = vchains.chains.find(c => c.text === "were designed");
        assert.ok(wereDesigned, "should find 'were designed' V-chain");
        assert.strictEqual(wereDesigned!.voice, "passive");
    });

    it("'did...acknowledge' split by inversion → separate V elements, repaired by validator", () => {
        const sentence = "Rarely did the committee acknowledge that";
        // Simulate LLM output where "did" is wrongly M
        const stage1 = {
            elements: [
                { role: "M", text: "Rarely", startIndex: 0, endIndex: 6 },
                { role: "M", text: "did", startIndex: 7, endIndex: 10 },
                { role: "S", text: "the committee", startIndex: 11, endIndex: 24 },
                { role: "V", text: "acknowledge", startIndex: 25, endIndex: 36 },
                { role: "Od", text: "that", startIndex: 37, endIndex: 41 },
            ],
        };
        const stage2 = { subClauses: [] };

        const { log } = repairLoop(sentence, stage1, stage2);
        // "did" should be repaired M→V
        assert.strictEqual(stage1.elements[1].role, "V");
        assert.ok(log.actions.some(a => a.reason.includes("INV_06")));
    });
});

// ══════════════════════════════════════════════════════════════
// NEW TESTS: Phase 2 — Tokenizer, To-Inf, Gap, Syntax Tests
// ══════════════════════════════════════════════════════════════

// ── tokenizer ──

describe("tokenizeWithPOS", () => {
    it("tokenizes simple sentence with correct POS", () => {
        const tokens = tokenizeWithPOS("She ran quickly");
        assert.ok(tokens.length >= 3);
        const she = tokens.find(t => t.text === "She");
        assert.ok(she);
        assert.strictEqual(she!.pos, "PRON");
    });

    it("tags auxiliary verbs as AUX", () => {
        const tokens = tokenizeWithPOS("She had been watching");
        const had = tokens.find(t => t.lower === "had");
        const been = tokens.find(t => t.lower === "been");
        assert.ok(had);
        assert.ok(been);
        assert.strictEqual(had!.pos, "AUX");
        assert.strictEqual(been!.pos, "AUX");
    });

    it("tags 'did' as AUX (dictionary override)", () => {
        const tokens = tokenizeWithPOS("Rarely did the committee acknowledge");
        const did = tokens.find(t => t.lower === "did");
        assert.ok(did);
        assert.strictEqual(did!.pos, "AUX");
    });

    it("provides correct startIndex and endIndex", () => {
        const tokens = tokenizeWithPOS("The cat sat");
        const cat = tokens.find(t => t.text === "cat");
        assert.ok(cat);
        assert.strictEqual(cat!.startIndex, 4);
        assert.strictEqual(cat!.endIndex, 7);
    });

    it("tags adjectives correctly", () => {
        const tokens = tokenizeWithPOS("She is happy");
        const happy = tokens.find(t => t.lower === "happy");
        assert.ok(happy);
        assert.strictEqual(happy!.pos, "ADJ");
    });

    it("tags adverbs correctly", () => {
        const tokens = tokenizeWithPOS("She ran carefully");
        const carefully = tokens.find(t => t.lower === "carefully");
        assert.ok(carefully);
        assert.strictEqual(carefully!.pos, "ADV");
    });

    it("tags determiners", () => {
        const tokens = tokenizeWithPOS("The cat sat on the mat");
        const theTokens = tokens.filter(t => t.lower === "the");
        assert.ok(theTokens.length >= 2);
        for (const t of theTokens) {
            assert.strictEqual(t.pos, "DET");
        }
    });

    it("produces lemma for verbs", () => {
        const tokens = tokenizeWithPOS("She was running");
        const was = tokens.find(t => t.lower === "was");
        assert.ok(was);
        assert.strictEqual(was!.lemma, "be");
    });
});

// ── resolveVChains with POS ──

describe("resolveVChains with PosTokens", () => {
    it("detects 'had come' with POS tokens", () => {
        const tokens = tokenizeWithPOS("She had come to see him");
        const result = resolveVChains("She had come to see him", tokens);
        const chain = result.chains.find(c => c.text.includes("had come"));
        assert.ok(chain, "should find 'had come' chain with POS");
        assert.strictEqual(chain!.voice, "active");
    });

    it("detects passive 'was treated' with POS tokens", () => {
        const tokens = tokenizeWithPOS("He was treated unfairly");
        const result = resolveVChains("He was treated unfairly", tokens);
        assert.strictEqual(result.chains.length, 1);
        assert.strictEqual(result.chains[0].voice, "passive");
    });

    it("POS-enhanced inversion detection: 'did' + noun → no chain", () => {
        const tokens = tokenizeWithPOS("Rarely did the committee acknowledge");
        const result = resolveVChains("Rarely did the committee acknowledge", tokens);
        const chain = result.chains.find(c => c.text === "did acknowledge");
        assert.strictEqual(chain, undefined, "POS should detect inversion gap");
    });
});

// ── to-inf-classifier ──

describe("classifyToInfinitive", () => {
    it("classifies 'to see him' after main verb as purpose", () => {
        const elements = [
            { role: "S", text: "She", startIndex: 0, endIndex: 3 },
            { role: "V", text: "came", startIndex: 4, endIndex: 8 },
            { role: "M", text: "to see him", startIndex: 9, endIndex: 19 },
        ];
        const tokens = tokenizeWithPOS("She came to see him");
        const result = classifyToInfinitive(2, elements, tokens);
        assert.strictEqual(result, "purpose");
    });

    it("classifies 'to go' after want as object", () => {
        const elements = [
            { role: "S", text: "She", startIndex: 0, endIndex: 3 },
            { role: "V", text: "wants", startIndex: 4, endIndex: 9 },
            { role: "Od", text: "to go", startIndex: 10, endIndex: 15 },
        ];
        const tokens = tokenizeWithPOS("She wants to go");
        const result = classifyToInfinitive(2, elements, tokens);
        assert.strictEqual(result, "object");
    });

    it("classifies 'to be happy' after seem as complement", () => {
        const elements = [
            { role: "S", text: "She", startIndex: 0, endIndex: 3 },
            { role: "V", text: "seems", startIndex: 4, endIndex: 9 },
            { role: "C", text: "to be happy", startIndex: 10, endIndex: 21 },
        ];
        const tokens = tokenizeWithPOS("She seems to be happy");
        const result = classifyToInfinitive(2, elements, tokens);
        assert.strictEqual(result, "complement");
    });

    it("classifies subject position to-inf as subject", () => {
        const elements = [
            { role: "S", text: "to succeed", startIndex: 0, endIndex: 10 },
            { role: "V", text: "is", startIndex: 11, endIndex: 13 },
            { role: "C", text: "important", startIndex: 14, endIndex: 23 },
        ];
        const tokens = tokenizeWithPOS("to succeed is important");
        const result = classifyToInfinitive(0, elements, tokens);
        assert.strictEqual(result, "subject");
    });

    it("classifies 'to solve' after noun as noun_modifier", () => {
        const elements = [
            { role: "S", text: "a way", startIndex: 0, endIndex: 5 },
            { role: "M", text: "to solve it", startIndex: 6, endIndex: 17 },
            { role: "V", text: "exists", startIndex: 18, endIndex: 24 },
        ];
        const tokens = tokenizeWithPOS("a way to solve it exists");
        const result = classifyToInfinitive(1, elements, tokens);
        assert.strictEqual(result, "noun_modifier");
    });
});

// ── gap-detector ──

describe("detectGap", () => {
    it("detects gap at S when subject is elided", () => {
        const elements = [
            { role: "S", text: "(who)", startIndex: -1, endIndex: -1 },
            { role: "V", text: "lives", startIndex: 10, endIndex: 15 },
            { role: "M", text: "here", startIndex: 16, endIndex: 20 },
        ];
        const tokens = tokenizeWithPOS("the man who lives here");
        const gap = detectGap(elements, tokens);
        assert.ok(gap.hasGap);
        assert.strictEqual(gap.gapRole, "S");
    });

    it("detects no gap when all elements are present", () => {
        const elements = [
            { role: "S", text: "she", startIndex: 5, endIndex: 8 },
            { role: "V", text: "had bought", startIndex: 9, endIndex: 19 },
            { role: "Od", text: "that", startIndex: 0, endIndex: 4 },
        ];
        const tokens = tokenizeWithPOS("that she had bought");
        const gap = detectGap(elements, tokens);
        assert.ok(!gap.hasGap || gap.confidence < 0.7);
    });

    it("detects gap at Od when object-case relative", () => {
        const elements = [
            { role: "Od", text: "(that)", startIndex: -1, endIndex: -1 },
            { role: "S", text: "she", startIndex: 10, endIndex: 13 },
            { role: "V", text: "bought", startIndex: 14, endIndex: 20 },
        ];
        const tokens = tokenizeWithPOS("the book she bought");
        const gap = detectGap(elements, tokens);
        assert.ok(gap.hasGap);
        assert.strictEqual(gap.gapRole, "Od");
    });
});

describe("validateClauseType", () => {
    it("validates relative clause with gap", () => {
        const elements = [
            { role: "S", text: "(who)", startIndex: -1, endIndex: -1 },
            { role: "V", text: "is", startIndex: 10, endIndex: 12 },
            { role: "C", text: "standing there", startIndex: 13, endIndex: 27 },
        ];
        const tokens = tokenizeWithPOS("the man standing there");
        const result = validateClauseType("relative", elements, null, tokens);
        assert.ok(result.valid);
    });

    it("flags relative clause without gap (may be noun clause)", () => {
        const elements = [
            { role: "S", text: "he", startIndex: 10, endIndex: 12 },
            { role: "V", text: "is", startIndex: 13, endIndex: 15 },
            { role: "C", text: "right", startIndex: 16, endIndex: 21 },
        ];
        const tokens = tokenizeWithPOS("I know he is right");
        const result = validateClauseType("relative", elements, "know", tokens);
        assert.ok(!result.valid);
        assert.strictEqual(result.suggestedType, "noun");
    });
});

describe("inferWhatRole", () => {
    it("what + V → what = S", () => {
        const elements = [
            { role: "S", text: "what", },
            { role: "V", text: "happened", },
        ];
        const result = inferWhatRole(elements);
        assert.strictEqual(result, "S");
    });

    it("what + S + transitive V → what = Od", () => {
        const elements = [
            { role: "Od", text: "what", },
            { role: "S", text: "she", },
            { role: "V", text: "bought", },
        ];
        const result = inferWhatRole(elements);
        assert.strictEqual(result, "Od");
    });

    it("what + S + linking V → what = C", () => {
        const elements = [
            { role: "C", text: "what", },
            { role: "S", text: "he", },
            { role: "V", text: "was", },
        ];
        const result = inferWhatRole(elements);
        assert.strictEqual(result, "C");
    });
});

// ── new invariants ──

describe("INV_14: M has target", () => {
    it("warns when M has no modifiesIndex", () => {
        const violations = validateClause("main", [
            { role: "S", text: "She", startIndex: 0, endIndex: 3 },
            { role: "V", text: "ran", startIndex: 4, endIndex: 7 },
            { role: "M", text: "quickly", startIndex: 8, endIndex: 15 },
        ] as any, "She ran quickly", true);

        const inv14 = violations.filter(v => v.invariantId === "INV_14");
        assert.ok(inv14.length > 0);
        assert.strictEqual(inv14[0].severity, "warning");
    });

    it("passes when M has modifiesIndex", () => {
        const violations = validateClause("main", [
            { role: "S", text: "She", startIndex: 0, endIndex: 3 },
            { role: "V", text: "ran", startIndex: 4, endIndex: 7 },
            { role: "M", text: "quickly", startIndex: 8, endIndex: 15, modifiesIndex: 1 },
        ] as any, "She ran quickly", true);

        const inv14 = violations.filter(v => v.invariantId === "INV_14");
        assert.strictEqual(inv14.length, 0);
    });
});

describe("INV_07: pattern consistency (via validate)", () => {
    it("detects pattern 2 with no C", () => {
        const stage1 = {
            sentencePattern: 2,
            elements: [
                { role: "S", text: "She", startIndex: 0, endIndex: 3 },
                { role: "V", text: "was", startIndex: 4, endIndex: 7 },
                { role: "Od", text: "it", startIndex: 8, endIndex: 10 },
            ],
        };
        const report = validate("She was it", stage1, { subClauses: [] });
        const inv07 = report.violations.filter(v => v.invariantId === "INV_07");
        assert.ok(inv07.length > 0, "should detect pattern inconsistency");
    });
});

describe("INV_08: expandsTo integrity (via validate)", () => {
    it("detects orphan expandsTo", () => {
        const stage1 = {
            elements: [
                { role: "S", text: "She", startIndex: 0, endIndex: 3, expandsTo: null },
                { role: "V", text: "ran", startIndex: 4, endIndex: 7, expandsTo: null },
                { role: "M", text: "quickly", startIndex: 8, endIndex: 15, expandsTo: "sub-99" },
            ],
        };
        const report = validate("She ran quickly", stage1, { subClauses: [] });
        const inv08 = report.violations.filter(v => v.invariantId === "INV_08");
        assert.ok(inv08.length > 0, "should detect orphan expandsTo");
    });

    it("passes when expandsTo target exists", () => {
        const stage1 = {
            elements: [
                { role: "S", text: "She", startIndex: 0, endIndex: 3, expandsTo: null },
                { role: "V", text: "ran", startIndex: 4, endIndex: 7, expandsTo: null },
                { role: "M", text: "quickly", startIndex: 8, endIndex: 15, expandsTo: "sub-1" },
            ],
        };
        const stage2 = {
            subClauses: [
                { clauseId: "sub-1", elements: [{ role: "V", text: "test", startIndex: 0, endIndex: 4 }] },
            ],
        };
        const report = validate("She ran quickly", stage1, stage2);
        const inv08 = report.violations.filter(v => v.invariantId === "INV_08");
        assert.strictEqual(inv08.length, 0);
    });
});

// ── repair: new actions ──

describe("repairLoop: new repair actions", () => {
    it("repairs INV_07 by recomputing pattern", () => {
        const stage1 = {
            sentencePattern: 2,
            elements: [
                { role: "S", text: "She", startIndex: 0, endIndex: 3 },
                { role: "V", text: "bought", startIndex: 4, endIndex: 10 },
                { role: "Od", text: "a book", startIndex: 11, endIndex: 17 },
            ],
        };
        const stage2 = { subClauses: [] };
        const { log } = repairLoop("She bought a book", stage1, stage2);
        // Pattern should be recalculated to 3 (SVO)
        assert.strictEqual(stage1.sentencePattern, 3);
        assert.ok(log.actions.some(a => a.reason.includes("INV_07")));
    });

    it("repairs INV_08 by nullifying orphan expandsTo", () => {
        const stage1 = {
            elements: [
                { role: "S", text: "She", startIndex: 0, endIndex: 3, expandsTo: null },
                { role: "V", text: "ran", startIndex: 4, endIndex: 7, expandsTo: null },
                { role: "M", text: "quickly", startIndex: 8, endIndex: 15, expandsTo: "sub-99" },
            ],
        };
        const stage2 = { subClauses: [] };
        const { log } = repairLoop("She ran quickly", stage1, stage2);
        assert.strictEqual(stage1.elements[2].expandsTo, null);
        assert.ok(log.actions.some(a => a.reason.includes("INV_08")));
    });
});

// ── syntax-tests runner ──

describe("runSyntaxTests", () => {
    it("returns pass for a correct simple sentence", () => {
        const stage1 = {
            sentencePattern: 1,
            elements: [
                { role: "S", text: "She", startIndex: 0, endIndex: 3, expandsTo: null, modifiesIndex: null },
                { role: "V", text: "ran", startIndex: 4, endIndex: 7, expandsTo: null, modifiesIndex: null },
            ],
        };
        const stage2 = { subClauses: [] };
        const tokens = tokenizeWithPOS("She ran");
        const results = runSyntaxTests("She ran", stage1, stage2, tokens);
        const fails = results.filter(r => r.status === "fail");
        assert.strictEqual(fails.length, 0, "simple correct sentence should have no failures");
    });

    it("detects AUX in non-V role as fail", () => {
        const stage1 = {
            elements: [
                { role: "M", text: "did", startIndex: 0, endIndex: 3, expandsTo: null, modifiesIndex: null },
                { role: "V", text: "run", startIndex: 4, endIndex: 7, expandsTo: null, modifiesIndex: null },
            ],
        };
        const stage2 = { subClauses: [] };
        const tokens = tokenizeWithPOS("did run");
        const results = runSyntaxTests("did run", stage1, stage2, tokens);
        const auxFails = results.filter(r => r.testName === "aux_in_v_chain" && r.status === "fail");
        assert.ok(auxFails.length > 0);
    });

    it("detects expandsTo integrity failure", () => {
        const stage1 = {
            elements: [
                { role: "S", text: "She", startIndex: 0, endIndex: 3, expandsTo: null },
                { role: "V", text: "ran", startIndex: 4, endIndex: 7, expandsTo: "sub-missing" },
            ],
        };
        const stage2 = { subClauses: [] };
        const tokens = tokenizeWithPOS("She ran");
        const results = runSyntaxTests("She ran", stage1, stage2, tokens);
        const expandsFails = results.filter(r => r.testName === "expandsTo_integrity" && r.status === "fail");
        assert.ok(expandsFails.length > 0);
    });

    it("warns when M has no modifiesIndex", () => {
        const stage1 = {
            elements: [
                { role: "S", text: "She", startIndex: 0, endIndex: 3, modifiesIndex: null },
                { role: "V", text: "ran", startIndex: 4, endIndex: 7, modifiesIndex: null },
                { role: "M", text: "quickly", startIndex: 8, endIndex: 15, modifiesIndex: null },
            ],
        };
        const stage2 = { subClauses: [] };
        const tokens = tokenizeWithPOS("She ran quickly");
        const results = runSyntaxTests("She ran quickly", stage1, stage2, tokens);
        const mWarns = results.filter(r => r.testName === "m_has_target" && r.status === "warn");
        assert.ok(mWarns.length > 0);
    });

    it("detects span mismatch", () => {
        const stage1 = {
            elements: [
                { role: "S", text: "She", startIndex: 0, endIndex: 5 }, // wrong
                { role: "V", text: "ran", startIndex: 6, endIndex: 9 },
            ],
        };
        const stage2 = { subClauses: [] };
        const tokens = tokenizeWithPOS("She ran fast");
        const results = runSyntaxTests("She ran fast", stage1, stage2, tokens);
        const spanFails = results.filter(r => r.testName === "span_exact_match" && r.status === "fail");
        assert.ok(spanFails.length > 0);
    });

    it("classifies to-infinitive in test results", () => {
        const stage1 = {
            elements: [
                { role: "S", text: "She", startIndex: 0, endIndex: 3 },
                { role: "V", text: "wants", startIndex: 4, endIndex: 9 },
                { role: "Od", text: "to go", startIndex: 10, endIndex: 15 },
            ],
        };
        const stage2 = { subClauses: [] };
        const tokens = tokenizeWithPOS("She wants to go");
        const results = runSyntaxTests("She wants to go", stage1, stage2, tokens);
        const toInfResults = results.filter(r => r.testName === "to_inf_function");
        assert.ok(toInfResults.length > 0);
        assert.ok(toInfResults[0].message.includes("object"));
    });
});

// ── Regression: I know he is right (noun clause) ──

describe("Regression: I know he is right", () => {
    it("noun clause without gap validates correctly", () => {
        const elements = [
            { role: "S", text: "he", startIndex: 7, endIndex: 9 },
            { role: "V", text: "is", startIndex: 10, endIndex: 12 },
            { role: "C", text: "right", startIndex: 13, endIndex: 18 },
        ];
        const tokens = tokenizeWithPOS("I know he is right");
        const result = validateClauseType("noun", elements, "know", tokens);
        assert.ok(result.valid, "noun clause with complete structure should be valid");
    });

    it("if misclassified as relative, flags it", () => {
        const elements = [
            { role: "S", text: "he", startIndex: 7, endIndex: 9 },
            { role: "V", text: "is", startIndex: 10, endIndex: 12 },
            { role: "C", text: "right", startIndex: 13, endIndex: 18 },
        ];
        const tokens = tokenizeWithPOS("I know he is right");
        const result = validateClauseType("relative", elements, "know", tokens);
        assert.ok(!result.valid, "relative classification without gap should be flagged");
        assert.strictEqual(result.suggestedType, "noun");
    });
});

// ── Regression: The book I read yesterday (contact relative) ──

describe("Regression: The book I read yesterday", () => {
    it("contact relative has gap at Od", () => {
        const elements = [
            { role: "Od", text: "(that)", startIndex: -1, endIndex: -1 },
            { role: "S", text: "I", startIndex: 9, endIndex: 10 },
            { role: "V", text: "read", startIndex: 11, endIndex: 15 },
            { role: "M", text: "yesterday", startIndex: 16, endIndex: 25 },
        ];
        const tokens = tokenizeWithPOS("The book I read yesterday");
        const gap = detectGap(elements, tokens);
        assert.ok(gap.hasGap);
        assert.strictEqual(gap.gapRole, "Od");
    });
});

// ── enforceVChains ──

describe("enforceVChains", () => {
    it("splits non-contiguous V element into separate words", () => {
        const sentence = "Rarely did the committee acknowledge that";
        const elements = [
            { role: "M", text: "Rarely", startIndex: 7, endIndex: 13 },
            { role: "V", text: "did acknowledge", startIndex: 14, endIndex: 29 },
            { role: "S", text: "the committee", startIndex: 18, endIndex: 31 },
            { role: "Od", text: "that", startIndex: 36, endIndex: 40 },
        ];
        fixElementIndices(sentence, elements);
        const result = enforceVChains(sentence, elements);
        assert.ok(result.fixed > 0, "should have fixed at least one element");
        // "did acknowledge" should be gone, replaced by "did" and "acknowledge"
        const vElements = elements.filter(e => e.role === "V");
        assert.ok(vElements.length >= 2, "should have at least 2 V elements");
        assert.ok(vElements.some(e => e.text === "did"), "should have V:'did'");
        assert.ok(vElements.some(e => e.text === "acknowledge"), "should have V:'acknowledge'");
        // combined element should not exist
        assert.ok(!elements.some(e => e.text === "did acknowledge"), "combined V should be removed");
    });

    it("does not split contiguous V elements", () => {
        const sentence = "She had come to the party";
        const elements = [
            { role: "S", text: "She", startIndex: 0, endIndex: 3 },
            { role: "V", text: "had come", startIndex: 4, endIndex: 12 },
            { role: "M", text: "to the party", startIndex: 13, endIndex: 25 },
        ];
        const result = enforceVChains(sentence, elements);
        assert.strictEqual(result.fixed, 0, "should not fix contiguous V");
        assert.ok(elements.some(e => e.text === "had come"), "contiguous V should remain");
    });

    it("deduplicates V elements at same position", () => {
        const sentence = "She came home";
        const elements = [
            { role: "S", text: "She", startIndex: 0, endIndex: 3 },
            { role: "V", text: "came", startIndex: 4, endIndex: 8 },
            { role: "V", text: "came", startIndex: 4, endIndex: 8 },
            { role: "M", text: "home", startIndex: 9, endIndex: 13 },
        ];
        const result = enforceVChains(sentence, elements);
        assert.ok(result.fixed > 0);
        const vElements = elements.filter(e => e.role === "V");
        assert.strictEqual(vElements.length, 1, "should have exactly 1 V after dedup");
    });

    it("does not create duplicate when split word already exists", () => {
        const sentence = "Rarely did the committee acknowledge that";
        const elements = [
            { role: "M", text: "Rarely", startIndex: 0, endIndex: 6 },
            { role: "V", text: "did acknowledge", startIndex: 7, endIndex: 36 },
            { role: "V", text: "acknowledge", startIndex: 25, endIndex: 36 },
            { role: "S", text: "the committee", startIndex: 11, endIndex: 24 },
        ];
        fixElementIndices(sentence, elements);
        enforceVChains(sentence, elements);
        // "acknowledge" already existed, so only "did" should be added
        const vElements = elements.filter(e => e.role === "V");
        const ackCount = vElements.filter(e => e.text === "acknowledge").length;
        assert.strictEqual(ackCount, 1, "should not duplicate 'acknowledge'");
    });
});

// ── INV_03: non-contiguous V detection ──

describe("INV_03: non-contiguous V text", () => {
    it("detects non-contiguous V element", () => {
        const sentence = "Rarely did the committee acknowledge that";
        const elements = [
            { role: "M", text: "Rarely", startIndex: 0, endIndex: 6 },
            { role: "V", text: "did acknowledge", startIndex: 7, endIndex: 36, expandsTo: null },
            { role: "S", text: "the committee", startIndex: 11, endIndex: 24, expandsTo: null },
        ];
        const violations = validateClause("main", elements as any, sentence, true);
        const inv03 = violations.filter(v => v.invariantId === "INV_03");
        assert.ok(inv03.length > 0, "should detect non-contiguous V");
        assert.strictEqual(inv03[0].severity, "error");
        assert.ok(inv03[0].recoverable);
    });

    it("does not flag contiguous V elements", () => {
        const sentence = "She had come home";
        const elements = [
            { role: "S", text: "She", startIndex: 0, endIndex: 3, expandsTo: null },
            { role: "V", text: "had come", startIndex: 4, endIndex: 12, expandsTo: null },
            { role: "M", text: "home", startIndex: 13, endIndex: 17, expandsTo: null },
        ];
        const violations = validateClause("main", elements as any, sentence, true);
        const inv03 = violations.filter(v => v.invariantId === "INV_03");
        assert.strictEqual(inv03.length, 0, "should not flag contiguous V");
    });
});

// ── V-chain inversion tracking ──

describe("V-chain inversion tracking", () => {
    it("includes inversion info in promptSummary", () => {
        const sentence = "Rarely did the committee acknowledge that";
        const tokens = tokenizeWithPOS(sentence);
        const result = resolveVChains(sentence, tokens);
        assert.ok(result.promptSummary.includes("INVERSION"), "promptSummary should mention inversion");
        assert.ok(result.promptSummary.includes("did"), "should mention the inverted auxiliary");
    });
});

// ── INV_03 repair via repairLoop ──

describe("repairLoop: INV_03 repair", () => {
    it("splits non-contiguous V via repair", () => {
        const sentence = "Rarely did the committee acknowledge that";
        const stage1 = {
            elements: [
                { role: "M", text: "Rarely", startIndex: 0, endIndex: 6 },
                { role: "V", text: "did acknowledge", startIndex: 7, endIndex: 36 },
                { role: "S", text: "the committee", startIndex: 11, endIndex: 24 },
                { role: "Od", text: "that", startIndex: 37, endIndex: 41 },
            ],
        };
        const stage2 = { subClauses: [] };
        const { log } = repairLoop(sentence, stage1, stage2);
        const splitActions = log.actions.filter(a => a.type === "split_noncontiguous_v");
        assert.ok(splitActions.length > 0, "should have split action");
        // After repair, should have separate V elements
        const vElems = stage1.elements.filter((e: any) => e.role === "V");
        assert.ok(vElems.some((e: any) => e.text === "did"), "should have V:'did'");
        assert.ok(vElems.some((e: any) => e.text === "acknowledge"), "should have V:'acknowledge'");
    });
});

// ══════════════════════════════════════════════════════════════
// NEW TESTS: Bridge verbs, long-distance extraction, passive+to-inf
// ══════════════════════════════════════════════════════════════

// ── isBridgeVerb ──

describe("isBridgeVerb", () => {
    it("identifies base form bridge verbs", () => {
        assert.ok(isBridgeVerb("claim"));
        assert.ok(isBridgeVerb("think"));
        assert.ok(isBridgeVerb("say"));
        assert.ok(isBridgeVerb("believe"));
        assert.ok(!isBridgeVerb("run"));
        assert.ok(!isBridgeVerb("design"));
    });

    it("identifies past tense -ed bridge verbs", () => {
        assert.ok(isBridgeVerb("claimed")); // strip -ed → claim
        assert.ok(isBridgeVerb("suggested")); // strip -ed → suggest
    });

    it("identifies doubled-consonant past tense", () => {
        assert.ok(isBridgeVerb("admitted")); // strip -ed → admitt → admit
    });

    it("identifies base-e past tense", () => {
        assert.ok(isBridgeVerb("acknowledged")); // strip -d → acknowledge
    });

    it("does not match non-bridge verbs", () => {
        assert.ok(!isBridgeVerb("designed"));
        assert.ok(!isBridgeVerb("walked"));
        assert.ok(!isBridgeVerb("running"));
    });
});

// ── matchesVerbSet ──

describe("matchesVerbSet", () => {
    it("matches base form in set", () => {
        assert.ok(matchesVerbSet("acknowledge", THAT_COMPLEMENT_VERBS));
    });

    it("matches -ed inflected form via strip-ed", () => {
        assert.ok(matchesVerbSet("claimed", THAT_COMPLEMENT_VERBS));
    });

    it("matches base-e inflected form via strip-d", () => {
        assert.ok(matchesVerbSet("acknowledged", THAT_COMPLEMENT_VERBS));
    });

    it("does not match unrelated words", () => {
        assert.ok(!matchesVerbSet("designed", BRIDGE_VERBS));
        assert.ok(!matchesVerbSet("cat", BRIDGE_VERBS));
    });
});

// ── detectLongDistanceExtraction ──

describe("detectLongDistanceExtraction", () => {
    it("detects extraction through bridge verb into complement clause", () => {
        // "the criteria it had claimed were designed to protect dissent"
        // sub-1 (relative): (that)=Od:-1, S:"it", V:"had claimed", Od→sub-2
        // sub-2 (complement): S:[gap=criteria]:-1, V:"were designed", M:"to protect dissent"
        const relativeElements = [
            { role: "Od", text: "(that)", startIndex: -1, endIndex: -1 },
            { role: "S", text: "it", startIndex: 20, endIndex: 22 },
            { role: "V", text: "had claimed", startIndex: 28, endIndex: 39 },
            { role: "M", text: "once", startIndex: 24, endIndex: 28 },
            { role: "Od", text: "were designed to protect dissent", startIndex: 40, endIndex: 72, expandsTo: "sub-2" },
        ];
        const complementElements = [
            { role: "S", text: "(criteria)", startIndex: -1, endIndex: -1 },
            { role: "V", text: "were designed", startIndex: 40, endIndex: 53 },
            { role: "M", text: "to protect dissent", startIndex: 54, endIndex: 72 },
        ];
        const allSubClauses = [
            { clauseId: "sub-2", elements: complementElements },
        ];
        const tokens = tokenizeWithPOS("the very criteria it had once claimed were designed to protect dissent");

        const gap = detectLongDistanceExtraction(relativeElements, allSubClauses, tokens);
        assert.ok(gap.isLongDistance, "should detect long-distance extraction");
        assert.strictEqual(gap.bridgeVerb, "claimed");
        assert.strictEqual(gap.gapRole, "S");
        assert.strictEqual(gap.gapClauseId, "sub-2");
    });

    it("does not detect extraction for non-bridge verbs", () => {
        const relativeElements = [
            { role: "Od", text: "(that)", startIndex: -1, endIndex: -1 },
            { role: "S", text: "she", startIndex: 10, endIndex: 13 },
            { role: "V", text: "designed", startIndex: 14, endIndex: 22 },
            { role: "Od", text: "something", startIndex: 23, endIndex: 32, expandsTo: "sub-2" },
        ];
        const complementElements = [
            { role: "S", text: "(it)", startIndex: -1, endIndex: -1 },
            { role: "V", text: "works", startIndex: 23, endIndex: 28 },
        ];
        const allSubClauses = [
            { clauseId: "sub-2", elements: complementElements },
        ];
        const tokens = tokenizeWithPOS("the thing she designed something works");

        const gap = detectLongDistanceExtraction(relativeElements, allSubClauses, tokens);
        assert.ok(!gap.isLongDistance, "should not detect extraction for non-bridge verb");
    });

    it("does not detect extraction when no expandsTo", () => {
        const relativeElements = [
            { role: "Od", text: "(that)", startIndex: -1, endIndex: -1 },
            { role: "S", text: "she", startIndex: 10, endIndex: 13 },
            { role: "V", text: "claimed", startIndex: 14, endIndex: 21 },
        ];
        const tokens = tokenizeWithPOS("the thing she claimed");

        const gap = detectLongDistanceExtraction(relativeElements, [], tokens);
        assert.ok(!gap.isLongDistance);
    });
});

// ── fixLongDistanceExtractionLabels ──

describe("fixLongDistanceExtractionLabels", () => {
    it("updates typeLabel for relative clause with bridge verb extraction", () => {
        const stage2 = {
            subClauses: [
                {
                    clauseId: "sub-1",
                    type: "relative",
                    typeLabel: "関係詞節（目的格の省略）",
                    elements: [
                        { role: "Od", text: "(that)", startIndex: -1, endIndex: -1 },
                        { role: "S", text: "it", startIndex: 20, endIndex: 22 },
                        { role: "V", text: "had claimed", startIndex: 28, endIndex: 39 },
                        { role: "Od", text: "were designed to protect dissent", startIndex: 40, endIndex: 72, expandsTo: "sub-2" },
                    ],
                },
                {
                    clauseId: "sub-2",
                    type: "noun",
                    typeLabel: "名詞節",
                    elements: [
                        { role: "S", text: "(criteria)", startIndex: -1, endIndex: -1 },
                        { role: "V", text: "were designed", startIndex: 40, endIndex: 53 },
                        { role: "M", text: "to protect dissent", startIndex: 54, endIndex: 72 },
                    ],
                },
            ],
        };
        const tokens = tokenizeWithPOS("the very criteria it had once claimed were designed to protect dissent");

        const fixed = fixLongDistanceExtractionLabels(stage2, tokens);
        assert.ok(fixed > 0, "should have fixed at least one label");
        assert.ok(
            stage2.subClauses[0].typeLabel.includes("long-distance extraction"),
            "typeLabel should mention long-distance extraction",
        );
        assert.ok(
            stage2.subClauses[0].typeLabel.includes("補文内主語"),
            "typeLabel should mention complement-internal subject",
        );
    });

    it("does not modify non-relative clauses", () => {
        const stage2 = {
            subClauses: [
                {
                    clauseId: "sub-1",
                    type: "noun",
                    typeLabel: "名詞節",
                    elements: [
                        { role: "S", text: "he", startIndex: 10, endIndex: 12 },
                        { role: "V", text: "claimed", startIndex: 13, endIndex: 20 },
                    ],
                },
            ],
        };
        const tokens = tokenizeWithPOS("I know he claimed it");

        const fixed = fixLongDistanceExtractionLabels(stage2, tokens);
        assert.strictEqual(fixed, 0);
        assert.strictEqual(stage2.subClauses[0].typeLabel, "名詞節");
    });
});

// ── Passive + to-infinitive fix ──

describe("fixPassiveToInfinitive via applyPatternFix", () => {
    it("reclassifies C→M for passive purpose verb + to-inf", () => {
        const stage = {
            elements: [
                { role: "S", text: "bridge", startIndex: 0, endIndex: 6 },
                { role: "V", text: "was built", startIndex: 7, endIndex: 16 },
                { role: "C", text: "to last centuries", startIndex: 17, endIndex: 34, arrowType: "complement" },
            ],
        } as any;
        applyPatternFix(stage);
        assert.strictEqual(stage.elements[2].role, "M", "C should be reclassified to M for purpose verb");
        assert.notStrictEqual(stage.sentencePattern, 2, "should NOT be pattern 2 (SVC)");
    });

    it("reclassifies C→Comp for passive 'designed' + to-inf", () => {
        const stage = {
            elements: [
                { role: "S", text: "criteria", startIndex: 0, endIndex: 8 },
                { role: "V", text: "were designed", startIndex: 9, endIndex: 22 },
                { role: "C", text: "to protect dissent", startIndex: 23, endIndex: 41, arrowType: "complement" },
            ],
        } as any;
        applyPatternFix(stage);
        assert.strictEqual(stage.elements[2].role, "Comp", "'designed' is copular passive → Comp");
        assert.strictEqual(stage.sentencePattern, 2, "should be pattern 2 (SV+Comp)");
        assert.strictEqual(stage.sentencePatternLabel, "第2文型 (SV+Comp)", "label should reflect Comp");
    });

    it("does NOT reclassify C for linking verbs (SVC is valid)", () => {
        const stage = {
            elements: [
                { role: "S", text: "She", startIndex: 0, endIndex: 3 },
                { role: "V", text: "was", startIndex: 4, endIndex: 7 },
                { role: "C", text: "happy", startIndex: 8, endIndex: 13, arrowType: "complement" },
            ],
        } as any;
        applyPatternFix(stage);
        assert.strictEqual(stage.elements[2].role, "C", "C should remain for linking verb");
        assert.strictEqual(stage.sentencePattern, 2, "should be pattern 2 (SVC)");
    });

    it("reclassifies C → Comp for raising passives (believed/supposed)", () => {
        const stage = {
            elements: [
                { role: "S", text: "He", startIndex: 0, endIndex: 2 },
                { role: "V", text: "is believed", startIndex: 3, endIndex: 14 },
                { role: "C", text: "to be guilty", startIndex: 15, endIndex: 27, arrowType: "complement" },
            ],
        } as any;
        applyPatternFix(stage);
        assert.strictEqual(stage.elements[2].role, "Comp", "C should become Comp for raising passive");
    });

    it("does not affect non-passive sentences", () => {
        const stage = {
            elements: [
                { role: "S", text: "She", startIndex: 0, endIndex: 3 },
                { role: "V", text: "ran", startIndex: 4, endIndex: 7 },
                { role: "M", text: "quickly", startIndex: 8, endIndex: 15 },
            ],
        } as any;
        applyPatternFix(stage);
        assert.strictEqual(stage.sentencePattern, 1, "should be pattern 1 (SV)");
    });
});

// ══════════════════════════════════════════════════════════════
// NEW TESTS: Parenthetical V-chains, Aspectual verbs
// ══════════════════════════════════════════════════════════════

// ── Parenthetical detection in V-chains ──

describe("resolveVChains: parenthetical insertion", () => {
    it("detects discontinuous 'had ... come' across parenthetical", () => {
        const sentence = "It had, once codified into procedure, come to dominate";
        const result = resolveVChains(sentence);
        const hadCome = result.chains.find(c => c.words.includes("had") && c.words.includes("come"));
        assert.ok(hadCome, "should detect 'had come' chain across parenthetical");
        assert.strictEqual(hadCome!.voice, "active");
        assert.ok(hadCome!.parentheticalSpan, "should have parenthetical span info");
        assert.ok(hadCome!.parentheticalSpan!.text.includes(","), "parenthetical text should include commas");
    });

    it("includes DISCONTINUOUS note in promptSummary", () => {
        const sentence = "It had, once codified into procedure, come to dominate";
        const result = resolveVChains(sentence);
        assert.ok(result.promptSummary.includes("DISCONTINUOUS"), "promptSummary should mention discontinuous chain");
    });

    it("does not skip parenthetical when no verb follows closing comma", () => {
        const sentence = "She had, to her surprise, a book";
        const result = resolveVChains(sentence);
        // "had" alone is AUX but no verb after closing comma ("a" is not a verb)
        const hadChain = result.chains.find(c => c.words.includes("had") && c.words.length >= 2 && c.parentheticalSpan);
        assert.ok(!hadChain, "should not detect chain across non-verb parenthetical");
    });

    it("handles parenthetical with POS tokens", () => {
        const sentence = "It had, once codified into procedure, come to dominate";
        const tokens = tokenizeWithPOS(sentence);
        const result = resolveVChains(sentence, tokens);
        const hadCome = result.chains.find(c => c.words.includes("had") && c.words.includes("come"));
        assert.ok(hadCome, "should detect chain with POS tokens too");
    });
});

// ── Aspectual verb + to-infinitive classification ──

describe("classifyToInfinitive: aspectual verbs", () => {
    it("classifies 'to be used' after 'come' as complement (aspectual)", () => {
        const elements = [
            { role: "S", text: "It", startIndex: 0, endIndex: 2 },
            { role: "V", text: "came", startIndex: 3, endIndex: 7 },
            { role: "M", text: "to be used", startIndex: 8, endIndex: 18 },
        ];
        const tokens = tokenizeWithPOS("It came to be used widely");
        const result = classifyToInfinitive(2, elements, tokens);
        assert.strictEqual(result, "complement");
    });

    it("classifies 'to know' after 'get' as complement (experiential)", () => {
        const elements = [
            { role: "S", text: "I", startIndex: 0, endIndex: 1 },
            { role: "V", text: "got", startIndex: 2, endIndex: 5 },
            { role: "M", text: "to know her", startIndex: 6, endIndex: 17 },
        ];
        const tokens = tokenizeWithPOS("I got to know her");
        const result = classifyToInfinitive(2, elements, tokens);
        assert.strictEqual(result, "complement");
    });

    it("classifies 'to love' after 'grow' as complement (gradual change)", () => {
        const elements = [
            { role: "S", text: "She", startIndex: 0, endIndex: 3 },
            { role: "V", text: "grew", startIndex: 4, endIndex: 8 },
            { role: "M", text: "to love it", startIndex: 9, endIndex: 19 },
        ];
        const tokens = tokenizeWithPOS("She grew to love it");
        const result = classifyToInfinitive(2, elements, tokens);
        assert.strictEqual(result, "complement");
    });

    it("still classifies 'to see him' after 'come' as purpose (not experiential)", () => {
        // "She came to see him" = purpose, NOT aspectual
        const elements = [
            { role: "S", text: "She", startIndex: 0, endIndex: 3 },
            { role: "V", text: "came", startIndex: 4, endIndex: 8 },
            { role: "M", text: "to see him", startIndex: 9, endIndex: 19 },
        ];
        const tokens = tokenizeWithPOS("She came to see him");
        const result = classifyToInfinitive(2, elements, tokens);
        assert.strictEqual(result, "purpose");
    });

    it("classifies 'to believe' after 'come' as complement (experiential)", () => {
        const elements = [
            { role: "S", text: "He", startIndex: 0, endIndex: 2 },
            { role: "V", text: "came", startIndex: 3, endIndex: 7 },
            { role: "M", text: "to believe it", startIndex: 8, endIndex: 21 },
        ];
        const tokens = tokenizeWithPOS("He came to believe it");
        const result = classifyToInfinitive(2, elements, tokens);
        assert.strictEqual(result, "complement");
    });
});

// ── Passive + to-inf: additional causative passive tests ──

describe("fixRaisingToComp: causative passives → Comp", () => {
    it("reclassifies C → Comp for 'was made to confess'", () => {
        const stage = {
            elements: [
                { role: "S", text: "He", startIndex: 0, endIndex: 2 },
                { role: "V", text: "was made", startIndex: 3, endIndex: 11 },
                { role: "C", text: "to confess", startIndex: 12, endIndex: 22, arrowType: "complement" },
            ],
        } as any;
        applyPatternFix(stage);
        assert.strictEqual(stage.elements[2].role, "Comp", "C should become Comp for causative passive");
    });

    it("reclassifies C → Comp for 'was forced to leave'", () => {
        const stage = {
            elements: [
                { role: "S", text: "She", startIndex: 0, endIndex: 3 },
                { role: "V", text: "was forced", startIndex: 4, endIndex: 14 },
                { role: "C", text: "to leave", startIndex: 15, endIndex: 23, arrowType: "complement" },
            ],
        } as any;
        applyPatternFix(stage);
        assert.strictEqual(stage.elements[2].role, "Comp", "C should become Comp for causative passive");
    });
});

// ── Regression: criteria claimed were designed to protect dissent ──

describe("Regression: long-distance extraction + passive to-inf", () => {
    it("sub-clause with 'were designed' + 'to protect dissent' gets Comp + Pattern 2", () => {
        // Simulates sub-2 (complement of bridge verb 'claimed')
        // "designed" is now in COPULAR_PASSIVE_ADJ_VERBS → to-inf = Comp
        const subClause = {
            elements: [
                { role: "S", text: "(criteria)", startIndex: -1, endIndex: -1 },
                { role: "V", text: "were designed", startIndex: 40, endIndex: 53 },
                { role: "C", text: "to protect dissent", startIndex: 54, endIndex: 72, arrowType: "complement" },
            ],
        } as any;
        applyPatternFix(subClause);
        // "designed" is copular passive adj → C→Comp
        assert.strictEqual(subClause.elements[2].role, "Comp");
        // Pattern should be 2 (SV+Comp) since Comp counts as C for pattern purposes
        assert.strictEqual(subClause.sentencePattern, 2);
        assert.strictEqual(subClause.sentencePatternLabel, "第2文型 (SV+Comp)");
    });
});

// ── Dynamic pattern labels: SV+Comp vs SVC ──

describe("Dynamic pattern labels with Comp", () => {
    it("raising verb (seem) + Comp → label shows SV+Comp, not SVC", () => {
        const stage = {
            elements: [
                { role: "S", text: "She", startIndex: 0, endIndex: 3 },
                { role: "V", text: "seems", startIndex: 4, endIndex: 9 },
                { role: "C", text: "to be happy", startIndex: 10, endIndex: 21, arrowType: "complement" },
            ],
        } as any;
        applyPatternFix(stage);
        assert.strictEqual(stage.elements[2].role, "Comp", "C → Comp for raising verb");
        assert.strictEqual(stage.sentencePattern, 2);
        assert.strictEqual(stage.sentencePatternLabel, "第2文型 (SV+Comp)");
    });

    it("linking verb (be) + C → label stays SVC", () => {
        const stage = {
            elements: [
                { role: "S", text: "She", startIndex: 0, endIndex: 3 },
                { role: "V", text: "is", startIndex: 4, endIndex: 6 },
                { role: "C", text: "happy", startIndex: 7, endIndex: 12, arrowType: "complement" },
            ],
        } as any;
        applyPatternFix(stage);
        assert.strictEqual(stage.elements[2].role, "C", "C stays C for linking verb");
        assert.strictEqual(stage.sentencePattern, 2);
        assert.strictEqual(stage.sentencePatternLabel, "第2文型 (SVC)");
    });
});

// ── Aspectual verb pattern: come/get/grow + to-inf → SV (Pattern 1) ──

describe("applyPatternFix: aspectual verb + to-inf → Comp, Pattern 1 (SV)", () => {
    it("'come' + to-inf Od → reclassified to Comp, Pattern 1 SV", () => {
        const stage = {
            elements: [
                { role: "S", text: "the criteria" },
                { role: "V", text: "had" },
                { role: "V", text: "come" },
                { role: "Od", text: "to exclude the voices" },
            ],
        } as any;
        applyPatternFix(stage);
        assert.strictEqual(stage.elements[3].role, "Comp", "to-inf Od should be reclassified to Comp");
        assert.strictEqual(stage.sentencePattern, 1, "Pattern should be SV (1)");
    });

    it("'come' + to-inf C → reclassified to Comp, Pattern 1 SV", () => {
        const stage = {
            elements: [
                { role: "S", text: "the criteria" },
                { role: "V", text: "had" },
                { role: "V", text: "come" },
                { role: "C", text: "to exclude the voices", arrowType: "complement" },
            ],
        } as any;
        applyPatternFix(stage);
        assert.strictEqual(stage.elements[3].role, "Comp", "to-inf C should be reclassified to Comp");
        assert.strictEqual(stage.sentencePattern, 1, "Pattern should be SV (1)");
    });

    it("'come' as true linking verb (come true) → still SVC", () => {
        const stage = {
            elements: [
                { role: "S", text: "the dream" },
                { role: "V", text: "came" },
                { role: "C", text: "true" },
            ],
        } as any;
        applyPatternFix(stage);
        assert.strictEqual(stage.elements[2].role, "C", "C 'true' should remain for linking come");
        assert.strictEqual(stage.sentencePattern, 2, "come + adjective C → SVC (linking)");
    });

    it("'grow' + to-inf → reclassified to Comp, Pattern 1 SV", () => {
        const stage = {
            elements: [
                { role: "S", text: "she" },
                { role: "V", text: "grew" },
                { role: "Od", text: "to love the city" },
            ],
        } as any;
        applyPatternFix(stage);
        assert.strictEqual(stage.elements[2].role, "Comp", "to-inf Od should be reclassified to Comp");
        assert.strictEqual(stage.sentencePattern, 1, "grow + to-inf → SV (1)");
    });

    it("'get' + to-inf C → Comp, Pattern 1", () => {
        const stage = {
            elements: [
                { role: "S", text: "she" },
                { role: "V", text: "got" },
                { role: "C", text: "to know him" },
            ],
        } as any;
        applyPatternFix(stage);
        assert.strictEqual(stage.elements[2].role, "Comp", "to-inf should be Comp for aspectual get");
        assert.strictEqual(stage.sentencePattern, 1);
    });
});

// ── INV_15: That-clause completeness ──

describe("INV_15: truncated that-clause detection", () => {
    it("detects truncated that-clause Od when next element has verbs", () => {
        const sentence = "He acknowledged that the criteria had come to exclude.";
        const elements = [
            { role: "S", text: "He", startIndex: 0, endIndex: 2 },
            { role: "V", text: "acknowledged", startIndex: 3, endIndex: 15 },
            { role: "Od", text: "that the criteria", startIndex: 16, endIndex: 33 },
            { role: "M", text: "had come to exclude", startIndex: 34, endIndex: 53 },
        ];
        const violations = validateClause("main", elements, sentence, true);
        const inv15 = violations.filter(v => v.invariantId === "INV_15");
        assert.ok(inv15.length > 0, "Should flag truncated that-clause");
    });

    it("does not flag complete that-clause with verb", () => {
        const sentence = "He acknowledged that the criteria were fair.";
        const elements = [
            { role: "S", text: "He", startIndex: 0, endIndex: 2 },
            { role: "V", text: "acknowledged", startIndex: 3, endIndex: 15 },
            { role: "Od", text: "that the criteria were fair", startIndex: 16, endIndex: 42 },
        ];
        const violations = validateClause("main", elements, sentence, true);
        const inv15 = violations.filter(v => v.invariantId === "INV_15");
        assert.strictEqual(inv15.length, 0, "Should not flag complete that-clause");
    });
});

// ── fixRaisingToComp: raising/copular passive verbs ──

describe("fixRaisingToComp: raising and copular passive verbs", () => {
    it("reclassifies C → Comp for 'seem to be happy'", () => {
        const stage = {
            elements: [
                { role: "S", text: "She" },
                { role: "V", text: "seems" },
                { role: "C", text: "to be happy", arrowType: "complement" },
            ],
        } as any;
        applyPatternFix(stage);
        assert.strictEqual(stage.elements[2].role, "Comp", "C should become Comp for raising verb");
        assert.strictEqual(stage.sentencePattern, 2, "seem + Comp → Pattern 2 (SVC)");
    });

    it("reclassifies C → Comp for 'is meant to do'", () => {
        const stage = {
            elements: [
                { role: "S", text: "This" },
                { role: "V", text: "is meant" },
                { role: "C", text: "to help people", arrowType: "complement" },
            ],
        } as any;
        applyPatternFix(stage);
        assert.strictEqual(stage.elements[2].role, "Comp", "C should become Comp for copular passive adj");
        assert.strictEqual(stage.sentencePattern, 2, "be meant + Comp → Pattern 2");
    });

    it("does NOT reclassify C for non-to-inf complement", () => {
        const stage = {
            elements: [
                { role: "S", text: "She" },
                { role: "V", text: "seems" },
                { role: "C", text: "happy" },
            ],
        } as any;
        applyPatternFix(stage);
        assert.strictEqual(stage.elements[2].role, "C", "Non-to-inf C should remain C for linking verb");
        assert.strictEqual(stage.sentencePattern, 2, "seem + C:happy → SVC");
    });
});

// ── Comp in pattern determination ──

describe("determineSentencePattern with Comp role", () => {
    it("Comp counts as C for raising verb → Pattern 2", () => {
        const result = determineSentencePattern([
            { role: "S", text: "She" },
            { role: "V", text: "seems" },
            { role: "Comp", text: "to be happy" },
        ]);
        assert.strictEqual(result.pattern, 2, "Comp should count as C for pattern 2");
    });

    it("Comp does NOT count as C for aspectual verb → Pattern 1", () => {
        const result = determineSentencePattern([
            { role: "S", text: "He" },
            { role: "V", text: "came" },
            { role: "Comp", text: "to know the truth" },
        ]);
        assert.strictEqual(result.pattern, 1, "Comp should not count as C for aspectual verb");
    });
});

describe("determineSentencePattern: elided elements excluded", () => {
    it("elided Od (gap) does NOT affect pattern → SV+Comp, not SVOC", () => {
        // "they were meant to safeguard" with elided Od gap from extraction
        const result = determineSentencePattern([
            { role: "S", text: "they", startIndex: 0 },
            { role: "V", text: "were meant", startIndex: 5 },
            { role: "Comp", text: "to safeguard", startIndex: 15 },
            { role: "Od", text: "(the voices)", startIndex: -1 }, // gap — should be ignored
        ]);
        // Without the gap, it's S + V + Comp → Pattern 2 (SV+Comp)
        assert.strictEqual(result.pattern, 2, "elided Od should not push to Pattern 5");
    });

    it("non-elided Od still counts → SVO (Pattern 3)", () => {
        const result = determineSentencePattern([
            { role: "S", text: "She", startIndex: 0 },
            { role: "V", text: "reads", startIndex: 4 },
            { role: "Od", text: "books", startIndex: 10 },
        ]);
        assert.strictEqual(result.pattern, 3, "non-elided Od should count as SVO");
    });
});

// ── normalizeRoles: new role normalization ──

describe("normalizeRoles: extended normalization", () => {
    it("converts 'Complement' to 'Comp'", () => {
        const elems = [{ role: "Complement", text: "to be happy" }];
        normalizeRoles(elems);
        assert.strictEqual(elems[0].role, "Comp");
    });

    it("converts 'Insertion' to 'Insert'", () => {
        const elems = [{ role: "Insertion", text: ", once codified," }];
        normalizeRoles(elems);
        assert.strictEqual(elems[0].role, "Insert");
    });

    it("converts 'Parenthetical' to 'Insert'", () => {
        const elems = [{ role: "Parenthetical", text: ", he said," }];
        normalizeRoles(elems);
        assert.strictEqual(elems[0].role, "Insert");
    });
});

// ── markParentheticalInsertions: sets Insert role ──

describe("markParentheticalInsertions: Insert role", () => {
    it("reclassifies M between V-chain elements to Insert", () => {
        const elements = [
            { role: "V", text: "had", startIndex: 0, endIndex: 3 },
            { role: "M", text: ", once codified,", startIndex: 3, endIndex: 19 },
            { role: "V", text: "come", startIndex: 20, endIndex: 24 },
        ];
        const vchainResult = {
            chains: [{
                words: ["had", "come"],
                parentheticalSpan: { start: 3, end: 19 },
                startIndex: 0,
                endIndex: 24,
            }],
            promptSummary: "",
        };
        markParentheticalInsertions(elements, vchainResult as any);
        assert.strictEqual(elements[1].role, "Insert", "M between V-chain should become Insert");
    });
});

// ── INV_14: Insert exempt from modifiesIndex warning ──

describe("INV_14: Insert is exempt from modifiesIndex warning", () => {
    it("does not warn for Insert without modifiesIndex", () => {
        const elements = [
            { role: "V", text: "had", startIndex: 0, endIndex: 3 },
            { role: "Insert", text: ", once codified,", startIndex: 3, endIndex: 19 },
            { role: "V", text: "come", startIndex: 20, endIndex: 24 },
        ];
        const violations = validateClause("main", elements, "had, once codified, come", true);
        const inv14 = violations.filter(v => v.invariantId === "INV_14");
        assert.strictEqual(inv14.length, 0, "Insert should not trigger INV_14 warning");
    });

    it("still warns for M without modifiesIndex", () => {
        const elements = [
            { role: "S", text: "She", startIndex: 0, endIndex: 3 },
            { role: "V", text: "ran", startIndex: 4, endIndex: 7 },
            { role: "M", text: "quickly", startIndex: 8, endIndex: 15 },
        ];
        const violations = validateClause("main", elements, "She ran quickly", true);
        const inv14 = violations.filter(v => v.invariantId === "INV_14");
        assert.ok(inv14.length > 0, "M without modifiesIndex should trigger INV_14 warning");
    });
});

// ── stampVChainIds: V-complex grouping ──

describe("stampVChainIds: V-complex grouping", () => {
    it("stamps vChainId on V elements matching chain words", () => {
        const elements: any[] = [
            { role: "S", text: "She", startIndex: 0, endIndex: 3 },
            { role: "V", text: "had", startIndex: 4, endIndex: 7 },
            { role: "V", text: "come", startIndex: 8, endIndex: 12 },
            { role: "Comp", text: "to know", startIndex: 13, endIndex: 20 },
        ];
        const vchainResult = {
            sentence: "She had come to know",
            chains: [{
                words: ["had", "come"],
                startIndex: 4,
                endIndex: 12,
                voice: "active",
                tense: "past perfect",
                isFinite: true,
                mainVerbLemma: "come",
            }],
            promptSummary: "",
        };
        const count = stampVChainIds(elements, vchainResult as any);
        assert.ok(count >= 2, "should stamp at least V elements");
        assert.strictEqual(elements[1].vChainId, "vc-0", "first V gets vc-0");
        assert.strictEqual(elements[2].vChainId, "vc-0", "second V gets vc-0");
        assert.strictEqual(elements[3].vChainId, "vc-0", "Comp after last V gets vc-0");
    });

    it("does not stamp unrelated elements", () => {
        const elements: any[] = [
            { role: "S", text: "She", startIndex: 0, endIndex: 3 },
            { role: "V", text: "ran", startIndex: 4, endIndex: 7 },
            { role: "M", text: "quickly", startIndex: 8, endIndex: 15 },
        ];
        const vchainResult = {
            sentence: "She ran quickly",
            chains: [{
                words: ["ran"],
                startIndex: 4,
                endIndex: 7,
                voice: "active",
                tense: "past",
                isFinite: true,
                mainVerbLemma: "run",
            }],
            promptSummary: "",
        };
        stampVChainIds(elements, vchainResult as any);
        assert.strictEqual(elements[1].vChainId, "vc-0", "V gets vc-0");
        assert.strictEqual(elements[0].vChainId, undefined, "S should not get vChainId");
        assert.strictEqual(elements[2].vChainId, undefined, "M should not get vChainId");
    });

    it("handles discontinuous V-chain with parenthetical", () => {
        const elements: any[] = [
            { role: "V", text: "had", startIndex: 0, endIndex: 3 },
            { role: "Insert", text: ", once codified,", startIndex: 3, endIndex: 19 },
            { role: "V", text: "come", startIndex: 20, endIndex: 24 },
            { role: "Comp", text: "to be used", startIndex: 25, endIndex: 35 },
        ];
        const vchainResult = {
            sentence: "had, once codified, come to be used",
            chains: [{
                words: ["had", "come"],
                startIndex: 0,
                endIndex: 24,
                parentheticalSpan: { startIndex: 3, endIndex: 19, text: ", once codified," },
                voice: "active",
                tense: "past perfect",
                isFinite: true,
                mainVerbLemma: "come",
            }],
            promptSummary: "",
        };
        stampVChainIds(elements, vchainResult as any);
        assert.strictEqual(elements[0].vChainId, "vc-0", "first V gets vc-0");
        assert.strictEqual(elements[2].vChainId, "vc-0", "second V gets vc-0");
        assert.strictEqual(elements[3].vChainId, "vc-0", "Comp after last V gets vc-0");
        assert.strictEqual(elements[1].vChainId, undefined, "Insert should not get vChainId");
    });
});

// ── Compz: normalizeRoles + INV_15 ──

describe("Compz: complementizer role", () => {
    it("normalizeRoles: converts 'Complementizer' to 'Compz'", () => {
        const elements = [{ role: "Complementizer", text: "that" }];
        normalizeRoles(elements);
        assert.strictEqual(elements[0].role, "Compz");
    });

    it("Compz is ignored by pattern determination", () => {
        const elements = [
            { role: "S", text: "I" },
            { role: "V", text: "know" },
            { role: "Compz", text: "that" },
            { role: "Od", text: "she is happy" },
        ];
        const result = determineSentencePattern(elements);
        assert.strictEqual(result.pattern, 3, "SVO pattern — Compz is transparent");
    });

    it("INV_15: detects truncated clause after Compz", () => {
        const sentence = "I know that the criteria were designed";
        const elements = [
            { role: "S", text: "I", startIndex: 0, endIndex: 1 },
            { role: "V", text: "know", startIndex: 2, endIndex: 6 },
            { role: "Compz", text: "that", startIndex: 7, endIndex: 11 },
            { role: "Od", text: "the criteria", startIndex: 12, endIndex: 24 },
            { role: "C", text: "were designed", startIndex: 25, endIndex: 38 },
        ];
        const violations = validateClause("main", elements, sentence, true);
        const inv15 = violations.filter(v => v.invariantId === "INV_15");
        assert.ok(inv15.length > 0, "Should detect truncated clause after Compz + Od");
    });
});
