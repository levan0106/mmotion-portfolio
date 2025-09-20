# CR-006: Asset-Level Multi-Granularity Snapshot System with P&L Tracking

## Document Information
- **Document Type**: Product Requirements Document (PRD)
- **Change Request ID**: CR-006
- **Feature Name**: Asset-Level Multi-Granularity Snapshot System with P&L Tracking
- **Version**: 1.0
- **Date**: December 19, 2024
- **Author**: System Architect
- **Status**: Draft

## Executive Summary

### Overview
This document defines the requirements for implementing a comprehensive asset-level snapshot system that captures portfolio allocation and P&L data at multiple granularities (daily, weekly, monthly). This system will replace the current trade-based historical calculations in the Allocation Timeline feature, providing more accurate historical data and enabling flexible analysis capabilities.

### Business Justification
- **Accuracy**: Current trade-based calculations for historical months are less accurate than snapshot-based data
- **Performance**: Snapshot-based queries are significantly faster than complex trade calculations
- **Flexibility**: Multi-granularity snapshots enable detailed analysis at different time scales
- **P&L Tracking**: Complete historical P&L tracking for performance analysis and risk management
- **User Experience**: Enhanced timeline controls and interactive analysis capabilities

### Success Criteria
- Historical allocation data accuracy improved by 95%+
- Timeline query performance improved by 80%+
- Support for daily, weekly, and monthly granularities
- Complete P&L tracking for all assets over time
- Seamless user experience with flexible timeline controls

## Current State Analysis

### Existing System
- **Phase 1 Completed**: Hybrid timeline implementation with current month using real-time data
- **Current Limitation**: Historical months use trade-based calculations which are less accurate
- **Performance Issue**: Complex trade calculations for historical data are slow
- **Data Gap**: No historical P&L tracking for performance analysis

### Pain Points
1. **Accuracy**: Trade-based historical calculations don't reflect actual portfolio state
2. **Performance**: Slow timeline queries due to complex trade calculations
3. **Analysis**: Limited ability to analyze asset performance over time
4. **Flexibility**: Fixed monthly granularity doesn't meet all user needs
5. **P&L Tracking**: No historical P&L data for performance analysis

## Requirements

### Functional Requirements

#### FR-001: Asset-Level Snapshot Storage
**Priority**: High
**Description**: Store individual asset snapshots with complete position and P&L data

**Acceptance Criteria**:
- Each asset has independent snapshot records
- Snapshots capture quantity, value, percentage, and P&L data
- Support for multiple granularities (daily, weekly, monthly)
- Efficient storage and retrieval of snapshot data

#### FR-002: Multi-Granularity Support
**Priority**: High
**Description**: Support daily, weekly, and monthly snapshot granularities

**Acceptance Criteria**:
- Daily snapshots: End-of-day asset positions and P&L
- Weekly snapshots: End-of-week aggregated data
- Monthly snapshots: End-of-month aggregated data
- User can query any granularity independently
- Smooth transitions between granularities

#### FR-003: P&L Tracking
**Priority**: High
**Description**: Complete P&L tracking for each asset over time

**Acceptance Criteria**:
- Realized P&L from closed trades
- Unrealized P&L from current positions
- Total P&L (realized + unrealized)
- P&L percentages relative to cost basis
- Historical P&L trends and analysis

#### FR-004: Flexible Querying
**Priority**: High
**Description**: Query snapshots by asset, asset type, granularity, and date range

**Acceptance Criteria**:
- Query by individual asset
- Query by asset type (STOCK, BOND, GOLD, etc.)
- Query by granularity (daily/weekly/monthly)
- Query by date range
- Support for complex filtering and sorting

#### FR-005: Timeline Integration
**Priority**: High
**Description**: Integrate snapshots with existing Allocation Timeline feature

**Acceptance Criteria**:
- Current period: Continue using real-time data (Phase 1 approach)
- Historical periods: Use snapshot data instead of trade calculations
- Maintain hybrid approach for optimal accuracy
- Backward compatibility with existing API

#### FR-006: Snapshot Generation
**Priority**: Medium
**Description**: Automated and manual snapshot generation

**Acceptance Criteria**:
- Automated daily snapshots at end of trading day
- Automated weekly snapshots on Sundays
- Automated monthly snapshots at month-end
- Manual snapshot generation capability
- Batch processing for multiple assets

#### FR-007: Data Migration
**Priority**: Medium
**Description**: Migrate existing trade data to snapshot format

**Acceptance Criteria**:
- Generate historical snapshots from existing trade data
- Preserve data accuracy during migration
- Handle edge cases and data inconsistencies
- Rollback capability if migration fails

#### FR-008: User Interface Enhancements
**Priority**: Medium
**Description**: Enhanced timeline controls and visualization

**Acceptance Criteria**:
- Granularity selector (daily/weekly/monthly)
- Asset selection dropdown
- Asset type filtering
- Date range picker
- Interactive charts with P&L data
- Performance metrics display

### Non-Functional Requirements

#### NFR-001: Performance
**Priority**: High
**Description**: Snapshot queries must be significantly faster than trade calculations

**Acceptance Criteria**:
- Timeline queries complete in <200ms (vs current 2-5s)
- Snapshot generation completes in <30s for all assets
- Support for 10,000+ snapshot records per portfolio
- Efficient pagination for large datasets

#### NFR-002: Scalability
**Priority**: High
**Description**: System must scale with growing portfolio and asset data

**Acceptance Criteria**:
- Support for 100+ assets per portfolio
- Support for 5+ years of historical data
- Efficient storage and retrieval at scale
- Horizontal scaling capability

#### NFR-003: Data Integrity
**Priority**: High
**Description**: Snapshot data must be accurate and consistent

**Acceptance Criteria**:
- Snapshot data matches real-time calculations
- P&L calculations are accurate to 2 decimal places
- Data consistency across all granularities
- Audit trail for all snapshot operations

#### NFR-004: Storage Optimization
**Priority**: Medium
**Description**: Efficient storage of snapshot data

**Acceptance Criteria**:
- Compress old daily snapshots after 1 year
- Keep recent daily snapshots uncompressed
- Efficient indexing for fast queries
- Data retention policies for different granularities

#### NFR-005: Reliability
**Priority**: High
**Description**: Snapshot system must be reliable and fault-tolerant

**Acceptance Criteria**:
- 99.9% uptime for snapshot operations
- Automatic retry for failed snapshot generation
- Data backup and recovery procedures
- Graceful degradation if snapshots unavailable

## User Stories

### US-001: Daily Asset Tracking
**As a** portfolio manager
**I want to** view daily asset allocation and P&L changes
**So that** I can track short-term performance and make timely decisions

**Acceptance Criteria**:
- View daily snapshots for any asset
- See P&L changes day-over-day
- Filter by asset type for focused analysis
- Export daily data for external analysis

### US-002: Weekly Performance Analysis
**As a** portfolio manager
**I want to** analyze weekly asset performance
**So that** I can identify trends and patterns

**Acceptance Criteria**:
- View weekly aggregated snapshots
- Compare weekly performance across assets
- Identify best/worst performing assets
- Track weekly P&L trends

### US-003: Monthly Historical Analysis
**As a** portfolio manager
**I want to** analyze monthly historical data
**So that** I can understand long-term performance and allocation changes

**Acceptance Criteria**:
- View monthly snapshots for historical analysis
- Compare monthly performance over time
- Track allocation changes month-over-month
- Generate monthly performance reports

### US-004: Asset Type Analysis
**As a** portfolio manager
**I want to** analyze performance by asset type
**So that** I can understand which asset classes are performing best

**Acceptance Criteria**:
- Group snapshots by asset type (STOCK, BOND, GOLD)
- Compare performance across asset types
- Track allocation changes by asset type
- Identify optimal asset type mix

### US-005: Flexible Timeline View
**As a** portfolio manager
**I want to** switch between daily, weekly, and monthly views
**So that** I can analyze data at the appropriate granularity

**Acceptance Criteria**:
- Seamless switching between granularities
- Consistent data across all views
- Appropriate level of detail for each granularity
- Smooth user experience

## Data Model

### AssetAllocationSnapshot Entity
```typescript
interface AssetAllocationSnapshot {
  id: string;
  portfolioId: string;
  assetId: string;
  assetType: AssetType;
  granularity: SnapshotGranularity;
  snapshotDate: Date;
  
  // Position Data
  quantity: number;
  value: number;
  percentage: number;
  
  // P&L Data
  realizedPl: number;
  unrealizedPl: number;
  totalPl: number;
  realizedPlPercentage: number;
  unrealizedPlPercentage: number;
  
  // Cost Basis Data
  avgCost: number;
  totalCost: number;
  currentPrice: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

enum SnapshotGranularity {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY'
}
```

### Database Indexes
- Primary: `(portfolioId, assetId, snapshotDate)`
- Asset Type: `(portfolioId, assetType, snapshotDate)`
- Granularity: `(portfolioId, granularity, snapshotDate)`
- Date Range: `(snapshotDate, portfolioId)`

## API Design

### Snapshot Management Endpoints
- `GET /api/v1/portfolios/{id}/snapshots` - Get snapshots with filtering
- `POST /api/v1/portfolios/{id}/snapshots/generate` - Generate snapshots
- `GET /api/v1/portfolios/{id}/snapshots/assets/{assetId}` - Get asset snapshots
- `GET /api/v1/portfolios/{id}/snapshots/types/{type}` - Get snapshots by asset type

### Timeline Integration Endpoints
- `GET /api/v1/portfolios/{id}/analytics/allocation-timeline` - Enhanced timeline with snapshot support
- `GET /api/v1/portfolios/{id}/analytics/performance-timeline` - New P&L timeline endpoint

## Dependencies

### Internal Dependencies
- PortfolioCalculationService (for current period calculations)
- TradingService (for P&L calculations)
- AssetService (for asset information)
- PortfolioAnalyticsService (for timeline integration)

### External Dependencies
- PostgreSQL (for snapshot storage)
- Redis (for caching)
- TypeORM (for database operations)

## Risks and Mitigation

### Risk 1: Data Migration Complexity
**Risk**: Migrating existing trade data to snapshots may be complex
**Mitigation**: 
- Phased migration approach
- Comprehensive testing
- Rollback procedures

### Risk 2: Storage Growth
**Risk**: Snapshot data may grow rapidly
**Mitigation**:
- Data retention policies
- Compression for old data
- Efficient indexing

### Risk 3: Performance Impact
**Risk**: Snapshot generation may impact system performance
**Mitigation**:
- Asynchronous generation
- Batch processing
- Performance monitoring

### Risk 4: Data Consistency
**Risk**: Snapshot data may become inconsistent with real-time data
**Mitigation**:
- Validation procedures
- Regular consistency checks
- Automatic correction mechanisms

## Success Metrics

### Performance Metrics
- Timeline query response time: <200ms (target)
- Snapshot generation time: <30s for all assets
- System uptime: 99.9%

### Accuracy Metrics
- Snapshot data accuracy: 99.9% match with real-time calculations
- P&L calculation accuracy: ±0.01% tolerance
- Data consistency: 100% across all granularities

### User Experience Metrics
- Timeline load time: <2s
- User satisfaction: 4.5/5 rating
- Feature adoption: 80% of users within 30 days

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- Database schema implementation
- Basic snapshot entity and repository
- Snapshot generation service

### Phase 2: Core Features (Week 3-4)
- Multi-granularity support
- P&L tracking implementation
- Basic query capabilities

### Phase 3: Integration (Week 5-6)
- Timeline integration
- API endpoints
- Data migration

### Phase 4: Enhancement (Week 7-8)
- UI enhancements
- Performance optimization
- Testing and validation

## Conclusion

The Asset-Level Multi-Granularity Snapshot System with P&L Tracking will significantly improve the accuracy and performance of historical portfolio analysis. This system will provide users with flexible, detailed insights into their portfolio performance while maintaining the real-time accuracy of current data.

The implementation will be phased to ensure minimal disruption to existing functionality while delivering maximum value to users.
