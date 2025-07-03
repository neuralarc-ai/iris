-- Add archive fields to lead, opportunity, and account tables
-- This enables soft delete functionality where records are archived instead of permanently deleted

-- Add archive fields to lead table
ALTER TABLE lead 
  ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by uuid REFERENCES users(id);

-- Add archive fields to opportunity table  
ALTER TABLE opportunity 
  ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by uuid REFERENCES users(id);

-- Add archive fields to account table
ALTER TABLE account 
  ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by uuid REFERENCES users(id);

-- Add archive fields to update table (for activity logs)
ALTER TABLE update 
  ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by uuid REFERENCES users(id);

-- Create indexes for better performance when filtering archived records
CREATE INDEX IF NOT EXISTS idx_lead_is_archived ON lead(is_archived);
CREATE INDEX IF NOT EXISTS idx_opportunity_is_archived ON opportunity(is_archived);
CREATE INDEX IF NOT EXISTS idx_account_is_archived ON account(is_archived);
CREATE INDEX IF NOT EXISTS idx_update_is_archived ON update(is_archived);

-- Add comments for documentation
COMMENT ON COLUMN lead.is_archived IS 'Whether this lead has been archived (soft deleted)';
COMMENT ON COLUMN lead.archived_at IS 'Timestamp when this lead was archived';
COMMENT ON COLUMN lead.archived_by IS 'User ID who archived this lead';

COMMENT ON COLUMN opportunity.is_archived IS 'Whether this opportunity has been archived (soft deleted)';
COMMENT ON COLUMN opportunity.archived_at IS 'Timestamp when this opportunity was archived';
COMMENT ON COLUMN opportunity.archived_by IS 'User ID who archived this opportunity';

COMMENT ON COLUMN account.is_archived IS 'Whether this account has been archived (soft deleted)';
COMMENT ON COLUMN account.archived_at IS 'Timestamp when this account was archived';
COMMENT ON COLUMN account.archived_by IS 'User ID who archived this account';

COMMENT ON COLUMN update.is_archived IS 'Whether this update has been archived (soft deleted)';
COMMENT ON COLUMN update.archived_at IS 'Timestamp when this update was archived';
COMMENT ON COLUMN update.archived_by IS 'User ID who archived this update'; 