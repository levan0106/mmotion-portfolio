import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Portfolio } from './portfolio.entity';

@Entity('deposits')
@Index(['portfolioId'])
@Index(['status'])
@Index(['startDate'])
@Index(['endDate'])
export class Deposit {
  @PrimaryGeneratedColumn('uuid', { name: 'deposit_id' })
  depositId: string;

  @Column('uuid', { name: 'portfolio_id' })
  portfolioId: string;

  @Column({ type: 'varchar', length: 100, name: 'bank_name' })
  bankName: string;

  @Column({ type: 'varchar', length: 50, name: 'account_number', nullable: true })
  accountNumber?: string;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  principal: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'interest_rate' })
  interestRate: number; // %/year

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'date', name: 'end_date' })
  endDate: Date;

  @Column({ type: 'int', nullable: true, name: 'term_months' })
  termMonths: number; // Kỳ hạn (ví dụ: 3, 6, 12 tháng)

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status: 'ACTIVE' | 'SETTLED';

  @Column({ type: 'decimal', precision: 20, scale: 2, nullable: true, name: 'actual_interest' })
  actualInterest: number; // For early settlement

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'timestamp', name: 'settled_at', nullable: true })
  settledAt: Date;

  // Relationships
  @ManyToOne(() => Portfolio, portfolio => portfolio.deposits)
  @JoinColumn({ name: 'portfolio_id' })
  portfolio: Portfolio;

  // Business Logic Methods
  /**
   * Calculate accrued interest using simple interest formula
   * Interest = Principal × Interest Rate × (Days / 365)
   */
  calculateAccruedInterest(): number {
    if (this.status === 'SETTLED') {
      return this.actualInterest || 0;
    }

    const currentDate = new Date();
    const startDate = this.startDate instanceof Date ? this.startDate : new Date(this.startDate);
    const endDate = this.endDate instanceof Date ? this.endDate : new Date(this.endDate);
    
    // If current date is before start date, no interest accrued
    if (currentDate < startDate) {
      return 0;
    }
    
    // If current date is after end date, calculate full term interest
    const calculationDate = currentDate > endDate ? endDate : currentDate;
    
    // Calculate days between start date and calculation date
    const timeDiff = calculationDate.getTime() - startDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // Simple interest formula: Principal × Rate × (Days / 365)
    const principal = typeof this.principal === 'string' ? parseFloat(this.principal) : this.principal;
    const interestRate = typeof this.interestRate === 'string' ? parseFloat(this.interestRate) : this.interestRate;
    const interest = (principal * interestRate * daysDiff) / (100 * 365);
    
    return Math.round(interest * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculate total value (principal + accrued interest for active, principal + actual interest for settled)
   */
  calculateTotalValue(): number {
    const principal = typeof this.principal === 'string' ? parseFloat(this.principal) : this.principal;
    
    // If deposit is settled, use actual interest received
    if (this.status === 'SETTLED' && this.actualInterest !== null && this.actualInterest !== undefined) {
      const actualInterest = typeof this.actualInterest === 'string' ? parseFloat(this.actualInterest) : this.actualInterest;
      return principal + actualInterest;
    }
    
    // For active deposits, use accrued interest
    const accruedInterest = this.calculateAccruedInterest();
    return principal + accruedInterest;
  }

  /**
   * Check if deposit has matured (current date >= end date)
   */
  isMatured(): boolean {
    const currentDate = new Date();
    const endDate = new Date(this.endDate);
    return currentDate >= endDate;
  }

  /**
   * Check if deposit can be edited (only active deposits can be edited)
   */
  canBeEdited(): boolean {
    return this.status === 'ACTIVE';
  }

  /**
   * Check if deposit can be settled (active deposits can be settled)
   */
  canBeSettled(): boolean {
    return this.status === 'ACTIVE';
  }

  /**
   * Get days until maturity (negative if already matured)
   */
  getDaysUntilMaturity(): number {
    const currentDate = new Date();
    const endDate = new Date(this.endDate);
    const timeDiff = endDate.getTime() - currentDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  /**
   * Get deposit term in days
   */
  getTermInDays(): number {
    const startDate = this.startDate instanceof Date ? this.startDate : new Date(this.startDate);
    const endDate = this.endDate instanceof Date ? this.endDate : new Date(this.endDate);
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  /**
   * Get deposit term description
   */
  getTermDescription(): string {
    const days = this.getTermInDays();
    
    // More accurate term classification
    if (days <= 30) {
      return '1 Month';
    } else if (days <= 60) {
      return '2 Months';
    } else if (days <= 90) {
      return '3 Months';
    } else if (days <= 120) {
      return '4 Months';
    } else if (days <= 150) {
      return '5 Months';
    } else if (days <= 180) {
      return '6 Months';
    } else if (days <= 210) {
      return '7 Months';
    } else if (days <= 240) {
      return '8 Months';
    } else if (days <= 270) {
      return '9 Months';
    } else if (days <= 300) {
      return '10 Months';
    } else if (days <= 330) {
      return '11 Months';
    } else if (days <= 365) {
      return '1 Year';
    } else if (days <= 730) {
      return '2 Years';
    } else if (days <= 1095) {
      return '3 Years';
    } else if (days <= 1460) {
      return '4 Years';
    } else if (days <= 1825) {
      return '5 Years';
    } else {
      return `${Math.round(days / 365)} Years`;
    }
  }
}
