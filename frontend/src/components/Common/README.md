# Common Components

This directory contains reusable UI components that can be used across different pages in the application.

## Components

### MoneyInput

A specialized input component for handling monetary values with automatic formatting.

#### Features
- Real-time currency formatting (e.g., 1,000,000)
- Right-aligned text for better readability
- Currency icon and label display
- Automatic parsing of formatted input
- Validation support
- Customizable currency and formatting

#### Usage
```tsx
import { MoneyInput } from '../Common';

<MoneyInput
  value={amount}
  onChange={(value) => setAmount(value)}
  label="Transfer Amount"
  placeholder="Enter amount (e.g., 1,000,000)"
  required
  currency="VND"
  showCurrency={true}
/>
```

#### Props
- `value: number` - Current numeric value
- `onChange: (value: number) => void` - Callback when value changes
- `label?: string` - Input label (default: "Amount")
- `placeholder?: string` - Placeholder text
- `helperText?: string` - Helper text below input
- `error?: boolean` - Error state
- `required?: boolean` - Required field
- `disabled?: boolean` - Disabled state
- `currency?: string` - Currency code (default: "VND")
- `showCurrency?: boolean` - Show currency label (default: true)
- `align?: 'left' | 'right'` - Text alignment (default: 'right')
- `size?: 'small' | 'medium'` - Input size
- `fullWidth?: boolean` - Full width input
- `margin?: 'none' | 'dense' | 'normal'` - Margin spacing
- `variant?: 'outlined' | 'filled' | 'standard'` - Input variant

### NumberInput

A specialized input component for handling numeric values with customizable formatting and decimal places.

#### Features
- Customizable decimal places (0, 1, 2, etc.)
- Thousands separator support
- Min/max value constraints
- Step increment support
- Prefix and suffix support
- Real-time formatting
- Validation support

#### Usage
```tsx
import { NumberInput } from '../Common';

<NumberInput
  value={quantity}
  onChange={(value) => setQuantity(value)}
  label="Quantity"
  placeholder="Enter quantity"
  decimalPlaces={0}
  showThousandsSeparator={true}
  min={0}
  max={1000}
  required
/>
```

#### Props
- `value: number` - Current numeric value
- `onChange: (value: number) => void` - Callback when value changes
- `label?: string` - Input label (default: "Number")
- `placeholder?: string` - Placeholder text
- `helperText?: string` - Helper text below input
- `error?: boolean` - Error state
- `required?: boolean` - Required field
- `disabled?: boolean` - Disabled state
- `min?: number` - Minimum value
- `max?: number` - Maximum value
- `step?: number` - Step increment (default: 1)
- `decimalPlaces?: number` - Number of decimal places (default: 0)
- `showThousandsSeparator?: boolean` - Show thousands separator (default: true)
- `align?: 'left' | 'right' | 'center'` - Text alignment (default: 'right')
- `size?: 'small' | 'medium'` - Input size
- `fullWidth?: boolean` - Full width input
- `margin?: 'none' | 'dense' | 'normal'` - Margin spacing
- `variant?: 'outlined' | 'filled' | 'standard'` - Input variant
- `prefix?: string` - Prefix text
- `suffix?: string` - Suffix text
- `showIcon?: boolean` - Show numbers icon (default: true)

### FundingSourceInput

A smart autocomplete component for funding source selection with support for creating new sources.

#### Features
- Dropdown with existing funding sources
- Real-time search and filtering
- Create new funding source option
- Auto-complete functionality
- Toggle between selection and creation modes
- Visual feedback for different states

#### Usage
```tsx
import { FundingSourceInput } from '../Common';

<FundingSourceInput
  value={fundingSource}
  onChange={(source) => setFundingSource(source)}
  existingSources={['VIETCOMBANK', 'BIDV', 'TECHCOMBANK']}
  label="Funding Source"
  placeholder="Type or select funding source..."
  allowNew={true}
/>
```

#### Props
- `value: string` - Current funding source value
- `onChange: (value: string) => void` - Callback when value changes
- `existingSources: string[]` - Array of existing funding sources
- `label?: string` - Input label (default: "Funding Source")
- `placeholder?: string` - Placeholder text
- `helperText?: string` - Helper text below input
- `error?: boolean` - Error state
- `required?: boolean` - Required field
- `disabled?: boolean` - Disabled state
- `allowNew?: boolean` - Allow creating new sources (default: true)
- `size?: 'small' | 'medium'` - Input size
- `fullWidth?: boolean` - Full width input
- `margin?: 'none' | 'dense' | 'normal'` - Margin spacing
- `variant?: 'outlined' | 'filled' | 'standard'` - Input variant
- `onCreateNew?: (source: string) => void` - Callback when creating new source

## Benefits

### Reusability
- Consistent UI across different pages
- Reduced code duplication
- Easy maintenance and updates

### User Experience
- Specialized components for specific use cases
- Better input validation and formatting
- Intuitive interfaces for complex operations

### Development
- Type-safe props with TypeScript
- Comprehensive prop documentation
- Easy to test and maintain

## Examples

### Cash Flow Transfer
```tsx
import { MoneyInput, FundingSourceInput } from '../Common';

// Transfer form
<FundingSourceInput
  value={fromSource}
  onChange={setFromSource}
  existingSources={fundingSources}
  label="From Source"
  required
/>

<FundingSourceInput
  value={toSource}
  onChange={setToSource}
  existingSources={fundingSources}
  label="To Source"
  allowNew={true}
  required
/>

<MoneyInput
  value={amount}
  onChange={setAmount}
  label="Transfer Amount"
  required
  error={amount <= 0}
/>
```

### Trading Form
```tsx
import { MoneyInput, NumberInput } from '../Common';

<MoneyInput
  value={tradeAmount}
  onChange={setTradeAmount}
  label="Trade Amount"
  currency="USD"
  showCurrency={true}
  required
/>

<NumberInput
  value={shares}
  onChange={setShares}
  label="Number of Shares"
  decimalPlaces={0}
  min={1}
  max={10000}
  required
/>
```

### Portfolio Metrics
```tsx
import { NumberInput } from '../Common';

<NumberInput
  value={returnRate}
  onChange={setReturnRate}
  label="Return Rate (%)"
  decimalPlaces={2}
  suffix="%"
  min={0}
  max={100}
/>

<NumberInput
  value={volatility}
  onChange={setVolatility}
  label="Volatility"
  decimalPlaces={3}
  min={0}
  max={1}
/>
```

## Future Enhancements

- Date picker component
- File upload component
- Advanced search component
- Multi-select component
- Form validation component
