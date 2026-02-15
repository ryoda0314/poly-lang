-- フィンランド語（fi）のi18nデータを追加
-- Supabase SQLエディタで実行してください

-- ============================================================
-- Announcements: フィンランド語を追加
-- ============================================================

-- ウェルカムメッセージ
UPDATE announcements
SET
  title_i18n = title_i18n || '{"fi": "Tervetuloa! Aloitetaan oppiminen"}'::jsonb,
  content_i18n = content_i18n || '{"fi": "Kiitos rekisteröitymisestä! Aloita valitsemalla kieli etusivulta ja opi ensimmäinen fraasisi. Edistymisen avain on harjoitella vähän joka päivä."}'::jsonb
WHERE title = 'ようこそ！学習を始めましょう';

-- 機能紹介
UPDATE announcements
SET
  title_i18n = title_i18n || '{"fi": "Hyödynnä käteviä ominaisuuksia"}'::jsonb,
  content_i18n = content_i18n || '{"fi": "Tallenna suosikkifraasisi \"Kokoelmat\"-ominaisuudella. Muistiinpanojen tekeminen \"Tietoisuusmuistiolla\" tekee kertaamisesta tehokkaampaa."}'::jsonb
WHERE title = '便利な機能を活用しよう';

-- 継続のコツ
UPDATE announcements
SET
  title_i18n = title_i18n || '{"fi": "Vinkkejä oppimisen tavaksi tekemiseen"}'::jsonb,
  content_i18n = content_i18n || '{"fi": "Putkesi kirjataan joka kerta kun kirjaudut sisään. Lyhytkin päivittäinen harjoittelu rakentaa todellisia taitoja. Aloita vain 5 minuutilla päivässä!"}'::jsonb
WHERE title = '学習を習慣にするコツ';

-- プレミアム機能
UPDATE announcements
SET
  title_i18n = title_i18n || '{"fi": "Niille jotka haluavat oppia lisää"}'::jsonb,
  content_i18n = content_i18n || '{"fi": "Premium-ominaisuudet antavat sinulle pääsyn useampiin fraaseihin ja edistyneisiin oppimistyökaluihin. Tutustu Kauppa-sivuun!"}'::jsonb
WHERE title = 'もっと学びたい方へ';

-- 感謝メッセージ
UPDATE announcements
SET
  title_i18n = title_i18n || '{"fi": "Kiitos sovelluksemme käytöstä"}'::jsonb,
  content_i18n = content_i18n || '{"fi": "Tämä sovellus on tällä hetkellä beta-testausvaiheessa.\nKiitämme vilpittömästi kokeilustasi.\n\nLunasta krediittisi ja kolikkosi Palkinnot-sivulta kokeillaksesi eri ominaisuuksia.\n\nJos sinulla on palautetta käytettävyydestä tai haluamistasi ominaisuuksista, kerro meille.\n\nPyrimme parantamaan arvokkaan palautteesi perusteella."}'::jsonb
WHERE title = 'ご利用ありがとうございます';

-- ============================================================
-- Distribution Events: フィンランド語を追加
-- ============================================================

-- 初回ボーナス
UPDATE distribution_events
SET
  title_i18n = title_i18n || '{"fi": "Tervetulobonus"}'::jsonb,
  description_i18n = description_i18n || '{"fi": "Kiitos rekisteröitymisestä. Tässä on kokeiltavia krediittejä sinulle."}'::jsonb
WHERE title = '初回ボーナス';

-- βテスト参加者限定特典
UPDATE distribution_events
SET
  title_i18n = title_i18n || '{"fi": "Beta-testaajan yksinoikeudelliset palkinnot"}'::jsonb,
  description_i18n = description_i18n || '{"fi": "Kiitos beta-testaukseen osallistumisesta. Kiitoksen merkiksi annamme sinulle erilaisia krediittejä ja kolikoita. Nauti kaikista ominaisuuksista!"}'::jsonb
WHERE title = 'βテスト参加者限定特典';
