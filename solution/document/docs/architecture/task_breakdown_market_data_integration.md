# Task Breakdown: Market Data Integration Module

Based on the Technical Design Document for Market Data Integration Module, here is the comprehensive task breakdown:

## Status and Next Steps (Local-first)

- **Status**: Planning complete; ready for implementation
- **Immediate Priorities**:
  - [ ] DB schema (Tasks 1-5)
  - [ ] Basic API structure (Tasks 20-23, 24-28)
  - [ ] Local run verification (Swagger, healthchecks)
- **Local Run Targets**:
  - [ ] `GET /api/v1/market/prices` returns empty list 200
  - [ ] `POST /api/v1/market/prices` accepts manual price 201
  - [ ] Migrations run successfully against local Postgres

## Database

- [ ] **Task 1: Create Price entity with TypeORM decorators** (High Priority)
    - [ ] Define entity properties (asset_id, price_date, price, source, volume, change_pct, created_at)
    - [ ] Add composite primary key (asset_id, price_date)
    - [ ] Add @ManyToOne relationship to Asset entity
    - [ ] Add @CreateDateColumn decorator
    - [ ] Add indexes on asset_id, price_date, and source
    - [ ] Create database migration for Price table

- [ ] **Task 2: Create MarketDataSource entity for external API management**
    - [ ] Define entity properties (source_id, name, api_url, api_key, is_active, priority, timeout_ms, created_at)
    - [ ] Add @PrimaryGeneratedColumn for source_id
    - [ ] Add @CreateDateColumn decorator
    - [ ] Add indexes on is_active and priority
    - [ ] Create database migration for MarketDataSource table

- [ ] **Task 3: Create PriceAlert entity for price monitoring**
    - [ ] Define entity properties (alert_id, asset_id, target_price, alert_type, is_triggered, created_at, triggered_at)
    - [ ] Add @PrimaryGeneratedColumn for alert_id
    - [ ] Add @ManyToOne relationship to Asset entity
    - [ ] Add @CreateDateColumn and @UpdateDateColumn decorators
    - [ ] Add indexes on asset_id and is_triggered
    - [ ] Create database migration for PriceAlert table

- [ ] **Task 4: Create AssetSymbol entity for multi-source symbol mapping**
    - [ ] Define entity properties (asset_id, source, symbol, exchange, is_primary)
    - [ ] Add composite primary key (asset_id, source)
    - [ ] Add @ManyToOne relationship to Asset entity
    - [ ] Add indexes on source, symbol, and is_primary
    - [ ] Create database migration for AssetSymbol table

- [ ] **Task 5: Create database indexes for performance**
    - [ ] Add index on Price.asset_id
    - [ ] Add index on Price.price_date
    - [ ] Add index on Price.source
    - [ ] Add index on MarketDataSource.is_active
    - [ ] Add index on PriceAlert.asset_id
    - [ ] Add index on AssetSymbol.source

## External API Integration

- [ ] **Task 6: Create CafefAPIClient class**
    - [ ] Implement HTTP client for Cafef API
    - [ ] Add stock price fetching methods
    - [ ] Add gold price fetching methods
    - [ ] Implement error handling and retry logic
    - [ ] Add rate limiting and timeout handling
    - [ ] Implement data parsing and transformation
    - [ ] Add circuit breaker pattern

- [ ] **Task 7: Create VnDirectAPIClient class**
    - [ ] Implement HTTP client for VnDirect API
    - [ ] Add real-time stock data fetching
    - [ ] Add historical price data fetching
    - [ ] Implement error handling and retry logic
    - [ ] Add rate limiting and timeout handling
    - [ ] Implement data parsing and transformation
    - [ ] Add circuit breaker pattern

- [ ] **Task 8: Create VietcombankAPIClient class**
    - [ ] Implement HTTP client for Vietcombank API
    - [ ] Add exchange rate fetching methods
    - [ ] Add currency conversion methods
    - [ ] Implement error handling and retry logic
    - [ ] Add rate limiting and timeout handling
    - [ ] Implement data parsing and transformation
    - [ ] Add circuit breaker pattern

- [ ] **Task 9: Create ExternalAPIFactory class**
    - [ ] Implement factory pattern for API clients
    - [ ] Add client selection logic based on priority
    - [ ] Implement fallback mechanism
    - [ ] Add client health checking
    - [ ] Implement client configuration management
    - [ ] Add client performance monitoring

## Business Logic

- [ ] **Task 10: Create PriceValidator class**
    - [ ] Implement price data validation logic
    - [ ] Add price range validation
    - [ ] Add price change validation (anomaly detection)
    - [ ] Add data consistency validation
    - [ ] Implement validation rules configuration
    - [ ] Add validation error logging
    - [ ] Handle validation failures gracefully

- [ ] **Task 11: Create PriceProcessor class**
    - [ ] Implement price data processing logic
    - [ ] Add data normalization and cleaning
    - [ ] Implement price aggregation
    - [ ] Add data transformation logic
    - [ ] Implement price history management
    - [ ] Add data quality metrics
    - [ ] Handle processing errors

- [ ] **Task 12: Create DataSourceManager class**
    - [ ] Implement data source priority management
    - [ ] Add source health monitoring
    - [ ] Implement source failover logic
    - [ ] Add source performance tracking
    - [ ] Implement source configuration management
    - [ ] Add source status reporting
    - [ ] Handle source failures gracefully

- [ ] **Task 13: Create AlertManager class**
    - [ ] Implement price alert monitoring
    - [ ] Add alert trigger logic
    - [ ] Implement alert delivery methods
    - [ ] Add alert scheduling and batching
    - [ ] Implement alert history tracking
    - [ ] Add alert configuration management
    - [ ] Handle alert failures

## Backend Services

- [ ] **Task 14: Create PriceRepository class**
    - [ ] Extend Repository<Price> from TypeORM
    - [ ] Implement findCurrentPrices() method
    - [ ] Implement findPriceHistory() method
    - [ ] Implement findPricesByAsset() method
    - [ ] Implement findPricesByDateRange() method
    - [ ] Add custom query methods for price analytics
    - [ ] Implement price aggregation queries

- [ ] **Task 15: Create MarketDataSourceRepository class**
    - [ ] Extend Repository<MarketDataSource> from TypeORM
    - [ ] Implement findActiveSources() method
    - [ ] Implement findByPriority() method
    - [ ] Implement findByName() method
    - [ ] Add custom query methods for source management
    - [ ] Implement source health tracking queries

- [ ] **Task 16: Create MarketDataService class**
    - [ ] Inject PriceRepository, ExternalAPIFactory, and PriceValidator
    - [ ] Implement fetchCurrentPrices() method
    - [ ] Implement fetchPriceHistory() method
    - [ ] Implement updatePrices() method
    - [ ] Implement refreshAllPrices() method
    - [ ] Implement refreshAssetPrice() method
    - [ ] Add price caching with Redis
    - [ ] Implement error handling and fallback

- [ ] **Task 17: Create PriceUpdateService class**
    - [ ] Inject MarketDataService and WebSocketService
    - [ ] Implement scheduled price updates
    - [ ] Implement batch price processing
    - [ ] Implement real-time price broadcasting
    - [ ] Add update status tracking
    - [ ] Implement update error handling
    - [ ] Add update performance monitoring

- [ ] **Task 18: Create DataSourceService class**
    - [ ] Inject MarketDataSourceRepository and DataSourceManager
    - [ ] Implement addDataSource() method
    - [ ] Implement updateDataSource() method
    - [ ] Implement removeDataSource() method
    - [ ] Implement getDataSourceStatus() method
    - [ ] Implement testDataSource() method
    - [ ] Add source configuration validation

- [ ] **Task 19: Create AlertService class**
    - [ ] Inject PriceAlertRepository and AlertManager
    - [ ] Implement createAlert() method
    - [ ] Implement updateAlert() method
    - [ ] Implement deleteAlert() method
    - [ ] Implement getAlerts() method
    - [ ] Implement processAlerts() method
    - [ ] Add alert delivery management

## API Layer

- [ ] **Task 20: Create MarketDataController class**
    - [ ] Add GET /api/v1/market/prices endpoint (get current prices)
    - [ ] Add GET /api/v1/market/prices/:assetId endpoint (get price history)
    - [ ] Add POST /api/v1/market/prices endpoint (manual price input)
    - [ ] Add PUT /api/v1/market/prices/:assetId endpoint (update specific price)
    - [ ] Add proper HTTP status codes and error handling
    - [ ] Add request validation and response transformation
    - [ ] Add query parameters for filtering and pagination

- [ ] **Task 21: Create DataSourceController class**
    - [ ] Add GET /api/v1/market/sources endpoint (list data sources)
    - [ ] Add POST /api/v1/market/sources endpoint (add new data source)
    - [ ] Add PUT /api/v1/market/sources/:id endpoint (update data source)
    - [ ] Add DELETE /api/v1/market/sources/:id endpoint (remove data source)
    - [ ] Add proper validation and error handling
    - [ ] Add response transformation for source data

- [ ] **Task 22: Create RefreshController class**
    - [ ] Add POST /api/v1/market/refresh endpoint (refresh all prices)
    - [ ] Add POST /api/v1/market/refresh/:assetId endpoint (refresh specific asset)
    - [ ] Add GET /api/v1/market/refresh/status endpoint (get refresh status)
    - [ ] Add proper error handling and status tracking
    - [ ] Add response transformation for refresh data

- [ ] **Task 23: Create AlertController class**
    - [ ] Add GET /api/v1/market/alerts endpoint (list price alerts)
    - [ ] Add POST /api/v1/market/alerts endpoint (create price alert)
    - [ ] Add PUT /api/v1/market/alerts/:id endpoint (update price alert)
    - [ ] Add DELETE /api/v1/market/alerts/:id endpoint (delete price alert)
    - [ ] Add proper validation and error handling
    - [ ] Add response transformation for alert data

## DTOs and Validation

- [ ] **Task 24: Create CreatePriceDto**
    - [ ] Add asset_id field with @IsUUID() validation
    - [ ] Add price field with @IsNumber() and @IsPositive() validation
    - [ ] Add source field with @IsString() validation
    - [ ] Add volume field with @IsOptional() and @IsNumber() validation
    - [ ] Add change_pct field with @IsOptional() and @IsNumber() validation
    - [ ] Add notes field with @IsOptional() and @IsString() validation

- [ ] **Task 25: Create PriceResponseDto**
    - [ ] Add asset_id, symbol, name fields
    - [ ] Add price, change_pct, volume fields
    - [ ] Add source, updated_at fields
    - [ ] Add @Expose() decorators for field exposure
    - [ ] Add @Transform() decorators for proper serialization

- [ ] **Task 26: Create DataSourceDto**
    - [ ] Add name field with @IsString() and @IsNotEmpty() validation
    - [ ] Add api_url field with @IsUrl() validation
    - [ ] Add api_key field with @IsOptional() and @IsString() validation
    - [ ] Add is_active field with @IsBoolean() validation
    - [ ] Add priority field with @IsNumber() and @Min(1) validation
    - [ ] Add timeout_ms field with @IsNumber() and @Min(1000) validation

- [ ] **Task 27: Create RefreshStatusResponseDto**
    - [ ] Add refresh_id field
    - [ ] Add status field (started, in_progress, completed, failed)
    - [ ] Add total_assets field
    - [ ] Add processed_assets field
    - [ ] Add started_at, estimated_completion fields
    - [ ] Add error_message field for failures

- [ ] **Task 28: Create PriceAlertDto**
    - [ ] Add asset_id field with @IsUUID() validation
    - [ ] Add target_price field with @IsNumber() and @IsPositive() validation
    - [ ] Add alert_type field with @IsIn(['ABOVE', 'BELOW', 'CHANGE']) validation
    - [ ] Add @Transform() decorators for data transformation

## Frontend Components (React.js)

- [ ] **Task 29: Create MarketDataDashboard component**
    - [ ] Implement overview of market data status
    - [ ] Display data source health indicators
    - [ ] Show price update status
    - [ ] Add refresh controls and status
    - [ ] Implement real-time updates
    - [ ] Add responsive design

- [ ] **Task 30: Create PriceTable component**
    - [ ] Display table showing current prices
    - [ ] Show asset symbol, name, price, change
    - [ ] Add sorting and filtering capabilities
    - [ ] Implement search functionality
    - [ ] Add pagination for large datasets
    - [ ] Implement responsive table design

- [ ] **Task 31: Create PriceChart component**
    - [ ] Implement chart showing price history
    - [ ] Add line chart for price trends
    - [ ] Add candlestick chart for OHLC data
    - [ ] Implement interactive tooltips
    - [ ] Add date range selection
    - [ ] Implement responsive chart sizing

- [ ] **Task 32: Create DataSourceStatus component**
    - [ ] Display status of external data sources
    - [ ] Show source health indicators
    - [ ] Add source performance metrics
    - [ ] Implement source testing functionality
    - [ ] Add source configuration management
    - [ ] Implement real-time status updates

- [ ] **Task 33: Create PriceInputForm component**
    - [ ] Implement form for manual price input
    - [ ] Add asset selection dropdown
    - [ ] Add price input field with validation
    - [ ] Add source selection
    - [ ] Add notes field
    - [ ] Implement form submission with loading states

- [ ] **Task 34: Create PriceHistoryView component**
    - [ ] Display historical price data
    - [ ] Show price trends and patterns
    - [ ] Add date range filtering
    - [ ] Implement data export functionality
    - [ ] Add price comparison features
    - [ ] Implement responsive design

- [ ] **Task 35: Create PriceAlertSettings component**
    - [ ] Implement price alert configuration
    - [ ] Add alert type selection
    - [ ] Add target price input
    - [ ] Add alert delivery settings
    - [ ] Implement alert testing
    - [ ] Add alert history display

- [ ] **Task 36: Create DataSourceList component**
    - [ ] Display list of configured data sources
    - [ ] Show source status and health
    - [ ] Add source management actions
    - [ ] Implement source testing
    - [ ] Add source configuration editing
    - [ ] Implement responsive design

- [ ] **Task 37: Create DataSourceConfig component**
    - [ ] Implement configuration for data sources
    - [ ] Add API URL and key configuration
    - [ ] Add priority and timeout settings
    - [ ] Implement source testing
    - [ ] Add configuration validation
    - [ ] Implement form submission

- [ ] **Task 38: Create RefreshStatus component**
    - [ ] Display status of price refresh operations
    - [ ] Show progress indicators
    - [ ] Add refresh controls
    - [ ] Implement real-time updates
    - [ ] Add error handling display
    - [ ] Implement responsive design

## Testing

- [ ] **Task 39: Write unit tests for ExternalAPIClient classes**
    - [ ] Test API client initialization and configuration
    - [ ] Test price data fetching methods
    - [ ] Test error handling and retry logic
    - [ ] Test rate limiting and timeout handling
    - [ ] Test data parsing and transformation
    - [ ] Test circuit breaker functionality

- [ ] **Task 40: Write unit tests for PriceValidator**
    - [ ] Test price data validation logic
    - [ ] Test price range validation
    - [ ] Test anomaly detection
    - [ ] Test data consistency validation
    - [ ] Test validation error handling
    - [ ] Test edge cases and error scenarios

- [ ] **Task 41: Write unit tests for MarketDataService**
    - [ ] Test price fetching and processing
    - [ ] Test price caching functionality
    - [ ] Test error handling and fallback
    - [ ] Test batch processing
    - [ ] Test real-time updates
    - [ ] Test performance and scalability

- [ ] **Task 42: Write unit tests for DataSourceService**
    - [ ] Test data source management
    - [ ] Test source configuration validation
    - [ ] Test source health monitoring
    - [ ] Test source failover logic
    - [ ] Test error handling scenarios
    - [ ] Test performance monitoring

- [ ] **Task 43: Write unit tests for AlertService**
    - [ ] Test alert creation and management
    - [ ] Test alert trigger logic
    - [ ] Test alert delivery methods
    - [ ] Test alert scheduling
    - [ ] Test error handling scenarios
    - [ ] Test alert history tracking

- [ ] **Task 44: Write unit tests for MarketDataController**
    - [ ] Test all API endpoints
    - [ ] Test request validation and error handling
    - [ ] Test response transformation
    - [ ] Test query parameters and filtering
    - [ ] Test pagination and sorting
    - [ ] Test error responses and status codes

- [ ] **Task 45: Write integration tests for Market Data module**
    - [ ] Test external API integration
    - [ ] Test price data processing workflow
    - [ ] Test data source management
    - [ ] Test alert system functionality
    - [ ] Test database operations and transactions
    - [ ] Test error handling and rollback scenarios

- [ ] **Task 46: Write unit tests for React components**
    - [ ] Test MarketDataDashboard component rendering
    - [ ] Test PriceTable component interactions
    - [ ] Test PriceChart component functionality
    - [ ] Test DataSourceStatus component
    - [ ] Test form components (PriceInputForm, DataSourceConfig)
    - [ ] Test error states and loading states
    - [ ] Test responsive behavior

## Documentation

- [ ] **Task 47: Update API documentation**
    - [ ] Document all market data endpoints
    - [ ] Add request/response examples
    - [ ] Document error codes and messages
    - [ ] Document external API integration
    - [ ] Add authentication requirements
    - [ ] Document rate limiting and quotas

- [ ] **Task 48: Create component documentation**
    - [ ] Document React component props and usage
    - [ ] Add component examples and demos
    - [ ] Document styling and theming
    - [ ] Add accessibility guidelines
    - [ ] Document responsive breakpoints

- [ ] **Task 49: Update README and setup guides**
    - [ ] Update project README with market data module info
    - [ ] Add database setup instructions
    - [ ] Document environment variables
    - [ ] Add development setup guide
    - [ ] Document deployment procedures

## Performance and Optimization

- [ ] **Task 50: Implement caching strategy**
    - [ ] Configure Redis cache for price data
    - [ ] Implement cache invalidation on updates
    - [ ] Add cache warming for frequently accessed data
    - [ ] Monitor cache hit rates and performance
    - [ ] Implement cache fallback strategies

- [ ] **Task 51: Optimize database queries**
    - [ ] Add proper database indexes
    - [ ] Optimize N+1 query problems
    - [ ] Implement query result caching
    - [ ] Add database connection pooling
    - [ ] Monitor query performance and slow queries

- [ ] **Task 52: Implement real-time updates**
    - [ ] Set up WebSocket connection for price updates
    - [ ] Implement real-time price broadcasting
    - [ ] Add price change notifications
    - [ ] Implement connection management and reconnection
    - [ ] Add fallback to polling if WebSocket fails

## Security and Validation

- [ ] **Task 53: Implement input validation**
    - [ ] Add comprehensive DTO validation
    - [ ] Implement custom validation rules
    - [ ] Add sanitization for user inputs
    - [ ] Implement rate limiting for API endpoints
    - [ ] Add request size limits

- [ ] **Task 54: Implement access control**
    - [ ] Add market data operation validation
    - [ ] Implement user authentication checks
    - [ ] Add authorization for data operations
    - [ ] Implement audit logging for sensitive operations
    - [ ] Add data encryption for sensitive fields

## Dependencies and Setup

- [ ] **Task 55: Install required dependencies**
    - [ ] Install @nestjs/axios for HTTP client
    - [ ] Install @nestjs/schedule for scheduled tasks
    - [ ] Install @nestjs/websockets for WebSocket support
    - [ ] Install @nestjs/platform-socket.io for Socket.IO
    - [ ] Install axios for HTTP requests
    - [ ] Install node-cron for cron job scheduling
    - [ ] Install socket.io for WebSocket communication
    - [ ] Install cheerio for HTML parsing (if needed)

- [ ] **Task 56: Configure module dependencies**
    - [ ] Set up TypeORM configuration
    - [ ] Configure HTTP client settings
    - [ ] Set up scheduled tasks
    - [ ] Configure WebSocket settings
    - [ ] Set up validation pipes
    - [ ] Configure transformation pipes
    - [ ] Set up error handling filters

## Open Questions Resolution

- [ ] **Task 57: Resolve data source priority questions**
    - [ ] Implement priority-based source selection
    - [ ] Add source performance monitoring
    - [ ] Implement dynamic priority adjustment
    - [ ] Add source health scoring

- [ ] **Task 58: Resolve price validation questions**
    - [ ] Implement number validation for price data
    - [ ] Add price range validation
    - [ ] Implement anomaly detection
    - [ ] Add data quality metrics

- [ ] **Task 59: Resolve update frequency questions**
    - [ ] Implement configurable update frequency per asset type
    - [ ] Add dynamic frequency adjustment
    - [ ] Implement update scheduling
    - [ ] Add frequency monitoring

- [ ] **Task 60: Resolve error handling questions**
    - [ ] Implement comprehensive error logging
    - [ ] Add error recovery mechanisms
    - [ ] Implement error notification system
    - [ ] Add error analytics and reporting

- [ ] **Task 61: Resolve data retention questions**
    - [ ] Implement latest price retention policy
    - [ ] Add data cleanup procedures
    - [ ] Implement data archival
    - [ ] Add retention monitoring
