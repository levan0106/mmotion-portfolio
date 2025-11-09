# Unified Snapshot Service

## Overview

The `UnifiedSnapshotService` is a comprehensive service that merges functionality from both basic snapshots and performance snapshots into a single, easy-to-use interface. This service provides a unified API for all snapshot-related operations in the portfolio management system.

## Architecture

### Service Structure

```
UnifiedSnapshotService
├── Basic Snapshot Operations (from snapshot.service.ts)
│   ├── CRUD Operations
│   ├── Timeline & Aggregation
│   ├── Statistics & Cleanup
│   └── Portfolio Management
├── Performance Snapshot Operations (from performance-snapshot.service.ts)
│   ├── Performance Metrics
│   ├── Risk Analysis
│   ├── Benchmark Comparison
│   └── Attribution Analysis
└── Unified Utility Methods
    ├── Combined Operations
    ├── Comprehensive Analysis
    └── Batch Operations
```

### API Endpoints

**Basic Snapshots:**
- Base URL: `/api/v1/snapshots`
- Operations: CRUD, timeline, statistics, cleanup

**Performance Snapshots:**
- Base URL: `/api/v1/performance-snapshots`
- Operations: Performance metrics, risk analysis, benchmarks

## Usage Examples

### Basic Snapshot Operations

```typescript
import { snapshotService } from './services/snapshot.service';

// Get all snapshots for a portfolio
const snapshots = await snapshotService.getSnapshots({
  portfolioId: 'portfolio-123',
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});

// Create new snapshot
const newSnapshot = await snapshotService.createSnapshot({
  portfolioId: 'portfolio-123',
  assetId: 'asset-456',
  assetSymbol: 'AAPL',
  snapshotDate: '2024-01-01',
  granularity: 'DAILY',
  quantity: 100,
  currentPrice: 150.00,
  currentValue: 15000.00,
  // ... other required fields
});

// Get snapshot statistics
const stats = await snapshotService.getSnapshotStatistics('portfolio-123');
```

### Performance Snapshot Operations

```typescript
// Get portfolio performance summary
const summary = await snapshotService.getPortfolioPerformanceSummary(
  'portfolio-123',
  '1Y'
);

// Get asset performance data
const assetPerformance = await snapshotService.getAssetPerformanceSnapshots(
  'portfolio-123',
  {
    assetId: 'asset-456',
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  }
);

// Get risk analysis
const riskAnalysis = await snapshotService.getRiskAnalysis(
  'portfolio-123',
  '1Y'
);
```

### Unified Operations

```typescript
// Get all snapshot types for a portfolio
const allSnapshots = await snapshotService.getAllSnapshotsForPortfolio(
  'portfolio-123',
  '2024-01-01',
  '2024-12-31',
  'DAILY'
);

// Create both basic and performance snapshots
const allNewSnapshots = await snapshotService.createAllSnapshotsForPortfolio(
  'portfolio-123',
  '2024-01-01',
  'DAILY',
  'user-123'
);

// Get comprehensive portfolio analysis
const analysis = await snapshotService.getComprehensivePortfolioAnalysis(
  'portfolio-123',
  '1Y'
);
```

## Key Features

### 1. Unified API
- Single service for all snapshot operations
- Consistent error handling
- Type-safe operations

### 2. Performance Optimized
- Parallel API calls where possible
- Efficient data fetching
- Caching support

### 3. Comprehensive Coverage
- Basic snapshot CRUD operations
- Performance metrics calculation
- Risk analysis and benchmarking
- Timeline and aggregation features

### 4. Developer Friendly
- Full TypeScript support
- Comprehensive JSDoc documentation
- Consistent naming conventions
- Error handling and validation

## Method Categories

### Basic Snapshot Methods
- `getSnapshots()` - Retrieve snapshots with filters
- `getSnapshotsPaginated()` - Paginated snapshot retrieval
- `getSnapshotById()` - Get specific snapshot
- `createSnapshot()` - Create new snapshot
- `createPortfolioSnapshots()` - Create snapshots for entire portfolio
- `updateSnapshot()` - Update existing snapshot
- `recalculateSnapshot()` - Recalculate snapshot values
- `bulkRecalculateSnapshots()` - Bulk recalculation
- `deleteSnapshot()` - Soft delete snapshot
- `hardDeleteSnapshot()` - Hard delete snapshot
- `getTimelineData()` - Get timeline data
- `getAggregatedTimelineData()` - Get aggregated timeline
- `getLatestSnapshot()` - Get latest snapshot
- `getSnapshotStatistics()` - Get statistics
- `cleanupOldSnapshots()` - Cleanup old data
- `deleteSnapshotsByDateRange()` - Delete by date range
- `deleteSnapshotsByDate()` - Delete by specific date
- `deleteSnapshotsByGranularity()` - Delete by granularity
- `getPortfoliosWithSnapshots()` - Get portfolios with snapshots

### Performance Snapshot Methods
- `createPerformanceSnapshots()` - Create performance snapshots
- `getPortfolioPerformanceSnapshots()` - Get portfolio performance
- `getAssetPerformanceSnapshots()` - Get asset performance
- `getAssetGroupPerformanceSnapshots()` - Get group performance
- `getPortfolioPerformanceSummary()` - Get portfolio summary
- `getAssetPerformanceSummary()` - Get asset summary
- `getAssetGroupPerformanceSummary()` - Get group summary
- `deletePerformanceSnapshotsByDateRange()` - Delete performance snapshots
- `exportPerformanceSnapshots()` - Export data
- `getPerformanceDashboardData()` - Get dashboard data
- `getPerformanceComparison()` - Get benchmark comparison
- `getRiskAnalysis()` - Get risk analysis
- `getPerformanceAttribution()` - Get attribution analysis
- `getPerformanceTrends()` - Get performance trends
- `getBenchmarkData()` - Get benchmark data
- `getAvailableBenchmarks()` - Get available benchmarks
- `getPerformanceAlerts()` - Get performance alerts
- `createPerformanceAlert()` - Create alert
- `updatePerformanceAlert()` - Update alert
- `deletePerformanceAlert()` - Delete alert

### Unified Utility Methods
- `getAllSnapshotsForPortfolio()` - Get all snapshot types
- `createAllSnapshotsForPortfolio()` - Create all snapshot types
- `deleteAllSnapshotsByDateRange()` - Delete all snapshot types
- `getComprehensivePortfolioAnalysis()` - Get complete analysis

## Error Handling

The service includes comprehensive error handling:

```typescript
try {
  const result = await snapshotService.getPortfolioPerformanceSummary('portfolio-123');
  // Handle success
} catch (error) {
  if (error.response?.status === 404) {
    // Handle not found
  } else if (error.response?.status === 500) {
    // Handle server error
  } else {
    // Handle other errors
  }
}
```

## Type Safety

All methods are fully typed with TypeScript:

```typescript
// Input types
const query: PerformanceSnapshotQueryDto = {
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  granularity: 'DAILY'
};

// Return types
const summary: PortfolioPerformanceSummary = await snapshotService
  .getPortfolioPerformanceSummary('portfolio-123');
```

## Migration Guide

### From Separate Services

**Before:**
```typescript
import { snapshotService } from './services/snapshot.service';
import { performanceSnapshotService } from './services/performance-snapshot.service';

const basicSnapshots = await snapshotService.getSnapshots({...});
const performanceSnapshots = await performanceSnapshotService.getPortfolioPerformanceSnapshots(...);
```

**After:**
```typescript
import { snapshotService } from './services/snapshot.service';

const basicSnapshots = await snapshotService.getSnapshots({...});
const performanceSnapshots = await snapshotService.getPortfolioPerformanceSnapshots(...);
```

### Backward Compatibility

The service maintains backward compatibility by exporting both service instances:

```typescript
// Both work the same way
import { snapshotService } from './services/snapshot.service';
import { performanceSnapshotService } from './services/snapshot.service'; // Same instance
```

## Best Practices

1. **Use Unified Methods**: Prefer unified methods when working with multiple snapshot types
2. **Error Handling**: Always wrap service calls in try-catch blocks
3. **Type Safety**: Use TypeScript interfaces for better development experience
4. **Performance**: Use parallel operations when fetching multiple data types
5. **Caching**: Consider implementing caching for frequently accessed data

## Future Enhancements

- Real-time data updates via WebSocket
- Advanced filtering and search capabilities
- Batch operations for large datasets
- Offline support with local storage
- Performance monitoring and analytics
- Custom benchmark creation
- Advanced risk modeling
- Machine learning integration
