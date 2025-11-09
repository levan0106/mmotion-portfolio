import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThanOrEqual, LessThan, Between } from 'typeorm';
import { PortfolioSnapshot } from '../entities/portfolio-snapshot.entity';
import { PortfolioSnapshotRepository, PortfolioSnapshotQueryOptions, PortfolioSnapshotAggregationResult } from '../repositories/portfolio-snapshot.repository';
import { SnapshotGranularity } from '../enums/snapshot-granularity.enum';
import { AssetAllocationSnapshot } from '../entities/asset-allocation-snapshot.entity';
import { Portfolio } from '../entities/portfolio.entity';
import { CreatePortfolioSnapshotDto, UpdatePortfolioSnapshotDto } from '../dto/portfolio-snapshot.dto';
import { DepositCalculationService } from '../../shared/services/deposit-calculation.service';
import { CashFlowService } from './cash-flow.service';
import { InvestorHoldingService } from './investor-holding.service';
import { normalizeDateToString } from '../utils/date-normalization.util';


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
    private readonly cashFlowService: CashFlowService,
    private readonly investorHoldingService: InvestorHoldingService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create a new portfolio snapshot
   */
  async savePortfolioSnapshotToDB(createDto: CreatePortfolioSnapshotDto): Promise<PortfolioSnapshot> {
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

    // Delete existing portfolio snapshots for the same date first to avoid duplicates
    // This ensures we only have one portfolio snapshot per day per portfolio
    this.logger.log(`🔍 About to delete existing portfolio snapshots for portfolio ${createDto.portfolioId} on ${snapshotDate.toISOString().split('T')[0]} with granularity ${createDto.granularity}`);
    
    // Try to delete all existing snapshots for this portfolio and date
    // Use deleteByPortfolioAndDateRange to delete all snapshots for the date
    const startDate = new Date(snapshotDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(snapshotDate);
    endDate.setHours(23, 59, 59, 999);
    
    const deletedCount = await this.portfolioSnapshotRepo.deleteByPortfolioAndDateRange(
      createDto.portfolioId, 
      startDate, 
      endDate, 
      createDto.granularity
    );
    
    this.logger.log(`🗑️ Delete operation completed. Deleted ${deletedCount} existing portfolio snapshots for portfolio ${createDto.portfolioId} on ${snapshotDate.toISOString().split('T')[0]}`);


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
   * Các metrics được tính toán ở bên ngoài service khác. Metrics trong method này không được sử dụng vì cách tính chưa chính xác.
   * @param portfolioId 
   * @param snapshotDate 
   * @param granularity 
   * @param createdBy 
   * @returns
   * PortfolioSnapshot
   */
  async createPortfolioSnapshotWithoutMetrics(
    portfolioId: string,
    snapshotDate: Date,
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

    // Calculate cash balance and deposit data (common for both scenarios)
    const cashBalance = await this.cashFlowService.getCashBalance(portfolioId, date);
    const depositData = await this.depositCalculationService.calculateDepositDataByPortfolioId(portfolioId, date);
    
    this.logger.debug(`Recalculating NAV per unit for portfolio ${portfolioId}`);
    // To get real-time data for fund management, we need to recalculate the following fields:

    // 0. recalculate number of outstanding units
    const newTotalOutstandingUnits = await this.investorHoldingService.updateTotalOutstandingUnits(portfolioId, date); // calculate and update totalOutstandingUnits to DB for daily snapshot

    // 1. Update Portfolio NAV per unit
    // Recalculate NAV per unit
    const newNavPerUnit = await this.investorHoldingService.updatePortfolioNavPerUnit(portfolioId, date); // calculate and update navPerUnit to DB for daily snapshot

    // 2. Update Portfolio numberOfInvestors
    // Recalculate number of investors
    const newNumberOfInvestors = await this.investorHoldingService.updatePortfolioNumberOfInvestors(portfolioId, date); // calculate and update numberOfInvestors to DB for daily snapshot
    

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
      this.logger.warn(`No asset snapshots found for portfolio ${portfolioId} on ${date.toISOString().split('T')[0]}. 
      Creating portfolio snapshot with zero asset values but calculating cash ${cashBalance} and deposits ${depositData.totalDepositValue}.`);
      
      // Calculate portfolio values with cash and deposits only
      const totalPortfolioValue = Number((depositData.totalDepositValue + cashBalance).toFixed(8));
      const totalPortfolioInvested = Number((depositData.totalDepositPrincipal).toFixed(8));
      const totalPortfolioPl = Number((depositData.totalDepositInterest).toFixed(8));
      const unrealizedPortfolioPl = Number((depositData.unrealizedDepositPnL).toFixed(8));
      const realizedPortfolioPl = Number((depositData.realizedDepositPnL).toFixed(8));
      
      // Create portfolio snapshot with zero asset values but real cash and deposit values
      const portfolioSnapshotDto:CreatePortfolioSnapshotDto = {
        portfolioId,
        portfolioName: portfolio.name,
        snapshotDate: date.toISOString().split('T')[0],
        granularity,
        // Asset values (zero)
        totalAssetValue: 0,
        totalAssetInvested: 0,
        totalAssetPl: 0,
        unrealizedAssetPl: 0,
        realizedAssetPl: 0,
        // Portfolio values (cash + deposits)
        totalPortfolioPl,
        unrealizedPortfolioPl,
        realizedPortfolioPl,
        totalReturn: 0,
        cashBalance,
        totalPortfolioValue,
        totalPortfolioInvested,
        // Deposit data
        totalDepositPrincipal: depositData.totalDepositPrincipal,
        totalDepositInterest: depositData.totalDepositInterest,
        totalDepositValue: depositData.totalDepositValue,
        totalDepositCount: depositData.totalDepositCount,
        totalOutstandingUnits: newTotalOutstandingUnits || 0,
        navPerUnit: newNavPerUnit || 0, // only use portfolio.navPerUnit for daily snapshot because it's already calculated in the portfolio service
        numberOfInvestors: newNumberOfInvestors || 0,
        isFund: portfolio.isFund || false,
        unrealizedDepositPnL: depositData.unrealizedDepositPnL,
        realizedDepositPnL: depositData.realizedDepositPnL,
        // Essential Return Fields
        dailyReturn: 0,
        weeklyReturn: 0,
        monthlyReturn: 0,
        ytdReturn: 0,
        assetAllocation: {},
        assetCount: 0,
        activeAssetCount: 0,
        isActive: true,
        createdBy,
        notes: `Portfolio snapshot with no assets but cash balance ${cashBalance} and deposits ${depositData.totalDepositValue} for ${date.toISOString().split('T')[0]}`,
      };

      // Save portfolio snapshot to DB
      return await this.savePortfolioSnapshotToDB(portfolioSnapshotDto);
    }

    // Calculate portfolio-level metrics
    let totalAssetValue = 0;
    let totalAssetPl = 0;
    let unrealizedAssetPl = 0;
    let realizedAssetPl = 0;
    
    // this.logger.debug('calculate portfolio-level metrics', { assetSnapshots });

    assetSnapshots.forEach(snapshot => {
      totalAssetValue = Number((totalAssetValue + Number(snapshot.currentValue || 0)).toFixed(8));
      totalAssetPl = Number((totalAssetPl + Number(snapshot.totalPl || 0)).toFixed(8));
      unrealizedAssetPl = Number((unrealizedAssetPl + Number(snapshot.unrealizedPl || 0)).toFixed(8));
      realizedAssetPl = Number((realizedAssetPl + Number(snapshot.realizedPl || 0)).toFixed(8));
    });
    
    // Calculate asset allocation from asset snapshots
    const assetAllocation: { [assetType: string]: { percentage: number; value: number; count: number } } = {};
    const assetTypeMap = new Map<string, { value: number; count: number }>();

    // Calculate grouped asset value and count from asset snapshots
    assetSnapshots.forEach(snapshot => {
      const assetType = snapshot.assetType;
      if (!assetTypeMap.has(assetType)) {
        assetTypeMap.set(assetType, { value: 0, count: 0 });
      }
      const current = assetTypeMap.get(assetType)!;
      current.value = Number((current.value + Number(snapshot.currentValue || 0)).toFixed(8));
      current.count += 1;
    });

    // Convert to percentage from grouped asset value and count
    assetTypeMap.forEach((data, assetType) => {
      assetAllocation[assetType] = {
        percentage: totalAssetValue > 0 ? Number(((data.value / totalAssetValue) * 100).toFixed(4)) : 0,
        value: Number(data.value.toFixed(8)),
        count: data.count,
      };
    });
    
    // get fund management metrics
    const totalOutstandingUnits = Number((Number(portfolio.totalOutstandingUnits || 0)).toFixed(8));
    const navPerUnit = Number((Number(newNavPerUnit || 0)).toFixed(8));
    const numberOfInvestors = Number((Number(newNumberOfInvestors || 0)).toFixed(8));
    const isFund = Boolean(portfolio.isFund || false);

    // FIXED: Total asset invested should be total asset value, not total asset value minus cash
    // Cash balance is part of the portfolio, not a deduction from investment
    const totalAssetInvested = Number(totalAssetValue.toFixed(8));

    // Calculate Portfolio Value Fields (Assets + Deposits + Cash)
    const totalPortfolioValue = Number((totalAssetValue + depositData.totalDepositValue + cashBalance).toFixed(8));
    const totalPortfolioInvested = Number((totalAssetInvested + depositData.totalDepositPrincipal).toFixed(8));

    // Calculate Portfolio P&L (Assets + Deposits + Cash)
    const totalPortfolioPl = Number((totalAssetPl + depositData.totalDepositInterest).toFixed(8));
    const unrealizedPortfolioPl = Number((unrealizedAssetPl + depositData.unrealizedDepositPnL).toFixed(8));
    const realizedPortfolioPl = Number((realizedAssetPl + depositData.realizedDepositPnL).toFixed(8));

    //console.log('Asset Snapshots calculate metrics:', portfolioId, date.toISOString().split('T')[0]);

    // Calculate all returns using NAV-based methods
    const totalReturn = await this.calculateTotalReturn(
      portfolioId,
      totalPortfolioValue,
      date,
      granularity
    );
    
    const dailyReturn = await this.calculateDailyReturn(
      portfolioId,
      totalPortfolioValue,
      date,
      granularity
    );

    const weeklyReturn = await this.calculateWeeklyReturn(
      portfolioId,
      totalPortfolioValue,
      date,
      granularity
    );

    const monthlyReturn = await this.calculateMonthlyReturn(
      portfolioId,
      totalPortfolioValue,
      date,
      granularity
    );

    const ytdReturn = await this.calculateYtdReturn(
      portfolioId,
      totalPortfolioValue,
      date,
      granularity
    );

    // Simplified risk metrics
    const assetVolatility = 0;
    const assetMaxDrawdown = 0;
    const portfolioVolatility = 0;
    const portfolioMaxDrawdown = 0;

    // Asset Performance Metrics (use same as portfolio for simplicity)
    const assetDailyReturn = 0;
    const assetWeeklyReturn = 0;
    const assetMonthlyReturn = 0;
    const assetYtdReturn = 0;

    // Portfolio Performance Metrics (same as calculated above)
    const portfolioDailyReturn = 0;
    const portfolioWeeklyReturn = 0;
    const portfolioMonthlyReturn = 0;
    const portfolioYtdReturn = 0;

    // Legacy fields for backward compatibility
    const volatility = 0;
    const maxDrawdown = 0;

    // Debug logging
    console.log('Portfolio Snapshot Debug (With Returns):', {
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
      dailyReturn, // Calculated from previous day
      weeklyReturn, // Calculated from 7 days ago
      monthlyReturn, // Calculated from 30 days ago
      ytdReturn, // Calculated from year start
      volatility, // Simplified to 0
      maxDrawdown, // Simplified to 0
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
      // Portfolio Value Fields (Assets + Deposits + Cash)
      totalPortfolioValue,
      totalPortfolioInvested,
      // Portfolio P&L Fields (Assets + Deposits + Cash)
      totalPortfolioPl,
      unrealizedPortfolioPl,
      realizedPortfolioPl,
      cashBalance,
      // Fund Management Fields
      totalOutstandingUnits,
      navPerUnit,
      numberOfInvestors,
      isFund,
      // Essential Return Fields (different from portfolio_performance_snapshots)
      dailyReturn,
      weeklyReturn,
      monthlyReturn,
      ytdReturn,
      totalReturn,
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
    
    // Create new snapshot
    return await this.savePortfolioSnapshotToDB(createDto);
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

  // /**
  //  * Update deposit fields in portfolio snapshot
  //  */
  // async updateDepositFields(portfolioId: string, depositData?: {
  //   totalDepositPrincipal: number;
  //   totalDepositInterest: number;
  //   totalDepositValue: number;
  //   totalDepositCount: number;
  //   unrealizedDepositPnL: number;
  //   realizedDepositPnL: number;
  // }): Promise<void> {
  //   this.logger.log(`Updating deposit fields for portfolio ${portfolioId}`);

  //   // If no deposit data provided, calculate it
  //   if (!depositData) {
  //     depositData = await this.depositCalculationService.calculateDepositDataByPortfolioId(portfolioId);
  //   }

  //   // Get the latest snapshot for the portfolio
  //   const latestSnapshot = await this.portfolioSnapshotRepository.findOne({
  //     where: { portfolioId },
  //     order: { snapshotDate: 'DESC' }
  //   });

  //   if (latestSnapshot) {
  //     // Update the latest snapshot
  //     latestSnapshot.totalDepositPrincipal = depositData.totalDepositPrincipal;
  //     latestSnapshot.totalDepositInterest = depositData.totalDepositInterest;
  //     latestSnapshot.totalDepositValue = depositData.totalDepositValue;
  //     latestSnapshot.totalDepositCount = depositData.totalDepositCount;
  //     latestSnapshot.unrealizedDepositPnL = depositData.unrealizedDepositPnL;
  //     latestSnapshot.realizedDepositPnL = depositData.realizedDepositPnL;

  //     // Recalculate Portfolio Value Fields (Assets + Deposits + Cash)
  //     latestSnapshot.totalPortfolioValue = Number((latestSnapshot.totalAssetValue + depositData.totalDepositValue + latestSnapshot.cashBalance).toFixed(8));
  //     latestSnapshot.totalPortfolioInvested = Number((latestSnapshot.totalAssetInvested + depositData.totalDepositPrincipal).toFixed(8));

  //     // Recalculate Portfolio P&L Fields (Assets + Deposits + Cash)
  //     latestSnapshot.totalPortfolioPl = Number((latestSnapshot.totalAssetPl + depositData.totalDepositInterest).toFixed(8));
  //     latestSnapshot.unrealizedPortfolioPl = Number((latestSnapshot.unrealizedAssetPl + depositData.unrealizedDepositPnL).toFixed(8));
  //     latestSnapshot.realizedPortfolioPl = Number((latestSnapshot.realizedAssetPl + depositData.realizedDepositPnL).toFixed(8));

  //     await this.portfolioSnapshotRepository.save(latestSnapshot);
  //     this.logger.log(`Updated deposit fields in latest snapshot for portfolio ${portfolioId}`);
  //   } else {
  //     this.logger.warn(`No snapshot found for portfolio ${portfolioId}, creating new one`);
      
  //     // Create a new snapshot with deposit data
  //     const portfolio = await this.portfolioRepository.findOne({
  //       where: { portfolioId }
  //     });

  //     if (portfolio) {
  //       const newSnapshot = this.portfolioSnapshotRepository.create({
  //         portfolioId,
  //         portfolioName: portfolio.name,
  //         snapshotDate: new Date(),
  //         granularity: SnapshotGranularity.DAILY,
  //         totalAssetValue: portfolio.totalValue,
  //         totalAssetInvested: portfolio.totalValue - (portfolio.cashBalance || 0),
  //         // Asset P&L Fields (Assets Only)
  //         totalAssetPl: portfolio.unrealizedPl + portfolio.realizedPl,
  //         unrealizedAssetPl: portfolio.unrealizedPl,
  //         realizedAssetPl: portfolio.realizedPl,
  //         // Portfolio Value Fields (Assets + Deposits + Cash)
  //         totalPortfolioValue: portfolio.totalValue + depositData.totalDepositValue + portfolio.cashBalance,
  //         totalPortfolioInvested: (portfolio.totalValue - portfolio.cashBalance) + depositData.totalDepositPrincipal,
  //         // Portfolio P&L Fields (Assets + Deposits + Cash)
  //         totalPortfolioPl: (portfolio.unrealizedPl + portfolio.realizedPl) + depositData.totalDepositInterest,
  //         unrealizedPortfolioPl: portfolio.unrealizedPl + depositData.unrealizedDepositPnL,
  //         realizedPortfolioPl: portfolio.realizedPl + depositData.realizedDepositPnL,
  //         cashBalance: portfolio.cashBalance,
  //         totalDepositPrincipal: depositData.totalDepositPrincipal,
  //         totalDepositInterest: depositData.totalDepositInterest,
  //         totalDepositValue: depositData.totalDepositValue,
  //         totalDepositCount: depositData.totalDepositCount,
  //         unrealizedDepositPnL: depositData.unrealizedDepositPnL,
  //         realizedDepositPnL: depositData.realizedDepositPnL,
  //         isActive: true,
  //       });

  //       await this.portfolioSnapshotRepository.save(newSnapshot);
  //       this.logger.log(`Created new snapshot with deposit data for portfolio ${portfolioId}`);
  //     }
  //   }
  // }

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
    granularity?: SnapshotGranularity,
    date?: Date
  ): Promise<PortfolioSnapshot | null> {
    return await this.portfolioSnapshotRepo.findLatest(portfolioId, granularity, date);
  }

  /**
   * Get portfolios that have snapshots for a specific account
   */
  async getPortfoliosWithSnapshots(accountId: string): Promise<Array<{ portfolioId: string; portfolioName: string; snapshotCount: number; latestSnapshotDate: Date; oldestSnapshotDate: Date }>> {
    this.logger.log(`Getting portfolios with portfolio snapshots for account ${accountId}`);
    
    return await this.portfolioSnapshotRepo.findPortfoliosWithSnapshots(accountId);
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
   * Tính độ biến động giữa các tài sản trong danh mục tại 1 thời điểm
   * Dùng trong báo cáo snapshot hàng ngày (ví dụ: “ngày hôm nay, lợi nhuận các tài sản biến động thế nào so với trung bình danh mục”)
   */
  private calculateVolatilityByAssetDistribution(snapshots: AssetAllocationSnapshot[]): number {
    if (snapshots.length < 2) return 0;
  
    // Lọc dữ liệu hợp lệ
    const validSnapshots = snapshots.filter(
      s => s.currentValue != null && s.currentValue > 0 && s.returnPercentage != null
    );
    if (validSnapshots.length < 2) return 0;
  
    // Tổng giá trị danh mục
    const totalValue = validSnapshots.reduce((sum, s) => sum + Number(s.currentValue), 0);
    if (totalValue === 0) return 0;
  
    // Tính lợi nhuận trung bình có trọng số
    const weightedMean = validSnapshots.reduce(
      (sum, s) => sum + (Number(s.returnPercentage) * Number(s.currentValue)) / totalValue,
      0
    );
  
    // Tính phương sai có trọng số
    const weightedVariance = validSnapshots.reduce((sum, s) => {
      const weight = Number(s.currentValue) / totalValue;
      return sum + weight * Math.pow(Number(s.returnPercentage) - weightedMean, 2);
    }, 0);
  
    // Trả về độ lệch chuẩn (%)
    return Number(Math.sqrt(weightedVariance).toFixed(8));
  }
  
  /**
   * Tính độ biến động theo thời gian của danh mục (hoặc tài sản)
   * Dùng trong báo cáo hiệu suất định kỳ (daily / weekly / monthly volatility)
   */

  private calculateVolatilityOverTime(snapshots: AssetAllocationSnapshot[]): number {
    if (snapshots.length < 2) return 0;
  
    // Sắp xếp theo ngày
    const sorted = [...snapshots].sort(
      (a, b) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime()
    );
  
    // Tính các return hàng ngày
    const returns: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const prevValue = Number(sorted[i - 1].currentValue);
      const currValue = Number(sorted[i].currentValue);
      if (prevValue > 0 && currValue > 0) {
        const r = (currValue - prevValue) / prevValue;
        returns.push(r);
      }
    }
  
    if (returns.length < 2) return 0;
  
    // Mean và variance
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, r) => a + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  
    // Annualized volatility (nếu dữ liệu là daily)
    const annualizedVolatility = Math.sqrt(variance * 252) * 100;
  
    return Number(annualizedVolatility.toFixed(8)); // %
  }
  

  /**
   * Calculate max drawdown (simplified)
   */
  private calculateMaxDrawdown(snapshots: AssetAllocationSnapshot[]): number {
    if (snapshots.length < 2) return 0;
  
    // ✅ 1. Sort theo thời gian để tránh sai thứ tự
    const sorted = [...snapshots].sort(
      (a, b) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime()
    );
  
    // ✅ 2. Lọc bỏ giá trị null hoặc <= 0 để tránh chia cho 0
    const values = sorted
      .map(s => Number(s.currentValue))
      .filter(v => !isNaN(v) && v > 0);
  
    if (values.length < 2) return 0;
  
    let peak = values[0];
    let maxDrawdown = 0;
  
    for (let i = 1; i < values.length; i++) {
      const v = values[i];
  
      if (v > peak) {
        peak = v;
      } else {
        const drawdown = ((peak - v) / peak) * 100;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
    }
  
    return Number(maxDrawdown.toFixed(8));
  }
  

  /**
   * Calculate daily return based on actual daily change from snapshots (DEPRECATED)
   * FIXED: Use actual daily change instead of cumulative return percentage
   */
  private calculateDailyReturnOld(snapshots: AssetAllocationSnapshot[]): number {
    if (snapshots.length === 0) return 0;

    const currentDate = new Date(); // ngày hiện tại
    const currentSnapshot = snapshots[snapshots.length - 1];
    const currentSnapshotDate = new Date(currentSnapshot.snapshotDate);
    const currentSnapshotFullYear = currentSnapshotDate.getFullYear();

    // 🔹 Bước 1: Lọc snapshot trong năm hiện tại để tối ưu thời gian tính toán
    const filteredSnapshots = snapshots
      .filter(s => new Date(s.snapshotDate).getFullYear() === currentSnapshotFullYear
      && new Date(s.snapshotDate) <= currentDate)
      .sort((a, b) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime());

    if (filteredSnapshots.length === 0) return 0;
  
    // 🔹 Bước 2: Gom nhóm theo assetId và tính daily return cho từng asset
    const assetGroups = new Map<string, AssetAllocationSnapshot[]>();
    filteredSnapshots.forEach(s => {
      if (!assetGroups.has(s.assetId)) assetGroups.set(s.assetId, []);
      assetGroups.get(s.assetId)!.push(s);
    });
  
    let totalPrevValue = 0;
    let totalCurrValue = 0;
  
    // 🔹 Bước 3: Tính daily return cho từng asset

    assetGroups.forEach(list => {
      if (list.length < 2) return;
      list.sort((a, b) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime());
  
      const current = list[list.length - 1];
      const currentValue = Number(current.currentValue || 0);
      const currentDate = new Date(current.snapshotDate);
  
      // Find closest previous snapshot
      const previousSnapshots = list.filter(s => new Date(s.snapshotDate) < currentDate);
      if (previousSnapshots.length === 0) return;
      const previous = previousSnapshots[previousSnapshots.length - 1];
      const previousValue = Number(previous.currentValue || 0);
  
      totalCurrValue += currentValue;
      totalPrevValue += previousValue;
    });
  
    if (totalPrevValue === 0) return 0;
  
    // Portfolio-level simple daily return
    const dailyReturn = ((totalCurrValue - totalPrevValue) / totalPrevValue) * 100;
    return Number(dailyReturn.toFixed(8));
  }
  

  /**
   * Calculate YTD return based on change from earliest data in the year (DEPRECATED)
   * Cách 1 (weighted): phù hợp khi bạn muốn phân tích hiệu suất tương đối giữa các tài sản.
   *   * Dùng trong dashboard chi tiết từng asset.
   * Cách 2 (totalValue - totalYearStartValue): đúng nhất nếu bạn muốn biết tổng lợi nhuận của toàn danh mục.
   *   * Dùng trong báo cáo tổng hợp danh mục (Portfolio summary).
   */
  private calculateYtdReturnOld(snapshots: AssetAllocationSnapshot[]): { weightedYtd: number, totalYtd: number } {
    if (snapshots.length === 0) return { weightedYtd: 0, totalYtd: 0 };
  
    const currentDate = new Date(); // ngày hiện tại
    const currentSnapshot = snapshots[snapshots.length - 1];
    const currentSnapshotDate = new Date(currentSnapshot.snapshotDate);
    const currentSnapshotYear = currentSnapshotDate.getFullYear();
  
    // 🔹 Bước 1: Lọc snapshot trong năm hiện tại
    const filteredSnapshots = snapshots
      .filter(s => new Date(s.snapshotDate).getFullYear() === currentSnapshotYear 
      && new Date(s.snapshotDate) <= currentDate)
  
    if (filteredSnapshots.length === 0) return { weightedYtd: 0, totalYtd: 0 };
  
    // 🔹 Bước 2: Gom nhóm theo assetId
    const assetGroups = new Map<string, AssetAllocationSnapshot[]>();
    for (const snapshot of filteredSnapshots) {
      const group = assetGroups.get(snapshot.assetId) || [];
      group.push(snapshot);
      assetGroups.set(snapshot.assetId, group);
    }
  
    // 🔹 Bước 3: Tính YTD cho từng asset
    let totalWeightedYtdReturn = 0;
    let totalValue = 0;
    let totalYearStartValue = 0;
    let totalCurrentValue = 0;
  
    for (const assetSnapshots of assetGroups.values()) {
      assetSnapshots.sort((a, b) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime());
  
      const currentSnapshot = assetSnapshots[assetSnapshots.length - 1];
      const yearStartSnapshot = assetSnapshots[0];
  
      const currentValue = Number(currentSnapshot.currentValue || 0);
      const yearStartValue = Number(yearStartSnapshot.currentValue || 0);
  
      if (yearStartValue > 0) {
        const ytdReturn = ((currentValue - yearStartValue) / yearStartValue) * 100;
        
        // Weighted
        totalWeightedYtdReturn += ytdReturn * currentValue;
        totalValue += currentValue;

        // Total portfolio
        totalCurrentValue += currentValue;
        totalYearStartValue += yearStartValue;
      }
    }
    this.logger.debug(`calculateYtdReturn: Total weighted YTD return: ${totalWeightedYtdReturn}`);
    this.logger.debug(`calculateYtdReturn: Total value: ${totalValue}`);
    this.logger.debug(`calculateYtdReturn: Total year start value: ${totalYearStartValue}`);

    const weightedYtd =
      totalValue > 0
        ? Number((totalWeightedYtdReturn / totalValue).toFixed(8))
        : 0;

    const totalYtd =
      totalYearStartValue > 0
        ? Number((((totalCurrentValue - totalYearStartValue) / totalYearStartValue) * 100).toFixed(8))
        : 0;

    return { weightedYtd, totalYtd };
  }

  /**
   * Calculate weekly return based on change from last week's data (DEPRECATED)
   */
  private calculateWeeklyReturnOld(snapshots: AssetAllocationSnapshot[]): number {
    if (snapshots.length === 0) return 0;

    const currentDate = new Date(); // ngày hiện tại
    const currentSnapshot = snapshots[snapshots.length - 1];
    const currentSnapshotDate = new Date(currentSnapshot.snapshotDate);
    const currentSnapshotFullYear = currentSnapshotDate.getFullYear();

    // 🔹 Bước 1: Lọc snapshot trong năm hiện tại để tối ưu thời gian tính toán
    const filteredSnapshots = snapshots
      .filter(s => new Date(s.snapshotDate).getFullYear() === currentSnapshotFullYear
      && new Date(s.snapshotDate) <= currentDate)
      .sort((a, b) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime());

    if (filteredSnapshots.length === 0) return 0;
  
    // 🔹 Bước 2: Gom nhóm theo assetId và tính weekly return cho từng asset
    const assetGroups = new Map<string, AssetAllocationSnapshot[]>();
    filteredSnapshots.forEach(s => {
      if (!assetGroups.has(s.assetId)) assetGroups.set(s.assetId, []);
      assetGroups.get(s.assetId)!.push(s);
    });
  
    let totalWeightedWeeklyReturn = 0;
    let totalValue = 0;
  
    // 🔹 Bước 3: Tính weekly return cho từng asset
    assetGroups.forEach(assetSnapshots => {
      if (assetSnapshots.length < 2) return;
      assetSnapshots.sort((a, b) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime());
  
      const currentSnapshot = assetSnapshots[assetSnapshots.length - 1];
      const currentValue = Number(currentSnapshot.currentValue || 0);
      const currentDate = new Date(currentSnapshot.snapshotDate);
  
      // Xác định ngày cuối tuần trước (ví dụ: Chủ nhật tuần trước)
      const endOfLastWeek = new Date(currentDate);
      const dayOfWeek = currentDate.getDay(); // 0 = Chủ nhật, 1 = Thứ 2, ... 6 = Thứ 7
      if (dayOfWeek === 0) {
        // Nếu hôm nay là Chủ nhật -> lùi 7 ngày (Chủ nhật tuần trước)
        endOfLastWeek.setDate(currentDate.getDate() - 7);
      } else {
        // Nếu hôm nay là Thứ 2–7 -> lấy Chủ nhật liền trước
        endOfLastWeek.setDate(currentDate.getDate() - dayOfWeek);
      }
  
      // Tìm snapshot gần nhất với endOfLastWeek
      const weekAgoSnapshot = assetSnapshots
      .filter(s => new Date(s.snapshotDate) <= endOfLastWeek)
      .sort((a, b) => new Date(b.snapshotDate).getTime() - new Date(a.snapshotDate).getTime())[0];
  
      const weekAgoValue = Number(weekAgoSnapshot.currentValue || 0);
      if (weekAgoValue <= 0) return;
  
      const weeklyReturn = ((currentValue - weekAgoValue) / weekAgoValue) * 100;
  
      // ✅ Dùng giá trị đầu kỳ làm trọng số, và đổi % về tỷ lệ
      totalWeightedWeeklyReturn += (weeklyReturn / 100) * weekAgoValue;
      totalValue += weekAgoValue;
    });
  
    return totalValue > 0
      ? Number(((totalWeightedWeeklyReturn / totalValue) * 100).toFixed(8)) // Trả về %
      : 0;
  }  

  /**
   * Calculate monthly return based on change from last month's data (DEPRECATED)
   */
  private calculateMonthlyReturnOld(snapshots: AssetAllocationSnapshot[]): number {
    if (snapshots.length === 0) return 0;
  
    const currentDate = new Date(); // ngày hiện tại
    const currentSnapshot = snapshots[snapshots.length - 1];
    const currentSnapshotDate = new Date(currentSnapshot.snapshotDate);
    const currentSnapshotFullYear = currentSnapshotDate.getFullYear();

    // 🔹 Bước 1: Lọc snapshot trong năm hiện tại để tối ưu thời gian tính toán
    const filteredSnapshots = snapshots
      .filter(s => new Date(s.snapshotDate).getFullYear() === currentSnapshotFullYear
      && new Date(s.snapshotDate) <= currentDate)
      .sort((a, b) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime());

    if (filteredSnapshots.length === 0) return 0;

    // 🔹 Bước 2: Gom nhóm theo assetId và tính monthly return cho từng asset
    const assetGroups = new Map<string, AssetAllocationSnapshot[]>();
    filteredSnapshots.forEach(snapshot => {
      if (!assetGroups.has(snapshot.assetId)) assetGroups.set(snapshot.assetId, []);
      assetGroups.get(snapshot.assetId)!.push(snapshot);
    });
  
    let totalWeightedMonthlyReturn = 0;
    let totalValue = 0;
  
    // 🔹 Bước 3: Tính monthly return cho từng asset
    assetGroups.forEach(assetSnapshots => {
      if (assetSnapshots.length < 2) return;
  
      assetSnapshots.sort((a, b) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime());
  
      const currentSnapshot = assetSnapshots[assetSnapshots.length - 1];
      const currentDate = new Date(currentSnapshot.snapshotDate); 
      const currentValue = Number(currentSnapshot.currentValue || 0);
  
      // 🧭 Tính ngày cuối của tháng so sánh
      const firstOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); // ngày đầu tháng hiện tại
      const endOfLastMonth = new Date(firstOfMonth.getTime() - 86400000); // lùi 1 ngày
  
      // 🔍 Tìm snapshot gần nhất trước hoặc bằng endOfLastMonth
      const previousSnapshots = assetSnapshots
      .filter(s => new Date(s.snapshotDate) <= endOfLastMonth)
      .sort((a, b) => new Date(b.snapshotDate).getTime() - new Date(a.snapshotDate).getTime());
      if (previousSnapshots.length === 0) return;
  
      const previousSnapshot = previousSnapshots[previousSnapshots.length - 1];
      const previousValue = Number(previousSnapshot.currentValue || 0);
      if (previousValue <= 0) return;
  
      // 📈 Monthly return
      const monthlyReturn = ((currentValue - previousValue) / previousValue) * 100;
  
      totalWeightedMonthlyReturn += (monthlyReturn / 100) * previousValue;
      totalValue += previousValue;
    });
  
    return totalValue > 0
      ? Number(((totalWeightedMonthlyReturn / totalValue) * 100).toFixed(8))
      : 0;
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
   * Calculate Portfolio Total Return (Assets + Deposits)
   * Uses weighted average based on asset and deposit values
   */
  private calculatePortfolioTotalReturn(
    totalPortfolioValue: number,
    totalAssetValue: number,
    assetTotalReturn: number,
    totalDepositValue: number,
    totalDepositInterest: number
  ): number {
    if (totalPortfolioValue === 0) return 0;
    
    const assetWeight = totalAssetValue / totalPortfolioValue;
    const depositWeight = totalDepositValue / totalPortfolioValue;
    
    // Calculate deposit total return based on interest earned
    const depositTotalReturn = totalDepositValue > 0 ? (totalDepositInterest / totalDepositValue) * 100 : 0;
    
    return Number((assetTotalReturn * assetWeight + depositTotalReturn * depositWeight).toFixed(8));
  }

  /**
   * Calculate Portfolio Weekly Return (Assets + Deposits)
   * Uses weighted average based on asset and deposit values
   */
  private calculatePortfolioWeeklyReturn(
    totalPortfolioValue: number,
    totalAssetValue: number,
    assetWeeklyReturn: number,
    totalDepositValue: number,
    totalDepositInterest: number
  ): number {
    if (totalPortfolioValue === 0) return 0;
    
    const assetWeight = totalAssetValue / totalPortfolioValue;
    const depositWeight = totalDepositValue / totalPortfolioValue;
    
    // Assume deposits have 0% weekly return (fixed interest)
    const depositWeeklyReturn = 0;
    
    return Number((assetWeeklyReturn * assetWeight + depositWeeklyReturn * depositWeight).toFixed(8));
  }

  /**
   * Calculate Portfolio Monthly Return (Assets + Deposits)
   * Uses weighted average based on asset and deposit values
   */
  private calculatePortfolioMonthlyReturn(
    totalPortfolioValue: number,
    totalAssetValue: number,
    assetMonthlyReturn: number,
    totalDepositValue: number,
    totalDepositInterest: number
  ): number {
    if (totalPortfolioValue === 0) return 0;
    
    const assetWeight = totalAssetValue / totalPortfolioValue;
    const depositWeight = totalDepositValue / totalPortfolioValue;
    
    // Calculate deposit monthly return based on interest earned
    const depositMonthlyReturn = totalDepositValue > 0 ? (totalDepositInterest / totalDepositValue) * 100 : 0;
    
    return Number((assetMonthlyReturn * assetWeight + depositMonthlyReturn * depositWeight).toFixed(8));
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
   * Calculate total return from the beginning of investment (DEPRECATED)
   * Uses weighted average based on asset values and their total return
   */
  private calculateTotalReturnOld(snapshots: AssetAllocationSnapshot[]): number {
    if (snapshots.length === 0) return 0;
    
    // Group snapshots by asset to calculate total return for each asset
    const assetGroups = new Map<string, AssetAllocationSnapshot[]>();
    snapshots.forEach(snapshot => {
      const assetId = snapshot.assetId;
      if (!assetGroups.has(assetId)) {
        assetGroups.set(assetId, []);
      }
      assetGroups.get(assetId)!.push(snapshot);
    });
    
    let totalWeightedReturn = 0;
    let totalValue = 0;
    
    // Calculate total return for each asset
    assetGroups.forEach(assetSnapshots => {
      if (assetSnapshots.length === 0) return;
      
      // Sort by date to get chronological order
      assetSnapshots.sort((a, b) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime());
      
      // Get the most recent snapshot (current)
      const currentSnapshot = assetSnapshots[assetSnapshots.length - 1];
      const currentValue = Number(currentSnapshot.currentValue || 0);
      const currentDate = new Date(currentSnapshot.snapshotDate);
      
      // Find the earliest snapshot for this asset
      const earliestSnapshot = assetSnapshots[0];
      const earliestValue = Number(earliestSnapshot.currentValue || 0);
      const earliestDate = new Date(earliestSnapshot.snapshotDate);
      
      // Calculate total return from beginning to current
      if (earliestValue > 0) {
        const totalReturn = ((currentValue - earliestValue) / earliestValue) * 100;
        
        // Weight by current value
        totalWeightedReturn = Number((totalWeightedReturn + (totalReturn * currentValue)).toFixed(8));
        totalValue = Number((totalValue + currentValue).toFixed(8));
      }
    });
    
    return totalValue > 0 ? Number((totalWeightedReturn / totalValue).toFixed(8)) : 0;
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

  /**
   * Calculate daily return from snapshots (helper method)
   */
  private calculateDailyReturnFromSnapshots(
    currentValue: number,
    previousValue: number
  ): number {
    if (previousValue === 0) return 0;
    return Number((((currentValue - previousValue) / previousValue) * 100).toFixed(4));
  }

  /**
   * Calculate weekly return from snapshots (helper method)
   */
  private calculateWeeklyReturnFromSnapshots(
    currentValue: number,
    weekAgoValue: number
  ): number {
    if (weekAgoValue === 0) return 0;
    return Number((((currentValue - weekAgoValue) / weekAgoValue) * 100).toFixed(4));
  }

  /**
   * Calculate monthly return from snapshots (helper method)
   */
  private calculateMonthlyReturnFromSnapshots(
    currentValue: number,
    monthAgoValue: number
  ): number {
    if (monthAgoValue === 0) return 0;
    return Number((((currentValue - monthAgoValue) / monthAgoValue) * 100).toFixed(4));
  }

  /**
   * Calculate YTD return from snapshots (helper method)
   */
  private calculateYtdReturnFromSnapshots(
    currentValue: number,
    yearStartValue: number
  ): number {
    if (yearStartValue === 0) return 0;
    return Number((((currentValue - yearStartValue) / yearStartValue) * 100).toFixed(4));
  }

  /**
   * Calculate total return based on NAV / first NAV
   */
  private async calculateTotalReturn(
    portfolioId: string,
    currentNav: number,
    date: Date,
    granularity: SnapshotGranularity
  ): Promise<number> {
    // Get the first snapshot for this portfolio
    const firstSnapshot = await this.portfolioSnapshotRepository.findOne({
      where: {
        portfolioId,
        granularity,
        isActive: true,
      },
      order: { snapshotDate: 'ASC' }
    });

    if (!firstSnapshot || firstSnapshot.totalPortfolioValue === 0) return 0;
    
    return Number((((currentNav - firstSnapshot.totalPortfolioValue) / firstSnapshot.totalPortfolioValue) * 100).toFixed(4));
  }

  /**
   * Calculate daily return = NAV / NAV ngày gần nhất có dữ liệu
   */
  private async calculateDailyReturn(
    portfolioId: string,
    currentNav: number,
    date: Date,
    granularity: SnapshotGranularity
  ): Promise<number> {
    // Find the nearest available snapshot before current date
    const previousSnapshot = await this.portfolioSnapshotRepository.findOne({
      where: {
        portfolioId,
        snapshotDate: LessThan(date), // Before current date
        granularity,
        isActive: true,
      },
      order: { snapshotDate: 'DESC' } // Get the most recent one
    });

    if (!previousSnapshot || previousSnapshot.totalPortfolioValue === 0) return 0;
    
    return Number((((currentNav - previousSnapshot.totalPortfolioValue) / previousSnapshot.totalPortfolioValue) * 100).toFixed(4));
  }

  /**
   * Calculate weekly return = NAV / NAV cuối tuần trước
   */
  private async calculateWeeklyReturn(
    portfolioId: string,
    currentNav: number,
    date: Date,
    granularity: SnapshotGranularity
  ): Promise<number> {
    // Get the last day of the previous week (Sunday) using UTC methods
    const currentDay = date.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    // Calculate days to subtract to get to previous Sunday:
    // - If today is Sunday (0), subtract 7 days to get last Sunday
    // - If today is Monday-Saturday (1-6), subtract currentDay + 7 to get previous Sunday
    //   (subtract currentDay to get to this Sunday, then subtract 7 more for previous week)
    const daysToSubtract = currentDay === 0 ? 7 : currentDay;
    
    // Use UTC methods to avoid timezone issues
    // Calculate timestamp and subtract days in milliseconds to handle month/year boundaries correctly
    const previousWeekTimestamp = date.getTime() - (daysToSubtract * 24 * 60 * 60 * 1000);
    const previousWeekDate = new Date(previousWeekTimestamp);
    // console.log('calculateWeeklyReturn: previousWeekDate', previousWeekDate);

    // Find the last snapshot of the previous week
    const weekAgoSnapshot = await this.portfolioSnapshotRepository.findOne({
      where: {
        portfolioId,
        snapshotDate: LessThanOrEqual(previousWeekDate),
        granularity,
        isActive: true,
      },
      order: { snapshotDate: 'DESC' }
    });

    if (!weekAgoSnapshot || weekAgoSnapshot.totalPortfolioValue === 0) return 0;

    // console.log('calculateWeeklyReturn: currentNav', currentNav);
    // console.log('calculateWeeklyReturn: weekAgoSnapshot', weekAgoSnapshot);
    return Number((((currentNav - weekAgoSnapshot.totalPortfolioValue) / weekAgoSnapshot.totalPortfolioValue) * 100).toFixed(4));
  }

  /**
   * Calculate monthly return = NAV / NAV cuối tháng trước có dữ liệu
   */
  private async calculateMonthlyReturn(
    portfolioId: string,
    currentNav: number,
    date: Date,
    granularity: SnapshotGranularity
  ): Promise<number> {
    const currentMonth = date.getUTCMonth(); // 0-11 (0=Jan, 1=Feb, ..., 9=Oct, 10=Nov, 11=Dec)
    const currentYear = date.getUTCFullYear();
    
    // To get last day of previous month in UTC
    const lastDayOfPreviousMonth = new Date(Date.UTC(currentYear, currentMonth, 0)); // Last day of previous month in UTC
    
    // console.log('calculateMonthlyReturn: currentMonth (UTC)', currentMonth, 'date (UTC)', date.toISOString());
    // console.log('calculateMonthlyReturn: lastDayOfPreviousMonth (UTC)', lastDayOfPreviousMonth.toISOString());
    // Find the last snapshot of the previous month
    const monthAgoSnapshot = await this.portfolioSnapshotRepository.findOne({
      where: {
        portfolioId,
        snapshotDate: LessThanOrEqual(lastDayOfPreviousMonth),
        granularity,
        isActive: true,
      },
      order: { snapshotDate: 'DESC' }
    });

    // console.log('calculateMonthlyReturn: monthAgoSnapshot', monthAgoSnapshot);

    if (!monthAgoSnapshot || monthAgoSnapshot.totalPortfolioValue === 0) return 0;
    
    return Number((((currentNav - monthAgoSnapshot.totalPortfolioValue) / monthAgoSnapshot.totalPortfolioValue) * 100).toFixed(4));
  }

  /**
   * Calculate YTD return = NAV / NAV ngày nhỏ nhất trong năm
   */
  private async calculateYtdReturn(
    portfolioId: string,
    currentNav: number,
    date: Date,
    granularity: SnapshotGranularity
  ): Promise<number> {
    // Get the earliest snapshot in the current year using UTC
    const yearStart = new Date(Date.UTC(date.getUTCFullYear()-1, 11, 31)); // December 31st, 23:59:59 UTC of previous year
    const currentDateEnd = new Date(Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23, 59, 59, 999 // End of current day
    ));
    
    // Find the earliest snapshot from the start of the year up to current date
    const yearStartSnapshot = await this.portfolioSnapshotRepository.findOne({
      where: {
        portfolioId,
        snapshotDate: Between(yearStart, currentDateEnd),
        granularity,
        isActive: true,
      },
      order: { snapshotDate: 'ASC' } // Get the earliest date in the year
    });

    // If no snapshot found in current year, try to get the earliest snapshot overall
    if (!yearStartSnapshot) {
      const earliestSnapshot = await this.portfolioSnapshotRepository.findOne({
        where: {
          portfolioId,
          granularity,
          isActive: true,
        },
        order: { snapshotDate: 'ASC' }
      });

      if (!earliestSnapshot || earliestSnapshot.totalPortfolioValue === 0) return 0;
      
      return Number((((currentNav - earliestSnapshot.totalPortfolioValue) / earliestSnapshot.totalPortfolioValue) * 100).toFixed(4));
    }

    if (yearStartSnapshot.totalPortfolioValue === 0) return 0;
    
    return Number((((currentNav - yearStartSnapshot.totalPortfolioValue) / yearStartSnapshot.totalPortfolioValue) * 100).toFixed(4));
  }

}
