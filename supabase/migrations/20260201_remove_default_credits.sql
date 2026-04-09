-- Remove default credit values (now distributed via distribution_events)
alter table profiles
  alter column audio_credits set default 0,
  alter column explorer_credits set default 0,
  alter column correction_credits set default 0,
  alter column explanation_credits set default 0,
  alter column extraction_credits set default 0;