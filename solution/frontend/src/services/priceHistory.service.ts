import { apiService } from './api';

export interface PriceHistoryQuery {
  startDate?: string;
  endDate?: string;
  priceType?: string;
  priceSource?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'price';
  sortOrder?: 'ASC' | 'DESC';
}

export interface PriceHistoryRecord {
  id: string;
  assetId: string;
  price: number;
  priceType: string;
  priceSource: string;
  changeReason?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface PriceHistoryResponse {
  data: PriceHistoryRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class PriceHistoryService {
  /**
   * Get price history for a specific asset
   */
  async getPriceHistory(
    assetId: string,
    query: PriceHistoryQuery = {}
  ): Promise<PriceHistoryResponse> {
    const params = new URLSearchParams();
    
    if (query.startDate) params.append('startDate', query.startDate);
    if (query.endDate) params.append('endDate', query.endDate);
    if (query.priceType) params.append('priceType', query.priceType);
    if (query.priceSource) params.append('priceSource', query.priceSource);
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.offset) params.append('offset', query.offset.toString());
    if (query.sortBy) params.append('sortBy', query.sortBy);
    if (query.sortOrder) params.append('sortOrder', query.sortOrder);

    const response = await apiService.api.get<PriceHistoryResponse>(
      `/api/v1/price-history/asset/${assetId}?${params.toString()}`
    );
    
    return response.data;
  }

  /**
   * Get latest price history for an asset
   */
  async getLatestPriceHistory(
    assetId: string,
    limit: number = 10
  ): Promise<PriceHistoryResponse> {
    return this.getPriceHistory(assetId, {
      limit,
      sortBy: 'createdAt',
      sortOrder: 'DESC'
    });
  }

  /**
   * Get price history by date range
   */
  async getPriceHistoryByDateRange(
    assetId: string,
    startDate: string,
    endDate: string,
    limit?: number
  ): Promise<PriceHistoryResponse> {
    return this.getPriceHistory(assetId, {
      startDate,
      endDate,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'ASC'
    });
  }

  /**
   * Get price history by type
   */
  async getPriceHistoryByType(
    assetId: string,
    priceType: string,
    limit?: number
  ): Promise<PriceHistoryResponse> {
    return this.getPriceHistory(assetId, {
      priceType,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'DESC'
    });
  }

  /**
   * Get price history by source
   */
  async getPriceHistoryBySource(
    assetId: string,
    priceSource: string,
    limit?: number
  ): Promise<PriceHistoryResponse> {
    return this.getPriceHistory(assetId, {
      priceSource,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'DESC'
    });
  }

  /**
   * Delete a specific price history record
   */
  async deletePriceHistory(id: string): Promise<void> {
    await apiService.api.delete(`/api/v1/price-history/${id}`);
  }
}

export const priceHistoryService = new PriceHistoryService();
