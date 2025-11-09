# Controller Quick Reference

## 🚀 Quick Decision Guide

### When to Use SnapshotController
- ✅ **CRUD Operations** (Create, Read, Update, Delete)
- ✅ **Data Management** (Raw snapshot data)
- ✅ **Bulk Operations** (Bulk recalculate, cleanup)
- ✅ **Basic Statistics** (Counts, simple aggregations)

### When to Use PerformanceSnapshotController
- ✅ **Performance Calculations** (TWR, MWR, IRR, Alpha, Beta)
- ✅ **Analytics & Reports** (Advanced analytics)
- ✅ **Risk Analysis** (Sharpe, Volatility, Max Drawdown)
- ✅ **Benchmark Comparison** (Performance vs benchmark)
- ✅ **Time-based Analysis** (Monthly, quarterly, yearly)

## 📋 Quick Decision Questions

1. **Does it calculate performance metrics?** → PerformanceSnapshotController
2. **Does it create/update/delete data?** → SnapshotController
3. **Does it analyze risk?** → PerformanceSnapshotController
4. **Does it compare with benchmarks?** → PerformanceSnapshotController
5. **Does it generate reports?** → PerformanceSnapshotController

## 🎯 Common Examples

| **API Type** | **Controller** | **Example Endpoint** |
|--------------|----------------|---------------------|
| Monthly Returns | PerformanceSnapshotController | `GET /performance-snapshots/monthly-returns/:id` |
| Create Snapshot | SnapshotController | `POST /snapshots` |
| Risk Analysis | PerformanceSnapshotController | `GET /performance-snapshots/risk-metrics/:id` |
| Update Snapshot | SnapshotController | `PUT /snapshots/:id` |
| Benchmark Comparison | PerformanceSnapshotController | `GET /performance-snapshots/benchmark-comparison/:id` |
| Bulk Recalculate | SnapshotController | `POST /snapshots/bulk-recalculate/:id` |

## 📁 File Locations

```
src/modules/portfolio/controllers/
├── snapshot.controller.ts              // Basic operations
└── performance-snapshot.controller.ts  // Performance analysis
```

## 🔗 Base Paths

- **SnapshotController**: `/snapshots`
- **PerformanceSnapshotController**: `/api/v1/performance-snapshots`

---

**For detailed information, see:** [Controller Decision Matrix](./controller-decision-matrix.md)
