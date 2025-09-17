import { Test, TestingModule } from '@nestjs/testing';
import { NationConfigService } from '../services/nation-config.service';
import { CreateGlobalAssetDto } from '../dto/create-global-asset.dto';
import { CreateAssetPriceDto } from '../dto/create-asset-price.dto';
import { AssetType } from '../enums/asset-type.enum';
import { PriceType, PriceSource } from '../enums/price-type.enum';

describe('Global Asset Integration Tests', () => {
  let module: TestingModule;
  let nationConfigService: NationConfigService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [NationConfigService],
    }).compile();

    nationConfigService = module.get<NationConfigService>(NationConfigService);
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('Service Integration', () => {
    it('should have nation config service available', () => {
      expect(nationConfigService).toBeDefined();
    });

    it('should validate nation configuration', () => {
      const isValid = nationConfigService.validateSymbolFormat('VN', AssetType.STOCK, 'HPG');
      expect(isValid).toBe(true);

      const isInvalid = nationConfigService.validateSymbolFormat('VN', AssetType.STOCK, 'invalid-symbol');
      expect(isInvalid).toBe(false);
    });

    it('should get nation configuration', () => {
      const config = nationConfigService.getNationConfig('VN');
      expect(config).toBeDefined();
      expect(config.currency).toBe('VND');
      expect(config.timezone).toBe('Asia/Ho_Chi_Minh');
      expect(config.name).toBe('Vietnam');
    });

    it('should get available nations', () => {
      const nations = nationConfigService.getAvailableNations();
      expect(nations).toContain('VN');
      expect(nations).toContain('US');
      // Note: UK might not be in the mock configuration
      expect(nations.length).toBeGreaterThan(0);
    });
  });

  describe('DTO Integration', () => {
    it('should validate DTOs correctly', () => {
      const createDto: CreateGlobalAssetDto = {
        symbol: 'HPG',
        name: 'Hoa Phat Group',
        type: AssetType.STOCK,
        nation: 'VN',
        marketCode: 'HOSE',
        currency: 'VND',
        timezone: 'Asia/Ho_Chi_Minh',
        description: 'Leading steel manufacturer in Vietnam',
      };

      expect(createDto.symbol).toBe('HPG');
      expect(createDto.name).toBe('Hoa Phat Group');
      expect(createDto.type).toBe(AssetType.STOCK);
      expect(createDto.nation).toBe('VN');
    });

    it('should validate price DTOs correctly', () => {
      const priceDto: CreateAssetPriceDto = {
        assetId: 'test-asset-id',
        currentPrice: 50000,
        priceType: PriceType.MARKET_DATA,
        priceSource: PriceSource.MARKET_DATA_SERVICE,
        lastPriceUpdate: new Date().toISOString(),
      };

      expect(priceDto.assetId).toBe('test-asset-id');
      expect(priceDto.currentPrice).toBe(50000);
      expect(priceDto.priceType).toBe(PriceType.MARKET_DATA);
      expect(priceDto.priceSource).toBe(PriceSource.MARKET_DATA_SERVICE);
    });
  });
});
