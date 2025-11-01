import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../entities/account.entity';
import { CreateAccountDto } from '../dto/create-account.dto';
import { UpdateAccountDto } from '../dto/update-account.dto';

/**
 * Service for managing user accounts.
 * Handles account CRUD operations and validation.
 */
@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  /**
   * Create a new account.
   * @param createAccountDto - Account creation data
   * @param userId - User ID (optional, for backward compatibility)
   * @returns Promise<Account>
   */
  async createAccount(createAccountDto: CreateAccountDto, userId?: string): Promise<Account> {
    const { name, email, baseCurrency = 'VND', isInvestor = false } = createAccountDto;

    // Email is optional and can be shared across multiple accounts
    // No need to check for email uniqueness

    const account = this.accountRepository.create({
      name,
      email, // Can be null/undefined
      baseCurrency,
      isInvestor,
      userId, // Assign to the current user if provided
    });

    return await this.accountRepository.save(account);
  }

  /**
   * Get all accounts.
   * @returns Promise<Account[]>
   */
  async getAllAccounts(): Promise<Account[]> {
    return await this.accountRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get accounts by user ID.
   * Includes the demo account (accessible by all users).
   * @param userId - User ID
   * @returns Promise<Account[]>
   */
  async getAccountsByUserId(userId: string): Promise<Account[]> {
    // Get user's own accounts
    const userAccounts = await this.accountRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    // Get demo account (accessible by all users)
    const demoAccount = await this.accountRepository.findOne({
      where: { isDemoAccount: true },
    });

    // Combine user accounts with demo account (if exists)
    const accounts = [...userAccounts];
    if (demoAccount) {
      // Add demo account at the beginning
      accounts.unshift(demoAccount);
    }

    return accounts;
  }

  /**
   * Get account by ID.
   * @param accountId - Account ID
   * @returns Promise<Account>
   */
  async getAccountById(accountId: string): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: { accountId },
      relations: ['portfolios', 'investorHoldings'],
    });

    if (!account) {
      throw new NotFoundException(`Account with ID "${accountId}" not found`);
    }

    return account;
  }

  /**
   * Get account by ID for a specific user.
   * Allows access to demo account (accessible by all users).
   * @param accountId - Account ID
   * @param userId - User ID
   * @returns Promise<Account>
   */
  async getAccountByIdForUser(accountId: string, userId: string): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: { accountId },
      relations: ['portfolios', 'investorHoldings'],
    });

    if (!account) {
      throw new NotFoundException(`Account with ID "${accountId}" not found`);
    }

    // Allow access if:
    // 1. Account belongs to the user, OR
    // 2. Account is a demo account (accessible by all users)
    if (account.userId === userId || account.isDemoAccount) {
      return account;
    }

    throw new NotFoundException(`Account with ID "${accountId}" not found or you don't have access to it`);
  }

  /**
   * Update account.
   * @param accountId - Account ID
   * @param updateAccountDto - Account update data
   * @returns Promise<Account>
   */
  async updateAccount(accountId: string, updateAccountDto: UpdateAccountDto): Promise<Account> {
    const account = await this.getAccountById(accountId);

    // Email can be shared across multiple accounts
    // No need to check for email uniqueness

    Object.assign(account, updateAccountDto);
    return await this.accountRepository.save(account);
  }

  /**
   * Update account for a specific user.
   * @param accountId - Account ID
   * @param updateAccountDto - Account update data
   * @param userId - User ID
   * @returns Promise<Account>
   */
  async updateAccountForUser(accountId: string, updateAccountDto: UpdateAccountDto, userId: string): Promise<Account> {
    const account = await this.getAccountByIdForUser(accountId, userId);

    // Email can be shared across multiple accounts
    // No need to check for email uniqueness

    Object.assign(account, updateAccountDto);
    return await this.accountRepository.save(account);
  }

  /**
   * Delete account.
   * @param accountId - Account ID
   * @returns Promise<void>
   */
  async deleteAccount(accountId: string): Promise<void> {
    const account = await this.getAccountById(accountId);

    // Check if this is a main account (cannot be deleted)
    if (account.isMainAccount) {
      throw new BadRequestException(
        `Cannot delete main account. Main accounts are protected and cannot be deleted.`,
      );
    }

    // Check if account has portfolios
    if (account.portfolios && account.portfolios.length > 0) {
      throw new BadRequestException(
        `Cannot delete account with existing portfolios. Please delete all portfolios first.`,
      );
    }

    await this.accountRepository.remove(account);
  }

  /**
   * Delete account for a specific user.
   * @param accountId - Account ID
   * @param userId - User ID
   * @returns Promise<void>
   */
  async deleteAccountForUser(accountId: string, userId: string): Promise<void> {
    const account = await this.getAccountByIdForUser(accountId, userId);

    // Check if this is a main account (cannot be deleted)
    if (account.isMainAccount) {
      throw new BadRequestException(
        `Cannot delete main account. Main accounts are protected and cannot be deleted.`,
      );
    }

    // Check if account has portfolios
    if (account.portfolios && account.portfolios.length > 0) {
      throw new BadRequestException(
        `Cannot delete account with existing portfolios. Please delete all portfolios first.`,
      );
    }

    await this.accountRepository.remove(account);
  }

  /**
   * Get account statistics.
   * @param accountId - Account ID
   * @returns Promise<object>
   */
  async getAccountStats(accountId: string): Promise<{
    totalPortfolios: number;
    totalValue: number;
    totalInvestors: number;
    isInvestor: boolean;
  }> {
    const account = await this.getAccountById(accountId);

    const totalPortfolios = account.portfolios?.length || 0;
    const totalValue = account.portfolios?.reduce((sum, portfolio) => 
      sum + (portfolio.totalValue || 0), 0) || 0;
    const totalInvestors = account.investorHoldings?.length || 0;

    return {
      totalPortfolios,
      totalValue,
      totalInvestors,
      isInvestor: account.isInvestor,
    };
  }

  /**
   * Get account statistics for a specific user.
   * @param accountId - Account ID
   * @param userId - User ID
   * @returns Promise<object>
   */
  async getAccountStatsForUser(accountId: string, userId: string): Promise<{
    totalPortfolios: number;
    totalValue: number;
    totalInvestors: number;
    isInvestor: boolean;
  }> {
    const account = await this.getAccountByIdForUser(accountId, userId);

    const totalPortfolios = account.portfolios?.length || 0;
    const totalValue = account.portfolios?.reduce((sum, portfolio) => 
      sum + (portfolio.totalValue || 0), 0) || 0;
    const totalInvestors = account.investorHoldings?.length || 0;

    return {
      totalPortfolios,
      totalValue,
      totalInvestors,
      isInvestor: account.isInvestor,
    };
  }

  /**
   * Get demo account status
   * @returns Promise with demo account information and enabled status
   */
  async getDemoAccountStatus(): Promise<{
    enabled: boolean;
    accountId?: string;
    accountName?: string;
  }> {
    const demoAccount = await this.accountRepository.findOne({
      where: { isDemoAccount: true },
    });

    return {
      enabled: !!demoAccount,
      accountId: demoAccount?.accountId,
      accountName: demoAccount?.name,
    };
  }

  /**
   * Toggle demo account status (enable/disable)
   * @param enabled - Whether to enable or disable demo account
   * @returns Promise with demo account information and enabled status
   */
  async toggleDemoAccount(enabled: boolean): Promise<{
    enabled: boolean;
    accountId?: string;
    accountName?: string;
  }> {
    const demoAccountId = 'ffffffff-ffff-4fff-bfff-ffffffffffff';
    
    if (enabled) {
      // Enable demo account - create or update account to be demo account
      let demoAccount = await this.accountRepository.findOne({
        where: { accountId: demoAccountId },
      });

      if (!demoAccount) {
        // Create new demo account
        demoAccount = this.accountRepository.create({
          accountId: demoAccountId,
          name: 'Demo Account',
          email: 'demo@mmotion.com',
          baseCurrency: 'VND',
          isInvestor: false,
          isDemoAccount: true,
        });
      } else {
        // Update existing account to be demo account
        demoAccount.isDemoAccount = true;
      }

      await this.accountRepository.save(demoAccount);

      return {
        enabled: true,
        accountId: demoAccount.accountId,
        accountName: demoAccount.name,
      };
    } else {
      // Disable demo account - remove demo account flag
      const demoAccount = await this.accountRepository.findOne({
        where: { isDemoAccount: true },
      });

      if (demoAccount) {
        demoAccount.isDemoAccount = false;
        await this.accountRepository.save(demoAccount);
      }

      return {
        enabled: false,
      };
    }
  }
}

