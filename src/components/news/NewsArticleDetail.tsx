"use client";

import { useState } from "react";
import { ArrowLeft, BookOpen, Braces, ExternalLink } from "lucide-react";
import type { ProcessedArticle } from "@/types/news";
import VocabularyPanel from "./VocabularyPanel";
import GrammarPanel from "./GrammarPanel";
import styles from "./NewsArticleDetail.module.css";

interface Props {
    article: ProcessedArticle;
    onBack: () => void;
    onToggleVocabSaved: (index: number) => void;
    onToggleGrammarSaved: (index: number) => void;
}

type Tab = 'vocabulary' | 'grammar';

export default function NewsArticleDetail({ article, onBack, onToggleVocabSaved, onToggleGrammarSaved }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('vocabulary');

    const savedVocabCount = article.vocabulary.filter(v => v.saved).length;
    const savedGrammarCount = article.grammarPatterns.filter(g => g.saved).length;

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

            <div className={styles.articleText}>
                {article.simplifiedText.split('\n\n').map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                ))}
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
                    <span>Grammar ({article.grammarPatterns.length})</span>
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
