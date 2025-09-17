-- Rollback script for ResolveSymbolConflicts migration
-- This script reverses the symbol conflict resolution

-- Step 1: Restore original symbols for conflict-resolved assets
UPDATE assets 
SET 
  symbol = REGEXP_REPLACE(symbol, '_\d+$', ''),
  migration_status = CASE 
    WHEN migration_status = 'conflict_resolved' THEN 'migrated_from_code'
    ELSE migration_status
  END
WHERE migration_status = 'conflict_resolved'
  AND symbol ~ '_\d+$';

-- Step 2: Reset migration status for conflict-resolved assets
UPDATE assets 
SET migration_status = 'migrated_from_code'
WHERE migration_status = 'conflict_resolved';

-- Log completion
SELECT 'Symbol conflicts rollback completed successfully' as status;
