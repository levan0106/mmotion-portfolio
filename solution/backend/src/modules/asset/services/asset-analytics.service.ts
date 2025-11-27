import { Injectable, Inject } from '@nestjs/common';
import { IAssetRepository, AssetStatistics } from '../repositories/asset.repository.interface';
import { Asset } from '../entities/asset.entity';
import { AssetType } from '../enums/asset-type.enum';

/**
 * Asset Analytics Service
 * Handles analytics and calculations for Asset operations
 */
@Injectable()
export class AssetAnalyticsService {
  constructor(
    @Inject('IAssetRepository')
    private readonly assetRepository: IAssetRepository,
  ) {}

  /**
   * Calculate current value real-time as currentQuantity * currentPrice
   * @param asset - Asset entity
   * @returns Current value
   */
  private calculateCurrentValue(asset: Asset): number {
    // Note: currentPrice should be calculated from global assets
    return asset.currentQuantity 
      ? asset.currentQuantity * 0 // Will be calculated from global assets
      : 0;
  }

  /**
   * Calculate portfolio value from assets
   * @param portfolioId - Portfolio ID
   * @returns Total portfolio value
   */
  async calculatePortfolioValue(portfolioId: string): Promise<number> {
    const assets = await this.assetRepository.findByPortfolioId(portfolioId);
    
    return assets.reduce((total, asset) => {
      return total + this.calculateCurrentValue(asset);
    }, 0);
  }

  /**
   * Calculate asset allocation by type
   * @param portfolioId - Portfolio ID
   * @returns Asset allocation percentages by type
   */
  async calculateAssetAllocation(portfolioId: string): Promise<Record<AssetType, number>> {
    const assets = await this.assetRepository.findByPortfolioId(portfolioId);
    const totalValue = await this.calculatePortfolioValue(portfolioId);
    
    if (totalValue === 0) {
      return {
        [AssetType.STOCK]: 0,
        [AssetType.BOND]: 0,
        [AssetType.GOLD]: 0,
        [AssetType.CRYPTO]: 0,
        [AssetType.COMMODITY]: 0,
        [AssetType.REALESTATE]: 0,
        [AssetType.CURRENCY]: 0,
        [AssetType.OTHER]: 0,
        //[AssetType.DEPOSIT]: 0,
        //[AssetType.CASH]: 0,
      };
    }

    const allocation: Record<AssetType, number> = {
      [AssetType.STOCK]: 0,
      [AssetType.BOND]: 0,
      [AssetType.GOLD]: 0,
      [AssetType.CRYPTO]: 0,
      [AssetType.COMMODITY]: 0,
      [AssetType.REALESTATE]: 0,
      [AssetType.CURRENCY]: 0,
      [AssetType.OTHER]: 0,
      //[AssetType.DEPOSIT]: 0,
      //[AssetType.CASH]: 0,
    };

    assets.forEach(asset => {
      const assetValue = this.calculateCurrentValue(asset);
      const percentage = (assetValue / totalValue) * 100;
      allocation[asset.type] += percentage;
    });

    return allocation;
  }

  /**
   * Calculate performance metrics for assets
   * @param portfolioId - Portfolio ID
   * @returns Performance metrics
   */
  async calculatePerformanceMetrics(portfolioId: string): Promise<{
    totalReturn: number;
    averageReturn: number;
    bestPerformer: Asset | null;
    worstPerformer: Asset | null;
    volatility: number;
  }> {
    const assets = await this.assetRepository.findByPortfolioId(portfolioId);
    
    if (assets.length === 0) {
      return {
        totalReturn: 0,
        averageReturn: 0,
        bestPerformer: null,
        worstPerformer: null,
        volatility: 0,
      };
    }

    let totalReturn = 0;
    let totalInitialValue = 0;
    const returns: number[] = [];

    assets.forEach(asset => {
      const initialValue = asset.initialValue;
      const currentValue = this.calculateCurrentValue(asset);
      const assetReturn = ((currentValue - initialValue) / initialValue) * 100;
      
      totalReturn += (currentValue - initialValue);
      totalInitialValue += initialValue;
      returns.push(assetReturn);
    });

    const averageReturn = totalInitialValue > 0 ? (totalReturn / totalInitialValue) * 100 : 0;
    
    // Find best and worst performers
    const bestPerformer = assets.reduce((best, asset) => {
      const bestReturn = ((this.calculateCurrentValue(best) - best.initialValue) / best.initialValue) * 100;
      const assetReturn = ((this.calculateCurrentValue(asset) - asset.initialValue) / asset.initialValue) * 100;
      return assetReturn > bestReturn ? asset : best;
    });

    const worstPerformer = assets.reduce((worst, asset) => {
      const worstReturn = ((this.calculateCurrentValue(worst) - worst.initialValue) / worst.initialValue) * 100;
      const assetReturn = ((this.calculateCurrentValue(asset) - asset.initialValue) / asset.initialValue) * 100;
      return assetReturn < worstReturn ? asset : worst;
    });

    // Calculate volatility (standard deviation of returns)
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);

    return {
      totalReturn,
      averageReturn,
      bestPerformer,
      worstPerformer,
      volatility,
    };
  }

  /**
   * Calculate risk metrics for assets
   * @param portfolioId - Portfolio ID
   * @returns Risk metrics
   */
  async calculateRiskMetrics(portfolioId: string): Promise<{
    maxDrawdown: number;
    sharpeRatio: number;
    valueAtRisk: number;
    concentrationRisk: number;
  }> {
    const assets = await this.assetRepository.findByPortfolioId(portfolioId);
    
    if (assets.length === 0) {
      return {
        maxDrawdown: 0,
        sharpeRatio: 0,
        valueAtRisk: 0,
        concentrationRisk: 0,
      };
    }

    const totalValue = await this.calculatePortfolioValue(portfolioId);
    
    // Calculate concentration risk (Herfindahl index)
    const weights = assets.map(asset => this.calculateCurrentValue(asset) / totalValue);
    const concentrationRisk = weights.reduce((sum, weight) => sum + weight * weight, 0);

    // Calculate max drawdown (simplified - based on current vs initial values)
    const drawdowns = assets.map(asset => {
      const currentValue = this.calculateCurrentValue(asset);
      const initialValue = asset.initialValue;
      return Math.max(0, (initialValue - currentValue) / initialValue);
    });
    const maxDrawdown = Math.max(...drawdowns) * 100;

    // Calculate Sharpe ratio (simplified - using average return and volatility)
    const performanceMetrics = await this.calculatePerformanceMetrics(portfolioId);
    const riskFreeRate = 5; // Assume 5% risk-free rate
    const sharpeRatio = performanceMetrics.volatility > 0 
      ? (performanceMetrics.averageReturn - riskFreeRate) / performanceMetrics.volatility 
      : 0;

    // Calculate Value at Risk (simplified - 95% confidence level)
    const returns = assets.map(asset => {
      const currentValue = this.calculateCurrentValue(asset);
      const initialValue = asset.initialValue;
      return (currentValue - initialValue) / initialValue;
    });
    
    const sortedReturns = returns.sort((a, b) => a - b);
    const varIndex = Math.floor(sortedReturns.length * 0.05);
    const valueAtRisk = Math.abs(sortedReturns[varIndex] || 0) * totalValue;

    return {
      maxDrawdown,
      sharpeRatio,
      valueAtRisk,
      concentrationRisk,
    };
  }

  /**
   * Generate asset summary report
   * @param portfolioId - Portfolio ID
   * @returns Comprehensive asset summary
   */
  async generateAssetSummary(portfolioId: string): Promise<{
    overview: {
      totalAssets: number;
      totalValue: number;
      averageValue: number;
    };
    allocation: Record<AssetType, number>;
    performance: {
      totalReturn: number;
      averageReturn: number;
      bestPerformer: Asset | null;
      worstPerformer: Asset | null;
      volatility: number;
    };
    risk: {
      maxDrawdown: number;
      sharpeRatio: number;
      valueAtRisk: number;
      concentrationRisk: number;
    };
    topAssets: Asset[];
    recentActivity: Asset[];
  }> {
    const [
      statistics,
      allocation,
      performance,
      risk,
      recentAssets
    ] = await Promise.all([
      this.assetRepository.getAssetStatistics(portfolioId),
      this.calculateAssetAllocation(portfolioId),
      this.calculatePerformanceMetrics(portfolioId),
      this.calculateRiskMetrics(portfolioId),
      this.assetRepository.findRecent(5, portfolioId)
    ]);

    // Get top 5 assets by value
    const allAssets = await this.assetRepository.findByPortfolioId(portfolioId);
    const topAssets = allAssets
      .sort((a, b) => this.calculateCurrentValue(b) - this.calculateCurrentValue(a))
      .slice(0, 5);

    return {
      overview: {
        totalAssets: statistics.totalAssets,
        totalValue: statistics.totalValue,
        averageValue: statistics.averageValue,
      },
      allocation,
      performance,
      risk,
      topAssets,
      recentActivity: recentAssets,
    };
  }

  /**
   * Calculate asset correlation matrix
   * @param portfolioId - Portfolio ID
   * @returns Correlation matrix between assets
   */
  async calculateAssetCorrelation(portfolioId: string): Promise<Record<string, Record<string, number>>> {
    const assets = await this.assetRepository.findByPortfolioId(portfolioId);
    
    if (assets.length < 2) {
      return {};
    }

    const correlationMatrix: Record<string, Record<string, number>> = {};

    // For simplicity, we'll use a basic correlation calculation
    // In a real implementation, you'd use historical price data
    assets.forEach(asset1 => {
      correlationMatrix[asset1.id] = {};
      assets.forEach(asset2 => {
        if (asset1.id === asset2.id) {
          correlationMatrix[asset1.id][asset2.id] = 1;
        } else {
          // Simplified correlation based on asset type
          const correlation = this.calculateTypeCorrelation(asset1.type, asset2.type);
          correlationMatrix[asset1.id][asset2.id] = correlation;
        }
      });
    });

    return correlationMatrix;
  }

  /**
   * Calculate correlation between asset types
   * @param type1 - First asset type
   * @param type2 - Second asset type
   * @returns Correlation coefficient
   */
  private calculateTypeCorrelation(type1: AssetType, type2: AssetType): number {
    // Simplified correlation matrix based on asset types
    // TODO: Improve correlation matrix
    const correlations: Partial<Record<AssetType, Partial<Record<AssetType, number>>>> = {
      [AssetType.STOCK]: {
        [AssetType.STOCK]: 0.8,
        [AssetType.BOND]: -0.2,
        [AssetType.GOLD]: 0.1,
        [AssetType.CRYPTO]: 0.1,
        [AssetType.COMMODITY]: 0.2,
        //[AssetType.DEPOSIT]: 0.0,
        //[AssetType.CASH]: 0.0,
      },
      [AssetType.BOND]: {
        [AssetType.STOCK]: -0.2,
        [AssetType.BOND]: 0.6,
        [AssetType.GOLD]: 0.3,
        [AssetType.CRYPTO]: 0.1,
        [AssetType.COMMODITY]: 0.1,
        //[AssetType.DEPOSIT]: 0.4,
        //[AssetType.CASH]: 0.0,
      },
      [AssetType.GOLD]: {
        [AssetType.STOCK]: 0.1,
        [AssetType.BOND]: 0.3,
        [AssetType.GOLD]: 0.7,
        [AssetType.CRYPTO]: 0.1,
        [AssetType.COMMODITY]: 0.4,
        //[AssetType.DEPOSIT]: 0.0,
        //[AssetType.CASH]: 0.0,
      },
      [AssetType.COMMODITY]: {
        [AssetType.STOCK]: 0.2,
        [AssetType.BOND]: 0.1,
        [AssetType.GOLD]: 0.4,
        [AssetType.CRYPTO]: 0.1,
        [AssetType.COMMODITY]: 0.6,
        //[AssetType.DEPOSIT]: 0.0,
        //[AssetType.CASH]: 0.0,
      },
      [AssetType.CRYPTO]: {
        [AssetType.STOCK]: 0.1,
        [AssetType.BOND]: 0.1,
        [AssetType.GOLD]: 0.1,
        [AssetType.CRYPTO]: 0.8,
        [AssetType.COMMODITY]: 0.1,
        //[AssetType.DEPOSIT]: 0.1,
        //[AssetType.CASH]: 0.0,
      },
    };

    return correlations[type1]?.[type2] ?? 0.0;
  }

  /**
   * Calculate portfolio diversification score
   * @param portfolioId - Portfolio ID
   * @returns Diversification score (0-100)
   */
  async calculateDiversificationScore(portfolioId: string): Promise<number> {
    const allocation = await this.calculateAssetAllocation(portfolioId);
    const risk = await this.calculateRiskMetrics(portfolioId);

    // Calculate diversification based on allocation evenness and concentration risk
    const allocationValues = Object.values(allocation);
    const maxAllocation = Math.max(...allocationValues);
    const minAllocation = Math.min(...allocationValues);
    
    // Evenness score (0-50 points)
    const evennessScore = 50 * (1 - (maxAllocation - minAllocation) / 100);
    
    // Concentration score (0-50 points)
    const concentrationScore = 50 * (1 - risk.concentrationRisk);
    
    return Math.round(evennessScore + concentrationScore);
  }

  /**
   * Get asset performance comparison
   * @param portfolioId - Portfolio ID
   * @param period - Time period for comparison
   * @returns Performance comparison data
   */
  async getAssetPerformanceComparison(
    portfolioId: string,
    period: '1M' | '3M' | '6M' | '1Y' | 'ALL' = 'ALL'
  ): Promise<{
    period: string;
    assets: Array<{
      id: string;
      name: string;
      symbol: string; // Added symbol field
      type: AssetType;
      initialValue: number;
      currentValue: number;
      return: number;
      rank: number;
    }>;
  }> {
    const assets = await this.assetRepository.findByPortfolioId(portfolioId);
    
    const assetPerformance = assets.map(asset => {
      const initialValue = asset.initialValue;
      const currentValue = this.calculateCurrentValue(asset);
      const returnPercent = ((currentValue - initialValue) / initialValue) * 100;
      
      return {
        id: asset.id,
        name: asset.name,
        symbol: asset.symbol, // Added symbol field
        type: asset.type,
        initialValue,
        currentValue,
        return: returnPercent,
        rank: 0, // Will be set after sorting
      };
    });

    // Sort by return and assign ranks
    assetPerformance.sort((a, b) => b.return - a.return);
    assetPerformance.forEach((asset, index) => {
      asset.rank = index + 1;
    });

    return {
      period,
      assets: assetPerformance,
    };
  }
}
