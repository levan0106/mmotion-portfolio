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
   * @param portfolioAccountId Optional: portfolio accountId if already known (to avoid expensive query)
   * @returns PermissionResult with access level and permissions
   */
  async checkPortfolioPermission(
    portfolioId: string,
    accountId: string,
    context: 'investor' | 'dashboard' | 'portfolios' | 'api' = 'api',
    portfolioAccountId?: string
  ): Promise<PermissionResult> {
    try {
      // Get portfolio accountId (use provided value or query from database)
      let ownerAccountId = portfolioAccountId;
      if (!ownerAccountId) {
        // Only query accountId, not full portfolio details (much faster)
        const portfolio = await this.portfolioService.getPortfolioAccountId(portfolioId);
        if (!portfolio) {
          return {
            hasAccess: false,
            accessLevel: AccessLevel.VIEW_ONLY,
            isOwner: false
          };
        }
        ownerAccountId = portfolio.accountId;
      }

      const isOwner = ownerAccountId === accountId;
      
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
        isOwner: permission.permissionType === 'OWNER',
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
   * Optimized to batch query accountIds and permissions
   */
  async checkMultiplePortfolioPermissions(
    portfolioIds: string[],
    accountId: string,
    context: 'investor' | 'dashboard' | 'portfolios' | 'api' = 'api',
    portfolioAccountIds?: Map<string, string> // Optional: map of portfolioId -> accountId to avoid queries
  ): Promise<{ [portfolioId: string]: PermissionResult }> {
    const results: { [portfolioId: string]: PermissionResult } = {};
    
    if (portfolioIds.length === 0) {
      return results;
    }

    // Batch query portfolio accountIds if not provided
    let accountIdMap = portfolioAccountIds;
    if (!accountIdMap) {
      const portfolioAccountIdList = await this.portfolioService.getPortfolioAccountIds(portfolioIds);
      accountIdMap = new Map(portfolioAccountIdList.map(p => [p.portfolioId, p.accountId]));
    }

    // Batch query all permissions at once
    const permissions = await this.portfolioPermissionService.getAccountPermissionsForPortfolios(portfolioIds, accountId);
    const permissionMap = new Map(permissions.map(p => [p.portfolioId, p]));

    // Build results using batch-queried data
    for (const portfolioId of portfolioIds) {
      const ownerAccountId = accountIdMap.get(portfolioId);
      if (!ownerAccountId) {
        results[portfolioId] = {
          hasAccess: false,
          accessLevel: AccessLevel.VIEW_ONLY,
          isOwner: false
        };
        continue;
      }

      const isOwner = ownerAccountId === accountId;
      
      if (isOwner) {
        results[portfolioId] = {
          hasAccess: true,
          accessLevel: AccessLevel.FULL_ACCESS,
          isOwner: true,
          permissionType: 'OWNER'
        };
        continue;
      }

      const permission = permissionMap.get(portfolioId);
      if (!permission) {
        results[portfolioId] = {
          hasAccess: false,
          accessLevel: AccessLevel.VIEW_ONLY,
          isOwner: false
        };
        continue;
      }

      const hasAccess = this.determineAccess(permission.permissionType, context);
      const accessLevel = this.getAccessLevel(permission.permissionType, context);

      results[portfolioId] = {
        hasAccess,
        accessLevel,
        isOwner: permission.permissionType === 'OWNER',
        permissionType: permission.permissionType
      };
    }

    return results;
  }

  /**
   * Get all accessible portfolios for an account with permission details
   * Optimized to use portfolio data already loaded instead of re-querying
   */
  async getAccessiblePortfoliosWithPermissions(
    accountId: string,
    context: 'investor' | 'dashboard' | 'portfolios' | 'api' = 'api'
  ) {
    // Get all accessible portfolios (already includes real-time calculations)
    const portfolios = await this.portfolioService.getAccessiblePortfoliosByAccount(accountId);
    
    if (portfolios.length === 0) {
      return {
        portfolios: [],
        permissions: {}
      };
    }
    
    // Build accountId map from portfolios (already loaded, no need to query)
    const portfolioAccountIdMap = new Map(
      portfolios.map(p => [p.portfolioId, p.accountId])
    );
    
    // Check permissions for each portfolio (optimized with batch queries)
    const portfolioIds = portfolios.map(p => p.portfolioId);
    const permissions = await this.checkMultiplePortfolioPermissions(
      portfolioIds, 
      accountId, 
      context,
      portfolioAccountIdMap // Pass accountIds to avoid re-querying
    );
    
    // Filter portfolios based on access and add userPermission field
    const accessiblePortfolios = portfolios
      .filter(portfolio => {
        const permission = permissions[portfolio.portfolioId];
        return permission.hasAccess;
      })
      .map(portfolio => {
        const permission = permissions[portfolio.portfolioId];
        return {
          ...portfolio,
          userPermission: {
            permissionType: permission.permissionType,
            isOwner: permission.isOwner,
            accessLevel: permission.accessLevel,
            canView: true,
            canUpdate: permission.permissionType === 'OWNER' || permission.permissionType === 'UPDATE',
            canDelete: permission.isOwner,
            canManagePermissions: permission.isOwner
          }
        };
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
