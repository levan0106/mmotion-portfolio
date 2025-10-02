import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { DepositRepository, DepositFilters } from '../repositories/deposit.repository';
import { CashFlowService } from './cash-flow.service';
import { CashFlowType } from '../entities/cash-flow.entity';
import { 
  CreateDepositDto, 
  UpdateDepositDto, 
  SettleDepositDto, 
  DepositResponseDto, 
  DepositAnalyticsDto,
  DepositStatisticsDto,
  PaginatedDepositResponseDto
} from '../dto/deposit.dto';
import { Deposit } from '../entities/deposit.entity';

@Injectable()
export class DepositService {
  constructor(
    private readonly depositRepository: DepositRepository,
    @Inject(forwardRef(() => CashFlowService))
    private readonly cashFlowService: CashFlowService,
  ) {}

  /**
   * Create a new deposit
   */
  async createDeposit(createDepositDto: CreateDepositDto): Promise<DepositResponseDto> {
    // Validate portfolio exists
    // await this.portfolioService.getPortfolioDetails(createDepositDto.portfolioId);

    // Validate dates
    this.validateDepositDates(createDepositDto.startDate, createDepositDto.endDate);

    // Create deposit
    const depositData = {
      ...createDepositDto,
      startDate: new Date(createDepositDto.startDate),
      endDate: new Date(createDepositDto.endDate),
    };

    const savedDeposit = await this.depositRepository.create(depositData);

    // Create cash flow entry for deposit creation (money out)
    await this.cashFlowService.createCashFlowFromDeposit(savedDeposit);

    return this.mapToResponseDto(savedDeposit);
  }

  /**
   * Get deposits with pagination and filters
   */
  async getDeposits(filters: DepositFilters): Promise<PaginatedDepositResponseDto> {
    const result = await this.depositRepository.findWithPagination(filters);
    
    return {
      data: result.data.map(deposit => this.mapToResponseDto(deposit)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  /**
   * Get deposit by ID
   */
  async getDepositById(id: string): Promise<DepositResponseDto> {
    const deposit = await this.depositRepository.findByIdOrFail(id);
    return this.mapToResponseDto(deposit);
  }

  /**
   * Update deposit
   */
  async updateDeposit(id: string, updateDepositDto: UpdateDepositDto): Promise<DepositResponseDto> {
    const deposit = await this.depositRepository.findByIdOrFail(id);
    
    if (!deposit.canBeEdited()) {
      throw new BadRequestException('Cannot edit settled deposit');
    }

    // Validate dates if provided
    if (updateDepositDto.startDate || updateDepositDto.endDate) {
      const startDate = updateDepositDto.startDate || deposit.startDate.toISOString().split('T')[0];
      const endDate = updateDepositDto.endDate || deposit.endDate.toISOString().split('T')[0];
      this.validateDepositDates(startDate, endDate);
    }

    // Update deposit
    const updateData: Partial<Deposit> = {};
    
    if (updateDepositDto.bankName !== undefined) updateData.bankName = updateDepositDto.bankName;
    if (updateDepositDto.accountNumber !== undefined) updateData.accountNumber = updateDepositDto.accountNumber;
    if (updateDepositDto.principal !== undefined) updateData.principal = updateDepositDto.principal;
    if (updateDepositDto.interestRate !== undefined) updateData.interestRate = updateDepositDto.interestRate;
    if (updateDepositDto.startDate !== undefined) updateData.startDate = new Date(updateDepositDto.startDate);
    if (updateDepositDto.endDate !== undefined) updateData.endDate = new Date(updateDepositDto.endDate);
    if (updateDepositDto.notes !== undefined) updateData.notes = updateDepositDto.notes;

    const updatedDeposit = await this.depositRepository.update(id, updateData);

    // Update cash flow if principal or bank name changed
    if (updateDepositDto.principal !== undefined || updateDepositDto.bankName !== undefined) {
      // Create new cash flow with updated information (automatically deletes old ones)
      await this.cashFlowService.createCashFlowFromDeposit(updatedDeposit);
    }

    return this.mapToResponseDto(updatedDeposit);
  }

  /**
   * Settle deposit
   */
  async settleDeposit(id: string, settleDepositDto: SettleDepositDto): Promise<DepositResponseDto> {
    const deposit = await this.depositRepository.findByIdOrFail(id);
    
    if (!deposit.canBeSettled()) {
      throw new BadRequestException('Deposit cannot be settled');
    }

    // Update deposit
    deposit.status = 'SETTLED';
    deposit.actualInterest = settleDepositDto.actualInterest;
    deposit.settledAt = new Date(settleDepositDto.settlementDate);
    if (settleDepositDto.notes) {
      deposit.notes = settleDepositDto.notes;
    }

    const settledDeposit = await this.depositRepository.save(deposit);

    // Create cash flow entry for deposit settlement (money + interest in)
    await this.cashFlowService.createCashFlowFromDeposit(settledDeposit);

    return this.mapToResponseDto(settledDeposit);
  }

  /**
   * Delete deposit
   */
  async deleteDeposit(id: string): Promise<void> {
    const deposit = await this.depositRepository.findByIdOrFail(id);
    
    // Allow deletion of both ACTIVE and SETTLED deposits
    console.log(`[DepositService] Deleting deposit ${id} with status: ${deposit.status}`);

    // Delete old cash flows. DON'T change this logic.
    // step1: delete creation cash flow
    const referenceId = this.cashFlowService.formatReferenceId(deposit.depositId, "ACTIVE");
    await this.cashFlowService.deleteCashFlowByReferenceIdSilent(referenceId);
    // step2: delete settlement cash flow if it exists
    const referenceIdSettlement = this.cashFlowService.formatReferenceId(deposit.depositId, "SETTLED");
    await this.cashFlowService.deleteCashFlowByReferenceIdSilent(referenceIdSettlement);
    // step3: recalculate balance
    await this.cashFlowService.recalculateCashBalance(deposit.portfolioId);
    
    await this.depositRepository.delete(id);
    
    console.log(`[DepositService] Successfully deleted deposit ${id}`);
  }

  /**
   * Get deposit analytics for a portfolio
   */
  async getDepositAnalytics(portfolioId: string): Promise<DepositAnalyticsDto> {
    const statistics = await this.depositRepository.getDepositStatistics(portfolioId);
    const deposits = await this.depositRepository.findByPortfolioId(portfolioId);

    const depositAmounts = deposits.map(d => {
      const principal = typeof d.principal === 'string' ? parseFloat(d.principal) : (d.principal || 0);
      return principal;
    });
    const averageDepositAmount = depositAmounts.length > 0 
      ? depositAmounts.reduce((sum, amount) => sum + amount, 0) / depositAmounts.length 
      : 0;
    const largestDepositAmount = depositAmounts.length > 0 ? Math.max(...depositAmounts) : 0;
    const smallestDepositAmount = depositAmounts.length > 0 ? Math.min(...depositAmounts) : 0;

    return {
      totalDeposits: statistics.totalDeposits,
      totalPrincipal: statistics.totalPrincipal,
      totalAccruedInterest: statistics.totalAccruedInterest,
      totalValue: statistics.totalValue,
      averageInterestRate: statistics.averageInterestRate,
      activeDeposits: statistics.activeDeposits,
      settledDeposits: statistics.settledDeposits,
      totalSettledInterest: statistics.totalSettledInterest,
      averageDepositAmount: Math.round(averageDepositAmount * 100) / 100,
      largestDepositAmount,
      smallestDepositAmount,
    };
  }

  /**
   * Get deposits by portfolio ID
   */
  async getDepositsByPortfolioId(portfolioId: string): Promise<DepositResponseDto[]> {
    const deposits = await this.depositRepository.findByPortfolioId(portfolioId);
    return deposits.map(deposit => this.mapToResponseDto(deposit));
  }

  /**
   * Get active deposits by portfolio ID
   */
  async getActiveDepositsByPortfolioId(portfolioId: string): Promise<DepositResponseDto[]> {
    const deposits = await this.depositRepository.findActiveByPortfolioId(portfolioId);
    return deposits.map(deposit => this.mapToResponseDto(deposit));
  }

  /**
   * Get settled deposits by portfolio ID
   */
  async getSettledDepositsByPortfolioId(portfolioId: string): Promise<DepositResponseDto[]> {
    const deposits = await this.depositRepository.findSettledByPortfolioId(portfolioId);
    return deposits.map(deposit => this.mapToResponseDto(deposit));
  }

  /**
   * Get matured deposits (ready for settlement)
   */
  async getMaturedDeposits(portfolioId?: string): Promise<DepositResponseDto[]> {
    const deposits = await this.depositRepository.findMaturedDeposits(portfolioId);
    return deposits.map(deposit => this.mapToResponseDto(deposit));
  }

  /**
   * Get deposits expiring soon
   */
  async getExpiringDeposits(days: number = 30, portfolioId?: string): Promise<DepositResponseDto[]> {
    const deposits = await this.depositRepository.findExpiringSoon(days, portfolioId);
    return deposits.map(deposit => this.mapToResponseDto(deposit));
  }

  /**
   * Get deposit statistics
   */
  async getDepositStatistics(portfolioId: string): Promise<DepositStatisticsDto> {
    const statistics = await this.depositRepository.getDepositStatistics(portfolioId);
    return {
      ...statistics,
    };
  }


  /**
   * Validate deposit dates
   */
  private validateDepositDates(startDate: string, endDate: string): void {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      throw new BadRequestException('End date must be after start date');
    }

    // Check if term is not too long (e.g., more than 10 years)
    const termInDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (termInDays > 3650) { // 10 years
      throw new BadRequestException('Deposit term cannot exceed 10 years');
    }
  }


  /**
   * Map Deposit entity to DepositResponseDto
   */
  private mapToResponseDto(deposit: Deposit): DepositResponseDto {
    return {
      depositId: deposit.depositId,
      portfolioId: deposit.portfolioId,
      bankName: deposit.bankName,
      accountNumber: deposit.accountNumber,
      principal: deposit.principal,
      interestRate: deposit.interestRate,
      startDate: deposit.startDate instanceof Date ? deposit.startDate.toISOString().split('T')[0] : deposit.startDate,
      endDate: deposit.endDate instanceof Date ? deposit.endDate.toISOString().split('T')[0] : deposit.endDate,
      status: deposit.status,
      actualInterest: deposit.actualInterest,
      notes: deposit.notes,
      accruedInterest: Math.round((deposit.calculateAccruedInterest() || 0) * 100) / 100,
      totalValue: Math.round((deposit.calculateTotalValue() || 0) * 100) / 100,
      isMatured: deposit.isMatured(),
      canBeEdited: deposit.canBeEdited(),
      canBeSettled: deposit.canBeSettled(),
      daysUntilMaturity: deposit.getDaysUntilMaturity(),
      termDescription: deposit.getTermDescription(),
      createdAt: deposit.createdAt.toISOString(),
      updatedAt: deposit.updatedAt.toISOString(),
      settledAt: deposit.settledAt?.toISOString(),
    };
  }

  async getGlobalDepositAnalytics(): Promise<DepositAnalyticsDto> {
    const allDeposits = await this.depositRepository['repository'].find();
    
    const activeDeposits = allDeposits.filter(d => d.status === 'ACTIVE');
    const settledDeposits = allDeposits.filter(d => d.status === 'SETTLED');
    
    const totalDeposits = allDeposits.length;
    // Only calculate totalPrincipal and totalValue for active deposits (not settled)
    const totalPrincipal = activeDeposits.reduce((sum, d) => {
      const principal = typeof d.principal === 'string' ? parseFloat(d.principal) : (d.principal || 0);
      return sum + principal;
    }, 0);
    const totalAccruedInterest = allDeposits.reduce((sum, d) => {
      const accruedInterest = d.calculateAccruedInterest();
      const parsedAccruedInterest = typeof accruedInterest === 'string' ? parseFloat(accruedInterest) : (accruedInterest || 0);
      return sum + parsedAccruedInterest;
    }, 0);
    const totalSettledInterest = settledDeposits.reduce((sum, d) => {
      const actualInterest = typeof d.actualInterest === 'string' ? parseFloat(d.actualInterest) : (d.actualInterest || 0);
      return sum + actualInterest;
    }, 0);
    // Only calculate totalValue for active deposits (not settled)
    const totalValue = activeDeposits.reduce((sum, d) => {
      const totalValue = d.calculateTotalValue();
      const parsedTotalValue = typeof totalValue === 'string' ? parseFloat(totalValue) : (totalValue || 0);
      return sum + parsedTotalValue;
    }, 0);
    
    const averageInterestRate = totalDeposits > 0 
      ? allDeposits.reduce((sum, d) => {
          const interestRate = typeof d.interestRate === 'string' ? parseFloat(d.interestRate) : (d.interestRate || 0);
          return sum + interestRate;
        }, 0) / totalDeposits 
      : 0;

    const averageDepositAmount = totalDeposits > 0 ? totalPrincipal / totalDeposits : 0;
    const largestDepositAmount = totalDeposits > 0 ? Math.max(...allDeposits.map(d => {
      const principal = typeof d.principal === 'string' ? parseFloat(d.principal) : (d.principal || 0);
      return principal;
    })) : 0;
    const smallestDepositAmount = totalDeposits > 0 ? Math.min(...allDeposits.map(d => {
      const principal = typeof d.principal === 'string' ? parseFloat(d.principal) : (d.principal || 0);
      return principal;
    })) : 0;

    return {
      totalDeposits,
      activeDeposits: activeDeposits.length,
      settledDeposits: settledDeposits.length,
      totalPrincipal,
      totalAccruedInterest,
      totalSettledInterest,
      totalValue,
      averageInterestRate,
      averageDepositAmount,
      largestDepositAmount,
      smallestDepositAmount,
    };
  }
}
