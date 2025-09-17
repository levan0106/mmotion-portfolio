/**
 * Asset Utilities
 * Utility functions for asset management
 */

import { Asset, AssetType, AssetFormData, AssetFormErrors } from '../types/asset.types';
import { formatCurrency, formatPercentage, formatNumber } from './format';

// Re-export formatting functions for convenience
export { formatCurrency, formatPercentage, formatNumber };

/**
 * Calculate percentage change
 */
export const calculatePercentageChange = (oldValue: number, newValue: number): number => {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
};

/**
 * Calculate total value of assets
 */
export const calculateTotalValue = (assets: Asset[]): number => {
  return assets.reduce((total, asset) => total + (Number(asset.totalValue) || 0), 0);
};

/**
 * Calculate total quantity of assets
 */
export const calculateTotalQuantity = (assets: Asset[]): number => {
  return assets.reduce((total, asset) => total + (Number(asset.totalQuantity) || 0), 0);
};

/**
 * Calculate average value of assets
 */
export const calculateAverageValue = (assets: Asset[]): number => {
  if (assets.length === 0) return 0;
  return calculateTotalValue(assets) / assets.length;
};

/**
 * Group assets by type
 */
export const groupAssetsByType = (assets: Asset[]): Record<AssetType, Asset[]> => {
  const grouped: Record<AssetType, Asset[]> = {
    [AssetType.STOCK]: [],
    [AssetType.BOND]: [],
    [AssetType.ETF]: [],
    [AssetType.MUTUAL_FUND]: [],
    [AssetType.CRYPTO]: [],
    [AssetType.COMMODITY]: [],
    [AssetType.REIT]: [],
    [AssetType.GOLD]: [],
    [AssetType.DEPOSIT]: [],
    [AssetType.CASH]: [],
    [AssetType.OTHER]: [],
  };

  assets.forEach(asset => {
    (grouped as any)[asset.type].push(asset);
  });

  return grouped;
};

/**
 * Calculate asset allocation percentages
 */
export const calculateAssetAllocation = (assets: Asset[]): Record<AssetType, number> => {
  const totalValue = calculateTotalValue(assets);
  
  if (totalValue === 0) {
  return {
    [AssetType.STOCK]: 0,
    [AssetType.BOND]: 0,
    [AssetType.ETF]: 0,
    [AssetType.MUTUAL_FUND]: 0,
    [AssetType.CRYPTO]: 0,
    [AssetType.COMMODITY]: 0,
    [AssetType.REIT]: 0,
    [AssetType.GOLD]: 0,
    [AssetType.DEPOSIT]: 0,
    [AssetType.CASH]: 0,
    [AssetType.OTHER]: 0,
  };
  }

  const grouped = groupAssetsByType(assets);
  const allocation: Record<AssetType, number> = {
    [AssetType.STOCK]: 0,
    [AssetType.BOND]: 0,
    [AssetType.ETF]: 0,
    [AssetType.MUTUAL_FUND]: 0,
    [AssetType.CRYPTO]: 0,
    [AssetType.COMMODITY]: 0,
    [AssetType.REIT]: 0,
    [AssetType.GOLD]: 0,
    [AssetType.DEPOSIT]: 0,
    [AssetType.CASH]: 0,
    [AssetType.OTHER]: 0,
  };

  Object.entries(grouped).forEach(([type, typeAssets]) => {
    const typeValue = calculateTotalValue(typeAssets);
    allocation[type as AssetType] = (typeValue / totalValue) * 100;
  });

  return allocation;
};

/**
 * Sort assets by various criteria
 */
export const sortAssets = (assets: Asset[], sortBy: string, sortOrder: 'ASC' | 'DESC' = 'ASC'): Asset[] => {
  return [...assets].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'type':
        aValue = a.type;
        bValue = b.type;
        break;
      case 'totalValue':
        aValue = a.totalValue;
        bValue = b.totalValue;
        break;
      case 'totalQuantity':
        aValue = a.totalQuantity;
        bValue = b.totalQuantity;
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case 'updatedAt':
        aValue = new Date(a.updatedAt).getTime();
        bValue = new Date(b.updatedAt).getTime();
        break;
      default:
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
    }

    if (aValue < bValue) return sortOrder === 'ASC' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'ASC' ? 1 : -1;
    return 0;
  });
};

/**
 * Filter assets by search term
 */
export const filterAssetsBySearch = (assets: Asset[], searchTerm: string): Asset[] => {
  if (!searchTerm.trim()) return assets;

  const term = searchTerm.toLowerCase();
  return assets.filter(asset => 
    asset.name.toLowerCase().includes(term) ||
    asset.symbol?.toLowerCase().includes(term) ||
    asset.description?.toLowerCase().includes(term)
  );
};

/**
 * Filter assets by type
 */
export const filterAssetsByType = (assets: Asset[], type: AssetType): Asset[] => {
  return assets.filter(asset => asset.type === type);
};

/**
 * Filter assets by value range
 */
export const filterAssetsByValueRange = (assets: Asset[], minValue: number, maxValue: number): Asset[] => {
  return assets.filter(asset => 
    (Number(asset.totalValue) || 0) >= minValue && (Number(asset.totalValue) || 0) <= maxValue
  );
};

/**
 * Get top performing assets
 */
export const getTopPerformingAssets = (assets: Asset[], count: number = 5): Asset[] => {
  return sortAssets(assets, 'totalValue', 'DESC').slice(0, count);
};

/**
 * Get recent assets
 */
export const getRecentAssets = (assets: Asset[], count: number = 5): Asset[] => {
  return sortAssets(assets, 'createdAt', 'DESC').slice(0, count);
};

/**
 * Validate asset form data
 */
export const validateAssetForm = (data: AssetFormData): AssetFormErrors => {
  const errors: AssetFormErrors = {};

  // Required fields
  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Asset name is required';
  } else if (data.name.length > 255) {
    errors.name = 'Asset name cannot exceed 255 characters';
  }

  if (!data.symbol || data.symbol.trim().length === 0) {
    errors.symbol = 'Asset symbol is required';
  } else if (data.symbol.length > 50) {
    errors.symbol = 'Asset symbol cannot exceed 50 characters';
  }

  if (data.description && data.description.length > 1000) {
    errors.description = 'Asset description cannot exceed 1000 characters';
  }

  if (data.initialValue <= 0) {
    errors.initialValue = 'Initial value must be positive';
  } else if (data.initialValue > 999999999999999.99) {
    errors.initialValue = 'Initial value is too large';
  }

  if (data.initialQuantity <= 0) {
    errors.initialQuantity = 'Initial quantity must be positive';
  } else if (data.initialQuantity > 999999999999.9999) {
    errors.initialQuantity = 'Initial quantity is too large';
  }

  if (data.currentValue !== undefined) {
    if (data.currentValue < 0) {
      errors.currentValue = 'Current value cannot be negative';
    } else if (data.currentValue > 999999999999999.99) {
      errors.currentValue = 'Current value is too large';
    }
  }

  if (data.currentQuantity !== undefined) {
    if (data.currentQuantity < 0) {
      errors.currentQuantity = 'Current quantity cannot be negative';
    } else if (data.currentQuantity > 999999999999.9999) {
      errors.currentQuantity = 'Current quantity is too large';
    }
  }

  return errors;
};

/**
 * Check if asset form is valid
 */
export const isAssetFormValid = (data: AssetFormData): boolean => {
  const errors = validateAssetForm(data);
  return Object.keys(errors).length === 0;
};

/**
 * Generate asset display name
 */
export const generateAssetDisplayName = (name: string, symbol?: string): string => {
  if (symbol && symbol.trim()) {
    return `${name} (${symbol})`;
  }
  return name;
};

/**
 * Calculate asset performance metrics
 */
export const calculateAssetPerformance = (asset: Asset) => {
  const valueChange = asset.currentValue ? asset.currentValue - (asset.initialValue || 0) : 0;
  const quantityChange = asset.currentQuantity ? asset.currentQuantity - (asset.initialQuantity || 0) : 0;
  const valueChangePercentage = (asset.initialValue || 0) > 0 ? (valueChange / (asset.initialValue || 0)) * 100 : 0;
  const quantityChangePercentage = (asset.initialQuantity || 0) > 0 ? (quantityChange / (asset.initialQuantity || 0)) * 100 : 0;

  return {
    valueChange,
    quantityChange,
    valueChangePercentage,
    quantityChangePercentage,
    isGaining: valueChange > 0,
    isLosing: valueChange < 0,
  };
};

/**
 * Format asset for display
 */
export const formatAssetForDisplay = (asset: Asset, baseCurrency: string = 'VND') => {
  const performance = calculateAssetPerformance(asset);
  
  return {
    ...asset,
    displayName: generateAssetDisplayName(asset.name, asset.symbol),
    formattedTotalValue: formatCurrency(Number(asset.totalValue) || 0, baseCurrency),
    formattedInitialValue: formatCurrency(asset.initialValue || 0, baseCurrency),
    formattedCurrentValue: asset.currentValue ? formatCurrency(asset.currentValue, baseCurrency) : 'N/A',
    formattedValueChange: formatCurrency(performance.valueChange, baseCurrency),
    formattedValueChangePercentage: formatPercentage(performance.valueChangePercentage),
    performance,
  };
};

/**
 * Export asset data to CSV format
 */
export const exportAssetsToCSV = (assets: Asset[]): string => {
  const headers = [
    'Name',
    'Symbol',
    'Type',
    'Description',
    'Initial Value',
    'Initial Quantity',
    'Current Value',
    'Current Quantity',
    'Total Value',
    'Total Quantity',
    'Created At',
    'Updated At',
  ];

  const rows = assets.map(asset => [
    asset.name,
    asset.symbol || '',
    asset.type,
    asset.description || '',
    (asset.initialValue || 0).toString(),
    (asset.initialQuantity || 0).toString(),
    asset.currentValue?.toString() || '',
    asset.currentQuantity?.toString() || '',
    (Number(asset.totalValue) || 0).toString(),
    (asset.totalQuantity || 0).toString(),
    asset.createdAt,
    asset.updatedAt,
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  return csvContent;
};

/**
 * Generate asset statistics summary
 */
export const generateAssetStatistics = (assets: Asset[]) => {
  const totalValue = calculateTotalValue(assets);
  const totalQuantity = calculateTotalQuantity(assets);
  const averageValue = calculateAverageValue(assets);
  const allocation = calculateAssetAllocation(assets);
  const grouped = groupAssetsByType(assets);

  return {
    totalAssets: assets.length,
    totalValue,
    totalQuantity,
    averageValue,
    allocation,
    byType: Object.entries(grouped).map(([type, typeAssets]) => ({
      type: type as AssetType,
      count: typeAssets.length,
      totalValue: calculateTotalValue(typeAssets),
      percentage: allocation[type as AssetType],
    })),
  };
};
