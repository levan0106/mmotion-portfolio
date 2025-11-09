# Testing Best Practices - Portfolio Management System

## 📋 Overview

This document outlines advanced testing techniques, patterns, and best practices for the Portfolio Management System. It covers both backend and frontend testing strategies.

## 🎯 Testing Strategy

### Test Categories
1. **Unit Tests**: Test individual functions and methods
2. **Integration Tests**: Test component interactions
3. **E2E Tests**: Test complete user workflows
4. **Performance Tests**: Test system performance
5. **Security Tests**: Test security vulnerabilities

### Test Coverage Strategy
- **Critical Paths**: 95%+ coverage
- **Business Logic**: 90%+ coverage
- **API Endpoints**: 85%+ coverage
- **UI Components**: 80%+ coverage
- **Utilities**: 70%+ coverage

## 🏗️ Backend Testing Best Practices

### 1. Service Layer Testing
```typescript
describe('PortfolioService', () => {
  // Test business logic thoroughly
  describe('calculateNAV', () => {
    it('should calculate NAV correctly with multiple assets', () => {
      // Test complex calculations
    });

    it('should handle zero values gracefully', () => {
      // Test edge cases
    });

    it('should throw error for invalid data', () => {
      // Test error conditions
    });
  });

  // Test data validation
  describe('validatePortfolioData', () => {
    it('should validate required fields', () => {
      // Test validation logic
    });

    it('should handle malformed data', () => {
      // Test error handling
    });
  });
});
```

### 2. Repository Testing
```typescript
describe('PortfolioRepository', () => {
  // Test complex queries
  describe('findPortfoliosWithAssets', () => {
    it('should return portfolios with related assets', () => {
      // Test joins and relationships
    });

    it('should handle empty results', () => {
      // Test edge cases
    });
  });

  // Test performance
  describe('performance', () => {
    it('should execute queries within acceptable time', async () => {
      const start = Date.now();
      await repository.findPortfoliosWithAssets(accountId);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // 100ms threshold
    });
  });
});
```

### 3. Controller Testing
```typescript
describe('PortfolioController', () => {
  // Test HTTP responses
  describe('createPortfolio', () => {
    it('should return 201 with created portfolio', async () => {
      // Test success response
    });

    it('should return 400 for validation errors', async () => {
      // Test error responses
    });

    it('should return 500 for server errors', async () => {
      // Test error handling
    });
  });

  // Test request/response format
  describe('response format', () => {
    it('should return properly formatted JSON', async () => {
      const response = await controller.createPortfolio(createDto);
      expect(response).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        created_at: expect.any(Date),
      });
    });
  });
});
```

## 🎨 Frontend Testing Best Practices

### 1. Component Testing
```typescript
describe('PortfolioList', () => {
  // Test rendering
  describe('rendering', () => {
    it('should render with correct props', () => {
      // Test prop handling
    });

    it('should render different states', () => {
      // Test loading, error, empty states
    });
  });

  // Test user interactions
  describe('user interactions', () => {
    it('should handle click events', () => {
      // Test click handlers
    });

    it('should handle form submissions', () => {
      // Test form handling
    });

    it('should handle keyboard navigation', () => {
      // Test accessibility
    });
  });

  // Test side effects
  describe('side effects', () => {
    it('should call API on mount', () => {
      // Test useEffect
    });

    it('should update when props change', () => {
      // Test prop updates
    });
  });
});
```

### 2. Hook Testing
```typescript
describe('usePortfolios', () => {
  // Test state management
  describe('state management', () => {
    it('should initialize with correct default state', () => {
      // Test initial state
    });

    it('should update state correctly', () => {
      // Test state updates
    });
  });

  // Test API integration
  describe('API integration', () => {
    it('should handle successful API calls', () => {
      // Test success scenarios
    });

    it('should handle API errors', () => {
      // Test error scenarios
    });

    it('should handle loading states', () => {
      // Test loading states
    });
  });

  // Test cleanup
  describe('cleanup', () => {
    it('should cleanup on unmount', () => {
      // Test cleanup logic
    });
  });
});
```

### 3. Service Testing
```typescript
describe('PortfolioService', () => {
  // Test API calls
  describe('API calls', () => {
    it('should make correct HTTP requests', () => {
      // Test request format
    });

    it('should handle response data', () => {
      // Test response handling
    });

    it('should handle network errors', () => {
      // Test error handling
    });
  });

  // Test data transformation
  describe('data transformation', () => {
    it('should transform API data correctly', () => {
      // Test data processing
    });

    it('should handle malformed data', () => {
      // Test error handling
    });
  });
});
```

## 🧪 Advanced Testing Techniques

### 1. Mocking Strategies
```typescript
// Mock external dependencies
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock modules
vi.mock('../services/api', () => ({
  getPortfolios: vi.fn(),
  createPortfolio: vi.fn(),
}));

// Mock environment variables
vi.mock('../utils/env', () => ({
  VITE_API_BASE_URL: 'http://localhost:3000',
}));
```

### 2. Test Data Management
```typescript
// Factory pattern for test data
export class TestDataFactory {
  static createPortfolio(overrides: Partial<Portfolio> = {}): Portfolio {
    return {
      id: faker.datatype.uuid(),
      name: faker.company.name(),
      account_id: faker.datatype.uuid(),
      total_value: faker.datatype.number({ min: 1000, max: 1000000 }),
      cash_balance: faker.datatype.number({ min: 0, max: 100000 }),
      created_at: faker.date.past(),
      updated_at: faker.date.recent(),
      ...overrides,
    };
  }

  static createPortfolios(count: number): Portfolio[] {
    return Array.from({ length: count }, () => this.createPortfolio());
  }
}
```

### 3. Async Testing
```typescript
describe('async operations', () => {
  it('should handle async operations correctly', async () => {
    // Use async/await
    const result = await service.fetchData();
    expect(result).toBeDefined();
  });

  it('should handle promises', () => {
    // Use promises
    return service.fetchData().then(result => {
      expect(result).toBeDefined();
    });
  });

  it('should handle timeouts', async () => {
    // Test timeout scenarios
    await expect(service.fetchDataWithTimeout()).rejects.toThrow('Timeout');
  });
});
```

### 4. Error Testing
```typescript
describe('error handling', () => {
  it('should handle specific errors', () => {
    // Test specific error types
    expect(() => service.invalidOperation()).toThrow(ValidationError);
  });

  it('should handle error messages', () => {
    // Test error messages
    expect(() => service.invalidOperation()).toThrow('Invalid input');
  });

  it('should handle error properties', () => {
    // Test error properties
    try {
      service.invalidOperation();
    } catch (error) {
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
    }
  });
});
```

## 🔧 Performance Testing

### 1. Load Testing
```typescript
describe('performance', () => {
  it('should handle multiple concurrent requests', async () => {
    const promises = Array.from({ length: 100 }, () => service.fetchData());
    const results = await Promise.all(promises);
    expect(results).toHaveLength(100);
  });

  it('should complete within time limit', async () => {
    const start = Date.now();
    await service.expensiveOperation();
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1000); // 1 second
  });
});
```

### 2. Memory Testing
```typescript
describe('memory usage', () => {
  it('should not leak memory', () => {
    const initialMemory = process.memoryUsage();
    
    // Perform operations
    for (let i = 0; i < 1000; i++) {
      service.createObject();
    }
    
    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB
  });
});
```

## 🛡️ Security Testing

### 1. Input Validation
```typescript
describe('security', () => {
  it('should sanitize user input', () => {
    const maliciousInput = '<script>alert("xss")</script>';
    const result = service.sanitizeInput(maliciousInput);
    expect(result).not.toContain('<script>');
  });

  it('should validate file uploads', () => {
    const maliciousFile = { name: 'malicious.exe', type: 'application/x-executable' };
    expect(() => service.validateFile(maliciousFile)).toThrow('Invalid file type');
  });
});
```

### 2. Authentication Testing
```typescript
describe('authentication', () => {
  it('should require valid token', async () => {
    await expect(service.authenticatedRequest()).rejects.toThrow('Unauthorized');
  });

  it('should handle expired tokens', async () => {
    const expiredToken = 'expired-token';
    await expect(service.authenticatedRequest(expiredToken)).rejects.toThrow('Token expired');
  });
});
```

## 📊 Test Reporting

### 1. Coverage Reports
```typescript
// Generate detailed coverage reports
describe('coverage', () => {
  it('should have comprehensive coverage', () => {
    // Ensure all critical paths are covered
    expect(coverage.percentage).toBeGreaterThan(80);
  });
});
```

### 2. Test Metrics
```typescript
// Track test performance
describe('metrics', () => {
  it('should track test execution time', () => {
    const start = Date.now();
    // Test execution
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100); // 100ms
  });
});
```

## 🔄 Continuous Integration

### 1. Pre-commit Hooks
```bash
# Run tests before commit
npm run test:pre-commit

# Check coverage
npm run test:coverage

# Lint code
npm run lint
```

### 2. CI Pipeline
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm run test
      - name: Generate coverage
        run: npm run test:coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v1
```

## 📝 Documentation

### 1. Test Documentation
```typescript
/**
 * Tests for PortfolioService.calculateNAV method
 * 
 * This method calculates the Net Asset Value (NAV) of a portfolio
 * by summing the market value of all assets plus cash balance.
 * 
 * Test Cases:
 * - Normal calculation with multiple assets
 * - Zero values handling
 * - Invalid data error handling
 * - Performance with large datasets
 * 
 * @see PortfolioService.calculateNAV
 */
describe('calculateNAV', () => {
  // Test implementations
});
```

### 2. Test Maintenance
```typescript
// Keep tests up to date
describe('maintenance', () => {
  it('should be updated when requirements change', () => {
    // Update tests when business logic changes
  });

  it('should be refactored when code changes', () => {
    // Refactor tests when implementation changes
  });
});
```

## 🎯 Quality Assurance

### 1. Test Quality Metrics
- **Test Coverage**: 80%+ overall
- **Test Execution Time**: < 30 seconds
- **Test Reliability**: 99%+ pass rate
- **Test Maintainability**: Easy to understand and modify

### 2. Code Review Checklist
- [ ] Tests cover all critical paths
- [ ] Tests are independent and isolated
- [ ] Tests use proper mocking
- [ ] Tests have clear assertions
- [ ] Tests are well documented
- [ ] Tests follow naming conventions

---

**Last Updated**: September 7, 2025
**Version**: 1.0.0
**Maintainer**: Development Team
