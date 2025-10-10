import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetGlobalSyncService } from './asset-global-sync.service';
import { Asset } from '../entities/asset.entity';
import { GlobalAsset } from '../entities/global-asset.entity';
import { NationConfigService } from './nation-config.service';
import { BasicPriceService } from './basic-price.service';
import { ExternalMarketDataService } from '../../market-data/services/external-market-data.service';
import { AssetType } from '../enums/asset-type.enum';
import { PriceType, PriceSource } from '../enums/price-type.enum';

describe('AssetGlobalSyncService - External Price Integration', () => {
  let service: AssetGlobalSyncService;
  let globalAssetRepository: Repository<GlobalAsset>;
  let assetRepository: Repository<Asset>;
  let basicPriceService: BasicPriceService;
  let externalMarketDataService: ExternalMarketDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetGlobalSyncService,
        {
          provide: getRepositoryToken(GlobalAsset),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Asset),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: NationConfigService,
          useValue: {
            getNationConfig: jest.fn(),
          },
        },
        {
          provide: BasicPriceService,
          useValue: {
            findByAssetId: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: ExternalMarketDataService,
          useValue: {
            getPriceBySymbol: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AssetGlobalSyncService>(AssetGlobalSyncService);
    globalAssetRepository = module.get<Repository<GlobalAsset>>(getRepositoryToken(GlobalAsset));
    assetRepository = module.get<Repository<Asset>>(getRepositoryToken(Asset));
    basicPriceService = module.get<BasicPriceService>(BasicPriceService);
    externalMarketDataService = module.get<ExternalMarketDataService>(ExternalMarketDataService);
  });

  describe('External Price Fetching', () => {
    it('should use ExternalMarketDataService.getPriceBySymbol() for price fetching', async () => {
      // Arrange
      const mockGlobalAsset = {
        id: 'test-global-asset-id',
        symbol: 'AAPL',
        name: 'Apple Inc.',
        type: AssetType.STOCK,
        nation: 'US',
      } as GlobalAsset;

      const mockPriceResult = {
        symbol: 'AAPL',
        price: 150.25,
        type: 'STOCK',
        source: 'ssi.com.vn',
        success: true,
      };

      jest.spyOn(externalMarketDataService, 'getPriceBySymbol').mockResolvedValue(mockPriceResult);
      jest.spyOn(basicPriceService, 'findByAssetId').mockResolvedValue(null);
      jest.spyOn(basicPriceService, 'create').mockResolvedValue({ id: 'test-price-id' });

      // Act
      const result = await service.syncAssetOnCreate({
        symbol: 'AAPL',
        name: 'Apple Inc.',
        type: AssetType.STOCK,
        currency: 'USD',
        userId: 'test-user-id',
      });

      // Assert
      expect(externalMarketDataService.getPriceBySymbol).toHaveBeenCalledWith('AAPL');
      expect(basicPriceService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          currentPrice: 150.25,
          priceType: PriceType.EXTERNAL,
          priceSource: PriceSource.EXTERNAL_API,
        })
      );
      expect(result).toBe('test-global-asset-id');
    });

    it('should use default price when ExternalMarketDataService fails', async () => {
      // Arrange
      const mockGlobalAsset = {
        id: 'test-global-asset-id',
        symbol: 'HPG',
        name: 'Hoa Phat Group',
        type: AssetType.STOCK,
        nation: 'VN',
      } as GlobalAsset;

      jest.spyOn(externalMarketDataService, 'getPriceBySymbol').mockResolvedValue(null);
      jest.spyOn(basicPriceService, 'findByAssetId').mockResolvedValue(null);
      jest.spyOn(basicPriceService, 'create').mockResolvedValue({ id: 'test-price-id' });

      // Act
      const result = await service.syncAssetOnCreate({
        symbol: 'HPG',
        name: 'Hoa Phat Group',
        type: AssetType.STOCK,
        currency: 'VND',
        userId: 'test-user-id',
      });

      // Assert
      expect(externalMarketDataService.getPriceBySymbol).toHaveBeenCalledWith('HPG');
      expect(basicPriceService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          currentPrice: 1,
          priceType: PriceType.MANUAL,
          priceSource: PriceSource.USER_INPUT,
        })
      );
    });

    it('should use default price when ExternalMarketDataService fails', async () => {
      // Arrange
      const mockGlobalAsset = {
        id: 'test-global-asset-id',
        symbol: 'UNKNOWN',
        name: 'Unknown Asset',
        type: AssetType.STOCK,
        nation: 'US',
      } as GlobalAsset;

      jest.spyOn(externalMarketDataService, 'getPriceBySymbol').mockResolvedValue(null);
      jest.spyOn(basicPriceService, 'findByAssetId').mockResolvedValue(null);
      jest.spyOn(basicPriceService, 'create').mockResolvedValue({ id: 'test-price-id' });

      // Act
      const result = await service.syncAssetOnCreate({
        symbol: 'UNKNOWN',
        name: 'Unknown Asset',
        type: AssetType.STOCK,
        currency: 'USD',
        userId: 'test-user-id',
      });

      // Assert
      expect(externalMarketDataService.getPriceBySymbol).toHaveBeenCalledWith('UNKNOWN');
      expect(basicPriceService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          currentPrice: 1,
          priceType: PriceType.MANUAL,
          priceSource: PriceSource.USER_INPUT,
        })
      );
    });

    it('should handle different asset types correctly', async () => {
      // Arrange
      const testCases = [
        {
          symbol: 'VFF',
          type: 'FUND',
          source: 'fmarket.vn',
          expectedPrice: 15000,
        },
        {
          symbol: 'DOJI',
          type: 'GOLD',
          source: 'doji.vn',
          expectedPrice: 75000000,
        },
        {
          symbol: 'BTC',
          type: 'CRYPTO',
          source: 'coingecko.com',
          expectedPrice: 45000,
        },
      ];

      for (const testCase of testCases) {
        const mockPriceResult = {
          symbol: testCase.symbol,
          price: testCase.expectedPrice,
          type: testCase.type,
          source: testCase.source,
          success: true,
        };

        jest.spyOn(externalMarketDataService, 'getPriceBySymbol').mockResolvedValue(mockPriceResult);
        jest.spyOn(basicPriceService, 'findByAssetId').mockResolvedValue(null);
        jest.spyOn(basicPriceService, 'create').mockResolvedValue({ id: 'test-price-id' });

        // Act
        const result = await service.syncAssetOnCreate({
          symbol: testCase.symbol,
          name: `Test ${testCase.type}`,
          type: AssetType.STOCK, // Will be mapped correctly by the service
          currency: 'VND',
          userId: 'test-user-id',
        });

        // Assert
        expect(externalMarketDataService.getPriceBySymbol).toHaveBeenCalledWith(testCase.symbol);
        expect(basicPriceService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            currentPrice: testCase.expectedPrice,
            priceType: PriceType.EXTERNAL,
            priceSource: PriceSource.EXTERNAL_API,
          })
        );
      }
    });
  });
});
