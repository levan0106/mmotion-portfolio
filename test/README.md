# CR-006 Asset Snapshot System - Integration Tests

This directory contains comprehensive integration tests for the CR-006 Asset Snapshot System, designed to run in a Docker environment.

## Test Structure

```
test/
├── README.md                           # This file
├── jest-docker.json                    # Jest configuration for Docker
├── global-setup.ts                     # Global test setup
├── global-teardown.ts                  # Global test teardown
├── test-env.ts                         # Test environment configuration
├── test-utils.ts                       # Test utilities and helpers
├── test-data-setup.ts                  # Test data setup and cleanup
├── test-db-setup.ts                    # Database setup for tests
├── run-tests.ts                        # Test runner script
├── modules/
│   └── portfolio/
│       ├── snapshot.integration.e2e-spec.ts      # Integration tests
│       ├── snapshot.performance.e2e-spec.ts      # Performance tests
│       └── snapshot.error-handling.e2e-spec.ts   # Error handling tests
└── scripts/
    ├── test-docker.sh                  # Linux/Mac test script
    ├── test-docker.bat                 # Windows test script
    └── test-docker.ps1                 # PowerShell test script
```

## Test Categories

### 1. Integration Tests (`snapshot.integration.e2e-spec.ts`)
- **CRUD Operations**: Create, read, update, delete snapshots
- **API Endpoints**: Test all REST API endpoints
- **Data Validation**: Verify data integrity and validation
- **Database Operations**: Test repository and service methods

### 2. Performance Tests (`snapshot.performance.e2e-spec.ts`)
- **Bulk Operations**: Test creating/updating multiple snapshots
- **Query Performance**: Test query speed and optimization
- **Load Testing**: Test system under load
- **Memory Usage**: Monitor memory consumption

### 3. Error Handling Tests (`snapshot.error-handling.e2e-spec.ts`)
- **Invalid Data**: Test handling of invalid input
- **Edge Cases**: Test boundary conditions
- **Error Responses**: Verify proper error handling
- **Recovery**: Test system recovery from errors

## Running Tests

### Prerequisites

1. **Docker Environment**: Ensure Docker is running
2. **Application**: Start the application on port 3000
3. **Database**: PostgreSQL database accessible
4. **Dependencies**: Install all npm dependencies

### Quick Start

```bash
# Run all tests
npm run test:e2e:docker

# Run specific test suite
npm run test:e2e:docker -- --testPathPattern="integration"
npm run test:e2e:docker -- --testPathPattern="performance"
npm run test:e2e:docker -- --testPathPattern="error-handling"
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
# Using ts-node
npx ts-node test/run-tests.ts

# Using Jest directly
npx jest --config test/jest-docker.json
```

## Test Configuration

### Environment Variables

The tests use the following environment variables:

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

### Test Data

Test data is automatically generated and cleaned up:

- **Portfolio ID**: `550e8400-e29b-41d4-a716-446655440000`
- **Asset ID**: `550e8400-e29b-41d4-a716-446655440001`
- **User ID**: `550e8400-e29b-41d4-a716-446655440002`

## Test Utilities

### TestUtils Class

```typescript
import { TestUtils } from './test-utils';

const testUtils = new TestUtils(dataSource);

// Create test snapshot
const snapshot = await testUtils.createTestSnapshot();

// Create multiple snapshots
const snapshots = await testUtils.createTestSnapshots(10);

// Get snapshot by ID
const snapshot = await testUtils.getSnapshotById('snapshot-id');

// Get snapshots by portfolio
const snapshots = await testUtils.getSnapshotsByPortfolio('portfolio-id');

// Count snapshots
const count = await testUtils.countSnapshots();

// Clear all snapshots
await testUtils.clearAllSnapshots();
```

### TestDataSetup Class

```typescript
import { TestDataSetup } from './test-data-setup';

const testDataSetup = new TestDataSetup(dataSource);

// Setup test data
await testDataSetup.setupTestData();

// Cleanup test data
await testDataSetup.cleanup();
```

## Test Scenarios

### Integration Test Scenarios

1. **Snapshot Creation**
   - Valid snapshot data
   - Required field validation
   - Data type validation
   - Unique constraint validation

2. **Snapshot Retrieval**
   - Get by ID
   - Get by portfolio
   - Pagination
   - Filtering and sorting

3. **Snapshot Updates**
   - Update existing snapshot
   - Partial updates
   - Validation on updates

4. **Snapshot Deletion**
   - Delete by ID
   - Bulk deletion
   - Cascade deletion

### Performance Test Scenarios

1. **Bulk Operations**
   - Create 100+ snapshots
   - Update multiple snapshots
   - Delete multiple snapshots

2. **Query Performance**
   - Complex queries
   - Large dataset queries
   - Index usage verification

3. **Load Testing**
   - Concurrent operations
   - High volume data
   - Memory usage monitoring

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

3. **System Errors**
   - Database connection issues
   - Service unavailability
   - Timeout handling

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
   - Increase timeout in test configuration
   - Check for long-running operations
   - Verify test data size

4. **Memory Issues**
   - Reduce test data size
   - Clear test data between tests
   - Check for memory leaks

### Debug Mode

Enable debug mode for detailed logging:

```bash
DEBUG=test:* npm run test:e2e:docker
```

### Test Reports

Test results are available in:

- **Console Output**: Real-time test results
- **Jest Reports**: Detailed test reports
- **Coverage Reports**: Code coverage information

## Contributing

When adding new tests:

1. **Follow Naming Convention**: Use descriptive test names
2. **Group Related Tests**: Use `describe` blocks
3. **Clean Up**: Always clean up test data
4. **Document**: Add comments for complex test scenarios
5. **Assertions**: Use meaningful assertions
6. **Error Handling**: Test both success and failure cases

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up after tests
3. **Data**: Use realistic test data
4. **Performance**: Monitor test execution time
5. **Reliability**: Tests should be deterministic
6. **Maintainability**: Keep tests simple and readable
