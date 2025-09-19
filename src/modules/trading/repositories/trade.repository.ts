import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { Trade, TradeSide } from '../entities/trade.entity';

/**
 * Repository for Trade entity operations.
 * Provides custom query methods for trade analysis and filtering.
 */
@Injectable()
export class TradeRepository extends Repository<Trade> {
  constructor(
    @InjectRepository(Trade)
    private readonly tradeRepository: Repository<Trade>,
  ) {
    super(tradeRepository.target, tradeRepository.manager, tradeRepository.queryRunner);
  }

  /**
   * Find all buy trades for a specific asset
   * @param assetId Asset ID
   * @returns Array of buy trades
   */
  async findBuyTradesByAsset(assetId: string): Promise<Trade[]> {
    return this.tradeRepository.find({
      where: {
        assetId: assetId,
        side: TradeSide.BUY,
      },
      order: {
        tradeDate: 'ASC', // FIFO order
      },
      relations: ['asset', 'portfolio'],
    });
  }

  /**
   * Find all sell trades for a specific asset
   * @param assetId Asset ID
   * @returns Array of sell trades
   */
  async findSellTradesByAsset(assetId: string): Promise<Trade[]> {
    return this.tradeRepository.find({
      where: {
        assetId: assetId,
        side: TradeSide.SELL,
      },
      order: {
        tradeDate: 'ASC',
      },
      relations: ['asset', 'portfolio'],
    });
  }

  /**
   * Find all trades for a specific portfolio
   * @param portfolioId Portfolio ID
   * @returns Array of trades
   */
  async findTradesByPortfolio(portfolioId: string): Promise<Trade[]> {
    return this.tradeRepository
      .createQueryBuilder('trade')
      .leftJoinAndSelect('trade.asset', 'asset')
      .leftJoinAndSelect('trade.portfolio', 'portfolio')
      .where('trade.portfolioId = :portfolioId', { portfolioId })
      .orderBy('trade.tradeDate', 'DESC')
      .getMany();
  }

  /**
   * Find trades within a date range
   * @param startDate Start date
   * @param endDate End date
   * @param portfolioId Optional portfolio ID filter
   * @param assetId Optional asset ID filter
   * @returns Array of trades
   */
  async findTradesByDateRange(
    startDate: Date,
    endDate: Date,
    portfolioId?: string,
    assetId?: string,
  ): Promise<Trade[]> {
    const where: FindOptionsWhere<Trade> = {
      tradeDate: Between(startDate, endDate),
    };

    if (portfolioId) {
      where.portfolioId = portfolioId;
    }

    if (assetId) {
      where.assetId = assetId;
    }

    return this.tradeRepository.find({
      where,
      order: {
        tradeDate: 'DESC',
      },
      relations: ['asset', 'portfolio'],
    });
  }

  /**
   * Find trades by side (BUY or SELL)
   * @param side Trade side
   * @param portfolioId Optional portfolio ID filter
   * @param assetId Optional asset ID filter
   * @returns Array of trades
   */
  async findTradesBySide(
    side: TradeSide,
    portfolioId?: string,
    assetId?: string,
  ): Promise<Trade[]> {
    const where: FindOptionsWhere<Trade> = {
      side,
    };

    if (portfolioId) {
      where.portfolioId = portfolioId;
    }

    if (assetId) {
      where.assetId = assetId;
    }

    return this.tradeRepository.find({
      where,
      order: {
        tradeDate: 'DESC',
      },
      relations: ['asset', 'portfolio'],
    });
  }

  /**
   * Find trades by asset and portfolio
   * @param assetId Asset ID
   * @param portfolioId Portfolio ID
   * @returns Array of trades
   */
  async findTradesByAssetAndPortfolio(
    assetId: string,
    portfolioId: string,
  ): Promise<Trade[]> {
    return this.tradeRepository.find({
      where: {
        assetId: assetId,
        portfolioId: portfolioId,
      },
      order: {
        tradeDate: 'ASC',
      },
      relations: ['asset', 'portfolio'],
    });
  }

  /**
   * Get trade statistics for analysis
   * @param portfolioId Portfolio ID
   * @param assetId Optional asset ID filter
   * @param startDate Optional start date filter
   * @param endDate Optional end date filter
   * @returns Trade statistics
   */
  async getTradeStatistics(
    portfolioId: string,
    assetId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalTrades: number;
    buyTrades: number;
    sellTrades: number;
    totalVolume: number;
    totalValue: number;
    averagePrice: number;
  }> {
    const where: FindOptionsWhere<Trade> = {
      portfolioId: portfolioId,
    };

    if (assetId) {
      where.assetId = assetId;
    }

    if (startDate && endDate) {
      where.tradeDate = Between(startDate, endDate);
    }

    const trades = await this.tradeRepository.find({
      where,
      relations: ['asset'],
    });

    const buyTrades = trades.filter(trade => trade.side === TradeSide.BUY);
    const sellTrades = trades.filter(trade => trade.side === TradeSide.SELL);

    const totalVolume = trades.reduce((sum, trade) => sum + trade.quantity, 0);
    const totalValue = trades.reduce((sum, trade) => sum + (trade.quantity * trade.price), 0);
    const averagePrice = totalVolume > 0 ? totalValue / totalVolume : 0;

    return {
      totalTrades: trades.length,
      buyTrades: buyTrades.length,
      sellTrades: sellTrades.length,
      totalVolume,
      totalValue,
      averagePrice,
    };
  }

  /**
   * Find unmatched buy trades (for FIFO/LIFO matching)
   * @param assetId Asset ID
   * @param portfolioId Portfolio ID
   * @returns Array of unmatched buy trades
   */
  async findUnmatchedBuyTrades(
    assetId: string,
    portfolioId: string,
  ): Promise<Trade[]> {
    return this.tradeRepository
      .createQueryBuilder('trade')
      .leftJoin('trade.buyDetails', 'detail')
      .where('trade.assetId = :assetId', { assetId })
      .andWhere('trade.portfolioId = :portfolioId', { portfolioId })
      .andWhere('trade.side = :side', { side: TradeSide.BUY })
      .andWhere('detail.detailId IS NULL')
      .orderBy('trade.tradeDate', 'ASC')
      .getMany();
  }

  /**
   * Find unmatched sell trades (for FIFO/LIFO matching)
   * @param assetId Asset ID
   * @param portfolioId Portfolio ID
   * @returns Array of unmatched sell trades
   */
  async findUnmatchedSellTrades(
    assetId: string,
    portfolioId: string,
  ): Promise<Trade[]> {
    return this.tradeRepository
      .createQueryBuilder('trade')
      .leftJoin('trade.sellDetails', 'detail')
      .where('trade.assetId = :assetId', { assetId })
      .andWhere('trade.portfolioId = :portfolioId', { portfolioId })
      .andWhere('trade.side = :side', { side: TradeSide.SELL })
      .andWhere('detail.detailId IS NULL')
      .orderBy('trade.tradeDate', 'ASC')
      .getMany();
  }

  /**
   * Get recent trades for a portfolio
   * @param portfolioId Portfolio ID
   * @param limit Number of trades to return
   * @returns Array of recent trades
   */
  async getRecentTrades(portfolioId: string, limit: number = 10): Promise<Trade[]> {
    return this.tradeRepository.find({
      where: {
        portfolioId: portfolioId,
      },
      order: {
        tradeDate: 'DESC',
      },
      take: limit,
      relations: ['asset', 'portfolio'],
    });
  }

  /**
   * Get trades by trade type
   * @param tradeType Trade type (NORMAL, CANCEL)
   * @param portfolioId Optional portfolio ID filter
   * @returns Array of trades
   */
  async findTradesByType(
    tradeType: string,
    portfolioId?: string,
  ): Promise<Trade[]> {
    const where: FindOptionsWhere<Trade> = {
      tradeType: tradeType as any,
    };

    if (portfolioId) {
      where.portfolioId = portfolioId;
    }

    return this.tradeRepository.find({
      where,
      order: {
        tradeDate: 'DESC',
      },
      relations: ['asset', 'portfolio'],
    });
  }

  /**
   * Search trades by source
   * @param source Trade source
   * @param portfolioId Optional portfolio ID filter
   * @returns Array of trades
   */
  async findTradesBySource(
    source: string,
    portfolioId?: string,
  ): Promise<Trade[]> {
    const where: FindOptionsWhere<Trade> = {
      source,
    };

    if (portfolioId) {
      where.portfolioId = portfolioId;
    }

    return this.tradeRepository.find({
      where,
      order: {
        tradeDate: 'DESC',
      },
      relations: ['asset', 'portfolio'],
    });
  }
}
