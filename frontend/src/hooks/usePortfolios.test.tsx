import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactNode } from 'react'
import { usePortfolios, usePortfolio, usePortfolioAnalytics, usePortfolioHistory } from './usePortfolios'
import apiService from '../services/api'
import { createTestPortfolio } from '../test/config'
import { CreatePortfolioDto } from '@/types'

// Mock the API service
vi.mock('../services/api', () => ({
  default: {
    getPortfolios: vi.fn(),
    getPortfolio: vi.fn(),
    createPortfolio: vi.fn(),
    updatePortfolio: vi.fn(),
    deletePortfolio: vi.fn(),
    getPortfolioNav: vi.fn(),
    getPortfolioPerformance: vi.fn(),
    getPortfolioAllocation: vi.fn(),
    getPortfolioPositions: vi.fn(),
    getPortfolioAnalyticsHistory: vi.fn(),
  },
}))

const mockApiService = apiService as any

// Test wrapper component
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('usePortfolios', () => {
  const mockPortfolios = [
    createTestPortfolio({ portfolioId: '1', name: 'Portfolio 1' }),
    createTestPortfolio({ portfolioId: '2', name: 'Portfolio 2' }),
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Data Fetching', () => {
    it('should fetch portfolios successfully', async () => {
      mockApiService.getPortfolios.mockResolvedValue(mockPortfolios)

      const { result } = renderHook(() => usePortfolios('test-account-id'), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.portfolios).toEqual([])

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.portfolios).toEqual(mockPortfolios)
      expect(result.current.error).toBeNull()
      expect(mockApiService.getPortfolios).toHaveBeenCalledWith('test-account-id')
    })

    it('should handle fetch error', async () => {
      const error = new Error('Failed to fetch portfolios')
      mockApiService.getPortfolios.mockRejectedValue(error)

      const { result } = renderHook(() => usePortfolios('test-account-id'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toEqual(error)
      expect(result.current.portfolios).toEqual([])
    })

    it('should not fetch when accountId is not provided', () => {
      const { result } = renderHook(() => usePortfolios(), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.portfolios).toEqual([])
      expect(mockApiService.getPortfolios).not.toHaveBeenCalled()
    })

    it('should not fetch when accountId is empty string', () => {
      const { result } = renderHook(() => usePortfolios(''), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.portfolios).toEqual([])
      expect(mockApiService.getPortfolios).not.toHaveBeenCalled()
    })

    it('should return empty array when portfolios is null', async () => {
      mockApiService.getPortfolios.mockResolvedValue(null)

      const { result } = renderHook(() => usePortfolios('test-account-id'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.portfolios).toEqual([])
    })
  })

  describe('Create Portfolio', () => {
    it('should create portfolio successfully', async () => {
      const newPortfolio = createTestPortfolio({ portfolioId: '3', name: 'New Portfolio' })
      const createData = { name: 'New Portfolio', baseCurrency: 'USD' }

      mockApiService.getPortfolios.mockResolvedValue(mockPortfolios)
      mockApiService.createPortfolio.mockResolvedValue(newPortfolio)

      const { result } = renderHook(() => usePortfolios('test-account-id'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.createPortfolio(createData as CreatePortfolioDto)

      await waitFor(() => {
        expect(mockApiService.createPortfolio).toHaveBeenCalledWith(createData)
      })
    })

    it('should handle create portfolio error', async () => {
      const createData = { name: 'New Portfolio', baseCurrency: 'USD' }
      const error = new Error('Failed to create portfolio')

      mockApiService.getPortfolios.mockResolvedValue(mockPortfolios)
      mockApiService.createPortfolio.mockRejectedValue(error)

      const { result } = renderHook(() => usePortfolios('test-account-id'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.createPortfolio(createData as CreatePortfolioDto)

      await waitFor(() => {
        expect(result.current.isCreating).toBe(false)
      })

      expect(mockApiService.createPortfolio).toHaveBeenCalledWith(createData)
    })
  })

  describe('Update Portfolio', () => {
    it('should update portfolio successfully', async () => {
      const updateData = { name: 'Updated Portfolio' }

      mockApiService.getPortfolios.mockResolvedValue(mockPortfolios)
      mockApiService.updatePortfolio.mockResolvedValue({})

      const { result } = renderHook(() => usePortfolios('test-account-id'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.updatePortfolio({ id: '1', data: updateData })

      await waitFor(() => {
        expect(mockApiService.updatePortfolio).toHaveBeenCalledWith('1', updateData)
      })
    })

    it('should handle update portfolio error', async () => {
      const updateData = { name: 'Updated Portfolio' }
      const error = new Error('Failed to update portfolio')

      mockApiService.getPortfolios.mockResolvedValue(mockPortfolios)
      mockApiService.updatePortfolio.mockRejectedValue(error)

      const { result } = renderHook(() => usePortfolios('test-account-id'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.updatePortfolio({ id: '1', data: updateData })

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false)
      })

      expect(mockApiService.updatePortfolio).toHaveBeenCalledWith('1', updateData)
    })
  })

  describe('Delete Portfolio', () => {
    it('should delete portfolio successfully', async () => {
      mockApiService.getPortfolios.mockResolvedValue(mockPortfolios)
      mockApiService.deletePortfolio.mockResolvedValue({})

      const { result } = renderHook(() => usePortfolios('test-account-id'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.deletePortfolio('1')

      await waitFor(() => {
        expect(mockApiService.deletePortfolio).toHaveBeenCalledWith('1')
      })
    })

    it('should handle delete portfolio error', async () => {
      const error = new Error('Failed to delete portfolio')

      mockApiService.getPortfolios.mockResolvedValue(mockPortfolios)
      mockApiService.deletePortfolio.mockRejectedValue(error)

      const { result } = renderHook(() => usePortfolios('test-account-id'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.deletePortfolio('1')

      await waitFor(() => {
        expect(result.current.isDeleting).toBe(false)
      })

      expect(mockApiService.deletePortfolio).toHaveBeenCalledWith('1')
    })
  })

  describe('Refetch', () => {
    it('should refetch portfolios', async () => {
      mockApiService.getPortfolios.mockResolvedValue(mockPortfolios)

      const { result } = renderHook(() => usePortfolios('test-account-id'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const initialCallCount = mockApiService.getPortfolios.mock.calls.length

      result.current.refetch()

      await waitFor(() => {
        expect(mockApiService.getPortfolios.mock.calls.length).toBe(initialCallCount + 1)
      })
    })
  })
})

describe('usePortfolio', () => {
  const mockPortfolio = createTestPortfolio({ portfolioId: '1', name: 'Test Portfolio' })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Data Fetching', () => {
    it('should fetch single portfolio successfully', async () => {
      mockApiService.getPortfolio.mockResolvedValue(mockPortfolio)

      const { result } = renderHook(() => usePortfolio('1'), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.portfolio).toBeUndefined()

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.portfolio).toEqual(mockPortfolio)
      expect(result.current.error).toBeNull()
      expect(mockApiService.getPortfolio).toHaveBeenCalledWith('1')
    })

    it('should handle fetch error', async () => {
      const error = new Error('Failed to fetch portfolio')
      mockApiService.getPortfolio.mockRejectedValue(error)

      const { result } = renderHook(() => usePortfolio('1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toEqual(error)
      expect(result.current.portfolio).toBeUndefined()
    })

    it('should not fetch when portfolioId is not provided', () => {
      const { result } = renderHook(() => usePortfolio(''), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.portfolio).toBeUndefined()
      expect(mockApiService.getPortfolio).not.toHaveBeenCalled()
    })
  })

  describe('Update Portfolio', () => {
    it('should update portfolio successfully', async () => {
      const updateData = { name: 'Updated Portfolio' }

      mockApiService.getPortfolio.mockResolvedValue(mockPortfolio)
      mockApiService.updatePortfolio.mockResolvedValue({})

      const { result } = renderHook(() => usePortfolio('1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.updatePortfolio(updateData)

      await waitFor(() => {
        expect(mockApiService.updatePortfolio).toHaveBeenCalledWith('1', updateData)
      })
    })

    it('should handle update portfolio error', async () => {
      const updateData = { name: 'Updated Portfolio' }
      const error = new Error('Failed to update portfolio')

      mockApiService.getPortfolio.mockResolvedValue(mockPortfolio)
      mockApiService.updatePortfolio.mockRejectedValue(error)

      const { result } = renderHook(() => usePortfolio('1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      result.current.updatePortfolio(updateData)

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false)
      })

      expect(mockApiService.updatePortfolio).toHaveBeenCalledWith('1', updateData)
    })
  })

  describe('Refetch', () => {
    it('should refetch portfolio', async () => {
      mockApiService.getPortfolio.mockResolvedValue(mockPortfolio)

      const { result } = renderHook(() => usePortfolio('1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const initialCallCount = mockApiService.getPortfolio.mock.calls.length

      result.current.refetch()

      await waitFor(() => {
        expect(mockApiService.getPortfolio.mock.calls.length).toBe(initialCallCount + 1)
      })
    })
  })
})

describe('usePortfolioAnalytics', () => {
  const mockNavData = { navValue: 100000, totalValue: 105000 }
  const mockPerformanceData = { totalReturn: 0.1, annualizedReturn: 0.15 }
  const mockAllocationData = [{ assetClass: 'STOCK', percentage: 0.6 }]
  const mockPositionsData = [{ symbol: 'AAPL', quantity: 100 }]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Data Fetching', () => {
    it('should fetch all analytics data successfully', async () => {
      mockApiService.getPortfolioNav.mockResolvedValue(mockNavData)
      mockApiService.getPortfolioPerformance.mockResolvedValue(mockPerformanceData)
      mockApiService.getPortfolioAllocation.mockResolvedValue(mockAllocationData)
      mockApiService.getPortfolioPositions.mockResolvedValue(mockPositionsData)

      const { result } = renderHook(() => usePortfolioAnalytics('1'), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.navData).toEqual(mockNavData)
      expect(result.current.performanceData).toEqual(mockPerformanceData)
      expect(result.current.allocationData).toEqual(mockAllocationData)
      expect(result.current.positionsData).toEqual(mockPositionsData)
      expect(result.current.error).toBeNull()
    })

    it('should handle NAV fetch error', async () => {
      const error = new Error('Failed to fetch NAV')
      mockApiService.getPortfolioNav.mockRejectedValue(error)
      mockApiService.getPortfolioPerformance.mockResolvedValue(mockPerformanceData)
      mockApiService.getPortfolioAllocation.mockResolvedValue(mockAllocationData)
      mockApiService.getPortfolioPositions.mockResolvedValue(mockPositionsData)

      const { result } = renderHook(() => usePortfolioAnalytics('1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toEqual(error)
      expect(result.current.navData).toBeUndefined()
    })

    it('should handle performance fetch error', async () => {
      const error = new Error('Failed to fetch performance')
      mockApiService.getPortfolioNav.mockResolvedValue(mockNavData)
      mockApiService.getPortfolioPerformance.mockRejectedValue(error)
      mockApiService.getPortfolioAllocation.mockResolvedValue(mockAllocationData)
      mockApiService.getPortfolioPositions.mockResolvedValue(mockPositionsData)

      const { result } = renderHook(() => usePortfolioAnalytics('1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toEqual(error)
      expect(result.current.performanceData).toBeUndefined()
    })

    it('should handle allocation fetch error', async () => {
      const error = new Error('Failed to fetch allocation')
      mockApiService.getPortfolioNav.mockResolvedValue(mockNavData)
      mockApiService.getPortfolioPerformance.mockResolvedValue(mockPerformanceData)
      mockApiService.getPortfolioAllocation.mockRejectedValue(error)
      mockApiService.getPortfolioPositions.mockResolvedValue(mockPositionsData)

      const { result } = renderHook(() => usePortfolioAnalytics('1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toEqual(error)
      expect(result.current.allocationData).toBeUndefined()
    })

    it('should handle positions fetch error', async () => {
      const error = new Error('Failed to fetch positions')
      mockApiService.getPortfolioNav.mockResolvedValue(mockNavData)
      mockApiService.getPortfolioPerformance.mockResolvedValue(mockPerformanceData)
      mockApiService.getPortfolioAllocation.mockResolvedValue(mockAllocationData)
      mockApiService.getPortfolioPositions.mockRejectedValue(error)

      const { result } = renderHook(() => usePortfolioAnalytics('1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toEqual(error)
      expect(result.current.positionsData).toBeUndefined()
    })

    it('should not fetch when portfolioId is not provided', () => {
      const { result } = renderHook(() => usePortfolioAnalytics(''), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.navData).toBeUndefined()
      expect(result.current.performanceData).toBeUndefined()
      expect(result.current.allocationData).toBeUndefined()
      expect(result.current.positionsData).toBeUndefined()
      expect(mockApiService.getPortfolioNav).not.toHaveBeenCalled()
      expect(mockApiService.getPortfolioPerformance).not.toHaveBeenCalled()
      expect(mockApiService.getPortfolioAllocation).not.toHaveBeenCalled()
      expect(mockApiService.getPortfolioPositions).not.toHaveBeenCalled()
    })
  })

  describe('Loading States', () => {
    it('should show loading when any query is loading', async () => {
      mockApiService.getPortfolioNav.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockNavData), 100)))
      mockApiService.getPortfolioPerformance.mockResolvedValue(mockPerformanceData)
      mockApiService.getPortfolioAllocation.mockResolvedValue(mockAllocationData)
      mockApiService.getPortfolioPositions.mockResolvedValue(mockPositionsData)

      const { result } = renderHook(() => usePortfolioAnalytics('1'), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })
})

describe('usePortfolioHistory', () => {
  const mockHistoryData = [
    { date: '2023-01-01', navValue: 100000 },
    { date: '2023-01-02', navValue: 101000 },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Data Fetching', () => {
    it('should fetch history data successfully', async () => {
      mockApiService.getPortfolioAnalyticsHistory.mockResolvedValue(mockHistoryData)

      const { result } = renderHook(() => usePortfolioHistory('1', '1Y'), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.historyData).toEqual([])

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.historyData).toEqual(mockHistoryData)
      expect(result.current.error).toBeNull()
      expect(mockApiService.getPortfolioAnalyticsHistory).toHaveBeenCalledWith('1', '1Y')
    })

    it('should fetch history data without period', async () => {
      mockApiService.getPortfolioAnalyticsHistory.mockResolvedValue(mockHistoryData)

      const { result } = renderHook(() => usePortfolioHistory('1'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.historyData).toEqual(mockHistoryData)
      expect(mockApiService.getPortfolioAnalyticsHistory).toHaveBeenCalledWith('1', undefined)
    })

    it('should handle fetch error', async () => {
      const error = new Error('Failed to fetch history')
      mockApiService.getPortfolioAnalyticsHistory.mockRejectedValue(error)

      const { result } = renderHook(() => usePortfolioHistory('1', '1Y'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toEqual(error)
      expect(result.current.historyData).toEqual([])
    })

    it('should not fetch when portfolioId is not provided', () => {
      const { result } = renderHook(() => usePortfolioHistory(''), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.historyData).toEqual([])
      expect(mockApiService.getPortfolioAnalyticsHistory).not.toHaveBeenCalled()
    })

    it('should return empty array when historyData is null', async () => {
      mockApiService.getPortfolioAnalyticsHistory.mockResolvedValue(null)

      const { result } = renderHook(() => usePortfolioHistory('1', '1Y'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.historyData).toEqual([])
    })
  })

  describe('Query Key Changes', () => {
    it('should refetch when period changes', async () => {
      mockApiService.getPortfolioAnalyticsHistory.mockResolvedValue(mockHistoryData)

      const { result, rerender } = renderHook(
        ({ portfolioId, period }) => usePortfolioHistory(portfolioId, period),
        {
          wrapper: createWrapper(),
          initialProps: { portfolioId: '1', period: '1Y' },
        }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockApiService.getPortfolioAnalyticsHistory).toHaveBeenCalledWith('1', '1Y')

      rerender({ portfolioId: '1', period: '6M' })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockApiService.getPortfolioAnalyticsHistory).toHaveBeenCalledWith('1', '6M')
    })
  })
})
