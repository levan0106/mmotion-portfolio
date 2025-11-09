# Calculation Utils - Hướng Dẫn Sử Dụng

## 📋 Tổng Quan

Calculation Utils cung cấp các functions và classes để thực hiện các phép tính phức tạp trong hệ thống trading và portfolio management. Tất cả calculations phải sử dụng các utilities được định nghĩa trong các managers và services.

## 🎯 Mục Tiêu

- **Accuracy**: Đảm bảo tính chính xác của các phép tính
- **Consistency**: Đảm bảo logic tính toán nhất quán
- **Performance**: Tối ưu hiệu suất tính toán
- **Maintainability**: Dễ bảo trì và cập nhật

## 📚 Danh Sách Utilities

### 1. Position Management

#### `PositionManager.calculatePositionMetrics(assetId, trades, marketPrice, tradeDetails?)`

Calculates comprehensive position metrics for an asset.

```typescript
import { PositionManager } from '@/modules/trading/managers/position-manager';

const positionManager = new PositionManager();

// Basic usage
const metrics = positionManager.calculatePositionMetrics(
  'asset-123',
  trades,
  50000, // market price
  tradeDetails
);

console.log(metrics);
// {
//   totalQuantity: 1000,
//   totalCost: 45000000,
//   averageCost: 45000,
//   marketValue: 50000000,
//   unrealizedPl: 5000000,
//   unrealizedPlPercentage: 11.11,
//   realizedPl: 2000000,
//   totalPl: 7000000
// }
```

**Parameters:**
- `assetId`: `string` - Asset identifier
- `trades`: `Trade[]` - Array of trades for the asset
- `marketPrice`: `number` - Current market price
- `tradeDetails`: `TradeDetail[]` (optional) - Trade details for realized P&L

**Returns:**
```typescript
interface PositionMetrics {
  totalQuantity: number;           // Total quantity held
  totalCost: number;              // Total cost basis
  averageCost: number;            // Average cost per unit
  marketValue: number;            // Current market value
  unrealizedPl: number;           // Unrealized P&L
  unrealizedPlPercentage: number; // Unrealized P&L percentage
  realizedPl: number;             // Realized P&L
  totalPl: number;                // Total P&L (realized + unrealized)
}
```

#### `PositionManager.updatePosition(currentPosition, trade, marketPrice)`

Updates position after a trade execution.

```typescript
import { PositionManager } from '@/modules/trading/managers/position-manager';

const positionManager = new PositionManager();

// Update position after buy trade
const updatedPosition = positionManager.updatePosition(
  currentPosition,
  buyTrade,
  marketPrice
);

// Update position after sell trade
const updatedPosition = positionManager.updatePosition(
  currentPosition,
  sellTrade,
  marketPrice
);
```

### 2. Risk Management

#### `RiskManager.calculateRiskMetrics(position, currentPrice, stopLoss?, takeProfit?)`

Calculates risk metrics for a position.

```typescript
import { RiskManager } from '@/modules/trading/managers/risk-manager';

const riskManager = new RiskManager();

// Basic usage
const riskMetrics = riskManager.calculateRiskMetrics(
  position,
  50000, // current price
  45000, // stop loss
  60000  // take profit
);

console.log(riskMetrics);
// {
//   currentValue: 50000000,
//   costBasis: 45000000,
//   unrealizedPl: 5000000,
//   unrealizedPlPercentage: 11.11,
//   maxLoss: -5000000,
//   maxGain: 15000000,
//   riskRewardRatio: 3.0
// }
```

**Parameters:**
- `position`: `PortfolioAsset` - Current position
- `currentPrice`: `number` - Current market price
- `stopLoss`: `number | null` - Stop loss price (optional)
- `takeProfit`: `number | null` - Take profit price (optional)

**Returns:**
```typescript
interface RiskMetrics {
  currentValue: number;            // Current position value
  costBasis: number;              // Cost basis
  unrealizedPl: number;           // Unrealized P&L
  unrealizedPlPercentage: number; // Unrealized P&L percentage
  maxLoss: number;                // Maximum potential loss
  maxGain: number;                // Maximum potential gain
  riskRewardRatio: number;        // Risk-reward ratio
}
```

#### `RiskManager.validateRiskTargets(assetId, stopLoss, takeProfit, currentPrice)`

Validates risk target settings.

```typescript
import { RiskManager } from '@/modules/trading/managers/risk-manager';

const riskManager = new RiskManager();

// Validate risk targets
const validation = riskManager.validateRiskTargets(
  'asset-123',
  45000, // stop loss
  60000, // take profit
  50000  // current price
);

if (!validation.isValid) {
  console.log('Validation errors:', validation.errors);
  // ['Stop loss must be below current price', 'Take profit must be above current price']
}
```

### 3. Trading Calculations

#### FIFO Engine

```typescript
import { FIFOEngine } from '@/modules/trading/engines/fifo-engine';

const fifoEngine = new FIFOEngine();

// Match sell trade with buy trades using FIFO
const tradeDetails = fifoEngine.matchTrade(
  sellTrade,
  buyTrades,
  marketPrice
);

console.log(tradeDetails);
// [
//   {
//     buyTradeId: 'buy-1',
//     sellTradeId: 'sell-1',
//     quantity: 100,
//     buyPrice: 45000,
//     sellPrice: 50000,
//     realizedPl: 500000,
//     fees: 5000,
//     tax: 50000
//   }
// ]
```

#### LIFO Engine

```typescript
import { LIFOEngine } from '@/modules/trading/engines/lifo-engine';

const lifoEngine = new LIFOEngine();

// Match sell trade with buy trades using LIFO
const tradeDetails = lifoEngine.matchTrade(
  sellTrade,
  buyTrades,
  marketPrice
);
```

### 4. Performance Metrics

#### Sharpe Ratio Calculation

```typescript
// In TradingService.calculateRiskMetrics()
const sharpeRatio = this.calculateSharpeRatio(returns);

// Returns calculation
const returns = monthlyPerformance.map((month, index) => {
  if (index === 0) return 0;
  const prevMonth = monthlyPerformance[index - 1];
  const currentPl = parseFloat(month.total_pl?.toString() || '0');
  const prevPl = parseFloat(prevMonth.total_pl?.toString() || '0');
  return currentPl - prevPl;
});

// Sharpe ratio calculation
const meanReturn = nonZeroReturns.reduce((sum, ret) => sum + ret, 0) / nonZeroReturns.length;
const variance = nonZeroReturns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / nonZeroReturns.length;
const volatility = Math.sqrt(variance);
const sharpe_ratio = volatility > 0 ? meanReturn / volatility : 0;
```

#### Volatility Calculation

```typescript
// Calculate volatility (standard deviation of returns)
const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
const volatility = Math.sqrt(variance);
```

#### VaR (Value at Risk) Calculation

```typescript
// Calculate VaR (95% confidence level) using historical method
const sortedReturns = [...returns].sort((a, b) => a - b);
const varIndex = Math.floor(sortedReturns.length * 0.05);
const var_95 = sortedReturns[varIndex];
```

#### Max Drawdown Calculation

```typescript
// Calculate maximum drawdown
let maxValue = 0;
let maxDrawdown = 0;

for (const value of cumulativeValues) {
  if (value > maxValue) {
    maxValue = value;
  }
  const drawdown = (maxValue - value) / maxValue;
  if (drawdown > maxDrawdown) {
    maxDrawdown = drawdown;
  }
}
```

## 🎯 Best Practices

### 1. Sử dụng đúng engine cho từng trường hợp

```typescript
// ✅ ĐÚNG - Sử dụng FIFO cho tax optimization
const fifoEngine = new FIFOEngine();
const tradeDetails = fifoEngine.matchTrade(sellTrade, buyTrades, marketPrice);

// ✅ ĐÚNG - Sử dụng LIFO cho specific strategy
const lifoEngine = new LIFOEngine();
const tradeDetails = lifoEngine.matchTrade(sellTrade, buyTrades, marketPrice);
```

### 2. Validate input trước khi tính toán

```typescript
// ✅ ĐÚNG - Validate input
async calculatePositionMetrics(assetId: string, trades: Trade[], marketPrice: number) {
  if (!assetId || !trades || trades.length === 0) {
    throw new BadRequestException('Invalid input parameters');
  }
  
  if (marketPrice <= 0) {
    throw new BadRequestException('Market price must be positive');
  }
  
  // Perform calculation
  return this.positionManager.calculatePositionMetrics(assetId, trades, marketPrice);
}
```

### 3. Xử lý edge cases

```typescript
// ✅ ĐÚNG - Xử lý edge cases
calculateAverageCost(trades: Trade[]): number {
  if (!trades || trades.length === 0) {
    return 0;
  }
  
  const totalQuantity = trades.reduce((sum, trade) => sum + trade.quantity, 0);
  if (totalQuantity === 0) {
    return 0;
  }
  
  const totalCost = trades.reduce((sum, trade) => sum + (trade.quantity * trade.price), 0);
  return totalCost / totalQuantity;
}
```

### 4. Sử dụng precision cho floating point

```typescript
// ✅ ĐÚNG - Sử dụng precision cho floating point
calculateUnrealizedPl(marketValue: number, costBasis: number): number {
  const unrealizedPl = marketValue - costBasis;
  return Math.round(unrealizedPl * 100) / 100; // Round to 2 decimal places
}
```

## 🔧 Code Examples

### Service Integration Example

```typescript
import { Injectable } from '@nestjs/common';
import { PositionManager } from '@/modules/trading/managers/position-manager';
import { RiskManager } from '@/modules/trading/managers/risk-manager';

@Injectable()
export class TradingService {
  constructor(
    private readonly positionManager: PositionManager,
    private readonly riskManager: RiskManager,
  ) {}

  async getPortfolioAnalysis(portfolioId: string) {
    // Get portfolio data
    const portfolio = await this.portfolioRepository.findOne(portfolioId);
    const trades = await this.tradeRepository.findByPortfolioId(portfolioId);
    const marketPrices = await this.getMarketPrices();

    // Calculate position metrics for each asset
    const assetAnalysis = [];
    for (const asset of portfolio.assets) {
      const assetTrades = trades.filter(t => t.assetId === asset.assetId);
      const marketPrice = marketPrices[asset.assetId];
      
      // Use calculation utils
      const positionMetrics = this.positionManager.calculatePositionMetrics(
        asset.assetId,
        assetTrades,
        marketPrice
      );
      
      const riskMetrics = this.riskManager.calculateRiskMetrics(
        asset,
        marketPrice,
        asset.stopLoss,
        asset.takeProfit
      );
      
      assetAnalysis.push({
        assetId: asset.assetId,
        ...positionMetrics,
        ...riskMetrics
      });
    }
    
    return assetAnalysis;
  }
}
```

### Trading Analysis Example

```typescript
import { Injectable } from '@nestjs/common';
import { FIFOEngine } from '@/modules/trading/engines/fifo-engine';

@Injectable()
export class TradingAnalysisService {
  constructor(private readonly fifoEngine: FIFOEngine) {}

  async calculateTradeAnalysis(trades: Trade[], marketPrices: Record<string, number>) {
    const analysis = {
      totalTrades: trades.length,
      totalVolume: 0,
      totalFees: 0,
      totalTax: 0,
      realizedPl: 0,
      unrealizedPl: 0,
      winRate: 0,
      averageWin: 0,
      averageLoss: 0
    };

    // Calculate realized P&L using FIFO
    const sellTrades = trades.filter(t => t.type === 'sell');
    const buyTrades = trades.filter(t => t.type === 'buy');
    
    for (const sellTrade of sellTrades) {
      const tradeDetails = this.fifoEngine.matchTrade(
        sellTrade,
        buyTrades,
        marketPrices[sellTrade.assetId]
      );
      
      // Accumulate metrics
      analysis.totalVolume += sellTrade.quantity * sellTrade.price;
      analysis.totalFees += tradeDetails.reduce((sum, td) => sum + td.fees, 0);
      analysis.totalTax += tradeDetails.reduce((sum, td) => sum + td.tax, 0);
      analysis.realizedPl += tradeDetails.reduce((sum, td) => sum + td.realizedPl, 0);
    }

    // Calculate win rate
    const profitableTrades = sellTrades.filter(t => t.realizedPl > 0);
    analysis.winRate = (profitableTrades.length / sellTrades.length) * 100;

    return analysis;
  }
}
```

## 🚨 Common Mistakes

### 1. Không sử dụng calculation utils

```typescript
// ❌ SAI - Tự tính toán thủ công
const averageCost = totalCost / totalQuantity;
const unrealizedPl = (marketPrice - averageCost) * quantity;

// ✅ ĐÚNG - Sử dụng calculation utils
const metrics = positionManager.calculatePositionMetrics(assetId, trades, marketPrice);
const { averageCost, unrealizedPl } = metrics;
```

### 2. Không validate input

```typescript
// ❌ SAI - Không validate input
const metrics = positionManager.calculatePositionMetrics(assetId, trades, marketPrice);

// ✅ ĐÚNG - Validate input
if (!assetId || !trades || trades.length === 0) {
  throw new BadRequestException('Invalid input parameters');
}
const metrics = positionManager.calculatePositionMetrics(assetId, trades, marketPrice);
```

### 3. Không xử lý edge cases

```typescript
// ❌ SAI - Không xử lý edge cases
const averageCost = totalCost / totalQuantity; // Division by zero error

// ✅ ĐÚNG - Xử lý edge cases
const averageCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
```

### 4. Không sử dụng precision

```typescript
// ❌ SAI - Không sử dụng precision
const unrealizedPl = marketValue - costBasis; // Floating point errors

// ✅ ĐÚNG - Sử dụng precision
const unrealizedPl = Math.round((marketValue - costBasis) * 100) / 100;
```

## 📝 Testing

### Unit Test Example

```typescript
import { PositionManager } from '@/modules/trading/managers/position-manager';

describe('PositionManager', () => {
  let positionManager: PositionManager;

  beforeEach(() => {
    positionManager = new PositionManager();
  });

  describe('calculatePositionMetrics', () => {
    it('should calculate position metrics correctly', () => {
      const trades = [
        { quantity: 100, price: 45000, type: 'buy' },
        { quantity: 50, price: 46000, type: 'buy' }
      ];
      const marketPrice = 50000;

      const metrics = positionManager.calculatePositionMetrics(
        'asset-123',
        trades,
        marketPrice
      );

      expect(metrics.totalQuantity).toBe(150);
      expect(metrics.averageCost).toBe(45333.33);
      expect(metrics.marketValue).toBe(7500000);
      expect(metrics.unrealizedPl).toBe(700000);
    });

    it('should handle empty trades array', () => {
      const metrics = positionManager.calculatePositionMetrics(
        'asset-123',
        [],
        50000
      );

      expect(metrics.totalQuantity).toBe(0);
      expect(metrics.averageCost).toBe(0);
      expect(metrics.marketValue).toBe(0);
    });
  });
});
```

## 🔄 Migration Guide

### Từ manual calculation sang utils

```typescript
// Before - Manual calculation
const totalCost = trades.reduce((sum, trade) => sum + (trade.quantity * trade.price), 0);
const totalQuantity = trades.reduce((sum, trade) => sum + trade.quantity, 0);
const averageCost = totalCost / totalQuantity;
const marketValue = totalQuantity * marketPrice;
const unrealizedPl = marketValue - totalCost;

// After - Using utils
const metrics = positionManager.calculatePositionMetrics(assetId, trades, marketPrice);
const { totalCost, totalQuantity, averageCost, marketValue, unrealizedPl } = metrics;
```

---

**Lưu ý**: Tất cả calculations trong hệ thống phải sử dụng các utilities từ managers và services. Không được tự tính toán thủ công.
