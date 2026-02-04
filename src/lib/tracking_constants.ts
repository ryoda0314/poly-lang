
export const TRACKING_EVENTS = {

    CORRECTION_REQUEST: 'correction_request',
    AUDIO_PLAY: 'audio_play',
    TEXT_COPY: 'text_copy',
    PHRASE_VIEW: 'phrase_view',
    WORD_EXPLORE: 'word_explore',
    PRONUNCIATION_RESULT: 'pronunciation_result',
    EXPLANATION_REQUEST: 'explanation_request',
    MEMO_CREATED: 'memo_created',
    MEMO_VERIFIED: 'memo_verified',
    TUTORIAL_COMPLETE: 'tutorial_complete',
    CATEGORY_SELECT: 'category_select',
    GENDER_CHANGE: 'gender_change',
    NUANCE_REFINEMENT: 'nuance_refinement',
    // API tracking events
    EXPRESSION_TRANSLATE: 'expression_translate',
    EXPRESSION_EXAMPLES: 'expression_examples',
    CHAT_MESSAGE: 'chat_message',
    DAILY_CHECKIN: 'daily_checkin',
    REWARD_CLAIMED: 'reward_claimed',
    PRONUNCIATION_CHECK: 'pronunciation_check',
} as const;

export type TrackingEventType = typeof TRACKING_EVENTS[keyof typeof TRACKING_EVENTS];
