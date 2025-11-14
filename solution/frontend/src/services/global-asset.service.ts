import { GlobalAsset } from '../types/global-asset.types';

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
  private baseUrl = '/api/v1/global-assets';

  async getGlobalAssets(filters: GlobalAssetFilters = {}): Promise<GlobalAssetResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${this.baseUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch global assets: ${response.statusText}`);
    }

    return await response.json();
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
    const params = new URLSearchParams();
    
    // Add required accountId
    params.append('accountId', accountId);
    
    // Add optional portfolioId
    if (portfolioId) {
      params.append('portfolioId', portfolioId);
    }
    
    // Add other filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${this.baseUrl}/for-autocomplete?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch global assets for autocomplete: ${response.statusText}`);
    }

    return await response.json();
  }

  async getGlobalAssetById(id: string): Promise<GlobalAsset | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch global asset: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      return null;
    }
  }

  async getGlobalAssetBySymbol(symbol: string): Promise<GlobalAsset | null> {
    try {
      const response = await fetch(`${this.baseUrl}/symbol/${symbol}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch global asset by symbol: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      return null;
    }
  }

  async getSupportedNations(): Promise<SupportedNationsResponse> {
    const response = await fetch(`${this.baseUrl}/nations/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch supported nations: ${response.statusText}`);
    }

    return await response.json();
  }

  async getNationConfig(code: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/nations/${code}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch nation config: ${response.statusText}`);
    }

    return await response.json();
  }

  async validateSymbolFormat(code: string, symbol: string, type: string): Promise<{
    valid: boolean;
    symbol: string;
    nation: string;
    type: string;
    message: string;
  }> {
    const params = new URLSearchParams({ symbol, type });
    const response = await fetch(`${this.baseUrl}/nations/${code}/validate-symbol?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to validate symbol format: ${response.statusText}`);
    }

    return await response.json();
  }
}

export const globalAssetService = new GlobalAssetService();
