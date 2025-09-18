# Cash Balance Implementation

## Overview

This document describes the complete implementation of cash balance management in the Portfolio Management System. The implementation provides automatic cash balance updates from trades and manual cash flow management capabilities.

## Features Implemented

### 1. Automatic Cash Balance Updates from Trades

- **BUY Trades**: Automatically reduce cash balance by `(quantity × price) + fee + tax`
- **SELL Trades**: Automatically increase cash balance by `(quantity × price) - fee - tax`
- **Cash Flow Tracking**: All trade-related cash flows are automatically recorded in the `cash_flows` table

### 2. Manual Cash Flow Management

- **Deposits**: Add money to portfolio
- **Withdrawals**: Remove money from portfolio
- **Dividends**: Record dividend payments
- **Interest**: Record interest payments
- **Other**: Custom cash flow types

### 3. API Endpoints

#### Portfolio Creation with Initial Cash Balance
```http
POST /api/v1/portfolios
{
  "name": "My Portfolio",
  "baseCurrency": "VND",
  "accountId": "uuid",
  "description": "Portfolio description",
  "cashBalance": 10000000  // Optional initial cash balance
}
```

#### Manual Cash Flow Operations
```http
POST /api/v1/portfolios/{id}/cash-flow
{
  "amount": 1000000,
  "type": "DEPOSIT",
  "description": "Initial deposit",
  "currency": "VND"
}
```

#### Get Cash Flow History
```http
GET /api/v1/portfolios/{id}/cash-flow/history?startDate=2024-01-01&endDate=2024-12-31
```

#### Get Current Cash Balance
```http
GET /api/v1/portfolios/{id}/cash-flow/balance
```

#### Update Cash Balance Directly
```http
PUT /api/v1/portfolios/{id}/cash-flow/balance
{
  "cashBalance": 15000000,
  "reason": "Manual adjustment"
}
```

#### Recalculate Cash Balance
```http
POST /api/v1/portfolios/{id}/cash-flow/recalculate
```

## Architecture

### Services

#### CashFlowService
- **Purpose**: Centralized cash flow management
- **Responsibilities**:
  - Update cash balance from trades
  - Manage manual cash flows
  - Provide cash flow history
  - Recalculate cash balance from all flows

#### TradingService Integration
- **updatePortfolioPosition()**: Now updates cash balance automatically
- **Error Handling**: Non-blocking cash balance updates (trades still succeed if cash balance update fails)

### Database Schema

#### Portfolio Entity
```typescript
@Column({ type: 'decimal', precision: 15, scale: 2, default: 0, name: 'cash_balance' })
cashBalance: number;
```

#### CashFlow Entity
```typescript
@Entity('cash_flows')
export class CashFlow {
  @PrimaryGeneratedColumn('uuid')
  cashflowId: string;

  @Column({ type: 'uuid' })
  portfolioId: string;

  @Column({ type: 'timestamp' })
  flowDate: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number; // Positive for inflow, negative for outflow

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({ type: 'varchar', length: 50 })
  type: string; // DEPOSIT, WITHDRAWAL, DIVIDEND, INTEREST, BUY_TRADE, SELL_TRADE, OTHER

  @Column({ type: 'text', nullable: true })
  description: string;
}
```

## Usage Examples

### 1. Creating Portfolio with Initial Cash Balance

```typescript
const portfolio = await portfolioService.createPortfolio({
  name: 'Growth Portfolio',
  baseCurrency: 'VND',
  accountId: 'account-uuid',
  description: 'High-growth technology stocks',
  cashBalance: 50000000 // 50M VND initial balance
});
```

### 2. Executing Trades (Automatic Cash Balance Updates)

```typescript
// BUY trade - reduces cash balance
const buyTrade = await tradingService.createTrade({
  portfolioId: 'portfolio-uuid',
  assetId: 'asset-uuid',
  tradeDate: new Date(),
  side: 'BUY',
  quantity: 100,
  price: 100000, // 100,000 VND per share
  fee: 1000,
  tax: 500,
  source: 'MANUAL'
});
// Cash balance automatically reduced by 10,050,500 VND

// SELL trade - increases cash balance
const sellTrade = await tradingService.createTrade({
  portfolioId: 'portfolio-uuid',
  assetId: 'asset-uuid',
  tradeDate: new Date(),
  side: 'SELL',
  quantity: 50,
  price: 110000, // 110,000 VND per share
  fee: 1000,
  tax: 500,
  source: 'MANUAL'
});
// Cash balance automatically increased by 5,499,500 VND
```

### 3. Manual Cash Flow Operations

```typescript
// Add deposit
await cashFlowService.addManualCashFlow(
  'portfolio-uuid',
  2000000, // 2M VND
  'DEPOSIT',
  'Monthly salary deposit',
  new Date()
);

// Add dividend
await cashFlowService.addManualCashFlow(
  'portfolio-uuid',
  500000, // 500K VND
  'DIVIDEND',
  'Quarterly dividend from VCB',
  new Date()
);

// Withdrawal
await cashFlowService.addManualCashFlow(
  'portfolio-uuid',
  -1000000, // -1M VND (negative for outflow)
  'WITHDRAWAL',
  'Emergency fund withdrawal',
  new Date()
);
```

### 4. Getting Cash Flow History

```typescript
const history = await cashFlowService.getCashFlowHistory(
  'portfolio-uuid',
  new Date('2024-01-01'),
  new Date('2024-12-31')
);

// Returns array of CashFlow objects with all cash movements
```

## Testing

### Test Script
Run the comprehensive test script to verify all functionality:

```bash
node test-cash-balance-integration.js
```

This script tests:
- Portfolio creation with initial cash balance
- BUY trade execution and cash balance reduction
- SELL trade execution and cash balance increase
- Manual cash flow operations
- Cash flow history retrieval
- Direct cash balance updates
- Cash balance recalculation

### Expected Test Results

1. **Initial State**: Portfolio created with 10M VND cash balance
2. **After BUY Trade**: Cash balance reduced by trade cost (100 × 50,000 + 1,000 + 500 = 5,050,500 VND)
3. **After SELL Trade**: Cash balance increased by trade proceeds (50 × 55,000 - 1,000 - 500 = 2,749,500 VND)
4. **After Manual Deposit**: Cash balance increased by 2M VND
5. **After Direct Update**: Cash balance set to 15M VND
6. **After Recalculation**: Cash balance recalculated from all cash flows

## Error Handling

### Validation
- **Amount Validation**: Cash flow amounts must be within reasonable limits (-1B to +1B)
- **Balance Validation**: Cash balance cannot go negative (except for withdrawals)
- **Type Validation**: Cash flow types must be from predefined enum

### Error Recovery
- **Trade Failures**: If cash balance update fails, trade still succeeds (non-blocking)
- **Recalculation**: Use recalculation endpoint to fix any inconsistencies
- **Logging**: All errors are logged for debugging

## Performance Considerations

### Database Optimization
- **Indexes**: Added indexes on `portfolioId` and `flowDate` for fast queries
- **Batch Operations**: Multiple cash flows can be processed in batches
- **Caching**: Portfolio cash balance is cached for 5 minutes

### Memory Management
- **Pagination**: Cash flow history supports pagination for large datasets
- **Cleanup**: Old cash flow records can be archived after 5 years

## Migration Guide

### From Old System
1. **Existing Portfolios**: Cash balance will remain 0 until first trade or manual update
2. **Historical Data**: Use recalculation endpoint to calculate cash balance from existing trades
3. **API Changes**: New endpoints are additive, existing endpoints unchanged

### Database Migration
```sql
-- No additional migration needed - CashFlow table already exists
-- Just ensure Portfolio.cashBalance is properly initialized
UPDATE portfolios SET cash_balance = 0 WHERE cash_balance IS NULL;
```

## Future Enhancements

### Planned Features
1. **Currency Support**: Multi-currency cash flows with exchange rates
2. **Scheduled Cash Flows**: Recurring deposits/withdrawals
3. **Cash Flow Categories**: More detailed categorization
4. **Reporting**: Cash flow reports and analytics
5. **Notifications**: Alerts for low cash balance

### Integration Points
1. **Banking APIs**: Direct integration with bank accounts
2. **Payment Gateways**: Integration with payment processors
3. **Tax Reporting**: Automatic tax calculation for cash flows
4. **Audit Trail**: Enhanced audit logging for compliance

## Troubleshooting

### Common Issues

#### Cash Balance Not Updating
1. Check if `updatePortfolioPosition` is being called in TradingService
2. Verify CashFlowService is properly injected
3. Check database for cash flow records

#### Negative Cash Balance
1. Use recalculation endpoint to fix
2. Check for incorrect trade amounts
3. Verify fee/tax calculations

#### Missing Cash Flow Records
1. Check if trades are being processed correctly
2. Verify CashFlow entity is properly configured
3. Check database constraints

### Debug Commands

```typescript
// Get current cash balance
const balance = await cashFlowService.getCurrentCashBalance(portfolioId);

// Recalculate from all flows
const recalculated = await cashFlowService.recalculateCashBalance(portfolioId);

// Get cash flow history
const history = await cashFlowService.getCashFlowHistory(portfolioId);
```

## Conclusion

The cash balance implementation provides a robust, scalable solution for managing portfolio cash flows. It ensures data consistency, provides comprehensive API coverage, and maintains backward compatibility with existing systems.

Key benefits:
- **Automatic Updates**: No manual intervention required for trade-related cash flows
- **Comprehensive Tracking**: All cash movements are recorded and auditable
- **Flexible Management**: Support for both automatic and manual cash flow operations
- **Error Recovery**: Built-in mechanisms to fix inconsistencies
- **Performance Optimized**: Efficient database queries and caching
- **Future Ready**: Extensible architecture for additional features
