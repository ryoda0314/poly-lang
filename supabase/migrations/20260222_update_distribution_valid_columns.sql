-- ============================================================
-- Update claim_distribution RPC to support all 17 credit types
-- Previously only supported: coins, audio, explorer, correction, explanation, extraction
-- ============================================================

CREATE OR REPLACE FUNCTION claim_distribution(
  p_event_id uuid,
  p_user_id uuid
)
RETURNS jsonb AS $$
DECLARE
  v_event record;
  v_period_key text;
  v_reward record;
  v_rewards jsonb;
  v_col text;
  v_amt integer;
  v_valid_columns text[] := array[
    'coins',
    'audio_credits', 'pronunciation_credits', 'speaking_credits',
    'explorer_credits', 'correction_credits', 'extraction_credits',
    'explanation_credits', 'etymology_credits', 'chat_credits',
    'expression_credits', 'vocab_credits', 'grammar_credits',
    'extension_credits', 'script_credits', 'sentence_credits',
    'kanji_hanja_credits', 'ipa_credits'
  ];
BEGIN
  -- Lock the event row (shared lock) and fetch
  SELECT * INTO v_event
  FROM distribution_events
  WHERE id = p_event_id
  FOR SHARE;

  IF v_event IS NULL THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  IF v_event.status != 'active' THEN
    RAISE EXCEPTION 'Event is not active (status: %)', v_event.status;
  END IF;

  -- Check expiry
  IF v_event.expires_at IS NOT NULL AND v_event.expires_at <= now() THEN
    RAISE EXCEPTION 'Event has expired';
  END IF;

  -- Compute period_key based on recurrence
  CASE v_event.recurrence
    WHEN 'once' THEN
      v_period_key := 'once';
    WHEN 'daily' THEN
      v_period_key := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD');
    WHEN 'weekly' THEN
      v_period_key := to_char(now() AT TIME ZONE 'UTC', 'IYYY-"W"IW');
    WHEN 'monthly' THEN
      v_period_key := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM');
    ELSE
      RAISE EXCEPTION 'Unknown recurrence: %', v_event.recurrence;
  END CASE;

  -- Check if already claimed for this period
  IF EXISTS (
    SELECT 1 FROM distribution_claims
    WHERE event_id = p_event_id
      AND user_id = p_user_id
      AND period_key = v_period_key
  ) THEN
    RAISE EXCEPTION 'Already claimed for this period';
  END IF;

  v_rewards := v_event.rewards;

  -- Grant each reward
  FOR v_reward IN SELECT value FROM jsonb_array_elements(v_rewards)
  LOOP
    v_col := v_reward.value ->> 'type';
    v_amt := (v_reward.value ->> 'amount')::integer;

    -- Validate column name (allowlist to prevent SQL injection)
    IF NOT (v_col = ANY(v_valid_columns)) THEN
      RAISE EXCEPTION 'Invalid reward type: %', v_col;
    END IF;

    IF v_amt IS NULL OR v_amt <= 0 THEN
      RAISE EXCEPTION 'Invalid reward amount for %: %', v_col, v_amt;
    END IF;

    -- Increment the user's profile column
    EXECUTE format(
      'UPDATE profiles SET %I = COALESCE(%I, 0) + $1 WHERE id = $2',
      v_col, v_col
    ) USING v_amt, p_user_id;
  END LOOP;

  -- Insert claim record
  INSERT INTO distribution_claims (event_id, user_id, period_key, rewards_granted)
  VALUES (p_event_id, p_user_id, v_period_key, v_rewards);

  -- Increment claim_count on the event
  UPDATE distribution_events
  SET claim_count = claim_count + 1
  WHERE id = p_event_id;

  RETURN v_rewards;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- Insert beta tester distribution event
-- Grants a generous set of credits for testing all features
-- ============================================================

INSERT INTO distribution_events (
  title, description, rewards, recurrence, scheduled_at, expires_at, status,
  title_i18n, description_i18n
) VALUES (
  'ベータテスト報酬',
  '全機能をテストするためのクレジットパックです。ご協力ありがとうございます！',
  '[
    {"type": "coins",                "amount": 250},
    {"type": "audio_credits",        "amount": 100},
    {"type": "pronunciation_credits","amount": 100},
    {"type": "speaking_credits",     "amount": 50},
    {"type": "explorer_credits",     "amount": 100},
    {"type": "correction_credits",   "amount": 50},
    {"type": "chat_credits",         "amount": 50},
    {"type": "explanation_credits",  "amount": 25},
    {"type": "expression_credits",   "amount": 40},
    {"type": "extraction_credits",   "amount": 15},
    {"type": "etymology_credits",    "amount": 10},
    {"type": "vocab_credits",        "amount": 100},
    {"type": "grammar_credits",      "amount": 25},
    {"type": "extension_credits",    "amount": 50},
    {"type": "script_credits",       "amount": 250},
    {"type": "sentence_credits",     "amount": 8},
    {"type": "kanji_hanja_credits",  "amount": 150},
    {"type": "ipa_credits",          "amount": 100}
  ]'::jsonb,
  'once',
  now(),
  now() + interval '30 days',
  'active',
  '{"ja": "ベータテスト報酬", "en": "Beta Test Reward", "ko": "베타 테스트 보상", "zh": "测试奖励", "fr": "Récompense de bêta-test", "es": "Recompensa de prueba beta", "de": "Beta-Test Belohnung", "ru": "Награда за бета-тест", "vi": "Phần thưởng thử nghiệm", "fi": "Beta-testipalkinto"}'::jsonb,
  '{"ja": "全機能をテストするためのクレジットパックです。ご協力ありがとうございます！", "en": "A credit pack for testing all features. Thank you for your help!", "ko": "모든 기능을 테스트하기 위한 크레딧 팩입니다. 협조해 주셔서 감사합니다!", "zh": "用于测试所有功能的信用包。感谢您的帮助！", "fr": "Un pack de crédits pour tester toutes les fonctionnalités. Merci pour votre aide !", "es": "Un paquete de créditos para probar todas las funciones. ¡Gracias por su ayuda!", "de": "Ein Kreditpaket zum Testen aller Funktionen. Vielen Dank für Ihre Hilfe!", "ru": "Пакет кредитов для тестирования всех функций. Спасибо за вашу помощь!", "vi": "Gói tín dụng để thử nghiệm tất cả tính năng. Cảm ơn sự hợp tác của bạn!", "fi": "Krediittipaketti kaikkien ominaisuuksien testaamiseen. Kiitos avustasi!"}'::jsonb
);
