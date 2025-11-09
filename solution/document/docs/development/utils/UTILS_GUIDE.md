# Portfolio Management System - Utils Guide

## 📋 Tổng Quan

Tài liệu này cung cấp hướng dẫn chi tiết về việc sử dụng các utility functions trong hệ thống Portfolio Management. Tất cả developers phải tuân thủ các quy tắc và patterns được định nghĩa trong tài liệu này để đảm bảo tính nhất quán và chất lượng code.

## 🎯 Mục Tiêu

- **Consistency**: Đảm bảo code style nhất quán trong toàn bộ hệ thống
- **Maintainability**: Dễ bảo trì và cập nhật
- **Reusability**: Tái sử dụng code hiệu quả
- **Quality**: Giảm bugs và tăng chất lượng code
- **Onboarding**: Dễ dàng cho developer mới

## 📁 Cấu Trúc Tài Liệu

### 1. [Formatting Utils](./utils/FORMATTING_UTILS.md)
- Currency formatting (`formatCurrency`, `formatNumber`, `formatPercentage`)
- Date formatting (`formatDate`, `formatDateTime`, `formatRelativeTime`)
- Number formatting (`formatLargeNumber`, `formatCompactNumber`)
- Text formatting (`truncateText`, `capitalize`, `formatName`)

### 2. [Validation Utils](./utils/VALIDATION_UTILS.md)
- UUID validation (`isValidUUID`)
- Email validation (`isValidEmail`)
- Currency validation (`isValidCurrency`)
- Date validation (`isValidDate`)
- Number validation (`isPositiveNumber`)

### 3. [Calculation Utils](./utils/CALCULATION_UTILS.md)
- Position Management (`PositionManager.calculatePositionMetrics`)
- Risk Management (`RiskManager.calculateRiskMetrics`)
- Trading Calculations (FIFO/LIFO engines)
- Performance Metrics (Sharpe ratio, volatility, VaR)

### 4. [Testing Utils](./utils/TESTING_UTILS.md)
- Test Setup (`TestHelper.setupTest`, `TestHelper.cleanupTest`)
- Mock Creation (`TestModuleFactory.createTestModule`)
- Database Testing (`TestDatabaseManager`)
- Test Patterns (CRUD testing, validation testing)

### 5. [Error Handling Utils](./utils/ERROR_HANDLING_UTILS.md)
- Exception Filtering (`GlobalExceptionFilter`)
- Logging (`LoggingService`, `WinstonLoggerService`)
- Error Context (Request context, sanitization)

### 6. [Examples](./utils/examples/)
- [Portfolio Formatting Examples](./utils/examples/portfolio-formatting.ts)
- [Trade Validation Examples](./utils/examples/trade-validation.ts)

## 🚀 Quick Start

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

## 🔧 Code Templates

### React Component Template
```typescript
import { formatCurrency, formatDate } from '@/utils/format';
import { testUtils } from '@/test/utils/test-helpers';

export const MyComponent = () => {
  // Sử dụng formatting utils
  const formattedAmount = formatCurrency(amount, 'VND');
  const formattedDate = formatDate(date, 'short');
  
  return (
    <div>
      <span>{formattedAmount}</span>
      <span>{formattedDate}</span>
    </div>
  );
};
```

### NestJS Service Template
```typescript
import { LoggingService } from '@/modules/logging/services/logging.service';
import { formatCurrency } from '@/utils/format';

@Injectable()
export class MyService {
  constructor(private readonly loggingService: LoggingService) {}

  async processData(data: any) {
    try {
      // Sử dụng calculation utils
      const result = this.calculateMetrics(data);
      
      // Log business event
      await this.loggingService.info('Data processed', { result });
      
      return result;
    } catch (error) {
      // Sử dụng error handling utils
      await this.loggingService.error('Processing failed', error, { data });
      throw error;
    }
  }
}
```

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

## 🔄 Cập Nhật Tài Liệu

Tài liệu này sẽ được cập nhật khi:
- Thêm utility functions mới
- Thay đổi API của existing functions
- Cập nhật best practices
- Thêm patterns mới

## 📞 Hỗ Trợ

Nếu có câu hỏi về việc sử dụng utils, vui lòng:
1. Kiểm tra tài liệu chi tiết trong từng phần
2. Xem examples trong thư mục `docs/utils/examples/`
3. Liên hệ team lead hoặc senior developer

---

**Lưu ý**: Tài liệu này là bắt buộc cho tất cả developers. Mọi code review sẽ kiểm tra việc tuân thủ các quy tắc trong tài liệu này.
