# Global Assets System

## Overview

The Global Assets System is a comprehensive solution for managing financial assets across multiple nations and markets. It provides a unified interface for asset management with support for multi-national configurations, separate pricing systems, and system resilience.

## Features

### 🌍 Multi-National Support
- Support for assets from multiple countries (VN, US, UK, JP, SG)
- Nation-specific market codes, currencies, and timezones
- Configurable symbol formats per nation and asset type
- Localized market information

### 💰 Separated Pricing System
- Independent price management for each asset
- Multiple price sources (manual, market data, external APIs)
- Price history tracking for audit and analytics
- Real-time price updates with change tracking

### 🛡️ System Resilience
- Core functionality always available
- Graceful degradation when optional services are unavailable
- Fallback strategies for price data
- Robust error handling and recovery

### 📊 Advanced Analytics
- Price change tracking and percentage calculations
- Historical price analysis
- Market statistics and trends
- Bulk operations for efficient data management

## Architecture

### Core Components

1. **GlobalAsset Entity**
   - Represents a financial asset with multi-national support
   - Unique identification by symbol + nation combination
   - Nation-specific market information

2. **AssetPrice Entity**
   - Current price data for each asset
   - Multiple price sources and types
   - Real-time price tracking

3. **AssetPriceHistory Entity**
   - Historical price changes for audit and analytics
   - Price change reasons and metadata
   - Time-series data for trend analysis

4. **NationConfigService**
   - Nation-specific configuration management
   - Symbol format validation
   - Market information and defaults

### Database Schema

```sql
-- Global Assets Table
CREATE TABLE global_assets (
    id UUID PRIMARY KEY,
    symbol VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL,
    nation VARCHAR(2) NOT NULL,
    market_code VARCHAR(20) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    timezone VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(symbol, nation)
);

-- Asset Prices Table
CREATE TABLE asset_prices (
    id UUID PRIMARY KEY,
    asset_id UUID NOT NULL REFERENCES global_assets(id),
    current_price NUMERIC(15,2) NOT NULL,
    price_type VARCHAR(20) NOT NULL,
    price_source VARCHAR(30) NOT NULL,
    last_price_update TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Asset Price History Table
CREATE TABLE asset_price_history (
    id UUID PRIMARY KEY,
    asset_id UUID NOT NULL REFERENCES global_assets(id),
    price NUMERIC(15,2) NOT NULL,
    price_type VARCHAR(20) NOT NULL,
    price_source VARCHAR(30) NOT NULL,
    change_reason VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Global Assets Management

- `GET /api/assets/global` - List all global assets
- `GET /api/assets/global/{id}` - Get asset by ID
- `POST /api/assets/global` - Create new asset
- `PUT /api/assets/global/{id}` - Update asset
- `DELETE /api/assets/global/{id}` - Delete asset

### Asset Pricing

- `GET /api/assets/prices` - List all asset prices
- `GET /api/assets/prices/{id}` - Get price by ID
- `GET /api/assets/prices/asset/{assetId}` - Get price by asset ID
- `POST /api/assets/prices` - Create new price
- `PUT /api/assets/prices/{id}` - Update price
- `DELETE /api/assets/prices/{id}` - Delete price

### Price History & Analytics

- `GET /api/assets/prices/{assetId}/history` - Get price history
- `GET /api/assets/prices/statistics` - Get price statistics
- `POST /api/assets/prices/bulk-update` - Bulk update prices

### Nation Configuration

- `GET /api/assets/global/nations` - Get supported nations
- `GET /api/assets/global/nations/{code}/config` - Get nation config
- `GET /api/assets/global/validate-symbol` - Validate symbol format

## Configuration

### Nation Configuration

The system uses a JSON configuration file to define nation-specific settings:

```json
{
  "VN": {
    "code": "VN",
    "name": "Vietnam",
    "currency": "VND",
    "timezone": "Asia/Ho_Chi_Minh",
    "marketCodes": [
      {
        "code": "HOSE",
        "displayName": "Ho Chi Minh Stock Exchange"
      }
    ],
    "defaultPriceSource": "MARKET_DATA_SERVICE",
    "assetTypes": {
      "STOCK": {
        "enabled": true,
        "symbolPattern": "^[A-Z0-9]{3}$",
        "defaultMarketCode": "HOSE"
      }
    }
  }
}
```

### Environment Variables

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=portfolio_db
DB_USER=portfolio_user
DB_PASSWORD=portfolio_password

# API Configuration
API_PORT=3000
API_PREFIX=api

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

## Usage Examples

### Creating a Global Asset

```typescript
const asset = await globalAssetService.create({
  symbol: 'HPG',
  name: 'Hoa Phat Group',
  type: AssetType.STOCK,
  nation: 'VN',
  marketCode: 'HOSE',
  currency: 'VND',
  timezone: 'Asia/Ho_Chi_Minh',
  description: 'Leading steel manufacturer in Vietnam'
});
```

### Setting Asset Price

```typescript
const price = await basicPriceService.create({
  assetId: asset.id,
  currentPrice: 50000,
  priceType: PriceType.MARKET_DATA,
  priceSource: PriceSource.MARKET_DATA_SERVICE,
  lastPriceUpdate: new Date().toISOString()
});
```

### Getting Price History

```typescript
const history = await basicPriceService.getPriceHistory(asset.id, {
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  page: 1,
  limit: 10
});
```

## Error Handling

The system implements comprehensive error handling:

### Validation Errors
- Input validation with detailed error messages
- Business rule validation (e.g., symbol format, nation codes)
- Constraint validation (e.g., unique symbol + nation combination)

### Business Logic Errors
- Asset modification restrictions (e.g., cannot modify assets with trades)
- Price update validation (e.g., positive prices only)
- Nation configuration validation

### System Errors
- Database connection errors
- External service failures
- Rate limiting and throttling

## Performance Considerations

### Database Optimization
- Indexed columns for fast queries
- Pagination for large datasets
- Efficient relationship loading

### Caching Strategy
- Nation configuration caching
- Price data caching with TTL
- Query result caching

### Rate Limiting
- API endpoint rate limiting
- Bulk operation throttling
- Resource usage monitoring

## Security

### Authentication & Authorization
- JWT-based authentication
- Role-based access control
- API key management

### Data Protection
- Input sanitization and validation
- SQL injection prevention
- XSS protection

### Audit Logging
- All price changes logged
- User action tracking
- System event logging

## Monitoring & Observability

### Health Checks
- Database connectivity
- External service availability
- System resource usage

### Metrics
- API response times
- Error rates
- Database performance
- Cache hit rates

### Logging
- Structured logging with correlation IDs
- Error tracking and alerting
- Performance monitoring

## Deployment

### Docker Support
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Configuration
```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=portfolio_db
    depends_on:
      - postgres
  
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=portfolio_db
      - POSTGRES_USER=portfolio_user
      - POSTGRES_PASSWORD=portfolio_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Testing

### Unit Tests
- Service layer testing
- Entity validation testing
- Utility function testing

### Integration Tests
- API endpoint testing
- Database integration testing
- External service mocking

### End-to-End Tests
- Complete workflow testing
- User scenario testing
- Performance testing

## Contributing

### Development Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run database migrations: `npm run migration:run`
5. Start development server: `npm run start:dev`

### Code Standards
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Jest for testing

### Pull Request Process
1. Create feature branch
2. Write tests for new functionality
3. Ensure all tests pass
4. Submit pull request with description
5. Code review and approval
6. Merge to main branch

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation wiki

## Changelog

### Version 1.0.0 (2024-01-15)
- Initial release of Global Assets System
- Multi-national asset support
- Separated pricing system
- Nation configuration management
- System resilience features
- Comprehensive API documentation
