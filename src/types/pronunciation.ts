// ===== Azure Speech 4-axis scoring =====

export type AzurePronunciationScore = {
    accuracy: number;
    fluency: number;
    prosody: number;
    completeness: number;
    overall: number; // pronunciationScore from Azure
};

export type AzurePhonemeResult = {
    phoneme: string;
    accuracyScore: number;
    errorType?: string;
};

export type AzureWordResult = {
    word: string;
    accuracyScore: number;
    errorType: 'None' | 'Omission' | 'Insertion' | 'Mispronunciation';
    phonemes: AzurePhonemeResult[];
};

export type AzureEvaluationResult = {
    runId: string;
    scores: AzurePronunciationScore;
    words: AzureWordResult[];
    expectedText: string;
    recognizedText: string;
    feedback: string;
    createdAt: string;
};

export type AzureEvaluateResponse = {
    success: boolean;
    data?: AzureEvaluationResult;
    error?: string;
};

// ===== Practice sentence =====

export type PracticeSentence = {
    id: string;
    text: string;
    difficulty: 'easy' | 'medium' | 'hard';
    category: string;
    phonemes?: string[];
    source?: 'preset' | 'saved' | 'folder';
};

// ===== Recording state =====

export type RecordingState = 'idle' | 'recording' | 'processing' | 'done' | 'error';

// ===== Speaking conversation =====

export type SpeakingMessage = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    suggestions?: string[];
    pronunciationScore?: AzurePronunciationScore;
    words?: AzureWordResult[];
    expectedText?: string;
};
