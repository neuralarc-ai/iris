-- Add website_summary column to company table for caching website summary
ALTER TABLE company ADD COLUMN IF NOT EXISTS website_summary text;

-- Optionally, add a last_website_summary_refreshed column for tracking freshness
ALTER TABLE company ADD COLUMN IF NOT EXISTS last_website_summary_refreshed timestamptz; 