import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { RiskManagementService } from '../services/risk-management.service';
import { SetRiskTargetsDto, UpdateRiskTargetsDto } from '../dto/risk-target.dto';

export interface RiskMonitoringQueryDto {
  portfolioId?: string;
  marketPrices?: Record<string, number>;
}

export interface RiskAlertsHistoryQueryDto {
  assetId?: string;
  portfolioId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Controller for managing risk targets and risk monitoring operations.
 * Provides REST API endpoints for stop-loss, take-profit, and risk alerts.
 */
@ApiTags('Risk Management')
@Controller('api/v1/risk-management')
export class RiskManagementController {
  constructor(private readonly riskManagementService: RiskManagementService) {}

  /**
   * Set risk targets for an asset
   * @param assetId Asset ID
   * @param setRiskTargetsDto Risk targets data
   * @returns Created or updated asset target
   */
  @Post(':id/targets')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Set risk targets for an asset' })
  @ApiResponse({
    status: 201,
    description: 'Risk targets set successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid risk targets data',
  })
  @ApiResponse({
    status: 404,
    description: 'Asset not found',
  })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiBody({ type: SetRiskTargetsDto })
  @UsePipes(new ValidationPipe({ transform: true }))
  async setRiskTargets(
    @Param('id', ParseUUIDPipe) assetId: string,
    @Body() setRiskTargetsDto: SetRiskTargetsDto,
  ): Promise<any> {
    // Ensure assetId matches the parameter
    setRiskTargetsDto.assetId = assetId;
    return this.riskManagementService.setRiskTargets(setRiskTargetsDto);
  }

  /**
   * Get risk targets for an asset
   * @param assetId Asset ID
   * @returns Risk targets
   */
  @Get(':id/targets')
  @ApiOperation({ summary: 'Get risk targets for an asset' })
  @ApiResponse({
    status: 200,
    description: 'Risk targets retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Asset or risk targets not found',
  })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  async getRiskTargets(@Param('id', ParseUUIDPipe) assetId: string): Promise<any> {
    return this.riskManagementService.getRiskTargets(assetId);
  }

  /**
   * Update risk targets for an asset
   * @param assetId Asset ID
   * @param updateRiskTargetsDto Update data
   * @returns Updated asset target
   */
  @Put(':id/targets')
  @ApiOperation({ summary: 'Update risk targets for an asset' })
  @ApiResponse({
    status: 200,
    description: 'Risk targets updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid update data',
  })
  @ApiResponse({
    status: 404,
    description: 'Asset or risk targets not found',
  })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiBody({ type: UpdateRiskTargetsDto })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateRiskTargets(
    @Param('id', ParseUUIDPipe) assetId: string,
    @Body() updateRiskTargetsDto: UpdateRiskTargetsDto,
  ): Promise<any> {
    return this.riskManagementService.updateRiskTargets(assetId, updateRiskTargetsDto);
  }

  /**
   * Remove risk targets for an asset
   * @param assetId Asset ID
   * @returns Deactivated asset target
   */
  @Delete(':id/targets')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove risk targets for an asset' })
  @ApiResponse({
    status: 204,
    description: 'Risk targets removed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Asset or risk targets not found',
  })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  async removeRiskTargets(@Param('id', ParseUUIDPipe) assetId: string): Promise<void> {
    await this.riskManagementService.removeRiskTargets(assetId);
  }

  /**
   * Get all active risk targets
   * @returns Array of active risk targets
   */
  @Get('targets/active')
  @ApiOperation({ summary: 'Get all active risk targets' })
  @ApiResponse({
    status: 200,
    description: 'Active risk targets retrieved successfully',
  })
  async getAllActiveRiskTargets(): Promise<any[]> {
    return this.riskManagementService.getAllActiveRiskTargets();
  }

  /**
   * Get risk targets for a portfolio
   * @param portfolioId Portfolio ID
   * @returns Array of risk targets for portfolio assets
   */
  @Get('targets/portfolio/:portfolioId')
  @ApiOperation({ summary: 'Get risk targets for a portfolio' })
  @ApiResponse({
    status: 200,
    description: 'Portfolio risk targets retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio not found',
  })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  async getPortfolioRiskTargets(@Param('portfolioId', ParseUUIDPipe) portfolioId: string): Promise<any[]> {
    return this.riskManagementService.getPortfolioRiskTargets(portfolioId);
  }

  /**
   * Monitor risk targets and generate alerts
   * @param query Monitoring query parameters
   * @returns Risk monitoring result
   */
  @Get('targets/monitor')
  @ApiOperation({ summary: 'Monitor risk targets and generate alerts' })
  @ApiResponse({
    status: 200,
    description: 'Risk monitoring completed successfully',
  })
  @ApiQuery({ name: 'portfolioId', required: false, description: 'Portfolio ID filter' })
  @ApiQuery({ name: 'marketPrices', required: false, description: 'Current market prices (JSON string)' })
  async monitorRiskTargets(@Query() query: RiskMonitoringQueryDto): Promise<{
    alerts: any[];
    triggeredAlerts: any[];
    riskMetrics: any[];
  }> {
    const { portfolioId, marketPrices } = query;
    
    let marketPricesObj: Record<string, number> = {};
    if (marketPrices) {
      marketPricesObj = marketPrices;
    }

    return this.riskManagementService.monitorRiskTargets(marketPricesObj, portfolioId);
  }

  /**
   * Get risk summary for a portfolio
   * @param portfolioId Portfolio ID
   * @param marketPrices Current market prices
   * @returns Risk summary
   */
  @Get('targets/portfolio/:portfolioId/summary')
  @ApiOperation({ summary: 'Get risk summary for a portfolio' })
  @ApiResponse({
    status: 200,
    description: 'Portfolio risk summary retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio not found',
  })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiQuery({ name: 'marketPrices', required: false, description: 'Current market prices (JSON string)' })
  async getPortfolioRiskSummary(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Query('marketPrices') marketPricesStr?: string,
  ): Promise<{
    totalRiskTargets: number;
    activeRiskTargets: number;
    triggeredAlerts: number;
    totalMaxLoss: number;
    totalMaxGain: number;
    averageRiskRewardRatio: number;
    riskBreakdown: any[];
  }> {
    let marketPrices: Record<string, number> = {};
    
    if (marketPricesStr) {
      try {
        marketPrices = JSON.parse(marketPricesStr);
      } catch (error) {
        // If parsing fails, use empty object
        marketPrices = {};
      }
    }

    return this.riskManagementService.getPortfolioRiskSummary(portfolioId, marketPrices);
  }

  /**
   * Get risk alerts history
   * @param query Alerts history query parameters
   * @returns Risk alerts history
   */
  @Get('targets/alerts/history')
  @ApiOperation({ summary: 'Get risk alerts history' })
  @ApiResponse({
    status: 200,
    description: 'Risk alerts history retrieved successfully',
  })
  @ApiQuery({ name: 'assetId', required: false, description: 'Asset ID filter' })
  @ApiQuery({ name: 'portfolioId', required: false, description: 'Portfolio ID filter' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter (ISO string)' })
  async getRiskAlertsHistory(@Query() query: RiskAlertsHistoryQueryDto): Promise<Array<{
    assetId: string;
    assetSymbol: string;
    alertType: string;
    message: string;
    timestamp: Date;
    currentPrice: number;
    targetPrice: number;
  }>> {
    const { assetId, portfolioId, startDate, endDate } = query;
    
    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;

    return this.riskManagementService.getRiskAlertsHistory(
      assetId,
      portfolioId,
      startDateObj,
      endDateObj,
    );
  }

  /**
   * Validate risk target settings
   * @param assetId Asset ID
   * @param stopLoss Stop loss price
   * @param takeProfit Take profit price
   * @param currentPrice Current market price
   * @returns Validation result
   */
  @Get(':id/targets/validate')
  @ApiOperation({ summary: 'Validate risk target settings' })
  @ApiResponse({
    status: 200,
    description: 'Risk target validation completed',
  })
  @ApiResponse({
    status: 404,
    description: 'Asset not found',
  })
  @ApiParam({ name: 'id', description: 'Asset ID' })
  @ApiQuery({ name: 'stopLoss', required: false, description: 'Stop loss price' })
  @ApiQuery({ name: 'takeProfit', required: false, description: 'Take profit price' })
  @ApiQuery({ name: 'currentPrice', required: true, description: 'Current market price' })
  async validateRiskTargets(
    @Param('id', ParseUUIDPipe) assetId: string,
    @Query('stopLoss') stopLoss?: number,
    @Query('takeProfit') takeProfit?: number,
    @Query('currentPrice') currentPrice: number = 0,
  ): Promise<{ isValid: boolean; errors: string[] }> {
    return this.riskManagementService.validateRiskTargets(
      assetId,
      stopLoss || null,
      takeProfit || null,
      currentPrice,
    );
  }

  /**
   * Get risk target statistics
   * @param portfolioId Optional portfolio ID filter
   * @returns Risk target statistics
   */
  @Get('targets/statistics')
  @ApiOperation({ summary: 'Get risk target statistics' })
  @ApiResponse({
    status: 200,
    description: 'Risk target statistics retrieved successfully',
  })
  @ApiQuery({ name: 'portfolioId', required: false, description: 'Portfolio ID filter' })
  async getRiskTargetStatistics(
    @Query('portfolioId') portfolioId?: string,
  ): Promise<{
    totalTargets: number;
    activeTargets: number;
    stopLossOnly: number;
    takeProfitOnly: number;
    bothTargets: number;
    averageStopLoss: number;
    averageTakeProfit: number;
  }> {
    return this.riskManagementService.getRiskTargetStatistics(portfolioId);
  }

  /**
   * Get risk management dashboard data
   * @param portfolioId Portfolio ID
   * @param marketPrices Current market prices
   * @returns Risk management dashboard data
   */
  @Get('targets/dashboard/:portfolioId')
  @ApiOperation({ summary: 'Get risk management dashboard data' })
  @ApiResponse({
    status: 200,
    description: 'Risk management dashboard data retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Portfolio not found',
  })
  @ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
  @ApiQuery({ name: 'marketPrices', required: false, description: 'Current market prices (JSON string)' })
  async getRiskManagementDashboard(
    @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
    @Query('marketPrices') marketPricesStr?: string,
  ): Promise<{
    summary: any;
    riskTargets: any[];
    alerts: any[];
    monitoring: any;
    statistics: any;
  }> {
    let marketPrices: Record<string, number> = {};
    
    if (marketPricesStr) {
      try {
        marketPrices = JSON.parse(marketPricesStr);
      } catch (error) {
        // If parsing fails, use empty object
        marketPrices = {};
      }
    }

    const [summary, riskTargets, monitoring, statistics] = await Promise.all([
      this.riskManagementService.getPortfolioRiskSummary(portfolioId, marketPrices),
      this.riskManagementService.getPortfolioRiskTargets(portfolioId),
      this.riskManagementService.monitorRiskTargets(marketPrices, portfolioId),
      this.riskManagementService.getRiskTargetStatistics(portfolioId),
    ]);

    return {
      summary,
      riskTargets,
      alerts: monitoring.triggeredAlerts,
      monitoring,
      statistics,
    };
  }
}
