import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Deposit } from '../entities/deposit.entity';

export interface DepositFilters {
  portfolioId?: string;
  status?: 'ACTIVE' | 'SETTLED';
  bankName?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class DepositRepository {
  constructor(
    @InjectRepository(Deposit)
    private readonly repository: Repository<Deposit>,
  ) {}

  /**
   * Find deposits with pagination and filters
   */
  async findWithPagination(filters: DepositFilters): Promise<PaginatedResult<Deposit>> {
    const queryBuilder = this.createQueryBuilderWithFilters(filters);

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    // Apply sorting
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'DESC';
    queryBuilder.orderBy(`deposit.${sortBy}`, sortOrder);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find all deposits for a specific portfolio
   */
  async findByPortfolioId(portfolioId: string): Promise<Deposit[]> {
    return this.repository.find({
      where: { portfolioId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find active deposits for a specific portfolio
   */
  async findActiveByPortfolioId(portfolioId: string): Promise<Deposit[]> {
    return this.repository.find({
      where: { 
        portfolioId,
        status: 'ACTIVE'
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find settled deposits for a specific portfolio
   */
  async findSettledByPortfolioId(portfolioId: string): Promise<Deposit[]> {
    return this.repository.find({
      where: { 
        portfolioId,
        status: 'SETTLED'
      },
      order: { settledAt: 'DESC' },
    });
  }

  /**
   * Find deposits by status
   */
  async findByStatus(status: 'ACTIVE' | 'SETTLED'): Promise<Deposit[]> {
    return this.repository.find({
      where: { status },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find deposits by bank name (case-insensitive search)
   */
  async findByBankName(bankName: string): Promise<Deposit[]> {
    return this.repository
      .createQueryBuilder('deposit')
      .where('LOWER(deposit.bankName) LIKE LOWER(:bankName)', { 
        bankName: `%${bankName}%` 
      })
      .orderBy('deposit.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Find deposits by date range
   */
  async findByDateRange(
    startDate: Date, 
    endDate: Date, 
    portfolioId?: string
  ): Promise<Deposit[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('deposit')
      .where('deposit.startDate >= :startDate', { startDate })
      .andWhere('deposit.startDate <= :endDate', { endDate });

    if (portfolioId) {
      queryBuilder.andWhere('deposit.portfolioId = :portfolioId', { portfolioId });
    }

    return queryBuilder
      .orderBy('deposit.startDate', 'ASC')
      .getMany();
  }

  /**
   * Find matured deposits (end date <= current date)
   */
  async findMaturedDeposits(portfolioId?: string): Promise<Deposit[]> {
    const queryBuilder = this.repository
      .createQueryBuilder('deposit')
      .where('deposit.endDate <= :currentDate', { currentDate: new Date() })
      .andWhere('deposit.status = :status', { status: 'ACTIVE' });

    if (portfolioId) {
      queryBuilder.andWhere('deposit.portfolioId = :portfolioId', { portfolioId });
    }

    return queryBuilder
      .orderBy('deposit.endDate', 'ASC')
      .getMany();
  }

  /**
   * Find deposits expiring soon (within specified days)
   */
  async findExpiringSoon(days: number = 30, portfolioId?: string): Promise<Deposit[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const queryBuilder = this.repository
      .createQueryBuilder('deposit')
      .where('deposit.endDate <= :futureDate', { futureDate })
      .andWhere('deposit.endDate > :currentDate', { currentDate: new Date() })
      .andWhere('deposit.status = :status', { status: 'ACTIVE' });

    if (portfolioId) {
      queryBuilder.andWhere('deposit.portfolioId = :portfolioId', { portfolioId });
    }

    return queryBuilder
      .orderBy('deposit.endDate', 'ASC')
      .getMany();
  }

  /**
   * Get deposit statistics for a portfolio
   */
  async getDepositStatistics(portfolioId: string): Promise<{
    totalDeposits: number;
    activeDeposits: number;
    settledDeposits: number;
    totalPrincipal: number;
    totalAccruedInterest: number;
    totalSettledInterest: number;
    totalInterest: number;
    totalValue: number;
    averageInterestRate: number;
  }> {
    const deposits = await this.findByPortfolioId(portfolioId);
    
    const activeDeposits = deposits.filter(d => d.status === 'ACTIVE');
    const settledDeposits = deposits.filter(d => d.status === 'SETTLED');

    // Only calculate totalPrincipal for active deposits (not settled)
    const totalPrincipal = activeDeposits.reduce((sum, d) => {
      const principal = typeof d.principal === 'string' ? parseFloat(d.principal) : (d.principal || 0);
      return sum + principal;
    }, 0);
    const totalAccruedInterest = activeDeposits.reduce((sum, d) => sum + d.calculateAccruedInterest(), 0);
    const totalSettledInterest = settledDeposits.reduce((sum, d) => {
      const actualInterest = typeof d.actualInterest === 'string' ? parseFloat(d.actualInterest) : (d.actualInterest || 0);
      return sum + actualInterest;
    }, 0);
    const totalInterest = totalAccruedInterest + totalSettledInterest;
    // Only calculate totalValue for active deposits (not settled)
    const totalValue = totalPrincipal + totalAccruedInterest;
    const averageInterestRate = deposits.length > 0 
      ? deposits.reduce((sum, d) => {
          const interestRate = typeof d.interestRate === 'string' ? parseFloat(d.interestRate) : (d.interestRate || 0);
          return sum + interestRate;
        }, 0) / deposits.length 
      : 0;

    return {
      totalDeposits: deposits.length,
      activeDeposits: activeDeposits.length,
      settledDeposits: settledDeposits.length,
      totalPrincipal,
      totalAccruedInterest,
      totalSettledInterest,
      totalInterest,
      totalValue,
      averageInterestRate: Math.round(averageInterestRate * 100) / 100,
    };
  }

  /**
   * Find deposit by ID
   */
  async findById(id: string): Promise<Deposit | null> {
    return this.repository.findOne({ where: { depositId: id } });
  }

  /**
   * Find deposit by ID or throw error
   */
  async findByIdOrFail(id: string): Promise<Deposit> {
    const deposit = await this.findById(id);
    if (!deposit) {
      throw new Error(`Deposit with ID ${id} not found`);
    }
    return deposit;
  }

  /**
   * Create a new deposit
   */
  async create(depositData: Partial<Deposit>): Promise<Deposit> {
    const deposit = this.repository.create(depositData);
    return this.repository.save(deposit);
  }

  /**
   * Update a deposit
   */
  async update(id: string, updateData: Partial<Deposit>): Promise<Deposit> {
    await this.repository.update(id, updateData);
    return this.findByIdOrFail(id);
  }

  /**
   * Delete a deposit
   */
  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * Save a deposit (create or update)
   */
  async save(deposit: Deposit): Promise<Deposit> {
    return this.repository.save(deposit);
  }

  /**
   * Count deposits by criteria
   */
  async count(filters: Partial<DepositFilters>): Promise<number> {
    const queryBuilder = this.createQueryBuilderWithFilters(filters);
    return queryBuilder.getCount();
  }

  /**
   * Check if deposit exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { depositId: id } });
    return count > 0;
  }

  /**
   * Get deposits by multiple IDs
   */
  async findByIds(ids: string[]): Promise<Deposit[]> {
    return this.repository.findByIds(ids);
  }

  /**
   * Create query builder with filters applied
   */
  private createQueryBuilderWithFilters(filters: DepositFilters): SelectQueryBuilder<Deposit> {
    const queryBuilder = this.repository.createQueryBuilder('deposit');

    if (filters.portfolioId) {
      queryBuilder.andWhere('deposit.portfolioId = :portfolioId', { 
        portfolioId: filters.portfolioId 
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('deposit.status = :status', { 
        status: filters.status 
      });
    }

    if (filters.bankName) {
      queryBuilder.andWhere('LOWER(deposit.bankName) LIKE LOWER(:bankName)', { 
        bankName: `%${filters.bankName}%` 
      });
    }

    return queryBuilder;
  }
}
