-- Insert user profile if not exists
INSERT INTO profiles (id, username, gender, learning_language, native_language, settings)
VALUES ('423128d1-ede3-4e44-af4e-1f456662719b', 'ryoda', 'unspecified', 'en', 'ja', '{}'::jsonb)
ON CONFLICT (id) DO UPDATE SET 
  settings = COALESCE(profiles.settings, '{}'::jsonb);

-- Create trigger for automatic profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
