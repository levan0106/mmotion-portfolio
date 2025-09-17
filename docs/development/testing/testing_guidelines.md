# Testing Guidelines - Portfolio Management System

## 📋 Overview

This document provides comprehensive testing guidelines and best practices for the Portfolio Management System. It covers both backend (NestJS + Jest) and frontend (React + Vitest) testing standards.

## 🎯 Testing Philosophy

### Core Principles
1. **Test-Driven Development (TDD)**: Write tests before implementation
2. **Comprehensive Coverage**: Aim for 80%+ code coverage
3. **Quality over Quantity**: Focus on meaningful tests
4. **Maintainable Tests**: Keep tests simple and readable
5. **Fast Feedback**: Tests should run quickly and provide clear feedback

### Testing Pyramid
```
    /\
   /  \     E2E Tests (Few)
  /____\    
 /      \   Integration Tests (Some)
/________\  
/          \ Unit Tests (Many)
/____________\
```

## 🏗️ Backend Testing (NestJS + Jest)

### Test Structure
```
src/
├── modules/
│   └── portfolio/
│       ├── services/
│       │   ├── portfolio.service.ts
│       │   └── portfolio.service.spec.ts
│       ├── controllers/
│       │   ├── portfolio.controller.ts
│       │   └── portfolio.controller.spec.ts
│       └── repositories/
│           ├── portfolio.repository.ts
│           └── portfolio.repository.spec.ts
```

### Test Categories

#### 1. Unit Tests
- **Services**: Business logic testing
- **Controllers**: HTTP request/response handling
- **Repositories**: Data access layer
- **DTOs**: Validation and transformation

#### 2. Integration Tests
- **Module Testing**: Dependency injection
- **Database Integration**: TypeORM operations
- **API Integration**: End-to-end API testing

### Test Naming Conventions
```typescript
describe('PortfolioService', () => {
  describe('createPortfolio', () => {
    it('should create a portfolio successfully', () => {});
    it('should throw error when account does not exist', () => {});
    it('should validate required fields', () => {});
  });
});
```

### Mocking Strategies
```typescript
// Service mocking
const mockRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

// Database mocking
const mockQueryBuilder = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getMany: jest.fn(),
};
```

## 🎨 Frontend Testing (React + Vitest)

### Test Structure
```
frontend/src/
├── components/
│   ├── Portfolio/
│   │   ├── PortfolioList.tsx
│   │   └── PortfolioList.test.tsx
│   └── Analytics/
│       ├── AssetAllocationChart.tsx
│       └── AssetAllocationChart.test.tsx
├── hooks/
│   ├── usePortfolios.ts
│   └── usePortfolios.test.ts
└── services/
    ├── api.ts
    └── api.test.ts
```

### Test Categories

#### 1. Component Tests
- **Rendering**: Component renders correctly
- **User Interactions**: Click, input, form submission
- **Props Handling**: Different prop combinations
- **State Management**: Component state changes

#### 2. Hook Tests
- **Data Fetching**: API calls and data handling
- **State Updates**: Hook state management
- **Error Handling**: Error states and recovery

#### 3. Service Tests
- **API Calls**: HTTP requests and responses
- **Data Transformation**: Data processing
- **Error Handling**: Network and API errors

### Test Utilities
```typescript
// Custom render function with providers
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={createTheme()}>
      {component}
    </ThemeProvider>
  );
};

// Mock API responses
vi.mock('../services/api', () => ({
  getPortfolios: vi.fn(),
  createPortfolio: vi.fn(),
}));
```

## 📊 Test Coverage Requirements

### Minimum Coverage Targets
- **Backend**: 80%+ overall coverage
- **Frontend**: 80%+ overall coverage
- **Critical Paths**: 90%+ coverage
- **Business Logic**: 95%+ coverage

### Coverage Exclusions
- Configuration files
- Migration files
- Test files themselves
- Type definitions
- Build scripts

## 🧪 Test Data Management

### Test Fixtures
```typescript
// test/fixtures/portfolio.fixtures.ts
export const createMockPortfolio = (overrides = {}) => ({
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Test Portfolio',
  account_id: '550e8400-e29b-41d4-a716-446655440001',
  total_value: 100000,
  cash_balance: 10000,
  ...overrides,
});
```

### Test Database
- Use separate test database
- Clean up after each test
- Seed test data as needed
- Use transactions for isolation

## 🚀 Running Tests

### Backend Tests
```bash
# Run all tests
npm run test

# Run with coverage
npm run test:cov

# Run specific test file
npm run test -- portfolio.service.spec.ts

# Run in watch mode
npm run test:watch
```

### Frontend Tests
```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test -- PortfolioList.test.tsx

# Run in watch mode
npm run test:watch
```

### E2E Tests
```bash
# Run e2e tests
npm run test:e2e

# Run specific e2e test
npm run test:e2e -- --testNamePattern="Portfolio CRUD"
```

## 📝 Test Documentation

### Test Comments
```typescript
/**
 * Tests for PortfolioService.createPortfolio method
 * 
 * Covers:
 * - Successful portfolio creation
 * - Validation error handling
 * - Database constraint violations
 * - Account existence validation
 */
describe('createPortfolio', () => {
  // Test implementations
});
```

### Test Descriptions
- Use descriptive test names
- Explain what is being tested
- Include expected behavior
- Mention edge cases

## 🔧 Best Practices

### Do's
- ✅ Write tests before implementation (TDD)
- ✅ Use descriptive test names
- ✅ Test one thing at a time
- ✅ Use proper mocking
- ✅ Clean up after tests
- ✅ Keep tests independent
- ✅ Use meaningful assertions

### Don'ts
- ❌ Test implementation details
- ❌ Write flaky tests
- ❌ Skip error cases
- ❌ Use real external services
- ❌ Write overly complex tests
- ❌ Ignore test failures
- ❌ Test third-party libraries

## 🐛 Debugging Tests

### Common Issues
1. **Async/Await**: Properly handle asynchronous operations
2. **Mocking**: Ensure mocks are properly configured
3. **Database**: Clean up test data
4. **Timing**: Use proper wait conditions
5. **Dependencies**: Mock external dependencies

### Debugging Tools
- Jest debugger
- Vitest debugger
- React Testing Library debug
- Console logging
- Test coverage reports

## 📈 Continuous Improvement

### Regular Reviews
- Review test coverage monthly
- Refactor flaky tests
- Update test documentation
- Share testing knowledge
- Improve test performance

### Metrics to Track
- Test coverage percentage
- Test execution time
- Test failure rate
- Test maintenance effort
- Bug detection rate

---

**Last Updated**: September 7, 2025
**Version**: 1.0.0
**Maintainer**: Development Team
