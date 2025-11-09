# Unified Snapshot Types

## Overview

The `snapshot.types.ts` file contains comprehensive TypeScript types for all snapshot systems in the portfolio management application. This file merges types from both basic snapshots and performance snapshots into a single, well-organized type system.

## File Structure

```
snapshot.types.ts
├── Enums & Utility Types
├── Basic Snapshot Types
├── Portfolio Snapshot Types
├── Performance Snapshot Types
├── Performance Snapshot DTOs & Results
├── Chart & Display Types
├── API Response Types
├── Filter & Sort Types
├── Form Types for UI Components
├── Export/Import Types
├── Dashboard Types
├── Combined Snapshot Types
└── Unified Snapshot Types (NEW)
```

## Type Categories

### 1. Enums & Utility Types

```typescript
export enum SnapshotGranularity {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export type TimePeriod = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'YTD';
export type RiskLevel = 'Low' | 'Medium' | 'High';
export type PerformanceGrade = 'A' | 'B' | 'C' | 'D' | 'F';
export type MetricFormat = 'percentage' | 'number' | 'currency';
export type TrendDirection = 'up' | 'down' | 'neutral';
```

### 2. Basic Snapshot Types

Core types for basic snapshot operations:

- `SnapshotResponse` - Main snapshot data structure
- `CreateSnapshotRequest` - Request for creating snapshots
- `UpdateSnapshotRequest` - Request for updating snapshots
- `SnapshotQueryParams` - Query parameters for filtering
- `PaginatedSnapshotResponse` - Paginated response wrapper
- `SnapshotStatistics` - Statistics about snapshots
- `SnapshotAggregation` - Aggregated snapshot data
- `SnapshotTimelineQuery` - Timeline query parameters

### 3. Portfolio Snapshot Types

Types for portfolio-level snapshots:

- `PortfolioSnapshot` - Portfolio snapshot data structure
- `CreatePortfolioSnapshotRequest` - Request for creating portfolio snapshots
- `PortfolioSnapshotQueryParams` - Query parameters for portfolio snapshots
- `PaginatedPortfolioSnapshotResponse` - Paginated portfolio snapshot response

### 4. Performance Snapshot Types

Advanced types for performance analysis:

#### Core Performance Types
- `TWRMetrics` - Time-Weighted Return metrics
- `MWRIRRMetrics` - Money-Weighted Return and IRR metrics
- `AlphaBetaMetrics` - Alpha and Beta calculations
- `RiskMetrics` - Risk assessment metrics
- `CashFlowData` - Cash flow information
- `BenchmarkComparison` - Benchmark comparison data

#### Performance Snapshot Entities
- `PortfolioPerformanceSnapshot` - Portfolio performance data
- `AssetPerformanceSnapshot` - Asset performance data
- `AssetGroupPerformanceSnapshot` - Asset group performance data
- `BenchmarkData` - Benchmark data structure

### 5. Performance DTOs & Results

Types for API communication:

- `PerformanceSnapshotResult` - Result of performance snapshot creation
- `CreatePerformanceSnapshotDto` - DTO for creating performance snapshots
- `PerformanceSnapshotQueryDto` - DTO for querying performance snapshots
- `PortfolioPerformanceSummary` - Portfolio performance summary
- `AssetPerformanceSummary` - Asset performance summary
- `AssetGroupPerformanceSummary` - Asset group performance summary

### 6. Chart & Display Types

Types for data visualization:

- `PerformanceMetricsDisplay` - Display configuration for metrics
- `SnapshotChartData` - Basic chart data
- `PlChartData` - P&L chart data
- `AllocationChartData` - Allocation chart data
- `PerformanceChartData` - Performance chart data
- `PerformanceComparisonData` - Comparison chart data
- `RiskAnalysisData` - Risk analysis display data
- `PerformanceAttributionData` - Attribution analysis data

### 7. API Response Types

Standard API response wrappers:

- `ApiResponse<T>` - Generic API response wrapper
- `PaginatedResponse<T>` - Paginated response wrapper
- `BulkRecalculateResponse` - Bulk operation response
- `CleanupResponse` - Cleanup operation response
- `PortfolioWithSnapshots` - Portfolio with snapshot information

### 8. Filter & Sort Types

Types for data filtering and sorting:

- `SnapshotFilters` - Basic snapshot filters
- `PerformanceSnapshotFilters` - Performance snapshot filters
- `PerformanceSnapshotSort` - Sorting configuration

### 9. Form Types

Types for UI form components:

- `SnapshotFormData` - Form data for snapshot creation/editing

### 10. Export/Import Types

Types for data export and import:

- `PerformanceSnapshotExport` - Export data structure

### 11. Dashboard Types

Types for dashboard components:

- `PerformanceDashboardData` - Complete dashboard data structure

### 12. Combined Snapshot Types

Types for combining different snapshot types:

- `CombinedSnapshotData` - Combined basic and portfolio snapshots

### 13. Unified Snapshot Types (NEW)

New types for unified operations:

- `UnifiedSnapshotData` - Unified snapshot data structure
- `UnifiedSnapshotQuery` - Unified query parameters
- `UnifiedSnapshotResult` - Unified query results

## Usage Examples

### Basic Snapshot Operations

```typescript
import { SnapshotResponse, CreateSnapshotRequest } from './types/snapshot.types';

// Create a new snapshot
const createRequest: CreateSnapshotRequest = {
  portfolioId: 'portfolio-123',
  assetId: 'asset-456',
  assetSymbol: 'AAPL',
  snapshotDate: '2024-01-01',
  granularity: SnapshotGranularity.DAILY,
  quantity: 100,
  currentPrice: 150.00,
  currentValue: 15000.00,
  // ... other required fields
};

// Handle snapshot response
const snapshot: SnapshotResponse = await snapshotService.createSnapshot(createRequest);
```

### Performance Snapshot Operations

```typescript
import { 
  PortfolioPerformanceSummary, 
  AssetPerformanceSummary,
  TimePeriod 
} from './types/snapshot.types';

// Get portfolio performance summary
const summary: PortfolioPerformanceSummary = await snapshotService
  .getPortfolioPerformanceSummary('portfolio-123', '1Y' as TimePeriod);

// Get asset performance summary
const assetSummary: AssetPerformanceSummary = await snapshotService
  .getAssetPerformanceSummary('portfolio-123', { period: '1Y' });
```

### Unified Operations

```typescript
import { UnifiedSnapshotResult } from './types/snapshot.types';

// Get comprehensive snapshot data
const result: UnifiedSnapshotResult = await snapshotService
  .getComprehensivePortfolioAnalysis('portfolio-123', '1Y');
```

### Chart Data

```typescript
import { 
  PerformanceChartData, 
  RiskAnalysisData,
  PerformanceComparisonData 
} from './types/snapshot.types';

// Performance chart data
const chartData: PerformanceChartData[] = [
  {
    date: '2024-01-01',
    portfolio: 1000,
    benchmark: 950,
  }
];

// Risk analysis data
const riskData: RiskAnalysisData[] = [
  {
    metric: 'Volatility',
    value: 15.5,
    level: 'Medium',
    description: 'Portfolio volatility is within acceptable range',
    recommendation: 'Consider diversifying further'
  }
];
```

## Type Safety Benefits

### 1. Compile-time Validation
- All types are checked at compile time
- Prevents runtime errors from type mismatches
- IntelliSense support for better development experience

### 2. API Contract Enforcement
- Ensures API requests and responses match expected structure
- Validates data flow between frontend and backend
- Prevents breaking changes from propagating

### 3. Documentation
- Types serve as living documentation
- Clear understanding of data structures
- Easy to understand relationships between types

### 4. Refactoring Safety
- Safe refactoring with type checking
- Automatic detection of breaking changes
- Easy to update dependent code

## Migration Guide

### From Separate Type Files

**Before:**
```typescript
import { SnapshotResponse } from './types/snapshot.types';
import { PortfolioPerformanceSummary } from './types/snapshot.types';
```

**After:**
```typescript
import { 
  SnapshotResponse, 
  PortfolioPerformanceSummary 
} from './types/snapshot.types';
```

### Backward Compatibility

All existing types are preserved with the same names and structures. The only change is the import path.

## Best Practices

### 1. Use Specific Types
```typescript
// Good - specific type
const summary: PortfolioPerformanceSummary = await getSummary();

// Avoid - generic type
const summary: any = await getSummary();
```

### 2. Leverage Type Unions
```typescript
// Use union types for flexibility
const period: TimePeriod = '1Y';
const riskLevel: RiskLevel = 'Medium';
```

### 3. Use Optional Properties
```typescript
// Mark optional properties correctly
interface QueryParams {
  portfolioId: string;
  startDate?: string;  // Optional
  endDate?: string;    // Optional
}
```

### 4. Use Generic Types
```typescript
// Use generics for reusable types
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
```

## Future Enhancements

- **Real-time Types**: WebSocket message types
- **Validation Types**: Runtime validation schemas
- **GraphQL Types**: GraphQL schema types
- **Testing Types**: Test-specific type definitions
- **Internationalization Types**: i18n type definitions

## Type Organization

The types are organized in logical sections:

1. **Core Types**: Basic data structures
2. **API Types**: Request/response types
3. **UI Types**: Component and form types
4. **Analysis Types**: Performance and risk types
5. **Utility Types**: Helper and utility types

This organization makes it easy to find and use the appropriate types for different parts of the application.
