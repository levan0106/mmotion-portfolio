# Portfolio Management System - Unit Testing Plan

## 🎯 **Testing Strategy Overview**

Comprehensive unit testing implementation for both backend (NestJS + Jest) and frontend (Vitest + React Testing Library) to ensure code quality, reliability, and maintainability.

## 📋 **Testing Scope**

### **Current Implementation Coverage**
- ✅ **Backend**: Portfolio module (Services, Controllers, Repositories, DTOs)
- ✅ **Frontend**: React components, hooks, services
- ✅ **Testing Framework Setup**: Jest (backend), Vitest (frontend)

### **Testing Pyramid Strategy**
```
        /\
       /  \
      / E2E \     <- End-to-End Tests (Playwright)
     /______\
    /        \
   /Integration\ <- Integration Tests (API + DB)
  /____________\
 /              \
/   Unit Tests   \  <- Unit Tests (Services, Components)
/________________\
```

## 🔧 **Backend Testing (NestJS + Jest)**

### **Phase 1: Service Layer Tests**

#### **1.1 PortfolioService Tests**
**File**: `src/modules/portfolio/services/portfolio.service.spec.ts`

**Test Coverage**:
```typescript
describe('PortfolioService', () => {
  // Setup & Mocking
  - beforeEach: Mock repository, logger, cache
  - afterEach: Clear mocks

  // Core CRUD Operations
  - createPortfolio(): should create portfolio with valid data
  - createPortfolio(): should throw error with invalid data
  - getPortfoliosByAccount(): should return portfolios for account
  - getPortfoliosByAccount(): should return empty array for non-existent account
  - getPortfolioDetails(): should return portfolio with relations
  - getPortfolioDetails(): should throw NotFoundException for invalid ID
  - updatePortfolio(): should update portfolio successfully
  - updatePortfolio(): should throw error for invalid data
  - deletePortfolio(): should delete portfolio successfully
  - deletePortfolio(): should throw error if portfolio has assets

  // Business Logic
  - getAssetAllocation(): should calculate allocation correctly
  - getAssetAllocation(): should handle empty portfolio
  - calculatePortfolioValue(): should sum asset values correctly
  - calculatePortfolioValue(): should handle different currencies
})
```

#### **1.2 PortfolioAnalyticsService Tests**
**File**: `src/modules/portfolio/services/portfolio-analytics.service.spec.ts`

**Test Coverage**:
```typescript
describe('PortfolioAnalyticsService', () => {
  // Performance Calculations
  - calculateNAV(): should calculate NAV correctly
  - calculateROE(): should calculate ROE for period
  - calculateTWR(): should calculate TWR with cash flows
  - getPerformanceSummary(): should return complete metrics
  - generateNavSnapshot(): should create snapshot with current data
  
  // Historical Data
  - calculateReturnHistory(): should return daily returns
  - calculateReturnHistory(): should handle missing data
  
  // Edge Cases
  - should handle zero portfolio value
  - should handle negative returns
  - should handle missing price data
})
```

#### **1.3 PositionManagerService Tests**
**File**: `src/modules/portfolio/services/position-manager.service.spec.ts`

**Test Coverage**:
```typescript
describe('PositionManagerService', () => {
  // Position Management
  - getCurrentPositions(): should return current positions
  - getPositionAggregation(): should aggregate by asset type
  - calculateUnrealizedPL(): should calculate P&L correctly
  
  // Asset Management
  - addAssetToPortfolio(): should add new asset position
  - updateAssetPosition(): should update existing position
  - removeAssetFromPortfolio(): should remove position
  
  // Calculations
  - calculateAverageCost(): should calculate weighted average
  - calculateMarketValue(): should use current prices
})
```

### **Phase 2: Controller Layer Tests**

#### **2.1 PortfolioController Tests**
**File**: `src/modules/portfolio/controllers/portfolio.controller.spec.ts`

**Test Coverage**:
```typescript
describe('PortfolioController', () => {
  // HTTP Endpoints
  - GET /api/v1/portfolios: should return portfolios with accountId
  - GET /api/v1/portfolios: should return 400 without accountId
  - POST /api/v1/portfolios: should create portfolio with valid data
  - POST /api/v1/portfolios: should return 400 with invalid data
  - GET /api/v1/portfolios/:id: should return portfolio details
  - GET /api/v1/portfolios/:id: should return 404 for invalid ID
  - PUT /api/v1/portfolios/:id: should update portfolio
  - DELETE /api/v1/portfolios/:id: should delete portfolio
  
  // Analytics Endpoints
  - GET /api/v1/portfolios/:id/nav: should return current NAV
  - GET /api/v1/portfolios/:id/performance: should return metrics
  - GET /api/v1/portfolios/:id/allocation: should return allocation
  - GET /api/v1/portfolios/:id/positions: should return positions
  
  // Error Handling
  - should handle service exceptions properly
  - should validate UUID parameters
  - should validate request bodies
})
```

### **Phase 3: Repository Layer Tests**

#### **3.1 PortfolioRepository Tests**
**File**: `src/modules/portfolio/repositories/portfolio.repository.spec.ts`

**Test Coverage**:
```typescript
describe('PortfolioRepository', () => {
  // Custom Query Methods
  - findByAccountId(): should return portfolios for account
  - findWithAssets(): should return portfolio with asset relations
  - findWithNavHistory(): should return portfolio with NAV history
  
  // Performance Queries
  - getAssetAllocation(): should return allocation data
  - getPerformanceMetrics(): should return calculated metrics
  
  // Database Operations
  - should handle database connection errors
  - should handle query timeout
  - should handle constraint violations
})
```

### **Phase 4: DTO Validation Tests**

#### **4.1 CreatePortfolioDto Tests**
**File**: `src/modules/portfolio/dto/create-portfolio.dto.spec.ts`

**Test Coverage**:
```typescript
describe('CreatePortfolioDto', () => {
  // Valid Data
  - should pass validation with valid data
  - should transform currency to uppercase
  - should trim whitespace from name
  
  // Invalid Data
  - should fail validation without name
  - should fail validation with short name
  - should fail validation with invalid currency
  - should fail validation with invalid UUID
  - should fail validation with invalid currency length
  
  // Edge Cases
  - should handle special characters in name
  - should handle maximum length constraints
})
```

## 🎨 **Frontend Testing (Vitest + React Testing Library)**

### **Phase 1: Component Tests**

#### **1.1 PortfolioList Component Tests**
**File**: `src/components/Portfolio/PortfolioList.test.tsx`

**Test Coverage**:
```typescript
describe('PortfolioList', () => {
  // Rendering
  - should render portfolio list with data
  - should render empty state without data
  - should render loading state
  - should render error state
  
  // User Interactions
  - should filter portfolios by search term
  - should filter portfolios by currency
  - should call onViewPortfolio when portfolio clicked
  - should call onCreatePortfolio when create button clicked
  
  // Props Handling
  - should handle missing optional props
  - should pass correct data to PortfolioCard
})
```

#### **1.2 PortfolioForm Component Tests**
**File**: `src/components/Portfolio/PortfolioForm.test.tsx`

**Test Coverage**:
```typescript
describe('PortfolioForm', () => {
  // Form Rendering
  - should render form fields correctly
  - should populate fields with initial data
  - should show validation errors
  
  // Form Validation
  - should validate required fields
  - should validate currency format
  - should validate account ID format
  
  // Form Submission
  - should call onSubmit with form data
  - should prevent submission with invalid data
  - should show loading state during submission
  
  // User Interactions
  - should update field values on change
  - should reset form on cancel
  - should auto-fill account ID
})
```

#### **1.3 PortfolioCard Component Tests**
**File**: `src/components/Portfolio/PortfolioCard.test.tsx`

**Test Coverage**:
```typescript
describe('PortfolioCard', () => {
  // Data Display
  - should display portfolio information correctly
  - should format currency values
  - should format percentage values
  - should show profit/loss indicators
  
  // User Interactions
  - should call onView when view button clicked
  - should call onEdit when edit button clicked
  
  // Visual States
  - should show positive returns in green
  - should show negative returns in red
  - should handle missing data gracefully
})
```

### **Phase 2: Custom Hooks Tests**

#### **2.1 usePortfolios Hook Tests**
**File**: `src/hooks/usePortfolios.test.ts`

**Test Coverage**:
```typescript
describe('usePortfolios', () => {
  // Data Fetching
  - should fetch portfolios with accountId
  - should return empty array without accountId
  - should handle API errors
  - should cache data correctly
  
  // Mutations
  - should create portfolio successfully
  - should update portfolio successfully
  - should delete portfolio successfully
  - should invalidate cache after mutations
  
  // Loading States
  - should show loading state during fetch
  - should show loading state during mutations
  - should handle concurrent operations
})
```

#### **2.2 useAccount Hook Tests**
**File**: `src/hooks/useAccount.test.ts`

**Test Coverage**:
```typescript
describe('useAccount', () => {
  // Account Management
  - should return default account initially
  - should switch account successfully
  - should persist account in localStorage
  - should load account from localStorage
  
  // State Management
  - should update currentAccount state
  - should provide getCurrentAccountId function
  - should handle invalid account IDs
})
```

### **Phase 3: Service Layer Tests**

#### **3.1 API Service Tests**
**File**: `src/services/api.test.ts`

**Test Coverage**:
```typescript
describe('ApiService', () => {
  // HTTP Methods
  - should make GET requests correctly
  - should make POST requests with data
  - should make PUT requests with data
  - should make DELETE requests
  
  // Error Handling
  - should handle 400 errors
  - should handle 404 errors
  - should handle 500 errors
  - should handle network errors
  
  // Request Interceptors
  - should add authorization headers
  - should handle request configuration
  
  // Response Interceptors
  - should handle successful responses
  - should redirect on 401 errors
})
```

#### **3.2 WebSocket Service Tests**
**File**: `src/services/websocket.test.ts`

**Test Coverage**:
```typescript
describe('WebSocketService', () => {
  // Connection Management
  - should connect to WebSocket server
  - should disconnect properly
  - should handle reconnection
  - should handle connection errors
  
  // Message Handling
  - should emit portfolio update events
  - should emit price update events
  - should handle subscription/unsubscription
  
  // State Management
  - should track connection status
  - should handle multiple subscribers
})
```

## 🔧 **Testing Setup & Configuration**

### **Backend Testing Setup**

#### **Jest Configuration** (`package.json`)
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": [
      "**/*.(t|j)s",
      "!**/*.spec.ts",
      "!**/*.interface.ts"
    ],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
```

#### **Test Database Setup**
```typescript
// test/database.config.ts
export const testDatabaseConfig = {
  type: 'postgres',
  host: 'localhost',
  port: 5433, // Different port for testing
  username: 'test_user',
  password: 'test_password',
  database: 'portfolio_test_db',
  synchronize: true,
  dropSchema: true,
  logging: false,
};
```

### **Frontend Testing Setup**

#### **Vitest Configuration** (Already configured in `vitest.config.ts`)
```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})
```

#### **Test Utilities**
```typescript
// src/test/utils.tsx
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'

// Custom render function with providers
export const renderWithProviders = (
  ui: React.ReactElement,
  options?: RenderOptions
) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          {children}
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )

  return render(ui, { wrapper: Wrapper, ...options })
}
```

## 📊 **Testing Metrics & Coverage**

### **Coverage Targets**
- **Backend**: 90% line coverage, 85% branch coverage
- **Frontend**: 85% line coverage, 80% branch coverage
- **Critical paths**: 100% coverage (authentication, data persistence)

### **Test Categories**
- **Unit Tests**: 80% of total tests
- **Integration Tests**: 15% of total tests  
- **E2E Tests**: 5% of total tests

### **Performance Benchmarks**
- **Unit test execution**: < 30 seconds
- **Integration tests**: < 2 minutes
- **Full test suite**: < 5 minutes

## 🚀 **Implementation Roadmap**

### **Week 1: Backend Unit Tests**
- **Day 1-2**: Service layer tests (PortfolioService, PortfolioAnalyticsService)
- **Day 3-4**: Controller layer tests (PortfolioController, PortfolioAnalyticsController)
- **Day 5**: Repository and DTO tests

### **Week 2: Frontend Unit Tests**
- **Day 1-2**: Component tests (PortfolioList, PortfolioForm, PortfolioCard)
- **Day 3-4**: Hook tests (usePortfolios, useAccount)
- **Day 5**: Service layer tests (API service, WebSocket service)

### **Week 3: Integration & E2E Tests**
- **Day 1-2**: API integration tests
- **Day 3-4**: Frontend integration tests
- **Day 5**: E2E test setup with Playwright

## 📋 **Success Criteria**

### **Quality Gates**
- ✅ All tests pass in CI/CD pipeline
- ✅ Coverage thresholds met
- ✅ No critical security vulnerabilities
- ✅ Performance benchmarks achieved

### **Documentation Requirements**
- ✅ Test cases documented with clear descriptions
- ✅ Mock data and fixtures properly organized
- ✅ Testing guidelines for future development
- ✅ Continuous integration setup

## 🎯 **Next Steps**

1. **Start with Backend Unit Tests**: Focus on PortfolioService tests first
2. **Set up Test Database**: Configure separate test database instance
3. **Create Mock Data**: Develop comprehensive test fixtures
4. **Implement CI/CD Integration**: Add test execution to deployment pipeline

The comprehensive unit testing implementation will ensure code quality, prevent regressions, and provide confidence for future development phases! 🧪✅
