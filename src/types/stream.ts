export type SourceKind = "BASE" | "COMPARE" | "CANDIDATE";

export type SentenceRef = {
    sid: string;                 // stable id
    source: SourceKind;
    language: string;            // e.g. "ko"
    learn: string;               // target language sentence
    translation: string;         // L1 translation
    genre?: string;
    level?: number;
};

export type DiffHint = {
    before: string;
    after: string;
};

export type CorrectionData = {
    original: string;
    corrected: string;
    explanation: string;
    diffs: any[];
};

export type PronunciationScore = {
    accuracy: number;
    fluency: number;
    prosody: number;
    completeness: number;
};

export type PronunciationDetailedPhoneme = {
    phoneme: string;
    accuracyScore: number;
    errorType?: string;
};

export type PronunciationDetailedWord = {
    word: string;
    accuracyScore: number;
    errorType?: string;
    phonemes: PronunciationDetailedPhoneme[];
};

export type StreamItem =
    | { kind: "input"; iid: "input-node" }
    | { kind: "sentence"; data: SentenceRef }
    | { kind: "candidate"; data: SentenceRef; fromSid?: string; diff?: DiffHint; tags?: string[]; hint?: string }
    | { kind: "summary"; data: { score: number; text: string; fromSid: string } }
    | { kind: "user-speech"; text: string; score?: PronunciationScore; details?: PronunciationDetailedWord[] }
    | { kind: "correction"; data: CorrectionData };

// Added tags/hint to StreamItem candidate definition to match usage

export type FocusType = "token" | "diff";

export type ActiveFocus = {
    type: FocusType;
    key: string;
    relatedSids: string[];
};

export type VoiceState = "locked" | "idle" | "recording" | "uploading" | "success" | "error";

export type VoiceResult = {
    asrText: string;
    score: number;
    diff?: DiffHint;
    advice?: string;
};

export type StreamStore = {
    streamItems: StreamItem[];
    selectedSid: string | null;
    activeFocus: ActiveFocus | null;
    voiceState: VoiceState;
    voiceResult: VoiceResult | null;

    setStreamItems: (items: StreamItem[]) => void;
    addStreamItem: (item: StreamItem) => void;
    toggleSelection: (sid: string) => void;
    setFocus: (focus: ActiveFocus | null) => void;
    setVoiceState: (state: VoiceState) => void;
    setVoiceResult: (result: VoiceResult | null) => void;
};
