/**
 * Asset Types for Frontend
 * TypeScript interfaces and types for asset management
 */

// Asset types are now fetched from backend API
// See useAssetTypes hook for dynamic asset type management

// Define AssetType as an enum for frontend use
export enum AssetType {
  STOCK = 'STOCK',
  BOND = 'BOND',
  CRYPTO = 'CRYPTO',
  COMMODITY = 'COMMODITY',
  //REIT = 'REIT',
  GOLD = 'GOLD',
  //DEPOSIT = 'DEPOSIT',
  //CASH = 'CASH',
  //OTHER = 'OTHER'
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: string;
  assetClass: string;
  currency: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string;
  updatedBy: string;
  // Frontend computed properties
  description?: string;
  initialValue?: number;
  initialQuantity?: number;
  currentValue?: number;
  currentQuantity?: number;
  currentPrice?: number;
  avgCost?: number;
  quantity?: number;
  totalValue?: number;
  priceUpdatedAt?: Date;
  performance?: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  totalQuantity?: number;
  hasTrades?: boolean;
  displayName?: string;
  // Trade data for performance calculation
  trades?: Array<{
    side: string;
    quantity: number;
    price: number;
    tradeDate: Date | string;
  }>;
}

export interface CreateAssetRequest {
  name: string;
  symbol: string;
  type: AssetType;
  description?: string;
  initialValue?: number;
  initialQuantity?: number;
  currentValue?: number;
  currentQuantity?: number;
  createdBy: string;
  updatedBy: string;
}

export interface UpdateAssetRequest {
  name?: string;
  // symbol field is read-only after creation
  type?: AssetType;
  description?: string;
  currentValue?: number;
  currentQuantity?: number;
  updatedBy: string;
}

export interface AssetFilters {
  createdBy?: string;
  portfolioId?: string;
  type?: AssetType;
  search?: string;
  minValue?: number;
  maxValue?: number;
  hasTrades?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  limit?: number;
  page?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AssetStatistics {
  totalAssets: number;
  assetsByType: Record<AssetType, number>;
  totalValue: number;
  averageValue: number;
}

export interface AssetAllocation {
  [AssetType.STOCK]: number;
  [AssetType.BOND]: number;
  [AssetType.CRYPTO]: number;
  [AssetType.COMMODITY]: number;
  //[AssetType.REIT]: number;
  [AssetType.GOLD]: number;
  //[AssetType.DEPOSIT]: number;
  //[AssetType.CASH]: number;
  //[AssetType.OTHER]: number;
}

export interface AssetAllocationItem {
  assetType: string;
  totalValue: number;
  percentage: number;
}

export interface AssetAllocationResponse {
  portfolioId: string;
  totalValue: number;
  allocation: Record<string, { percentage: number; value: number }>;
  groupBy: string;
  calculatedAt: string;
}

export interface PerformanceHistoryDataPoint {
  date: string;
  value: number;
  nav: number;
  return: number;
}

export interface PerformanceHistoryResponse {
  portfolioId: string;
  period: string;
  startDate: string;
  endDate: string;
  data: PerformanceHistoryDataPoint[];
  calculatedAt: string;
}

export interface PerformanceMetrics {
  totalReturn: number;
  averageReturn: number;
  bestPerformer: Asset | null;
  worstPerformer: Asset | null;
  volatility: number;
}

export interface RiskMetrics {
  maxDrawdown: number;
  sharpeRatio: number;
  valueAtRisk: number;
  concentrationRisk: number;
}

export interface AssetSummary {
  overview: {
    totalAssets: number;
    totalValue: number;
    averageValue: number;
  };
  allocation: AssetAllocation;
  performance: PerformanceMetrics;
  risk: RiskMetrics;
  topAssets: Asset[];
  recentActivity: Asset[];
}

export interface AssetPerformanceComparison {
  period: string;
  assets: Array<{
    id: string;
    name: string;
    type: AssetType;
    initialValue: number;
    currentValue: number;
    return: number;
    rank: number;
  }>;
}

export interface AssetFormData {
  name: string;
  symbol: string;
  type: AssetType;
  description?: string;
  initialValue: number;
  initialQuantity: number;
  currentValue?: number;
  currentQuantity?: number;
}

export interface AssetFormErrors {
  name?: string;
  symbol?: string;
  type?: string;
  description?: string;
  initialValue?: string;
  initialQuantity?: string;
  currentValue?: string;
  currentQuantity?: string;
}

export interface AssetListState {
  assets: Asset[];
  loading: boolean;
  error: string | null;
  filters: AssetFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface AssetFormState {
  data: AssetFormData;
  errors: AssetFormErrors;
  isSubmitting: boolean;
  isDirty: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: Record<string, any>;
}

// Asset Type Labels for UI
export const AssetTypeLabels: Record<AssetType, string> = {
  [AssetType.STOCK]: 'Cổ phiếu',
  [AssetType.BOND]: 'Trái phiếu',
  [AssetType.CRYPTO]: 'Tài sản số',
  [AssetType.COMMODITY]: 'Hàng hóa',
  //[AssetType.REIT]: 'Bất động sản',
  [AssetType.GOLD]: 'Vàng',
  //[AssetType.DEPOSIT]: 'Tiền gửi',
  //[AssetType.CASH]: 'Tiền mặt',
  //[AssetType.OTHER]: 'Khác',
};

// Asset Type Descriptions for UI
export const AssetTypeDescriptions: Record<AssetType, string> = {
  [AssetType.STOCK]: 'Cổ phiếu của các công ty niêm yết và quỹ hoán đổi danh mục',
  [AssetType.BOND]: 'Trái phiếu chính phủ và doanh nghiệp',
  [AssetType.CRYPTO]: 'Tiền điện tử và tài sản số',
  [AssetType.COMMODITY]: 'Hàng hóa và nguyên liệu thô',
  //[AssetType.REIT]: 'Quỹ đầu tư bất động sản',
  [AssetType.GOLD]: 'Vàng vật chất và vàng tài khoản',
  //[AssetType.DEPOSIT]: 'Tiền gửi ngân hàng có kỳ hạn',
  //[AssetType.CASH]: 'Tiền mặt và tiền gửi không kỳ hạn',
  //[AssetType.OTHER]: 'Các loại tài sản khác',
};

// Validation Rules
export const AssetValidationRules = {
  name: {
    required: true,
    minLength: 1,
    maxLength: 255,
  },
  symbol: {
    required: true,
    minLength: 1,
    maxLength: 50,
  },
  description: {
    required: false,
    maxLength: 1000,
  },
  initialValue: {
    required: true,
    min: 0,
    max: 999999999999999.99,
  },
  initialQuantity: {
    required: true,
    min: 0.0001,
    max: 999999999999.9999,
  },
  currentValue: {
    required: false,
    min: 0,
    max: 999999999999999.99,
  },
  currentQuantity: {
    required: false,
    min: 0,
    max: 999999999999.9999,
  },
} as const;
