import { AssetType, AssetTypeLabels, AssetTypeDescriptions } from '../../../../src/modules/asset/enums/asset-type.enum';

describe('AssetType Enum', () => {
  describe('AssetType values', () => {
    it('should have all required asset types', () => {
      expect(AssetType.STOCK).toBe('STOCK');
      expect(AssetType.BOND).toBe('BOND');
      expect(AssetType.GOLD).toBe('GOLD');
      expect(AssetType.DEPOSIT).toBe('DEPOSIT');
      expect(AssetType.CASH).toBe('CASH');
    });

    it('should have unique values', () => {
      const values = Object.values(AssetType);
      const uniqueValues = new Set(values);
      expect(values.length).toBe(uniqueValues.size);
    });

    it('should have string values', () => {
      Object.values(AssetType).forEach(value => {
        expect(typeof value).toBe('string');
      });
    });
  });

  describe('AssetTypeLabels', () => {
    it('should have labels for all asset types', () => {
      expect(AssetTypeLabels[AssetType.STOCK]).toBe('Cổ phiếu');
      expect(AssetTypeLabels[AssetType.BOND]).toBe('Trái phiếu');
      expect(AssetTypeLabels[AssetType.GOLD]).toBe('Vàng');
      expect(AssetTypeLabels[AssetType.DEPOSIT]).toBe('Tiền gửi');
      expect(AssetTypeLabels[AssetType.CASH]).toBe('Tiền mặt');
    });

    it('should have string labels', () => {
      Object.values(AssetTypeLabels).forEach(label => {
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
      });
    });

    it('should have labels for all enum values', () => {
      Object.values(AssetType).forEach(assetType => {
        expect(AssetTypeLabels[assetType]).toBeDefined();
        expect(AssetTypeLabels[assetType]).not.toBe('');
      });
    });
  });

  describe('AssetTypeDescriptions', () => {
    it('should have descriptions for all asset types', () => {
      expect(AssetTypeDescriptions[AssetType.STOCK]).toBe('Cổ phiếu của các công ty niêm yết');
      expect(AssetTypeDescriptions[AssetType.BOND]).toBe('Trái phiếu chính phủ và doanh nghiệp');
      expect(AssetTypeDescriptions[AssetType.GOLD]).toBe('Vàng và kim loại quý');
      expect(AssetTypeDescriptions[AssetType.DEPOSIT]).toBe('Tiền gửi ngân hàng và sản phẩm tiết kiệm');
      expect(AssetTypeDescriptions[AssetType.CASH]).toBe('Tiền mặt và các khoản tương đương tiền');
    });

    it('should have string descriptions', () => {
      Object.values(AssetTypeDescriptions).forEach(description => {
        expect(typeof description).toBe('string');
        expect(description.length).toBeGreaterThan(0);
      });
    });

    it('should have descriptions for all enum values', () => {
      Object.values(AssetType).forEach(assetType => {
        expect(AssetTypeDescriptions[assetType]).toBeDefined();
        expect(AssetTypeDescriptions[assetType]).not.toBe('');
      });
    });
  });

  describe('Enum consistency', () => {
    it('should have same number of values in enum and labels', () => {
      const enumValues = Object.values(AssetType);
      const labelKeys = Object.keys(AssetTypeLabels);
      expect(enumValues.length).toBe(labelKeys.length);
    });

    it('should have same number of values in enum and descriptions', () => {
      const enumValues = Object.values(AssetType);
      const descriptionKeys = Object.keys(AssetTypeDescriptions);
      expect(enumValues.length).toBe(descriptionKeys.length);
    });

    it('should have matching keys between labels and descriptions', () => {
      const labelKeys = Object.keys(AssetTypeLabels);
      const descriptionKeys = Object.keys(AssetTypeDescriptions);
      expect(labelKeys.sort()).toEqual(descriptionKeys.sort());
    });
  });

  describe('Enum usage', () => {
    it('should be usable in switch statements', () => {
      const getAssetTypeInfo = (type: AssetType) => {
        switch (type) {
          case AssetType.STOCK:
            return { category: 'equity', risk: 'high' };
          case AssetType.BOND:
            return { category: 'fixed-income', risk: 'medium' };
          case AssetType.GOLD:
            return { category: 'commodity', risk: 'medium' };
          case AssetType.DEPOSIT:
            return { category: 'fixed-income', risk: 'low' };
          case AssetType.CASH:
            return { category: 'cash', risk: 'low' };
          default:
            return { category: 'unknown', risk: 'unknown' };
        }
      };

      expect(getAssetTypeInfo(AssetType.STOCK)).toEqual({ category: 'equity', risk: 'high' });
      expect(getAssetTypeInfo(AssetType.BOND)).toEqual({ category: 'fixed-income', risk: 'medium' });
      expect(getAssetTypeInfo(AssetType.GOLD)).toEqual({ category: 'commodity', risk: 'medium' });
      expect(getAssetTypeInfo(AssetType.DEPOSIT)).toEqual({ category: 'fixed-income', risk: 'low' });
      expect(getAssetTypeInfo(AssetType.CASH)).toEqual({ category: 'cash', risk: 'low' });
    });

    it('should be usable in array operations', () => {
      const allTypes = Object.values(AssetType);
      expect(allTypes).toContain(AssetType.STOCK);
      expect(allTypes).toContain(AssetType.BOND);
      expect(allTypes).toContain(AssetType.GOLD);
      expect(allTypes).toContain(AssetType.DEPOSIT);
      expect(allTypes).toContain(AssetType.CASH);
    });

    it('should be usable in object operations', () => {
      const typeConfig = {
        [AssetType.STOCK]: { minQuantity: 1, maxQuantity: 1000000 },
        [AssetType.BOND]: { minQuantity: 1, maxQuantity: 100000 },
        [AssetType.GOLD]: { minQuantity: 0.001, maxQuantity: 1000 },
        [AssetType.DEPOSIT]: { minQuantity: 1000, maxQuantity: 1000000000 },
        [AssetType.CASH]: { minQuantity: 1, maxQuantity: 1000000000 }
      };

      expect(typeConfig[AssetType.STOCK]).toBeDefined();
      expect(typeConfig[AssetType.BOND]).toBeDefined();
      expect(typeConfig[AssetType.GOLD]).toBeDefined();
      expect(typeConfig[AssetType.DEPOSIT]).toBeDefined();
      expect(typeConfig[AssetType.CASH]).toBeDefined();
    });
  });

  describe('Type safety', () => {
    it('should only accept valid asset types', () => {
      const validTypes: AssetType[] = [
        AssetType.STOCK,
        AssetType.BOND,
        AssetType.GOLD,
        AssetType.DEPOSIT,
        AssetType.CASH
      ];

      validTypes.forEach(type => {
        expect(Object.values(AssetType)).toContain(type);
      });
    });

    it('should reject invalid asset types', () => {
      const invalidTypes = ['INVALID', 'STOCKS', 'BONDS', 'GOLDS', 'DEPOSITS', 'CASHES'];
      
      invalidTypes.forEach(type => {
        expect(Object.values(AssetType)).not.toContain(type);
      });
    });
  });
});
