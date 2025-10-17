-- Create snapshot_tracking table
CREATE TABLE IF NOT EXISTS snapshot_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  execution_id UUID NOT NULL,
  portfolio_id VARCHAR(255),
  portfolio_name VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'started',
  type VARCHAR(20) NOT NULL DEFAULT 'automated',
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  total_snapshots INTEGER DEFAULT 0,
  successful_snapshots INTEGER DEFAULT 0,
  failed_snapshots INTEGER DEFAULT 0,
  execution_time_ms INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSON,
  created_by VARCHAR(255),
  cron_expression VARCHAR(255),
  timezone VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_snapshot_tracking_execution_id ON snapshot_tracking(execution_id);
CREATE INDEX IF NOT EXISTS idx_snapshot_tracking_status ON snapshot_tracking(status);
CREATE INDEX IF NOT EXISTS idx_snapshot_tracking_type ON snapshot_tracking(type);
CREATE INDEX IF NOT EXISTS idx_snapshot_tracking_created_at ON snapshot_tracking(created_at);
CREATE INDEX IF NOT EXISTS idx_snapshot_tracking_portfolio_id ON snapshot_tracking(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_snapshot_tracking_status_type_created ON snapshot_tracking(status, type, created_at);

-- Add comment
COMMENT ON TABLE snapshot_tracking IS 'Tracks automated snapshot creation executions';
COMMENT ON COLUMN snapshot_tracking.execution_id IS 'Unique identifier for each execution run';
COMMENT ON COLUMN snapshot_tracking.portfolio_id IS 'Portfolio ID for portfolio-specific tracking';
COMMENT ON COLUMN snapshot_tracking.status IS 'Execution status: started, in_progress, completed, failed, cancelled';
COMMENT ON COLUMN snapshot_tracking.type IS 'Execution type: automated, manual, test';
COMMENT ON COLUMN snapshot_tracking.metadata IS 'Additional metadata as JSON';
