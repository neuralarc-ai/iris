-- Add website, industry, and job_title columns to the lead table
ALTER TABLE lead ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE lead ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE lead ADD COLUMN IF NOT EXISTS job_title text; 