import type {
    EvaluateResponse,
    EvaluationResult,
    PronunciationRun,
    RunsFilter,
    RunsResponse,
    RunDetailResponse,
    PhonemeEvaluateResponse,
    PhonemeEvaluationResult,
} from '@/types/pronunciation';

const API_BASE = '/api/pronunciation';

/**
 * Evaluate pronunciation by sending audio to the API
 */
export async function evaluatePronunciation(
    audio: Blob,
    sentenceId: string,
    expectedText: string
): Promise<EvaluateResponse> {
    try {
        const formData = new FormData();
        formData.append('audio', audio, 'recording.webm');
        formData.append('sentenceId', sentenceId);
        formData.append('expectedText', expectedText);

        const response = await fetch(`${API_BASE}/evaluate`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
            };
        }

        const data = await response.json();
        return {
            success: true,
            data: data as EvaluationResult,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            success: false,
            error: `Failed to evaluate pronunciation: ${message}`,
        };
    }
}

/**
 * Fetch pronunciation runs with optional filters
 */
export async function fetchRuns(filters?: RunsFilter): Promise<RunsResponse> {
    try {
        const params = new URLSearchParams();

        if (filters?.sentenceId) params.set('sentenceId', filters.sentenceId);
        if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
        if (filters?.dateTo) params.set('dateTo', filters.dateTo);
        if (filters?.scoreMin !== undefined) params.set('scoreMin', String(filters.scoreMin));
        if (filters?.scoreMax !== undefined) params.set('scoreMax', String(filters.scoreMax));
        if (filters?.limit) params.set('limit', String(filters.limit));
        if (filters?.offset) params.set('offset', String(filters.offset));

        const url = `${API_BASE}/runs${params.toString() ? `?${params}` : ''}`;
        const response = await fetch(url);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
            };
        }

        const data = await response.json();
        return {
            success: true,
            data: data.runs as PronunciationRun[],
            total: data.total,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            success: false,
            error: `Failed to fetch runs: ${message}`,
        };
    }
}

/**
 * Fetch a single pronunciation run by ID
 */
export async function fetchRunById(id: string): Promise<RunDetailResponse> {
    try {
        const response = await fetch(`${API_BASE}/runs/${id}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
            };
        }

        const data = await response.json();
        return {
            success: true,
            data: data as PronunciationRun,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            success: false,
            error: `Failed to fetch run: ${message}`,
        };
    }
}

/**
 * Check API and database connectivity
 */
export async function checkHealth(): Promise<{
    api: boolean;
    database: boolean;
    error?: string;
}> {
    try {
        const response = await fetch(`${API_BASE}/health`);
        if (!response.ok) {
            return { api: false, database: false, error: 'API unreachable' };
        }
        const data = await response.json();
        return {
            api: true,
            database: data.database ?? false,
            error: data.error,
        };
    } catch {
        return { api: false, database: false, error: 'Network error' };
    }
}

/**
 * Evaluate pronunciation with phoneme-level analysis (Azure Speech)
 */
export async function evaluatePronunciationPhoneme(
    audio: Blob,
    sentenceId: string,
    expectedText: string
): Promise<PhonemeEvaluateResponse> {
    try {
        const formData = new FormData();
        formData.append('audio', audio, 'recording.webm');
        formData.append('sentenceId', sentenceId);
        formData.append('expectedText', expectedText);

        const response = await fetch(`${API_BASE}/evaluate-phoneme`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
            };
        }

        const data = await response.json();
        return {
            success: true,
            data: data as PhonemeEvaluationResult,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            success: false,
            error: `Failed to evaluate pronunciation: ${message}`,
        };
    }
}
