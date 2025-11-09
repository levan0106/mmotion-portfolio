import { DataSource } from 'typeorm';
import { Account } from '../modules/shared/entities/account.entity';
import { Asset } from '../modules/asset/entities/asset.entity';
import { AssetType } from '../modules/asset/enums/asset-type.enum';
import { Portfolio } from '../modules/portfolio/entities/portfolio.entity';
// PortfolioAsset entity has been removed - Portfolio is now linked to Assets through Trades only
import { Trade, TradeSide, TradeType } from '../modules/trading/entities/trade.entity';
import { TradeDetail } from '../modules/trading/entities/trade-detail.entity';

/**
 * Seed script to populate database with test data.
 */
export class PortfolioSeeder {
  constructor(private dataSource: DataSource) {}

  async seed(): Promise<void> {
    // eslint-disable-next-line no-console
    console.log('🌱 Starting database seeding...');

    // Create test account
    const account = await this.createTestAccount();
    // eslint-disable-next-line no-console
    console.log('✅ Created test account:', account.accountId);

    // Create test assets
    const assets = await this.createTestAssets(account.accountId);
    // eslint-disable-next-line no-console
    console.log('✅ Created test assets:', assets.length);

    // Create test portfolio
    const portfolio = await this.createTestPortfolio(account.accountId);
    // eslint-disable-next-line no-console
    console.log('✅ Created test portfolio:', portfolio.portfolioId);

    // Portfolio assets are now created through trades - no direct portfolio-asset relationship
    // eslint-disable-next-line no-console
    console.log('✅ Portfolio assets will be created through trades');

    // Create test trades
    await this.createTestTrades(portfolio.portfolioId, assets);
    // eslint-disable-next-line no-console
    console.log('✅ Created test trades');

    // eslint-disable-next-line no-console
    console.log('🎉 Database seeding completed!');
  }

  private async createTestAccount(): Promise<Account> {
    const accountRepository = this.dataSource.getRepository(Account);
    
    let account = await accountRepository.findOne({
      where: { email: 'tung@example.com' },
    });

    if (!account) {
      account = accountRepository.create({
        accountId: '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5',
        name: 'Test User',
        email: 'tung@example.com',
        baseCurrency: 'VND',
      });
      account = await accountRepository.save(account);
    }

    return account;
  }

  private async createTestAssets(accountId: string): Promise<Asset[]> {
    const assetRepository = this.dataSource.getRepository(Asset);
    const assets = [];

    const testAssets = [
      { 
        symbol: 'HPG', 
        name: 'Hoa Phat Group', 
        code: 'HPG',
        type: AssetType.STOCK, 
        description: 'Leading steel manufacturer in Vietnam',
        initialValue: 25000000,
        initialQuantity: 1000,
        currentValue: 30000000,
        currentQuantity: 1000,
      },
      { 
        symbol: 'VCB', 
        name: 'Vietcombank', 
        code: 'VCB',
        type: AssetType.STOCK, 
        description: 'Leading commercial bank in Vietnam',
        initialValue: 80000000,
        initialQuantity: 500,
        currentValue: 90000000,
        currentQuantity: 500,
      },
      { 
        symbol: 'GOLD', 
        name: 'Gold', 
        code: 'GOLD',
        type: AssetType.GOLD, 
        description: 'Gold commodity',
        initialValue: 5000000,
        initialQuantity: 0.1,
        currentValue: 5500000,
        currentQuantity: 0.1,
      },
      { 
        symbol: 'VND', 
        name: 'Vietnamese Dong', 
        code: 'VND',
        type: AssetType.COMMODITY, 
        description: 'Vietnamese currency',
        initialValue: 100000000,
        initialQuantity: 100000000,
        currentValue: 100000000,
        currentQuantity: 100000000,
      },
    ];

    for (const assetData of testAssets) {
      let asset = await assetRepository.findOne({
        where: { symbol: assetData.symbol },
      });

      if (!asset) {
        asset = assetRepository.create({
          ...assetData,
          createdBy: accountId,
          updatedBy: accountId,
        });
        asset = await assetRepository.save(asset);
      }
      assets.push(asset);
    }

    return assets;
  }

  private async createTestPortfolio(accountId: string): Promise<Portfolio> {
    const portfolioRepository = this.dataSource.getRepository(Portfolio);
    
    let portfolio = await portfolioRepository.findOne({
      where: { name: 'Test Portfolio' },
    });

    if (!portfolio) {
      portfolio = portfolioRepository.create({
        accountId: accountId,
        name: 'Test Portfolio',
        baseCurrency: 'VND',
        totalValue: 100000000, // 100M VND
        cashBalance: 50000000, // 50M VND
        unrealizedPl: 5000000, // 5M VND
        realizedPl: 2000000, // 2M VND
      });
      portfolio = await portfolioRepository.save(portfolio);
    }

    return portfolio;
  }

  private async createPortfolioAssets(portfolioId: string, assets: Asset[]): Promise<void> {
    // PortfolioAsset entity has been removed - Portfolio is now linked to Assets through Trades only
    // This method is no longer needed
    
    // Portfolio assets are now created through trades - no direct portfolio-asset relationship
    // This method is no longer needed
  }

  private async createTestTrades(portfolioId: string, assets: Asset[]): Promise<void> {
    const tradeRepository = this.dataSource.getRepository(Trade);
    const tradeDetailRepository = this.dataSource.getRepository(TradeDetail);
    
    // Sample trading data
    const tradesData = [
      // HPG trades
      {
        asset: assets.find(a => a.symbol === 'HPG'),
        side: TradeSide.BUY,
        tradeDate: new Date('2024-01-15'),
        quantity: 1000,
        price: 25000,
        fee: 25000,
        tax: 0,
        tradeType: TradeType.NORMAL,
        source: 'Manual Entry',
        notes: 'Initial HPG position',
      },
      {
        asset: assets.find(a => a.symbol === 'HPG'),
        side: TradeSide.BUY,
        tradeDate: new Date('2024-02-10'),
        quantity: 500,
        price: 24000,
        fee: 12000,
        tax: 0,
        tradeType: TradeType.NORMAL,
        source: 'Manual Entry',
        notes: 'Additional HPG shares',
      },
      {
        asset: assets.find(a => a.symbol === 'HPG'),
        side: TradeSide.SELL,
        tradeDate: new Date('2024-03-05'),
        quantity: 300,
        price: 26000,
        fee: 7800,
        tax: 0,
        tradeType: TradeType.NORMAL,
        source: 'Manual Entry',
        notes: 'Partial HPG profit taking',
      },
      // VCB trades
      {
        asset: assets.find(a => a.symbol === 'VCB'),
        side: TradeSide.BUY,
        tradeDate: new Date('2024-01-20'),
        quantity: 500,
        price: 80000,
        fee: 40000,
        tax: 0,
        tradeType: TradeType.NORMAL,
        source: 'Manual Entry',
        notes: 'VCB position establishment',
      },
      {
        asset: assets.find(a => a.symbol === 'VCB'),
        side: TradeSide.BUY,
        tradeDate: new Date('2024-02-15'),
        quantity: 200,
        price: 82000,
        fee: 16400,
        tax: 0,
        tradeType: TradeType.NORMAL,
        source: 'Manual Entry',
        notes: 'VCB position increase',
      },
      // GOLD trades
      {
        asset: assets.find(a => a.symbol === 'GOLD'),
        side: TradeSide.BUY,
        tradeDate: new Date('2024-01-25'),
        quantity: 1,
        price: 50000000,
        fee: 50000,
        tax: 0,
        tradeType: TradeType.NORMAL,
        source: 'Manual Entry',
        notes: 'Gold investment',
      },
      {
        asset: assets.find(a => a.symbol === 'GOLD'),
        side: TradeSide.BUY,
        tradeDate: new Date('2024-02-20'),
        quantity: 1,
        price: 51000000,
        fee: 51000,
        tax: 0,
        tradeType: TradeType.NORMAL,
        source: 'Manual Entry',
        notes: 'Additional gold purchase',
      },
    ];

    for (const tradeData of tradesData) {
      if (tradeData.asset) {
        // Check if trade already exists
        const existingTrade = await tradeRepository.findOne({
          where: {
            portfolioId: portfolioId,
            assetId: tradeData.asset.id,
            tradeDate: tradeData.tradeDate,
            side: tradeData.side,
            quantity: tradeData.quantity,
            price: tradeData.price,
          },
        });

        if (!existingTrade) {
          const trade = tradeRepository.create({
            portfolioId: portfolioId,
            assetId: tradeData.asset.id,
            tradeDate: tradeData.tradeDate,
            side: tradeData.side,
            quantity: tradeData.quantity,
            price: tradeData.price,
            fee: tradeData.fee,
            tax: tradeData.tax,
            tradeType: tradeData.tradeType,
            source: tradeData.source,
            notes: tradeData.notes,
          });
          
          const savedTrade = await tradeRepository.save(trade);
          
          // Create trade details for matched trades (simulating FIFO matching)
          if (tradeData.side === TradeSide.SELL) {
            // Find matching buy trades for FIFO
            const matchingBuyTrades = await tradeRepository.find({
              where: {
                portfolioId: portfolioId,
                assetId: tradeData.asset.id,
                side: TradeSide.BUY,
              },
              order: { tradeDate: 'ASC' },
            });

            if (matchingBuyTrades.length > 0) {
              const matchedQuantity = Math.min(tradeData.quantity, matchingBuyTrades[0].quantity);
              const matchedPrice = matchingBuyTrades[0].price;
              const pnl = (tradeData.price - matchedPrice) * matchedQuantity - tradeData.fee - tradeData.tax;

              const tradeDetail = tradeDetailRepository.create({
                sellTradeId: savedTrade.tradeId,
                buyTradeId: matchingBuyTrades[0].tradeId,
                assetId: tradeData.asset.id,
                matchedQty: matchedQuantity,
                buyPrice: matchedPrice,
                sellPrice: tradeData.price,
                feeTax: tradeData.fee + tradeData.tax,
                pnl: pnl,
              });
              
              await tradeDetailRepository.save(tradeDetail);
            }
          }
        }
      }
    }
  }
}
