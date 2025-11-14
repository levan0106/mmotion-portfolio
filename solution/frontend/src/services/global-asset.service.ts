import { GlobalAsset } from '../types/global-asset.types';
import { apiService } from './api';

interface GlobalAssetFilters {
  nation?: string;
  type?: string;
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

interface GlobalAssetResponse {
  data: GlobalAsset[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface NationConfig {
  code: string;
  name: string;
  currency: string;
  timezone: string;
  marketCodes: string[];
  defaultPriceSource: string;
}

interface SupportedNationsResponse {
  nations: NationConfig[];
}

class GlobalAssetService {
  async getGlobalAssets(filters: GlobalAssetFilters = {}): Promise<GlobalAssetResponse> {
    const params: Record<string, string> = {};
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value.toString();
      }
    });

    return await apiService.get('/api/v1/global-assets', { params });
  }

  /**
   * Get global assets for autocomplete with smart filtering
   * - All assets with AUTOMATIC price mode
   * - MANUAL price mode assets only if created by accountId or used in portfolio
   */
  async getGlobalAssetsForAutocomplete(
    accountId: string,
    portfolioId?: string,
    filters: GlobalAssetFilters = {}
  ): Promise<GlobalAssetResponse> {
    const params: Record<string, string> = {
      accountId,
    };
    
    // Add optional portfolioId
    if (portfolioId) {
      params.portfolioId = portfolioId;
    }
    
    // Add other filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value.toString();
      }
    });

    return await apiService.get('/api/v1/global-assets/for-autocomplete', { params });
  }

  async getGlobalAssetById(id: string): Promise<GlobalAsset | null> {
    try {
      return await apiService.get(`/api/v1/global-assets/${id}`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getGlobalAssetBySymbol(symbol: string): Promise<GlobalAsset | null> {
    try {
      return await apiService.get(`/api/v1/global-assets/symbol/${symbol}`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getSupportedNations(): Promise<SupportedNationsResponse> {
    return await apiService.get('/api/v1/global-assets/nations/list');
  }

  async getNationConfig(code: string): Promise<any> {
    return await apiService.get(`/api/v1/global-assets/nations/${code}`);
  }

  async validateSymbolFormat(code: string, symbol: string, type: string): Promise<{
    valid: boolean;
    symbol: string;
    nation: string;
    type: string;
    message: string;
  }> {
    return await apiService.get(`/api/v1/global-assets/nations/${code}/validate-symbol`, {
      params: { symbol, type },
    });
  }
}

export const globalAssetService = new GlobalAssetService();
