-- Production seed data script
-- This script creates the minimum required data for production system

-- 1. Create main account (required for system to work)
INSERT INTO accounts (account_id, name, email, base_currency, is_investor, is_main_account, created_at, updated_at)
VALUES (
    '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5',
    'Main System Account',
    'tung@example.com',
    'VND',
    false,
    true,
    NOW(),
    NOW()
) ON CONFLICT (account_id) DO NOTHING;

-- 2. Create global assets first
INSERT INTO global_assets (id, symbol, name, type, nation, market_code, currency, timezone, is_active, description, created_at, updated_at)
VALUES 
('86c2ae61-8f69-4608-a5fd-8fecb44ed2c5', 'VCB', 'Vietcombank Stock', 'STOCK', 'VN', 'HOSE', 'VND', 'Asia/Ho_Chi_Minh', true, 'Vietcombank stock', NOW(), NOW()),
('86c2ae61-8f69-4608-a5fd-8fecb44ed2c6', 'FPT', 'FPT Stock', 'STOCK', 'VN', 'HOSE', 'VND', 'Asia/Ho_Chi_Minh', true, 'FPT stock', NOW(), NOW()),
('86c2ae61-8f69-4608-a5fd-8fecb44ed2c7', 'GOLD', 'Gold', 'GOLD', 'VN', 'SJC', 'VND', 'Asia/Ho_Chi_Minh', true, 'Gold commodity', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Create a default portfolio for the main account
INSERT INTO portfolios (
    portfolio_id,
    account_id,
    name,
    base_currency,
    total_value,
    cash_balance,
    unrealized_pl,
    realized_pl,
    total_asset_value,
    total_invest_value,
    total_all_value,
    realized_asset_pnl,
    realized_invest_pnl,
    realized_all_pnl,
    unrealized_asset_pnl,
    unrealized_invest_pnl,
    unrealized_all_pnl,
    is_fund,
    total_outstanding_units,
    nav_per_unit,
    number_of_investors,
    created_at,
    updated_at
)
VALUES (
    '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5',
    '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5',
    'Default Portfolio',
    'VND',
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    false,
    0,
    0,
    0,
    NOW(),
    NOW()
) ON CONFLICT (portfolio_id) DO NOTHING;

-- 4. Create some sample assets
INSERT INTO assets (
    id,
    name,
    symbol,
    type,
    description,
    initial_value,
    initial_quantity,
    current_quantity,
    created_at,
    updated_at,
    created_by,
    updated_by
)
VALUES 
(
    '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5',
    'Vietcombank Stock',
    'VCB',
    'STOCK',
    'Vietcombank stock',
    100000,
    100,
    100,
    NOW(),
    NOW(),
    '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5',
    '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5'
),
(
    '86c2ae61-8f69-4608-a5fd-8fecb44ed2c6',
    'FPT Stock',
    'FPT',
    'STOCK',
    'FPT stock',
    50000,
    200,
    200,
    NOW(),
    NOW(),
    '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5',
    '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5'
),
(
    '86c2ae61-8f69-4608-a5fd-8fecb44ed2c7',
    'Gold',
    'GOLD',
    'GOLD',
    'Gold commodity',
    2000000,
    1,
    1,
    NOW(),
    NOW(),
    '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5',
    '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5'
) ON CONFLICT (id) DO NOTHING;

-- 5. Create asset prices for the assets
INSERT INTO asset_prices (
    id,
    asset_id,
    current_price,
    price_type,
    price_source,
    last_price_update,
    metadata,
    created_at,
    updated_at
)
VALUES 
(
    '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5',
    '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5',
    100000,
    'MANUAL',
    'USER_INPUT',
    NOW(),
    '{"source": "manual_input"}',
    NOW(),
    NOW()
),
(
    '86c2ae61-8f69-4608-a5fd-8fecb44ed2c6',
    '86c2ae61-8f69-4608-a5fd-8fecb44ed2c6',
    50000,
    'MANUAL',
    'USER_INPUT',
    NOW(),
    '{"source": "manual_input"}',
    NOW(),
    NOW()
),
(
    '86c2ae61-8f69-4608-a5fd-8fecb44ed2c7',
    '86c2ae61-8f69-4608-a5fd-8fecb44ed2c7',
    2000000,
    'MANUAL',
    'USER_INPUT',
    NOW(),
    '{"source": "manual_input"}',
    NOW(),
    NOW()
) ON CONFLICT (asset_id) DO NOTHING;

-- 6. Create some sample cash flows
INSERT INTO cash_flows (
    cash_flow_id,
    portfolio_id,
    type,
    amount,
    currency,
    description,
    reference,
    status,
    flow_date,
    effective_date,
    funding_source,
    created_at,
    updated_at
)
VALUES 
(
    '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5',
    '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5',
    'DEPOSIT',
    10000000,
    'VND',
    'Initial deposit',
    'INIT-001',
    'COMPLETED',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days',
    'Bank Transfer',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days'
),
(
    '86c2ae61-8f69-4608-a5fd-8fecb44ed2c6',
    '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5',
    'DEPOSIT',
    5000000,
    'VND',
    'Additional deposit',
    'INIT-002',
    'COMPLETED',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days',
    'Bank Transfer',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days'
) ON CONFLICT (cash_flow_id) DO NOTHING;

-- 7. Create a sample NAV snapshot
INSERT INTO nav_snapshots (
    "portfolioId",
    nav_date,
    nav_value,
    cash_balance,
    total_value,
    total_outstanding_units,
    nav_per_unit,
    created_at
)
VALUES 
(
    '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5',
    CURRENT_DATE,
    15000000,
    500000,
    15500000,
    1000,
    15500,
    NOW()
) ON CONFLICT ("portfolioId", nav_date) DO NOTHING;

-- Success message
SELECT 'Production data seeded successfully with account ID: 86c2ae61-8f69-4608-a5fd-8fecb44ed2c5!' as message;
