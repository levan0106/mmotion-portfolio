/**
 * Asset Utils Tests
 * Unit tests for asset utility functions
 */

import {
  formatCurrency,
  formatPercentage,
  formatNumber,
  calculatePercentageChange,
  calculateTotalValue,
  calculateTotalQuantity,
  calculateAverageValue,
  groupAssetsByType,
  calculateAssetAllocation,
  sortAssets,
  filterAssetsBySearch,
  filterAssetsByType,
  filterAssetsByValueRange,
  getTopPerformingAssets,
  getRecentAssets,
  validateAssetForm,
  isAssetFormValid,
  generateAssetDisplayName,
  calculateAssetPerformance,
  formatAssetForDisplay,
  exportAssetsToCSV,
  generateAssetStatistics,
} from '../../utils/asset.utils';
import { Asset, AssetType, AssetFormData } from '../../types/asset.types';

const mockAsset1: Asset = {
  id: 'asset-1',
  symbol: 'AAPL',
  name: 'Apple Stock',
  type: 'STOCK',
  assetClass: 'Equity',
  currency: 'VND',
  isActive: true,
  description: 'Apple Inc. stock',
  initialValue: 1000000,
  initialQuantity: 100,
  currentValue: 1200000,
  currentQuantity: 100,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  createdBy: 'user-1',
  updatedBy: 'user-1',
  totalValue: 1200000,
  totalQuantity: 100,
  hasTrades: false,
  displayName: 'Apple Stock (AAPL)',
};

const mockAsset2: Asset = {
  id: 'asset-2',
  symbol: 'GOLD',
  name: 'Gold Bar',
  type: 'GOLD',
  assetClass: 'Commodity',
  currency: 'VND',
  isActive: true,
  description: 'Physical gold bar',
  initialValue: 2000000,
  initialQuantity: 0.5,
  currentValue: 1800000,
  currentQuantity: 0.5,
  createdAt: '2024-01-02T00:00:00Z',
  updatedAt: '2024-01-02T00:00:00Z',
  createdBy: 'user-1',
  updatedBy: 'user-1',
  totalValue: 1800000,
  totalQuantity: 0.5,
  hasTrades: false,
  displayName: 'Gold Bar (GOLD)',
};

const mockAsset3: Asset = {
  id: 'asset-3',
  symbol: 'BOND001',
  name: 'Bond Investment',
  type: 'BOND',
  assetClass: 'Fixed Income',
  currency: 'VND',
  isActive: true,
  description: 'Government bond',
  initialValue: 5000000,
  initialQuantity: 1,
  currentValue: 5100000,
  currentQuantity: 1,
  createdAt: '2024-01-03T00:00:00Z',
  updatedAt: '2024-01-03T00:00:00Z',
  createdBy: 'user-1',
  updatedBy: 'user-1',
  totalValue: 5100000,
  totalQuantity: 1,
  hasTrades: false,
  displayName: 'Bond Investment',
};

describe('formatCurrency', () => {
  it('should format VND currency correctly', () => {
    expect(formatCurrency(1000000, 'VND')).toContain('1.000.000');
    expect(formatCurrency(0, 'VND')).toBe('0 VND');
  });

  it('should format USD currency correctly', () => {
    expect(formatCurrency(1000, 'USD')).toMatch(/1\.000\s*US\$/);
  });
});

describe('formatPercentage', () => {
  it('should format percentage with default decimals', () => {
    expect(formatPercentage(15.6789)).toBe('15.68%');
  });

  it('should format percentage with custom decimals', () => {
    expect(formatPercentage(15.6789, 1)).toBe('15.7%');
  });
});

describe('formatNumber', () => {
  it('should format number with thousand separators', () => {
    expect(formatNumber(1000000)).toBe('1.000.000');
    expect(formatNumber(1000000, 2)).toBe('1.000.000,00');
  });
});

describe('calculatePercentageChange', () => {
  it('should calculate percentage change correctly', () => {
    expect(calculatePercentageChange(100, 120)).toBe(20);
    expect(calculatePercentageChange(100, 80)).toBe(-20);
    expect(calculatePercentageChange(0, 100)).toBe(0);
  });
});

describe('calculateTotalValue', () => {
  it('should calculate total value of assets', () => {
    const assets = [mockAsset1, mockAsset2, mockAsset3];
    expect(calculateTotalValue(assets)).toBe(8100000); // 1200000 + 1800000 + 5100000
  });

  it('should return 0 for empty array', () => {
    expect(calculateTotalValue([])).toBe(0);
  });
});

describe('calculateTotalQuantity', () => {
  it('should calculate total quantity of assets', () => {
    const assets = [mockAsset1, mockAsset2, mockAsset3];
    expect(calculateTotalQuantity(assets)).toBe(101.5); // 100 + 0.5 + 1
  });
});

describe('calculateAverageValue', () => {
  it('should calculate average value of assets', () => {
    const assets = [mockAsset1, mockAsset2, mockAsset3];
    expect(calculateAverageValue(assets)).toBe(2700000); // 8100000 / 3
  });

  it('should return 0 for empty array', () => {
    expect(calculateAverageValue([])).toBe(0);
  });
});

describe('groupAssetsByType', () => {
  it('should group assets by type', () => {
    const assets = [mockAsset1, mockAsset2, mockAsset3];
    const grouped = groupAssetsByType(assets);

    expect(grouped[AssetType.STOCK]).toHaveLength(1);
    expect(grouped[AssetType.GOLD]).toHaveLength(1);
    expect(grouped[AssetType.BOND]).toHaveLength(1);
    expect(grouped[AssetType.DEPOSIT]).toHaveLength(0);
    expect(grouped[AssetType.CASH]).toHaveLength(0);
  });
});

describe('calculateAssetAllocation', () => {
  it('should calculate asset allocation percentages', () => {
    const assets = [mockAsset1, mockAsset2, mockAsset3];
    const allocation = calculateAssetAllocation(assets);

    expect(allocation[AssetType.STOCK]).toBeCloseTo(14.81, 1); // 1200000 / 8100000 * 100
    expect(allocation[AssetType.GOLD]).toBeCloseTo(22.22, 1); // 1800000 / 8100000 * 100
    expect(allocation[AssetType.BOND]).toBeCloseTo(62.96, 1); // 5100000 / 8100000 * 100
    expect(allocation[AssetType.DEPOSIT]).toBe(0);
    expect(allocation[AssetType.CASH]).toBe(0);
  });

  it('should return zero allocation for empty array', () => {
    const allocation = calculateAssetAllocation([]);
    Object.values(allocation).forEach(percentage => {
      expect(percentage).toBe(0);
    });
  });
});

describe('sortAssets', () => {
  it('should sort assets by name ascending', () => {
    const assets = [mockAsset3, mockAsset1, mockAsset2];
    const sorted = sortAssets(assets, 'name', 'ASC');
    
    expect(sorted[0].name).toBe('Apple Stock');
    expect(sorted[1].name).toBe('Bond Investment');
    expect(sorted[2].name).toBe('Gold Bar');
  });

  it('should sort assets by total value descending', () => {
    const assets = [mockAsset1, mockAsset2, mockAsset3];
    const sorted = sortAssets(assets, 'totalValue', 'DESC');
    
    expect(sorted[0].totalValue).toBe(5100000);
    expect(sorted[1].totalValue).toBe(1800000);
    expect(sorted[2].totalValue).toBe(1200000);
  });
});

describe('filterAssetsBySearch', () => {
  it('should filter assets by search term', () => {
    const assets = [mockAsset1, mockAsset2, mockAsset3];
    
    expect(filterAssetsBySearch(assets, 'apple')).toHaveLength(1);
    expect(filterAssetsBySearch(assets, 'gold')).toHaveLength(1);
    expect(filterAssetsBySearch(assets, 'bond')).toHaveLength(1);
    expect(filterAssetsBySearch(assets, 'nonexistent')).toHaveLength(0);
  });

  it('should return all assets for empty search term', () => {
    const assets = [mockAsset1, mockAsset2, mockAsset3];
    expect(filterAssetsBySearch(assets, '')).toEqual(assets);
  });
});

describe('filterAssetsByType', () => {
  it('should filter assets by type', () => {
    const assets = [mockAsset1, mockAsset2, mockAsset3];
    
    expect(filterAssetsByType(assets, AssetType.STOCK)).toHaveLength(1);
    expect(filterAssetsByType(assets, AssetType.GOLD)).toHaveLength(1);
    expect(filterAssetsByType(assets, AssetType.BOND)).toHaveLength(1);
    expect(filterAssetsByType(assets, AssetType.DEPOSIT)).toHaveLength(0);
  });
});

describe('filterAssetsByValueRange', () => {
  it('should filter assets by value range', () => {
    const assets = [mockAsset1, mockAsset2, mockAsset3];
    
    expect(filterAssetsByValueRange(assets, 1000000, 2000000)).toHaveLength(2);
    expect(filterAssetsByValueRange(assets, 5000000, 6000000)).toHaveLength(1);
    expect(filterAssetsByValueRange(assets, 10000000, 20000000)).toHaveLength(0);
  });
});

describe('getTopPerformingAssets', () => {
  it('should get top performing assets', () => {
    const assets = [mockAsset1, mockAsset2, mockAsset3];
    const topAssets = getTopPerformingAssets(assets, 2);
    
    expect(topAssets).toHaveLength(2);
    expect(topAssets[0].totalValue).toBe(5100000);
    expect(topAssets[1].totalValue).toBe(1800000);
  });
});

describe('getRecentAssets', () => {
  it('should get recent assets', () => {
    const assets = [mockAsset1, mockAsset2, mockAsset3];
    const recentAssets = getRecentAssets(assets, 2);
    
    expect(recentAssets).toHaveLength(2);
    expect(recentAssets[0].name).toBe('Bond Investment');
    expect(recentAssets[1].name).toBe('Gold Bar');
  });
});

describe('validateAssetForm', () => {
  it('should validate valid form data', () => {
    const validData: AssetFormData = {
      name: 'Valid Asset',
      symbol: 'VALID',
      type: AssetType.STOCK,
      initialValue: 1000000,
      initialQuantity: 100,
    };

    const errors = validateAssetForm(validData);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('should validate required fields', () => {
    const invalidData: AssetFormData = {
      name: '',
      symbol: '',
      type: AssetType.STOCK,
      initialValue: 0,
      initialQuantity: 0,
    };

    const errors = validateAssetForm(invalidData);
    expect(errors.name).toBe('Asset name is required');
    expect(errors.symbol).toBe('Asset symbol is required');
    expect(errors.initialValue).toBe('Initial value must be positive');
    expect(errors.initialQuantity).toBe('Initial quantity must be positive');
  });

  it('should validate field lengths', () => {
    const invalidData: AssetFormData = {
      name: 'a'.repeat(300),
      symbol: 'TOO_LONG_SYMBOL_THAT_EXCEEDS_FIFTY_CHARACTERS_LIMIT',
      type: AssetType.STOCK,
      initialValue: 1000000,
      initialQuantity: 100,
    };

    const errors = validateAssetForm(invalidData);
    expect(errors.name).toBe('Asset name cannot exceed 255 characters');
    expect(errors.symbol).toBe('Asset symbol cannot exceed 50 characters');
  });
});

describe('isAssetFormValid', () => {
  it('should return true for valid form', () => {
    const validData: AssetFormData = {
      name: 'Valid Asset',
      symbol: 'VALID',
      type: AssetType.STOCK,
      initialValue: 1000000,
      initialQuantity: 100,
    };

    expect(isAssetFormValid(validData)).toBe(true);
  });

  it('should return false for invalid form', () => {
    const invalidData: AssetFormData = {
      name: '',
      symbol: '',
      type: AssetType.STOCK,
      initialValue: 0,
      initialQuantity: 0,
    };

    expect(isAssetFormValid(invalidData)).toBe(false);
  });
});

describe('generateAssetDisplayName', () => {
  it('should generate display name with code', () => {
    expect(generateAssetDisplayName('Apple Stock', 'AAPL')).toBe('Apple Stock (AAPL)');
  });

  it('should generate display name without code', () => {
    expect(generateAssetDisplayName('Apple Stock')).toBe('Apple Stock');
  });

  it('should handle empty code', () => {
    expect(generateAssetDisplayName('Apple Stock', '')).toBe('Apple Stock');
  });
});

describe('calculateAssetPerformance', () => {
  it('should calculate performance metrics correctly', () => {
    const performance = calculateAssetPerformance(mockAsset1);

    expect(performance.valueChange).toBe(200000); // 1200000 - 1000000
    expect(performance.quantityChange).toBe(0); // 100 - 100
    expect(performance.valueChangePercentage).toBe(20); // (200000 / 1000000) * 100
    expect(performance.isGaining).toBe(true);
    expect(performance.isLosing).toBe(false);
  });
});

describe('formatAssetForDisplay', () => {
  it('should format asset for display', () => {
    const formatted = formatAssetForDisplay(mockAsset1);

    expect(formatted.displayName).toBe('Apple Stock (AAPL)');
    expect(formatted.formattedTotalValue).toContain('1.200.000');
    expect(formatted.performance).toBeDefined();
  });
});

describe('exportAssetsToCSV', () => {
  it('should export assets to CSV format', () => {
    const assets = [mockAsset1, mockAsset2];
    const csv = exportAssetsToCSV(assets);

    expect(csv).toContain('"Name","Symbol","Type"');
    expect(csv).toContain('"Apple Stock","AAPL","STOCK"');
    expect(csv).toContain('"Gold Bar","GOLD","GOLD"');
  });
});

describe('generateAssetStatistics', () => {
  it('should generate asset statistics', () => {
    const assets = [mockAsset1, mockAsset2, mockAsset3];
    const stats = generateAssetStatistics(assets);

    expect(stats.totalAssets).toBe(3);
    expect(stats.totalValue).toBe(8100000);
    expect(stats.byType).toHaveLength(11); // All asset types
    expect(stats.byType[0].count).toBeGreaterThan(0);
  });
});
