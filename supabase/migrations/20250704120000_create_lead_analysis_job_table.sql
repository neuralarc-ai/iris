-- Create lead_analysis_job table for tracking cron job status
CREATE TABLE IF NOT EXISTS lead_analysis_job (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name text NOT NULL,
    status text NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'error')),
    started_at timestamptz,
    completed_at timestamptz,
    last_run timestamptz,
    processed_count integer DEFAULT 0,
    error_count integer DEFAULT 0,
    error_message text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add index for job name lookups
CREATE INDEX IF NOT EXISTS idx_lead_analysis_job_name ON lead_analysis_job(job_name);

-- Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_lead_analysis_job_status ON lead_analysis_job(status);

-- Insert initial job record
INSERT INTO lead_analysis_job (job_name, status, last_run)
VALUES ('lead_enrichment_cron', 'pending', now())
ON CONFLICT (job_name) DO NOTHING; 