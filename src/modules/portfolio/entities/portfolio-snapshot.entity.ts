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
 * PortfolioSnapshot Entity
 * 
 * Stores portfolio-level snapshots for high-level performance tracking.
 * Complements AssetAllocationSnapshot by providing portfolio summary data.
 * 
 * Key Features:
 * - Dynamic asset allocation tracking (JSON field for flexibility)
 * - Simple risk metrics (volatility, max drawdown)
 * - Cash balance integration from portfolio
 * - Performance metrics (daily, weekly, monthly, YTD returns)
 * - Created automatically with asset snapshots
 */
@Entity('portfolio_snapshots')
@Index(['portfolioId', 'snapshotDate', 'granularity'])
@Index(['snapshotDate', 'granularity'])
@Index(['portfolioId', 'snapshotDate'])
export class PortfolioSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'portfolio_id', type: 'uuid' })
  portfolioId: string;

  @Column({ name: 'portfolio_name', type: 'varchar', length: 255 })
  portfolioName: string;

  @Column({ name: 'snapshot_date', type: 'date' })
  snapshotDate: Date;

  @Column({
    name: 'granularity',
    type: 'enum',
    enum: SnapshotGranularity,
    default: SnapshotGranularity.DAILY,
  })
  granularity: SnapshotGranularity;

  // Asset Value Fields (Assets Only)
  @Column({ name: 'total_asset_value', type: 'decimal', precision: 20, scale: 8, default: 0 })
  totalAssetValue: number;

  @Column({ name: 'total_asset_invested', type: 'decimal', precision: 20, scale: 8, default: 0 })
  totalAssetInvested: number;

  // Asset P&L Fields (Assets Only)
  @Column({ name: 'total_asset_pl', type: 'decimal', precision: 20, scale: 8, default: 0 })
  totalAssetPl: number;

  @Column({ name: 'unrealized_asset_pl', type: 'decimal', precision: 20, scale: 8, default: 0 })
  unrealizedAssetPl: number;

  @Column({ name: 'realized_asset_pl', type: 'decimal', precision: 20, scale: 8, default: 0 })
  realizedAssetPl: number;

  // Portfolio P&L Fields (Assets + Deposits)
  @Column({ name: 'total_portfolio_pl', type: 'decimal', precision: 20, scale: 8, default: 0 })
  totalPortfolioPl: number;

  @Column({ name: 'unrealized_portfolio_pl', type: 'decimal', precision: 20, scale: 8, default: 0 })
  unrealizedPortfolioPl: number;

  @Column({ name: 'realized_portfolio_pl', type: 'decimal', precision: 20, scale: 8, default: 0 })
  realizedPortfolioPl: number;

  @Column({ name: 'total_return', type: 'decimal', precision: 8, scale: 4, default: 0 })
  totalReturn: number;

  @Column({ name: 'cash_balance', type: 'decimal', precision: 20, scale: 8, default: 0 })
  cashBalance: number;

  // Portfolio Value Fields (Assets + Deposits)
  @Column({ name: 'total_portfolio_value', type: 'decimal', precision: 20, scale: 8, default: 0 })
  totalPortfolioValue: number;

  @Column({ name: 'total_portfolio_invested', type: 'decimal', precision: 20, scale: 8, default: 0 })
  totalPortfolioInvested: number;

  // Deposit Fields
  @Column({ name: 'total_deposit_principal', type: 'decimal', precision: 20, scale: 8, default: 0 })
  totalDepositPrincipal: number;

  @Column({ name: 'total_deposit_interest', type: 'decimal', precision: 20, scale: 8, default: 0 })
  totalDepositInterest: number;

  @Column({ name: 'total_deposit_value', type: 'decimal', precision: 20, scale: 8, default: 0 })
  totalDepositValue: number;

  @Column({ name: 'total_deposit_count', type: 'int', default: 0 })
  totalDepositCount: number;

  // Deposit P&L Fields
  @Column({ name: 'unrealized_deposit_pnl', type: 'decimal', precision: 20, scale: 8, default: 0 })
  unrealizedDepositPnL: number;

  @Column({ name: 'realized_deposit_pnl', type: 'decimal', precision: 20, scale: 8, default: 0 })
  realizedDepositPnL: number;

  // Performance Metrics
  @Column({ name: 'daily_return', type: 'decimal', precision: 8, scale: 4, default: 0 })
  dailyReturn: number;

  @Column({ name: 'weekly_return', type: 'decimal', precision: 8, scale: 4, default: 0 })
  weeklyReturn: number;

  @Column({ name: 'monthly_return', type: 'decimal', precision: 8, scale: 4, default: 0 })
  monthlyReturn: number;

  @Column({ name: 'ytd_return', type: 'decimal', precision: 8, scale: 4, default: 0 })
  ytdReturn: number;

  // Simple Risk Metrics
  @Column({ name: 'volatility', type: 'decimal', precision: 8, scale: 4, default: 0 })
  volatility: number;

  @Column({ name: 'max_drawdown', type: 'decimal', precision: 8, scale: 4, default: 0 })
  maxDrawdown: number;

  // Dynamic Asset Allocation (JSON for flexibility)
  @Column({ 
    name: 'asset_allocation', 
    type: 'jsonb',
    nullable: true 
  })
  assetAllocation: {
    [assetType: string]: {
      percentage: number;
      value: number;
      count: number;
    };
  };

  // Portfolio Statistics
  @Column({ name: 'asset_count', type: 'int', default: 0 })
  assetCount: number;

  @Column({ name: 'active_asset_count', type: 'int', default: 0 })
  activeAssetCount: number;

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

  // Business Logic Methods
  /**
   * Calculate total allocation percentage
   */
  get totalAllocationPercentage(): number {
    if (!this.assetAllocation) return 0;
    return Object.values(this.assetAllocation).reduce((sum, allocation) => sum + allocation.percentage, 0);
  }

  /**
   * Get allocation for specific asset type
   */
  getAllocationForType(assetType: string): { percentage: number; value: number; count: number } | null {
    return this.assetAllocation?.[assetType] || null;
  }

  /**
   * Get top asset types by allocation
   */
  getTopAssetTypes(limit: number = 5): Array<{ type: string; percentage: number; value: number; count: number }> {
    if (!this.assetAllocation) return [];
    
    return Object.entries(this.assetAllocation)
      .map(([type, data]) => ({ type, ...data }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, limit);
  }

  /**
   * Check if portfolio is properly allocated (total allocation ≈ 100%)
   */
  get isProperlyAllocated(): boolean {
    const total = this.totalAllocationPercentage;
    return total >= 99.5 && total <= 100.5; // Allow small rounding errors
  }

  /**
   * Get risk level based on volatility
   */
  get riskLevel(): 'Low' | 'Medium' | 'High' {
    if (this.volatility < 10) return 'Low';
    if (this.volatility < 20) return 'Medium';
    return 'High';
  }
}
