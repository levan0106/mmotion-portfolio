-- Rollback script for MigrateCodeToSymbol migration
-- This script reverses the code to symbol migration

-- Step 1: Restore code field from symbol for migrated assets
UPDATE assets 
SET code = symbol
WHERE migration_status = 'migrated_from_code'
  AND symbol IS NOT NULL;

-- Step 2: Clear symbol field for generated assets
UPDATE assets 
SET symbol = NULL
WHERE migration_status = 'generated_from_name';

-- Step 3: Reset migration status
UPDATE assets 
SET migration_status = 'pending'
WHERE migration_status IN ('migrated_from_code', 'generated_from_name', 'already_has_symbol', 'symbol_only');

-- Log completion
SELECT 'Code to symbol migration rollback completed successfully' as status;
