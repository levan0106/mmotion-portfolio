// Test configuration constants
export const TEST_CONFIG = {
  // API endpoints
  API_BASE_URL: 'http://localhost:3000/api/v1',
  
  // Test timeouts
  DEFAULT_TIMEOUT: 10000,
  LONG_TIMEOUT: 30000,
  
  // Test data
  TEST_USER_ID: 'test-user-id',
  TEST_ACCOUNT_ID: 'test-account-id',
  TEST_PORTFOLIO_ID: 'test-portfolio-id',
  
  // Mock delays
  MOCK_DELAY: 100,
  MOCK_LONG_DELAY: 1000,
  
  // Test currencies
  TEST_CURRENCIES: ['USD', 'EUR', 'GBP', 'JPY'],
  
  // Test asset types
  TEST_ASSET_TYPES: ['STOCK', 'BOND', 'ETF', 'MUTUAL_FUND', 'CASH'],
  
  // Test portfolio names
  TEST_PORTFOLIO_NAMES: [
    'Growth Portfolio',
    'Conservative Portfolio',
    'Balanced Portfolio',
    'Aggressive Portfolio',
  ],
  
  // Test error messages
  ERROR_MESSAGES: {
    NETWORK_ERROR: 'Network error occurred',
    NOT_FOUND: 'Resource not found',
    UNAUTHORIZED: 'Unauthorized access',
    VALIDATION_ERROR: 'Validation failed',
    SERVER_ERROR: 'Internal server error',
  },
  
  // Test success messages
  SUCCESS_MESSAGES: {
    CREATED: 'Resource created successfully',
    UPDATED: 'Resource updated successfully',
    DELETED: 'Resource deleted successfully',
    SAVED: 'Changes saved successfully',
  },
}

// Test utilities
export const createTestId = (prefix: string, suffix?: string) => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return suffix ? `${prefix}-${suffix}-${timestamp}-${random}` : `${prefix}-${timestamp}-${random}`
}

export const createTestPortfolio = (overrides = {}) => ({
  portfolioId: createTestId('portfolio'),
  id: createTestId('portfolio'),
  name: 'Test Portfolio',
  baseCurrency: 'USD',
  accountId: TEST_CONFIG.TEST_ACCOUNT_ID,
  description: 'Test portfolio description',
  cashBalance: 10000,
  totalValue: 50000,
  unrealizedPl: 5000,
  realizedPl: 2000,
  totalCapitalValue: 50000,
  // New fields
  totalAssetValue: 40000,
  totalInvestValue: 50000,
  totalAllValue: 60000,
  realizedAssetPnL: 2000,
  realizedInvestPnL: 2000,
  realizedAllPnL: 2000,
  unrealizedAssetPnL: 5000,
  unrealizedInvestPnL: 5000,
  unrealizedAllPnL: 5000,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

export const createTestAsset = (overrides = {}) => ({
  assetId: createTestId('asset'),
  symbol: 'TEST',
  name: 'Test Asset',
  assetClass: 'EQUITY',
  assetType: 'STOCK',
  currency: 'USD',
  exchange: 'NASDAQ',
  sector: 'Technology',
  industry: 'Software',
  ...overrides,
})

export const createTestPortfolioAsset = (overrides = {}) => ({
  portfolioAssetId: createTestId('portfolio-asset'),
  portfolioId: TEST_CONFIG.TEST_PORTFOLIO_ID,
  assetId: createTestId('asset'),
  symbol: 'TEST',
  quantity: 100,
  avgCost: 150,
  marketValue: 16000,
  unrealizedPl: 1000,
  asset: createTestAsset(),
  ...overrides,
})

export const createTestAnalytics = (overrides = {}) => ({
  portfolioId: TEST_CONFIG.TEST_PORTFOLIO_ID,
  currentNAV: 50000,
  weekOnWeekChange: 5.2,
  roe1Month: 2.1,
  roe3Month: 8.5,
  roe1Year: 15.3,
  twr1Year: 14.8,
  calculatedAt: new Date().toISOString(),
  ...overrides,
})

// Test helpers
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const createMockResponse = (data: any, status = 200) => ({
  data,
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  headers: {},
  config: {},
})

export const createMockError = (message: string, status = 500) => ({
  message,
  response: {
    data: { message },
    status,
    statusText: 'Error',
    headers: {},
    config: {},
  },
  config: {},
})

// Test assertions
export const expectToBeInDocument = (element: HTMLElement) => {
  expect(element).toBeInTheDocument()
}

export const expectToHaveTextContent = (element: HTMLElement, text: string) => {
  expect(element).toHaveTextContent(text)
}

export const expectToHaveClass = (element: HTMLElement, className: string) => {
  expect(element).toHaveClass(className)
}

export const expectToBeVisible = (element: HTMLElement) => {
  expect(element).toBeVisible()
}

export const expectToBeDisabled = (element: HTMLElement) => {
  expect(element).toBeDisabled()
}

export const expectToBeEnabled = (element: HTMLElement) => {
  expect(element).toBeEnabled()
}

// Test data generators
export const generateTestPortfolios = (count: number) => {
  return Array.from({ length: count }, (_, index) => 
    createTestPortfolio({
      name: `Test Portfolio ${index + 1}`,
      portfolioId: createTestId('portfolio', `test-${index + 1}`),
    })
  )
}

export const generateTestAssets = (count: number) => {
  return Array.from({ length: count }, (_, index) => 
    createTestAsset({
      symbol: `TEST${index + 1}`,
      name: `Test Asset ${index + 1}`,
      assetId: createTestId('asset', `test-${index + 1}`),
    })
  )
}

export const generateTestPortfolioAssets = (count: number) => {
  return Array.from({ length: count }, (_, index) => 
    createTestPortfolioAsset({
      portfolioAssetId: createTestId('portfolio-asset', `test-${index + 1}`),
      symbol: `TEST${index + 1}`,
      quantity: (index + 1) * 10,
      avgCost: (index + 1) * 100,
      marketValue: (index + 1) * 1000,
      unrealizedPl: (index + 1) * 100,
    })
  )
}
