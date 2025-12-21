// 発音評価システムの型定義

export interface Sentence {
    id: string;
    text: string;
    difficulty: 'easy' | 'medium' | 'hard';
    category: string;
    phonemes?: string[]; // 難しい音素のリスト
}

export interface DiffItem {
    type: 'match' | 'missing' | 'substitution' | 'insertion';
    expected?: string;
    actual?: string;
    position: number;
}

export interface EvaluationResult {
    runId: string;
    score: number; // 0-100
    asrText: string;
    expectedText: string;
    diffs: DiffItem[];
    feedback: string;
    createdAt: string;
    audioDuration?: number;
}

export interface PronunciationRun {
    id: string;
    sentenceId: string;
    expectedText: string;
    asrText: string;
    score: number;
    diffs: DiffItem[];
    feedback: string;
    audioDuration?: number;
    deviceInfo?: DeviceInfo;
    createdAt: string;
}

export interface DeviceInfo {
    userAgent: string;
    platform: string;
    audioCodec?: string;
}

export interface EvaluateRequest {
    audio: Blob;
    sentenceId: string;
    expectedText: string;
}

export interface EvaluateResponse {
    success: boolean;
    data?: EvaluationResult;
    error?: string;
}

export interface RunsResponse {
    success: boolean;
    data?: PronunciationRun[];
    error?: string;
    total?: number;
}

export interface RunDetailResponse {
    success: boolean;
    data?: PronunciationRun;
    error?: string;
}

// 録音状態
export type RecordingState = 'idle' | 'recording' | 'processing' | 'done' | 'error';

// フィルター
export interface RunsFilter {
    sentenceId?: string;
    dateFrom?: string;
    dateTo?: string;
    scoreMin?: number;
    scoreMax?: number;
    limit?: number;
    offset?: number;
}

// 比較用
export interface ComparisonData {
    firstRun: EvaluationResult;
    secondRun: EvaluationResult;
    scoreDiff: number;
    improvedItems: number;
    regressedItems: number;
}

// 評価モード
export type EvaluationMode = 'word' | 'phoneme';

// 音素評価結果
export interface PhonemeScore {
    phoneme: string;
    score: number; // 0-100
    nBestPhonemes?: Array<{
        phoneme: string;
        score: number;
    }>;
}

export interface WordPhonemeResult {
    word: string;
    accuracyScore: number;
    errorType: 'None' | 'Omission' | 'Insertion' | 'Mispronunciation';
    phonemes: PhonemeScore[];
}

export interface PhonemeEvaluationResult {
    runId: string;
    accuracyScore: number;
    fluencyScore: number;
    completenessScore: number;
    pronunciationScore: number; // 総合スコア
    words: WordPhonemeResult[];
    expectedText: string;
    recognizedText: string;
    feedback: string;
    createdAt: string;
}

export interface PhonemeEvaluateResponse {
    success: boolean;
    data?: PhonemeEvaluationResult;
    error?: string;
}
