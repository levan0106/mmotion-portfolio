import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetGlobalSyncService } from './asset-global-sync.service';
import { Asset } from '../entities/asset.entity';
import { GlobalAsset } from '../entities/global-asset.entity';
import { NationConfigService } from './nation-config.service';
import { BasicPriceService } from './basic-price.service';
import { MarketDataService } from '../../market-data/services/market-data.service';
import { AssetType } from '../enums/asset-type.enum';
import { PriceType, PriceSource } from '../enums/price-type.enum';

describe('AssetGlobalSyncService - Price Logic', () => {
  let service: AssetGlobalSyncService;
  let globalAssetRepository: Repository<GlobalAsset>;
  let assetRepository: Repository<Asset>;
  let basicPriceService: BasicPriceService;
  let marketDataService: MarketDataService;
  let nationConfigService: NationConfigService;

  const mockGlobalAssetRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockAssetRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockBasicPriceService = {
    findByAssetId: jest.fn(),
    create: jest.fn(),
  };

  const mockMarketDataService = {
    getCurrentPrice: jest.fn(),
  };

  const mockNationConfigService = {
    getNationConfig: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetGlobalSyncService,
        {
          provide: getRepositoryToken(GlobalAsset),
          useValue: mockGlobalAssetRepository,
        },
        {
          provide: getRepositoryToken(Asset),
          useValue: mockAssetRepository,
        },
        {
          provide: BasicPriceService,
          useValue: mockBasicPriceService,
        },
        {
          provide: MarketDataService,
          useValue: mockMarketDataService,
        },
        {
          provide: NationConfigService,
          useValue: mockNationConfigService,
        },
      ],
    }).compile();

    service = module.get<AssetGlobalSyncService>(AssetGlobalSyncService);
    globalAssetRepository = module.get<Repository<GlobalAsset>>(getRepositoryToken(GlobalAsset));
    assetRepository = module.get<Repository<Asset>>(getRepositoryToken(Asset));
    basicPriceService = module.get<BasicPriceService>(BasicPriceService);
    marketDataService = module.get<MarketDataService>(MarketDataService);
    nationConfigService = module.get<NationConfigService>(NationConfigService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createInitialMarketPrice', () => {
    const mockGlobalAsset: GlobalAsset = {
      id: 'test-asset-id',
      symbol: 'HPG',
      name: 'Hoa Phat Group',
      type: AssetType.STOCK,
      nation: 'VN',
      marketCode: 'HOSE',
      currency: 'VND',
      timezone: 'Asia/Ho_Chi_Minh',
      isActive: true,
      description: 'Test asset',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as GlobalAsset;

    it('should use market price when available', async () => {
      // Arrange
      const expectedMarketPrice = 50000;
      mockBasicPriceService.findByAssetId.mockResolvedValue(null);
      mockGlobalAssetRepository.findOne.mockResolvedValue(mockGlobalAsset);
      mockMarketDataService.getCurrentPrice.mockResolvedValue(expectedMarketPrice);
      mockBasicPriceService.create.mockResolvedValue({ id: 'price-id' });

      // Act
      const result = await (service as any).createInitialMarketPrice('test-asset-id', 'user-id');

      // Assert
      expect(mockMarketDataService.getCurrentPrice).toHaveBeenCalledWith('HPG');
      expect(mockBasicPriceService.create).toHaveBeenCalledWith({
        assetId: 'test-asset-id',
        currentPrice: expectedMarketPrice,
        priceType: PriceType.EXTERNAL,
        priceSource: PriceSource.EXTERNAL_API,
        lastPriceUpdate: expect.any(String),
        metadata: {
          created_by: 'user-id',
          is_initial: true,
          note: 'Initial price fetched from market data',
          market_source: 'external_api',
          fetched_at: expect.any(String),
        },
      });
      expect(result).toBe('price-id');
    });

    it('should fallback to default price when no market data available', async () => {
      // Arrange
      mockBasicPriceService.findByAssetId.mockResolvedValue(null);
      mockGlobalAssetRepository.findOne.mockResolvedValue(mockGlobalAsset);
      mockMarketDataService.getCurrentPrice.mockResolvedValue(null);
      mockNationConfigService.getNationConfig.mockReturnValue({
        priceSources: [
          { code: 'VNDIRECT', enabled: true },
          { code: 'CAFEF', enabled: true },
        ],
      });
      mockBasicPriceService.create.mockResolvedValue({ id: 'price-id' });

      // Act
      const result = await (service as any).createInitialMarketPrice('test-asset-id', 'user-id');

      // Assert
      expect(mockMarketDataService.getCurrentPrice).toHaveBeenCalledWith('HPG');
      expect(mockBasicPriceService.create).toHaveBeenCalledWith({
        assetId: 'test-asset-id',
        currentPrice: 1,
        priceType: PriceType.MANUAL,
        priceSource: PriceSource.USER_INPUT,
        lastPriceUpdate: expect.any(String),
        metadata: {
          created_by: 'user-id',
          is_initial: true,
          note: 'Initial price set to default (no market data available)',
          market_data_attempted: true,
          market_data_available: false,
        },
      });
      expect(result).toBe('price-id');
    });

    it('should skip creation if price already exists', async () => {
      // Arrange
      const existingPrice = { id: 'existing-price-id' };
      mockBasicPriceService.findByAssetId.mockResolvedValue(existingPrice);

      // Act
      const result = await (service as any).createInitialMarketPrice('test-asset-id', 'user-id');

      // Assert
      expect(mockBasicPriceService.create).not.toHaveBeenCalled();
      expect(result).toBe('existing-price-id');
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      mockBasicPriceService.findByAssetId.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await (service as any).createInitialMarketPrice('test-asset-id', 'user-id');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('fetchMarketPriceForAsset', () => {
    const mockGlobalAsset: GlobalAsset = {
      id: 'test-asset-id',
      symbol: 'HPG',
      name: 'Hoa Phat Group',
      type: AssetType.STOCK,
      nation: 'VN',
      marketCode: 'HOSE',
      currency: 'VND',
      timezone: 'Asia/Ho_Chi_Minh',
      isActive: true,
      description: 'Test asset',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as GlobalAsset;

    it('should return market price from MarketDataService', async () => {
      // Arrange
      const expectedPrice = 50000;
      mockMarketDataService.getCurrentPrice.mockResolvedValue(expectedPrice);

      // Act
      const result = await (service as any).fetchMarketPriceForAsset(mockGlobalAsset);

      // Assert
      expect(result).toBe(expectedPrice);
      expect(mockMarketDataService.getCurrentPrice).toHaveBeenCalledWith('HPG');
    });

    it('should try nation-specific sources when MarketDataService fails', async () => {
      // Arrange
      mockMarketDataService.getCurrentPrice.mockResolvedValue(null);
      mockNationConfigService.getNationConfig.mockReturnValue({
        priceSources: [
          { code: 'VNDIRECT', enabled: true },
          { code: 'CAFEF', enabled: true },
        ],
      });

      // Act
      const result = await (service as any).fetchMarketPriceForAsset(mockGlobalAsset);

      // Assert
      expect(mockMarketDataService.getCurrentPrice).toHaveBeenCalledWith('HPG');
      expect(mockNationConfigService.getNationConfig).toHaveBeenCalledWith('VN');
      // Note: The actual price fetching from sources is simulated in the real implementation
    });

    it('should return null when no price sources are available', async () => {
      // Arrange
      mockMarketDataService.getCurrentPrice.mockResolvedValue(null);
      mockNationConfigService.getNationConfig.mockReturnValue(null);

      // Act
      const result = await (service as any).fetchMarketPriceForAsset(mockGlobalAsset);

      // Assert
      expect(result).toBeNull();
    });
  });
});
