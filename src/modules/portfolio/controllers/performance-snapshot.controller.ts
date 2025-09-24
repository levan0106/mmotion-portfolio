import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PerformanceSnapshotService, PerformanceSnapshotResult } from '../services/performance-snapshot.service';
import { SnapshotGranularity } from '../enums/snapshot-granularity.enum';
import { PortfolioPerformanceSnapshot } from '../entities/portfolio-performance-snapshot.entity';
import { AssetPerformanceSnapshot } from '../entities/asset-performance-snapshot.entity';
import { AssetGroupPerformanceSnapshot } from '../entities/asset-group-performance-snapshot.entity';

export interface CreatePerformanceSnapshotDto {
  portfolioId: string;
  snapshotDate: string;
  granularity?: SnapshotGranularity;
  createdBy?: string;
}

export interface PerformanceSnapshotQueryDto {
  startDate?: string;
  endDate?: string;
  granularity?: SnapshotGranularity;
  assetId?: string;
  assetType?: string;
}

@ApiTags('Performance Snapshots')
@Controller('api/v1/performance-snapshots')
export class PerformanceSnapshotController {
  constructor(
    private readonly performanceSnapshotService: PerformanceSnapshotService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create performance snapshots for a portfolio' })
  @ApiResponse({ status: 201, description: 'Performance snapshots created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  async createPerformanceSnapshots(
    @Body() createDto: CreatePerformanceSnapshotDto
  ): Promise<PerformanceSnapshotResult> {
    return await this.performanceSnapshotService.createPerformanceSnapshots(
      createDto.portfolioId,
      createDto.snapshotDate,
      createDto.granularity || SnapshotGranularity.DAILY,
      createDto.createdBy
    );
  }

  @Get('portfolio/:portfolioId')
  @ApiOperation({ summary: 'Get portfolio performance snapshots' })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'granularity', required: false, enum: SnapshotGranularity })
  @ApiResponse({ status: 200, description: 'Portfolio performance snapshots retrieved successfully' })
  async getPortfolioPerformanceSnapshots(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('granularity') granularity?: SnapshotGranularity
  ): Promise<PortfolioPerformanceSnapshot[]> {
    return await this.performanceSnapshotService.getPortfolioPerformanceSnapshots(
      portfolioId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      granularity
    );
  }

  @Get('asset/:portfolioId')
  @ApiOperation({ summary: 'Get asset performance snapshots' })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiQuery({ name: 'assetId', required: false, description: 'Asset ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'granularity', required: false, enum: SnapshotGranularity })
  @ApiResponse({ status: 200, description: 'Asset performance snapshots retrieved successfully' })
  async getAssetPerformanceSnapshots(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Query('assetId') assetId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('granularity') granularity?: SnapshotGranularity
  ): Promise<AssetPerformanceSnapshot[]> {
    return await this.performanceSnapshotService.getAssetPerformanceSnapshots(
      portfolioId,
      assetId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      granularity
    );
  }

  @Get('group/:portfolioId')
  @ApiOperation({ summary: 'Get asset group performance snapshots' })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiQuery({ name: 'assetType', required: false, description: 'Asset type (Stock, Bond, Crypto, etc.)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'granularity', required: false, enum: SnapshotGranularity })
  @ApiResponse({ status: 200, description: 'Asset group performance snapshots retrieved successfully' })
  async getAssetGroupPerformanceSnapshots(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Query('assetType') assetType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('granularity') granularity?: SnapshotGranularity
  ): Promise<AssetGroupPerformanceSnapshot[]> {
    return await this.performanceSnapshotService.getAssetGroupPerformanceSnapshots(
      portfolioId,
      assetType,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      granularity
    );
  }

  @Delete('portfolio/:portfolioId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete performance snapshots by date range' })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'granularity', required: false, enum: SnapshotGranularity })
  @ApiResponse({ status: 200, description: 'Performance snapshots deleted successfully' })
  async deletePerformanceSnapshotsByDateRange(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('granularity') granularity?: SnapshotGranularity
  ): Promise<{ deletedCount: number; message: string }> {
    return await this.performanceSnapshotService.deletePerformanceSnapshotsByDateRange(
      portfolioId,
      new Date(startDate),
      new Date(endDate),
      granularity
    );
  }

  @Get('portfolio/:portfolioId/summary')
  @ApiOperation({ summary: 'Get portfolio performance summary' })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiQuery({ name: 'period', required: false, description: 'Time period (1M, 3M, 6M, 1Y, YTD)' })
  @ApiResponse({ status: 200, description: 'Portfolio performance summary retrieved successfully' })
  async getPortfolioPerformanceSummary(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Query('period') period: string = '1Y'
  ): Promise<any> {
    // Get latest portfolio performance snapshot
    const snapshots = await this.performanceSnapshotService.getPortfolioPerformanceSnapshots(
      portfolioId,
      undefined,
      undefined,
      SnapshotGranularity.DAILY
    );

    if (snapshots.length === 0) {
      return {
        portfolioId,
        period,
        message: 'No performance data available'
      };
    }

    const latestSnapshot = snapshots[snapshots.length - 1];

    return {
      portfolioId,
      period,
      snapshotDate: latestSnapshot.snapshotDate,
      twr: latestSnapshot.getTWRForPeriod(period),
      mwr: latestSnapshot.getMWRForPeriod(period),
      irr: latestSnapshot.getIRRForPeriod(period),
      alpha: latestSnapshot.getAlphaForPeriod(period),
      beta: latestSnapshot.getBetaForPeriod(period),
      cashFlow: {
        inflows: latestSnapshot.totalCashInflows,
        outflows: latestSnapshot.totalCashOutflows,
        net: latestSnapshot.netCashFlow
      },
      benchmarkData: latestSnapshot.benchmarkData
    };
  }

  @Get('asset/:portfolioId/summary')
  @ApiOperation({ summary: 'Get asset performance summary' })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiQuery({ name: 'assetId', required: false, description: 'Asset ID' })
  @ApiQuery({ name: 'period', required: false, description: 'Time period (1D, 1W, 1M, 3M, 6M, 1Y, YTD)' })
  @ApiResponse({ status: 200, description: 'Asset performance summary retrieved successfully' })
  async getAssetPerformanceSummary(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Query('assetId') assetId?: string,
    @Query('period') period: string = '1Y'
  ): Promise<any> {
    // Get latest asset performance snapshots
    const snapshots = await this.performanceSnapshotService.getAssetPerformanceSnapshots(
      portfolioId,
      assetId,
      undefined,
      undefined,
      SnapshotGranularity.DAILY
    );

    if (snapshots.length === 0) {
      return {
        portfolioId,
        assetId,
        period,
        message: 'No performance data available'
      };
    }

    // Group by asset
    const assetSummaries = snapshots.reduce((acc, snapshot) => {
      if (!acc[snapshot.assetId]) {
        acc[snapshot.assetId] = {
          assetId: snapshot.assetId,
          assetSymbol: snapshot.assetSymbol,
          latestSnapshot: snapshot,
          twr: snapshot.getTWRForPeriod(period),
          volatility: snapshot.getVolatilityForPeriod(period),
          sharpeRatio: snapshot.getSharpeRatioForPeriod(period),
          maxDrawdown: snapshot.getMaxDrawdownForPeriod(period),
          riskAdjustedReturn: snapshot.getRiskAdjustedReturnForPeriod(period)
        };
      }
      return acc;
    }, {} as any);

    return {
      portfolioId,
      period,
      assetSummaries: Object.values(assetSummaries)
    };
  }

  @Get('group/:portfolioId/summary')
  @ApiOperation({ summary: 'Get asset group performance summary' })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiQuery({ name: 'assetType', required: false, description: 'Asset type (Stock, Bond, Crypto, etc.)' })
  @ApiQuery({ name: 'period', required: false, description: 'Time period (1D, 1W, 1M, 3M, 6M, 1Y, YTD)' })
  @ApiResponse({ status: 200, description: 'Asset group performance summary retrieved successfully' })
  async getAssetGroupPerformanceSummary(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Query('assetType') assetType?: string,
    @Query('period') period: string = '1Y'
  ): Promise<any> {
    // Get latest asset group performance snapshots
    const snapshots = await this.performanceSnapshotService.getAssetGroupPerformanceSnapshots(
      portfolioId,
      assetType,
      undefined,
      undefined,
      SnapshotGranularity.DAILY
    );

    if (snapshots.length === 0) {
      return {
        portfolioId,
        assetType,
        period,
        message: 'No performance data available'
      };
    }

    // Group by asset type
    const groupSummaries = snapshots.reduce((acc, snapshot) => {
      if (!acc[snapshot.assetType]) {
        acc[snapshot.assetType] = {
          assetType: snapshot.assetType,
          latestSnapshot: snapshot,
          twr: snapshot.getTWRForPeriod(period),
          sharpeRatio: snapshot.getSharpeRatioForPeriod(period),
          volatility: snapshot.getVolatilityForPeriod(period),
          maxDrawdown: snapshot.getMaxDrawdownForPeriod(period),
          riskAdjustedReturn: snapshot.getRiskAdjustedReturnForPeriod(period),
          riskLevel: snapshot.riskLevel,
          performanceGrade: snapshot.performanceGrade,
          assetCount: snapshot.assetCount,
          activeAssetCount: snapshot.activeAssetCount,
          allocationPercentage: snapshot.allocationPercentage
        };
      }
      return acc;
    }, {} as any);

    return {
      portfolioId,
      period,
      groupSummaries: Object.values(groupSummaries)
    };
  }

  @Get('trends/:portfolioId')
  @ApiOperation({ summary: 'Get performance trends for a portfolio' })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiQuery({ name: 'metric', required: false, description: 'Performance metric (twr, mwr, irr, alpha, beta, sharpe, volatility)' })
  @ApiQuery({ name: 'period', required: false, description: 'Time period (1D, 1W, 1M, 3M, 6M, 1Y, YTD)' })
  @ApiQuery({ name: 'granularity', required: false, enum: SnapshotGranularity })
  @ApiResponse({ status: 200, description: 'Performance trends retrieved successfully' })
  async getPerformanceTrends(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Query('metric') metric: string = 'twr',
    @Query('period') period: string = '1Y',
    @Query('granularity') granularity: SnapshotGranularity = SnapshotGranularity.DAILY
  ): Promise<any> {
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '1D':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '1W':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '1M':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case '3M':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case '6M':
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case '1Y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case 'YTD':
        startDate.setMonth(0, 1); // January 1st
        break;
      default:
        startDate.setFullYear(endDate.getFullYear() - 1);
    }

    // Get portfolio performance snapshots
    const snapshots = await this.performanceSnapshotService.getPortfolioPerformanceSnapshots(
      portfolioId,
      startDate,
      endDate,
      granularity
    );

    if (snapshots.length === 0) {
      return {
        portfolioId,
        metric,
        period,
        granularity,
        message: 'No performance data available',
        data: []
      };
    }

    // Extract trend data based on metric
    const trendData = snapshots.map(snapshot => {
      const dataPoint: any = {
        date: snapshot.snapshotDate.toISOString().split('T')[0],
        portfolio: 0,
        benchmark: 0
      };

      switch (metric.toLowerCase()) {
        case 'twr':
          dataPoint.portfolio = snapshot.getTWRForPeriod(period);
          dataPoint.benchmark = snapshot.benchmarkData?.twr || 0;
          break;
        case 'mwr':
          dataPoint.portfolio = snapshot.getMWRForPeriod(period);
          dataPoint.benchmark = snapshot.benchmarkData?.mwr || 0;
          break;
        case 'irr':
          dataPoint.portfolio = snapshot.getIRRForPeriod(period);
          dataPoint.benchmark = snapshot.benchmarkData?.irr || 0;
          break;
        case 'alpha':
          dataPoint.portfolio = snapshot.getAlphaForPeriod(period);
          dataPoint.benchmark = 0; // Alpha is relative to benchmark
          break;
        case 'beta':
          dataPoint.portfolio = snapshot.getBetaForPeriod(period);
          dataPoint.benchmark = 1; // Beta of 1 is market average
          break;
        case 'sharpe':
          // Calculate Sharpe ratio from available data (simplified)
          dataPoint.portfolio = snapshot.getTWRForPeriod(period) / (snapshot.portfolioTrackingError1Y || 1);
          dataPoint.benchmark = 0; // No benchmark Sharpe ratio available
          break;
        case 'volatility':
          // Use tracking error as proxy for volatility
          dataPoint.portfolio = snapshot.portfolioTrackingError1Y || 0;
          dataPoint.benchmark = 0; // No benchmark volatility available
          break;
        default:
          dataPoint.portfolio = snapshot.getTWRForPeriod(period);
          dataPoint.benchmark = snapshot.benchmarkData?.twr || 0;
      }

      return dataPoint;
    });

    return {
      portfolioId,
      metric,
      period,
      granularity,
      data: trendData,
      summary: {
        current: trendData[trendData.length - 1]?.portfolio || 0,
        benchmark: trendData[trendData.length - 1]?.benchmark || 0,
        start: trendData[0]?.portfolio || 0,
        end: trendData[trendData.length - 1]?.portfolio || 0,
        change: trendData.length > 1 ? 
          (trendData[trendData.length - 1]?.portfolio || 0) - (trendData[0]?.portfolio || 0) : 0
      }
    };
  }

  @Get('comparison/:portfolioId')
  @ApiOperation({ summary: 'Get performance comparison with benchmark' })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiQuery({ name: 'benchmarkId', required: false, description: 'Benchmark ID (default: 00000000-0000-0000-0000-000000000001)' })
  @ApiQuery({ name: 'period', required: false, description: 'Time period (1D, 1W, 1M, 3M, 6M, 1Y, YTD)' })
  @ApiQuery({ name: 'granularity', required: false, enum: SnapshotGranularity })
  @ApiResponse({ status: 200, description: 'Performance comparison retrieved successfully' })
  async getPerformanceComparison(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Query('benchmarkId') benchmarkId: string = '00000000-0000-0000-0000-000000000001',
    @Query('period') period: string = '1Y',
    @Query('granularity') granularity: SnapshotGranularity = SnapshotGranularity.DAILY
  ): Promise<any> {
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '1M':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case '3M':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case '6M':
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case '1Y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case 'YTD':
        startDate.setMonth(0, 1); // January 1st
        break;
      default:
        startDate.setFullYear(endDate.getFullYear() - 1);
    }

    // Get portfolio performance snapshots
    const snapshots = await this.performanceSnapshotService.getPortfolioPerformanceSnapshots(
      portfolioId,
      startDate,
      endDate,
      granularity
    );

    if (snapshots.length === 0) {
      return {
        portfolioId,
        benchmarkId,
        period,
        granularity,
        message: 'No performance data available',
        comparison: {
          portfolio: {},
          benchmark: {},
          metrics: {}
        }
      };
    }

    // Get latest snapshot for comparison
    const latestSnapshot = snapshots[snapshots.length - 1];
    const benchmarkData = latestSnapshot.benchmarkData?.[benchmarkId];

    // Calculate comparison metrics
    const portfolioMetrics = {
      twr: latestSnapshot.getTWRForPeriod(period),
      mwr: latestSnapshot.getMWRForPeriod(period),
      irr: latestSnapshot.getIRRForPeriod(period),
      alpha: latestSnapshot.getAlphaForPeriod(period),
      beta: latestSnapshot.getBetaForPeriod(period),
      informationRatio: latestSnapshot.portfolioInformationRatio1Y,
      trackingError: latestSnapshot.portfolioTrackingError1Y,
      cashFlow: {
        inflows: latestSnapshot.totalCashInflows,
        outflows: latestSnapshot.totalCashOutflows,
        net: latestSnapshot.netCashFlow
      }
    };

    const benchmarkMetrics = benchmarkData ? {
      return: benchmarkData.benchmarkReturn,
      alpha: benchmarkData.alpha,
      beta: benchmarkData.beta,
      trackingError: benchmarkData.trackingError,
      informationRatio: benchmarkData.informationRatio
    } : {
      return: 0,
      alpha: 0,
      beta: 1,
      trackingError: 0,
      informationRatio: 0
    };

    // Calculate relative performance
    const relativeMetrics = {
      returnDifference: portfolioMetrics.twr - benchmarkMetrics.return,
      alpha: portfolioMetrics.alpha,
      beta: portfolioMetrics.beta,
      trackingError: portfolioMetrics.trackingError,
      informationRatio: portfolioMetrics.informationRatio,
      outperformance: portfolioMetrics.twr > benchmarkMetrics.return,
      riskAdjustedOutperformance: portfolioMetrics.informationRatio > 0
    };

    // Generate comparison summary
    const summary = {
      period,
      benchmarkId,
      portfolioOutperformed: relativeMetrics.outperformance,
      riskAdjustedOutperformance: relativeMetrics.riskAdjustedOutperformance,
      keyMetrics: {
        portfolioReturn: portfolioMetrics.twr,
        benchmarkReturn: benchmarkMetrics.return,
        alpha: relativeMetrics.alpha,
        beta: relativeMetrics.beta,
        informationRatio: relativeMetrics.informationRatio
      },
      riskMetrics: {
        trackingError: relativeMetrics.trackingError,
        beta: relativeMetrics.beta,
        riskLevel: relativeMetrics.beta > 1.2 ? 'High' : relativeMetrics.beta < 0.8 ? 'Low' : 'Medium'
      }
    };

    return {
      portfolioId,
      benchmarkId,
      period,
      granularity,
      snapshotDate: latestSnapshot.snapshotDate,
      comparison: {
        portfolio: portfolioMetrics,
        benchmark: benchmarkMetrics,
        relative: relativeMetrics,
        summary
      },
      historicalData: snapshots.map(snapshot => ({
        date: snapshot.snapshotDate.toISOString().split('T')[0],
        portfolio: snapshot.getTWRForPeriod(period),
        benchmark: snapshot.benchmarkData?.[benchmarkId]?.benchmarkReturn || 0,
        alpha: snapshot.getAlphaForPeriod(period),
        beta: snapshot.getBetaForPeriod(period)
      }))
    };
  }

  @Get('risk-analysis/:portfolioId')
  @ApiOperation({ summary: 'Get risk analysis for a portfolio' })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiQuery({ name: 'period', required: false, description: 'Time period (1M, 3M, 6M, 1Y, YTD)' })
  @ApiQuery({ name: 'granularity', required: false, enum: SnapshotGranularity })
  @ApiResponse({ status: 200, description: 'Risk analysis retrieved successfully' })
  async getRiskAnalysis(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Query('period') period: string = '1Y',
    @Query('granularity') granularity: SnapshotGranularity = SnapshotGranularity.DAILY
  ): Promise<any> {
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '1M':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case '3M':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case '6M':
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case '1Y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case 'YTD':
        startDate.setMonth(0, 1); // January 1st
        break;
      default:
        startDate.setFullYear(endDate.getFullYear() - 1);
    }

    // Get portfolio performance snapshots
    const snapshots = await this.performanceSnapshotService.getPortfolioPerformanceSnapshots(
      portfolioId,
      startDate,
      endDate,
      granularity
    );

    if (snapshots.length === 0) {
      return {
        portfolioId,
        period,
        granularity,
        message: 'No performance data available',
        riskAnalysis: {
          riskMetrics: {},
          riskLevel: 'Unknown',
          recommendations: []
        }
      };
    }

    // Get latest snapshot for risk analysis
    const latestSnapshot = snapshots[snapshots.length - 1];

    // Calculate risk metrics
    const riskMetrics = {
      // Volatility metrics
      trackingError: latestSnapshot.portfolioTrackingError1Y || 0,
      informationRatio: latestSnapshot.portfolioInformationRatio1Y || 0,
      
      // Beta analysis
      beta1M: latestSnapshot.portfolioBeta1M || 0,
      beta3M: latestSnapshot.portfolioBeta3M || 0,
      beta6M: latestSnapshot.portfolioBeta6M || 0,
      beta1Y: latestSnapshot.portfolioBeta1Y || 0,
      betaYTD: latestSnapshot.portfolioBetaYTD || 0,
      
      // Alpha analysis
      alpha1M: latestSnapshot.portfolioAlpha1M || 0,
      alpha3M: latestSnapshot.portfolioAlpha3M || 0,
      alpha6M: latestSnapshot.portfolioAlpha6M || 0,
      alpha1Y: latestSnapshot.portfolioAlpha1Y || 0,
      alphaYTD: latestSnapshot.portfolioAlphaYTD || 0,
      
      // Return metrics for risk-adjusted analysis
      twr1Y: latestSnapshot.portfolioTWR1Y || 0,
      mwr1Y: latestSnapshot.portfolioMWR1Y || 0,
      irr1Y: latestSnapshot.portfolioIRRYTD || 0,
      
      // Cash flow risk
      cashFlow: {
        inflows: latestSnapshot.totalCashInflows || 0,
        outflows: latestSnapshot.totalCashOutflows || 0,
        net: latestSnapshot.netCashFlow || 0,
        volatility: Math.abs(latestSnapshot.netCashFlow || 0) / Math.max(latestSnapshot.totalCashInflows || 1, 1)
      }
    };

    // Calculate risk level based on multiple factors
    const beta = riskMetrics.beta1Y;
    const trackingError = riskMetrics.trackingError;
    const informationRatio = riskMetrics.informationRatio;
    const cashFlowVolatility = riskMetrics.cashFlow.volatility;

    let riskLevel = 'Low';
    let riskScore = 0;

    // Beta risk assessment
    if (beta > 1.3) {
      riskScore += 3;
    } else if (beta > 1.1) {
      riskScore += 2;
    } else if (beta > 0.9) {
      riskScore += 1;
    }

    // Tracking error risk assessment
    if (trackingError > 0.15) {
      riskScore += 3;
    } else if (trackingError > 0.10) {
      riskScore += 2;
    } else if (trackingError > 0.05) {
      riskScore += 1;
    }

    // Information ratio assessment
    if (informationRatio < 0) {
      riskScore += 2;
    } else if (informationRatio < 0.5) {
      riskScore += 1;
    }

    // Cash flow volatility assessment
    if (cashFlowVolatility > 0.5) {
      riskScore += 2;
    } else if (cashFlowVolatility > 0.2) {
      riskScore += 1;
    }

    // Determine risk level
    if (riskScore >= 6) {
      riskLevel = 'High';
    } else if (riskScore >= 3) {
      riskLevel = 'Medium';
    } else {
      riskLevel = 'Low';
    }

    // Generate risk recommendations
    const recommendations = [];
    
    if (beta > 1.2) {
      recommendations.push({
        type: 'Beta Risk',
        level: 'Warning',
        message: `High beta (${beta.toFixed(2)}) indicates high market sensitivity. Consider diversifying with lower-beta assets.`,
        action: 'Diversify portfolio with defensive assets'
      });
    }

    if (trackingError > 0.10) {
      recommendations.push({
        type: 'Tracking Error',
        level: 'Warning',
        message: `High tracking error (${(trackingError * 100).toFixed(1)}%) indicates significant deviation from benchmark.`,
        action: 'Review portfolio allocation and rebalancing strategy'
      });
    }

    if (informationRatio < 0) {
      recommendations.push({
        type: 'Information Ratio',
        level: 'Critical',
        message: `Negative information ratio (${informationRatio.toFixed(2)}) indicates poor risk-adjusted performance.`,
        action: 'Review investment strategy and risk management'
      });
    }

    if (cashFlowVolatility > 0.3) {
      recommendations.push({
        type: 'Cash Flow Risk',
        level: 'Warning',
        message: `High cash flow volatility (${(cashFlowVolatility * 100).toFixed(1)}%) may impact performance consistency.`,
        action: 'Implement cash flow management strategy'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'Overall Risk',
        level: 'Good',
        message: 'Portfolio shows good risk management with balanced metrics.',
        action: 'Continue current strategy with regular monitoring'
      });
    }

    // Historical risk analysis
    const historicalRisk = snapshots.map(snapshot => ({
      date: snapshot.snapshotDate.toISOString().split('T')[0],
      beta: snapshot.portfolioBeta1Y || 0,
      trackingError: snapshot.portfolioTrackingError1Y || 0,
      informationRatio: snapshot.portfolioInformationRatio1Y || 0,
      alpha: snapshot.portfolioAlpha1Y || 0
    }));

    return {
      portfolioId,
      period,
      granularity,
      snapshotDate: latestSnapshot.snapshotDate,
      riskAnalysis: {
        riskMetrics,
        riskLevel,
        riskScore,
        riskFactors: {
          beta: {
            value: beta,
            level: beta > 1.2 ? 'High' : beta < 0.8 ? 'Low' : 'Medium',
            impact: beta > 1.2 ? 'High market sensitivity' : beta < 0.8 ? 'Low market sensitivity' : 'Moderate market sensitivity'
          },
          trackingError: {
            value: trackingError,
            level: trackingError > 0.10 ? 'High' : trackingError < 0.05 ? 'Low' : 'Medium',
            impact: trackingError > 0.10 ? 'High deviation from benchmark' : trackingError < 0.05 ? 'Low deviation from benchmark' : 'Moderate deviation from benchmark'
          },
          informationRatio: {
            value: informationRatio,
            level: informationRatio > 0.5 ? 'Good' : informationRatio < 0 ? 'Poor' : 'Average',
            impact: informationRatio > 0.5 ? 'Good risk-adjusted returns' : informationRatio < 0 ? 'Poor risk-adjusted returns' : 'Average risk-adjusted returns'
          },
          cashFlowVolatility: {
            value: cashFlowVolatility,
            level: cashFlowVolatility > 0.3 ? 'High' : cashFlowVolatility < 0.1 ? 'Low' : 'Medium',
            impact: cashFlowVolatility > 0.3 ? 'High cash flow uncertainty' : cashFlowVolatility < 0.1 ? 'Stable cash flows' : 'Moderate cash flow uncertainty'
          }
        },
        recommendations,
        historicalRisk
      }
    };
  }
}
