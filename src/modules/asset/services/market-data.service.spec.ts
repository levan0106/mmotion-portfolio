import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketDataService, PriceUpdateResult, MarketDataProvider } from './market-data.service';
import { GlobalAsset } from '../entities/global-asset.entity';
import { AssetPrice } from '../entities/asset-price.entity';
import { AssetPriceHistory } from '../entities/asset-price-history.entity';
import { LoggingService } from '../../logging/services/logging.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('MarketDataService', () => {
  let service: MarketDataService;
  let globalAssetRepository: Repository<GlobalAsset>;
  let assetPriceRepository: Repository<AssetPrice>;
  let priceHistoryRepository: Repository<AssetPriceHistory>;
  let loggingService: LoggingService;

  const mockAsset: GlobalAsset = {
    id: 'asset-1',
    symbol: 'HPG',
    name: 'Hoa Phat Group',
    type: 'STOCK',
    nation: 'VN',
    marketCode: 'HOSE',
    currency: 'VND',
    timezone: 'Asia/Ho_Chi_Minh',
    isActive: true,
    description: 'Test asset',
    createdAt: new Date(),
    updatedAt: new Date(),
    trades: [],
    assetPrice: null,
    priceHistory: [],
    getGlobalIdentifier: jest.fn().mockReturnValue('HPG-VN'),
    getDisplayName: jest.fn().mockReturnValue('Hoa Phat Group'),
    getMarketDisplayName: jest.fn().mockReturnValue('HOSE'),
    hasTrades: jest.fn().mockReturnValue(false),
    isActiveAsset: jest.fn().mockReturnValue(true),
    getFormattedPrice: jest.fn().mockReturnValue('150,000 VND'),
    getPriceAgeHours: jest.fn().mockReturnValue(1),
    getPriceAgeDays: jest.fn().mockReturnValue(0),
    needsUpdating: jest.fn().mockReturnValue(false),
  } as any;

  const mockAssetPrice: AssetPrice = {
    id: 'price-1',
    assetId: 'asset-1',
    currentPrice: 150000,
    priceType: 'MARKET_DATA',
    priceSource: 'MARKET_DATA_SERVICE',
    lastPriceUpdate: new Date(),
    globalAsset: mockAsset,
    isFromMarketData: jest.fn().mockReturnValue(true),
    isManual: jest.fn().mockReturnValue(false),
    getPriceSourceDisplayName: jest.fn().mockReturnValue('Market Data Service'),
    getPriceTypeDisplayName: jest.fn().mockReturnValue('Market Data'),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketDataService,
        {
          provide: getRepositoryToken(GlobalAsset),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AssetPrice),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AssetPriceHistory),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getCount: jest.fn(),
            })),
          },
        },
        {
          provide: LoggingService,
          useValue: {
            logBusinessEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MarketDataService>(MarketDataService);
    globalAssetRepository = module.get<Repository<GlobalAsset>>(getRepositoryToken(GlobalAsset));
    assetPriceRepository = module.get<Repository<AssetPrice>>(getRepositoryToken(AssetPrice));
    priceHistoryRepository = module.get<Repository<AssetPriceHistory>>(getRepositoryToken(AssetPriceHistory));
    loggingService = module.get<LoggingService>(LoggingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateAllPrices', () => {
    it('should update prices for all active assets', async () => {
      const activeAssets = [mockAsset];
      jest.spyOn(globalAssetRepository, 'find').mockResolvedValue(activeAssets);
      jest.spyOn(service, 'updateAssetPrice').mockResolvedValue({
        assetId: 'asset-1',
        symbol: 'HPG',
        success: true,
        newPrice: 150000,
        timestamp: new Date(),
      });
      jest.spyOn(loggingService, 'logBusinessEvent').mockResolvedValue(undefined);

      const results = await service.updateAllPrices();

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(globalAssetRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        relations: ['assetPrice'],
      });
      expect(loggingService.logBusinessEvent).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const activeAssets = [mockAsset];
      jest.spyOn(globalAssetRepository, 'find').mockResolvedValue(activeAssets);
      jest.spyOn(service, 'updateAssetPrice').mockRejectedValue(new Error('Update failed'));

      const results = await service.updateAllPrices();

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('Update failed');
    });
  });

  describe('updateAssetPrice', () => {
    it('should update price for existing asset', async () => {
      const assetWithPrice = { ...mockAsset, assetPrice: mockAssetPrice } as any;
      jest.spyOn(globalAssetRepository, 'findOne').mockResolvedValue(assetWithPrice);
      jest.spyOn(assetPriceRepository, 'save').mockResolvedValue(mockAssetPrice);
      jest.spyOn(priceHistoryRepository, 'create').mockReturnValue({} as any);
      jest.spyOn(priceHistoryRepository, 'save').mockResolvedValue({} as any);
      jest.spyOn(loggingService, 'logBusinessEvent').mockResolvedValue(undefined);

      const result = await service.updateAssetPrice('asset-1');

      expect(result.success).toBe(true);
      expect(result.assetId).toBe('asset-1');
      expect(result.symbol).toBe('HPG');
      expect(globalAssetRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'asset-1' },
        relations: ['assetPrice'],
      });
    });

    it('should create new price for asset without existing price', async () => {
      jest.spyOn(globalAssetRepository, 'findOne').mockResolvedValue(mockAsset);
      jest.spyOn(assetPriceRepository, 'create').mockReturnValue(mockAssetPrice);
      jest.spyOn(assetPriceRepository, 'save').mockResolvedValue(mockAssetPrice);
      jest.spyOn(priceHistoryRepository, 'create').mockReturnValue({} as any);
      jest.spyOn(priceHistoryRepository, 'save').mockResolvedValue({} as any);
      jest.spyOn(loggingService, 'logBusinessEvent').mockResolvedValue(undefined);

      const result = await service.updateAssetPrice('asset-1');

      expect(result.success).toBe(true);
      expect(assetPriceRepository.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when asset not found', async () => {
      jest.spyOn(globalAssetRepository, 'findOne').mockResolvedValue(null);

      await expect(service.updateAssetPrice('asset-1')).rejects.toThrow(NotFoundException);
    });

    it('should handle invalid price from provider', async () => {
      jest.spyOn(globalAssetRepository, 'findOne').mockResolvedValue(mockAsset);
      jest.spyOn(service as any, 'fetchPriceFromProvider').mockResolvedValue(-100);

      const result = await service.updateAssetPrice('asset-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid price');
    });
  });

  describe('updatePricesByNation', () => {
    it('should update prices for assets in specific nation', async () => {
      const assets = [mockAsset];
      jest.spyOn(globalAssetRepository, 'find').mockResolvedValue(assets);
      jest.spyOn(service, 'updateAssetPrice').mockResolvedValue({
        assetId: 'asset-1',
        symbol: 'HPG',
        success: true,
        newPrice: 150000,
        timestamp: new Date(),
      });

      const results = await service.updatePricesByNation('VN');

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(globalAssetRepository.find).toHaveBeenCalledWith({
        where: { nation: 'VN', isActive: true },
        relations: ['assetPrice'],
      });
    });
  });

  describe('updatePricesByMarket', () => {
    it('should update prices for assets in specific market', async () => {
      const assets = [mockAsset];
      jest.spyOn(globalAssetRepository, 'find').mockResolvedValue(assets);
      jest.spyOn(service, 'updateAssetPrice').mockResolvedValue({
        assetId: 'asset-1',
        symbol: 'HPG',
        success: true,
        newPrice: 150000,
        timestamp: new Date(),
      });

      const results = await service.updatePricesByMarket('HOSE');

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(globalAssetRepository.find).toHaveBeenCalledWith({
        where: { marketCode: 'HOSE', isActive: true },
        relations: ['assetPrice'],
      });
    });
  });

  describe('getConfig', () => {
    it('should return market data configuration', () => {
      const config = service.getConfig();

      expect(config).toBeDefined();
      expect(config.providers).toHaveLength(1);
      expect(config.providers[0].name).toBe('MockProvider');
      expect(config.updateInterval).toBe(15);
      expect(config.retryAttempts).toBe(3);
      expect(config.timeout).toBe(5000);
    });
  });

  describe('updateConfig', () => {
    it('should update market data configuration', () => {
      const newConfig = {
        updateInterval: 30,
        retryAttempts: 5,
      };

      service.updateConfig(newConfig);

      const config = service.getConfig();
      expect(config.updateInterval).toBe(30);
      expect(config.retryAttempts).toBe(5);
    });
  });

  describe('getProviders', () => {
    it('should return list of providers', () => {
      const providers = service.getProviders();

      expect(providers).toHaveLength(1);
      expect(providers[0].name).toBe('MockProvider');
      expect(providers[0].isActive).toBe(true);
    });
  });

  describe('testProviderConnection', () => {
    it('should test connection to provider successfully', async () => {
      const result = await service.testProviderConnection('MockProvider');

      expect(result).toBe(true);
    });

    it('should throw NotFoundException for unknown provider', async () => {
      await expect(service.testProviderConnection('UnknownProvider')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUpdateStatistics', () => {
    it('should return update statistics', async () => {
      jest.spyOn(priceHistoryRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(100),
      } as any);

      const stats = await service.getUpdateStatistics();

      expect(stats.totalUpdates).toBe(100);
      expect(stats.successfulUpdates).toBe(95);
      expect(stats.failedUpdates).toBe(5);
      expect(stats.successRate).toBe(95);
      expect(stats.averageUpdateTime).toBe(1500);
    });

    it('should filter by date range when provided', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(50),
      };
      jest.spyOn(priceHistoryRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      await service.getUpdateStatistics(startDate, endDate);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'history.createdAt >= :startDate',
        { startDate }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'history.createdAt <= :endDate',
        { endDate }
      );
    });
  });
});
