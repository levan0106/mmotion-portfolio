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
import { Asset } from '../../asset/entities/asset.entity';
import { SnapshotGranularity } from '../enums/snapshot-granularity.enum';

/**
 * AssetPerformanceSnapshot Entity
 * 
 * Stores asset-level performance metrics for fund manager analysis.
 * Focuses on individual asset TWR, risk metrics, and performance analysis.
 * 
 * Key Features:
 * - Asset-specific TWR across multiple timeframes
 * - Asset risk metrics (volatility, Sharpe ratio, max drawdown)
 * - Asset risk-adjusted returns
 * - Performance tracking for individual assets
 */
@Entity('asset_performance_snapshots')
@Index(['portfolioId', 'assetId', 'snapshotDate', 'granularity'])
@Index(['portfolioId', 'snapshotDate', 'granularity'])
@Index(['snapshotDate', 'granularity'])
@Index(['assetSymbol', 'snapshotDate'])
export class AssetPerformanceSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'portfolio_id', type: 'uuid' })
  portfolioId: string;

  @Column({ name: 'asset_id', type: 'uuid' })
  assetId: string;

  @Column({ name: 'asset_symbol', type: 'varchar', length: 50 })
  assetSymbol: string;

  @Column({ name: 'snapshot_date', type: 'date' })
  snapshotDate: Date;

  @Column({
    name: 'granularity',
    type: 'enum',
    enum: SnapshotGranularity,
    default: SnapshotGranularity.DAILY,
  })
  granularity: SnapshotGranularity;

  // Asset Performance Metrics
  @Column({ name: 'asset_twr_1d', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetTWR1D: number;

  @Column({ name: 'asset_twr_1w', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetTWR1W: number;

  @Column({ name: 'asset_twr_1m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetTWR1M: number;

  @Column({ name: 'asset_twr_3m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetTWR3M: number;

  @Column({ name: 'asset_twr_6m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetTWR6M: number;

  @Column({ name: 'asset_twr_1y', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetTWR1Y: number;

  @Column({ name: 'asset_twr_ytd', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetTWRYTD: number;

  @Column({ name: 'asset_twr_mtd', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetTWRMTD: number;

  // Asset Risk Metrics
  @Column({ name: 'asset_volatility_1m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetVolatility1M: number;

  @Column({ name: 'asset_volatility_3m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetVolatility3M: number;

  @Column({ name: 'asset_volatility_1y', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetVolatility1Y: number;

  @Column({ name: 'asset_sharpe_ratio_1m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetSharpeRatio1M: number;

  @Column({ name: 'asset_sharpe_ratio_3m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetSharpeRatio3M: number;

  @Column({ name: 'asset_sharpe_ratio_1y', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetSharpeRatio1Y: number;

  @Column({ name: 'asset_max_drawdown_1m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetMaxDrawdown1M: number;

  @Column({ name: 'asset_max_drawdown_3m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetMaxDrawdown3M: number;

  @Column({ name: 'asset_max_drawdown_1y', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetMaxDrawdown1Y: number;

  // Asset Risk-Adjusted Returns
  @Column({ name: 'asset_risk_adjusted_return_1m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetRiskAdjustedReturn1M: number;

  @Column({ name: 'asset_risk_adjusted_return_3m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetRiskAdjustedReturn3M: number;

  @Column({ name: 'asset_risk_adjusted_return_1y', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetRiskAdjustedReturn1Y: number;

  // Asset IRR (Internal Rate of Return)
  @Column({ name: 'asset_irr_1m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetIRR1M: number;

  @Column({ name: 'asset_irr_3m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetIRR3M: number;

  @Column({ name: 'asset_irr_6m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetIRR6M: number;

  @Column({ name: 'asset_irr_1y', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetIRR1Y: number;

  @Column({ name: 'asset_irr_ytd', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetIRRYTD: number;

  @Column({ name: 'asset_irr_mtd', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetIRRMTD: number;

  // Asset Alpha (vs Benchmark)
  @Column({ name: 'asset_alpha_1m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetAlpha1M: number;

  @Column({ name: 'asset_alpha_3m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetAlpha3M: number;

  @Column({ name: 'asset_alpha_6m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetAlpha6M: number;

  @Column({ name: 'asset_alpha_1y', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetAlpha1Y: number;

  @Column({ name: 'asset_alpha_ytd', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetAlphaYTD: number;

  // Asset Beta (vs Benchmark)
  @Column({ name: 'asset_beta_1m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetBeta1M: number;

  @Column({ name: 'asset_beta_3m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetBeta3M: number;

  @Column({ name: 'asset_beta_6m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetBeta6M: number;

  @Column({ name: 'asset_beta_1y', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetBeta1Y: number;

  @Column({ name: 'asset_beta_ytd', type: 'decimal', precision: 15, scale: 6, default: 0 })
  assetBetaYTD: number;

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

  @ManyToOne(() => Asset, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  // Business Logic Methods
  /**
   * Get TWR for specific period
   */
  getTWRForPeriod(period: string): number {
    switch (period) {
      case '1D': return this.assetTWR1D;
      case '1W': return this.assetTWR1W;
      case '1M': return this.assetTWR1M;
      case '3M': return this.assetTWR3M;
      case '6M': return this.assetTWR6M;
      case '1Y': return this.assetTWR1Y;
      case 'YTD': return this.assetTWRYTD;
      case 'MTD': return this.assetTWRMTD;
      default: return 0;
    }
  }

  /**
   * Get volatility for specific period
   */
  getVolatilityForPeriod(period: string): number {
    switch (period) {
      case '1M': return this.assetVolatility1M;
      case '3M': return this.assetVolatility3M;
      case '1Y': return this.assetVolatility1Y;
      default: return 0;
    }
  }

  /**
   * Get Sharpe ratio for specific period
   */
  getSharpeRatioForPeriod(period: string): number {
    switch (period) {
      case '1M': return this.assetSharpeRatio1M;
      case '3M': return this.assetSharpeRatio3M;
      case '1Y': return this.assetSharpeRatio1Y;
      default: return 0;
    }
  }

  /**
   * Get max drawdown for specific period
   */
  getMaxDrawdownForPeriod(period: string): number {
    switch (period) {
      case '1M': return this.assetMaxDrawdown1M;
      case '3M': return this.assetMaxDrawdown3M;
      case '1Y': return this.assetMaxDrawdown1Y;
      default: return 0;
    }
  }

  /**
   * Get risk-adjusted return for specific period
   */
  getRiskAdjustedReturnForPeriod(period: string): number {
    switch (period) {
      case '1M': return this.assetRiskAdjustedReturn1M;
      case '3M': return this.assetRiskAdjustedReturn3M;
      case '1Y': return this.assetRiskAdjustedReturn1Y;
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
    return `${this.assetSymbol} Performance - ${this.snapshotDate.toISOString().split('T')[0]} (${this.granularity})`;
  }

  /**
   * Validate snapshot data
   */
  validate(): boolean {
    return (
      this.portfolioId != null &&
      this.assetId != null &&
      this.assetSymbol != null &&
      this.snapshotDate != null &&
      this.granularity != null
    );
  }
}
