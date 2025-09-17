# FIFO Engine Documentation

## Overview
The FIFO (First In, First Out) Engine is responsible for matching BUY and SELL trades and calculating realized P&L for individual trade details. It ensures accurate P&L calculation by properly handling fees, taxes, and trade matching.

## Core Components

### 1. Trade Matching Algorithm
The FIFO engine matches SELL trades with BUY trades in chronological order (oldest BUY trades first).

### 2. P&L Calculation
For each matched trade pair, the engine calculates:
- **Gross P&L**: (Sell Price - Buy Price) × Matched Quantity
- **Fee & Tax**: Proportional fees and taxes based on matched quantity
- **Net P&L**: Gross P&L - Fee & Tax

## Key Methods

### `processTradeMatching(sellTrade: Trade)`
Main method for processing trade matching using FIFO algorithm.

**Parameters:**
- `sellTrade`: The SELL trade to be matched

**Returns:**
```typescript
interface TradeMatchingResult {
  trade: Trade;
  matchedDetails: TradeDetail[];
  remainingQuantity: number;
  totalPnl: number;
}
```

### `calculateFeeTax(buyTrade: Trade, sellTrade: Trade, matchedQuantity: number)`
Calculates proportional fees and taxes for matched trades.

**Parameters:**
- `buyTrade`: The BUY trade
- `sellTrade`: The SELL trade  
- `matchedQuantity`: The quantity being matched

**Returns:**
- `number`: Total fee and tax for this match

**Implementation:**
```typescript
private calculateFeeTax(buyTrade: Trade, sellTrade: Trade, matchedQuantity: number): number {
  // Proportional fee and tax based on matched quantity
  const buyFee = parseFloat(buyTrade.fee?.toString() || '0');
  const buyTax = parseFloat(buyTrade.tax?.toString() || '0');
  const sellFee = parseFloat(sellTrade.fee?.toString() || '0');
  const sellTax = parseFloat(sellTrade.tax?.toString() || '0');
  
  const buyFeeTax = (buyFee + buyTax) * (matchedQuantity / buyTrade.quantity);
  const sellFeeTax = (sellFee + sellTax) * (matchedQuantity / sellTrade.quantity);
  
  return buyFeeTax + sellFeeTax;
}
```

### `calculatePnl(buyPrice: number, sellPrice: number, matchedQuantity: number, feeTax: number)`
Calculates P&L for a trade match.

**Parameters:**
- `buyPrice`: The buy price
- `sellPrice`: The sell price
- `matchedQuantity`: The matched quantity
- `feeTax`: The total fee and tax

**Returns:**
- `number`: Net P&L (Gross P&L - Fee & Tax)

## Data Flow

1. **Trade Input**: SELL trade is provided to the engine
2. **BUY Trade Lookup**: Find unmatched BUY trades for the same asset and portfolio
3. **FIFO Matching**: Match with oldest BUY trades first
4. **P&L Calculation**: Calculate realized P&L for each match
5. **Trade Detail Creation**: Create TradeDetail records for each match
6. **Portfolio Update**: Update portfolio positions and P&L

## Error Handling

### String/Number Conversion
The engine properly handles database values that may be stored as strings:
```typescript
const buyFee = parseFloat(buyTrade.fee?.toString() || '0');
const buyTax = parseFloat(buyTrade.tax?.toString() || '0');
```

### Null/Undefined Values
Default values are provided for missing fee/tax data:
```typescript
const buyFee = parseFloat(buyTrade.fee?.toString() || '0');
```

## Example Usage

```typescript
// Process a SELL trade
const result = await fifoEngine.processTradeMatching(sellTrade);

console.log(`Matched ${result.matchedDetails.length} trades`);
console.log(`Total P&L: ${result.totalPnl}`);
console.log(`Remaining quantity: ${result.remainingQuantity}`);
```

## Database Schema

### TradeDetail Table
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

## Performance Considerations

1. **Database Indexing**: Ensure proper indexes on trade_date, portfolio_id, and asset_id
2. **Batch Processing**: Consider batch processing for large trade volumes
3. **Memory Usage**: Monitor memory usage for large datasets
4. **Transaction Handling**: Use database transactions for data consistency

## Testing

### Unit Tests
```typescript
describe('FIFO Engine', () => {
  it('should calculate P&L correctly', () => {
    const buyTrade = { price: 100, quantity: 10, fee: 5, tax: 2 };
    const sellTrade = { price: 110, quantity: 5, fee: 3, tax: 1 };
    const matchedQty = 5;
    
    const feeTax = calculateFeeTax(buyTrade, sellTrade, matchedQty);
    const pnl = calculatePnl(100, 110, 5, feeTax);
    
    expect(pnl).toBe(47.5); // (110-100)*5 - (3.5+2) = 50 - 2.5 = 47.5
  });
});
```

### Integration Tests
```typescript
describe('Trade Matching Integration', () => {
  it('should match trades correctly', async () => {
    const sellTrade = await createSellTrade();
    const result = await fifoEngine.processTradeMatching(sellTrade);
    
    expect(result.matchedDetails).toHaveLength(2);
    expect(result.totalPnl).toBeGreaterThan(0);
  });
});
```

## Troubleshooting

### Common Issues

1. **NaN Values in P&L**
   - **Cause**: String values not properly converted to numbers
   - **Solution**: Use `parseFloat()` with proper null handling

2. **Incorrect Fee Calculation**
   - **Cause**: Null/undefined fee values
   - **Solution**: Provide default values with `|| '0'`

3. **Matching Issues**
   - **Cause**: Incorrect trade filtering or ordering
   - **Solution**: Verify trade queries and sorting logic

### Debug Tools

Use the debug script to inspect trade details:
```bash
npx ts-node scripts/debug-trade-details.ts
```

## Related Documentation

- [Trading Analysis API](./TRADING_ANALYSIS_API.md)
- [Trade Matching Algorithm](./TRADE_MATCHING.md)
- [Database Schema](./DATABASE_SCHEMA.md)
