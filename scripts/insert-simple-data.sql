-- Insert simple test data for portfolio performance snapshots
INSERT INTO portfolio_performance_snapshots (
  id, portfolio_id, snapshot_date, granularity,
  portfolio_twr_1d, portfolio_twr_1w, portfolio_twr_1m, portfolio_twr_3m, portfolio_twr_6m, portfolio_twr_1y, portfolio_twr_ytd,
  portfolio_mwr_1m, portfolio_mwr_3m, portfolio_mwr_6m, portfolio_mwr_1y, portfolio_mwr_ytd,
  portfolio_irr_1m, portfolio_irr_3m, portfolio_irr_6m, portfolio_irr_1y, portfolio_irr_ytd,
  portfolio_alpha_1m, portfolio_alpha_3m, portfolio_alpha_6m, portfolio_alpha_1y, portfolio_alpha_ytd,
  portfolio_beta_1m, portfolio_beta_3m, portfolio_beta_6m, portfolio_beta_1y, portfolio_beta_ytd,
  portfolio_information_ratio_1m, portfolio_information_ratio_3m, portfolio_information_ratio_1y,
  portfolio_tracking_error_1m, portfolio_tracking_error_3m, portfolio_tracking_error_1y,
  total_cash_inflows, total_cash_outflows, net_cash_flow,
  is_active, created_at, updated_at
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440001', 'f9cf6de3-36ef-4581-8b29-1aa872ed9658', '2025-09-23', 'DAILY',
  0.02, 0.05, 0.08, 0.12, 0.15, 0.20, 0.18,
  0.07, 0.11, 0.14, 0.19, 0.17,
  0.07, 0.11, 0.14, 0.19, 0.17,
  0.01, 0.02, 0.03, 0.04, 0.03,
  1.1, 1.05, 1.0, 0.95, 0.98,
  0.5, 0.6, 0.7,
  0.05, 0.06, 0.07,
  10000, 5000, 5000,
  true, NOW(), NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440002', 'f9cf6de3-36ef-4581-8b29-1aa872ed9658', '2025-09-22', 'DAILY',
  0.01, 0.04, 0.07, 0.11, 0.14, 0.19, 0.17,
  0.06, 0.10, 0.13, 0.18, 0.16,
  0.06, 0.10, 0.13, 0.18, 0.16,
  0.005, 0.015, 0.025, 0.035, 0.025,
  1.05, 1.0, 0.95, 0.90, 0.93,
  0.4, 0.5, 0.6,
  0.04, 0.05, 0.06,
  8000, 4000, 4000,
  true, NOW(), NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440003', 'f9cf6de3-36ef-4581-8b29-1aa872ed9658', '2025-09-21', 'DAILY',
  -0.01, 0.03, 0.06, 0.10, 0.13, 0.18, 0.16,
  0.05, 0.09, 0.12, 0.17, 0.15,
  0.05, 0.09, 0.12, 0.17, 0.15,
  0.0, 0.01, 0.02, 0.03, 0.02,
  1.0, 0.95, 0.90, 0.85, 0.88,
  0.3, 0.4, 0.5,
  0.03, 0.04, 0.05,
  6000, 3000, 3000,
  true, NOW(), NOW()
);
