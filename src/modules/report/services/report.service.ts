import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportDataDto, CashBalanceReportDto, DepositsReportDto, AssetsReportDto, ReportSummaryDto } from '../dto/report-response.dto';
import { Portfolio } from '../../portfolio/entities/portfolio.entity';
import { Deposit } from '../../portfolio/entities/deposit.entity';
import { Asset } from '../../asset/entities/asset.entity';
import { Trade } from '../../trading/entities/trade.entity';
import { CashFlow } from '../../portfolio/entities/cash-flow.entity';
import { AssetGlobalSyncService } from '../../asset/services/asset-global-sync.service';
import { AssetValueCalculatorService } from '../../asset/services/asset-value-calculator.service';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    @InjectRepository(Portfolio)
    private portfolioRepository: Repository<Portfolio>,
    @InjectRepository(Deposit)
    private depositRepository: Repository<Deposit>,
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(Trade)
    private tradeRepository: Repository<Trade>,
    @InjectRepository(CashFlow)
    private cashFlowRepository: Repository<CashFlow>,
    private assetGlobalSyncService: AssetGlobalSyncService,
    private assetValueCalculator: AssetValueCalculatorService,
  ) {}

  /**
   * Get current market price for an asset
   */
  private async getAssetCurrentPrice(asset: Asset): Promise<number> {
    try {
      const currentPrice = await this.assetGlobalSyncService.getCurrentPriceFromGlobalAsset(asset.symbol);
      if (currentPrice && currentPrice > 0) {
        return currentPrice;
      }
    } catch (error) {
      this.logger.warn(`Failed to get current price for ${asset.symbol}: ${error.message}`);
    }
    
    // Fallback to initial value
    return Number(asset.initialValue) || 0;
  }

  /**
   * Calculate capital value for an asset based on trades
   * capitalValue = currentQuantity * averageBuyPrice + proportionalFees + proportionalTaxes
   */
  private async calculateAssetCapitalValue(assetId: string): Promise<number> {
    try {
      // Get all buy trades for this asset
      const buyTrades = await this.tradeRepository
        .createQueryBuilder('trade')
        .where('trade.assetId = :assetId', { assetId })
        .andWhere('trade.side = :side', { side: 'BUY' })
        .getMany();

      if (buyTrades.length === 0) {
        return 0;
      }

      let totalQuantity = 0;
      let totalCost = 0;
      let totalFees = 0;
      let totalTaxes = 0;

      for (const trade of buyTrades) {
        const quantity = Number(trade.quantity) || 0;
        const price = Number(trade.price) || 0;
        const fee = Number(trade.fee) || 0;
        const tax = Number(trade.tax) || 0;

        totalQuantity += quantity;
        totalCost += quantity * price;
        totalFees += fee;
        totalTaxes += tax;
      }

      if (totalQuantity === 0) {
        return 0;
      }

      // Calculate average buy price
      const averageBuyPrice = totalCost / totalQuantity;
      
      // Get current quantity from asset
      const asset = await this.assetRepository.findOne({ where: { id: assetId } });
      const currentQuantity = Number(asset?.currentQuantity) || 0;

      // Calculate capital value: currentQuantity * averageBuyPrice + proportional fees and taxes
      const proportionalFees = (totalFees * currentQuantity) / totalQuantity;
      const proportionalTaxes = (totalTaxes * currentQuantity) / totalQuantity;

      return currentQuantity * averageBuyPrice + proportionalFees + proportionalTaxes;
    } catch (error) {
      this.logger.warn(`Failed to calculate capital value for asset ${assetId}: ${error.message}`);
      return 0;
    }
  }

  /**
   * Get comprehensive report data for an account
   */
  async getReportData(accountId: string, portfolioId?: string): Promise<ReportDataDto> {
    try {
      // Parse multiple portfolio IDs if provided as comma-separated string
      let portfolioIds: string[] | undefined;
      if (portfolioId && portfolioId !== 'all') {
        portfolioIds = portfolioId.split(',').map(id => id.trim()).filter(id => id.length > 0);
        this.logger.debug(`Processing multiple portfolio IDs: ${portfolioIds.join(', ')}`);
      }

      const [cashBalanceReport, depositsReport, assetsReport] = await Promise.all([
        this.getCashBalanceReport(accountId, portfolioIds),
        this.getDepositsReport(accountId, portfolioIds),
        this.getAssetsReport(accountId, portfolioIds),
      ]);

      return {
        cashBalance: cashBalanceReport,
        deposits: depositsReport,
        assets: assetsReport,
      };
    } catch (error) {
      this.logger.error('Error generating report data:', error);
      throw error;
    }
  }

  /**
   * Get cash balance report data
   */
  private async getCashBalanceReport(accountId: string, portfolioIds?: string[]): Promise<CashBalanceReportDto> {
    // Get portfolios for the account, optionally filtered by portfolioIds
    let portfolioQuery = this.portfolioRepository.createQueryBuilder('portfolio')
      .where('portfolio.accountId = :accountId', { accountId });
    
    if (portfolioIds && portfolioIds.length > 0) {
      portfolioQuery = portfolioQuery.andWhere('portfolio.portfolioId IN (:...portfolioIds)', { portfolioIds });
    }
    
    const portfolios = await portfolioQuery.getMany();

    // Calculate total cash balance
    const totalCashBalance = portfolios.reduce((sum, portfolio) => {
      return sum + (Number(portfolio.cashBalance) || 0);
    }, 0);

    // Get cash flows to analyze funding sources
    // Get cash flows for these portfolios
    let cashFlowQuery = this.cashFlowRepository
      .createQueryBuilder('cashFlow')
      .leftJoin('cashFlow.portfolio', 'portfolio')
      .where('portfolio.accountId = :accountId', { accountId });
    
    if (portfolioIds && portfolioIds.length > 0) {
      cashFlowQuery = cashFlowQuery.andWhere('portfolio.portfolioId IN (:...portfolioIds)', { portfolioIds });
    }
    
    const cashFlows = await cashFlowQuery.getMany();

    // Group by funding source (using fundingSource column)
    const fundingSourceMap = new Map<string, { total: number; count: number }>();
    cashFlows.forEach(flow => {
        const fundingSource = flow.fundingSource || 'Unknown';
        const netAmount = Number(flow.netAmount) || 0;
        const existing = fundingSourceMap.get(fundingSource) || { total: 0, count: 0 };
        fundingSourceMap.set(fundingSource, {
          total: existing.total + netAmount,
          count: existing.count + 1
        });
    });

    const byFundingSource: ReportSummaryDto[] = Array.from(fundingSourceMap.entries())
      .filter(([source, data]) => data.total <= -1000 || data.total >= 1000) // Only show sources with non-zero values
      .map(([source, data]) => ({
        source,
        total: data.total,
        count: data.count,
        percentage: totalCashBalance > 0 ? (data.total / totalCashBalance) * 100 : 0
      }));

    // For cash balance, we only show by funding source
    // Empty arrays for exchange and asset group as they're not relevant for cash balance
    const byExchange: ReportSummaryDto[] = [];
    const byAssetGroup: ReportSummaryDto[] = [];

    return {
      total: totalCashBalance,
      byExchange,
      byFundingSource,
      byAssetGroup,
    };
  }

  /**
   * Get deposits report data
   */
  private async getDepositsReport(accountId: string, portfolioIds?: string[]): Promise<DepositsReportDto> {
    // Get only active deposits (not settled) for portfolios belonging to this account
    let depositQuery = this.depositRepository
      .createQueryBuilder('deposit')
      .leftJoin('deposit.portfolio', 'portfolio')
      .where('portfolio.accountId = :accountId', { accountId })
      .andWhere('deposit.status = :status', { status: 'ACTIVE' });
    
    if (portfolioIds && portfolioIds.length > 0) {
      depositQuery = depositQuery.andWhere('portfolio.portfolioId IN (:...portfolioIds)', { portfolioIds });
    }
    
    const deposits = await depositQuery.getMany();

    const totalDeposits = deposits.length;
    const totalValue = deposits.reduce((sum, deposit) => {
      const principal = Number(deposit.principal) || 0;
      const interest = Number(deposit.calculateAccruedInterest()) || 0;
      return sum + principal + interest;
    }, 0);

    // Group by bank (using bank name)
    const bankMap = new Map<string, { total: number; count: number; value: number }>();
    deposits.forEach(deposit => {
      const bankName = deposit.bankName || 'Unknown Bank';
      const principal = Number(deposit.principal) || 0;
      const interest = Number(deposit.calculateAccruedInterest()) || 0;
      const totalDepositValue = principal + interest;
      
      const existing = bankMap.get(bankName) || { total: 0, count: 0, value: 0 };
      bankMap.set(bankName, {
        total: existing.total + 1,
        count: existing.count + 1,
        value: existing.value + totalDepositValue
      });
    });

    const byExchange: ReportSummaryDto[] = Array.from(bankMap.entries()).map(([bank, data]) => ({
      exchange: bank,
      total: data.value,
      count: data.count,
      percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0
    }));

    // Group by term (kỳ hạn) - using termMonths
    const termMap = new Map<string, { total: number; count: number; value: number }>();
    deposits.forEach(deposit => {
      const termMonths = deposit.termMonths || 0;
      const termLabel = termMonths > 0 ? `${termMonths} tháng` : 'Không xác định';
      const principal = Number(deposit.principal) || 0;
      const interest = Number(deposit.calculateAccruedInterest()) || 0;
      const totalDepositValue = principal + interest;
      
      const existing = termMap.get(termLabel) || { total: 0, count: 0, value: 0 };
      termMap.set(termLabel, {
        total: existing.total + 1,
        count: existing.count + 1,
        value: existing.value + totalDepositValue
      });
    });

    const byFundingSource: ReportSummaryDto[] = Array.from(termMap.entries()).map(([term, data]) => ({
      source: term,
      total: data.value,
      count: data.count,
      percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0
    }));

    // For deposits, we don't show by asset group
    const byAssetGroup: ReportSummaryDto[] = [];

    return {
      total: totalDeposits,
      totalValue,
      byExchange,
      byFundingSource,
      byAssetGroup,
    };
  }

  /**
   * Get assets report data
   */
  private async getAssetsReport(accountId: string, portfolioIds?: string[]): Promise<AssetsReportDto> {
    // Get trades for the specific portfolio to calculate actual holdings
    let tradeQuery = this.tradeRepository
      .createQueryBuilder('trade')
      .leftJoin('trade.portfolio', 'portfolio')
      .leftJoin('trade.asset', 'asset')
      .where('portfolio.accountId = :accountId', { accountId })
      .addSelect(['asset.id', 'asset.symbol', 'asset.type', 'asset.initialValue']);
    
    if (portfolioIds && portfolioIds.length > 0) {
      tradeQuery = tradeQuery.andWhere('portfolio.portfolioId IN (:...portfolioIds)', { portfolioIds });
    }
    
    const trades = await tradeQuery.getMany();
    
    // Group trades by asset and calculate FIFO positions
    const assetTradesMap = new Map<string, { asset: any; trades: any[] }>();
    
    trades.forEach(trade => {
      if (trade.asset?.id) {
        const assetId = trade.asset.id;
        
        if (!assetTradesMap.has(assetId)) {
          assetTradesMap.set(assetId, {
            asset: trade.asset,
            trades: []
          });
        }
        
        assetTradesMap.get(assetId).trades.push(trade);
      }
    });
    
    // Calculate FIFO positions for each asset
    const assets = [];
    for (const [assetId, assetData] of assetTradesMap) {
      const currentPrice = await this.getAssetCurrentPrice(assetData.asset);
      const fifoPosition = this.assetValueCalculator.calculateAssetPositionFIFOFinal(
        assetData.trades,
        currentPrice
      );
      
      // Only include assets with remaining quantity > 0
      if (fifoPosition.quantity > 0) {
        assets.push({
          ...assetData.asset,
          currentQuantity: fifoPosition.quantity.toString(),
          trades: assetData.trades,
          fifoPosition: fifoPosition
        });
      }
    }
    
    this.logger.debug(`Found ${assets.length} assets for accountId: ${accountId}, portfolioIds: ${portfolioIds ? portfolioIds.join(', ') : 'all'}`);
    this.logger.debug('Assets with FIFO calculated holdings:', assets.map(a => ({ 
      id: a.id, 
      symbol: a.symbol, 
      type: a.type, 
      currentQuantity: a.currentQuantity,
      tradesCount: a.trades?.length || 0,
      fifoRemainingQuantity: a.fifoPosition?.quantity,
      fifoRealizedPnl: a.fifoPosition?.realizedPnl,
      fifoUnrealizedPnl: a.fifoPosition?.unrealizedPnl
    })));

    const totalAssets = assets.length;
    let totalValue = 0;
    
    // Calculate total value using FIFO positions
    for (const asset of assets) {
      const currentValue = asset.fifoPosition?.currentValue || 0;
      totalValue += currentValue;
    }

    // Group by asset type (stock, bond, etc.)
    const typeMap = new Map<string, { total: number; count: number; value: number; capitalValue: number }>();
    for (const asset of assets) {
      const type = asset.type || 'UNKNOWN';
      const value = asset.fifoPosition?.currentValue || 0;
      const capitalValue = (asset.fifoPosition?.avgCost || 0) * (asset.fifoPosition?.quantity || 0);
      
      const existing = typeMap.get(type) || { total: 0, count: 0, value: 0, capitalValue: 0 };
      typeMap.set(type, {
        total: existing.total + 1,
        count: existing.count + 1,
        value: existing.value + value,
        capitalValue: existing.capitalValue + capitalValue
      });
    }

    const byAssetGroup: ReportSummaryDto[] = Array.from(typeMap.entries()).map(([group, data]) => ({
      group,
      total: data.value,
      count: data.count,
      percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
      capitalValue: data.capitalValue
    }));

    // Group by exchange/platform using asset data
    const exchangeMap = new Map<string, { total: number; count: number; value: number; capitalValue: number }>();
    
    this.logger.debug(`Processing ${assets.length} assets for exchange grouping`);

    // Create a map of asset ID to exchange from trades (already loaded with assets)
    const assetExchangeMap = new Map<string, string>();
    assets.forEach(asset => {
      if (asset.trades && asset.trades.length > 0) {
        // Use the first trade's exchange for this asset
        const exchangeValue = asset.trades[0].exchange && asset.trades[0].exchange.trim() !== '' 
          ? asset.trades[0].exchange 
          : 'UNKNOWN';
        assetExchangeMap.set(asset.id, exchangeValue);
      } else {
        assetExchangeMap.set(asset.id, 'UNKNOWN');
      }
    });

    // Group assets by exchange
    for (const asset of assets) {
      const exchange = assetExchangeMap.get(asset.id) || 'UNKNOWN';
      const value = asset.fifoPosition?.currentValue || 0;
      const capitalValue = (asset.fifoPosition?.avgCost || 0) * (asset.fifoPosition?.quantity || 0);
      const quantity = asset.fifoPosition?.quantity || 0;
      
      this.logger.debug(`Asset ${asset.symbol}: exchange=${exchange}, quantity=${quantity}, value=${value}, capitalValue=${capitalValue}`);
      
      const existing = exchangeMap.get(exchange) || { total: 0, count: 0, value: 0, capitalValue: 0 };
      exchangeMap.set(exchange, {
        total: existing.total + 1,
        count: existing.count + 1,
        value: existing.value + value,
        capitalValue: existing.capitalValue + capitalValue
      });
    }

    const byExchange: ReportSummaryDto[] = Array.from(exchangeMap.entries()).map(([exchange, data]) => ({
      exchange,
      total: data.value,
      count: data.count,
      percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
      capitalValue: data.capitalValue
    }));

    // For assets, we don't show by funding source
    const byFundingSource: ReportSummaryDto[] = [];

    return {
      total: totalAssets,
      totalValue,
      byExchange,
      byFundingSource,
      byAssetGroup,
    };
  }

}
