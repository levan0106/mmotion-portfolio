import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PortfolioSnapshot } from '../entities/portfolio-snapshot.entity';
import { PortfolioSnapshotRepository, PortfolioSnapshotQueryOptions, PortfolioSnapshotAggregationResult } from '../repositories/portfolio-snapshot.repository';
import { SnapshotGranularity } from '../enums/snapshot-granularity.enum';
import { AssetAllocationSnapshot } from '../entities/asset-allocation-snapshot.entity';
import { Portfolio } from '../entities/portfolio.entity';
import { CreatePortfolioSnapshotDto, UpdatePortfolioSnapshotDto } from '../dto/portfolio-snapshot.dto';
import { DepositCalculationService } from '../../shared/services/deposit-calculation.service';


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
    private readonly depositCalculationService: DepositCalculationService,
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
    let totalAssetValue = 0;
    let totalAssetPl = 0;
    let unrealizedAssetPl = 0;
    let realizedAssetPl = 0;
    
    assetSnapshots.forEach(snapshot => {
      totalAssetValue = Number((totalAssetValue + Number(snapshot.currentValue || 0)).toFixed(8));
      totalAssetPl = Number((totalAssetPl + Number(snapshot.totalPl || 0)).toFixed(8));
      unrealizedAssetPl = Number((unrealizedAssetPl + Number(snapshot.unrealizedPl || 0)).toFixed(8));
      realizedAssetPl = Number((realizedAssetPl + Number(snapshot.realizedPl || 0)).toFixed(8));
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
        percentage: totalAssetValue > 0 ? Number(((data.value / totalAssetValue) * 100).toFixed(4)) : 0,
        value: Number(data.value.toFixed(8)),
        count: data.count,
      };
    });

    // Calculate Asset Risk Metrics (Assets Only)
    const assetVolatility = Number(this.calculateVolatility(assetSnapshots).toFixed(4));
    const assetMaxDrawdown = Number(this.calculateMaxDrawdown(assetSnapshots).toFixed(4));

    // Get cash balance from portfolio (if available)
    const cashBalance = Number((Number(portfolio.cashBalance || 0)).toFixed(8));
    const totalAssetInvested = Number((totalAssetValue - cashBalance).toFixed(8));

    // Calculate deposit data
    const depositData = await this.depositCalculationService.calculateDepositData(portfolioId);

    // Calculate Portfolio Value Fields (Assets + Deposits)
    const totalPortfolioValue = Number((totalAssetValue + depositData.totalDepositValue).toFixed(8));
    const totalPortfolioInvested = Number((totalAssetInvested + depositData.totalDepositPrincipal).toFixed(8));

    // Calculate Portfolio P&L (Assets + Deposits)
    const totalPortfolioPl = Number((totalAssetPl + depositData.totalDepositInterest).toFixed(8));
    const unrealizedPortfolioPl = Number((unrealizedAssetPl + depositData.unrealizedDepositPnL).toFixed(8));
    const realizedPortfolioPl = Number((realizedAssetPl + depositData.realizedDepositPnL).toFixed(8));

    // Calculate Asset Performance Metrics (Assets Only)
    const assetDailyReturn = Number(this.calculateDailyReturn(assetSnapshots).toFixed(4));
    const assetWeeklyReturn = Number((assetDailyReturn * 7).toFixed(4)); // Simplified
    const assetMonthlyReturn = 0; // TODO: Implement proper monthly return calculation
    const assetYtdReturn = Number(this.calculateYtdReturn(assetSnapshots).toFixed(4));

    // Calculate Portfolio Performance Metrics (Assets + Deposits)
    const portfolioDailyReturn = Number(this.calculatePortfolioDailyReturn(
      totalPortfolioValue, 
      totalAssetValue, 
      assetDailyReturn, 
      depositData.totalDepositValue,
      depositData.totalDepositInterest
    ).toFixed(4));
    
    const portfolioWeeklyReturn = Number((portfolioDailyReturn * 7).toFixed(4)); // Simplified
    const portfolioMonthlyReturn = 0; // TODO: Implement proper monthly return calculation
    const portfolioYtdReturn = Number(this.calculatePortfolioYtdReturn(
      totalPortfolioValue,
      totalAssetValue,
      assetYtdReturn,
      depositData.totalDepositValue,
      depositData.totalDepositInterest
    ).toFixed(4));

    // Calculate Portfolio Risk Metrics (Assets + Deposits)
    const portfolioVolatility = Number(this.calculatePortfolioVolatility(
      totalPortfolioValue,
      totalAssetValue,
      assetVolatility,
      depositData.totalDepositValue
    ).toFixed(4));
    
    const portfolioMaxDrawdown = Number(this.calculatePortfolioMaxDrawdown(
      totalPortfolioValue,
      totalAssetValue,
      assetMaxDrawdown,
      depositData.totalDepositValue
    ).toFixed(4));

    // Legacy fields for backward compatibility
    const dailyReturn = assetDailyReturn;
    const weeklyReturn = assetWeeklyReturn;
    const monthlyReturn = assetMonthlyReturn;
    const ytdReturn = assetYtdReturn;
    const volatility = assetVolatility;
    const maxDrawdown = assetMaxDrawdown;

    // Debug logging
    console.log('Portfolio Snapshot Debug:', {
      totalAssetValue,
      totalAssetInvested,
      totalPortfolioValue,
      totalPortfolioInvested,
      totalAssetPl,
      unrealizedAssetPl,
      realizedAssetPl,
      totalPortfolioPl,
      unrealizedPortfolioPl,
      realizedPortfolioPl,
      totalReturn,
      cashBalance,
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
      // Asset Value Fields (Assets Only)
      totalAssetValue,
      totalAssetInvested,
      // Asset P&L Fields (Assets Only)
      totalAssetPl,
      unrealizedAssetPl,
      realizedAssetPl,
      // Portfolio Value Fields (Assets + Deposits)
      totalPortfolioValue,
      totalPortfolioInvested,
      // Portfolio P&L Fields (Assets + Deposits)
      totalPortfolioPl,
      unrealizedPortfolioPl,
      realizedPortfolioPl,
      totalReturn,
      cashBalance,
      // Asset Performance Metrics (Assets Only)
      assetDailyReturn,
      assetWeeklyReturn,
      assetMonthlyReturn,
      assetYtdReturn,
      // Asset Risk Metrics (Assets Only)
      assetVolatility,
      assetMaxDrawdown,
      // Portfolio Performance Metrics (Assets + Deposits)
      portfolioDailyReturn,
      portfolioWeeklyReturn,
      portfolioMonthlyReturn,
      portfolioYtdReturn,
      // Portfolio Risk Metrics (Assets + Deposits)
      portfolioVolatility,
      portfolioMaxDrawdown,
      // Legacy fields for backward compatibility
      dailyReturn,
      weeklyReturn,
      monthlyReturn,
      ytdReturn,
      volatility,
      maxDrawdown,
      assetAllocation,
      assetCount: assetSnapshots.length,
      activeAssetCount: assetSnapshots.filter(s => s.isActive).length,
      totalDepositPrincipal: depositData.totalDepositPrincipal,
      totalDepositInterest: depositData.totalDepositInterest,
      totalDepositValue: depositData.totalDepositValue,
      totalDepositCount: depositData.totalDepositCount,
      unrealizedDepositPnL: depositData.unrealizedDepositPnL,
      realizedDepositPnL: depositData.realizedDepositPnL,
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
   * Update deposit fields in portfolio snapshot
   */
  async updateDepositFields(portfolioId: string, depositData?: {
    totalDepositPrincipal: number;
    totalDepositInterest: number;
    totalDepositValue: number;
    totalDepositCount: number;
    unrealizedDepositPnL: number;
    realizedDepositPnL: number;
  }): Promise<void> {
    this.logger.log(`Updating deposit fields for portfolio ${portfolioId}`);

    // If no deposit data provided, calculate it
    if (!depositData) {
      depositData = await this.depositCalculationService.calculateDepositData(portfolioId);
    }

    // Get the latest snapshot for the portfolio
    const latestSnapshot = await this.portfolioSnapshotRepository.findOne({
      where: { portfolioId },
      order: { snapshotDate: 'DESC' }
    });

    if (latestSnapshot) {
      // Update the latest snapshot
      latestSnapshot.totalDepositPrincipal = depositData.totalDepositPrincipal;
      latestSnapshot.totalDepositInterest = depositData.totalDepositInterest;
      latestSnapshot.totalDepositValue = depositData.totalDepositValue;
      latestSnapshot.totalDepositCount = depositData.totalDepositCount;
      latestSnapshot.unrealizedDepositPnL = depositData.unrealizedDepositPnL;
      latestSnapshot.realizedDepositPnL = depositData.realizedDepositPnL;

      // Recalculate Portfolio Value Fields (Assets + Deposits)
      latestSnapshot.totalPortfolioValue = Number((latestSnapshot.totalAssetValue + depositData.totalDepositValue).toFixed(8));
      latestSnapshot.totalPortfolioInvested = Number((latestSnapshot.totalAssetInvested + depositData.totalDepositPrincipal).toFixed(8));

      // Recalculate Portfolio P&L Fields (Assets + Deposits)
      latestSnapshot.totalPortfolioPl = Number((latestSnapshot.totalAssetPl + depositData.totalDepositInterest).toFixed(8));
      latestSnapshot.unrealizedPortfolioPl = Number((latestSnapshot.unrealizedAssetPl + depositData.unrealizedDepositPnL).toFixed(8));
      latestSnapshot.realizedPortfolioPl = Number((latestSnapshot.realizedAssetPl + depositData.realizedDepositPnL).toFixed(8));

      await this.portfolioSnapshotRepository.save(latestSnapshot);
      this.logger.log(`Updated deposit fields in latest snapshot for portfolio ${portfolioId}`);
    } else {
      this.logger.warn(`No snapshot found for portfolio ${portfolioId}, creating new one`);
      
      // Create a new snapshot with deposit data
      const portfolio = await this.portfolioRepository.findOne({
        where: { portfolioId }
      });

      if (portfolio) {
        const newSnapshot = this.portfolioSnapshotRepository.create({
          portfolioId,
          portfolioName: portfolio.name,
          snapshotDate: new Date(),
          granularity: SnapshotGranularity.DAILY,
          totalAssetValue: portfolio.totalValue,
          totalAssetInvested: portfolio.totalValue - (portfolio.cashBalance || 0),
          // Asset P&L Fields (Assets Only)
          totalAssetPl: portfolio.unrealizedPl + portfolio.realizedPl,
          unrealizedAssetPl: portfolio.unrealizedPl,
          realizedAssetPl: portfolio.realizedPl,
          // Portfolio Value Fields (Assets + Deposits)
          totalPortfolioValue: portfolio.totalValue + depositData.totalDepositValue,
          totalPortfolioInvested: (portfolio.totalValue - portfolio.cashBalance) + depositData.totalDepositPrincipal,
          // Portfolio P&L Fields (Assets + Deposits)
          totalPortfolioPl: (portfolio.unrealizedPl + portfolio.realizedPl) + depositData.totalDepositInterest,
          unrealizedPortfolioPl: portfolio.unrealizedPl + depositData.unrealizedDepositPnL,
          realizedPortfolioPl: portfolio.realizedPl + depositData.realizedDepositPnL,
          cashBalance: portfolio.cashBalance,
          totalDepositPrincipal: depositData.totalDepositPrincipal,
          totalDepositInterest: depositData.totalDepositInterest,
          totalDepositValue: depositData.totalDepositValue,
          totalDepositCount: depositData.totalDepositCount,
          unrealizedDepositPnL: depositData.unrealizedDepositPnL,
          realizedDepositPnL: depositData.realizedDepositPnL,
          isActive: true,
        });

        await this.portfolioSnapshotRepository.save(newSnapshot);
        this.logger.log(`Created new snapshot with deposit data for portfolio ${portfolioId}`);
      }
    }
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
    if (updateDto.totalAssetValue !== undefined && updateDto.totalAssetPl !== undefined) {
      updateDto.totalReturn = updateDto.totalAssetValue > 0 ? (updateDto.totalAssetPl / (updateDto.totalAssetValue - updateDto.totalAssetPl)) * 100 : 0;
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
   * Calculate Portfolio Daily Return (Assets + Deposits)
   * Uses weighted average based on asset and deposit values
   */
  private calculatePortfolioDailyReturn(
    totalPortfolioValue: number,
    totalAssetValue: number,
    assetDailyReturn: number,
    totalDepositValue: number,
    totalDepositInterest: number
  ): number {
    if (totalPortfolioValue === 0) return 0;
    
    const assetWeight = totalAssetValue / totalPortfolioValue;
    const depositWeight = totalDepositValue / totalPortfolioValue;
    
    // Assume deposits have 0% daily return (fixed interest)
    const depositDailyReturn = 0;
    
    return Number((assetDailyReturn * assetWeight + depositDailyReturn * depositWeight).toFixed(8));
  }

  /**
   * Calculate Portfolio YTD Return (Assets + Deposits)
   * Uses weighted average based on asset and deposit values
   */
  private calculatePortfolioYtdReturn(
    totalPortfolioValue: number,
    totalAssetValue: number,
    assetYtdReturn: number,
    totalDepositValue: number,
    totalDepositInterest: number
  ): number {
    if (totalPortfolioValue === 0) return 0;
    
    const assetWeight = totalAssetValue / totalPortfolioValue;
    const depositWeight = totalDepositValue / totalPortfolioValue;
    
    // Calculate deposit YTD return based on interest earned
    const depositYtdReturn = totalDepositValue > 0 ? (totalDepositInterest / totalDepositValue) * 100 : 0;
    
    return Number((assetYtdReturn * assetWeight + depositYtdReturn * depositWeight).toFixed(8));
  }

  /**
   * Calculate Portfolio Volatility (Assets + Deposits)
   * Deposits have 0 volatility, so portfolio volatility is reduced
   */
  private calculatePortfolioVolatility(
    totalPortfolioValue: number,
    totalAssetValue: number,
    assetVolatility: number,
    totalDepositValue: number
  ): number {
    if (totalPortfolioValue === 0) return 0;
    
    const assetWeight = totalAssetValue / totalPortfolioValue;
    const depositWeight = totalDepositValue / totalPortfolioValue;
    
    // Deposits have 0% volatility (fixed interest)
    const depositVolatility = 0;
    
    return Number((assetVolatility * assetWeight + depositVolatility * depositWeight).toFixed(8));
  }

  /**
   * Calculate Portfolio Max Drawdown (Assets + Deposits)
   * Deposits have 0 drawdown, so portfolio drawdown is reduced
   */
  private calculatePortfolioMaxDrawdown(
    totalPortfolioValue: number,
    totalAssetValue: number,
    assetMaxDrawdown: number,
    totalDepositValue: number
  ): number {
    if (totalPortfolioValue === 0) return 0;
    
    const assetWeight = totalAssetValue / totalPortfolioValue;
    const depositWeight = totalDepositValue / totalPortfolioValue;
    
    // Deposits have 0% max drawdown (guaranteed return)
    const depositMaxDrawdown = 0;
    
    return Number((assetMaxDrawdown * assetWeight + depositMaxDrawdown * depositWeight).toFixed(8));
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
