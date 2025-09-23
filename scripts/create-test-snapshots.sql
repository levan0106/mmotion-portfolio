-- Script to create test snapshots with different prices for each day
-- This will allow performance metrics calculation to work properly

-- First, let's delete existing snapshots for the test portfolio
DELETE FROM asset_allocation_snapshots 
WHERE portfolio_id = '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1';

-- Create snapshots with varying prices to simulate market movements
-- VFF - Simulate a declining stock
INSERT INTO asset_allocation_snapshots (
    id, portfolio_id, asset_id, asset_symbol, snapshot_date, granularity,
    quantity, current_price, current_value, cost_basis, avg_cost,
    realized_pl, unrealized_pl, total_pl, allocation_percentage,
    portfolio_total_value, return_percentage, daily_return, cumulative_return,
    is_active, created_by, notes, created_at, updated_at
) VALUES 
-- VFF - Declining stock (from 35000 to 24936)
(gen_random_uuid(), '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', 'da831701-f982-4e1b-a5a7-5f08a58ac5fa', 'VFF', '2025-09-20', 'DAILY', 1080, 35000, 37800000, 35636000, 32996.2962963, -668800.5098991, 2164000, 1495199.4901009, 0, 0, 4.1956, 0, 0, true, '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5', 'Test snapshot', NOW(), NOW()),
(gen_random_uuid(), '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', 'da831701-f982-4e1b-a5a7-5f08a58ac5fa', 'VFF', '2025-09-21', 'DAILY', 1080, 32000, 34560000, 35636000, 32996.2962963, -668800.5098991, -1076000, -1744800.5098991, 0, 0, -4.8960, -8.5714, -8.5714, true, '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5', 'Test snapshot', NOW(), NOW()),
(gen_random_uuid(), '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', 'da831701-f982-4e1b-a5a7-5f08a58ac5fa', 'VFF', '2025-09-22', 'DAILY', 1080, 28000, 30240000, 35636000, 32996.2962963, -668800.5098991, -5396000, -6064800.5098991, 0, 0, -17.0100, -12.5000, -20.0000, true, '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5', 'Test snapshot', NOW(), NOW()),
(gen_random_uuid(), '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', 'da831701-f982-4e1b-a5a7-5f08a58ac5fa', 'VFF', '2025-09-23', 'DAILY', 1080, 24936, 26930880, 35636000, 32996.2962963, -668800.5098991, -8705120, -9373920.5098991, 0, 0, -24.4279, -10.9429, -28.7543, true, '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5', 'Test snapshot', NOW(), NOW()),

-- SSISCA - Stable stock with slight growth
(gen_random_uuid(), '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', '6b70352b-7251-45b8-9c12-1a2133d5b2ec', 'SSISCA', '2025-09-20', 'DAILY', 100, 45000, 4500000, 3924800, 39248, 0, 575200, 575200, 0, 0, 14.6600, 0, 0, true, '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5', 'Test snapshot', NOW(), NOW()),
(gen_random_uuid(), '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', '6b70352b-7251-45b8-9c12-1a2133d5b2ec', 'SSISCA', '2025-09-21', 'DAILY', 100, 46000, 4600000, 3924800, 39248, 0, 675200, 675200, 0, 0, 17.2000, 2.2222, 2.2222, true, '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5', 'Test snapshot', NOW(), NOW()),
(gen_random_uuid(), '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', '6b70352b-7251-45b8-9c12-1a2133d5b2ec', 'SSISCA', '2025-09-22', 'DAILY', 100, 46500, 4650000, 3924800, 39248, 0, 725200, 725200, 0, 0, 18.4800, 1.0870, 3.3333, true, '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5', 'Test snapshot', NOW(), NOW()),
(gen_random_uuid(), '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', '6b70352b-7251-45b8-9c12-1a2133d5b2ec', 'SSISCA', '2025-09-23', 'DAILY', 100, 47126, 4712600, 3924800, 39248, 0, 787800, 787800, 0, 0, 20.0724, 1.3452, 4.7244, true, '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5', 'Test snapshot', NOW(), NOW()),

-- VESAF - Volatile stock with ups and downs
(gen_random_uuid(), '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', 'c27d49f7-2a1c-4a1a-a238-e774c61f806b', 'VESAF', '2025-09-20', 'DAILY', 220, 40000, 8800000, 14395100, 65432.27272727, -539894.2573245, -5595100, -6134994.2573245, 0, 0, -38.8700, 0, 0, true, '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5', 'Test snapshot', NOW(), NOW()),
(gen_random_uuid(), '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', 'c27d49f7-2a1c-4a1a-a238-e774c61f806b', 'VESAF', '2025-09-21', 'DAILY', 220, 42000, 9240000, 14395100, 65432.27272727, -539894.2573245, -5155100, -5694994.2573245, 0, 0, -35.8700, 5.0000, 5.0000, true, '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5', 'Test snapshot', NOW(), NOW()),
(gen_random_uuid(), '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', 'c27d49f7-2a1c-4a1a-a238-e774c61f806b', 'VESAF', '2025-09-22', 'DAILY', 220, 38000, 8360000, 14395100, 65432.27272727, -539894.2573245, -6035100, -6574994.2573245, 0, 0, -42.8700, -9.5238, -5.0000, true, '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5', 'Test snapshot', NOW(), NOW()),
(gen_random_uuid(), '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', 'c27d49f7-2a1c-4a1a-a238-e774c61f806b', 'VESAF', '2025-09-23', 'DAILY', 220, 36555, 8042100, 14395100, 65432.27272727, -539894.2573245, -6353000, -6892894.2573245, 0, 0, -44.1331, -3.9342, -8.6125, true, '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5', 'Test snapshot', NOW(), NOW()),

-- REE - Strong performing stock
(gen_random_uuid(), '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', '2b14664f-f53d-4c9a-91b6-ddd6aef5c26a', 'REE', '2025-09-20', 'DAILY', 550, 60000, 33000000, 29260710, 53201.29090909, 0, 3739290, 3739290, 0, 0, 12.7800, 0, 0, true, '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5', 'Test snapshot', NOW(), NOW()),
(gen_random_uuid(), '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', '2b14664f-f53d-4c9a-91b6-ddd6aef5c26a', 'REE', '2025-09-21', 'DAILY', 550, 62000, 34100000, 29260710, 53201.29090909, 0, 4839290, 4839290, 0, 0, 16.5400, 3.3333, 3.3333, true, '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5', 'Test snapshot', NOW(), NOW()),
(gen_random_uuid(), '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', '2b14664f-f53d-4c9a-91b6-ddd6aef5c26a', 'REE', '2025-09-22', 'DAILY', 550, 64000, 35200000, 29260710, 53201.29090909, 0, 5939290, 5939290, 0, 0, 20.3000, 3.2258, 6.6667, true, '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5', 'Test snapshot', NOW(), NOW()),
(gen_random_uuid(), '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1', '2b14664f-f53d-4c9a-91b6-ddd6aef5c26a', 'REE', '2025-09-23', 'DAILY', 550, 66700, 36685000, 29260710, 53201.29090909, 0, 7424290, 7424290, 0, 0, 25.3729, 4.2188, 11.1667, true, '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5', 'Test snapshot', NOW(), NOW());

-- Also delete existing performance snapshots to force recalculation
DELETE FROM asset_performance_snapshots 
WHERE portfolio_id = '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1';

DELETE FROM asset_group_performance_snapshots 
WHERE portfolio_id = '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1';

DELETE FROM portfolio_performance_snapshots 
WHERE portfolio_id = '4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1';
