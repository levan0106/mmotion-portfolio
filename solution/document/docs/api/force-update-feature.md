# Force Update Feature - Market Data Service

## Overview
The Force Update feature allows users to bypass duplicate checking and always insert fresh data, ensuring the most up-to-date historical price information is stored in the database.

## Feature Description

### Normal Mode vs Force Update Mode

#### **Normal Mode (Default)**
- ✅ **Duplicate Prevention**: Checks for existing records before insertion
- ✅ **Efficient Processing**: Skips records that already exist
- ✅ **Data Integrity**: Prevents duplicate data
- ✅ **Performance**: Faster processing for large datasets

#### **Force Update Mode**
- ✅ **Fresh Data**: Always inserts new data regardless of existing records
- ✅ **Data Override**: Deletes existing records and inserts new ones
- ✅ **Complete Refresh**: Ensures data is always up-to-date
- ✅ **Data Accuracy**: Guarantees latest market data

## Implementation Details

### 1. Service Layer Changes

#### **Updated Method Signatures:**
```typescript
// Save price history with force update option
private async savePriceHistoryToDB(
  symbol: string,
  dataPoints: MarketDataPoint[],
  assetId: string,
  forceUpdate: boolean = false
): Promise<void>

// Fetch and store with force update option
async fetchHistoricalPricesFromAPIAndStoreInDB(
  symbols: Array<{symbol: string, assetType: string}>,
  startDate: Date,
  endDate: Date,
  assetId?: string,
  forceUpdate: boolean = false
): Promise<BulkPriceResult>

// Get historical prices with force update option
async getHistoricalPricesForDateRangeFromAPI(
  symbols: Array<{symbol: string, assetType: string}>,
  startDate: Date,
  endDate: Date,
  forceUpdate: boolean = false
): Promise<BulkPriceResult>
```

#### **Force Update Logic:**
```typescript
if (forceUpdate) {
  // Force update: delete existing records and insert new ones
  this.logger.log(`Force update enabled for ${symbol} - deleting existing records and inserting new ones`);
  
  // Delete existing records for the date range
  const deletedCount = await this.deleteExistingPriceHistory(assetId, dataPoints);
  this.logger.log(`Deleted ${deletedCount} existing records for ${symbol}`);
  
  recordsToInsert = priceHistoryRecords;
} else {
  // Normal mode: check for duplicates
  const existingRecords = await this.checkExistingPriceHistory(assetId, dataPoints);
  
  // Filter out duplicates
  recordsToInsert = priceHistoryRecords.filter(record => {
    const recordDate = record.createdAt.toISOString().split('T')[0];
    return !existingRecords.some(existing => 
      existing.assetId === record.assetId && 
      existing.createdAt.toISOString().split('T')[0] === recordDate
    );
  });
}
```

### 2. Database Operations

#### **Delete Existing Records:**
```typescript
private async deleteExistingPriceHistory(
  assetId: string,
  dataPoints: MarketDataPoint[]
): Promise<number> {
  if (dataPoints.length === 0) return 0;

  const startDate = new Date(Math.min(...dataPoints.map(dp => new Date(dp.date).getTime())));
  const endDate = new Date(Math.max(...dataPoints.map(dp => new Date(dp.date).getTime())));

  const result = await this.assetPriceHistoryRepository
    .createQueryBuilder()
    .delete()
    .where('asset_id = :assetId', { assetId })
    .andWhere('created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
    .andWhere('price_source = :priceSource', { priceSource: PriceSource.EXTERNAL_API })
    .execute();

  return result.affected || 0;
}
```

#### **Transaction Management:**
- ✅ **ACID Compliance**: Delete and insert operations are wrapped in transactions
- ✅ **Rollback Capability**: Automatic rollback on failure
- ✅ **Data Integrity**: Ensures consistent database state

### 3. API Endpoints

#### **Updated Request Format:**
```typescript
// BulkPriceRequest with forceUpdate option
{
  "symbols": [
    { "symbol": "VFF", "assetType": "STOCK" },
    { "symbol": "HPG", "assetType": "STOCK" }
  ],
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "assetId": "550e8400-e29b-41d4-a716-446655440000",
  "forceUpdate": true  // New optional field
}
```

#### **New Force Update Endpoint:**
```typescript
// POST /api/v1/market-data/historical-prices/force-update
// Always performs force update regardless of request parameters
```

### 4. API Usage Examples

#### **Example 1: Normal Update (Default)**
```bash
POST /api/v1/market-data/bulk-historical-prices
{
  "symbols": [
    { "symbol": "VFF", "assetType": "STOCK" },
    { "symbol": "HPG", "assetType": "STOCK" }
  ],
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "assetId": "550e8400-e29b-41d4-a716-446655440000"
  // forceUpdate defaults to false
}
```

#### **Example 2: Force Update via Parameter**
```bash
POST /api/v1/market-data/bulk-historical-prices
{
  "symbols": [
    { "symbol": "VFF", "assetType": "STOCK" },
    { "symbol": "HPG", "assetType": "STOCK" }
  ],
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "assetId": "550e8400-e29b-41d4-a716-446655440000",
  "forceUpdate": true
}
```

#### **Example 3: Force Update Endpoint**
```bash
POST /api/v1/market-data/historical-prices/force-update
{
  "symbols": [
    { "symbol": "VFF", "assetType": "STOCK" },
    { "symbol": "HPG", "assetType": "STOCK" }
  ],
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "assetId": "550e8400-e29b-41d4-a716-446655440000"
  // forceUpdate is automatically set to true
}
```

## Use Cases

### 1. Data Correction
**Scenario**: Historical data was incorrect and needs to be updated
**Solution**: Use force update to replace incorrect data with corrected data

```typescript
// Correct historical data
const result = await marketDataService.fetchHistoricalPricesFromAPIAndStoreInDB(
  symbols,
  startDate,
  endDate,
  assetId,
  true // Force update to correct data
);
```

### 2. Data Source Changes
**Scenario**: Switching to a different data provider with better accuracy
**Solution**: Use force update to replace old data with new provider data

```typescript
// Update with new data source
const result = await marketDataService.getHistoricalPricesForDateRangeFromAPI(
  symbols,
  startDate,
  endDate,
  true // Force update with new data source
);
```

### 3. Data Refresh
**Scenario**: Need to refresh all historical data for analysis
**Solution**: Use force update to ensure all data is current

```typescript
// Refresh all data
const result = await marketDataService.fetchHistoricalPricesFromAPIAndStoreInDB(
  symbols,
  startDate,
  endDate,
  assetId,
  true // Force update for complete refresh
);
```

### 4. Testing and Development
**Scenario**: Testing with fresh data or development environment
**Solution**: Use force update to ensure clean test data

```typescript
// Development/testing with fresh data
const result = await marketDataService.getHistoricalPricesForDateRangeFromAPI(
  testSymbols,
  startDate,
  endDate,
  true // Force update for testing
);
```

## Performance Considerations

### 1. Normal Mode Performance
- ✅ **Fast Processing**: Skips existing records
- ✅ **Efficient Queries**: Only checks for duplicates
- ✅ **Memory Efficient**: Minimal database operations
- ✅ **Network Optimized**: Reduces API calls

### 2. Force Update Performance
- ⚠️ **Slower Processing**: Deletes and inserts all records
- ⚠️ **More Database Operations**: Delete + Insert operations
- ⚠️ **Higher Resource Usage**: More CPU and memory usage
- ⚠️ **Network Intensive**: Full data refresh

### 3. Performance Recommendations
```typescript
// Use normal mode for regular updates
const regularUpdate = await marketDataService.fetchHistoricalPricesFromAPIAndStoreInDB(
  symbols,
  startDate,
  endDate,
  assetId,
  false // Normal mode for efficiency
);

// Use force update only when necessary
const forceUpdate = await marketDataService.fetchHistoricalPricesFromAPIAndStoreInDB(
  symbols,
  startDate,
  endDate,
  assetId,
  true // Force update only when data needs refresh
);
```

## Error Handling

### 1. Force Update Errors
```typescript
// Delete operation errors
"Failed to delete existing price history for asset {assetId}: {error}"

// Insert operation errors
"Failed to batch insert price history records: {error}"

// Transaction rollback errors
"Transaction failed during force update: {error}"
```

### 2. Error Recovery
- ✅ **Transaction Rollback**: Automatic rollback on failure
- ✅ **Partial Success**: Individual symbol failures don't break bulk operations
- ✅ **Error Logging**: Comprehensive error logging with context
- ✅ **Retry Logic**: Built-in retry mechanisms for transient failures

### 3. Error Handling Examples
```typescript
try {
  const result = await marketDataService.fetchHistoricalPricesFromAPIAndStoreInDB(
    symbols,
    startDate,
    endDate,
    assetId,
    true // Force update
  );
  
  console.log(`Force update completed: ${result.success} success, ${result.failed} failed`);
} catch (error) {
  console.error('Force update failed:', error.message);
  // Handle error appropriately
}
```

## Logging and Monitoring

### 1. Force Update Logs
```
[MarketDataService] Force update enabled for VFF - deleting existing records and inserting new ones
[MarketDataService] Deleted 250 existing records for VFF
[MarketDataService] Successfully force updated 250 price records for VFF
```

### 2. Normal Mode Logs
```
[MarketDataService] Saving 250 price records for VFF to asset 550e8400-e29b-41d4-a716-446655440000
[MarketDataService] Successfully saved 200 new price records for VFF (50 duplicates skipped)
```

### 3. Metrics to Monitor
- Force update frequency
- Delete operation performance
- Insert operation performance
- Error rates for force updates
- Data accuracy improvements

## Best Practices

### 1. When to Use Force Update
- ✅ **Data Correction**: When historical data is incorrect
- ✅ **Data Source Changes**: When switching data providers
- ✅ **Complete Refresh**: When all data needs to be updated
- ✅ **Testing**: In development and testing environments

### 2. When to Use Normal Mode
- ✅ **Regular Updates**: For daily/hourly data updates
- ✅ **Large Datasets**: For processing large amounts of data
- ✅ **Performance Critical**: When speed is important
- ✅ **Production**: For production environments

### 3. Implementation Guidelines
```typescript
// Good: Use normal mode for regular updates
const regularUpdate = await service.fetchHistoricalPricesFromAPIAndStoreInDB(
  symbols, startDate, endDate, assetId, false
);

// Good: Use force update for data correction
const forceUpdate = await service.fetchHistoricalPricesFromAPIAndStoreInDB(
  symbols, startDate, endDate, assetId, true
);

// Good: Use dedicated endpoint for force updates
const forceUpdateEndpoint = await fetch('/api/v1/market-data/historical-prices/force-update', {
  method: 'POST',
  body: JSON.stringify(request)
});
```

## Testing Strategy

### 1. Unit Tests
```typescript
describe('Force Update Feature', () => {
  it('should delete existing records and insert new ones', async () => {
    // Test force update logic
  });

  it('should skip duplicate check in force update mode', async () => {
    // Test duplicate prevention bypass
  });

  it('should handle transaction rollback on failure', async () => {
    // Test transaction management
  });
});
```

### 2. Integration Tests
```typescript
describe('Force Update Integration', () => {
  it('should perform complete data refresh', async () => {
    // Test end-to-end force update
  });

  it('should maintain data integrity during force update', async () => {
    // Test data consistency
  });
});
```

## Future Enhancements

### 1. Planned Features
- **Selective Force Update**: Force update only specific date ranges
- **Batch Force Update**: Force update multiple assets simultaneously
- **Force Update Scheduling**: Automated force update scheduling
- **Force Update Analytics**: Track force update performance and impact

### 2. Performance Improvements
- **Parallel Force Updates**: Concurrent force updates for multiple assets
- **Incremental Force Updates**: Smart force updates for changed data only
- **Force Update Caching**: Cache force update results for better performance
- **Force Update Optimization**: Optimize delete and insert operations

This force update feature provides flexible data management capabilities while maintaining data integrity and performance optimization.
