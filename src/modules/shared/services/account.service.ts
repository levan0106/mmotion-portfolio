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
   * @returns Promise<Account>
   */
  async createAccount(createAccountDto: CreateAccountDto): Promise<Account> {
    const { name, email, baseCurrency = 'VND', isInvestor = false } = createAccountDto;

    // Check if account with same email already exists
    const existingAccount = await this.accountRepository.findOne({
      where: { email },
    });

    if (existingAccount) {
      throw new BadRequestException(
        `Account with email "${email}" already exists`,
      );
    }

    const account = this.accountRepository.create({
      name,
      email,
      baseCurrency,
      isInvestor,
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
   * @param userId - User ID
   * @returns Promise<Account[]>
   */
  async getAccountsByUserId(userId: string): Promise<Account[]> {
    return await this.accountRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
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
   * @param accountId - Account ID
   * @param userId - User ID
   * @returns Promise<Account>
   */
  async getAccountByIdForUser(accountId: string, userId: string): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: { accountId, userId },
      relations: ['portfolios', 'investorHoldings'],
    });

    if (!account) {
      throw new NotFoundException(`Account with ID "${accountId}" not found or you don't have access to it`);
    }

    return account;
  }

  /**
   * Update account.
   * @param accountId - Account ID
   * @param updateAccountDto - Account update data
   * @returns Promise<Account>
   */
  async updateAccount(accountId: string, updateAccountDto: UpdateAccountDto): Promise<Account> {
    const account = await this.getAccountById(accountId);

    // Check if email is being changed and if it already exists
    if (updateAccountDto.email && updateAccountDto.email !== account.email) {
      const existingAccount = await this.accountRepository.findOne({
        where: { email: updateAccountDto.email },
      });

      if (existingAccount) {
        throw new BadRequestException(
          `Account with email "${updateAccountDto.email}" already exists`,
        );
      }
    }

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

    // Check if email is being changed and if it already exists
    if (updateAccountDto.email && updateAccountDto.email !== account.email) {
      const existingAccount = await this.accountRepository.findOne({
        where: { email: updateAccountDto.email },
      });

      if (existingAccount) {
        throw new BadRequestException(
          `Account with email "${updateAccountDto.email}" already exists`,
        );
      }
    }

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
}

