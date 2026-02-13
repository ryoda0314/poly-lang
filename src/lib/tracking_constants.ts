
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
    // Swipe deck / flashcard events
    CARD_REVIEWED: 'card_reviewed',
    STUDY_SESSION_COMPLETE: 'study_session_complete',
    // Grammar diagnostic events
    GRAMMAR_PATTERN_STUDIED: 'grammar_pattern_studied',
    // Long text reading events
    SENTENCE_COMPLETED: 'sentence_completed',
    // Sentence analysis events
    SENTENCE_ANALYZED: 'sentence_analyzed',
    // Etymology events
    ETYMOLOGY_SEARCHED: 'etymology_searched',
    // Script learning events
    SCRIPT_CHARACTER_REVIEWED: 'script_character_reviewed',
    AI_EXERCISE_COMPLETED: 'ai_exercise_completed',
    // Slang events
    SLANG_VOTED: 'slang_voted',
    // Memo review events
    MEMO_REVIEWED: 'memo_reviewed',
    // Phrasal verb events
    PHRASAL_VERB_SEARCHED: 'phrasal_verb_searched',
    // Vocab generator events
    VOCAB_GENERATED: 'vocab_generated',
    VOCAB_CARD_REVIEWED: 'vocab_card_reviewed',
    // Vocabulary set events
    VOCABULARY_SET_CREATED: 'vocabulary_set_created',
} as const;

export type TrackingEventType = typeof TRACKING_EVENTS[keyof typeof TRACKING_EVENTS];
