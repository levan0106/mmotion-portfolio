# 🚀 Quick Start Guide - Unit Testing

## ⚡ **Bắt Đầu Ngay Trong 5 Phút**

### **1. Chạy Test Hiện Tại**
```bash
cd my_project
npm test
```

### **2. Tạo Test File Đầu Tiên**

Tạo file `src/modules/portfolio/services/portfolio.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PortfolioService } from './portfolio.service';
import { Portfolio } from '../entities/portfolio.entity';
import { testUtils } from '../../../../test/utils/test-helpers';

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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create portfolio', async () => {
    // Arrange
    const createDto = testUtils.fixtures.createPortfolioDto();
    const expectedPortfolio = testUtils.fixtures.portfolio();
    mockRepository.save.mockResolvedValue(expectedPortfolio);

    // Act
    const result = await service.createPortfolio(createDto);

    // Assert
    expect(result).toEqual(expectedPortfolio);
  });
});
```

### **3. Chạy Test Mới**
```bash
npm test portfolio.service.spec.ts
```

### **4. Xem Coverage**
```bash
npm run test:cov
```

## 🎯 **Các Lệnh Cần Nhớ**

| Lệnh | Mô tả |
|------|-------|
| `npm test` | Chạy tất cả tests |
| `npm run test:watch` | Watch mode |
| `npm run test:cov` | Coverage report |
| `npm test -- --testPathPattern=service` | Chạy service tests |
| `npm test -- --bail` | Dừng sau lỗi đầu tiên |

## 📁 **Cấu Trúc Test File**

```
describe('ClassName', () => {
  describe('methodName', () => {
    it('should do something when condition', () => {
      // Arrange - Chuẩn bị
      const input = 'test';
      
      // Act - Thực hiện  
      const result = service.method(input);
      
      // Assert - Kiểm tra
      expect(result).toBe('expected');
    });
  });
});
```

## 🔧 **Test Utilities Có Sẵn**

```typescript
import { testUtils } from '../../../../test/utils/test-helpers';

// Mock data
const portfolio = testUtils.fixtures.portfolio();
const account = testUtils.fixtures.account();

// Validation
testUtils.validation.validatePortfolioStructure(portfolio);

// Custom matchers
expect(uuid).toBeUUID();
expect(date).toBeValidDate();
```

## 🚨 **Troubleshooting Nhanh**

| Lỗi | Giải pháp |
|-----|-----------|
| "No tests found" | `npm test -- --passWithNoTests` |
| Coverage thấp | Viết thêm test cases |
| Test timeout | `npm test -- --testTimeout=60000` |
| Mock không hoạt động | Kiểm tra `jest.clearAllMocks()` |

## 📚 **Tài Liệu Chi Tiết**

- **`UNIT_TEST_GUIDE.md`** - Hướng dẫn đầy đủ
- **`HOW_TO_RUN_TESTS.md`** - Cách chạy tests
- **`unit_testing_plan.md`** - Kế hoạch testing

---

**🎉 Bắt đầu viết tests ngay bây giờ!** 🧪
