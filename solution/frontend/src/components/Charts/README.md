# TimelineChart Component

A highly flexible and reusable chart component for displaying time-series data with multiple visualization options.

## Features

- **Multiple Chart Types**: Line, Bar, and Combo (Bar + Line)
- **Stacking Options**: Stacked and Side-by-Side bar charts
- **Responsive Design**: Compact mode support
- **Highly Customizable**: Colors, formatters, dimensions, styling, and behavior
- **Interactive Controls**: Toggle buttons for chart types and bar types
- **Clean Tooltips**: Automatic duplicate filtering for combo charts
- **Flexible Data**: Works with any time-series data structure

## Basic Usage

```tsx
import { TimelineChart, TimelineDataPoint } from '../Charts';

const data: TimelineDataPoint[] = [
  { date: '2024-01-01', Series1: 40, Series2: 30, Series3: 20 },
  { date: '2024-02-01', Series1: 45, Series2: 25, Series3: 15 },
  // ... more data points
];

<TimelineChart
  data={data}
  title="My Timeline Chart"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `TimelineDataPoint[]` | **required** | Chart data with date and series values |
| `title` | `string` | `'Timeline Chart'` | Chart title |
| `subtitle` | `string` | - | Chart subtitle |
| `compact` | `boolean` | `false` | Enable compact mode |
| `height` | `number` | `267` | Chart height in pixels |
| `colors` | `string[]` | `['#1976d2', ...]` | Color palette for chart series |
| `showBarTypeToggle` | `boolean` | `true` | Show bar type toggle buttons |
| `defaultChartType` | `'line' \| 'bar' \| 'combo'` | `'line'` | Default chart type |
| `defaultBarType` | `'stacked' \| 'side-by-side'` | `'stacked'` | Default bar type |
| `yAxisDomain` | `[number, number]` | `[0, 100]` | Y-axis domain range |
| `yAxisFormatter` | `(value: number) => string` | `(value) => \`\${value}%\`` | Y-axis tick formatter |
| `xAxisFormatter` | `(value: string) => string` | Date formatter | X-axis tick formatter |
| `tooltipFormatter` | `(value: number) => string` | `formatPercentage` | Tooltip value formatter |
| `showLegend` | `boolean` | `true` | Show chart legend |
| `showGrid` | `boolean` | `true` | Show chart grid |
| `showTooltip` | `boolean` | `true` | Show tooltips |
| `lineStrokeWidth` | `number` | `2` | Line stroke width |
| `barRadius` | `number[]` | `[2, 2, 0, 0]` | Bar corner radius |
| `barOpacity` | `number` | `1` | Bar fill opacity |
| `className` | `string` | - | CSS class name |
| `sx` | `any` | - | MUI sx prop for styling |

## Data Format

```typescript
interface TimelineDataPoint {
  date: string;           // ISO date string
  [key: string]: string | number; // Dynamic series keys with values
}
```

## Use Cases

### 1. Portfolio Allocation
```tsx
<TimelineChart
  data={allocationData}
  title="Portfolio Allocation"
  subtitle="Asset allocation changes over time"
  yAxisFormatter={(value) => `${value}%`}
  tooltipFormatter={(value) => `${value.toFixed(1)}%`}
  yAxisDomain={[0, 100]}
/>
```

### 2. Performance Comparison
```tsx
<TimelineChart
  data={performanceData}
  title="Portfolio vs Benchmark"
  yAxisFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
  tooltipFormatter={(value) => `${(value / 1000).toFixed(1)}K VND`}
  yAxisDomain={[900000, 1200000]}
  colors={['#1976d2', '#dc004e', '#4caf50']}
/>
```

### 3. Revenue Analysis
```tsx
<TimelineChart
  data={revenueData}
  title="Quarterly Revenue"
  defaultChartType="bar"
  defaultBarType="side-by-side"
  yAxisFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
  tooltipFormatter={(value) => `${(value / 1000).toFixed(1)}K VND`}
  yAxisDomain={[0, 120000]}
/>
```

### 4. Compact Dashboard
```tsx
<TimelineChart
  data={data}
  title="Quick Overview"
  compact={true}
  height={200}
  showBarTypeToggle={false}
  defaultChartType="line"
/>
```

### 5. Custom Styling
```tsx
<TimelineChart
  data={data}
  title="Custom Styled Chart"
  colors={['#FF6B6B', '#4ECDC4', '#45B7D1']}
  lineStrokeWidth={3}
  barOpacity={0.8}
  sx={{
    backgroundColor: '#f8f9fa',
    borderRadius: 2,
    p: 2,
  }}
/>
```

### 6. Minimal Configuration
```tsx
<TimelineChart
  data={data}
  title="Simple Chart"
  showLegend={false}
  showGrid={false}
  height={150}
/>
```

## Chart Types

### Line Chart
- Smooth lines connecting data points
- Best for showing trends over time
- Interactive legend for toggling series
- Customizable stroke width

### Bar Chart
- Vertical bars for each data point
- Supports stacking and side-by-side modes
- Good for comparing values at specific points
- Customizable radius and opacity

### Combo Chart
- Combines bars and lines
- Bars show absolute values (semi-transparent)
- Lines show trends (solid lines)
- Only line series appear in legend
- Automatic duplicate filtering in tooltips

## Bar Types

### Stacked
- Bars are stacked on top of each other
- Total height represents 100% (if yAxisDomain is [0, 100])
- Good for showing composition
- Use `stackId="stack"` internally

### Side-by-Side
- Bars are placed next to each other
- Good for comparing absolute values
- Each bar represents individual values
- No `stackId` applied

## Advanced Customization

### Custom Formatters
```tsx
// Currency formatting
yAxisFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
tooltipFormatter={(value) => `${(value / 1000).toFixed(1)}K VND`}

// Percentage formatting
yAxisFormatter={(value) => `${value}%`}
tooltipFormatter={(value) => `${value.toFixed(1)}%`}

// Custom date formatting
xAxisFormatter={(value) => {
  const date = new Date(value);
  return date.toLocaleDateString('vi-VN');
}}
```

### Styling Options
```tsx
// MUI sx prop
sx={{
  backgroundColor: '#f5f5f5',
  borderRadius: 2,
  p: 2,
  '& .recharts-cartesian-axis-tick-value': {
    fontSize: '0.75rem',
  }
}}

// Custom colors
colors={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']}

// Line and bar styling
lineStrokeWidth={3}
barRadius={[4, 4, 0, 0]}
barOpacity={0.8}
```

## Integration

The component is designed for easy integration:

1. Import from the Charts folder
2. Prepare data in the required format
3. Pass data and desired props
4. Component handles all rendering and interactions

```tsx
import { TimelineChart, TimelineDataPoint } from '../Charts';

// Use in any component
const MyComponent = () => {
  const data: TimelineDataPoint[] = [
    { date: '2024-01-01', A: 10, B: 20, C: 30 },
    // ... more data
  ];

  return (
    <TimelineChart
      data={data}
      title="My Chart"
      // ... other props
    />
  );
};
```

## Dependencies

- React
- Material-UI (MUI)
- Recharts
- Custom format utilities

## Notes

- Automatically detects series names from data keys (excluding 'date')
- Tooltip duplicates are automatically filtered for combo charts
- All chart types support the same data format
- Responsive design adapts to container width
- Supports any number of series (limited by color palette)
- Date format should be ISO string for proper parsing
