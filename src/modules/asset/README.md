# Asset Module

## Overview
The Asset Module provides comprehensive asset management functionality for the Portfolio Management System. It handles the complete lifecycle of assets including creation, updates, deletion, analytics, and reporting.

## Status
✅ **All tests passing (173/173)**  
✅ **Full CRUD operations**  
✅ **Advanced analytics and reporting**  
✅ **Risk metrics and performance tracking**  
✅ **Comprehensive validation and error handling**

## Features

### Core Operations
- **Asset CRUD**: Create, read, update, delete assets
- **Asset Search**: Advanced search with filters and pagination
- **Asset Validation**: Comprehensive input validation and business rules
- **Asset Analytics**: Performance metrics, risk analysis, and reporting

### Analytics & Reporting
- **Portfolio Value Calculation**: Total portfolio value and allocation
- **Performance Metrics**: Returns, volatility, and performance comparison
- **Risk Metrics**: VaR, Sharpe ratio, concentration risk, beta
- **Asset Allocation**: Distribution by asset type and value
- **Diversification Analysis**: Portfolio diversification scoring

### Data Management
- **Asset Types**: Support for STOCK, BOND, GOLD, DEPOSIT, CASH
- **Quantity Tracking**: Initial and current quantity management
- **Value Tracking**: Initial and current value management
- **Trade Integration**: Links to trading operations
- **Portfolio Integration**: Multi-portfolio asset management

## API Endpoints

### Asset Management
- `POST /api/v1/assets` - Create new asset
- `GET /api/v1/assets` - Get paginated assets with filters
- `GET /api/v1/assets/:id` - Get asset by ID
- `PUT /api/v1/assets/:id` - Update asset
- `DELETE /api/v1/assets/:id` - Delete asset

### Asset Search & Filtering
- `GET /api/v1/assets/search` - Search assets by term
- `GET /api/v1/assets/portfolio/:portfolioId` - Get assets by portfolio
- `GET /api/v1/assets/recent` - Get recent assets
- `GET /api/v1/assets/value-range` - Get assets in value range

### Analytics & Reporting
- `GET /api/v1/assets/analytics/:portfolioId` - Get comprehensive analytics
- `GET /api/v1/assets/performance/:portfolioId` - Get performance comparison
- `GET /api/v1/assets/allocation/:portfolioId` - Get asset allocation
- `GET /api/v1/assets/risk/:portfolioId` - Get risk metrics
- `GET /api/v1/assets/statistics/:portfolioId` - Get asset statistics

## Architecture

### Services
- **AssetService**: Core business logic and orchestration
- **AssetValidationService**: Input validation and business rules
- **AssetAnalyticsService**: Analytics calculations and reporting

### Repositories
- **AssetRepository**: Data access layer with TypeORM

### DTOs
- **CreateAssetDto**: Asset creation input
- **UpdateAssetDto**: Asset update input
- **AssetResponseDto**: Asset response format
- **Analytics DTOs**: Various analytics response formats

### Entities
- **Asset**: Core asset entity with computed properties

## Testing
- **Unit Tests**: 173 tests covering all functionality
- **Service Tests**: Business logic validation
- **Controller Tests**: API endpoint testing
- **Repository Tests**: Data access testing
- **Entity Tests**: Domain model testing

## Recent Updates
- Fixed all test failures and TypeScript errors
- Updated mock data structures to match actual DTOs
- Enhanced error handling and validation
- Improved analytics calculations
- Added comprehensive test coverage

## Usage Examples

### Create Asset
```typescript
const createAssetDto: CreateAssetDto = {
  name: 'Apple Inc.',
  code: 'AAPL',
  type: AssetType.STOCK,
  description: 'Technology company',
  initialValue: 1000000,
  initialQuantity: 100,
  currentValue: 1200000,
  currentQuantity: 100,
  portfolioId: 'portfolio-id'
};
```

### Get Analytics
```typescript
const analytics = await assetAnalyticsService.generateAssetSummary(portfolioId);
// Returns comprehensive analytics including:
// - Total value and allocation
// - Performance metrics
// - Risk metrics
// - Diversification score
```

## Dependencies
- NestJS Framework
- TypeORM for database operations
- Class-validator for validation
- Swagger for API documentation
- Jest for testing
