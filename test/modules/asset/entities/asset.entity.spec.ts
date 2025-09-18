import { Asset } from '../../../../src/modules/asset/entities/asset.entity';
import { AssetType } from '../../../../src/modules/asset/enums/asset-type.enum';
import { Trade } from '../../../../src/modules/trading/entities/trade.entity';
// PortfolioAsset entity has been removed - Portfolio is now linked to Assets through Trades only

describe('Asset Entity', () => {
  let asset: Asset;

  beforeEach(() => {
    asset = new Asset();
    asset.id = 'test-asset-id';
    // portfolioId property has been removed - Asset no longer directly belongs to portfolio
    asset.name = 'Test Asset';
    asset.symbol = 'TEST'; // Updated to use symbol field instead of code
    asset.type = AssetType.STOCK;
    asset.description = 'Test asset description';
    asset.initialValue = 1000000;
    asset.initialQuantity = 100;
    // currentValue removed - calculated real-time
    asset.currentQuantity = 100;
    asset.createdBy = 'test-user-id';
    asset.updatedBy = 'test-user-id';
    asset.createdAt = new Date('2024-01-01');
    asset.updatedAt = new Date('2024-01-01');
  });

  describe('Constructor and Basic Properties', () => {
    it('should create an asset instance', () => {
      expect(asset).toBeInstanceOf(Asset);
    });

    it('should have all required properties', () => {
      expect(asset.id).toBe('test-asset-id');
      // portfolioId property has been removed - Asset no longer directly belongs to portfolio
      expect(asset.name).toBe('Test Asset');
      expect(asset.symbol).toBe('TEST'); // Updated to use symbol field instead of code
      expect(asset.type).toBe(AssetType.STOCK);
      expect(asset.description).toBe('Test asset description');
      expect(asset.initialValue).toBe(1000000);
      expect(asset.initialQuantity).toBe(100);
      // currentValue removed - calculated real-time
      expect(asset.currentQuantity).toBe(100);
      expect(asset.createdBy).toBe('test-user-id');
      expect(asset.updatedBy).toBe('test-user-id');
    });

    it('should have optional properties', () => {
      expect(asset.symbol).toBeDefined(); // Symbol is now required
      expect(asset.description).toBeDefined();
      // currentValue removed - calculated real-time
      expect(asset.currentQuantity).toBeDefined();
    });
  });

  // getTotalValue method removed - currentValue calculated real-time

  describe('getTotalQuantity', () => {
    it('should return current quantity when available', () => {
      const totalQuantity = asset.getTotalQuantity();
      expect(totalQuantity).toBe(100);
    });

    it('should return initial quantity when current quantity is not set', () => {
      asset.currentQuantity = undefined;
      const totalQuantity = asset.getTotalQuantity();
      expect(totalQuantity).toBe(100);
    });

    it('should return initial quantity when current quantity is null', () => {
      asset.currentQuantity = null;
      const totalQuantity = asset.getTotalQuantity();
      expect(totalQuantity).toBe(100);
    });
  });

  describe('hasTrades', () => {
    it('should return false when trades array is undefined', () => {
      asset.trades = undefined;
      expect(asset.hasTrades()).toBe(false);
    });

    it('should return false when trades array is empty', () => {
      asset.trades = [];
      expect(asset.hasTrades()).toBe(false);
    });

    it('should return true when trades array has items', () => {
      asset.trades = [{} as Trade, {} as Trade];
      expect(asset.hasTrades()).toBe(true);
    });
  });

  describe('getDisplayName', () => {
    it('should return name with symbol when symbol is available', () => {
      const displayName = asset.getDisplayName();
      expect(displayName).toBe('Test Asset (TEST)');
    });

    it('should return only name when symbol is not available', () => {
      asset.symbol = undefined;
      const displayName = asset.getDisplayName();
      expect(displayName).toBe('Test Asset');
    });

    it('should return only name when symbol is null', () => {
      asset.symbol = null;
      const displayName = asset.getDisplayName();
      expect(displayName).toBe('Test Asset');
    });

    it('should return only name when symbol is empty string', () => {
      asset.symbol = '';
      const displayName = asset.getDisplayName();
      expect(displayName).toBe('Test Asset');
    });
  });

  describe('toJSON', () => {
    it('should include all properties in JSON output', () => {
      const json = asset.toJSON();
      
      expect(json.id).toBe(asset.id);
      // portfolioId property has been removed - Asset no longer directly belongs to portfolio
      expect(json.name).toBe(asset.name);
      expect(json.symbol).toBe(asset.symbol); // Updated to use symbol field instead of code
      expect(json.type).toBe(asset.type);
      expect(json.description).toBe(asset.description);
      expect(json.initialValue).toBe(asset.initialValue);
      expect(json.initialQuantity).toBe(asset.initialQuantity);
      // currentValue removed - calculated real-time
      expect(json.currentQuantity).toBe(asset.currentQuantity);
      expect(json.createdBy).toBe(asset.createdBy);
      expect(json.updatedBy).toBe(asset.updatedBy);
      expect(json.createdAt).toBe(asset.createdAt);
      expect(json.updatedAt).toBe(asset.updatedAt);
    });

    it('should include computed properties in JSON output', () => {
      const json = asset.toJSON();
      
      // totalValue removed - calculated real-time
      expect(json.totalQuantity).toBe(asset.getTotalQuantity());
      expect(json.hasTrades).toBe(asset.hasTrades());
      expect(json.displayName).toBe(asset.getDisplayName());
      expect(json.canModifySymbol).toBe(asset.canModifySymbol());
      expect(json.primaryIdentifier).toBe(asset.getPrimaryIdentifier());
    });

    it('should handle undefined current values in JSON output', () => {
      // currentValue removed - calculated real-time
      asset.currentQuantity = undefined;
      asset.trades = undefined;
      
      const json = asset.toJSON();
      
      // totalValue removed - calculated real-time
      expect(json.totalQuantity).toBe(asset.initialQuantity);
      expect(json.hasTrades).toBe(false);
    });
  });

  describe('Asset Type Validation', () => {
    it('should accept valid asset types', () => {
      const validTypes = [
        AssetType.STOCK,
        AssetType.BOND,
        AssetType.GOLD,
        AssetType.DEPOSIT,
        AssetType.CASH
      ];

      validTypes.forEach(type => {
        asset.type = type;
        expect(asset.type).toBe(type);
      });
    });
  });

  describe('Decimal Precision', () => {
    it('should handle decimal values correctly', () => {
      asset.initialValue = 1234567.89;
      asset.initialQuantity = 123.4567;
      // currentValue removed - calculated real-time
      asset.currentQuantity = 987.6543;

      expect(asset.initialValue).toBe(1234567.89);
      expect(asset.initialQuantity).toBe(123.4567);
      // currentValue removed - calculated real-time
      expect(asset.currentQuantity).toBe(987.6543);
    });
  });

  describe('CR-003: Symbol Field Methods', () => {
    describe('canModifySymbol', () => {
      it('should return true when asset has no trades', () => {
        asset.trades = [];
        expect(asset.canModifySymbol()).toBe(true);
      });

      it('should return true when trades array is undefined', () => {
        asset.trades = undefined;
        expect(asset.canModifySymbol()).toBe(true);
      });

      it('should return false when asset has trades', () => {
        asset.trades = [{} as Trade];
        expect(asset.canModifySymbol()).toBe(false);
      });
    });

    describe('getPrimaryIdentifier', () => {
      it('should return the symbol field', () => {
        expect(asset.getPrimaryIdentifier()).toBe('TEST');
      });

      it('should return updated symbol when changed', () => {
        asset.symbol = 'NEW_SYMBOL';
        expect(asset.getPrimaryIdentifier()).toBe('NEW_SYMBOL');
      });
    });

    describe('validateSymbolModification', () => {
      it('should not throw when symbol can be modified and format is valid', () => {
        asset.trades = [];
        expect(() => asset.validateSymbolModification('NEW_SYMBOL')).not.toThrow();
      });

      it('should not throw when symbol is the same', () => {
        asset.trades = [];
        expect(() => asset.validateSymbolModification('TEST')).not.toThrow();
      });

      it('should throw when asset has trades', () => {
        asset.trades = [{} as Trade];
        expect(() => asset.validateSymbolModification('NEW_SYMBOL')).toThrow('Symbol field is read-only after asset has associated trades');
      });

      it('should throw when symbol format is invalid', () => {
        asset.trades = [];
        expect(() => asset.validateSymbolModification('invalid-symbol')).toThrow('Symbol must contain only uppercase letters, numbers, and underscores');
        expect(() => asset.validateSymbolModification('lowercase')).toThrow('Symbol must contain only uppercase letters, numbers, and underscores');
        expect(() => asset.validateSymbolModification('symbol with spaces')).toThrow('Symbol must contain only uppercase letters, numbers, and underscores');
      });

      it('should accept valid symbol formats', () => {
        asset.trades = [];
        const validSymbols = ['VALID', 'VALID123', 'VALID_SYMBOL', 'A1B2C3', 'SYMBOL_123'];
        
        validSymbols.forEach(symbol => {
          expect(() => asset.validateSymbolModification(symbol)).not.toThrow();
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values', () => {
      asset.initialValue = 0;
      asset.initialQuantity = 0;
      // currentValue removed - calculated real-time
      asset.currentQuantity = 0;

      // getTotalValue method removed - currentValue calculated real-time
      expect(asset.getTotalQuantity()).toBe(0);
    });

    it('should handle negative values', () => {
      asset.initialValue = -1000;
      asset.initialQuantity = -10;
      // currentValue removed - calculated real-time
      asset.currentQuantity = -20;

      // getTotalValue method removed - currentValue calculated real-time
      expect(asset.getTotalQuantity()).toBe(-20);
    });

    it('should handle very large values', () => {
      const largeValue = 999999999999999.99;
      const largeQuantity = 999999999999.9999;

      asset.initialValue = largeValue;
      asset.initialQuantity = largeQuantity;
      // currentValue removed - calculated real-time
      asset.currentQuantity = largeQuantity;

      // getTotalValue method removed - currentValue calculated real-time
      expect(asset.getTotalQuantity()).toBe(largeQuantity);
    });
  });
});
