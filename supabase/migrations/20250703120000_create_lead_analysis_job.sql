CREATE TABLE IF NOT EXISTS lead_analysis_job (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid REFERENCES lead(id) ON DELETE CASCADE,
    status text NOT NULL CHECK (status IN ('pending', 'processing', 'success', 'error')),
    error_message text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lead_analysis_job_status ON lead_analysis_job(status); 