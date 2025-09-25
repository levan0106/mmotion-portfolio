import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Portfolio } from './portfolio.entity';
import { SnapshotGranularity } from '../enums/snapshot-granularity.enum';

/**
 * AssetGroupPerformanceSnapshot Entity
 * 
 * Stores asset group-level performance metrics for fund manager analysis.
 * Groups assets by type (Stock, Bond, Crypto, etc.) and tracks group performance.
 * 
 * Key Features:
 * - Group TWR across multiple timeframes
 * - Group risk metrics (Sharpe ratio, volatility, max drawdown)
 * - Group risk-adjusted returns
 * - Group statistics (asset count, allocation percentage)
 */
@Entity('asset_group_performance_snapshots')
@Index(['portfolioId', 'assetType', 'snapshotDate', 'granularity'])
@Index(['portfolioId', 'snapshotDate', 'granularity'])
@Index(['snapshotDate', 'granularity'])
export class AssetGroupPerformanceSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'portfolio_id', type: 'uuid' })
  portfolioId: string;

  @Column({ name: 'asset_type', type: 'varchar', length: 50 })
  assetType: string; // 'Stock', 'Bond', 'Crypto', etc.

  @Column({ name: 'snapshot_date', type: 'date' })
  snapshotDate: Date;

  @Column({
    name: 'granularity',
    type: 'enum',
    enum: SnapshotGranularity,
    default: SnapshotGranularity.DAILY,
  })
  granularity: SnapshotGranularity;

  // Group Performance Metrics
  @Column({ name: 'group_twr_1d', type: 'decimal', precision: 15, scale: 6, default: 0 })
  groupTWR1D: number;

  @Column({ name: 'group_twr_1w', type: 'decimal', precision: 15, scale: 6, default: 0 })
  groupTWR1W: number;

  @Column({ name: 'group_twr_1m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  groupTWR1M: number;

  @Column({ name: 'group_twr_3m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  groupTWR3M: number;

  @Column({ name: 'group_twr_6m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  groupTWR6M: number;

  @Column({ name: 'group_twr_1y', type: 'decimal', precision: 15, scale: 6, default: 0 })
  groupTWR1Y: number;

  @Column({ name: 'group_twr_ytd', type: 'decimal', precision: 15, scale: 6, default: 0 })
  groupTWRYTD: number;

  // Group Risk Metrics
  @Column({ name: 'group_sharpe_ratio_1m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  groupSharpeRatio1M: number;

  @Column({ name: 'group_sharpe_ratio_3m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  groupSharpeRatio3M: number;

  @Column({ name: 'group_sharpe_ratio_1y', type: 'decimal', precision: 15, scale: 6, default: 0 })
  groupSharpeRatio1Y: number;

  @Column({ name: 'group_volatility_1m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  groupVolatility1M: number;

  @Column({ name: 'group_volatility_3m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  groupVolatility3M: number;

  @Column({ name: 'group_volatility_1y', type: 'decimal', precision: 15, scale: 6, default: 0 })
  groupVolatility1Y: number;

  @Column({ name: 'group_max_drawdown_1m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  groupMaxDrawdown1M: number;

  @Column({ name: 'group_max_drawdown_3m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  groupMaxDrawdown3M: number;

  @Column({ name: 'group_max_drawdown_1y', type: 'decimal', precision: 15, scale: 6, default: 0 })
  groupMaxDrawdown1Y: number;

  // Group Risk-Adjusted Returns
  @Column({ name: 'group_risk_adjusted_return_1m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  groupRiskAdjustedReturn1M: number;

  @Column({ name: 'group_risk_adjusted_return_3m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  groupRiskAdjustedReturn3M: number;

  @Column({ name: 'group_risk_adjusted_return_1y', type: 'decimal', precision: 15, scale: 6, default: 0 })
  groupRiskAdjustedReturn1Y: number;

  // Group IRR (Internal Rate of Return)
  @Column({ name: 'group_irr_1m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  groupIRR1M: number;

  @Column({ name: 'group_irr_3m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  groupIRR3M: number;

  @Column({ name: 'group_irr_6m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  groupIRR6M: number;

  @Column({ name: 'group_irr_1y', type: 'decimal', precision: 15, scale: 6, default: 0 })
  groupIRR1Y: number;

  @Column({ name: 'group_irr_ytd', type: 'decimal', precision: 15, scale: 6, default: 0 })
  groupIRRYTD: number;

  // Group Alpha (vs Benchmark)
  @Column({ name: 'group_alpha_1m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  groupAlpha1M: number;

  @Column({ name: 'group_alpha_3m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  groupAlpha3M: number;

  @Column({ name: 'group_alpha_6m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  groupAlpha6M: number;

  @Column({ name: 'group_alpha_1y', type: 'decimal', precision: 15, scale: 6, default: 0 })
  groupAlpha1Y: number;

  @Column({ name: 'group_alpha_ytd', type: 'decimal', precision: 15, scale: 6, default: 0 })
  groupAlphaYTD: number;

  // Group Beta (vs Benchmark)
  @Column({ name: 'group_beta_1m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  groupBeta1M: number;

  @Column({ name: 'group_beta_3m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  groupBeta3M: number;

  @Column({ name: 'group_beta_6m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  groupBeta6M: number;

  @Column({ name: 'group_beta_1y', type: 'decimal', precision: 15, scale: 6, default: 0 })
  groupBeta1Y: number;

  @Column({ name: 'group_beta_ytd', type: 'decimal', precision: 15, scale: 6, default: 0 })
  groupBetaYTD: number;

  // Group Statistics
  @Column({ name: 'asset_count', type: 'int', default: 0 })
  assetCount: number;

  @Column({ name: 'active_asset_count', type: 'int', default: 0 })
  activeAssetCount: number;

  @Column({ name: 'allocation_percentage', type: 'decimal', precision: 15, scale: 6, default: 0 })
  allocationPercentage: number;

  // Metadata
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Portfolio, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'portfolio_id' })
  portfolio: Portfolio;

  // Business Logic Methods
  /**
   * Get TWR for specific period
   */
  getTWRForPeriod(period: string): number {
    switch (period) {
      case '1D': return this.groupTWR1D;
      case '1W': return this.groupTWR1W;
      case '1M': return this.groupTWR1M;
      case '3M': return this.groupTWR3M;
      case '6M': return this.groupTWR6M;
      case '1Y': return this.groupTWR1Y;
      case 'YTD': return this.groupTWRYTD;
      default: return 0;
    }
  }

  /**
   * Get Sharpe ratio for specific period
   */
  getSharpeRatioForPeriod(period: string): number {
    switch (period) {
      case '1M': return this.groupSharpeRatio1M;
      case '3M': return this.groupSharpeRatio3M;
      case '1Y': return this.groupSharpeRatio1Y;
      default: return 0;
    }
  }

  /**
   * Get volatility for specific period
   */
  getVolatilityForPeriod(period: string): number {
    switch (period) {
      case '1M': return this.groupVolatility1M;
      case '3M': return this.groupVolatility3M;
      case '1Y': return this.groupVolatility1Y;
      default: return 0;
    }
  }

  /**
   * Get max drawdown for specific period
   */
  getMaxDrawdownForPeriod(period: string): number {
    switch (period) {
      case '1M': return this.groupMaxDrawdown1M;
      case '3M': return this.groupMaxDrawdown3M;
      case '1Y': return this.groupMaxDrawdown1Y;
      default: return 0;
    }
  }

  /**
   * Get risk-adjusted return for specific period
   */
  getRiskAdjustedReturnForPeriod(period: string): number {
    switch (period) {
      case '1M': return this.groupRiskAdjustedReturn1M;
      case '3M': return this.groupRiskAdjustedReturn3M;
      case '1Y': return this.groupRiskAdjustedReturn1Y;
      default: return 0;
    }
  }

  /**
   * Calculate risk-adjusted return (TWR / Volatility)
   */
  calculateRiskAdjustedReturn(twr: number, volatility: number): number {
    if (volatility === 0) return 0;
    return Number((twr / volatility).toFixed(4));
  }

  /**
   * Get risk level based on volatility
   */
  get riskLevel(): 'Low' | 'Medium' | 'High' {
    const avgVolatility = (this.groupVolatility1M + this.groupVolatility3M + this.groupVolatility1Y) / 3;
    if (avgVolatility < 10) return 'Low';
    if (avgVolatility < 20) return 'Medium';
    return 'High';
  }

  /**
   * Get performance grade based on Sharpe ratio
   */
  get performanceGrade(): 'A' | 'B' | 'C' | 'D' | 'F' {
    const avgSharpe = (this.groupSharpeRatio1M + this.groupSharpeRatio3M + this.groupSharpeRatio1Y) / 3;
    if (avgSharpe >= 2) return 'A';
    if (avgSharpe >= 1) return 'B';
    if (avgSharpe >= 0.5) return 'C';
    if (avgSharpe >= 0) return 'D';
    return 'F';
  }

  /**
   * Check if snapshot is for current period
   */
  isCurrentPeriod(): boolean {
    const today = new Date();
    const snapshotDate = new Date(this.snapshotDate);
    
    switch (this.granularity) {
      case SnapshotGranularity.DAILY:
        return snapshotDate.toDateString() === today.toDateString();
      case SnapshotGranularity.WEEKLY:
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return snapshotDate >= weekStart;
      case SnapshotGranularity.MONTHLY:
        return snapshotDate.getMonth() === today.getMonth() && 
               snapshotDate.getFullYear() === today.getFullYear();
      default:
        return false;
    }
  }

  /**
   * Get display name for the snapshot
   */
  getDisplayName(): string {
    return `${this.assetType} Group Performance - ${this.snapshotDate.toISOString().split('T')[0]} (${this.granularity})`;
  }

  /**
   * Validate snapshot data
   */
  validate(): boolean {
    return (
      this.portfolioId != null &&
      this.assetType != null &&
      this.snapshotDate != null &&
      this.granularity != null &&
      this.assetCount >= 0 &&
      this.activeAssetCount >= 0 &&
      this.allocationPercentage >= 0
    );
  }
}
