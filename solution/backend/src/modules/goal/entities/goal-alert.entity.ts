import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PortfolioGoal } from './portfolio-goal.entity';
import { Account } from '../../shared/entities/account.entity';

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

@Entity('goal_alerts')
@Index(['goalId'])
@Index(['status'])
@Index(['alertType'])
export class GoalAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'goal_id', type: 'uuid' })
  goalId: string;

  @Column({
    name: 'alert_type',
    type: 'varchar',
    length: 50,
    enum: AlertType,
  })
  alertType: AlertType;

  @Column({ name: 'message', type: 'text' })
  message: string;

  @Column({ name: 'threshold_value', type: 'decimal', precision: 20, scale: 4, nullable: true })
  thresholdValue: number;

  @Column({ name: 'current_value', type: 'decimal', precision: 20, scale: 4, nullable: true })
  currentValue: number;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    enum: AlertStatus,
    default: AlertStatus.PENDING,
  })
  status: AlertStatus;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ name: 'acknowledged_at', type: 'timestamp', nullable: true })
  acknowledgedAt: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relationships
  @ManyToOne(() => PortfolioGoal, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'goal_id' })
  goal: PortfolioGoal;

  @ManyToOne(() => Account, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: Account;

  // Business logic methods
  isPending(): boolean {
    return this.status === AlertStatus.PENDING;
  }

  isSent(): boolean {
    return this.status === AlertStatus.SENT;
  }

  isAcknowledged(): boolean {
    return this.status === AlertStatus.ACKNOWLEDGED;
  }

  isDismissed(): boolean {
    return this.status === AlertStatus.DISMISSED;
  }

  acknowledge(): void {
    this.status = AlertStatus.ACKNOWLEDGED;
    this.acknowledgedAt = new Date();
  }

  dismiss(): void {
    this.status = AlertStatus.DISMISSED;
  }

  markAsSent(): void {
    this.status = AlertStatus.SENT;
    this.sentAt = new Date();
  }

  getSeverity(): string {
    switch (this.alertType) {
      case AlertType.CRITICAL:
        return 'HIGH';
      case AlertType.WARNING:
        return 'MEDIUM';
      case AlertType.ACHIEVEMENT:
        return 'LOW';
      default:
        return 'MEDIUM';
    }
  }
}
