-- Add options column to extraction_jobs for storing auto-generation settings
ALTER TABLE extraction_jobs
ADD COLUMN IF NOT EXISTS options JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN extraction_jobs.options IS 'Optional settings for extraction job (includeReading, autoGenerateTranslation, autoGenerateReading)';
