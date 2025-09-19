import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Portfolio } from './portfolio.entity';

export enum CashFlowType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  DIVIDEND = 'DIVIDEND',
  INTEREST = 'INTEREST',
  FEE = 'FEE',
  TAX = 'TAX',
  ADJUSTMENT = 'ADJUSTMENT',
  BUY_TRADE = 'BUY_TRADE',
  SELL_TRADE = 'SELL_TRADE',
  OTHER = 'OTHER',
  TRADE_SETTLEMENT = 'TRADE_SETTLEMENT', // Tự động tạo từ trades
}

export enum CashFlowStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('cash_flows')
@Index(['portfolioId'])
@Index(['flowDate'])
@Index(['type'])
export class CashFlow {
  @PrimaryGeneratedColumn('uuid', { name: 'cash_flow_id' })
  cashFlowId: string;

  @Column('uuid', { name: 'portfolio_id' })
  portfolioId: string;

  @Column({ type: 'enum', enum: CashFlowType })
  type: CashFlowType;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'VND' })
  currency: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  reference: string; // Bank transfer ref, check number, etc.

  @Column({ type: 'enum', enum: CashFlowStatus, default: CashFlowStatus.COMPLETED })
  status: CashFlowStatus;

  @Column({ type: 'timestamp', name: 'flow_date' })
  flowDate: Date;

  @Column({ type: 'timestamp', name: 'effective_date', nullable: true })
  effectiveDate: Date; // Khi nào thực sự có hiệu lực

  @Column({ type: 'uuid', name: 'trade_id', nullable: true })
  tradeId: string; // Link to trade if created from trade

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Portfolio, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'portfolio_id' })
  portfolio: Portfolio;

  // Computed properties
  get isInflow(): boolean {
    return [CashFlowType.DEPOSIT, CashFlowType.DIVIDEND, CashFlowType.INTEREST, CashFlowType.SELL_TRADE].includes(this.type);
  }

  get isOutflow(): boolean {
    return [CashFlowType.WITHDRAWAL, CashFlowType.FEE, CashFlowType.TAX, CashFlowType.BUY_TRADE].includes(this.type);
  }

  get netAmount(): number {
    return this.isInflow ? parseFloat(this.amount.toString()) : -parseFloat(this.amount.toString());
  }
}