alter table "public"."awareness_memos" add column "token_text" text;

-- Optional: You might want to backfill this for existing static phrases if possible, 
-- but strictly speaking it's not required for the feature to start working for new/future memos.
-- Existing dynamic memos are already 'lost' logically so we can't backfill them easily without complex logic.
