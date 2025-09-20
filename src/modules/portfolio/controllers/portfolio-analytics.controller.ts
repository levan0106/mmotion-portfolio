import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PortfolioAnalyticsService } from '../services/portfolio-analytics.service';
import { PortfolioService } from '../services/portfolio.service';
import { PortfolioRepository } from '../repositories/portfolio.repository';
import { AssetDetailSummaryResponseDto } from '../dto/asset-detail-summary.dto';
import { PositionManagerService } from '../services/position-manager.service';

/**
 * Controller for Portfolio analytics and advanced reporting.
 */
@ApiTags('Portfolio Analytics')
@Controller('api/v1/portfolios/:id/analytics')
export class PortfolioAnalyticsController {
  constructor(
    private readonly portfolioAnalyticsService: PortfolioAnalyticsService,
    private readonly portfolioService: PortfolioService,
    private readonly portfolioRepository: PortfolioRepository,
    private readonly positionManagerService: PositionManagerService,
  ) {}

  /**
   * Get detailed performance analytics for a portfolio.
   */
  @Get('performance')
  @ApiOperation({ summary: 'Get detailed performance analytics' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiQuery({ name: 'period', required: false, description: 'Analysis period (1M, 3M, 6M, 1Y)' })
  @ApiResponse({ status: 200, description: 'Performance analytics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getPerformanceAnalytics(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('period') period?: string,
  ): Promise<any> {
    const performanceSummary = await this.portfolioAnalyticsService.getPerformanceSummary(id);
    
    // Add period-specific calculations based on query parameter
    const now = new Date();
    let periodStart: Date;
    
    switch (period) {
      case '1M':
        periodStart = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '3M':
        periodStart = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case '6M':
        periodStart = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case '1Y':
        periodStart = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        periodStart = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    }

    const periodROE = await this.portfolioAnalyticsService.calculateROE(id, periodStart, now);
    const periodTWR = await this.portfolioAnalyticsService.calculateTWR(id, periodStart, now);

    return {
      portfolioId: id,
      period: period || '1Y',
      periodStart: periodStart.toISOString(),
      periodEnd: now.toISOString(),
      ...performanceSummary,
      periodRoe: periodROE,
      periodTwr: periodTWR,
      calculatedAt: new Date().toISOString(),
    };
  }

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

    return {
      portfolioId: id,
      totalValue: portfolio.totalValue,
      allocation: groupedAllocation,
      groupBy: groupby || 'type',
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get historical performance data.
   */
  @Get('history')
  @ApiOperation({ summary: 'Get historical performance data' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of records' })
  @ApiResponse({ status: 200, description: 'Historical data retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getHistoricalData(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<any> {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date();
    start.setDate(end.getDate() - 30); // Default to last 30 days

    const returnHistory = await this.portfolioAnalyticsService.calculateReturnHistory(id, start, end);
    const performanceSummary = await this.portfolioAnalyticsService.getPerformanceSummary(id);

    return {
      portfolioId: id,
      period: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      returnHistory: returnHistory,
      performanceSummary: performanceSummary,
      limit: limit || 30,
      retrievedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate NAV snapshot for a portfolio.
   */
  @Get('snapshot')
  @ApiOperation({ summary: 'Generate NAV snapshot for a portfolio' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiQuery({ name: 'date', required: false, description: 'Snapshot date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'NAV snapshot generated successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async generateNavSnapshot(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('date') date?: string,
  ): Promise<any> {
    const snapshotDate = date ? new Date(date) : new Date();
    const navSnapshot = await this.portfolioAnalyticsService.generateNavSnapshot(id, snapshotDate);

    return {
      portfolioId: id,
      snapshot: navSnapshot,
      generatedAt: new Date().toISOString(),
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
  @ApiResponse({ status: 200, description: 'Risk-return data retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getRiskReturnAnalysis(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    const allocation = await this.portfolioService.getAssetAllocation(id);
    const portfolio = await this.portfolioService.getPortfolioDetails(id);

    // Generate mock risk-return data based on allocation
    const riskReturnData = allocation.map((item, index) => {
      // Mock risk and return calculations
      const baseReturn = (Math.random() - 0.5) * 0.4; // -20% to +20%
      const baseRisk = Math.random() * 0.3 + 0.1; // 10% to 40%
      
      // Adjust based on asset type
      let riskMultiplier = 1;
      let returnMultiplier = 1;
      
      switch (item.assetType.toLowerCase()) {
        case 'stock':
          riskMultiplier = 1.2;
          returnMultiplier = 1.1;
          break;
        case 'bond':
          riskMultiplier = 0.6;
          returnMultiplier = 0.7;
          break;
        case 'gold':
          riskMultiplier = 0.8;
          returnMultiplier = 0.9;
          break;
        case 'crypto':
          riskMultiplier = 1.8;
          returnMultiplier = 1.5;
          break;
        default:
          riskMultiplier = 1;
          returnMultiplier = 1;
      }

      const colors = ['#1976d2', '#dc004e', '#9c27b0', '#ff9800', '#4caf50', '#f44336'];
      
      return {
        assetType: item.assetType,
        return: baseReturn * returnMultiplier,
        risk: baseRisk * riskMultiplier,
        value: item.totalValue,
        color: colors[index % colors.length],
      };
    });

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
    const allocation = await this.portfolioService.getAssetAllocation(id);
    const portfolio = await this.portfolioService.getPortfolioDetails(id);

    // Generate mock risk metrics based on allocation
    const totalValue = portfolio.totalValue;
    const allocationCount = allocation.length;
    
    // Calculate mock risk metrics
    const baseVolatility = 0.15 + (Math.random() * 0.2); // 15% to 35%
    const baseReturn = (Math.random() - 0.3) * 0.4; // -12% to +28%
    
    const riskMetrics = {
      var95: baseVolatility * 1.65, // 95% VaR
      var99: baseVolatility * 2.33, // 99% VaR
      sharpeRatio: baseReturn / baseVolatility, // Sharpe ratio
      beta: 0.8 + Math.random() * 0.4, // 0.8 to 1.2
      volatility: baseVolatility,
      maxDrawdown: baseVolatility * (0.8 + Math.random() * 0.4), // Max drawdown
      calmarRatio: baseReturn / (baseVolatility * (0.8 + Math.random() * 0.4)), // Calmar ratio
      sortinoRatio: baseReturn / (baseVolatility * 0.7), // Sortino ratio
    };

    return {
      portfolioId: id,
      totalValue: totalValue,
      data: riskMetrics,
      calculatedAt: new Date().toISOString(),
    };
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
    const snapshotGranularity = granularity as any || 'MONTHLY'; // Default to MONTHLY for better performance
    
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
   * Get benchmark comparison data.
   */
  @Get('benchmark-comparison')
  @ApiOperation({ summary: 'Get benchmark comparison data' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ status: 200, description: 'Benchmark comparison data retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getBenchmarkComparison(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    const portfolio = await this.portfolioService.getPortfolioDetails(id);

    // Generate mock benchmark comparison data (last 12 months)
    const benchmarkData = [];
    const now = new Date();
    let portfolioValue = 100;
    let benchmarkValue = 100;
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      
      // Generate monthly returns
      const portfolioReturn = (Math.random() - 0.4) * 0.2; // -8% to +12%
      const benchmarkReturn = (Math.random() - 0.3) * 0.15; // -4.5% to +10.5%
      
      portfolioValue *= (1 + portfolioReturn);
      benchmarkValue *= (1 + benchmarkReturn);
      
      benchmarkData.push({
        date: date.toISOString().split('T')[0],
        portfolio: portfolioReturn * 100,
        benchmark: benchmarkReturn * 100,
        difference: (portfolioReturn - benchmarkReturn) * 100,
      });
    }

    return {
      portfolioId: id,
      totalValue: portfolio.totalValue,
      data: benchmarkData,
      benchmarkName: 'S&P 500',
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
   * Get comprehensive portfolio analytics report.
   */
  @Get('report')
  @ApiOperation({ summary: 'Get comprehensive portfolio analytics report' })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiResponse({ status: 200, description: 'Analytics report generated successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async getAnalyticsReport(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    const [
      performanceSummary,
      allocation,
      portfolio,
    ] = await Promise.all([
      this.portfolioAnalyticsService.getPerformanceSummary(id),
      this.portfolioService.getAssetAllocation(id),
      this.portfolioService.getPortfolioDetails(id),
    ]);

    return {
      portfolioId: id,
      portfolioName: portfolio.name,
      reportDate: new Date().toISOString(),
      performance: performanceSummary,
      allocation: allocation.reduce((acc, item) => {
        acc[item.assetType.toLowerCase()] = item.percentage;
        return acc;
      }, {}),
      summary: {
        totalValue: portfolio.totalValue,
        cashBalance: portfolio.cashBalance,
        unrealizedPl: portfolio.unrealizedPl,
        realizedPl: portfolio.realizedPl,
        assetCount: allocation.length,
      },
    };
  }
}
