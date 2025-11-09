# Database Storage Implementation - Market Data Service

## Overview
The Market Data Service now includes complete database storage functionality for historical price data. This implementation provides robust data persistence, duplicate prevention, transaction management, and efficient querying capabilities.

## Database Architecture

### Entity Structure
```typescript
// AssetPriceHistory Entity
{
  id: string;                    // UUID primary key
  assetId: string;              // Foreign key to global_assets
  price: number;             // Price value (numeric 15,2)
  priceType: PriceType;        // MARKET_DATA, MANUAL, EXTERNAL, CALCULATED
  priceSource: PriceSource;    // EXTERNAL_API, USER, MARKET_DATA_SERVICE, CALCULATED
  changeReason: string;        // Human-readable reason for price change
  metadata: object;           // JSON metadata (symbol, volume, etc.)
  createdAt: Date;            // Timestamp of price record
}
```

### Database Indexes
- **IDX_ASSET_PRICE_HISTORY_ASSET_ID**: Fast lookups by asset
- **IDX_ASSET_PRICE_HISTORY_CREATED_AT**: Fast date range queries
- **IDX_ASSET_PRICE_HISTORY_PRICE_TYPE**: Filter by price type
- **IDX_ASSET_PRICE_HISTORY_PRICE_SOURCE**: Filter by price source

## Core Database Operations

### 1. Save Price History to Database
```typescript
private async savePriceHistoryToDB(
  symbol: string,
  dataPoints: MarketDataPoint[],
  assetId: string
): Promise<void>
```

**Features:**
- ✅ **Duplicate Prevention**: Checks existing records before insertion
- ✅ **Batch Insertion**: Processes records in chunks of 1000
- ✅ **Transaction Management**: Ensures data integrity
- ✅ **Metadata Storage**: Rich metadata for analysis
- ✅ **Error Handling**: Comprehensive error logging

**Process Flow:**
1. Convert `MarketDataPoint` to `AssetPriceHistory` entities
2. Check for existing records to prevent duplicates
3. Filter out duplicate records
4. Batch insert new records with transaction management
5. Log success/failure statistics

### 2. Check Existing Records
```typescript
private async checkExistingPriceHistory(
  assetId: string,
  dataPoints: MarketDataPoint[]
): Promise<AssetPriceHistory[]>
```

**Features:**
- ✅ **Date Range Query**: Efficient date range filtering
- ✅ **Source Filtering**: Only checks EXTERNAL_API records
- ✅ **Performance Optimized**: Uses database indexes

### 3. Batch Insert with Transaction
```typescript
private async batchInsertPriceHistory(records: AssetPriceHistory[]): Promise<void>
```

**Features:**
- ✅ **Transaction Management**: ACID compliance
- ✅ **Chunked Processing**: Handles large datasets
- ✅ **Memory Efficient**: Processes records in chunks
- ✅ **Error Recovery**: Transaction rollback on failure

## Database Query Operations

### 1. Get Historical Price Data
```typescript
async getHistoricalPriceDataFromDB(
  assetId: string,
  startDate: Date,
  endDate: Date
): Promise<AssetPriceHistory[]>
```

**Features:**
- ✅ **Date Range Filtering**: Efficient date range queries
- ✅ **Source Filtering**: Only returns EXTERNAL_API records
- ✅ **Ordered Results**: Chronological ordering
- ✅ **Performance Optimized**: Uses database indexes

### 2. Bulk Historical Data Retrieval
```typescript
async getBulkHistoricalPriceDataFromDB(
  assetIds: string[],
  startDate: Date,
  endDate: Date
): Promise<Map<string, AssetPriceHistory[]>>
```

**Features:**
- ✅ **Multi-Asset Queries**: Efficient bulk retrieval
- ✅ **Grouped Results**: Results grouped by assetId
- ✅ **Ordered Data**: Chronological ordering per asset
- ✅ **Memory Efficient**: Streaming processing

### 3. Data Cleanup
```typescript
async cleanupOldPriceHistory(
  assetId: string,
  olderThan: Date
): Promise<number>
```

**Features:**
- ✅ **Selective Deletion**: Only deletes EXTERNAL_API records
- ✅ **Batch Deletion**: Efficient bulk deletion
- ✅ **Return Count**: Returns number of deleted records
- ✅ **Safe Operation**: Prevents accidental data loss

## API Endpoints

### 1. Get Historical Prices from Database
**GET** `/api/v1/market-data/historical-prices/db/:assetId`

```typescript
// Query Parameters
{
  startDate: string;  // YYYY-MM-DD format
  endDate: string;    // YYYY-MM-DD format
}

// Response
AssetPriceHistory[]
```

**Example:**
```bash
GET /api/v1/market-data/historical-prices/db/550e8400-e29b-41d4-a716-446655440000?startDate=2024-01-01&endDate=2024-01-31
```

### 2. Bulk Historical Prices from Database
**POST** `/api/v1/market-data/historical-prices/db/bulk`

```typescript
// Request Body
{
  assetIds: string[];
  startDate: string;
  endDate: string;
}

// Response
Map<string, AssetPriceHistory[]>
```

**Example:**
```bash
POST /api/v1/market-data/historical-prices/db/bulk
{
  "assetIds": ["550e8400-e29b-41d4-a716-446655440000", "550e8400-e29b-41d4-a716-446655440001"],
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

### 3. Cleanup Old Price History
**DELETE** `/api/v1/market-data/historical-prices/db/:assetId/cleanup`

```typescript
// Query Parameters
{
  olderThan: string;  // YYYY-MM-DD format
}

// Response
{
  deletedCount: number;
  message: string;
}
```

**Example:**
```bash
DELETE /api/v1/market-data/historical-prices/db/550e8400-e29b-41d4-a716-446655440000/cleanup?olderThan=2023-01-01
```

## Data Transformation

### MarketDataPoint → AssetPriceHistory
```typescript
// Input: MarketDataPoint
{
  date: "2024-01-15",
  closePrice: 34000,
  change: 1000,
  changePercent: 3.03,
  volume: 1000000,
  value: 34000000000
}

// Output: AssetPriceHistory
{
  assetId: "550e8400-e29b-41d4-a716-446655440000",
  price: 34000,
  priceType: "MARKET_DATA",
  priceSource: "EXTERNAL_API",
  changeReason: "Historical price data for VFF",
  metadata: {
    symbol: "VFF",
    date: "2024-01-15",
    change: 1000,
    changePercent: 3.03,
    volume: 1000000,
    value: 34000000000,
    source: "Market Data Service"
  },
  createdAt: new Date("2024-01-15")
}
```

## Performance Optimizations

### 1. Database Indexes
```sql
-- Primary indexes for fast queries
CREATE INDEX IDX_ASSET_PRICE_HISTORY_ASSET_ID ON asset_price_history(asset_id);
CREATE INDEX IDX_ASSET_PRICE_HISTORY_CREATED_AT ON asset_price_history(created_at);
CREATE INDEX IDX_ASSET_PRICE_HISTORY_PRICE_TYPE ON asset_price_history(price_type);
CREATE INDEX IDX_ASSET_PRICE_HISTORY_PRICE_SOURCE ON asset_price_history(price_source);

-- Composite index for common queries
CREATE INDEX IDX_ASSET_PRICE_HISTORY_COMPOSITE ON asset_price_history(asset_id, created_at, price_source);
```

### 2. Batch Processing
- **Chunk Size**: 1000 records per batch
- **Memory Management**: Streaming processing for large datasets
- **Transaction Management**: ACID compliance with rollback capability

### 3. Query Optimization
- **Date Range Queries**: Uses BETWEEN for efficient date filtering
- **IN Queries**: Efficient multi-asset queries
- **Ordered Results**: Database-level ordering for performance

## Error Handling

### Database Errors
```typescript
// Connection Errors
"Failed to connect to database: Connection timeout"

// Transaction Errors
"Transaction failed: Deadlock detected"

// Constraint Errors
"Duplicate key violation: Record already exists"

// Query Errors
"Query failed: Invalid date range"
```

### Error Recovery
- ✅ **Transaction Rollback**: Automatic rollback on failure
- ✅ **Partial Success**: Individual record failures don't break batch operations
- ✅ **Retry Logic**: Built-in retry mechanisms for transient failures
- ✅ **Error Logging**: Comprehensive error logging with context

## Data Integrity

### 1. Duplicate Prevention
```typescript
// Check existing records before insertion
const existingRecords = await this.checkExistingPriceHistory(assetId, dataPoints);

// Filter out duplicates
const newRecords = priceHistoryRecords.filter(record => {
  const recordDate = record.createdAt.toISOString().split('T')[0];
  return !existingRecords.some(existing => 
    existing.assetId === record.assetId && 
    existing.createdAt.toISOString().split('T')[0] === recordDate
  );
});
```

### 2. Transaction Management
```typescript
// Use transaction for data integrity
await this.assetPriceHistoryRepository.manager.transaction(async (transactionalEntityManager) => {
  // Batch insert in chunks
  for (const chunk of chunks) {
    await transactionalEntityManager.save(AssetPriceHistory, chunk);
  }
});
```

### 3. Data Validation
- ✅ **Price Validation**: Positive price values only
- ✅ **Date Validation**: Valid date ranges
- ✅ **Asset ID Validation**: Valid UUID format
- ✅ **Metadata Validation**: JSON structure validation

## Monitoring and Logging

### Log Messages
```
[MarketDataService] Saving 250 price records for VFF to asset 550e8400-e29b-41d4-a716-446655440000
[MarketDataService] Successfully saved 250 new price records for VFF (0 duplicates skipped)
[MarketDataService] Getting historical price data from DB for asset 550e8400-e29b-41d4-a716-446655440000
[MarketDataService] Found 250 historical price records for asset 550e8400-e29b-41d4-a716-446655440000
[MarketDataService] Cleaned up old price history for asset 550e8400-e29b-41d4-a716-446655440000 older than 2023-01-01T00:00:00.000Z
[MarketDataService] Deleted 1000 old price history records for asset 550e8400-e29b-41d4-a716-446655440000
```

### Metrics to Monitor
- Database connection pool usage
- Query execution times
- Batch insertion performance
- Duplicate detection efficiency
- Cleanup operation success rates

## Usage Examples

### Example 1: Save Historical Data
```typescript
// Fetch and store historical data
const symbols = [
  { symbol: 'VFF', assetType: 'STOCK' },
  { symbol: 'HPG', assetType: 'STOCK' }
];

const result = await marketDataService.fetchHistoricalPricesFromAPIAndStoreInDB(
  symbols,
  new Date('2024-01-01'),
  new Date('2024-01-31'),
  'asset-id-123'
);

console.log(`Processed ${result.success} symbols with ${result.totalRecords} total records`);
```

### Example 2: Retrieve from Database
```typescript
// Get historical data from database
const historicalData = await marketDataService.getHistoricalPriceDataFromDB(
  'asset-id-123',
  new Date('2024-01-01'),
  new Date('2024-01-31')
);

console.log(`Found ${historicalData.length} historical records`);
```

### Example 3: Bulk Database Query
```typescript
// Get bulk historical data from database
const bulkData = await marketDataService.getBulkHistoricalPriceDataFromDB(
  ['asset-id-123', 'asset-id-456'],
  new Date('2024-01-01'),
  new Date('2024-01-31')
);

console.log(`Found data for ${bulkData.size} assets`);
```

### Example 4: Data Cleanup
```typescript
// Cleanup old data
const deletedCount = await marketDataService.cleanupOldPriceHistory(
  'asset-id-123',
  new Date('2023-01-01')
);

console.log(`Deleted ${deletedCount} old records`);
```

## Testing Strategy

### Unit Tests
```typescript
describe('Database Storage', () => {
  it('should save price history without duplicates', async () => {
    const dataPoints = [/* test data */];
    await service.savePriceHistoryToDB('VFF', dataPoints, 'asset-id');
    
    const records = await service.getHistoricalPriceDataFromDB('asset-id', startDate, endDate);
    expect(records).toHaveLength(dataPoints.length);
  });

  it('should prevent duplicate records', async () => {
    // Test duplicate prevention logic
  });

  it('should handle transaction rollback on failure', async () => {
    // Test transaction management
  });
});
```

### Integration Tests
```typescript
describe('Database Integration', () => {
  it('should handle bulk operations efficiently', async () => {
    const symbols = [/* large dataset */];
    const result = await service.fetchHistoricalPricesFromAPIAndStoreInDB(symbols, startDate, endDate);
    expect(result.success).toBeGreaterThan(0);
  });
});
```

## Future Enhancements

### Planned Features
1. **Data Compression**: Compress old historical data
2. **Partitioning**: Partition tables by date for better performance
3. **Data Archiving**: Archive old data to separate storage
4. **Real-time Sync**: Real-time database synchronization
5. **Data Analytics**: Built-in analytics and reporting

### Performance Improvements
1. **Connection Pooling**: Optimize database connections
2. **Query Caching**: Cache frequently used queries
3. **Index Optimization**: Fine-tune database indexes
4. **Batch Size Tuning**: Optimize batch sizes for different scenarios

This database storage implementation provides a robust, scalable, and efficient foundation for historical market data persistence and retrieval.
