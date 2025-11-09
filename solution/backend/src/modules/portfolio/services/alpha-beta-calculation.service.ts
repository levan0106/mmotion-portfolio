import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PortfolioSnapshot } from '../entities/portfolio-snapshot.entity';
import { BenchmarkData } from '../entities/benchmark-data.entity';
import { SnapshotGranularity } from '../enums/snapshot-granularity.enum';

export interface AlphaBetaCalculationResult {
  alpha1M: number;
  alpha3M: number;
  alpha6M: number;
  alpha1Y: number;
  alphaYTD: number;
  beta1M: number;
  beta3M: number;
  beta6M: number;
  beta1Y: number;
  betaYTD: number;
  informationRatio1M: number;
  informationRatio3M: number;
  informationRatio1Y: number;
  trackingError1M: number;
  trackingError3M: number;
  trackingError1Y: number;
}

export interface AlphaBetaCalculationOptions {
  portfolioId: string;
  benchmarkId: string;
  snapshotDate: Date;
  granularity?: SnapshotGranularity;
}

@Injectable()
export class AlphaBetaCalculationService {
  private readonly logger = new Logger(AlphaBetaCalculationService.name);

  constructor(
    @InjectRepository(PortfolioSnapshot)
    private readonly portfolioSnapshotRepo: Repository<PortfolioSnapshot>,
    
    @InjectRepository(BenchmarkData)
    private readonly benchmarkDataRepo: Repository<BenchmarkData>,
    
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Calculate Alpha and Beta for portfolio vs benchmark across multiple timeframes
   */
  async calculatePortfolioAlphaBeta(options: AlphaBetaCalculationOptions): Promise<AlphaBetaCalculationResult> {
    const { portfolioId, benchmarkId, snapshotDate, granularity = SnapshotGranularity.DAILY } = options;
    
    const date = snapshotDate instanceof Date ? snapshotDate : new Date(snapshotDate);
    console.log(`🔍 AlphaBetaCalculationService: Calculating portfolio Alpha/Beta for ${portfolioId} vs ${benchmarkId} on ${date.toISOString().split('T')[0]}`);
    this.logger.log(`Calculating portfolio Alpha/Beta for ${portfolioId} vs ${benchmarkId} on ${date.toISOString().split('T')[0]}`);

    try {
      // Calculate Alpha/Beta for different periods
      const alphaBeta1M = await this.calculateAlphaBetaForPeriod(portfolioId, benchmarkId, snapshotDate, 30, granularity);
      const alphaBeta3M = await this.calculateAlphaBetaForPeriod(portfolioId, benchmarkId, snapshotDate, 90, granularity);
      const alphaBeta6M = await this.calculateAlphaBetaForPeriod(portfolioId, benchmarkId, snapshotDate, 180, granularity);
      const alphaBeta1Y = await this.calculateAlphaBetaForPeriod(portfolioId, benchmarkId, snapshotDate, 365, granularity);
      const alphaBetaYTD = await this.calculateAlphaBetaYTD(portfolioId, benchmarkId, snapshotDate, granularity);

      return {
        alpha1M: Number(alphaBeta1M.alpha.toFixed(4)),
        alpha3M: Number(alphaBeta3M.alpha.toFixed(4)),
        alpha6M: Number(alphaBeta6M.alpha.toFixed(4)),
        alpha1Y: Number(alphaBeta1Y.alpha.toFixed(4)),
        alphaYTD: Number(alphaBetaYTD.alpha.toFixed(4)),
        beta1M: Number(alphaBeta1M.beta.toFixed(4)),
        beta3M: Number(alphaBeta3M.beta.toFixed(4)),
        beta6M: Number(alphaBeta6M.beta.toFixed(4)),
        beta1Y: Number(alphaBeta1Y.beta.toFixed(4)),
        betaYTD: Number(alphaBetaYTD.beta.toFixed(4)),
        informationRatio1M: Number(alphaBeta1M.informationRatio.toFixed(4)),
        informationRatio3M: Number(alphaBeta3M.informationRatio.toFixed(4)),
        informationRatio1Y: Number(alphaBeta1Y.informationRatio.toFixed(4)),
        trackingError1M: Number(alphaBeta1M.trackingError.toFixed(4)),
        trackingError3M: Number(alphaBeta3M.trackingError.toFixed(4)),
        trackingError1Y: Number(alphaBeta1Y.trackingError.toFixed(4)),
      };
    } catch (error) {
      this.logger.error(`Error calculating portfolio Alpha/Beta: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate Alpha and Beta for specific asset across multiple timeframes
   */
  async calculateAssetAlphaBeta(options: {
    portfolioId: string;
    assetId: string;
    benchmarkId: string;
    snapshotDate: Date;
    granularity?: SnapshotGranularity;
  }): Promise<AlphaBetaCalculationResult> {
    const { portfolioId, assetId, benchmarkId, snapshotDate, granularity = SnapshotGranularity.DAILY } = options;
    
    const date = snapshotDate instanceof Date ? snapshotDate : new Date(snapshotDate);
    this.logger.log(`Calculating asset Alpha/Beta for asset ${assetId} vs ${benchmarkId} on ${date.toISOString().split('T')[0]}`);

    try {
      // Calculate Alpha/Beta for different periods
      const alphaBeta1M = await this.calculateAssetAlphaBetaForPeriod(portfolioId, assetId, benchmarkId, snapshotDate, 30, granularity);
      const alphaBeta3M = await this.calculateAssetAlphaBetaForPeriod(portfolioId, assetId, benchmarkId, snapshotDate, 90, granularity);
      const alphaBeta6M = await this.calculateAssetAlphaBetaForPeriod(portfolioId, assetId, benchmarkId, snapshotDate, 180, granularity);
      const alphaBeta1Y = await this.calculateAssetAlphaBetaForPeriod(portfolioId, assetId, benchmarkId, snapshotDate, 365, granularity);
      const alphaBetaYTD = await this.calculateAssetAlphaBetaYTD(portfolioId, assetId, benchmarkId, snapshotDate, granularity);

      return {
        alpha1M: Number(alphaBeta1M.alpha.toFixed(4)),
        alpha3M: Number(alphaBeta3M.alpha.toFixed(4)),
        alpha6M: Number(alphaBeta6M.alpha.toFixed(4)),
        alpha1Y: Number(alphaBeta1Y.alpha.toFixed(4)),
        alphaYTD: Number(alphaBetaYTD.alpha.toFixed(4)),
        beta1M: Number(alphaBeta1M.beta.toFixed(4)),
        beta3M: Number(alphaBeta3M.beta.toFixed(4)),
        beta6M: Number(alphaBeta6M.beta.toFixed(4)),
        beta1Y: Number(alphaBeta1Y.beta.toFixed(4)),
        betaYTD: Number(alphaBetaYTD.beta.toFixed(4)),
        informationRatio1M: Number(alphaBeta1M.informationRatio.toFixed(4)),
        informationRatio3M: Number(alphaBeta3M.informationRatio.toFixed(4)),
        informationRatio1Y: Number(alphaBeta1Y.informationRatio.toFixed(4)),
        trackingError1M: Number(alphaBeta1M.trackingError.toFixed(4)),
        trackingError3M: Number(alphaBeta3M.trackingError.toFixed(4)),
        trackingError1Y: Number(alphaBeta1Y.trackingError.toFixed(4)),
      };
    } catch (error) {
      this.logger.error(`Error calculating asset Alpha/Beta: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate Alpha and Beta for specific period
   */
  private async calculateAlphaBetaForPeriod(
    portfolioId: string,
    benchmarkId: string,
    snapshotDate: Date,
    days: number,
    granularity: SnapshotGranularity
  ): Promise<{
    alpha: number;
    beta: number;
    informationRatio: number;
    trackingError: number;
  }> {
    const startDate = new Date(snapshotDate);
    startDate.setDate(startDate.getDate() - days);

    // Get portfolio returns
    const portfolioReturns = await this.getPortfolioReturnsForPeriod(portfolioId, startDate, snapshotDate, granularity);
    
    // Get benchmark returns
    const benchmarkReturns = await this.getBenchmarkReturnsForPeriod(benchmarkId, startDate, snapshotDate, granularity);

    this.logger.log(`Portfolio returns: ${portfolioReturns.length}, Benchmark returns: ${benchmarkReturns.length}`);
    
    if (portfolioReturns.length < 2 || benchmarkReturns.length < 2) {
      this.logger.warn(`Insufficient data for Alpha/Beta calculation: ${portfolioReturns.length} portfolio returns, ${benchmarkReturns.length} benchmark returns`);
      return {
        alpha: 0,
        beta: 0,
        informationRatio: 0,
        trackingError: 0,
      };
    }
    
    this.logger.log(`Portfolio returns sample:`, portfolioReturns.slice(0, 3));
    this.logger.log(`Benchmark returns sample:`, benchmarkReturns.slice(0, 3));

    // Align returns by date
    const alignedReturns = this.alignReturnsByDate(portfolioReturns, benchmarkReturns);

    if (alignedReturns.length < 2) {
      this.logger.warn(`Insufficient aligned data for Alpha/Beta calculation: ${alignedReturns.length} aligned returns`);
      return {
        alpha: 0,
        beta: 0,
        informationRatio: 0,
        trackingError: 0,
      };
    }

    return this.calculateAlphaBetaFromReturns(alignedReturns);
  }

  /**
   * Calculate Alpha and Beta for YTD
   */
  private async calculateAlphaBetaYTD(
    portfolioId: string,
    benchmarkId: string,
    snapshotDate: Date,
    granularity: SnapshotGranularity
  ): Promise<{
    alpha: number;
    beta: number;
    informationRatio: number;
    trackingError: number;
  }> {
    const date = snapshotDate instanceof Date ? snapshotDate : new Date(snapshotDate);
    const yearStart = new Date(date.getFullYear(), 0, 1);
    return await this.calculateAlphaBetaForPeriod(portfolioId, benchmarkId, date, 
      Math.ceil((date.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)), granularity);
  }

  /**
   * Get portfolio returns for period
   */
  private async getPortfolioReturnsForPeriod(
    portfolioId: string,
    startDate: Date,
    endDate: Date,
    granularity: SnapshotGranularity
  ): Promise<Array<{ date: Date; return: number }>> {
    const snapshots = await this.portfolioSnapshotRepo
      .createQueryBuilder('snapshot')
      .where('snapshot.portfolioId = :portfolioId', { portfolioId })
      .andWhere('snapshot.snapshotDate >= :startDate', { startDate })
      .andWhere('snapshot.snapshotDate <= :endDate', { endDate })
      .andWhere('snapshot.granularity = :granularity', { granularity })
      .andWhere('snapshot.isActive = :isActive', { isActive: true })
      .orderBy('snapshot.snapshotDate', 'ASC')
      .getMany();

    const returns: Array<{ date: Date; return: number }> = [];

    this.logger.log(`Found ${snapshots.length} portfolio snapshots for period`);
    
    for (let i = 1; i < snapshots.length; i++) {
      const prevValue = Number(snapshots[i - 1].totalPortfolioValue || 0);
      const currValue = Number(snapshots[i].totalPortfolioValue || 0);
      
      if (prevValue > 0) {
        const returnValue = (currValue - prevValue) / prevValue;
        returns.push({
          date: snapshots[i].snapshotDate instanceof Date ? snapshots[i].snapshotDate : new Date(snapshots[i].snapshotDate),
          return: returnValue
        });
      }
    }

    this.logger.log(`Calculated ${returns.length} portfolio returns`);
    return returns;
  }

  /**
   * Get benchmark returns for period from price history
   * FIXED: Get data from price history table, if multiple records per day, get the latest one
   */
  private async getBenchmarkReturnsForPeriod(
    benchmarkId: string,
    startDate: Date,
    endDate: Date,
    granularity: SnapshotGranularity
  ): Promise<Array<{ date: Date; return: number }>> {
    // Get price history data for the benchmark asset
    // SIMPLIFIED: Use simple query first, then group by date in code
    const priceHistoryData = await this.dataSource
      .createQueryBuilder()
      .select([
        'DATE(aph.created_at) as date',
        'aph.price',
        'aph.created_at'
      ])
      .from('asset_price_history', 'aph')
      .where('aph.asset_id = :benchmarkId', { benchmarkId })
      .andWhere('DATE(aph.created_at) >= :startDate', { startDate })
      .andWhere('DATE(aph.created_at) <= :endDate', { endDate })
      .orderBy('aph.created_at', 'ASC')
      .getRawMany();

    // If no price history data, try to get from benchmark data as fallback
    let benchmarkData = [];
    if (priceHistoryData.length === 0) {
      this.logger.warn(`No price history data found for benchmark ${benchmarkId}, falling back to benchmark data`);
      benchmarkData = await this.benchmarkDataRepo
        .createQueryBuilder('benchmark')
        .where('benchmark.benchmarkId = :benchmarkId', { benchmarkId })
        .andWhere('benchmark.snapshotDate >= :startDate', { startDate })
        .andWhere('benchmark.snapshotDate <= :endDate', { endDate })
        .andWhere('benchmark.granularity = :granularity', { granularity })
        .andWhere('benchmark.isActive = :isActive', { isActive: true })
        .orderBy('benchmark.snapshotDate', 'ASC')
        .getMany();
    }

    const returns: Array<{ date: Date; return: number }> = [];

    this.logger.log(`Found ${priceHistoryData.length} price history records, ${benchmarkData.length} benchmark data records`);

    // Process price history data
    if (priceHistoryData.length > 0) {
      console.log('📊 First few price history records:', priceHistoryData.slice(0, 3));
      
      // Group by date and get latest record per day
      const groupedByDate = new Map<string, any>();
      priceHistoryData.forEach(record => {
        const dateKey = record.date;
        if (!groupedByDate.has(dateKey) || new Date(record.created_at) > new Date(groupedByDate.get(dateKey).created_at)) {
          groupedByDate.set(dateKey, record);
        }
      });
      
      const dailyRecords = Array.from(groupedByDate.values()).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      console.log(`📊 Grouped to ${dailyRecords.length} daily records`);
      
      for (let i = 1; i < dailyRecords.length; i++) {
        const prevValue = Number(dailyRecords[i - 1].price || 0);
        const currValue = Number(dailyRecords[i].price || 0);
        
        if (i <= 3) {
          console.log(`📊 Price comparison [${i}]: prev=${prevValue}, curr=${currValue}`);
        }
        
        if (prevValue > 0) {
          const returnValue = (currValue - prevValue) / prevValue;
          returns.push({
            date: new Date(dailyRecords[i].date),
            return: returnValue
          });
        }
      }
    } else {
      // Fallback to benchmark data
      for (let i = 1; i < benchmarkData.length; i++) {
        const prevValue = Number(benchmarkData[i - 1].benchmarkValue || 0);
        const currValue = Number(benchmarkData[i].benchmarkValue || 0);
        
        if (prevValue > 0) {
          const returnValue = (currValue - prevValue) / prevValue;
          returns.push({
            date: benchmarkData[i].snapshotDate instanceof Date ? benchmarkData[i].snapshotDate : new Date(benchmarkData[i].snapshotDate),
            return: returnValue
          });
        }
      }
    }

    this.logger.log(`Calculated ${returns.length} benchmark returns`);
    return returns;
  }

  /**
   * Align portfolio and benchmark returns by date
   */
  private alignReturnsByDate(
    portfolioReturns: Array<{ date: Date; return: number }>,
    benchmarkReturns: Array<{ date: Date; return: number }>
  ): Array<{ portfolioReturn: number; benchmarkReturn: number }> {
    const alignedReturns: Array<{ portfolioReturn: number; benchmarkReturn: number }> = [];

    // Create maps for faster lookup
    const portfolioMap = new Map<string, number>();
    const benchmarkMap = new Map<string, number>();

    portfolioReturns.forEach(ret => {
      const date = ret.date instanceof Date ? ret.date : new Date(ret.date);
      const dateKey = date.toISOString().split('T')[0];
      portfolioMap.set(dateKey, ret.return);
    });

    benchmarkReturns.forEach(ret => {
      const date = ret.date instanceof Date ? ret.date : new Date(ret.date);
      const dateKey = date.toISOString().split('T')[0];
      benchmarkMap.set(dateKey, ret.return);
    });

    // Find common dates
    const commonDates = new Set([...portfolioMap.keys()].filter(date => benchmarkMap.has(date)));

    commonDates.forEach(date => {
      const portfolioReturn = portfolioMap.get(date)!;
      const benchmarkReturn = benchmarkMap.get(date)!;
      
      alignedReturns.push({
        portfolioReturn,
        benchmarkReturn
      });
    });

    return alignedReturns.sort((a, b) => a.portfolioReturn - b.portfolioReturn);
  }

  /**
   * Calculate Alpha and Beta from aligned returns
   */
  private calculateAlphaBetaFromReturns(
    alignedReturns: Array<{ portfolioReturn: number; benchmarkReturn: number }>
  ): {
    alpha: number;
    beta: number;
    informationRatio: number;
    trackingError: number;
  } {
    if (alignedReturns.length < 2) {
      return {
        alpha: 0,
        beta: 0,
        informationRatio: 0,
        trackingError: 0,
      };
    }

    const n = alignedReturns.length;
    
    // Calculate means
    const portfolioMean = alignedReturns.reduce((sum, ret) => sum + ret.portfolioReturn, 0) / n;
    const benchmarkMean = alignedReturns.reduce((sum, ret) => sum + ret.benchmarkReturn, 0) / n;

    // Calculate covariance and variance
    let covariance = 0;
    let benchmarkVariance = 0;
    let excessReturnsSum = 0;
    let excessReturnsSquaredSum = 0;

    alignedReturns.forEach(ret => {
      const portfolioExcess = ret.portfolioReturn - portfolioMean;
      const benchmarkExcess = ret.benchmarkReturn - benchmarkMean;
      
      covariance += portfolioExcess * benchmarkExcess;
      benchmarkVariance += benchmarkExcess * benchmarkExcess;
      
      const excessReturn = ret.portfolioReturn - ret.benchmarkReturn;
      excessReturnsSum += excessReturn;
      excessReturnsSquaredSum += excessReturn * excessReturn;
    });

    // Calculate Beta
    const beta = benchmarkVariance > 0 ? covariance / benchmarkVariance : 0;

    // Calculate Alpha (using CAPM: Alpha = Portfolio Return - (Risk-free Rate + Beta * (Benchmark Return - Risk-free Rate)))
    // For simplicity, assuming risk-free rate = 0
    const alpha = portfolioMean - (beta * benchmarkMean);

    // Calculate Tracking Error (standard deviation of excess returns)
    const excessReturnsMean = excessReturnsSum / n;
    const trackingError = Math.sqrt((excessReturnsSquaredSum / n) - (excessReturnsMean * excessReturnsMean));

    // Calculate Information Ratio (Alpha / Tracking Error)
    const informationRatio = trackingError > 0 ? alpha / trackingError : 0;

    return {
      alpha: alpha * 100, // Convert to percentage
      beta: beta,
      informationRatio: informationRatio,
      trackingError: trackingError * 100, // Convert to percentage
    };
  }

  /**
   * Calculate correlation coefficient between portfolio and benchmark returns
   */
  async calculateCorrelation(
    portfolioId: string,
    benchmarkId: string,
    snapshotDate: Date,
    days: number,
    granularity: SnapshotGranularity = SnapshotGranularity.DAILY
  ): Promise<number> {
    const startDate = new Date(snapshotDate);
    startDate.setDate(startDate.getDate() - days);

    const portfolioReturns = await this.getPortfolioReturnsForPeriod(portfolioId, startDate, snapshotDate, granularity);
    const benchmarkReturns = await this.getBenchmarkReturnsForPeriod(benchmarkId, startDate, snapshotDate, granularity);
    
    const alignedReturns = this.alignReturnsByDate(portfolioReturns, benchmarkReturns);

    if (alignedReturns.length < 2) {
      return 0;
    }

    const n = alignedReturns.length;
    const portfolioMean = alignedReturns.reduce((sum, ret) => sum + ret.portfolioReturn, 0) / n;
    const benchmarkMean = alignedReturns.reduce((sum, ret) => sum + ret.benchmarkReturn, 0) / n;

    let numerator = 0;
    let portfolioSumSquares = 0;
    let benchmarkSumSquares = 0;

    alignedReturns.forEach(ret => {
      const portfolioExcess = ret.portfolioReturn - portfolioMean;
      const benchmarkExcess = ret.benchmarkReturn - benchmarkMean;
      
      numerator += portfolioExcess * benchmarkExcess;
      portfolioSumSquares += portfolioExcess * portfolioExcess;
      benchmarkSumSquares += benchmarkExcess * benchmarkExcess;
    });

    const denominator = Math.sqrt(portfolioSumSquares * benchmarkSumSquares);
    
    return denominator > 0 ? numerator / denominator : 0;
  }

  /**
   * Calculate R-squared (coefficient of determination)
   */
  async calculateRSquared(
    portfolioId: string,
    benchmarkId: string,
    snapshotDate: Date,
    days: number,
    granularity: SnapshotGranularity = SnapshotGranularity.DAILY
  ): Promise<number> {
    const correlation = await this.calculateCorrelation(portfolioId, benchmarkId, snapshotDate, days, granularity);
    return correlation * correlation;
  }

  /**
   * Calculate Asset Alpha and Beta for specific period
   */
  private async calculateAssetAlphaBetaForPeriod(
    portfolioId: string,
    assetId: string,
    benchmarkId: string,
    snapshotDate: Date,
    days: number,
    granularity: SnapshotGranularity
  ): Promise<{
    alpha: number;
    beta: number;
    informationRatio: number;
    trackingError: number;
  }> {
    const startDate = new Date(snapshotDate);
    startDate.setDate(startDate.getDate() - days);

    // Get asset returns
    const assetReturns = await this.getAssetReturnsForPeriod(portfolioId, assetId, startDate, snapshotDate, granularity);
    
    // Get benchmark returns
    const benchmarkReturns = await this.getBenchmarkReturnsForPeriod(benchmarkId, startDate, snapshotDate, granularity);

    if (assetReturns.length < 2 || benchmarkReturns.length < 2) {
      this.logger.warn(`Insufficient data for asset Alpha/Beta calculation: ${assetReturns.length} asset returns, ${benchmarkReturns.length} benchmark returns`);
      return {
        alpha: 0,
        beta: 0,
        informationRatio: 0,
        trackingError: 0,
      };
    }

    // Align returns by date
    const alignedReturns = this.alignReturnsByDate(assetReturns, benchmarkReturns);

    if (alignedReturns.length < 2) {
      this.logger.warn(`Insufficient aligned data for asset Alpha/Beta calculation: ${alignedReturns.length} aligned returns`);
      return {
        alpha: 0,
        beta: 0,
        informationRatio: 0,
        trackingError: 0,
      };
    }

    return this.calculateAlphaBetaFromReturns(alignedReturns);
  }

  /**
   * Calculate Asset Alpha/Beta YTD
   */
  private async calculateAssetAlphaBetaYTD(
    portfolioId: string,
    assetId: string,
    benchmarkId: string,
    snapshotDate: Date,
    granularity: SnapshotGranularity
  ): Promise<{
    alpha: number;
    beta: number;
    informationRatio: number;
    trackingError: number;
  }> {
    const yearStart = new Date(snapshotDate.getFullYear(), 0, 1);
    return await this.calculateAssetAlphaBetaForPeriod(portfolioId, assetId, benchmarkId, snapshotDate, 
      Math.ceil((snapshotDate.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)), granularity);
  }

  /**
   * Get asset returns for period
   */
  private async getAssetReturnsForPeriod(
    portfolioId: string,
    assetId: string,
    startDate: Date,
    endDate: Date,
    granularity: SnapshotGranularity
  ): Promise<Array<{ date: Date; return: number }>> {
    const snapshots = await this.portfolioSnapshotRepo.manager
      .createQueryBuilder('asset_allocation_snapshots', 's')
      .where('s.portfolio_id = :portfolioId', { portfolioId })
      .andWhere('s.asset_id = :assetId', { assetId })
      .andWhere('s.snapshot_date >= :startDate', { startDate })
      .andWhere('s.snapshot_date <= :endDate', { endDate })
      .andWhere('s.granularity = :granularity', { granularity })
      .andWhere('s.is_active = :isActive', { isActive: true })
      .orderBy('s.snapshot_date', 'ASC')
      .getMany();

    const returns: Array<{ date: Date; return: number }> = [];

    for (let i = 1; i < snapshots.length; i++) {
      const prevValue = Number(snapshots[i - 1].currentValue || 0);
      const currValue = Number(snapshots[i].currentValue || 0);
      
      if (prevValue > 0) {
        const returnValue = (currValue - prevValue) / prevValue;
        returns.push({
          date: snapshots[i].snapshotDate instanceof Date ? snapshots[i].snapshotDate : new Date(snapshots[i].snapshotDate),
          return: returnValue
        });
      }
    }

    return returns;
  }

  /**
   * Calculate Alpha and Beta for asset group across multiple timeframes
   */
  async calculateAssetGroupAlphaBeta(options: {
    portfolioId: string;
    assetType: string;
    benchmarkId: string;
    snapshotDate: Date;
    granularity?: SnapshotGranularity;
  }): Promise<AlphaBetaCalculationResult> {
    const { portfolioId, assetType, benchmarkId, snapshotDate, granularity = SnapshotGranularity.DAILY } = options;
    
    const date = snapshotDate instanceof Date ? snapshotDate : new Date(snapshotDate);
    this.logger.log(`Calculating asset group Alpha/Beta for asset type ${assetType} vs ${benchmarkId} on ${date.toISOString().split('T')[0]}`);

    try {
      // Calculate Alpha/Beta for different periods
      const alphaBeta1M = await this.calculateAssetGroupAlphaBetaForPeriod(portfolioId, assetType, benchmarkId, snapshotDate, 30, granularity);
      const alphaBeta3M = await this.calculateAssetGroupAlphaBetaForPeriod(portfolioId, assetType, benchmarkId, snapshotDate, 90, granularity);
      const alphaBeta6M = await this.calculateAssetGroupAlphaBetaForPeriod(portfolioId, assetType, benchmarkId, snapshotDate, 180, granularity);
      const alphaBeta1Y = await this.calculateAssetGroupAlphaBetaForPeriod(portfolioId, assetType, benchmarkId, snapshotDate, 365, granularity);
      const alphaBetaYTD = await this.calculateAssetGroupAlphaBetaYTD(portfolioId, assetType, benchmarkId, snapshotDate, granularity);

      return {
        alpha1M: Number(alphaBeta1M.alpha.toFixed(4)),
        alpha3M: Number(alphaBeta3M.alpha.toFixed(4)),
        alpha6M: Number(alphaBeta6M.alpha.toFixed(4)),
        alpha1Y: Number(alphaBeta1Y.alpha.toFixed(4)),
        alphaYTD: Number(alphaBetaYTD.alpha.toFixed(4)),
        beta1M: Number(alphaBeta1M.beta.toFixed(4)),
        beta3M: Number(alphaBeta3M.beta.toFixed(4)),
        beta6M: Number(alphaBeta6M.beta.toFixed(4)),
        beta1Y: Number(alphaBeta1Y.beta.toFixed(4)),
        betaYTD: Number(alphaBetaYTD.beta.toFixed(4)),
        informationRatio1M: Number(alphaBeta1M.informationRatio.toFixed(4)),
        informationRatio3M: Number(alphaBeta3M.informationRatio.toFixed(4)),
        informationRatio1Y: Number(alphaBeta1Y.informationRatio.toFixed(4)),
        trackingError1M: Number(alphaBeta1M.trackingError.toFixed(4)),
        trackingError3M: Number(alphaBeta3M.trackingError.toFixed(4)),
        trackingError1Y: Number(alphaBeta1Y.trackingError.toFixed(4)),
      };
    } catch (error) {
      this.logger.error(`Error calculating asset group Alpha/Beta: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate Asset Group Alpha and Beta for specific period
   */
  private async calculateAssetGroupAlphaBetaForPeriod(
    portfolioId: string,
    assetType: string,
    benchmarkId: string,
    snapshotDate: Date,
    days: number,
    granularity: SnapshotGranularity
  ): Promise<{
    alpha: number;
    beta: number;
    informationRatio: number;
    trackingError: number;
  }> {
    const startDate = new Date(snapshotDate);
    startDate.setDate(startDate.getDate() - days);

    // Get asset group returns
    const assetGroupReturns = await this.getAssetGroupReturnsForPeriod(portfolioId, assetType, startDate, snapshotDate, granularity);
    
    // Get benchmark returns
    const benchmarkReturns = await this.getBenchmarkReturnsForPeriod(benchmarkId, startDate, snapshotDate, granularity);

    if (assetGroupReturns.length < 2 || benchmarkReturns.length < 2) {
      this.logger.warn(`Insufficient data for asset group Alpha/Beta calculation: ${assetGroupReturns.length} asset group returns, ${benchmarkReturns.length} benchmark returns`);
      return {
        alpha: 0,
        beta: 0,
        informationRatio: 0,
        trackingError: 0,
      };
    }

    // Align returns by date
    const alignedReturns = this.alignReturnsByDate(assetGroupReturns, benchmarkReturns);

    if (alignedReturns.length < 2) {
      this.logger.warn(`Insufficient aligned data for asset group Alpha/Beta calculation: ${alignedReturns.length} aligned returns`);
      return {
        alpha: 0,
        beta: 0,
        informationRatio: 0,
        trackingError: 0,
      };
    }

    return this.calculateAlphaBetaFromReturns(alignedReturns);
  }

  /**
   * Calculate Asset Group Alpha/Beta YTD
   */
  private async calculateAssetGroupAlphaBetaYTD(
    portfolioId: string,
    assetType: string,
    benchmarkId: string,
    snapshotDate: Date,
    granularity: SnapshotGranularity
  ): Promise<{
    alpha: number;
    beta: number;
    informationRatio: number;
    trackingError: number;
  }> {
    const yearStart = new Date(snapshotDate.getFullYear(), 0, 1);
    return await this.calculateAssetGroupAlphaBetaForPeriod(portfolioId, assetType, benchmarkId, snapshotDate, 
      Math.ceil((snapshotDate.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)), granularity);
  }

  /**
   * Get asset group returns for period
   */
  private async getAssetGroupReturnsForPeriod(
    portfolioId: string,
    assetType: string,
    startDate: Date,
    endDate: Date,
    granularity: SnapshotGranularity
  ): Promise<Array<{ date: Date; return: number }>> {
    // Get asset allocation snapshots for all assets of this type for the period
    const snapshots = await this.portfolioSnapshotRepo.manager
      .createQueryBuilder('asset_allocation_snapshots', 's')
      .innerJoin('assets', 'a', 'a.id = s.asset_id')
      .where('s.portfolio_id = :portfolioId', { portfolioId })
      .andWhere('a.type = :assetType', { assetType })
      .andWhere('s.snapshot_date >= :startDate', { startDate })
      .andWhere('s.snapshot_date <= :endDate', { endDate })
      .andWhere('s.granularity = :granularity', { granularity })
      .andWhere('s.is_active = :isActive', { isActive: true })
      .orderBy('s.snapshot_date', 'ASC')
      .getMany();

    // Group by date and sum values
    const dateValueMap = new Map<string, number>();
    
    for (const snapshot of snapshots) {
      const date = snapshot.snapshotDate instanceof Date ? snapshot.snapshotDate : new Date(snapshot.snapshotDate);
      const dateKey = date.toISOString().split('T')[0];
      const currentValue = Number(snapshot.currentValue || 0);
      
      dateValueMap.set(dateKey, (dateValueMap.get(dateKey) || 0) + currentValue);
    }

    // Convert to array and calculate returns
    const dateValues = Array.from(dateValueMap.entries())
      .map(([dateKey, value]) => ({
        date: new Date(dateKey),
        value
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const returns: Array<{ date: Date; return: number }> = [];

    for (let i = 1; i < dateValues.length; i++) {
      const prevValue = dateValues[i - 1].value;
      const currValue = dateValues[i].value;
      
      if (prevValue > 0) {
        const returnValue = (currValue - prevValue) / prevValue;
        returns.push({
          date: dateValues[i].date,
          return: returnValue
        });
      }
    }

    return returns;
  }
}
