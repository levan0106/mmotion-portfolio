/**
 * API service for Portfolio Management System
 */

import axios, { AxiosInstance } from 'axios';
import { logApiCall } from '../utils/apiLogger';
import {
  Portfolio,
  CreatePortfolioDto,
  UpdatePortfolioDto,
  AssetAllocationResponse,
  PerformanceMetrics,
  PerformanceHistoryResponse,
  NavSnapshot,
  CashFlow,
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
      timeout: 60000, // Increased to 60 seconds for long-running operations
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include JWT token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('jwt_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle token expiration
    this.api.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Don't redirect for login/register/change-password endpoints - let them handle the error
          const url = error.config?.url || '';
          if (url.includes('/auth/login-or-register') || 
              url.includes('/auth/check-user') || 
              url.includes('/auth/change-password') ||
              url.includes('/auth/set-password')) {
            return Promise.reject(error);
          }
          
          // For other endpoints, redirect to login
          localStorage.removeItem('jwt_token');
          localStorage.removeItem('user_session');
          localStorage.removeItem('current_account');
          localStorage.removeItem('isAuthenticated');
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
    logApiCall(url);
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
  async getAssets(accountId: string): Promise<Asset[]> {
    const response = await this.api.get(`/api/v1/assets?accountId=${accountId}`);
    return response.data;
  }

  async createAsset(data: any, accountId: string): Promise<Asset> {
    const response = await this.api.post(`/api/v1/assets?accountId=${accountId}`, data);
    return response.data;
  }

  async updateAsset(id: string, accountId: string, data: any): Promise<Asset> {
    const response = await this.api.put(`/api/v1/assets/${id}?accountId=${accountId}`, data);
    return response.data;
  }

  async deleteAsset(id: string, accountId: string): Promise<void> {
    await this.api.delete(`/api/v1/assets/${id}?accountId=${accountId}`);
  }

  // Portfolio endpoints
  async getPortfolios(accountId: string): Promise<Portfolio[]> {
    const response = await this.api.get(`/api/v1/portfolios?accountId=${accountId}`);
    return response.data;
  }

  async getPortfolio(id: string, accountId: string): Promise<Portfolio> {
    const response = await this.api.get(`/api/v1/portfolios/${id}?accountId=${accountId}`);
    return response.data;
  }

  async createPortfolio(data: CreatePortfolioDto, accountId: string): Promise<Portfolio> {
    const requestData = { ...data, accountId };
    const response = await this.api.post(`/api/v1/portfolios`, requestData);
    return response.data;
  }

  async updatePortfolio(id: string, accountId: string, data: UpdatePortfolioDto): Promise<Portfolio> {
    const response = await this.api.put(`/api/v1/portfolios/${id}?accountId=${accountId}`, data);
    return response.data;
  }

  async deletePortfolio(id: string, accountId: string): Promise<void> {
    await this.api.delete(`/api/v1/portfolios/${id}?accountId=${accountId}`);
  }

  async copyPortfolio(data: { sourcePortfolioId: string; name: string }): Promise<Portfolio> {
    const response = await this.api.post('/api/v1/portfolios/copy', data);
    return response.data;
  }

  // Public portfolio methods
  async getPublicPortfolios(): Promise<Portfolio[]> {
    const response = await this.api.get('/api/v1/portfolios/public-templates');
    return response.data;
  }

  async copyFromPublicPortfolio(data: { sourcePortfolioId: string; targetAccountId: string; name: string }): Promise<Portfolio> {
    const response = await this.api.post('/api/v1/portfolios/copy-from-public', data);
    return response.data;
  }

  async updatePortfolioVisibility(portfolioId: string, accountId: string, data: { visibility: 'PRIVATE' | 'PUBLIC'; templateName?: string; description?: string }): Promise<Portfolio> {
    const response = await this.api.put(`/api/v1/portfolios/${portfolioId}/visibility?accountId=${accountId}`, data);
    return response.data;
  }

  // Admin notification methods
  async broadcastNotification(data: {
    title: string;
    message: string;
    type?: string;
    actionUrl?: string;
    priority?: string;
    targetUsers?: string[];
    targetRole?: string;
    sendToAll?: boolean;
  }): Promise<{ message: string; sentCount: number }> {
    const response = await this.api.post('/api/v1/notifications/admin/broadcast', data);
    return response.data;
  }

  async getUsers(): Promise<any[]> {
    try {
      const response = await this.api.get('/api/v1/users');
      
      // Handle different response formats
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray(response.data.users)) {
        return response.data.users;
      } else {
        // Unexpected response format
        return [];
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      // Return empty array on error
      return [];
    }
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
    const response = await this.api.get(`/api/v1/portfolios/${portfolioId}/analytics/performance-history`, {
      params: { period },
    });
    return response.data;
  }

  async getPortfolioAnalyticsReport(portfolioId: string): Promise<any> {
    const response = await this.api.get(`/api/v1/portfolios/${portfolioId}/analytics/report`);
    return response.data;
  }

  // Cash flow endpoints
  async getPortfolioCashFlows(portfolioId: string, accountId: string): Promise<CashFlow[]> {
    const response = await this.api.get(`/api/v1/portfolios/${portfolioId}/cash-flows?accountId=${accountId}`);
    return response.data;
  }

  // Trading endpoints
  async createTrade(data: any, accountId: string): Promise<any> {
    const response = await this.api.post(`/api/v1/trades?accountId=${accountId}`, data);
    return response.data;
  }

  // New method to get all trades for a specific asset across all portfolios
  async getAllTradesForAsset(assetId: string, accountId: string): Promise<any[]> {
    const params = new URLSearchParams({ accountId, assetId });
    const response = await this.api.get(`/api/v1/trades?${params}`);
    return response.data;
  }

  async getTrade(id: string, accountId: string): Promise<any> {
    const response = await this.api.get(`/api/v1/trades/${id}?accountId=${accountId}`);
    return response.data;
  }

  async updateTrade(id: string, accountId: string, data: any): Promise<Trade> {
    const response = await this.api.put(`/api/v1/trades/${id}?accountId=${accountId}`, data);
    return response.data;
  }

  async deleteTrade(id: string, accountId: string): Promise<void> {
    await this.api.delete(`/api/v1/trades/${id}?accountId=${accountId}`);
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
    granularity?: string;
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

  async getInvestorHoldings(accountId: string): Promise<InvestorHolding[]> {
    const response = await this.api.get(`/api/v1/investor-holdings/account/${accountId}`);
    return response.data;
  }

  async getHoldingDetail(holdingId: string): Promise<HoldingDetail> {
    const response = await this.api.get(`/api/v1/investor-holdings/${holdingId}/detail`);
    return response.data;
  }

  // Trading transactions
  async getTrades(portfolioId: string, accountId: string, filters?: {
    assetId?: string;
    side?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<any[]> {
    const params = { portfolioId, accountId, ...filters };
    const response = await this.api.get('/api/v1/trades', { params });
    return response.data;
  }

  // Cash flow transactions
  async getCashFlowHistory(portfolioId: string, accountId: string, filters?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: CashFlow[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = { accountId, ...filters };
    const response = await this.api.get(`/api/v1/portfolios/${portfolioId}/cash-flow/history`, { params });
    return response.data;
  }

  async convertPortfolioToFund(portfolioId: string, snapshotDate?: string): Promise<Portfolio> {
    const params = snapshotDate ? { snapshotDate } : {};
    const response = await this.api.post(`/api/v1/portfolios/${portfolioId}/convert-to-fund`, {}, { params });
    return response.data;
  }

  async convertFundToPortfolio(portfolioId: string, accountId: string): Promise<{ success: boolean; message: string; portfolioId: string }> {
    const response = await this.api.post(`/api/v1/portfolios/${portfolioId}/convert-to-portfolio?accountId=${accountId}`);
    return response.data;
  }

  async updateHoldingTransaction(transactionId: string, updateData: {
    units?: number;
    amount?: number;
    description?: string;
    transactionDate?: string;
  }): Promise<any> {
    const response = await this.api.put(`/api/v1/investor-holdings/fund-unit-transactions/${transactionId}`, updateData);
    return response.data;
  }

  async deleteHoldingTransaction(transactionId: string): Promise<any> {
    const response = await this.api.delete(`/api/v1/investor-holdings/fund-unit-transactions/${transactionId}`);
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

  async refreshNavPerUnit(portfolioId: string): Promise<{
    portfolioId: string;
    navPerUnit: number;
    totalAllValue: number;
    totalOutstandingUnits: number;
  }> {
    const response = await this.api.post(`/api/v1/portfolios/${portfolioId}/refresh-nav-per-unit`);
    return response.data;
  }

  async recalculateAllHoldings(portfolioId: string): Promise<{
    portfolioId: string;
    updatedHoldingsCount: number;
  }> {
    const response = await this.api.post(`/api/v1/investor-holdings/recalculate-all/${portfolioId}`);
    return response.data;
  }

  // Cash Flow endpoints
  async getPortfolioCashFlowHistory(
    portfolioId: string, 
    accountId: string, 
    options?: { 
      page?: number; 
      limit?: number; 
      startDate?: string; 
      endDate?: string; 
      types?: string[] 
    }
  ): Promise<any> {
    const params = new URLSearchParams();
    params.append('accountId', accountId);
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.types && options.types.length > 0) {
      options.types.forEach(type => params.append('types', type));
    }
    
    const response = await this.api.get(`/api/v1/portfolios/${portfolioId}/cash-flow/history?${params.toString()}`);
    return response.data;
  }

  async createCashFlow(
    portfolioId: string, 
    accountId: string, 
    type: string, 
    data: any
  ): Promise<any> {
    const response = await this.api.post(`/api/v1/portfolios/${portfolioId}/cash-flow/${type}?accountId=${accountId}`, data);
    return response.data;
  }

  async updateCashFlow(
    portfolioId: string, 
    accountId: string, 
    cashFlowId: string, 
    data: any
  ): Promise<any> {
    const response = await this.api.put(`/api/v1/portfolios/${portfolioId}/cash-flow/${cashFlowId}?accountId=${accountId}`, data);
    return response.data;
  }

  async deleteCashFlow(
    portfolioId: string, 
    accountId: string, 
    cashFlowId: string
  ): Promise<void> {
    await this.api.delete(`/api/v1/portfolios/${portfolioId}/cash-flow/${cashFlowId}?accountId=${accountId}`);
  }

  async cancelCashFlow(
    portfolioId: string, 
    accountId: string, 
    cashFlowId: string
  ): Promise<any> {
    const response = await this.api.put(`/api/v1/portfolios/${portfolioId}/cash-flow/${cashFlowId}/cancel?accountId=${accountId}`);
    return response.data;
  }

  async transferCashFlow(
    portfolioId: string, 
    accountId: string, 
    data: any
  ): Promise<any> {
    const response = await this.api.post(`/api/v1/portfolios/${portfolioId}/cash-flow/transfer?accountId=${accountId}`, data);
    return response.data;
  }

  // Deposit Management endpoints
  async getDeposits(accountId: string, params?: { portfolioId?: string }): Promise<any> {
    const queryParams = new URLSearchParams();
    queryParams.append('accountId', accountId);
    if (params?.portfolioId && params.portfolioId !== 'ALL') {
      queryParams.append('portfolioId', params.portfolioId);
    }
    const response = await this.api.get(`/api/v1/deposits?${queryParams.toString()}`);
    return response.data;
  }

  async getDepositAnalytics(accountId: string, params?: { portfolioId?: string }): Promise<any> {
    const queryParams = new URLSearchParams();
    queryParams.append('accountId', accountId);
    if (params?.portfolioId && params.portfolioId !== 'ALL') {
      queryParams.append('portfolioId', params.portfolioId);
    }
    const response = await this.api.get(`/api/v1/deposits/analytics?${queryParams.toString()}`);
    return response.data;
  }

  async createDeposit(data: any): Promise<any> {
    const response = await this.api.post('/api/v1/deposits', data);
    return response.data;
  }

  async updateDeposit(id: string, data: any): Promise<any> {
    const response = await this.api.put(`/api/v1/deposits/${id}`, data);
    return response.data;
  }

  async deleteDeposit(id: string): Promise<void> {
    await this.api.delete(`/api/v1/deposits/${id}`);
  }

  // Global Assets endpoints
  async triggerGlobalAssetsSync(): Promise<any> {
    const response = await this.api.post('/api/v1/global-assets/auto-sync/trigger');
    return response.data;
  }

  // NAV History endpoints
  async getPortfolioNAVHistory(
    portfolioId: string, 
    accountId: string, 
    options?: { months?: number; granularity?: string }
  ): Promise<any> {
    const params = new URLSearchParams();
    params.append('accountId', accountId);
    if (options?.months) params.append('months', options.months.toString());
    if (options?.granularity) params.append('granularity', options.granularity);
    
    const response = await this.api.get(`/api/v1/portfolios/${portfolioId}/nav/history?${params.toString()}`);
    return response.data;
  }

  // Market Data endpoints
  async getMarketDataStats(): Promise<any> {
    const response = await this.api.get('/api/v1/market-data/statistics');
    return response.data;
  }

  async getMarketDataProviders(): Promise<any> {
    const response = await this.api.get('/api/v1/market-data/providers');
    return response.data;
  }

  async updatePricesByNation(nation: string): Promise<any> {
    const response = await this.api.post(`/api/v1/market-data/update-by-nation/${nation}`);
    return response.data;
  }

  async updatePricesByMarket(marketCode: string): Promise<any> {
    const response = await this.api.post(`/api/v1/market-data/update-by-market/${marketCode}`);
    return response.data;
  }

  async testMarketDataProvider(providerName: string): Promise<any> {
    const response = await this.api.post(`/api/v1/market-data/test-connection/${providerName}`);
    return response.data;
  }

  async getMarketDataConfig(): Promise<any> {
    const response = await this.api.get('/api/v1/market-data/config');
    return response.data;
  }

  async updateMarketDataConfig(config: any): Promise<any> {
    const response = await this.api.post('/api/v1/market-data/config', config);
    return response.data;
  }

  // Historical Prices endpoints
  async getHistoricalPrices(params?: { symbols?: string; startDate?: string; endDate?: string }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.symbols) queryParams.append('symbols', params.symbols);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const response = await this.api.get(`/api/v1/market-data/historical-prices?${queryParams.toString()}`);
    return response.data;
  }

  async updateHistoricalPrices(data: any): Promise<any> {
    const response = await this.api.post('/api/v1/market-data/historical-prices/update', data);
    return response.data;
  }

  // Snapshot endpoints
  async getSnapshots(params?: any, accountId?: string): Promise<any> {
    const queryParams = new URLSearchParams();
    if (accountId) queryParams.append('accountId', accountId);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const response = await this.api.get(`/api/v1/snapshots?${queryParams.toString()}`);
    return response.data;
  }

  async getSnapshotsPaginated(params?: any, accountId?: string): Promise<any> {
    const queryParams = new URLSearchParams();
    if (accountId) queryParams.append('accountId', accountId);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const response = await this.api.get(`/api/v1/snapshots/paginated?${queryParams.toString()}`);
    return response.data;
  }

  async getPortfolioSnapshotsPaginated(
    portfolioId: string,
    options?: { page?: number; limit?: number; startDate?: string; endDate?: string; granularity?: string; isActive?: boolean; orderBy?: string; orderDirection?: 'ASC' | 'DESC' }
  ): Promise<any> {
    const params = new URLSearchParams();
    params.append('portfolioId', portfolioId);
    
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.granularity) params.append('granularity', options.granularity);
    if (options?.isActive !== undefined) params.append('isActive', options.isActive.toString());
    if (options?.orderBy) params.append('orderBy', options.orderBy);
    if (options?.orderDirection) params.append('orderDirection', options.orderDirection);

    const response = await this.api.get(`/api/v1/portfolio-snapshots?${params.toString()}`);
    return response.data;
  }

  async createSnapshot(data: any): Promise<any> {
    const response = await this.api.post('/api/v1/snapshots', data);
    return response.data;
  }

  async createPortfolioSnapshots(
    portfolioId: string,
    options: { startDate?: string; endDate?: string; granularity?: string; createdBy?: string } = {}
  ): Promise<any> {
    const response = await this.api.post(`/api/v1/snapshots/portfolio/${portfolioId}`, options);
    return response.data;
  }

  async createBulkPortfolioSnapshots(
    portfolioIds: string[],
    options: { startDate?: string; endDate?: string; granularity?: string; createdBy?: string } = {}
  ): Promise<any> {
    const response = await this.api.post('/api/v1/snapshots/portfolio/bulk', {
      portfolioIds,
      ...options
    });
    return response.data;
  }

  async updateSnapshot(id: string, data: any): Promise<any> {
    const response = await this.api.put(`/api/v1/snapshots/${id}`, data);
    return response.data;
  }

  async deleteSnapshot(id: string): Promise<void> {
    await this.api.delete(`/api/v1/snapshots/${id}`);
  }

  async getSnapshotById(id: string): Promise<any> {
    const response = await this.api.get(`/api/v1/snapshots/${id}`);
    return response.data;
  }

  async getLatestSnapshot(portfolioId: string, assetId?: string, granularity?: string): Promise<any> {
    const params = new URLSearchParams();
    if (assetId) params.append('assetId', assetId);
    if (granularity) params.append('granularity', granularity);

    const response = await this.api.get(`/api/v1/snapshots/latest/${portfolioId}?${params.toString()}`);
    return response.data;
  }

  async getSnapshotStatistics(portfolioId: string): Promise<any> {
    const response = await this.api.get(`/api/v1/snapshots/statistics/${portfolioId}`);
    return response.data;
  }

  async bulkRecalculateSnapshots(portfolioId: string, accountId: string, snapshotDate?: string): Promise<any> {
    const queryParams = new URLSearchParams();
    queryParams.append('accountId', accountId);
    if (snapshotDate) queryParams.append('snapshotDate', snapshotDate);

    const response = await this.api.post(`/api/v1/snapshots/bulk-recalculate/${portfolioId}?${queryParams.toString()}`);
    return response.data;
  }

  async deleteSnapshotsByDateRange(
    portfolioId: string,
    startDate: string,
    endDate: string,
    granularity?: string
  ): Promise<any> {
    const queryParams = new URLSearchParams();
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
    if (granularity) queryParams.append('granularity', granularity);

    const response = await this.api.delete(`/api/v1/snapshots/portfolio/${portfolioId}/date-range?${queryParams.toString()}`);
    return response.data;
  }

  async deleteSnapshotsByDate(
    portfolioId: string,
    snapshotDate: string,
    granularity?: string
  ): Promise<any> {
    const queryParams = new URLSearchParams();
    queryParams.append('snapshotDate', snapshotDate);
    if (granularity) queryParams.append('granularity', granularity);

    const response = await this.api.delete(`/api/v1/snapshots/portfolio/${portfolioId}/date?${queryParams.toString()}`);
    return response.data;
  }

  async getPortfoliosWithSnapshots(accountId: string): Promise<any> {
    const response = await this.api.get(`/api/v1/snapshots/portfolios?accountId=${accountId}`);
    return response.data;
  }

  // Performance Snapshot endpoints
  async createPerformanceSnapshots(data: any): Promise<any> {
    const response = await this.api.post('/api/v1/performance-snapshots', data);
    return response.data;
  }

  async getPortfolioPerformanceSnapshots(
    portfolioId: string,
    query?: { startDate?: string; endDate?: string; granularity?: string; page?: number; limit?: number }
  ): Promise<any> {
    const params = new URLSearchParams();
    
    if (query?.startDate) params.append('startDate', query.startDate);
    if (query?.endDate) params.append('endDate', query.endDate);
    if (query?.granularity) params.append('granularity', query.granularity);
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());

    const response = await this.api.get(`/api/v1/performance-snapshots/portfolio/${portfolioId}?${params.toString()}`);
    return response.data;
  }

  async getAssetPerformanceSnapshots(
    portfolioId: string,
    query?: { assetId?: string; startDate?: string; endDate?: string; granularity?: string; page?: number; limit?: number }
  ): Promise<any> {
    const params = new URLSearchParams();
    
    if (query?.assetId) params.append('assetId', query.assetId);
    if (query?.startDate) params.append('startDate', query.startDate);
    if (query?.endDate) params.append('endDate', query.endDate);
    if (query?.granularity) params.append('granularity', query.granularity);
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());

    const response = await this.api.get(`/api/v1/performance-snapshots/asset/${portfolioId}?${params.toString()}`);
    return response.data;
  }

  async getPortfolioPerformanceSummary(portfolioId: string, period: string = '1Y'): Promise<any> {
    const params = new URLSearchParams();
    params.append('period', period);
    
    const response = await this.api.get(`/api/v1/performance-snapshots/portfolio/${portfolioId}/summary?${params.toString()}`);
    return response.data;
  }

  async getAssetPerformanceSummary(
    portfolioId: string,
    query?: { assetId?: string; period?: string }
  ): Promise<any> {
    const params = new URLSearchParams();
    
    if (query?.assetId) params.append('assetId', query.assetId);
    if (query?.period) params.append('period', query.period);

    const response = await this.api.get(`/api/v1/performance-snapshots/asset/${portfolioId}/summary?${params.toString()}`);
    return response.data;
  }

  async deletePerformanceSnapshotsByDateRange(
    portfolioId: string,
    startDate: string,
    endDate: string,
    granularity?: string
  ): Promise<any> {
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    
    if (granularity) params.append('granularity', granularity);

    const response = await this.api.delete(`/api/v1/performance-snapshots/portfolio/${portfolioId}?${params.toString()}`);
    return response.data;
  }

  async exportPerformanceSnapshots(
    portfolioId: string,
    query?: { startDate?: string; endDate?: string; granularity?: string }
  ): Promise<any> {
    const params = new URLSearchParams();
    
    if (query?.startDate) params.append('startDate', query.startDate);
    if (query?.endDate) params.append('endDate', query.endDate);
    if (query?.granularity) params.append('granularity', query.granularity);

    const response = await this.api.get(`/api/v1/performance-snapshots/export/${portfolioId}?${params.toString()}`);
    return response.data;
  }

  async getPerformanceDashboardData(portfolioId: string): Promise<any> {
    const response = await this.api.get(`/api/v1/performance-snapshots/dashboard/${portfolioId}`);
    return response.data;
  }

  async getPerformanceComparison(
    portfolioId: string,
    benchmarkId: string,
    period: string = '1Y'
  ): Promise<any> {
    const params = new URLSearchParams();
    params.append('benchmarkId', benchmarkId);
    params.append('period', period);

    const response = await this.api.get(`/api/v1/performance-snapshots/comparison/${portfolioId}?${params.toString()}`);
    return response.data;
  }

  async getRiskAnalysis(portfolioId: string, period: string = '1Y'): Promise<any> {
    const params = new URLSearchParams();
    params.append('period', period);

    const response = await this.api.get(`/api/v1/performance-snapshots/risk-analysis/${portfolioId}?${params.toString()}`);
    return response.data;
  }

  async getPerformanceAttribution(portfolioId: string, period: string = '1Y'): Promise<any> {
    const params = new URLSearchParams();
    params.append('period', period);

    const response = await this.api.get(`/api/v1/performance-snapshots/attribution/${portfolioId}?${params.toString()}`);
    return response.data;
  }

  async getPerformanceTrends(
    portfolioId: string,
    metric: string,
    period: string = '1Y'
  ): Promise<any> {
    const params = new URLSearchParams();
    params.append('metric', metric);
    params.append('period', period);

    const response = await this.api.get(`/api/v1/performance-snapshots/trends/${portfolioId}?${params.toString()}`);
    return response.data;
  }

  async getBenchmarkData(
    benchmarkId: string,
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    const params = new URLSearchParams();
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await this.api.get(`/api/v1/performance-snapshots/benchmark/${benchmarkId}?${params.toString()}`);
    return response.data;
  }

  async getAvailableBenchmarks(): Promise<any> {
    const response = await this.api.get('/api/v1/performance-snapshots/benchmarks');
    return response.data;
  }

  async getPerformanceAlerts(portfolioId: string): Promise<any> {
    const response = await this.api.get(`/api/v1/performance-snapshots/alerts/${portfolioId}`);
    return response.data;
  }

  async createPerformanceAlert(portfolioId: string, alert: any): Promise<any> {
    const response = await this.api.post(`/api/v1/performance-snapshots/alerts/${portfolioId}`, alert);
    return response.data;
  }

  async updatePerformanceAlert(portfolioId: string, alertId: string, alert: any): Promise<any> {
    const response = await this.api.put(`/api/v1/performance-snapshots/alerts/${portfolioId}/${alertId}`, alert);
    return response.data;
  }

  async deletePerformanceAlert(portfolioId: string, alertId: string): Promise<any> {
    const response = await this.api.delete(`/api/v1/performance-snapshots/alerts/${portfolioId}/${alertId}`);
    return response.data;
  }

  // Account Management endpoints
  async getAccounts(): Promise<any> {
    const response = await this.api.get('/api/v1/accounts');
    return response.data;
  }

  async getAccount(accountId: string): Promise<any> {
    const response = await this.api.get(`/api/v1/accounts/${accountId}`);
    return response.data;
  }

  async createAccount(data: any): Promise<any> {
    const response = await this.api.post('/api/v1/accounts', data);
    return response.data;
  }

  async updateAccount(accountId: string, data: any): Promise<any> {
    const response = await this.api.put(`/api/v1/accounts/${accountId}`, data);
    return response.data;
  }

  async deleteAccount(accountId: string): Promise<void> {
    await this.api.delete(`/api/v1/accounts/${accountId}`);
  }

  // Deposit Management endpoints (Portfolio-specific)
  async getPortfolioDeposits(portfolioId: string): Promise<any> {
    const response = await this.api.get(`/api/v1/deposits/portfolio/${portfolioId}`);
    return response.data;
  }

  async getPortfolioDepositAnalytics(portfolioId: string): Promise<any> {
    const response = await this.api.get(`/api/v1/deposits/portfolio/${portfolioId}/analytics`);
    return response.data;
  }

  async getPortfolioAssetPerformance(portfolioId: string): Promise<any> {
    const response = await this.api.get(`/api/v1/portfolios/${portfolioId}/analytics/asset-performance`);
    return response.data;
  }

  async settleDeposit(depositId: string, data: any): Promise<any> {
    const response = await this.api.post(`/api/v1/deposits/${depositId}/settle`, data);
    return response.data;
  }

  // Report endpoints
  async getReportData(accountId: string, portfolioId?: string): Promise<any> {

    let url = `/api/v1/reports?accountId=${accountId}`;
    if (portfolioId && portfolioId !== 'all') {
      url += `&portfolioId=${portfolioId}`;

    } else {

    }

    const response = await this.api.get(url);

    return response.data;
  }

  // Investor Report endpoints
  async getInvestorReport(portfolioId: string, accountId: string): Promise<any> {
    const response = await this.api.get(`/api/v1/investor-report/${portfolioId}?accountId=${accountId}`);
    return response.data;
  }

  async getInvestorPortfolios(accountId: string): Promise<any[]> {
    const response = await this.api.get(`/api/v1/investor-report/portfolios?accountId=${accountId}`);
    return response.data;
  }
}

// Create and export singleton instance
export const apiService = new ApiService();
export default apiService;
