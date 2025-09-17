# Utility Functions

This directory contains utility functions that can be used across the application.

## Format Utilities (`format.ts`)

### Currency Formatting

#### `formatCurrency(amount, currency?, options?, locale?)`
Formats a number as currency with proper locale formatting.

```typescript
formatCurrency(1234.56) // "1.234,56 ₫"
formatCurrency(1234.56, 'USD') // "$1,234.56"
formatCurrency(1234.56, 'EUR') // "€1,234.56"
formatCurrency(1234.56, 'VND', { compact: true }) // "1,2K ₫"
formatCurrency(1234.56, 'VND', { precision: 0 }) // "1.235 ₫"
```

### Number Formatting

#### `formatNumber(num, decimals?, locale?)`
Formats a number with specified decimal places.

```typescript
formatNumber(1234.567, 2) // "1,234.57"
formatNumber(1234.567, 0) // "1,235"
formatNumber(1234.567, 4) // "1,234.5670"
```

#### `formatPercentage(value, decimals?, locale?)`
Formats a number as percentage.

```typescript
formatPercentage(12.34) // "12.34%"
formatPercentage(12.34, 1) // "12.3%"
```

#### `formatLargeNumber(value, precision?, locale?)`
Formats large numbers with K, M, B suffixes.

```typescript
formatLargeNumber(1234) // "1.2K"
formatLargeNumber(1234567) // "1.2M"
formatLargeNumber(1234567890) // "1.2B"
```

#### `formatNumberWithSeparators(num, decimals?, locale?)`
Formats numbers with thousand separators.

```typescript
formatNumberWithSeparators(1234567) // "1,234,567"
formatNumberWithSeparators(1234567.89, 2) // "1,234,567.89"
```

### Date Formatting

#### `formatDate(date, format?, locale?)`
Formats dates using Intl.DateTimeFormat.

```typescript
formatDate(new Date(), 'short') // "Sep 11, 2025"
formatDate(new Date(), 'medium') // "Sep 11, 2025, 2:30 PM"
formatDate(new Date(), 'long') // "September 11, 2025 at 2:30 PM"
formatDate(new Date(), 'full') // "Thursday, September 11, 2025 at 2:30 PM"
```

#### `formatDateFns(date, formatString?)`
Formats dates using date-fns library.

```typescript
formatDateFns(new Date(), 'MMM dd, yyyy') // "Sep 11, 2025"
formatDateFns(new Date(), 'MMM dd, yyyy HH:mm') // "Sep 11, 2025 14:30"
```

#### `formatDateTime(date)`
Formats date and time.

```typescript
formatDateTime(new Date()) // "Sep 11, 2025 14:30"
```

#### `formatRelativeTime(date)`
Formats relative time (e.g., "2 hours ago").

```typescript
formatRelativeTime(new Date(Date.now() - 3600000)) // "1 hours ago"
formatRelativeTime(new Date(Date.now() - 86400000)) // "1 days ago"
```

### Duration Formatting

#### `formatDuration(milliseconds)`
Formats time duration in a readable format.

```typescript
formatDuration(3600000) // "1h 0m 0s"
formatDuration(90000) // "1m 30s"
formatDuration(5000) // "5s"
```

### File Size Formatting

#### `formatFileSize(bytes)`
Formats file size in appropriate units.

```typescript
formatFileSize(1024) // "1 KB"
formatFileSize(1048576) // "1 MB"
formatFileSize(1073741824) // "1 GB"
```

### Text Formatting

#### `truncateText(text, maxLength)`
Truncates text to specified length.

```typescript
truncateText("This is a long text", 10) // "This is a ..."
```

#### `capitalize(text)`
Capitalizes first letter of text.

```typescript
capitalize("hello world") // "Hello world"
```

#### `formatName(name)`
Formats name by capitalizing each word.

```typescript
formatName("john doe") // "John Doe"
```

### Contact Information Formatting

#### `formatPhoneNumber(phone)`
Formats phone number.

```typescript
formatPhoneNumber("1234567890") // "(123) 456-7890"
```

#### `formatSSN(ssn)`
Formats social security number.

```typescript
formatSSN("123456789") // "123-45-6789"
```

#### `formatCreditCard(cardNumber)`
Formats credit card number.

```typescript
formatCreditCard("1234567890123456") // "1234 5678 9012 3456"
```

## Usage Examples

### In React Components

```typescript
import { formatCurrency, formatNumber, formatDate } from '../utils/format';

const MyComponent = () => {
  const price = 1234.56;
  const quantity = 10.5;
  const date = new Date();

  return (
    <div>
      <p>Price: {formatCurrency(price)}</p>
      <p>Quantity: {formatNumber(quantity, 2)}</p>
      <p>Date: {formatDate(date, 'short')}</p>
    </div>
  );
};
```

### With Different Locales

```typescript
import { formatCurrency, formatNumber } from '../utils/format';

// Vietnamese formatting (default)
formatCurrency(1234.56) // "1.234,56 ₫"

// US formatting
formatCurrency(1234.56, 'USD', {}, 'en-US') // "$1,234.56"

// European formatting
formatCurrency(1234.56, 'EUR', {}, 'de-DE') // "1.234,56 €"

// Japanese formatting
formatNumber(1234.56, 2, 'ja-JP') // "1,234.56"
```

## Error Handling

All formatting functions handle edge cases gracefully:

- `undefined` or `null` values return default formatted values
- `NaN` values return "0" or "$0.00" depending on the function
- Invalid dates return "Invalid Date"
- Empty strings are handled appropriately

## Performance Considerations

- Functions use native `Intl` APIs for optimal performance
- Date formatting functions cache formatters when possible
- Large number formatting uses compact notation for better readability
