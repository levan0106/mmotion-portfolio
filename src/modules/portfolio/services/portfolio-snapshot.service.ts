import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PortfolioSnapshot } from '../entities/portfolio-snapshot.entity';
import { PortfolioSnapshotRepository, PortfolioSnapshotQueryOptions, PortfolioSnapshotAggregationResult } from '../repositories/portfolio-snapshot.repository';
import { SnapshotGranularity } from '../enums/snapshot-granularity.enum';
import { AssetAllocationSnapshot } from '../entities/asset-allocation-snapshot.entity';
import { Portfolio } from '../entities/portfolio.entity';
import { CreatePortfolioSnapshotDto, UpdatePortfolioSnapshotDto } from '../dto/portfolio-snapshot.dto';


export interface PortfolioSnapshotTimelineQuery {
  portfolioId: string;
  startDate: Date;
  endDate: Date;
  granularity?: SnapshotGranularity;
}

@Injectable()
export class PortfolioSnapshotService {
  private readonly logger = new Logger(PortfolioSnapshotService.name);

  constructor(
    @InjectRepository(PortfolioSnapshot)
    private readonly portfolioSnapshotRepository: Repository<PortfolioSnapshot>,
    private readonly portfolioSnapshotRepo: PortfolioSnapshotRepository,
    @InjectRepository(AssetAllocationSnapshot)
    private readonly assetSnapshotRepository: Repository<AssetAllocationSnapshot>,
    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,
  ) {}

  /**
   * Create a new portfolio snapshot
   */
  async createPortfolioSnapshot(createDto: CreatePortfolioSnapshotDto): Promise<PortfolioSnapshot> {
    // Convert snapshotDate to Date if it's a string
    const snapshotDate = typeof createDto.snapshotDate === 'string' 
      ? new Date(createDto.snapshotDate) 
      : createDto.snapshotDate;
    
    this.logger.log(`Creating portfolio snapshot for portfolio ${createDto.portfolioId} on ${snapshotDate.toISOString().split('T')[0]}`);

    // Validate portfolio exists
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId: createDto.portfolioId }
    });
    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${createDto.portfolioId} not found`);
    }

    // Check if snapshot already exists
    const exists = await this.portfolioSnapshotRepo.exists(
      createDto.portfolioId,
      snapshotDate,
      createDto.granularity
    );

    if (exists) {
      throw new BadRequestException(
        `Portfolio snapshot already exists for portfolio ${createDto.portfolioId} on ${snapshotDate.toISOString().split('T')[0]} with granularity ${createDto.granularity}`
      );
    }

    // Create snapshot
    const snapshot = await this.portfolioSnapshotRepo.create({
      ...createDto,
      snapshotDate: snapshotDate,
      isActive: createDto.isActive ?? true,
    });

    this.logger.log(`Portfolio snapshot created successfully with ID ${snapshot.id}`);
    return snapshot;
  }

  /**
   * Create portfolio snapshot from asset snapshots
   */
  async createPortfolioSnapshotFromAssetSnapshots(
    portfolioId: string,
    snapshotDate: Date | string,
    granularity: SnapshotGranularity = SnapshotGranularity.DAILY,
    createdBy?: string
  ): Promise<PortfolioSnapshot> {
    // Convert snapshotDate to Date if it's a string
    const date = typeof snapshotDate === 'string' ? new Date(snapshotDate) : snapshotDate;
    
    this.logger.log(`Creating portfolio snapshot from asset snapshots for portfolio ${portfolioId} on ${date.toISOString().split('T')[0]}`);

    // Get portfolio info
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId }
    });
    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    // Get asset snapshots for this portfolio and date
    const assetSnapshots = await this.assetSnapshotRepository.find({
      where: {
        portfolioId,
        snapshotDate: date,
        granularity,
        isActive: true,
      },
    });

    if (assetSnapshots.length === 0) {
      throw new BadRequestException(`No asset snapshots found for portfolio ${portfolioId} on ${date.toISOString().split('T')[0]}`);
    }

    // Calculate portfolio-level metrics
    let totalValue = 0;
    let totalPl = 0;
    let unrealizedPl = 0;
    let realizedPl = 0;
    
    assetSnapshots.forEach(snapshot => {
      totalValue = Number((totalValue + Number(snapshot.currentValue || 0)).toFixed(8));
      totalPl = Number((totalPl + Number(snapshot.totalPl || 0)).toFixed(8));
      unrealizedPl = Number((unrealizedPl + Number(snapshot.unrealizedPl || 0)).toFixed(8));
      realizedPl = Number((realizedPl + Number(snapshot.realizedPl || 0)).toFixed(8));
    });
    
    // Simplified total return calculation to avoid precision issues
    // TODO: Implement this when we have historical data
    const totalReturn = 0; // Set to 0 for now to avoid SQL errors

    // Calculate asset allocation
    const assetAllocation: { [assetType: string]: { percentage: number; value: number; count: number } } = {};
    const assetTypeMap = new Map<string, { value: number; count: number }>();

    assetSnapshots.forEach(snapshot => {
      const assetType = this.getAssetTypeFromSymbol(snapshot.assetSymbol);
      if (!assetTypeMap.has(assetType)) {
        assetTypeMap.set(assetType, { value: 0, count: 0 });
      }
      const current = assetTypeMap.get(assetType)!;
      current.value = Number((current.value + Number(snapshot.currentValue || 0)).toFixed(8));
      current.count += 1;
    });

    // Convert to percentage
    assetTypeMap.forEach((data, assetType) => {
      assetAllocation[assetType] = {
        percentage: totalValue > 0 ? Number(((data.value / totalValue) * 100).toFixed(4)) : 0,
        value: Number(data.value.toFixed(8)),
        count: data.count,
      };
    });

    // Calculate risk metrics (simplified)
    const volatility = Number(this.calculateVolatility(assetSnapshots).toFixed(4));
    const maxDrawdown = Number(this.calculateMaxDrawdown(assetSnapshots).toFixed(4));

    // Get cash balance from portfolio (if available)
    const cashBalance = Number((Number(portfolio.cashBalance || 0)).toFixed(8));
    const investedValue = Number((totalValue - cashBalance).toFixed(8));

    // Calculate returns (simplified - would need historical data for accurate calculation)
    const dailyReturn = Number(this.calculateDailyReturn(assetSnapshots).toFixed(4));
    const weeklyReturn = Number((dailyReturn * 7).toFixed(4)); // Simplified
    const monthlyReturn = Number((dailyReturn * 30).toFixed(4)); // Simplified
    const ytdReturn = Number(this.calculateYtdReturn(assetSnapshots).toFixed(4));

    // Debug logging
    console.log('Portfolio Snapshot Debug:', {
      totalValue,
      totalPl,
      totalReturn,
      cashBalance,
      investedValue,
      dailyReturn,
      weeklyReturn,
      monthlyReturn,
      ytdReturn,
      volatility,
      maxDrawdown,
      assetAllocation: JSON.stringify(assetAllocation, null, 2)
    });

    const createDto: CreatePortfolioSnapshotDto = {
      portfolioId,
      portfolioName: portfolio.name,
      snapshotDate: date.toISOString().split('T')[0],
      granularity,
      totalValue,
      totalPl,
      unrealizedPl,
      realizedPl,
      totalReturn,
      cashBalance,
      investedValue,
      dailyReturn,
      weeklyReturn,
      monthlyReturn,
      ytdReturn,
      volatility,
      maxDrawdown,
      assetAllocation,
      assetCount: assetSnapshots.length,
      activeAssetCount: assetSnapshots.filter(s => s.isActive).length,
      createdBy,
      notes: `Portfolio snapshot created from ${assetSnapshots.length} asset snapshots`,
    };

    // Delete existing portfolio snapshots for the same date first
    // This ensures we only have one portfolio snapshot per day per portfolio
    const deletedCount = await this.portfolioSnapshotRepo.deleteByPortfolioDateAndGranularity(
      portfolioId, 
      date, 
      granularity
    );
    
    // Create new snapshot
    return await this.createPortfolioSnapshot(createDto);
  }

  /**
   * Get portfolio snapshot by ID
   */
  async getPortfolioSnapshotById(id: string): Promise<PortfolioSnapshot> {
    const snapshot = await this.portfolioSnapshotRepo.findById(id);
    if (!snapshot) {
      throw new NotFoundException(`Portfolio snapshot with ID ${id} not found`);
    }
    return snapshot;
  }

  /**
   * Get portfolio snapshots with query options
   */
  async getPortfolioSnapshots(options: PortfolioSnapshotQueryOptions): Promise<PortfolioSnapshot[]> {
    return await this.portfolioSnapshotRepo.findMany(options);
  }

  /**
   * Get portfolio snapshots with pagination
   */
  async getPortfolioSnapshotsWithPagination(options: PortfolioSnapshotQueryOptions) {
    return await this.portfolioSnapshotRepo.findManyWithPagination(options);
  }

  /**
   * Get timeline data for portfolio
   */
  async getPortfolioSnapshotTimeline(query: PortfolioSnapshotTimelineQuery): Promise<PortfolioSnapshot[]> {
    this.logger.log(`Getting portfolio snapshot timeline for portfolio ${query.portfolioId} from ${query.startDate.toISOString().split('T')[0]} to ${query.endDate.toISOString().split('T')[0]}`);

    const options: PortfolioSnapshotQueryOptions = {
      portfolioId: query.portfolioId,
      startDate: query.startDate,
      endDate: query.endDate,
      granularity: query.granularity || SnapshotGranularity.DAILY,
      isActive: true,
      orderBy: 'snapshot.snapshotDate',
      orderDirection: 'ASC',
    };

    return await this.portfolioSnapshotRepo.findMany(options);
  }

  /**
   * Get aggregated timeline data
   */
  async getAggregatedPortfolioSnapshotTimeline(
    portfolioId: string,
    startDate: Date,
    endDate: Date,
    granularity: SnapshotGranularity = SnapshotGranularity.DAILY
  ): Promise<PortfolioSnapshotAggregationResult[]> {
    this.logger.log(`Getting aggregated portfolio snapshot timeline for portfolio ${portfolioId}`);

    return await this.portfolioSnapshotRepo.findAggregatedByDate(portfolioId, startDate, endDate, granularity);
  }

  /**
   * Get latest portfolio snapshot
   */
  async getLatestPortfolioSnapshot(
    portfolioId: string,
    granularity?: SnapshotGranularity
  ): Promise<PortfolioSnapshot | null> {
    return await this.portfolioSnapshotRepo.findLatest(portfolioId, granularity);
  }

  /**
   * Get portfolios that have snapshots
   */
  async getPortfoliosWithSnapshots(): Promise<Array<{ portfolioId: string; portfolioName: string; snapshotCount: number; latestSnapshotDate: Date; oldestSnapshotDate: Date }>> {
    this.logger.log('Getting portfolios with portfolio snapshots');
    
    return await this.portfolioSnapshotRepo.findPortfoliosWithSnapshots();
  }

  /**
   * Update portfolio snapshot
   */
  async updatePortfolioSnapshot(id: string, updateDto: UpdatePortfolioSnapshotDto): Promise<PortfolioSnapshot> {
    this.logger.log(`Updating portfolio snapshot ${id}`);

    const snapshot = await this.getPortfolioSnapshotById(id);
    
    // Recalculate derived fields if needed
    if (updateDto.totalValue !== undefined && updateDto.totalPl !== undefined) {
      updateDto.totalReturn = updateDto.totalValue > 0 ? (updateDto.totalPl / (updateDto.totalValue - updateDto.totalPl)) * 100 : 0;
    }

    const updatedSnapshot = await this.portfolioSnapshotRepo.update(id, updateDto);
    if (!updatedSnapshot) {
      throw new NotFoundException(`Portfolio snapshot with ID ${id} not found`);
    }

    this.logger.log(`Portfolio snapshot ${id} updated successfully`);
    return updatedSnapshot;
  }

  /**
   * Soft delete portfolio snapshot
   */
  async deletePortfolioSnapshot(id: string): Promise<boolean> {
    this.logger.log(`Soft deleting portfolio snapshot ${id}`);

    const success = await this.portfolioSnapshotRepo.softDelete(id);
    if (!success) {
      throw new NotFoundException(`Portfolio snapshot with ID ${id} not found`);
    }

    this.logger.log(`Portfolio snapshot ${id} soft deleted successfully`);
    return true;
  }

  /**
   * Hard delete portfolio snapshot
   */
  async hardDeletePortfolioSnapshot(id: string): Promise<boolean> {
    this.logger.log(`Hard deleting portfolio snapshot ${id}`);

    const success = await this.portfolioSnapshotRepo.delete(id);
    if (!success) {
      throw new NotFoundException(`Portfolio snapshot with ID ${id} not found`);
    }

    this.logger.log(`Portfolio snapshot ${id} hard deleted successfully`);
    return true;
  }

  /**
   * Get portfolio snapshot statistics
   */
  async getPortfolioSnapshotStatistics(portfolioId: string) {
    return await this.portfolioSnapshotRepo.getStatistics(portfolioId);
  }

  /**
   * Delete portfolio snapshots by date range
   */
  async deletePortfolioSnapshotsByDateRange(
    portfolioId: string,
    startDate: Date,
    endDate: Date,
    granularity?: SnapshotGranularity
  ): Promise<{ deletedCount: number; message: string }> {
    this.logger.log(`Deleting portfolio snapshots for portfolio ${portfolioId} from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}${granularity ? ` with granularity ${granularity}` : ''}`);

    const deletedCount = await this.portfolioSnapshotRepo.deleteByPortfolioAndDateRange(
      portfolioId,
      startDate,
      endDate,
      granularity
    );

    const message = `Successfully deleted ${deletedCount} portfolio snapshots for portfolio ${portfolioId} from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}${granularity ? ` with granularity ${granularity}` : ''}`;
    
    this.logger.log(message);
    return { deletedCount, message };
  }

  /**
   * Delete portfolio snapshot by portfolio and specific date
   */
  async deleteByPortfolioAndDate(
    portfolioId: string,
    snapshotDate: Date,
    granularity?: SnapshotGranularity
  ): Promise<{ deletedCount: number; message: string }> {
    this.logger.log(`Deleting portfolio snapshot for portfolio ${portfolioId} on ${snapshotDate.toISOString().split('T')[0]}${granularity ? ` with granularity ${granularity}` : ''}`);

    const deletedCount = await this.portfolioSnapshotRepo.deleteByPortfolioAndDate(
      portfolioId,
      snapshotDate,
      granularity
    );

    const message = `Successfully deleted ${deletedCount} portfolio snapshot for portfolio ${portfolioId} on ${snapshotDate.toISOString().split('T')[0]}${granularity ? ` with granularity ${granularity}` : ''}`;
    
    this.logger.log(message);
    return { deletedCount, message };
  }

  /**
   * Delete portfolio snapshots by portfolio and granularity
   */
  async deleteByPortfolioAndGranularity(
    portfolioId: string,
    granularity: SnapshotGranularity
  ): Promise<{ deletedCount: number; message: string }> {
    this.logger.log(`Deleting all ${granularity} portfolio snapshots for portfolio ${portfolioId}`);

    const deletedCount = await this.portfolioSnapshotRepo.deleteByPortfolioAndGranularity(
      portfolioId,
      granularity
    );

    const message = `Successfully deleted ${deletedCount} ${granularity} portfolio snapshots for portfolio ${portfolioId}`;
    
    this.logger.log(message);
    return { deletedCount, message };
  }

  /**
   * Helper method to get asset type from symbol (simplified)
   */
  private getAssetTypeFromSymbol(symbol: string): string {
    // This is a simplified mapping - in real implementation, you'd query the asset table
    const cryptoPattern = /^(BTC|ETH|ADA|DOT|LINK|UNI|AAVE|COMP|MKR|SNX|YFI|SUSHI|CRV|1INCH|ALPHA|BAND|REN|KNC|LRC|ZRX|BAT|ZEC|XRP|LTC|BCH|EOS|TRX|XLM|NEO|IOTA|VET|ICX|ONT|QTUM|ZIL|OMG|REP|GNT|FUN|SNT|MCO|STORJ|DASH|DOGE|DGB|SC|PIVX|NAV|MONA|DCR|DGB|SC|PIVX|NAV|MONA|DCR)$/i;
    const stockPattern = /^[A-Z]{1,5}$/;
    
    if (cryptoPattern.test(symbol)) {
      return 'Crypto';
    } else if (stockPattern.test(symbol)) {
      return 'Stock';
    } else {
      return 'Other';
    }
  }

  /**
   * Calculate volatility (simplified)
   */
  private calculateVolatility(snapshots: AssetAllocationSnapshot[]): number {
    if (snapshots.length < 2) return 0;
    
    const returns = snapshots.map(s => s.returnPercentage);
    let mean = 0;
    returns.forEach(r => {
      mean = Number((mean + Number(r || 0)).toFixed(8));
    });
    mean = Number((mean / returns.length).toFixed(8));
    
    let variance = 0;
    returns.forEach(r => {
      variance = Number((variance + Math.pow(Number(r || 0) - mean, 2)).toFixed(8));
    });
    variance = Number((variance / returns.length).toFixed(8));
    
    return Number(Math.sqrt(variance).toFixed(8));
  }

  /**
   * Calculate max drawdown (simplified)
   */
  private calculateMaxDrawdown(snapshots: AssetAllocationSnapshot[]): number {
    if (snapshots.length < 2) return 0;
    
    const values = snapshots.map(s => s.currentValue);
    let maxDrawdown = 0;
    let peak = values[0];
    
    for (let i = 1; i < values.length; i++) {
      if (values[i] > peak) {
        peak = values[i];
      } else {
        const drawdown = Number(((peak - values[i]) / peak * 100).toFixed(8));
        maxDrawdown = Number(Math.max(maxDrawdown, drawdown).toFixed(8));
      }
    }
    
    return Number(maxDrawdown.toFixed(8));
  }

  /**
   * Calculate daily return (simplified)
   */
  private calculateDailyReturn(snapshots: AssetAllocationSnapshot[]): number {
    if (snapshots.length === 0) return 0;
    
    let totalReturn = 0;
    snapshots.forEach(s => {
      totalReturn = Number((totalReturn + Number(s.returnPercentage || 0)).toFixed(8));
    });
    return Number((totalReturn / snapshots.length).toFixed(8));
  }

  /**
   * Calculate YTD return (simplified)
   */
  private calculateYtdReturn(snapshots: AssetAllocationSnapshot[]): number {
    if (snapshots.length === 0) return 0;
    
    const currentYear = new Date().getFullYear();
    const ytdSnapshots = snapshots.filter(s => 
      new Date(s.snapshotDate).getFullYear() === currentYear
    );
    
    if (ytdSnapshots.length === 0) return 0;
    
    let totalReturn = 0;
    ytdSnapshots.forEach(s => {
      totalReturn = Number((totalReturn + Number(s.returnPercentage || 0)).toFixed(8));
    });
    return Number((totalReturn / ytdSnapshots.length).toFixed(8));
  }

  /**
   * Delete portfolio snapshots by portfolio, date, and granularity
   * This is used to ensure only one portfolio snapshot per day per portfolio
   */
  async deleteByPortfolioDateAndGranularity(
    portfolioId: string,
    snapshotDate: Date,
    granularity: SnapshotGranularity
  ): Promise<number> {
    return await this.portfolioSnapshotRepo.deleteByPortfolioDateAndGranularity(
      portfolioId,
      snapshotDate,
      granularity
    );
  }
}
