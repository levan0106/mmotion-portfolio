import { AssetType } from './asset.types';

export interface GlobalAsset {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  nation: string;
  marketCode: string;
  currency: string;
  timezone: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GlobalAssetFilters {
  nation?: string;
  type?: string;
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface GlobalAssetResponse {
  data: GlobalAsset[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NationConfig {
  code: string;
  name: string;
  currency: string;
  timezone: string;
  marketCodes: string[];
  defaultPriceSource: string;
}

export interface SupportedNationsResponse {
  nations: NationConfig[];
}

export interface SymbolValidationResult {
  valid: boolean;
  symbol: string;
  nation: string;
  type: string;
  message: string;
}
