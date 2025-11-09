// PortfolioAsset entity has been removed - Portfolio is now linked to Assets through Trades only
import { Trade, TradeSide } from '../entities/trade.entity';
import { TradeDetail } from '../entities/trade-detail.entity';
import { PortfolioCalculationService } from '../../portfolio/services/portfolio-calculation.service';
import { PortfolioValueCalculatorService } from '../../portfolio/services/portfolio-value-calculator.service';

export interface PositionUpdate {
  assetId: string;
  quantity: number;
  avgCost: number;
  marketValue: number;
  unrealizedPl: number;
  realizedPl: number;
}

export interface PositionMetrics {
  totalQuantity: number;
  totalCost: number;
  averageCost: number;
  marketValue: number;
  unrealizedPl: number;
  unrealizedPlPercentage: number;
  realizedPl: number;
  totalPl: number;
}

export class PositionManager {
  constructor(
    private readonly portfolioCalculationService?: PortfolioCalculationService,
    private readonly portfolioValueCalculator?: PortfolioValueCalculatorService,
  ) {}

  /**
   * Update position after a trade
   * @param currentPosition Current portfolio asset position
   * @param trade The trade that affects the position
   * @param marketPrice Current market price for the asset
   * @returns Updated position
   */
  updatePosition(
    currentPosition: any | null,
    trade: Trade,
    marketPrice: number
  ): PositionUpdate {
    if (!currentPosition) {
      // Create new position
      return this.createNewPosition(trade, marketPrice);
    }

    if (trade.side === TradeSide.BUY) {
      return this.updatePositionOnBuy(currentPosition, trade, marketPrice);
    } else {
      return this.updatePositionOnSell(currentPosition, trade, marketPrice);
    }
  }

  /**
   * Create new position from a trade
   * @param trade The trade
   * @param marketPrice Current market price
   * @returns New position
   */
  private createNewPosition(trade: Trade, marketPrice: number): PositionUpdate {
    const totalCost = trade.totalCost;
    const marketValue = trade.quantity * marketPrice;
    const unrealizedPl = marketValue - totalCost;

    return {
      assetId: trade.assetId,
      quantity: trade.quantity,
      avgCost: trade.price,
      marketValue,
      unrealizedPl,
      realizedPl: 0,
    };
  }

  /**
   * Update position when buying more of an asset
   * @param currentPosition Current position
   * @param buyTrade The buy trade
   * @param marketPrice Current market price
   * @returns Updated position
   */
  private updatePositionOnBuy(
    currentPosition: any,
    buyTrade: Trade,
    marketPrice: number
  ): PositionUpdate {
    const currentQuantity = currentPosition.quantity;
    const currentCost = currentPosition.quantity * currentPosition.avgCost;
    const newQuantity = currentQuantity + buyTrade.quantity;
    const newCost = currentCost + buyTrade.totalCost;
    const newAvgCost = newQuantity > 0 ? newCost / newQuantity : 0;
    const marketValue = newQuantity * marketPrice;
    const unrealizedPl = marketValue - newCost;

    return {
      assetId: buyTrade.assetId,
      quantity: newQuantity,
      avgCost: newAvgCost,
      marketValue,
      unrealizedPl,
      realizedPl: currentPosition.unrealizedPl, // Keep existing realized P&L
    };
  }

  /**
   * Update position when selling an asset
   * @param currentPosition Current position
   * @param sellTrade The sell trade
   * @param marketPrice Current market price
   * @returns Updated position
   */
  private updatePositionOnSell(
    currentPosition: any,
    sellTrade: Trade,
    marketPrice: number
  ): PositionUpdate {
    const currentQuantity = currentPosition.quantity;
    const currentCost = currentPosition.quantity * currentPosition.avgCost;
    const newQuantity = Math.max(0, currentQuantity - sellTrade.quantity);
    
    // Calculate realized P&L from the sale
    const soldQuantity = Math.min(sellTrade.quantity, currentQuantity);
    const soldCost = soldQuantity * currentPosition.avgCost;
    const saleProceeds = soldQuantity * sellTrade.price - (sellTrade.fee + sellTrade.tax) * (soldQuantity / sellTrade.quantity);
    const realizedPl = saleProceeds - soldCost;

    const newCost = currentCost - soldCost;
    const newAvgCost = newQuantity > 0 ? newCost / newQuantity : 0;
    const marketValue = newQuantity * marketPrice;
    const unrealizedPl = marketValue - newCost;

    return {
      assetId: sellTrade.assetId,
      quantity: newQuantity,
      avgCost: newAvgCost,
      marketValue,
      unrealizedPl,
      realizedPl: currentPosition.unrealizedPl + realizedPl,
    };
  }

  /**
   * Calculate total quantity for an asset across all trades
   * @param trades Array of trades for the asset
   * @returns Total quantity
   */
  calculateTotalQuantity(trades: Trade[]): number {
    return trades.reduce((total, trade) => {
      const quantity = parseFloat(trade.quantity.toString());
      if (trade.side === TradeSide.BUY) {
        return total + quantity;
      } else {
        return total - quantity;
      }
    }, 0);
  }

  /**
   * Calculate average cost for an asset
   * @param trades Array of trades for the asset
   * @returns Average cost
   */
  calculateAverageCost(trades: Trade[]): number {
    let totalQuantity = 0;
    let totalCost = 0;

    for (const trade of trades) {
      if (trade.side === TradeSide.BUY) {
        // Convert string values to numbers
        const quantity = parseFloat(trade.quantity.toString());
        const price = parseFloat(trade.price.toString());
        const fee = parseFloat(trade.fee.toString());
        const tax = parseFloat(trade.tax.toString());
        
        totalQuantity += quantity;
        // Calculate total cost manually instead of using getter
        const tradeTotalCost = (quantity * price) + fee + tax;
        totalCost += tradeTotalCost;
      }
    }

    // Calculate net position quantity
    const netQuantity = this.calculateTotalQuantity(trades);
    
    // If net position is 0 or negative, return 0
    if (netQuantity <= 0) {
      return 0;
    }

    return totalCost / totalQuantity;
  }

  /**
   * Calculate unrealized P&L for a position
   * @param position Current position
   * @param marketPrice Current market price
   * @returns Unrealized P&L
   */
  calculateUnrealizedPL(position: any, marketPrice: number): number {
    const marketValue = position.quantity * marketPrice;
    const costBasis = position.quantity * position.avgCost;
    return marketValue - costBasis;
  }

  /**
   * Calculate realized P&L from trade details
   * @param tradeDetails Array of trade details
   * @returns Total realized P&L
   */
  calculateRealizedPL(tradeDetails: TradeDetail[]): number {
    return tradeDetails.reduce((total, detail) => total + detail.pnl, 0);
  }

  /**
   * Get current positions from trades
   * @param trades Array of all trades
   * @param marketPrices Current market prices by asset ID
   * @returns Array of current positions
   */
  getCurrentPositions(trades: Trade[], marketPrices: Record<string, number>): PositionMetrics[] {
    const positionsByAsset = new Map<string, Trade[]>();

    // Group trades by asset
    for (const trade of trades) {
      if (!positionsByAsset.has(trade.assetId)) {
        positionsByAsset.set(trade.assetId, []);
      }
      positionsByAsset.get(trade.assetId)!.push(trade);
    }

    const positions: PositionMetrics[] = [];

    for (const [assetId, assetTrades] of positionsByAsset) {
      const totalQuantity = this.calculateTotalQuantity(assetTrades);
      
      if (totalQuantity > 0) {
        const averageCost = this.calculateAverageCost(assetTrades);
        const marketPrice = marketPrices[assetId] || 0;
        const marketValue = totalQuantity * marketPrice;
        const unrealizedPl = marketValue - (totalQuantity * averageCost);
        const unrealizedPlPercentage = averageCost > 0 ? (unrealizedPl / (totalQuantity * averageCost)) * 100 : 0;

        positions.push({
          totalQuantity,
          totalCost: totalQuantity * averageCost,
          averageCost,
          marketValue,
          unrealizedPl,
          unrealizedPlPercentage,
          realizedPl: 0, // This would need to be calculated from trade details
          totalPl: unrealizedPl,
        });
      }
    }

    return positions;
  }

  /**
   * Calculate position metrics for a specific asset
   * @param assetId Asset ID
   * @param trades Array of trades for the asset
   * @param marketPrice Current market price
   * @param tradeDetails Array of trade details for realized P&L
   * @returns Position metrics
   */
  calculatePositionMetrics(
    assetId: string,
    trades: Trade[],
    marketPrice: number,
    tradeDetails: TradeDetail[] = []
  ): PositionMetrics {
    const totalQuantity = this.calculateTotalQuantity(trades);
    const averageCost = this.calculateAverageCost(trades);
    const marketValue = totalQuantity * marketPrice;
    const unrealizedPl = marketValue - (totalQuantity * averageCost);
    const unrealizedPlPercentage = averageCost > 0 ? (unrealizedPl / (totalQuantity * averageCost)) * 100 : 0;
    const realizedPl = this.calculateRealizedPL(tradeDetails);
    const totalPl = unrealizedPl + realizedPl;

    return {
      totalQuantity,
      totalCost: totalQuantity * averageCost,
      averageCost,
      marketValue,
      unrealizedPl,
      unrealizedPlPercentage,
      realizedPl,
      totalPl,
    };
  }
}
