-- ============================================================
-- Security Hardening Migration
-- Addresses findings from security audit 2026-02-15
-- ============================================================

-- ============================================================
-- 1. Audit Log Table
-- Track security-relevant events for incident response
-- ============================================================
CREATE TABLE IF NOT EXISTS security_audit_log (
    id BIGSERIAL PRIMARY KEY,
    event_type TEXT NOT NULL,          -- 'email_check', 'role_escalation_attempt', 'admin_action', 'claim'
    actor_id UUID,                     -- user who performed the action (null for anonymous)
    target_id UUID,                    -- affected user/resource (if applicable)
    detail JSONB DEFAULT '{}'::jsonb,  -- event-specific metadata
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_audit_event_type ON security_audit_log(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_actor ON security_audit_log(actor_id, created_at DESC);

ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only service_role can read/write audit logs
DROP POLICY IF EXISTS "Service role only" ON security_audit_log;
CREATE POLICY "Service role only" ON security_audit_log
    FOR ALL USING (false);

-- ============================================================
-- 2. Fix claim_distribution(): Replace dynamic SQL with CASE
--    Also add max amount cap (10000 per reward)
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
  v_max_reward_amount constant integer := 10000;
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
    RAISE EXCEPTION 'Event is not active';
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
      RAISE EXCEPTION 'Unknown recurrence';
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

  -- Grant each reward using CASE (no dynamic SQL)
  FOR v_reward IN SELECT value FROM jsonb_array_elements(v_rewards)
  LOOP
    v_col := v_reward.value ->> 'type';
    v_amt := (v_reward.value ->> 'amount')::integer;

    IF v_amt IS NULL OR v_amt <= 0 THEN
      RAISE EXCEPTION 'Invalid reward amount';
    END IF;

    -- Cap maximum reward amount to prevent accidental over-granting
    IF v_amt > v_max_reward_amount THEN
      RAISE EXCEPTION 'Reward amount exceeds maximum allowed (%)', v_max_reward_amount;
    END IF;

    -- Static column updates instead of dynamic SQL
    CASE v_col
      WHEN 'coins' THEN
        UPDATE profiles SET coins = COALESCE(coins, 0) + v_amt WHERE id = p_user_id;
      WHEN 'audio_credits' THEN
        UPDATE profiles SET audio_credits = COALESCE(audio_credits, 0) + v_amt WHERE id = p_user_id;
      WHEN 'explorer_credits' THEN
        UPDATE profiles SET explorer_credits = COALESCE(explorer_credits, 0) + v_amt WHERE id = p_user_id;
      WHEN 'correction_credits' THEN
        UPDATE profiles SET correction_credits = COALESCE(correction_credits, 0) + v_amt WHERE id = p_user_id;
      WHEN 'explanation_credits' THEN
        UPDATE profiles SET explanation_credits = COALESCE(explanation_credits, 0) + v_amt WHERE id = p_user_id;
      WHEN 'extraction_credits' THEN
        UPDATE profiles SET extraction_credits = COALESCE(extraction_credits, 0) + v_amt WHERE id = p_user_id;
      ELSE
        RAISE EXCEPTION 'Invalid reward type: %', v_col;
    END CASE;
  END LOOP;

  -- Insert claim record
  INSERT INTO distribution_claims (event_id, user_id, period_key, rewards_granted)
  VALUES (p_event_id, p_user_id, v_period_key, v_rewards);

  -- Increment claim_count on the event
  UPDATE distribution_events
  SET claim_count = claim_count + 1
  WHERE id = p_event_id;

  -- Audit log
  INSERT INTO security_audit_log (event_type, actor_id, detail)
  VALUES ('claim', p_user_id, jsonb_build_object('event_id', p_event_id, 'rewards', v_rewards));

  RETURN v_rewards;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. Fix slang_terms RLS: Add created_by, restrict mutations
-- ============================================================

-- Add created_by column if not exists
ALTER TABLE public.slang_terms
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Drop old overly-permissive policies
DROP POLICY IF EXISTS "Authenticated can insert slang" ON public.slang_terms;
DROP POLICY IF EXISTS "Authenticated can update slang" ON public.slang_terms;
DROP POLICY IF EXISTS "Authenticated can delete slang" ON public.slang_terms;
DROP POLICY IF EXISTS "Anyone can suggest slang" ON public.slang_terms;

-- Authenticated users can insert their own slang (pending status only)
DROP POLICY IF EXISTS "Authenticated can insert own slang" ON public.slang_terms;
CREATE POLICY "Authenticated can insert own slang"
  ON public.slang_terms FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = created_by
    AND status = 'pending'
  );

-- Users can update only their own pending slang, admins can update any
DROP POLICY IF EXISTS "Users can update own pending slang" ON public.slang_terms;
CREATE POLICY "Users can update own pending slang"
  ON public.slang_terms FOR UPDATE
  USING (
    (auth.uid() = created_by AND status = 'pending')
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    (auth.uid() = created_by AND status = 'pending')
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Only admins can delete slang
DROP POLICY IF EXISTS "Admins can delete slang" ON public.slang_terms;
CREATE POLICY "Admins can delete slang"
  ON public.slang_terms FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 4. Fix slang_votes: Restrict vote visibility + race condition
-- ============================================================

-- Drop old overly-permissive policy
DROP POLICY IF EXISTS "Users can view all votes" ON slang_votes;

-- Users can only see their own votes
DROP POLICY IF EXISTS "Users can view own votes" ON slang_votes;
CREATE POLICY "Users can view own votes" ON slang_votes
  FOR SELECT USING (auth.uid() = user_id);

-- Add WITH CHECK to vote update
DROP POLICY IF EXISTS "Users can update their own votes" ON slang_votes;
CREATE POLICY "Users can update their own votes" ON slang_votes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fix vote count trigger: use FOR UPDATE to prevent race conditions
CREATE OR REPLACE FUNCTION update_slang_vote_counts()
RETURNS TRIGGER AS $$
DECLARE
  v_term_row slang_terms%ROWTYPE;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Lock the row to prevent race conditions
    SELECT * INTO v_term_row FROM slang_terms WHERE id = NEW.slang_term_id FOR UPDATE;
    IF NEW.vote = true THEN
      UPDATE slang_terms SET vote_count_up = COALESCE(vote_count_up, 0) + 1 WHERE id = NEW.slang_term_id;
    ELSE
      UPDATE slang_terms SET vote_count_down = COALESCE(vote_count_down, 0) + 1 WHERE id = NEW.slang_term_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    SELECT * INTO v_term_row FROM slang_terms WHERE id = NEW.slang_term_id FOR UPDATE;
    IF OLD.vote = true AND NEW.vote = false THEN
      UPDATE slang_terms SET vote_count_up = GREATEST(COALESCE(vote_count_up, 0) - 1, 0), vote_count_down = COALESCE(vote_count_down, 0) + 1 WHERE id = NEW.slang_term_id;
    ELSIF OLD.vote = false AND NEW.vote = true THEN
      UPDATE slang_terms SET vote_count_up = COALESCE(vote_count_up, 0) + 1, vote_count_down = GREATEST(COALESCE(vote_count_down, 0) - 1, 0) WHERE id = NEW.slang_term_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT * INTO v_term_row FROM slang_terms WHERE id = OLD.slang_term_id FOR UPDATE;
    IF OLD.vote = true THEN
      UPDATE slang_terms SET vote_count_up = GREATEST(COALESCE(vote_count_up, 0) - 1, 0) WHERE id = OLD.slang_term_id;
    ELSE
      UPDATE slang_terms SET vote_count_down = GREATEST(COALESCE(vote_count_down, 0) - 1, 0) WHERE id = OLD.slang_term_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. Add WITH CHECK to UPDATE policies (prevent user_id swap)
-- ============================================================

-- phrase_set_item_reviews
DROP POLICY IF EXISTS "Users can update their own reviews" ON phrase_set_item_reviews;
CREATE POLICY "Users can update their own reviews"
    ON phrase_set_item_reviews FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- study_sessions
DROP POLICY IF EXISTS "Users can update their own sessions" ON study_sessions;
CREATE POLICY "Users can update their own sessions"
    ON study_sessions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- phrase_set_progress
DROP POLICY IF EXISTS "Users can update their own progress" ON phrase_set_progress;
CREATE POLICY "Users can update their own progress"
    ON phrase_set_progress FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- user_learning_stats
DROP POLICY IF EXISTS "Users can update their own stats" ON user_learning_stats;
CREATE POLICY "Users can update their own stats"
    ON user_learning_stats FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- user_sentence_history
DROP POLICY IF EXISTS "Users can update own history" ON user_sentence_history;
CREATE POLICY "Users can update own history"
    ON user_sentence_history FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- long_text_sentences
DROP POLICY IF EXISTS "Users can update sentences for own texts" ON long_text_sentences;
CREATE POLICY "Users can update sentences for own texts"
    ON long_text_sentences FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM long_texts
            WHERE long_texts.id = long_text_sentences.long_text_id
            AND long_texts.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM long_texts
            WHERE long_texts.id = long_text_sentences.long_text_id
            AND long_texts.user_id = auth.uid()
        )
    );

-- long_texts (add WITH CHECK for update)
DROP POLICY IF EXISTS "Users can update own long texts" ON long_texts;
CREATE POLICY "Users can update own long texts"
    ON long_texts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 6. Restrict sentence_analysis_cache writes to service_role
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can insert cache" ON sentence_analysis_cache;
DROP POLICY IF EXISTS "Authenticated users can update cache" ON sentence_analysis_cache;

-- Only service_role can write to shared cache
-- (Server actions using createAdminClient will bypass RLS)
-- Authenticated users can still read
DROP POLICY IF EXISTS "Service role can insert cache" ON sentence_analysis_cache;
CREATE POLICY "Service role can insert cache"
    ON sentence_analysis_cache FOR INSERT
    WITH CHECK (false);

DROP POLICY IF EXISTS "Service role can update cache" ON sentence_analysis_cache;
CREATE POLICY "Service role can update cache"
    ON sentence_analysis_cache FOR UPDATE
    USING (false);

-- ============================================================
-- 7. Fix get_localized_text: IMMUTABLE -> STABLE
-- ============================================================
CREATE OR REPLACE FUNCTION get_localized_text(
  p_i18n jsonb,
  p_fallback text,
  p_locale text default 'ja'
)
RETURNS text AS $$
BEGIN
  IF p_i18n ? p_locale AND (p_i18n ->> p_locale) IS NOT NULL AND (p_i18n ->> p_locale) != '' THEN
    RETURN p_i18n ->> p_locale;
  END IF;

  IF p_locale != 'ja' AND p_i18n ? 'ja' AND (p_i18n ->> 'ja') IS NOT NULL AND (p_i18n ->> 'ja') != '' THEN
    RETURN p_i18n ->> 'ja';
  END IF;

  IF p_locale != 'en' AND p_i18n ? 'en' AND (p_i18n ->> 'en') IS NOT NULL AND (p_i18n ->> 'en') != '' THEN
    RETURN p_i18n ->> 'en';
  END IF;

  RETURN p_fallback;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- 8. Add ease_factor upper bound constraint
-- ============================================================
ALTER TABLE phrase_set_item_reviews
  DROP CONSTRAINT IF EXISTS phrase_set_item_reviews_ease_factor_check;

ALTER TABLE phrase_set_item_reviews
  ADD CONSTRAINT phrase_set_item_reviews_ease_factor_check
  CHECK (ease_factor >= 1.3 AND ease_factor <= 5.0);

-- ============================================================
-- 9. Add audit logging to role escalation prevention trigger
-- ============================================================
CREATE OR REPLACE FUNCTION prevent_role_self_escalation()
RETURNS trigger AS $$
BEGIN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        -- Log the attempt before rejecting
        INSERT INTO security_audit_log (event_type, actor_id, target_id, detail)
        VALUES (
            'role_escalation_attempt',
            auth.uid(),
            NEW.id,
            jsonb_build_object('old_role', OLD.role, 'attempted_role', NEW.role)
        );
        RAISE EXCEPTION 'role column cannot be modified';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 10. Add image_data cleanup function
--     Clears image_data after job completes to save storage
-- ============================================================
CREATE OR REPLACE FUNCTION clear_extraction_image_data()
RETURNS trigger AS $$
BEGIN
    IF NEW.status IN ('completed', 'failed') AND OLD.status NOT IN ('completed', 'failed') THEN
        NEW.image_data := '';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_clear_extraction_image ON extraction_jobs;
CREATE TRIGGER trigger_clear_extraction_image
    BEFORE UPDATE ON extraction_jobs
    FOR EACH ROW
    EXECUTE FUNCTION clear_extraction_image_data();

-- ============================================================
-- 11. Atomic daily usage increment (prevents race conditions)
--     Returns true if increment succeeded, false if limit reached
-- ============================================================
CREATE OR REPLACE FUNCTION increment_daily_usage(
    p_user_id UUID,
    p_date DATE,
    p_column TEXT,
    p_limit INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current INTEGER;
    v_valid_columns TEXT[] := ARRAY[
        'audio_count', 'explorer_count', 'correction_count', 'extraction_count',
        'explanation_count', 'etymology_count', 'chat_count', 'expression_count',
        'vocab_count', 'grammar_count', 'extension_count', 'script_count',
        'sentence_count', 'kanji_hanja_count', 'ipa_count'
    ];
BEGIN
    -- Validate column name (prevent SQL injection)
    IF NOT (p_column = ANY(v_valid_columns)) THEN
        RAISE EXCEPTION 'Invalid usage column: %', p_column;
    END IF;

    -- Insert row if not exists (all counts default to 0)
    INSERT INTO daily_usage (user_id, date)
    VALUES (p_user_id, p_date)
    ON CONFLICT (user_id, date) DO NOTHING;

    -- Atomic: read current value with row lock, check limit, then increment
    -- Uses CASE to select the right column without dynamic SQL
    SELECT CASE p_column
        WHEN 'audio_count' THEN audio_count
        WHEN 'explorer_count' THEN explorer_count
        WHEN 'correction_count' THEN correction_count
        WHEN 'extraction_count' THEN extraction_count
        WHEN 'explanation_count' THEN explanation_count
        WHEN 'etymology_count' THEN etymology_count
        WHEN 'chat_count' THEN chat_count
        WHEN 'expression_count' THEN expression_count
        WHEN 'vocab_count' THEN vocab_count
        WHEN 'grammar_count' THEN grammar_count
        WHEN 'extension_count' THEN extension_count
        WHEN 'script_count' THEN script_count
        WHEN 'sentence_count' THEN sentence_count
        WHEN 'kanji_hanja_count' THEN kanji_hanja_count
        WHEN 'ipa_count' THEN ipa_count
        ELSE 0
    END INTO v_current
    FROM daily_usage
    WHERE user_id = p_user_id AND date = p_date
    FOR UPDATE;

    -- Check if limit already reached
    IF v_current >= p_limit THEN
        RETURN FALSE;
    END IF;

    -- Increment the specific column using CASE (no dynamic SQL)
    UPDATE daily_usage SET
        audio_count = CASE WHEN p_column = 'audio_count' THEN audio_count + 1 ELSE audio_count END,
        explorer_count = CASE WHEN p_column = 'explorer_count' THEN explorer_count + 1 ELSE explorer_count END,
        correction_count = CASE WHEN p_column = 'correction_count' THEN correction_count + 1 ELSE correction_count END,
        extraction_count = CASE WHEN p_column = 'extraction_count' THEN extraction_count + 1 ELSE extraction_count END,
        explanation_count = CASE WHEN p_column = 'explanation_count' THEN explanation_count + 1 ELSE explanation_count END,
        etymology_count = CASE WHEN p_column = 'etymology_count' THEN etymology_count + 1 ELSE etymology_count END,
        chat_count = CASE WHEN p_column = 'chat_count' THEN chat_count + 1 ELSE chat_count END,
        expression_count = CASE WHEN p_column = 'expression_count' THEN expression_count + 1 ELSE expression_count END,
        vocab_count = CASE WHEN p_column = 'vocab_count' THEN vocab_count + 1 ELSE vocab_count END,
        grammar_count = CASE WHEN p_column = 'grammar_count' THEN grammar_count + 1 ELSE grammar_count END,
        extension_count = CASE WHEN p_column = 'extension_count' THEN extension_count + 1 ELSE extension_count END,
        script_count = CASE WHEN p_column = 'script_count' THEN script_count + 1 ELSE script_count END,
        sentence_count = CASE WHEN p_column = 'sentence_count' THEN sentence_count + 1 ELSE sentence_count END,
        kanji_hanja_count = CASE WHEN p_column = 'kanji_hanja_count' THEN kanji_hanja_count + 1 ELSE kanji_hanja_count END,
        ipa_count = CASE WHEN p_column = 'ipa_count' THEN ipa_count + 1 ELSE ipa_count END
    WHERE user_id = p_user_id AND date = p_date;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 12. Add WITH CHECK to remaining UPDATE policies
--     (user_long_text_progress, user_login_days, user_streaks)
-- ============================================================

-- user_long_text_progress
DROP POLICY IF EXISTS "Users can update own progress" ON user_long_text_progress;
CREATE POLICY "Users can update own progress"
    ON user_long_text_progress FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- user_login_days
DROP POLICY IF EXISTS "Users can update own login days" ON user_login_days;
CREATE POLICY "Users can update own login days"
    ON user_login_days FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- user_streaks
DROP POLICY IF EXISTS "Users can update own streaks" ON user_streaks;
CREATE POLICY "Users can update own streaks"
    ON user_streaks FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 13. Restrict cache table writes to service_role only
--     (authenticated users can still READ via existing policies)
-- ============================================================

-- etymology_entries (skip if table doesn't exist)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'etymology_entries') THEN
        EXECUTE 'DROP POLICY IF EXISTS "System can insert etymology" ON etymology_entries';
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated can insert etymology" ON etymology_entries';
        EXECUTE 'CREATE POLICY "Service role can insert etymology" ON etymology_entries FOR INSERT WITH CHECK (false)';
        EXECUTE 'DROP POLICY IF EXISTS "System can update etymology" ON etymology_entries';
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated can update etymology" ON etymology_entries';
        EXECUTE 'CREATE POLICY "Service role can update etymology" ON etymology_entries FOR UPDATE USING (false)';
    END IF;
END $$;

-- etymology_word_parts (skip if table doesn't exist)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'etymology_word_parts') THEN
        EXECUTE 'DROP POLICY IF EXISTS "System can insert word parts" ON etymology_word_parts';
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated can insert word parts" ON etymology_word_parts';
        EXECUTE 'CREATE POLICY "Service role can insert word parts" ON etymology_word_parts FOR INSERT WITH CHECK (false)';
        EXECUTE 'DROP POLICY IF EXISTS "System can update word parts" ON etymology_word_parts';
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated can update word parts" ON etymology_word_parts';
        EXECUTE 'CREATE POLICY "Service role can update word parts" ON etymology_word_parts FOR UPDATE USING (false)';
    END IF;
END $$;

-- etymology_derivations (skip if table doesn't exist)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'etymology_derivations') THEN
        EXECUTE 'DROP POLICY IF EXISTS "System can insert derivations" ON etymology_derivations';
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated can insert derivations" ON etymology_derivations';
        EXECUTE 'CREATE POLICY "Service role can insert derivations" ON etymology_derivations FOR INSERT WITH CHECK (false)';
        EXECUTE 'DROP POLICY IF EXISTS "System can update derivations" ON etymology_derivations';
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated can update derivations" ON etymology_derivations';
        EXECUTE 'CREATE POLICY "Service role can update derivations" ON etymology_derivations FOR UPDATE USING (false)';
    END IF;
END $$;

-- bible_verse_translations (skip if table doesn't exist)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bible_verse_translations') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can insert translations" ON bible_verse_translations';
        EXECUTE 'DROP POLICY IF EXISTS "Anyone can insert translations" ON bible_verse_translations';
        EXECUTE 'CREATE POLICY "Service role can insert translations" ON bible_verse_translations FOR INSERT WITH CHECK (false)';
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can update translations" ON bible_verse_translations';
        EXECUTE 'CREATE POLICY "Service role can update translations" ON bible_verse_translations FOR UPDATE USING (false)';
    END IF;
END $$;

-- phrasal_verb_entries (skip if table doesn't exist)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'phrasal_verb_entries') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can insert phrasal verbs" ON phrasal_verb_entries';
        EXECUTE 'DROP POLICY IF EXISTS "Anyone can insert phrasal verbs" ON phrasal_verb_entries';
        EXECUTE 'CREATE POLICY "Service role can insert phrasal verbs" ON phrasal_verb_entries FOR INSERT WITH CHECK (false)';
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can update phrasal verbs" ON phrasal_verb_entries';
        EXECUTE 'CREATE POLICY "Service role can update phrasal verbs" ON phrasal_verb_entries FOR UPDATE USING (false)';
    END IF;
END $$;

-- phrasal_verb_explorer (skip if table doesn't exist)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'phrasal_verb_explorer') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can insert phrasal verb explorer" ON phrasal_verb_explorer';
        EXECUTE 'DROP POLICY IF EXISTS "Anyone can insert phrasal verb explorer" ON phrasal_verb_explorer';
        EXECUTE 'CREATE POLICY "Service role can insert phrasal verb explorer" ON phrasal_verb_explorer FOR INSERT WITH CHECK (false)';
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can update phrasal verb explorer" ON phrasal_verb_explorer';
        EXECUTE 'CREATE POLICY "Service role can update phrasal verb explorer" ON phrasal_verb_explorer FOR UPDATE USING (false)';
    END IF;
END $$;

-- furigana_cache (skip if table doesn't exist)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'furigana_cache') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Allow service role insert" ON furigana_cache';
        EXECUTE 'DROP POLICY IF EXISTS "Allow authenticated insert" ON furigana_cache';
        EXECUTE 'DROP POLICY IF EXISTS "Anyone can insert furigana" ON furigana_cache';
        EXECUTE 'CREATE POLICY "Service role can insert furigana" ON furigana_cache FOR INSERT WITH CHECK (false)';
        EXECUTE 'DROP POLICY IF EXISTS "Allow service role update" ON furigana_cache';
        EXECUTE 'CREATE POLICY "Service role can update furigana" ON furigana_cache FOR UPDATE USING (false)';
    END IF;
END $$;

-- ============================================================
-- 14. Atomic credit consumption RPC
--     Prevents double-spend via SELECT ... FOR UPDATE
-- ============================================================
CREATE OR REPLACE FUNCTION consume_credit(
    p_user_id UUID,
    p_credit_column TEXT
)
RETURNS INTEGER AS $$
DECLARE
    v_current INTEGER;
    v_valid_columns TEXT[] := ARRAY[
        'audio_credits', 'explorer_credits', 'correction_credits', 'extraction_credits',
        'explanation_credits', 'etymology_credits', 'chat_credits', 'expression_credits',
        'vocab_credits', 'grammar_credits', 'extension_credits', 'script_credits',
        'sentence_credits', 'kanji_hanja_credits', 'ipa_credits'
    ];
BEGIN
    -- Validate column name
    IF NOT (p_credit_column = ANY(v_valid_columns)) THEN
        RAISE EXCEPTION 'Invalid credit column: %', p_credit_column;
    END IF;

    -- Lock the row and read current credits
    SELECT CASE p_credit_column
        WHEN 'audio_credits' THEN audio_credits
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
    END INTO v_current
    FROM profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF v_current IS NULL OR v_current <= 0 THEN
        RETURN -1;  -- No credits available
    END IF;

    -- Decrement using CASE (no dynamic SQL)
    UPDATE profiles SET
        audio_credits = CASE WHEN p_credit_column = 'audio_credits' THEN GREATEST(audio_credits - 1, 0) ELSE audio_credits END,
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

    RETURN v_current - 1;  -- Return new balance
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 15. Add WITH CHECK to remaining UPDATE policies
--     (user_vocabulary, vocab_generation_sessions, grammar_diagnostic_sessions,
--      grammar_patterns, script_practice_sessions, phrase_sets,
--      phrase_set_items, extraction_jobs)
-- ============================================================

-- user_vocabulary
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_vocabulary') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Users can update own vocabulary" ON user_vocabulary';
        EXECUTE 'CREATE POLICY "Users can update own vocabulary" ON user_vocabulary FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
    END IF;
END $$;

-- vocab_generation_sessions
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'vocab_generation_sessions') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Users can update own sessions" ON vocab_generation_sessions';
        EXECUTE 'CREATE POLICY "Users can update own sessions" ON vocab_generation_sessions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
    END IF;
END $$;

-- grammar_diagnostic_sessions
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'grammar_diagnostic_sessions') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Users can update own sessions" ON grammar_diagnostic_sessions';
        EXECUTE 'CREATE POLICY "Users can update own sessions" ON grammar_diagnostic_sessions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
    END IF;
END $$;

-- grammar_patterns
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'grammar_patterns') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Users can update own patterns" ON grammar_patterns';
        EXECUTE 'CREATE POLICY "Users can update own patterns" ON grammar_patterns FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
    END IF;
END $$;

-- script_practice_sessions
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'script_practice_sessions') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Users can update own sessions" ON script_practice_sessions';
        EXECUTE 'CREATE POLICY "Users can update own sessions" ON script_practice_sessions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
    END IF;
END $$;

-- phrase_sets
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'phrase_sets') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Users can update own sets" ON phrase_sets';
        EXECUTE 'CREATE POLICY "Users can update own sets" ON phrase_sets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
    END IF;
END $$;

-- phrase_set_items (ownership via phrase_sets join)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'phrase_set_items') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Users can update items in own sets" ON phrase_set_items';
        EXECUTE 'CREATE POLICY "Users can update items in own sets" ON phrase_set_items FOR UPDATE USING (EXISTS (SELECT 1 FROM phrase_sets WHERE phrase_sets.id = phrase_set_items.phrase_set_id AND phrase_sets.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM phrase_sets WHERE phrase_sets.id = phrase_set_items.phrase_set_id AND phrase_sets.user_id = auth.uid()))';
    END IF;
END $$;

-- extraction_jobs
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'extraction_jobs') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Users can update own jobs" ON extraction_jobs';
        EXECUTE 'CREATE POLICY "Users can update own jobs" ON extraction_jobs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
    END IF;
END $$;

-- ============================================================
-- 16. Restrict ipa_cache writes to service_role only
-- ============================================================
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ipa_cache') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Allow insert for authenticated" ON ipa_cache';
        EXECUTE 'DROP POLICY IF EXISTS "Allow update for authenticated" ON ipa_cache';
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated can insert ipa cache" ON ipa_cache';
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated can update ipa cache" ON ipa_cache';
        EXECUTE 'CREATE POLICY "Service role can insert ipa cache" ON ipa_cache FOR INSERT WITH CHECK (false)';
        EXECUTE 'CREATE POLICY "Service role can update ipa cache" ON ipa_cache FOR UPDATE USING (false)';
    END IF;
END $$;
