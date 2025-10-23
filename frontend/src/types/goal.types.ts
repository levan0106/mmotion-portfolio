
export enum GoalStatus {
  ACTIVE = 'ACTIVE',
  ACHIEVED = 'ACHIEVED',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
}

export enum AssetType {
  STOCK = 'STOCK',
  BOND = 'BOND',
  GOLD = 'GOLD',
  DEPOSIT = 'DEPOSIT',
  CASH = 'CASH',
  REAL_ESTATE = 'REAL_ESTATE',
  CRYPTO = 'CRYPTO',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum RebalanceFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export enum AlertType {
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  ACHIEVEMENT = 'ACHIEVEMENT',
  REBALANCE = 'REBALANCE',
  DEADLINE = 'DEADLINE',
}

export enum AlertStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  DISMISSED = 'DISMISSED',
}

export enum RebalanceType {
  SCHEDULED = 'SCHEDULED',
  THRESHOLD = 'THRESHOLD',
  MANUAL = 'MANUAL',
  MARKET_CONDITION = 'MARKET_CONDITION',
  GOAL_CHANGE = 'GOAL_CHANGE',
}

export interface Goal {
  id: string;
  portfolioId: string[];
  accountId: string;
  name: string;
  description?: string;
  targetValue?: number;
  targetDate?: string;
  priority: number;
  status: GoalStatus;
  isPrimary: boolean;
  autoTrack: boolean;
  currentValue: number;
  achievementPercentage: number;
  daysRemaining?: number;
  lastUpdated: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  progressStatus: string;
  isAchieved: boolean;
  isOverdue: boolean;
}

export interface GoalWithAllocation extends Goal {
  assetAllocations: GoalAssetAllocation[];
  metrics: GoalMetric[];
  recentAlerts: GoalAlert[];
}

export interface GoalAssetAllocation {
  id: string;
  assetType: AssetType;
  targetPercentage: number;
  currentPercentage: number;
  minPercentage?: number;
  maxPercentage?: number;
  expectedReturn?: number;
  riskLevel?: RiskLevel;
  volatility?: number;
  rebalanceFrequency: RebalanceFrequency;
  lastRebalanced?: string;
  nextRebalance?: string;
  isActive: boolean;
  autoRebalance: boolean;
  deviation: number;
  needsRebalancing: boolean;
}

export interface GoalMetric {
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

export interface GoalAlert {
  id: string;
  alertType: AlertType;
  message: string;
  thresholdValue?: number;
  currentValue?: number;
  status: AlertStatus;
  sentAt?: string;
  acknowledgedAt?: string;
  severity: string;
}

export interface GoalAchievement {
  id: string;
  achievedDate: string;
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

export interface GoalRebalancingHistory {
  id: string;
  rebalanceDate: string;
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

export interface CreateGoalRequest {
  portfolioIds: string[];
  name: string;
  description?: string;
  targetValue?: number;
  targetDate?: string;
  priority?: number;
  status?: GoalStatus;
  isPrimary?: boolean;
  autoTrack?: boolean;
}

export interface UpdateGoalRequest {
  name?: string;
  description?: string;
  targetValue?: number;
  targetDate?: string;
  priority?: number;
  status?: GoalStatus;
  isPrimary?: boolean;
  autoTrack?: boolean;
}

export interface CreateGoalAssetAllocationRequest {
  assetType: AssetType;
  targetPercentage: number;
  minPercentage?: number;
  maxPercentage?: number;
  expectedReturn?: number;
  riskLevel?: RiskLevel;
  volatility?: number;
  rebalanceFrequency?: RebalanceFrequency;
  isActive?: boolean;
  autoRebalance?: boolean;
}

export interface UpdateGoalAssetAllocationRequest {
  targetPercentage?: number;
  minPercentage?: number;
  maxPercentage?: number;
  expectedReturn?: number;
  riskLevel?: RiskLevel;
  volatility?: number;
  rebalanceFrequency?: RebalanceFrequency;
  isActive?: boolean;
  autoRebalance?: boolean;
}

export interface GoalProgress {
  currentValue: number;
  achievementPercentage: number;
  daysRemaining: number;
  progressStatus: string;
  isAchieved: boolean;
  isOverdue: boolean;
}

export interface AssetAllocationSummary {
  totalAllocated: number;
  totalCurrent: number;
  deviation: number;
  needsRebalancing: boolean;
  allocations: Array<{
    assetType: string;
    targetPercentage: number;
    currentPercentage: number;
    deviation: number;
    needsRebalancing: boolean;
  }>;
}

export interface RebalancingCandidate {
  goalId: string;
  goalName: string;
  allocations: Array<{
    assetType: string;
    targetPercentage: number;
    currentPercentage: number;
    deviation: number;
    needsRebalancing: boolean;
  }>;
  summary: AssetAllocationSummary;
}

export interface AlertStats {
  total: number;
  pending: number;
  sent: number;
  acknowledged: number;
  dismissed: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
}

export interface RebalancingStats {
  totalRebalancings: number;
  averageImprovement: number;
  totalCost: number;
  netImprovement: number;
  efficiencyRatio: number;
  qualityDistribution: Record<string, number>;
  typeDistribution: Record<string, number>;
}

export interface RebalancingPerformance {
  period: string;
  totalRebalancings: number;
  averageImprovement: number;
  bestImprovement: number;
  worstImprovement: number;
  totalCost: number;
  netImprovement: number;
  efficiencyRatio: number;
  recommendations: string[];
}
