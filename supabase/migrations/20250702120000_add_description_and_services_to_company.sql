-- Add description column to company table
ALTER TABLE company ADD COLUMN IF NOT EXISTS description text;

-- Create company_service table for services/products
CREATE TABLE IF NOT EXISTS company_service (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES company(id),
    name text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
); 