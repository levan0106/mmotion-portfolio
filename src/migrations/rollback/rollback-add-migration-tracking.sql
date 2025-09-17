-- Rollback script for AddMigrationTrackingToAssets migration
-- This script removes the migration tracking column

-- Step 1: Remove migration status index
DROP INDEX IF EXISTS IDX_ASSET_MIGRATION_STATUS;

-- Step 2: Remove migration status column
ALTER TABLE assets 
DROP COLUMN migration_status;

-- Log completion
SELECT 'Migration tracking rollback completed successfully' as status;
