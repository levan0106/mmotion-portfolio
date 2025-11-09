import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { InvestorHolding } from './investor-holding.entity';

export enum HoldingType {
  SUBSCRIBE = 'SUBSCRIBE',
  REDEEM = 'REDEEM',
}

@Entity('fund_unit_transactions')
export class FundUnitTransaction {
  @PrimaryGeneratedColumn('uuid', { name: 'transaction_id' })
  transactionId: string;

  @Column('uuid', { name: 'holding_id' })
  holdingId: string;

  @Column('uuid', { name: 'cash_flow_id', nullable: true })
  cashFlowId: string;

  @Column({
    type: 'enum',
    enum: HoldingType,
    name: 'holding_type'
  })
  holdingType: HoldingType;

  @Column('decimal', { precision: 20, scale: 3 })
  units: number;

  @Column('decimal', { precision: 20, scale: 3, name: 'nav_per_unit' })
  navPerUnit: number;

  @Column('decimal', { precision: 20, scale: 3 })
  amount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => InvestorHolding, (holding) => holding.transactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'holding_id' })
  holding: InvestorHolding;
}
