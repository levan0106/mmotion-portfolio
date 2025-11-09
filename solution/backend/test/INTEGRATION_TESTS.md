# CR-006 Asset Snapshot System - Integration Tests

## Overview

This document provides a comprehensive overview of the integration tests for the CR-006 Asset Snapshot System, designed to run in Docker environments.

## Test Architecture

### Test Categories

1. **Integration Tests** (`snapshot.integration.e2e-spec.ts`)
   - API endpoint testing
   - Database operation validation
   - Service interaction testing
   - Data integrity verification

2. **Performance Tests** (`snapshot.performance.e2e-spec.ts`)
   - Load testing
   - Query performance validation
   - Memory usage monitoring
   - Response time analysis

3. **Error Handling Tests** (`snapshot.error-handling.e2e-spec.ts`)
   - Edge case testing
   - Invalid data handling
   - System recovery testing
   - Error response validation

### Test Infrastructure

- **Jest Configuration**: `jest-docker.json`
- **Test Environment**: `test-env.ts`
- **Test Utilities**: `test-utils.ts`
- **Test Data Setup**: `test-data-setup.ts`
- **Database Setup**: `test-db-setup.ts`
- **Health Check**: `test-health-check.ts`
- **Test Monitor**: `test-monitor.ts`
- **Test Summary**: `test-summary.ts`

## Running Tests

### Quick Start

```bash
# Run all tests
npm run test:e2e:docker

# Run specific test categories
npm run test:integration
npm run test:performance
npm run test:error-handling
```

### Docker Environment

```bash
# Start test environment
docker-compose -f test/docker-compose.test.yml up -d

# Run tests
docker-compose -f test/docker-compose.test.yml exec test-runner npm run test

# View logs
docker-compose -f test/docker-compose.test.yml logs -f

# Stop test environment
docker-compose -f test/docker-compose.test.yml down -v
```

### Test Scripts

```bash
# Setup test environment
./test/setup-test-env.sh

# Run health check
npx ts-node test/test-health-check.ts

# Run test monitor
npx ts-node test/test-monitor.ts

# Generate test summary
npx ts-node test/test-summary.ts

# Cleanup test environment
./test/cleanup-test-env.sh
```

## Test Scenarios

### Integration Test Scenarios

1. **Snapshot CRUD Operations**
   - Create snapshot with valid data
   - Retrieve snapshot by ID
   - Update existing snapshot
   - Delete snapshot
   - List snapshots with pagination

2. **Data Validation**
   - Required field validation
   - Data type validation
   - Unique constraint validation
   - Business rule validation

3. **API Endpoint Testing**
   - GET /snapshots
   - POST /snapshots
   - PUT /snapshots/:id
   - DELETE /snapshots/:id
   - GET /snapshots/portfolio/:portfolioId
   - GET /snapshots/statistics
   - POST /snapshots/cleanup

### Performance Test Scenarios

1. **Bulk Operations**
   - Create 100+ snapshots
   - Update multiple snapshots
   - Delete multiple snapshots
   - Query large datasets

2. **Query Performance**
   - Complex queries
   - Index usage verification
   - Pagination performance
   - Filtering performance

3. **Memory Usage**
   - Memory leak detection
   - Garbage collection monitoring
   - Heap usage analysis
   - Memory optimization

### Error Handling Test Scenarios

1. **Invalid Data**
   - Negative quantities
   - Invalid dates
   - Missing required fields
   - Type mismatches

2. **Edge Cases**
   - Empty datasets
   - Maximum values
   - Boundary conditions
   - Null values

3. **System Errors**
   - Database connection issues
   - Service unavailability
   - Timeout handling
   - Resource exhaustion

## Test Data Management

### Test Data Setup

```typescript
import { TestDataSetup } from './test-data-setup';

const testDataSetup = new TestDataSetup(dataSource);

// Setup test data
await testDataSetup.setupTestData();

// Cleanup test data
await testDataSetup.cleanup();
```

### Test Utilities

```typescript
import { TestUtils } from './test-utils';

const testUtils = new TestUtils(dataSource);

// Create test snapshot
const snapshot = await testUtils.createTestSnapshot({
  portfolioId: 'test-portfolio-id',
  assetId: 'test-asset-id',
  currentQuantity: 100,
  currentPrice: 50,
});

// Create multiple snapshots
const snapshots = await testUtils.createTestSnapshots(10);

// Get snapshot by ID
const retrievedSnapshot = await testUtils.getSnapshotById(snapshot.id);

// Get snapshots by portfolio
const portfolioSnapshots = await testUtils.getSnapshotsByPortfolio('portfolio-id');

// Count snapshots
const count = await testUtils.countSnapshots();

// Clear all snapshots
await testUtils.clearAllSnapshots();
```

## Test Configuration

### Environment Variables

```bash
NODE_ENV=test
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=portfolio_test
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Jest Configuration

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "collectCoverageFrom": [
    "src/**/*.(t|j)s"
  ],
  "coverageDirectory": "../coverage",
  "testTimeout": 30000,
  "setupFilesAfterEnv": ["<rootDir>/global-setup.ts"],
  "globalTeardown": "<rootDir>/global-teardown.ts"
}
```

## Test Reports

### Console Output

Real-time test results with detailed logging and error reporting.

### Jest Reports

- **Test Results**: `test-results/jest-results.json`
- **Coverage Reports**: `coverage/coverage-summary.json`
- **Performance Reports**: `test-results/performance-results.json`

### HTML Reports

- **Test Summary**: `test/reports/test-summary.json`
- **Visual Report**: `test/reports/test-report.html`

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check if PostgreSQL is running
   - Verify connection credentials
   - Ensure database exists

2. **Application Not Running**
   - Start the application on port 3000
   - Check for port conflicts
   - Verify application health

3. **Test Timeout**
   - Increase timeout in configuration
   - Check for long-running operations
   - Verify test data size

4. **Memory Issues**
   - Reduce test data size
   - Clear test data between tests
   - Check for memory leaks

### Debug Mode

```bash
# Debug Jest tests
DEBUG=jest:* npm run test:e2e:docker

# Debug specific test
DEBUG=test:* npm run test:e2e:docker -- --testNamePattern="should create snapshot"

# Debug with verbose output
npm run test:e2e:docker -- --verbose
```

## Best Practices

### Test Design

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data
3. **Realistic Data**: Use realistic test data
4. **Performance**: Monitor test execution time
5. **Reliability**: Tests should be deterministic

### Test Maintenance

1. **Naming**: Use descriptive test names
2. **Grouping**: Group related tests
3. **Documentation**: Add comments for complex scenarios
4. **Assertions**: Use meaningful assertions
5. **Error Handling**: Test both success and failure cases

## Continuous Integration

### GitHub Actions

The project includes automated testing via GitHub Actions:

```yaml
name: CR-006 Asset Snapshot System Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: portfolio_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Run database migrations
      run: npm run typeorm:migration:run
      env:
        DB_HOST: localhost
        DB_PORT: 5432
        DB_USERNAME: postgres
        DB_PASSWORD: postgres
        DB_NAME: portfolio_test
    
    - name: Start application
      run: npm run start:prod &
      env:
        DB_HOST: localhost
        DB_PORT: 5432
        DB_USERNAME: postgres
        DB_PASSWORD: postgres
        DB_NAME: portfolio_test
        REDIS_HOST: localhost
        REDIS_PORT: 6379
    
    - name: Wait for application to start
      run: |
        timeout 60 bash -c 'until curl -f http://localhost:3000/health; do sleep 2; done'
    
    - name: Run tests
      run: npm run test:e2e:docker
      env:
        DB_HOST: localhost
        DB_PORT: 5432
        DB_USERNAME: postgres
        DB_PASSWORD: postgres
        DB_NAME: portfolio_test
        REDIS_HOST: localhost
        REDIS_PORT: 6379
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-results
        path: test-results/
```

## Conclusion

The CR-006 Asset Snapshot System integration tests provide comprehensive coverage for all system components, ensuring reliability and performance in Docker environments. By following this guide, you can effectively run, maintain, and troubleshoot the test suite.

For additional support or questions, please refer to the project documentation or contact the development team.
