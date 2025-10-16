import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PortfolioAnalyticsService } from '../services/portfolio-analytics.service';
import { PortfolioService } from '../services/portfolio.service';
import { PortfolioRepository } from '../repositories/portfolio.repository';
import { AssetDetailSummaryResponseDto } from '../dto/asset-detail-summary.dto';
import { PositionManagerService } from '../services/position-manager.service';
import { PerformanceSnapshotService } from '../services/performance-snapshot.service';
import { SnapshotGranularity } from '../enums/snapshot-granularity.enum';
import { MarketDataService } from '../../market-data/services/market-data.service';
import { RiskMetricsCalculationService } from '../services/risk-metrics-calculation.service';

/**
 * Controller for Portfolio analytics and advanced reporting.
 */
@ApiTags('Portfolio Analytics')
@Controller('api/v1/portfolios/:id/analytics')
export class PortfolioAnalyticsController {
  private readonly logger = new Logger(PortfolioAnalyticsController.name);

  constructor(
    private readonly portfolioAnalyticsService: PortfolioAnalyticsService,
    private readonly portfolioService: PortfolioService,
    private readonly portfolioRepository: PortfolioRepository,
    private readonly positionManagerService: PositionManagerService,
    private readonly performanceSnapshotService: PerformanceSnapshotService,
    private readonly marketDataService: MarketDataService,
    private readonly riskMetricsCalculationService: RiskMetricsCalculationService,
  ) {}

  /**
   * Get detailed asset allocation analytics.
   */
  @Get('allocation')
  @ApiOperation({ summary: 'Get detailed asset allocation analytics' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiQuery({ name: 'groupby', required: false, description: 'Group by type or class' })
  @ApiResponse({ status: 200, description: 'Asset allocation analytics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getAllocationAnalytics(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('groupby') groupby?: string,
  ): Promise<any> {
    const allocation = await this.portfolioService.getAssetAllocation(id);
    console.log('Allocation data from service:', allocation);
    const portfolio = await this.portfolioService.getPortfolioDetails(id);

    // Group allocation data based on query parameter
    let groupedAllocation: any;
    
    if (!allocation || allocation.length === 0) {
      groupedAllocation = {};
    } else if (groupby === 'class') {
      // TODO: Implement grouping by asset class
      groupedAllocation = allocation;
    } else {
      // Default grouping by type
      groupedAllocation = allocation.reduce((acc, item) => {
        if (item && item.assetType) {
          acc[item.assetType.toLowerCase()] = {
            percentage: item.percentage,
            value: item.totalValue,
          };
        }
        return acc;
      }, {});
    }
    // Calculate total deposits value and total assets value
    const totalDepositsValue = allocation.reduce((sum, item) => sum + (item.assetType == 'DEPOSITS' ? item.totalValue : 0), 0);
    const totalAssetsValue = allocation.reduce((sum, item) => sum + (item.assetType !== 'DEPOSITS' ? item.totalValue : 0), 0);

    // Calculate total value (assets + deposits)
    const totalValue = totalAssetsValue + totalDepositsValue;

    return {
      portfolioId: id,
      totalValue: totalValue,
      totalAssetsValue: totalAssetsValue,
      totalDepositsValue: totalDepositsValue,
      allocation: groupedAllocation,
      groupBy: groupby || 'type',
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get historical performance data for charting.
   */
  @Get('performance-history')
  @ApiOperation({ summary: 'Get historical performance data for charting' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiQuery({ name: 'period', required: false, description: 'Time period (1M, 3M, 6M, 1Y, 2Y, 5Y, ALL)' })
  @ApiResponse({ status: 200, description: 'Historical performance data retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getPerformanceHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('period') period?: string,
  ): Promise<any> {
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '1M':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '3M':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case '6M':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case '1Y':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      case '2Y':
        startDate = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
        break;
      case '5Y':
        startDate = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
        break;
      case 'ALL':
        startDate = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    }

    // Generate mock historical data for demonstration
    const historicalData = this.generateMockHistoricalData(id, startDate, now);
    
    return {
      portfolioId: id,
      period: period || '1Y',
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      data: historicalData,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate mock historical performance data.
   */
  private generateMockHistoricalData(portfolioId: string, startDate: Date, endDate: Date): any[] {
    const data = [];
    const currentDate = new Date(startDate);
    const baseValue = 100000000; // 100M VND base value
    let currentValue = baseValue;
    
    while (currentDate <= endDate) {
      // Generate realistic daily returns (-2% to +3%)
      const dailyReturn = (Math.random() - 0.4) * 0.05; // -2% to +3%
      currentValue = currentValue * (1 + dailyReturn);
      
      data.push({
        date: currentDate.toISOString().split('T')[0],
        value: Math.round(currentValue),
        nav: Math.round(currentValue),
        return: dailyReturn * 100,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return data;
  }

  /**
   * Get risk-return analysis data.
   */
  @Get('risk-return')
  @ApiOperation({ summary: 'Get risk-return analysis data' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiQuery({ name: 'period', required: false, description: 'Analysis period (1M, 3M, 1Y)' })
  @ApiResponse({ status: 200, description: 'Risk-return data retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getRiskReturnAnalysis(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('period') period?: string
  ): Promise<any> {
    const allocation = await this.portfolioService.getAssetAllocation(id);
    const portfolio = await this.portfolioService.getPortfolioDetails(id);

    // Get real performance data from asset group performance snapshots
    const riskReturnData = await Promise.all(allocation.map(async (item, index) => {
      try {
        // Get latest asset group performance snapshot for this asset type
        const groupSnapshots = await this.portfolioAnalyticsService.getAssetGroupPerformanceSnapshots(
          id,
          item.assetType.toUpperCase(), // Convert to uppercase to match database
          undefined, // startDate
          undefined, // endDate
          SnapshotGranularity.DAILY // granularity
        );

        let returnValue = 0;
        let riskValue = 0;

        if (groupSnapshots.length > 0) {
          // Get the most recent snapshot (sort by snapshot_date DESC to get latest first)
          const sortedSnapshots = groupSnapshots.sort((a, b) => 
            new Date(b.snapshotDate).getTime() - new Date(a.snapshotDate).getTime()
          );
          const latestSnapshot = sortedSnapshots[0];
          
          // Use period-specific return and volatility based on selected period
          const selectedPeriod = period || '1Y';
          switch (selectedPeriod) {
            case '1M':
              returnValue = Number(latestSnapshot.groupTWR1M || 0); // Already in percentage format
              riskValue = Number(latestSnapshot.groupVolatility1M || 0); // Already in percentage format
              break;
            case '3M':
              returnValue = Number(latestSnapshot.groupTWR3M || 0); // Already in percentage format
              riskValue = Number(latestSnapshot.groupVolatility3M || 0); // Already in percentage format
              break;
            case '1Y':
            default:
              returnValue = Number(latestSnapshot.groupTWR1Y || 0); // Already in percentage format
              riskValue = Number(latestSnapshot.groupVolatility1Y || 0); // Already in percentage format
              break;
          }
        } else {
          // Fallback: Calculate basic return from current vs initial value
          // This is a simplified calculation - in real scenario, we'd need historical data
          const currentValue = Number(item.totalValue || 0);
          const initialValue = currentValue * 0.8; // Assume 20% gain as fallback
          returnValue = currentValue > 0 ? ((currentValue - initialValue) / initialValue) * 100 : 0;
          
          // Use asset type-based risk estimates as fallback
          switch (item.assetType.toLowerCase()) {
            case 'stock':
              riskValue = 15; // 15% volatility
              break;
            case 'bond':
              riskValue = 5; // 5% volatility
              break;
            case 'gold':
              riskValue = 10; // 10% volatility
              break;
            case 'crypto':
              riskValue = 40; // 40% volatility
              break;
            default:
              riskValue = 12; // 12% volatility
          }
        }

        const colors = ['#1976d2', '#dc004e', '#9c27b0', '#ff9800', '#4caf50', '#f44336'];
        
        return {
          assetType: item.assetType,
          return: Number(returnValue.toFixed(2)), // Round to 2 decimal places
          risk: Number(riskValue.toFixed(2)), // Round to 2 decimal places
          value: Number(item.totalValue || 0),
          color: colors[index % colors.length],
        };
      } catch (error) {
        console.error(`Error getting performance data for asset type ${item.assetType}:`, error);
        
        // Fallback to basic calculation
        const currentValue = Number(item.totalValue || 0);
        const initialValue = currentValue * 0.8; // Assume 20% gain as fallback
        const returnValue = currentValue > 0 ? ((currentValue - initialValue) / initialValue) * 100 : 0;
        
        // Use asset type-based risk estimates
        let riskValue = 12; // Default
        switch (item.assetType.toLowerCase()) {
          case 'stock':
            riskValue = 15;
            break;
          case 'bond':
            riskValue = 5;
            break;
          case 'gold':
            riskValue = 10;
            break;
          case 'crypto':
            riskValue = 40;
            break;
        }

        const colors = ['#1976d2', '#dc004e', '#9c27b0', '#ff9800', '#4caf50', '#f44336'];
        
        return {
          assetType: item.assetType,
          return: Number(returnValue.toFixed(2)),
          risk: Number(riskValue.toFixed(2)),
          value: Number(item.totalValue || 0),
          color: colors[index % colors.length],
        };
      }
    }));

    return {
      portfolioId: id,
      totalValue: portfolio.totalValue,
      data: riskReturnData,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get asset performance comparison data.
   */
  @Get('asset-performance')
  @ApiOperation({ summary: 'Get asset performance comparison data' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ status: 200, description: 'Asset performance data retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getAssetPerformance(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    // Get real positions data from position manager service
    const portfolio = await this.portfolioService.getPortfolioDetails(id);
    const positions = await this.positionManagerService.getCurrentPositions(id);

    // Group positions by asset type and calculate real performance
    const groupedPositions = positions.reduce((acc: Record<string, {
      totalValue: number;
      totalUnrealizedPl: number;
      positions: any[];
    }>, position: any) => {
      const assetType = position.assetType || 'UNKNOWN';
      
      if (!acc[assetType]) {
        acc[assetType] = {
          totalValue: 0,
          totalUnrealizedPl: 0,
          positions: []
        };
      }
      
      acc[assetType].totalValue += position.currentValue || 0;
      acc[assetType].totalUnrealizedPl += position.unrealizedPl || 0;
      acc[assetType].positions.push(position);
      
      return acc;
    }, {});

    // Add deposits as a separate group
    try {
      const deposits = await this.portfolioService.getPortfolioDeposits(id);
      if (deposits && deposits.length > 0) {
        const depositGroup = deposits.reduce((acc, deposit: any) => {
          acc.totalValue += deposit.currentValue || 0;
          acc.totalUnrealizedPl += deposit.unrealizedPl || 0;
          acc.positions.push(deposit);
          return acc;
        }, {
          totalValue: 0,
          totalUnrealizedPl: 0,
          positions: []
        });

        if (depositGroup.totalValue > 0) {
          groupedPositions['DEPOSITS'] = depositGroup;
        }
      }
    } catch (error) {
      console.warn('Failed to get deposit data:', error.message);
    }

    // Calculate real performance data
    const performanceData = Object.entries(groupedPositions).map(([assetType, data]: [string, {
      totalValue: number;
      totalUnrealizedPl: number;
      positions: any[];
    }], index) => {
      // Calculate performance as unrealized P&L percentage
      const performance = data.totalValue > 0 
        ? (data.totalUnrealizedPl / data.totalValue) * 100 
        : 0;

      const colors = ['#1976d2', '#dc004e', '#9c27b0', '#ff9800', '#4caf50', '#f44336'];
      
      return {
        assetType: assetType,
        performance: performance / 100, // Convert to decimal for chart
        value: data.totalValue,
        color: colors[index % colors.length],
        unrealizedPl: data.totalUnrealizedPl,
        positionCount: data.positions.length,
      };
    });

    return {
      portfolioId: id,
      totalValue: portfolio.totalValue,
      data: performanceData,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get risk metrics dashboard data.
   */
  @Get('risk-metrics')
  @ApiOperation({ summary: 'Get risk metrics dashboard data' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ status: 200, description: 'Risk metrics data retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getRiskMetrics(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    try {
      const portfolio = await this.portfolioService.getPortfolioDetails(id);
      if (!portfolio) {
        throw new Error('Portfolio not found');
      }

      const snapshotDate = new Date();
      
      // Calculate real risk metrics using the risk metrics calculation service
      const riskMetrics1Y = await this.riskMetricsCalculationService.calculatePortfolioRiskMetrics({
        portfolioId: id,
        snapshotDate,
        granularity: SnapshotGranularity.DAILY,
        riskFreeRate: 0.02 // 2% annual risk-free rate
      });

      // Calculate VaR metrics
      const var95 = await this.riskMetricsCalculationService.calculateVaR(
        id, snapshotDate, 252, 0.95, SnapshotGranularity.DAILY
      );
      const var99 = await this.riskMetricsCalculationService.calculateVaR(
        id, snapshotDate, 252, 0.99, SnapshotGranularity.DAILY
      );

      // Calculate CVaR metrics
      const cvar95 = await this.riskMetricsCalculationService.calculateCVaR(
        id, snapshotDate, 252, 0.95, SnapshotGranularity.DAILY
      );

      // Calculate additional ratios
      const calmarRatio = riskMetrics1Y.volatility1Y > 0 
        ? (riskMetrics1Y.riskAdjustedReturn1Y / 100) / (riskMetrics1Y.maxDrawdown1Y / 100)
        : 0;

      const sortinoRatio = riskMetrics1Y.volatility1Y > 0 
        ? (riskMetrics1Y.riskAdjustedReturn1Y / 100) / (riskMetrics1Y.volatility1Y / 100)
        : 0;

      // Calculate beta (simplified - would need benchmark data for real calculation)
      const beta = Math.min(Math.max(riskMetrics1Y.volatility1Y / 20, 0.5), 2.0); // Estimate based on volatility

      const riskMetrics = {
        var95: var95,
        var99: var99,
        sharpeRatio: riskMetrics1Y.sharpeRatio1Y,
        beta: beta,
        volatility: riskMetrics1Y.volatility1Y,
        maxDrawdown: riskMetrics1Y.maxDrawdown1Y,
        calmarRatio: calmarRatio,
        sortinoRatio: sortinoRatio,
        cvar95: cvar95,
        // Additional metrics for comprehensive dashboard
        volatility1M: riskMetrics1Y.volatility1M,
        volatility3M: riskMetrics1Y.volatility3M,
        sharpeRatio1M: riskMetrics1Y.sharpeRatio1M,
        sharpeRatio3M: riskMetrics1Y.sharpeRatio3M,
        maxDrawdown1M: riskMetrics1Y.maxDrawdown1M,
        maxDrawdown3M: riskMetrics1Y.maxDrawdown3M,
      };

      return {
        portfolioId: id,
        totalValue: portfolio.totalValue,
        data: riskMetrics,
        calculatedAt: new Date().toISOString(),
        period: '1Y', // Primary period for main metrics
        additionalPeriods: ['1M', '3M', '1Y']
      };
    } catch (error) {
      this.logger.error(`Error calculating risk metrics for portfolio ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get diversification heatmap data.
   */
  @Get('diversification-heatmap')
  @ApiOperation({ summary: 'Get diversification heatmap data' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ status: 200, description: 'Diversification data retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getDiversificationHeatmap(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    const allocation = await this.portfolioService.getAssetAllocation(id);
    const portfolio = await this.portfolioService.getPortfolioDetails(id);

    // Generate mock correlation data
    const assetTypes = allocation.map(item => item.assetType);
    const heatmapData = [];
    
    for (let i = 0; i < assetTypes.length; i++) {
      for (let j = i + 1; j < assetTypes.length; j++) {
        const correlation = (Math.random() - 0.5) * 1.6; // -0.8 to +0.8
        heatmapData.push({
          asset1: assetTypes[i],
          asset2: assetTypes[j],
          correlation: correlation,
        });
      }
    }

    return {
      portfolioId: id,
      totalValue: portfolio.totalValue,
      data: heatmapData,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get cash flow analysis data.
   */
  @Get('cash-flow-analysis')
  @ApiOperation({ summary: 'Get cash flow analysis data' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ status: 200, description: 'Cash flow data retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getCashFlowAnalysis(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    const portfolio = await this.portfolioService.getPortfolioDetails(id);

    // Generate mock cash flow data (last 6 months)
    const cashFlowData = [];
    const now = new Date();
    let cumulativeBalance = portfolio.cashBalance;
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const inflow = Math.random() * 1000000; // 0 to 1M
      const outflow = Math.random() * 800000; // 0 to 800K
      const netFlow = inflow - outflow;
      cumulativeBalance += netFlow;
      
      cashFlowData.push({
        date: date.toISOString().split('T')[0],
        inflow: Math.round(inflow),
        outflow: Math.round(outflow),
        netFlow: Math.round(netFlow),
        cumulativeBalance: Math.round(cumulativeBalance),
      });
    }

    return {
      portfolioId: id,
      totalValue: portfolio.totalValue,
      data: cashFlowData,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get asset allocation timeline data.
   */
  @Get('allocation-timeline')
  @ApiOperation({ summary: 'Get asset allocation timeline data with real snapshot data' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiQuery({ name: 'months', required: false, description: 'Number of months to look back (default: 12, max: 12)' })
  @ApiQuery({ name: 'granularity', required: false, enum: ['DAILY', 'WEEKLY', 'MONTHLY'], description: 'Snapshot granularity (default: MONTHLY)' })
  @ApiResponse({ status: 200, description: 'Allocation timeline data retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getAllocationTimeline(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('months') months?: string,
    @Query('granularity') granularity?: string,
  ): Promise<any> {
    // Limit to maximum 12 months
    const monthsToLookBack = Math.min(months ? parseInt(months, 10) : 12, 12);
    const snapshotGranularity = granularity as any || 'DAILY'; // Default to DAILY for detailed view
    
    if (isNaN(monthsToLookBack) || monthsToLookBack < 1) {
      throw new Error('Months parameter must be a number between 1 and 12');
    }

    // Always use snapshot data for real allocation timeline
    return await this.portfolioAnalyticsService.calculateAllocationTimeline(
      id, 
      monthsToLookBack, 
      true, // Always use snapshots for real data
      snapshotGranularity
    );
  }


  /**
   * Get benchmark comparison data using real portfolio snapshots and real VNIndex data.
   */
  @Get('benchmark-comparison')
  @ApiOperation({ summary: 'Get benchmark comparison data using real portfolio snapshots and real VNIndex data' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiQuery({ name: 'months', required: false, description: 'Number of months to look back (default: 12, max: 24)' })
  @ApiQuery({ name: 'twrPeriod', required: false, description: 'TWR period to use (1D, 1W, 1M, 3M, 6M, 1Y, YTD, default: 1M)' })
  @ApiResponse({ status: 200, description: 'Benchmark comparison data retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getBenchmarkComparison(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('months') months?: string,
    @Query('twrPeriod') twrPeriod?: string,
  ): Promise<any> {
    const portfolio = await this.portfolioService.getPortfolioDetails(id);
    
    // Limit to maximum 24 months
    const monthsToLookBack = Math.min(months ? parseInt(months, 10) : 12, 24);
    
    if (isNaN(monthsToLookBack) || monthsToLookBack < 1) {
      throw new Error('Months parameter must be a number between 1 and 24');
    }

    // Set TWR period (default: 1M)
    const twrPeriodToUse = twrPeriod || '1M';
    const validTwrPeriods = ['1D', '1W', '1M', '3M', '6M', '1Y', 'YTD'];
    
    if (!validTwrPeriods.includes(twrPeriodToUse)) {
      throw new Error(`TWR period must be one of: ${validTwrPeriods.join(', ')}`);
    }

    // Get real portfolio snapshot data
    const endDate = new Date();
    let startDate = new Date();
    startDate.setMonth(endDate.getMonth() - monthsToLookBack);
    
    console.log(`Benchmark comparison: Initial timeframe ${monthsToLookBack} months from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // First, get daily all available snapshots to determine the correct startDate
    const portfolioSnapshots = await this.portfolioAnalyticsService.getPortfolioSnapshotTimeline(
      id,
      startDate,
      endDate,
      SnapshotGranularity.DAILY
    );
    
    // Generate benchmark data (VN Index simulation)
    const benchmarkData = [];
    let portfolioValue = 0;
    let benchmarkValue = 0; 
    
    // Try to get performance snapshots first (more accurate TWR data)
    let performanceSnapshots = [];
    try {
      performanceSnapshots = await this.performanceSnapshotService.getPortfolioPerformanceSnapshots(
        id,
        startDate,
        endDate,
        SnapshotGranularity.DAILY
      );
      console.log(`Found ${performanceSnapshots.length} performance snapshots with TWR data`);
    } catch (error) {
      console.log('Performance snapshots not available, falling back to portfolio snapshots');
    }

    // If we have performance snapshots with TWR data, use them
    if (performanceSnapshots && performanceSnapshots.length > 0) {
      console.log(`Benchmark comparison: Using TWR from performance snapshots (${performanceSnapshots.length} snapshots)`);
      
      // Sort snapshots by date
      const sortedSnapshots = performanceSnapshots.sort((a, b) => 
        new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime()
      );

      // Determine the correct startDate based on available snapshots
      const minSnapshotDate = new Date(Math.min(...performanceSnapshots.map(s => new Date(s.snapshotDate).getTime())));
      if (minSnapshotDate > startDate) {
        startDate = minSnapshotDate;
      }

      // Generate date list based on timeframe
      const dateList = this.generateDateList(startDate, endDate, monthsToLookBack);
      console.log(`Generated ${dateList.length} dates for timeframe ${monthsToLookBack} months`);
      
      // Fetch real VNIndex data for benchmark comparison
      const dataReturns = await this.getDataForBenchmark(startDate, endDate);
      
      // Use TWR data from performance snapshots
      for (let i = 0; i < dateList.length; i++) {
        const date = dateList[i];
        
        // Find the closest performance snapshot for this date
        const closestSnapshot = this.findClosestSnapshotOnOrBefore(date, sortedSnapshots);
        
        // Select appropriate TWR column based on twrPeriod parameter
        let portfolioReturn = 0;
        let twrColumn = '';
        if (closestSnapshot) {
          switch (twrPeriodToUse) {
            case '1D':
              portfolioReturn = parseFloat(closestSnapshot.portfolioTWR1D) || 0;
              twrColumn = 'portfolioTWR1D';
              break;
            case '1W':
              portfolioReturn = parseFloat(closestSnapshot.portfolioTWR1W) || 0;
              twrColumn = 'portfolioTWR1W';
              break;
            case '1M':
              portfolioReturn = parseFloat(closestSnapshot.portfolioTWR1M) || 0;
              twrColumn = 'portfolioTWR1M';
              break;
            case '3M':
              portfolioReturn = parseFloat(closestSnapshot.portfolioTWR3M) || 0;
              twrColumn = 'portfolioTWR3M';
              break;
            case '6M':
              portfolioReturn = parseFloat(closestSnapshot.portfolioTWR6M) || 0;
              twrColumn = 'portfolioTWR6M';
              break;
            case '1Y':
              portfolioReturn = parseFloat(closestSnapshot.portfolioTWR1Y) || 0;
              twrColumn = 'portfolioTWR1Y';
              break;
            case 'YTD':
              portfolioReturn = parseFloat(closestSnapshot.portfolioTWRYTD) || 0;
              twrColumn = 'portfolioTWRYTD';
              break;
            default:
              portfolioReturn = parseFloat(closestSnapshot.portfolioTWR1M) || 0;
              twrColumn = 'portfolioTWR1M';
          }
        }
        
        // Debug log for first few iterations
        if (i < 3) {
          console.log(`Date ${date.toISOString().split('T')[0]}: Using ${twrColumn} = ${portfolioReturn}% (TWR period: ${twrPeriodToUse}, data range: ${monthsToLookBack} months)`);
        }
        
        // Get real VNIndex return for this date
        const benchmarkReturn = this.getDataReturnForDate(date, dataReturns);
        
        benchmarkData.push({
          date: date.toISOString().split('T')[0],
          portfolio: Number(portfolioReturn.toFixed(4)),
          benchmark: Number((benchmarkReturn * 100).toFixed(4)),
          difference: Number((portfolioReturn - (benchmarkReturn * 100)).toFixed(4)),
        });
      }
    }
    // If we have real portfolio data, use it (fallback)
    else if (portfolioSnapshots && portfolioSnapshots.length > 0) {
      console.log(`Benchmark comparison: Real portfolio snapshots available for benchmark comparison using 
        daily granularity ${portfolioSnapshots.length} months to look back`);
      // Sort snapshots by date
      const sortedSnapshots = portfolioSnapshots.sort((a, b) => 
        new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime()
      );      

      // Determine the correct startDate based on available snapshots
      if (portfolioSnapshots && portfolioSnapshots.length > 0) {
        const minSnapshotDate = new Date(Math.min(...portfolioSnapshots.map(s => new Date(s.snapshotDate).getTime())));
        
        if (minSnapshotDate > startDate) {
          startDate = minSnapshotDate;
        } 
      }      

      // Generate date list based on timeframe
      const dateList = this.generateDateList(startDate, endDate, monthsToLookBack);
      console.log(`Generated ${dateList.length} dates for timeframe ${monthsToLookBack} months`);
      
      // Calculate cumulative returns for each date
      const cumulativeReturns = this.calculateCumulativeReturns(dateList, sortedSnapshots);
      console.log(`Calculated cumulative returns for ${cumulativeReturns.length} dates`);
      
      // Fetch real VNIndex data for benchmark comparison
      const dataReturns = await this.getDataForBenchmark(startDate, endDate);
      
      // Generate benchmark data based on timeframe
      for (let i = 0; i < dateList.length; i++) {
        const date = dateList[i];
        const portfolioReturn = cumulativeReturns[i] || 0;
        
        // Get real VNIndex return for this date
        const benchmarkReturn = this.getDataReturnForDate(date, dataReturns);
        
        benchmarkData.push({
          date: date.toISOString().split('T')[0],
          portfolio: Number(portfolioReturn.toFixed(4)),
          benchmark: Number((benchmarkReturn * 100).toFixed(4)),
          difference: Number((portfolioReturn - (benchmarkReturn * 100)).toFixed(4)),
        });
      }
    } else {
      console.log(`Benchmark comparison: No snapshots available for benchmark comparison using 
        daily granularity ${monthsToLookBack} months to look back`);
      // Fallback to mock data if no snapshots available
      for (let i = monthsToLookBack - 1; i >= 0; i--) {
        const date = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
        
        // Generate monthly returns
        const portfolioReturn = (Math.random() - 0.4) * 0.2; // TODO: -8% to +12%
        const benchmarkReturn = (Math.random() - 0.3) * 0.15; // TODO: -4.5% to +10.5%
        
        portfolioValue *= (1 + portfolioReturn);
        benchmarkValue *= (1 + benchmarkReturn);
        
        benchmarkData.push({
          date: date.toISOString().split('T')[0],
          portfolio: portfolioReturn * 100,
          benchmark: benchmarkReturn * 100,
          difference: (portfolioReturn - benchmarkReturn) * 100,
        });
      }
    }

    return {
      portfolioId: id,
      totalValue: portfolio.totalValue,
      data: benchmarkData,
      benchmarkName: 'VN30 Index',
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        months: monthsToLookBack,
      },
      twrPeriod: twrPeriodToUse,
      dataSource: performanceSnapshots && performanceSnapshots.length > 0 ? 'performance_snapshots_twr' : 
                 (portfolioSnapshots && portfolioSnapshots.length > 0 ? 'portfolio_snapshots_cumulative' : 'simulated'),
      snapshotCount: performanceSnapshots ? performanceSnapshots.length : (portfolioSnapshots ? portfolioSnapshots.length : 0),
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get MWR benchmark comparison data using real portfolio snapshots.
   */
  @Get('mwr-benchmark-comparison')
  @ApiOperation({ summary: 'Get MWR benchmark comparison data using real portfolio snapshots' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiQuery({ name: 'months', required: false, description: 'Number of months to look back (default: 12, max: 24)' })
  @ApiQuery({ name: 'mwrPeriod', required: false, description: 'MWR period to use (1D, 1W, 1M, 3M, 6M, 1Y, YTD, default: 1M)' })
  @ApiResponse({ status: 200, description: 'MWR benchmark comparison data retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getMWRBenchmarkComparison(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('months') months?: string,
    @Query('mwrPeriod') mwrPeriod?: string,
  ): Promise<any> {
    const portfolio = await this.portfolioService.getPortfolioDetails(id);
    
    // Limit to maximum 24 months
    const monthsToLookBack = Math.min(months ? parseInt(months, 10) : 12, 24);
    
    if (isNaN(monthsToLookBack) || monthsToLookBack < 1) {
      throw new Error('Months parameter must be a number between 1 and 24');
    }

    // Set MWR period (default: 1M)
    const mwrPeriodToUse = mwrPeriod || '1M';
    const validMwrPeriods = ['1D', '1W', '1M', '3M', '6M', '1Y', 'YTD'];
    
    if (!validMwrPeriods.includes(mwrPeriodToUse)) {
      throw new Error(`MWR period must be one of: ${validMwrPeriods.join(', ')}`);
    }

    // Get real portfolio snapshot data
    const endDate = new Date();
    let startDate = new Date();
    startDate.setMonth(endDate.getMonth() - monthsToLookBack);
    
    console.log(`MWR Benchmark comparison: Initial timeframe ${monthsToLookBack} months from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // First, get daily all available snapshots to determine the correct startDate
    const portfolioSnapshots = await this.portfolioAnalyticsService.getPortfolioSnapshotTimeline(
      id,
      startDate,
      endDate,
      SnapshotGranularity.DAILY
    );
    
    // Generate benchmark data (VN Index simulation)
    const benchmarkData = [];
    let portfolioValue = 0;
    let benchmarkValue = 0; 
    
    // Try to get performance snapshots first (more accurate MWR data)
    let performanceSnapshots = [];
    try {
      performanceSnapshots = await this.performanceSnapshotService.getPortfolioPerformanceSnapshots(
        id,
        startDate,
        endDate,
        SnapshotGranularity.DAILY
      );
      console.log(`Found ${performanceSnapshots.length} performance snapshots with MWR data`);
    } catch (error) {
      console.log('Performance snapshots not available, falling back to portfolio snapshots');
    }

    // If we have performance snapshots with MWR data, use them
    if (performanceSnapshots && performanceSnapshots.length > 0) {
      console.log(`MWR Benchmark comparison: Using MWR from performance snapshots (${performanceSnapshots.length} snapshots)`);
      
      // Sort snapshots by date
      const sortedSnapshots = performanceSnapshots.sort((a, b) => 
        new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime()
      );

      // Determine the correct startDate based on available snapshots
      const minSnapshotDate = new Date(Math.min(...performanceSnapshots.map(s => new Date(s.snapshotDate).getTime())));
      if (minSnapshotDate > startDate) {
        startDate = minSnapshotDate;
      }

      // Generate date list based on timeframe
      const dateList = this.generateDateList(startDate, endDate, monthsToLookBack);
      console.log(`Generated ${dateList.length} dates for timeframe ${monthsToLookBack} months`);
      
      // Fetch real VNIndex data for benchmark comparison
      const dataReturns = await this.getDataForBenchmark(startDate, endDate);
      
      // Use MWR data from performance snapshots
      for (let i = 0; i < dateList.length; i++) {
        const date = dateList[i];
        
        // Find the closest performance snapshot for this date with non-zero MWR
        const closestSnapshot = this.findClosestSnapshotWithMWR(date, sortedSnapshots, mwrPeriodToUse);
        
        // Select appropriate MWR column based on mwrPeriod parameter
        let portfolioReturn = 0;
        let mwrColumn = '';
        if (closestSnapshot) {
          switch (mwrPeriodToUse) {
            case '1D':
              // Fallback to 1M since 1D MWR not available
              portfolioReturn = parseFloat(closestSnapshot.portfolioMWR1M) || 0;
              mwrColumn = 'portfolioMWR1M (fallback from 1D)';
              break;
            case '1W':
              // Fallback to 1M since 1W MWR not available
              portfolioReturn = parseFloat(closestSnapshot.portfolioMWR1M) || 0;
              mwrColumn = 'portfolioMWR1M (fallback from 1W)';
              break;
            case '1M':
              portfolioReturn = parseFloat(closestSnapshot.portfolioMWR1M) || 0;
              mwrColumn = 'portfolioMWR1M';
              break;
            case '3M':
              portfolioReturn = parseFloat(closestSnapshot.portfolioMWR3M) || 0;
              mwrColumn = 'portfolioMWR3M';
              break;
            case '6M':
              portfolioReturn = parseFloat(closestSnapshot.portfolioMWR6M) || 0;
              mwrColumn = 'portfolioMWR6M';
              break;
            case '1Y':
              portfolioReturn = parseFloat(closestSnapshot.portfolioMWR1Y) || 0;
              mwrColumn = 'portfolioMWR1Y';
              break;
            case 'YTD':
              portfolioReturn = parseFloat(closestSnapshot.portfolioMWRYTD) || 0;
              mwrColumn = 'portfolioMWRYTD';
              break;
            default:
              portfolioReturn = parseFloat(closestSnapshot.portfolioMWR1M) || 0;
              mwrColumn = 'portfolioMWR1M';
          }
        }
        
        // Debug log for first few iterations (optional)
        // if (i < 3) {
        //   console.log(`Date ${date.toISOString().split('T')[0]}: Using ${mwrColumn} = ${portfolioReturn}% (MWR period: ${mwrPeriodToUse}, data range: ${monthsToLookBack} months)`);
        // }
        
        // Get real VNIndex return for this date
        const benchmarkReturn = this.getDataReturnForDate(date, dataReturns);
        
        benchmarkData.push({
          date: date.toISOString().split('T')[0],
          portfolio: Number(portfolioReturn.toFixed(4)),
          benchmark: Number((benchmarkReturn * 100).toFixed(4)),
          difference: Number((portfolioReturn - (benchmarkReturn * 100)).toFixed(4)),
        });
      }
    }
    // If we have real portfolio data, use it (fallback)
    else if (portfolioSnapshots && portfolioSnapshots.length > 0) {
      console.log(`MWR Benchmark comparison: Real portfolio snapshots available for benchmark comparison using 
        daily granularity ${portfolioSnapshots.length} months to look back`);
      // Sort snapshots by date
      const sortedSnapshots = portfolioSnapshots.sort((a, b) => 
        new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime()
      );      

      // Determine the correct startDate based on available snapshots
      if (portfolioSnapshots && portfolioSnapshots.length > 0) {
        const minSnapshotDate = new Date(Math.min(...portfolioSnapshots.map(s => new Date(s.snapshotDate).getTime())));
        
        if (minSnapshotDate > startDate) {
          startDate = minSnapshotDate;
        } 
      }      

      // Generate date list based on timeframe
      const dateList = this.generateDateList(startDate, endDate, monthsToLookBack);
      console.log(`Generated ${dateList.length} dates for timeframe ${monthsToLookBack} months`);
      
      // Calculate cumulative returns for each date
      const cumulativeReturns = this.calculateCumulativeReturns(dateList, sortedSnapshots);
      console.log(`Calculated cumulative returns for ${cumulativeReturns.length} dates`);
      
      // Fetch real VNIndex data for benchmark comparison
      const dataReturns = await this.getDataForBenchmark(startDate, endDate);
      
      // Generate benchmark data based on timeframe
      for (let i = 0; i < dateList.length; i++) {
        const date = dateList[i];
        const portfolioReturn = cumulativeReturns[i] || 0;
        
        // Get real VNIndex return for this date
        const benchmarkReturn = this.getDataReturnForDate(date, dataReturns);

        benchmarkData.push({
          date: date.toISOString().split('T')[0],
          portfolio: Number(portfolioReturn.toFixed(4)),
          benchmark: Number((benchmarkReturn * 100).toFixed(4)),
          difference: Number((portfolioReturn - (benchmarkReturn * 100)).toFixed(4)),
        });
      }
    } else {
      console.log(`MWR Benchmark comparison: No snapshots available for benchmark comparison using 
        daily granularity ${monthsToLookBack} months to look back`);
      // Fallback to mock data if no snapshots available
      for (let i = monthsToLookBack - 1; i >= 0; i--) {
        const date = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
        
        // Generate monthly returns
        const portfolioReturn = (Math.random() - 0.4) * 0.2; // TODO: -8% to +12%
        const benchmarkReturn = (Math.random() - 0.3) * 0.15; // TODO: -4.5% to +10.5%
        
        portfolioValue *= (1 + portfolioReturn);
        benchmarkValue *= (1 + benchmarkReturn);
        
        benchmarkData.push({
          date: date.toISOString().split('T')[0],
          portfolio: portfolioReturn * 100,
          benchmark: benchmarkReturn * 100,
          difference: (portfolioReturn - benchmarkReturn) * 100,
        });
      }
    }

    return {
      portfolioId: id,
      totalValue: portfolio.totalValue,
      data: benchmarkData,
      benchmarkName: 'VN30 Index',
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        months: monthsToLookBack,
      },
      mwrPeriod: mwrPeriodToUse,
      dataSource: performanceSnapshots && performanceSnapshots.length > 0 ? 'performance_snapshots_mwr' : 
                 (portfolioSnapshots && portfolioSnapshots.length > 0 ? 'portfolio_snapshots_cumulative' : 'simulated'),
      snapshotCount: performanceSnapshots ? performanceSnapshots.length : (portfolioSnapshots ? portfolioSnapshots.length : 0),
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get asset detail summary data.
   */
  @Get('asset-detail-summary')
  @ApiOperation({ summary: 'Get asset detail summary data' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Asset detail data retrieved successfully',
    type: AssetDetailSummaryResponseDto
  })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getAssetDetailSummary(@Param('id', ParseUUIDPipe) id: string): Promise<AssetDetailSummaryResponseDto> {
    return await this.portfolioAnalyticsService.getAssetDetailSummary(id);
  }

  /**
   * Generate optimized date list based on user's date range filter
   * Adaptive sampling based on actual date range
   */
  private generateDateList(startDate: Date, endDate: Date, months: number): Date[] {
    const dates: Date[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    
    // Calculate actual days in the user's filter range
    const daysBetween = Math.ceil((end.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Adaptive sampling based on user's actual date range:
    // - Very short range (≤7 days): Daily data (7 points)
    // - Short range (8-30 days): Daily data (8-30 points)
    // - Medium range (31-90 days): Every 2-3 days (~30-45 points)
    // - Long range (91-180 days): Weekly data (~13-26 points)
    // - Very long range (181-365 days): Bi-weekly data (~13-26 points)
    // - Ultra long range (>365 days): Monthly data (~12-24 points)
    let sampleInterval = 1;
    let samplingStrategy = '';
    
    if (daysBetween <= 7) {
      sampleInterval = 1;
      samplingStrategy = 'Daily (very short range)';
    } else if (daysBetween <= 30) {
      sampleInterval = 1;
      samplingStrategy = 'Daily (short range)';
    } else if (daysBetween <= 90) {
      sampleInterval = Math.max(1, Math.floor(daysBetween / 30));
      samplingStrategy = 'Every 2-3 days (medium range)';
    } else if (daysBetween <= 180) {
      sampleInterval = Math.max(1, Math.floor(daysBetween / 25));
      samplingStrategy = 'Weekly (long range)';
    } else if (daysBetween <= 365) {
      sampleInterval = Math.max(1, Math.floor(daysBetween / 20));
      samplingStrategy = 'Bi-weekly (very long range)';
    } else {
      sampleInterval = Math.max(1, Math.floor(daysBetween / 15));
      samplingStrategy = 'Monthly (ultra long range)';
    }
    
    let dayCount = 0;
    while (current <= end) {
      if (dayCount % sampleInterval === 0) {
        dates.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
      dayCount++;
    }
    
    // Always include the end date if not already included
    if (dates.length === 0 || dates[dates.length - 1]?.getTime() !== end.getTime()) {
      dates.push(new Date(end));
    }
    
    // Ensure we have at least 2 points for meaningful comparison
    if (dates.length < 2) {
      dates.push(new Date(startDate));
      dates.push(new Date(end));
    }
    
    console.log(`Generated ${dates.length} adaptive dates using ${samplingStrategy} (${sampleInterval}-day intervals) for ${daysBetween} days from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
    return dates;
  }

  /**
   * Calculate cumulative returns for each date based on snapshots
   */
  private calculateCumulativeReturns(dateList: Date[], snapshots: any[]): number[] {
    const returns: number[] = [];
    
    if (snapshots.length === 0) {
      return new Array(dateList.length).fill(0);
    }
    
    // Pre-sort snapshots by date for optimized lookup
    const sortedSnapshots = snapshots.sort((a, b) => 
      new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime()
    );
    
    // Find the first snapshot value as baseline
    const firstSnapshot = sortedSnapshots[0];
    const baselineValue = parseFloat(firstSnapshot.totalPortfolioValue) || 0;
    const baselineDate = new Date(firstSnapshot.snapshotDate);
    
    console.log(`Optimized baseline: ${baselineValue} on ${baselineDate.toISOString().split('T')[0]}`);
    
    // Create a map for O(1) snapshot lookup by date
    const snapshotMap = new Map();
    sortedSnapshots.forEach(snapshot => {
      const dateKey = new Date(snapshot.snapshotDate).toISOString().split('T')[0];
      snapshotMap.set(dateKey, snapshot);
    });
    
    for (let i = 0; i < dateList.length; i++) {
      const currentDate = dateList[i];
      const dateKey = currentDate.toISOString().split('T')[0];
      
      // Try exact date match first (O(1))
      let closestSnapshot = snapshotMap.get(dateKey);
      
      // If no exact match, find closest snapshot (optimized)
      if (!closestSnapshot) {
        closestSnapshot = this.findClosestSnapshotOnOrBeforeOptimized(currentDate, sortedSnapshots);
      }
      
      if (closestSnapshot) {
        const currentValue = parseFloat(closestSnapshot.totalPortfolioValue) || 0;
        const returnValue = baselineValue > 0 ? ((currentValue - baselineValue) / baselineValue) * 100 : 0;
        returns.push(returnValue);
      } else {
        // No snapshot found, use previous return or 0
        const previousReturn = returns.length > 0 ? returns[returns.length - 1] : 0;
        returns.push(previousReturn);
      }
    }
    
    return returns;
  }


  /**
   * Find the closest snapshot that is on or before a given date (optimized)
   */
  private findClosestSnapshotOnOrBeforeOptimized(targetDate: Date, sortedSnapshots: any[]): any | null {
    if (sortedSnapshots.length === 0) return null;
    
    const targetTime = targetDate.getTime();
    let closestSnapshot = null;
    
    // Binary search for better performance
    let left = 0;
    let right = sortedSnapshots.length - 1;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const snapshotTime = new Date(sortedSnapshots[mid].snapshotDate).getTime();
      
      if (snapshotTime <= targetTime) {
        closestSnapshot = sortedSnapshots[mid];
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    
    return closestSnapshot;
  }

  /**
   * Find the closest snapshot that is on or before a given date
   */
  private findClosestSnapshotOnOrBefore(targetDate: Date, snapshots: any[]): any | null {
    if (snapshots.length === 0) return null;
    
    let closest: any | null = null;
    let closestDate = new Date(0); // Start with epoch
    
    for (const snapshot of snapshots) {
      const snapshotDate = new Date(snapshot.snapshotDate);
      
      // Only consider snapshots that are on or before the target date
      if (snapshotDate <= targetDate) {
        // If this snapshot is closer to target date than current closest
        if (snapshotDate > closestDate) {
        closest = snapshot;
          closestDate = snapshotDate;
        }
      }
    }
    
    return closest;
  }

  /**
   * Find the closest snapshot with non-zero MWR data
   */
  private findClosestSnapshotWithMWR(targetDate: Date, snapshots: any[], mwrPeriod: string): any | null {
    if (snapshots.length === 0) return null;
    
    let closest: any | null = null;
    let closestDate = new Date(0); // Start with epoch
    
    // console.log(`DEBUG: Looking for snapshot with non-zero MWR for date ${targetDate.toISOString().split('T')[0]}, period: ${mwrPeriod}`);
    
    for (const snapshot of snapshots) {
      const snapshotDate = new Date(snapshot.snapshotDate);
      
      // Only consider snapshots that are on or before the target date
      if (snapshotDate <= targetDate) {
        // Check if this snapshot has non-zero MWR data
        let hasNonZeroMWR = false;
        let mwrValue = 0;
        switch (mwrPeriod) {
          case '1D':
          case '1W':
            // Fallback to 1M since 1D/1W not available
            mwrValue = parseFloat(snapshot.portfolioMWR1M);
            hasNonZeroMWR = mwrValue !== 0;
            break;
          case '1M':
            mwrValue = parseFloat(snapshot.portfolioMWR1M);
            hasNonZeroMWR = mwrValue !== 0;
            break;
          case '3M':
            mwrValue = parseFloat(snapshot.portfolioMWR3M);
            hasNonZeroMWR = mwrValue !== 0;
            break;
          case '6M':
            mwrValue = parseFloat(snapshot.portfolioMWR6M);
            hasNonZeroMWR = mwrValue !== 0;
            break;
          case '1Y':
            mwrValue = parseFloat(snapshot.portfolioMWR1Y);
            hasNonZeroMWR = mwrValue !== 0;
            break;
          case 'YTD':
            mwrValue = parseFloat(snapshot.portfolioMWRYTD);
            hasNonZeroMWR = mwrValue !== 0;
            break;
          default:
            mwrValue = parseFloat(snapshot.portfolioMWR1M);
            hasNonZeroMWR = mwrValue !== 0;
        }
        
        // console.log(`DEBUG: Snapshot ${snapshotDate.toISOString().split('T')[0]}: MWR=${mwrValue}, hasNonZero=${hasNonZeroMWR}`);
        
        // If this snapshot has non-zero MWR and is closer to target date than current closest
        if (hasNonZeroMWR && snapshotDate > closestDate) {
          closest = snapshot;
          closestDate = snapshotDate;
          // console.log(`DEBUG: Found better snapshot: ${snapshotDate.toISOString().split('T')[0]} with MWR=${mwrValue}`);
        }
      }
    }
    
    // If no snapshot with non-zero MWR found, return null instead of fallback
    if (!closest) {
      // console.log(`DEBUG: No snapshot with non-zero MWR found, returning null`);
      return null;
    }
    
    // console.log(`DEBUG: Final snapshot: ${closestDate.toISOString().split('T')[0]}`);
    return closest;
  }

  /**
   * Get data return for a specific date
   * @param date - Target date
   * @param dataReturns - Data returns data
   * @returns Data return percentage
   */
  private getDataReturnForDate(date: Date, dataReturns: Array<{date: string, return: number}>): number {
    if (!dataReturns || dataReturns.length === 0) {
      // Fallback to simulated data if no data available
      return Math.random() * 0.15 - 0.03; // -3% to +12% range
    }

    const targetDateStr = date.toISOString().split('T')[0];
    
    // Find exact date match
    const exactMatch = dataReturns.find(item => item.date === targetDateStr);
    if (exactMatch) {
      return exactMatch.return / 100; // Convert percentage to decimal
    }

    // Find closest date (before or after)
    const sortedReturns = dataReturns.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Find the closest date
    let closest = sortedReturns[0];
    let minDiff = Math.abs(new Date(closest.date).getTime() - date.getTime());

    for (const item of sortedReturns) {
      const diff = Math.abs(new Date(item.date).getTime() - date.getTime());
      if (diff < minDiff) {
        minDiff = diff;
        closest = item;
      }
    }

    return closest.return / 100; // Convert percentage to decimal
  }

  // Cache for benchmark data to avoid repeated API calls
  private benchmarkDataCache = new Map<string, Array<{date: string, return: number}>>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

  /**
   * Get data for benchmark comparison (with caching)
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Promise<Array<{date: string, return: number}>> data returns
   */
  private async getDataForBenchmark(
    startDate: Date,
    endDate: Date
  ): Promise<Array<{date: string, return: number}>> {
    const cacheKey = `${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}`;
    const now = Date.now();
    
    // Check cache first
    if (this.benchmarkDataCache.has(cacheKey) && this.cacheExpiry.get(cacheKey) > now) {
      console.log(`Using cached benchmark data for ${cacheKey}`);
      return this.benchmarkDataCache.get(cacheKey);
    }
    
    try {
      console.log(`Fetching real VNIndex data for benchmark comparison from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
      const dataReturns = await this.marketDataService.getMarketDataReturnsHistoryForBenchmarkFromAPI('VN30INDEX', 'STOCK', startDate, endDate);
      console.log(`Successfully fetched ${dataReturns.length} data return data points`);
      
      // Cache the result
      this.benchmarkDataCache.set(cacheKey, dataReturns);
      this.cacheExpiry.set(cacheKey, now + this.CACHE_DURATION);
      
      return dataReturns;
    } catch (error) {
      console.error(`Error fetching data: ${error.message}`);
      console.log('Falling back to simulated benchmark data');
      return [];
    }
  }
}
