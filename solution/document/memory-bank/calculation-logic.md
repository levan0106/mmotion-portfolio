# Portfolio Management System - Calculation Logic Documentation

## Overview
This document provides comprehensive documentation of all calculation logic implemented in the Portfolio Management System, including asset computed fields, portfolio value calculations, and market data integration.

## Table of Contents
1. [Asset Computed Fields Calculation](#asset-computed-fields-calculation)
2. [Portfolio Value Calculation](#portfolio-value-calculation)
3. [Market Data Integration](#market-data-integration)
4. [Performance Metrics Calculation](#performance-metrics-calculation)
5. [Trade Matching Logic](#trade-matching-logic)
6. [Trade Details Real-time Calculation](#trade-details-real-time-calculation)
7. [Caching Strategy](#caching-strategy)
8. [Error Handling](#error-handling)

## Asset Computed Fields Calculation

### Core Computed Fields
The system calculates the following computed fields for each asset:

- **currentValue**: Current market value of the asset
- **currentQuantity**: Current quantity held
- **currentPrice**: Current market price per unit
- **avgCost**: Average cost per unit
- **totalValue**: Total value (sum of all positions)
- **totalQuantity**: Total quantity (sum of all positions)
- **hasTrades**: Boolean indicating if asset has trading history
- **displayName**: Formatted display name for UI

### Calculation Logic

#### 1. Assets Without Trades
```typescript
if (trades.length === 0) {
  const currentMarketPrice = await getCurrentMarketPrice(assetId);
  const initialQuantity = Number(asset.initialQuantity || 0);
  
  result = {
    currentValue: initialQuantity * currentMarketPrice,
    currentQuantity: initialQuantity,
    currentPrice: currentMarketPrice,
    avgCost: Number(asset.initialValue || 0) / initialQuantity || 0,
  };
}
```

#### 2. Assets With Trades
```typescript
// Calculate current quantity and average cost from trades
let currentQuantity = 0;
let totalCost = 0;
let totalQuantity = 0;

for (const trade of trades) {
  const quantity = Number(trade.quantity);
  const price = Number(trade.price);
  const fee = Number(trade.fee || 0);
  const tax = Number(trade.tax || 0);
  const totalTradeCost = quantity * price + fee + tax;
  
  if (trade.side === 'BUY') {
    currentQuantity += quantity;
    totalCost += totalTradeCost;
    totalQuantity += quantity;
  } else if (trade.side === 'SELL') {
    currentQuantity -= quantity;
  }
}

const currentMarketPrice = await getCurrentMarketPrice(assetId);
const currentValue = currentQuantity * currentMarketPrice;
const avgCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;

result = {
  currentValue: Math.max(0, currentValue),
  currentQuantity: Math.max(0, currentQuantity),
  currentPrice: currentMarketPrice,
  avgCost: avgCost,
};
```

### Portfolio Filtering
The system supports portfolio-specific calculations:

- **With Portfolio ID**: Calculates based on trades belonging to specific portfolio
- **Without Portfolio ID**: Calculates based on all trades for the asset

```typescript
// Get trades with proper filtering
let trades: any[];
if (portfolioId) {
  trades = await this.assetRepository.getTradesForAssetByPortfolio(assetId, portfolioId);
} else {
  trades = await this.assetRepository.getTradesForAsset(assetId);
}
```

## Portfolio Value Calculation

### Core Portfolio Metrics
- **totalValue**: Total portfolio value
- **unrealizedPl**: Unrealized profit/loss
- **realizedPl**: Realized profit/loss
- **cashBalance**: Available cash balance
- **nav**: Net Asset Value

### Calculation Implementation

#### 1. Portfolio Value Calculation Service
```typescript
async calculatePortfolioValues(portfolioId: string): Promise<{
  totalValue: number;
  unrealizedPl: number;
  realizedPl: number;
  cashBalance: number;
}> {
  // Get all trades for portfolio
  const trades = await this.tradeRepository.find({
    where: { portfolioId },
    relations: ['asset', 'tradeDetails']
  });

  // Calculate realized P&L from trade details
  const realizedPl = await this.calculateRealizedPl(portfolioId);
  
  // Calculate current positions
  const positions = await this.calculateCurrentPositions(trades);
  
  // Calculate total value and unrealized P&L
  let totalValue = 0;
  let unrealizedPl = 0;
  
  for (const position of positions) {
    totalValue += position.currentValue;
    unrealizedPl += position.unrealizedPl;
  }
  
  return {
    totalValue,
    unrealizedPl,
    realizedPl,
    cashBalance: 0, // TODO: Implement cash balance calculation
  };
}
```

#### 2. Asset Position Calculation
```typescript
async calculateAssetPosition(assetId: string, trades: any[]): Promise<{
  quantity: number;
  avgCost: number;
  currentValue: number;
  unrealizedPl: number;
}> {
  // Aggregate trades by asset
  let quantity = 0;
  let totalCost = 0;
  let totalQuantity = 0;
  
  for (const trade of trades) {
    if (trade.assetId === assetId) {
      const qty = Number(trade.quantity);
      const price = Number(trade.price);
      const fee = Number(trade.fee || 0);
      const tax = Number(trade.tax || 0);
      const totalTradeCost = qty * price + fee + tax;
      
      if (trade.side === 'BUY') {
        quantity += qty;
        totalCost += totalTradeCost;
        totalQuantity += qty;
      } else if (trade.side === 'SELL') {
        quantity -= qty;
      }
    }
  }
  
  // Get current market price
  const currentPrice = await this.marketDataService.getCurrentPrice(asset.symbol);
  const currentValue = quantity * currentPrice;
  const avgCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
  const unrealizedPl = currentValue - (quantity * avgCost);
  
  return {
    quantity: Math.max(0, quantity),
    avgCost,
    currentValue: Math.max(0, currentValue),
    unrealizedPl,
  };
}
```

## Market Data Integration

### Market Data Service
The system includes a mock market data service for real-time price updates:

```typescript
@Injectable()
export class MarketDataService {
  private marketPrices = new Map<string, { price: number; timestamp: Date }>();
  
  // Initialize base prices for various symbols
  private initializeBasePrices() {
    this.marketPrices.set('VFF', { price: 20000, timestamp: new Date() });
    this.marketPrices.set('VESAF', { price: 20000, timestamp: new Date() });
    this.marketPrices.set('SJC', { price: 5000000, timestamp: new Date() });
    // ... more symbols
  }
  
  // Get current price for symbol
  async getCurrentPrice(symbol: string): Promise<number> {
    const marketPrice = this.marketPrices.get(symbol);
    return marketPrice ? marketPrice.price : 0;
  }
  
  // Simulate price updates every 10 seconds
  @Cron(CronExpression.EVERY_10_SECONDS)
  async updateMarketPrices() {
    for (const [symbol, data] of this.marketPrices) {
      const volatility = 0.02; // 2% volatility
      const change = (Math.random() - 0.5) * 2 * volatility;
      const newPrice = data.price * (1 + change);
      
      this.marketPrices.set(symbol, {
        price: Math.max(0, newPrice),
        timestamp: new Date()
      });
    }
  }
}
```

### Price Update Strategy
- **Update Frequency**: Every 10 seconds via cron job
- **Volatility**: 2% random price movement
- **Fallback**: Uses latest trade price if market data unavailable
- **Caching**: Prices cached for 2 minutes to reduce API calls

## Performance Metrics Calculation

### Performance Calculation Utilities
```typescript
// Calculate performance percentage
export function calculatePerformancePercentage(
  initialValue: number,
  currentValue: number
): number {
  if (initialValue === 0) return 0;
  return ((currentValue - initialValue) / initialValue) * 100;
}

// Calculate time-based performance
export function calculateTimeBasedPerformance(
  totalPerformance: number,
  daysElapsed: number
): {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
} {
  const daily = totalPerformance / daysElapsed;
  const weekly = daily * 7;
  const monthly = daily * 30;
  const yearly = daily * 365;
  
  return { daily, weekly, monthly, yearly };
}

// Calculate performance with market data
export function calculatePerformanceWithMarketData(
  initialValue: number,
  currentValue: number,
  symbol: string
): number {
  const marketFactor = getMarketFactor(symbol);
  const basePerformance = calculatePerformancePercentage(initialValue, currentValue);
  return basePerformance * marketFactor;
}
```

### Performance Display
- **Color Coding**: Green for positive, red for negative performance
- **Formatting**: Percentage with 2 decimal places
- **Time Periods**: Daily, weekly, monthly, yearly performance
- **Market Integration**: Adjusts for market conditions

## Trade Matching Logic

### FIFO Engine
The system implements First-In-First-Out trade matching:

```typescript
export class FIFOEngine {
  matchTrades(buyTrades: Trade[], sellTrades: Trade[]): TradeDetail[] {
    const tradeDetails: TradeDetail[] = [];
    const buyQueue = [...buyTrades].sort((a, b) => a.tradeDate.getTime() - b.tradeDate.getTime());
    
    for (const sellTrade of sellTrades) {
      let remainingQuantity = sellTrade.quantity;
      
      while (remainingQuantity > 0 && buyQueue.length > 0) {
        const buyTrade = buyQueue[0];
        const matchedQuantity = Math.min(remainingQuantity, buyTrade.quantity);
        
        const tradeDetail = new TradeDetail();
        tradeDetail.sellTradeId = sellTrade.id;
        tradeDetail.buyTradeId = buyTrade.id;
        tradeDetail.assetId = sellTrade.assetId;
        tradeDetail.matchedQty = matchedQuantity;
        tradeDetail.buyPrice = buyTrade.price;
        tradeDetail.sellPrice = sellTrade.price;
        tradeDetail.feeTax = (buyTrade.fee || 0) + (sellTrade.fee || 0);
        tradeDetail.pnl = (sellTrade.price - buyTrade.price) * matchedQuantity - tradeDetail.feeTax;
        
        tradeDetails.push(tradeDetail);
        
        remainingQuantity -= matchedQuantity;
        buyTrade.quantity -= matchedQuantity;
        
        if (buyTrade.quantity === 0) {
          buyQueue.shift();
        }
      }
    }
    
    return tradeDetails;
  }
}
```

### P&L Calculation
- **Gross P&L**: (Sell Price - Buy Price) × Quantity
- **Net P&L**: Gross P&L - Fees - Taxes
- **Realized P&L**: Sum of all completed trade details
- **Unrealized P&L**: Current value - Average cost

## Trade Details Real-time Calculation

### Overview
The Trade Details component implements real-time calculation logic to ensure financial accuracy and data consistency. This addresses the issue where database values may not match actual calculated values due to data inconsistencies or outdated information.

### Problem Statement
Previously, Trade Details displayed values directly from the database (`trade.totalValue`, `trade.totalCost`, `trade.realizedPl`), which could lead to:
- **Data Inconsistency**: Database values not matching actual calculations (e.g., 50 × 52,000 ≠ 2,600,000)
- **Stale Data**: Outdated values in database not reflecting current trade data
- **User Confusion**: Displayed values not matching user expectations
- **Type Conversion Issues**: String values from database not properly converted to numbers

### Solution Implementation

#### 1. Real-time Calculation Logic with Type Safety
```typescript
// Calculate real-time values with proper type conversion
const calculatedTotalValue = (Number(trade.quantity) || 0) * (Number(trade.price) || 0);
const calculatedFeesAndTaxes = (Number(trade.fee) || 0) + (Number(trade.tax) || 0);
const calculatedTotalCost = calculatedTotalValue + calculatedFeesAndTaxes;

// Additional type-safe calculations
const calculatedRealizedPl = Number(trade.realizedPl) || 0;
const calculatedTotalValueFromDb = Number(trade.totalValue) || 0;
const calculatedTotalCostFromDb = Number(trade.totalCost) || 0;
```

#### 2. Financial Metrics Display with Type Safety
```typescript
// Display calculated values with proper type conversion
<Grid item xs={6}>
  <Typography variant="body2" color="text.secondary" gutterBottom>
    Total Value
  </Typography>
  <Typography variant="subtitle1" fontWeight="bold" color="info.main">
    {formatCurrency(calculatedTotalValue)}
  </Typography>
</Grid>

<Grid item xs={6}>
  <Typography variant="body2" color="text.secondary" gutterBottom>
    Fees & Taxes
  </Typography>
  <Typography variant="subtitle1" fontWeight="bold" color="warning.main">
    {formatCurrency(calculatedFeesAndTaxes)}
  </Typography>
</Grid>

<Grid item xs={6}>
  <Typography variant="body2" color="text.secondary" gutterBottom>
    Total Cost
  </Typography>
  <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
    {formatCurrency(calculatedTotalCost)}
  </Typography>
</Grid>

<Grid item xs={6}>
  <Typography variant="body2" color="text.secondary" gutterBottom>
    Realized P&L
  </Typography>
  <Typography variant="subtitle1" fontWeight="bold" color={calculatedRealizedPl >= 0 ? 'success.main' : 'error.main'}>
    {formatCurrency(calculatedRealizedPl)}
  </Typography>
</Grid>
```

#### 3. Data Transparency Alert
```typescript
// Alert user when database values differ from calculated values
{(trade.totalValue !== calculatedTotalValue || trade.totalCost !== calculatedTotalCost) && (
  <Alert severity="info" sx={{ mb: 2, fontSize: '0.75rem' }}>
    <Typography variant="caption">
      <strong>Note:</strong> Values shown are calculated from quantity × price. 
      Database values: Total Value: {formatCurrency(trade.totalValue)}, Total Cost: {formatCurrency(trade.totalCost)}
    </Typography>
  </Alert>
)}
```

### Calculation Accuracy

#### Example Calculation
- **Quantity**: 50.00 units
- **Price per Unit**: 52,000 VND
- **Fees**: 0 VND
- **Taxes**: 0 VND

**Real-time Calculation**:
- **Total Value**: 50 × 52,000 = 2,600,000 VND
- **Fees & Taxes**: 0 + 0 = 0 VND
- **Total Cost**: 2,600,000 + 0 = 2,600,000 VND

**Database Values** (may differ):
- **Total Value**: 2,600,000 VND (or different value)
- **Total Cost**: 2,600,000 VND (or different value)

### Benefits

#### 1. Data Accuracy
- **Real-time Calculation**: Always shows current calculated values
- **Mathematical Correctness**: Ensures quantity × price = total value
- **Consistency**: Values always match user input

#### 2. Data Transparency
- **User Awareness**: Alert shows when database values differ
- **Source Clarity**: User knows values are calculated, not stored
- **Trust Building**: Transparent about data sources

#### 3. Error Prevention
- **Inconsistency Detection**: Identifies data mismatches
- **User Education**: Explains calculation methodology
- **Quality Assurance**: Prevents display of incorrect data

### Implementation Details

#### Component Structure
```typescript
export const TradeDetails: React.FC<TradeDetailsProps> = ({ trade, tradeDetails }) => {
  // Calculate real-time values
  const calculatedTotalValue = trade.quantity * trade.price;
  const calculatedFeesAndTaxes = trade.fee + trade.tax;
  const calculatedTotalCost = calculatedTotalValue + calculatedFeesAndTaxes;

  return (
    <Box>
      {/* Financial Metrics Section */}
      <Card sx={{ boxShadow: 2, height: '100%' }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom color="primary" fontWeight="bold">
            Financial Metrics
          </Typography>
          
          {/* Data Transparency Alert */}
          {(trade.totalValue !== calculatedTotalValue || trade.totalCost !== calculatedTotalCost) && (
            <Alert severity="info" sx={{ mb: 2, fontSize: '0.75rem' }}>
              <Typography variant="caption">
                <strong>Note:</strong> Values shown are calculated from quantity × price. 
                Database values: Total Value: {formatCurrency(trade.totalValue)}, Total Cost: {formatCurrency(trade.totalCost)}
              </Typography>
            </Alert>
          )}
          
          {/* Financial Metrics Grid */}
          <Grid container spacing={1.5}>
            {/* Display calculated values */}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};
```

#### Error Handling
```typescript
// Safe calculation with fallbacks
const calculatedTotalValue = (Number(trade.quantity) || 0) * (Number(trade.price) || 0);
const calculatedFeesAndTaxes = (Number(trade.fee) || 0) + (Number(trade.tax) || 0);
const calculatedTotalCost = calculatedTotalValue + calculatedFeesAndTaxes;
```

### Performance Considerations

#### 1. Calculation Efficiency
- **Client-side Calculation**: No additional API calls required
- **Real-time Updates**: Immediate calculation on data change
- **Minimal Overhead**: Simple arithmetic operations

#### 2. Memory Usage
- **No Caching**: Calculations performed on each render
- **Lightweight**: Minimal memory footprint
- **Efficient**: No complex data structures

#### 3. User Experience
- **Immediate Feedback**: Values update instantly
- **Consistent Display**: Always shows accurate data
- **Transparent Process**: User understands calculation method

### Future Enhancements

#### 1. Advanced Calculations
- **Currency Conversion**: Multi-currency support
- **Tax Calculations**: Complex tax scenarios
- **Fee Structures**: Tiered fee calculations

#### 2. Data Validation
- **Input Validation**: Real-time input validation
- **Range Checking**: Min/max value validation
- **Format Validation**: Proper number formatting

#### 3. Audit Trail
- **Calculation History**: Track calculation changes
- **Data Lineage**: Show data source and transformations
- **Version Control**: Track calculation method changes

## Trade Analysis Validation Logic

### Overview
The Trade Analysis component implements comprehensive validation logic to ensure data integrity and prevent display errors. This addresses the "Invalid analysis data format" error that occurred when analysis data didn't meet expected structure requirements.

### Problem Statement
Previously, the Trade Analysis component would display "Invalid analysis data format" error due to:
- **Strict Validation**: Overly restrictive validation rules
- **Type Mismatches**: String values not properly converted to numbers
- **Missing Fields**: Required fields not present in API response
- **Array Validation**: Asset performance array validation too strict

### Solution Implementation

#### 1. Flexible Validation Logic
```typescript
const isValidAnalysis = useMemo(() => {
  if (!analysis) return false;
  
  // Validate required fields
  if (!analysis.pnlSummary || !analysis.statistics || !analysis.riskMetrics) {
    return false;
  }
  
  // Validate assetPerformance exists (allow empty array)
  if (!Array.isArray(analysis.assetPerformance)) {
    return false;
  }
  
  // Validate percentage values (more lenient)
  if (analysis.pnlSummary.winRate !== undefined) {
    const winRate = Number(analysis.pnlSummary.winRate);
    if (isNaN(winRate) || winRate < 0 || winRate > 100) {
      return false;
    }
  }
  
  // Validate volatility (more lenient - allow higher values)
  if (analysis.riskMetrics.volatility !== undefined) {
    const volatility = Number(analysis.riskMetrics.volatility);
    if (isNaN(volatility) || volatility < 0) {
      return false;
    }
  }
  
  return true;
}, [analysis]);
```

#### 2. Type-Safe Data Processing
```typescript
// Ensure all numeric values are properly converted
const totalPnl = Number(analysis.pnlSummary.totalPnl) || 0;
const winRate = Number(analysis.pnlSummary.winRate) || 0;
const sharpeRatio = Number(analysis.riskMetrics.sharpeRatio) || 0;
const volatility = Number(analysis.riskMetrics.volatility) || 0;
const var95 = Number(analysis.riskMetrics.var95) || 0;
const maxDrawdown = Number(analysis.riskMetrics.maxDrawdown) || 0;
```

#### 3. Volatility Calculation Fix
**Problem**: Volatility was calculated as standard deviation of absolute P&L values, resulting in unrealistic percentages (e.g., 2,016,799.8%).

**Solution**: Calculate volatility as percentage based on returns:
```typescript
// Calculate returns as percentages (P&L / Trade Value)
const returns = uniqueTrades.map(trade => {
  const pnl = Number(trade.pnl) || 0;
  const tradeValue = (Number(trade.matchedQty) || 0) * (Number(trade.sellPrice) || 0);
  return tradeValue > 0 ? (pnl / tradeValue) * 100 : 0; // Return as percentage
});

// Calculate volatility as percentage
const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
const volatility = Math.sqrt(variance); // Volatility as percentage
```

**Result**: Volatility now shows realistic values (e.g., 28.9% instead of 2,016,799.8%).

#### 4. Asset Performance Implementation
**Problem**: Asset Performance chart was not displaying data because `calculateAssetPerformance` method was not implemented (returning empty array).

**Solution**: Implement comprehensive asset performance calculation from trade data:
```typescript
private async calculateAssetPerformance(
  portfolioId: string,
  assetId?: string,
  startDate?: Date,
  endDate?: Date,
): Promise<any[]> {
  try {
    // Get trade details for the portfolio
    const topTradesRaw = await this.tradeDetailRepo.getTopPerformingTrades(100, portfolioId);
    const worstTradesRaw = await this.tradeDetailRepo.getWorstPerformingTrades(100, portfolioId);
    
    // Combine and deduplicate trades
    const allTrades = [...topTradesRaw, ...worstTradesRaw];
    const uniqueTrades = allTrades.filter((trade, index, self) => 
      index === self.findIndex(t => t.detailId === trade.detailId)
    );

    // Group trades by asset
    const assetGroups = new Map<string, any[]>();
    for (const trade of uniqueTrades) {
      const assetId = trade.assetId;
      if (!assetGroups.has(assetId)) {
        assetGroups.set(assetId, []);
      }
      assetGroups.get(assetId)!.push(trade);
    }

    // Calculate performance for each asset
    const assetPerformance = [];
    for (const [assetId, trades] of assetGroups) {
      const asset = trades[0].asset;
      if (!asset) continue;

      // Calculate metrics
      const totalPl = trades.reduce((sum, trade) => sum + (Number(trade.pnl) || 0), 0);
      const tradesCount = trades.length;
      const winCount = trades.filter(trade => (Number(trade.pnl) || 0) > 0).length;
      const winRate = tradesCount > 0 ? (winCount / tradesCount) * 100 : 0;
      
      // Calculate total volume and average cost
      const totalVolume = trades.reduce((sum, trade) => {
        const tradeValue = (Number(trade.matchedQty) || 0) * (Number(trade.sellPrice) || 0);
        return sum + tradeValue;
      }, 0);
      
      let totalQuantity = 0;
      let totalCost = 0;
      for (const trade of trades) {
        const quantity = Number(trade.matchedQty) || 0;
        const price = Number(trade.buyPrice) || 0;
        const fee = Number(trade.feeTax) || 0;
        totalQuantity += quantity;
        totalCost += (quantity * price) + fee;
      }
      
      const avgCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
      const marketValue = totalQuantity * (Number(trades[0].sellPrice) || 0);
      
      assetPerformance.push({
        assetId: assetId,
        assetSymbol: asset.symbol || asset.code || 'N/A',
        assetName: asset.name || 'N/A',
        totalPl: Math.round(totalPl * 100) / 100,
        tradesCount: tradesCount,
        winCount: winCount,
        winRate: Math.round(winRate * 100) / 100,
        totalVolume: Math.round(totalVolume * 100) / 100,
        quantity: Math.round(totalQuantity * 100) / 100,
        avgCost: Math.round(avgCost * 100) / 100,
        marketValue: Math.round(marketValue * 100) / 100,
      });
    }

    return assetPerformance;
  } catch (error) {
    console.error('Error calculating asset performance:', error);
    return [];
  }
}
```

**Result**: Asset Performance chart now displays data with:
- **Asset grouping**: Trades grouped by asset
- **Performance metrics**: P&L, win rate, trade count per asset
- **Volume calculations**: Total volume and average cost
- **Chart visualization**: Pie chart showing P&L distribution by asset

#### 5. Error Handling and Fallbacks
```typescript
// Safe array processing
const monthlyChartData = useMemo(() => {
  if (!analysis.monthlyPerformance || !Array.isArray(analysis.monthlyPerformance)) {
    return [];
  }
  
  return analysis.monthlyPerformance.map((month) => ({
    month: month.month || 'Unknown',
    tradesCount: Number(month.tradesCount) || 0,
    totalPl: Number(month.totalPl) || 0,
    totalVolume: Number(month.totalVolume) || 0,
    winRate: Number(month.winRate) || 0,
    winningTrades: Number(month.winningTrades) || 0,
    losingTrades: Number(month.losingTrades) || 0,
  }));
}, [analysis.monthlyPerformance]);
```

### Validation Rules

#### 1. Required Fields Validation
- **pnlSummary**: Must exist and contain valid P&L data
- **statistics**: Must exist and contain trade statistics
- **riskMetrics**: Must exist and contain risk metrics
- **assetPerformance**: Must be an array (can be empty)

#### 2. Numeric Value Validation
- **Win Rate**: Must be between 0-100 if defined
- **Volatility**: Must be non-negative if defined
- **All Numeric Fields**: Must be valid numbers or default to 0

#### 3. Array Validation
- **Asset Performance**: Must be array type (empty arrays allowed)
- **Monthly Performance**: Must be array type with proper structure
- **Top/Worst Trades**: Must be array type with trade data

### Error Prevention

#### 1. Type Conversion Safety
```typescript
// Safe number conversion with fallbacks
const safeNumber = (value: any, defaultValue: number = 0): number => {
  if (value === null || value === undefined || value === '') return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};
```

#### 2. Array Safety
```typescript
// Safe array processing
const safeArray = (value: any, defaultValue: any[] = []): any[] => {
  return Array.isArray(value) ? value : defaultValue;
};
```

#### 3. Object Safety
```typescript
// Safe object property access
const safeProperty = (obj: any, path: string, defaultValue: any = null): any => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : defaultValue;
  }, obj);
};
```

### Benefits

#### 1. Robust Error Handling
- **Graceful Degradation**: Component continues to work with partial data
- **User-Friendly**: Clear error messages instead of crashes
- **Data Integrity**: Ensures only valid data is displayed

#### 2. Type Safety
- **Number Conversion**: All numeric values properly converted
- **Array Validation**: Ensures arrays are properly handled
- **Object Validation**: Validates object structure before use

#### 3. Performance
- **Efficient Validation**: Only validates when data changes
- **Memoized Calculations**: Prevents unnecessary recalculations
- **Lazy Loading**: Validates data only when needed

### Implementation Details

#### Component Structure
```typescript
export const TradeAnalysis: React.FC<TradeAnalysisProps> = ({ analysis, currency }) => {
  // Validation logic
  const isValidAnalysis = useMemo(() => {
    // ... validation logic
  }, [analysis]);

  // Early return for invalid data
  if (!isValidAnalysis) {
    return (
      <Alert severity="error">
        Invalid analysis data format
      </Alert>
    );
  }

  // Render analysis with validated data
  return (
    <Box>
      {/* Analysis content */}
    </Box>
  );
};
```

#### Hook Integration
```typescript
export const useTradeAnalysis = (portfolioId: string, filters?: any) => {
  return useQuery<TradeAnalysis>(
    ['tradeAnalysis', portfolioId, filters?.timeframe || 'ALL', filters?.metric || 'pnl'],
    () => apiService.getTradeAnalysis(portfolioId, filters),
    {
      enabled: !!portfolioId,
      staleTime: 0, // Force refetch every time
      cacheTime: 0, // Don't cache
    }
  );
};
```

### Future Enhancements

#### 1. Advanced Validation
- **Schema Validation**: Use JSON schema for data validation
- **Custom Validators**: Specific validators for different data types
- **Validation Rules**: Configurable validation rules

#### 2. Error Recovery
- **Retry Logic**: Automatic retry on validation failure
- **Data Repair**: Attempt to fix common data issues
- **Fallback Data**: Provide default data when validation fails

#### 3. Monitoring
- **Validation Metrics**: Track validation success/failure rates
- **Error Logging**: Log validation errors for debugging
- **Performance Monitoring**: Monitor validation performance

## Caching Strategy

### Cache Implementation
```typescript
@Injectable()
export class AssetCacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
  
  // Cache computed fields for 2 minutes
  setComputedFields(assetId: string, portfolioId: string, data: any) {
    const key = `computed:${assetId}:${portfolioId || 'none'}`;
    this.cacheManager.set(key, data, 2 * 60 * 1000);
  }
  
  // Cache current values for 2 minutes
  setCurrentValues(assetId: string, portfolioId: string, data: any) {
    const key = `current:${assetId}:${portfolioId || 'none'}`;
    this.cacheManager.set(key, data, 2 * 60 * 1000);
  }
  
  // Cache market data for 1 minute
  setMarketData(symbol: string, data: any) {
    const key = `market:${symbol}`;
    this.cacheManager.set(key, data, 60 * 1000);
  }
}
```

### Cache Keys
- **Computed Fields**: `computed:{assetId}:{portfolioId}`
- **Current Values**: `current:{assetId}:{portfolioId}`
- **Market Data**: `market:{symbol}`
- **Portfolio Values**: `portfolio:{portfolioId}`

### Cache TTL
- **Computed Fields**: 2 minutes
- **Current Values**: 2 minutes
- **Market Data**: 1 minute
- **Portfolio Values**: 5 minutes

## Error Handling

### Common Error Scenarios
1. **Division by Zero**: Handled with fallback values
2. **Invalid Data Types**: String to number conversion with validation
3. **Missing Data**: Fallback to default values
4. **API Failures**: Graceful degradation with cached data

### Error Handling Implementation
```typescript
// Safe number conversion
function safeNumber(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === '') return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

// Safe division
function safeDivide(numerator: number, denominator: number, defaultValue: number = 0): number {
  if (denominator === 0 || isNaN(denominator)) return defaultValue;
  return numerator / denominator;
}

// Error logging
try {
  const result = await calculateComputedFields(assetId);
  return result;
} catch (error) {
  this.logger.error(`Failed to calculate computed fields for asset ${assetId}:`, error);
  return getDefaultComputedFields();
}
```

## Data Flow

### 1. Asset Load Flow
```
User Request → AssetController → AssetService → AssetRepository
     ↓
AssetService.calculateComputedFields() → MarketDataService
     ↓
Cache Check → Calculate Values → Update Database → Return Response
```

### 2. Portfolio Value Flow
```
User Request → PortfolioController → PortfolioService → PortfolioCalculationService
     ↓
Get Trades → Calculate Positions → Calculate Values → Return Response
```

### 3. Market Data Flow
```
Cron Job → MarketDataService → Update Prices → Cache Update
     ↓
Asset Calculation → Use New Prices → Update Computed Fields
```

## Performance Considerations

### Optimization Strategies
1. **Caching**: Reduces database queries and API calls
2. **Batch Processing**: Updates multiple assets simultaneously
3. **Lazy Loading**: Computed fields calculated on demand
4. **Indexing**: Database indexes on frequently queried fields

### Monitoring
- **Response Times**: Track API response times
- **Cache Hit Rates**: Monitor cache effectiveness
- **Error Rates**: Track calculation errors
- **Memory Usage**: Monitor cache memory consumption

## Future Enhancements

### Planned Improvements
1. **Real-time Market Data**: Integration with external APIs
2. **Advanced Analytics**: More sophisticated performance metrics
3. **Machine Learning**: Predictive price modeling
4. **Real-time Updates**: WebSocket-based live updates

### Scalability Considerations
1. **Horizontal Scaling**: Multiple service instances
2. **Database Sharding**: Partition data by user/portfolio
3. **CDN Integration**: Cache static data globally
4. **Message Queues**: Asynchronous processing

## Conclusion

This calculation logic documentation provides a comprehensive overview of all computational aspects of the Portfolio Management System. The system is designed to be robust, scalable, and maintainable, with proper error handling and performance optimization.

### Key Calculation Features

#### 1. Asset Computed Fields
- Real-time calculation of current values, quantities, and prices
- Portfolio-specific filtering for accurate calculations
- Market data integration with caching strategy

#### 2. Portfolio Value Calculation
- Comprehensive portfolio metrics calculation
- Position tracking and P&L calculations
- Performance analytics and reporting

#### 3. Trade Details Real-time Calculation
- **Financial Accuracy**: Real-time calculation ensures mathematical correctness
- **Data Transparency**: Alert system shows database vs calculated values
- **User Trust**: Transparent calculation methodology builds user confidence
- **Error Prevention**: Prevents display of inconsistent financial data
- **Type Safety**: Proper type conversion prevents calculation errors

#### 4. Trade Analysis Validation Logic
- **Data Integrity**: Comprehensive validation ensures data consistency
- **Error Prevention**: Prevents "Invalid analysis data format" errors
- **Type Safety**: All numeric values properly converted with fallbacks
- **Graceful Degradation**: Component works with partial or incomplete data
- **User Experience**: Clear error handling instead of crashes

#### 5. Market Data Integration
- Mock service with realistic price simulation
- Caching strategy for performance optimization
- Fallback mechanisms for data reliability

#### 6. Trade Matching Logic
- FIFO/LIFO algorithms for trade matching
- Comprehensive P&L calculations
- Risk management and position tracking

### System Benefits

#### Data Accuracy
- **Real-time Calculations**: Always current and accurate
- **Mathematical Correctness**: Ensures proper financial calculations
- **Consistency**: Values match user expectations

#### User Experience
- **Transparency**: Clear indication of data sources
- **Trust**: Reliable and accurate financial data
- **Education**: Users understand calculation methods

#### Technical Excellence
- **Performance**: Efficient calculations with minimal overhead
- **Scalability**: Designed for growth and expansion
- **Maintainability**: Clean, well-documented code

For implementation details, refer to the specific service files:
- `src/modules/asset/services/asset.service.ts`
- `src/modules/portfolio/services/portfolio-calculation.service.ts`
- `src/modules/market-data/services/market-data.service.ts`
- `src/modules/trading/services/trading.service.ts`
- `frontend/src/utils/performance.utils.ts`
- `frontend/src/components/Trading/TradeDetails.tsx`
- `frontend/src/components/Trading/TradeAnalysis.tsx`
- `frontend/src/hooks/useTrading.ts`
- `frontend/src/services/api.ts`
