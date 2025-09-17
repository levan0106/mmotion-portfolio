import { AssetTarget } from '../entities/asset-target.entity';
// PortfolioAsset entity has been removed - Portfolio is now linked to Assets through Trades only

export interface RiskAlert {
  assetId: string;
  alertType: 'STOP_LOSS' | 'TAKE_PROFIT';
  currentPrice: number;
  targetPrice: number;
  positionValue: number;
  potentialLoss: number;
  potentialGain: number;
  timestamp: Date;
}

export interface RiskTargets {
  assetId: string;
  stopLoss: number | null;
  takeProfit: number | null;
  isActive: boolean;
}

export class RiskManager {
  /**
   * Set stop loss for an asset
   * @param assetId Asset ID
   * @param stopLoss Stop loss price
   * @param currentPrice Current market price
   * @returns AssetTarget entity
   */
  setStopLoss(assetId: string, stopLoss: number, currentPrice: number): AssetTarget {
    if (stopLoss >= currentPrice) {
      throw new Error('Stop loss must be below current price');
    }

    const assetTarget = new AssetTarget();
    assetTarget.assetId = assetId;
    assetTarget.stopLoss = stopLoss;
    assetTarget.isActive = true;

    return assetTarget;
  }

  /**
   * Set take profit for an asset
   * @param assetId Asset ID
   * @param takeProfit Take profit price
   * @param currentPrice Current market price
   * @returns AssetTarget entity
   */
  setTakeProfit(assetId: string, takeProfit: number, currentPrice: number): AssetTarget {
    if (takeProfit <= currentPrice) {
      throw new Error('Take profit must be above current price');
    }

    const assetTarget = new AssetTarget();
    assetTarget.assetId = assetId;
    assetTarget.takeProfit = takeProfit;
    assetTarget.isActive = true;

    return assetTarget;
  }

  /**
   * Set both stop loss and take profit for an asset
   * @param assetId Asset ID
   * @param stopLoss Stop loss price
   * @param takeProfit Take profit price
   * @param currentPrice Current market price
   * @returns AssetTarget entity
   */
  setRiskTargets(
    assetId: string,
    stopLoss: number,
    takeProfit: number,
    currentPrice: number
  ): AssetTarget {
    if (stopLoss >= currentPrice) {
      throw new Error('Stop loss must be below current price');
    }

    if (takeProfit <= currentPrice) {
      throw new Error('Take profit must be above current price');
    }

    if (stopLoss >= takeProfit) {
      throw new Error('Stop loss must be below take profit');
    }

    const assetTarget = new AssetTarget();
    assetTarget.assetId = assetId;
    assetTarget.stopLoss = stopLoss;
    assetTarget.takeProfit = takeProfit;
    assetTarget.isActive = true;

    return assetTarget;
  }

  /**
   * Check if risk targets are triggered
   * @param assetTargets Array of asset targets
   * @param currentPrices Current market prices by asset ID
   * @param positions Current positions by asset ID
   * @returns Array of risk alerts
   */
  checkRiskTargets(
    assetTargets: AssetTarget[],
    currentPrices: Record<string, number>,
    positions: Record<string, any>
  ): RiskAlert[] {
    const alerts: RiskAlert[] = [];

    for (const target of assetTargets) {
      if (!target.isActive) {
        continue;
      }

      const currentPrice = currentPrices[target.assetId];
      const position = positions[target.assetId];

      if (!currentPrice || !position) {
        continue;
      }

      // Check stop loss
      if (target.stopLoss && currentPrice <= target.stopLoss) {
        const potentialLoss = (target.stopLoss - position.avgCost) * position.quantity;
        
        alerts.push({
          assetId: target.assetId,
          alertType: 'STOP_LOSS',
          currentPrice,
          targetPrice: target.stopLoss,
          positionValue: position.quantity * currentPrice,
          potentialLoss,
          potentialGain: 0,
          timestamp: new Date(),
        });
      }

      // Check take profit
      if (target.takeProfit && currentPrice >= target.takeProfit) {
        const potentialGain = (target.takeProfit - position.avgCost) * position.quantity;
        
        alerts.push({
          assetId: target.assetId,
          alertType: 'TAKE_PROFIT',
          currentPrice,
          targetPrice: target.takeProfit,
          positionValue: position.quantity * currentPrice,
          potentialLoss: 0,
          potentialGain,
          timestamp: new Date(),
        });
      }
    }

    return alerts;
  }

  /**
   * Trigger risk alerts
   * @param alerts Array of risk alerts
   * @returns Array of triggered alerts
   */
  triggerRiskAlerts(alerts: RiskAlert[]): RiskAlert[] {
    const triggeredAlerts: RiskAlert[] = [];

    for (const alert of alerts) {
      // Here you would implement the actual alert delivery logic
      // For now, we'll just log the alert
      console.log(`Risk Alert: ${alert.alertType} triggered for asset ${alert.assetId}`, {
        currentPrice: alert.currentPrice,
        targetPrice: alert.targetPrice,
        positionValue: alert.positionValue,
        potentialLoss: alert.potentialLoss,
        potentialGain: alert.potentialGain,
      });

      triggeredAlerts.push(alert);
    }

    return triggeredAlerts;
  }

  /**
   * Validate risk targets
   * @param assetId Asset ID
   * @param stopLoss Stop loss price
   * @param takeProfit Take profit price
   * @param currentPrice Current market price
   * @returns Validation result
   */
  validateRiskTargets(
    assetId: string,
    stopLoss: number | null,
    takeProfit: number | null,
    currentPrice: number
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (stopLoss !== null) {
      if (stopLoss >= currentPrice) {
        errors.push('Stop loss must be below current price');
      }
    }

    if (takeProfit !== null) {
      if (takeProfit <= currentPrice) {
        errors.push('Take profit must be above current price');
      }
    }

    if (stopLoss !== null && takeProfit !== null) {
      if (stopLoss >= takeProfit) {
        errors.push('Stop loss must be below take profit');
      }
    }

    if (stopLoss === null && takeProfit === null) {
      errors.push('At least one risk target (stop loss or take profit) must be set');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate risk metrics for a position
   * @param position Current position
   * @param currentPrice Current market price
   * @param stopLoss Stop loss price
   * @param takeProfit Take profit price
   * @returns Risk metrics
   */
  calculateRiskMetrics(
    position: any,
    currentPrice: number,
    stopLoss: number | null,
    takeProfit: number | null
  ): {
    currentValue: number;
    costBasis: number;
    unrealizedPl: number;
    unrealizedPlPercentage: number;
    maxLoss: number;
    maxGain: number;
    riskRewardRatio: number;
  } {
    const currentValue = position.quantity * currentPrice;
    const costBasis = position.quantity * position.avgCost;
    const unrealizedPl = currentValue - costBasis;
    const unrealizedPlPercentage = costBasis > 0 ? (unrealizedPl / costBasis) * 100 : 0;

    let maxLoss = 0;
    let maxGain = 0;

    if (stopLoss) {
      maxLoss = (stopLoss - position.avgCost) * position.quantity;
    }

    if (takeProfit) {
      maxGain = (takeProfit - position.avgCost) * position.quantity;
    }

    const riskRewardRatio = maxLoss !== 0 ? Math.abs(maxGain / maxLoss) : 0;

    return {
      currentValue,
      costBasis,
      unrealizedPl,
      unrealizedPlPercentage,
      maxLoss,
      maxGain,
      riskRewardRatio,
    };
  }

  /**
   * Get risk targets for an asset
   * @param assetTarget Asset target entity
   * @returns Risk targets object
   */
  getRiskTargets(assetTarget: AssetTarget): RiskTargets {
    return {
      assetId: assetTarget.assetId,
      stopLoss: assetTarget.stopLoss,
      takeProfit: assetTarget.takeProfit,
      isActive: assetTarget.isActive,
    };
  }

  /**
   * Update risk targets
   * @param assetTarget Existing asset target
   * @param stopLoss New stop loss price
   * @param takeProfit New take profit price
   * @param currentPrice Current market price
   * @returns Updated asset target
   */
  updateRiskTargets(
    assetTarget: AssetTarget,
    stopLoss: number | null,
    takeProfit: number | null,
    currentPrice: number
  ): AssetTarget {
    const validation = this.validateRiskTargets(
      assetTarget.assetId,
      stopLoss,
      takeProfit,
      currentPrice
    );

    if (!validation.isValid) {
      throw new Error(`Invalid risk targets: ${validation.errors.join(', ')}`);
    }

    assetTarget.stopLoss = stopLoss;
    assetTarget.takeProfit = takeProfit;
    assetTarget.updatedAt = new Date();

    return assetTarget;
  }

  /**
   * Remove risk targets for an asset
   * @param assetTarget Asset target entity
   * @returns Deactivated asset target
   */
  removeRiskTargets(assetTarget: AssetTarget): AssetTarget {
    assetTarget.stopLoss = null;
    assetTarget.takeProfit = null;
    assetTarget.isActive = false;
    assetTarget.updatedAt = new Date();

    return assetTarget;
  }
}
