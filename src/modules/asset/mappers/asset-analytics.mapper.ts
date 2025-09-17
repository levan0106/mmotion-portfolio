import { Asset } from '../entities/asset.entity';
import { AssetType } from '../enums/asset-type.enum';
import { 
  AssetAllocationResponseDto,
  AssetPerformanceResponseDto,
  AssetRiskMetricsResponseDto,
  AssetAnalyticsSummaryResponseDto
} from '../dto/asset-analytics-response.dto';
import { AssetMapper } from './asset.mapper';

/**
 * Asset Analytics Mapper
 * Maps analytics service responses to DTOs for API responses
 */
export class AssetAnalyticsMapper {
  /**
   * Map allocation data to AssetAllocationResponseDto
   * @param allocation - Allocation data by asset type
   * @returns AssetAllocationResponseDto
   */
  static toAllocationResponseDto(allocation: Record<AssetType, number>): AssetAllocationResponseDto {
    return {
      STOCK: allocation[AssetType.STOCK] || 0,
      BOND: allocation[AssetType.BOND] || 0,
      GOLD: allocation[AssetType.GOLD] || 0,
      DEPOSIT: allocation[AssetType.DEPOSIT] || 0,
      CASH: allocation[AssetType.CASH] || 0,
    };
  }

  /**
   * Map risk metrics to AssetRiskMetricsResponseDto
   * @param riskMetrics - Risk metrics data
   * @returns AssetRiskMetricsResponseDto
   */
  static toRiskMetricsResponseDto(riskMetrics: {
    maxDrawdown: number;
    sharpeRatio: number;
    valueAtRisk: number;
    concentrationRisk: number;
  }): AssetRiskMetricsResponseDto {
    return {
      maxDrawdown: riskMetrics.maxDrawdown,
      sharpeRatio: riskMetrics.sharpeRatio,
      valueAtRisk: riskMetrics.valueAtRisk,
      concentrationRisk: riskMetrics.concentrationRisk,
      volatility: 0, // Default value, should be calculated in service
      beta: 0, // Default value, should be calculated in service
    };
  }

  /**
   * Map performance data to AssetPerformanceResponseDto
   * @param performance - Performance data
   * @param period - Time period
   * @returns AssetPerformanceResponseDto
   */
  static toPerformanceResponseDto(performance: {
    period: string;
    assets: Array<{
      id: string;
      name: string;
      symbol: string;
      type: AssetType;
      initialValue: number;
      currentValue: number;
      return: number;
      rank: number;
    }>;
  }): AssetPerformanceResponseDto {
    const totalPortfolioValue = performance.assets.reduce((sum, asset) => sum + asset.currentValue, 0);
    const totalPortfolioReturn = performance.assets.reduce((sum, asset) => sum + asset.return, 0);
    const totalPortfolioReturnPercentage = totalPortfolioValue > 0 ? (totalPortfolioReturn / totalPortfolioValue) * 100 : 0;

    // Find best and worst performers
    const sortedAssets = performance.assets.sort((a, b) => b.return - a.return);
    const bestPerformer = sortedAssets.length > 0 ? `${sortedAssets[0].name} (${sortedAssets[0].id})` : 'N/A';
    const worstPerformer = sortedAssets.length > 0 ? `${sortedAssets[sortedAssets.length - 1].name} (${sortedAssets[sortedAssets.length - 1].id})` : 'N/A';

    return {
      period: performance.period,
      assets: performance.assets.map(asset => ({
        assetId: asset.id,
        assetName: asset.name,
        assetSymbol: asset.symbol,
        assetType: asset.type,
        currentValue: asset.currentValue,
        initialValue: asset.initialValue,
        absoluteReturn: asset.return,
        percentageReturn: asset.initialValue > 0 ? (asset.return / asset.initialValue) * 100 : 0,
        portfolioWeight: totalPortfolioValue > 0 ? (asset.currentValue / totalPortfolioValue) * 100 : 0,
      })),
      totalPortfolioValue,
      totalPortfolioReturn,
      totalPortfolioReturnPercentage,
      bestPerformer,
      worstPerformer,
    };
  }

  /**
   * Map asset summary to AssetAnalyticsSummaryResponseDto
   * @param summary - Asset summary data
   * @returns AssetAnalyticsSummaryResponseDto
   */
  static toAnalyticsSummaryResponseDto(summary: {
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
  }): AssetAnalyticsSummaryResponseDto {
    // Calculate diversification score (simplified)
    const diversificationScore = this.calculateDiversificationScore(summary.allocation);

    return {
      allocation: this.toAllocationResponseDto(summary.allocation),
      performance: {
        period: 'ALL', // Default period
        assets: summary.topAssets.map(asset => ({
          assetId: asset.id,
          assetName: asset.name,
          assetSymbol: asset.symbol,
          assetType: asset.type,
          currentValue: asset.getTotalValue(),
          initialValue: asset.initialValue,
          absoluteReturn: asset.getTotalValue() - asset.initialValue,
          percentageReturn: asset.initialValue > 0 ? ((asset.getTotalValue() - asset.initialValue) / asset.initialValue) * 100 : 0,
          portfolioWeight: summary.overview.totalValue > 0 ? (asset.getTotalValue() / summary.overview.totalValue) * 100 : 0,
        })),
        totalPortfolioValue: summary.overview.totalValue,
        totalPortfolioReturn: summary.performance.totalReturn,
        totalPortfolioReturnPercentage: summary.overview.totalValue > 0 ? (summary.performance.totalReturn / summary.overview.totalValue) * 100 : 0,
        bestPerformer: summary.performance.bestPerformer ? summary.performance.bestPerformer.getDisplayName() : 'N/A',
        worstPerformer: summary.performance.worstPerformer ? summary.performance.worstPerformer.getDisplayName() : 'N/A',
      },
      riskMetrics: this.toRiskMetricsResponseDto(summary.risk),
      totalAssets: summary.overview.totalAssets,
      totalValue: summary.overview.totalValue,
      diversificationScore,
      lastUpdated: new Date(),
    };
  }

  /**
   * Calculate diversification score based on allocation
   * @param allocation - Asset allocation by type
   * @returns Diversification score (0-100)
   */
  private static calculateDiversificationScore(allocation: Record<AssetType, number>): number {
    const values = Object.values(allocation);
    const nonZeroValues = values.filter(value => value > 0);
    
    if (nonZeroValues.length === 0) return 0;
    if (nonZeroValues.length === 1) return 20; // Low diversification
    
    // Calculate Herfindahl-Hirschman Index (HHI)
    const hhi = nonZeroValues.reduce((sum, value) => sum + Math.pow(value / 100, 2), 0);
    
    // Convert HHI to diversification score (0-100)
    // Lower HHI = higher diversification
    const maxHhi = 1; // Maximum HHI when all assets are in one category
    const diversificationScore = Math.max(0, (1 - hhi) * 100);
    
    return Math.round(diversificationScore);
  }
}
