# 🧪 Hướng Dẫn Chạy Unit Test - Portfolio Management System

## 📋 **Tổng Quan**

Hệ thống Portfolio Management System đã được setup đầy đủ với Jest testing framework và các utilities hỗ trợ. Tài liệu này hướng dẫn chi tiết cách chạy và sử dụng unit tests.

## 🚀 **Các Lệnh Chạy Test**

### **1. Lệnh Cơ Bản**

```bash
# Di chuyển vào thư mục project
cd my_project

# Chạy tất cả unit tests
npm test

# Chạy tests với watch mode (tự động chạy lại khi có thay đổi)
npm run test:watch

# Chạy tests với coverage report
npm run test:cov

# Chạy tests với debug mode
npm run test:debug
```

### **2. Chạy Tests Cụ Thể**

```bash
# Chạy test cho file cụ thể
npm test portfolio.service.spec.ts

# Chạy tests theo pattern
npm test -- --testPathPattern=portfolio
npm test -- --testPathPattern=service
npm test -- --testPathPattern=controller

# Chạy test cho một describe block cụ thể
npm test -- --testNamePattern="PortfolioService"

# Chạy tests và dừng sau lần fail đầu tiên
npm test -- --bail

# Chạy tests với verbose output
npm test -- --verbose
```

### **3. Lệnh Với Options**

```bash
# Chạy tests mà không cần có test files (useful khi đang develop)
npm test -- --passWithNoTests

# Chạy tests với timeout tùy chỉnh
npm test -- --testTimeout=30000

# Chạy tests với số workers tùy chỉnh
npm test -- --maxWorkers=2

# Chạy tests và update snapshots
npm test -- --updateSnapshot
```

## 📊 **Coverage Reports**

### **Chạy Coverage**

```bash
# Tạo coverage report
npm run test:cov

# Xem coverage report trong browser (sau khi chạy lệnh trên)
open coverage/lcov-report/index.html
# Hoặc trên Windows:
start coverage/lcov-report/index.html
```

### **Coverage Thresholds**

Hệ thống đã được cấu hình với coverage thresholds:

```javascript
coverageThreshold: {
  global: {
    branches: 85,    // 85% branch coverage
    functions: 90,   // 90% function coverage
    lines: 90,       // 90% line coverage
    statements: 90,  // 90% statement coverage
  },
}
```

### **Ví Dụ Coverage Report**

```bash
------------------------------------|---------|----------|---------|---------|-------------------
File                                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
------------------------------------|---------|----------|---------|---------|-------------------
All files                           |   90.5  |   85.2   |   92.1  |   90.8  |                   
 src/modules/portfolio/services     |   95.2  |   88.9   |   96.7  |   95.1  |                   
  portfolio.service.ts              |   96.8  |   91.2   |   98.5  |   96.9  | 45,67,89         
  portfolio-analytics.service.ts    |   93.4  |   86.5   |   94.7  |   93.2  | 123,145,167      
 src/modules/portfolio/controllers  |   87.3  |   82.1   |   89.5  |   87.8  |                   
  portfolio.controller.ts           |   88.9  |   84.2   |   91.3  |   89.1  | 89,123,156       
------------------------------------|---------|----------|---------|---------|-------------------
```

## 🗄️ **Database Testing**

### **Unit Tests (Mocked Database)**

```bash
# Chạy unit tests với mock database (default)
npm test

# Chỉ chạy service tests (business logic)
npm test -- --testPathPattern=service
```

### **Integration Tests (Real Database)**

```bash
# Setup test database trước khi chạy integration tests
export TEST_WITH_DATABASE=true

# Hoặc trên Windows:
set TEST_WITH_DATABASE=true

# Chạy tests với database thật
npm test
```

### **Database Configuration**

Test database được cấu hình tách biệt:

```bash
DB_HOST=localhost
DB_PORT=5433              # Port khác với development
DB_NAME=portfolio_test_db # Database riêng cho testing
REDIS_PORT=6380          # Redis port riêng cho testing
```

## 📁 **Cấu Trúc Test Files**

```
my_project/
├── src/
│   ├── modules/portfolio/
│   │   ├── services/
│   │   │   ├── portfolio.service.ts
│   │   │   └── portfolio.service.spec.ts     # Unit tests
│   │   ├── controllers/
│   │   │   ├── portfolio.controller.ts
│   │   │   └── portfolio.controller.spec.ts  # Controller tests
│   │   └── dto/
│   │       ├── create-portfolio.dto.ts
│   │       └── create-portfolio.dto.spec.ts  # DTO validation tests
│   └── demo-test.spec.ts                     # Demo test file
├── test/
│   ├── utils/                               # Test utilities
│   ├── fixtures/                            # Test data
│   └── setup.ts                             # Global setup
└── jest.config.js                           # Jest configuration
```

## 🧪 **Ví Dụ Test Results**

### **Successful Test Run**

```bash
PS F:\code\Prompt\start new project\my_project> npm test

> portfolio-management-system@1.0.0 test
> jest

 PASS  src/demo-test.spec.ts (18.967 s)
  🧪 Demo Unit Test
    Test Environment
      ✓ should have test environment configured (5 ms)
      ✓ should have test utilities available (2 ms)
    Test Data Fixtures
      ✓ should create valid portfolio mock data (10 ms)
      ✓ should create valid account mock data (2 ms)
    Validation Utilities
      ✓ should validate UUIDs correctly (1 ms)
      ✓ should validate currencies correctly (1 ms)
    Mock Factories
      ✓ should create mock repositories (2 ms)
      ✓ should create mock cache manager (1 ms)
    Custom Jest Matchers
      ✓ should use custom UUID matcher (1 ms)
      ✓ should use custom date matcher (1 ms)
      ✓ should use custom positive number matcher (1 ms)

Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
Snapshots:   0 total
Time:        21.957 s
Ran all test suites.
```

## 🔧 **Test Utilities Có Sẵn**

### **1. Test Data Fixtures**

```typescript
import { testUtils } from '../test/utils/test-helpers';

// Tạo mock data
const portfolio = testUtils.fixtures.portfolio();
const account = testUtils.fixtures.account();
const asset = testUtils.fixtures.asset();
```

### **2. Validation Utilities**

```typescript
// Validate data structures
testUtils.validation.validatePortfolioStructure(portfolio);
testUtils.validation.validateAccountStructure(account);

// Validate formats
testUtils.validation.isValidUUID(uuid);
testUtils.validation.isValidEmail(email);
testUtils.validation.isValidCurrency('VND');
```

### **3. Assertion Utilities**

```typescript
// Advanced assertions
await testUtils.assertions.expectToReject(promise, 'error message');
testUtils.assertions.expectToHaveProperties(obj, ['prop1', 'prop2']);
testUtils.assertions.expectToBeInRange(value, min, max);
testUtils.assertions.expectToBeRecentDate(date);
```

### **4. Mock Factories**

```typescript
// Create mocks
const mockRepo = global.createMockRepository();
const mockCache = global.createMockCacheManager();
const mockLogger = global.createMockLogger();
```

### **5. Custom Jest Matchers**

```typescript
// Custom matchers
expect(uuid).toBeUUID();
expect(date).toBeValidDate();
expect(number).toBePositiveNumber();
```

## 🎯 **Best Practices**

### **1. Test Organization**

```typescript
describe('PortfolioService', () => {
  describe('createPortfolio', () => {
    it('should create portfolio with valid data', () => {
      // Test implementation
    });
    
    it('should throw error with invalid data', () => {
      // Test implementation
    });
  });
});
```

### **2. Setup và Cleanup**

```typescript
describe('DatabaseTests', () => {
  beforeAll(async () => {
    await TestHelper.setupTest({ useDatabase: true, seedData: true });
  });

  afterAll(async () => {
    await TestHelper.cleanupTest({ useDatabase: true, closeDatabase: true });
  });
});
```

### **3. Mock Management**

```typescript
describe('ServiceTests', () => {
  let service: PortfolioService;
  let mocks: any;

  beforeEach(async () => {
    const testModule = await TestHelper.createServiceTest(PortfolioService);
    service = testModule.service;
    mocks = testModule.mocks;
  });

  afterEach(() => {
    TestModuleFactory.clearAllMocks(mocks);
  });
});
```

## 🚨 **Troubleshooting**

### **Common Issues**

1. **"No tests found"**
   ```bash
   # Chạy với flag này nếu chưa có test files
   npm test -- --passWithNoTests
   ```

2. **Coverage thresholds not met**
   ```bash
   # Tạm thời bỏ qua coverage thresholds
   npm test -- --coverageThreshold='{}'
   ```

3. **Test timeout**
   ```bash
   # Tăng timeout
   npm test -- --testTimeout=60000
   ```

4. **Database connection issues**
   ```bash
   # Kiểm tra database có chạy không
   docker-compose ps
   
   # Restart database
   docker-compose restart postgres
   ```

## 📈 **Performance Tips**

### **1. Parallel Testing**

```bash
# Chạy tests song song (default)
npm test -- --maxWorkers=50%

# Chạy tests tuần tự (nếu có vấn đề với database)
npm test -- --runInBand
```

### **2. Test Filtering**

```bash
# Chỉ chạy tests đã thay đổi
npm test -- --onlyChanged

# Chỉ chạy tests liên quan đến files đã thay đổi
npm test -- --changedSince=main
```

## 🎉 **Next Steps**

Sau khi hiểu cách chạy tests, bạn có thể:

1. **Tạo Unit Tests cho Services** (Task 4 - High Priority)
2. **Tạo Unit Tests cho Controllers** (Task 7 - High Priority)  
3. **Tạo Unit Tests cho Repositories** (Task 3)

### **Ready to Start Testing!** 🧪✅

Hệ thống testing đã sẵn sàng để bạn bắt đầu viết và chạy unit tests cho Portfolio Management System!
