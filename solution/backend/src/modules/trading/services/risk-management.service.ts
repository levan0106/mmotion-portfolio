import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetTarget } from '../entities/asset-target.entity';
// PortfolioAsset entity has been removed - Portfolio is now linked to Assets through Trades only
import { RiskManager, RiskAlert, RiskTargets } from '../managers/risk-manager';

export interface SetRiskTargetsDto {
  assetId: string;
  stopLoss?: number;
  takeProfit?: number;
  currentPrice: number;
}

export interface UpdateRiskTargetsDto {
  stopLoss?: number;
  takeProfit?: number;
  currentPrice?: number;
}

export interface RiskMonitoringResult {
  alerts: RiskAlert[];
  triggeredAlerts: RiskAlert[];
  riskMetrics: Array<{
    assetId: string;
    assetSymbol: string;
    currentPrice: number;
    stopLoss: number | null;
    takeProfit: number | null;
    positionValue: number;
    maxLoss: number;
    maxGain: number;
    riskRewardRatio: number;
  }>;
}

/**
 * Service for managing risk targets and risk monitoring operations.
 * Handles stop-loss, take-profit settings, and risk alerts.
 */
@Injectable()
export class RiskManagementService {
  constructor(
    @InjectRepository(AssetTarget)
    private readonly assetTargetRepository: Repository<AssetTarget>,
    // PortfolioAsset entity has been removed - Portfolio is now linked to Assets through Trades only
    private readonly riskManager: RiskManager,
  ) {}

  /**
   * Set risk targets for an asset
   * @param setRiskTargetsDto Risk targets data
   * @returns Created or updated asset target
   */
  async setRiskTargets(setRiskTargetsDto: SetRiskTargetsDto): Promise<AssetTarget> {
    const { assetId, stopLoss, takeProfit, currentPrice } = setRiskTargetsDto;

    // Validate risk targets
    const validation = this.riskManager.validateRiskTargets(
      assetId,
      stopLoss,
      takeProfit,
      currentPrice,
    );

    if (!validation.isValid) {
      throw new BadRequestException(`Invalid risk targets: ${validation.errors.join(', ')}`);
    }

    // Check if asset target already exists
    let assetTarget = await this.assetTargetRepository.findOne({
      where: { assetId: assetId },
    });

    if (assetTarget) {
      // Update existing target
      assetTarget = this.riskManager.updateRiskTargets(
        assetTarget,
        stopLoss,
        takeProfit,
        currentPrice,
      );
    } else {
      // Create new target
      if (stopLoss && takeProfit) {
        assetTarget = this.riskManager.setRiskTargets(assetId, stopLoss, takeProfit, currentPrice);
      } else if (stopLoss) {
        assetTarget = this.riskManager.setStopLoss(assetId, stopLoss, currentPrice);
      } else if (takeProfit) {
        assetTarget = this.riskManager.setTakeProfit(assetId, takeProfit, currentPrice);
      } else {
        throw new BadRequestException('At least one risk target (stop loss or take profit) must be set');
      }
    }

    return this.assetTargetRepository.save(assetTarget);
  }

  /**
   * Get risk targets for an asset
   * @param assetId Asset ID
   * @returns Risk targets
   */
  async getRiskTargets(assetId: string): Promise<RiskTargets | null> {
    const assetTarget = await this.assetTargetRepository.findOne({
      where: { assetId: assetId },
      relations: ['asset'],
    });

    if (!assetTarget) {
      return null;
    }

    return this.riskManager.getRiskTargets(assetTarget);
  }

  /**
   * Update risk targets for an asset
   * @param assetId Asset ID
   * @param updateRiskTargetsDto Update data
   * @returns Updated asset target
   */
  async updateRiskTargets(
    assetId: string,
    updateRiskTargetsDto: UpdateRiskTargetsDto,
  ): Promise<AssetTarget> {
    const { stopLoss, takeProfit, currentPrice } = updateRiskTargetsDto;

    const assetTarget = await this.assetTargetRepository.findOne({
      where: { assetId: assetId },
    });

    if (!assetTarget) {
      throw new NotFoundException(`Risk targets for asset ${assetId} not found`);
    }

    const updatedTarget = this.riskManager.updateRiskTargets(
      assetTarget,
      stopLoss,
      takeProfit,
      currentPrice,
    );

    return this.assetTargetRepository.save(updatedTarget);
  }

  /**
   * Remove risk targets for an asset
   * @param assetId Asset ID
   * @returns Deactivated asset target
   */
  async removeRiskTargets(assetId: string): Promise<AssetTarget> {
    const assetTarget = await this.assetTargetRepository.findOne({
      where: { assetId: assetId },
    });

    if (!assetTarget) {
      throw new NotFoundException(`Risk targets for asset ${assetId} not found`);
    }

    const deactivatedTarget = this.riskManager.removeRiskTargets(assetTarget);
    return this.assetTargetRepository.save(deactivatedTarget);
  }

  /**
   * Get all active risk targets
   * @returns Array of active risk targets
   */
  async getAllActiveRiskTargets(): Promise<AssetTarget[]> {
    return this.assetTargetRepository.find({
      where: { isActive: true },
      relations: ['asset'],
      order: { updatedAt: 'DESC' },
    });
  }

  /**
   * Get risk targets for a portfolio
   * @param portfolioId Portfolio ID
   * @returns Array of risk targets for portfolio assets
   */
  async getPortfolioRiskTargets(portfolioId: string): Promise<AssetTarget[]> {
    // TODO: Implement using trades instead of portfolioAssets
    return [];
    
    // Legacy code - to be removed after implementing trade-based calculation
    /*
    // Get all positions in the portfolio
    const positions = await this.portfolioAssetRepository.find({
      where: { portfolioId: portfolioId },
      relations: ['asset'],
    });

    const assetIds = positions.map(pos => pos.assetId);

    if (assetIds.length === 0) {
      return [];
    }

    return this.assetTargetRepository
      .createQueryBuilder('target')
      .leftJoinAndSelect('target.asset', 'asset')
      .where('target.assetId IN (:...assetIds)', { assetIds })
      .andWhere('target.isActive = :isActive', { isActive: true })
      .getMany();
    */
  }

  /**
   * Monitor risk targets and generate alerts
   * @param currentPrices Current market prices by asset ID
   * @param portfolioId Optional portfolio ID filter
   * @returns Risk monitoring result
   */
  async monitorRiskTargets(
    currentPrices: Record<string, number>,
    portfolioId?: string,
  ): Promise<RiskMonitoringResult> {
    // Get active risk targets
    let assetTargets: AssetTarget[];
    if (portfolioId) {
      assetTargets = await this.getPortfolioRiskTargets(portfolioId);
    } else {
      assetTargets = await this.getAllActiveRiskTargets();
    }

    // Get positions for risk calculation
    const positions = await this.getPositionsForRiskMonitoring(portfolioId);

    // Check risk targets
    const alerts = this.riskManager.checkRiskTargets(assetTargets, currentPrices, positions);

    // Trigger alerts
    const triggeredAlerts = this.riskManager.triggerRiskAlerts(alerts);

    // Calculate risk metrics
    const riskMetrics = [];
    for (const target of assetTargets) {
      const currentPrice = currentPrices[target.assetId];
      const position = positions[target.assetId];

      if (currentPrice && position) {
        const metrics = this.riskManager.calculateRiskMetrics(
          position,
          currentPrice,
          target.stopLoss,
          target.takeProfit,
        );

        riskMetrics.push({
          assetId: target.assetId,
          assetSymbol: target.asset?.symbol || 'Unknown',
          currentPrice,
          stopLoss: target.stopLoss,
          takeProfit: target.takeProfit,
          positionValue: metrics.currentValue,
          maxLoss: metrics.maxLoss,
          maxGain: metrics.maxGain,
          riskRewardRatio: metrics.riskRewardRatio,
        });
      }
    }

    return {
      alerts,
      triggeredAlerts,
      riskMetrics,
    };
  }

  /**
   * Get risk summary for a portfolio
   * @param portfolioId Portfolio ID
   * @param currentPrices Current market prices by asset ID
   * @returns Risk summary
   */
  async getPortfolioRiskSummary(
    portfolioId: string,
    currentPrices: Record<string, number>,
  ): Promise<{
    totalRiskTargets: number;
    activeRiskTargets: number;
    triggeredAlerts: number;
    totalMaxLoss: number;
    totalMaxGain: number;
    averageRiskRewardRatio: number;
    riskBreakdown: Array<{
      assetId: string;
      assetSymbol: string;
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
      maxLoss: number;
      maxGain: number;
      riskRewardRatio: number;
    }>;
  }> {
    const riskTargets = await this.getPortfolioRiskTargets(portfolioId);
    const monitoringResult = await this.monitorRiskTargets(currentPrices, portfolioId);

    const totalRiskTargets = riskTargets.length;
    const activeRiskTargets = riskTargets.filter(target => target.isActive).length;
    const triggeredAlerts = monitoringResult.triggeredAlerts.length;

    const totalMaxLoss = monitoringResult.riskMetrics.reduce((sum, metric) => sum + metric.maxLoss, 0);
    const totalMaxGain = monitoringResult.riskMetrics.reduce((sum, metric) => sum + metric.maxGain, 0);
    const averageRiskRewardRatio = monitoringResult.riskMetrics.length > 0
      ? monitoringResult.riskMetrics.reduce((sum, metric) => sum + metric.riskRewardRatio, 0) / monitoringResult.riskMetrics.length
      : 0;

    const riskBreakdown = monitoringResult.riskMetrics.map(metric => {
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      if (metric.riskRewardRatio < 1) {
        riskLevel = 'HIGH';
      } else if (metric.riskRewardRatio < 2) {
        riskLevel = 'MEDIUM';
      }

      return {
        assetId: metric.assetId,
        assetSymbol: metric.assetSymbol,
        riskLevel,
        maxLoss: metric.maxLoss,
        maxGain: metric.maxGain,
        riskRewardRatio: metric.riskRewardRatio,
      };
    });

    return {
      totalRiskTargets,
      activeRiskTargets,
      triggeredAlerts,
      totalMaxLoss,
      totalMaxGain,
      averageRiskRewardRatio,
      riskBreakdown,
    };
  }

  /**
   * Get risk alerts history
   * @param assetId Optional asset ID filter
   * @param portfolioId Optional portfolio ID filter
   * @param startDate Optional start date filter
   * @param endDate Optional end date filter
   * @returns Risk alerts history
   */
  async getRiskAlertsHistory(
    assetId?: string,
    portfolioId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Array<{
    assetId: string;
    assetSymbol: string;
    alertType: string;
    message: string;
    timestamp: Date;
    currentPrice: number;
    targetPrice: number;
  }>> {
    // This would typically be stored in a separate alerts table
    // For now, we'll return a mock implementation
    // In a real implementation, you would query an alerts/notifications table
    
    const alerts = [];
    
    // Mock implementation - in reality, this would query the alerts table
    if (assetId) {
      const assetTarget = await this.assetTargetRepository.findOne({
        where: { assetId: assetId },
        relations: ['asset'],
      });

      if (assetTarget) {
        alerts.push({
          assetId: assetTarget.assetId,
          assetSymbol: assetTarget.asset?.symbol || 'Unknown',
          alertType: 'STOP_LOSS',
          message: 'Stop loss triggered',
          timestamp: new Date(),
          currentPrice: 0,
          targetPrice: assetTarget.stopLoss || 0,
        });
      }
    }

    return alerts;
  }

  /**
   * Get positions for risk monitoring
   * @param portfolioId Optional portfolio ID filter
   * @returns Positions by asset ID
   */
  private async getPositionsForRiskMonitoring(
    portfolioId?: string,
  ): Promise<Record<string, any>> {
    // PortfolioAsset entity has been removed - Portfolio is now linked to Assets through Trades only
    // This method needs to be refactored to calculate positions from trades
    return {};
  }

  /**
   * Validate risk target settings
   * @param assetId Asset ID
   * @param stopLoss Stop loss price
   * @param takeProfit Take profit price
   * @param currentPrice Current market price
   * @returns Validation result
   */
  async validateRiskTargets(
    assetId: string,
    stopLoss: number | null,
    takeProfit: number | null,
    currentPrice: number,
  ): Promise<{ isValid: boolean; errors: string[] }> {
    return this.riskManager.validateRiskTargets(assetId, stopLoss, takeProfit, currentPrice);
  }

  /**
   * Get risk target statistics
   * @param portfolioId Optional portfolio ID filter
   * @returns Risk target statistics
   */
  async getRiskTargetStatistics(portfolioId?: string): Promise<{
    totalTargets: number;
    activeTargets: number;
    stopLossOnly: number;
    takeProfitOnly: number;
    bothTargets: number;
    averageStopLoss: number;
    averageTakeProfit: number;
  }> {
    let targets: AssetTarget[];
    
    if (portfolioId) {
      targets = await this.getPortfolioRiskTargets(portfolioId);
    } else {
      targets = await this.assetTargetRepository.find({
        relations: ['asset'],
      });
    }

    const activeTargets = targets.filter(target => target.isActive);
    const stopLossOnly = activeTargets.filter(target => target.stopLoss && !target.takeProfit).length;
    const takeProfitOnly = activeTargets.filter(target => !target.stopLoss && target.takeProfit).length;
    const bothTargets = activeTargets.filter(target => target.stopLoss && target.takeProfit).length;

    const averageStopLoss = activeTargets
      .filter(target => target.stopLoss)
      .reduce((sum, target) => sum + (target.stopLoss || 0), 0) / 
      activeTargets.filter(target => target.stopLoss).length || 0;

    const averageTakeProfit = activeTargets
      .filter(target => target.takeProfit)
      .reduce((sum, target) => sum + (target.takeProfit || 0), 0) / 
      activeTargets.filter(target => target.takeProfit).length || 0;

    return {
      totalTargets: targets.length,
      activeTargets: activeTargets.length,
      stopLossOnly,
      takeProfitOnly,
      bothTargets,
      averageStopLoss,
      averageTakeProfit,
    };
  }
}
