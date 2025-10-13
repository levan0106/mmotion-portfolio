# ResponsiveButton Component

## Overview

The `ResponsiveButton` component is a smart button that automatically switches between text+icon and icon-only display based on screen size, providing an optimal user experience across all devices.

## Features

- **Automatic Responsive Behavior**: Shows icon+text on desktop, icon-only on mobile
- **Custom Text Variants**: Different text for mobile and desktop
- **Force Options**: Force icon-only or text-only display
- **Custom Breakpoints**: Control when responsive behavior kicks in
- **Icon Sizing**: Responsive icon sizes that scale with screen size
- **Material-UI Compatible**: Works with all Material-UI Button props and variants

## Usage

### Basic Usage

```tsx
import { ResponsiveButton } from '../components/Common';

<ResponsiveButton
  variant="contained"
  icon={<AddIcon />}
  startIcon={<AddIcon />}
>
  Add New
</ResponsiveButton>
```

### Custom Text Variants

```tsx
<ResponsiveButton
  variant="outlined"
  icon={<RefreshIcon />}
  startIcon={<RefreshIcon />}
  mobileText="Refresh"
  desktopText="Refresh All Data"
>
  Refresh All Data
</ResponsiveButton>
```

### Force Icon Only

```tsx
<ResponsiveButton
  variant="contained"
  icon={<SaveIcon />}
  startIcon={<SaveIcon />}
  forceIconOnly
>
  Save Changes
</ResponsiveButton>
```

### Force Text Only

```tsx
<ResponsiveButton
  variant="outlined"
  icon={<SettingsIcon />}
  startIcon={<SettingsIcon />}
  forceTextOnly
>
  Settings
</ResponsiveButton>
```

### Custom Breakpoints

```tsx
<ResponsiveButton
  variant="contained"
  icon={<PortfolioIcon />}
  startIcon={<PortfolioIcon />}
  breakpoint="md" // Changes to icon-only below md breakpoint
>
  Portfolio
</ResponsiveButton>
```

### Different Icon Sizes

```tsx
<ResponsiveButton
  variant="contained"
  icon={<AddIcon />}
  startIcon={<AddIcon />}
  iconSize="large" // small, medium, large
>
  Add Asset
</ResponsiveButton>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | - | Button text content |
| `icon` | `React.ReactNode` | - | Icon to display |
| `mobileText` | `string` | - | Text to show on mobile |
| `desktopText` | `string` | - | Text to show on desktop |
| `forceIconOnly` | `boolean` | `false` | Force icon-only display |
| `forceTextOnly` | `boolean` | `false` | Force text-only display |
| `breakpoint` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'sm'` | Responsive breakpoint |
| `iconSize` | `'small' \| 'medium' \| 'large'` | `'medium'` | Icon size |
| `responsiveSizing` | `boolean` | `true` | Enable responsive sizing |

All other Material-UI Button props are supported.

## Responsive Behavior

### Default Behavior
- **Desktop (≥sm)**: Shows icon + text
- **Mobile (<sm)**: Shows icon only

### Custom Breakpoints
- `xs`: Changes at 0px
- `sm`: Changes at 600px (default)
- `md`: Changes at 900px
- `lg`: Changes at 1200px
- `xl`: Changes at 1536px

### Icon Sizing
- **Small**: 16px (xs) → 20px (md)
- **Medium**: 18px (xs) → 24px (md)
- **Large**: 20px (xs) → 28px (md)

## Examples

### Real-world Usage

```tsx
// Assets page buttons
<ResponsiveButton
  variant="outlined"
  icon={<Refresh />}
  startIcon={<Refresh />}
  onClick={handleRefresh}
  mobileText="Refresh"
  desktopText="Refresh Data"
>
  Refresh Data
</ResponsiveButton>

<ResponsiveButton
  variant="contained"
  icon={<Add />}
  startIcon={<Add />}
  onClick={handleCreateAsset}
  mobileText="Add"
  desktopText="Add Asset"
>
  Add Asset
</ResponsiveButton>
```

### Action Buttons

```tsx
// Edit button
<ResponsiveButton
  variant="outlined"
  icon={<EditIcon />}
  startIcon={<EditIcon />}
  mobileText="Edit"
  desktopText="Edit Asset"
>
  Edit Asset
</ResponsiveButton>

// Delete button
<ResponsiveButton
  variant="contained"
  color="error"
  icon={<DeleteIcon />}
  startIcon={<DeleteIcon />}
  mobileText="Delete"
  desktopText="Delete Selected"
>
  Delete Selected
</ResponsiveButton>
```

### Filter and Search Buttons

```tsx
// Filter button
<ResponsiveButton
  variant="outlined"
  icon={<FilterIcon />}
  startIcon={<FilterIcon />}
  mobileText="Filter"
  desktopText="Show Filters"
>
  Show Filters
</ResponsiveButton>

// Search button
<ResponsiveButton
  variant="contained"
  color="secondary"
  icon={<SearchIcon />}
  startIcon={<SearchIcon />}
  mobileText="Search"
  desktopText="Search Assets"
>
  Search Assets
</ResponsiveButton>
```

## Best Practices

### 1. Use Descriptive Text
- Mobile text should be concise but clear
- Desktop text can be more descriptive
- Example: `mobileText="Add"` vs `desktopText="Add Asset"`

### 2. Choose Appropriate Icons
- Use Material-UI icons for consistency
- Icons should be self-explanatory
- Consider icon-only display when choosing icons

### 3. Set Appropriate Breakpoints
- Use `sm` (600px) for most cases
- Use `md` (900px) for larger buttons
- Use `xs` (0px) for always-responsive buttons

### 4. Consider Icon Sizes
- Use `small` for compact interfaces
- Use `medium` for standard buttons
- Use `large` for prominent actions

### 5. Force Options When Needed
- Use `forceIconOnly` for toolbar buttons
- Use `forceTextOnly` for critical actions
- Use responsive behavior for most cases

## Migration from Regular Buttons

### Before (Regular Button)
```tsx
<Button
  variant="contained"
  startIcon={<AddIcon />}
  onClick={handleAdd}
  sx={{ 
    borderRadius: 2,
    textTransform: 'none',
    fontWeight: 500
  }}
>
  Add Asset
</Button>
```

### After (ResponsiveButton)
```tsx
<ResponsiveButton
  variant="contained"
  icon={<AddIcon />}
  startIcon={<AddIcon />}
  onClick={handleAdd}
  mobileText="Add"
  desktopText="Add Asset"
>
  Add Asset
</ResponsiveButton>
```

## Demo

Visit `/responsive-button-demo` to see all ResponsiveButton examples in action.

## Implementation Details

The ResponsiveButton component:
1. Uses Material-UI's `useMediaQuery` hook for responsive detection
2. Clones icons with responsive sizing when `responsiveSizing` is enabled
3. Applies responsive styles based on screen size and props
4. Maintains all Material-UI Button functionality
5. Provides TypeScript support with proper interfaces

## Browser Support

- All modern browsers
- Mobile Safari
- Chrome Mobile
- Firefox Mobile
- Edge Mobile

## Performance

- Lightweight component with minimal overhead
- Uses React.memo for optimization
- Responsive detection is efficient
- Icon cloning is optimized for performance
