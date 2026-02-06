-- Add unique constraint on (term, language_code) for upsert to work
ALTER TABLE public.slang_terms ADD CONSTRAINT slang_terms_term_language_code_unique UNIQUE (term, language_code);
