"use client";

import { ArrowLeft } from "lucide-react";
import type { SentenceAnalysisResult } from "@/actions/sentence-analysis";
import SvocAnnotation from "./SvocAnnotation";
import SyntaxTree from "./SyntaxTree";
import TranslationSection from "./TranslationSection";
import VocabularyList from "./VocabularyList";
import GrammarPoints from "./GrammarPoints";
import SimilarExamples from "./SimilarExamples";
import styles from "./AnalysisResult.module.css";

interface Props {
    result: SentenceAnalysisResult;
    onBack: () => void;
    onNewAnalysis?: (sentence: string) => void;
}

export default function AnalysisResult({ result, onBack, onNewAnalysis }: Props) {
    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <button className={styles.backButton} onClick={onBack}>
                    <ArrowLeft size={18} />
                    <span>戻る</span>
                </button>
            </div>

            {/* Original sentence */}
            <div className={styles.originalSentence}>
                {result.originalSentence}
            </div>

            {/* SVOC Annotation */}
            <SvocAnnotation
                elements={result.svocElements}
                originalSentence={result.originalSentence}
                pattern={result.svocPattern}
            />

            {/* Syntax Tree */}
            {result.syntaxTree && (
                <SyntaxTree tree={result.syntaxTree} />
            )}

            {/* Translation + Structure Explanation */}
            <TranslationSection
                translation={result.translation}
                structuralTranslation={result.structuralTranslation}
                structureExplanation={result.structureExplanation}
                difficulty={result.difficulty}
            />

            {/* Grammar Points */}
            <GrammarPoints points={result.grammarPoints} />

            {/* Vocabulary */}
            <VocabularyList vocabulary={result.vocabulary} />

            {/* Similar Examples */}
            <SimilarExamples
                examples={result.similarExamples}
                onAnalyze={onNewAnalysis}
            />
        </div>
    );
}
