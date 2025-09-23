# SnapshotSimpleList Component Structure

## Overview
The `SnapshotSimpleList` component has been refactored into a modular structure for better maintainability and easier modification.

## File Structure

```
SnapshotSimpleList/
├── index.ts                                    # Main exports
├── SnapshotSimpleList.tsx                      # Main component
├── README.md                                   # This file
└── tabs/                                       # Tab components
    ├── PortfolioSummaryTab.tsx                 # Portfolio Summary tab
    ├── SnapshotPortfolioPerformanceTab.tsx     # Portfolio Performance tab
    ├── SnapshotAssetGroupPerformanceTab.tsx    # Asset Group Performance tab
    ├── SnapshotAssetPerformanceTab.tsx         # Asset Performance tab
    └── SnapshotAssetSnapshotTab.tsx            # Asset Snapshots tab
```

## Component Responsibilities

### Main Component (`SnapshotSimpleList.tsx`)
- Manages overall state and data loading
- Handles tab navigation
- Coordinates between different tab components
- Manages performance data loading

### Tab Components

#### `PortfolioSummaryTab.tsx`
- Displays portfolio-level summary data
- Shows portfolio snapshots with comprehensive metrics
- Includes portfolio P&L, asset P&L, deposit data, and performance metrics

#### `SnapshotPortfolioPerformanceTab.tsx`
- Displays portfolio performance snapshots
- Shows TWR, MWR, IRR, Alpha, Beta metrics
- Includes information ratio, tracking error, and cash flow data

#### `SnapshotAssetGroupPerformanceTab.tsx`
- Displays asset group performance snapshots
- Shows group-level performance metrics
- Includes Sharpe ratio, volatility, max drawdown, and risk-adjusted returns

#### `SnapshotAssetPerformanceTab.tsx`
- Displays individual asset performance snapshots
- Shows asset-level performance metrics
- Includes absolute return, simple return, and all performance ratios

#### `SnapshotAssetSnapshotTab.tsx`
- Displays detailed asset snapshots with collapsible grouping
- Shows asset-level data with expand/collapse functionality
- Includes pagination and action buttons

## Naming Convention

All components follow the `Snapshot` prefix naming convention:
- `SnapshotPortfolioSummaryTab`
- `SnapshotPortfolioPerformanceTab`
- `SnapshotAssetGroupPerformanceTab`
- `SnapshotAssetPerformanceTab`
- `SnapshotAssetSnapshotTab`

## Benefits of This Structure

1. **Modularity**: Each tab is a separate component, making it easier to modify individual tabs
2. **Maintainability**: Smaller files are easier to understand and maintain
3. **Reusability**: Tab components can be reused in other contexts if needed
4. **Separation of Concerns**: Each component has a single responsibility
5. **Easier Testing**: Individual components can be tested in isolation
6. **Better Performance**: Only the active tab component is rendered

## Usage

```tsx
import { SnapshotSimpleList } from './SnapshotSimpleList';

<SnapshotSimpleList
  portfolioId={portfolioId}
  onSnapshotSelect={handleSnapshotSelect}
  onSnapshotEdit={handleSnapshotEdit}
  onSnapshotDelete={handleSnapshotDelete}
  showActions={true}
  pageSize={25}
  refreshTrigger={refreshTrigger}
/>
```

## Future Enhancements

- Add individual tab components to the main exports for external use
- Create shared interfaces for common props
- Add unit tests for each tab component
- Implement lazy loading for tab components
- Add error boundaries for individual tabs
