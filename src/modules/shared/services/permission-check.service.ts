import { Injectable } from '@nestjs/common';
import { PortfolioPermissionService } from '../../portfolio/services/portfolio-permission.service';
import { PortfolioService } from '../../portfolio/services/portfolio.service';

export enum AccessLevel {
  VIEW_ONLY = 'VIEW_ONLY',      // Chỉ được xem qua /investor
  FULL_ACCESS = 'FULL_ACCESS'   // Có toàn quyền xem ở tất cả pages
}

export interface PermissionResult {
  hasAccess: boolean;
  accessLevel: AccessLevel;
  isOwner: boolean;
  permissionType?: string;
}

@Injectable()
export class PermissionCheckService {
  constructor(
    private readonly portfolioPermissionService: PortfolioPermissionService,
    private readonly portfolioService: PortfolioService,
  ) {}

  /**
   * Check permission for a specific portfolio and account
   * @param portfolioId Portfolio ID
   * @param accountId Account ID
   * @param context Context of the request (e.g., 'investor', 'dashboard', 'portfolios')
   * @returns PermissionResult with access level and permissions
   */
  async checkPortfolioPermission(
    portfolioId: string,
    accountId: string,
    context: 'investor' | 'dashboard' | 'portfolios' | 'api' = 'api'
  ): Promise<PermissionResult> {
    try {
      // First check if account is the owner
      const portfolio = await this.portfolioService.getPortfolioDetails(portfolioId);
      if (!portfolio) {
        return {
          hasAccess: false,
          accessLevel: AccessLevel.VIEW_ONLY,
          isOwner: false
        };
      }

      const isOwner = portfolio.accountId === accountId;
      
      if (isOwner) {
        return {
          hasAccess: true,
          accessLevel: AccessLevel.FULL_ACCESS,
          isOwner: true,
          permissionType: 'OWNER'
        };
      }

      // Check for explicit permission
      const permission = await this.portfolioPermissionService.getAccountPermissionForPortfolio(portfolioId, accountId);
      
      if (!permission) {
        return {
          hasAccess: false,
          accessLevel: AccessLevel.VIEW_ONLY,
          isOwner: false
        };
      }

      // Determine access level based on permission type and context
      const hasAccess = this.determineAccess(permission.permissionType, context);
      const accessLevel = this.getAccessLevel(permission.permissionType, context);

      return {
        hasAccess,
        accessLevel,
        isOwner: false,
        permissionType: permission.permissionType
      };

    } catch (error) {
      return {
        hasAccess: false,
        accessLevel: AccessLevel.VIEW_ONLY,
        isOwner: false
      };
    }
  }

  /**
   * Check if account has access to multiple portfolios
   */
  async checkMultiplePortfolioPermissions(
    portfolioIds: string[],
    accountId: string,
    context: 'investor' | 'dashboard' | 'portfolios' | 'api' = 'api'
  ): Promise<{ [portfolioId: string]: PermissionResult }> {
    const results: { [portfolioId: string]: PermissionResult } = {};
    
    await Promise.all(
      portfolioIds.map(async (portfolioId) => {
        results[portfolioId] = await this.checkPortfolioPermission(portfolioId, accountId, context);
      })
    );

    return results;
  }

  /**
   * Get all accessible portfolios for an account with permission details
   */
  async getAccessiblePortfoliosWithPermissions(
    accountId: string,
    context: 'investor' | 'dashboard' | 'portfolios' | 'api' = 'api'
  ) {
    // Get all accessible portfolios
    const portfolios = await this.portfolioService.getAccessiblePortfoliosByAccount(accountId);
    
    // Check permissions for each portfolio
    const portfolioIds = portfolios.map(p => p.portfolioId);
    const permissions = await this.checkMultiplePortfolioPermissions(portfolioIds, accountId, context);
    
    // Filter portfolios based on access
    const accessiblePortfolios = portfolios.filter(portfolio => {
      const permission = permissions[portfolio.portfolioId];
      return permission.hasAccess;
    });

    return {
      portfolios: accessiblePortfolios,
      permissions
    };
  }

  /**
   * Determine if permission type allows access in given context
   */
  private determineAccess(permissionType: string, context: string): boolean {
    switch (permissionType) {
      case 'OWNER':
      case 'UPDATE':
        return true; // Full access everywhere
      
      case 'VIEW':
        return context === 'investor'; // Only access through investor view
      
      default:
        return false;
    }
  }

  /**
   * Get access level based on permission type and context
   */
  private getAccessLevel(permissionType: string, context: string): AccessLevel {
    switch (permissionType) {
      case 'OWNER':
      case 'UPDATE':
        return AccessLevel.FULL_ACCESS;
      
      case 'VIEW':
        return context === 'investor' ? AccessLevel.VIEW_ONLY : AccessLevel.VIEW_ONLY;
      
      default:
        return AccessLevel.VIEW_ONLY;
    }
  }

  /**
   * Check if account can perform specific action on portfolio
   */
  async canPerformAction(
    portfolioId: string,
    accountId: string,
    action: 'view' | 'update' | 'delete' | 'manage_permissions',
    context: 'investor' | 'dashboard' | 'portfolios' | 'api' = 'api'
  ): Promise<boolean> {
    const permission = await this.checkPortfolioPermission(portfolioId, accountId, context);
    
    if (!permission.hasAccess) {
      return false;
    }

    // For VIEW permission, only allow 'view' action and only in investor context
    if (permission.permissionType === 'VIEW') {
      return action === 'view' && context === 'investor';
    }

    // For UPDATE and OWNER, allow all actions
    return ['UPDATE', 'OWNER'].includes(permission.permissionType);
  }
}
