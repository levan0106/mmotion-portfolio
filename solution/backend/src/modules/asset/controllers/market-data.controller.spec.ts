import { Test, TestingModule } from '@nestjs/testing';
import { MarketDataController } from './market-data.controller';
import { MarketDataService, PriceUpdateResult, MarketDataConfig, MarketDataProvider } from '../services/market-data.service';
import { NotFoundException } from '@nestjs/common';

describe('MarketDataController', () => {
  let controller: MarketDataController;
  let marketDataService: MarketDataService;

  const mockPriceUpdateResult: PriceUpdateResult = {
    assetId: 'asset-1',
    symbol: 'HPG',
    success: true,
    newPrice: 150000,
    timestamp: new Date(),
  };

  const mockConfig: MarketDataConfig = {
    providers: [
      {
        name: 'MockProvider',
        baseUrl: 'https://api.mockprovider.com',
        apiKey: 'mock-api-key',
        rateLimit: 100,
        isActive: true,
      },
    ],
    updateInterval: 15,
    retryAttempts: 3,
    timeout: 5000,
  };

  const mockProviders: MarketDataProvider[] = [
    {
      name: 'MockProvider',
      baseUrl: 'https://api.mockprovider.com',
      apiKey: 'mock-api-key',
      rateLimit: 100,
      isActive: true,
    },
  ];

  const mockStatistics = {
    totalUpdates: 100,
    successfulUpdates: 95,
    failedUpdates: 5,
    successRate: 95,
    averageUpdateTime: 1500,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarketDataController],
      providers: [
        {
          provide: MarketDataService,
          useValue: {
            updateAllPrices: jest.fn(),
            updateAssetPrice: jest.fn(),
            updatePricesByNation: jest.fn(),
            updatePricesByMarket: jest.fn(),
            getConfig: jest.fn(),
            updateConfig: jest.fn(),
            getProviders: jest.fn(),
            testProviderConnection: jest.fn(),
            getUpdateStatistics: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MarketDataController>(MarketDataController);
    marketDataService = module.get<MarketDataService>(MarketDataService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('updateAllPrices', () => {
    it('should update all asset prices', async () => {
      jest.spyOn(marketDataService, 'updateAllPrices').mockResolvedValue([mockPriceUpdateResult]);

      const result = await controller.updateAllPrices();

      expect(result).toEqual([mockPriceUpdateResult]);
      expect(marketDataService.updateAllPrices).toHaveBeenCalled();
    });
  });

  describe('updateAssetPrice', () => {
    const assetId = 'asset-1';

    it('should update price for specific asset', async () => {
      jest.spyOn(marketDataService, 'updateAssetPrice').mockResolvedValue(mockPriceUpdateResult);

      const result = await controller.updateAssetPrice(assetId);

      expect(result).toEqual(mockPriceUpdateResult);
      expect(marketDataService.updateAssetPrice).toHaveBeenCalledWith(assetId);
    });

    it('should throw NotFoundException when service throws NotFoundException', async () => {
      jest.spyOn(marketDataService, 'updateAssetPrice').mockRejectedValue(
        new NotFoundException('Asset not found'),
      );

      await expect(controller.updateAssetPrice(assetId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePricesByNation', () => {
    const nation = 'VN';

    it('should update prices for nation', async () => {
      jest.spyOn(marketDataService, 'updatePricesByNation').mockResolvedValue([mockPriceUpdateResult]);

      const result = await controller.updatePricesByNation(nation);

      expect(result).toEqual([mockPriceUpdateResult]);
      expect(marketDataService.updatePricesByNation).toHaveBeenCalledWith(nation);
    });
  });

  describe('updatePricesByMarket', () => {
    const marketCode = 'HOSE';

    it('should update prices for market', async () => {
      jest.spyOn(marketDataService, 'updatePricesByMarket').mockResolvedValue([mockPriceUpdateResult]);

      const result = await controller.updatePricesByMarket(marketCode);

      expect(result).toEqual([mockPriceUpdateResult]);
      expect(marketDataService.updatePricesByMarket).toHaveBeenCalledWith(marketCode);
    });
  });

  describe('getConfig', () => {
    it('should return market data configuration', async () => {
      jest.spyOn(marketDataService, 'getConfig').mockReturnValue(mockConfig);

      const result = await controller.getConfig();

      expect(result).toEqual(mockConfig);
      expect(marketDataService.getConfig).toHaveBeenCalled();
    });
  });

  describe('updateConfig', () => {
    const newConfig = {
      updateInterval: 30,
      retryAttempts: 5,
    };

    it('should update market data configuration', async () => {
      jest.spyOn(marketDataService, 'updateConfig').mockImplementation(() => {});

      const result = await controller.updateConfig(newConfig);

      expect(result).toEqual({ message: 'Market data configuration updated successfully' });
      expect(marketDataService.updateConfig).toHaveBeenCalledWith(newConfig);
    });
  });

  describe('getProviders', () => {
    it('should return list of providers', async () => {
      jest.spyOn(marketDataService, 'getProviders').mockReturnValue(mockProviders);

      const result = await controller.getProviders();

      expect(result).toEqual(mockProviders);
      expect(marketDataService.getProviders).toHaveBeenCalled();
    });
  });

  describe('testProviderConnection', () => {
    const providerName = 'MockProvider';

    it('should test connection successfully', async () => {
      jest.spyOn(marketDataService, 'testProviderConnection').mockResolvedValue(true);

      const result = await controller.testProviderConnection(providerName);

      expect(result).toEqual({
        providerName,
        connected: true,
        message: 'Connection successful',
      });
      expect(marketDataService.testProviderConnection).toHaveBeenCalledWith(providerName);
    });

    it('should handle connection failure', async () => {
      jest.spyOn(marketDataService, 'testProviderConnection').mockResolvedValue(false);

      const result = await controller.testProviderConnection(providerName);

      expect(result).toEqual({
        providerName,
        connected: false,
        message: 'Connection failed',
      });
    });

    it('should throw NotFoundException when service throws NotFoundException', async () => {
      jest.spyOn(marketDataService, 'testProviderConnection').mockRejectedValue(
        new NotFoundException('Provider not found'),
      );

      await expect(controller.testProviderConnection(providerName)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUpdateStatistics', () => {
    it('should return update statistics without date range', async () => {
      jest.spyOn(marketDataService, 'getUpdateStatistics').mockResolvedValue(mockStatistics);

      const result = await controller.getUpdateStatistics();

      expect(result).toEqual(mockStatistics);
      expect(marketDataService.getUpdateStatistics).toHaveBeenCalledWith(undefined, undefined);
    });

    it('should return update statistics with date range', async () => {
      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-01-31T23:59:59Z';
      jest.spyOn(marketDataService, 'getUpdateStatistics').mockResolvedValue(mockStatistics);

      const result = await controller.getUpdateStatistics(startDate, endDate);

      expect(result).toEqual(mockStatistics);
      expect(marketDataService.getUpdateStatistics).toHaveBeenCalledWith(
        new Date(startDate),
        new Date(endDate),
      );
    });
  });
});
