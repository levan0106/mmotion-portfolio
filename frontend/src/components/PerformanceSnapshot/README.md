# Performance Snapshot Components

## Overview

This directory contains React components for the Fund Manager Snapshot System, providing comprehensive performance analysis and risk metrics visualization.

## Components

### PerformanceSnapshotDashboard

The main dashboard component that displays portfolio performance metrics, risk analysis, and benchmark comparisons.

**Props:**
- `portfolioId: string` - The ID of the portfolio to analyze

**Features:**
- Portfolio performance summary (TWR, MWR, Alpha, Beta)
- Asset group performance analysis
- Risk metrics visualization
- Performance attribution charts
- Benchmark comparison tables
- Export functionality

**Usage:**
```tsx
import { PerformanceSnapshotDashboard } from './components/PerformanceSnapshot';

<PerformanceSnapshotDashboard portfolioId="your-portfolio-id" />
```

### PerformanceSnapshotDemo

A demo component that showcases the dashboard with sample data and explanations.

**Usage:**
```tsx
import PerformanceSnapshotDemo from './components/PerformanceSnapshot/PerformanceSnapshotDemo';

<PerformanceSnapshotDemo />
```

## Services

### UnifiedSnapshotService

A unified service class that handles all API communication for both basic snapshots and performance snapshots.

**Key Methods:**

**Basic Snapshot Operations:**
- `getSnapshots()` - Get basic snapshots with filters
- `createSnapshot()` - Create new basic snapshot
- `updateSnapshot()` - Update existing snapshot
- `deleteSnapshot()` - Delete snapshot
- `getSnapshotStatistics()` - Get snapshot statistics

**Performance Snapshot Operations:**
- `createPerformanceSnapshots()` - Create new performance snapshots
- `getPortfolioPerformanceSnapshots()` - Get portfolio performance data
- `getAssetPerformanceSnapshots()` - Get asset-level performance data
- `getAssetGroupPerformanceSnapshots()` - Get group-level performance data
- `getPortfolioPerformanceSummary()` - Get portfolio summary
- `exportPerformanceSnapshots()` - Export data to JSON

**Unified Operations:**
- `getAllSnapshotsForPortfolio()` - Get all snapshot types for a portfolio
- `createAllSnapshotsForPortfolio()` - Create both basic and performance snapshots
- `getComprehensivePortfolioAnalysis()` - Get complete portfolio analysis

**Usage:**
```tsx
import { snapshotService } from './services/snapshot.service';

// Get portfolio performance summary
const summary = await snapshotService.getPortfolioPerformanceSummary(
  'portfolio-id',
  '1Y'
);

// Get comprehensive analysis
const analysis = await snapshotService.getComprehensivePortfolioAnalysis(
  'portfolio-id',
  '1Y'
);
```

## Types

### Key TypeScript Interfaces

- `PortfolioPerformanceSnapshot` - Portfolio-level performance data
- `AssetPerformanceSnapshot` - Asset-level performance data
- `AssetGroupPerformanceSnapshot` - Group-level performance data
- `PerformanceChartData` - Chart data structure
- `PerformanceComparisonData` - Benchmark comparison data
- `RiskAnalysisData` - Risk metrics data

## Dependencies

- **Material-UI** - UI components and theming
- **Recharts** - Data visualization charts
- **Axios** - HTTP client for API calls
- **React** - UI framework

## Styling

The components use Material-UI's theming system and are fully responsive. They support:
- Light/dark theme switching
- Mobile-responsive design
- Custom color schemes
- Accessibility features

## Performance Considerations

- Components use React hooks for state management
- API calls are optimized with proper error handling
- Charts are rendered using Recharts for optimal performance
- Data is cached to minimize API calls

## Error Handling

All components include comprehensive error handling:
- API error states
- Loading states
- Empty data states
- Network connectivity issues

## Testing

Components can be tested using:
- Jest for unit tests
- React Testing Library for component tests
- Mock service data for integration tests

## Future Enhancements

- Real-time data updates
- Advanced filtering options
- Custom date range selection
- More chart types
- Export to PDF/Excel
- Performance alerts
- Custom benchmarks
