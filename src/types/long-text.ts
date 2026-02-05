export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface LongText {
    id: string;
    user_id?: string;
    title: string;
    title_translation?: string;
    language_code: string;
    difficulty_level?: DifficultyLevel;
    category?: string;
    full_text: string;
    sentence_count: number;
    is_published: boolean;
    created_at: string;
    updated_at: string;
}

export interface LongTextSentence {
    id: string;
    long_text_id: string;
    position: number;
    text: string;
    translation?: string;
    tokens?: string[];
    created_at: string;
}

export interface UserLongTextProgress {
    id: string;
    user_id: string;
    long_text_id: string;
    current_sentence: number;
    completed_sentences: number[];
    started_at: string;
    last_accessed_at: string;
    completed_at?: string;
}

export interface LongTextWithSentences extends LongText {
    sentences: LongTextSentence[];
}

export interface LongTextWithProgress extends LongText {
    progress?: UserLongTextProgress;
}
