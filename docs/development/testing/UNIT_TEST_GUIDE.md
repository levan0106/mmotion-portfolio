# 🧪 Hướng Dẫn Unit Test - Portfolio Management System

## 📋 **Mục Lục**

1. [Giới Thiệu](#giới-thiệu)
2. [Cài Đặt và Cấu Hình](#cài-đặt-và-cấu-hình)
3. [Cấu Trúc Test](#cấu-trúc-test)
4. [Viết Test Cases](#viết-test-cases)
5. [Chạy Tests](#chạy-tests)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)
8. [Ví Dụ Thực Tế](#ví-dụ-thực-tế)

---

## 🎯 **Giới Thiệu**

### **Unit Test là gì?**

Unit Test là việc kiểm tra từng đơn vị nhỏ nhất của code (function, method, class) một cách độc lập để đảm bảo chúng hoạt động đúng như mong đợi.

### **Tại sao cần Unit Test?**

- ✅ **Phát hiện lỗi sớm**: Tìm ra bugs trước khi deploy
- ✅ **Tăng chất lượng code**: Code được test kỹ lưỡng hơn
- ✅ **Refactoring an toàn**: Thay đổi code mà không lo bị vỡ
- ✅ **Documentation**: Tests như tài liệu sống của code
- ✅ **Tăng confidence**: Tự tin khi deploy

### **Testing Pyramid**

```
        🔺 E2E Tests (Few)
       🔺🔺 Integration Tests (Some)  
    🔺🔺🔺🔺 Unit Tests (Many)
```

**Unit Tests** là nền tảng - nhanh, rẻ, dễ viết và maintain.

---

## ⚙️ **Cài Đặt và Cấu Hình**

### **1. Dependencies Đã Cài Đặt**

```json
{
  "devDependencies": {
    "@nestjs/testing": "^10.0.0",
    "@types/jest": "^29.5.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "supertest": "^6.3.0",
    "@types/supertest": "^2.0.0"
  }
}
```

### **2. Jest Configuration**

File `jest.config.js` đã được cấu hình:

```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/../test/setup.ts'],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
```

### **3. Test Scripts**

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand"
  }
}
```

---

## 📁 **Cấu Trúc Test**

### **1. File Naming Convention**

```
src/
├── modules/portfolio/
│   ├── services/
│   │   ├── portfolio.service.ts           # Source code
│   │   └── portfolio.service.spec.ts     # Test file
│   ├── controllers/
│   │   ├── portfolio.controller.ts       # Source code
│   │   └── portfolio.controller.spec.ts  # Test file
│   └── dto/
│       ├── create-portfolio.dto.ts       # Source code
│       └── create-portfolio.dto.spec.ts  # Test file
```

### **2. Test Directory Structure**

```
test/
├── setup.ts                    # Global test setup
├── fixtures/                   # Test data
│   └── portfolio.fixtures.ts
└── utils/                      # Test utilities
    ├── test-helpers.ts
    ├── test-module.factory.ts
    └── database-test.utils.ts
```

### **3. Test File Structure**

```typescript
// portfolio.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioService } from './portfolio.service';

describe('PortfolioService', () => {
  let service: PortfolioService;
  let module: TestingModule;

  beforeEach(async () => {
    // Setup test module
  });

  afterEach(async () => {
    // Cleanup
  });

  describe('createPortfolio', () => {
    it('should create portfolio successfully', () => {
      // Test implementation
    });

    it('should throw error with invalid data', () => {
      // Test implementation
    });
  });
});
```

---

## ✍️ **Viết Test Cases**

### **1. Cấu Trúc Test Case**

```typescript
describe('MethodName', () => {
  it('should do something when condition is met', () => {
    // Arrange - Chuẩn bị dữ liệu
    const input = 'test data';
    const expected = 'expected result';

    // Act - Thực hiện hành động
    const result = service.methodName(input);

    // Assert - Kiểm tra kết quả
    expect(result).toBe(expected);
  });
});
```

### **2. Test Data Setup**

```typescript
import { testUtils } from '../../test/utils/test-helpers';

describe('PortfolioService', () => {
  let service: PortfolioService;
  let mockRepository: any;

  beforeEach(async () => {
    // Tạo mock repository
    mockRepository = global.createMockRepository();
    
    // Setup test module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        {
          provide: getRepositoryToken(Portfolio),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
  });

  describe('createPortfolio', () => {
    it('should create portfolio with valid data', async () => {
      // Arrange
      const createPortfolioDto = testUtils.fixtures.createPortfolioDto();
      const expectedPortfolio = testUtils.fixtures.portfolio();
      
      mockRepository.save.mockResolvedValue(expectedPortfolio);

      // Act
      const result = await service.createPortfolio(createPortfolioDto);

      // Assert
      expect(result).toEqual(expectedPortfolio);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: createPortfolioDto.name,
          baseCurrency: createPortfolioDto.baseCurrency,
        })
      );
    });
  });
});
```

### **3. Testing Different Scenarios**

#### **Happy Path Testing**

```typescript
it('should return portfolio when found', async () => {
  // Arrange
  const portfolioId = 'valid-id';
  const expectedPortfolio = testUtils.fixtures.portfolio();
  mockRepository.findOne.mockResolvedValue(expectedPortfolio);

  // Act
  const result = await service.findById(portfolioId);

  // Assert
  expect(result).toEqual(expectedPortfolio);
  expect(mockRepository.findOne).toHaveBeenCalledWith({
    where: { portfolio_id: portfolioId },
  });
});
```

#### **Error Handling Testing**

```typescript
it('should throw NotFoundException when portfolio not found', async () => {
  // Arrange
  const portfolioId = 'non-existent-id';
  mockRepository.findOne.mockResolvedValue(null);

  // Act & Assert
  await expect(service.findById(portfolioId))
    .rejects
    .toThrow(NotFoundException);
});
```

#### **Validation Testing**

```typescript
it('should throw BadRequestException with invalid data', async () => {
  // Arrange
  const invalidDto = {
    name: '', // Invalid: empty name
    baseCurrency: 'INVALID', // Invalid currency
  };

  // Act & Assert
  await expect(service.createPortfolio(invalidDto))
    .rejects
    .toThrow(BadRequestException);
});
```

### **4. Mocking Dependencies**

```typescript
describe('PortfolioService with dependencies', () => {
  let service: PortfolioService;
  let mockRepository: any;
  let mockCacheManager: any;
  let mockLogger: any;

  beforeEach(async () => {
    // Create mocks
    mockRepository = global.createMockRepository();
    mockCacheManager = global.createMockCacheManager();
    mockLogger = global.createMockLogger();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        {
          provide: getRepositoryToken(Portfolio),
          useValue: mockRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
  });

  it('should cache portfolio data', async () => {
    // Arrange
    const portfolioId = 'test-id';
    const portfolio = testUtils.fixtures.portfolio();
    
    mockRepository.findOne.mockResolvedValue(portfolio);
    mockCacheManager.get.mockResolvedValue(null);

    // Act
    await service.findById(portfolioId);

    // Assert
    expect(mockCacheManager.set).toHaveBeenCalledWith(
      `portfolio:${portfolioId}`,
      portfolio,
      300
    );
  });
});
```

---

## 🚀 **Chạy Tests**

### **1. Lệnh Cơ Bản**

```bash
# Chạy tất cả tests
npm test

# Watch mode (tự động chạy lại khi có thay đổi)
npm run test:watch

# Coverage report
npm run test:cov

# Debug mode
npm run test:debug
```

### **2. Chạy Tests Cụ Thể**

```bash
# Chạy test file cụ thể
npm test portfolio.service.spec.ts

# Chạy tests theo pattern
npm test -- --testPathPattern=service
npm test -- --testPathPattern=controller

# Chạy test với tên cụ thể
npm test -- --testNamePattern="createPortfolio"

# Chạy tests và dừng sau lần fail đầu tiên
npm test -- --bail
```

### **3. Coverage Reports**

```bash
# Tạo coverage report
npm run test:cov

# Xem coverage report
open coverage/lcov-report/index.html
```

**Coverage Thresholds:**
- Lines: 90%
- Branches: 85%
- Functions: 90%
- Statements: 90%

---

## 🎯 **Best Practices**

### **1. Test Naming**

```typescript
// ✅ Good - Mô tả rõ ràng
describe('PortfolioService', () => {
  describe('createPortfolio', () => {
    it('should create portfolio with valid data', () => {});
    it('should throw BadRequestException with empty name', () => {});
    it('should throw BadRequestException with invalid currency', () => {});
  });
});

// ❌ Bad - Không rõ ràng
describe('PortfolioService', () => {
  it('should work', () => {});
  it('should handle error', () => {});
});
```

### **2. Test Structure (AAA Pattern)**

```typescript
it('should calculate total value correctly', () => {
  // Arrange - Chuẩn bị
  const portfolio = testUtils.fixtures.portfolio();
  const expectedTotal = 1500000000;

  // Act - Thực hiện
  const result = service.calculateTotalValue(portfolio);

  // Assert - Kiểm tra
  expect(result).toBe(expectedTotal);
});
```

### **3. One Assert Per Test**

```typescript
// ✅ Good - Một assertion per test
it('should return portfolio with correct name', () => {
  const result = service.findById('id');
  expect(result.name).toBe('Expected Name');
});

it('should return portfolio with correct currency', () => {
  const result = service.findById('id');
  expect(result.base_currency).toBe('VND');
});

// ❌ Bad - Nhiều assertions
it('should return correct portfolio', () => {
  const result = service.findById('id');
  expect(result.name).toBe('Expected Name');
  expect(result.base_currency).toBe('VND');
  expect(result.total_value).toBe(1500000000);
});
```

### **4. Mock Management**

```typescript
describe('PortfolioService', () => {
  let service: PortfolioService;
  let mocks: any;

  beforeEach(async () => {
    // Setup mocks
    mocks = {
      repository: global.createMockRepository(),
      cache: global.createMockCacheManager(),
    };

    const module = await Test.createTestingModule({
      providers: [
        PortfolioService,
        { provide: getRepositoryToken(Portfolio), useValue: mocks.repository },
        { provide: CACHE_MANAGER, useValue: mocks.cache },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
  });

  afterEach(() => {
    // Clear all mocks after each test
    jest.clearAllMocks();
  });
});
```

### **5. Test Data Management**

```typescript
// ✅ Good - Sử dụng fixtures
const portfolio = testUtils.fixtures.portfolio({
  name: 'Custom Portfolio',
  total_value: 2000000000,
});

// ❌ Bad - Hard-coded data
const portfolio = {
  portfolio_id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Test Portfolio',
  base_currency: 'VND',
  total_value: 1500000000,
  // ... nhiều properties khác
};
```

---

## 🔧 **Troubleshooting**

### **1. Common Issues**

#### **"No tests found"**
```bash
# Kiểm tra file có đúng pattern không
ls src/**/*.spec.ts

# Chạy với flag này nếu chưa có tests
npm test -- --passWithNoTests
```

#### **Coverage thresholds not met**
```bash
# Tạm thời bỏ qua coverage
npm test -- --coverageThreshold='{}'

# Hoặc giảm thresholds trong jest.config.js
```

#### **Test timeout**
```bash
# Tăng timeout
npm test -- --testTimeout=60000

# Hoặc trong test file
jest.setTimeout(60000);
```

#### **Database connection issues**
```bash
# Kiểm tra database
docker-compose ps

# Restart database
docker-compose restart postgres
```

### **2. Debug Tests**

```typescript
// Debug với console.log
it('should debug test', () => {
  const result = service.method();
  console.log('Result:', result);
  expect(result).toBeDefined();
});

// Debug với debugger
it('should debug with breakpoint', () => {
  const input = 'test';
  debugger; // Set breakpoint here
  const result = service.method(input);
  expect(result).toBeDefined();
});
```

### **3. Performance Issues**

```bash
# Chạy tests song song
npm test -- --maxWorkers=50%

# Chạy tests tuần tự (nếu có vấn đề)
npm test -- --runInBand

# Chỉ chạy tests đã thay đổi
npm test -- --onlyChanged
```

---

## 📚 **Ví Dụ Thực Tế**

### **1. Service Test Example**

```typescript
// portfolio.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { Portfolio } from '../entities/portfolio.entity';
import { CreatePortfolioDto } from '../dto/create-portfolio.dto';
import { testUtils } from '../../../test/utils/test-helpers';

describe('PortfolioService', () => {
  let service: PortfolioService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = global.createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        {
          provide: getRepositoryToken(Portfolio),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPortfolio', () => {
    it('should create portfolio successfully', async () => {
      // Arrange
      const createDto: CreatePortfolioDto = {
        name: 'Test Portfolio',
        base_currency: 'VND',
        account_id: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Test portfolio description',
      };

      const expectedPortfolio = testUtils.fixtures.portfolio({
        name: createDto.name,
        base_currency: createDto.base_currency,
        account_id: createDto.account_id,
      });

      mockRepository.save.mockResolvedValue(expectedPortfolio);

      // Act
      const result = await service.createPortfolio(createDto);

      // Assert
      expect(result).toEqual(expectedPortfolio);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: createDto.name,
          base_currency: createDto.base_currency,
          account_id: createDto.account_id,
        })
      );
    });

    it('should throw BadRequestException with empty name', async () => {
      // Arrange
      const createDto: CreatePortfolioDto = {
        name: '',
        base_currency: 'VND',
        account_id: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Test description',
      };

      // Act & Assert
      await expect(service.createPortfolio(createDto))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should throw BadRequestException with invalid currency', async () => {
      // Arrange
      const createDto: CreatePortfolioDto = {
        name: 'Test Portfolio',
        base_currency: 'INVALID',
        account_id: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Test description',
      };

      // Act & Assert
      await expect(service.createPortfolio(createDto))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  describe('findById', () => {
    it('should return portfolio when found', async () => {
      // Arrange
      const portfolioId = '550e8400-e29b-41d4-a716-446655440000';
      const expectedPortfolio = testUtils.fixtures.portfolio({
        portfolio_id: portfolioId,
      });

      mockRepository.findOne.mockResolvedValue(expectedPortfolio);

      // Act
      const result = await service.findById(portfolioId);

      // Assert
      expect(result).toEqual(expectedPortfolio);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { portfolio_id: portfolioId },
        relations: ['account', 'portfolioAssets', 'portfolioAssets.asset'],
      });
    });

    it('should throw NotFoundException when portfolio not found', async () => {
      // Arrange
      const portfolioId = 'non-existent-id';
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById(portfolioId))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('updatePortfolio', () => {
    it('should update portfolio successfully', async () => {
      // Arrange
      const portfolioId = '550e8400-e29b-41d4-a716-446655440000';
      const updateDto = {
        name: 'Updated Portfolio',
        description: 'Updated description',
      };

      const existingPortfolio = testUtils.fixtures.portfolio({
        portfolio_id: portfolioId,
        name: 'Original Portfolio',
      });

      const updatedPortfolio = {
        ...existingPortfolio,
        ...updateDto,
      };

      mockRepository.findOne.mockResolvedValue(existingPortfolio);
      mockRepository.save.mockResolvedValue(updatedPortfolio);

      // Act
      const result = await service.updatePortfolio(portfolioId, updateDto);

      // Assert
      expect(result).toEqual(updatedPortfolio);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          portfolio_id: portfolioId,
          name: updateDto.name,
          description: updateDto.description,
        })
      );
    });

    it('should throw NotFoundException when updating non-existent portfolio', async () => {
      // Arrange
      const portfolioId = 'non-existent-id';
      const updateDto = { name: 'Updated Name' };

      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updatePortfolio(portfolioId, updateDto))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('deletePortfolio', () => {
    it('should delete portfolio successfully', async () => {
      // Arrange
      const portfolioId = '550e8400-e29b-41d4-a716-446655440000';
      const existingPortfolio = testUtils.fixtures.portfolio({
        portfolio_id: portfolioId,
      });

      mockRepository.findOne.mockResolvedValue(existingPortfolio);
      mockRepository.remove.mockResolvedValue(existingPortfolio);

      // Act
      const result = await service.deletePortfolio(portfolioId);

      // Assert
      expect(result).toEqual(existingPortfolio);
      expect(mockRepository.remove).toHaveBeenCalledWith(existingPortfolio);
    });

    it('should throw NotFoundException when deleting non-existent portfolio', async () => {
      // Arrange
      const portfolioId = 'non-existent-id';
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deletePortfolio(portfolioId))
        .rejects
        .toThrow(NotFoundException);
    });
  });
});
```

### **2. Controller Test Example**

```typescript
// portfolio.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from '../services/portfolio.service';
import { testUtils } from '../../../test/utils/test-helpers';

describe('PortfolioController', () => {
  let controller: PortfolioController;
  let mockService: any;

  beforeEach(async () => {
    mockService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      createPortfolio: jest.fn(),
      updatePortfolio: jest.fn(),
      deletePortfolio: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PortfolioController],
      providers: [
        {
          provide: PortfolioService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<PortfolioController>(PortfolioController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllPortfolios', () => {
    it('should return array of portfolios', async () => {
      // Arrange
      const accountId = '550e8400-e29b-41d4-a716-446655440000';
      const expectedPortfolios = [
        testUtils.fixtures.portfolio(),
        testUtils.fixtures.portfolio(),
      ];

      mockService.findAll.mockResolvedValue(expectedPortfolios);

      // Act
      const result = await controller.getAllPortfolios(accountId);

      // Assert
      expect(result).toEqual(expectedPortfolios);
      expect(mockService.findAll).toHaveBeenCalledWith(accountId);
    });
  });

  describe('getPortfolioById', () => {
    it('should return portfolio by id', async () => {
      // Arrange
      const portfolioId = '550e8400-e29b-41d4-a716-446655440000';
      const expectedPortfolio = testUtils.fixtures.portfolio({
        portfolio_id: portfolioId,
      });

      mockService.findById.mockResolvedValue(expectedPortfolio);

      // Act
      const result = await controller.getPortfolioById(portfolioId);

      // Assert
      expect(result).toEqual(expectedPortfolio);
      expect(mockService.findById).toHaveBeenCalledWith(portfolioId);
    });
  });

  describe('createPortfolio', () => {
    it('should create portfolio', async () => {
      // Arrange
      const createDto = testUtils.fixtures.createPortfolioDto();
      const expectedPortfolio = testUtils.fixtures.portfolio();

      mockService.createPortfolio.mockResolvedValue(expectedPortfolio);

      // Act
      const result = await controller.createPortfolio(createDto);

      // Assert
      expect(result).toEqual(expectedPortfolio);
      expect(mockService.createPortfolio).toHaveBeenCalledWith(createDto);
    });
  });
});
```

### **3. DTO Validation Test Example**

```typescript
// create-portfolio.dto.spec.ts
import { validate } from 'class-validator';
import { CreatePortfolioDto } from './create-portfolio.dto';

describe('CreatePortfolioDto', () => {
  let dto: CreatePortfolioDto;

  beforeEach(() => {
    dto = new CreatePortfolioDto();
  });

  describe('name validation', () => {
    it('should pass with valid name', async () => {
      // Arrange
      dto.name = 'Valid Portfolio Name';
      dto.base_currency = 'VND';
      dto.account_id = '550e8400-e29b-41d4-a716-446655440000';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should fail with empty name', async () => {
      // Arrange
      dto.name = '';
      dto.base_currency = 'VND';
      dto.account_id = '550e8400-e29b-41d4-a716-446655440000';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints?.isNotEmpty).toBeDefined();
    });

    it('should fail with name too long', async () => {
      // Arrange
      dto.name = 'a'.repeat(256); // Too long
      dto.base_currency = 'VND';
      dto.account_id = '550e8400-e29b-41d4-a716-446655440000';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints?.maxLength).toBeDefined();
    });
  });

  describe('base_currency validation', () => {
    it('should pass with valid currency', async () => {
      // Arrange
      dto.name = 'Test Portfolio';
      dto.base_currency = 'VND';
      dto.account_id = '550e8400-e29b-41d4-a716-446655440000';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should fail with invalid currency', async () => {
      // Arrange
      dto.name = 'Test Portfolio';
      dto.base_currency = 'INVALID';
      dto.account_id = '550e8400-e29b-41d4-a716-446655440000';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('base_currency');
      expect(errors[0].constraints?.isIn).toBeDefined();
    });
  });

  describe('account_id validation', () => {
    it('should pass with valid UUID', async () => {
      // Arrange
      dto.name = 'Test Portfolio';
      dto.base_currency = 'VND';
      dto.account_id = '550e8400-e29b-41d4-a716-446655440000';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should fail with invalid UUID', async () => {
      // Arrange
      dto.name = 'Test Portfolio';
      dto.base_currency = 'VND';
      dto.account_id = 'invalid-uuid';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('account_id');
      expect(errors[0].constraints?.isUuid).toBeDefined();
    });
  });
});
```

---

## 🎉 **Kết Luận**

### **Tóm Tắt**

1. **Setup hoàn tất**: Jest, TypeScript, NestJS testing đã được cấu hình
2. **Utilities sẵn sàng**: Test helpers, fixtures, mocks đã có
3. **Best practices**: AAA pattern, proper mocking, clear naming
4. **Coverage goals**: 90% lines, 85% branches, 90% functions

### **Next Steps**

1. **Bắt đầu với Service Tests** (Task 4 - High Priority)
2. **Tiếp tục với Controller Tests** (Task 7 - High Priority)
3. **Hoàn thiện Repository Tests** (Task 3)

### **Resources**

- **Jest Documentation**: https://jestjs.io/docs/getting-started
- **NestJS Testing**: https://docs.nestjs.com/fundamentals/testing
- **TypeScript Testing**: https://jestjs.io/docs/getting-started#using-typescript

---

**🚀 Sẵn sàng viết Unit Tests! Hãy bắt đầu với Task 4 - PortfolioService unit tests!** 🧪✅
