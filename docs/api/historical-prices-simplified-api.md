# Historical Prices - Simplified API

## Overview

The historical prices API has been simplified to only 2 essential endpoints that cover all use cases:

1. **POST** `/historical-prices/update` - Update historical prices (with forceUpdate support)
2. **GET** `/historical-prices` - Get historical prices (for one or all symbols)

## API Endpoints

### **1. Update Historical Prices**

```http
POST /api/v1/market-data/historical-prices/update
```

**Purpose**: Fetch historical prices from external APIs and store in database

**Features**:
- ✅ **Single or Multiple Symbols**: Support for one or multiple symbols
- ✅ **Force Update**: Optional force update to overwrite existing data
- ✅ **Asset Type Routing**: Automatic provider selection based on asset type
- ✅ **Batch Processing**: Efficient processing of multiple symbols
- ✅ **Duplicate Handling**: Smart duplicate detection and handling

**Request Body**:
```json
{
  "symbols": [
    {"symbol": "VFF", "assetType": "STOCK"},
    {"symbol": "VESAF", "assetType": "FUND"},
    {"symbol": "DOJI", "assetType": "GOLD"}
  ],
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "assetId": "550e8400-e29b-41d4-a716-446655440000",
  "forceUpdate": false
}
```

**Response**:
```json
{
  "success": 3,
  "failed": 0,
  "errors": [],
  "totalRecords": 750,
  "processedSymbols": [
    {
      "symbol": "VFF",
      "recordCount": 250,
      "dateRange": {
        "start": "2024-01-01",
        "end": "2024-01-31"
      }
    }
  ]
}
```

### **2. Get Historical Prices**

```http
GET /api/v1/market-data/historical-prices
```

**Purpose**: Retrieve historical prices from database

**Features**:
- ✅ **Single or Multiple Symbols**: Query specific symbols or get all
- ✅ **Date Range Filtering**: Optional start and end date filtering
- ✅ **Flexible Querying**: Support for various query combinations
- ✅ **Efficient Retrieval**: Optimized database queries

**Query Parameters**:
- `symbols` (optional): Comma-separated list of symbols
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)

**Examples**:

#### **Get All Historical Prices**
```bash
curl "http://localhost:3000/api/v1/market-data/historical-prices"
```

#### **Get Historical Prices for Specific Symbols**
```bash
curl "http://localhost:3000/api/v1/market-data/historical-prices?symbols=VFF,VESAF,GOLD"
```

#### **Get Historical Prices with Date Range**
```bash
curl "http://localhost:3000/api/v1/market-data/historical-prices?symbols=VFF&startDate=2024-01-01&endDate=2024-01-31"
```

#### **Get All Historical Prices with Date Range**
```bash
curl "http://localhost:3000/api/v1/market-data/historical-prices?startDate=2024-01-01&endDate=2024-01-31"
```

**Response**:
```json
[
  {
    "id": "uuid",
    "assetId": "550e8400-e29b-41d4-a716-446655440000",
    "price": 34000,
    "priceType": "MARKET_DATA",
    "priceSource": "EXTERNAL_API",
    "changeReason": "Market data update",
    "metadata": {
      "symbol": "VFF",
      "date": "2024-01-15"
    },
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

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

## Usage Examples

### **1. Update Single Symbol**
```bash
curl -X POST http://localhost:3000/api/v1/market-data/historical-prices/update \
  -H "Content-Type: application/json" \
  -d '{
    "symbols": [{"symbol": "VFF", "assetType": "STOCK"}],
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "assetId": "550e8400-e29b-41d4-a716-446655440000",
    "forceUpdate": false
  }'
```

### **2. Update Multiple Symbols with Force Update**
```bash
curl -X POST http://localhost:3000/api/v1/market-data/historical-prices/update \
  -H "Content-Type: application/json" \
  -d '{
    "symbols": [
      {"symbol": "VFF", "assetType": "STOCK"},
      {"symbol": "VESAF", "assetType": "FUND"},
      {"symbol": "DOJI", "assetType": "GOLD"}
    ],
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "forceUpdate": true
  }'
```

### **3. Get Historical Prices for Specific Symbols**
```bash
curl "http://localhost:3000/api/v1/market-data/historical-prices?symbols=VFF,VESAF&startDate=2024-01-01&endDate=2024-01-31"
```

### **4. Get All Historical Prices**
```bash
curl "http://localhost:3000/api/v1/market-data/historical-prices"
```

## Asset Type Routing

The system automatically routes to appropriate external API providers based on asset type:

| Asset Type | Provider | API Endpoint |
|------------|----------|--------------|
| STOCK, ETF | CAFEF | `https://s.cafef.vn` |
| FUND | FMarket | `https://api.fmarket.vn` |
| GOLD | Doji | `https://api.doji.vn` |
| EXCHANGE_RATE | Vietcombank | `https://api.vietcombank.com.vn` |
| CRYPTO | CoinGecko | `https://api.coingecko.com` |

## Force Update Feature

### **Normal Update (forceUpdate: false)**
- ✅ **Duplicate Check**: Checks for existing records
- ✅ **Skip Duplicates**: Only inserts new records
- ✅ **Efficient**: Avoids unnecessary database operations
- ✅ **Safe**: Preserves existing data

### **Force Update (forceUpdate: true)**
- ✅ **Delete Existing**: Removes existing records in date range
- ✅ **Insert New**: Inserts all new records
- ✅ **Data Correction**: Useful for fixing incorrect data
- ✅ **Complete Refresh**: Ensures data consistency

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
- ✅ **Efficient Processing**: Processes multiple symbols in batches
- ✅ **Rate Limiting**: Respects external API rate limits
- ✅ **Concurrency Control**: Limits parallel API calls
- ✅ **Memory Management**: Efficient memory usage for large datasets

### **Database Optimization**
- ✅ **Indexed Queries**: Uses database indexes for fast retrieval
- ✅ **Batch Inserts**: Efficient bulk insert operations
- ✅ **Transaction Management**: ACID compliance for data integrity
- ✅ **Connection Pooling**: Optimized database connections

## Security Considerations

### **Input Validation**
- ✅ **Date Validation**: Ensures valid date formats
- ✅ **Symbol Validation**: Validates symbol formats
- ✅ **Type Safety**: TypeScript ensures type safety
- ✅ **SQL Injection Prevention**: Parameterized queries

### **Data Privacy**
- ✅ **Access Logging**: Logs access to sensitive data
- ✅ **Authentication**: Proper authentication required
- ✅ **Authorization**: Role-based access control
- ✅ **Audit Trail**: Complete audit trail for data changes

## Monitoring and Logging

### **Key Metrics**
- ✅ **Update Success Rate**: Track successful updates
- ✅ **Query Performance**: Monitor database query times
- ✅ **API Response Times**: Track external API performance
- ✅ **Error Rates**: Monitor error rates by type

### **Logging Levels**
- ✅ **Debug**: Detailed operation logs
- ✅ **Info**: Successful operations
- ✅ **Warn**: Non-critical issues
- ✅ **Error**: Failed operations

### **Alerting**
- ✅ **High Error Rates**: Alert on high error rates
- ✅ **Performance Issues**: Alert on slow operations
- ✅ **Data Inconsistencies**: Alert on data issues
- ✅ **System Health**: Monitor overall system health

## Migration from Old API

### **Old Endpoints (Deprecated)**
```http
# Old complex endpoints
POST /api/v1/market-data/bulk-historical-prices
POST /api/v1/market-data/historical-prices
GET /api/v1/market-data/historical-prices/:assetId
POST /api/v1/market-data/historical-prices/bulk
POST /api/v1/market-data/historical-prices/force-update
DELETE /api/v1/market-data/historical-prices/:assetId/cleanup
```

### **New Endpoints (Current)**
```http
# New simplified endpoints
POST /api/v1/market-data/historical-prices/update
GET /api/v1/market-data/historical-prices
```

### **Migration Steps**
1. ✅ **Update Client Code**: Change endpoint URLs
2. ✅ **Update Request Format**: Use new request format
3. ✅ **Test Thoroughly**: Test all functionality
4. ✅ **Remove Old Code**: Clean up old endpoint references

## Benefits of Simplified API

### **Developer Experience**
- ✅ **Simpler URLs**: Easy to remember and use
- ✅ **Fewer Endpoints**: Reduced complexity
- ✅ **Clear Purpose**: Each endpoint has a clear purpose
- ✅ **Consistent Patterns**: Uniform API design

### **Maintainability**
- ✅ **Less Code**: Reduced codebase complexity
- ✅ **Easier Testing**: Fewer endpoints to test
- ✅ **Better Documentation**: Clearer documentation
- ✅ **Simpler Debugging**: Easier to debug issues

### **Performance**
- ✅ **Optimized Queries**: Efficient database operations
- ✅ **Reduced Overhead**: Less API overhead
- ✅ **Better Caching**: Improved caching strategies
- ✅ **Faster Response**: Optimized response times

## Conclusion

The simplified historical prices API provides a clean, efficient interface for managing historical price data with just 2 essential endpoints that cover all use cases. This approach reduces complexity while maintaining full functionality and improving developer experience.
