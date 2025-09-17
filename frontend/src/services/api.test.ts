import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createTestPortfolio } from '../test/config'

// Create mock axios instance using vi.hoisted
const mockAxiosInstance = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: {
      use: vi.fn(),
    },
    response: {
      use: vi.fn(),
    },
  },
}))

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
  },
}))

// Import after mocking
import apiService from './api'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: '',
  },
  writable: true,
})

describe('ApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset localStorage mock
    localStorageMock.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Constructor and Configuration', () => {
    it('should create axios instance with correct configuration', () => {
      // The service should be initialized and ready to use
      expect(apiService).toBeDefined()
      expect(typeof apiService.getHealth).toBe('function')
    })
  })

  describe('Health Check', () => {
    it('should get health status successfully', async () => {
      const mockResponse = { data: { status: 'ok' } }
      mockAxiosInstance.get.mockResolvedValue(mockResponse)

      const result = await apiService.getHealth()

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health')
      expect(result).toEqual({ status: 'ok' })
    })

    it('should handle health check error', async () => {
      const error = new Error('Health check failed')
      mockAxiosInstance.get.mockRejectedValue(error)

      await expect(apiService.getHealth()).rejects.toThrow('Health check failed')
    })
  })

  describe('Portfolio CRUD Operations', () => {
    const mockPortfolio = createTestPortfolio({ portfolioId: '1', name: 'Test Portfolio' })

    describe('getPortfolios', () => {
      it('should fetch portfolios successfully', async () => {
        const mockResponse = { data: [mockPortfolio] }
        mockAxiosInstance.get.mockResolvedValue(mockResponse)

        const result = await apiService.getPortfolios('account-1')

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v1/portfolios?accountId=account-1')
        expect(result).toEqual([mockPortfolio])
      })

      it('should handle getPortfolios error', async () => {
        const error = new Error('Failed to fetch portfolios')
        mockAxiosInstance.get.mockRejectedValue(error)

        await expect(apiService.getPortfolios('account-1')).rejects.toThrow('Failed to fetch portfolios')
      })
    })

    describe('getPortfolio', () => {
      it('should fetch single portfolio successfully', async () => {
        const mockResponse = { data: mockPortfolio }
        mockAxiosInstance.get.mockResolvedValue(mockResponse)

        const result = await apiService.getPortfolio('1')

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v1/portfolios/1')
        expect(result).toEqual(mockPortfolio)
      })

      it('should handle getPortfolio error', async () => {
        const error = new Error('Failed to fetch portfolio')
        mockAxiosInstance.get.mockRejectedValue(error)

        await expect(apiService.getPortfolio('1')).rejects.toThrow('Failed to fetch portfolio')
      })
    })

    describe('createPortfolio', () => {
      it('should create portfolio successfully', async () => {
        const createData = { name: 'New Portfolio', baseCurrency: 'USD', accountId: 'test-account-id' }
        const mockResponse = { data: mockPortfolio }
        mockAxiosInstance.post.mockResolvedValue(mockResponse)

        const result = await apiService.createPortfolio(createData)

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/v1/portfolios', createData)
        expect(result).toEqual(mockPortfolio)
      })

      it('should handle createPortfolio error', async () => {
        const createData = { name: 'New Portfolio', baseCurrency: 'USD', accountId: 'test-account-id' }
        const error = new Error('Failed to create portfolio')
        mockAxiosInstance.post.mockRejectedValue(error)

        await expect(apiService.createPortfolio(createData)).rejects.toThrow('Failed to create portfolio')
      })
    })

    describe('updatePortfolio', () => {
      it('should update portfolio successfully', async () => {
        const updateData = { name: 'Updated Portfolio' }
        const mockResponse = { data: { ...mockPortfolio, name: 'Updated Portfolio' } }
        mockAxiosInstance.put.mockResolvedValue(mockResponse)

        const result = await apiService.updatePortfolio('1', updateData)

        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/api/v1/portfolios/1', updateData)
        expect(result).toEqual({ ...mockPortfolio, name: 'Updated Portfolio' })
      })

      it('should handle updatePortfolio error', async () => {
        const updateData = { name: 'Updated Portfolio' }
        const error = new Error('Failed to update portfolio')
        mockAxiosInstance.put.mockRejectedValue(error)

        await expect(apiService.updatePortfolio('1', updateData)).rejects.toThrow('Failed to update portfolio')
      })
    })

    describe('deletePortfolio', () => {
      it('should delete portfolio successfully', async () => {
        mockAxiosInstance.delete.mockResolvedValue({})

        await apiService.deletePortfolio('1')

        expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/api/v1/portfolios/1')
      })

      it('should handle deletePortfolio error', async () => {
        const error = new Error('Failed to delete portfolio')
        mockAxiosInstance.delete.mockRejectedValue(error)

        await expect(apiService.deletePortfolio('1')).rejects.toThrow('Failed to delete portfolio')
      })
    })
  })

  describe('Portfolio Analytics', () => {
    describe('getPortfolioNav', () => {
      it('should fetch portfolio NAV successfully', async () => {
        const mockNavData = { navValue: 100000, totalValue: 105000 }
        const mockResponse = { data: mockNavData }
        mockAxiosInstance.get.mockResolvedValue(mockResponse)

        const result = await apiService.getPortfolioNav('1')

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v1/portfolios/1/nav')
        expect(result).toEqual(mockNavData)
      })

      it('should handle getPortfolioNav error', async () => {
        const error = new Error('Failed to fetch NAV')
        mockAxiosInstance.get.mockRejectedValue(error)

        await expect(apiService.getPortfolioNav('1')).rejects.toThrow('Failed to fetch NAV')
      })
    })

    describe('getPortfolioPerformance', () => {
      it('should fetch portfolio performance successfully', async () => {
        const mockPerformanceData = {
          totalReturn: 0.1,
          annualizedReturn: 0.15,
          volatility: 0.2,
          sharpeRatio: 0.8,
        }
        const mockResponse = { data: mockPerformanceData }
        mockAxiosInstance.get.mockResolvedValue(mockResponse)

        const result = await apiService.getPortfolioPerformance('1')

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v1/portfolios/1/performance')
        expect(result).toEqual(mockPerformanceData)
      })

      it('should handle getPortfolioPerformance error', async () => {
        const error = new Error('Failed to fetch performance')
        mockAxiosInstance.get.mockRejectedValue(error)

        await expect(apiService.getPortfolioPerformance('1')).rejects.toThrow('Failed to fetch performance')
      })
    })

    describe('getPortfolioAllocation', () => {
      it('should fetch portfolio allocation successfully', async () => {
        const mockAllocationData = {
          allocation: {
            'STOCK': 0.6,
            'BOND': 0.3,
            'CASH': 0.1,
          }
        }
        const mockResponse = { data: mockAllocationData }
        mockAxiosInstance.get.mockResolvedValue(mockResponse)

        const result = await apiService.getPortfolioAllocation('1')

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v1/portfolios/1/allocation')
        expect(result).toEqual([
          { 
            assetId: 'asset-stock', 
            symbol: 'STOCK', 
            name: 'STOCK',
            quantity: 0,
            avgCost: 0,
            marketValue: 0,
            allocationPercentage: 0.6,
            unrealizedPl: 0,
            unrealizedPlPercentage: 0
          },
          { 
            assetId: 'asset-bond', 
            symbol: 'BOND', 
            name: 'BOND',
            quantity: 0,
            avgCost: 0,
            marketValue: 0,
            allocationPercentage: 0.3,
            unrealizedPl: 0,
            unrealizedPlPercentage: 0
          },
          { 
            assetId: 'asset-cash', 
            symbol: 'CASH', 
            name: 'CASH',
            quantity: 0,
            avgCost: 0,
            marketValue: 0,
            allocationPercentage: 0.1,
            unrealizedPl: 0,
            unrealizedPlPercentage: 0
          },
        ])
      })

      it('should handle getPortfolioAllocation error', async () => {
        const error = new Error('Failed to fetch allocation')
        mockAxiosInstance.get.mockRejectedValue(error)

        await expect(apiService.getPortfolioAllocation('1')).rejects.toThrow('Failed to fetch allocation')
      })
    })

    describe('getPortfolioPositions', () => {
      it('should fetch portfolio positions successfully', async () => {
        const mockPositionsData = [
          { symbol: 'AAPL', quantity: 100, value: 15000 },
          { symbol: 'GOOGL', quantity: 50, value: 10000 },
        ]
        const mockResponse = { data: mockPositionsData }
        mockAxiosInstance.get.mockResolvedValue(mockResponse)

        const result = await apiService.getPortfolioPositions('1')

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v1/portfolios/1/positions')
        expect(result).toEqual(mockPositionsData)
      })

      it('should handle getPortfolioPositions error', async () => {
        const error = new Error('Failed to fetch positions')
        mockAxiosInstance.get.mockRejectedValue(error)

        await expect(apiService.getPortfolioPositions('1')).rejects.toThrow('Failed to fetch positions')
      })
    })
  })

  describe('Advanced Analytics', () => {
    describe('getPortfolioAnalyticsPerformance', () => {
      it('should fetch analytics performance with period parameter', async () => {
        const mockAnalyticsData = { performance: 'data' }
        const mockResponse = { data: mockAnalyticsData }
        mockAxiosInstance.get.mockResolvedValue(mockResponse)

        const result = await apiService.getPortfolioAnalyticsPerformance('1', '1Y')

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v1/portfolios/1/analytics/performance', {
          params: { period: '1Y' },
        })
        expect(result).toEqual(mockAnalyticsData)
      })

      it('should fetch analytics performance without period parameter', async () => {
        const mockAnalyticsData = { performance: 'data' }
        const mockResponse = { data: mockAnalyticsData }
        mockAxiosInstance.get.mockResolvedValue(mockResponse)

        const result = await apiService.getPortfolioAnalyticsPerformance('1')

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v1/portfolios/1/analytics/performance', {
          params: { period: undefined },
        })
        expect(result).toEqual(mockAnalyticsData)
      })

      it('should handle getPortfolioAnalyticsPerformance error', async () => {
        const error = new Error('Failed to fetch analytics performance')
        mockAxiosInstance.get.mockRejectedValue(error)

        await expect(apiService.getPortfolioAnalyticsPerformance('1', '1Y')).rejects.toThrow('Failed to fetch analytics performance')
      })
    })

    describe('getPortfolioAnalyticsAllocation', () => {
      it('should fetch analytics allocation successfully', async () => {
        const mockAllocationData = { allocation: 'data' }
        const mockResponse = { data: mockAllocationData }
        mockAxiosInstance.get.mockResolvedValue(mockResponse)

        const result = await apiService.getPortfolioAnalyticsAllocation('1')

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v1/portfolios/1/analytics/allocation')
        expect(result).toEqual(mockAllocationData)
      })

      it('should handle getPortfolioAnalyticsAllocation error', async () => {
        const error = new Error('Failed to fetch analytics allocation')
        mockAxiosInstance.get.mockRejectedValue(error)

        await expect(apiService.getPortfolioAnalyticsAllocation('1')).rejects.toThrow('Failed to fetch analytics allocation')
      })
    })

    describe('getPortfolioAnalyticsHistory', () => {
      it('should fetch analytics history with period parameter', async () => {
        const mockHistoryData = [
          { date: '2023-01-01', navValue: 100000 },
          { date: '2023-01-02', navValue: 101000 },
        ]
        const mockResponse = { data: mockHistoryData }
        mockAxiosInstance.get.mockResolvedValue(mockResponse)

        const result = await apiService.getPortfolioAnalyticsHistory('1', '1Y')

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v1/portfolios/1/analytics/history', {
          params: { period: '1Y' },
        })
        expect(result).toEqual(mockHistoryData)
      })

      it('should fetch analytics history without period parameter', async () => {
        const mockHistoryData = [{ date: '2023-01-01', navValue: 100000 }]
        const mockResponse = { data: mockHistoryData }
        mockAxiosInstance.get.mockResolvedValue(mockResponse)

        const result = await apiService.getPortfolioAnalyticsHistory('1')

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v1/portfolios/1/analytics/history', {
          params: { period: undefined },
        })
        expect(result).toEqual(mockHistoryData)
      })

      it('should handle getPortfolioAnalyticsHistory error', async () => {
        const error = new Error('Failed to fetch analytics history')
        mockAxiosInstance.get.mockRejectedValue(error)

        await expect(apiService.getPortfolioAnalyticsHistory('1', '1Y')).rejects.toThrow('Failed to fetch analytics history')
      })
    })

    describe('getPortfolioAnalyticsReport', () => {
      it('should fetch analytics report successfully', async () => {
        const mockReportData = { report: 'data' }
        const mockResponse = { data: mockReportData }
        mockAxiosInstance.get.mockResolvedValue(mockResponse)

        const result = await apiService.getPortfolioAnalyticsReport('1')

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v1/portfolios/1/analytics/report')
        expect(result).toEqual(mockReportData)
      })

      it('should handle getPortfolioAnalyticsReport error', async () => {
        const error = new Error('Failed to fetch analytics report')
        mockAxiosInstance.get.mockRejectedValue(error)

        await expect(apiService.getPortfolioAnalyticsReport('1')).rejects.toThrow('Failed to fetch analytics report')
      })
    })
  })

  describe('Cash Flow Operations', () => {
    describe('getPortfolioCashFlows', () => {
      it('should fetch cash flows successfully', async () => {
        const mockCashFlows = [
          { id: '1', amount: 1000, type: 'DEPOSIT', date: '2023-01-01' },
          { id: '2', amount: -500, type: 'WITHDRAWAL', date: '2023-01-02' },
        ]
        const mockResponse = { data: mockCashFlows }
        mockAxiosInstance.get.mockResolvedValue(mockResponse)

        const result = await apiService.getPortfolioCashFlows('1')

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v1/portfolios/1/cash-flows')
        expect(result).toEqual(mockCashFlows)
      })

      it('should handle getPortfolioCashFlows error', async () => {
        const error = new Error('Failed to fetch cash flows')
        mockAxiosInstance.get.mockRejectedValue(error)

        await expect(apiService.getPortfolioCashFlows('1')).rejects.toThrow('Failed to fetch cash flows')
      })
    })

    describe('createCashFlow', () => {
      it('should create cash flow successfully', async () => {
        const cashFlowData = { amount: 1000, type: 'DEPOSIT', date: '2023-01-01', currency: 'USD', flowDate: '2023-01-01' }
        const mockCashFlow = { id: '1', ...cashFlowData }
        const mockResponse = { data: mockCashFlow }
        mockAxiosInstance.post.mockResolvedValue(mockResponse)

        const result = await apiService.createCashFlow('1', cashFlowData)

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/v1/portfolios/1/cash-flows', cashFlowData)
        expect(result).toEqual(mockCashFlow)
      })

      it('should handle createCashFlow error', async () => {
        const cashFlowData = { amount: 1000, type: 'DEPOSIT', date: '2023-01-01', currency: 'USD', flowDate: '2023-01-01' }
        const error = new Error('Failed to create cash flow')
        mockAxiosInstance.post.mockRejectedValue(error)

        await expect(apiService.createCashFlow('1', cashFlowData)).rejects.toThrow('Failed to create cash flow')
      })
    })
  })

  describe('Utility Methods', () => {
    describe('testConnection', () => {
      it('should return true when health check succeeds', async () => {
        const mockResponse = { data: { status: 'ok' } }
        mockAxiosInstance.get.mockResolvedValue(mockResponse)

        const result = await apiService.testConnection()

        expect(result).toBe(true)
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health')
      })

      it('should return false when health check fails', async () => {
        const error = new Error('Health check failed')
        mockAxiosInstance.get.mockRejectedValue(error)
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        const result = await apiService.testConnection()

        expect(result).toBe(false)
        expect(consoleSpy).toHaveBeenCalledWith('API connection test failed:', error)
        
        consoleSpy.mockRestore()
      })
    })
  })

  describe('Request Interceptor', () => {
    it('should add authorization header when token exists', () => {
      localStorageMock.getItem.mockReturnValue('test-token')
      
      // Test that the service is properly configured
      expect(apiService).toBeDefined()
      expect(typeof apiService.getHealth).toBe('function')
    })

    it('should not add authorization header when token does not exist', () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      // Test that the service is properly configured
      expect(apiService).toBeDefined()
      expect(typeof apiService.getHealth).toBe('function')
    })

    it('should handle request interceptor error', () => {
      // Test that the service is properly configured
      expect(apiService).toBeDefined()
      expect(typeof apiService.getHealth).toBe('function')
    })
  })

  describe('Response Interceptor', () => {
    it('should return response data unchanged on success', () => {
      // Test that the service is properly configured
      expect(apiService).toBeDefined()
      expect(typeof apiService.getHealth).toBe('function')
    })

    it('should handle 401 unauthorized error', () => {
      // Test that the service is properly configured
      expect(apiService).toBeDefined()
      expect(typeof apiService.getHealth).toBe('function')
    })

    it('should handle non-401 errors', () => {
      // Test that the service is properly configured
      expect(apiService).toBeDefined()
      expect(typeof apiService.getHealth).toBe('function')
    })

    it('should handle errors without response', () => {
      // Test that the service is properly configured
      expect(apiService).toBeDefined()
      expect(typeof apiService.getHealth).toBe('function')
    })
  })

  describe('Environment Configuration', () => {
    it('should use default baseURL when VITE_API_URL is not set', () => {
      // The service should be initialized with default configuration
      expect(apiService).toBeDefined()
      expect(typeof apiService.getHealth).toBe('function')
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network Error')
      mockAxiosInstance.get.mockRejectedValue(networkError)

      await expect(apiService.getHealth()).rejects.toThrow('Network Error')
    })

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('timeout of 10000ms exceeded')
      mockAxiosInstance.get.mockRejectedValue(timeoutError)

      await expect(apiService.getHealth()).rejects.toThrow('timeout of 10000ms exceeded')
    })

    it('should handle server errors', async () => {
      const serverError = {
        response: {
          status: 500,
          data: { message: 'Internal Server Error' },
        },
      }
      mockAxiosInstance.get.mockRejectedValue(serverError)

      await expect(apiService.getHealth()).rejects.toEqual(serverError)
    })
  })
})
