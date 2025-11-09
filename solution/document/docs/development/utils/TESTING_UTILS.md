# Testing Utils - Hướng Dẫn Sử Dụng

## 📋 Tổng Quan

Testing Utils cung cấp các functions và classes để hỗ trợ việc viết test một cách hiệu quả và nhất quán trong toàn bộ hệ thống. Tất cả testing phải sử dụng các utilities từ `test/utils/test-helpers.ts`.

## 🎯 Mục Tiêu

- **Consistency**: Đảm bảo test patterns nhất quán
- **Efficiency**: Tăng hiệu suất viết test
- **Maintainability**: Dễ bảo trì và cập nhật test
- **Coverage**: Đảm bảo test coverage đầy đủ

## 📚 Danh Sách Utilities

### 1. Test Setup & Cleanup

#### `TestHelper.setupTest(options?)`

Sets up complete test environment.

```typescript
import { TestHelper } from '@/test/utils/test-helpers';

// Basic setup
beforeAll(async () => {
  await TestHelper.setupTest();
});

// With options
beforeAll(async () => {
  await TestHelper.setupTest({
    useDatabase: true,
    seedData: true,
    suppressLogs: true
  });
});
```

**Options:**
```typescript
interface SetupOptions {
  useDatabase?: boolean;    // Use real database connection
  seedData?: boolean;       // Seed test data
  suppressLogs?: boolean;   // Suppress console logs
}
```

#### `TestHelper.cleanupTest(options?)`

Cleans up test environment.

```typescript
import { TestHelper } from '@/test/utils/test-helpers';

// Basic cleanup
afterAll(async () => {
  await TestHelper.cleanupTest();
});

// With options
afterAll(async () => {
  await TestHelper.cleanupTest({
    useDatabase: true,
    closeDatabase: true
  });
});
```

### 2. Test Module Creation

#### `TestHelper.createTestModule(config?)`

Creates a complete test module with all common dependencies.

```typescript
import { TestHelper } from '@/test/utils/test-helpers';

// Basic test module
const module = await TestHelper.createTestModule();

// With specific services
const module = await TestHelper.createTestModule({
  services: [PortfolioService, TradingService],
  controllers: [PortfolioController],
  useRealDatabase: false,
  customMocks: {
    'CUSTOM_SERVICE': mockCustomService
  }
});
```

#### `TestHelper.createServiceTest(ServiceClass, dependencies?)`

Creates a test module specifically for service testing.

```typescript
import { TestHelper } from '@/test/utils/test-helpers';

// Service test setup
const { module, service, mocks } = await TestHelper.createServiceTest(
  PortfolioService,
  [PortfolioRepository, AccountService]
);

// Access service and mocks
const portfolioService = service;
const mockRepo = mocks.portfolioRepository;
```

#### `TestHelper.createControllerTest(ControllerClass, services?)`

Creates a test module specifically for controller testing.

```typescript
import { TestHelper } from '@/test/utils/test-helpers';

// Controller test setup
const { module, controller, mocks } = await TestHelper.createControllerTest(
  PortfolioController,
  [PortfolioService, TradingService]
);

// Access controller and mocks
const portfolioController = controller;
const mockService = mocks.portfolioService;
```

### 3. Test Data Fixtures

#### `TestHelper.createTestData()`

Creates test data with fixtures.

```typescript
import { TestHelper } from '@/test/utils/test-helpers';

// Create test data
const testData = TestHelper.createTestData();

// Access specific data
const account = testData.account;
const portfolio = testData.portfolio;
const asset = testData.asset;
const createPortfolioDto = testData.createPortfolioDto;
```

**Available Test Data:**
- `account`: Test account data
- `portfolio`: Test portfolio data
- `asset`: Test asset data
- `portfolioAsset`: Test portfolio asset data
- `createPortfolioDto`: Test DTO for creating portfolio
- `updatePortfolioDto`: Test DTO for updating portfolio
- `portfolioList`: Array of test portfolios
- `uuids`: Mock UUIDs for testing

### 4. Validation Utilities

#### `testUtils.validation`

Validation utilities for test data.

```typescript
import { testUtils } from '@/test/utils/test-helpers';

// Validate UUIDs
testUtils.validation.isValidUUID('550e8400-e29b-41d4-a716-446655440000'); // true

// Validate emails
testUtils.validation.isValidEmail('user@example.com'); // true

// Validate currencies
testUtils.validation.isValidCurrency('VND'); // true

// Validate dates
testUtils.validation.isValidDate(new Date()); // true

// Validate positive numbers
testUtils.validation.isPositiveNumber(5); // true

// Validate portfolio structure
testUtils.validation.validatePortfolioStructure(portfolio); // true

// Validate account structure
testUtils.validation.validateAccountStructure(account); // true
```

### 5. Assertion Utilities

#### `testUtils.assertions`

Advanced assertion utilities.

```typescript
import { testUtils } from '@/test/utils/test-helpers';

// Expect promise to reject
await testUtils.assertions.expectToReject(
  service.invalidOperation(),
  'Expected error message'
);

// Expect object to have properties
testUtils.assertions.expectToHaveProperties(
  portfolio,
  ['id', 'name', 'accountId', 'createdAt']
);

// Expect value to be in range
testUtils.assertions.expectToBeInRange(portfolio.value, 0, 1000000);

// Expect date to be recent
testUtils.assertions.expectToBeRecentDate(portfolio.createdAt);
```

### 6. Database Testing

#### `TestDatabaseManager`

Manages database connections and cleanup for testing.

```typescript
import { TestDatabaseManager } from '@/test/utils/database-test.utils';

// Initialize test database
await TestDatabaseManager.initialize();

// Get data source
const dataSource = TestDatabaseManager.getDataSource();

// Get repository
const portfolioRepo = TestDatabaseManager.getRepository(Portfolio);

// Clean up test data
await TestDatabaseManager.cleanup();

// Close database connection
await TestDatabaseManager.close();

// Seed test data
await TestDatabaseManager.seedTestData();

// Reset database to clean state
await TestDatabaseManager.reset();
```

#### `dbTestUtils`

Database test helper functions.

```typescript
import { dbTestUtils } from '@/test/utils/database-test.utils';

// Wait for database to be ready
await dbTestUtils.waitForDatabase();

// Execute raw SQL query
const result = await dbTestUtils.executeQuery('SELECT COUNT(*) FROM portfolios');

// Count records in table
const count = await dbTestUtils.countRecords('portfolios');

// Check if table exists
const exists = await dbTestUtils.tableExists('portfolios');

// Get table schema
const schema = await dbTestUtils.getTableSchema('portfolios');
```

### 7. Test Patterns

#### `TestHelper.patterns.testCrudOperations()`

Tests CRUD operations pattern.

```typescript
import { TestHelper } from '@/test/utils/test-helpers';

// Test CRUD operations
await TestHelper.patterns.testCrudOperations(
  portfolioService,
  createPortfolioDto,
  updatePortfolioDto,
  (portfolio) => {
    expect(portfolio.id).toBeDefined();
    expect(portfolio.name).toBeDefined();
    expect(portfolio.accountId).toBeDefined();
  }
);
```

#### `TestHelper.patterns.testValidationErrors()`

Tests validation errors pattern.

```typescript
import { TestHelper } from '@/test/utils/test-helpers';

// Test validation errors
await TestHelper.patterns.testValidationErrors(
  () => portfolioService.create(invalidData),
  ['Portfolio name is required', 'Invalid account ID format']
);
```

#### `TestHelper.patterns.testPagination()`

Tests pagination pattern.

```typescript
import { TestHelper } from '@/test/utils/test-helpers';

// Test pagination
await TestHelper.patterns.testPagination(
  portfolioService,
  'findAll',
  25 // total items
);
```

#### `TestHelper.patterns.testErrorHandling()`

Tests error handling pattern.

```typescript
import { TestHelper } from '@/test/utils/test-helpers';

// Test error handling
await TestHelper.patterns.testErrorHandling(
  () => portfolioService.findOne('invalid-id'),
  BadRequestException,
  'Invalid portfolio ID format'
);
```

## 🎯 Best Practices

### 1. Sử dụng TestHelper cho setup

```typescript
// ✅ ĐÚNG - Sử dụng TestHelper
beforeAll(async () => {
  await TestHelper.setupTest({ useDatabase: true, seedData: true });
});

afterAll(async () => {
  await TestHelper.cleanupTest({ useDatabase: true });
});

// ❌ SAI - Tự setup thủ công
beforeAll(async () => {
  // Manual setup code
});
```

### 2. Sử dụng test patterns

```typescript
// ✅ ĐÚNG - Sử dụng test patterns
await TestHelper.patterns.testCrudOperations(
  service,
  createDto,
  updateDto,
  validator
);

// ❌ SAI - Tự viết test logic
it('should create, read, update, delete', async () => {
  // Manual test logic
});
```

### 3. Sử dụng fixtures cho test data

```typescript
// ✅ ĐÚNG - Sử dụng fixtures
const testData = TestHelper.createTestData();
const portfolio = testData.portfolio;

// ❌ SAI - Tự tạo test data
const portfolio = {
  id: 'test-id',
  name: 'Test Portfolio',
  // ... manual data
};
```

### 4. Sử dụng validation utils

```typescript
// ✅ ĐÚNG - Sử dụng validation utils
expect(testUtils.validation.isValidUUID(portfolio.id)).toBe(true);

// ❌ SAI - Tự validate
expect(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(portfolio.id)).toBe(true);
```

## 🔧 Code Examples

### Service Test Example

```typescript
import { TestHelper } from '@/test/utils/test-helpers';
import { PortfolioService } from '@/modules/portfolio/services/portfolio.service';

describe('PortfolioService', () => {
  let service: PortfolioService;
  let mocks: any;

  beforeAll(async () => {
    const { service: s, mocks: m } = await TestHelper.createServiceTest(
      PortfolioService,
      [PortfolioRepository, AccountService]
    );
    service = s;
    mocks = m;
  });

  afterAll(async () => {
    await TestHelper.cleanupTest();
  });

  beforeEach(() => {
    // Reset mocks
    TestModuleFactory.resetAllMocks(mocks);
  });

  describe('createPortfolio', () => {
    it('should create portfolio successfully', async () => {
      // Arrange
      const testData = TestHelper.createTestData();
      const createDto = testData.createPortfolioDto;
      
      mocks.portfolioRepository.create.mockReturnValue(testData.portfolio);
      mocks.portfolioRepository.save.mockResolvedValue(testData.portfolio);

      // Act
      const result = await service.createPortfolio(createDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(testData.portfolio.id);
      expect(mocks.portfolioRepository.create).toHaveBeenCalledWith(createDto);
      expect(mocks.portfolioRepository.save).toHaveBeenCalled();
    });

    it('should throw error for invalid account ID', async () => {
      // Arrange
      const invalidDto = { ...TestHelper.createTestData().createPortfolioDto, accountId: 'invalid' };

      // Act & Assert
      await expect(service.createPortfolio(invalidDto)).rejects.toThrow('Invalid account ID format');
    });
  });

  describe('CRUD Operations', () => {
    it('should perform CRUD operations correctly', async () => {
      const testData = TestHelper.createTestData();
      
      await TestHelper.patterns.testCrudOperations(
        service,
        testData.createPortfolioDto,
        testData.updatePortfolioDto,
        (portfolio) => {
          expect(testUtils.validation.isValidUUID(portfolio.id)).toBe(true);
          expect(portfolio.name).toBeDefined();
        }
      );
    });
  });
});
```

### Controller Test Example

```typescript
import { TestHelper } from '@/test/utils/test-helpers';
import { PortfolioController } from '@/modules/portfolio/controllers/portfolio.controller';

describe('PortfolioController', () => {
  let controller: PortfolioController;
  let mocks: any;

  beforeAll(async () => {
    const { controller: c, mocks: m } = await TestHelper.createControllerTest(
      PortfolioController,
      [PortfolioService]
    );
    controller = c;
    mocks = m;
  });

  afterAll(async () => {
    await TestHelper.cleanupTest();
  });

  beforeEach(() => {
    TestModuleFactory.resetAllMocks(mocks);
  });

  describe('GET /portfolios/:id', () => {
    it('should return portfolio by ID', async () => {
      // Arrange
      const testData = TestHelper.createTestData();
      const portfolio = testData.portfolio;
      
      mocks.portfolioService.findOne.mockResolvedValue(portfolio);

      // Act
      const result = await controller.findOne(portfolio.id);

      // Assert
      expect(result).toBe(portfolio);
      expect(mocks.portfolioService.findOne).toHaveBeenCalledWith(portfolio.id);
    });

    it('should throw error for invalid ID format', async () => {
      // Act & Assert
      await expect(controller.findOne('invalid-id')).rejects.toThrow('Invalid portfolio ID format');
    });
  });

  describe('POST /portfolios', () => {
    it('should create portfolio', async () => {
      // Arrange
      const testData = TestHelper.createTestData();
      const createDto = testData.createPortfolioDto;
      const portfolio = testData.portfolio;
      
      mocks.portfolioService.create.mockResolvedValue(portfolio);

      // Act
      const result = await controller.create(createDto);

      // Assert
      expect(result).toBe(portfolio);
      expect(mocks.portfolioService.create).toHaveBeenCalledWith(createDto);
    });
  });
});
```

### Integration Test Example

```typescript
import { TestHelper } from '@/test/utils/test-helpers';
import { TestDatabaseManager } from '@/test/utils/database-test.utils';

describe('Portfolio Integration Tests', () => {
  beforeAll(async () => {
    await TestHelper.setupTest({ useDatabase: true, seedData: true });
  });

  afterAll(async () => {
    await TestHelper.cleanupTest({ useDatabase: true, closeDatabase: true });
  });

  beforeEach(async () => {
    await TestDatabaseManager.cleanup();
    await TestDatabaseManager.seedTestData();
  });

  describe('Portfolio CRUD Operations', () => {
    it('should create, read, update, delete portfolio', async () => {
      // This test uses real database
      const testData = TestHelper.createTestData();
      
      // Test with real database
      await TestHelper.patterns.testCrudOperations(
        portfolioService,
        testData.createPortfolioDto,
        testData.updatePortfolioDto,
        (portfolio) => {
          expect(testUtils.validation.isValidUUID(portfolio.id)).toBe(true);
          expect(testUtils.validation.validatePortfolioStructure(portfolio)).toBe(true);
        }
      );
    });
  });
});
```

## 🚨 Common Mistakes

### 1. Không sử dụng TestHelper

```typescript
// ❌ SAI - Tự setup thủ công
beforeAll(async () => {
  const module = await Test.createTestingModule({
    providers: [PortfolioService],
    // ... manual setup
  }).compile();
});

// ✅ ĐÚNG - Sử dụng TestHelper
beforeAll(async () => {
  const { module, service, mocks } = await TestHelper.createServiceTest(
    PortfolioService,
    [PortfolioRepository]
  );
});
```

### 2. Không sử dụng fixtures

```typescript
// ❌ SAI - Tự tạo test data
const portfolio = {
  id: 'test-id',
  name: 'Test Portfolio',
  accountId: 'test-account-id'
};

// ✅ ĐÚNG - Sử dụng fixtures
const testData = TestHelper.createTestData();
const portfolio = testData.portfolio;
```

### 3. Không sử dụng test patterns

```typescript
// ❌ SAI - Tự viết test logic
it('should create, read, update, delete', async () => {
  // Manual test logic for CRUD operations
});

// ✅ ĐÚNG - Sử dụng test patterns
it('should perform CRUD operations', async () => {
  await TestHelper.patterns.testCrudOperations(service, createDto, updateDto, validator);
});
```

### 4. Không cleanup mocks

```typescript
// ❌ SAI - Không cleanup mocks
beforeEach(() => {
  // Mocks accumulate state between tests
});

// ✅ ĐÚNG - Cleanup mocks
beforeEach(() => {
  TestModuleFactory.resetAllMocks(mocks);
});
```

## 📝 Testing Guidelines

### 1. Test Structure

```typescript
describe('ServiceName', () => {
  // Setup
  beforeAll(async () => {
    const { service, mocks } = await TestHelper.createServiceTest(ServiceClass);
  });

  afterAll(async () => {
    await TestHelper.cleanupTest();
  });

  beforeEach(() => {
    TestModuleFactory.resetAllMocks(mocks);
  });

  // Tests
  describe('methodName', () => {
    it('should do something', async () => {
      // Arrange
      const testData = TestHelper.createTestData();
      
      // Act
      const result = await service.method(testData.input);
      
      // Assert
      expect(result).toBeDefined();
    });
  });
});
```

### 2. Test Naming

```typescript
// ✅ ĐÚNG - Descriptive test names
it('should create portfolio with valid data')
it('should throw error for invalid account ID')
it('should return empty array when no portfolios found')

// ❌ SAI - Vague test names
it('should work')
it('should handle error')
it('should return data')
```

### 3. Test Data

```typescript
// ✅ ĐÚNG - Use fixtures
const testData = TestHelper.createTestData();
const portfolio = testData.portfolio;

// ❌ SAI - Hardcoded data
const portfolio = {
  id: 'hardcoded-id',
  name: 'Hardcoded Name'
};
```

---

**Lưu ý**: Tất cả testing trong hệ thống phải sử dụng các utilities từ `TestHelper` và `testUtils`. Không được tự viết test logic thủ công.
