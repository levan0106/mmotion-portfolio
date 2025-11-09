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
 * AssetAllocationSnapshot Entity
 * 
 * Stores historical snapshots of asset allocations for fast timeline queries.
 * Replaces expensive trade-based calculations with pre-computed snapshot data.
 * 
 * Key Features:
 * - Multi-granularity support (DAILY, WEEKLY, MONTHLY)
 * - Complete P&L tracking (realized, unrealized, total)
 * - Performance optimized with database indexes
 * - Asset-level snapshots for better grouping and analysis
 */
@Entity('asset_allocation_snapshots')
@Index(['portfolioId', 'snapshotDate', 'granularity'])
@Index(['portfolioId', 'assetId', 'snapshotDate'])
@Index(['snapshotDate', 'granularity'])
@Index(['assetSymbol', 'snapshotDate'])
export class AssetAllocationSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'portfolio_id', type: 'uuid' })
  portfolioId: string;

  @Column({ name: 'asset_id', type: 'uuid' })
  assetId: string;

  @Column({ name: 'asset_symbol', type: 'varchar', length: 50 })
  assetSymbol: string;

  @Column({ name: 'asset_type', type: 'varchar', length: 50 })
  assetType: string;

  @Column({ name: 'snapshot_date', type: 'date' })
  snapshotDate: Date;

  @Column({
    name: 'granularity',
    type: 'enum',
    enum: SnapshotGranularity,
    default: SnapshotGranularity.DAILY,
  })
  granularity: SnapshotGranularity;

  // Asset Position Data
  @Column({ name: 'quantity', type: 'decimal', precision: 20, scale: 8, default: 0 })
  quantity: number;

  @Column({ name: 'current_price', type: 'decimal', precision: 20, scale: 8, default: 0 })
  currentPrice: number;

  @Column({ name: 'current_value', type: 'decimal', precision: 20, scale: 8, default: 0 })
  currentValue: number;

  @Column({ name: 'cost_basis', type: 'decimal', precision: 20, scale: 8, default: 0 })
  costBasis: number;

  @Column({ name: 'avg_cost', type: 'decimal', precision: 20, scale: 8, default: 0 })
  avgCost: number;

  // P&L Calculations
  @Column({ name: 'realized_pl', type: 'decimal', precision: 20, scale: 8, default: 0 })
  realizedPl: number;

  @Column({ name: 'unrealized_pl', type: 'decimal', precision: 20, scale: 8, default: 0 })
  unrealizedPl: number;

  @Column({ name: 'total_pl', type: 'decimal', precision: 20, scale: 8, default: 0 })
  totalPl: number;

  // Allocation Data
  @Column({ name: 'allocation_percentage', type: 'decimal', precision: 15, scale: 6, default: 0 })
  allocationPercentage: number;

  @Column({ name: 'portfolio_total_value', type: 'decimal', precision: 20, scale: 8, default: 0 })
  portfolioTotalValue: number;

  // Performance Metrics
  @Column({ name: 'return_percentage', type: 'decimal', precision: 15, scale: 6, default: 0 })
  returnPercentage: number;

  @Column({ name: 'daily_return', type: 'decimal', precision: 15, scale: 6, default: 0 })
  dailyReturn: number;

  @Column({ name: 'cumulative_return', type: 'decimal', precision: 15, scale: 6, default: 0 })
  cumulativeReturn: number;

  // Metadata
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'created_by', type: 'varchar', length: 100, nullable: true })
  createdBy: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

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
   * Calculate unrealized P&L
   */
  calculateUnrealizedPl(): number {
    return this.currentValue - this.costBasis;
  }

  /**
   * Calculate total P&L (realized + unrealized)
   */
  calculateTotalPl(): number {
    return this.realizedPl + this.unrealizedPl;
  }

  /**
   * Calculate return percentage
   */
  calculateReturnPercentage(): number {
    if (this.costBasis === 0) return 0;
    return ((this.currentValue - this.costBasis) / this.costBasis) * 100;
  }

  /**
   * Calculate allocation percentage
   */
  calculateAllocationPercentage(): number {
    if (this.portfolioTotalValue === 0) return 0;
    return (this.currentValue / this.portfolioTotalValue) * 100;
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
    return `${this.assetSymbol} - ${this.snapshotDate.toISOString().split('T')[0]} (${this.granularity})`;
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
      this.quantity >= 0 &&
      this.currentPrice >= 0 &&
      this.currentValue >= 0 &&
      this.costBasis >= 0 &&
      this.avgCost >= 0
    );
  }
}
