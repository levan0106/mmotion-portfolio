# Controller Decision Matrix - Snapshot APIs

## Overview

This document provides a decision matrix for determining which controller to use when implementing new snapshot-related APIs. It helps developers make consistent decisions about API placement and maintains clear separation of concerns.

## Decision Matrix

| **Criteria** | **SnapshotController** | **PerformanceSnapshotController** |
|--------------|------------------------|-----------------------------------|
| **CRUD Operations** | ✅ Create, Read, Update, Delete | ❌ Read-only operations |
| **Data Management** | ✅ Raw snapshot data | ❌ Calculated data |
| **Performance Metrics** | ❌ No calculations | ✅ TWR, MWR, IRR, Alpha, Beta |
| **Analytics & Reports** | ❌ Basic statistics only | ✅ Advanced analytics |
| **Time-based Analysis** | ❌ Simple timeline | ✅ Period-based analysis |
| **Risk Analysis** | ❌ No risk metrics | ✅ Sharpe, Volatility, Max Drawdown |
| **Benchmark Comparison** | ❌ No benchmark | ✅ Benchmark comparison |
| **Summary & Aggregation** | ❌ Basic aggregation | ✅ Performance summaries |

## Decision Rules

### Use SnapshotController When:

- ✅ **CRUD Operations**: Create, update, delete snapshots
- ✅ **Raw Data Access**: Access raw snapshot data
- ✅ **Data Management**: Manage snapshot data
- ✅ **Basic Statistics**: Basic statistics and counts
- ✅ **Timeline Data**: Simple timeline data
- ✅ **Bulk Operations**: Bulk operations on snapshots
- ✅ **Data Cleanup**: Cleanup and maintenance operations

### Use PerformanceSnapshotController When:

- ✅ **Performance Calculations**: Calculate performance metrics
- ✅ **Analytics & Reports**: Generate reports and analytics
- ✅ **Time-based Analysis**: Analyze data over time periods
- ✅ **Risk Metrics**: Calculate risk indicators
- ✅ **Benchmark Comparison**: Compare against benchmarks
- ✅ **Summary & Aggregation**: Create performance summaries
- ✅ **Advanced Analytics**: Complex analytical operations

## Decision Questions

Ask these questions to determine the correct controller:

1. **Does the API calculate performance metrics?**
   - ✅ Yes → `PerformanceSnapshotController`
   - ❌ No → `SnapshotController`

2. **Does the API create/update/delete data?**
   - ✅ Yes → `SnapshotController`
   - ❌ No → `PerformanceSnapshotController`

3. **Does the API perform risk analysis?**
   - ✅ Yes → `PerformanceSnapshotController`
   - ❌ No → `SnapshotController`

4. **Does the API compare against benchmarks?**
   - ✅ Yes → `PerformanceSnapshotController`
   - ❌ No → `SnapshotController`

5. **Does the API generate reports/summaries?**
   - ✅ Yes → `PerformanceSnapshotController`
   - ❌ No → `SnapshotController`

## Examples

### SnapshotController Examples

```typescript
// 1. CRUD Operations
POST /snapshots                    // Create new snapshot
PUT /snapshots/:id                 // Update snapshot
DELETE /snapshots/:id              // Delete snapshot

// 2. Data Management
GET /snapshots                     // Get snapshot list
GET /snapshots/:id                 // Get snapshot by ID
GET /snapshots/latest/:portfolioId // Get latest snapshot

// 3. Bulk Operations
POST /snapshots/bulk-recalculate   // Bulk recalculate
POST /snapshots/cleanup            // Cleanup old snapshots

// 4. Basic Statistics
GET /snapshots/statistics/:portfolioId // Basic statistics
```

### PerformanceSnapshotController Examples

```typescript
// 1. Performance Calculations
GET /performance-snapshots/portfolio/:portfolioId/summary
GET /performance-snapshots/asset/:portfolioId/summary
GET /performance-snapshots/group/:portfolioId/summary

// 2. Time-based Analysis
GET /performance-snapshots/monthly-returns/:portfolioId
GET /performance-snapshots/quarterly-performance/:portfolioId
GET /performance-snapshots/yearly-comparison/:portfolioId

// 3. Risk Analysis
GET /performance-snapshots/risk-metrics/:portfolioId
GET /performance-snapshots/volatility-analysis/:portfolioId
GET /performance-snapshots/drawdown-analysis/:portfolioId

// 4. Benchmark Comparison
GET /performance-snapshots/benchmark-comparison/:portfolioId
GET /performance-snapshots/alpha-beta/:portfolioId
```

## Specific Example: Monthly Returns API

### Question: "Where should I implement the monthly returns API?"

**Analysis:**
- ✅ Calculates performance metrics (TWR, MWR, IRR)
- ✅ Time-based analysis (monthly periods)
- ✅ Risk analysis (volatility, Sharpe ratio)
- ✅ Benchmark comparison
- ✅ Generates performance summary

**Decision:** → `PerformanceSnapshotController`

### Implementation:

```typescript
// File: src/modules/portfolio/controllers/performance-snapshot.controller.ts

@Get('monthly-returns/:portfolioId')
@ApiOperation({ summary: 'Get monthly returns for portfolio' })
@ApiParam({ name: 'portfolioId', description: 'Portfolio ID' })
@ApiQuery({ name: 'year', required: false, description: 'Year (YYYY)' })
@ApiQuery({ name: 'startMonth', required: false, description: 'Start month (MM)' })
@ApiQuery({ name: 'endMonth', required: false, description: 'End month (MM)' })
async getMonthlyReturns(
  @Param('portfolioId', ParseUUIDPipe) portfolioId: string,
  @Query('year') year?: string,
  @Query('startMonth') startMonth?: string,
  @Query('endMonth') endMonth?: string
): Promise<MonthlyReturnsResponse> {
  return await this.performanceSnapshotService.getMonthlyReturns(
    portfolioId,
    year,
    startMonth,
    endMonth
  );
}
```

## File Structure

```
src/modules/portfolio/controllers/
├── snapshot.controller.ts              // Basic snapshot operations
└── performance-snapshot.controller.ts  // Performance analysis operations
```

## API Endpoints

### SnapshotController Base Path
```
/snapshots
```

### PerformanceSnapshotController Base Path
```
/api/v1/performance-snapshots
```

## Best Practices

1. **Consistent Naming**: Use consistent naming patterns within each controller
2. **Clear Documentation**: Document all endpoints with Swagger/OpenAPI
3. **Proper Validation**: Use appropriate validation decorators
4. **Error Handling**: Implement consistent error handling
5. **Response Format**: Use consistent response formats
6. **Service Layer**: Delegate business logic to service layer

## Maintenance

This document should be updated when:
- New controller patterns are established
- New decision criteria are identified
- API structure changes significantly
- New examples are added

## Related Documents

- [API Documentation](../api/README.md)
- [Controller Guidelines](../development/controller-guidelines.md)
- [Service Layer Patterns](../development/service-patterns.md)
- [Snapshot System Architecture](../architecture/snapshot-system.md)

---

**Last Updated:** 2024-12-19  
**Version:** 1.0  
**Maintainer:** Development Team
