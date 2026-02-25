export interface NewsArticleSummary {
    id: string;
    title: string;
    source_url: string;
    image_url: string | null;
    published_at: string | null;
    source_type: string;
    description: string | null;
}

export interface VocabItem {
    word: string;
    reading: string | null;
    pos: string;
    definition: string;
    example_sentence: string;
    saved: boolean;
}

export interface GrammarPattern {
    pattern: string;
    explanation: string;
    example: string;
    level: string;
    saved: boolean;
}

export interface ProcessedArticle {
    articleId: string;
    originalTitle: string;
    simplifiedTitle: string;
    simplifiedText: string;
    vocabulary: VocabItem[];
    grammarPatterns: GrammarPattern[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    imageUrl: string | null;
    sourceUrl: string;
}

export interface NewsHistoryEntry {
    id: string;
    article_id: string;
    difficulty: string;
    read_at: string;
    saved_vocabulary: VocabItem[];
    saved_grammar: GrammarPattern[];
    article_title: string;
    article_url: string;
    article_image: string | null;
}

export type NewsDifficulty = 'beginner' | 'intermediate' | 'advanced';
