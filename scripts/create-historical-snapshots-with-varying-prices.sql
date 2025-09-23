-- Script to create historical snapshots with varying prices for testing TWR calculation
-- This simulates realistic price movements over time

-- First, delete existing snapshots to start fresh
DELETE FROM asset_allocation_snapshots WHERE portfolio_id = '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1';
DELETE FROM portfolio_performance_snapshots WHERE portfolio_id = '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1';
DELETE FROM asset_performance_snapshots WHERE portfolio_id = '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1';
DELETE FROM asset_group_performance_snapshots WHERE portfolio_id = '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1';

-- Insert historical snapshots with varying prices for each asset
-- VFF (BOND) - Simulating declining bond prices
INSERT INTO asset_allocation_snapshots (
    id, portfolio_id, asset_id, asset_symbol, snapshot_date, granularity,
    quantity, current_price, current_value, cost_basis, avg_cost,
    realized_pl, unrealized_pl, total_pl, allocation_percentage, portfolio_total_value,
    return_percentage, daily_return, cumulative_return, is_active, created_by, notes,
    created_at, updated_at
) VALUES 
-- VFF - Day 1 (2025-09-20)
(gen_random_uuid(), '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', 'da831701-f982-4e1b-a5a7-5f08a58ac5fa', 'VFF', '2025-09-20', 'DAILY',
 1080, 26000, 28080000, 35156000, 32551.85, 206042.29, -7078000, -6871957.71, 36.78, 76370580, -19.55, 0, 0, true, 'system', 'Historical snapshot', NOW(), NOW()),

-- VFF - Day 2 (2025-09-21) - Price down 2%
(gen_random_uuid(), '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', 'da831701-f982-4e1b-a5a7-5f08a58ac5fa', 'VFF', '2025-09-21', 'DAILY',
 1080, 25480, 27518400, 35156000, 32551.85, 206042.29, -7637600, -7431557.71, 36.03, 76370580, -21.73, -2.00, -2.00, true, 'system', 'Historical snapshot', NOW(), NOW()),

-- VFF - Day 3 (2025-09-22) - Price down 1.5%
('vff-2025-09-22', '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', 'da831701-f982-4e1b-a5a7-5f08a58ac5fa', 'VFF', '2025-09-22', 'DAILY',
 1080, 25098, 27105840, 35156000, 32551.85, 206042.29, -8050160, -7844117.71, 35.50, 76370580, -22.31, -1.50, -3.47, true, 'system', 'Historical snapshot', NOW(), NOW()),

-- VFF - Day 4 (2025-09-23) - Price up 1%
('vff-2025-09-23', '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', 'da831701-f982-4e1b-a5a7-5f08a58ac5fa', 'VFF', '2025-09-23', 'DAILY',
 1080, 25349, 27376920, 35156000, 32551.85, 206042.29, -7779080, -7573037.71, 35.85, 76370580, -21.66, 1.00, -2.50, true, 'system', 'Historical snapshot', NOW(), NOW()),

-- VFF - Day 5 (2025-09-24) - Price down 3%
('vff-2025-09-24', '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', 'da831701-f982-4e1b-a5a7-5f08a58ac5fa', 'VFF', '2025-09-24', 'DAILY',
 1080, 24588, 26555040, 35156000, 32551.85, 206042.29, -8600960, -8394917.71, 34.78, 76370580, -24.46, -3.00, -5.43, true, 'system', 'Historical snapshot', NOW(), NOW()),

-- VFF - Day 6 (2025-09-25) - Price up 2.5%
('vff-2025-09-25', '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', 'da831701-f982-4e1b-a5a7-5f08a58ac5fa', 'VFF', '2025-09-25', 'DAILY',
 1080, 25203, 27219240, 35156000, 32551.85, 206042.29, -7936760, -7730717.71, 35.65, 76370580, -22.55, 2.50, -3.00, true, 'system', 'Historical snapshot', NOW(), NOW()),

-- VFF - Day 7 (2025-09-26) - Price down 1%
('vff-2025-09-26', '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', 'da831701-f982-4e1b-a5a7-5f08a58ac5fa', 'VFF', '2025-09-26', 'DAILY',
 1080, 24951, 26947080, 35156000, 32551.85, 206042.29, -8208920, -8002877.71, 35.29, 76370580, -23.40, -1.00, -3.97, true, 'system', 'Historical snapshot', NOW(), NOW()),

-- VFF - Day 8 (2025-09-27) - Price up 0.5%
('vff-2025-09-27', '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', 'da831701-f982-4e1b-a5a7-5f08a58ac5fa', 'VFF', '2025-09-27', 'DAILY',
 1080, 25076, 27082080, 35156000, 32551.85, 206042.29, -8073920, -7867877.71, 35.47, 76370580, -22.95, 0.50, -3.50, true, 'system', 'Historical snapshot', NOW(), NOW()),

-- VFF - Day 9 (2025-09-28) - Price down 2.5%
('vff-2025-09-28', '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', 'da831701-f982-4e1b-a5a7-5f08a58ac5fa', 'VFF', '2025-09-28', 'DAILY',
 1080, 24449, 26404920, 35156000, 32551.85, 206042.29, -8751080, -8545037.71, 34.58, 76370580, -24.90, -2.50, -5.92, true, 'system', 'Historical snapshot', NOW(), NOW());

-- SSISCA (STOCK) - Simulating stable stock with slight growth
INSERT INTO asset_allocation_snapshots (
    id, portfolio_id, asset_id, asset_symbol, snapshot_date, granularity,
    quantity, current_price, current_value, cost_basis, avg_cost,
    realized_pl, unrealized_pl, total_pl, allocation_percentage, portfolio_total_value,
    return_percentage, daily_return, cumulative_return, is_active, created_by, notes,
    created_at, updated_at
) VALUES 
-- SSISCA - Day 1 (2025-09-20)
('ssisca-2025-09-20', '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', '6b70352b-7251-45b8-9c12-1a2133d5b2ec', 'SSISCA', '2025-09-20', 'DAILY',
 100, 45000, 4500000, 3924800, 39248, 0, 575200, 575200, 5.89, 76370580, 14.66, 0, 0, true, 'system', 'Historical snapshot', NOW(), NOW()),

-- SSISCA - Day 2 (2025-09-21) - Price up 1%
('ssisca-2025-09-21', '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', '6b70352b-7251-45b8-9c12-1a2133d5b2ec', 'SSISCA', '2025-09-21', 'DAILY',
 100, 45450, 4545000, 3924800, 39248, 0, 620200, 620200, 5.95, 76370580, 15.81, 1.00, 1.00, true, 'system', 'Historical snapshot', NOW(), NOW()),

-- SSISCA - Day 3 (2025-09-22) - Price up 0.5%
('ssisca-2025-09-22', '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', '6b70352b-7251-45b8-9c12-1a2133d5b2ec', 'SSISCA', '2025-09-22', 'DAILY',
 100, 45677, 4567700, 3924800, 39248, 0, 642900, 642900, 5.98, 76370580, 16.38, 0.50, 1.50, true, 'system', 'Historical snapshot', NOW(), NOW()),

-- SSISCA - Day 4 (2025-09-23) - Price down 0.5%
('ssisca-2025-09-23', '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', '6b70352b-7251-45b8-9c12-1a2133d5b2ec', 'SSISCA', '2025-09-23', 'DAILY',
 100, 45449, 4544900, 3924800, 39248, 0, 620100, 620100, 5.95, 76370580, 15.81, -0.50, 1.00, true, 'system', 'Historical snapshot', NOW(), NOW()),

-- SSISCA - Day 5 (2025-09-24) - Price up 2%
('ssisca-2025-09-24', '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', '6b70352b-7251-45b8-9c12-1a2133d5b2ec', 'SSISCA', '2025-09-24', 'DAILY',
 100, 46358, 4635800, 3924800, 39248, 0, 711000, 711000, 6.07, 76370580, 18.12, 2.00, 3.00, true, 'system', 'Historical snapshot', NOW(), NOW()),

-- SSISCA - Day 6 (2025-09-25) - Price up 1.5%
('ssisca-2025-09-25', '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', '6b70352b-7251-45b8-9c12-1a2133d5b2ec', 'SSISCA', '2025-09-25', 'DAILY',
 100, 47053, 4705300, 3924800, 39248, 0, 780500, 780500, 6.16, 76370580, 19.89, 1.50, 4.55, true, 'system', 'Historical snapshot', NOW(), NOW()),

-- SSISCA - Day 7 (2025-09-26) - Price up 0.2%
('ssisca-2025-09-26', '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', '6b70352b-7251-45b8-9c12-1a2133d5b2ec', 'SSISCA', '2025-09-26', 'DAILY',
 100, 47147, 4714700, 3924800, 39248, 0, 789900, 789900, 6.17, 76370580, 20.13, 0.20, 4.75, true, 'system', 'Historical snapshot', NOW(), NOW()),

-- SSISCA - Day 8 (2025-09-27) - Price down 0.1%
('ssisca-2025-09-27', '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', '6b70352b-7251-45b8-9c12-1a2133d5b2ec', 'SSISCA', '2025-09-27', 'DAILY',
 100, 47100, 4710000, 3924800, 39248, 0, 785200, 785200, 6.17, 76370580, 20.01, -0.10, 4.65, true, 'system', 'Historical snapshot', NOW(), NOW()),

-- SSISCA - Day 9 (2025-09-28) - Price up 0.1%
('ssisca-2025-09-28', '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', '6b70352b-7251-45b8-9c12-1a2133d5b2ec', 'SSISCA', '2025-09-28', 'DAILY',
 100, 47147, 4714700, 3924800, 39248, 0, 789900, 789900, 6.17, 76370580, 20.13, 0.10, 4.75, true, 'system', 'Historical snapshot', NOW(), NOW());

-- VESAF (STOCK) - Simulating volatile stock
INSERT INTO asset_allocation_snapshots (
    id, portfolio_id, asset_id, asset_symbol, snapshot_date, granularity,
    quantity, current_price, current_value, cost_basis, avg_cost,
    realized_pl, unrealized_pl, total_pl, allocation_percentage, portfolio_total_value,
    return_percentage, daily_return, cumulative_return, is_active, created_by, notes,
    created_at, updated_at
) VALUES 
-- VESAF - Day 1 (2025-09-20)
('vesaf-2025-09-20', '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', 'c27d49f7-2a1c-4a1a-a238-e774c61f806b', 'VESAF', '2025-09-20', 'DAILY',
 220, 38000, 8360000, 9395100, 42705, -1142844.26, -1035100, -2177944.26, 10.95, 76370580, -11.02, 0, 0, true, 'system', 'Historical snapshot', NOW(), NOW()),

-- VESAF - Day 2 (2025-09-21) - Price down 3%
('vesaf-2025-09-21', '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', 'c27d49f7-2a1c-4a1a-a238-e774c61f806b', 'VESAF', '2025-09-21', 'DAILY',
 220, 36860, 8109200, 9395100, 42705, -1142844.26, -1285900, -2428744.26, 10.62, 76370580, -13.69, -3.00, -3.00, true, 'system', 'Historical snapshot', NOW(), NOW()),

-- VESAF - Day 3 (2025-09-22) - Price up 2%
('vesaf-2025-09-22', '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', 'c27d49f7-2a1c-4a1a-a238-e774c61f806b', 'VESAF', '2025-09-22', 'DAILY',
 220, 37597, 8271340, 9395100, 42705, -1142844.26, -1123760, -2266604.26, 10.83, 76370580, -12.00, 2.00, -1.06, true, 'system', 'Historical snapshot', NOW(), NOW()),

-- VESAF - Day 4 (2025-09-23) - Price down 1%
('vesaf-2025-09-23', '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', 'c27d49f7-2a1c-4a1a-a238-e774c61f806b', 'VESAF', '2025-09-23', 'DAILY',
 220, 37221, 8188620, 9395100, 42705, -1142844.26, -1206480, -2349324.26, 10.72, 76370580, -12.84, -1.00, -2.04, true, 'system', 'Historical snapshot', NOW(), NOW()),

-- VESAF - Day 5 (2025-09-24) - Price up 4%
('vesaf-2025-09-24', '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', 'c27d49f7-2a1c-4a1a-a238-e774c61f806b', 'VESAF', '2025-09-24', 'DAILY',
 220, 38710, 8516200, 9395100, 42705, -1142844.26, -878900, -2021744.26, 11.15, 76370580, -9.35, 4.00, 1.87, true, 'system', 'Historical snapshot', NOW(), NOW()),

-- VESAF - Day 6 (2025-09-25) - Price down 2%
('vesaf-2025-09-25', '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', 'c27d49f7-2a1c-4a1a-a238-e774c61f806b', 'VESAF', '2025-09-25', 'DAILY',
 220, 37936, 8345920, 9395100, 42705, -1049180, -1049180, -2098360, 10.93, 76370580, -11.16, -2.00, -0.17, true, 'system', 'Historical snapshot', NOW(), NOW()),

-- VESAF - Day 7 (2025-09-26) - Price down 1.5%
('vesaf-2025-09-26', '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', 'c27d49f7-2a1c-4a1a-a238-e774c61f806b', 'VESAF', '2025-09-26', 'DAILY',
 220, 37367, 8220740, 9395100, 42705, -1142844.26, -1174360, -2317204.26, 10.77, 76370580, -12.50, -1.50, -1.65, true, 'system', 'Historical snapshot', NOW(), NOW()),

-- VESAF - Day 8 (2025-09-27) - Price up 1%
('vesaf-2025-09-27', '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', 'c27d49f7-2a1c-4a1a-a238-e774c61f806b', 'VESAF', '2025-09-27', 'DAILY',
 220, 37741, 8303020, 9395100, 42705, -1142844.26, -1092080, -2234924.26, 10.87, 76370580, -11.62, 1.00, -0.68, true, 'system', 'Historical snapshot', NOW(), NOW()),

-- VESAF - Day 9 (2025-09-28) - Price down 3.5%
('vesaf-2025-09-28', '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', 'c27d49f7-2a1c-4a1a-a238-e774c61f806b', 'VESAF', '2025-09-28', 'DAILY',
 220, 36420, 8012400, 9395100, 42705, -1142844.26, -1382700, -2525544.26, 10.49, 76370580, -14.72, -3.50, -4.15, true, 'system', 'Historical snapshot', NOW(), NOW());

-- REE (STOCK) - Simulating strong performing stock
INSERT INTO asset_allocation_snapshots (
    id, portfolio_id, asset_id, asset_symbol, snapshot_date, granularity,
    quantity, current_price, current_value, cost_basis, avg_cost,
    realized_pl, unrealized_pl, total_pl, allocation_percentage, portfolio_total_value,
    return_percentage, daily_return, cumulative_return, is_active, created_by, notes,
    created_at, updated_at
) VALUES 
-- REE - Day 1 (2025-09-20)
('ree-2025-09-20', '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', '2b14664f-f53d-4c9a-91b6-ddd6aef5c26a', 'REE', '2025-09-20', 'DAILY',
 550, 65000, 35750000, 29260710, 53201.29, 0, 6489290, 6489290, 46.82, 76370580, 22.18, 0, 0, true, 'system', 'Historical snapshot', NOW(), NOW()),

-- REE - Day 2 (2025-09-21) - Price up 1.5%
('ree-2025-09-21', '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', '2b14664f-f53d-4c9a-91b6-ddd6aef5c26a', 'REE', '2025-09-21', 'DAILY',
 550, 65975, 36286250, 29260710, 53201.29, 0, 7025540, 7025540, 47.51, 76370580, 24.01, 1.50, 1.50, true, 'system', 'Historical snapshot', NOW(), NOW()),

-- REE - Day 3 (2025-09-22) - Price up 2%
('ree-2025-09-22', '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', '2b14664f-f53d-4c9a-91b6-ddd6aef5c26a', 'REE', '2025-09-22', 'DAILY',
 550, 67295, 37012250, 29260710, 53201.29, 0, 7751540, 7751540, 48.46, 76370580, 26.49, 2.00, 3.53, true, 'system', 'Historical snapshot', NOW(), NOW()),

-- REE - Day 4 (2025-09-23) - Price down 0.5%
('ree-2025-09-23', '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', '2b14664f-f53d-4c9a-91b6-ddd6aef5c26a', 'REE', '2025-09-23', 'DAILY',
 550, 66958, 36826900, 29260710, 53201.29, 0, 7566190, 7566190, 48.22, 76370580, 25.86, -0.50, 3.01, true, 'system', 'Historical snapshot', NOW(), NOW()),

-- REE - Day 5 (2025-09-24) - Price up 3%
('ree-2025-09-24', '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', '2b14664f-f53d-4c9a-91b6-ddd6aef5c26a', 'REE', '2025-09-24', 'DAILY',
 550, 68967, 37931850, 29260710, 53201.29, 0, 8671140, 8671140, 49.67, 76370580, 29.63, 3.00, 6.10, true, 'system', 'Historical snapshot', NOW(), NOW()),

-- REE - Day 6 (2025-09-25) - Price up 1%
('ree-2025-09-25', '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', '2b14664f-f53d-4c9a-91b6-ddd6aef5c26a', 'REE', '2025-09-25', 'DAILY',
 550, 69657, 38311350, 29260710, 53201.29, 0, 9050640, 9050640, 50.16, 76370580, 30.93, 1.00, 7.16, true, 'system', 'Historical snapshot', NOW(), NOW()),

-- REE - Day 7 (2025-09-26) - Price up 0.5%
('ree-2025-09-26', '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', '2b14664f-f53d-4c9a-91b6-ddd6aef5c26a', 'REE', '2025-09-26', 'DAILY',
 550, 70005, 38502750, 29260710, 53201.29, 0, 9242040, 9242040, 50.42, 76370580, 31.58, 0.50, 7.69, true, 'system', 'Historical snapshot', NOW(), NOW()),

-- REE - Day 8 (2025-09-27) - Price down 1%
('ree-2025-09-27', '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', '2b14664f-f53d-4c9a-91b6-ddd6aef5c26a', 'REE', '2025-09-27', 'DAILY',
 550, 69305, 38117750, 29260710, 53201.29, 0, 8857040, 8857040, 49.92, 76370580, 30.27, -1.00, 6.62, true, 'system', 'Historical snapshot', NOW(), NOW()),

-- REE - Day 9 (2025-09-28) - Price up 2.5%
('ree-2025-09-28', '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', '2b14664f-f53d-4c9a-91b6-ddd6aef5c26a', 'REE', '2025-09-28', 'DAILY',
 550, 71038, 39070900, 29260710, 53201.29, 0, 9810190, 9810190, 51.16, 76370580, 33.53, 2.50, 9.19, true, 'system', 'Historical snapshot', NOW(), NOW());

-- Update portfolio_total_value for all snapshots to be consistent
UPDATE asset_allocation_snapshots 
SET portfolio_total_value = 76370580 
WHERE portfolio_id = '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1';

-- Recalculate allocation percentages based on actual values
UPDATE asset_allocation_snapshots 
SET allocation_percentage = ROUND((current_value / 76370580.0) * 100, 4)
WHERE portfolio_id = '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1';

COMMIT;
