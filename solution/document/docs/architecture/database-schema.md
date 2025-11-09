# Database Schema Documentation

## Overview
This document describes the database schema for the MMotion Portfolio Management System, focusing on trading and portfolio management entities.

## Core Tables

### 1. Accounts
```sql
CREATE TABLE accounts (
  account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  base_currency VARCHAR(3) NOT NULL DEFAULT 'VND',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Portfolios
```sql
CREATE TABLE portfolios (
  portfolio_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(account_id),
  name VARCHAR(255) NOT NULL,
  base_currency VARCHAR(3) NOT NULL DEFAULT 'VND',
  total_value DECIMAL(20,2) DEFAULT 0,
  cash_balance DECIMAL(20,2) DEFAULT 0,
  unrealized_pl DECIMAL(20,2) DEFAULT 0,
  realized_pl DECIMAL(20,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Assets
```sql
CREATE TABLE assets (
  asset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- STOCK, BOND, COMMODITY, etc.
  asset_class VARCHAR(50) NOT NULL, -- EQUITY, FIXED_INCOME, etc.
  currency VARCHAR(3) NOT NULL DEFAULT 'VND',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Trades
```sql
CREATE TABLE trades (
  trade_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(portfolio_id),
  asset_id UUID NOT NULL REFERENCES assets(asset_id),
  trade_date TIMESTAMP NOT NULL,
  side VARCHAR(10) NOT NULL CHECK (side IN ('BUY', 'SELL')),
  quantity DECIMAL(20,8) NOT NULL,
  price DECIMAL(20,8) NOT NULL,
  fee DECIMAL(20,8) DEFAULT 0,
  tax DECIMAL(20,8) DEFAULT 0,
  trade_type VARCHAR(20) DEFAULT 'NORMAL',
  source VARCHAR(20) DEFAULT 'MANUAL',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. Trade Details
```sql
CREATE TABLE trade_details (
  detail_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sell_trade_id UUID NOT NULL REFERENCES trades(trade_id),
  buy_trade_id UUID NOT NULL REFERENCES trades(trade_id),
  asset_id UUID NOT NULL REFERENCES assets(asset_id),
  matched_qty DECIMAL(20,8) NOT NULL,
  buy_price DECIMAL(20,8) NOT NULL,
  sell_price DECIMAL(20,8) NOT NULL,
  fee_tax DECIMAL(20,8) NOT NULL,
  pnl DECIMAL(20,8) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6. Portfolio Assets
```sql
CREATE TABLE portfolio_assets (
  portfolio_id UUID NOT NULL REFERENCES portfolios(portfolio_id),
  asset_id UUID NOT NULL REFERENCES assets(asset_id),
  quantity DECIMAL(20,8) NOT NULL DEFAULT 0,
  avg_cost DECIMAL(20,8) NOT NULL DEFAULT 0,
  market_value DECIMAL(20,8) NOT NULL DEFAULT 0,
  unrealized_pl DECIMAL(20,8) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (portfolio_id, asset_id)
);
```

## Indexes

### Performance Indexes
```sql
-- Trades table indexes
CREATE INDEX idx_trades_portfolio_asset ON trades(portfolio_id, asset_id);
CREATE INDEX idx_trades_date ON trades(trade_date);
CREATE INDEX idx_trades_side ON trades(side);
CREATE INDEX idx_trades_asset_portfolio_side_date ON trades(asset_id, portfolio_id, side, trade_date);

-- Trade details indexes
CREATE INDEX idx_trade_details_sell_trade ON trade_details(sell_trade_id);
CREATE INDEX idx_trade_details_buy_trade ON trade_details(buy_trade_id);
CREATE INDEX idx_trade_details_asset ON trade_details(asset_id);

-- Portfolio assets indexes
CREATE INDEX idx_portfolio_assets_portfolio ON portfolio_assets(portfolio_id);
CREATE INDEX idx_portfolio_assets_asset ON portfolio_assets(asset_id);
```

### Unique Constraints
```sql
-- Ensure unique asset symbols
ALTER TABLE assets ADD CONSTRAINT uk_assets_symbol UNIQUE (symbol);

-- Ensure unique account emails
ALTER TABLE accounts ADD CONSTRAINT uk_accounts_email UNIQUE (email);
```

## Data Types

### Decimal Precision
- **Quantities**: `DECIMAL(20,8)` - Supports up to 12 digits before decimal, 8 after
- **Prices**: `DECIMAL(20,8)` - High precision for price calculations
- **P&L**: `DECIMAL(20,8)` - High precision for profit/loss calculations
- **Fees/Taxes**: `DECIMAL(20,8)` - High precision for fee calculations

### String Lengths
- **Symbols**: `VARCHAR(50)` - Stock symbols, currency codes
- **Names**: `VARCHAR(255)` - Asset names, portfolio names
- **Notes**: `TEXT` - Unlimited length for trade notes

## Relationships

### Foreign Key Relationships
```sql
-- Portfolios belong to accounts
portfolios.account_id → accounts.account_id

-- Trades belong to portfolios and assets
trades.portfolio_id → portfolios.portfolio_id
trades.asset_id → assets.asset_id

-- Trade details link trades
trade_details.sell_trade_id → trades.trade_id
trade_details.buy_trade_id → trades.trade_id
trade_details.asset_id → assets.asset_id

-- Portfolio assets link portfolios and assets
portfolio_assets.portfolio_id → portfolios.portfolio_id
portfolio_assets.asset_id → assets.asset_id
```

## Sample Data

### Sample Accounts
```sql
INSERT INTO accounts (account_id, name, email, base_currency) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Test User', 'test@example.com', 'VND');
```

### Sample Portfolios
```sql
INSERT INTO portfolios (portfolio_id, account_id, name, base_currency, total_value, cash_balance) VALUES
('f9cf6de3-36ef-4581-8b29-1aa872ed9658', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Test Portfolio', 'VND', 100000000, 50000000);
```

### Sample Assets
```sql
INSERT INTO assets (asset_id, symbol, name, type, asset_class, currency) VALUES
('592c32b6-66a3-4bf5-abed-95e95c26f794', 'HPG', 'Hoa Phat Group', 'STOCK', 'EQUITY', 'VND'),
('195c429b-66be-4a65-87cc-0929cf35ad3c', 'VCB', 'Vietcombank', 'STOCK', 'EQUITY', 'VND'),
('0de842f3-eefc-41f1-aaae-04655ce6b4b6', 'GOLD', 'Gold', 'COMMODITY', 'COMMODITY', 'VND');
```

## Data Integrity

### Constraints
```sql
-- Ensure positive quantities
ALTER TABLE trades ADD CONSTRAINT chk_trades_quantity_positive CHECK (quantity > 0);

-- Ensure positive prices
ALTER TABLE trades ADD CONSTRAINT chk_trades_price_positive CHECK (price > 0);

-- Ensure valid trade sides
ALTER TABLE trades ADD CONSTRAINT chk_trades_side_valid CHECK (side IN ('BUY', 'SELL'));

-- Ensure positive matched quantities
ALTER TABLE trade_details ADD CONSTRAINT chk_trade_details_matched_qty_positive CHECK (matched_qty > 0);
```

### Triggers
```sql
-- Update portfolio totals when trades are inserted
CREATE OR REPLACE FUNCTION update_portfolio_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update portfolio asset quantities and values
  INSERT INTO portfolio_assets (portfolio_id, asset_id, quantity, avg_cost, market_value, unrealized_pl)
  VALUES (NEW.portfolio_id, NEW.asset_id, NEW.quantity, NEW.price, NEW.quantity * NEW.price, 0)
  ON CONFLICT (portfolio_id, asset_id)
  DO UPDATE SET
    quantity = portfolio_assets.quantity + NEW.quantity,
    avg_cost = (portfolio_assets.avg_cost * portfolio_assets.quantity + NEW.price * NEW.quantity) / (portfolio_assets.quantity + NEW.quantity),
    market_value = (portfolio_assets.quantity + NEW.quantity) * NEW.price,
    updated_at = CURRENT_TIMESTAMP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_portfolio_totals
  AFTER INSERT ON trades
  FOR EACH ROW
  EXECUTE FUNCTION update_portfolio_totals();
```

## Performance Considerations

### Query Optimization
1. **Use Indexes**: Always use appropriate indexes for WHERE clauses
2. **Limit Results**: Use LIMIT for large result sets
3. **Avoid SELECT ***: Select only needed columns
4. **Use EXPLAIN**: Analyze query execution plans

### Maintenance
1. **Regular VACUUM**: Keep tables optimized
2. **Index Rebuilding**: Rebuild indexes periodically
3. **Statistics Updates**: Keep table statistics current
4. **Partitioning**: Consider partitioning for large tables

## Backup and Recovery

### Backup Strategy
```bash
# Full database backup
pg_dump -h localhost -U postgres -d mmotion_portfolio > backup_$(date +%Y%m%d).sql

# Schema only backup
pg_dump -h localhost -U postgres -d mmotion_portfolio --schema-only > schema_backup.sql

# Data only backup
pg_dump -h localhost -U postgres -d mmotion_portfolio --data-only > data_backup.sql
```

### Recovery
```bash
# Restore from backup
psql -h localhost -U postgres -d mmotion_portfolio < backup_20250912.sql
```

## Related Documentation

- [Trading Analysis API](./TRADING_ANALYSIS_API.md)
- [FIFO Engine](./FIFO_ENGINE.md)
- [Trade Matching Algorithm](./TRADE_MATCHING.md)
