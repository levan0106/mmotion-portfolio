import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trade } from '../../trading/entities/trade.entity';
import { TradeDetail } from '../../trading/entities/trade-detail.entity';
import { Asset } from '../../asset/entities/asset.entity';
import { MarketDataService } from '../../market-data/services/market-data.service';
import { GlobalAsset } from '../../asset/entities/global-asset.entity';
import { AssetPrice } from '../../asset/entities/asset-price.entity';
import { AssetValueCalculatorService } from '../../asset/services/asset-value-calculator.service';

export interface PortfolioCalculationResult {
  totalValue: number;
  unrealizedPl: number;
  realizedPl: number;
  cashBalance: number;
  assetPositions: Array<{
    assetId: string;
    symbol: string;
    assetType: string;
    quantity: number;
    avgCost: number;
    currentValue: number;
    unrealizedPl: number;
    currentPrice: number;
  }>;
}

/**
 * Service for calculating portfolio values from trades
 */
@Injectable()
export class PortfolioCalculationService {
  constructor(
    @InjectRepository(Trade)
    private readonly tradeRepository: Repository<Trade>,
    @InjectRepository(TradeDetail)
    private readonly tradeDetailRepository: Repository<TradeDetail>,
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    @InjectRepository(GlobalAsset)
    private readonly globalAssetRepository: Repository<GlobalAsset>,
    @InjectRepository(AssetPrice)
    private readonly assetPriceRepository: Repository<AssetPrice>,
    private readonly marketDataService: MarketDataService,
    private readonly assetValueCalculator: AssetValueCalculatorService,
  ) {}

  /**
   * Calculate portfolio values from trades
   * @param portfolioId - Portfolio ID
   * @param currentCashBalance - Current cash balance
   * @returns Promise<PortfolioCalculationResult>
   */
  async calculatePortfolioValues(
    portfolioId: string,
    currentCashBalance: number = 0,
  ): Promise<PortfolioCalculationResult> {
    // Get all trades for this portfolio
    const trades = await this.tradeRepository.find({
      where: { portfolioId },
      relations: ['asset'],
      order: { tradeDate: 'ASC' },
    });

    if (trades.length === 0) {
      return {
        totalValue: currentCashBalance,
        unrealizedPl: 0,
        realizedPl: 0,
        cashBalance: currentCashBalance,
        assetPositions: [],
      };
    }

    // Calculate realized P&L from trade details
    const realizedPl = await this.calculateRealizedPl(portfolioId);

    // Calculate current positions and unrealized P&L
    const positions = await this.calculateCurrentPositions(portfolioId, trades);

    // Calculate total value (only asset positions, excluding cash balance)
    const totalValue = positions.reduce((sum, pos) => sum + pos.currentValue, 0);

    // Calculate total unrealized P&L
    const unrealizedPl = positions.reduce((sum, pos) => sum + pos.unrealizedPl, 0);

    return {
      totalValue,
      unrealizedPl,
      realizedPl,
      cashBalance: currentCashBalance,
      assetPositions: positions,

    };
  }

  /**
   * Calculate realized P&L from trade details
   * @param portfolioId - Portfolio ID
   * @returns Promise<number>
   */
  private async calculateRealizedPl(portfolioId: string): Promise<number> {
    const result = await this.tradeDetailRepository
      .createQueryBuilder('td')
      .innerJoin('trades', 't', 'td.sellTradeId = t.tradeId')
      .where('t.portfolio_id = :portfolioId', { portfolioId })
      .select('COALESCE(SUM(td.pnl), 0)', 'totalRealizedPl')
      .getRawOne();

    return parseFloat(result.totalRealizedPl) || 0;
  }

  /**
   * Calculate current positions from trades
   * @param portfolioId - Portfolio ID
   * @param trades - All trades for the portfolio
   * @returns Promise<Array<AssetPosition>>
   */
  private async calculateCurrentPositions(
    portfolioId: string,
    trades: Trade[],
  ): Promise<Array<{
    assetId: string;
    symbol: string;
    assetType: string;
    quantity: number;
    avgCost: number;
    currentValue: number;
    unrealizedPl: number;
    currentPrice: number;
  }>> {
    // Group trades by asset
    const assetTrades = new Map<string, Trade[]>();
    for (const trade of trades) {
      if (!assetTrades.has(trade.assetId)) {
        assetTrades.set(trade.assetId, []);
      }
      assetTrades.get(trade.assetId)!.push(trade);
    }

    const positions = [];

    for (const [assetId, assetTradesList] of assetTrades) {
      const position = await this.calculateAssetPosition(assetId, assetTradesList);
      if (position.quantity > 0) {
        positions.push(position);
      }
    }

    return positions;
  }

  /**
   * Calculate position for a specific asset
   * @param assetId - Asset ID
   * @param trades - Trades for this asset
   * @returns AssetPosition
   */
  private async calculateAssetPosition(
    assetId: string,
    trades: Trade[],
  ): Promise<{
    assetId: string;
    symbol: string;
    assetType: string;
    quantity: number;
    avgCost: number;
    currentValue: number;
    unrealizedPl: number;
    currentPrice: number;
  }> {
    let totalQuantity = 0;
    let totalCost = 0;
    let symbol = '';
    let assetType = 'UNKNOWN';

    // Process trades in chronological order
    for (const trade of trades) {
      symbol = trade.asset?.symbol || '';
      assetType = trade.asset?.type || 'UNKNOWN';
      
      if (trade.side === 'BUY') {
        totalQuantity += parseFloat(trade.quantity.toString());
        totalCost += parseFloat(trade.quantity.toString()) * parseFloat(trade.price.toString());
      } else if (trade.side === 'SELL') {
        totalQuantity -= parseFloat(trade.quantity.toString());
        // For sells, we don't adjust cost basis (FIFO/LIFO would be handled differently)
      }
    }

    if (totalQuantity <= 0) {
      return {
        assetId,
        symbol,
        assetType,
        quantity: 0,
        avgCost: 0,
        currentValue: 0,
        unrealizedPl: 0,
        currentPrice: 0,
      };
    }

    const avgCost = totalCost / totalQuantity;
    
    // Get current price from global assets (new logic)
    // Fallback to latest trade price if global asset price is not available
    let currentPrice: number;
    try {
      // Try to get price from global assets first
      const globalAssetPrice = await this.getCurrentPriceFromGlobalAsset(symbol);
      if (globalAssetPrice && globalAssetPrice > 0) {
        currentPrice = globalAssetPrice;
      } else {
        // Fallback to market data service
        currentPrice = await this.marketDataService.getCurrentPrice(symbol);
        if (currentPrice === 0) {
          // Final fallback to latest trade price
          const latestTrade = trades[trades.length - 1];
          currentPrice = parseFloat(latestTrade.price.toString());
        }
      }
    } catch (error) {
      // Fallback to latest trade price if all services fail
      const latestTrade = trades[trades.length - 1];
      currentPrice = parseFloat(latestTrade.price.toString());
    }
    
    const currentValue = this.assetValueCalculator.calculateCurrentValue(totalQuantity, currentPrice); // add tax, fee, commission, other deductions, discount
    const unrealizedPl = this.assetValueCalculator.calculateUnrealizedPL(totalQuantity, currentPrice, avgCost); // add tax, fee, commission, other deductions, discount

    return {
      assetId,
      symbol,
      assetType,
      quantity: totalQuantity,
      avgCost,
      currentValue,
      unrealizedPl,
      currentPrice: currentPrice,
    };
  }

  /**
   * Calculate NAV for a portfolio (cash + assets)
   * @param portfolioId - Portfolio ID
   * @param currentCashBalance - Current cash balance
   * @returns Promise<number>
   */
  async calculateNAV(portfolioId: string, currentCashBalance: number = 0): Promise<number> {
    const result = await this.calculatePortfolioValues(portfolioId, currentCashBalance);
    // NAV = cash balance + asset positions value
    const assetValue = result.assetPositions.reduce((sum, pos) => sum + pos.currentValue, 0);
    return currentCashBalance + assetValue;
  }

  /**
   * Get current price from global assets
   * @param symbol - Asset symbol
   * @returns Promise<number | null>
   */
  private async getCurrentPriceFromGlobalAsset(symbol: string): Promise<number | null> {
    try {
      const globalAsset = await this.globalAssetRepository.findOne({
        where: { symbol: symbol },
        relations: ['assetPrice']
      });

      if (globalAsset && globalAsset.assetPrice && globalAsset.assetPrice.currentPrice) {
        return parseFloat(globalAsset.assetPrice.currentPrice.toString());
      }

      return null;
    } catch (error) {
      console.error(`Error getting price from global asset for ${symbol}:`, error);
      return null;
    }
  }
}
