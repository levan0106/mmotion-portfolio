import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, Repository } from 'typeorm';
import { Trade } from '../../trading/entities/trade.entity';
import { TradeDetail } from '../../trading/entities/trade-detail.entity';
import { Asset } from '../../asset/entities/asset.entity';
import { MarketDataService } from '../../market-data/services/market-data.service';
import { GlobalAsset } from '../../asset/entities/global-asset.entity';
import { AssetPrice } from '../../asset/entities/asset-price.entity';
import { AssetValueCalculatorService } from '../../asset/services/asset-value-calculator.service';
import { PriceHistoryService } from '../../asset/services/price-history.service';

export interface PortfolioAssetsCalculationResult {
  totalValue: number;
  unrealizedPl: number;
  realizedPl: number;
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
    private readonly priceHistoryService: PriceHistoryService,
  ) {}

  /**
   * Calculate portfolio values from trades
   * @param portfolioId - Portfolio ID
   * @param currentCashBalance - Current cash balance
   * @returns Promise<PortfolioCalculationResult>
   */
  async calculatePortfolioAssetValues(
    portfolioId: string,
    snapshotDate?: Date,
  ): Promise<PortfolioAssetsCalculationResult> {
    // Get all trades for this portfolio up to snapshot date
    const whereCondition: any = { portfolioId };
    if (snapshotDate) {
      whereCondition.tradeDate = LessThanOrEqual(snapshotDate);
    }
    
    const trades = await this.tradeRepository.find({
      where: whereCondition,
      relations: ['asset'],
      order: { tradeDate: 'ASC' },
    });

    if (trades.length === 0) {
      return {
        totalValue: 0,
        unrealizedPl: 0,
        realizedPl: 0,
        assetPositions: [],
      };
    }


    // Calculate realized P&L from trade details
    const realizedPl = await this.calculateRealizedPl(portfolioId, snapshotDate);

    // Calculate current positions and unrealized P&L
    const positions = await this.calculateCurrentPositions(portfolioId, trades, snapshotDate);

    // Calculate total value (only asset positions, excluding cash balance)
    const totalValue = positions.reduce((sum, pos) => sum + parseFloat(pos.currentValue.toString()), 0);

    // Calculate total unrealized P&L
    const unrealizedPl = positions.reduce((sum, pos) => sum + parseFloat(pos.unrealizedPl.toString()), 0);

    return {
      totalValue,
      unrealizedPl,
      realizedPl,
      assetPositions: positions
    };
  }

  /**
   * Calculate realized P&L from trade details
   * @param portfolioId - Portfolio ID
   * @returns Promise<number>
   */
  private async calculateRealizedPl(portfolioId: string, snapshotDate?: Date): Promise<number> {
    const queryBuilder = this.tradeDetailRepository
      .createQueryBuilder('td')
      .innerJoin('trades', 't', 'td.sellTradeId = t.tradeId')
      .where('t.portfolio_id = :portfolioId', { portfolioId });
    
    if (snapshotDate) {
      queryBuilder.andWhere('t.tradeDate <= :snapshotDate', { snapshotDate });
    }
    
    const result = await queryBuilder
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
    snapshotDate?: Date,
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
      const position = await this.calculateAssetPosition(assetId, assetTradesList, snapshotDate);
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
    snapshotDate?: Date,
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
    let symbol = '';
    let assetType = 'UNKNOWN';

    for (const trade of trades) {
      symbol = trade.asset?.symbol || '';
      assetType = trade.asset?.type || 'UNKNOWN';
    }

    // Get price for snapshot date (use endDate as snapshot date if not provided)
    let currentPrice: number = await this.getAssetPriceFinal(symbol, snapshotDate, trades);
    
    const position = this.assetValueCalculator.calculateAssetPositionFIFOFinal( trades, currentPrice);

    return {
      assetId,
      symbol,
      assetType,
      quantity: position.quantity,
      avgCost: position.avgCost,
      currentValue: position.currentValue,
      unrealizedPl: position.unrealizedPl,
      currentPrice: currentPrice,
    };
  }
  

  private async getAssetPriceFinal(symbol: string, snapshotDate?: Date, trades?: Trade[]): Promise<number> {
    const targetDate = snapshotDate || new Date();
    let currentPrice: number;

    try {

      // consider snapshotDate if not provided use price from global asset
      // if snapshotDate is provided, use price from price history

      // PRIORITY 1: Get price from price history for the snapshot date
      const historicalPrice = await this.priceHistoryService.getPriceByDate(symbol, targetDate);
      if (historicalPrice !== null && historicalPrice > 0) {
        currentPrice = historicalPrice;
      } else {
        // PRIORITY 2: Fallback to current global asset price
        const globalAssetPrice = await this.getCurrentPriceFromGlobalAsset(symbol);
        if (globalAssetPrice && globalAssetPrice > 0) {
          currentPrice = globalAssetPrice;
        } else {
          // PRIORITY 3: Fallback to market data service
          currentPrice = await this.marketDataService.getCurrentPrice(symbol);
          if (currentPrice === 0) {
            // PRIORITY 4: Final fallback to latest trade price
            if (trades && trades.length > 0) {
              const latestTrade = trades[trades.length - 1];
              currentPrice = parseFloat(latestTrade.price.toString());
            }
          }
        }
      }
    } catch (error) {
      // Fallback to latest trade price if all services fail
      const latestTrade = trades[trades.length - 1];
      currentPrice = parseFloat(latestTrade.price.toString());
    }
    return currentPrice;
  }

  // /**
  //  * Calculate NAV for a portfolio (cash + assets)
  //  * @param portfolioId - Portfolio ID
  //  * @param currentCashBalance - Current cash balance
  //  * @returns Promise<number>
  //  */
  // async calculateNAV(portfolioId: string, currentCashBalance: number = 0, snapshotDate?: Date): Promise<number> {
  //   const result = await this.calculatePortfolioAssetValues(portfolioId, snapshotDate);
  //   // NAV = cash balance + asset positions value
  //   const assetValue = result.assetPositions.reduce((sum, pos) => sum + pos.currentValue, 0);
  //   return currentCashBalance + assetValue;
  // }

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
