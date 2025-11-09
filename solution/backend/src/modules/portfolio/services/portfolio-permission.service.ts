import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PortfolioPermission, PortfolioPermissionType } from '../entities/portfolio-permission.entity';
import { Portfolio } from '../entities/portfolio.entity';
import { Account } from '../../shared/entities/account.entity';

export interface CreatePortfolioPermissionDto {
  portfolioId: string;
  accountId: string;
  permissionType: PortfolioPermissionType;
  grantedBy: string;
}


export interface PortfolioPermissionWithAccount {
  permissionId: string;
  accountId: string;
  accountName: string;
  accountEmail: string;
  permissionType: PortfolioPermissionType;
  grantedBy: string;
  grantedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PortfolioPermissionService {
  constructor(
    @InjectRepository(PortfolioPermission)
    private portfolioPermissionRepository: Repository<PortfolioPermission>,
    @InjectRepository(Portfolio)
    private portfolioRepository: Repository<Portfolio>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}

  /**
   * Create a new portfolio permission
   */
  async createPermission(createDto: CreatePortfolioPermissionDto): Promise<PortfolioPermission> {
    const { portfolioId, accountId, permissionType, grantedBy } = createDto;

    // Check if portfolio exists
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId },
    });
    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    // Check if account exists
    const account = await this.accountRepository.findOne({
      where: { accountId },
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Nếu permission type là CREATOR, chỉ update accountId của portfolio
    if (permissionType === PortfolioPermissionType.CREATOR && portfolio.accountId === grantedBy) {
      // Update accountId trong bảng portfolio
      await this.portfolioRepository.update(
        { portfolioId },
        { accountId: accountId }
      );
    
      // Return success message thay vì tạo permission
      return {
        message: 'Portfolio ownership transferred successfully',
        portfolioId,
        newOwnerId: accountId
      } as any;
    }

    // Nếu không phải CREATOR hoặc là owner tự grant, báo lỗi
    if (permissionType === PortfolioPermissionType.CREATOR) {
      throw new BadRequestException('Cannot transfer ownership to yourself');
    }

    // Check if permission already exists
    const existingPermission = await this.portfolioPermissionRepository.findOne({
      where: { portfolioId, accountId },
    });
    if (existingPermission) {
      throw new BadRequestException('Permission already exists for this account');
    }

    const portfolioOwnerPermission =  await this.portfolioPermissionRepository.findOne({
      where: { 
        portfolioId, 
        accountId: grantedBy,
        permissionType: PortfolioPermissionType.OWNER
      }
    });

    // Only owner or owner's permission can grant permissions
    if (portfolio.accountId !== grantedBy && !portfolioOwnerPermission) {
      throw new ForbiddenException('Only the portfolio owner can grant permissions');
    }

    // Owner cannot grant permission to themselves
    if (portfolio.accountId === accountId || grantedBy === accountId) {
      throw new BadRequestException('Account already has full access to the portfolio');
    }

    // Create new permission
    const permission = this.portfolioPermissionRepository.create({
      portfolioId,
      accountId,
      permissionType,
      grantedBy,
      grantedAt: new Date(),
    });

    return await this.portfolioPermissionRepository.save(permission);
  }

  /**
   * Get all permissions for a portfolio (excluding owner permissions)
   */
  async getPortfolioPermissions(portfolioId: string): Promise<PortfolioPermissionWithAccount[]> {
    // Get portfolio to find owner
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId },
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    const permissions = await this.portfolioPermissionRepository
      .createQueryBuilder('permission')
      .leftJoinAndSelect('permission.account', 'account')
      .leftJoinAndSelect('permission.grantedByAccount', 'grantedByAccount')
      .where('permission.portfolioId = :portfolioId', { portfolioId })
      .orderBy('permission.createdAt', 'ASC')
      .getMany();

    // Map non-owner permissions
    const nonOwnerPermissions = permissions.map(permission => ({
      permissionId: permission.permissionId,
      accountId: permission.accountId,
      accountName: permission.account.name,
      accountEmail: permission.account.email,
      permissionType: permission.permissionType,
      grantedBy: permission.grantedBy,
      grantedAt: permission.grantedAt,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    }));

    // Get owner account info
    const ownerAccount = await this.accountRepository.findOne({
        where: { accountId: portfolio.accountId },
      });
  
    // Add owner permission at the beginning
    const ownerPermission = {
      permissionId: `${portfolio.portfolioId}`,
      accountId: portfolio.accountId,
      accountName: ownerAccount?.name || 'Unknown',
      accountEmail: ownerAccount?.email || 'Unknown',
      permissionType: PortfolioPermissionType.OWNER,
      grantedBy: portfolio.accountId,
      grantedAt: portfolio.createdAt,
      createdAt: portfolio.createdAt,
      updatedAt: portfolio.updatedAt,
    };

    return [ownerPermission, ...nonOwnerPermissions];
  }

  /**
   * Get all portfolios accessible by an account
   */
  async getAccountAccessiblePortfolios(accountId: string): Promise<Portfolio[]> {
    const permissions = await this.portfolioPermissionRepository
      .createQueryBuilder('permission')
      .leftJoinAndSelect('permission.portfolio', 'portfolio')
      .leftJoinAndSelect('portfolio.account', 'account')
      .where('permission.accountId = :accountId', { accountId })
      .getMany();

    return permissions.map(permission => permission.portfolio);
  }


  /**
   * Delete a portfolio permission
   */
  async deletePermission(permissionId: string, requesterAccountId: string): Promise<void> {
    const permission = await this.portfolioPermissionRepository.findOne({
      where: { permissionId },
      relations: ['portfolio'],
    });

    if (!permission) {
      throw new NotFoundException('Portfolio permission not found. You are trying to delete a permission that does not exist.');
    }

    // Only owner can manage permissions
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId: permission.portfolioId },
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio not found. You are trying to delete a permission that does not exist.');
    }

    const portfolioOwnerPermission =  await this.portfolioPermissionRepository.findOne({
      where: { 
        portfolioId: permission.portfolioId, 
        accountId: requesterAccountId,
        permissionType: PortfolioPermissionType.OWNER
      }
    });

    // only owner or owner's permission can delete permission
    if (portfolio.accountId !== requesterAccountId && !portfolioOwnerPermission) {
      throw new ForbiddenException('Only the portfolio owner can manage permissions');
    }

    // Cannot delete owner permission
    if (permission.accountId === requesterAccountId) {
      throw new BadRequestException('You cannot delete your own permission');
    }

    await this.portfolioPermissionRepository.remove(permission);
  }

  /**
   * Get account's permission level for a specific portfolio
   */
  async getAccountPermissionForPortfolio(
    portfolioId: string,
    accountId: string,
  ): Promise<PortfolioPermission | null> {
    return await this.portfolioPermissionRepository.findOne({
      where: { portfolioId, accountId },
    });
  }

  /**
   * Check if account has permission to perform action on portfolio
   * Allows access to portfolios owned by demo account (accessible by all users).
   */
  async checkPortfolioPermission(
    portfolioId: string,
    accountId: string,
    action: 'view' | 'update' | 'delete' | 'manage_permissions',
  ): Promise<boolean> {
    // First check if account is the owner
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId },
      relations: ['account'],
    });

    if (!portfolio) {
      return false;
    }

    // Check if portfolio belongs to demo account (accessible by all users for view only)
    if (portfolio.account?.isDemoAccount) {
      // Demo account portfolios: allow view access to all users
      // But restrict update/delete/manage_permissions to demo account only
      if (action === 'view') {
        return true;
      }
      // For other actions, only demo account itself can perform
      return portfolio.accountId === accountId;
    }

    // If account is the owner, they have all permissions
    if (portfolio.accountId === accountId) {
      return true;
    }

    // Check if account has permission record
    const permission = await this.getAccountPermissionForPortfolio(portfolioId, accountId);

    if (!permission) {
      return false;
    }

    switch (action) {
      case 'view':
        return permission.canView();
      case 'update':
        return permission.canUpdate();
      case 'delete':
        return permission.canDelete();
      case 'manage_permissions':
        return permission.canManagePermissions();
      default:
        return false;
    }
  }

  /**
   * Get permission statistics for a portfolio
   */
  async getPortfolioPermissionStats(portfolioId: string): Promise<{
    totalAccounts: number;
    ownerCount: number;
    updateCount: number;
    viewCount: number;
  }> {
    const permissions = await this.portfolioPermissionRepository.find({
      where: { portfolioId },
    });

    const stats = {
      totalAccounts: permissions.length,
      ownerCount: 0,
      updateCount: 0,
      viewCount: 0,
    };

    permissions.forEach(permission => {
      switch (permission.permissionType) {
        case PortfolioPermissionType.CREATOR:
        case PortfolioPermissionType.OWNER:
          stats.ownerCount++;
          break;
        case PortfolioPermissionType.UPDATE:
          stats.updateCount++;
          break;
        case PortfolioPermissionType.VIEW:
          stats.viewCount++;
          break;
      }
    });

    return stats;
  }

  /**
   * Transfer portfolio ownership
   */
  async transferOwnership(
    portfolioId: string,
    newOwnerAccountId: string,
    currentOwnerAccountId: string,
  ): Promise<void> {
    // Check if current user is owner or creator
    const currentOwnerPermission = await this.getAccountPermissionForPortfolio(
      portfolioId,
      currentOwnerAccountId,
    );

    if (!currentOwnerPermission || currentOwnerPermission.permissionType !== PortfolioPermissionType.OWNER) {
      throw new ForbiddenException('Only the current owner can transfer ownership');
    }

    // Check if new owner exists
    const newOwner = await this.accountRepository.findOne({
      where: { accountId: newOwnerAccountId },
    });
    if (!newOwner) {
      throw new NotFoundException('New owner account not found');
    }

    // Get or create permission for new owner
    let newOwnerPermission = await this.getAccountPermissionForPortfolio(portfolioId, newOwnerAccountId);
    
    if (!newOwnerPermission) {
      newOwnerPermission = this.portfolioPermissionRepository.create({
        portfolioId,
        accountId: newOwnerAccountId,
        permissionType: PortfolioPermissionType.OWNER,
        grantedBy: currentOwnerAccountId,
        grantedAt: new Date(),
      });
    } else {
      newOwnerPermission.permissionType = PortfolioPermissionType.OWNER;
      newOwnerPermission.grantedBy = currentOwnerAccountId;
    }

    // Update current owner to UPDATE permission
    currentOwnerPermission.permissionType = PortfolioPermissionType.UPDATE;
    currentOwnerPermission.grantedBy = newOwnerAccountId;

    await this.portfolioPermissionRepository.save([newOwnerPermission, currentOwnerPermission]);
  }

  /**
   * Get available accounts for permission assignment
   */
  async getAvailableAccounts(search?: string): Promise<any[]> {
    // This is a placeholder implementation
    // In a real application, you would query accounts that are not already assigned to the portfolio
    // For now, return a mock response
    return [
      {
        accountId: 'mock-account-1',
        name: 'John Doe',
        email: 'john@example.com'
      },
      {
        accountId: 'mock-account-2', 
        name: 'Jane Smith',
        email: 'jane@example.com'
      }
    ];
  }
}
