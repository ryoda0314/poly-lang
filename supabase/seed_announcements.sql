-- 新規ユーザー向けお知らせのサンプルデータ
-- マイグレーション実行後に: npx supabase db seed --file supabase/seed_announcements.sql

-- 1. ウェルカムメッセージ（登録から7日以内）
INSERT INTO announcements (title, content, type, target_audience, new_user_days, is_active, starts_at)
VALUES (
  'ようこそ！学習を始めましょう',
  '登録ありがとうございます！まずはダッシュボードから学習したい言語を選んで、最初のフレーズを学んでみましょう。毎日少しずつ続けることが上達のコツです。',
  'info',
  'new_users',
  7,
  true,
  NOW()
);

-- 2. 機能紹介（登録から3日以内）
INSERT INTO announcements (title, content, type, target_audience, new_user_days, is_active, starts_at)
VALUES (
  '便利な機能を活用しよう',
  '「コレクション」機能でお気に入りのフレーズを保存できます。また「気づきメモ」で自分だけのメモを残すと、復習がより効果的になります。',
  'update',
  'new_users',
  3,
  true,
  NOW()
);

-- 3. 継続のコツ（登録から5日以内）
INSERT INTO announcements (title, content, type, target_audience, new_user_days, is_active, starts_at)
VALUES (
  '学習を習慣にするコツ',
  '毎日ログインするとストリークが記録されます。短い時間でも毎日続けることで、確実に力がつきます。目標は1日5分から始めてみましょう！',
  'success',
  'new_users',
  5,
  true,
  NOW()
);

-- 4. プレミアム機能の紹介（登録から14日以内）
INSERT INTO announcements (title, content, type, target_audience, new_user_days, is_active, starts_at)
VALUES (
  'もっと学びたい方へ',
  'プレミアム機能を使うと、より多くのフレーズや高度な学習機能が利用できます。ショップページをチェックしてみてください。',
  'info',
  'new_users',
  14,
  true,
  NOW()
);

-- 5. 感謝・テスト版・フィードバックのお願い（全員向け）
INSERT INTO announcements (title, content, type, target_audience, new_user_days, is_active, starts_at)
VALUES (
  'ご利用ありがとうございます',
  '現在このアプリはテスト版として公開しています。
ご利用いただき心より感謝申し上げます。

特典ページからクレジットとコインを受け取って、ぜひ様々な機能をお試しください。

使いづらい点や改善してほしい機能など、ご意見がありましたらぜひお聞かせください。

皆さまの声をもとに、より良いサービスを目指してまいります。',
  'info',
  'all',
  7,
  true,
  NOW()
);

-- ============================================================
-- Distribution Events (特典配布)
-- ============================================================

-- 初回ボーナス（全ユーザー向け・1回限り）
INSERT INTO distribution_events (
  title, description, rewards, recurrence, scheduled_at, status
) VALUES (
  '初回ボーナス',
  'ご登録ありがとうございます。お試し用のクレジットをプレゼントいたします。',
  '[
    {"type": "audio_credits", "amount": 50},
    {"type": "explorer_credits", "amount": 20},
    {"type": "correction_credits", "amount": 5},
    {"type": "explanation_credits", "amount": 5}
  ]'::jsonb,
  'once',
  NOW(),
  'active'
);

-- βテスト参加者限定特典（1回限り）
INSERT INTO distribution_events (
  title, description, rewards, recurrence, scheduled_at, status
) VALUES (
  'βテスト参加者限定特典',
  'βテストへのご参加、誠にありがとうございます。感謝の気持ちを込めて、各種クレジットとコインをプレゼントいたします。ぜひすべての機能をお楽しみください。',
  '[
    {"type": "audio_credits", "amount": 100},
    {"type": "explorer_credits", "amount": 50},
    {"type": "correction_credits", "amount": 50},
    {"type": "explanation_credits", "amount": 30},
    {"type": "extraction_credits", "amount": 20},
    {"type": "coins", "amount": 1100}
  ]'::jsonb,
  'once',
  NOW(),
  'active'
);