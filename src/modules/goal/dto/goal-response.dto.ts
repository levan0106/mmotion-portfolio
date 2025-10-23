import { PortfolioGoal, GoalStatus } from '../entities';

export class GoalResponseDto {
  id: string;
  portfolioId: string[];
  accountId: string;
  name: string;
  description?: string;
  targetValue?: number;
  targetDate?: Date;
  priority: number;
  status: GoalStatus;
  isPrimary: boolean;
  autoTrack: boolean;
  currentValue: number;
  achievementPercentage: number;
  daysRemaining?: number;
  lastUpdated: Date;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  progressStatus: string;
  isAchieved: boolean;
  isOverdue: boolean;
  portfolioContributions: PortfolioContributionDto[];
}

export class PortfolioContributionDto {
  portfolioId: string;
  portfolioName: string;
  contribution: number;
  weight: number;
}

export class GoalWithAllocationDto extends GoalResponseDto {
  // Simplified - no additional fields needed
}

export class GoalAssetAllocationResponseDto {
  id: string;
  assetType: string;
  targetPercentage: number;
  currentPercentage: number;
  minPercentage?: number;
  maxPercentage?: number;
  expectedReturn?: number;
  riskLevel?: string;
  volatility?: number;
  rebalanceFrequency: string;
  lastRebalanced?: Date;
  nextRebalance?: Date;
  isActive: boolean;
  autoRebalance: boolean;
  deviation: number;
  needsRebalancing: boolean;
}

export class GoalMetricResponseDto {
  id: string;
  metricName: string;
  metricType: string;
  targetValue?: number;
  currentValue: number;
  unit?: string;
  warningThreshold?: number;
  criticalThreshold?: number;
  isPositive: boolean;
  deviation: number;
  status: string;
}

export class GoalAlertResponseDto {
  id: string;
  alertType: string;
  message: string;
  thresholdValue?: number;
  currentValue?: number;
  status: string;
  sentAt?: Date;
  acknowledgedAt?: Date;
  severity: string;
}

export class GoalAchievementResponseDto {
  id: string;
  achievedDate: Date;
  achievedValue: number;
  achievementPercentage: number;
  daysAhead?: number;
  notes?: string;
  celebrationType: string;
  isEarlyAchievement: boolean;
  isLateAchievement: boolean;
  isOnTimeAchievement: boolean;
  achievementQuality: string;
}

export class GoalRebalancingHistoryResponseDto {
  id: string;
  rebalanceDate: Date;
  rebalanceType: string;
  triggerReason?: string;
  oldAllocation?: Record<string, any>;
  newAllocation?: Record<string, any>;
  changesMade?: Record<string, any>;
  expectedImprovement?: number;
  actualImprovement?: number;
  costOfRebalancing: number;
  netImprovement: number;
  isProfitable: boolean;
  efficiencyRatio: number;
  isEfficient: boolean;
  rebalancingQuality: string;
}
