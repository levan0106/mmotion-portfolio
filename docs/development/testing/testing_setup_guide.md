# Testing Setup Guide - Portfolio Management System

## 📋 Overview

This guide provides step-by-step instructions for setting up the testing environment for the Portfolio Management System. It covers both backend and frontend testing setup.

## 🏗️ Backend Testing Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- npm or yarn

### 1. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install testing dependencies
npm install --save-dev @nestjs/testing jest @types/jest ts-jest
npm install --save-dev supertest @types/supertest
```

### 2. Database Setup
```bash
# Create test database
createdb portfolio_management_test

# Run migrations
npm run migration:run

# Seed test data
npm run seed:test
```

### 3. Environment Configuration
```bash
# Copy environment file
cp env.example .env.test

# Configure test environment
DATABASE_URL=postgresql://username:password@localhost:5432/portfolio_management_test
REDIS_URL=redis://localhost:6379/1
NODE_ENV=test
```

### 4. Jest Configuration
```javascript
// jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.interface.ts',
    '!**/*.dto.ts',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/../test/setup.ts'],
};
```

### 5. Test Database Setup
```typescript
// test/setup.ts
import { TestHelper } from './utils/test-helpers';

beforeAll(async () => {
  await TestHelper.setupTest({
    useDatabase: true,
    seedData: true,
    suppressLogs: true,
  });
});

afterAll(async () => {
  await TestHelper.cleanupTest();
});
```

## 🎨 Frontend Testing Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### 1. Install Dependencies
```bash
# Install frontend dependencies
cd frontend
npm install

# Install testing dependencies
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/user-event jsdom
npm install --save-dev @vitejs/plugin-react
```

### 2. Vitest Configuration
```typescript
// frontend/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.test.tsx'],
    globals: true,
  },
});
```

### 3. Test Setup File
```typescript
// frontend/src/test/setup.test.tsx
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables
vi.mock('../utils/env', () => ({
  VITE_API_BASE_URL: 'http://localhost:3000',
}));

// Mock API calls
vi.mock('../services/api', () => ({
  getPortfolios: vi.fn(),
  createPortfolio: vi.fn(),
}));
```

### 4. Package.json Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  }
}
```

## 🧪 Test Utilities Setup

### 1. Backend Test Helpers
```typescript
// test/utils/test-helpers.ts
export class TestHelper {
  static async setupTest(options: TestOptions) {
    // Database setup
    // Test data seeding
    // Mock configuration
  }

  static async cleanupTest() {
    // Database cleanup
    // Mock cleanup
  }

  static createTestData() {
    // Test data creation
  }
}
```

### 2. Frontend Test Helpers
```typescript
// frontend/src/test/test-utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider theme={createTheme()}>
      {children}
    </ThemeProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

## 🗄️ Database Testing Setup

### 1. Test Database Configuration
```typescript
// test/database/test-database.config.ts
export const testDatabaseConfig = {
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'test_user',
  password: 'test_password',
  database: 'portfolio_management_test',
  synchronize: true,
  logging: false,
  entities: [__dirname + '/../src/**/*.entity.ts'],
};
```

### 2. Test Data Seeding
```typescript
// test/fixtures/test-data.seeder.ts
export class TestDataSeeder {
  static async seedAccounts() {
    // Seed test accounts
  }

  static async seedPortfolios() {
    // Seed test portfolios
  }

  static async seedAssets() {
    // Seed test assets
  }
}
```

## 🔧 Mock Configuration

### 1. Backend Mocks
```typescript
// test/mocks/repository.mock.ts
export const mockPortfolioRepository = {
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
};
```

### 2. Frontend Mocks
```typescript
// frontend/src/test/mocks/api.mock.ts
export const mockApi = {
  getPortfolios: vi.fn(),
  createPortfolio: vi.fn(),
  updatePortfolio: vi.fn(),
  deletePortfolio: vi.fn(),
};
```

## 🚀 Running Tests

### Backend Tests
```bash
# Run all tests
npm run test

# Run with coverage
npm run test:cov

# Run specific test
npm run test -- --testNamePattern="PortfolioService"

# Run in watch mode
npm run test:watch
```

### Frontend Tests
```bash
# Run all tests
cd frontend
npm run test

# Run with coverage
npm run test:coverage

# Run specific test
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

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check database exists
psql -l | grep portfolio_management_test

# Reset test database
dropdb portfolio_management_test
createdb portfolio_management_test
```

#### 2. Redis Connection Issues
```bash
# Check Redis status
redis-cli ping

# Check Redis configuration
redis-cli config get port
```

#### 3. Test Environment Issues
```bash
# Check environment variables
echo $NODE_ENV
echo $DATABASE_URL

# Verify test configuration
npm run test -- --verbose
```

#### 4. Frontend Test Issues
```bash
# Clear node modules
rm -rf node_modules package-lock.json
npm install

# Check Vitest configuration
npm run test -- --config vitest.config.ts
```

### Debug Mode
```bash
# Backend debug
npm run test -- --verbose --detectOpenHandles

# Frontend debug
npm run test -- --reporter=verbose
```

## 📊 Coverage Reports

### Backend Coverage
```bash
# Generate coverage report
npm run test:cov

# View coverage report
open coverage/lcov-report/index.html
```

### Frontend Coverage
```bash
# Generate coverage report
cd frontend
npm run test:coverage

# View coverage report
open coverage/index.html
```

## 🔄 Continuous Integration

### GitHub Actions Setup
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:6
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
```

## 📝 Best Practices

### Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Keep tests independent
- Clean up after tests

### Performance
- Use database transactions for isolation
- Mock external services
- Avoid unnecessary setup/teardown
- Run tests in parallel when possible

### Maintenance
- Update tests when code changes
- Remove obsolete tests
- Refactor flaky tests
- Keep test data minimal

---

**Last Updated**: September 7, 2025
**Version**: 1.0.0
**Maintainer**: Development Team
