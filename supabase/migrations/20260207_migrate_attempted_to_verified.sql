-- Migrate all existing 'attempted' memos to 'verified' and start SRS cycle
-- strength: 0 -> 1 (first successful use)
-- next_review_at: ~1 day from now (base interval for strength 1, medium confidence)
update awareness_memos
set
  status = 'verified',
  verified_at = coalesce(attempted_at, now()),
  strength = 1,
  last_reviewed_at = now(),
  next_review_at = now() + interval '1 day'
where status = 'attempted';
