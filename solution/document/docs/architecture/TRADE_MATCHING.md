# Trade Matching Algorithm Documentation

## Overview
The Trade Matching Algorithm is responsible for matching BUY and SELL trades to calculate realized P&L. It supports both FIFO (First In, First Out) and LIFO (Last In, First Out) algorithms.

## Supported Algorithms

### 1. FIFO (First In, First Out)
- Matches oldest BUY trades first
- Default algorithm for most trading scenarios
- Ensures proper tax treatment in many jurisdictions

### 2. LIFO (Last In, First Out)
- Matches newest BUY trades first
- Alternative algorithm for specific use cases
- May provide different tax implications

## Algorithm Implementation

### FIFO Algorithm
```typescript
async processTradeMatching(sellTrade: Trade): Promise<TradeMatchingResult> {
  // Get unmatched buy trades ordered by date (oldest first)
  const buyTrades = await this.tradeRepo.findUnmatchedBuyTrades(
    sellTrade.asset_id,
    sellTrade.portfolio_id
  );

  let remainingQuantity = sellTrade.quantity;
  const matchedDetails: TradeDetail[] = [];
  let totalPnl = 0;

  for (const buyTrade of buyTrades) {
    if (remainingQuantity <= 0) break;

    const matchedQuantity = Math.min(remainingQuantity, buyTrade.quantity);
    const feeTax = this.calculateFeeTax(buyTrade, sellTrade, matchedQuantity);
    const pnl = this.calculatePnl(buyTrade.price, sellTrade.price, matchedQuantity, feeTax);

    // Create trade detail
    const tradeDetail = await this.createTradeDetail(
      sellTrade,
      buyTrade,
      matchedQuantity,
      feeTax,
      pnl
    );

    matchedDetails.push(tradeDetail);
    remainingQuantity -= matchedQuantity;
    totalPnl += pnl;
  }

  return {
    trade: sellTrade,
    matchedDetails,
    remainingQuantity,
    totalPnl
  };
}
```

### LIFO Algorithm
```typescript
async processTradeMatchingLIFO(sellTrade: Trade): Promise<TradeMatchingResult> {
  // Get unmatched buy trades ordered by date (newest first)
  const buyTrades = await this.tradeRepo.findUnmatchedBuyTrades(
    sellTrade.asset_id,
    sellTrade.portfolio_id
  ).then(trades => trades.reverse()); // Reverse for LIFO

  // Rest of the logic is similar to FIFO
  // ...
}
```

## P&L Calculation

### Gross P&L
```typescript
const grossPnl = (sellPrice - buyPrice) * matchedQuantity;
```

### Fee & Tax Calculation
```typescript
const buyFeeTax = (buyFee + buyTax) * (matchedQuantity / buyQuantity);
const sellFeeTax = (sellFee + sellTax) * (matchedQuantity / sellQuantity);
const totalFeeTax = buyFeeTax + sellFeeTax;
```

### Net P&L
```typescript
const netPnl = grossPnl - totalFeeTax;
```

## Data Structures

### TradeMatchingResult
```typescript
interface TradeMatchingResult {
  trade: Trade;
  matchedDetails: TradeDetail[];
  remainingQuantity: number;
  totalPnl: number;
}
```

### TradeDetail
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
}
```

## Database Queries

### Find Unmatched BUY Trades
```sql
SELECT t.* FROM trades t
LEFT JOIN trade_details td ON td.buy_trade_id = t.trade_id
WHERE t.asset_id = $1 
  AND t.portfolio_id = $2 
  AND t.side = 'BUY'
  AND td.detail_id IS NULL
ORDER BY t.trade_date ASC;
```

### Create Trade Detail
```sql
INSERT INTO trade_details (
  sell_trade_id, buy_trade_id, asset_id, 
  matched_qty, buy_price, sell_price, 
  fee_tax, pnl
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
```

## Error Handling

### Common Error Scenarios

1. **No Matching BUY Trades**
   - **Response**: Return with remainingQuantity = sellQuantity
   - **Action**: Log warning, don't create trade details

2. **Partial Matching**
   - **Response**: Create trade details for matched portion
   - **Action**: Update remainingQuantity accordingly

3. **Database Errors**
   - **Response**: Rollback transaction
   - **Action**: Log error and throw exception

### Validation Rules

1. **Trade Side Validation**
   - Only SELL trades can be matched
   - Only BUY trades can be matched against

2. **Quantity Validation**
   - Matched quantity cannot exceed available quantity
   - Cannot match negative quantities

3. **Asset Validation**
   - Trades must be for the same asset
   - Trades must be in the same portfolio

## Performance Optimization

### Database Indexing
```sql
-- Index for efficient trade lookup
CREATE INDEX idx_trades_asset_portfolio_side_date 
ON trades(asset_id, portfolio_id, side, trade_date);

-- Index for trade details lookup
CREATE INDEX idx_trade_details_sell_trade 
ON trade_details(sell_trade_id);

CREATE INDEX idx_trade_details_buy_trade 
ON trade_details(buy_trade_id);
```

### Batch Processing
For large volumes, consider batch processing:
```typescript
async processBatchMatching(sellTrades: Trade[]): Promise<TradeMatchingResult[]> {
  const results = [];
  
  for (const sellTrade of sellTrades) {
    try {
      const result = await this.processTradeMatching(sellTrade);
      results.push(result);
    } catch (error) {
      // Log error and continue with next trade
      console.error(`Failed to process trade ${sellTrade.trade_id}:`, error);
    }
  }
  
  return results;
}
```

## Testing

### Unit Tests
```typescript
describe('Trade Matching', () => {
  it('should match trades in FIFO order', async () => {
    const buyTrades = [
      { trade_id: '1', trade_date: '2024-01-01', quantity: 100 },
      { trade_id: '2', trade_date: '2024-01-02', quantity: 50 }
    ];
    
    const sellTrade = { quantity: 75 };
    const result = await processTradeMatching(sellTrade);
    
    expect(result.matchedDetails[0].buy_trade_id).toBe('1');
    expect(result.matchedDetails[1].buy_trade_id).toBe('2');
    expect(result.remainingQuantity).toBe(0);
  });
});
```

### Integration Tests
```typescript
describe('Trade Matching Integration', () => {
  it('should create correct trade details', async () => {
    const sellTrade = await createSellTrade();
    const result = await processTradeMatching(sellTrade);
    
    expect(result.matchedDetails).toHaveLength(2);
    expect(result.totalPnl).toBeGreaterThan(0);
    
    // Verify database records
    const tradeDetails = await getTradeDetails(sellTrade.trade_id);
    expect(tradeDetails).toHaveLength(2);
  });
});
```

## Monitoring and Logging

### Key Metrics
- **Matching Rate**: Percentage of trades successfully matched
- **Average P&L**: Average P&L per matched trade
- **Processing Time**: Time taken to process each trade
- **Error Rate**: Percentage of failed matching attempts

### Logging
```typescript
logger.info('Trade matching started', {
  sellTradeId: sellTrade.trade_id,
  assetId: sellTrade.asset_id,
  quantity: sellTrade.quantity
});

logger.info('Trade matching completed', {
  sellTradeId: sellTrade.trade_id,
  matchedDetails: result.matchedDetails.length,
  totalPnl: result.totalPnl,
  remainingQuantity: result.remainingQuantity
});
```

## Related Documentation

- [FIFO Engine](./FIFO_ENGINE.md)
- [Trading Analysis API](./TRADING_ANALYSIS_API.md)
- [Database Schema](./DATABASE_SCHEMA.md)
