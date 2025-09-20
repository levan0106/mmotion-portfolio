import { Injectable, Logger, NotFoundException, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetAllocationSnapshot } from '../entities/asset-allocation-snapshot.entity';
import { SnapshotRepository, SnapshotQueryOptions, SnapshotAggregationResult } from '../repositories/snapshot.repository';
import { SnapshotGranularity } from '../enums/snapshot-granularity.enum';
import { AssetService } from '../../asset/services/asset.service';
import { AssetGlobalSyncService } from '../../asset/services/asset-global-sync.service';
import { MarketDataService } from '../../asset/services/market-data.service';
import { AssetValueCalculatorService } from '../../asset/services/asset-value-calculator.service';
import { Trade } from '../../trading/entities/trade.entity';
import { TradeDetail } from '../../trading/entities/trade-detail.entity';
import { PortfolioSnapshotService } from './portfolio-snapshot.service';

export interface CreateSnapshotDto {
  portfolioId: string;
  assetId: string;
  assetSymbol: string;
  snapshotDate: Date;
  granularity: SnapshotGranularity;
  quantity: number;
  currentPrice: number;
  currentValue: number;
  costBasis: number;
  avgCost: number;
  realizedPl: number;
  unrealizedPl: number;
  totalPl: number;
  allocationPercentage: number;
  portfolioTotalValue: number;
  returnPercentage: number;
  dailyReturn: number;
  cumulativeReturn: number;
  isActive?: boolean;
  createdBy?: string;
  notes?: string;
}

export interface UpdateSnapshotDto {
  quantity?: number;
  currentPrice?: number;
  currentValue?: number;
  costBasis?: number;
  avgCost?: number;
  realizedPl?: number;
  unrealizedPl?: number;
  totalPl?: number;
  allocationPercentage?: number;
  portfolioTotalValue?: number;
  returnPercentage?: number;
  dailyReturn?: number;
  cumulativeReturn?: number;
  isActive?: boolean;
  notes?: string;
}

export interface SnapshotTimelineQuery {
  portfolioId: string;
  startDate: Date;
  endDate: Date;
  granularity?: SnapshotGranularity;
  assetId?: string;
  assetSymbol?: string;
}

@Injectable()
export class SnapshotService {
  private readonly logger = new Logger(SnapshotService.name);

  constructor(
    @InjectRepository(AssetAllocationSnapshot)
    private readonly snapshotRepository: Repository<AssetAllocationSnapshot>,
    private readonly snapshotRepo: SnapshotRepository,
    private readonly assetService: AssetService,
    private readonly assetGlobalSyncService: AssetGlobalSyncService,
    private readonly marketDataService: MarketDataService,
    private readonly assetValueCalculator: AssetValueCalculatorService,
    @InjectRepository(Trade)
    private readonly tradeRepository: Repository<Trade>,
    @InjectRepository(TradeDetail)
    private readonly tradeDetailRepository: Repository<TradeDetail>,
    @Inject(forwardRef(() => PortfolioSnapshotService))
    private readonly portfolioSnapshotService: PortfolioSnapshotService,
  ) {}

  /**
   * Create a new snapshot
   */
  async createSnapshot(createDto: CreateSnapshotDto): Promise<AssetAllocationSnapshot> {
    this.logger.log(`Creating snapshot for portfolio ${createDto.portfolioId}, asset ${createDto.assetSymbol}`);

    // Validate asset exists
    const asset = await this.assetService.findById(createDto.assetId);
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${createDto.assetId} not found`);
    }

    // Check if snapshot already exists
    const exists = await this.snapshotRepo.exists(
      createDto.portfolioId,
      createDto.assetId,
      new Date(createDto.snapshotDate),
      createDto.granularity
    );

    if (exists) {
      throw new BadRequestException(
        `Snapshot already exists for portfolio ${createDto.portfolioId}, asset ${createDto.assetSymbol} on ${createDto.snapshotDate} with granularity ${createDto.granularity}`
      );
    }

    // Create snapshot
    const snapshot = await this.snapshotRepo.create({
      ...createDto,
      snapshotDate: new Date(createDto.snapshotDate),
      isActive: createDto.isActive ?? true,
    });

    this.logger.log(`Snapshot created successfully with ID ${snapshot.id}`);

    // Try to create or update portfolio snapshot after individual asset snapshot is created
    // Only if this is not already being called from portfolio snapshot creation
    if (!createDto.createdBy?.includes('portfolio-snapshot')) {
      try {
        await this.createOrUpdatePortfolioSnapshot(
          createDto.portfolioId,
          new Date(createDto.snapshotDate),
          createDto.granularity,
          createDto.createdBy
        );
      } catch (error) {
        this.logger.error(`Failed to create/update portfolio snapshot for portfolio ${createDto.portfolioId}:`, error);
        // Don't throw error here to avoid breaking asset snapshot creation
      }
    }

    return snapshot;
  }

  /**
   * Create snapshots for all assets in a portfolio
   */
  async createPortfolioSnapshot(
    portfolioId: string,
    snapshotDate: Date,
    granularity: SnapshotGranularity = SnapshotGranularity.DAILY,
    createdBy?: string
  ): Promise<AssetAllocationSnapshot[]> {
    this.logger.log(`Creating portfolio snapshot for ${portfolioId} on ${snapshotDate.toISOString().split('T')[0]}`);

    // Get all assets in portfolio
    const assets = await this.assetService.findByPortfolioId(portfolioId);
    
    this.logger.log(`Found ${assets.length} assets in portfolio ${portfolioId}`);
    
    if (assets.length === 0) {
      this.logger.warn(`No assets found in portfolio ${portfolioId}. Cannot create snapshots.`);
      return [];
    }
    
    const snapshots: Partial<AssetAllocationSnapshot>[] = [];

    for (const asset of assets) {
      this.logger.log(`Processing asset ${asset.symbol} (${asset.id}) for snapshot`);
      
      // Get real current price
      const currentPrice = await this.getCurrentPrice(asset.symbol);
      
      // Get real cost data from trades
      const costData = await this.getCostData(asset.id, portfolioId);
      
      // Calculate real values - get quantity from trades for this specific portfolio
      const currentValues = await this.assetService.calculateCurrentValues(asset.id, portfolioId);
      const quantity = currentValues.currentQuantity;
      const costBasis = quantity * costData.avgCost;
      const currentValue = this.assetValueCalculator.calculateCurrentValue(quantity, currentPrice);
      const unrealizedPl = this.assetValueCalculator.calculateUnrealizedPL(quantity, currentPrice, costData.avgCost);
      const realizedPl = costData.realizedPl;
      const totalPl = realizedPl + unrealizedPl;
      const returnPercentage = this.assetValueCalculator.calculateReturnPercentage(quantity, currentPrice, costData.avgCost);
      
      this.logger.log(`Calculated values for ${asset.symbol}:`, {
        quantity,
        currentPrice,
        avgCost: costData.avgCost,
        costBasis,
        currentValue,
        unrealizedPl,
        realizedPl,
        totalPl,
        returnPercentage
      });
      
      const snapshot: Partial<AssetAllocationSnapshot> = {
        portfolioId,
        assetId: asset.id,
        assetSymbol: asset.symbol,
        snapshotDate,
        granularity,
        quantity,
        currentPrice,
        currentValue,
        costBasis,
        avgCost: costData.avgCost,
        realizedPl,
        unrealizedPl,
        totalPl,
        allocationPercentage: 0, // Will be calculated after all snapshots are created
        portfolioTotalValue: 0, // Will be calculated after all snapshots are created
        returnPercentage,
        dailyReturn: 0, // Will be calculated later
        cumulativeReturn: 0, // Will be calculated later
        isActive: true,
        createdBy,
        notes: `Portfolio snapshot for ${snapshotDate.toISOString().split('T')[0]}`,
      };

      snapshots.push(snapshot);
    }

    // First, delete existing snapshots for the same portfolio, date, and granularity
    // This ensures we only have one snapshot per day per portfolio
    await this.snapshotRepo.deleteByPortfolioDateAndGranularity(portfolioId, snapshotDate, granularity);
    this.logger.log(`Deleted existing snapshots for portfolio ${portfolioId} on ${snapshotDate.toISOString().split('T')[0]} with granularity ${granularity}`);

    // Create all snapshots in batch
    const createdSnapshots = await this.snapshotRepo.createMany(snapshots);
    
    this.logger.log(`Created ${createdSnapshots.length} snapshots for portfolio ${portfolioId}`);

    // Create portfolio snapshot after asset snapshots are created
    try {
      this.logger.log(`Creating portfolio snapshot for portfolio ${portfolioId} on ${snapshotDate.toISOString().split('T')[0]}`);
      const portfolioSnapshot = await this.portfolioSnapshotService.createPortfolioSnapshotFromAssetSnapshots(
        portfolioId,
        snapshotDate,
        granularity,
        createdBy ? `${createdBy}-portfolio-snapshot` : 'portfolio-snapshot'
      );
      this.logger.log(`Portfolio snapshot created successfully with ID ${portfolioSnapshot.id}`);
    } catch (error) {
      this.logger.error(`Failed to create portfolio snapshot for portfolio ${portfolioId}:`, error);
      // Don't throw error here to avoid breaking asset snapshot creation
      // Portfolio snapshot creation is optional and can be retried later
    }
    
    return createdSnapshots;
  }

  /**
   * Get snapshot by ID
   */
  async getSnapshotById(id: string): Promise<AssetAllocationSnapshot> {
    const snapshot = await this.snapshotRepo.findById(id);
    if (!snapshot) {
      throw new NotFoundException(`Snapshot with ID ${id} not found`);
    }
    return snapshot;
  }

  /**
   * Get snapshots with query options
   */
  async getSnapshots(options: SnapshotQueryOptions): Promise<AssetAllocationSnapshot[]> {
    return await this.snapshotRepo.findMany(options);
  }

  /**
   * Get snapshots with pagination
   */
  async getSnapshotsWithPagination(options: SnapshotQueryOptions) {
    return await this.snapshotRepo.findManyWithPagination(options);
  }

  /**
   * Get timeline data for portfolio
   */
  async getTimelineData(query: SnapshotTimelineQuery): Promise<AssetAllocationSnapshot[]> {
    this.logger.log(`Getting timeline data for portfolio ${query.portfolioId} from ${query.startDate.toISOString().split('T')[0]} to ${query.endDate.toISOString().split('T')[0]}`);

    const options: SnapshotQueryOptions = {
      portfolioId: query.portfolioId,
      startDate: query.startDate,
      endDate: query.endDate,
      granularity: query.granularity || SnapshotGranularity.DAILY,
      assetId: query.assetId,
      assetSymbol: query.assetSymbol,
      isActive: true,
      orderBy: 'snapshot.snapshotDate',
      orderDirection: 'ASC',
    };

    return await this.snapshotRepo.findMany(options);
  }

  /**
   * Get aggregated timeline data
   */
  async getAggregatedTimelineData(
    portfolioId: string,
    startDate: Date,
    endDate: Date,
    granularity: SnapshotGranularity = SnapshotGranularity.DAILY
  ): Promise<SnapshotAggregationResult[]> {
    this.logger.log(`Getting aggregated timeline data for portfolio ${portfolioId}`);

    return await this.snapshotRepo.findAggregatedByDate(portfolioId, startDate, endDate, granularity);
  }

  /**
   * Get latest snapshot for portfolio
   */
  async getLatestSnapshot(
    portfolioId: string,
    assetId?: string,
    granularity?: SnapshotGranularity
  ): Promise<AssetAllocationSnapshot | null> {
    return await this.snapshotRepo.findLatest(portfolioId, assetId, granularity);
  }

  /**
   * Get portfolios that have snapshots
   */
  async getPortfoliosWithSnapshots(): Promise<{ portfolioId: string; portfolioName: string; snapshotCount: number; latestSnapshotDate: Date; oldestSnapshotDate: Date }[]> {
    this.logger.log('Getting portfolios with snapshots');
    
    return await this.snapshotRepo.findPortfoliosWithSnapshots();
  }

  /**
   * Update snapshot
   */
  async updateSnapshot(id: string, updateDto: UpdateSnapshotDto): Promise<AssetAllocationSnapshot> {
    this.logger.log(`Updating snapshot ${id}`);

    const snapshot = await this.getSnapshotById(id);
    
    // Recalculate derived fields if needed
    if (updateDto.currentValue !== undefined || updateDto.costBasis !== undefined) {
      updateDto.unrealizedPl = (updateDto.currentValue || snapshot.currentValue) - (updateDto.costBasis || snapshot.costBasis);
      updateDto.totalPl = (updateDto.realizedPl || snapshot.realizedPl) + updateDto.unrealizedPl;
    }

    if (updateDto.currentValue !== undefined && updateDto.portfolioTotalValue !== undefined) {
      updateDto.allocationPercentage = (updateDto.currentValue / updateDto.portfolioTotalValue) * 100;
    }

    if (updateDto.costBasis !== undefined && updateDto.currentValue !== undefined) {
      updateDto.returnPercentage = updateDto.costBasis > 0 ? ((updateDto.currentValue - updateDto.costBasis) / updateDto.costBasis) * 100 : 0;
    }

    const updatedSnapshot = await this.snapshotRepo.update(id, updateDto);
    if (!updatedSnapshot) {
      throw new NotFoundException(`Snapshot with ID ${id} not found`);
    }

    this.logger.log(`Snapshot ${id} updated successfully`);
    return updatedSnapshot;
  }

  /**
   * Soft delete snapshot
   */
  async deleteSnapshot(id: string): Promise<boolean> {
    this.logger.log(`Soft deleting snapshot ${id}`);

    const success = await this.snapshotRepo.softDelete(id);
    if (!success) {
      throw new NotFoundException(`Snapshot with ID ${id} not found`);
    }

    this.logger.log(`Snapshot ${id} soft deleted successfully`);
    return true;
  }

  /**
   * Hard delete snapshot
   */
  async hardDeleteSnapshot(id: string): Promise<boolean> {
    this.logger.log(`Hard deleting snapshot ${id}`);

    const success = await this.snapshotRepo.delete(id);
    if (!success) {
      throw new NotFoundException(`Snapshot with ID ${id} not found`);
    }

    this.logger.log(`Snapshot ${id} hard deleted successfully`);
    return true;
  }

  /**
   * Get snapshot statistics
   */
  async getSnapshotStatistics(portfolioId: string) {
    return await this.snapshotRepo.getStatistics(portfolioId);
  }

  /**
   * Clean up old snapshots based on retention policy
   */
  async cleanupOldSnapshots(portfolioId?: string): Promise<number> {
    this.logger.log(`Cleaning up old snapshots${portfolioId ? ` for portfolio ${portfolioId}` : ''}`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 365); // 1 year retention

    const criteria: Partial<AssetAllocationSnapshot> = {
      isActive: true,
    };

    if (portfolioId) {
      criteria.portfolioId = portfolioId;
    }

    // Soft delete old snapshots
    const result = await this.snapshotRepo.updateMany(
      {
        ...criteria,
        snapshotDate: { $lt: cutoffDate } as any, // TypeORM doesn't support $lt directly
      },
      { isActive: false }
    );

    this.logger.log(`Cleaned up ${result} old snapshots`);
    return result;
  }

  /**
   * Get current price for an asset symbol
   */
  private async getCurrentPrice(symbol: string): Promise<number> {
    try {
      // Try to get current price from global asset first
      const globalAssetPrice = await this.assetGlobalSyncService.getCurrentPriceFromGlobalAsset(symbol);
      if (globalAssetPrice !== null && globalAssetPrice > 0) {
        this.logger.debug(`Using global asset price for ${symbol}: ${globalAssetPrice}`);
        return globalAssetPrice;
      }

      // Fallback: try to get from market data service
      const marketPrice = await this.marketDataService.getCurrentPrice(symbol);
      if (marketPrice > 0) {
        this.logger.debug(`Using market data price for ${symbol}: ${marketPrice}`);
        return marketPrice;
      }

      // Final fallback: get latest trade price
      const latestTradePrice = await this.getLatestTradePrice(symbol);
      if (latestTradePrice > 0) {
        this.logger.debug(`Using latest trade price for ${symbol}: ${latestTradePrice}`);
        return latestTradePrice;
      }

      this.logger.warn(`No price found for symbol ${symbol}, using 0`);
      return 0;
    } catch (error) {
      this.logger.error(`Error getting current price for ${symbol}:`, error);
      return 0;
    }
  }

  /**
   * Get latest trade price for a symbol
   */
  private async getLatestTradePrice(symbol: string): Promise<number> {
    try {
      // Get the latest trade for this symbol
      const latestTrade = await this.tradeRepository.findOne({
        where: { asset: { symbol } },
        order: { tradeDate: 'DESC' },
        relations: ['asset']
      });

      if (latestTrade) {
        return parseFloat(latestTrade.price.toString());
      }

      return 0;
    } catch (error) {
      this.logger.error(`Error getting latest trade price for ${symbol}:`, error);
      return 0;
    }
  }

  /**
   * Get cost data for an asset from trades
   */
  private async getCostData(assetId: string, portfolioId: string): Promise<{
    costBasis: number;
    avgCost: number;
    realizedPl: number;
  }> {
    try {
      this.logger.log(`Getting cost data for asset ${assetId} in portfolio ${portfolioId}`);
      
      // Get all trades for this asset in this portfolio
      const trades = await this.tradeRepository.find({
        where: { 
          assetId,
          portfolioId
        },
        order: { tradeDate: 'ASC' }
      });

      if (trades.length === 0) {
        return {
          costBasis: 0,
          avgCost: 0,
          realizedPl: 0,
        };
      }

      // Calculate average cost and total cost from buy trades
      let totalQuantity = 0;
      let totalCost = 0;
      let realizedPl = 0;

      for (const trade of trades) {
        const quantity = parseFloat(trade.quantity.toString());
        const price = parseFloat(trade.price.toString());
        const fee = parseFloat(trade.fee?.toString() || '0');
        const tax = parseFloat(trade.tax?.toString() || '0');
        const totalTradeCost = quantity * price + fee + tax;

        if (trade.side === 'BUY') {
          totalQuantity += quantity;
          totalCost += totalTradeCost;
        } else if (trade.side === 'SELL') {
          totalQuantity -= quantity;
          // Calculate realized P&L from trade details
          const tradeDetails = await this.tradeDetailRepository.find({
            where: { sellTradeId: trade.tradeId }
          });
          realizedPl += tradeDetails.reduce((sum, detail) => sum + (Number(detail.pnl) || 0), 0);
        }
      }

      const avgCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
      const costBasis = totalQuantity * avgCost;

      this.logger.log(`Cost data calculated for asset ${assetId}:`, {
        totalQuantity,
        totalCost,
        avgCost,
        costBasis,
        realizedPl
      });
      
      return {
        costBasis,
        avgCost,
        realizedPl,
      };
    } catch (error) {
      this.logger.error(`Error getting cost data for asset ${assetId}:`, error);
      return {
        costBasis: 0,
        avgCost: 0,
        realizedPl: 0,
      };
    }
  }

  /**
   * Recalculate snapshot data from current asset state
   */
  async recalculateSnapshot(id: string): Promise<AssetAllocationSnapshot> {
    this.logger.log(`Recalculating snapshot ${id}`);

    const snapshot = await this.getSnapshotById(id);
    
    // Get current asset data
    const asset = await this.assetService.findById(snapshot.assetId);
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${snapshot.assetId} not found`);
    }

    // Update snapshot with current data
    const updateDto: UpdateSnapshotDto = {
      quantity: asset.currentQuantity || 0,
      currentPrice: 0, // Will be fetched from GlobalAsset or calculated
      currentValue: 0, // Will be calculated
      costBasis: 0, // Will be calculated from trades
      avgCost: 0, // Will be calculated from trades
      realizedPl: 0, // Will be calculated from trade details
      unrealizedPl: 0, // Will be calculated
      totalPl: 0, // Will be calculated
      allocationPercentage: 0, // Will be calculated later
      portfolioTotalValue: 0, // Will be calculated later
      returnPercentage: 0, // Will be calculated later
    };

    return await this.updateSnapshot(id, updateDto);
  }

  /**
   * Bulk recalculate snapshots for a portfolio
   */
  async bulkRecalculateSnapshots(portfolioId: string, snapshotDate?: Date): Promise<number> {
    this.logger.log(`Bulk recalculating snapshots for portfolio ${portfolioId}`);

    const options: SnapshotQueryOptions = {
      portfolioId,
      isActive: true,
    };

    if (snapshotDate) {
      options.startDate = snapshotDate;
      options.endDate = snapshotDate;
    }

    const snapshots = await this.snapshotRepo.findMany(options);
    let updatedCount = 0;

    for (const snapshot of snapshots) {
      try {
        await this.recalculateSnapshot(snapshot.id);
        updatedCount++;
      } catch (error) {
        this.logger.error(`Failed to recalculate snapshot ${snapshot.id}: ${error.message}`);
      }
    }

    this.logger.log(`Bulk recalculated ${updatedCount} snapshots for portfolio ${portfolioId}`);
    return updatedCount;
  }

  /**
   * Delete snapshots by portfolio and date range
   */
  async deleteSnapshotsByDateRange(
    portfolioId: string,
    startDate: Date,
    endDate: Date,
    granularity?: SnapshotGranularity
  ): Promise<{ deletedCount: number; message: string }> {
    this.logger.log(`Deleting snapshots for portfolio ${portfolioId} from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}${granularity ? ` with granularity ${granularity}` : ''}`);

    const deletedCount = await this.snapshotRepo.deleteByPortfolioAndDateRange(
      portfolioId,
      startDate,
      endDate,
      granularity
    );

    // Also delete corresponding portfolio snapshots
    try {
      await this.portfolioSnapshotService.deletePortfolioSnapshotsByDateRange(
        portfolioId,
        startDate,
        endDate,
        granularity
      );
      this.logger.log(`Portfolio snapshots also deleted for portfolio ${portfolioId} from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
    } catch (error) {
      this.logger.warn(`Failed to delete portfolio snapshots: ${error.message}`);
      // Continue even if portfolio snapshot deletion fails
    }

    const message = `Successfully deleted ${deletedCount} snapshots for portfolio ${portfolioId} from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}${granularity ? ` with granularity ${granularity}` : ''}`;
    
    this.logger.log(message);
    return { deletedCount, message };
  }

  /**
   * Delete snapshots by portfolio and specific date
   */
  async deleteSnapshotsByDate(
    portfolioId: string,
    snapshotDate: Date,
    granularity?: SnapshotGranularity
  ): Promise<{ deletedCount: number; message: string }> {
    this.logger.log(`Deleting snapshots for portfolio ${portfolioId} on ${snapshotDate.toISOString().split('T')[0]}${granularity ? ` with granularity ${granularity}` : ''}`);

    const deletedCount = await this.snapshotRepo.deleteByPortfolioAndDate(
      portfolioId,
      snapshotDate,
      granularity
    );

    // Also delete corresponding portfolio snapshot
    try {
      await this.portfolioSnapshotService.deleteByPortfolioAndDate(
        portfolioId,
        snapshotDate,
        granularity
      );
      this.logger.log(`Portfolio snapshot also deleted for portfolio ${portfolioId} on ${snapshotDate.toISOString().split('T')[0]}`);
    } catch (error) {
      this.logger.warn(`Failed to delete portfolio snapshot: ${error.message}`);
      // Continue even if portfolio snapshot deletion fails
    }

    const message = `Successfully deleted ${deletedCount} snapshots for portfolio ${portfolioId} on ${snapshotDate.toISOString().split('T')[0]}${granularity ? ` with granularity ${granularity}` : ''}`;
    
    this.logger.log(message);
    return { deletedCount, message };
  }

  /**
   * Delete snapshots by portfolio and granularity (all dates)
   */
  async deleteSnapshotsByGranularity(
    portfolioId: string,
    granularity: SnapshotGranularity
  ): Promise<{ deletedCount: number; message: string }> {
    this.logger.log(`Deleting all ${granularity} snapshots for portfolio ${portfolioId}`);

    // Get all snapshots with this granularity first to count them
    const snapshots = await this.snapshotRepo.findMany({
      portfolioId,
      granularity,
    });

    const deletedCount = await this.snapshotRepo.deleteByPortfolioAndDateRange(
      portfolioId,
      new Date('1900-01-01'), // Very old date
      new Date('2100-12-31'), // Very future date
      granularity
    );

    // Also delete corresponding portfolio snapshots
    try {
      await this.portfolioSnapshotService.deleteByPortfolioAndGranularity(
        portfolioId,
        granularity
      );
      this.logger.log(`Portfolio snapshots also deleted for portfolio ${portfolioId} with granularity ${granularity}`);
    } catch (error) {
      this.logger.warn(`Failed to delete portfolio snapshots: ${error.message}`);
      // Continue even if portfolio snapshot deletion fails
    }

    const message = `Successfully deleted ${deletedCount} ${granularity} snapshots for portfolio ${portfolioId}`;
    
    this.logger.log(message);
    return { deletedCount, message };
  }

  /**
   * Create or update portfolio snapshot based on existing asset snapshots
   */
  private async createOrUpdatePortfolioSnapshot(
    portfolioId: string,
    snapshotDate: Date,
    granularity: SnapshotGranularity,
    createdBy?: string
  ): Promise<void> {
    try {
      // Check if portfolio snapshot already exists
      const existingPortfolioSnapshot = await this.portfolioSnapshotService.getLatestPortfolioSnapshot(
        portfolioId,
        granularity
      );

      if (existingPortfolioSnapshot && 
          existingPortfolioSnapshot.snapshotDate.toISOString().split('T')[0] === snapshotDate.toISOString().split('T')[0]) {
        // Portfolio snapshot already exists for this date, update it
        this.logger.log(`Updating existing portfolio snapshot for portfolio ${portfolioId} on ${snapshotDate.toISOString().split('T')[0]}`);
        await this.portfolioSnapshotService.createPortfolioSnapshotFromAssetSnapshots(
          portfolioId,
          snapshotDate,
          granularity,
          createdBy
        );
      } else {
        // Create new portfolio snapshot
        this.logger.log(`Creating new portfolio snapshot for portfolio ${portfolioId} on ${snapshotDate.toISOString().split('T')[0]}`);
        await this.portfolioSnapshotService.createPortfolioSnapshotFromAssetSnapshots(
          portfolioId,
          snapshotDate,
          granularity,
          createdBy
        );
      }
    } catch (error) {
      this.logger.error(`Error creating/updating portfolio snapshot for portfolio ${portfolioId}:`, error);
      throw error;
    }
  }
}
