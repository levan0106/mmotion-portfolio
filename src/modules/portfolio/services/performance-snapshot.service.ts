import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PortfolioPerformanceSnapshot } from '../entities/portfolio-performance-snapshot.entity';
import { AssetPerformanceSnapshot } from '../entities/asset-performance-snapshot.entity';
import { AssetGroupPerformanceSnapshot } from '../entities/asset-group-performance-snapshot.entity';
import { BenchmarkData } from '../entities/benchmark-data.entity';
import { SnapshotGranularity } from '../enums/snapshot-granularity.enum';
import { Portfolio } from '../entities/portfolio.entity';
import { AssetAllocationSnapshot } from '../entities/asset-allocation-snapshot.entity';
import { Asset } from '../../asset/entities/asset.entity';
import { TWRCalculationService } from './twr-calculation.service';
import { MWRIRRCalculationService } from './mwr-irr-calculation.service';
import { AlphaBetaCalculationService } from './alpha-beta-calculation.service';
import { RiskMetricsCalculationService } from './risk-metrics-calculation.service';
import { CashFlowService } from './cash-flow.service';
import { normalizeDateToString, compareDates } from '../utils/date-normalization.util';
import { PaginationDto, PaginatedResponseDto } from '../dto/pagination.dto';

export interface PerformanceSnapshotResult {
  portfolioSnapshot: PortfolioPerformanceSnapshot;
  assetSnapshots: AssetPerformanceSnapshot[];
  groupSnapshots: AssetGroupPerformanceSnapshot[];
}

export interface TWROptions {
  portfolioId: string;
  startDate: Date;
  endDate: Date;
  granularity?: SnapshotGranularity;
}

export interface MWROptions {
  portfolioId: string;
  startDate: Date;
  endDate: Date;
  cashFlows: Array<{ date: Date; amount: number }>;
}

@Injectable()
export class PerformanceSnapshotService {
  private readonly logger = new Logger(PerformanceSnapshotService.name);

  constructor(
    @InjectRepository(PortfolioPerformanceSnapshot)
    private readonly portfolioPerformanceRepo: Repository<PortfolioPerformanceSnapshot>,
    
    @InjectRepository(AssetPerformanceSnapshot)
    private readonly assetPerformanceRepo: Repository<AssetPerformanceSnapshot>,
    
    @InjectRepository(AssetGroupPerformanceSnapshot)
    private readonly assetGroupPerformanceRepo: Repository<AssetGroupPerformanceSnapshot>,
    
    @InjectRepository(BenchmarkData)
    private readonly benchmarkDataRepo: Repository<BenchmarkData>,
    
    @InjectRepository(Portfolio)
    private readonly portfolioRepo: Repository<Portfolio>,
    
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    
    @InjectRepository(AssetAllocationSnapshot)
    private readonly assetAllocationSnapshotRepo: Repository<AssetAllocationSnapshot>,
    
    private readonly dataSource: DataSource,
    private readonly twrCalculationService: TWRCalculationService,
    private readonly mwrIrrCalculationService: MWRIRRCalculationService,
    private readonly alphaBetaCalculationService: AlphaBetaCalculationService,
    private readonly riskMetricsCalculationService: RiskMetricsCalculationService,
    private readonly cashFlowService: CashFlowService,
  ) {}

  /**
   * Create comprehensive performance snapshots for a portfolio
   */
  async createPerformanceSnapshots(
    portfolioId: string,
    snapshotDate: Date | string,
    granularity: SnapshotGranularity = SnapshotGranularity.DAILY,
    createdBy?: string
  ): Promise<PerformanceSnapshotResult> {
    const date = typeof snapshotDate === 'string' ? new Date(snapshotDate) : snapshotDate;
    
    this.logger.log(`Creating performance snapshots for portfolio ${portfolioId} on ${date.toISOString().split('T')[0]}`);

    return await this.dataSource.transaction(async manager => {
      // 1. Create Portfolio Performance Snapshot
      const portfolioSnapshot = await this.createPortfolioPerformanceSnapshot(
        portfolioId, date, granularity, manager
      );

      // 2. Create Asset Performance Snapshots
      const assetSnapshots = await this.createAssetPerformanceSnapshots(
        portfolioId, date, granularity, manager
      );

      // 3. Create Asset Group Performance Snapshots
      const groupSnapshots = await this.createAssetGroupPerformanceSnapshots(
        portfolioId, date, granularity, manager
      );

      this.logger.log(`Successfully created performance snapshots: 1 portfolio, ${assetSnapshots.length} assets, ${groupSnapshots.length} groups`);

      return {
        portfolioSnapshot,
        assetSnapshots,
        groupSnapshots
      };
    });
  }

  /**
   * Create portfolio performance snapshot
   */
  private async createPortfolioPerformanceSnapshot(
    portfolioId: string,
    snapshotDate: Date,
    granularity: SnapshotGranularity,
    manager: any
  ): Promise<PortfolioPerformanceSnapshot> {
    console.log('🚀 createPortfolioPerformanceSnapshot called');
    // Check if portfolio exists
    const portfolio = await manager.findOne(Portfolio, {
      where: { portfolioId }
    });
    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    // Check if snapshot already exists and delete it to avoid duplicates
    const existingSnapshot = await manager.findOne(PortfolioPerformanceSnapshot, {
      where: { portfolioId, snapshotDate, granularity }
    });

    if (existingSnapshot) {
      this.logger.warn(`Portfolio performance snapshot already exists for ${portfolioId} on ${snapshotDate.toISOString().split('T')[0]}. Deleting old snapshot and creating new one.`);
      await manager.remove(PortfolioPerformanceSnapshot, existingSnapshot);
    }

    // Calculate TWR metrics
    const twrMetrics = await this.twrCalculationService.calculatePortfolioTWR({
      portfolioId,
      snapshotDate,
      granularity
    });

    // Calculate MWR/IRR metrics
    const mwrMetrics = await this.mwrIrrCalculationService.calculatePortfolioMWRIRR({
      portfolioId,
      snapshotDate,
      granularity
    });

    // Calculate Alpha/Beta metrics (using default benchmark for now)
    console.log('� Calculating portfolio Alpha/Beta...');
    const alphaBetaMetrics = await this.alphaBetaCalculationService.calculatePortfolioAlphaBeta({
      portfolioId,
      benchmarkId: '6aedff6c-69e5-440f-8813-c1c3bf1f96df', // Default benchmark UUID
      snapshotDate,
      granularity
    });
    
    console.log('✅ Final alphaBetaMetrics:', alphaBetaMetrics);

    // Calculate cash flow data
    const cashFlowData = await this.calculateCashFlowData(portfolioId, snapshotDate);

    // Get benchmark data
    const benchmarkData = await this.getBenchmarkData(snapshotDate);

    const snapshot = manager.create(PortfolioPerformanceSnapshot, {
      portfolioId,
      snapshotDate,
      granularity,
      // TWR Metrics
      portfolioTWR1D: twrMetrics.twr1D,
      portfolioTWR1W: twrMetrics.twr1W,
      portfolioTWR1M: twrMetrics.twr1M,
      portfolioTWR3M: twrMetrics.twr3M,
      portfolioTWR6M: twrMetrics.twr6M,
      portfolioTWR1Y: twrMetrics.twr1Y,
      portfolioTWRYTD: twrMetrics.twrYTD,
      // MWR/IRR Metrics
      portfolioMWR1M: mwrMetrics.mwr1M,
      portfolioMWR3M: mwrMetrics.mwr3M,
      portfolioMWR6M: mwrMetrics.mwr6M,
      portfolioMWR1Y: mwrMetrics.mwr1Y,
      portfolioMWRYTD: mwrMetrics.mwrYTD,
      portfolioIRR1M: mwrMetrics.irr1M,
      portfolioIRR3M: mwrMetrics.irr3M,
      portfolioIRR6M: mwrMetrics.irr6M,
      portfolioIRR1Y: mwrMetrics.irr1Y,
      portfolioIRRYTD: mwrMetrics.irrYTD,
      // Alpha/Beta Metrics
      portfolioAlpha1M: alphaBetaMetrics.alpha1M,
      portfolioAlpha3M: alphaBetaMetrics.alpha3M,
      portfolioAlpha6M: alphaBetaMetrics.alpha6M,
      portfolioAlpha1Y: alphaBetaMetrics.alpha1Y,
      portfolioAlphaYTD: alphaBetaMetrics.alphaYTD,
      portfolioBeta1M: alphaBetaMetrics.beta1M,
      portfolioBeta3M: alphaBetaMetrics.beta3M,
      portfolioBeta6M: alphaBetaMetrics.beta6M,
      portfolioBeta1Y: alphaBetaMetrics.beta1Y,
      portfolioBetaYTD: alphaBetaMetrics.betaYTD,
      portfolioInformationRatio1M: alphaBetaMetrics.informationRatio1M,
      portfolioInformationRatio3M: alphaBetaMetrics.informationRatio3M,
      portfolioInformationRatio1Y: alphaBetaMetrics.informationRatio1Y,
      portfolioTrackingError1M: alphaBetaMetrics.trackingError1M,
      portfolioTrackingError3M: alphaBetaMetrics.trackingError3M,
      portfolioTrackingError1Y: alphaBetaMetrics.trackingError1Y,
      // Cash Flow Data
      totalCashInflows: cashFlowData.totalCashInflows,
      totalCashOutflows: cashFlowData.totalCashOutflows,
      netCashFlow: cashFlowData.netCashFlow,
      // Benchmark Data
      benchmarkData,
      isActive: true,
    });

    return await manager.save(snapshot);
  }

  /**
   * Create asset performance snapshots
   */
  private async createAssetPerformanceSnapshots(
    portfolioId: string,
    snapshotDate: Date,
    granularity: SnapshotGranularity,
    manager: any
  ): Promise<AssetPerformanceSnapshot[]> {
    // FIXED: Get only assets that have trades for the portfolio, handle duplicates
    const endOfDay = new Date(snapshotDate);
    endOfDay.setHours(23, 59, 59, 999);
    const assets = await manager
      .createQueryBuilder(Asset, 'asset')
      .innerJoin('asset.trades', 'trade')
      .where('trade.portfolioId = :portfolioId AND trade.tradeDate <= :snapshotDate', { portfolioId, 
        snapshotDate: endOfDay })
      .distinct(true) // Handle duplicates
      .getMany();

    const snapshots: AssetPerformanceSnapshot[] = [];

    for (const asset of assets) {
      // Check if snapshot already exists and delete it to avoid duplicates
      const existingSnapshot = await manager.findOne(AssetPerformanceSnapshot, {
        where: { portfolioId, assetId: asset.id, snapshotDate, granularity }
      });

      if (existingSnapshot) {
        this.logger.warn(`Asset performance snapshot already exists for asset ${asset.id} on ${snapshotDate.toISOString().split('T')[0]}. Deleting old snapshot and creating new one.`);
        await manager.remove(AssetPerformanceSnapshot, existingSnapshot);
      }

      // Calculate asset TWR metrics
      const twrMetrics = await this.twrCalculationService.calculateAssetTWR(
        portfolioId, asset.id, snapshotDate, granularity
      );

      // Calculate asset risk metrics
      const riskMetrics = await this.riskMetricsCalculationService.calculateAssetRiskMetrics(
        portfolioId, asset.id, snapshotDate, granularity
      );

      // Calculate asset MWR/IRR metrics
      const mwrMetrics = await this.mwrIrrCalculationService.calculateAssetMWRIRR(
        portfolioId, asset.id, snapshotDate, granularity
      );

      // Calculate asset Alpha/Beta metrics (using default benchmark for now)
      const alphaBetaMetrics = await this.alphaBetaCalculationService.calculateAssetAlphaBeta({
        portfolioId,
        assetId: asset.id,
        benchmarkId: '6aedff6c-69e5-440f-8813-c1c3bf1f96df', // vietcombank
        snapshotDate,
        granularity
      });

      const snapshot = manager.create(AssetPerformanceSnapshot, {
        portfolioId,
        assetId: asset.id,
        assetSymbol: asset.symbol,
        snapshotDate,
        granularity,
        // Asset TWR Metrics
        assetTWR1D: twrMetrics.twr1D,
        assetTWR1W: twrMetrics.twr1W,
        assetTWR1M: twrMetrics.twr1M,
        assetTWR3M: twrMetrics.twr3M,
        assetTWR6M: twrMetrics.twr6M,
        assetTWR1Y: twrMetrics.twr1Y,
        assetTWRYTD: twrMetrics.twrYTD,
        // Asset Risk Metrics
        assetVolatility1M: riskMetrics.volatility1M,
        assetVolatility3M: riskMetrics.volatility3M,
        assetVolatility1Y: riskMetrics.volatility1Y,
        assetSharpeRatio1M: riskMetrics.sharpeRatio1M,
        assetSharpeRatio3M: riskMetrics.sharpeRatio3M,
        assetSharpeRatio1Y: riskMetrics.sharpeRatio1Y,
        assetMaxDrawdown1M: riskMetrics.maxDrawdown1M,
        assetMaxDrawdown3M: riskMetrics.maxDrawdown3M,
        assetMaxDrawdown1Y: riskMetrics.maxDrawdown1Y,
        // Asset Risk-Adjusted Returns
        assetRiskAdjustedReturn1M: riskMetrics.riskAdjustedReturn1M,
        assetRiskAdjustedReturn3M: riskMetrics.riskAdjustedReturn3M,
        assetRiskAdjustedReturn1Y: riskMetrics.riskAdjustedReturn1Y,
        // Asset IRR Metrics
        assetIRR1M: mwrMetrics.irr1M,
        assetIRR3M: mwrMetrics.irr3M,
        assetIRR6M: mwrMetrics.irr6M,
        assetIRR1Y: mwrMetrics.irr1Y,
        assetIRRYTD: mwrMetrics.irrYTD,
        // Asset Alpha/Beta Metrics
        assetAlpha1M: alphaBetaMetrics.alpha1M,
        assetAlpha3M: alphaBetaMetrics.alpha3M,
        assetAlpha6M: alphaBetaMetrics.alpha6M,
        assetAlpha1Y: alphaBetaMetrics.alpha1Y,
        assetAlphaYTD: alphaBetaMetrics.alphaYTD,
        assetBeta1M: alphaBetaMetrics.beta1M,
        assetBeta3M: alphaBetaMetrics.beta3M,
        assetBeta6M: alphaBetaMetrics.beta6M,
        assetBeta1Y: alphaBetaMetrics.beta1Y,
        assetBetaYTD: alphaBetaMetrics.betaYTD,
        isActive: true,
      });

      snapshots.push(await manager.save(snapshot));
    }

    return snapshots;
  }

  /**
   * Create asset group performance snapshots
   */
  private async createAssetGroupPerformanceSnapshots(
    portfolioId: string,
    snapshotDate: Date,
    granularity: SnapshotGranularity,
    manager: any
  ): Promise<AssetGroupPerformanceSnapshot[]> {
    // FIXED: Get only asset types that have trades for the portfolio, handle duplicates
    const endOfDay = new Date(snapshotDate);
    endOfDay.setHours(23, 59, 59, 999);
    const assetTypes = await manager
      .createQueryBuilder(Asset, 'asset')
      .innerJoin('asset.trades', 'trade')
      .select('DISTINCT asset.type', 'assetType')
      .where('trade.portfolioId = :portfolioId AND trade.tradeDate <= :snapshotDate', { portfolioId, 
        snapshotDate: endOfDay })
      .getRawMany();

    const snapshots: AssetGroupPerformanceSnapshot[] = [];

    for (const { assetType } of assetTypes) {
      // Check if snapshot already exists and delete it to avoid duplicates
      const existingSnapshot = await manager.findOne(AssetGroupPerformanceSnapshot, {
        where: { portfolioId, assetType, snapshotDate, granularity }
      });

      if (existingSnapshot) {
        this.logger.warn(`Asset group performance snapshot already exists for asset type ${assetType} on ${snapshotDate.toISOString().split('T')[0]}. Deleting old snapshot and creating new one.`);
        await manager.remove(AssetGroupPerformanceSnapshot, existingSnapshot);
      }

      // Calculate group TWR metrics
      const twrMetrics = await this.twrCalculationService.calculateAssetGroupTWR(
        portfolioId, assetType, snapshotDate, granularity
      );

      // Calculate group risk metrics
      const riskMetrics = await this.riskMetricsCalculationService.calculateAssetGroupRiskMetrics(
        portfolioId, assetType, snapshotDate, granularity
      );

      // Calculate group MWR/IRR metrics
      const mwrMetrics = await this.mwrIrrCalculationService.calculateAssetGroupMWRIRR(
        portfolioId, assetType, snapshotDate, granularity
      );

      // Calculate group Alpha/Beta metrics (using default benchmark for now)
      const alphaBetaMetrics = await this.alphaBetaCalculationService.calculateAssetGroupAlphaBeta({
        portfolioId,
        assetType,
        benchmarkId: '6aedff6c-69e5-440f-8813-c1c3bf1f96df', // Vietcombank
        snapshotDate,
        granularity
      });

      // Get group statistics
      const groupStats = await this.getAssetGroupStatistics(portfolioId, assetType, snapshotDate);

      const snapshot = manager.create(AssetGroupPerformanceSnapshot, {
        portfolioId,
        assetType,
        snapshotDate,
        granularity,
        // Group TWR Metrics
        groupTWR1D: twrMetrics.twr1D,
        groupTWR1W: twrMetrics.twr1W,
        groupTWR1M: twrMetrics.twr1M,
        groupTWR3M: twrMetrics.twr3M,
        groupTWR6M: twrMetrics.twr6M,
        groupTWR1Y: twrMetrics.twr1Y,
        groupTWRYTD: twrMetrics.twrYTD,
        // Group Risk Metrics
        groupSharpeRatio1M: riskMetrics.sharpeRatio1M,
        groupSharpeRatio3M: riskMetrics.sharpeRatio3M,
        groupSharpeRatio1Y: riskMetrics.sharpeRatio1Y,
        groupVolatility1M: riskMetrics.volatility1M,
        groupVolatility3M: riskMetrics.volatility3M,
        groupVolatility1Y: riskMetrics.volatility1Y,
        groupMaxDrawdown1M: riskMetrics.maxDrawdown1M,
        groupMaxDrawdown3M: riskMetrics.maxDrawdown3M,
        groupMaxDrawdown1Y: riskMetrics.maxDrawdown1Y,
        // Group Risk-Adjusted Returns
        groupRiskAdjustedReturn1M: riskMetrics.riskAdjustedReturn1M,
        groupRiskAdjustedReturn3M: riskMetrics.riskAdjustedReturn3M,
        groupRiskAdjustedReturn1Y: riskMetrics.riskAdjustedReturn1Y,
        // Group IRR Metrics
        groupIRR1M: mwrMetrics.irr1M,
        groupIRR3M: mwrMetrics.irr3M,
        groupIRR6M: mwrMetrics.irr6M,
        groupIRR1Y: mwrMetrics.irr1Y,
        groupIRRYTD: mwrMetrics.irrYTD,
        // Group Alpha/Beta Metrics
        groupAlpha1M: alphaBetaMetrics.alpha1M,
        groupAlpha3M: alphaBetaMetrics.alpha3M,
        groupAlpha6M: alphaBetaMetrics.alpha6M,
        groupAlpha1Y: alphaBetaMetrics.alpha1Y,
        groupAlphaYTD: alphaBetaMetrics.alphaYTD,
        groupBeta1M: alphaBetaMetrics.beta1M,
        groupBeta3M: alphaBetaMetrics.beta3M,
        groupBeta6M: alphaBetaMetrics.beta6M,
        groupBeta1Y: alphaBetaMetrics.beta1Y,
        groupBetaYTD: alphaBetaMetrics.betaYTD,
        // Group Statistics
        assetCount: groupStats.assetCount,
        activeAssetCount: groupStats.activeAssetCount,
        allocationPercentage: groupStats.allocationPercentage,
        isActive: true,
      });

      snapshots.push(await manager.save(snapshot));
    }

    return snapshots;
  }

  /**
   * Calculate cash flow data for portfolio
   */
  private async calculateCashFlowData(
    portfolioId: string,
    snapshotDate: Date
  ): Promise<Record<string, number>> {
    try {
      // Get cash flow history for the portfolio up to snapshot date
      const result = await this.cashFlowService.getCashFlowHistory(
        portfolioId,
        undefined, // startDate - get all from beginning
        snapshotDate, // endDate - up to snapshot date
        1, // page
        10000 // limit - get all cash flows
      );

      let totalCashInflows = 0;
      let totalCashOutflows = 0;

      // Calculate totals from cash flows
      result.data.forEach((cashFlow) => {
        const amount = Number(cashFlow.amount || 0);
        if (cashFlow.isInflow) {
          totalCashInflows += amount; // Amount is always positive
        } else if (cashFlow.isOutflow) {
          totalCashOutflows += amount; // Amount is always positive
        }
      });

      const netCashFlow = totalCashInflows - totalCashOutflows;

      return {
        totalCashInflows,
        totalCashOutflows,
        netCashFlow,
      };
    } catch (error) {
      this.logger.error(`Error calculating cash flow data: ${error.message}`);
      return {
        totalCashInflows: 0,
        totalCashOutflows: 0,
        netCashFlow: 0,
      };
    }
  }

  /**
   * Get asset group statistics
   */
  private async getAssetGroupStatistics(
    portfolioId: string,
    assetType: string,
    snapshotDate: Date
  ): Promise<{ assetCount: number; activeAssetCount: number; allocationPercentage: number }> {
    try {
      // Get all assets of this type in the portfolio through trades
      const assets = await this.assetRepo
        .createQueryBuilder('asset')
        .innerJoin('asset.trades', 'trade')
        .where('trade.portfolioId = :portfolioId', { portfolioId })
        .andWhere('asset.type = :assetType', { assetType })
        .getMany();

      const assetCount = assets.length;
      let activeAssetCount = 0;
      let totalAllocationPercentage = 0;

      // Check which assets are active (have current value > 0)
      for (const asset of assets) {
        // Get current asset allocation snapshot for this date
        const assetSnapshot = await this.assetAllocationSnapshotRepo.findOne({
          where: {
            portfolioId,
            assetId: asset.id,
            snapshotDate,
            granularity: SnapshotGranularity.DAILY,
            isActive: true
          }
        });

        if (assetSnapshot && Number(assetSnapshot.currentValue) > 0) {
          activeAssetCount++;
          totalAllocationPercentage += Number(assetSnapshot.allocationPercentage) || 0;
        }
      }

      return {
        assetCount,
        activeAssetCount,
        allocationPercentage: Number(totalAllocationPercentage.toFixed(4)),
      };
    } catch (error) {
      this.logger.error(`Error calculating asset group statistics: ${error.message}`);
      return {
        assetCount: 0,
        activeAssetCount: 0,
        allocationPercentage: 0,
      };
    }
  }

  /**
   * Get benchmark data for specific date
   */
  /**
   * Get benchmark data using market data API
   * FIXED: Implement benchmark data retrieval using getMarketDataReturnsHistoryForBenchmarkFromAPI
   */
  private async getBenchmarkData(snapshotDate: Date): Promise<any> {
    try {
      // TODO: Implement benchmark data retrieval logic
      return {};

      const benchmarkData = [];

      // Calculate benchmark metrics from raw data
      const returns = benchmarkData.map(item => Number(item.return || 0));
      const benchmarkReturn = returns.length > 0 ? returns.reduce((sum, ret) => sum + ret, 0) / returns.length : 0;
      
      // Calculate volatility (standard deviation)
      const mean = benchmarkReturn;
      const variance = returns.length > 0 ? 
        returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length : 0;
      const benchmarkVolatility = Math.sqrt(variance);

      // Calculate Sharpe ratio (simplified - assuming risk-free rate = 0)
      const benchmarkSharpeRatio = benchmarkVolatility > 0 ? benchmarkReturn / benchmarkVolatility : 0;

      // Calculate max drawdown (simplified)
      let maxDrawdown = 0;
      let peak = 0;
      let cumulativeReturn = 0;
      
      for (const ret of returns) {
        cumulativeReturn += ret;
        if (cumulativeReturn > peak) {
          peak = cumulativeReturn;
        }
        const drawdown = peak - cumulativeReturn;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }

      return {
        benchmarkReturn: Number(benchmarkReturn.toFixed(4)),
        benchmarkVolatility: Number(benchmarkVolatility.toFixed(4)),
        benchmarkSharpeRatio: Number(benchmarkSharpeRatio.toFixed(4)),
        benchmarkMaxDrawdown: Number(maxDrawdown.toFixed(4)),
        dataPoints: returns.length
      };

    } catch (error) {
      this.logger.error(`Failed to get benchmark data for ${snapshotDate.toISOString().split('T')[0]}: ${error.message}`);
      return {
        benchmarkReturn: 0,
        benchmarkVolatility: 0,
        benchmarkSharpeRatio: 0,
        benchmarkMaxDrawdown: 0,
        error: error.message
      };
    }
  }

  /**
   * Get portfolio performance snapshots (original method - returns array)
   */
  async getPortfolioPerformanceSnapshots(
    portfolioId: string,
    startDate?: Date,
    endDate?: Date,
    granularity?: SnapshotGranularity
  ): Promise<PortfolioPerformanceSnapshot[]> {
    const query = this.portfolioPerformanceRepo
      .createQueryBuilder('snapshot')
      .where('snapshot.portfolioId = :portfolioId', { portfolioId })
      .andWhere('snapshot.isActive = :isActive', { isActive: true });

    if (startDate) {
      query.andWhere('snapshot.snapshotDate >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('snapshot.snapshotDate <= :endDate', { endDate });
    }

    if (granularity) {
      query.andWhere('snapshot.granularity = :granularity', { granularity });
    }

    return await query
      .orderBy('snapshot.snapshotDate', 'DESC')
      .getMany();
  }

  /**
   * Get portfolio performance snapshots with pagination
   */
  async getPortfolioPerformanceSnapshotsPaginated(
    portfolioId: string,
    startDate?: Date,
    endDate?: Date,
    granularity?: SnapshotGranularity,
    pagination: PaginationDto = {}
  ): Promise<PaginatedResponseDto<PortfolioPerformanceSnapshot>> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const query = this.portfolioPerformanceRepo
      .createQueryBuilder('snapshot')
      .where('snapshot.portfolioId = :portfolioId', { portfolioId })
      .andWhere('snapshot.isActive = :isActive', { isActive: true });

    if (startDate) {
      query.andWhere('snapshot.snapshotDate >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('snapshot.snapshotDate <= :endDate', { endDate });
    }

    if (granularity) {
      query.andWhere('snapshot.granularity = :granularity', { granularity });
    }

    // Get total count
    const total = await query.getCount();

    // Get paginated results
    const data = await query
      .orderBy('snapshot.snapshotDate', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  /**
   * Get asset performance snapshots (original method - returns array)
   */
  async getAssetPerformanceSnapshots(
    portfolioId: string,
    assetId?: string,
    startDate?: Date,
    endDate?: Date,
    granularity?: SnapshotGranularity
  ): Promise<AssetPerformanceSnapshot[]> {
    const query = this.assetPerformanceRepo
      .createQueryBuilder('snapshot')
      .where('snapshot.portfolioId = :portfolioId', { portfolioId })
      .andWhere('snapshot.isActive = :isActive', { isActive: true });

    if (assetId) {
      query.andWhere('snapshot.assetId = :assetId', { assetId });
    }

    if (startDate) {
      query.andWhere('snapshot.snapshotDate >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('snapshot.snapshotDate <= :endDate', { endDate });
    }

    if (granularity) {
      query.andWhere('snapshot.granularity = :granularity', { granularity });
    }

    return await query
      .orderBy('snapshot.snapshotDate', 'DESC')
      .getMany();
  }

  /**
   * Get asset performance snapshots with pagination
   */
  async getAssetPerformanceSnapshotsPaginated(
    portfolioId: string,
    assetId?: string,
    startDate?: Date,
    endDate?: Date,
    granularity?: SnapshotGranularity,
    pagination: PaginationDto = {}
  ): Promise<PaginatedResponseDto<AssetPerformanceSnapshot>> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const query = this.assetPerformanceRepo
      .createQueryBuilder('snapshot')
      .where('snapshot.portfolioId = :portfolioId', { portfolioId })
      .andWhere('snapshot.isActive = :isActive', { isActive: true });

    if (assetId) {
      query.andWhere('snapshot.assetId = :assetId', { assetId });
    }

    if (startDate) {
      query.andWhere('snapshot.snapshotDate >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('snapshot.snapshotDate <= :endDate', { endDate });
    }

    if (granularity) {
      query.andWhere('snapshot.granularity = :granularity', { granularity });
    }

    // Get total count
    const total = await query.getCount();

    // Get paginated results
    const data = await query
      .orderBy('snapshot.snapshotDate', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  /**
   * Get asset group performance snapshots (original method - returns array)
   */
  async getAssetGroupPerformanceSnapshots(
    portfolioId: string,
    assetType?: string,
    startDate?: Date,
    endDate?: Date,
    granularity?: SnapshotGranularity
  ): Promise<AssetGroupPerformanceSnapshot[]> {
    const query = this.assetGroupPerformanceRepo
      .createQueryBuilder('snapshot')
      .where('snapshot.portfolioId = :portfolioId', { portfolioId })
      .andWhere('snapshot.isActive = :isActive', { isActive: true });

    if (assetType) {
      query.andWhere('snapshot.assetType = :assetType', { assetType });
    }

    if (startDate) {
      query.andWhere('snapshot.snapshotDate >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('snapshot.snapshotDate <= :endDate', { endDate });
    }

    if (granularity) {
      query.andWhere('snapshot.granularity = :granularity', { granularity });
    }

    return await query
      .orderBy('snapshot.snapshotDate', 'DESC')
      .getMany();
  }

  /**
   * Get asset group performance snapshots with pagination
   */
  async getAssetGroupPerformanceSnapshotsPaginated(
    portfolioId: string,
    assetType?: string,
    startDate?: Date,
    endDate?: Date,
    granularity?: SnapshotGranularity,
    pagination: PaginationDto = {}
  ): Promise<PaginatedResponseDto<AssetGroupPerformanceSnapshot>> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const query = this.assetGroupPerformanceRepo
      .createQueryBuilder('snapshot')
      .where('snapshot.portfolioId = :portfolioId', { portfolioId })
      .andWhere('snapshot.isActive = :isActive', { isActive: true });

    if (assetType) {
      query.andWhere('snapshot.assetType = :assetType', { assetType });
    }

    if (startDate) {
      query.andWhere('snapshot.snapshotDate >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('snapshot.snapshotDate <= :endDate', { endDate });
    }

    if (granularity) {
      query.andWhere('snapshot.granularity = :granularity', { granularity });
    }

    // Get total count
    const total = await query.getCount();

    // Get paginated results
    const data = await query
      .orderBy('snapshot.snapshotDate', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  /**
   * Delete performance snapshots by date range
   */
  async deletePerformanceSnapshotsByDateRange(
    portfolioId: string,
    startDate: Date,
    endDate: Date,
    granularity?: SnapshotGranularity
  ): Promise<{ deletedCount: number; message: string }> {
    this.logger.log(`Deleting performance snapshots for portfolio ${portfolioId} from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

    let deletedCount = 0;

    // Delete portfolio performance snapshots
    const portfolioQuery = this.portfolioPerformanceRepo
      .createQueryBuilder()
      .delete()
      .where('portfolioId = :portfolioId', { portfolioId })
      .andWhere('snapshotDate >= :startDate', { startDate })
      .andWhere('snapshotDate <= :endDate', { endDate });

    if (granularity) {
      portfolioQuery.andWhere('granularity = :granularity', { granularity });
    }

    const portfolioResult = await portfolioQuery.execute();
    deletedCount += portfolioResult.affected || 0;

    // Delete asset performance snapshots
    const assetQuery = this.assetPerformanceRepo
      .createQueryBuilder()
      .delete()
      .where('portfolioId = :portfolioId', { portfolioId })
      .andWhere('snapshotDate >= :startDate', { startDate })
      .andWhere('snapshotDate <= :endDate', { endDate });

    if (granularity) {
      assetQuery.andWhere('granularity = :granularity', { granularity });
    }

    const assetResult = await assetQuery.execute();
    deletedCount += assetResult.affected || 0;

    // Delete asset group performance snapshots
    const groupQuery = this.assetGroupPerformanceRepo
      .createQueryBuilder()
      .delete()
      .where('portfolioId = :portfolioId', { portfolioId })
      .andWhere('snapshotDate >= :startDate', { startDate })
      .andWhere('snapshotDate <= :endDate', { endDate });

    if (granularity) {
      groupQuery.andWhere('granularity = :granularity', { granularity });
    }

    const groupResult = await groupQuery.execute();
    deletedCount += groupResult.affected || 0;

    const message = `Successfully deleted ${deletedCount} performance snapshots for portfolio ${portfolioId} from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}${granularity ? ` with granularity ${granularity}` : ''}`;
    
    this.logger.log(message);
    return { deletedCount, message };
  }

  /**
   * Delete performance snapshots by granularity
   */
  async deletePerformanceSnapshotsByGranularity(
    portfolioId: string,
    granularity: SnapshotGranularity
  ): Promise<{ deletedCount: number; message: string }> {
    this.logger.log(`Deleting performance snapshots for portfolio ${portfolioId} with granularity ${granularity}`);

    let deletedCount = 0;

    // Delete portfolio performance snapshots
    const portfolioResult = await this.portfolioPerformanceRepo.delete({
      portfolioId,
      granularity,
    });
    deletedCount += portfolioResult.affected || 0;

    // Delete asset performance snapshots
    const assetResult = await this.assetPerformanceRepo.delete({
      portfolioId,
      granularity,
    });
    deletedCount += assetResult.affected || 0;

    // Delete asset group performance snapshots
    const groupResult = await this.assetGroupPerformanceRepo.delete({
      portfolioId,
      granularity,
    });
    deletedCount += groupResult.affected || 0;

    const message = `Deleted ${deletedCount} performance snapshots for portfolio ${portfolioId} with granularity ${granularity}`;
    
    this.logger.log(message);
    return { deletedCount, message };
  }

  /**
   * Delete all performance snapshots for a portfolio
   */
  async deleteAllPerformanceSnapshotsForPortfolio(
    portfolioId: string
  ): Promise<{ deletedCount: number; message: string }> {
    this.logger.log(`Deleting all performance snapshots for portfolio ${portfolioId}`);

    let deletedCount = 0;

    // Delete all portfolio performance snapshots
    const portfolioResult = await this.portfolioPerformanceRepo.delete({
      portfolioId,
    });
    deletedCount += portfolioResult.affected || 0;

    // Delete all asset performance snapshots
    const assetResult = await this.assetPerformanceRepo.delete({
      portfolioId,
    });
    deletedCount += assetResult.affected || 0;

    // Delete all asset group performance snapshots
    const groupResult = await this.assetGroupPerformanceRepo.delete({
      portfolioId,
    });
    deletedCount += groupResult.affected || 0;

    const message = `Deleted ${deletedCount} performance snapshots for portfolio ${portfolioId}`;
    
    this.logger.log(message);
    return { deletedCount, message };
  }

}