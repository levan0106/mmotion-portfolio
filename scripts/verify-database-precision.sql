-- Verify Database Precision Script
-- This script checks if all tables have the correct 3 decimal places precision

-- Check investor_holdings table precision
SELECT 
    'investor_holdings' as table_name,
    column_name,
    data_type,
    numeric_precision,
    numeric_scale,
    CASE 
        WHEN column_name IN ('total_units', 'avg_cost_per_unit') AND numeric_scale = 3 THEN '✅ CORRECT'
        WHEN column_name IN ('total_investment', 'current_value', 'unrealized_pnl', 'realized_pnl') AND numeric_scale = 3 THEN '✅ CORRECT'
        ELSE '❌ INCORRECT'
    END as status
FROM information_schema.columns 
WHERE table_name = 'investor_holdings' 
AND column_name IN ('total_units', 'avg_cost_per_unit', 'total_investment', 'current_value', 'unrealized_pnl', 'realized_pnl')
ORDER BY ordinal_position;

-- Check fund_unit_transactions table precision
SELECT 
    'fund_unit_transactions' as table_name,
    column_name,
    data_type,
    numeric_precision,
    numeric_scale,
    CASE 
        WHEN column_name IN ('units', 'nav_per_unit', 'amount') AND numeric_scale = 3 THEN '✅ CORRECT'
        ELSE '❌ INCORRECT'
    END as status
FROM information_schema.columns 
WHERE table_name = 'fund_unit_transactions' 
AND column_name IN ('units', 'nav_per_unit', 'amount')
ORDER BY ordinal_position;

-- Check portfolios table precision
SELECT 
    'portfolios' as table_name,
    column_name,
    data_type,
    numeric_precision,
    numeric_scale,
    CASE 
        WHEN column_name IN ('total_outstanding_units', 'nav_per_unit') AND numeric_scale = 3 THEN '✅ CORRECT'
        ELSE '❌ INCORRECT'
    END as status
FROM information_schema.columns 
WHERE table_name = 'portfolios' 
AND column_name IN ('total_outstanding_units', 'nav_per_unit')
ORDER BY ordinal_position;

-- Check nav_snapshots table precision
SELECT 
    'nav_snapshots' as table_name,
    column_name,
    data_type,
    numeric_precision,
    numeric_scale,
    CASE 
        WHEN column_name IN ('total_outstanding_units', 'nav_per_unit') AND numeric_scale = 3 THEN '✅ CORRECT'
        ELSE '❌ INCORRECT'
    END as status
FROM information_schema.columns 
WHERE table_name = 'nav_snapshots' 
AND column_name IN ('total_outstanding_units', 'nav_per_unit')
ORDER BY ordinal_position;

-- Check if fund_unit_transactions table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'fund_unit_transactions') 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as fund_unit_transactions_table;

-- Check migration status
SELECT 
    id,
    timestamp,
    name,
    CASE 
        WHEN name LIKE '%NavUnitSystem%' THEN '✅ NAV Unit System'
        WHEN name LIKE '%NavPerUnit%' THEN '✅ NAV Per Unit'
        WHEN name LIKE '%LastNavDate%' THEN '✅ Last NAV Date'
        WHEN name LIKE '%FundUnitTransactions%' THEN '✅ Fund Unit Transactions'
        WHEN name LIKE '%UpdateNavPrecision%' THEN '✅ NAV Precision Update'
        WHEN name LIKE '%UpdateCurrencyPrecision%' THEN '✅ Currency Precision Update'
        ELSE '❓ Other Migration'
    END as migration_status
FROM migrations 
WHERE name LIKE '%Nav%' OR name LIKE '%Fund%' OR name LIKE '%Precision%'
ORDER BY timestamp DESC;
