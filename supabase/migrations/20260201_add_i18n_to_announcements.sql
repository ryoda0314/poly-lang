-- Add multi-language support to announcements and distribution_events
-- Translations stored as JSONB: {"ja": "日本語", "en": "English", "ko": "한국어", ...}
-- Original columns (title, content, description) serve as fallback/default

-- ============================================================
-- Announcements: add translation columns
-- ============================================================
alter table announcements
  add column if not exists title_i18n jsonb default '{}'::jsonb,
  add column if not exists content_i18n jsonb default '{}'::jsonb;

comment on column announcements.title_i18n is 'Localized titles: {"ja": "...", "en": "...", "ko": "..."}';
comment on column announcements.content_i18n is 'Localized content: {"ja": "...", "en": "...", "ko": "..."}';

-- ============================================================
-- Distribution Events: add translation columns
-- ============================================================
alter table distribution_events
  add column if not exists title_i18n jsonb default '{}'::jsonb,
  add column if not exists description_i18n jsonb default '{}'::jsonb;

comment on column distribution_events.title_i18n is 'Localized titles: {"ja": "...", "en": "...", "ko": "..."}';
comment on column distribution_events.description_i18n is 'Localized descriptions: {"ja": "...", "en": "...", "ko": "..."}';

-- ============================================================
-- Helper function to get localized text with fallback
-- ============================================================
create or replace function get_localized_text(
  p_i18n jsonb,
  p_fallback text,
  p_locale text default 'ja'
)
returns text as $$
begin
  -- Try requested locale first
  if p_i18n ? p_locale and (p_i18n ->> p_locale) is not null and (p_i18n ->> p_locale) != '' then
    return p_i18n ->> p_locale;
  end if;

  -- Fall back to Japanese
  if p_locale != 'ja' and p_i18n ? 'ja' and (p_i18n ->> 'ja') is not null and (p_i18n ->> 'ja') != '' then
    return p_i18n ->> 'ja';
  end if;

  -- Fall back to English
  if p_locale != 'en' and p_i18n ? 'en' and (p_i18n ->> 'en') is not null and (p_i18n ->> 'en') != '' then
    return p_i18n ->> 'en';
  end if;

  -- Use original column value as final fallback
  return p_fallback;
end;
$$ language plpgsql immutable;