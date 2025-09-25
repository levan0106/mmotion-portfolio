-- Fix NaN Holdings Script
-- This script fixes holdings that have NaN values by recalculating from transactions

-- First, let's see what we're dealing with
SELECT 
    'BEFORE FIX' as status,
    holding_id,
    total_units,
    avg_cost_per_unit,
    total_investment,
    current_value,
    unrealized_pnl,
    realized_pnl
FROM investor_holdings 
WHERE total_units::text = 'NaN' 
   OR current_value::text = 'NaN' 
   OR unrealized_pnl::text = 'NaN';

-- Create a temporary table to calculate correct values from transactions
CREATE TEMP TABLE temp_holding_calculations AS
SELECT 
    h.holding_id,
    h.account_id,
    h.portfolio_id,
    COALESCE(SUM(
        CASE 
            WHEN t.holding_type = 'SUBSCRIBE' THEN t.units
            WHEN t.holding_type = 'REDEEM' THEN -t.units
            ELSE 0
        END
    ), 0) as calculated_total_units,
    COALESCE(SUM(
        CASE 
            WHEN t.holding_type = 'SUBSCRIBE' THEN t.amount
            WHEN t.holding_type = 'REDEEM' THEN -t.amount
            ELSE 0
        END
    ), 0) as calculated_total_investment,
    COALESCE(SUM(
        CASE 
            WHEN t.holding_type = 'REDEEM' THEN (t.nav_per_unit - (h.avg_cost_per_unit)) * t.units
            ELSE 0
        END
    ), 0) as calculated_realized_pnl
FROM investor_holdings h
LEFT JOIN fund_unit_transactions t ON h.holding_id = t.holding_id
WHERE h.total_units::text = 'NaN' 
   OR h.current_value::text = 'NaN' 
   OR h.unrealized_pnl::text = 'NaN'
GROUP BY h.holding_id, h.account_id, h.portfolio_id, h.avg_cost_per_unit;

-- Show calculated values
SELECT 
    'CALCULATED VALUES' as status,
    holding_id,
    calculated_total_units,
    calculated_total_investment,
    calculated_realized_pnl,
    CASE 
        WHEN calculated_total_units > 0 THEN calculated_total_investment / calculated_total_units
        ELSE 0
    END as calculated_avg_cost_per_unit
FROM temp_holding_calculations;

-- Update holdings with calculated values
UPDATE investor_holdings 
SET 
    total_units = CASE 
        WHEN thc.calculated_total_units > 0 THEN thc.calculated_total_units
        ELSE 0
    END,
    avg_cost_per_unit = CASE 
        WHEN thc.calculated_total_units > 0 THEN thc.calculated_total_investment / thc.calculated_total_units
        ELSE 0
    END,
    total_investment = thc.calculated_total_investment,
    current_value = CASE 
        WHEN thc.calculated_total_units > 0 THEN thc.calculated_total_units * p.nav_per_unit
        ELSE 0
    END,
    unrealized_pnl = CASE 
        WHEN thc.calculated_total_units > 0 THEN (thc.calculated_total_units * p.nav_per_unit) - thc.calculated_total_investment
        ELSE 0
    END,
    realized_pnl = thc.calculated_realized_pnl,
    updated_at = NOW()
FROM temp_holding_calculations thc
JOIN portfolios p ON thc.portfolio_id = p.portfolio_id
WHERE investor_holdings.holding_id = thc.holding_id
  AND (investor_holdings.total_units::text = 'NaN' 
       OR investor_holdings.current_value::text = 'NaN' 
       OR investor_holdings.unrealized_pnl::text = 'NaN');

-- Show results after fix
SELECT 
    'AFTER FIX' as status,
    holding_id,
    total_units,
    avg_cost_per_unit,
    total_investment,
    current_value,
    unrealized_pnl,
    realized_pnl
FROM investor_holdings 
WHERE holding_id IN (
    SELECT holding_id 
    FROM temp_holding_calculations
);

-- Check if any NaN values remain
SELECT 
    'REMAINING NaN VALUES' as status,
    COUNT(*) as count
FROM investor_holdings 
WHERE total_units::text = 'NaN' 
   OR current_value::text = 'NaN' 
   OR unrealized_pnl::text = 'NaN';

-- Clean up
DROP TABLE temp_holding_calculations;
