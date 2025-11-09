import { DataSource } from 'typeorm';
import { GlobalAsset } from '../modules/asset/entities/global-asset.entity';
import { AssetPrice } from '../modules/asset/entities/asset-price.entity';
import { AssetType } from '../modules/asset/enums/asset-type.enum';

/**
 * Seeder for Global Assets System
 * Creates sample global assets with prices for testing
 */
export class GlobalAssetsSeeder {
  constructor(private dataSource: DataSource) {}

  async seed(): Promise<void> {
    console.log('🌱 Starting Global Assets seeding...');

    // Create global assets
    const globalAssets = await this.createGlobalAssets();
    console.log('✅ Created global assets:', globalAssets.length);

    // Create asset prices
    await this.createAssetPrices(globalAssets);
    console.log('✅ Created asset prices');

    console.log('🎉 Global Assets seeding completed!');
  }

  private async createGlobalAssets(): Promise<GlobalAsset[]> {
    const globalAssetRepository = this.dataSource.getRepository(GlobalAsset);
    const assets = [];

    const sampleAssets = [
      // Vietnamese stocks
      {
        symbol: 'HPG',
        name: 'Hoa Phat Group',
        type: AssetType.STOCK,
        nation: 'VN',
        marketCode: 'HOSE',
        currency: 'VND',
        timezone: 'Asia/Ho_Chi_Minh',
        isActive: true,
        description: 'Leading steel manufacturer in Vietnam',
      },
      {
        symbol: 'VCB',
        name: 'Vietcombank',
        type: AssetType.STOCK,
        nation: 'VN',
        marketCode: 'HOSE',
        currency: 'VND',
        timezone: 'Asia/Ho_Chi_Minh',
        isActive: true,
        description: 'Leading commercial bank in Vietnam',
      },
      {
        symbol: 'VIC',
        name: 'Vingroup',
        type: AssetType.STOCK,
        nation: 'VN',
        marketCode: 'HOSE',
        currency: 'VND',
        timezone: 'Asia/Ho_Chi_Minh',
        isActive: true,
        description: 'Leading conglomerate in Vietnam',
      },
      {
        symbol: 'MSN',
        name: 'Masan Group',
        type: AssetType.STOCK,
        nation: 'VN',
        marketCode: 'HOSE',
        currency: 'VND',
        timezone: 'Asia/Ho_Chi_Minh',
        isActive: true,
        description: 'Consumer goods and retail company',
      },
      // US stocks
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        type: AssetType.STOCK,
        nation: 'US',
        marketCode: 'NASDAQ',
        currency: 'USD',
        timezone: 'America/New_York',
        isActive: true,
        description: 'Technology company',
      },
      {
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        type: AssetType.STOCK,
        nation: 'US',
        marketCode: 'NASDAQ',
        currency: 'USD',
        timezone: 'America/New_York',
        isActive: true,
        description: 'Technology company',
      },
      {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        type: AssetType.STOCK,
        nation: 'US',
        marketCode: 'NASDAQ',
        currency: 'USD',
        timezone: 'America/New_York',
        isActive: true,
        description: 'Technology company',
      },
      // UK stocks
      {
        symbol: 'TSCO',
        name: 'Tesco PLC',
        type: AssetType.STOCK,
        nation: 'UK',
        marketCode: 'LSE',
        currency: 'GBP',
        timezone: 'Europe/London',
        isActive: true,
        description: 'Retail company',
      },
      // Japanese stocks
      {
        symbol: '7203',
        name: 'Toyota Motor Corporation',
        type: AssetType.STOCK,
        nation: 'JP',
        marketCode: 'TSE',
        currency: 'JPY',
        timezone: 'Asia/Tokyo',
        isActive: true,
        description: 'Automotive manufacturer',
      },
      // Singapore stocks
      {
        symbol: 'D05',
        name: 'DBS Group Holdings Ltd',
        type: AssetType.STOCK,
        nation: 'SG',
        marketCode: 'SGX',
        currency: 'SGD',
        timezone: 'Asia/Singapore',
        isActive: true,
        description: 'Banking and financial services',
      },
      // Gold commodity
      {
        symbol: 'GOLD',
        name: 'Gold Spot',
        type: AssetType.GOLD,
        nation: 'GLOBAL',
        marketCode: 'COMEX',
        currency: 'USD',
        timezone: 'America/New_York',
        isActive: true,
        description: 'Gold commodity trading',
      },
    ];

    for (const assetData of sampleAssets) {
      let asset = await globalAssetRepository.findOne({
        where: { 
          symbol: assetData.symbol,
          nation: assetData.nation,
        },
      });

      if (!asset) {
        asset = globalAssetRepository.create(assetData);
        asset = await globalAssetRepository.save(asset);
      }
      assets.push(asset);
    }

    return assets;
  }

  private async createAssetPrices(globalAssets: GlobalAsset[]): Promise<void> {
    const assetPriceRepository = this.dataSource.getRepository(AssetPrice);

    for (const asset of globalAssets) {
      let assetPrice = await assetPriceRepository.findOne({
        where: { assetId: asset.id },
      });

      if (!assetPrice) {
        // Generate sample prices based on asset type and nation
        let currentPrice = 0;
        let priceType = 'MARKET_DATA';
        let priceSource = 'MARKET_DATA_SERVICE';

        switch (asset.nation) {
          case 'VN':
            currentPrice = Math.random() * 100000 + 10000; // 10k-110k VND
            break;
          case 'US':
            currentPrice = Math.random() * 500 + 50; // $50-550
            break;
          case 'UK':
            currentPrice = Math.random() * 50 + 5; // £5-55
            break;
          case 'JP':
            currentPrice = Math.random() * 10000 + 1000; // ¥1k-11k
            break;
          case 'SG':
            currentPrice = Math.random() * 50 + 5; // S$5-55
            break;
          case 'GLOBAL':
            if (asset.type === 'GOLD') {
              currentPrice = Math.random() * 500 + 1800; // $1800-2300
            } else {
              currentPrice = Math.random() * 100 + 10; // $10-110
            }
            break;
          default:
            currentPrice = Math.random() * 1000 + 100;
        }

        assetPrice = assetPriceRepository.create({
          assetId: asset.id,
          currentPrice: Math.round(currentPrice * 100) / 100, // Round to 2 decimal places
          priceType: priceType as any,
          priceSource: priceSource as any,
          lastPriceUpdate: new Date(),
          metadata: {
            source: 'seeder',
            generated: true,
          },
        });

        await assetPriceRepository.save(assetPrice);
      }
    }
  }
}
