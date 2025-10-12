# ResponsiveFormControl Components

Bộ component FormControl responsive để sử dụng thống nhất trên toàn bộ ứng dụng.

## Components

### 1. ResponsiveFormControl
FormControl cơ bản với styling responsive.

```tsx
import { ResponsiveFormControl } from '../Common/ResponsiveFormControl';

<ResponsiveFormControl compact={false} size="small">
  {/* children */}
</ResponsiveFormControl>
```

### 2. ResponsiveSelect
Select component với styling responsive.

```tsx
import { ResponsiveSelect } from '../Common/ResponsiveFormControl';

<ResponsiveSelect
  compact={false}
  size="small"
  options={[
    { value: '1M', label: '1 Month' },
    { value: '3M', label: '3 Months' },
    { value: '1Y', label: '1 Year' },
  ]}
  value={selectedValue}
  onChange={handleChange}
/>
```

### 3. ResponsiveMenuItem
MenuItem component với styling responsive.

```tsx
import { ResponsiveMenuItem } from '../Common/ResponsiveFormControl';

<ResponsiveMenuItem compact={false} value="option1">
  Option 1
</ResponsiveMenuItem>
```

### 4. ResponsiveFormSelect (Recommended)
Component kết hợp FormControl + Select cho các trường hợp thông thường.

```tsx
import { ResponsiveFormSelect } from '../Common/ResponsiveFormControl';

<ResponsiveFormSelect
  compact={false}
  size="small"
  options={[
    { value: '1M', label: '1 Month' },
    { value: '3M', label: '3 Months' },
    { value: '1Y', label: '1 Year' },
  ]}
  placeholder="Select period"
  value={selectedPeriod}
  onChange={handlePeriodChange}
/>
```

## Props

### ResponsiveFormSelect Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `compact` | `boolean` | `false` | Compact mode cho mobile |
| `size` | `'small' \| 'medium'` | `'small'` | Kích thước component |
| `options` | `Array<{value, label, disabled?}>` | - | Danh sách options |
| `placeholder` | `string` | - | Placeholder text |
| `value` | `string \| number` | - | Giá trị được chọn |
| `onChange` | `(value: string \| number) => void` | - | Callback khi thay đổi |
| `sx` | `SxProps<Theme>` | `{}` | Custom styles |
| `formControlSx` | `SxProps<Theme>` | `{}` | Styles cho FormControl |
| `selectSx` | `SxProps<Theme>` | `{}` | Styles cho Select |

## Responsive Behavior

### Compact Mode (Mobile)
- Font size: 0.6rem
- Height: 28px
- Padding: 0.3, 0.8
- Min width: 60px

### Normal Mode (Desktop)
- Font size: 0.7rem
- Height: 32px
- Padding: 0.5, 1
- Min width: 70px

## Migration Guide

### Before (Old way)
```tsx
<FormControl size="small" sx={{ minWidth: compact ? 60 : 70 }}>
  <Select
    value={value}
    onChange={handleChange}
    sx={{ 
      fontSize: compact ? '0.6rem' : '0.7rem',
      height: compact ? '28px' : '32px',
      '& .MuiSelect-select': {
        py: compact ? 0.3 : 0.5,
        px: compact ? 0.8 : 1
      }
    }}
  >
    <MenuItem value="1M" sx={{ fontSize: compact ? '0.6rem' : '0.7rem' }}>1M</MenuItem>
    <MenuItem value="3M" sx={{ fontSize: compact ? '0.6rem' : '0.7rem' }}>3M</MenuItem>
  </Select>
</FormControl>
```

### After (New way)
```tsx
<ResponsiveFormSelect
  compact={compact}
  options={[
    { value: '1M', label: '1M' },
    { value: '3M', label: '3M' },
  ]}
  value={value}
  onChange={handleChange}
/>
```

## Examples

### Period Selector
```tsx
<ResponsiveFormSelect
  compact={compact}
  options={[
    { value: '1M', label: '1 Month' },
    { value: '3M', label: '3 Months' },
    { value: '6M', label: '6 Months' },
    { value: '1Y', label: '1 Year' },
  ]}
  value={period}
  onChange={setPeriod}
/>
```

### Currency Selector
```tsx
<ResponsiveFormSelect
  compact={compact}
  options={[
    { value: 'VND', label: 'VND' },
    { value: 'USD', label: 'USD' },
    { value: 'EUR', label: 'EUR' },
  ]}
  placeholder="Select currency"
  value={currency}
  onChange={setCurrency}
/>
```

### Status Selector with Disabled Options
```tsx
<ResponsiveFormSelect
  compact={compact}
  options={[
    { value: 'ACTIVE', label: 'Active' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'CANCELLED', label: 'Cancelled', disabled: true },
  ]}
  value={status}
  onChange={setStatus}
/>
```
