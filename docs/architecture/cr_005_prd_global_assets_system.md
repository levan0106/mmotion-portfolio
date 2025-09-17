# CR-005: Global Assets System Implementation

## Document Information
- **Change Request ID**: CR-005
- **Document Type**: Product Requirements Document (PRD)
- **Version**: 1.0
- **Created Date**: September 17, 2025
- **Author**: AI Assistant
- **Status**: Draft

## Executive Summary

### Overview
Implement a comprehensive Global Assets System that supports multi-national asset management with separate pricing data storage. This system will replace the current single-nation asset management with a global approach that supports different markets, currencies, and pricing sources.

### Business Justification
- **Multi-national Support**: Enable users to manage assets across different countries (Vietnam, US, etc.)
- **Price Data Separation**: Separate asset metadata from pricing data for better performance and flexibility
- **Market Differentiation**: Support different prices for same asset symbols across different nations
- **Scalability**: Prepare for future market data integration and real-time pricing updates

### Success Criteria
- Users can create assets with nation-specific symbols
- Price data is stored separately and can be updated independently
- System supports multiple currencies and timezones
- Existing asset data is migrated without data loss
- All current functionality continues to work

## Problem Statement

### Current State
- Assets are stored in a single `assets` table with limited scope
- Price data is mixed with asset metadata
- No support for multi-national asset management
- Limited flexibility for different pricing sources
- Difficult to scale for global markets

### Pain Points
1. **Single Nation Limitation**: Current system only supports one market/nation
2. **Price Data Coupling**: Asset metadata and pricing data are tightly coupled
3. **Symbol Conflicts**: Same symbol across different nations causes conflicts
4. **Pricing Flexibility**: Limited ability to handle different pricing sources
5. **Scalability Issues**: Current structure doesn't scale for global markets

### Desired State
- Global asset management with nation-specific symbols
- Separated pricing data storage
- Support for multiple markets, currencies, and timezones
- Flexible pricing data sources (market data, manual input)
- Scalable architecture for future enhancements

## Functional Requirements

### FR-001: Global Assets Management
**Priority**: High
**Description**: Create a global assets system that supports multi-national asset management

**Acceptance Criteria**:
- [ ] Users can create assets with nation-specific symbols
- [ ] Same symbol can exist across different nations
- [ ] Asset metadata includes nation, market code (symbol), currency, timezone
- [ ] Asset creation validates symbol uniqueness per nation
- [ ] Asset listing shows nation-specific information

**User Stories**:
- As a user, I want to create assets for different countries so I can manage my global portfolio
- As a user, I want to see which nation an asset belongs to so I can understand the market context
- As a user, I want to create assets with the same symbol in different nations so I can track global positions

### FR-002: Asset Pricing System
**Priority**: High
**Description**: Implement separate asset pricing system with flexible data sources

**Acceptance Criteria**:
- [ ] Price data is stored in separate `asset_prices` table
- [ ] **New assets are created WITHOUT price data initially** (price = null when joined)
- [ ] Price records are created only when user manually sets price or market data updates
- [ ] Price data can be updated independently from asset metadata
- [ ] System supports multiple price sources (market data, manual input)
- [ ] Price history is maintained for audit purposes

**User Stories**:
- As a user, I want price data to be updated independently so I can get real-time market prices
- As a user, I want to create assets without price data initially so I can add pricing later
- As a user, I want to see price history so I can track price changes over time
- As a system, I want to handle assets with and without price data gracefully

### FR-003: Nation Configuration System
**Priority**: Medium
**Description**: Implement nation configuration system with default values

**Acceptance Criteria**:
- [ ] System supports multiple nations (Vietnam, US, etc.)
- [ ] Each nation has default currency, timezone, and market codes
- [ ] Nation configuration is easily extensible
- [ ] Default values are applied when creating new assets
- [ ] Nation-specific validation rules are enforced

**User Stories**:
- As a system, I want to apply default values based on nation so users don't need to specify everything
- As a user, I want to see nation-specific information so I can understand the market context
- As a developer, I want to easily add new nations so the system can scale globally

### FR-004: Data Migration
**Priority**: High
**Description**: Migrate existing asset data to new global assets system

**Acceptance Criteria**:
- [ ] Existing assets are migrated to `global_assets` table
- [ ] Price records are created for existing assets
- [ ] Data integrity is maintained during migration
- [ ] Migration is reversible
- [ ] No data loss occurs during migration

**User Stories**:
- As a user, I want my existing assets to continue working so I don't lose data
- As a system, I want to migrate data safely so no information is lost
- As a developer, I want migration to be reversible so I can rollback if needed

### FR-005: Asset Creation Logic
**Priority**: High
**Description**: Implement flexible asset creation with optional pricing

**Acceptance Criteria**:
- [ ] Users can create assets without price data initially
- [ ] Asset creation only inserts into `global_assets` table
- [ ] `asset_prices` table remains empty until price is set
- [ ] JOIN queries return null for price when no price data exists
- [ ] Users can add price data later through separate API
- [ ] System handles both priced and unpriced assets gracefully

**User Stories**:
- As a user, I want to create assets quickly without setting price initially
- As a user, I want to add price data later when I have the information
- As a system, I want to handle assets with missing price data without errors
- As a developer, I want clear separation between asset creation and price setting

### FR-006: Backward Compatibility
**Priority**: High
**Description**: Ensure all existing functionality continues to work

**Acceptance Criteria**:
- [ ] All existing API endpoints continue to work
- [ ] Frontend components display data correctly
- [ ] Portfolio calculations work with new structure
- [ ] Trading system continues to function
- [ ] No breaking changes to existing features

**User Stories**:
- As a user, I want all my existing features to continue working so I can use the system normally
- As a developer, I want the migration to be transparent so existing code doesn't break
- As a system, I want to maintain data consistency so calculations remain accurate

## Non-Functional Requirements

### NFR-001: Performance
**Description**: System should maintain or improve current performance levels

**Acceptance Criteria**:
- [ ] Asset listing performance is maintained or improved
- [ ] Price updates don't impact asset metadata queries
- [ ] Database queries are optimized for new structure
- [ ] Caching strategy is implemented for price data

### NFR-002: Scalability
**Description**: System should scale to support multiple nations and markets

**Acceptance Criteria**:
- [ ] Database schema supports unlimited nations
- [ ] Price data can be updated independently
- [ ] System can handle high-frequency price updates
- [ ] Architecture supports future market data integration

### NFR-003: Data Integrity
**Description**: Ensure data consistency and integrity across the system

**Acceptance Criteria**:
- [ ] Foreign key constraints are properly maintained
- [ ] Price data is always associated with valid assets
- [ ] Data validation prevents invalid combinations
- [ ] Audit trail is maintained for price changes

### NFR-004: Maintainability
**Description**: Code should be maintainable and extensible

**Acceptance Criteria**:
- [ ] Clear separation of concerns between asset metadata and pricing
- [ ] Configuration system is easily extensible
- [ ] Code follows existing project patterns
- [ ] Comprehensive documentation is provided

## Technical Requirements

### TR-001: Database Schema
**Description**: Implement new database schema for global assets system

**Requirements**:
- [ ] Create `global_assets` table (metadata only)
- [ ] Create `asset_prices` table (current price data, optional)
- [ ] Create `asset_price_history` table for audit trail
- [ ] Implement proper foreign key relationships
- [ ] Add appropriate indexes for performance
- [ ] Create migration scripts for data transformation

### TR-002: API Updates
**Description**: Update existing APIs to work with new structure

**Requirements**:
- [ ] Update asset creation endpoints
- [ ] Update asset listing endpoints
- [ ] Update portfolio calculation logic
- [ ] Maintain backward compatibility
- [ ] Add new endpoints for price management

### TR-003: Frontend Updates
**Description**: Update frontend to display nation-specific information

**Requirements**:
- [ ] Update asset forms to include nation selection
- [ ] Update asset lists to show nation information
- [ ] Update portfolio views to handle new structure
- [ ] Maintain existing UI/UX patterns
- [ ] Add nation-specific validation

### TR-004: Service Layer Updates
**Description**: Update service layer to handle new data structure

**Requirements**:
- [ ] Update asset service for global assets
- [ ] Create asset prices service (optional price data)
- [ ] Create price history service for audit trail
- [ ] Update portfolio calculation service
- [ ] Update trading service if needed
- [ ] Implement nation configuration service (JSON file)

## Data Requirements

### DR-001: Global Assets Data Structure
**Description**: Define data structure for global assets (metadata only)

**Fields**:
- `id`: Primary key
- `symbol`: Asset symbol (unique per nation)
- `name`: Asset name
- `type`: Asset type (STOCK, BOND, GOLD, etc.)
- `nation`: Nation code (VN, US, etc.)
- `marketCode`: Market code (HOSE, NYSE, etc.)
- `currency`: Currency code (VND, USD, etc.)
- `timezone`: Timezone (Asia/Ho_Chi_Minh, America/New_York, etc.)
- `isActive`: Active status
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### DR-002: Asset Prices Data Structure
**Description**: Define data structure for current asset prices (separate table)

**Fields**:
- `id`: Primary key
- `assetId`: Foreign key to global_assets (unique constraint)
- `currentPrice`: Current price (DECIMAL(15,4))
- `priceType`: Price type (MANUAL, MARKET, etc.)
- `priceSource`: Price source (USER_INPUT, MARKET_DATA, etc.)
- `lastUpdated`: Last price update timestamp
- `isActive`: Active status
- `createdAt`: Creation timestamp

**Note**: This table is optional - assets can exist without price data (price = null when joined)

### DR-003: Price History Data Structure
**Description**: Define data structure for asset price history (audit trail)

**Fields**:
- `id`: Primary key
- `assetId`: Foreign key to global_assets
- `price`: Price value (DECIMAL(15,4))
- `priceType`: Price type (MANUAL, MARKET, etc.)
- `priceSource`: Price source (USER_INPUT, MARKET_DATA, etc.)
- `changeReason`: Reason for price change
- `createdAt`: Creation timestamp

### DR-004: Nation Configuration (JSON File)
**Description**: Define nation configuration structure using JSON file

**File Location**: `src/modules/asset/config/nation-config.json`

**Structure**:
```json
{
  "VN": {
    "name": "Vietnam",
    "currency": "VND",
    "timezone": "Asia/Ho_Chi_Minh",
    "defaultMarketCode": "HOSE",
    "markets": ["HOSE", "HNX", "UPCOM"]
  },
  "US": {
    "name": "United States", 
    "currency": "USD",
    "timezone": "America/New_York",
    "defaultMarketCode": "NYSE",
    "markets": ["NYSE", "NASDAQ", "AMEX"]
  }
}
```

## User Experience Requirements

### UX-001: Asset Creation
**Description**: Users should be able to create assets with nation selection

**Requirements**:
- [ ] Nation selection dropdown with clear labels
- [ ] Symbol validation per nation
- [ ] Default values pre-filled based on nation
- [ ] Clear error messages for validation failures
- [ ] Confirmation of successful creation

### UX-002: Asset Listing
**Description**: Users should see nation-specific information in asset lists

**Requirements**:
- [ ] Nation flag or code displayed
- [ ] Currency information shown
- [ ] Market information displayed
- [ ] Sorting and filtering by nation
- [ ] Clear visual distinction between nations

### UX-003: Price Display
**Description**: Users should see current prices with source information

**Requirements**:
- [ ] Current price prominently displayed
- [ ] Price source indicated (market data, manual, etc.)
- [ ] Last update timestamp shown
- [ ] Price change indicators
- [ ] Historical price access

## Integration Requirements

### IR-001: Market Data Integration
**Description**: Prepare for future market data integration

**Requirements**:
- [ ] Price service interface for external data
- [ ] Webhook endpoints for price updates
- [ ] Data validation for external sources
- [ ] Fallback mechanisms for data failures
- [ ] Rate limiting and error handling

### IR-002: Portfolio System Integration
**Description**: Ensure portfolio calculations work with new structure

**Requirements**:
- [ ] Portfolio value calculations use new price data
- [ ] Asset allocation calculations work correctly
- [ ] Performance metrics remain accurate
- [ ] Trading system continues to function
- [ ] Analytics system works with new structure

## Security Requirements

### SR-001: Data Access Control
**Description**: Ensure proper access control for global assets

**Requirements**:
- [ ] Users can only access their own assets
- [ ] Price data access is controlled
- [ ] Nation-specific data is properly isolated
- [ ] Audit trail for all data changes
- [ ] Input validation for all user inputs

### SR-002: Data Validation
**Description**: Ensure data integrity and validation

**Requirements**:
- [ ] Symbol uniqueness validation per nation
- [ ] Price data validation
- [ ] Nation code validation
- [ ] Currency code validation
- [ ] Market code validation

## Testing Requirements

### TR-001: Unit Testing
**Description**: Comprehensive unit tests for all new functionality

**Requirements**:
- [ ] Test asset creation with nation selection
- [ ] Test price data management
- [ ] Test nation configuration system
- [ ] Test data migration scripts
- [ ] Test validation logic

### TR-002: Integration Testing
**Description**: Test integration between components

**Requirements**:
- [ ] Test API endpoints with new structure
- [ ] Test frontend integration
- [ ] Test portfolio calculations
- [ ] Test trading system integration
- [ ] Test data migration process

### TR-003: End-to-End Testing
**Description**: Test complete user workflows

**Requirements**:
- [ ] Test asset creation workflow
- [ ] Test portfolio management workflow
- [ ] Test trading workflow
- [ ] Test price update workflow
- [ ] Test data migration workflow

## Dependencies

### Internal Dependencies
- **Portfolio System**: Must work with new asset structure
- **Trading System**: Must work with new asset structure
- **Frontend Components**: Must display new data structure
- **Database Migration**: Must preserve existing data

### External Dependencies
- **Market Data Services**: Future integration for real-time prices
- **Currency Exchange Services**: Future integration for multi-currency support
- **Timezone Services**: For nation-specific timezone handling

## Risks and Mitigation

### High Risk
1. **Data Migration Failure**: Risk of data loss during migration
   - **Mitigation**: Comprehensive backup, reversible migration, extensive testing
2. **Performance Degradation**: Risk of slower queries with new structure
   - **Mitigation**: Performance testing, query optimization, caching strategy

### Medium Risk
1. **Breaking Changes**: Risk of breaking existing functionality
   - **Mitigation**: Comprehensive testing, backward compatibility, gradual rollout
2. **User Confusion**: Risk of users being confused by new interface
   - **Mitigation**: Clear UI/UX design, user training, documentation

### Low Risk
1. **Configuration Complexity**: Risk of complex nation configuration
   - **Mitigation**: Simple configuration system, good documentation, default values

## Success Metrics

### Functional Metrics
- [ ] 100% of existing assets migrated successfully
- [ ] 100% of existing functionality continues to work
- [ ] 0 data loss during migration
- [ ] All new features work as specified

### Performance Metrics
- [ ] Asset listing performance maintained or improved
- [ ] Price update performance under 1 second
- [ ] Database query performance maintained
- [ ] Frontend rendering performance maintained

### User Experience Metrics
- [ ] User satisfaction with new interface
- [ ] Reduced user confusion
- [ ] Improved asset management efficiency
- [ ] Clear understanding of nation-specific data

## Acceptance Criteria

### Phase 1: Foundation
- [ ] Database schema implemented
- [ ] Nation configuration system working
- [ ] Basic asset creation with nation selection
- [ ] Price data storage working

### Phase 2: Migration
- [ ] Data migration completed successfully
- [ ] All existing data preserved
- [ ] Migration is reversible
- [ ] No data loss occurred

### Phase 3: Integration
- [ ] All existing APIs working
- [ ] Frontend displaying new data correctly
- [ ] Portfolio calculations working
- [ ] Trading system working

### Phase 4: Enhancement
- [ ] New features working as specified
- [ ] Performance requirements met
- [ ] User experience requirements met
- [ ] All tests passing

## Conclusion

This PRD defines the requirements for implementing a Global Assets System that will significantly enhance the portfolio management capabilities by supporting multi-national asset management and separated pricing data storage. The implementation will be done in phases to ensure minimal disruption to existing functionality while providing a solid foundation for future enhancements.

The success of this project will be measured by the successful migration of existing data, maintenance of all current functionality, and the successful implementation of new global asset management capabilities.
