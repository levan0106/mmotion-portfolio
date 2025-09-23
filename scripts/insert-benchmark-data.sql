-- Insert benchmark data for Alpha/Beta calculation
-- Delete existing data first
DELETE FROM benchmark_data WHERE benchmark_id = '00000000-0000-0000-0000-000000000001';

-- Insert benchmark data for the period
INSERT INTO benchmark_data (
    id, benchmark_id, benchmark_name, benchmark_type, snapshot_date, granularity,
    benchmark_value, benchmark_return_1d, benchmark_return_1w, benchmark_return_1m,
    benchmark_return_3m, benchmark_return_6m, benchmark_return_1y, benchmark_return_ytd,
    benchmark_volatility_1m, benchmark_volatility_3m, benchmark_volatility_1y,
    benchmark_max_drawdown_1m, benchmark_max_drawdown_3m, benchmark_max_drawdown_1y,
    is_active, created_at, updated_at
) VALUES 
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'VN-Index Mock', 'INDEX', '2025-09-20', 'DAILY', 1000.00, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, true, NOW(), NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'VN-Index Mock', 'INDEX', '2025-09-21', 'DAILY', 1010.00, 1.0000, 7.0000, 30.0000, 90.0000, 180.0000, 360.0000, 270.0000, 15.0000, 12.0000, 9.0000, -3.0000, -4.5000, -6.0000, true, NOW(), NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'VN-Index Mock', 'INDEX', '2025-09-22', 'DAILY', 1015.00, 0.5000, 3.5000, 15.0000, 45.0000, 90.0000, 180.0000, 135.0000, 7.5000, 6.0000, 4.5000, -1.5000, -2.2500, -3.0000, true, NOW(), NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'VN-Index Mock', 'INDEX', '2025-09-23', 'DAILY', 1018.00, 0.3000, 2.1000, 9.0000, 27.0000, 54.0000, 108.0000, 81.0000, 4.5000, 3.6000, 2.7000, -0.9000, -1.3500, -1.8000, true, NOW(), NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'VN-Index Mock', 'INDEX', '2025-09-24', 'DAILY', 1021.08, 0.3000, 2.1000, 9.0000, 27.0000, 54.0000, 108.0000, 81.0000, 4.5000, 3.6000, 2.7000, -0.9000, -1.3500, -1.8000, true, NOW(), NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'VN-Index Mock', 'INDEX', '2025-09-25', 'DAILY', 1022.43, 0.1300, 0.9100, 3.9000, 11.7000, 23.4000, 46.8000, 35.1000, 1.9500, 1.5600, 1.1700, -0.3900, -0.5850, -0.7800, true, NOW(), NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'VN-Index Mock', 'INDEX', '2025-09-26', 'DAILY', 1020.37, -0.2000, -1.4000, -6.0000, -18.0000, -36.0000, -72.0000, -54.0000, -3.0000, -2.4000, -1.8000, 0.6000, 0.9000, 1.2000, true, NOW(), NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'VN-Index Mock', 'INDEX', '2025-09-27', 'DAILY', 1019.15, -0.1200, -0.8400, -3.6000, -10.8000, -21.6000, -43.2000, -32.4000, -1.8000, -1.4400, -1.0800, 0.3600, 0.5400, 0.7200, true, NOW(), NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'VN-Index Mock', 'INDEX', '2025-09-28', 'DAILY', 1019.91, 0.0800, 0.5600, 2.4000, 7.2000, 14.4000, 28.8000, 21.6000, 1.2000, 0.9600, 0.7200, -0.2400, -0.3600, -0.4800, true, NOW(), NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'VN-Index Mock', 'INDEX', '2025-09-29', 'DAILY', 1016.80, -0.3000, -2.1000, -9.0000, -27.0000, -54.0000, -108.0000, -81.0000, -4.5000, -3.6000, -2.7000, 0.9000, 1.3500, 1.8000, true, NOW(), NOW());

COMMIT;
