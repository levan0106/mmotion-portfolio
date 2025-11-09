import AppDataSource from '../src/config/database.config';
import { Account } from '../src/modules/shared/entities/account.entity';
import { Asset } from '../src/modules/asset/entities/asset.entity';
import { AssetType } from '../src/modules/asset/enums/asset-type.enum';
import { Portfolio } from '../src/modules/portfolio/entities/portfolio.entity';

async function quickSeed() {
  try {
    console.log('🔌 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // Create test account
    const accountRepo = AppDataSource.getRepository(Account);
    let account = await accountRepo.findOne({ where: { email: 'test@example.com' } });
    
    if (!account) {
      account = accountRepo.create({
        accountId: '86c2ae61-8f69-4608-a5fd-8fecb44ed2c5',
        name: 'Test User',
        email: 'tung@example.com',
        baseCurrency: 'VND',
      });
      account = await accountRepo.save(account);
      console.log('✅ Created account:', account.accountId);
    } else {
      console.log('✅ Account exists:', account.accountId);
    }

    // Create test assets
    const assetRepo = AppDataSource.getRepository(Asset);
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
    ];

    const assets = [];
    for (const assetData of testAssets) {
      let asset = await assetRepo.findOne({ where: { symbol: assetData.symbol } });
      
      if (!asset) {
        asset = assetRepo.create({
          ...assetData,
          createdBy: 'system',
          updatedBy: 'system',
        });
        asset = await assetRepo.save(asset);
        console.log('✅ Created asset:', asset.symbol, asset.id);
      } else {
        console.log('✅ Asset exists:', asset.symbol, asset.id);
      }
      assets.push(asset);
    }

    // Create test portfolio
    const portfolioRepo = AppDataSource.getRepository(Portfolio);
    let portfolio = await portfolioRepo.findOne({ where: { name: 'Test Portfolio' } });
    
    if (!portfolio) {
      portfolio = portfolioRepo.create({
        accountId: account.accountId,
        name: 'Test Portfolio',
        baseCurrency: 'VND',
        totalValue: 100000000,
        cashBalance: 50000000,
        unrealizedPl: 5000000,
        realizedPl: 2000000,
      });
      portfolio = await portfolioRepo.save(portfolio);
      console.log('✅ Created portfolio:', portfolio.portfolioId);
    } else {
      console.log('✅ Portfolio exists:', portfolio.portfolioId);
    }

    console.log('\n🎉 Quick seed completed!');
    console.log('📋 Available data:');
    console.log('Account ID:', account.accountId);
    console.log('Portfolio ID:', portfolio.portfolioId);
    console.log('Asset IDs:');
    assets.forEach(asset => {
      console.log(`  ${asset.symbol}: ${asset.assetId}`);
    });

  } catch (error) {
    console.error('❌ Quick seed failed:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

quickSeed();

