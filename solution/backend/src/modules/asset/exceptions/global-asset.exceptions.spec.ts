import { GlobalAssetException } from './global-asset.exceptions';
import { GlobalAssetNotFoundException } from './global-asset.exceptions';
import { GlobalAssetAlreadyExistsException } from './global-asset.exceptions';
import { GlobalAssetCannotBeModifiedException } from './global-asset.exceptions';
import { InvalidSymbolFormatException } from './global-asset.exceptions';
import { InvalidNationCodeException } from './global-asset.exceptions';
import { InvalidMarketCodeException } from './global-asset.exceptions';
import { InvalidCurrencyCodeException } from './global-asset.exceptions';
import { InvalidTimezoneException } from './global-asset.exceptions';
import { InvalidAssetTypeException } from './global-asset.exceptions';
import { NationConfigNotFoundException } from './global-asset.exceptions';
import { AssetTypeNotEnabledException } from './global-asset.exceptions';

describe('Global Asset Exceptions', () => {
  describe('GlobalAssetException', () => {
    it('should create exception with default status', () => {
      const exception = new GlobalAssetException('Test message');
      expect(exception.message).toBe('Test message');
      expect(exception.getStatus()).toBe(500);
    });

    it('should create exception with custom status', () => {
      const exception = new GlobalAssetException('Test message', 400);
      expect(exception.message).toBe('Test message');
      expect(exception.getStatus()).toBe(400);
    });
  });

  describe('GlobalAssetNotFoundException', () => {
    it('should create exception with asset ID', () => {
      const assetId = 'test-asset-id';
      const exception = new GlobalAssetNotFoundException(assetId);
      expect(exception.message).toBe(`Global asset with ID ${assetId} not found`);
      expect(exception.getStatus()).toBe(404);
    });
  });

  describe('GlobalAssetAlreadyExistsException', () => {
    it('should create exception with symbol and nation', () => {
      const symbol = 'HPG';
      const nation = 'VN';
      const exception = new GlobalAssetAlreadyExistsException(symbol, nation);
      expect(exception.message).toBe(`Asset with symbol ${symbol} and nation ${nation} already exists`);
      expect(exception.getStatus()).toBe(409);
    });
  });

  describe('GlobalAssetCannotBeModifiedException', () => {
    it('should create exception with asset ID', () => {
      const assetId = 'test-asset-id';
      const exception = new GlobalAssetCannotBeModifiedException(assetId);
      expect(exception.message).toBe(`Asset with ID ${assetId} cannot be modified as it has associated trades`);
      expect(exception.getStatus()).toBe(400);
    });
  });

  describe('InvalidSymbolFormatException', () => {
    it('should create exception with symbol, nation, and asset type', () => {
      const symbol = 'invalid-symbol';
      const nation = 'VN';
      const assetType = 'STOCK';
      const exception = new InvalidSymbolFormatException(symbol, nation, assetType);
      expect(exception.message).toBe(`Invalid symbol format for ${assetType} in ${nation}: ${symbol}`);
      expect(exception.getStatus()).toBe(400);
    });
  });

  describe('InvalidNationCodeException', () => {
    it('should create exception with nation code', () => {
      const nation = 'INVALID';
      const exception = new InvalidNationCodeException(nation);
      expect(exception.message).toBe(`Invalid nation code: ${nation}. Must be 2-letter ISO country code`);
      expect(exception.getStatus()).toBe(400);
    });
  });

  describe('InvalidMarketCodeException', () => {
    it('should create exception with market code', () => {
      const marketCode = 'invalid-market';
      const exception = new InvalidMarketCodeException(marketCode);
      expect(exception.message).toBe(`Invalid market code: ${marketCode}. Must be uppercase alphanumeric with dashes`);
      expect(exception.getStatus()).toBe(400);
    });
  });

  describe('InvalidCurrencyCodeException', () => {
    it('should create exception with currency code', () => {
      const currency = 'INVALID';
      const exception = new InvalidCurrencyCodeException(currency);
      expect(exception.message).toBe(`Invalid currency code: ${currency}. Must be 3-letter ISO currency code`);
      expect(exception.getStatus()).toBe(400);
    });
  });

  describe('InvalidTimezoneException', () => {
    it('should create exception with timezone', () => {
      const timezone = 'Invalid/Timezone';
      const exception = new InvalidTimezoneException(timezone);
      expect(exception.message).toBe(`Invalid timezone: ${timezone}. Must follow IANA timezone format`);
      expect(exception.getStatus()).toBe(400);
    });
  });

  describe('InvalidAssetTypeException', () => {
    it('should create exception with asset type', () => {
      const assetType = 'INVALID';
      const exception = new InvalidAssetTypeException(assetType);
      expect(exception.message).toBe(`Invalid asset type: ${assetType}. Must be one of: STOCK, BOND, GOLD, DEPOSIT, CASH`);
      expect(exception.getStatus()).toBe(400);
    });
  });

  describe('NationConfigNotFoundException', () => {
    it('should create exception with nation code', () => {
      const nation = 'INVALID';
      const exception = new NationConfigNotFoundException(nation);
      expect(exception.message).toBe(`Nation configuration not found for code: ${nation}`);
      expect(exception.getStatus()).toBe(404);
    });
  });

  describe('AssetTypeNotEnabledException', () => {
    it('should create exception with asset type and nation', () => {
      const assetType = 'STOCK';
      const nation = 'INVALID';
      const exception = new AssetTypeNotEnabledException(assetType, nation);
      expect(exception.message).toBe(`Asset type ${assetType} is not enabled for nation ${nation}`);
      expect(exception.getStatus()).toBe(400);
    });
  });
});
