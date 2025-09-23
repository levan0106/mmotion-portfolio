-- Update portfolio snapshots with varying values for Alpha/Beta calculation
-- This simulates realistic portfolio value changes over time

UPDATE portfolio_snapshots 
SET total_portfolio_value = 76370580.00,
    total_portfolio_invested = 76370580.00,
    total_portfolio_pl = 0.00,
    unrealized_portfolio_pl = 0.00,
    realized_portfolio_pl = 0.00
WHERE portfolio_id = '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1' 
  AND snapshot_date = '2025-09-20';

UPDATE portfolio_snapshots 
SET total_portfolio_value = 76850000.00,
    total_portfolio_invested = 76370580.00,
    total_portfolio_pl = 479420.00,
    unrealized_portfolio_pl = 479420.00,
    realized_portfolio_pl = 0.00
WHERE portfolio_id = '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1' 
  AND snapshot_date = '2025-09-21';

UPDATE portfolio_snapshots 
SET total_portfolio_value = 77200000.00,
    total_portfolio_invested = 76370580.00,
    total_portfolio_pl = 829420.00,
    unrealized_portfolio_pl = 829420.00,
    realized_portfolio_pl = 0.00
WHERE portfolio_id = '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1' 
  AND snapshot_date = '2025-09-22';

UPDATE portfolio_snapshots 
SET total_portfolio_value = 77050000.00,
    total_portfolio_invested = 76370580.00,
    total_portfolio_pl = 679420.00,
    unrealized_portfolio_pl = 679420.00,
    realized_portfolio_pl = 0.00
WHERE portfolio_id = '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1' 
  AND snapshot_date = '2025-09-23';

UPDATE portfolio_snapshots 
SET total_portfolio_value = 77500000.00,
    total_portfolio_invested = 76370580.00,
    total_portfolio_pl = 1129420.00,
    unrealized_portfolio_pl = 1129420.00,
    realized_portfolio_pl = 0.00
WHERE portfolio_id = '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1' 
  AND snapshot_date = '2025-09-24';

UPDATE portfolio_snapshots 
SET total_portfolio_value = 77800000.00,
    total_portfolio_invested = 76370580.00,
    total_portfolio_pl = 1429420.00,
    unrealized_portfolio_pl = 1429420.00,
    realized_portfolio_pl = 0.00
WHERE portfolio_id = '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1' 
  AND snapshot_date = '2025-09-25';

UPDATE portfolio_snapshots 
SET total_portfolio_value = 78000000.00,
    total_portfolio_invested = 76370580.00,
    total_portfolio_pl = 1629420.00,
    unrealized_portfolio_pl = 1629420.00,
    realized_portfolio_pl = 0.00
WHERE portfolio_id = '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1' 
  AND snapshot_date = '2025-09-26';

UPDATE portfolio_snapshots 
SET total_portfolio_value = 78200000.00,
    total_portfolio_invested = 76370580.00,
    total_portfolio_pl = 1829420.00,
    unrealized_portfolio_pl = 1829420.00,
    realized_portfolio_pl = 0.00
WHERE portfolio_id = '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1' 
  AND snapshot_date = '2025-09-27';

UPDATE portfolio_snapshots 
SET total_portfolio_value = 78500000.00,
    total_portfolio_invested = 76370580.00,
    total_portfolio_pl = 2129420.00,
    unrealized_portfolio_pl = 2129420.00,
    realized_portfolio_pl = 0.00
WHERE portfolio_id = '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1' 
  AND snapshot_date = '2025-09-28';

UPDATE portfolio_snapshots 
SET total_portfolio_value = 78800000.00,
    total_portfolio_invested = 76370580.00,
    total_portfolio_pl = 2429420.00,
    unrealized_portfolio_pl = 2429420.00,
    realized_portfolio_pl = 0.00
WHERE portfolio_id = '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1' 
  AND snapshot_date = '2025-09-29';

UPDATE portfolio_snapshots 
SET total_portfolio_value = 79000000.00,
    total_portfolio_invested = 76370580.00,
    total_portfolio_pl = 2629420.00,
    unrealized_portfolio_pl = 2629420.00,
    realized_portfolio_pl = 0.00
WHERE portfolio_id = '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1' 
  AND snapshot_date = '2025-09-30';

COMMIT;
