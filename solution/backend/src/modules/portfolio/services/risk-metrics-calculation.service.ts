import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PortfolioSnapshot } from '../entities/portfolio-snapshot.entity';
import { AssetAllocationSnapshot } from '../entities/asset-allocation-snapshot.entity';
import { SnapshotGranularity } from '../enums/snapshot-granularity.enum';
import { RiskMetricsConfig } from '../../../config/risk-metrics.config';

export interface RiskMetricsResult {
  volatility1M: number;
  volatility3M: number;
  volatility1Y: number;
  sharpeRatio1M: number;
  sharpeRatio3M: number;
  sharpeRatio1Y: number;
  maxDrawdown1M: number;
  maxDrawdown3M: number;
  maxDrawdown1Y: number;
  riskAdjustedReturn1M: number;
  riskAdjustedReturn3M: number;
  riskAdjustedReturn1Y: number;
}

export interface RiskMetricsOptions {
  portfolioId: string;
  snapshotDate: Date;
  granularity?: SnapshotGranularity;
  riskFreeRate?: number;
}

@Injectable()
export class RiskMetricsCalculationService {
  private readonly logger = new Logger(RiskMetricsCalculationService.name);
  private readonly DEFAULT_RISK_FREE_RATE = RiskMetricsConfig.DEFAULT_RISK_FREE_RATE;

  constructor(
    @InjectRepository(PortfolioSnapshot)
    private readonly portfolioSnapshotRepo: Repository<PortfolioSnapshot>,
    
    @InjectRepository(AssetAllocationSnapshot)
    private readonly assetSnapshotRepo: Repository<AssetAllocationSnapshot>,
  ) {}

  /**
   * Calculate risk metrics for portfolio across multiple timeframes
   */
  async calculatePortfolioRiskMetrics(options: RiskMetricsOptions): Promise<RiskMetricsResult> {
    const { portfolioId, snapshotDate, granularity = SnapshotGranularity.DAILY, riskFreeRate = this.DEFAULT_RISK_FREE_RATE } = options;
    
    // Ensure snapshotDate is a Date object
    const date = snapshotDate instanceof Date ? snapshotDate : new Date(snapshotDate);
    this.logger.log(`Calculating portfolio risk metrics for ${portfolioId} on ${date.toISOString().split('T')[0]}`);

    try {
      // Calculate risk metrics for different periods
      const risk1M = await this.calculateRiskMetricsForPeriod(portfolioId, date, 30, granularity, riskFreeRate);
      const risk3M = await this.calculateRiskMetricsForPeriod(portfolioId, date, 90, granularity, riskFreeRate);
      const risk1Y = await this.calculateRiskMetricsForPeriod(portfolioId, date, 365, granularity, riskFreeRate);

      return {
        volatility1M: Number(risk1M.volatility.toFixed(4)),
        volatility3M: Number(risk3M.volatility.toFixed(4)),
        volatility1Y: Number(risk1Y.volatility.toFixed(4)),
        sharpeRatio1M: Number(risk1M.sharpeRatio.toFixed(4)),
        sharpeRatio3M: Number(risk3M.sharpeRatio.toFixed(4)),
        sharpeRatio1Y: Number(risk1Y.sharpeRatio.toFixed(4)),
        maxDrawdown1M: Number(risk1M.maxDrawdown.toFixed(4)),
        maxDrawdown3M: Number(risk3M.maxDrawdown.toFixed(4)),
        maxDrawdown1Y: Number(risk1Y.maxDrawdown.toFixed(4)),
        riskAdjustedReturn1M: Number(risk1M.riskAdjustedReturn.toFixed(4)),
        riskAdjustedReturn3M: Number(risk3M.riskAdjustedReturn.toFixed(4)),
        riskAdjustedReturn1Y: Number(risk1Y.riskAdjustedReturn.toFixed(4)),
      };
    } catch (error) {
      this.logger.error(`Error calculating portfolio risk metrics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate risk metrics for specific asset
   */
  async calculateAssetRiskMetrics(
    portfolioId: string,
    assetId: string,
    snapshotDate: Date,
    granularity: SnapshotGranularity = SnapshotGranularity.DAILY,
    riskFreeRate: number = this.DEFAULT_RISK_FREE_RATE
  ): Promise<RiskMetricsResult> {
    // Ensure snapshotDate is a Date object
    const date = snapshotDate instanceof Date ? snapshotDate : new Date(snapshotDate);
    this.logger.log(`Calculating asset risk metrics for ${assetId} on ${date.toISOString().split('T')[0]}`);

    try {
      const risk1M = await this.calculateAssetRiskMetricsForPeriod(portfolioId, assetId, date, 30, granularity, riskFreeRate);
      const risk3M = await this.calculateAssetRiskMetricsForPeriod(portfolioId, assetId, date, 90, granularity, riskFreeRate);
      const risk1Y = await this.calculateAssetRiskMetricsForPeriod(portfolioId, assetId, date, 365, granularity, riskFreeRate);

      return {
        volatility1M: Number(risk1M.volatility.toFixed(4)),
        volatility3M: Number(risk3M.volatility.toFixed(4)),
        volatility1Y: Number(risk1Y.volatility.toFixed(4)),
        sharpeRatio1M: Number(risk1M.sharpeRatio.toFixed(4)),
        sharpeRatio3M: Number(risk3M.sharpeRatio.toFixed(4)),
        sharpeRatio1Y: Number(risk1Y.sharpeRatio.toFixed(4)),
        maxDrawdown1M: Number(risk1M.maxDrawdown.toFixed(4)),
        maxDrawdown3M: Number(risk3M.maxDrawdown.toFixed(4)),
        maxDrawdown1Y: Number(risk1Y.maxDrawdown.toFixed(4)),
        riskAdjustedReturn1M: Number(risk1M.riskAdjustedReturn.toFixed(4)),
        riskAdjustedReturn3M: Number(risk3M.riskAdjustedReturn.toFixed(4)),
        riskAdjustedReturn1Y: Number(risk1Y.riskAdjustedReturn.toFixed(4)),
      };
    } catch (error) {
      this.logger.error(`Error calculating asset risk metrics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate risk metrics for asset group
   */
  async calculateAssetGroupRiskMetrics(
    portfolioId: string,
    assetType: string,
    snapshotDate: Date,
    granularity: SnapshotGranularity = SnapshotGranularity.DAILY,
    riskFreeRate: number = this.DEFAULT_RISK_FREE_RATE
  ): Promise<RiskMetricsResult> {
    // Ensure snapshotDate is a Date object
    const date = snapshotDate instanceof Date ? snapshotDate : new Date(snapshotDate);
    this.logger.log(`Calculating asset group risk metrics for ${assetType} on ${date.toISOString().split('T')[0]}`);

    try {
      const risk1M = await this.calculateAssetGroupRiskMetricsForPeriod(portfolioId, assetType, date, 30, granularity, riskFreeRate);
      const risk3M = await this.calculateAssetGroupRiskMetricsForPeriod(portfolioId, assetType, date, 90, granularity, riskFreeRate);
      const risk1Y = await this.calculateAssetGroupRiskMetricsForPeriod(portfolioId, assetType, date, 365, granularity, riskFreeRate);

      return {
        volatility1M: Number(risk1M.volatility.toFixed(4)),
        volatility3M: Number(risk3M.volatility.toFixed(4)),
        volatility1Y: Number(risk1Y.volatility.toFixed(4)),
        sharpeRatio1M: Number(risk1M.sharpeRatio.toFixed(4)),
        sharpeRatio3M: Number(risk3M.sharpeRatio.toFixed(4)),
        sharpeRatio1Y: Number(risk1Y.sharpeRatio.toFixed(4)),
        maxDrawdown1M: Number(risk1M.maxDrawdown.toFixed(4)),
        maxDrawdown3M: Number(risk3M.maxDrawdown.toFixed(4)),
        maxDrawdown1Y: Number(risk1Y.maxDrawdown.toFixed(4)),
        riskAdjustedReturn1M: Number(risk1M.riskAdjustedReturn.toFixed(4)),
        riskAdjustedReturn3M: Number(risk3M.riskAdjustedReturn.toFixed(4)),
        riskAdjustedReturn1Y: Number(risk1Y.riskAdjustedReturn.toFixed(4)),
      };
    } catch (error) {
      this.logger.error(`Error calculating asset group risk metrics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate risk metrics for specific period
   */
  private async calculateRiskMetricsForPeriod(
    portfolioId: string,
    snapshotDate: Date,
    days: number,
    granularity: SnapshotGranularity,
    riskFreeRate: number
  ): Promise<{
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    riskAdjustedReturn: number;
  }> {
    const startDate = new Date(snapshotDate);
    startDate.setDate(startDate.getDate() - days);

    // Get portfolio returns
    const returns = await this.getPortfolioReturnsForPeriod(portfolioId, startDate, snapshotDate, granularity);

    if (returns.length < 2) {
      this.logger.warn(`Insufficient data for risk metrics calculation: ${returns.length} returns found`);
      return {
        volatility: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        riskAdjustedReturn: 0,
      };
    }

    return this.calculateRiskMetricsFromReturns(returns, riskFreeRate);
  }

  /**
   * Calculate asset risk metrics for specific period
   */
  private async calculateAssetRiskMetricsForPeriod(
    portfolioId: string,
    assetId: string,
    snapshotDate: Date,
    days: number,
    granularity: SnapshotGranularity,
    riskFreeRate: number
  ): Promise<{
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    riskAdjustedReturn: number;
  }> {
    const startDate = new Date(snapshotDate);
    startDate.setDate(startDate.getDate() - days);

    // Get asset returns
    const returns = await this.getAssetReturnsForPeriod(portfolioId, assetId, startDate, snapshotDate, granularity);

    if (returns.length < 2) {
      this.logger.warn(`Insufficient data for asset risk metrics calculation: ${returns.length} returns found`);
      return {
        volatility: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        riskAdjustedReturn: 0,
      };
    }

    return this.calculateRiskMetricsFromReturns(returns, riskFreeRate);
  }

  /**
   * Calculate asset group risk metrics for specific period
   */
  private async calculateAssetGroupRiskMetricsForPeriod(
    portfolioId: string,
    assetType: string,
    snapshotDate: Date,
    days: number,
    granularity: SnapshotGranularity,
    riskFreeRate: number
  ): Promise<{
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    riskAdjustedReturn: number;
  }> {
    const startDate = new Date(snapshotDate);
    startDate.setDate(startDate.getDate() - days);

    // Get asset group returns
    const returns = await this.getAssetGroupReturnsForPeriod(portfolioId, assetType, startDate, snapshotDate, granularity);

    if (returns.length < 2) {
      this.logger.warn(`Insufficient data for asset group risk metrics calculation: ${returns.length} returns found`);
      return {
        volatility: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        riskAdjustedReturn: 0,
      };
    }

    return this.calculateRiskMetricsFromReturns(returns, riskFreeRate);
  }

  /**
   * Get portfolio returns for period
   */
  private async getPortfolioReturnsForPeriod(
    portfolioId: string,
    startDate: Date,
    endDate: Date,
    granularity: SnapshotGranularity
  ): Promise<number[]> {
    const snapshots = await this.portfolioSnapshotRepo
      .createQueryBuilder('snapshot')
      .where('snapshot.portfolioId = :portfolioId', { portfolioId })
      .andWhere('snapshot.snapshotDate >= :startDate', { startDate })
      .andWhere('snapshot.snapshotDate <= :endDate', { endDate })
      .andWhere('snapshot.granularity = :granularity', { granularity })
      .andWhere('snapshot.isActive = :isActive', { isActive: true })
      .orderBy('snapshot.snapshotDate', 'ASC')
      .getMany();

    const returns: number[] = [];

    for (let i = 1; i < snapshots.length; i++) {
      const prevValue = Number(snapshots[i - 1].totalPortfolioValue || 0);
      const currValue = Number(snapshots[i].totalPortfolioValue || 0);
      
      if (prevValue > 0) {
        const returnValue = (currValue - prevValue) / prevValue;
        returns.push(returnValue);
      }
    }

    return returns;
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
  ): Promise<number[]> {
    const snapshots = await this.assetSnapshotRepo
      .createQueryBuilder('snapshot')
      .where('snapshot.portfolioId = :portfolioId', { portfolioId })
      .andWhere('snapshot.assetId = :assetId', { assetId })
      .andWhere('snapshot.snapshotDate >= :startDate', { startDate })
      .andWhere('snapshot.snapshotDate <= :endDate', { endDate })
      .andWhere('snapshot.granularity = :granularity', { granularity })
      .andWhere('snapshot.isActive = :isActive', { isActive: true })
      .orderBy('snapshot.snapshotDate', 'ASC')
      .getMany();

    const returns: number[] = [];

    for (let i = 1; i < snapshots.length; i++) {
      const prevValue = Number(snapshots[i - 1].currentValue || 0);
      const currValue = Number(snapshots[i].currentValue || 0);
      
      if (prevValue > 0) {
        const returnValue = (currValue - prevValue) / prevValue;
        returns.push(returnValue);
      }
    }

    return returns;
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
  ): Promise<number[]> {
    // Group by date to get total values per date
    const snapshots = await this.assetSnapshotRepo
      .createQueryBuilder('snapshot')
      .leftJoin('snapshot.asset', 'asset')
      .where('snapshot.portfolioId = :portfolioId', { portfolioId })
      .andWhere('asset.type = :assetType', { assetType })
      .andWhere('snapshot.snapshotDate >= :startDate', { startDate })
      .andWhere('snapshot.snapshotDate <= :endDate', { endDate })
      .andWhere('snapshot.granularity = :granularity', { granularity })
      .andWhere('snapshot.isActive = :isActive', { isActive: true })
      .orderBy('snapshot.snapshotDate', 'ASC')
      .getMany();

    // Group by date
    const dateGroups = snapshots.reduce((acc, snapshot) => {
      const dateStr = snapshot.snapshotDate instanceof Date 
        ? snapshot.snapshotDate.toISOString().split('T')[0]
        : new Date(snapshot.snapshotDate).toISOString().split('T')[0];
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push(snapshot);
      return acc;
    }, {} as Record<string, AssetAllocationSnapshot[]>);

    const dates = Object.keys(dateGroups).sort();
    const returns: number[] = [];

    for (let i = 1; i < dates.length; i++) {
      const prevDate = dates[i - 1];
      const currDate = dates[i];
      
      const prevSnapshots = dateGroups[prevDate];
      const currSnapshots = dateGroups[currDate];
      
      const prevValue = prevSnapshots.reduce((sum, s) => sum + Number(s.currentValue || 0), 0);
      const currValue = currSnapshots.reduce((sum, s) => sum + Number(s.currentValue || 0), 0);
      
      if (prevValue > 0) {
        const returnValue = (currValue - prevValue) / prevValue;
        returns.push(returnValue);
      }
    }

    return returns;
  }

  /**
   * Calculate risk metrics from returns array
   */
  private calculateRiskMetricsFromReturns(
    returns: number[],
    riskFreeRate: number
  ): {
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    riskAdjustedReturn: number;
  } {
    if (returns.length < 2) {
      return {
        volatility: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        riskAdjustedReturn: 0,
      };
    }

    // Calculate mean return
    const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;

    // Calculate volatility (standard deviation)
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / (returns.length - 1);
    const volatility = Math.sqrt(variance);

    // Annualize volatility (assuming daily returns)
    const annualizedVolatility = volatility * Math.sqrt(RiskMetricsConfig.TRADING_DAYS_PER_YEAR);

    // Calculate Sharpe ratio
    const excessReturn = meanReturn - (riskFreeRate / RiskMetricsConfig.TRADING_DAYS_PER_YEAR); // Daily risk-free rate
    const sharpeRatio = volatility > 0 ? (excessReturn / volatility) * Math.sqrt(RiskMetricsConfig.TRADING_DAYS_PER_YEAR) : 0;

    // Calculate maximum drawdown
    const maxDrawdown = this.calculateMaxDrawdown(returns);

    // Calculate risk-adjusted return (return / volatility)
    const riskAdjustedReturn = volatility > 0 ? meanReturn / volatility : 0;

    return {
      volatility: annualizedVolatility * 100, // Convert to percentage
      sharpeRatio: sharpeRatio,
      maxDrawdown: maxDrawdown * 100, // Convert to percentage
      riskAdjustedReturn: riskAdjustedReturn * 100, // Convert to percentage
    };
  }

  /**
   * Calculate maximum drawdown from returns
   */
  private calculateMaxDrawdown(returns: number[]): number {
    if (returns.length === 0) return 0;

    let peak = 1;
    let maxDrawdown = 0;
    let cumulative = 1;

    for (const ret of returns) {
      cumulative *= (1 + ret);
      
      if (cumulative > peak) {
        peak = cumulative;
      }
      
      const drawdown = (peak - cumulative) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  /**
   * Calculate Value at Risk (VaR) at specified confidence level
   */
  async calculateVaR(
    portfolioId: string,
    snapshotDate: Date,
    days: number,
    confidenceLevel: number = 0.95,
    granularity: SnapshotGranularity = SnapshotGranularity.DAILY
  ): Promise<number> {
    const startDate = new Date(snapshotDate);
    startDate.setDate(startDate.getDate() - days);

    const returns = await this.getPortfolioReturnsForPeriod(portfolioId, startDate, snapshotDate, granularity);

    if (returns.length < 2) {
      return 0;
    }

    // Sort returns
    const sortedReturns = [...returns].sort((a, b) => a - b);

    // Calculate VaR
    const index = Math.floor((1 - confidenceLevel) * sortedReturns.length);
    const varValue = sortedReturns[index];

    return Math.abs(varValue) * 100; // Convert to percentage and make positive
  }

  /**
   * Calculate Conditional Value at Risk (CVaR) at specified confidence level
   */
  async calculateCVaR(
    portfolioId: string,
    snapshotDate: Date,
    days: number,
    confidenceLevel: number = 0.95,
    granularity: SnapshotGranularity = SnapshotGranularity.DAILY
  ): Promise<number> {
    const startDate = new Date(snapshotDate);
    startDate.setDate(startDate.getDate() - days);

    const returns = await this.getPortfolioReturnsForPeriod(portfolioId, startDate, snapshotDate, granularity);

    if (returns.length < 2) {
      return 0;
    }

    // Sort returns
    const sortedReturns = [...returns].sort((a, b) => a - b);

    // Calculate CVaR (average of returns below VaR threshold)
    const varIndex = Math.floor((1 - confidenceLevel) * sortedReturns.length);
    const tailReturns = sortedReturns.slice(0, varIndex);
    
    const cvarValue = tailReturns.length > 0 
      ? tailReturns.reduce((sum, ret) => sum + ret, 0) / tailReturns.length 
      : 0;

    return Math.abs(cvarValue) * 100; // Convert to percentage and make positive
  }
}
