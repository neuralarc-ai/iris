ALTER TABLE opportunity
  ADD COLUMN lead_id uuid REFERENCES lead(id);

-- Add currency column to opportunity table
ALTER TABLE opportunity ADD COLUMN currency text DEFAULT 'USD';

-- Add next_action_date column to update table
ALTER TABLE update ADD COLUMN next_action_date timestamptz;
