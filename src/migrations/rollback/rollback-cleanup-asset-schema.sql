-- Rollback script for CleanupAssetSchema migration
-- This script reverses the schema cleanup changes

-- Step 1: Add code column back
ALTER TABLE assets 
ADD COLUMN code VARCHAR(50);

-- Step 2: Restore code values from symbol (best-effort rollback)
UPDATE assets 
SET code = symbol;

-- Step 3: Make symbol field nullable
ALTER TABLE assets 
ALTER COLUMN symbol DROP NOT NULL;

-- Step 4: Remove new constraints
DROP INDEX IF EXISTS UQ_ASSET_USER_SYMBOL;
DROP INDEX IF EXISTS IDX_ASSET_USER_NAME;

-- Step 5: Restore old constraints
CREATE INDEX IDX_ASSET_CODE ON assets (code);
CREATE UNIQUE INDEX UQ_ASSET_NAME ON assets (name);

-- Step 6: Restore old symbol index
DROP INDEX IF EXISTS IDX_ASSET_SYMBOL;
CREATE INDEX IDX_ASSET_SYMBOL ON assets (symbol);

-- Log completion
SELECT 'Schema rollback completed successfully' as status;
