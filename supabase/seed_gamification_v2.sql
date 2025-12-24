
-- Levels (Columns: level, xp_threshold, title, next_unlock_label)
INSERT INTO public.levels (level, xp_threshold, title, next_unlock_label) VALUES 
(1, 0, 'Novice', 'Unlock Daily Quests'),
(2, 100, 'Beginner', 'Unlock Badges'),
(3, 300, 'Learner', 'Unlock Challenges'),
(4, 600, 'Intermediate', 'New Themes'),
(5, 1000, 'Advanced', 'Mentor Mode'),
(6, 1500, 'Expert', 'Legendary Badge'),
(7, 2500, 'Master', 'All Features')
ON CONFLICT DO NOTHING;

-- Daily Quest Templates (Columns: quest_key, title, event_type, required_count)
INSERT INTO public.daily_quest_templates (quest_key, title, event_type, required_count) VALUES 
('daily_phrases_5', 'Learn 5 new phrases', 'phrase_view', 5),
('daily_pronunciation_3', 'Complete 3 pronunciation checks', 'pronunciation_check', 3),
('daily_review_10', 'Review 10 flashcards', 'review', 10),
('weekly_streak_3', 'Maintain a 3-day streak', 'streak', 1),
('challenge_perfect', 'Earn a perfect score', 'perfect_score', 1)
ON CONFLICT DO NOTHING;

-- Badges (Columns: badge_key, title, description, icon)
INSERT INTO public.badges (badge_key, title, description, icon) VALUES 
('first_step', 'First Step', 'Completed your first lesson', 'footprints'),
('streak_7', 'Streak Master', 'Reached a 7-day streak', 'flame'),
('polyglot_3', 'Polyglot', 'Learned phrases in 3 languages', 'globe'),
('early_bird', 'Early Bird', 'Studied before 8 AM', 'sun'),
('night_owl', 'Night Owl', 'Studied after 10 PM', 'moon')
ON CONFLICT DO NOTHING;
