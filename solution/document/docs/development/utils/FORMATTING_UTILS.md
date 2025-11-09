# Formatting Utils - Hướng Dẫn Sử Dụng

## 📋 Tổng Quan

Formatting Utils cung cấp các functions để format dữ liệu hiển thị một cách nhất quán trong toàn bộ hệ thống. Tất cả formatting phải sử dụng các functions từ `frontend/src/utils/format.ts`.

## 🎯 Mục Tiêu

- **Consistency**: Đảm bảo format dữ liệu nhất quán
- **Localization**: Hỗ trợ đa ngôn ngữ và locale
- **Accessibility**: Dễ đọc và hiểu cho người dùng
- **Performance**: Tối ưu hiệu suất formatting

## 📚 Danh Sách Functions

### 1. Currency Formatting

#### `formatCurrency(amount, currency?, options?, locale?)`

Formats a number as currency with proper locale formatting.

```typescript
import { formatCurrency } from '@/utils/format';

// Basic usage
formatCurrency(1234.56) // "1.234,56 ₫"
formatCurrency(1234.56, 'USD') // "$1,234.56"
formatCurrency(1234.56, 'EUR') // "€1,234.56"

// With options
formatCurrency(1234.56, 'VND', { compact: true }) // "1,2K ₫"
formatCurrency(1234.56, 'VND', { precision: 0 }) // "1.235 ₫"
formatCurrency(1234.56, 'USD', { showSymbol: false }) // "1,234.56"

// With locale
formatCurrency(1234.56, 'VND', {}, 'vi-VN') // "1.234,56 ₫"
formatCurrency(1234.56, 'USD', {}, 'en-US') // "$1,234.56"
```

**Parameters:**
- `amount`: `number | undefined | null` - Số tiền cần format
- `currency`: `string` (default: 'VND') - Mã tiền tệ phải được lấy từ baseCurrency của portfolio
- `options`: `CurrencyOptions` (optional) - Tùy chọn formatting
- `locale`: `string` (default: 'en-US') - Locale cho formatting

**CurrencyOptions:**
```typescript
interface CurrencyOptions {
  compact?: boolean;      // Sử dụng format compact (K, M, B)
  precision?: number;     // Số chữ số thập phân
  showSymbol?: boolean;   // Hiển thị ký hiệu tiền tệ
}
```

**Supported Currencies:**
- VND (₫) - Vietnamese Dong
- USD (US$) - US Dollar
- EUR (€) - Euro
- GBP (£) - British Pound
- JPY (¥) - Japanese Yen
- Và nhiều currencies khác...

#### `formatNumber(num, decimals?, locale?)`

Formats a number with specified decimal places.

```typescript
import { formatNumber } from '@/utils/format';

// Basic usage
formatNumber(1234.567, 2) // "1,234.57"
formatNumber(1234.567, 0) // "1,235"
formatNumber(1234.567, 4) // "1,234.5670"

// With locale
formatNumber(1234.567, 2, 'vi-VN') // "1.234,57"
formatNumber(1234.567, 2, 'en-US') // "1,234.57"
```

#### `formatPercentage(value, decimals?, locale?)`

Formats a number as percentage.

```typescript
import { formatPercentage } from '@/utils/format';

// Basic usage
formatPercentage(12.34) // "12.34%"
formatPercentage(12.34, 1) // "12.3%"
formatPercentage(0.1234, 2) // "0.12%"

// With locale
formatPercentage(12.34, 2, 'vi-VN') // "12,34%"
formatPercentage(12.34, 2, 'en-US') // "12.34%"
```

### 2. Date Formatting

#### `formatDate(date, format?, locale?)`

Formats dates using Intl.DateTimeFormat.

```typescript
import { formatDate } from '@/utils/format';

const date = new Date('2025-09-11T14:30:00Z');

// Different formats
formatDate(date, 'short') // "Sep 11, 2025"
formatDate(date, 'medium') // "Sep 11, 2025, 2:30 PM"
formatDate(date, 'long') // "September 11, 2025 at 2:30 PM"
formatDate(date, 'full') // "Thursday, September 11, 2025 at 2:30 PM"

// With locale
formatDate(date, 'short', 'vi-VN') // "11 thg 9, 2025"
formatDate(date, 'medium', 'vi-VN') // "11 thg 9, 2025, 14:30"
```

#### `formatDateTime(date)`

Formats date and time using date-fns.

```typescript
import { formatDateTime } from '@/utils/format';

const date = new Date('2025-09-11T14:30:00Z');
formatDateTime(date) // "Sep 11, 2025 14:30"
```

#### `formatRelativeTime(date)`

Formats relative time (e.g., "2 hours ago").

```typescript
import { formatRelativeTime } from '@/utils/format';

const now = new Date();
const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

formatRelativeTime(twoHoursAgo) // "2 hours ago"
formatRelativeTime(now) // "Just now"
```

### 3. Number Formatting

#### `formatLargeNumber(value, precision?, locale?)`

Formats large numbers with K, M, B suffixes.

```typescript
import { formatLargeNumber } from '@/utils/format';

// Basic usage
formatLargeNumber(1234) // "1.2K"
formatLargeNumber(1234567) // "1.2M"
formatLargeNumber(1234567890) // "1.2B"

// With precision
formatLargeNumber(1234, 0) // "1K"
formatLargeNumber(1234, 2) // "1.23K"

// With locale
formatLargeNumber(1234, 1, 'vi-VN') // "1,2K"
formatLargeNumber(1234, 1, 'en-US') // "1.2K"
```

#### `formatCompactNumber(num, decimals?, locale?)`

Formats numbers with compact notation.

```typescript
import { formatCompactNumber } from '@/utils/format';

formatCompactNumber(1234) // "1.2K"
formatCompactNumber(1234567) // "1.2M"
formatCompactNumber(1234567890) // "1.2B"
```

#### `formatNumberWithSeparators(num, decimals?, locale?)`

Formats numbers with thousand separators.

```typescript
import { formatNumberWithSeparators } from '@/utils/format';

formatNumberWithSeparators(1234567) // "1,234,567"
formatNumberWithSeparators(1234567.89, 2) // "1,234,567.89"
formatNumberWithSeparators(1234567.89, 2, 'vi-VN') // "1.234.567,89"
```

### 4. Text Formatting

#### `truncateText(text, maxLength)`

Truncates text to specified length.

```typescript
import { truncateText } from '@/utils/format';

truncateText('This is a very long text', 10) // "This is a ..."
truncateText('Short text', 10) // "Short text"
```

#### `capitalize(text)`

Capitalizes first letter of text.

```typescript
import { capitalize } from '@/utils/format';

capitalize('hello world') // "Hello world"
capitalize('HELLO WORLD') // "Hello world"
```

#### `formatName(name)`

Formats name (capitalize each word).

```typescript
import { formatName } from '@/utils/format';

formatName('john doe') // "John Doe"
formatName('MARY JANE SMITH') // "Mary Jane Smith"
```

### 5. Specialized Formatting

#### `formatFileSize(bytes)`

Formats file size in bytes.

```typescript
import { formatFileSize } from '@/utils/format';

formatFileSize(1024) // "1 KB"
formatFileSize(1048576) // "1 MB"
formatFileSize(1073741824) // "1 GB"
```

#### `formatPhoneNumber(phone)`

Formats phone number.

```typescript
import { formatPhoneNumber } from '@/utils/format';

formatPhoneNumber('1234567890') // "(123) 456-7890"
formatPhoneNumber('123-456-7890') // "(123) 456-7890"
```

#### `formatDuration(milliseconds)`

Formats time duration.

```typescript
import { formatDuration } from '@/utils/format';

formatDuration(1000) // "1s"
formatDuration(60000) // "1m 0s"
formatDuration(3661000) // "1h 1m 1s"
formatDuration(90061000) // "1d 1h 1m 1s"
```

## 🎯 Best Practices

### 1. Sử dụng đúng function cho từng trường hợp

```typescript
// ✅ ĐÚNG - Sử dụng formatCurrency cho tiền tệ
const price = formatCurrency(1000000, 'VND');

// ❌ SAI - Sử dụng formatNumber cho tiền tệ
const price = formatNumber(1000000) + ' ₫';
```

### 2. Xử lý null/undefined values

```typescript
// ✅ ĐÚNG - Functions tự động xử lý null/undefined
const amount = formatCurrency(portfolio?.value); // "0 ₫" nếu value là null

// ❌ SAI - Không xử lý null/undefined
const amount = formatCurrency(portfolio.value); // Error nếu value là null
```

### 3. Sử dụng locale phù hợp

```typescript
// ✅ ĐÚNG - Sử dụng locale phù hợp với user
const amount = formatCurrency(1000000, 'VND', {}, 'vi-VN'); // "1.000.000 ₫"

// ❌ SAI - Sử dụng locale không phù hợp
const amount = formatCurrency(1000000, 'VND', {}, 'en-US'); // "1,000,000 ₫"
```

### 4. Sử dụng options để tùy chỉnh

```typescript
// ✅ ĐÚNG - Sử dụng options để tùy chỉnh
const compactAmount = formatCurrency(1000000, 'VND', { compact: true }); // "1M ₫"

// ❌ SAI - Tự format thủ công
const compactAmount = (1000000 / 1000000).toFixed(1) + 'M ₫';
```

## 🔧 Code Examples

### React Component Example

```typescript
import React from 'react';
import { formatCurrency, formatDate, formatPercentage } from '@/utils/format';

interface PortfolioCardProps {
  portfolio: {
    name: string;
    value: number;
    change: number;
    changePercent: number;
    createdAt: Date;
  };
}

export const PortfolioCard: React.FC<PortfolioCardProps> = ({ portfolio }) => {
  return (
    <div className="portfolio-card">
      <h3>{portfolio.name}</h3>
      <div className="value">
        {formatCurrency(portfolio.value, 'VND')}
      </div>
      <div className={`change ${portfolio.change >= 0 ? 'positive' : 'negative'}`}>
        {formatCurrency(portfolio.change, 'VND')} 
        ({formatPercentage(portfolio.changePercent)})
      </div>
      <div className="date">
        Created: {formatDate(portfolio.createdAt, 'short')}
      </div>
    </div>
  );
};
```

### Trading Component Example

```typescript
import React from 'react';
import { formatCurrency, formatNumber, formatDate } from '@/utils/format';

interface TradeRowProps {
  trade: {
    symbol: string;
    quantity: number;
    price: number;
    total: number;
    date: Date;
  };
}

export const TradeRow: React.FC<TradeRowProps> = ({ trade }) => {
  return (
    <tr>
      <td>{trade.symbol}</td>
      <td>{formatNumber(trade.quantity, 0)}</td>
      <td>{formatCurrency(trade.price, 'VND')}</td>
      <td>{formatCurrency(trade.total, 'VND')}</td>
      <td>{formatDate(trade.date, 'short')}</td>
    </tr>
  );
};
```

## 🚨 Common Mistakes

### 1. Không sử dụng formatting utils

```typescript
// ❌ SAI - Tự format thủ công
const displayValue = value.toLocaleString() + ' ₫';

// ✅ ĐÚNG - Sử dụng formatting utils
const displayValue = formatCurrency(value, 'VND');
```

### 2. Không xử lý edge cases

```typescript
// ❌ SAI - Không xử lý null/undefined
const displayValue = value.toFixed(2) + ' ₫';

// ✅ ĐÚNG - Functions tự động xử lý
const displayValue = formatCurrency(value, 'VND');
```

### 3. Hardcode currency symbols

```typescript
// ❌ SAI - Hardcode currency symbols
const displayValue = value + ' ₫';

// ✅ ĐÚNG - Sử dụng formatCurrency
const displayValue = formatCurrency(value, 'VND');
```

## 📝 Testing

### Unit Test Example

```typescript
import { formatCurrency, formatDate, formatPercentage } from '@/utils/format';

describe('Formatting Utils', () => {
  describe('formatCurrency', () => {
    it('should format VND currency correctly', () => {
      expect(formatCurrency(1000000, 'VND')).toBe('1.000.000 ₫');
    });

    it('should handle null values', () => {
      expect(formatCurrency(null, 'VND')).toBe('0 ₫');
    });

    it('should handle compact format', () => {
      expect(formatCurrency(1000000, 'VND', { compact: true })).toBe('1M ₫');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2025-09-11T14:30:00Z');
      expect(formatDate(date, 'short')).toBe('Sep 11, 2025');
    });
  });
});
```

## 🔄 Migration Guide

### Từ manual formatting sang utils

```typescript
// Before - Manual formatting
const displayValue = value.toLocaleString('vi-VN') + ' ₫';
const displayDate = date.toLocaleDateString('vi-VN');
const displayPercent = (value * 100).toFixed(2) + '%';

// After - Using utils
const displayValue = formatCurrency(value, 'VND', {}, 'vi-VN');
const displayDate = formatDate(date, 'short', 'vi-VN');
const displayPercent = formatPercentage(value);
```

---

**Lưu ý**: Tất cả formatting trong hệ thống phải sử dụng các functions từ `@/utils/format`. Không được tự format thủ công.
