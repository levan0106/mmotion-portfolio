import { Injectable, Logger, ForbiddenException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from '../../portfolio/entities/portfolio.entity';
import { PortfolioService } from '../../portfolio/services/portfolio.service';
import { PortfolioCalculationService } from '../../portfolio/services/portfolio-calculation.service';
import { CashFlowService } from '../../portfolio/services/cash-flow.service';
import { DepositCalculationService } from '../../shared/services/deposit-calculation.service';
import { AnalysisAsset, AssetCategory, AssetLayer } from '../entities/personal-financial-analysis.entity';
import { randomUUID } from 'crypto';

/**
 * Portfolio Asset Loading Service
 * Handles loading assets from portfolios into personal financial analysis
 */
@Injectable()
export class PortfolioAssetLoadingService {
  private readonly logger = new Logger(PortfolioAssetLoadingService.name);

  constructor(
    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,
    private readonly portfolioService: PortfolioService,
    private readonly portfolioCalculationService: PortfolioCalculationService,
    @Inject(forwardRef(() => CashFlowService))
    private readonly cashFlowService: CashFlowService,
    private readonly depositCalculationService: DepositCalculationService,
  ) {}

  /**
   * Load assets from portfolio and convert to analysis assets
   * @param portfolioId - Portfolio ID
   * @param baseCurrency - Base currency for the analysis
   * @param accountId - Account ID for access control
   * @returns Promise<AnalysisAsset[]> Array of analysis assets
   */
  async loadAssetsFromPortfolio(
    portfolioId: string,
    baseCurrency: string,
    accountId: string,
  ): Promise<AnalysisAsset[]> {
    // Verify portfolio access (view permission)
    const hasAccess = await this.portfolioService.checkPortfolioAccess(
      portfolioId,
      accountId,
      'view',
    );

    if (!hasAccess) {
      throw new ForbiddenException(`Access denied to portfolio ${portfolioId}`);
    }

    // Get portfolio
    const portfolio = await this.portfolioRepository.findOne({
      where: { portfolioId },
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    // Get portfolio asset positions using calculation service
    const calculationResult = await this.portfolioCalculationService.calculatePortfolioAssetValues(
      portfolioId,
    );

    // Get cash balance
    let cashBalance = 0;
    try {
      cashBalance = await this.cashFlowService.getCashBalance(portfolioId);
      this.logger.log(`Portfolio ${portfolioId} cash balance: ${cashBalance}`);
    } catch (cashError) {
      this.logger.warn(`Error getting cash balance for portfolio ${portfolioId}:`, cashError);
      // Continue with 0 cash balance
    }

    // Get deposit data
    let totalDepositValue = 0;
    try {
      const depositData = await this.depositCalculationService.calculateDepositDataByPortfolioId(portfolioId);
      totalDepositValue = depositData.totalDepositValue;
      this.logger.log(`Portfolio ${portfolioId} total deposit value: ${totalDepositValue}`);
    } catch (depositError) {
      this.logger.warn(`Error calculating deposit value for portfolio ${portfolioId}:`, depositError);
      // Continue with 0 deposit value
    }

    // Group assets by assetType
    const groupedByType: Record<string, { positions: any[]; totalValue: number }> = {};
    
    calculationResult.assetPositions.forEach((position) => {
      const assetType = position.assetType || 'UNKNOWN';
      if (!groupedByType[assetType]) {
        groupedByType[assetType] = {
          positions: [],
          totalValue: 0,
        };
      }
      groupedByType[assetType].positions.push(position);
      groupedByType[assetType].totalValue += parseFloat(position.currentValue.toString());
    });

    // Map grouped assets to analysis assets
    const analysisAssets: AnalysisAsset[] = Object.entries(groupedByType).map(([assetType, group]) => {
      // All portfolio assets are financial assets
      const category = AssetCategory.FINANCIAL;

      // Map asset type to layer
      const layer = this.mapAssetTypeToLayer(assetType);

      // Generate a readable name based on asset type
      const assetTypeName = this.getAssetTypeDisplayName(assetType);

      return {
        id: randomUUID(), // Generate new ID for analysis asset
        name: assetTypeName,
        value: group.totalValue,
        category,
        layer,
        source: 'portfolio',
        portfolioId: portfolioId,
        portfolioName: portfolio.name,
        assetType: assetType,
        isEmergencyFund: false, // Default to false, user can update later
      };
    });

    // Add cash balance as a separate asset if > 0
    if (cashBalance > 0) {
      analysisAssets.push({
        id: randomUUID(),
        name: this.getAssetTypeDisplayName('CASH'),
        value: cashBalance,
        category: AssetCategory.FINANCIAL,
        layer: AssetLayer.PROTECTION,
        source: 'portfolio',
        portfolioId: portfolioId,
        portfolioName: portfolio.name,
        assetType: 'CASH',
        isEmergencyFund: false,
      });
    }

    // Add deposits as a separate asset if > 0
    if (totalDepositValue > 0) {
      analysisAssets.push({
        id: randomUUID(),
        name: this.getAssetTypeDisplayName('DEPOSIT'),
        value: totalDepositValue,
        category: AssetCategory.FINANCIAL,
        layer: AssetLayer.INCOME_GENERATION, // Tiền gửi tạo thu nhập từ lãi suất
        source: 'portfolio',
        portfolioId: portfolioId,
        portfolioName: portfolio.name,
        assetType: 'DEPOSIT',
        isEmergencyFund: false,
      });
    }

    this.logger.log(
      `Loaded ${analysisAssets.length} grouped assets (from ${calculationResult.assetPositions.length} positions, cash: ${cashBalance}, deposits: ${totalDepositValue}) from portfolio ${portfolioId} for analysis`,
    );

    return analysisAssets;
  }

  /**
   * Map portfolio asset type to analysis asset layer
   * @param assetType - Asset type from portfolio (STOCK, BOND, GOLD, etc.)
   * @returns AssetLayer
   */
  private mapAssetTypeToLayer(assetType: string): AssetLayer {
    switch (assetType?.toUpperCase()) {
      // Protection layer: Safe, high liquidity assets
      case 'CASH':
      case 'GOLD':
      case 'CURRENCY':
        return AssetLayer.PROTECTION;

      // Income generation layer: Assets that generate passive income
      case 'DEPOSIT': // Tiền gửi tạo thu nhập từ lãi suất
      case 'BOND':
      case 'FUND':
        return AssetLayer.INCOME_GENERATION;

      // Growth layer: Moderate growth assets
      case 'STOCK':
        return AssetLayer.GROWTH;

      // Risk layer: High risk, high potential assets
      case 'CRYPTO':
      case 'DERIVATIVE':
        return AssetLayer.RISK;

      // Default to growth for other types
      default:
        return AssetLayer.GROWTH;
    }
  }

  /**
   * Get display name for asset type
   * @param assetType - Asset type from portfolio
   * @returns Display name
   */
  private getAssetTypeDisplayName(assetType: string): string {
    const typeMap: Record<string, string> = {
      STOCK: 'Cổ phiếu',
      BOND: 'Trái phiếu',
      FUND: 'Quỹ đầu tư',
      CRYPTO: 'Tiền điện tử',
      DERIVATIVE: 'Công cụ phái sinh',
      REAL_ESTATE: 'Bất động sản',
      PROPERTY: 'Bất động sản',
      CASH: 'Tiền mặt',
      DEPOSIT: 'Tiền gửi',
      GOLD: 'Vàng',
      CURRENCY: 'Ngoại tệ',
      BUSINESS: 'Kinh doanh',
      EQUIPMENT: 'Thiết bị',
    };

    return typeMap[assetType?.toUpperCase()] || assetType || 'Tài sản khác';
  }
}

