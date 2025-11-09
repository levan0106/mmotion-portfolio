import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TradeDetail } from '../entities/trade-detail.entity';

/**
 * Repository for TradeDetail entity operations.
 * Provides custom query methods for P&L analysis and trade matching details.
 */
@Injectable()
export class TradeDetailRepository extends Repository<TradeDetail> {
  constructor(
    @InjectRepository(TradeDetail)
    private readonly tradeDetailRepository: Repository<TradeDetail>,
  ) {
    super(tradeDetailRepository.target, tradeDetailRepository.manager, tradeDetailRepository.queryRunner);
  }

  /**
   * Find trade details by sell trade ID
   * @param sellTradeId Sell trade ID
   * @returns Array of trade details
   */
  async findDetailsBySellTrade(sellTradeId: string): Promise<TradeDetail[]> {
    return this.tradeDetailRepository.find({
      where: {
        sellTradeId: sellTradeId,
      },
      relations: ['sellTrade', 'buyTrade', 'asset'],
      order: {
        createdAt: 'ASC',
      },
    });
  }

  /**
   * Find trade details by buy trade ID
   * @param buyTradeId Buy trade ID
   * @returns Array of trade details
   */
  async findDetailsByBuyTrade(buyTradeId: string): Promise<TradeDetail[]> {
    return this.tradeDetailRepository.find({
      where: {
        buyTradeId: buyTradeId,
      },
      relations: ['sellTrade', 'buyTrade', 'asset'],
      order: {
        createdAt: 'ASC',
      },
    });
  }

  /**
   * Find trade details by asset ID
   * @param assetId Asset ID
   * @returns Array of trade details
   */
  async findDetailsByAsset(assetId: string): Promise<TradeDetail[]> {
    return this.tradeDetailRepository.find({
      where: {
        assetId: assetId,
      },
      relations: ['sellTrade', 'buyTrade', 'asset'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Find trade details by asset and portfolio
   * @param assetId Asset ID
   * @param portfolioId Portfolio ID
   * @returns Array of trade details
   */
  async findDetailsByAssetAndPortfolio(
    assetId: string,
    portfolioId: string,
  ): Promise<TradeDetail[]> {
    return this.tradeDetailRepository
      .createQueryBuilder('detail')
      .leftJoinAndSelect('detail.sellTrade', 'sellTrade')
      .leftJoinAndSelect('detail.buyTrade', 'buyTrade')
      .leftJoinAndSelect('detail.asset', 'asset')
      .where('detail.assetId = :assetId', { assetId })
      .andWhere('(sellTrade.portfolioId = :portfolioId OR buyTrade.portfolioId = :portfolioId)', { portfolioId })
      .orderBy('detail.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Get P&L summary for an asset
   * @param assetId Asset ID
   * @param portfolioId Optional portfolio ID filter
   * @returns P&L summary
   */
  async getPnlSummary(
    assetId: string,
    portfolioId?: string,
  ): Promise<{
    totalPnl: number;
    totalVolume: number;
    averagePnl: number;
    winCount: number;
    lossCount: number;
    winRate: number;
  }> {
    let query = this.tradeDetailRepository
      .createQueryBuilder('detail')
      .leftJoin('detail.sellTrade', 'sellTrade')
      .leftJoin('detail.buyTrade', 'buyTrade')
      .where('detail.assetId = :assetId', { assetId });

    if (portfolioId) {
      query = query.andWhere(
        '(sellTrade.portfolioId = :portfolioId OR buyTrade.portfolioId = :portfolioId)',
        { portfolioId }
      );
    }

    const details = await query.getMany();

    const totalPnl = details.reduce((sum, detail) => sum + detail.pnl, 0);
    const totalVolume = details.reduce((sum, detail) => sum + detail.matchedQty, 0);
    const averagePnl = details.length > 0 ? totalPnl / details.length : 0;

    const winCount = details.filter(detail => detail.pnl > 0).length;
    const lossCount = details.filter(detail => detail.pnl < 0).length;
    const winRate = details.length > 0 ? (winCount / details.length) * 100 : 0;

    return {
      totalPnl,
      totalVolume,
      averagePnl,
      winCount,
      lossCount,
      winRate,
    };
  }

  /**
   * Get P&L summary for a portfolio
   * @param portfolioId Portfolio ID
   * @param startDate Optional start date filter
   * @param endDate Optional end date filter
   * @returns P&L summary by asset
   */
  async getPortfolioPnlSummary(
    portfolioId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Array<{
    assetId: string;
    assetSymbol: string;
    totalPnl: number;
    totalVolume: number;
    tradeCount: number;
    winRate: number;
  }>> {
    let query = this.tradeDetailRepository
      .createQueryBuilder('detail')
      .leftJoinAndSelect('detail.asset', 'asset')
      .leftJoin('detail.sellTrade', 'sellTrade')
      .leftJoin('detail.buyTrade', 'buyTrade')
      .where('(sellTrade.portfolioId = :portfolioId OR buyTrade.portfolioId = :portfolioId)', { portfolioId });

    if (startDate && endDate) {
      query = query.andWhere('detail.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const details = await query.getMany();

    // Group by asset
    const assetGroups = new Map<string, TradeDetail[]>();
    for (const detail of details) {
      const assetId = detail.assetId;
      if (!assetGroups.has(assetId)) {
        assetGroups.set(assetId, []);
      }
      assetGroups.get(assetId)!.push(detail);
    }

    const summary = [];
    for (const [assetId, assetDetails] of assetGroups) {
      const totalPnl = assetDetails.reduce((sum, detail) => sum + detail.pnl, 0);
      const totalVolume = assetDetails.reduce((sum, detail) => sum + detail.matchedQty, 0);
      const tradeCount = assetDetails.length;
      const winCount = assetDetails.filter(detail => detail.pnl > 0).length;
      const winRate = tradeCount > 0 ? (winCount / tradeCount) * 100 : 0;

      summary.push({
        assetId,
        assetSymbol: assetDetails[0].asset?.symbol || 'Unknown',
        totalPnl,
        totalVolume,
        tradeCount,
        winRate,
      });
    }

    return summary.sort((a, b) => b.totalPnl - a.totalPnl);
  }

  /**
   * Get trade details for a specific date range
   * @param startDate Start date
   * @param endDate End date
   * @param portfolioId Optional portfolio ID filter
   * @param assetId Optional asset ID filter
   * @returns Array of trade details
   */
  async findDetailsByDateRange(
    startDate: Date,
    endDate: Date,
    portfolioId?: string,
    assetId?: string,
  ): Promise<TradeDetail[]> {
    let query = this.tradeDetailRepository
      .createQueryBuilder('detail')
      .leftJoinAndSelect('detail.sellTrade', 'sellTrade')
      .leftJoinAndSelect('detail.buyTrade', 'buyTrade')
      .leftJoinAndSelect('detail.asset', 'asset')
      .where('detail.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (portfolioId) {
      query = query.andWhere(
        '(sellTrade.portfolioId = :portfolioId OR buyTrade.portfolioId = :portfolioId)',
        { portfolioId }
      );
    }

    if (assetId) {
      query = query.andWhere('detail.assetId = :assetId', { assetId });
    }

    return query.orderBy('detail.createdAt', 'DESC').getMany();
  }

  /**
   * Get realized P&L for a specific trade
   * @param tradeId Trade ID
   * @returns Total realized P&L
   */
  async getRealizedPnlForTrade(tradeId: string): Promise<number> {
    const details = await this.tradeDetailRepository
      .createQueryBuilder('detail')
      .where('detail.sellTradeId = :tradeId OR detail.buyTradeId = :tradeId', { tradeId })
      .getMany();

    return details.reduce((sum, detail) => sum + detail.pnl, 0);
  }

  /**
   * Get trade details with pagination
   * @param page Page number
   * @param limit Items per page
   * @param portfolioId Optional portfolio ID filter
   * @param assetId Optional asset ID filter
   * @returns Paginated trade details
   */
  async findDetailsWithPagination(
    page: number = 1,
    limit: number = 10,
    portfolioId?: string,
    assetId?: string,
  ): Promise<{
    data: TradeDetail[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    let query = this.tradeDetailRepository
      .createQueryBuilder('detail')
      .leftJoinAndSelect('detail.sellTrade', 'sellTrade')
      .leftJoinAndSelect('detail.buyTrade', 'buyTrade')
      .leftJoinAndSelect('detail.asset', 'asset');

    if (portfolioId) {
      query = query.where(
        '(sellTrade.portfolioId = :portfolioId OR buyTrade.portfolioId = :portfolioId)',
        { portfolioId }
      );
    }

    if (assetId) {
      query = query.andWhere('detail.assetId = :assetId', { assetId });
    }

    const total = await query.getCount();
    const data = await query
      .orderBy('detail.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get top performing trades
   * @param limit Number of trades to return
   * @param portfolioId Optional portfolio ID filter
   * @returns Array of top performing trade details
   */
  async getTopPerformingTrades(
    limit: number = 10,
    portfolioId?: string,
  ): Promise<TradeDetail[]> {
    let query = this.tradeDetailRepository
      .createQueryBuilder('detail')
      .leftJoinAndSelect('detail.sellTrade', 'sellTrade')
      .leftJoinAndSelect('detail.buyTrade', 'buyTrade')
      .leftJoinAndSelect('detail.asset', 'asset')
      .orderBy('detail.pnl', 'DESC');

    if (portfolioId) {
      query = query.where(
        '(sellTrade.portfolioId = :portfolioId OR buyTrade.portfolioId = :portfolioId)',
        { portfolioId }
      );
    }

    return query.take(limit).getMany();
  }

  /**
   * Get worst performing trades
   * @param limit Number of trades to return
   * @param portfolioId Optional portfolio ID filter
   * @returns Array of worst performing trade details
   */
  async getWorstPerformingTrades(
    limit: number = 10,
    portfolioId?: string,
  ): Promise<TradeDetail[]> {
    let query = this.tradeDetailRepository
      .createQueryBuilder('detail')
      .leftJoinAndSelect('detail.sellTrade', 'sellTrade')
      .leftJoinAndSelect('detail.buyTrade', 'buyTrade')
      .leftJoinAndSelect('detail.asset', 'asset')
      .orderBy('detail.pnl', 'ASC');

    if (portfolioId) {
      query = query.where(
        '(sellTrade.portfolioId = :portfolioId OR buyTrade.portfolioId = :portfolioId)',
        { portfolioId }
      );
    }

    return query.take(limit).getMany();
  }

  /**
   * Get trades by date range
   * @param portfolioId Portfolio ID
   * @param startDate Start date
   * @param endDate End date
   * @param assetId Optional asset ID filter
   * @returns Array of trade details within date range
   */
  async getTradesByDateRange(
    portfolioId: string,
    startDate: Date,
    endDate: Date,
    assetId?: string,
  ): Promise<TradeDetail[]> {
    let query = this.tradeDetailRepository
      .createQueryBuilder('detail')
      .leftJoinAndSelect('detail.sellTrade', 'sellTrade')
      .leftJoinAndSelect('detail.buyTrade', 'buyTrade')
      .leftJoinAndSelect('detail.asset', 'asset')
      .where(
        '(sellTrade.portfolioId = :portfolioId OR buyTrade.portfolioId = :portfolioId)',
        { portfolioId }
      )
      .andWhere('sellTrade.tradeDate >= :startDate', { startDate })
      .andWhere('sellTrade.tradeDate <= :endDate', { endDate })
      .orderBy('sellTrade.tradeDate', 'ASC');

    if (assetId) {
      query = query.andWhere('detail.assetId = :assetId', { assetId });
    }

    return query.getMany();
  }
}
