"use client";

import { ArrowLeft } from "lucide-react";
import type { SentenceAnalysisResult, SvocRole } from "@/actions/sentence-analysis";
import SvocAnnotation from "./SvocAnnotation";
import TranslationSection from "./TranslationSection";
import VocabularyList from "./VocabularyList";
import GrammarPoints from "./GrammarPoints";
import SimilarExamples from "./SimilarExamples";
import styles from "./AnalysisResult.module.css";

const ROLE_COLORS: Record<SvocRole, string> = {
    S: "#3B82F6", V: "#D94528", Oi: "#06B6D4",
    Od: "#10B981", C: "#8B5CF6", M: "#F59E0B",
};

interface Props {
    result: SentenceAnalysisResult;
    onBack: () => void;
    onNewAnalysis?: (sentence: string) => void;
}

export default function AnalysisResult({ result, onBack, onNewAnalysis }: Props) {
    // Fallback: old cached data may have svocElements instead of clauses
    const clauses = result.clauses ?? ((result as any).svocElements
        ? [{
            clauseId: "main",
            type: "main" as const,
            typeLabel: "主節",
            elements: (result as any).svocElements,
            parentClause: null,
            parentElementIndex: null,
            modifierScope: null,
            sentencePattern: result.sentencePattern ?? null,
            sentencePatternLabel: result.sentencePatternLabel ?? null,
        }]
        : []);

    // Build annotated sentence from main clause elements
    const sentence = result.originalSentence;
    const mainClause = clauses.find(c => c.clauseId === "main");

    function buildAnnotatedParts() {
        if (!mainClause) return [{ text: sentence, color: null as string | null, role: null as string | null }];

        const elements = [...mainClause.elements]
            .filter(e => typeof e.startIndex === "number" && typeof e.endIndex === "number")
            .sort((a, b) => a.startIndex - b.startIndex);

        const parts: { text: string; color: string | null; role: string | null }[] = [];
        let cursor = 0;

        for (const elem of elements) {
            let start = elem.startIndex;
            let end = elem.endIndex;

            // If indices conflict (e.g. duplicate word mapped to wrong position), re-find
            if (start < cursor) {
                const idx = sentence.indexOf(elem.text, cursor);
                if (idx !== -1) {
                    start = idx;
                    end = idx + elem.text.length;
                } else {
                    continue; // skip if not found
                }
            }

            if (start > cursor) {
                parts.push({ text: sentence.slice(cursor, start), color: null, role: null });
            }
            parts.push({
                text: sentence.slice(start, end),
                color: ROLE_COLORS[elem.role] || null,
                role: elem.role,
            });
            cursor = end;
        }

        if (cursor < sentence.length) {
            parts.push({ text: sentence.slice(cursor), color: null, role: null });
        }

        return parts;
    }

    const annotatedParts = buildAnnotatedParts();

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={`${styles.header} ${styles.textSection}`}>
                <button className={styles.backButton} onClick={onBack}>
                    <ArrowLeft size={18} />
                    <span>戻る</span>
                </button>
            </div>

            {/* Original sentence with SVOC color underlines */}
            <div className={`${styles.originalSentence} ${styles.textSection}`}>
                {annotatedParts.map((part, i) =>
                    part.color ? (
                        <span
                            key={i}
                            className={styles.annotatedSpan}
                            style={{ borderBottomColor: part.color, "--_c": part.color } as React.CSSProperties}
                            title={part.role ?? undefined}
                        >
                            {part.text}
                        </span>
                    ) : (
                        <span key={i}>{part.text}</span>
                    )
                )}
            </div>

            {/* SVOC Annotation — full width */}
            <SvocAnnotation
                clauses={clauses}
                pattern={result.svocPattern}
                sentencePattern={result.sentencePattern}
                sentencePatternLabel={result.sentencePatternLabel}
            />

            {/* Text sections — readable width */}
            <div className={styles.textSection}>
                <TranslationSection
                    translation={result.translation}
                    structuralTranslation={result.structuralTranslation}
                    structureExplanation={result.structureExplanation}
                    difficulty={result.difficulty}
                />
            </div>

            <div className={styles.textSection}>
                <GrammarPoints points={result.grammarPoints} />
            </div>

            <div className={styles.textSection}>
                <VocabularyList vocabulary={result.vocabulary} />
            </div>

            <div className={styles.textSection}>
                <SimilarExamples
                    examples={result.similarExamples}
                    onAnalyze={onNewAnalysis}
                />
            </div>
        </div>
    );
}
