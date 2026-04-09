
-- Levels
INSERT INTO public.levels (level, title, min_xp) VALUES 
(1, 'Novice', 0),
(2, 'Beginner', 100),
(3, 'Learner', 300),
(4, 'Intermediate', 600),
(5, 'Advanced', 1000),
(6, 'Expert', 1500),
(7, 'Master', 2500)
ON CONFLICT DO NOTHING;

-- Daily Quest Templates
INSERT INTO public.daily_quest_templates (title, xp_reward, category) VALUES 
('Learn 5 new phrases', 50, 'daily'),
('Complete 3 pronunciation checks', 30, 'daily'),
('Review 10 flashcards', 20, 'daily'),
('Maintain a 3-day streak', 100, 'weekly'),
('Earn a perfect score', 50, 'challenge')
ON CONFLICT DO NOTHING;

-- Badges
INSERT INTO public.badges (name, description, icon_name, condition_type, condition_value) VALUES 
('First Step', 'Completed your first lesson', 'footprints', 'events_count', 1),
('Streak Master', 'Reached a 7-day streak', 'flame', 'streak_days', 7),
('Polyglot', 'Learned phrases in 3 languages', 'globe', 'languages_count', 3),
('Early Bird', 'Studied before 8 AM', 'sun', 'time_study', 1),
('Night Owl', 'Studied after 10 PM', 'moon', 'time_study', 1)
ON CONFLICT DO NOTHING;
