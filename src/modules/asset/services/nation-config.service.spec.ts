import { Test, TestingModule } from '@nestjs/testing';
import { NationConfigService } from './nation-config.service';
import { NationCode } from '../../../config/nation-config.interface';
import { AssetType } from '../enums/asset-type.enum';

describe('NationConfigService', () => {
  let service: NationConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NationConfigService],
    }).compile();

    service = module.get<NationConfigService>(NationConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNationConfig', () => {
    it('should return nation configuration for valid nation code', () => {
      const nationCode: NationCode = 'VN';
      const config = service.getNationConfig(nationCode);
      
      expect(config).toBeDefined();
      expect(config.name).toBe('Vietnam');
      expect(config.displayName).toBe('Việt Nam');
      expect(config.currency).toBe('VND');
      expect(config.timezone).toBe('Asia/Ho_Chi_Minh');
    });

    it('should throw error for invalid nation code', () => {
      const invalidNationCode = 'INVALID' as NationCode;
      
      expect(() => {
        service.getNationConfig(invalidNationCode);
      }).toThrow();
    });
  });

  describe('getAvailableNations', () => {
    it('should return array of available nation codes', () => {
      const nations = service.getAvailableNations();
      
      expect(Array.isArray(nations)).toBe(true);
      expect(nations.length).toBeGreaterThan(0);
      expect(nations).toContain('VN');
      expect(nations).toContain('US');
      expect(nations).toContain('UK');
    });
  });

  describe('getDefaultNationConfig', () => {
    it('should return default nation configuration', () => {
      const defaultConfig = service.getDefaultNationConfig();
      
      expect(defaultConfig).toBeDefined();
      expect(defaultConfig.name).toBe('Vietnam');
    });
  });

  describe('getNationDefaults', () => {
    it('should return default values for a nation', () => {
      const nationCode: NationCode = 'VN';
      const defaults = service.getNationDefaults(nationCode);
      
      expect(defaults).toBeDefined();
      expect(defaults.currency).toBe('VND');
      expect(defaults.timezone).toBe('Asia/Ho_Chi_Minh');
      expect(defaults.marketCode).toBe('HOSE');
      expect(defaults.priceSource).toBe('VNDIRECT');
    });
  });

  describe('getMarketCodes', () => {
    it('should return market codes for a nation', () => {
      const nationCode: NationCode = 'VN';
      const marketCodes = service.getMarketCodes(nationCode);
      
      expect(Array.isArray(marketCodes)).toBe(true);
      expect(marketCodes.length).toBeGreaterThan(0);
      expect(marketCodes).toContain('HOSE');
      expect(marketCodes).toContain('HNX');
      expect(marketCodes).toContain('UPCOM');
    });
  });

  describe('getPriceSources', () => {
    it('should return price sources for a nation', () => {
      const nationCode: NationCode = 'VN';
      const priceSources = service.getPriceSources(nationCode);
      
      expect(Array.isArray(priceSources)).toBe(true);
      expect(priceSources.length).toBeGreaterThan(0);
      expect(priceSources).toContain('VNDIRECT');
      expect(priceSources).toContain('CAFEF');
      expect(priceSources).toContain('VIETCOMBANK');
    });
  });

  describe('getAssetTypeConfig', () => {
    it('should return asset type configuration for a nation', () => {
      const nationCode: NationCode = 'VN';
      const assetType: AssetType = AssetType.STOCK;
      const config = service.getAssetTypeConfig(nationCode, assetType);
      
      expect(config).toBeDefined();
      expect(config.enabled).toBe(true);
      expect(config.defaultMarketCode).toBe('HOSE');
      expect(config.symbolPattern).toBe('^[A-Z0-9]{3,10}$');
    });
  });

  describe('isAssetTypeEnabled', () => {
    it('should return true for enabled asset type', () => {
      const nationCode: NationCode = 'VN';
      const assetType: AssetType = AssetType.STOCK;
      const isEnabled = service.isAssetTypeEnabled(nationCode, assetType);
      
      expect(isEnabled).toBe(true);
    });

    it('should return false for disabled asset type', () => {
      const nationCode: NationCode = 'VN';
      const assetType: AssetType = 'INVALID' as AssetType;
      const isEnabled = service.isAssetTypeEnabled(nationCode, assetType);
      
      expect(isEnabled).toBe(false);
    });
  });

  describe('validateSymbolFormat', () => {
    it('should return true for valid symbol format', () => {
      const nationCode: NationCode = 'VN';
      const assetType: AssetType = AssetType.STOCK;
      const symbol = 'HPG';
      const isValid = service.validateSymbolFormat(nationCode, assetType, symbol);
      
      expect(isValid).toBe(true);
    });

    it('should return false for invalid symbol format', () => {
      const nationCode: NationCode = 'VN';
      const assetType: AssetType = AssetType.STOCK;
      const symbol = 'invalid-symbol!';
      const isValid = service.validateSymbolFormat(nationCode, assetType, symbol);
      
      expect(isValid).toBe(false);
    });
  });

  describe('getTradingHours', () => {
    it('should return trading hours for a nation', () => {
      const nationCode: NationCode = 'VN';
      const tradingHours = service.getTradingHours(nationCode);
      
      expect(tradingHours).toBeDefined();
      expect(tradingHours.timezone).toBe('Asia/Ho_Chi_Minh');
      expect(Array.isArray(tradingHours.sessions)).toBe(true);
      expect(tradingHours.sessions.length).toBeGreaterThan(0);
    });
  });

  describe('isInTradingHours', () => {
    it('should return boolean for trading hours check', () => {
      const nationCode: NationCode = 'VN';
      const isInTrading = service.isInTradingHours(nationCode);
      
      expect(typeof isInTrading).toBe('boolean');
    });
  });

  describe('getDefaultMarketCode', () => {
    it('should return default market code for asset type', () => {
      const nationCode: NationCode = 'VN';
      const assetType: AssetType = AssetType.STOCK;
      const marketCode = service.getDefaultMarketCode(nationCode);
      
      expect(marketCode).toBe('HOSE');
    });
  });

  describe('getDefaultPriceSource', () => {
    it('should return default price source for nation', () => {
      const nationCode: NationCode = 'VN';
      const priceSource = service.getDefaultPriceSource(nationCode);
      
      expect(priceSource).toBe('VNDIRECT');
    });
  });

  describe('getCurrency', () => {
    it('should return currency for nation', () => {
      const nationCode: NationCode = 'VN';
      const currency = service.getCurrency(nationCode);
      
      expect(currency).toBe('VND');
    });
  });

  describe('getTimezone', () => {
    it('should return timezone for nation', () => {
      const nationCode: NationCode = 'VN';
      const timezone = service.getTimezone(nationCode);
      
      expect(timezone).toBe('Asia/Ho_Chi_Minh');
    });
  });

  describe('clearCache', () => {
    it('should clear configuration cache', () => {
      // Load some data to populate cache
      service.getNationConfig('VN');
      service.getAvailableNations();
      
      const statsBefore = service.getCacheStats();
      expect(statsBefore.size).toBeGreaterThan(0);
      
      service.clearCache();
      
      const statsAfter = service.getCacheStats();
      expect(statsAfter.size).toBe(0);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      const stats = service.getCacheStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats.size).toBe('number');
      expect(Array.isArray(stats.keys)).toBe(true);
    });
  });

  describe('isValidNationCode', () => {
    it('should return true for valid nation code', () => {
      const isValid = service.isValidNationCode('VN');
      expect(isValid).toBe(true);
    });

    it('should return false for invalid nation code', () => {
      const isValid = service.isValidNationCode('INVALID');
      expect(isValid).toBe(false);
    });
  });

  describe('getNationDisplayName', () => {
    it('should return display name for nation', () => {
      const nationCode: NationCode = 'VN';
      const displayName = service.getNationDisplayName(nationCode);
      
      expect(displayName).toBe('Việt Nam');
    });
  });

  describe('getMarketCodeDisplayName', () => {
    it('should return display name for market code', () => {
      const nationCode: NationCode = 'VN';
      const marketCode = 'HOSE';
      const displayName = service.getMarketCodeDisplayName(nationCode, marketCode);
      
      expect(displayName).toBe('Sàn giao dịch chứng khoán TP.HCM');
    });
  });

  describe('getPriceSourceDisplayName', () => {
    it('should return display name for price source', () => {
      const nationCode: NationCode = 'VN';
      const priceSource = 'VNDIRECT';
      const displayName = service.getPriceSourceDisplayName(nationCode, priceSource);
      
      expect(displayName).toBe('VnDirect');
    });
  });
});
