# Trading Analysis API Documentation

## Overview
The Trading Analysis API provides comprehensive analysis of trading performance, including P&L calculations, risk metrics, and performance statistics for portfolios.

## Base URL
```
http://localhost:3000/api/v1/trades
```

## Endpoints

### 1. Get Trade Analysis
**GET** `/analysis/portfolio`

Get comprehensive trading analysis for a portfolio including statistics, P&L summary, risk metrics, and performance data.

#### Query Parameters
- `portfolioId` (required): Portfolio ID
- `assetId` (optional): Filter by specific asset
- `startDate` (optional): Start date filter (ISO string)
- `endDate` (optional): End date filter (ISO string)

#### Example Request
```bash
GET /api/v1/trades/analysis/portfolio?portfolioId=f9cf6de3-36ef-4581-8b29-1aa872ed9658
```

#### Response Structure
```json
{
  "statistics": {
    "total_trades": 20,
    "buy_trades": 10,
    "sell_trades": 10,
    "total_volume": 327646000,
    "total_value": 327646000,
    "average_price": 6514200,
    "total_fees": 467000,
    "total_taxes": 223000
  },
  "pnlSummary": {
    "totalPnl": -12168611.2,
    "totalVolume": 327646000,
    "averagePnl": -3042152.8,
    "winCount": 4,
    "lossCount": 5,
    "winRate": 44.44
  },
  "topTrades": [
    {
      "detail_id": "uuid",
      "sell_trade_id": "uuid",
      "buy_trade_id": "uuid",
      "asset_id": "uuid",
      "matched_qty": "100.00000000",
      "buy_price": "50000.00000000",
      "sell_price": "95000.00000000",
      "fee_tax": "6000.00000000",
      "pnl": "1794000.00000000",
      "created_at": "2025-09-12T07:19:06.026Z",
      "sell_trade": { /* Trade object */ },
      "buy_trade": { /* Trade object */ },
      "asset": { /* Asset object */ }
    }
  ],
  "worstTrades": [
    {
      "detail_id": "uuid",
      "sell_trade_id": "uuid",
      "buy_trade_id": "uuid",
      "asset_id": "uuid",
      "matched_qty": "0.30000000",
      "buy_price": "120000000.00000000",
      "sell_price": "1550000.00000000",
      "fee_tax": "49000.00000000",
      "pnl": "-35584000.00000000",
      "created_at": "2025-09-12T07:19:06.074Z",
      "sell_trade": { /* Trade object */ },
      "buy_trade": { /* Trade object */ },
      "asset": { /* Asset object */ }
    }
  ],
  "monthly_performance": [
    {
      "month": "2024-01",
      "trades_count": 3,
      "total_pl": 699995.83333333,
      "total_volume": 20300000,
      "win_rate": 100,
      "winning_trades": 1,
      "losing_trades": 0
    }
  ],
  "asset_performance": [
    {
      "asset_id": "uuid",
      "asset_symbol": "GOLD",
      "asset_name": "Gold",
      "total_pl": "2080645.58",
      "trades_count": 8,
      "win_rate": 25,
      "total_volume": 191246000,
      "quantity": "121.700000",
      "avg_cost": "1532903.49",
      "market_value": "188635000.00"
    }
  ],
  "risk_metrics": {
    "sharpe_ratio": -0.01,
    "volatility": 22465273.16,
    "var_95": -35627000,
    "max_drawdown": 37569000
  }
}
```

## Key Features

### 1. P&L Calculation
- **Realized P&L**: Calculated from matched trade details using FIFO algorithm
- **Unrealized P&L**: Based on current portfolio positions
- **Fee & Tax Handling**: Properly calculated and included in P&L

### 2. Win Rate Calculation
- Based on actual realized P&L from trade details
- International standard calculation: (Winning Trades / Total Realized Trades) × 100
- Only counts trades with actual P&L (not just trade count)

### 3. Risk Metrics
- **Sharpe Ratio**: Risk-adjusted return metric
- **Volatility**: Standard deviation of monthly returns
- **VaR (95%)**: Value at Risk at 95% confidence level
- **Max Drawdown**: Maximum peak-to-trough decline

### 4. Monthly Performance
- Aggregated by month with proper P&L summation
- Includes trade counts, volumes, and win rates
- Sorted chronologically

### 5. Asset Performance
- Performance breakdown by individual assets
- Includes unrealized P&L, trade counts, and win rates
- Sorted by total P&L (descending)

## Data Types

### Trade Detail
```typescript
interface TradeDetail {
  detail_id: string;
  sell_trade_id: string;
  buy_trade_id: string;
  asset_id: string;
  matched_qty: string;
  buy_price: string;
  sell_price: string;
  fee_tax: string;
  pnl: string;
  created_at: string;
  sell_trade: Trade;
  buy_trade: Trade;
  asset: Asset;
}
```

### Risk Metrics
```typescript
interface RiskMetrics {
  sharpe_ratio: number;
  volatility: number;
  var_95: number;
  max_drawdown: number;
}
```

### Monthly Performance
```typescript
interface MonthlyPerformance {
  month: string; // YYYY-MM format
  trades_count: number;
  total_pl: number;
  total_volume: number;
  win_rate: number;
  winning_trades: number;
  losing_trades: number;
}
```

## Error Handling

### Common Error Responses
- **400 Bad Request**: Invalid query parameters
- **404 Not Found**: Portfolio not found
- **500 Internal Server Error**: Server-side calculation errors

### Example Error Response
```json
{
  "statusCode": 400,
  "message": "Invalid query parameters",
  "error": "BadRequestException"
}
```

## Performance Considerations

1. **Database Queries**: Optimized with proper indexing on trade_date, portfolio_id, and asset_id
2. **Caching**: Consider implementing Redis caching for frequently accessed data
3. **Pagination**: Large datasets should implement pagination for top/worst trades
4. **Async Processing**: Heavy calculations are performed asynchronously

## Dependencies

- **FIFO Engine**: For trade matching and P&L calculation
- **TypeORM**: For database operations
- **PostgreSQL**: Primary database
- **NestJS**: Framework for API implementation

## Changelog

### Version 1.0.0 (2025-09-12)
- Initial implementation of Trading Analysis API
- Fixed P&L calculation issues with string/number handling
- Implemented proper risk metrics calculation
- Added comprehensive error handling
- Fixed monthly performance aggregation
- Improved win rate calculation based on realized P&L

## Testing

### Sample Data
Use the test data endpoint to get sample portfolios and assets:
```bash
GET /api/v1/trades/test-data
```

### Test Portfolio
- Portfolio ID: `f9cf6de3-36ef-4581-8b29-1aa872ed9658`
- Contains 20 trades across multiple assets
- Includes both historical and recent trades
- Covers various P&L scenarios (profits and losses)

## Related Documentation

- [FIFO Engine Documentation](./FIFO_ENGINE.md)
- [Trade Matching Algorithm](./TRADE_MATCHING.md)
- [Portfolio Management API](./PORTFOLIO_API.md)
- [Database Schema](./DATABASE_SCHEMA.md)
