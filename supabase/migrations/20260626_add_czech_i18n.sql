-- チェコ語（cs）のi18nデータを追加
-- Supabase SQLエディタで実行してください

-- ============================================================
-- Announcements: チェコ語を追加
-- ============================================================

-- ウェルカムメッセージ
UPDATE announcements
SET
  title_i18n = title_i18n || '{"cs": "Vítejte! Začněme se učit"}'::jsonb,
  content_i18n = content_i18n || '{"cs": "Děkujeme za registraci! Začněte výběrem jazyka na domovské stránce a naučte se svou první frázi. Klíčem k pokroku je cvičit každý den alespoň trochu."}'::jsonb
WHERE title = 'ようこそ！学習を始めましょう';

-- 機能紹介
UPDATE announcements
SET
  title_i18n = title_i18n || '{"cs": "Využijte užitečné funkce"}'::jsonb,
  content_i18n = content_i18n || '{"cs": "Ukládejte si oblíbené fráze pomocí funkce \"Kolekce\". Psaní poznámek pomocí \"Poznámkového bloku\" zefektivní vaše opakování."}'::jsonb
WHERE title = '便利な機能を活用しよう';

-- 継続のコツ
UPDATE announcements
SET
  title_i18n = title_i18n || '{"cs": "Tipy, jak si ze studia udělat zvyk"}'::jsonb,
  content_i18n = content_i18n || '{"cs": "Vaše série se zaznamenává při každém přihlášení. I krátké každodenní cvičení buduje skutečné dovednosti. Začněte jen 5 minutami denně!"}'::jsonb
WHERE title = '学習を習慣にするコツ';

-- プレミアム機能
UPDATE announcements
SET
  title_i18n = title_i18n || '{"cs": "Pro ty, kdo se chtějí učit více"}'::jsonb,
  content_i18n = content_i18n || '{"cs": "Prémiové funkce vám poskytnou přístup k více frázím a pokročilým studijním nástrojům. Podívejte se na stránku Obchod!"}'::jsonb
WHERE title = 'もっと学びたい方へ';

-- 感謝メッセージ
UPDATE announcements
SET
  title_i18n = title_i18n || '{"cs": "Děkujeme, že používáte naši aplikaci"}'::jsonb,
  content_i18n = content_i18n || '{"cs": "Tato aplikace je momentálně ve fázi beta testování.\nUpřímně děkujeme, že ji zkoušíte.\n\nVyzvedněte si své kredity a mince na stránce Odměny a vyzkoušejte různé funkce.\n\nPokud máte zpětnou vazbu k použitelnosti nebo funkcím, které byste si přáli, dejte nám vědět.\n\nSnažíme se zlepšovat na základě vaší cenné zpětné vazby."}'::jsonb
WHERE title = 'ご利用ありがとうございます';

-- ============================================================
-- Distribution Events: チェコ語を追加
-- ============================================================

-- 初回ボーナス
UPDATE distribution_events
SET
  title_i18n = title_i18n || '{"cs": "Uvítací bonus"}'::jsonb,
  description_i18n = description_i18n || '{"cs": "Děkujeme za registraci. Zde je několik kreditů k vyzkoušení."}'::jsonb
WHERE title = '初回ボーナス';

-- βテスト参加者限定特典
UPDATE distribution_events
SET
  title_i18n = title_i18n || '{"cs": "Exkluzivní odměny pro beta testery"}'::jsonb,
  description_i18n = description_i18n || '{"cs": "Děkujeme za účast v beta testování. Jako poděkování vám dáváme různé kredity a mince. Užijte si všechny funkce!"}'::jsonb
WHERE title = 'βテスト参加者限定特典';

-- 注: 「ベータテスト報酬 第2弾」(Round 2) の cs は 20260626_beta_distribution_round2.sql の INSERT に直接含めています。
