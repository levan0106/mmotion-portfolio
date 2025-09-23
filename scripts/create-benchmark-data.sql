-- Create benchmark data for all snapshot dates
-- This will allow Alpha/Beta calculation to work properly

-- Delete existing benchmark data
DELETE FROM benchmark_data;

-- Insert benchmark data for each snapshot date
-- Simulate a benchmark that grows steadily (like VN-Index)
INSERT INTO benchmark_data (
    id,
    benchmark_id,
    benchmark_name,
    benchmark_type,
    snapshot_date,
    granularity,
    benchmark_value,
    benchmark_return_1d,
    benchmark_return_1w,
    benchmark_return_1m,
    benchmark_return_3m,
    benchmark_return_6m,
    benchmark_return_1y,
    benchmark_return_ytd,
    benchmark_volatility_1m,
    benchmark_volatility_3m,
    benchmark_volatility_1y,
    benchmark_max_drawdown_1m,
    benchmark_max_drawdown_3m,
    benchmark_max_drawdown_1y,
    is_active,
    created_at,
    updated_at
) VALUES 
-- 2025-09-20 - Starting point
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Default Benchmark', 'INDEX', '2025-09-20', 'DAILY', 1000.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, true, NOW(), NOW()),

-- 2025-09-21 - +1% gain
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Default Benchmark', 'INDEX', '2025-09-21', 'DAILY', 1010.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, true, NOW(), NOW()),

-- 2025-09-22 - +0.5% gain (total +1.5%)
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Default Benchmark', 'INDEX', '2025-09-22', 'DAILY', 1015.0, 0.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, true, NOW(), NOW()),

-- 2025-09-23 - +0.3% gain (total +1.8%)
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Default Benchmark', 'INDEX', '2025-09-23', 'DAILY', 1018.0, 0.3, 1.8, 1.8, 1.8, 1.8, 1.8, 1.8, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, true, NOW(), NOW());
