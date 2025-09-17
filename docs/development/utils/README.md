# Utils Documentation

## 📁 Cấu Trúc Thư Mục

```
docs/utils/
├── README.md                    # Tài liệu tổng quan
├── FORMATTING_UTILS.md         # Hướng dẫn formatting
├── VALIDATION_UTILS.md         # Hướng dẫn validation
├── CALCULATION_UTILS.md        # Hướng dẫn calculation
├── TESTING_UTILS.md            # Hướng dẫn testing
├── ERROR_HANDLING_UTILS.md     # Hướng dẫn error handling
└── examples/                   # Ví dụ sử dụng
    ├── portfolio-formatting.ts # Ví dụ formatting
    └── trade-validation.ts     # Ví dụ validation
```

## 🎯 Mục Tiêu

Tài liệu này cung cấp hướng dẫn chi tiết về việc sử dụng các utility functions trong hệ thống Portfolio Management. Tất cả developers phải tuân thủ các quy tắc và patterns được định nghĩa trong tài liệu này.

## 📚 Danh Sách Tài Liệu

### 1. [Formatting Utils](./FORMATTING_UTILS.md)
- **Mục đích**: Format dữ liệu hiển thị nhất quán
- **Chức năng chính**:
  - Currency formatting (`formatCurrency`, `formatNumber`, `formatPercentage`)
  - Date formatting (`formatDate`, `formatDateTime`, `formatRelativeTime`)
  - Number formatting (`formatLargeNumber`, `formatCompactNumber`)
  - Text formatting (`truncateText`, `capitalize`, `formatName`)

### 2. [Validation Utils](./VALIDATION_UTILS.md)
- **Mục đích**: Validate dữ liệu đầu vào
- **Chức năng chính**:
  - UUID validation (`isValidUUID`)
  - Email validation (`isValidEmail`)
  - Currency validation (`isValidCurrency`)
  - Date validation (`isValidDate`)
  - Number validation (`isPositiveNumber`)

### 3. [Calculation Utils](./CALCULATION_UTILS.md)
- **Mục đích**: Thực hiện các phép tính phức tạp
- **Chức năng chính**:
  - Position Management (`PositionManager.calculatePositionMetrics`)
  - Risk Management (`RiskManager.calculateRiskMetrics`)
  - Trading Calculations (FIFO/LIFO engines)
  - Performance Metrics (Sharpe ratio, volatility, VaR)

### 4. [Testing Utils](./TESTING_UTILS.md)
- **Mục đích**: Hỗ trợ viết test hiệu quả
- **Chức năng chính**:
  - Test Setup (`TestHelper.setupTest`, `TestHelper.cleanupTest`)
  - Mock Creation (`TestModuleFactory.createTestModule`)
  - Database Testing (`TestDatabaseManager`)
  - Test Patterns (CRUD testing, validation testing)

### 5. [Error Handling Utils](./ERROR_HANDLING_UTILS.md)
- **Mục đích**: Xử lý lỗi nhất quán
- **Chức năng chính**:
  - Exception Filtering (`GlobalExceptionFilter`)
  - Logging (`LoggingService`, `WinstonLoggerService`)
  - Error Context (Request context, sanitization)

## 🔧 Quick Start

### Import Rules

```typescript
// ✅ ĐÚNG - Import từ utils chính
import { formatCurrency, formatDate } from '@/utils/format';
import { testUtils } from '@/test/utils/test-helpers';

// ❌ SAI - Import trực tiếp từ file con
import { formatCurrency } from '@/utils/format.ts';
```

### Basic Usage

```typescript
// Frontend Component
import { formatCurrency, formatDate } from '@/utils/format';

export const PortfolioCard = ({ portfolio }) => {
  return (
    <div>
      <h3>{portfolio.name}</h3>
      <p>Value: {formatCurrency(portfolio.value, 'VND')}</p>
      <p>Date: {formatDate(portfolio.createdAt, 'short')}</p>
    </div>
  );
};

// Backend Service
import { LoggingService } from '@/modules/logging/services/logging.service';

@Injectable()
export class PortfolioService {
  constructor(private readonly loggingService: LoggingService) {}

  async createPortfolio(data: CreatePortfolioDto) {
    try {
      // Business logic here
      await this.loggingService.info('Portfolio created', { portfolioId: data.id });
      return result;
    } catch (error) {
      await this.loggingService.error('Failed to create portfolio', error, { data });
      throw error;
    }
  }
}
```

## 📋 Implementation Checklist

### Khi Implement Feature Mới
- [ ] Sử dụng formatting utils cho hiển thị data
- [ ] Sử dụng validation utils cho input validation
- [ ] Sử dụng calculation utils cho business logic
- [ ] Sử dụng error handling utils cho exception handling
- [ ] Sử dụng logging utils cho monitoring

### Khi Viết Test
- [ ] Sử dụng `TestHelper.setupTest()` cho setup
- [ ] Sử dụng `testUtils.fixtures` cho mock data
- [ ] Sử dụng `testUtils.validation` cho validation testing
- [ ] Sử dụng `testUtils.assertions` cho advanced assertions

## 🎯 Best Practices

### 1. Naming Conventions
```typescript
// ✅ ĐÚNG - Sử dụng naming convention nhất quán
formatCurrency(amount, 'VND', { precision: 0 })
formatDate(date, 'short', 'vi-VN')

// ❌ SAI - Không tuân thủ convention
formatMoney(amount) // Nên dùng formatCurrency
```

### 2. Error Handling
```typescript
// ✅ ĐÚNG - Sử dụng error handling utils
try {
  const result = await service.operation();
} catch (error) {
  await loggingService.error('Operation failed', error, { context });
}

// ❌ SAI - Không sử dụng error handling
try {
  const result = await service.operation();
} catch (error) {
  console.log(error); // Không đủ thông tin
}
```

### 3. Validation
```typescript
// ✅ ĐÚNG - Sử dụng validation utils
if (!testUtils.validation.isValidUUID(id)) {
  throw new BadRequestException('Invalid UUID format');
}

// ❌ SAI - Validation thủ công
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
  throw new BadRequestException('Invalid UUID format');
}
```

## 📝 Examples

### Portfolio Formatting
Xem file [portfolio-formatting.ts](./examples/portfolio-formatting.ts) để biết cách sử dụng formatting utils trong portfolio components.

### Trade Validation
Xem file [trade-validation.ts](./examples/trade-validation.ts) để biết cách sử dụng validation utils trong trade components.

## 🔄 Cập Nhật Tài Liệu

Tài liệu này sẽ được cập nhật khi:
- Thêm utility functions mới
- Thay đổi API của existing functions
- Cập nhật best practices
- Thêm patterns mới

## 📞 Hỗ Trợ

Nếu có câu hỏi về việc sử dụng utils, vui lòng:
1. Kiểm tra tài liệu chi tiết trong từng phần
2. Xem examples trong thư mục `examples/`
3. Liên hệ team lead hoặc senior developer

---

**Lưu ý**: Tài liệu này là bắt buộc cho tất cả developers. Mọi code review sẽ kiểm tra việc tuân thủ các quy tắc trong tài liệu này.
