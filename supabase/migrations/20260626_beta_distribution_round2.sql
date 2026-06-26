-- ============================================================
-- Beta tester distribution event (Round 2)
-- Re-distributes the beta credit pack as a NEW event so that
-- everyone (including users who already claimed Round 1) can claim once.
-- The claim_distribution RPC already exists; no function changes needed.
-- ============================================================

INSERT INTO distribution_events (
  title, description, rewards, recurrence, scheduled_at, expires_at, status,
  title_i18n, description_i18n
) VALUES (
  'ベータテスト報酬 第2弾',
  '全機能をテストするためのクレジットパックです。引き続きご協力ありがとうございます！',
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
  '{"ja": "ベータテスト報酬 第2弾", "en": "Beta Test Reward (Round 2)", "ko": "베타 테스트 보상 2차", "zh": "测试奖励（第二轮）", "fr": "Récompense de bêta-test (2e)", "es": "Recompensa de prueba beta (2ª)", "de": "Beta-Test Belohnung (Runde 2)", "ru": "Награда за бета-тест (раунд 2)", "vi": "Phần thưởng thử nghiệm (Đợt 2)", "fi": "Beta-testipalkinto (2. kierros)", "cs": "Odměna za beta test (2. kolo)"}'::jsonb,
  '{"ja": "全機能をテストするためのクレジットパックです。引き続きご協力ありがとうございます！", "en": "A credit pack for testing all features. Thanks again for your help!", "ko": "모든 기능을 테스트하기 위한 크레딧 팩입니다. 계속 협조해 주셔서 감사합니다!", "zh": "用于测试所有功能的信用包。感谢您一如既往的帮助！", "fr": "Un pack de crédits pour tester toutes les fonctionnalités. Merci encore pour votre aide !", "es": "Un paquete de créditos para probar todas las funciones. ¡Gracias de nuevo por su ayuda!", "de": "Ein Kreditpaket zum Testen aller Funktionen. Nochmals vielen Dank für Ihre Hilfe!", "ru": "Пакет кредитов для тестирования всех функций. Ещё раз спасибо за вашу помощь!", "vi": "Gói tín dụng để thử nghiệm tất cả tính năng. Cảm ơn sự hợp tác liên tục của bạn!", "fi": "Krediittipaketti kaikkien ominaisuuksien testaamiseen. Kiitos jälleen avustasi!", "cs": "Balíček kreditů pro testování všech funkcí. Ještě jednou děkujeme za vaši pomoc!"}'::jsonb
);
