# PnL Calculation System Analysis

## System Overview
The Portfolio Management System uses a **pre-calculated PnL approach** with real-time computed properties for flexibility.

## PnL Storage Architecture

### 1. Database Storage (Primary)
**Entity**: `TradeDetail`
```typescript
@Column('decimal', { precision: 18, scale: 8 })
pnl: number;  // Pre-calculated and stored in DB
```

### 2. Real-time Computation (Secondary)
**Computed Properties**:
```typescript
get grossPnl(): number {
  return (this.sellPrice - this.buyPrice) * this.matchedQty;
}

get netPnl(): number {
  return this.grossPnl - this.feeTax;
}
```

## PnL Calculation Process

### 1. Trade Matching Trigger
- **When**: SELL trade is created and matched with BUY trades
- **Algorithm**: FIFO or LIFO matching
- **Engine**: `FIFOEngine` or `LIFOEngine`

### 2. PnL Calculation Formula
```typescript
private calculatePnl(buyPrice: number, sellPrice: number, quantity: number, feeTax: number): number {
  const grossPnl = (sellPrice - buyPrice) * quantity;
  return grossPnl - feeTax;  // Net PnL
}
```

### 3. Database Persistence
- **Field**: `TradeDetail.pnl` stores calculated value
- **Timing**: Calculated during trade matching process
- **Persistence**: Permanent storage in database

## API Endpoints

### Trade Details with PnL
**Endpoint**: `GET /api/v1/trades/{id}/details`
**Response Structure**:
```typescript
{
  trade: Trade,           // Original trade info
  tradeDetails: [         // Array of matched trades with PnL
    {
      detailId: string,
      matchedQty: number,
      buyPrice: number,
      sellPrice: number,
      pnl: number,        // Pre-calculated PnL
      grossPnl: number,   // Real-time computed
      netPnl: number      // Real-time computed
    }
  ]
}
```

## Performance Characteristics

### Advantages of Pre-calculated Approach
- ⚡ **Fast Query Performance**: No real-time calculations needed
- 📊 **Data Consistency**: PnL values don't change over time
- 🔍 **Audit Trail**: Historical PnL calculations are preserved
- 📈 **Analytics Ready**: Pre-calculated values for reporting

### Real-time Computation Benefits
- 🔄 **Flexibility**: Can recalculate with different parameters
- 🧮 **Validation**: Cross-check pre-calculated values
- 📊 **Dynamic Analysis**: Real-time PnL analysis capabilities

## System Components

### 1. Trading Engines
- **FIFOEngine**: First In, First Out matching
- **LIFOEngine**: Last In, First Out matching
- **Responsibility**: Calculate and store PnL during matching

### 2. Trading Service
- **Method**: `getTradeDetails()`
- **Function**: Retrieve trade with pre-calculated PnL
- **Performance**: Database query with relations

### 3. Trade Detail Repository
- **Storage**: PnL values in `trade_details` table
- **Relations**: Links to buy/sell trades
- **Indexing**: Optimized for PnL queries

## Use Cases

### 1. Trade Analysis
- **Realized PnL**: From completed trade matches
- **Performance**: Trade profitability analysis
- **Reporting**: Portfolio performance reports

### 2. Portfolio Management
- **Position Tracking**: Current holdings value
- **Risk Assessment**: PnL distribution analysis
- **Performance Metrics**: Sharpe ratio, VaR calculations

### 3. Audit & Compliance
- **Trade History**: Complete PnL audit trail
- **Regulatory Reporting**: Pre-calculated values for compliance
- **Data Integrity**: Immutable PnL records

## Technical Implementation

### Database Schema
```sql
CREATE TABLE trade_details (
  detail_id UUID PRIMARY KEY,
  sell_trade_id UUID NOT NULL,
  buy_trade_id UUID NOT NULL,
  asset_id UUID NOT NULL,
  matched_qty DECIMAL(18,8) NOT NULL,
  buy_price DECIMAL(18,8) NOT NULL,
  sell_price DECIMAL(18,8) NOT NULL,
  fee_tax DECIMAL(18,8) DEFAULT 0,
  pnl DECIMAL(18,8) NOT NULL,  -- Pre-calculated PnL
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Calculation Flow
1. **Trade Creation**: SELL trade created
2. **Matching Process**: FIFO/LIFO engine finds matching BUY trades
3. **PnL Calculation**: `calculatePnl()` method computes PnL
4. **Database Storage**: PnL stored in `TradeDetail.pnl` field
5. **API Response**: Pre-calculated PnL returned to client

## Conclusion
The system uses a **hybrid approach**:
- **Primary**: Pre-calculated PnL stored in database for performance
- **Secondary**: Real-time computed properties for flexibility
- **Result**: Optimal balance between performance and functionality

## Status: ✅ ANALYZED
**Date**: 2025-09-29
**Impact**: Understanding of PnL calculation architecture
**Next Steps**: No changes needed - system is well-designed
