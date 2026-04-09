-- ============================================================
-- プラン枠のオーバーフロー修正
-- extra_* 分離 (20260219) 前に plan 列に混入した購入クレジットを
-- extra_* へ移動し、plan 列を monthly 上限以下に正規化する
-- ============================================================

-- Pro plan (monthly allocations from PLAN_MONTHLY_CREDITS)
UPDATE profiles SET
  extra_audio_credits = extra_audio_credits + GREATEST(audio_credits - 300, 0),
  audio_credits = LEAST(audio_credits, 300),
  extra_pronunciation_credits = extra_pronunciation_credits + GREATEST(pronunciation_credits - 250, 0),
  pronunciation_credits = LEAST(pronunciation_credits, 250),
  extra_explorer_credits = extra_explorer_credits + GREATEST(explorer_credits - 300, 0),
  explorer_credits = LEAST(explorer_credits, 300),
  extra_explanation_credits = extra_explanation_credits + GREATEST(explanation_credits - 60, 0),
  explanation_credits = LEAST(explanation_credits, 60),
  extra_expression_credits = extra_expression_credits + GREATEST(expression_credits - 150, 0),
  expression_credits = LEAST(expression_credits, 150),
  extra_ipa_credits = extra_ipa_credits + GREATEST(ipa_credits - 300, 0),
  ipa_credits = LEAST(ipa_credits, 300),
  extra_vocab_credits = extra_vocab_credits + GREATEST(vocab_credits - 300, 0),
  vocab_credits = LEAST(vocab_credits, 300),
  extra_grammar_credits = extra_grammar_credits + GREATEST(grammar_credits - 80, 0),
  grammar_credits = LEAST(grammar_credits, 80),
  extra_extension_credits = extra_extension_credits + GREATEST(extension_credits - 200, 0),
  extension_credits = LEAST(extension_credits, 200),
  extra_correction_credits = extra_correction_credits + GREATEST(correction_credits - 120, 0),
  correction_credits = LEAST(correction_credits, 120),
  extra_chat_credits = extra_chat_credits + GREATEST(chat_credits - 200, 0),
  chat_credits = LEAST(chat_credits, 200),
  extra_sentence_credits = extra_sentence_credits + GREATEST(sentence_credits - 20, 0),
  sentence_credits = LEAST(sentence_credits, 20),
  extra_speaking_credits = extra_speaking_credits + GREATEST(speaking_credits - 100, 0),
  speaking_credits = LEAST(speaking_credits, 100),
  extra_extraction_credits = extra_extraction_credits + GREATEST(extraction_credits - 20, 0),
  extraction_credits = LEAST(extraction_credits, 20),
  extra_etymology_credits = extra_etymology_credits + GREATEST(etymology_credits - 25, 0),
  etymology_credits = LEAST(etymology_credits, 25)
WHERE subscription_plan = 'pro';

-- Conversation plan
UPDATE profiles SET
  extra_speaking_credits = extra_speaking_credits + GREATEST(speaking_credits - 150, 0),
  speaking_credits = LEAST(speaking_credits, 150),
  extra_pronunciation_credits = extra_pronunciation_credits + GREATEST(pronunciation_credits - 300, 0),
  pronunciation_credits = LEAST(pronunciation_credits, 300),
  extra_audio_credits = extra_audio_credits + GREATEST(audio_credits - 200, 0),
  audio_credits = LEAST(audio_credits, 200),
  extra_chat_credits = extra_chat_credits + GREATEST(chat_credits - 200, 0),
  chat_credits = LEAST(chat_credits, 200),
  extra_correction_credits = extra_correction_credits + GREATEST(correction_credits - 80, 0),
  correction_credits = LEAST(correction_credits, 80),
  extra_expression_credits = extra_expression_credits + GREATEST(expression_credits - 80, 0),
  expression_credits = LEAST(expression_credits, 80)
WHERE subscription_plan = 'conversation';

-- Output plan
UPDATE profiles SET
  extra_correction_credits = extra_correction_credits + GREATEST(correction_credits - 100, 0),
  correction_credits = LEAST(correction_credits, 100),
  extra_chat_credits = extra_chat_credits + GREATEST(chat_credits - 200, 0),
  chat_credits = LEAST(chat_credits, 200),
  extra_speaking_credits = extra_speaking_credits + GREATEST(speaking_credits - 120, 0),
  speaking_credits = LEAST(speaking_credits, 120),
  extra_expression_credits = extra_expression_credits + GREATEST(expression_credits - 80, 0),
  expression_credits = LEAST(expression_credits, 80),
  extra_pronunciation_credits = extra_pronunciation_credits + GREATEST(pronunciation_credits - 250, 0),
  pronunciation_credits = LEAST(pronunciation_credits, 250)
WHERE subscription_plan = 'output';

-- Input plan
UPDATE profiles SET
  extra_audio_credits = extra_audio_credits + GREATEST(audio_credits - 500, 0),
  audio_credits = LEAST(audio_credits, 500),
  extra_explorer_credits = extra_explorer_credits + GREATEST(explorer_credits - 500, 0),
  explorer_credits = LEAST(explorer_credits, 500),
  extra_explanation_credits = extra_explanation_credits + GREATEST(explanation_credits - 80, 0),
  explanation_credits = LEAST(explanation_credits, 80),
  extra_expression_credits = extra_expression_credits + GREATEST(expression_credits - 120, 0),
  expression_credits = LEAST(expression_credits, 120),
  extra_grammar_credits = extra_grammar_credits + GREATEST(grammar_credits - 60, 0),
  grammar_credits = LEAST(grammar_credits, 60),
  extra_vocab_credits = extra_vocab_credits + GREATEST(vocab_credits - 300, 0),
  vocab_credits = LEAST(vocab_credits, 300),
  extra_extraction_credits = extra_extraction_credits + GREATEST(extraction_credits - 30, 0),
  extraction_credits = LEAST(extraction_credits, 30)
WHERE subscription_plan = 'input';

-- Exam plan
UPDATE profiles SET
  extra_sentence_credits = extra_sentence_credits + GREATEST(sentence_credits - 15, 0),
  sentence_credits = LEAST(sentence_credits, 15),
  extra_explanation_credits = extra_explanation_credits + GREATEST(explanation_credits - 40, 0),
  explanation_credits = LEAST(explanation_credits, 40),
  extra_vocab_credits = extra_vocab_credits + GREATEST(vocab_credits - 600, 0),
  vocab_credits = LEAST(vocab_credits, 600),
  extra_etymology_credits = extra_etymology_credits + GREATEST(etymology_credits - 20, 0),
  etymology_credits = LEAST(etymology_credits, 20),
  extra_correction_credits = extra_correction_credits + GREATEST(correction_credits - 100, 0),
  correction_credits = LEAST(correction_credits, 100),
  extra_audio_credits = extra_audio_credits + GREATEST(audio_credits - 500, 0),
  audio_credits = LEAST(audio_credits, 500),
  extra_ipa_credits = extra_ipa_credits + GREATEST(ipa_credits - 200, 0),
  ipa_credits = LEAST(ipa_credits, 200)
WHERE subscription_plan = 'exam';
