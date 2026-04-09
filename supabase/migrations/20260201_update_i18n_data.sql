-- 既存データを削除して多言語データを追加
-- Supabase SQLエディタで実行してください

-- ============================================================
-- 既存データの削除
-- ============================================================
DELETE FROM announcement_reads;
DELETE FROM announcements;
DELETE FROM distribution_claims;
DELETE FROM distribution_events;

-- ============================================================
-- Announcements: 多言語データの追加
-- ============================================================

-- 1. ウェルカムメッセージ（登録から7日以内）
INSERT INTO announcements (title, content, type, target_audience, new_user_days, is_active, starts_at, title_i18n, content_i18n)
VALUES (
  'ようこそ！学習を始めましょう',
  '登録ありがとうございます！まずはダッシュボードから学習したい言語を選んで、最初のフレーズを学んでみましょう。毎日少しずつ続けることが上達のコツです。',
  'info',
  'new_users',
  7,
  true,
  NOW(),
  '{"ja": "ようこそ！学習を始めましょう", "en": "Welcome! Let''s start learning", "ko": "환영합니다! 학습을 시작해봐요", "zh": "欢迎！开始学习吧", "fr": "Bienvenue ! Commençons à apprendre", "es": "¡Bienvenido! Empecemos a aprender", "de": "Willkommen! Lass uns mit dem Lernen beginnen", "ru": "Добро пожаловать! Начнём учиться", "vi": "Chào mừng! Hãy bắt đầu học"}'::jsonb,
  '{"ja": "登録ありがとうございます！まずはダッシュボードから学習したい言語を選んで、最初のフレーズを学んでみましょう。毎日少しずつ続けることが上達のコツです。", "en": "Thank you for signing up! Start by selecting a language from the dashboard and learn your first phrase. The key to progress is practicing a little every day.", "ko": "가입해 주셔서 감사합니다! 대시보드에서 배우고 싶은 언어를 선택하고 첫 번째 문장을 배워보세요. 매일 조금씩 꾸준히 하는 것이 실력 향상의 비결입니다.", "zh": "感谢您的注册！首先从仪表板选择您想学习的语言，学习您的第一个短语。每天坚持一点点是进步的关键。", "fr": "Merci de vous être inscrit ! Commencez par sélectionner une langue depuis le tableau de bord et apprenez votre première phrase. La clé du progrès est de pratiquer un peu chaque jour.", "es": "¡Gracias por registrarte! Comienza seleccionando un idioma desde el panel y aprende tu primera frase. La clave del progreso es practicar un poco cada día.", "de": "Danke für Ihre Anmeldung! Wählen Sie zunächst eine Sprache aus dem Dashboard und lernen Sie Ihren ersten Satz. Der Schlüssel zum Fortschritt liegt darin, jeden Tag ein wenig zu üben.", "ru": "Спасибо за регистрацию! Начните с выбора языка на панели управления и выучите свою первую фразу. Ключ к прогрессу — практиковаться понемногу каждый день.", "vi": "Cảm ơn bạn đã đăng ký! Bắt đầu bằng cách chọn ngôn ngữ từ bảng điều khiển và học cụm từ đầu tiên. Chìa khóa để tiến bộ là luyện tập một chút mỗi ngày."}'::jsonb
);

-- 2. 機能紹介（登録から3日以内）
INSERT INTO announcements (title, content, type, target_audience, new_user_days, is_active, starts_at, title_i18n, content_i18n)
VALUES (
  '便利な機能を活用しよう',
  '「コレクション」機能でお気に入りのフレーズを保存できます。また「気づきメモ」で自分だけのメモを残すと、復習がより効果的になります。',
  'update',
  'new_users',
  3,
  true,
  NOW(),
  '{"ja": "便利な機能を活用しよう", "en": "Make use of helpful features", "ko": "편리한 기능을 활용해보세요", "zh": "充分利用便捷功能", "fr": "Utilisez les fonctionnalités utiles", "es": "Aprovecha las funciones útiles", "de": "Nutzen Sie die hilfreichen Funktionen", "ru": "Используйте полезные функции", "vi": "Tận dụng các tính năng hữu ích"}'::jsonb,
  '{"ja": "「コレクション」機能でお気に入りのフレーズを保存できます。また「気づきメモ」で自分だけのメモを残すと、復習がより効果的になります。", "en": "Save your favorite phrases with the \"Collections\" feature. Taking notes with \"Awareness Memo\" makes review more effective.", "ko": "\"컬렉션\" 기능으로 좋아하는 문장을 저장할 수 있습니다. \"깨달음 메모\"로 메모를 남기면 복습이 더 효과적입니다.", "zh": "使用\"收藏\"功能保存您喜欢的短语。使用\"感悟笔记\"做笔记可以让复习更有效。", "fr": "Enregistrez vos phrases préférées avec la fonction \"Collections\". Prendre des notes avec \"Mémo de prise de conscience\" rend la révision plus efficace.", "es": "Guarda tus frases favoritas con la función \"Colecciones\". Tomar notas con \"Memo de Conciencia\" hace que el repaso sea más efectivo.", "de": "Speichern Sie Ihre Lieblingssätze mit der \"Sammlungen\"-Funktion. Notizen mit \"Bewusstseins-Memo\" machen die Wiederholung effektiver.", "ru": "Сохраняйте любимые фразы с помощью функции \"Коллекции\". Ведение заметок с помощью \"Memo осознанности\" делает повторение более эффективным.", "vi": "Lưu các cụm từ yêu thích với tính năng \"Bộ sưu tập\". Ghi chú với \"Ghi nhớ nhận thức\" giúp việc ôn tập hiệu quả hơn."}'::jsonb
);

-- 3. 継続のコツ（登録から5日以内）
INSERT INTO announcements (title, content, type, target_audience, new_user_days, is_active, starts_at, title_i18n, content_i18n)
VALUES (
  '学習を習慣にするコツ',
  '毎日ログインするとストリークが記録されます。短い時間でも毎日続けることで、確実に力がつきます。目標は1日5分から始めてみましょう！',
  'success',
  'new_users',
  5,
  true,
  NOW(),
  '{"ja": "学習を習慣にするコツ", "en": "Tips to make learning a habit", "ko": "학습을 습관으로 만드는 비결", "zh": "让学习成为习惯的技巧", "fr": "Conseils pour faire de l''apprentissage une habitude", "es": "Consejos para hacer del aprendizaje un hábito", "de": "Tipps, um das Lernen zur Gewohnheit zu machen", "ru": "Советы, как сделать обучение привычкой", "vi": "Mẹo để biến việc học thành thói quen"}'::jsonb,
  '{"ja": "毎日ログインするとストリークが記録されます。短い時間でも毎日続けることで、確実に力がつきます。目標は1日5分から始めてみましょう！", "en": "Your streak is recorded every time you log in. Even short daily practice builds real skills. Start with just 5 minutes a day!", "ko": "매일 로그인하면 스트릭이 기록됩니다. 짧은 시간이라도 매일 꾸준히 하면 실력이 확실히 늘어납니다. 하루 5분부터 시작해보세요!", "zh": "每次登录都会记录您的连续天数。即使每天只练习很短的时间，也能真正提升技能。从每天5分钟开始吧！", "fr": "Votre série est enregistrée chaque fois que vous vous connectez. Même une courte pratique quotidienne développe de vraies compétences. Commencez par seulement 5 minutes par jour !", "es": "Tu racha se registra cada vez que inicias sesión. Incluso una práctica diaria corta desarrolla habilidades reales. ¡Comienza con solo 5 minutos al día!", "de": "Ihre Serie wird bei jeder Anmeldung aufgezeichnet. Selbst kurzes tägliches Üben baut echte Fähigkeiten auf. Fangen Sie mit nur 5 Minuten pro Tag an!", "ru": "Ваша серия записывается каждый раз, когда вы входите в систему. Даже короткие ежедневные занятия развивают реальные навыки. Начните всего с 5 минут в день!", "vi": "Chuỗi ngày của bạn được ghi lại mỗi khi bạn đăng nhập. Ngay cả việc luyện tập ngắn hàng ngày cũng xây dựng kỹ năng thực sự. Bắt đầu với chỉ 5 phút mỗi ngày!"}'::jsonb
);

-- 4. プレミアム機能の紹介（登録から14日以内）
INSERT INTO announcements (title, content, type, target_audience, new_user_days, is_active, starts_at, title_i18n, content_i18n)
VALUES (
  'もっと学びたい方へ',
  'プレミアム機能を使うと、より多くのフレーズや高度な学習機能が利用できます。ショップページをチェックしてみてください。',
  'info',
  'new_users',
  14,
  true,
  NOW(),
  '{"ja": "もっと学びたい方へ", "en": "For those who want to learn more", "ko": "더 많이 배우고 싶은 분들께", "zh": "想要学更多的朋友", "fr": "Pour ceux qui veulent en apprendre plus", "es": "Para quienes quieren aprender más", "de": "Für alle, die mehr lernen möchten", "ru": "Для тех, кто хочет узнать больше", "vi": "Dành cho những ai muốn học nhiều hơn"}'::jsonb,
  '{"ja": "プレミアム機能を使うと、より多くのフレーズや高度な学習機能が利用できます。ショップページをチェックしてみてください。", "en": "Premium features give you access to more phrases and advanced learning tools. Check out the Shop page!", "ko": "프리미엄 기능을 사용하면 더 많은 문장과 고급 학습 기능을 이용할 수 있습니다. 상점 페이지를 확인해보세요!", "zh": "高级功能可让您访问更多短语和高级学习工具。查看商店页面！", "fr": "Les fonctionnalités premium vous donnent accès à plus de phrases et d''outils d''apprentissage avancés. Consultez la page Boutique !", "es": "Las funciones premium te dan acceso a más frases y herramientas de aprendizaje avanzadas. ¡Visita la página de la Tienda!", "de": "Premium-Funktionen geben Ihnen Zugang zu mehr Sätzen und fortgeschrittenen Lernwerkzeugen. Schauen Sie sich die Shop-Seite an!", "ru": "Премиум-функции дают вам доступ к большему количеству фраз и продвинутым инструментам обучения. Загляните на страницу магазина!", "vi": "Các tính năng cao cấp cho bạn quyền truy cập vào nhiều cụm từ hơn và các công cụ học tập nâng cao. Hãy xem trang Cửa hàng!"}'::jsonb
);

-- 5. 感謝・テスト版・フィードバックのお願い（全員向け）
INSERT INTO announcements (title, content, type, target_audience, new_user_days, is_active, starts_at, title_i18n, content_i18n)
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
  NOW(),
  '{"ja": "ご利用ありがとうございます", "en": "Thank you for using our app", "ko": "이용해 주셔서 감사합니다", "zh": "感谢您使用我们的应用", "fr": "Merci d''utiliser notre application", "es": "Gracias por usar nuestra aplicación", "de": "Vielen Dank für die Nutzung unserer App", "ru": "Спасибо за использование нашего приложения", "vi": "Cảm ơn bạn đã sử dụng ứng dụng của chúng tôi"}'::jsonb,
  '{"ja": "現在このアプリはテスト版として公開しています。\nご利用いただき心より感謝申し上げます。\n\n特典ページからクレジットとコインを受け取って、ぜひ様々な機能をお試しください。\n\n使いづらい点や改善してほしい機能など、ご意見がありましたらぜひお聞かせください。\n\n皆さまの声をもとに、より良いサービスを目指してまいります。", "en": "This app is currently in beta testing.\nWe sincerely appreciate you trying it out.\n\nPlease claim your credits and coins from the Rewards page to try out various features.\n\nIf you have any feedback about usability or features you''d like to see, please let us know.\n\nWe aim to improve based on your valuable input.", "ko": "현재 이 앱은 베타 테스트 중입니다.\n이용해 주셔서 진심으로 감사드립니다.\n\n특전 페이지에서 크레딧과 코인을 받아 다양한 기능을 체험해 보세요.\n\n사용하기 불편한 점이나 개선했으면 하는 기능이 있으시면 알려주세요.\n\n여러분의 소중한 의견을 바탕으로 더 나은 서비스를 만들어 가겠습니다.", "zh": "该应用目前处于测试阶段。\n非常感谢您的试用。\n\n请从奖励页面领取您的积分和金币，尝试各种功能。\n\n如果您对可用性或希望看到的功能有任何反馈，请告诉我们。\n\n我们将根据您的宝贵意见进行改进。", "fr": "Cette application est actuellement en version bêta.\nNous vous remercions sincèrement de l''essayer.\n\nVeuillez récupérer vos crédits et pièces sur la page Récompenses pour essayer les différentes fonctionnalités.\n\nSi vous avez des commentaires sur la convivialité ou les fonctionnalités que vous aimeriez voir, n''hésitez pas à nous le faire savoir.\n\nNous visons à nous améliorer en fonction de vos précieux retours.", "es": "Esta aplicación está actualmente en fase beta.\nAgradecemos sinceramente que la pruebes.\n\nReclama tus créditos y monedas en la página de Recompensas para probar las diferentes funciones.\n\nSi tienes algún comentario sobre la usabilidad o funciones que te gustaría ver, háznoslo saber.\n\nNuestro objetivo es mejorar basándonos en tus valiosos comentarios.", "de": "Diese App befindet sich derzeit in der Beta-Testphase.\nWir danken Ihnen herzlich für das Ausprobieren.\n\nBitte holen Sie sich Ihre Credits und Münzen auf der Belohnungsseite ab, um verschiedene Funktionen auszuprobieren.\n\nWenn Sie Feedback zur Benutzerfreundlichkeit oder zu gewünschten Funktionen haben, lassen Sie es uns bitte wissen.\n\nWir streben an, uns basierend auf Ihrem wertvollen Feedback zu verbessern.", "ru": "Это приложение в настоящее время находится на стадии бета-тестирования.\nМы искренне благодарим вас за то, что попробовали его.\n\nПожалуйста, получите свои кредиты и монеты на странице Награды, чтобы попробовать различные функции.\n\nЕсли у вас есть отзывы о удобстве использования или функциях, которые вы хотели бы видеть, пожалуйста, сообщите нам.\n\nМы стремимся улучшаться на основе ваших ценных отзывов.", "vi": "Ứng dụng này hiện đang trong giai đoạn thử nghiệm beta.\nChúng tôi chân thành cảm ơn bạn đã dùng thử.\n\nVui lòng nhận tín dụng và xu của bạn từ trang Phần thưởng để thử các tính năng khác nhau.\n\nNếu bạn có phản hồi về khả năng sử dụng hoặc các tính năng bạn muốn thấy, vui lòng cho chúng tôi biết.\n\nChúng tôi mong muốn cải thiện dựa trên ý kiến quý báu của bạn."}'::jsonb
);

-- ============================================================
-- Distribution Events: 多言語データの追加
-- ============================================================

-- 初回ボーナス（全ユーザー向け・1回限り）
INSERT INTO distribution_events (
  title, description, rewards, recurrence, scheduled_at, status, title_i18n, description_i18n
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
  'active',
  '{"ja": "初回ボーナス", "en": "Welcome Bonus", "ko": "첫 가입 보너스", "zh": "注册奖励", "fr": "Bonus de bienvenue", "es": "Bono de bienvenida", "de": "Willkommensbonus", "ru": "Приветственный бонус", "vi": "Thưởng chào mừng"}'::jsonb,
  '{"ja": "ご登録ありがとうございます。お試し用のクレジットをプレゼントいたします。", "en": "Thank you for signing up. Here are some trial credits for you.", "ko": "가입해 주셔서 감사합니다. 체험용 크레딧을 드립니다.", "zh": "感谢您的注册。这是送给您的试用积分。", "fr": "Merci de vous être inscrit. Voici des crédits d''essai pour vous.", "es": "Gracias por registrarte. Aquí tienes algunos créditos de prueba.", "de": "Vielen Dank für Ihre Anmeldung. Hier sind einige Probe-Credits für Sie.", "ru": "Спасибо за регистрацию. Вот несколько пробных кредитов для вас.", "vi": "Cảm ơn bạn đã đăng ký. Đây là một số tín dụng dùng thử dành cho bạn."}'::jsonb
);

-- βテスト参加者限定特典（1回限り）
INSERT INTO distribution_events (
  title, description, rewards, recurrence, scheduled_at, status, title_i18n, description_i18n
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
  'active',
  '{"ja": "βテスト参加者限定特典", "en": "Beta Tester Exclusive Rewards", "ko": "베타 테스터 전용 보상", "zh": "Beta测试者专属奖励", "fr": "Récompenses exclusives pour testeurs bêta", "es": "Recompensas exclusivas para testers beta", "de": "Exklusive Belohnungen für Beta-Tester", "ru": "Эксклюзивные награды для бета-тестеров", "vi": "Phần thưởng độc quyền cho người thử nghiệm Beta"}'::jsonb,
  '{"ja": "βテストへのご参加、誠にありがとうございます。感謝の気持ちを込めて、各種クレジットとコインをプレゼントいたします。ぜひすべての機能をお楽しみください。", "en": "Thank you for participating in the beta test. As a token of our appreciation, we''re giving you various credits and coins. Please enjoy all the features!", "ko": "베타 테스트에 참여해 주셔서 진심으로 감사드립니다. 감사의 마음을 담아 각종 크레딧과 코인을 드립니다. 모든 기능을 즐겨보세요!", "zh": "非常感谢您参与Beta测试。作为感谢，我们将赠送您各种积分和金币。请尽情享受所有功能！", "fr": "Merci de participer au test bêta. En guise de remerciement, nous vous offrons divers crédits et pièces. Profitez de toutes les fonctionnalités !", "es": "Gracias por participar en la prueba beta. Como muestra de nuestro agradecimiento, te damos varios créditos y monedas. ¡Disfruta de todas las funciones!", "de": "Vielen Dank für Ihre Teilnahme am Beta-Test. Als Zeichen unserer Wertschätzung schenken wir Ihnen verschiedene Credits und Münzen. Genießen Sie alle Funktionen!", "ru": "Спасибо за участие в бета-тестировании. В знак нашей благодарности мы дарим вам различные кредиты и монеты. Наслаждайтесь всеми функциями!", "vi": "Cảm ơn bạn đã tham gia thử nghiệm beta. Để bày tỏ lòng biết ơn, chúng tôi tặng bạn các loại tín dụng và xu. Hãy tận hưởng tất cả các tính năng!"}'::jsonb
);

-- ============================================================
-- 確認用クエリ
-- ============================================================
SELECT id, title, title_i18n->>'en' as title_en, title_i18n->>'ko' as title_ko FROM announcements;
SELECT id, title, title_i18n->>'en' as title_en, title_i18n->>'ko' as title_ko FROM distribution_events;