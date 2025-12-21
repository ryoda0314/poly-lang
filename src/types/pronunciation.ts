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
}

export interface PronunciationRun {
    id: string;
    user_id: string;
    phrase_id: string;
    expected_text: string;
    asr_text: string;
    score: number;
    diffs: DiffItem[];
    feedback: string;
    created_at: string;
}

export type RecordingState = 'idle' | 'recording' | 'processing' | 'done' | 'error';

export interface EvaluateResponse {
    success: boolean;
    data?: EvaluationResult;
    error?: string;
}

export interface ComparisonData {
    firstRun: EvaluationResult;
    secondRun: EvaluationResult;
    scoreDiff: number;
    improvedItems: number;
    regressedItems: number;
}
