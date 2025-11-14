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
  GOLD = 'GOLD',
  REALESTATE = 'REALESTATE',
  OTHER = 'OTHER',
  //REIT = 'REIT',
  //DEPOSIT = 'DEPOSIT',
  //CASH = 'CASH'
}

// Price mode enum for asset pricing
export enum PriceMode {
  AUTOMATIC = 'AUTOMATIC', // Auto-sync from market data
  MANUAL = 'MANUAL'        // Manual price entry only
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: string;
  assetClass: string;
  currency: string;
  isActive?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string;
  updatedBy: string;
  // Price mode for auto-sync behavior
  priceMode?: PriceMode;
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
  hasTrades?: boolean; // Keep for backward compatibility
  hasPortfolioTrades?: boolean; // Whether asset has trades in portfolios that account has access to
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
  priceMode?: PriceMode;
  manualPrice?: number;
  currentPrice?: number;
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
  priceMode?: PriceMode;
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
  [AssetType.GOLD]: number;
  [AssetType.REALESTATE]: number;
  [AssetType.OTHER]: number;
  //[AssetType.REIT]: number;
  //[AssetType.DEPOSIT]: number;
  //[AssetType.CASH]: number;
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
  [AssetType.GOLD]: 'Vàng',
  [AssetType.REALESTATE]: 'Bất động sản',
  [AssetType.OTHER]: 'Khác',
  //[AssetType.REIT]: 'Bất động sản',
  //[AssetType.DEPOSIT]: 'Tiền gửi',
  //[AssetType.CASH]: 'Tiền mặt',
};

// Asset Type Descriptions for UI
export const AssetTypeDescriptions: Record<AssetType, string> = {
  [AssetType.STOCK]: 'Cổ phiếu của các công ty niêm yết và quỹ hoán đổi danh mục',
  [AssetType.BOND]: 'Trái phiếu chính phủ và doanh nghiệp',
  [AssetType.CRYPTO]: 'Tiền điện tử và tài sản số',
  [AssetType.COMMODITY]: 'Hàng hóa và nguyên liệu thô',
  [AssetType.GOLD]: 'Vàng vật chất và vàng tài khoản',
  [AssetType.REALESTATE]: 'Bất động sản và các khoản đầu tư liên quan',
  [AssetType.OTHER]: 'Các loại tài sản khác không thuộc các danh mục trên',
  //[AssetType.REIT]: 'Quỹ đầu tư bất động sản',
  //[AssetType.DEPOSIT]: 'Tiền gửi ngân hàng có kỳ hạn',
  //[AssetType.CASH]: 'Tiền mặt và tiền gửi không kỳ hạn',
};

// Price Mode Labels for UI
export const PriceModeLabels: Record<PriceMode, string> = {
  [PriceMode.AUTOMATIC]: 'Tự động',
  [PriceMode.MANUAL]: 'Thủ công',
};

// Price Mode Descriptions for UI
export const PriceModeDescriptions: Record<PriceMode, string> = {
  [PriceMode.AUTOMATIC]: 'Tự động lấy giá từ thị trường và cập nhật định kỳ',
  [PriceMode.MANUAL]: 'Chỉ nhập giá thủ công, không tự động cập nhật từ thị trường',
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
