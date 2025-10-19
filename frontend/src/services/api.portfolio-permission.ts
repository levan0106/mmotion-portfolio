/**
 * Portfolio Permission API Service
 * Handles all portfolio permission related API calls
 */

import { apiService } from './api';
import { PortfolioPermissionType } from '../types';

export interface PortfolioPermission {
  permissionId: string;
  accountId: string;
  accountName: string;
  accountEmail: string;
  permissionType: PortfolioPermissionType;
  grantedBy: string;
  grantedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePortfolioPermissionDto {
  portfolioId: string;
  accountId: string;
  permissionType: PortfolioPermissionType;
}


export interface PortfolioPermissionStats {
  totalAccounts: number;
  ownerCount: number;
  updateCount: number;
  viewCount: number;
}

export interface PermissionCheckResponse {
  hasPermission: boolean;
}

export interface TransferOwnershipDto {
  newOwnerAccountId: string;
}

export interface AvailableAccount {
  accountId: string;
  name: string;
  email: string;
}

class PortfolioPermissionApiService {
  private baseUrl = '/api/v1/portfolios';

  /**
   * Create a new portfolio permission
   */
  async createPermission(data: CreatePortfolioPermissionDto, currentAccountId: string): Promise<PortfolioPermission> {
    return await apiService.post(`${this.baseUrl}/${data.portfolioId}/permissions?accountId=${currentAccountId}`, {
      accountId: data.accountId,
      permissionType: data.permissionType
    });
  }

  /**
   * Get all permissions for a portfolio
   */
  async getPortfolioPermissions(portfolioId: string, accountId: string): Promise<PortfolioPermission[]> {
    return await apiService.get(`${this.baseUrl}/${portfolioId}/permissions?accountId=${accountId}`);
  }

  /**
   * Get all portfolios accessible by current account
   */
  async getMyAccessiblePortfolios(): Promise<any[]> {
    // This is now handled by the main portfolios endpoint
    return await apiService.get(`${this.baseUrl}`);
  }


  /**
   * Delete a portfolio permission
   */
  async deletePermission(permissionId: string, portfolioId: string, currentAccountId: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/${portfolioId}/permissions/${permissionId}?accountId=${currentAccountId}`);
  }

  /**
   * Check if current account has permission for a portfolio
   */
  async checkPermission(
    portfolioId: string,
    action: 'view' | 'update' | 'delete' | 'manage_permissions'
  ): Promise<PermissionCheckResponse> {
    return await apiService.get(`${this.baseUrl}/${portfolioId}/permissions/check`, {
      params: { action }
    });
  }

  /**
   * Get permission statistics for a portfolio
   */
  async getPortfolioPermissionStats(portfolioId: string, accountId: string): Promise<PortfolioPermissionStats> {
    return await apiService.get(`${this.baseUrl}/${portfolioId}/permissions/stats?accountId=${accountId}`);
  }

  /**
   * Transfer portfolio ownership
   */
  async transferOwnership(
    portfolioId: string,
    data: TransferOwnershipDto
  ): Promise<void> {
    await apiService.post(`${this.baseUrl}/${portfolioId}/permissions/transfer-ownership`, data);
  }

  /**
   * Get available accounts for permission assignment
   */
  async getAvailableAccounts(accountId: string, search?: string): Promise<AvailableAccount[]> {
    return await apiService.get(`${this.baseUrl}/permissions/available-accounts?accountId=${accountId}`, {
      params: { search }
    });
  }
}

export const portfolioPermissionApi = new PortfolioPermissionApiService();
