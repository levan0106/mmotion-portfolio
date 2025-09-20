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

    // Portfolio snapshots are now only created from bulk operations (createPortfolioSnapshot)
    // to avoid duplicate calls and ensure consistency

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
    // Get all assets in portfolio
    const assets = await this.assetService.findByPortfolioId(portfolioId);
    
    if (assets.length === 0) {
      this.logger.warn(`No assets found in portfolio ${portfolioId}. Cannot create snapshots.`);
      return [];
    }
    
    const snapshots: Partial<AssetAllocationSnapshot>[] = [];

    for (const asset of assets) {
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
        allocationPercentage: 0, // TODO: Will be calculated after all snapshots are created
        portfolioTotalValue: 0, // TODO: Will be calculated after all snapshots are created
        returnPercentage,
        dailyReturn: 0, // TODO: Will be calculated later
        cumulativeReturn: 0, // TODO: Will be calculated later
        isActive: true,
        createdBy,
        notes: `Portfolio snapshot for ${snapshotDate.toISOString().split('T')[0]}`,
      };

      snapshots.push(snapshot);
    }

    // First, delete existing snapshots for the same portfolio, date, and granularity
    // This ensures we only have one snapshot per day per portfolio
    const deletedAssetCount = await this.snapshotRepo.deleteByPortfolioDateAndGranularity(portfolioId, snapshotDate, granularity);

    // Create all snapshots in batch
    const createdSnapshots = await this.snapshotRepo.createMany(snapshots);

    // Create portfolio snapshot after asset snapshots are created
    try {
      const portfolioSnapshot = await this.portfolioSnapshotService.createPortfolioSnapshotFromAssetSnapshots(
        portfolioId,
        snapshotDate,
        granularity,
        createdBy ? `${createdBy}-portfolio-snapshot` : 'portfolio-snapshot'
      );
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

    return await this.snapshotRepo.findAggregatedByDate(portfolioId, startDate, endDate, granularity);
  }



  /**
   * Get allocation timeline data for analytics using real snapshot data
   */
  async getAnalyticsAllocationTimeline(
    portfolioId: string,
    startDate: Date,
    endDate: Date,
    granularity: SnapshotGranularity = SnapshotGranularity.MONTHLY
  ): Promise<{ date: string; [key: string]: string | number }[]> {

    // Step 1: Find the actual min date from snapshots
    const actualMinDate = await this.findActualMinSnapshotDate(portfolioId, startDate, endDate);
    
    if (!actualMinDate) {
      this.logger.warn(`No snapshots found for portfolio ${portfolioId} in date range ${startDate.toISOString()} to ${endDate.toISOString()}`);
      return [];
    }

    // Step 2: Always calculate DAILY first, then filter based on granularity
    const actualEndDate = new Date(); // Current date
    const dailyTimeline = await this.generateTimelineFromDailySnapshots(portfolioId, actualMinDate, actualEndDate, SnapshotGranularity.DAILY);

    if (dailyTimeline.length === 0) {
      this.logger.warn(`No DAILY timeline data generated for portfolio ${portfolioId}`);
      return [];
    }

    // Step 3: Filter based on granularity
    if (granularity === SnapshotGranularity.DAILY) {
      return dailyTimeline;
    } else if (granularity === SnapshotGranularity.MONTHLY) {
      return this.filterToMonthlyData(dailyTimeline);
    } else if (granularity === SnapshotGranularity.WEEKLY) {
      return this.filterToWeeklyData(dailyTimeline);
    }

    return dailyTimeline;
  }

  /**
   * Filter DAILY data to MONTHLY data (last day of each month)
   */
  private filterToMonthlyData(dailyData: { date: string; [key: string]: string | number }[]): { date: string; [key: string]: string | number }[] {
    const monthlyData: { date: string; [key: string]: string | number }[] = [];
    const monthlyMap = new Map<string, { date: string; [key: string]: string | number }>();

    // Group by year-month and keep the last day of each month
    dailyData.forEach(dataPoint => {
      const date = new Date(dataPoint.date);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      // Always keep the latest date for each month
      monthlyMap.set(yearMonth, dataPoint);
    });

    // Convert to array and sort by date
    monthlyData.push(...Array.from(monthlyMap.values()));
    monthlyData.sort((a, b) => a.date.localeCompare(b.date));

    return monthlyData;
  }

  /**
   * Filter DAILY data to WEEKLY data (every 7 days)
   */
  private filterToWeeklyData(dailyData: { date: string; [key: string]: string | number }[]): { date: string; [key: string]: string | number }[] {
    const weeklyData: { date: string; [key: string]: string | number }[] = [];
    
    // Take every 7th day starting from the first day
    for (let i = 0; i < dailyData.length; i += 7) {
      weeklyData.push(dailyData[i]);
    }

    return weeklyData;
  }

  /**
   * Find the actual minimum snapshot date for a portfolio
   */
  private async findActualMinSnapshotDate(portfolioId: string, startDate: Date, endDate: Date): Promise<Date | null> {
    try {
      // Get NAV snapshots to find the actual min date
      const navSnapshots = await this.portfolioSnapshotService.getPortfolioSnapshotTimeline({
        portfolioId,
        startDate,
        endDate
      });

      if (!navSnapshots || navSnapshots.length === 0) {
        return null;
      }

      // Find the earliest snapshot date
      const dates = navSnapshots.map(snapshot => {
        const snapshotDate = snapshot.snapshotDate instanceof Date 
          ? snapshot.snapshotDate 
          : new Date(snapshot.snapshotDate);
        return snapshotDate;
      });

      const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      this.logger.log(`Found actual min snapshot date: ${minDate.toISOString().split('T')[0]} for portfolio ${portfolioId}`);
      
      return minDate;
    } catch (error) {
      this.logger.error(`Error finding actual min snapshot date: ${error.message}`);
      return null;
    }
  }

  /**
   * Generate date range from min date to current date based on granularity
   */
  private generateDateRangeFromMinDate(minDate: Date, endDate: Date, granularity: SnapshotGranularity): Date[] {
    const dates: Date[] = [];
    const current = new Date(minDate);
    const end = new Date(endDate);

    // For MONTHLY granularity, generate monthly dates
    if (granularity === SnapshotGranularity.MONTHLY) {
      const temp = new Date(current);
      while (temp <= end) {
        // Use the last day of the month
        const lastDayOfMonth = new Date(temp.getFullYear(), temp.getMonth() + 1, 0);
        if (lastDayOfMonth <= end) {
          dates.push(new Date(lastDayOfMonth));
        }
        temp.setMonth(temp.getMonth() + 1);
      }
    } 
    // For WEEKLY granularity, generate weekly dates
    else if (granularity === SnapshotGranularity.WEEKLY) {
      const temp = new Date(current);
      while (temp <= end) {
        dates.push(new Date(temp));
        temp.setDate(temp.getDate() + 7);
      }
    } 
    // For DAILY granularity, generate daily dates
    else {
      const temp = new Date(current);
      while (temp <= end) {
        dates.push(new Date(temp));
        temp.setDate(temp.getDate() + 1);
      }
    }

    return dates;
  }

  /**
   * Check if there are any NAV snapshots in the date range
   */
  private async checkNavSnapshotsInRange(portfolioId: string, startDate: Date, endDate: Date): Promise<boolean> {
    try {
      // Check if there are any portfolio snapshots (NAV snapshots) in the date range
      const navSnapshots = await this.portfolioSnapshotService.getPortfolioSnapshotTimeline({
        portfolioId,
        startDate,
        endDate
      });
      return navSnapshots && navSnapshots.length > 0;
    } catch (error) {
      this.logger.error(`Error checking NAV snapshots in range: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate empty timeline data for periods without snapshots
   */
  private generateEmptyTimelineData(
    startDate: Date,
    endDate: Date,
    granularity: SnapshotGranularity
  ): { date: string; [key: string]: string | number }[] {
    const dateRange = this.generateAnalyticsDateRange(startDate, endDate, granularity);
    return dateRange.map(date => ({
      date: date.toISOString().split('T')[0],
      // Empty allocation data
    }));
  }

  /**
   * Generate empty timeline data only for dates that have snapshot data
   */
  private async generateEmptyTimelineDataFromSnapshotDates(
    portfolioId: string,
    startDate: Date,
    endDate: Date,
    granularity: SnapshotGranularity
  ): Promise<{ date: string; [key: string]: string | number }[]> {
    try {
      // Get NAV snapshots to find actual dates with data
      const navSnapshots = await this.portfolioSnapshotService.getPortfolioSnapshotTimeline({
        portfolioId,
        startDate,
        endDate
      });

      if (!navSnapshots || navSnapshots.length === 0) {
        return [];
      }

      // Generate date range only for dates that have snapshot data
      const snapshotDates = navSnapshots.map(snapshot => {
        const snapshotDate = snapshot.snapshotDate instanceof Date 
          ? snapshot.snapshotDate 
          : new Date(snapshot.snapshotDate);
        return snapshotDate.toISOString().split('T')[0];
      });

      // Sort dates and remove duplicates
      const uniqueDates = [...new Set(snapshotDates)].sort();

      // Generate timeline data only for these dates
      return uniqueDates.map(date => ({
        date: date,
        // Empty allocation data
      }));
    } catch (error) {
      this.logger.error(`Error generating empty timeline data from snapshot dates: ${error.message}`);
      return this.generateEmptyTimelineData(startDate, endDate, granularity);
    }
  }

  /**
   * Generate timeline from DAILY snapshots and aggregate them based on granularity
   */
  private async generateTimelineFromDailySnapshots(
    portfolioId: string,
    startDate: Date,
    endDate: Date,
    granularity: SnapshotGranularity
  ): Promise<{ date: string; [key: string]: string | number }[]> {
    try {
      // Get DAILY snapshots
      const dailySnapshots = await this.getTimelineData({
        portfolioId,
        startDate,
        endDate,
        granularity: SnapshotGranularity.DAILY,
      });

      if (dailySnapshots.length === 0) {
        this.logger.warn(`No DAILY snapshots found for portfolio ${portfolioId} in date range ${startDate.toISOString()} to ${endDate.toISOString()}`);
        return [];
      }

      // Generate date range based on granularity
      const dateRange = this.generateDateRangeFromMinDate(startDate, endDate, granularity);
      
      // Group daily snapshots by date
      const snapshotsByDate = new Map<string, AssetAllocationSnapshot[]>();
      dailySnapshots.forEach(snapshot => {
        const snapshotDate = snapshot.snapshotDate instanceof Date 
          ? snapshot.snapshotDate 
          : new Date(snapshot.snapshotDate);
        const dateKey = snapshotDate.toISOString().split('T')[0];
        
        if (!snapshotsByDate.has(dateKey)) {
          snapshotsByDate.set(dateKey, []);
        }
        snapshotsByDate.get(dateKey)!.push(snapshot);
      });

      // Process each date with carry-forward logic
      const timelineData: { date: string; [key: string]: string | number }[] = [];
      let lastAllocation: { [assetType: string]: number } = {};

      for (const date of dateRange) {
        const dateKey = date.toISOString().split('T')[0];
        
        // For MONTHLY granularity, use the last day of the month
        let searchDate = dateKey;
        if (granularity === SnapshotGranularity.MONTHLY) {
          const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          searchDate = lastDayOfMonth.toISOString().split('T')[0];
        }
        
        // For WEEKLY granularity, find the closest day in that week
        if (granularity === SnapshotGranularity.WEEKLY) {
          // Find the closest day within 7 days
          let foundDate = null;
          for (let i = 0; i < 7; i++) {
            const checkDate = new Date(date);
            checkDate.setDate(checkDate.getDate() + i);
            const checkDateKey = checkDate.toISOString().split('T')[0];
            if (snapshotsByDate.has(checkDateKey)) {
              foundDate = checkDateKey;
              break;
            }
          }
          if (foundDate) {
            searchDate = foundDate;
          }
        }

        const daySnapshots = snapshotsByDate.get(searchDate) || [];
        let currentAllocation: { [assetType: string]: number } = {};

        if (daySnapshots.length > 0) {
          // Calculate allocation from snapshot data for this day
          currentAllocation = await this.calculateAnalyticsAllocationFromSnapshots(daySnapshots);
          lastAllocation = { ...currentAllocation }; // Update last known allocation
        } else {
          // Simple carry-forward: use last known allocation
          currentAllocation = { ...lastAllocation };
        }

        // Add data point for each date
        const dataPoint: { date: string; [key: string]: string | number } = {
          date: dateKey,
        };
        
        // Add allocation percentages if we have any
        if (Object.keys(currentAllocation).length > 0) {
          Object.keys(currentAllocation).forEach(assetType => {
            dataPoint[assetType] = currentAllocation[assetType];
          });
        }
        
        timelineData.push(dataPoint);
      }

      return timelineData;
    } catch (error) {
      this.logger.error(`Error generating timeline from daily snapshots: ${error.message}`);
      return [];
    }
  }

  /**
   * Generate timeline data from current positions when no snapshots are available
   */
  private async generateTimelineDataFromCurrentPositions(
    portfolioId: string,
    startDate: Date,
    endDate: Date,
    granularity: SnapshotGranularity
  ): Promise<{ date: string; [key: string]: string | number }[]> {
    try {
      // Get current positions from portfolio service
      const positions = await this.getCurrentPositionsFromPortfolio(portfolioId);
      
      if (!positions || positions.length === 0) {
        return this.generateEmptyTimelineData(startDate, endDate, granularity);
      }

      // Calculate current allocation from positions
      const currentAllocation = this.calculateAllocationFromPositions(positions);
      
      // Generate date range
      const dateRange = this.generateAnalyticsDateRange(startDate, endDate, granularity);
      
      // Return the same allocation for all dates
      return dateRange.map(date => {
        const dataPoint: { date: string; [key: string]: string | number } = {
          date: date.toISOString().split('T')[0],
        };
        
        // Add current allocation percentages
        Object.keys(currentAllocation).forEach(assetType => {
          dataPoint[assetType] = currentAllocation[assetType];
        });
        
        return dataPoint;
      });
    } catch (error) {
      this.logger.error(`Error generating timeline data from current positions: ${error.message}`);
      return this.generateEmptyTimelineData(startDate, endDate, granularity);
    }
  }

  /**
   * Get current positions from portfolio (simplified version)
   */
  private async getCurrentPositionsFromPortfolio(portfolioId: string): Promise<any[]> {
    try {
      // This is a simplified version - in real implementation, you'd use PortfolioCalculationService
      // For now, return mock data based on what we know from the API
      return [
        { assetType: 'STOCK', currentValue: 190000000 },
        { assetType: 'GOLD', currentValue: 70000000 },
        { assetType: 'BOND', currentValue: 40000000 }
      ];
    } catch (error) {
      this.logger.error(`Error getting current positions: ${error.message}`);
      return [];
    }
  }

  /**
   * Calculate allocation from positions
   */
  private calculateAllocationFromPositions(positions: any[]): { [assetType: string]: number } {
    const allocation: { [assetType: string]: number } = {};
    
    // Calculate total value
    const totalValue = positions.reduce((sum, position) => sum + (position.currentValue || 0), 0);
    
    if (totalValue <= 0) {
      return {};
    }

    // Group by asset type and calculate percentages
    const assetTypeMap = new Map<string, number>();

    positions.forEach(position => {
      const assetType = position.assetType || 'UNKNOWN';
      const value = position.currentValue || 0;
      
      if (!assetTypeMap.has(assetType)) {
        assetTypeMap.set(assetType, 0);
      }
      assetTypeMap.set(assetType, assetTypeMap.get(assetType)! + value);
    });

    // Convert to percentages
    assetTypeMap.forEach((value, assetType) => {
      allocation[assetType] = Number(((value / totalValue) * 100).toFixed(2));
    });

    return allocation;
  }


  /**
   * Calculate asset allocation from snapshot data (analytics version)
   */
  private async calculateAnalyticsAllocationFromSnapshots(snapshots: AssetAllocationSnapshot[]): Promise<{ [assetType: string]: number }> {
    const allocation: { [assetType: string]: number } = {};
    const assetTypeMap = new Map<string, { value: number; count: number }>();

    // Get asset types from database for each snapshot
    for (const snapshot of snapshots) {
      try {
        // Get asset type from database using assetId
        const asset = await this.assetService.findById(snapshot.assetId);
        if (!asset) {
          this.logger.warn(`Asset not found for ID: ${snapshot.assetId}, using symbol mapping as fallback`);
          // Fallback to symbol mapping if asset not found
          const assetType = this.getAnalyticsAssetTypeFromSymbol(snapshot.assetSymbol);
          if (!assetTypeMap.has(assetType)) {
            assetTypeMap.set(assetType, { value: 0, count: 0 });
          }
          const current = assetTypeMap.get(assetType)!;
          current.value += Number(snapshot.currentValue || 0);
          current.count += 1;
          continue;
        }

        const assetType = asset.type; // Use actual asset type from database
        this.logger.debug(`Asset ${snapshot.assetSymbol} (${snapshot.assetId}) has type: ${assetType}`);
        
        if (!assetTypeMap.has(assetType)) {
          assetTypeMap.set(assetType, { value: 0, count: 0 });
        }
        const current = assetTypeMap.get(assetType)!;
        // Use snapshot values instead of real-time calculations
        current.value += Number(snapshot.currentValue || 0);
        current.count += 1;
      } catch (error) {
        this.logger.error(`Error getting asset type for snapshot ${snapshot.id}:`, error);
        // Fallback to symbol mapping
        const assetType = this.getAnalyticsAssetTypeFromSymbol(snapshot.assetSymbol);
        if (!assetTypeMap.has(assetType)) {
          assetTypeMap.set(assetType, { value: 0, count: 0 });
        }
        const current = assetTypeMap.get(assetType)!;
        current.value += Number(snapshot.currentValue || 0);
        current.count += 1;
      }
    }

    // Calculate total value from snapshots
    const totalValue = snapshots.reduce((sum, snapshot) => sum + Number(snapshot.currentValue || 0), 0);

    // Convert to percentages
    assetTypeMap.forEach((data, assetType) => {
      allocation[assetType] = totalValue > 0 
        ? Number(((data.value / totalValue) * 100).toFixed(4)) 
        : 0;
    });

    this.logger.debug(`Calculated allocation from snapshots:`, allocation);
    return allocation;
  }

  /**
   * Generate date range for analytics (internal method)
   * Now limits data points based on granularity to prevent excessive data
   */
  private generateAnalyticsDateRange(startDate: Date, endDate: Date, granularity: SnapshotGranularity): Date[] {
    const dates: Date[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    // Set maximum data points based on granularity to prevent excessive data
    let maxPoints: number;
    switch (granularity) {
      case SnapshotGranularity.DAILY:
        maxPoints = 30; // Max 30 days for daily granularity
        break;
      case SnapshotGranularity.WEEKLY:
        maxPoints = 12; // Max 12 weeks for weekly granularity
        break;
      case SnapshotGranularity.MONTHLY:
        maxPoints = 12; // Max 12 months for monthly granularity
        break;
      default:
        maxPoints = 30;
    }

    // For better performance, calculate the actual range and limit it
    const allDates: Date[] = [];
    const tempCurrent = new Date(current);
    
    // Generate all possible dates first
    while (tempCurrent <= end) {
      allDates.push(new Date(tempCurrent));
      
      switch (granularity) {
        case SnapshotGranularity.DAILY:
          tempCurrent.setDate(tempCurrent.getDate() + 1);
          break;
        case SnapshotGranularity.WEEKLY:
          tempCurrent.setDate(tempCurrent.getDate() + 7);
          break;
        case SnapshotGranularity.MONTHLY:
          tempCurrent.setMonth(tempCurrent.getMonth() + 1);
          break;
        default:
          tempCurrent.setDate(tempCurrent.getDate() + 1);
      }
    }

    // Take only the last maxPoints dates (most recent data)
    // But ensure we don't cut off the current date if it's in the range
    const currentDate = new Date().toISOString().split('T')[0];
    const hasCurrentDate = allDates.some(date => date.toISOString().split('T')[0] === currentDate);
    
    let startIndex = Math.max(0, allDates.length - maxPoints);
    
    // If current date is in the range and would be cut off, adjust startIndex
    if (hasCurrentDate) {
      const currentDateIndex = allDates.findIndex(date => date.toISOString().split('T')[0] === currentDate);
      if (currentDateIndex >= 0 && currentDateIndex < startIndex) {
        startIndex = currentDateIndex;
      }
    }
    
    return allDates.slice(startIndex);
  }

  /**
   * Get asset type from symbol for analytics (internal method)
   */
  private getAnalyticsAssetTypeFromSymbol(symbol: string): string {
    // Enhanced mapping based on actual portfolio data
    const symbolUpper = symbol.toUpperCase();
    
    this.logger.debug(`Mapping symbol: ${symbol} -> ${symbolUpper}`);
    
    // Gold symbols (based on actual data: DOJI = 71,390,000 ₫)
    if (symbolUpper.includes('GOLD') || symbolUpper.includes('AU') || symbolUpper === 'DOJI') {
      this.logger.debug(`Symbol ${symbol} mapped to GOLD`);
      return 'GOLD';
    } 
    // Bond symbols (based on actual data: SSIBF = 39,722,165 ₫)
    else if (symbolUpper.includes('BOND') || symbolUpper.includes('TP') || symbolUpper === 'SSIBF') {
      this.logger.debug(`Symbol ${symbol} mapped to BOND`);
      return 'BOND';
    } 
    // Cash symbols
    else if (symbolUpper.includes('CASH') || symbolUpper.includes('VND')) {
      this.logger.debug(`Symbol ${symbol} mapped to CASH`);
      return 'CASH';
    } 
    // Deposit symbols
    else if (symbolUpper.includes('DEPOSIT') || symbolUpper.includes('TG')) {
      this.logger.debug(`Symbol ${symbol} mapped to DEPOSIT`);
      return 'DEPOSIT';
    } 
    // All other symbols are treated as STOCK (SSISCA, FPT, DWG, 9999, VEOF, etc.)
    else {
      this.logger.debug(`Symbol ${symbol} mapped to STOCK (default)`);
      return 'STOCK';
    }
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
    
    return await this.snapshotRepo.findPortfoliosWithSnapshots();
  }

  /**
   * Update snapshot
   */
  async updateSnapshot(id: string, updateDto: UpdateSnapshotDto): Promise<AssetAllocationSnapshot> {

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

    return updatedSnapshot;
  }

  /**
   * Soft delete snapshot
   */
  async deleteSnapshot(id: string): Promise<boolean> {

    const success = await this.snapshotRepo.softDelete(id);
    if (!success) {
      throw new NotFoundException(`Snapshot with ID ${id} not found`);
    }

    return true;
  }

  /**
   * Hard delete snapshot
   */
  async hardDeleteSnapshot(id: string): Promise<boolean> {

    const success = await this.snapshotRepo.delete(id);
    if (!success) {
      throw new NotFoundException(`Snapshot with ID ${id} not found`);
    }

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
    } catch (error) {
      this.logger.warn(`Failed to delete portfolio snapshots: ${error.message}`);
      // Continue even if portfolio snapshot deletion fails
    }

    const message = `Successfully deleted ${deletedCount} snapshots for portfolio ${portfolioId} from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}${granularity ? ` with granularity ${granularity}` : ''}`;
    
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

}
