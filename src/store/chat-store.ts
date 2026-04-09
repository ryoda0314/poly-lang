import { create } from 'zustand';

// Types
export type Gender = 'male' | 'female' | 'unspecified';
export type Relationship = 'friend' | 'boss' | 'subordinate' | 'shopkeeper' | 'teacher' | 'stranger';
export type AgeGroup = 'older' | 'same' | 'younger';
export type Personality = 'friendly' | 'formal' | 'casual' | 'strict';
export type LanguageStyle = 'standard' | 'texting';

export interface PartnerSettings {
    gender: Gender;
    relationship: Relationship;
    ageGroup: AgeGroup;
    personality: Personality;
    languageStyle: LanguageStyle;
}

export interface SituationPreset {
    id: string;
    labelKey: string; // Translation key
    description: string;
}

export const SITUATION_PRESETS: SituationPreset[] = [
    { id: 'restaurant', labelKey: 'chatSituationRestaurant', description: 'Ordering food at a restaurant' },
    { id: 'airport', labelKey: 'chatSituationAirport', description: 'At the airport or on a plane' },
    { id: 'hotel', labelKey: 'chatSituationHotel', description: 'Checking in at a hotel' },
    { id: 'directions', labelKey: 'chatSituationDirections', description: 'Asking for directions' },
    { id: 'interview', labelKey: 'chatSituationInterview', description: 'Job interview' },
    { id: 'phone', labelKey: 'chatSituationPhone', description: 'Phone call' },
    { id: 'daily', labelKey: 'chatSituationDaily', description: 'Daily conversation' },
    { id: 'shopping', labelKey: 'chatSituationShopping', description: 'Shopping' },
    { id: 'custom', labelKey: 'chatSituationCustom', description: 'Custom situation' },
];

export interface ChatSettings {
    partner: PartnerSettings;
    situationId: string;
    customSituation: string;
}

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export interface Correction {
    id: string;
    messageId: string;
    original: string;
    corrected: string;
    explanation: string;
    timestamp: number;
}

export type SidebarTab = 'settings' | 'corrections';

interface ChatStore {
    // Messages
    messages: Message[];
    addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => string;
    updateMessage: (id: string, content: string) => void;
    clearMessages: () => void;

    // Settings
    settings: ChatSettings;
    updatePartnerSettings: (partner: Partial<PartnerSettings>) => void;
    setSituation: (situationId: string, customSituation?: string) => void;

    // Corrections
    corrections: Correction[];
    addCorrection: (correction: Omit<Correction, 'id' | 'timestamp'>) => void;
    clearCorrections: () => void;

    // Compact context (summarized history)
    compactedContext: string | null;
    setCompactedContext: (context: string | null) => void;

    // UI State
    sidebarTab: SidebarTab;
    setSidebarTab: (tab: SidebarTab) => void;
    isSidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;

    // Streaming state
    isStreaming: boolean;
    setIsStreaming: (streaming: boolean) => void;

    // Assist mode
    assistMode: boolean;
    setAssistMode: (enabled: boolean) => void;
    suggestions: string[];
    setSuggestions: (suggestions: string[]) => void;

    // Immersion mode (language-specific UI)
    immersionMode: boolean;
    setImmersionMode: (enabled: boolean) => void;

    // Unread corrections badge
    hasUnreadCorrection: boolean;
    setHasUnreadCorrection: (has: boolean) => void;
}

const DEFAULT_SETTINGS: ChatSettings = {
    partner: {
        gender: 'unspecified',
        relationship: 'friend',
        ageGroup: 'same',
        personality: 'friendly',
        languageStyle: 'standard',
    },
    situationId: 'daily',
    customSituation: '',
};

export const useChatStore = create<ChatStore>((set, get) => ({
    // Messages
    messages: [],
    addMessage: (message) => {
        const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        set((state) => ({
            messages: [...state.messages, { ...message, id, timestamp: Date.now() }],
        }));
        return id;
    },
    updateMessage: (id, content) => {
        set((state) => ({
            messages: state.messages.map((msg) =>
                msg.id === id ? { ...msg, content } : msg
            ),
        }));
    },
    clearMessages: () => set({ messages: [], corrections: [], compactedContext: null }),

    // Settings
    settings: DEFAULT_SETTINGS,
    updatePartnerSettings: (partner) => {
        set((state) => ({
            settings: {
                ...state.settings,
                partner: { ...state.settings.partner, ...partner },
            },
        }));
    },
    setSituation: (situationId, customSituation) => {
        set((state) => ({
            settings: {
                ...state.settings,
                situationId,
                customSituation: customSituation ?? state.settings.customSituation,
            },
        }));
    },

    // Corrections
    corrections: [],
    addCorrection: (correction) => {
        const id = `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        set((state) => ({
            corrections: [...state.corrections, { ...correction, id, timestamp: Date.now() }],
            hasUnreadCorrection: true,
        }));
    },
    clearCorrections: () => set({ corrections: [], hasUnreadCorrection: false }),

    // Compact context
    compactedContext: null,
    setCompactedContext: (context) => set({ compactedContext: context }),

    // UI State
    sidebarTab: 'settings',
    setSidebarTab: (tab) => set({ sidebarTab: tab }),
    isSidebarOpen: false,
    setSidebarOpen: (open) => set({ isSidebarOpen: open }),

    // Streaming
    isStreaming: false,
    setIsStreaming: (streaming) => set({ isStreaming: streaming }),

    // Assist mode
    assistMode: false,
    setAssistMode: (enabled) => set({ assistMode: enabled }),
    suggestions: [],
    setSuggestions: (suggestions) => set({ suggestions }),

    // Immersion mode
    immersionMode: false,
    setImmersionMode: (enabled) => set({ immersionMode: enabled }),

    // Unread corrections badge
    hasUnreadCorrection: false,
    setHasUnreadCorrection: (has) => set({ hasUnreadCorrection: has }),
}));

// Helper to build system prompt from settings
export function buildSystemPrompt(
    settings: ChatSettings,
    learningLanguage: string,
    nativeLanguage: string,
    assistMode: boolean = false
): string {
    const { partner, situationId, customSituation } = settings;

    const genderText = {
        male: 'male',
        female: 'female',
        unspecified: 'person',
    }[partner.gender];

    const relationshipText = {
        friend: 'a close friend',
        boss: 'their boss at work',
        subordinate: 'their subordinate at work',
        shopkeeper: 'a shopkeeper/service staff',
        teacher: 'their teacher',
        stranger: 'someone they just met',
    }[partner.relationship];

    const ageText = {
        older: 'older than the user',
        same: 'about the same age as the user',
        younger: 'younger than the user',
    }[partner.ageGroup];

    const personalityText = {
        friendly: 'warm and friendly',
        formal: 'polite and formal',
        casual: 'relaxed and casual',
        strict: 'strict and precise',
    }[partner.personality];

    const isTextingMode = partner.languageStyle === 'texting';

    const situation = situationId === 'custom' && customSituation
        ? customSituation.slice(0, 200)
        : SITUATION_PRESETS.find(p => p.id === situationId)?.description || 'Daily conversation';

    const languageNames: Record<string, string> = {
        en: 'English', ja: 'Japanese', ko: 'Korean', zh: 'Chinese',
        fr: 'French', es: 'Spanish', de: 'German', ru: 'Russian', vi: 'Vietnamese'
    };

    const learningLangName = languageNames[learningLanguage] || learningLanguage;
    const nativeLangName = languageNames[nativeLanguage] || nativeLanguage;

    const textingModeInstructions = isTextingMode ? `
This is texting/chat. Text like a real person:
- Use abbreviations naturally (lol, idk, omg, btw, gonna, wanna, u, r, rn, ngl, tbh etc.)
- Lowercase ok, skip punctuation sometimes, short messages
- Emojis: only if user uses them first, match their frequency
- Don't correct texting abbreviations, only actual grammar mistakes
` : '';

    return `You're chatting with someone learning ${learningLangName} (native: ${nativeLangName}).

Your character: ${genderText}, ${relationshipText}, ${ageText}, ${personalityText} personality.
Situation: ${situation}
${textingModeInstructions}
BE A REAL PERSON, NOT AN AI:
- Have opinions, preferences, moods. Say "I think...", "I like...", "Hmm...", "Actually..."
- Use filler words naturally: "well", "like", "you know", "I mean"
- React genuinely - laugh, get curious, disagree sometimes, share your own experiences
- Don't be overly helpful or eager. Real people aren't always accommodating
- Keep responses short. Real conversation isn't long paragraphs
- Sometimes ask questions back, change topics, or bring up random things
- Match the energy - if they're casual, be casual. If brief, be brief
- NO EMOJIS unless the user uses them first. If they do, match their frequency

IMPORTANT: Only check the LATEST user message for errors. Do NOT re-correct past messages that were already corrected. If the latest message has no errors, set hasError to false.

CORRECTION RULE: The "explanation" field MUST ALWAYS be written in ${nativeLangName} (the user's native language). Never explain in ${learningLangName} or any other language.

Response format (valid JSON):
${assistMode
        ? `{"reply": "your message in ${learningLangName}", "correction": {"hasError": true/false, "original": "wrong phrase", "corrected": "fixed phrase", "explanation": "explanation in ${nativeLangName} ONLY"}, "suggestions": ["suggestion 1 in ${learningLangName}", "suggestion 2", "suggestion 3"]}

suggestions: 3 natural reply options the learner could say next. Keep them simple, varied (agree/disagree/question), and appropriate for their level.`
        : `{"reply": "your message in ${learningLangName}", "correction": {"hasError": true/false, "original": "wrong phrase", "corrected": "fixed phrase", "explanation": "explanation in ${nativeLangName} ONLY"}}`
    }`;
}
