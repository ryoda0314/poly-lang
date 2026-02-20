-- ============================================================
-- プラン枠 / 購入枠のクレジット分離
-- *_credits       = プラン月間枠（invoice.paid で SET）
-- extra_*_credits = コイン購入分（消費のみ、リセットなし）
-- ============================================================

-- 1. extra_* カラム追加（17種）
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS extra_audio_credits integer DEFAULT 0 NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS extra_pronunciation_credits integer DEFAULT 0 NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS extra_speaking_credits integer DEFAULT 0 NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS extra_explorer_credits integer DEFAULT 0 NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS extra_correction_credits integer DEFAULT 0 NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS extra_extraction_credits integer DEFAULT 0 NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS extra_explanation_credits integer DEFAULT 0 NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS extra_expression_credits integer DEFAULT 0 NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS extra_ipa_credits integer DEFAULT 0 NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS extra_kanji_hanja_credits integer DEFAULT 0 NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS extra_vocab_credits integer DEFAULT 0 NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS extra_grammar_credits integer DEFAULT 0 NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS extra_extension_credits integer DEFAULT 0 NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS extra_script_credits integer DEFAULT 0 NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS extra_chat_credits integer DEFAULT 0 NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS extra_sentence_credits integer DEFAULT 0 NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS extra_etymology_credits integer DEFAULT 0 NOT NULL;

-- 2. payment_transactions type 制約に subscription_credits 追加
ALTER TABLE public.payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_type_check;
ALTER TABLE public.payment_transactions
    ADD CONSTRAINT payment_transactions_type_check
    CHECK (type IN ('coin_pack', 'single_purchase', 'subscription_payment', 'subscription_credits'));

-- 3. consume_credit RPC: プラン枠優先消費 → extra 消費
CREATE OR REPLACE FUNCTION consume_credit(
    p_user_id UUID,
    p_credit_column TEXT
)
RETURNS INTEGER AS $$
DECLARE
    v_plan INTEGER;
    v_extra INTEGER;
    v_valid_columns TEXT[] := ARRAY[
        'audio_credits', 'explorer_credits', 'correction_credits', 'extraction_credits',
        'explanation_credits', 'etymology_credits', 'chat_credits', 'expression_credits',
        'vocab_credits', 'grammar_credits', 'extension_credits', 'script_credits',
        'sentence_credits', 'kanji_hanja_credits', 'ipa_credits',
        'pronunciation_credits', 'speaking_credits'
    ];
BEGIN
    IF NOT (p_credit_column = ANY(v_valid_columns)) THEN
        RAISE EXCEPTION 'Invalid credit column: %', p_credit_column;
    END IF;

    -- Lock row, read plan + extra credits
    SELECT
        CASE p_credit_column
            WHEN 'audio_credits' THEN audio_credits
            WHEN 'pronunciation_credits' THEN pronunciation_credits
            WHEN 'speaking_credits' THEN speaking_credits
            WHEN 'explorer_credits' THEN explorer_credits
            WHEN 'correction_credits' THEN correction_credits
            WHEN 'extraction_credits' THEN extraction_credits
            WHEN 'explanation_credits' THEN explanation_credits
            WHEN 'etymology_credits' THEN etymology_credits
            WHEN 'chat_credits' THEN chat_credits
            WHEN 'expression_credits' THEN expression_credits
            WHEN 'vocab_credits' THEN vocab_credits
            WHEN 'grammar_credits' THEN grammar_credits
            WHEN 'extension_credits' THEN extension_credits
            WHEN 'script_credits' THEN script_credits
            WHEN 'sentence_credits' THEN sentence_credits
            WHEN 'kanji_hanja_credits' THEN kanji_hanja_credits
            WHEN 'ipa_credits' THEN ipa_credits
            ELSE 0
        END,
        CASE p_credit_column
            WHEN 'audio_credits' THEN extra_audio_credits
            WHEN 'pronunciation_credits' THEN extra_pronunciation_credits
            WHEN 'speaking_credits' THEN extra_speaking_credits
            WHEN 'explorer_credits' THEN extra_explorer_credits
            WHEN 'correction_credits' THEN extra_correction_credits
            WHEN 'extraction_credits' THEN extra_extraction_credits
            WHEN 'explanation_credits' THEN extra_explanation_credits
            WHEN 'etymology_credits' THEN extra_etymology_credits
            WHEN 'chat_credits' THEN extra_chat_credits
            WHEN 'expression_credits' THEN extra_expression_credits
            WHEN 'vocab_credits' THEN extra_vocab_credits
            WHEN 'grammar_credits' THEN extra_grammar_credits
            WHEN 'extension_credits' THEN extra_extension_credits
            WHEN 'script_credits' THEN extra_script_credits
            WHEN 'sentence_credits' THEN extra_sentence_credits
            WHEN 'kanji_hanja_credits' THEN extra_kanji_hanja_credits
            WHEN 'ipa_credits' THEN extra_ipa_credits
            ELSE 0
        END
    INTO v_plan, v_extra
    FROM profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF (COALESCE(v_plan, 0) + COALESCE(v_extra, 0)) <= 0 THEN
        RETURN -1;
    END IF;

    IF COALESCE(v_plan, 0) > 0 THEN
        -- プラン枠から消費
        UPDATE profiles SET
            audio_credits = CASE WHEN p_credit_column = 'audio_credits' THEN GREATEST(audio_credits - 1, 0) ELSE audio_credits END,
            pronunciation_credits = CASE WHEN p_credit_column = 'pronunciation_credits' THEN GREATEST(pronunciation_credits - 1, 0) ELSE pronunciation_credits END,
            speaking_credits = CASE WHEN p_credit_column = 'speaking_credits' THEN GREATEST(speaking_credits - 1, 0) ELSE speaking_credits END,
            explorer_credits = CASE WHEN p_credit_column = 'explorer_credits' THEN GREATEST(explorer_credits - 1, 0) ELSE explorer_credits END,
            correction_credits = CASE WHEN p_credit_column = 'correction_credits' THEN GREATEST(correction_credits - 1, 0) ELSE correction_credits END,
            extraction_credits = CASE WHEN p_credit_column = 'extraction_credits' THEN GREATEST(extraction_credits - 1, 0) ELSE extraction_credits END,
            explanation_credits = CASE WHEN p_credit_column = 'explanation_credits' THEN GREATEST(explanation_credits - 1, 0) ELSE explanation_credits END,
            etymology_credits = CASE WHEN p_credit_column = 'etymology_credits' THEN GREATEST(etymology_credits - 1, 0) ELSE etymology_credits END,
            chat_credits = CASE WHEN p_credit_column = 'chat_credits' THEN GREATEST(chat_credits - 1, 0) ELSE chat_credits END,
            expression_credits = CASE WHEN p_credit_column = 'expression_credits' THEN GREATEST(expression_credits - 1, 0) ELSE expression_credits END,
            vocab_credits = CASE WHEN p_credit_column = 'vocab_credits' THEN GREATEST(vocab_credits - 1, 0) ELSE vocab_credits END,
            grammar_credits = CASE WHEN p_credit_column = 'grammar_credits' THEN GREATEST(grammar_credits - 1, 0) ELSE grammar_credits END,
            extension_credits = CASE WHEN p_credit_column = 'extension_credits' THEN GREATEST(extension_credits - 1, 0) ELSE extension_credits END,
            script_credits = CASE WHEN p_credit_column = 'script_credits' THEN GREATEST(script_credits - 1, 0) ELSE script_credits END,
            sentence_credits = CASE WHEN p_credit_column = 'sentence_credits' THEN GREATEST(sentence_credits - 1, 0) ELSE sentence_credits END,
            kanji_hanja_credits = CASE WHEN p_credit_column = 'kanji_hanja_credits' THEN GREATEST(kanji_hanja_credits - 1, 0) ELSE kanji_hanja_credits END,
            ipa_credits = CASE WHEN p_credit_column = 'ipa_credits' THEN GREATEST(ipa_credits - 1, 0) ELSE ipa_credits END
        WHERE id = p_user_id;
    ELSE
        -- 購入枠から消費
        UPDATE profiles SET
            extra_audio_credits = CASE WHEN p_credit_column = 'audio_credits' THEN GREATEST(extra_audio_credits - 1, 0) ELSE extra_audio_credits END,
            extra_pronunciation_credits = CASE WHEN p_credit_column = 'pronunciation_credits' THEN GREATEST(extra_pronunciation_credits - 1, 0) ELSE extra_pronunciation_credits END,
            extra_speaking_credits = CASE WHEN p_credit_column = 'speaking_credits' THEN GREATEST(extra_speaking_credits - 1, 0) ELSE extra_speaking_credits END,
            extra_explorer_credits = CASE WHEN p_credit_column = 'explorer_credits' THEN GREATEST(extra_explorer_credits - 1, 0) ELSE extra_explorer_credits END,
            extra_correction_credits = CASE WHEN p_credit_column = 'correction_credits' THEN GREATEST(extra_correction_credits - 1, 0) ELSE extra_correction_credits END,
            extra_extraction_credits = CASE WHEN p_credit_column = 'extraction_credits' THEN GREATEST(extra_extraction_credits - 1, 0) ELSE extra_extraction_credits END,
            extra_explanation_credits = CASE WHEN p_credit_column = 'explanation_credits' THEN GREATEST(extra_explanation_credits - 1, 0) ELSE extra_explanation_credits END,
            extra_etymology_credits = CASE WHEN p_credit_column = 'etymology_credits' THEN GREATEST(extra_etymology_credits - 1, 0) ELSE extra_etymology_credits END,
            extra_chat_credits = CASE WHEN p_credit_column = 'chat_credits' THEN GREATEST(extra_chat_credits - 1, 0) ELSE extra_chat_credits END,
            extra_expression_credits = CASE WHEN p_credit_column = 'expression_credits' THEN GREATEST(extra_expression_credits - 1, 0) ELSE extra_expression_credits END,
            extra_vocab_credits = CASE WHEN p_credit_column = 'vocab_credits' THEN GREATEST(extra_vocab_credits - 1, 0) ELSE extra_vocab_credits END,
            extra_grammar_credits = CASE WHEN p_credit_column = 'grammar_credits' THEN GREATEST(extra_grammar_credits - 1, 0) ELSE extra_grammar_credits END,
            extra_extension_credits = CASE WHEN p_credit_column = 'extension_credits' THEN GREATEST(extra_extension_credits - 1, 0) ELSE extra_extension_credits END,
            extra_script_credits = CASE WHEN p_credit_column = 'script_credits' THEN GREATEST(extra_script_credits - 1, 0) ELSE extra_script_credits END,
            extra_sentence_credits = CASE WHEN p_credit_column = 'sentence_credits' THEN GREATEST(extra_sentence_credits - 1, 0) ELSE extra_sentence_credits END,
            extra_kanji_hanja_credits = CASE WHEN p_credit_column = 'kanji_hanja_credits' THEN GREATEST(extra_kanji_hanja_credits - 1, 0) ELSE extra_kanji_hanja_credits END,
            extra_ipa_credits = CASE WHEN p_credit_column = 'ipa_credits' THEN GREATEST(extra_ipa_credits - 1, 0) ELSE extra_ipa_credits END
        WHERE id = p_user_id;
    END IF;

    RETURN (COALESCE(v_plan, 0) + COALESCE(v_extra, 0)) - 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
