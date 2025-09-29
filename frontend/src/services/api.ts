/**
 * API service for Portfolio Management System
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  Portfolio,
  CreatePortfolioDto,
  UpdatePortfolioDto,
  AssetAllocationResponse,
  PerformanceMetrics,
  PerformanceHistoryResponse,
  NavSnapshot,
  CashFlow,
  CashFlowFormData,
  ApiResponse,
  Asset,
  Trade,
  InvestorHolding,
  SubscribeToFundDto,
  RedeemFromFundDto,
  SubscriptionResult,
  RedemptionResult,
  HoldingDetail,
} from '../types';

class ApiService {
  public api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Health check
  async getHealth(): Promise<ApiResponse<any>> {
    const response = await this.api.get('/health');
    return response.data;
  }

  // Generic GET method
  async get<T = any>(url: string, config?: any): Promise<T> {
    const response = await this.api.get(url, config);
    return response.data;
  }

  // Generic POST method
  async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.api.post(url, data, config);
    return response.data;
  }

  // Generic PUT method
  async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.api.put(url, data, config);
    return response.data;
  }

  // Generic DELETE method
  async delete<T = any>(url: string, config?: any): Promise<T> {
    const response = await this.api.delete(url, config);
    return response.data;
  }

  // Asset endpoints
  async getAssets(): Promise<Asset[]> {
    const response = await this.api.get('/api/v1/assets');
    return response.data;
  }

  async createAsset(data: any): Promise<Asset> {
    const response = await this.api.post('/api/v1/assets', data);
    return response.data;
  }

  async updateAsset(id: string, data: any): Promise<Asset> {
    const response = await this.api.put(`/api/v1/assets/${id}`, data);
    return response.data;
  }

  async deleteAsset(id: string): Promise<void> {
    await this.api.delete(`/api/v1/assets/${id}`);
  }

  // Portfolio endpoints
  async getPortfolios(accountId: string): Promise<Portfolio[]> {
    const response = await this.api.get(`/api/v1/portfolios?accountId=${accountId}`);
    return response.data;
  }

  async getPortfolio(id: string): Promise<Portfolio> {
    const response = await this.api.get(`/api/v1/portfolios/${id}`);
    return response.data;
  }

  async createPortfolio(data: CreatePortfolioDto): Promise<Portfolio> {
    const response = await this.api.post('/api/v1/portfolios', data);
    return response.data;
  }

  async updatePortfolio(id: string, data: UpdatePortfolioDto): Promise<Portfolio> {
    const response = await this.api.put(`/api/v1/portfolios/${id}`, data);
    return response.data;
  }

  async deletePortfolio(id: string): Promise<void> {
    await this.api.delete(`/api/v1/portfolios/${id}`);
  }

  async copyPortfolio(data: { sourcePortfolioId: string; name: string }): Promise<Portfolio> {
    const response = await this.api.post('/api/v1/portfolios/copy', data);
    return response.data;
  }

  // Portfolio analytics endpoints
  // async getPortfolioNav(portfolioId: string): Promise<{ navValue: number; totalValue: number }> {
  //   const response = await this.api.get(`/api/v1/portfolios/${portfolioId}/nav`);
  //   return response.data;
  // }

  async getPortfolioPerformance(portfolioId: string): Promise<PerformanceMetrics> {
    const response = await this.api.get(`/api/v1/portfolios/${portfolioId}/performance`);
    return response.data;
  }

  async getPortfolioAllocation(portfolioId: string): Promise<AssetAllocationResponse> {
    const response = await this.api.get(`/api/v1/portfolios/${portfolioId}/analytics/allocation`);
    return response.data;
  }

  async getPortfolioPerformanceHistory(portfolioId: string, period?: string): Promise<PerformanceHistoryResponse> {
    const params = period ? { period } : {};
    const response = await this.api.get(`/api/v1/portfolios/${portfolioId}/analytics/performance-history`, { params });
    return response.data;
  }

  async getPortfolioRiskReturn(portfolioId: string, period?: string): Promise<any> {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    
    const queryString = params.toString();
    const url = `/api/v1/portfolios/${portfolioId}/analytics/risk-return${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.api.get(url);
    return response.data;
  }


  async getPortfolioRiskMetrics(portfolioId: string): Promise<any> {
    const response = await this.api.get(`/api/v1/portfolios/${portfolioId}/analytics/risk-metrics`);
    return response.data;
  }

  async getPortfolioDiversificationHeatmap(portfolioId: string): Promise<any> {
    const response = await this.api.get(`/api/v1/portfolios/${portfolioId}/analytics/diversification-heatmap`);
    return response.data;
  }

  async getPortfolioAllocationTimeline(
    portfolioId: string, 
    months?: number, 
    granularity?: string
  ): Promise<any> {
    const params = new URLSearchParams();
    if (months) params.append('months', months.toString());
    if (granularity) params.append('granularity', granularity);
    
    const queryString = params.toString();
    const url = `/api/v1/portfolios/${portfolioId}/analytics/allocation-timeline${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.api.get(url);
    return response.data;
  }

  async getPortfolioCashFlowAnalysis(portfolioId: string): Promise<any> {
    const response = await this.api.get(`/api/v1/portfolios/${portfolioId}/analytics/cash-flow-analysis`);
    return response.data;
  }

  async getPortfolioBenchmarkComparison(portfolioId: string, months?: number, twrPeriod?: string): Promise<any> {
    const params: any = {};
    if (months) params.months = months.toString();
    if (twrPeriod) params.twrPeriod = twrPeriod;
    const response = await this.api.get(`/api/v1/portfolios/${portfolioId}/analytics/benchmark-comparison`, { params });
    return response.data;
  }

  async getPortfolioMWRBenchmarkComparison(portfolioId: string, months?: number, mwrPeriod?: string): Promise<any> {
    const params: any = {};
    if (months) params.months = months.toString();
    if (mwrPeriod) params.mwrPeriod = mwrPeriod;
    const response = await this.api.get(`/api/v1/portfolios/${portfolioId}/analytics/mwr-benchmark-comparison`, { params });
    return response.data;
  }

  async getPortfolioAssetDetailSummary(portfolioId: string): Promise<any> {
    const response = await this.api.get(`/api/v1/portfolios/${portfolioId}/analytics/asset-detail-summary`);
    return response.data;
  }

  async getPortfolioPositions(portfolioId: string): Promise<any> {
    const response = await this.api.get(`/api/v1/portfolios/${portfolioId}/positions`);
    return response.data;
  }

  // Advanced analytics endpoints
  async getPortfolioAnalyticsPerformance(portfolioId: string, period?: string): Promise<any> {
    const response = await this.api.get(`/api/v1/portfolios/${portfolioId}/analytics/asset-performance`, {
      params: { period },
    });
    return response.data;
  }

  async getPortfolioAnalyticsAllocation(portfolioId: string): Promise<any> {
    const response = await this.api.get(`/api/v1/portfolios/${portfolioId}/analytics/allocation`);
    return response.data;
  }

  async getPortfolioAnalyticsHistory(portfolioId: string, period?: string): Promise<NavSnapshot[]> {
    const response = await this.api.get(`/api/v1/portfolios/${portfolioId}/analytics/history`, {
      params: { period },
    });
    return response.data;
  }

  async getPortfolioAnalyticsReport(portfolioId: string): Promise<any> {
    const response = await this.api.get(`/api/v1/portfolios/${portfolioId}/analytics/report`);
    return response.data;
  }

  // Cash flow endpoints
  async getPortfolioCashFlows(portfolioId: string): Promise<CashFlow[]> {
    const response = await this.api.get(`/api/v1/portfolios/${portfolioId}/cash-flows`);
    return response.data;
  }

  async createCashFlow(portfolioId: string, data: CashFlowFormData): Promise<CashFlow> {
    const response = await this.api.post(`/api/v1/portfolios/${portfolioId}/cash-flows`, data);
    return response.data;
  }

  // Trading endpoints
  async createTrade(data: any): Promise<any> {
    const response = await this.api.post('/api/v1/trades', data);
    return response.data;
  }

  async getTrades(portfolioId: string, filters?: {
    assetId?: string;
    side?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any[]> {
    const params = new URLSearchParams({ portfolioId });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const response = await this.api.get(`/api/v1/trades?${params}`);
    return response.data;
  }

  async getTrade(id: string): Promise<any> {
    const response = await this.api.get(`/api/v1/trades/${id}`);
    return response.data;
  }

  async updateTrade(id: string, data: any): Promise<Trade> {
    const response = await this.api.put(`/api/v1/trades/${id}`, data);
    return response.data;
  }

  async deleteTrade(id: string): Promise<void> {
    await this.api.delete(`/api/v1/trades/${id}`);
  }

  async getTradeDetails(tradeId: string): Promise<any> {
    const response = await this.api.get(`/api/v1/trades/${tradeId}/details`);
    return response.data;
  }

  async getTradeAnalysis(portfolioId: string, filters?: {
    assetId?: string;
    startDate?: string;
    endDate?: string;
    timeframe?: string;
    metric?: string;
  }): Promise<any> {
    const params = new URLSearchParams({ portfolioId });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    const url = `/api/v1/trades/analysis/portfolio?${params}`;
    const response = await this.api.get(url);
    return response.data;
  }

  async getTradingPerformance(portfolioId: string, filters?: {
    assetId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    const params = new URLSearchParams({ portfolioId });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const response = await this.api.get(`/api/v1/trades/performance/portfolio?${params}`);
    return response.data;
  }

  // Position endpoints
  async getCurrentPositions(portfolioId: string, marketPrices?: Record<string, number>): Promise<any[]> {
    const params = new URLSearchParams();
    if (marketPrices) {
      params.append('marketPrices', JSON.stringify(marketPrices));
    }
    const response = await this.api.get(`/api/v1/portfolios/${portfolioId}/positions?${params}`);
    return response.data;
  }

  async getPositionByAsset(portfolioId: string, assetId: string, marketPrice?: number): Promise<any> {
    const params = new URLSearchParams();
    if (marketPrice) {
      params.append('marketPrice', marketPrice.toString());
    }
    const response = await this.api.get(`/api/v1/portfolios/${portfolioId}/positions/${assetId}?${params}`);
    return response.data;
  }

  // Risk management endpoints
  async setRiskTargets(assetId: string, data: any): Promise<any> {
    const response = await this.api.post(`/api/v1/assets/${assetId}/targets`, data);
    return response.data;
  }

  async getRiskTargets(assetId: string): Promise<any> {
    const response = await this.api.get(`/api/v1/assets/${assetId}/targets`);
    return response.data;
  }

  async updateRiskTargets(assetId: string, data: any): Promise<any> {
    const response = await this.api.put(`/api/v1/assets/${assetId}/targets`, data);
    return response.data;
  }

  async removeRiskTargets(assetId: string): Promise<void> {
    await this.api.delete(`/api/v1/assets/${assetId}/targets`);
  }

  async getPortfolioRiskTargets(portfolioId: string): Promise<any[]> {
    const response = await this.api.get(`/api/v1/assets/targets/portfolio/${portfolioId}`);
    return response.data;
  }

  async monitorRiskTargets(portfolioId?: string, marketPrices?: Record<string, number>): Promise<any> {
    const params = new URLSearchParams();
    if (portfolioId) params.append('portfolioId', portfolioId);
    if (marketPrices) params.append('marketPrices', JSON.stringify(marketPrices));
    const response = await this.api.get(`/api/v1/assets/targets/monitor?${params}`);
    return response.data;
  }

  // NAV/Unit System APIs
  async getFundInvestors(portfolioId: string): Promise<InvestorHolding[]> {
    const response = await this.api.get(`/api/v1/portfolios/${portfolioId}/investors`);
    return response.data;
  }

  async subscribeToFund(subscriptionDto: SubscribeToFundDto): Promise<SubscriptionResult> {
    const response = await this.api.post(`/api/v1/portfolios/${subscriptionDto.portfolioId}/investors/subscribe`, subscriptionDto);
    return response.data;
  }

  async redeemFromFund(redemptionDto: RedeemFromFundDto): Promise<RedemptionResult> {
    const response = await this.api.post(`/api/v1/portfolios/${redemptionDto.portfolioId}/investors/redeem`, redemptionDto);
    return response.data;
  }

  async getInvestorHolding(portfolioId: string, accountId: string): Promise<InvestorHolding> {
    const response = await this.api.get(`/api/v1/portfolios/${portfolioId}/investors/${accountId}`);
    return response.data;
  }

  async convertPortfolioToFund(portfolioId: string, snapshotDate?: string): Promise<Portfolio> {
    const params = snapshotDate ? { snapshotDate } : {};
    const response = await this.api.post(`/api/v1/portfolios/${portfolioId}/convert-to-fund`, {}, { params });
    return response.data;
  }

  async getHoldingDetail(holdingId: string): Promise<HoldingDetail> {
    const response = await this.api.get(`/api/v1/investor-holdings/${holdingId}/detail`);
    return response.data;
  }

  // Utility methods
  async testConnection(): Promise<boolean> {
    try {
      await this.getHealth();
      return true;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
}

// Create and export singleton instance
export const apiService = new ApiService();
export default apiService;
