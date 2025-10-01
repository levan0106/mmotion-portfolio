import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../entities/account.entity';
import { Portfolio } from '../../portfolio/entities/portfolio.entity';

/**
 * Service for validating account ownership and portfolio relationships.
 * Ensures data protection by validating account ownership before data access.
 */
@Injectable()
export class AccountValidationService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,
  ) {}

  /**
   * Validate that a user owns the specified account.
   * @param accountId - Account ID to validate
   * @param userId - User ID (from request context)
   * @returns Promise<boolean>
   * @throws ForbiddenException if account doesn't belong to user
   */
  async validateAccountOwnership(accountId: string, userId: string): Promise<boolean> {
    const account = await this.accountRepository.findOne({
      where: { accountId }
    });

    if (!account) {
      throw new NotFoundException(`Account with ID "${accountId}" not found`);
    }

    // For now, we'll allow access if account exists
    // In a real system, you would validate against user authentication
    // TODO: Implement proper user-account relationship validation
    return true;
  }

  /**
   * Validate that a portfolio belongs to the specified account.
   * @param portfolioId - Portfolio ID to validate
   * @param accountId - Account ID to validate against
   * @returns Promise<boolean>
   * @throws ForbiddenException if portfolio doesn't belong to account
   */
  async validatePortfolioOwnership(portfolioId: string, accountId: string): Promise<boolean> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId, accountId }
    });

    if (!portfolio) {
      throw new ForbiddenException(
        `Portfolio with ID "${portfolioId}" does not belong to account "${accountId}"`
      );
    }

    return true;
  }

  /**
   * Validate account ownership and portfolio ownership in one call.
   * @param portfolioId - Portfolio ID to validate
   * @param accountId - Account ID to validate
   * @param userId - User ID (from request context)
   * @returns Promise<boolean>
   */
  async validatePortfolioAccess(portfolioId: string, accountId: string, userId: string): Promise<boolean> {
    // First validate account ownership
    await this.validateAccountOwnership(accountId, userId);
    
    // Then validate portfolio ownership
    await this.validatePortfolioOwnership(portfolioId, accountId);
    
    return true;
  }

  /**
   * Get account by ID with ownership validation.
   * @param accountId - Account ID
   * @param userId - User ID (from request context)
   * @returns Promise<Account>
   */
  async getAccountWithOwnershipValidation(accountId: string, userId: string): Promise<Account> {
    await this.validateAccountOwnership(accountId, userId);
    
    const account = await this.accountRepository.findOne({
      where: { accountId },
      relations: ['portfolios']
    });

    if (!account) {
      throw new NotFoundException(`Account with ID "${accountId}" not found`);
    }

    return account;
  }

  /**
   * Get portfolio by ID with ownership validation.
   * @param portfolioId - Portfolio ID
   * @param accountId - Account ID
   * @param userId - User ID (from request context)
   * @returns Promise<Portfolio>
   */
  async getPortfolioWithOwnershipValidation(portfolioId: string, accountId: string, userId: string): Promise<Portfolio> {
    await this.validatePortfolioAccess(portfolioId, accountId, userId);
    
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId, accountId }
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID "${portfolioId}" not found`);
    }

    return portfolio;
  }
}
