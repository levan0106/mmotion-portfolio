import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { SnackbarProvider } from 'notistack'

// Create a custom theme for testing
const testTheme = createTheme({
  palette: {
    mode: 'light',
  },
})

// Create a test query client
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

// Custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
}

const AllTheProviders = ({
  children,
  queryClient = createTestQueryClient(),
}: {
  children: React.ReactNode
  queryClient?: QueryClient
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider theme={testTheme}>
          <SnackbarProvider maxSnack={3}>
            {children}
          </SnackbarProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { queryClient, ...renderOptions } = options

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders queryClient={queryClient}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  })
}

// Mock data factories
export const mockPortfolio = {
  portfolioId: 'test-portfolio-id',
  name: 'Test Portfolio',
  baseCurrency: 'USD',
  accountId: 'test-account-id',
  description: 'Test portfolio description',
  cashBalance: 10000,
  totalValue: 50000,
  unrealizedPl: 5000,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

export const mockPortfolioAsset = {
  portfolioAssetId: 'test-asset-id',
  portfolioId: 'test-portfolio-id',
  assetId: 'test-asset-id',
  symbol: 'AAPL',
  quantity: 100,
  avgCost: 150,
  marketValue: 16000,
  unrealizedPl: 1000,
  asset: {
    assetId: 'test-asset-id',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    assetClass: 'EQUITY',
    assetType: 'STOCK',
    currency: 'USD',
    exchange: 'NASDAQ',
    sector: 'Technology',
    industry: 'Consumer Electronics',
  },
}

export const mockAccount = {
  accountId: 'test-account-id',
  userId: 'test-user-id',
  accountName: 'Test Account',
  accountType: 'INDIVIDUAL',
  status: 'ACTIVE',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

export const mockAnalytics = {
  portfolioId: 'test-portfolio-id',
  currentNAV: 50000,
  weekOnWeekChange: 5.2,
  roe1Month: 2.1,
  roe3Month: 8.5,
  roe1Year: 15.3,
  twr1Year: 14.8,
  calculatedAt: '2024-01-01T00:00:00Z',
}

// Mock API responses
export const mockApiResponses = {
  portfolios: {
    success: {
      data: [mockPortfolio],
      status: 200,
    },
    error: {
      message: 'Failed to fetch portfolios',
      status: 500,
    },
  },
  portfolio: {
    success: {
      data: mockPortfolio,
      status: 200,
    },
    error: {
      message: 'Portfolio not found',
      status: 404,
    },
  },
  analytics: {
    success: {
      data: mockAnalytics,
      status: 200,
    },
    error: {
      message: 'Analytics not available',
      status: 500,
    },
  },
}

// Test helpers
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0))
}

export const createMockFetch = (response: any, shouldReject = false) => {
  return (() => {
    if (shouldReject) {
      return Promise.reject(new Error('Network error'))
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(response),
    })
  })
}

// Re-export everything from testing library
export * from '@testing-library/react'
export { customRender as render }
export { createTestQueryClient }
