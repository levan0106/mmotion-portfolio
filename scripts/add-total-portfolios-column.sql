-- Add total_portfolios column to snapshot_tracking table
ALTER TABLE snapshot_tracking 
ADD COLUMN IF NOT EXISTS total_portfolios INTEGER DEFAULT 0;
