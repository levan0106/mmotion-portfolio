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
 * PortfolioPerformanceSnapshot Entity
 * 
 * Stores portfolio-level performance metrics for fund manager analysis.
 * Focuses on TWR, MWR/IRR, Alpha/Beta, and benchmark comparison metrics.
 * 
 * Key Features:
 * - Time-weighted returns across multiple timeframes
 * - Money-weighted returns and IRR calculations
 * - Alpha and Beta calculations vs benchmarks
 * - Information ratio and tracking error
 * - Cash flow tracking
 * - Benchmark comparison data (JSON)
 */
@Entity('portfolio_performance_snapshots')
@Index(['portfolioId', 'snapshotDate', 'granularity'])
@Index(['snapshotDate', 'granularity'])
export class PortfolioPerformanceSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'portfolio_id', type: 'uuid' })
  portfolioId: string;

  @Column({ name: 'snapshot_date', type: 'date' })
  snapshotDate: Date;

  @Column({
    name: 'granularity',
    type: 'enum',
    enum: SnapshotGranularity,
    default: SnapshotGranularity.DAILY,
  })
  granularity: SnapshotGranularity;

  // Portfolio TWR Metrics (Time-Weighted Returns)
  @Column({ name: 'portfolio_twr_1d', type: 'decimal', precision: 15, scale: 6, default: 0 })
  portfolioTWR1D: number;

  @Column({ name: 'portfolio_twr_1w', type: 'decimal', precision: 15, scale: 6, default: 0 })
  portfolioTWR1W: number;

  @Column({ name: 'portfolio_twr_1m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  portfolioTWR1M: number;

  @Column({ name: 'portfolio_twr_3m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  portfolioTWR3M: number;

  @Column({ name: 'portfolio_twr_6m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  portfolioTWR6M: number;

  @Column({ name: 'portfolio_twr_1y', type: 'decimal', precision: 15, scale: 6, default: 0 })
  portfolioTWR1Y: number;

  @Column({ name: 'portfolio_twr_ytd', type: 'decimal', precision: 15, scale: 6, default: 0 })
  portfolioTWRYTD: number;

  // Portfolio MWR/IRR Metrics (Money-Weighted Returns)
  @Column({ name: 'portfolio_mwr_1m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  portfolioMWR1M: number;

  @Column({ name: 'portfolio_mwr_3m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  portfolioMWR3M: number;

  @Column({ name: 'portfolio_mwr_6m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  portfolioMWR6M: number;

  @Column({ name: 'portfolio_mwr_1y', type: 'decimal', precision: 15, scale: 6, default: 0 })
  portfolioMWR1Y: number;

  @Column({ name: 'portfolio_mwr_ytd', type: 'decimal', precision: 15, scale: 6, default: 0 })
  portfolioMWRYTD: number;

  @Column({ name: 'portfolio_irr_1m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  portfolioIRR1M: number;

  @Column({ name: 'portfolio_irr_3m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  portfolioIRR3M: number;

  @Column({ name: 'portfolio_irr_6m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  portfolioIRR6M: number;

  @Column({ name: 'portfolio_irr_1y', type: 'decimal', precision: 15, scale: 6, default: 0 })
  portfolioIRR1Y: number;

  @Column({ name: 'portfolio_irr_ytd', type: 'decimal', precision: 15, scale: 6, default: 0 })
  portfolioIRRYTD: number;

  // Portfolio Alpha Metrics (vs Benchmark)
  @Column({ name: 'portfolio_alpha_1m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  portfolioAlpha1M: number;

  @Column({ name: 'portfolio_alpha_3m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  portfolioAlpha3M: number;

  @Column({ name: 'portfolio_alpha_6m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  portfolioAlpha6M: number;

  @Column({ name: 'portfolio_alpha_1y', type: 'decimal', precision: 15, scale: 6, default: 0 })
  portfolioAlpha1Y: number;

  @Column({ name: 'portfolio_alpha_ytd', type: 'decimal', precision: 15, scale: 6, default: 0 })
  portfolioAlphaYTD: number;

  // Portfolio Beta Metrics (vs Benchmark)
  @Column({ name: 'portfolio_beta_1m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  portfolioBeta1M: number;

  @Column({ name: 'portfolio_beta_3m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  portfolioBeta3M: number;

  @Column({ name: 'portfolio_beta_6m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  portfolioBeta6M: number;

  @Column({ name: 'portfolio_beta_1y', type: 'decimal', precision: 15, scale: 6, default: 0 })
  portfolioBeta1Y: number;

  @Column({ name: 'portfolio_beta_ytd', type: 'decimal', precision: 15, scale: 6, default: 0 })
  portfolioBetaYTD: number;

  // Portfolio Information Ratio
  @Column({ name: 'portfolio_information_ratio_1m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  portfolioInformationRatio1M: number;

  @Column({ name: 'portfolio_information_ratio_3m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  portfolioInformationRatio3M: number;

  @Column({ name: 'portfolio_information_ratio_1y', type: 'decimal', precision: 15, scale: 6, default: 0 })
  portfolioInformationRatio1Y: number;

  // Portfolio Tracking Error
  @Column({ name: 'portfolio_tracking_error_1m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  portfolioTrackingError1M: number;

  @Column({ name: 'portfolio_tracking_error_3m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  portfolioTrackingError3M: number;

  @Column({ name: 'portfolio_tracking_error_1y', type: 'decimal', precision: 15, scale: 6, default: 0 })
  portfolioTrackingError1Y: number;

  // Cash Flow Tracking
  @Column({ name: 'total_cash_inflows', type: 'decimal', precision: 20, scale: 8, default: 0 })
  totalCashInflows: number;

  @Column({ name: 'total_cash_outflows', type: 'decimal', precision: 20, scale: 8, default: 0 })
  totalCashOutflows: number;

  @Column({ name: 'net_cash_flow', type: 'decimal', precision: 20, scale: 8, default: 0 })
  netCashFlow: number;

  // Benchmark Comparison Data (JSON)
  @Column({ 
    name: 'benchmark_data', 
    type: 'jsonb',
    nullable: true 
  })
  benchmarkData: {
    [benchmarkId: string]: {
      benchmarkReturn: number;
      portfolioReturn: number;
      alpha: number;
      beta: number;
      trackingError: number;
      informationRatio: number;
    };
  };

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
      case '1D': return this.portfolioTWR1D;
      case '1W': return this.portfolioTWR1W;
      case '1M': return this.portfolioTWR1M;
      case '3M': return this.portfolioTWR3M;
      case '6M': return this.portfolioTWR6M;
      case '1Y': return this.portfolioTWR1Y;
      case 'YTD': return this.portfolioTWRYTD;
      default: return 0;
    }
  }

  /**
   * Get MWR for specific period
   */
  getMWRForPeriod(period: string): number {
    switch (period) {
      case '1M': return this.portfolioMWR1M;
      case '3M': return this.portfolioMWR3M;
      case '6M': return this.portfolioMWR6M;
      case '1Y': return this.portfolioMWR1Y;
      case 'YTD': return this.portfolioMWRYTD;
      default: return 0;
    }
  }

  /**
   * Get IRR for specific period
   */
  getIRRForPeriod(period: string): number {
    switch (period) {
      case '1M': return this.portfolioIRR1M;
      case '3M': return this.portfolioIRR3M;
      case '6M': return this.portfolioIRR6M;
      case '1Y': return this.portfolioIRR1Y;
      case 'YTD': return this.portfolioIRRYTD;
      default: return 0;
    }
  }

  /**
   * Get Alpha for specific period
   */
  getAlphaForPeriod(period: string): number {
    switch (period) {
      case '1M': return this.portfolioAlpha1M;
      case '3M': return this.portfolioAlpha3M;
      case '6M': return this.portfolioAlpha6M;
      case '1Y': return this.portfolioAlpha1Y;
      case 'YTD': return this.portfolioAlphaYTD;
      default: return 0;
    }
  }

  /**
   * Get Beta for specific period
   */
  getBetaForPeriod(period: string): number {
    switch (period) {
      case '1M': return this.portfolioBeta1M;
      case '3M': return this.portfolioBeta3M;
      case '6M': return this.portfolioBeta6M;
      case '1Y': return this.portfolioBeta1Y;
      case 'YTD': return this.portfolioBetaYTD;
      default: return 0;
    }
  }

  /**
   * Get benchmark data for specific benchmark
   */
  getBenchmarkData(benchmarkId: string): {
    benchmarkReturn: number;
    portfolioReturn: number;
    alpha: number;
    beta: number;
    trackingError: number;
    informationRatio: number;
  } | null {
    return this.benchmarkData?.[benchmarkId] || null;
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
    return `Portfolio Performance - ${this.snapshotDate.toISOString().split('T')[0]} (${this.granularity})`;
  }

  /**
   * Validate snapshot data
   */
  validate(): boolean {
    return (
      this.portfolioId != null &&
      this.snapshotDate != null &&
      this.granularity != null
    );
  }
}
