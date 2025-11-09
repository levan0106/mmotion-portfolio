import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * BenchmarkData Entity
 * 
 * Stores benchmark performance data for comparison with portfolio performance.
 * Supports various benchmark types (INDEX, ETF, CUSTOM) and tracks performance metrics.
 * 
 * Key Features:
 * - Benchmark performance across multiple timeframes
 * - Benchmark risk metrics (volatility, max drawdown)
 * - Support for multiple benchmark types
 * - Historical benchmark data tracking
 */
@Entity('benchmark_data')
@Index(['benchmarkId', 'snapshotDate', 'granularity'])
@Index(['snapshotDate', 'granularity'])
@Index(['benchmarkType', 'snapshotDate'])
export class BenchmarkData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'benchmark_id', type: 'uuid' })
  benchmarkId: string;

  @Column({ name: 'benchmark_name', type: 'varchar', length: 255 })
  benchmarkName: string;

  @Column({ name: 'benchmark_type', type: 'varchar', length: 50 })
  benchmarkType: string; // 'INDEX', 'ETF', 'CUSTOM'

  @Column({ name: 'snapshot_date', type: 'date' })
  snapshotDate: Date;

  @Column({ name: 'granularity', type: 'varchar', length: 20, default: 'DAILY' })
  granularity: string;

  // Benchmark Performance
  @Column({ name: 'benchmark_value', type: 'decimal', precision: 20, scale: 8, default: 0 })
  benchmarkValue: number;

  @Column({ name: 'benchmark_return_1d', type: 'decimal', precision: 15, scale: 6, default: 0 })
  benchmarkReturn1D: number;

  @Column({ name: 'benchmark_return_1w', type: 'decimal', precision: 15, scale: 6, default: 0 })
  benchmarkReturn1W: number;

  @Column({ name: 'benchmark_return_1m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  benchmarkReturn1M: number;

  @Column({ name: 'benchmark_return_3m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  benchmarkReturn3M: number;

  @Column({ name: 'benchmark_return_6m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  benchmarkReturn6M: number;

  @Column({ name: 'benchmark_return_1y', type: 'decimal', precision: 15, scale: 6, default: 0 })
  benchmarkReturn1Y: number;

  @Column({ name: 'benchmark_return_ytd', type: 'decimal', precision: 15, scale: 6, default: 0 })
  benchmarkReturnYTD: number;

  // Benchmark Risk Metrics
  @Column({ name: 'benchmark_volatility_1m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  benchmarkVolatility1M: number;

  @Column({ name: 'benchmark_volatility_3m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  benchmarkVolatility3M: number;

  @Column({ name: 'benchmark_volatility_1y', type: 'decimal', precision: 15, scale: 6, default: 0 })
  benchmarkVolatility1Y: number;

  @Column({ name: 'benchmark_max_drawdown_1m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  benchmarkMaxDrawdown1M: number;

  @Column({ name: 'benchmark_max_drawdown_3m', type: 'decimal', precision: 15, scale: 6, default: 0 })
  benchmarkMaxDrawdown3M: number;

  @Column({ name: 'benchmark_max_drawdown_1y', type: 'decimal', precision: 15, scale: 6, default: 0 })
  benchmarkMaxDrawdown1Y: number;

  // Metadata
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Business Logic Methods
  /**
   * Get return for specific period
   */
  getReturnForPeriod(period: string): number {
    switch (period) {
      case '1D': return this.benchmarkReturn1D;
      case '1W': return this.benchmarkReturn1W;
      case '1M': return this.benchmarkReturn1M;
      case '3M': return this.benchmarkReturn3M;
      case '6M': return this.benchmarkReturn6M;
      case '1Y': return this.benchmarkReturn1Y;
      case 'YTD': return this.benchmarkReturnYTD;
      default: return 0;
    }
  }

  /**
   * Get volatility for specific period
   */
  getVolatilityForPeriod(period: string): number {
    switch (period) {
      case '1M': return this.benchmarkVolatility1M;
      case '3M': return this.benchmarkVolatility3M;
      case '1Y': return this.benchmarkVolatility1Y;
      default: return 0;
    }
  }

  /**
   * Get max drawdown for specific period
   */
  getMaxDrawdownForPeriod(period: string): number {
    switch (period) {
      case '1M': return this.benchmarkMaxDrawdown1M;
      case '3M': return this.benchmarkMaxDrawdown3M;
      case '1Y': return this.benchmarkMaxDrawdown1Y;
      default: return 0;
    }
  }

  /**
   * Calculate Sharpe ratio for specific period
   */
  calculateSharpeRatio(period: string, riskFreeRate: number = 0): number {
    const returnValue = this.getReturnForPeriod(period);
    const volatility = this.getVolatilityForPeriod(period);
    
    if (volatility === 0) return 0;
    return Number(((returnValue - riskFreeRate) / volatility).toFixed(4));
  }

  /**
   * Get risk level based on volatility
   */
  get riskLevel(): 'Low' | 'Medium' | 'High' {
    const avgVolatility = (this.benchmarkVolatility1M + this.benchmarkVolatility3M + this.benchmarkVolatility1Y) / 3;
    if (avgVolatility < 10) return 'Low';
    if (avgVolatility < 20) return 'Medium';
    return 'High';
  }

  /**
   * Check if benchmark is an index
   */
  get isIndex(): boolean {
    return this.benchmarkType === 'INDEX';
  }

  /**
   * Check if benchmark is an ETF
   */
  get isETF(): boolean {
    return this.benchmarkType === 'ETF';
  }

  /**
   * Check if benchmark is custom
   */
  get isCustom(): boolean {
    return this.benchmarkType === 'CUSTOM';
  }

  /**
   * Get display name for the benchmark
   */
  getDisplayName(): string {
    return `${this.benchmarkName} (${this.benchmarkType}) - ${this.snapshotDate.toISOString().split('T')[0]}`;
  }

  /**
   * Validate benchmark data
   */
  validate(): boolean {
    return (
      this.benchmarkId != null &&
      this.benchmarkName != null &&
      this.benchmarkType != null &&
      this.snapshotDate != null &&
      this.granularity != null &&
      this.benchmarkValue >= 0
    );
  }
}
