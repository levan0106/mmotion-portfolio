# CR-006 Asset Snapshot System - Testing Guide

This document provides comprehensive guidance for testing the CR-006 Asset Snapshot System in a Docker environment.

## Table of Contents

1. [Overview](#overview)
2. [Test Environment Setup](#test-environment-setup)
3. [Running Tests](#running-tests)
4. [Test Categories](#test-categories)
5. [Test Utilities](#test-utilities)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)
8. [Continuous Integration](#continuous-integration)

## Overview

The CR-006 Asset Snapshot System includes comprehensive testing infrastructure designed to run in Docker environments. The testing suite covers:

- **Integration Tests**: API endpoints, database operations, and service interactions
- **Performance Tests**: Load testing, query optimization, and memory usage
- **Error Handling Tests**: Edge cases, invalid data, and system recovery
- **Unit Tests**: Individual component testing and validation

## Test Environment Setup

### Prerequisites

1. **Docker Environment**
   ```bash
   # Check Docker status
   docker ps
   
   # Start Docker services
   docker-compose up -d
   ```

2. **Application Running**
   ```bash
   # Start the application
   npm run start:dev
   
   # Verify application health
   curl http://localhost:3000/health
   ```

3. **Database Access**
   ```bash
   # Check database connection
   psql -h localhost -U postgres -d portfolio_test
   ```

### Environment Variables

Create a `.env.test` file with the following configuration:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=portfolio_test

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Application Configuration
NODE_ENV=test
PORT=3000
HOST=localhost

# Test Configuration
TEST_TIMEOUT=30000
TEST_RETRIES=3
TEST_PARALLEL=false
```

## Running Tests

### Quick Start

```bash
# Run all tests
npm run test:e2e:docker

# Run specific test categories
npm run test:integration
npm run test:performance
npm run test:error-handling
npm run test:snapshot
```

### Using Test Scripts

#### Linux/Mac
```bash
chmod +x scripts/test-docker.sh
./scripts/test-docker.sh
```

#### Windows (Command Prompt)
```cmd
scripts\test-docker.bat
```

#### Windows (PowerShell)
```powershell
.\scripts\test-docker.ps1
```

### Manual Test Execution

```bash
# Using test runner
npm run test:run

# Using Jest directly
npx jest --config test/jest-docker.json

# Using ts-node
npx ts-node test/run-tests.ts
```

### Health Check

Before running tests, verify the environment:

```bash
# Run health check
npx ts-node test/test-health-check.ts

# Monitor test execution
npx ts-node test/test-monitor.ts
```

## Test Categories

### 1. Integration Tests (`snapshot.integration.e2e-spec.ts`)

**Purpose**: Test API endpoints and database operations

**Test Scenarios**:
- Create snapshot with valid data
- Retrieve snapshot by ID
- Update existing snapshot
- Delete snapshot
- List snapshots with pagination
- Filter snapshots by date range
- Search snapshots by portfolio
- Validate data integrity

**Example**:
```typescript
describe('Snapshot Integration Tests', () => {
  it('should create a new snapshot', async () => {
    const snapshotData = {
      portfolioId: 'test-portfolio-id',
      assetId: 'test-asset-id',
      snapshotDate: new Date(),
      granularity: SnapshotGranularity.DAILY,
      currentQuantity: 100,
      currentPrice: 50,
    };

    const response = await request(app.getHttpServer())
      .post('/snapshots')
      .send(snapshotData)
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.portfolioId).toBe(snapshotData.portfolioId);
  });
});
```

### 2. Performance Tests (`snapshot.performance.e2e-spec.ts`)

**Purpose**: Test system performance under load

**Test Scenarios**:
- Bulk snapshot creation (100+ records)
- Query performance with large datasets
- Memory usage monitoring
- Response time validation
- Concurrent operation testing

**Example**:
```typescript
describe('Snapshot Performance Tests', () => {
  it('should handle bulk snapshot creation efficiently', async () => {
    const startTime = performance.now();
    
    const snapshots = Array.from({ length: 100 }, (_, i) => ({
      portfolioId: 'test-portfolio-id',
      assetId: 'test-asset-id',
      snapshotDate: new Date(Date.now() - i * 86400000),
      granularity: SnapshotGranularity.DAILY,
      currentQuantity: 100 + i,
      currentPrice: 50 + i,
    }));

    const response = await request(app.getHttpServer())
      .post('/snapshots/bulk')
      .send({ snapshots })
      .expect(201);

    const duration = performance.now() - startTime;
    expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
  });
});
```

### 3. Error Handling Tests (`snapshot.error-handling.e2e-spec.ts`)

**Purpose**: Test error conditions and edge cases

**Test Scenarios**:
- Invalid data validation
- Missing required fields
- Duplicate ID handling
- Database connection errors
- Service unavailability
- Timeout handling

**Example**:
```typescript
describe('Snapshot Error Handling Tests', () => {
  it('should reject invalid snapshot data', async () => {
    const invalidData = {
      portfolioId: '', // Empty portfolio ID
      assetId: 'invalid-uuid', // Invalid UUID
      currentQuantity: -100, // Negative quantity
    };

    await request(app.getHttpServer())
      .post('/snapshots')
      .send(invalidData)
      .expect(400);
  });
});
```

## Test Utilities

### TestUtils Class

The `TestUtils` class provides helper methods for test data management:

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

### TestDataSetup Class

The `TestDataSetup` class manages test data lifecycle:

```typescript
import { TestDataSetup } from './test-data-setup';

const testDataSetup = new TestDataSetup(dataSource);

// Setup test data
await testDataSetup.setupTestData();

// Cleanup test data
await testDataSetup.cleanup();
```

### TestDatabaseSetup Class

The `TestDatabaseSetup` class manages database setup for tests:

```typescript
import { TestDatabaseSetup } from './test-db-setup';

const testDbSetup = new TestDatabaseSetup();

// Initialize test database
await testDbSetup.initialize();

// Cleanup test database
await testDbSetup.cleanup();
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

**Error**: `Connection refused` or `Database not found`

**Solutions**:
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart PostgreSQL
docker-compose restart postgres

# Check database exists
psql -h localhost -U postgres -l | grep portfolio_test
```

#### 2. Application Not Running

**Error**: `Connection refused` on port 3000

**Solutions**:
```bash
# Check if application is running
curl http://localhost:3000/health

# Start application
npm run start:dev

# Check for port conflicts
netstat -tulpn | grep :3000
```

#### 3. Test Timeout

**Error**: `Test timeout exceeded`

**Solutions**:
```bash
# Increase timeout in jest-docker.json
"testTimeout": 60000

# Check for long-running operations
# Reduce test data size
# Optimize test queries
```

#### 4. Memory Issues

**Error**: `Out of memory` or high memory usage

**Solutions**:
```bash
# Reduce test data size
# Clear test data between tests
# Check for memory leaks
# Increase Node.js memory limit
node --max-old-space-size=4096 test/run-tests.ts
```

### Debug Mode

Enable debug mode for detailed logging:

```bash
# Debug Jest tests
DEBUG=jest:* npm run test:e2e:docker

# Debug specific test
DEBUG=test:* npm run test:e2e:docker -- --testNamePattern="should create snapshot"

# Debug with verbose output
npm run test:e2e:docker -- --verbose
```

### Test Reports

Test results are available in multiple formats:

1. **Console Output**: Real-time test results
2. **Jest Reports**: Detailed test reports in `test-results/`
3. **Coverage Reports**: Code coverage in `coverage/`
4. **HTML Reports**: Visual test reports in `test/reports/`

## Best Practices

### 1. Test Isolation

- Each test should be independent
- Clean up test data after each test
- Use unique identifiers for test data
- Avoid shared state between tests

### 2. Test Data Management

- Use realistic test data
- Generate test data programmatically
- Clean up test data after tests
- Use test-specific database

### 3. Performance Considerations

- Monitor test execution time
- Use parallel execution when possible
- Optimize database queries
- Monitor memory usage

### 4. Error Handling

- Test both success and failure cases
- Validate error messages
- Test edge cases and boundary conditions
- Verify proper error responses

### 5. Maintenance

- Keep tests simple and readable
- Use descriptive test names
- Group related tests
- Document complex test scenarios

## Continuous Integration

### GitHub Actions

The project includes GitHub Actions workflow for automated testing:

```yaml
# .github/workflows/test.yml
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

### Test Monitoring

Use the test monitoring script to track test execution:

```bash
# Start test monitoring
npx ts-node test/test-monitor.ts

# Generate test summary
npx ts-node test/test-summary.ts
```

### Test Reports

Test reports are automatically generated and can be accessed:

1. **Console Output**: Real-time test results
2. **Jest Reports**: `test-results/jest-results.json`
3. **Coverage Reports**: `coverage/coverage-summary.json`
4. **HTML Reports**: `test/reports/test-report.html`
5. **Performance Reports**: `test-results/performance-results.json`

## Conclusion

The CR-006 Asset Snapshot System testing infrastructure provides comprehensive coverage for integration, performance, and error handling scenarios. By following this guide, you can ensure reliable and maintainable tests that validate the system's functionality in Docker environments.

For additional support or questions, please refer to the project documentation or contact the development team.
