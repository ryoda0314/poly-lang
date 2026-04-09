import { CorrectionData } from "@/types/stream";

export const MOCK_CORRECTION_DATA: CorrectionData = {
    original: "I want to go to the park yesterday.",
    corrected: "I wanted to go to the park yesterday.",
    explanation: "Since 'yesterday' indicates the past, use the past tense 'wanted'.",
    diffs: [
        { type: "match", text: "I" },
        { type: "substitution", text: "want", correction: "wanted" },
        { type: "match", text: "to go to the park yesterday." }
    ]
};

export const MOCK_SCORE = {
    accuracy: 85,
    fluency: 92,
    prosody: 78,
    completeness: 100
};

export const MOCK_DETAILS = [
    {
        word: "I",
        accuracyScore: 98,
        phonemes: [{ phoneme: "ay", accuracyScore: 98 }]
    },
    {
        word: "want",
        accuracyScore: 55,
        errorType: "Mispronunciation",
        phonemes: [
            { phoneme: "w", accuracyScore: 90 },
            { phoneme: "aa", accuracyScore: 40 },
            { phoneme: "n", accuracyScore: 85 },
            { phoneme: "t", accuracyScore: 90 }
        ]
    },
    {
        word: "to",
        accuracyScore: 95,
        phonemes: [{ phoneme: "t", accuracyScore: 95 }, { phoneme: "uw", accuracyScore: 96 }]
    },
    {
        word: "go",
        accuracyScore: 92,
        phonemes: [{ phoneme: "g", accuracyScore: 90 }, { phoneme: "ow", accuracyScore: 94 }]
    }
];
