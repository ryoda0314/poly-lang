-- Add unique constraint to avoid duplicates per language
alter table public.slang_terms
add constraint slang_terms_term_lang_unique unique (term, language_code);
