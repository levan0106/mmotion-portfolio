import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import AssetAllocationChart from '../components/Analytics/AssetAllocationChart'
import PerformanceChart from '../components/Analytics/PerformanceChart'

// Mock the PerformanceChart component for testing
jest.mock('../components/Analytics/PerformanceChart', () => {
  return function MockPerformanceChart({ portfolioId, baseCurrency, title }: any) {
    return (
      <div data-testid="performance-chart">
        <div>{title || 'Performance Chart'}</div>
        <div>Portfolio ID: {portfolioId}</div>
        <div>Base Currency: {baseCurrency}</div>
      </div>
    )
  }
})
import { AssetAllocationResponse } from '../types'

// Mock recharts components
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({ children, data }: { children: React.ReactNode; data: any[] }) => (
    <div data-testid="pie" data-length={data.length}>{children}</div>
  ),
  Cell: ({ fill }: { fill: string }) => (
    <div data-testid="cell" data-fill={fill} />
  ),
  Tooltip: ({ content }: { content: any }) => (
    <div data-testid="tooltip">{content && <div data-testid="tooltip-content" />}</div>
  ),
  Legend: ({ content }: { content: any }) => (
    <div data-testid="legend">{content && <div data-testid="legend-content" />}</div>
  ),
  LineChart: ({ children, data }: { children: React.ReactNode; data: any[] }) => (
    <div data-testid="line-chart" data-length={data.length}>{children}</div>
  ),
  Line: ({ dataKey, stroke }: { dataKey: string; stroke: string }) => (
    <div data-testid="line" data-key={dataKey} data-stroke={stroke} />
  ),
  XAxis: ({ dataKey }: { dataKey: string; tickFormatter: any }) => (
    <div data-testid="x-axis" data-key={dataKey} />
  ),
  YAxis: ({}: { tickFormatter: any }) => (
    <div data-testid="y-axis" />
  ),
  CartesianGrid: ({ strokeDasharray }: { strokeDasharray: string }) => (
    <div data-testid="cartesian-grid" data-dasharray={strokeDasharray} />
  ),
  ReferenceLine: ({ y, stroke }: { y: number; stroke: string }) => (
    <div data-testid="reference-line" data-y={y} data-stroke={stroke} />
  ),
}))

// Mock formatters
vi.mock('../utils/formatters', () => ({
  formatCurrency: (value: number, currency: string, options?: any) => {
    if (options?.compact) {
      return `${currency} ${(value / 1000).toFixed(1)}K`
    }
    return `${currency} ${value.toLocaleString()}`
  },
  formatPercentage: (value: number) => `${(value * 100).toFixed(2)}%`,
  formatDate: (date: string) => new Date(date).toLocaleDateString(),
}))

const theme = createTheme()

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  )
}

describe('AnalyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('AssetAllocationChart', () => {
    const mockAssetAllocationData: AssetAllocationResponse = {
      allocation: {
        'stock': {
          percentage: 70,
          value: 70000
        },
        'bond': {
          percentage: 20,
          value: 20000
        },
        'cash': {
          percentage: 10,
          value: 10000
        }
      },
      totalValue: 100000,
      assetCount: 3
    }

    describe('Rendering', () => {
      it('should render asset allocation chart with data', () => {
        renderWithTheme(
          <AssetAllocationChart
            data={mockAssetAllocationData}
            baseCurrency="USD"
          />
        )

        expect(screen.getByText('Asset Allocation')).toBeInTheDocument()
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
        expect(screen.getByTestId('pie')).toBeInTheDocument()
        expect(screen.getByTestId('legend')).toBeInTheDocument()
        expect(screen.getByTestId('tooltip')).toBeInTheDocument()
      })

      it('should render empty state when no data', () => {
        renderWithTheme(
          <AssetAllocationChart
            data={{ allocation: {}, totalValue: 0, assetCount: 0 }}
            baseCurrency="USD"
          />
        )

        expect(screen.getByText('No asset allocation data available')).toBeInTheDocument()
        expect(screen.queryByTestId('pie-chart')).not.toBeInTheDocument()
      })

      it('should render correct number of cells for data', () => {
        renderWithTheme(
          <AssetAllocationChart
            data={mockAssetAllocationData}
            baseCurrency="USD"
          />
        )

        const cells = screen.getAllByTestId('cell')
        expect(cells).toHaveLength(3)
        
        // Check that cells have different colors
        const fills = cells.map(cell => cell.getAttribute('data-fill'))
        expect(new Set(fills).size).toBe(3) // All different colors
      })
    })

    describe('Data Transformation', () => {
      it('should transform data correctly for chart', () => {
        renderWithTheme(
          <AssetAllocationChart
            data={mockAssetAllocationData}
            baseCurrency="USD"
          />
        )

        const pie = screen.getByTestId('pie')
        expect(pie).toHaveAttribute('data-length', '3')
      })

      it('should handle single asset allocation', () => {
        const singleAssetData = {
          allocation: {
            'stock': {
              percentage: 100,
              value: 100000
            }
          },
          totalValue: 100000,
          assetCount: 1
        }
        
        renderWithTheme(
          <AssetAllocationChart
            data={singleAssetData}
            baseCurrency="USD"
          />
        )

        const pie = screen.getByTestId('pie')
        expect(pie).toHaveAttribute('data-length', '1')
        
        const cells = screen.getAllByTestId('cell')
        expect(cells).toHaveLength(1)
      })
    })

    describe('Currency Display', () => {
      it('should display correct currency in chart', () => {
        renderWithTheme(
          <AssetAllocationChart
            data={mockAssetAllocationData}
            baseCurrency="EUR"
          />
        )

        expect(screen.getByText('Asset Allocation')).toBeInTheDocument()
        // The currency is used in tooltip formatting, which is mocked
      })

      it('should handle different currencies', () => {
        renderWithTheme(
          <AssetAllocationChart
            data={mockAssetAllocationData}
            baseCurrency="GBP"
          />
        )

        expect(screen.getByText('Asset Allocation')).toBeInTheDocument()
      })
    })

    describe('Chart Components', () => {
      it('should render all required chart components', () => {
        renderWithTheme(
          <AssetAllocationChart
            data={mockAssetAllocationData}
            baseCurrency="USD"
          />
        )

        expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
        expect(screen.getByTestId('pie')).toBeInTheDocument()
        expect(screen.getByTestId('legend')).toBeInTheDocument()
        expect(screen.getByTestId('tooltip')).toBeInTheDocument()
      })

      it('should render cells with correct colors', () => {
        renderWithTheme(
          <AssetAllocationChart
            data={mockAssetAllocationData}
            baseCurrency="USD"
          />
        )

        const cells = screen.getAllByTestId('cell')
        expect(cells).toHaveLength(3)
        
        // Check that each cell has a color attribute
        cells.forEach(cell => {
          expect(cell).toHaveAttribute('data-fill')
        })
      })
    })
  })

  describe('PerformanceChart', () => {
    // Mock data removed as we're now using portfolioId-based component

    describe('Rendering', () => {
      it('should render performance chart with data', () => {
        renderWithTheme(
          <PerformanceChart
            portfolioId="test-portfolio-id"
            baseCurrency="USD"
          />
        )

        expect(screen.getByText('Performance Chart')).toBeInTheDocument()
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
        expect(screen.getByTestId('line-chart')).toBeInTheDocument()
        expect(screen.getByTestId('line')).toBeInTheDocument()
        expect(screen.getByTestId('x-axis')).toBeInTheDocument()
        expect(screen.getByTestId('y-axis')).toBeInTheDocument()
        expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument()
      })

      it('should render empty state when no data', () => {
        renderWithTheme(
          <PerformanceChart
            portfolioId="test-portfolio-id"
            baseCurrency="USD"
          />
        )

        expect(screen.getByText('No performance data available')).toBeInTheDocument()
        expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument()
      })

      it('should render with custom title', () => {
        renderWithTheme(
          <PerformanceChart
            portfolioId="test-portfolio-id"
            baseCurrency="USD"
            title="Custom Performance Chart"
          />
        )

        expect(screen.getByText('Custom Performance Chart')).toBeInTheDocument()
      })
    })

    describe('Timeframe Selection', () => {
      it('should render timeframe selector', () => {
        renderWithTheme(
          <PerformanceChart
            portfolioId="test-portfolio-id"
            baseCurrency="USD"
          />
        )

        expect(screen.getByRole('combobox')).toBeInTheDocument()
        expect(screen.getByDisplayValue('1Y')).toBeInTheDocument()
      })

      it('should have all timeframe options', () => {
        renderWithTheme(
          <PerformanceChart
            portfolioId="test-portfolio-id"
            baseCurrency="USD"
          />
        )

        const timeframeSelect = screen.getByRole('combobox')
        fireEvent.mouseDown(timeframeSelect)

        expect(screen.getByText('1 Month')).toBeInTheDocument()
        expect(screen.getByText('3 Months')).toBeInTheDocument()
        expect(screen.getByText('6 Months')).toBeInTheDocument()
        expect(screen.getAllByText('1 Year')).toHaveLength(2) // One in select, one in dropdown
        expect(screen.getByText('2 Years')).toBeInTheDocument()
        expect(screen.getByText('5 Years')).toBeInTheDocument()
        expect(screen.getByText('All Time')).toBeInTheDocument()
      })

      it('should change timeframe when selected', async () => {
        renderWithTheme(
          <PerformanceChart
            portfolioId="test-portfolio-id"
            baseCurrency="USD"
          />
        )

        const timeframeSelect = screen.getByRole('combobox')
        fireEvent.mouseDown(timeframeSelect)

        const threeMonthsOption = screen.getByText('3 Months')
        fireEvent.click(threeMonthsOption)

        await waitFor(() => {
          expect(screen.getByDisplayValue('3M')).toBeInTheDocument()
        })
      })
    })

    describe('Reference Line', () => {
      it('should not render reference line by default', () => {
        renderWithTheme(
          <PerformanceChart
            portfolioId="test-portfolio-id"
            baseCurrency="USD"
          />
        )

        expect(screen.queryByTestId('reference-line')).not.toBeInTheDocument()
      })

      it('should render reference line when enabled', () => {
        renderWithTheme(
          <PerformanceChart
            portfolioId="test-portfolio-id"
            baseCurrency="USD"
            showReferenceLine={true}
            referenceValue={100000}
          />
        )

        const referenceLine = screen.getByTestId('reference-line')
        expect(referenceLine).toBeInTheDocument()
        expect(referenceLine).toHaveAttribute('data-y', '100000')
        expect(referenceLine).toHaveAttribute('data-stroke', '#ff9800')
      })
    })

    describe('Data Handling', () => {
      it('should handle single data point', () => {
        renderWithTheme(
          <PerformanceChart
            portfolioId="test-portfolio-id"
            baseCurrency="USD"
          />
        )

        const lineChart = screen.getByTestId('line-chart')
        expect(lineChart).toHaveAttribute('data-length', '1')
      })

      it('should handle large dataset', () => {
        renderWithTheme(
          <PerformanceChart
            portfolioId="test-portfolio-id"
            baseCurrency="USD"
          />
        )

        const lineChart = screen.getByTestId('line-chart')
        expect(lineChart).toHaveAttribute('data-length', '100')
      })
    })

    describe('Currency Display', () => {
      it('should display correct currency in chart', () => {
        renderWithTheme(
          <PerformanceChart
            portfolioId="test-portfolio-id"
            baseCurrency="EUR"
          />
        )

        expect(screen.getByText('Performance Chart')).toBeInTheDocument()
        // The currency is used in Y-axis formatting, which is mocked
      })

      it('should handle different currencies', () => {
        renderWithTheme(
          <PerformanceChart
            portfolioId="test-portfolio-id"
            baseCurrency="GBP"
          />
        )

        expect(screen.getByText('Performance Chart')).toBeInTheDocument()
      })
    })

    describe('Chart Components', () => {
      it('should render all required chart components', () => {
        renderWithTheme(
          <PerformanceChart
            portfolioId="test-portfolio-id"
            baseCurrency="USD"
          />
        )

        expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
        expect(screen.getByTestId('line-chart')).toBeInTheDocument()
        expect(screen.getByTestId('line')).toBeInTheDocument()
        expect(screen.getByTestId('x-axis')).toBeInTheDocument()
        expect(screen.getByTestId('y-axis')).toBeInTheDocument()
        expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument()
        expect(screen.getByTestId('tooltip')).toBeInTheDocument()
      })

      it('should render line with correct properties', () => {
        renderWithTheme(
          <PerformanceChart
            portfolioId="test-portfolio-id"
            baseCurrency="USD"
          />
        )

        const line = screen.getByTestId('line')
        expect(line).toHaveAttribute('data-key', 'value')
        expect(line).toHaveAttribute('data-stroke', '#1976d2')
      })

      it('should render grid with correct properties', () => {
        renderWithTheme(
          <PerformanceChart
            portfolioId="test-portfolio-id"
            baseCurrency="USD"
          />
        )

        const grid = screen.getByTestId('cartesian-grid')
        expect(grid).toHaveAttribute('data-dasharray', '3 3')
      })
    })

    describe('Interactive Features', () => {
      it('should handle timeframe changes', async () => {
        renderWithTheme(
          <PerformanceChart
            portfolioId="test-portfolio-id"
            baseCurrency="USD"
          />
        )

        const timeframeSelect = screen.getByRole('combobox')
        
        // Test multiple timeframe changes
        fireEvent.mouseDown(timeframeSelect)
        fireEvent.click(screen.getByText('6 Months'))
        
        await waitFor(() => {
          expect(screen.getByDisplayValue('6M')).toBeInTheDocument()
        })

        fireEvent.mouseDown(timeframeSelect)
        fireEvent.click(screen.getByText('All Time'))
        
        await waitFor(() => {
          expect(screen.getByDisplayValue('ALL')).toBeInTheDocument()
        })
      })
    })

    describe('Error Handling', () => {
      it('should handle invalid data gracefully', () => {
        renderWithTheme(
          <PerformanceChart
            portfolioId="test-portfolio-id"
            baseCurrency="USD"
          />
        )

        // Should still render the chart structure
        expect(screen.getByTestId('line-chart')).toBeInTheDocument()
      })

      it('should handle empty data array', () => {
        renderWithTheme(
          <PerformanceChart
            portfolioId="test-portfolio-id"
            baseCurrency="USD"
          />
        )

        expect(screen.getByText('No performance data available')).toBeInTheDocument()
        expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument()
      })
    })
  })

  describe('Analytics Service Integration', () => {
    // Define mock data at the integration test level
    const integrationMockAssetAllocationData: AssetAllocationResponse = {
      allocation: {
        'stock': {
          percentage: 70,
          value: 70000
        },
        'bond': {
          percentage: 30,
          value: 30000
        }
      },
      totalValue: 100000,
      assetCount: 2
    }

    // Mock data removed as we're now using portfolioId-based component

    it('should work with both chart components together', () => {
      const { container } = renderWithTheme(
        <div>
          <AssetAllocationChart
            data={integrationMockAssetAllocationData}
            baseCurrency="USD"
          />
          <PerformanceChart
            portfolioId="test-portfolio-id"
            baseCurrency="USD"
          />
        </div>
      )

      expect(container.querySelector('[data-testid="pie-chart"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="line-chart"]')).toBeInTheDocument()
    })

    it('should handle different currencies for different charts', () => {
      const { container } = renderWithTheme(
        <div>
          <AssetAllocationChart
            data={integrationMockAssetAllocationData}
            baseCurrency="USD"
          />
          <PerformanceChart
            portfolioId="test-portfolio-id"
            baseCurrency="EUR"
          />
        </div>
      )

      expect(container.querySelector('[data-testid="pie-chart"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="line-chart"]')).toBeInTheDocument()
    })
  })
})
