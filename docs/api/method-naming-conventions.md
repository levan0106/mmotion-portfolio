# Market Data Service - Method Naming Conventions

## Overview
This document outlines the naming conventions used in the MarketDataService to clearly distinguish between methods that fetch data from external APIs versus methods that retrieve data from the database.

## Naming Convention Rules

### 1. API Methods (External Data Sources)
All methods that fetch data from external APIs (CAFEF, FMarket, etc.) are suffixed with `FromAPI`:

```typescript
// ✅ Correct naming for API methods
getHistoricalMarketDataFromAPI()
getHistoricalMarketDataForDateRangeFromAPI()
getHistoricalMarketDataForLastMonthsFromAPI()
getMarketDataReturnsFromAPI()
getMarketDataReturnsHistoryForBenchmarkFromAPI()
getBulkHistoricalMarketDataFromAPI()
fetchHistoricalPricesFromAPIAndStoreInDB()
getHistoricalPricesForDateRangeFromAPI()
```

### 2. Database Methods (Internal Data Storage)
All methods that retrieve data from the database are suffixed with `FromDB`:

```typescript
// ✅ Correct naming for database methods
getHistoricalMarketDataFromDB()
getBulkHistoricalMarketDataFromDB()
getMarketDataReturnsFromDB()
```

### 3. Real-time Methods (Current Market Data)
Methods that work with real-time data (in-memory cache) have no suffix:

```typescript
// ✅ Correct naming for real-time methods
getCurrentPrice()
getMarketData()
getMarketDataBatch()
getAllMarketData()
updateAllPrices()
```

## Method Categories

### 🔄 **Real-time Market Data Methods**
These methods work with the in-memory cache of current market prices:

| Method | Purpose | Data Source |
|--------|---------|-------------|
| `getCurrentPrice(symbol)` | Get current price for a symbol | In-memory cache |
| `getMarketData(symbol)` | Get current market data for a symbol | In-memory cache |
| `getMarketDataBatch(symbols)` | Get market data for multiple symbols | In-memory cache |
| `getAllMarketData()` | Get all current market data | In-memory cache |
| `updateAllPrices()` | Update all prices from external APIs | External APIs → Cache |

### 🌐 **External API Methods**
These methods fetch historical data directly from external APIs:

| Method | Purpose | Data Source |
|--------|---------|-------------|
| `getHistoricalMarketDataFromAPI(symbol, startDate, endDate, pageIndex, pageSize)` | Fetch historical data from CAFEF API | CAFEF API |
| `getHistoricalMarketDataForDateRangeFromAPI(symbol, startDate, endDate)` | Get historical data for date range | CAFEF API |
| `getHistoricalMarketDataForLastMonthsFromAPI(symbol, months)` | Get historical data for last N months | CAFEF API |
| `getMarketDataReturnsFromAPI(symbol, startDate, endDate)` | Calculate returns from API data | CAFEF API |
| `getMarketDataReturnsHistoryForBenchmarkFromAPI(symbol, startDate, endDate)` | Get benchmark returns from API | CAFEF API |
| `getBulkHistoricalMarketDataFromAPI(symbols, startDate, endDate)` | Fetch bulk historical data | CAFEF API |
| `fetchHistoricalPricesFromAPIAndStoreInDB(symbols, startDate, endDate, assetId)` | Fetch from API and store in DB | CAFEF API → Database |
| `getHistoricalPricesForDateRangeFromAPI(symbols, startDate, endDate)` | Public API for historical prices | CAFEF API |

### 💾 **Database Methods**
These methods retrieve historical data from the database:

| Method | Purpose | Data Source |
|--------|---------|-------------|
| `getHistoricalMarketDataFromDB(symbol, startDate, endDate)` | Get historical data from database | Database |
| `getBulkHistoricalMarketDataFromDB(symbols, startDate, endDate)` | Get bulk historical data from database | Database |
| `getMarketDataReturnsFromDB(symbol, startDate, endDate)` | Calculate returns from database data | Database |

## API Endpoints

### External API Endpoints
```typescript
// POST /api/v1/market-data/bulk-historical-prices
// Fetches from external APIs and stores in database
fetchBulkHistoricalPrices() → fetchHistoricalPricesFromAPIAndStoreInDB()

// POST /api/v1/market-data/historical-prices  
// Fetches from external APIs without storing
getHistoricalPricesForDateRange() → getHistoricalPricesForDateRangeFromAPI()
```

### Future Database Endpoints (To be implemented)
```typescript
// GET /api/v1/market-data/historical-prices/db
// Retrieves historical data from database
getHistoricalPricesFromDB() → getBulkHistoricalMarketDataFromDB()

// GET /api/v1/market-data/returns/db
// Calculates returns from database data
getMarketReturnsFromDB() → getMarketDataReturnsFromDB()
```

## Benefits of This Naming Convention

### 1. **Clear Data Source Identification**
- Developers can immediately identify whether a method fetches from API or database
- Reduces confusion when choosing the right method for a use case
- Makes code reviews more efficient

### 2. **Performance Considerations**
- API methods are slower but provide fresh data
- Database methods are faster but may have stale data
- Clear naming helps developers make informed choices

### 3. **Error Handling**
- API methods may fail due to network issues
- Database methods may fail due to data availability
- Different error handling strategies can be applied

### 4. **Testing and Mocking**
- API methods can be mocked for unit tests
- Database methods can be tested with test data
- Clear separation makes testing strategies obvious

## Usage Examples

### Example 1: Get Fresh Data from API
```typescript
// When you need the most up-to-date data
const historicalData = await marketDataService.getHistoricalMarketDataFromAPI(
  'VFF', 
  new Date('2024-01-01'), 
  new Date('2024-01-31')
);
```

### Example 2: Get Fast Data from Database
```typescript
// When you need fast access to previously fetched data
const historicalData = await marketDataService.getHistoricalMarketDataFromDB(
  'VFF', 
  new Date('2024-01-01'), 
  new Date('2024-01-31')
);
```

### Example 3: Bulk Operations
```typescript
// Fetch from API and store in database
const result = await marketDataService.fetchHistoricalPricesFromAPIAndStoreInDB(
  ['VFF', 'VESAF', 'DOJI'],
  new Date('2024-01-01'),
  new Date('2024-01-31'),
  'asset-id-123'
);

// Later, retrieve from database
const storedData = await marketDataService.getBulkHistoricalMarketDataFromDB(
  ['VFF', 'VESAF', 'DOJI'],
  new Date('2024-01-01'),
  new Date('2024-01-31')
);
```

## Migration Guide

### Old Method Names → New Method Names

| Old Name | New Name | Notes |
|----------|----------|-------|
| `getMarketDataHistory()` | `getHistoricalMarketDataFromAPI()` | More descriptive |
| `getMarketDataForDateRange()` | `getHistoricalMarketDataForDateRangeFromAPI()` | Clear data source |
| `getMarketDataForLastMonths()` | `getHistoricalMarketDataForLastMonthsFromAPI()` | Clear data source |
| `getMarketDataReturns()` | `getMarketDataReturnsFromAPI()` | Clear data source |
| `getDataReturnsHistoryForBenchmark()` | `getMarketDataReturnsHistoryForBenchmarkFromAPI()` | Clear data source |
| `getBulkMarketDataHistory()` | `getBulkHistoricalMarketDataFromAPI()` | Clear data source |
| `fetchAndStoreHistoricalPrices()` | `fetchHistoricalPricesFromAPIAndStoreInDB()` | Clear data source |
| `getHistoricalPricesForDateRange()` | `getHistoricalPricesForDateRangeFromAPI()` | Clear data source |

### Controller Updates
The controller methods have been updated to use the new service method names:

```typescript
// Old
return this.marketDataService.fetchAndStoreHistoricalPrices(...)

// New  
return this.marketDataService.fetchHistoricalPricesFromAPIAndStoreInDB(...)
```

## Best Practices

### 1. **Choose the Right Method**
- Use `FromAPI` methods when you need fresh data
- Use `FromDB` methods when you need fast access to historical data
- Use real-time methods for current market data

### 2. **Error Handling**
- API methods: Handle network errors, rate limits, API failures
- Database methods: Handle data not found, connection errors
- Real-time methods: Handle cache misses, stale data

### 3. **Performance Optimization**
- Use database methods for repeated queries
- Use API methods for one-time data fetching
- Consider caching strategies for frequently accessed data

### 4. **Testing**
- Mock API methods for unit tests
- Use test database for database method tests
- Test real-time methods with controlled data

## Future Enhancements

### Planned Database Methods
```typescript
// Additional database methods to be implemented
getHistoricalMarketDataBySymbolFromDB(symbol: string, startDate: Date, endDate: Date)
getMarketDataStatisticsFromDB(symbol: string, startDate: Date, endDate: Date)
getMarketDataTrendsFromDB(symbol: string, startDate: Date, endDate: Date)
```

### Planned API Methods
```typescript
// Additional API methods for different data sources
getHistoricalMarketDataFromFMarketAPI(symbol: string, startDate: Date, endDate: Date)
getHistoricalMarketDataFromDojiAPI(symbol: string, startDate: Date, endDate: Date)
getHistoricalMarketDataFromVietcombankAPI(symbol: string, startDate: Date, endDate: Date)
```

This naming convention ensures clarity, maintainability, and ease of use for all market data operations.
