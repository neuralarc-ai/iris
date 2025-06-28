ALTER TABLE opportunity
  ADD COLUMN lead_id uuid REFERENCES lead(id);
