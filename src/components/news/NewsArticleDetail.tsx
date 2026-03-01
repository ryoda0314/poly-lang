"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, BookOpen, Braces, ExternalLink } from "lucide-react";
import type { ProcessedArticle } from "@/types/news";
import VocabularyPanel from "./VocabularyPanel";
import GrammarPanel from "./GrammarPanel";
import AudioPlayer from "./AudioPlayer";
import styles from "./NewsArticleDetail.module.css";

interface Props {
    article: ProcessedArticle;
    langCode: string;
    onBack: () => void;
    onToggleVocabSaved: (index: number) => void;
    onToggleGrammarSaved: (index: number) => void;
}

type Tab = 'vocabulary' | 'grammar';

type Segment = { text: string; type: 'plain' | 'vocab' | 'grammar' };

function escapeRegex(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Build a character-level type map, then split into segments.
 *  Vocab words are matched directly. Grammar patterns use their `example` sentence
 *  to locate the right area, then highlight pattern keyword fragments within it. */
function buildHighlightedSegments(
    text: string,
    vocabWords: string[],
    grammarExamples: { example: string; pattern: string }[],
): Segment[] {
    // charType: 0=plain, 1=vocab, 2=grammar
    const charType = new Uint8Array(text.length);

    // 1) Mark vocab words (higher priority — applied second so it overwrites grammar)
    const vocabSorted = [...vocabWords].filter(w => w.length > 0).sort((a, b) => b.length - a.length);
    for (const word of vocabSorted) {
        const re = new RegExp(escapeRegex(word), 'gi');
        for (const m of text.matchAll(re)) {
            const start = m.index!;
            for (let i = start; i < start + m[0].length; i++) charType[i] = 1;
        }
    }

    // 2) Mark grammar: find example sentence in text, then highlight pattern fragments within it
    for (const { example, pattern } of grammarExamples) {
        if (!example || example.length < 5) continue;
        // Find where the example sentence appears in the text
        const exIdx = text.toLowerCase().indexOf(example.toLowerCase().slice(0, 60));
        if (exIdx === -1) continue;
        const exEnd = Math.min(exIdx + example.length + 20, text.length); // allow slight length diff

        // Extract keyword fragments from pattern: "required ... to ..." → ["required", "to"]
        const alternatives = pattern.split('/').map(s => s.trim());
        const fragments: string[] = [];
        for (const alt of alternatives) {
            const parts = alt.split(/\.{3}|…/).map(s => s.trim()).filter(s => s.length >= 2);
            fragments.push(...parts);
        }
        // Sort longest first
        fragments.sort((a, b) => b.length - a.length);

        // Within the example sentence region, highlight each fragment (only if not already vocab)
        const region = text.slice(exIdx, exEnd);
        for (const frag of fragments) {
            const fragRe = new RegExp(`\\b${escapeRegex(frag)}\\b`, 'gi');
            for (const fm of region.matchAll(fragRe)) {
                const absStart = exIdx + fm.index!;
                for (let i = absStart; i < absStart + fm[0].length; i++) {
                    if (charType[i] === 0) charType[i] = 2; // don't overwrite vocab
                }
            }
        }
    }

    // 3) Convert char map to segments
    if (charType.every(v => v === 0)) return [{ text, type: 'plain' }];

    const segments: Segment[] = [];
    let runStart = 0;
    let runType = charType[0];
    const typeMap: Record<number, Segment['type']> = { 0: 'plain', 1: 'vocab', 2: 'grammar' };

    for (let i = 1; i <= text.length; i++) {
        const ct = i < text.length ? charType[i] : 255;
        if (ct !== runType) {
            segments.push({ text: text.slice(runStart, i), type: typeMap[runType] });
            runStart = i;
            runType = ct;
        }
    }
    return segments;
}

export default function NewsArticleDetail({ article, langCode, onBack, onToggleVocabSaved, onToggleGrammarSaved }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('vocabulary');

    const savedVocabCount = article.vocabulary.filter(v => v.saved).length;
    const savedGrammarCount = article.grammarPatterns.filter(g => g.saved).length;

    const vocabWords = useMemo(() => article.vocabulary.map(v => v.word), [article.vocabulary]);
    const grammarExamples = useMemo(() =>
        article.grammarPatterns.map(g => ({ example: g.example, pattern: g.pattern })),
        [article.grammarPatterns],
    );

    const renderHighlightedParagraph = (paragraph: string, key: number) => {
        const segments = buildHighlightedSegments(paragraph, vocabWords, grammarExamples);
        return (
            <p key={key}>
                {segments.map((seg, j) => {
                    if (seg.type === 'plain') return <span key={j}>{seg.text}</span>;
                    const cls = seg.type === 'vocab' ? styles.highlightVocab : styles.highlightGrammar;
                    return <span key={j} className={cls}>{seg.text}</span>;
                })}
            </p>
        );
    };

    return (
        <div className={styles.container}>
            <button className={styles.backButton} onClick={onBack}>
                <ArrowLeft size={18} />
                <span>Back</span>
            </button>

            <h1 className={styles.title}>{article.simplifiedTitle}</h1>

            <div className={styles.difficultyBadge}>
                {article.difficulty}
            </div>

            <AudioPlayer text={article.simplifiedText} langCode={langCode} />

            <div className={styles.articleText}>
                {article.simplifiedText.split('\n\n').map((paragraph, i) =>
                    renderHighlightedParagraph(paragraph, i)
                )}
            </div>

            <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.sourceLink}
            >
                <ExternalLink size={14} />
                <span>Original article</span>
            </a>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'vocabulary' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('vocabulary')}
                >
                    <BookOpen size={14} />
                    <span>Vocabulary ({article.vocabulary.length})</span>
                    {savedVocabCount > 0 && <span className={styles.badge}>{savedVocabCount}</span>}
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'grammar' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('grammar')}
                >
                    <Braces size={14} />
                    <span>Patterns ({article.grammarPatterns.length})</span>
                    {savedGrammarCount > 0 && <span className={styles.badge}>{savedGrammarCount}</span>}
                </button>
            </div>

            {activeTab === 'vocabulary' ? (
                <VocabularyPanel vocabulary={article.vocabulary} onToggleSaved={onToggleVocabSaved} />
            ) : (
                <GrammarPanel patterns={article.grammarPatterns} onToggleSaved={onToggleGrammarSaved} />
            )}
        </div>
    );
}
