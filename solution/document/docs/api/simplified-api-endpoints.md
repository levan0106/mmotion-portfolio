# Simplified API Endpoints - Market Data

## Overview

The API endpoints have been simplified to remove the distinction between database and non-database operations in the URL paths. The distinction is now made clear through method names in the service layer.

## API Endpoints

### **Real-time Market Data**

#### **Get Current Price**
```http
GET /api/v1/market-data/price/:symbol
```
- **Purpose**: Get current price for a specific symbol
- **Example**: `GET /api/v1/market-data/price/VFF`
- **Response**: Current price with last updated timestamp

#### **Get Market Data**
```http
GET /api/v1/market-data/data/:symbol
```
- **Purpose**: Get complete market data for a symbol
- **Example**: `GET /api/v1/market-data/data/VFF`
- **Response**: Full market data including price, change, changePercent

#### **Get Multiple Market Data**
```http
GET /api/v1/market-data/data?symbols=VFF,VESAF,GOLD
```
- **Purpose**: Get market data for multiple symbols
- **Query Parameters**: `symbols` (comma-separated)
- **Response**: Array of market data objects

#### **Get All Market Data**
```http
GET /api/v1/market-data/all
```
- **Purpose**: Get all available market data
- **Response**: Array of all market data objects

### **Historical Data Management**

#### **Fetch and Store Historical Prices**
```http
POST /api/v1/market-data/bulk-historical-prices
```
- **Purpose**: Fetch historical prices from external APIs and store in database
- **Method**: `fetchHistoricalPricesFromAPIAndStoreInDB`
- **Body**: `BulkPriceRequest`
- **Features**: 
  - Supports multiple asset types
  - Automatic provider routing
  - Duplicate checking (unless forceUpdate=true)
  - Batch processing

#### **Get Historical Prices (API Only)**
```http
POST /api/v1/market-data/historical-prices
```
- **Purpose**: Get historical prices from external APIs without storing
- **Method**: `getHistoricalPricesForDateRangeFromAPI`
- **Body**: `BulkPriceRequest`
- **Features**:
  - Real-time API fetching
  - No database storage
  - Multiple asset types support

#### **Get Historical Prices from Database**
```http
GET /api/v1/market-data/historical-prices/:assetId?startDate=2024-01-01&endDate=2024-01-31
```
- **Purpose**: Retrieve stored historical prices from database
- **Method**: `getHistoricalPriceDataFromDB`
- **Query Parameters**:
  - `startDate`: Start date (YYYY-MM-DD)
  - `endDate`: End date (YYYY-MM-DD)
- **Response**: Array of historical price records

#### **Get Bulk Historical Prices from Database**
```http
POST /api/v1/market-data/historical-prices/bulk
```
- **Purpose**: Get historical prices for multiple assets from database
- **Method**: `getBulkHistoricalPriceDataFromDB`
- **Body**: `BulkDBPriceRequest`
- **Features**:
  - Multiple asset IDs
  - Date range filtering
  - Efficient bulk retrieval

#### **Force Update Historical Prices**
```http
POST /api/v1/market-data/historical-prices/force-update
```
- **Purpose**: Force update historical prices (delete existing and insert new)
- **Method**: `fetchHistoricalPricesFromAPIAndStoreInDB` with `forceUpdate=true`
- **Body**: `BulkPriceRequest`
- **Features**:
  - Always deletes existing records
  - Always inserts new data
  - Bypasses duplicate checking
  - Useful for data correction

#### **Cleanup Old Price History**
```http
DELETE /api/v1/market-data/historical-prices/:assetId/cleanup?olderThan=2024-01-01
```
- **Purpose**: Delete old price history records
- **Method**: `cleanupOldPriceHistory`
- **Query Parameters**:
  - `olderThan`: Delete records older than this date
- **Response**: Number of deleted records

## Request/Response DTOs

### **BulkPriceRequest**
```typescript
{
  symbols: Array<{symbol: string, assetType: string}>;
  startDate: string;
  endDate: string;
  assetId?: string;
  forceUpdate?: boolean;
}
```

### **BulkDBPriceRequest**
```typescript
{
  assetIds: string[];
  startDate: string;
  endDate: string;
}
```

## Method Naming Convention

### **Service Method Names**
- **FromAPI**: Methods that fetch data from external APIs
  - `getHistoricalMarketDataFromAPI`
  - `getBulkHistoricalMarketDataFromAPI`
  - `fetchHistoricalPricesFromAPIAndStoreInDB`

- **FromDB**: Methods that fetch data from database
  - `getHistoricalPriceDataFromDB`
  - `getBulkHistoricalPriceDataFromDB`

- **General**: Methods that work with cached/real-time data
  - `getCurrentPrice`
  - `getMarketData`
  - `getAllMarketData`

## API Usage Examples

### **1. Fetch and Store Historical Data**
```bash
curl -X POST http://localhost:3000/api/v1/market-data/bulk-historical-prices \
  -H "Content-Type: application/json" \
  -d '{
    "symbols": [
      {"symbol": "VFF", "assetType": "STOCK"},
      {"symbol": "VESAF", "assetType": "FUND"}
    ],
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "assetId": "550e8400-e29b-41d4-a716-446655440000",
    "forceUpdate": false
  }'
```

### **2. Get Historical Data from Database**
```bash
curl "http://localhost:3000/api/v1/market-data/historical-prices/550e8400-e29b-41d4-a716-446655440000?startDate=2024-01-01&endDate=2024-01-31"
```

### **3. Force Update Historical Data**
```bash
curl -X POST http://localhost:3000/api/v1/market-data/historical-prices/force-update \
  -H "Content-Type: application/json" \
  -d '{
    "symbols": [
      {"symbol": "VFF", "assetType": "STOCK"}
    ],
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "assetId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

### **4. Cleanup Old Records**
```bash
curl -X DELETE "http://localhost:3000/api/v1/market-data/historical-prices/550e8400-e29b-41d4-a716-446655440000/cleanup?olderThan=2024-01-01"
```

## Benefits of Simplified API

### **1. Cleaner URLs**
- **Before**: `/historical-prices/db/:assetId`
- **After**: `/historical-prices/:assetId`

### **2. Clear Method Distinction**
- Method names in service layer clearly indicate data source
- API endpoints focus on functionality, not implementation details

### **3. Better Developer Experience**
- Simpler to remember and use
- Consistent URL patterns
- Clear separation of concerns

### **4. Maintainable Architecture**
- Service layer handles complexity
- API layer remains simple
- Easy to extend and modify

## Migration Guide

### **Old Endpoints (Deprecated)**
```http
# Old database-specific endpoints
GET /api/v1/market-data/historical-prices/db/:assetId
POST /api/v1/market-data/historical-prices/db/bulk
DELETE /api/v1/market-data/historical-prices/db/:assetId/cleanup
```

### **New Endpoints (Current)**
```http
# New simplified endpoints
GET /api/v1/market-data/historical-prices/:assetId
POST /api/v1/market-data/historical-prices/bulk
DELETE /api/v1/market-data/historical-prices/:assetId/cleanup
```

### **Migration Steps**
1. Update client code to use new endpoint URLs
2. Update API documentation
3. Test all endpoints thoroughly
4. Remove old endpoint references

## Error Handling

### **Common Error Responses**
```json
{
  "statusCode": 400,
  "message": "Invalid date format",
  "error": "Bad Request"
}
```

### **Validation Errors**
```json
{
  "statusCode": 400,
  "message": [
    "startDate must be a valid date",
    "symbols must be an array"
  ],
  "error": "Bad Request"
}
```

### **Database Errors**
```json
{
  "statusCode": 500,
  "message": "Failed to save price history",
  "error": "Internal Server Error"
}
```

## Performance Considerations

### **Batch Operations**
- Use bulk endpoints for multiple assets
- Implement proper pagination for large datasets
- Consider rate limiting for external API calls

### **Caching Strategy**
- Real-time data cached in memory
- Historical data stored in database
- Implement cache invalidation strategies

### **Database Optimization**
- Use proper indexes on date ranges
- Implement connection pooling
- Monitor query performance

## Security Considerations

### **Input Validation**
- Validate all input parameters
- Sanitize date formats
- Check asset ID formats

### **Rate Limiting**
- Implement rate limiting for external API calls
- Monitor usage patterns
- Set appropriate limits

### **Data Privacy**
- Log access to sensitive data
- Implement proper authentication
- Monitor for suspicious activity

## Monitoring and Logging

### **Key Metrics**
- API response times
- Database query performance
- External API call success rates
- Error rates by endpoint

### **Logging Levels**
- **Debug**: Detailed operation logs
- **Info**: Successful operations
- **Warn**: Non-critical issues
- **Error**: Failed operations

### **Alerting**
- Set up alerts for high error rates
- Monitor database performance
- Track external API failures

## Conclusion

The simplified API endpoints provide a cleaner, more maintainable interface while preserving all functionality. The distinction between database and API operations is now handled at the service layer, making the API more intuitive and easier to use.
