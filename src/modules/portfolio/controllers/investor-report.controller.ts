import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PortfolioService } from '../services/portfolio.service';
import { PositionManagerService } from '../services/position-manager.service';
import { PortfolioAnalyticsService } from '../services/portfolio-analytics.service';
import { DepositService } from '../services/deposit.service';
import { PerformanceSnapshotService } from '../services/performance-snapshot.service';
import { PermissionCheckService } from '../../shared/services/permission-check.service';
import { AccountService } from '../../shared/services/account.service';

/**
 * Controller for Investor Report - provides fund asset reports for investors
 */
@ApiTags('Investor Reports')
@Controller('api/v1/investor-report')
export class InvestorReportController {
  private readonly logger = new Logger(InvestorReportController.name);

  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly positionManagerService: PositionManagerService,
    private readonly portfolioAnalyticsService: PortfolioAnalyticsService,
    private readonly depositService: DepositService,
    private readonly performanceSnapshotService: PerformanceSnapshotService,
    private readonly permissionCheckService: PermissionCheckService,
    private readonly accountService: AccountService,
  ) {}

  /**
   * Get all portfolios with investor report data for investor view
   */
  @Get('portfolios')
  @ApiOperation({ 
    summary: 'Get all portfolios with investor report data',
    description: 'Returns all portfolios for an account with their investor report summary data for the investor view page.'
  })
  @ApiQuery({ name: 'accountId', description: 'Account ID', required: true })
  @ApiResponse({ 
    status: 200, 
    description: 'Portfolios with investor data retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          portfolio: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              totalValue: { type: 'number' },
              cashBalance: { type: 'number' },
              assetValue: { type: 'number' },
              depositsValue: { type: 'number' },
              lastUpdated: { type: 'string' }
            }
          },
          performance: {
            type: 'object',
            properties: {
              dailyGrowth: { type: 'number' },
              monthlyGrowth: { type: 'number' },
              ytdGrowth: { type: 'number' }
            }
          }
        }
      }
    }
  })
  async getInvestorPortfolios(
    @Query('accountId') accountId: string,
  ) {
    try {
      this.logger.log(`Fetching investor portfolios for account ${accountId}`);
      
      // Get all accessible portfolios for the account with permission filtering for 'investor' context
      const { portfolios, permissions } = await this.permissionCheckService.getAccessiblePortfoliosWithPermissions(
        accountId, 
        'investor'
      );
      
      // Get investor report data for each portfolio
      const portfoliosWithReports = await Promise.all(
        portfolios.map(async (portfolio) => {
          try {
            const reportData = await this.getInvestorReportData(portfolio.portfolioId, accountId);
            // Get permission info for this portfolio
            const permission = permissions[portfolio.portfolioId];
            
            // Get owner account information
            let ownerInfo = null;
            try {
              const ownerAccount = await this.accountService.getAccountById(portfolio.accountId);
              ownerInfo = {
                accountId: ownerAccount.accountId,
                name: ownerAccount.name,
                email: ownerAccount.email,
              };
            } catch (error) {
              this.logger.warn(`Failed to get owner info for portfolio ${portfolio.portfolioId}: ${error.message}`);
            }
            
            return {
              portfolio: {
                id: portfolio.portfolioId,
                name: portfolio.name,
                totalValue: reportData.portfolio.totalValue,
                cashBalance: reportData.portfolio.cashBalance,
                assetValue: reportData.portfolio.assetValue,
                depositsValue: reportData.portfolio.depositsValue,
                lastUpdated: reportData.portfolio.lastUpdated,
                owner: ownerInfo,
              },
              performance: reportData.performance,
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
          } catch (error) {
            this.logger.warn(`Failed to get report for portfolio ${portfolio.portfolioId}: ${error.message}`);
            
            // Get owner account information even for failed portfolios
            let ownerInfo = null;
            try {
              const ownerAccount = await this.accountService.getAccountById(portfolio.accountId);
              ownerInfo = {
                accountId: ownerAccount.accountId,
                name: ownerAccount.name,
                email: ownerAccount.email,
              };
            } catch (ownerError) {
              this.logger.warn(`Failed to get owner info for portfolio ${portfolio.portfolioId}: ${ownerError.message}`);
            }
            
            return {
              portfolio: {
                id: portfolio.portfolioId,
                name: portfolio.name,
                totalValue: 0,
                cashBalance: 0,
                assetValue: 0,
                depositsValue: 0,
                lastUpdated: new Date().toISOString(),
                owner: ownerInfo,
              },
              performance: {
                dailyGrowth: 0,
                monthlyGrowth: 0,
                ytdGrowth: 0,
              },
            };
          }
        })
      );

      this.logger.log(`Successfully retrieved ${portfoliosWithReports.length} portfolios with investor data`);
      return portfoliosWithReports;
    } catch (error) {
      this.logger.error(`Error fetching investor portfolios for account ${accountId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get comprehensive investor report with all calculated data
   */
  @Get(':id')
  @ApiOperation({ 
    summary: 'Get comprehensive investor report with all calculated data',
    description: 'Returns a complete investor report with all data pre-calculated including asset allocation, deposits, cash flow, and performance metrics.'
  })
  @ApiParam({ name: 'id', description: 'Portfolio ID' })
  @ApiQuery({ name: 'accountId', required: true, description: 'Account ID for access validation' })
  @ApiResponse({ 
    status: 200, 
    description: 'Comprehensive investor report retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        portfolio: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            totalValue: { type: 'number' },
            cashBalance: { type: 'number' },
            assetValue: { type: 'number' },
            depositsValue: { type: 'number' },
            lastUpdated: { type: 'string' }
          }
        },
        summary: {
          type: 'object',
          properties: {
            totalAssets: { type: 'number' },
            totalCash: { type: 'number' },
            totalValue: { type: 'number' },
            cashPercentage: { type: 'number' },
            assetPercentage: { type: 'number' },
            depositsPercentage: { type: 'number' }
          }
        },
        assetAllocation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              assetType: { type: 'string' },
              percentage: { type: 'number' },
              value: { type: 'number' },
              count: { type: 'number' }
            }
          }
        },
        assetDetails: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              symbol: { type: 'string' },
              name: { type: 'string' },
              assetType: { type: 'string' },
              quantity: { type: 'number' },
              currentPrice: { type: 'number' },
              currentValue: { type: 'number' },
              percentage: { type: 'number' },
              unrealizedPl: { type: 'number' }
            }
          }
        },
        deposits: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              depositId: { type: 'string' },
              bankName: { type: 'string' },
              accountNumber: { type: 'string' },
              principal: { type: 'number' },
              interestRate: { type: 'number' },
              totalValue: { type: 'number' },
              status: { type: 'string' },
              startDate: { type: 'string' },
              endDate: { type: 'string' }
            }
          }
        },
        performance: {
          type: 'object',
          properties: {
            totalReturn: { type: 'number' },
            totalReturnPercentage: { type: 'number' },
            unrealizedPl: { type: 'number' },
            realizedPl: { type: 'number' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Portfolio not found' })
  @ApiResponse({ status: 403, description: 'Access denied - insufficient permissions' })
  async getInvestorReport(
    @Param('id', ParseUUIDPipe) portfolioId: string,
    @Query('accountId') accountId: string,
  ): Promise<any> {
    if (!accountId) {
      throw new Error('accountId query parameter is required');
    }

    try {
      const comprehensiveReport = await this.getComprehensiveInvestorReportData(portfolioId, accountId);
      return comprehensiveReport;
    } catch (error) {
      this.logger.error(`Error generating comprehensive investor report for portfolio ${portfolioId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get comprehensive investor report data for a specific portfolio (common method)
   */
  private async getComprehensiveInvestorReportData(portfolioId: string, accountId: string) {
    // Get portfolio details
    const portfolio = await this.portfolioService.getPortfolioDetails(portfolioId);
    if (!portfolio) {
      throw new Error(`Portfolio ${portfolioId} not found`);
    }

    // Get positions and calculate values
    const positions = await this.positionManagerService.getCurrentPositions(portfolioId);
    const cashBalance = typeof portfolio.cashBalance === 'string' ? parseFloat(portfolio.cashBalance) : (portfolio.cashBalance || 0);
    const assetValue = positions.reduce((sum, position) => {
      const currentValue = typeof position.currentValue === 'string' ? parseFloat(position.currentValue) : (position.currentValue || 0);
      return sum + currentValue;
    }, 0);
    
    // Get active deposits only
    const deposits = await this.depositService.getActiveDepositsByPortfolioId(portfolioId);
    const depositsValue = deposits.reduce((sum, deposit) => {
      const totalValue = typeof deposit.totalValue === 'string' ? parseFloat(deposit.totalValue) : (deposit.totalValue || 0);
      return sum + totalValue;
    }, 0);
    
    const totalValue = Number(cashBalance) + Number(assetValue) + Number(depositsValue);
    
    const cashPercentage = totalValue > 0 ? Number(((cashBalance / totalValue) * 100).toFixed(2)) : 0;
    const assetPercentage = totalValue > 0 ? Number(((assetValue / totalValue) * 100).toFixed(2)) : 0;
    const depositsPercentage = totalValue > 0 ? Number(((depositsValue / totalValue) * 100).toFixed(2)) : 0;

    // Get performance metrics
    const performance = await this.getPerformanceMetrics(portfolioId);

    // Calculate asset allocation by type
    const assetAllocation = this.calculateAssetAllocation(positions, cashBalance, depositsValue, totalValue);
    
    // Calculate asset details
    const assetDetails = positions.map(position => {
      const currentValue = typeof position.currentValue === 'string' ? parseFloat(position.currentValue) : (position.currentValue || 0);
      const unrealizedPl = typeof position.unrealizedPl === 'string' ? parseFloat(position.unrealizedPl) : (position.unrealizedPl || 0);
      return {
        symbol: position.symbol || 'N/A',
        name: position.symbol || 'Unknown Asset', // Using symbol as name since we don't have separate name field
        assetType: position.assetType || 'UNKNOWN',
        quantity: position.quantity || 0,
        currentPrice: position.currentPrice || 0,
        currentValue: currentValue,
        percentage: totalValue > 0 ? Number(((currentValue / totalValue) * 100).toFixed(2)) : 0,
        unrealizedPl: unrealizedPl,
      };
    });

    // Format deposits data
    const formattedDeposits = deposits.map(deposit => {
      
      return {
        depositId: deposit.depositId,
        bankName: deposit.bankName,
        accountNumber: deposit.accountNumber,
        principal: deposit.principal,
        interestRate: deposit.interestRate,
        totalValue: deposit.totalValue,
        status: deposit.status,
        startDate: deposit.startDate,
        endDate: deposit.endDate,
      };
    });

    // Calculate performance metrics
    const totalUnrealizedPl = positions.reduce((sum, position) => {
      const unrealizedPl = typeof position.unrealizedPl === 'string' ? parseFloat(position.unrealizedPl) : (position.unrealizedPl || 0);
      return sum + unrealizedPl;
    }, 0);
    const totalReturn = totalUnrealizedPl;
    const totalReturnPercentage = totalValue > 0 ? Number(((totalReturn / totalValue) * 100).toFixed(2)) : 0;

    return {
      portfolio: {
        id: portfolio.portfolioId,
        name: portfolio.name,
        totalValue: Number(totalValue),
        cashBalance: Number(cashBalance),
        assetValue: Number(assetValue),
        depositsValue: Number(depositsValue),
        lastUpdated: performance.lastUpdated,
      },
      summary: {
        totalAssets: positions.length,
        totalCash: Number(cashBalance),
        totalValue: Number(totalValue),
        cashPercentage: Number(cashPercentage),
        assetPercentage: Number(assetPercentage),
        depositsPercentage: Number(depositsPercentage),
      },
      assetAllocation,
      assetDetails,
      deposits: formattedDeposits,
      performance: {
        totalReturn: Number(totalReturn),
        totalReturnPercentage: Number(totalReturnPercentage),
        unrealizedPl: Number(totalUnrealizedPl),
        dailyGrowth: Number(performance.dailyGrowth),
        monthlyGrowth: Number(performance.monthlyGrowth),
        ytdGrowth: Number(performance.ytdGrowth),
        lastUpdated: performance.lastUpdated,
      },
    };
  }

  /**
   * Get investor report data for a specific portfolio (simplified for portfolios list)
   */
  private async getInvestorReportData(portfolioId: string, accountId: string) {
    const comprehensiveData = await this.getComprehensiveInvestorReportData(portfolioId, accountId);
    
    return {
      portfolio: comprehensiveData.portfolio,
      performance: comprehensiveData.performance,
    };
  }

  /**
   * Calculate asset allocation by type
   */
  private calculateAssetAllocation(positions: any[], cashBalance: number, depositsValue: number, totalValue: number) {
    const assetAllocation = positions.reduce((acc, position) => {
      const assetType = position.assetType || 'UNKNOWN';
      const existing = acc.find(item => item.assetType === assetType);
      
      if (existing) {
        const currentValue = typeof position.currentValue === 'string' ? parseFloat(position.currentValue) : (position.currentValue || 0);
        existing.value += currentValue;
        existing.count += 1;
      } else {
        const currentValue = typeof position.currentValue === 'string' ? parseFloat(position.currentValue) : (position.currentValue || 0);
        acc.push({
          assetType,
          percentage: 0, // Will be calculated later
          value: currentValue,
          count: 1,
        });
      }
      
      return acc;
    }, []);

    // Add cash as a separate "asset" if there's cash balance
    if (cashBalance > 0) {
      assetAllocation.push({
        assetType: 'Cash',
        percentage: 0, // Will be calculated later
        value: cashBalance,
        count: 1,
      });
    }

    // Add deposits as a separate "asset" if there are deposits
    if (depositsValue > 0) {
      assetAllocation.push({
        assetType: 'Deposits',
        percentage: 0, // Will be calculated later
        value: depositsValue,
        count: 1,
      });
    }

    // Calculate percentages for all asset types
    assetAllocation.forEach(item => {
      item.percentage = totalValue > 0 ? Number(((item.value / totalValue) * 100).toFixed(2)) : 0;
    });

    return assetAllocation;
  }

  /**
   * Get all performance metrics from latest performance snapshot in one query
   */
  private async getPerformanceMetrics(portfolioId: string): Promise<{
    dailyGrowth: number;
    monthlyGrowth: number;
    ytdGrowth: number;
    lastUpdated: Date;
  }> {
    try {
      const latestSnapshot = await this.performanceSnapshotService.getLatestPortfolioPerformanceSnapshot(portfolioId);
      if (!latestSnapshot) {
        this.logger.warn(`No performance snapshot found for portfolio ${portfolioId}`);
        return {
          dailyGrowth: 0,
          monthlyGrowth: 0,
          ytdGrowth: 0,
          lastUpdated: new Date(),
        };
      }
      
      // Parse string values to numbers for all metrics
      const parseMetric = (value: any): number => {
        const parsedValue = typeof value === 'string' ? parseFloat(value) : value;
        return typeof parsedValue === 'number' && !isNaN(parsedValue) ? parsedValue : 0;
      };
      
      return {
        dailyGrowth: parseMetric(latestSnapshot.portfolioTWR1D),
        monthlyGrowth: parseMetric(latestSnapshot.portfolioTWRMTD),
        ytdGrowth: parseMetric(latestSnapshot.portfolioTWRYTD),
        lastUpdated: latestSnapshot.snapshotDate,
      };
    } catch (error) {
      this.logger.warn(`Failed to get performance metrics for portfolio ${portfolioId}: ${error.message}`);
      return {
        dailyGrowth: 0,
        monthlyGrowth: 0,
        ytdGrowth: 0,
        lastUpdated: new Date(),
      };
    }
  }
}
