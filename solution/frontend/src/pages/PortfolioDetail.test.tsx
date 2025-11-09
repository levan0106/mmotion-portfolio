import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import PortfolioDetail from './PortfolioDetail'
import { createTestPortfolio } from '../test/config'

// Mock the hooks
const mockUsePortfolio = vi.fn()
const mockUsePortfolioAnalytics = vi.fn()

vi.mock('../hooks/usePortfolios', () => ({
  usePortfolio: () => mockUsePortfolio(),
  usePortfolioAnalytics: () => mockUsePortfolioAnalytics(),
}))

// Mock the chart components
vi.mock('../components/Analytics/AssetAllocationChart', () => ({
  default: vi.fn(({ data, baseCurrency }) => (
    <div data-testid="asset-allocation-chart">
      <div>Asset Allocation Chart</div>
      <div>Base Currency: {baseCurrency}</div>
      <div>Data Points: {data?.length || 0}</div>
    </div>
  )),
}))

vi.mock('../components/Analytics/PerformanceChart', () => ({
  default: vi.fn(({ data, baseCurrency, title }) => (
    <div data-testid="performance-chart">
      <div>Performance Chart</div>
      <div>Title: {title}</div>
      <div>Base Currency: {baseCurrency}</div>
      <div>Data Points: {data?.length || 0}</div>
    </div>
  )),
}))

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ portfolioId: 'test-portfolio-id' }),
    useNavigate: () => mockNavigate,
  }
})

// Mock formatters
vi.mock('../utils/formatters', () => ({
  formatCurrency: vi.fn((amount, currency) => `${currency} ${amount?.toLocaleString() || 0}`),
  formatPercentage: vi.fn((value) => `${(value * 100).toFixed(2)}%`),
}))

describe('PortfolioDetail', () => {
  const mockPortfolio = createTestPortfolio({
    portfolioId: 'test-portfolio-id',
    name: 'Test Portfolio',
    baseCurrency: 'USD',
    totalValue: 100000,
    unrealizedPl: 5000,
    realizedPl: 2000,
    cashBalance: 10000,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-12-01T00:00:00Z',
  })

  const mockAnalytics = {
    navData: {
      navValue: 105000,
      portfolioId: 'test-portfolio-id',
    },
    performanceData: {
      totalReturn: 5,
      annualizedReturn: 10,
      volatility: 15,
      sharpeRatio: 0.8,
      maxDrawdown: -10,
    },
    allocationData: [
      { assetClass: 'STOCK', percentage: 0.6, value: 60000 },
      { assetClass: 'BOND', percentage: 0.3, value: 30000 },
      { assetClass: 'CASH', percentage: 0.1, value: 10000 },
    ],
    isLoading: false,
    error: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePortfolio.mockReturnValue({
      portfolio: mockPortfolio,
      isLoading: false,
      error: null,
    })
    mockUsePortfolioAnalytics.mockReturnValue(mockAnalytics)
  })

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>)
  }

  describe('Loading State', () => {
    it('should show loading spinner when portfolio is loading', () => {
      mockUsePortfolio.mockReturnValue({
        portfolio: null,
        isLoading: true,
        error: null,
      })

      renderWithRouter(<PortfolioDetail />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('should show error message when portfolio fails to load', () => {
      mockUsePortfolio.mockReturnValue({
        portfolio: null,
        isLoading: false,
        error: 'Failed to load portfolio',
      })

      renderWithRouter(<PortfolioDetail />)

      expect(screen.getByText('Failed to load portfolio. Please try again.')).toBeInTheDocument()
    })

    it('should show error message when portfolio is null', () => {
      mockUsePortfolio.mockReturnValue({
        portfolio: null,
        isLoading: false,
        error: null,
      })

      renderWithRouter(<PortfolioDetail />)

      expect(screen.getByText('Failed to load portfolio. Please try again.')).toBeInTheDocument()
    })
  })

  describe('Portfolio Header', () => {
    it('should display portfolio name in header', () => {
      renderWithRouter(<PortfolioDetail />)

      expect(screen.getByText('Test Portfolio')).toBeInTheDocument()
    })

    it('should have back button', () => {
      renderWithRouter(<PortfolioDetail />)

      expect(screen.getByText('Back to Portfolios')).toBeInTheDocument()
    })

    it('should have edit button', () => {
      renderWithRouter(<PortfolioDetail />)

      expect(screen.getByText('Edit Portfolio')).toBeInTheDocument()
    })

    it('should navigate back when back button is clicked', async () => {
      const user = userEvent.setup()
      renderWithRouter(<PortfolioDetail />)

      const backButton = screen.getByText('Back to Portfolios')
      await user.click(backButton)

      expect(mockNavigate).toHaveBeenCalledWith('/portfolios')
    })

    it('should navigate to edit page when edit button is clicked', async () => {
      const user = userEvent.setup()
      renderWithRouter(<PortfolioDetail />)

      const editButton = screen.getByText('Edit Portfolio')
      await user.click(editButton)

      expect(mockNavigate).toHaveBeenCalledWith('/portfolios/test-portfolio-id/edit')
    })
  })

  describe('Portfolio Summary Cards', () => {
    it('should display total value card', () => {
      renderWithRouter(<PortfolioDetail />)

      expect(screen.getByText('100,000.00 $')).toBeInTheDocument()
      expect(screen.getByText('Total Value')).toBeInTheDocument()
    })

    it('should display unrealized P&L card with positive value', () => {
      renderWithRouter(<PortfolioDetail />)

      expect(screen.getByText('5,000.00 $')).toBeInTheDocument()
      expect(screen.getByText('Unrealized P&L')).toBeInTheDocument()
    })

    it('should display unrealized P&L card with negative value', () => {
      const negativePortfolio = createTestPortfolio({
        ...mockPortfolio,
        unrealizedPl: -2000,
      })

      mockUsePortfolio.mockReturnValue({
        portfolio: negativePortfolio,
        isLoading: false,
        error: null,
      })

      renderWithRouter(<PortfolioDetail />)

      expect(screen.getByText('-2,000.00 $')).toBeInTheDocument()
    })

    it('should display realized P&L card', () => {
      renderWithRouter(<PortfolioDetail />)

      expect(screen.getByText('2,000.00 $')).toBeInTheDocument()
      expect(screen.getByText('Realized P&L')).toBeInTheDocument()
    })

    it('should display cash balance card', () => {
      renderWithRouter(<PortfolioDetail />)

      expect(screen.getByText('10,000.00 $')).toBeInTheDocument()
      expect(screen.getByText('Cash Balance')).toBeInTheDocument()
    })
  })

  describe('Tabs Navigation', () => {
    it('should display all tabs', () => {
      renderWithRouter(<PortfolioDetail />)

      expect(screen.getByText('Overview')).toBeInTheDocument()
      expect(screen.getByText('Performance')).toBeInTheDocument()
      expect(screen.getByText('Allocation')).toBeInTheDocument()
      expect(screen.getByText('Positions')).toBeInTheDocument()
    })

    it('should show overview tab by default', () => {
      renderWithRouter(<PortfolioDetail />)

      expect(screen.getByText('Portfolio Overview')).toBeInTheDocument()
    })

    it('should switch to performance tab when clicked', async () => {
      const user = userEvent.setup()
      renderWithRouter(<PortfolioDetail />)

      const performanceTab = screen.getByText('Performance')
      await user.click(performanceTab)

      expect(screen.getByText('Performance Analysis')).toBeInTheDocument()
    })

    it('should switch to allocation tab when clicked', async () => {
      const user = userEvent.setup()
      renderWithRouter(<PortfolioDetail />)

      const allocationTab = screen.getByText('Allocation')
      await user.click(allocationTab)

      expect(screen.getByText('Asset Allocation')).toBeInTheDocument()
    })

    it('should switch to positions tab when clicked', async () => {
      const user = userEvent.setup()
      renderWithRouter(<PortfolioDetail />)

      const positionsTab = screen.getByText('Positions')
      await user.click(positionsTab)

      expect(screen.getByText('Current Positions')).toBeInTheDocument()
    })
  })

  describe('Overview Tab', () => {
    it('should display basic information', () => {
      renderWithRouter(<PortfolioDetail />)

      expect(screen.getByText('Basic Information')).toBeInTheDocument()
      expect(screen.getByText('Portfolio ID: test-portfolio-id')).toBeInTheDocument()
      expect(screen.getByText('Base Currency: USD')).toBeInTheDocument()
      expect(screen.getByText('Created: 1/1/2023')).toBeInTheDocument()
      expect(screen.getByText('Last Updated: 12/1/2023')).toBeInTheDocument()
    })

    it('should display performance summary', () => {
      renderWithRouter(<PortfolioDetail />)

      expect(screen.getByText('Performance Summary')).toBeInTheDocument()
      expect(screen.getByText('Current NAV: 105,000.00 $')).toBeInTheDocument()
      expect(screen.getByText('Total Return: 5.00%')).toBeInTheDocument()
      expect(screen.getByText('Annualized Return: 10.00%')).toBeInTheDocument()
    })

    it('should show loading state for analytics in overview', () => {
      mockUsePortfolioAnalytics.mockReturnValue({
        ...mockAnalytics,
        isLoading: true,
      })

      renderWithRouter(<PortfolioDetail />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('should show error state for analytics in overview', () => {
      mockUsePortfolioAnalytics.mockReturnValue({
        ...mockAnalytics,
        error: 'Failed to load analytics',
      })

      renderWithRouter(<PortfolioDetail />)

      expect(screen.getByText('Failed to load performance data')).toBeInTheDocument()
    })
  })

  describe('Performance Tab', () => {
    it('should display performance chart when data is available', async () => {
      const user = userEvent.setup()
      renderWithRouter(<PortfolioDetail />)

      const performanceTab = screen.getByText('Performance')
      await user.click(performanceTab)

      expect(screen.getByText('Performance Analysis')).toBeInTheDocument()
      expect(screen.getByTestId('performance-chart')).toBeInTheDocument()
      expect(screen.getByText('Title: Portfolio Performance')).toBeInTheDocument()
      expect(screen.getByText('Base Currency: USD')).toBeInTheDocument()
    })

    it('should show loading state for performance tab', async () => {
      const user = userEvent.setup()
      mockUsePortfolioAnalytics.mockReturnValue({
        ...mockAnalytics,
        isLoading: true,
      })

      renderWithRouter(<PortfolioDetail />)

      const performanceTab = screen.getByText('Performance')
      await user.click(performanceTab)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('should show error state for performance tab', async () => {
      const user = userEvent.setup()
      mockUsePortfolioAnalytics.mockReturnValue({
        ...mockAnalytics,
        error: 'Failed to load performance data',
      })

      renderWithRouter(<PortfolioDetail />)

      const performanceTab = screen.getByText('Performance')
      await user.click(performanceTab)

      expect(screen.getByText('Failed to load performance data')).toBeInTheDocument()
    })
  })

  describe('Allocation Tab', () => {
    it('should display asset allocation chart when data is available', async () => {
      const user = userEvent.setup()
      renderWithRouter(<PortfolioDetail />)

      const allocationTab = screen.getByText('Allocation')
      await user.click(allocationTab)

      expect(screen.getByText('Asset Allocation')).toBeInTheDocument()
      expect(screen.getByTestId('asset-allocation-chart')).toBeInTheDocument()
      expect(screen.getByText('Base Currency: USD')).toBeInTheDocument()
      expect(screen.getByText('Data Points: 3')).toBeInTheDocument()
    })

    it('should show loading state for allocation tab', async () => {
      const user = userEvent.setup()
      mockUsePortfolioAnalytics.mockReturnValue({
        ...mockAnalytics,
        isLoading: true,
      })

      renderWithRouter(<PortfolioDetail />)

      const allocationTab = screen.getByText('Allocation')
      await user.click(allocationTab)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('should show error state for allocation tab', async () => {
      const user = userEvent.setup()
      mockUsePortfolioAnalytics.mockReturnValue({
        ...mockAnalytics,
        error: 'Failed to load allocation data',
      })

      renderWithRouter(<PortfolioDetail />)

      const allocationTab = screen.getByText('Allocation')
      await user.click(allocationTab)

      expect(screen.getByText('Failed to load allocation data')).toBeInTheDocument()
    })

    it('should handle empty allocation data', async () => {
      const user = userEvent.setup()
      mockUsePortfolioAnalytics.mockReturnValue({
        ...mockAnalytics,
        allocationData: null,
      })

      renderWithRouter(<PortfolioDetail />)

      const allocationTab = screen.getByText('Allocation')
      await user.click(allocationTab)

      expect(screen.getByTestId('asset-allocation-chart')).toBeInTheDocument()
      expect(screen.getByText('Data Points: 0')).toBeInTheDocument()
    })
  })

  describe('Positions Tab', () => {
    it('should display positions tab content', async () => {
      const user = userEvent.setup()
      renderWithRouter(<PortfolioDetail />)

      const positionsTab = screen.getByText('Positions')
      await user.click(positionsTab)

      expect(screen.getByText('Current Positions')).toBeInTheDocument()
      expect(screen.getByText('Positions data will be displayed here once the trading system is implemented.')).toBeInTheDocument()
    })

    it('should show loading state for positions tab', async () => {
      const user = userEvent.setup()
      mockUsePortfolioAnalytics.mockReturnValue({
        ...mockAnalytics,
        isLoading: true,
      })

      renderWithRouter(<PortfolioDetail />)

      const positionsTab = screen.getByText('Positions')
      await user.click(positionsTab)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('should show error state for positions tab', async () => {
      const user = userEvent.setup()
      mockUsePortfolioAnalytics.mockReturnValue({
        ...mockAnalytics,
        error: 'Failed to load positions data',
      })

      renderWithRouter(<PortfolioDetail />)

      const positionsTab = screen.getByText('Positions')
      await user.click(positionsTab)

      expect(screen.getByText('Failed to load positions data')).toBeInTheDocument()
    })
  })

  describe('Analytics Integration', () => {
    it('should call usePortfolioAnalytics with correct portfolio ID', () => {
      renderWithRouter(<PortfolioDetail />)

      expect(mockUsePortfolioAnalytics).toHaveBeenCalled()
    })

    it('should handle missing analytics data gracefully', () => {
      mockUsePortfolioAnalytics.mockReturnValue({
        navData: null,
        performanceData: null,
        allocationData: null,
        isLoading: false,
        error: null,
      })

      renderWithRouter(<PortfolioDetail />)

      expect(screen.getByText('Current NAV: N/A')).toBeInTheDocument()
      expect(screen.getByText('Total Return: N/A')).toBeInTheDocument()
      expect(screen.getByText('Annualized Return: N/A')).toBeInTheDocument()
    })
  })

  describe('Tab Panel Accessibility', () => {
    it('should have proper ARIA attributes for tabs', () => {
      renderWithRouter(<PortfolioDetail />)

      const tabsContainer = screen.getByLabelText('portfolio tabs')
      expect(tabsContainer).toBeInTheDocument()

      const overviewTab = screen.getByRole('tab', { name: 'Overview' })
      expect(overviewTab).toHaveAttribute('aria-selected', 'true')
    })

    it('should have proper ARIA attributes for tab panels', () => {
      renderWithRouter(<PortfolioDetail />)

      const overviewPanel = screen.getByRole('tabpanel')
      expect(overviewPanel).toBeInTheDocument()
      expect(overviewPanel).toHaveAttribute('id', 'portfolio-tabpanel-0')
    })
  })

  describe('Responsive Design', () => {
    it('should render all summary cards', () => {
      renderWithRouter(<PortfolioDetail />)

      // Check that all 4 summary cards are rendered
      const summaryCards = screen.getAllByText(/Total Value|Unrealized P&L|Realized P&L|Cash Balance/)
      expect(summaryCards).toHaveLength(4)
    })

    it('should display portfolio information in grid layout', () => {
      renderWithRouter(<PortfolioDetail />)

      // Check that basic information and performance summary are in separate sections
      expect(screen.getByText('Basic Information')).toBeInTheDocument()
      expect(screen.getByText('Performance Summary')).toBeInTheDocument()
    })
  })
})
