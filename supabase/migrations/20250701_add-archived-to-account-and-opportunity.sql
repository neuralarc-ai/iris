-- Add 'archived' column to account and opportunity tables
ALTER TABLE account ADD COLUMN archived boolean DEFAULT false;
ALTER TABLE opportunity ADD COLUMN archived boolean DEFAULT false; 