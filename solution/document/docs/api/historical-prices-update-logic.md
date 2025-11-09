# Historical Prices Update Logic

## Overview

The `POST /historical-prices/update` endpoint now supports two key parameters for controlling data update behavior:

1. **`cleanup`**: Delete all existing data before update (regardless of import type)
2. **`forceUpdate`**: Control duplicate handling behavior

## Update Logic

### **Cleanup Mode (`cleanup: true`)**

When `cleanup: true` is set:
- ✅ **Delete All Data**: Removes ALL existing historical price data before update
- ✅ **No Type Distinction**: Deletes data regardless of import type or source
- ✅ **Fresh Start**: Ensures completely clean database before inserting new data
- ✅ **Use Case**: Complete data refresh, data migration, or fixing corrupted data

```json
{
  "symbols": [{"symbol": "VFF", "assetType": "STOCK"}],
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "cleanup": true,
  "forceUpdate": false
}
```

### **Force Update Mode (`forceUpdate: true`)**

When `forceUpdate: true` is set:
- ✅ **Always Insert**: Always inserts new records, even if duplicates exist
- ✅ **Keep History**: Preserves existing records and adds new ones
- ✅ **No Duplicate Check**: Skips duplicate checking entirely
- ✅ **Use Case**: Data correction, adding missing records, or maintaining complete history

```json
{
  "symbols": [{"symbol": "VFF", "assetType": "STOCK"}],
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "cleanup": false,
  "forceUpdate": true
}
```

### **Normal Mode (`forceUpdate: false`)**

When `forceUpdate: false` is set:
- ✅ **Duplicate Check**: Checks for existing records with same date and price source
- ✅ **Skip Duplicates**: Only inserts records that don't already exist
- ✅ **Efficient**: Avoids unnecessary database operations
- ✅ **Use Case**: Regular updates, avoiding duplicate data

```json
{
  "symbols": [{"symbol": "VFF", "assetType": "STOCK"}],
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "cleanup": false,
  "forceUpdate": false
}
```

## Logic Flow

### **1. Cleanup Phase (if cleanup: true)**
```typescript
if (cleanup) {
  // Delete ALL existing historical price data
  await this.cleanupAllHistoricalPriceData();
}
```

**What happens:**
- Deletes all records with `price_source = 'EXTERNAL_API'`
- No distinction between asset types or import sources
- Complete database cleanup before update

### **2. Data Fetching Phase**
```typescript
// Fetch historical data from external APIs
const historicalData = await this.getBulkHistoricalMarketDataFromAPI(symbols, startDate, endDate);
```

**What happens:**
- Fetches data from appropriate external APIs based on asset type
- Handles multiple symbols in parallel
- Applies rate limiting and error handling

### **3. Data Processing Phase**

#### **Force Update Mode (forceUpdate: true)**
```typescript
if (forceUpdate) {
  // Always insert new records (keep history)
  recordsToInsert = priceHistoryRecords;
}
```

**What happens:**
- All fetched records are inserted
- No duplicate checking
- Preserves existing records
- Maintains complete history

#### **Normal Mode (forceUpdate: false)**
```typescript
else {
  // Check for duplicates and skip if already exist
  const existingRecords = await this.checkExistingPriceHistory(assetId, dataPoints);
  
  // Filter out duplicates
  recordsToInsert = priceHistoryRecords.filter(record => {
    // Skip if record exists for same date and price source
    return !existingRecords.some(existing => 
      existing.assetId === record.assetId && 
      existing.createdAt.toISOString().split('T')[0] === recordDate &&
      existing.priceSource === record.priceSource
    );
  });
}
```

**What happens:**
- Checks for existing records with same date and price source
- Filters out duplicates
- Only inserts new records
- Efficient duplicate handling

## Use Cases

### **1. Complete Data Refresh**
```json
{
  "cleanup": true,
  "forceUpdate": false
}
```
- **Use Case**: Complete data refresh, migration, or fixing corrupted data
- **Behavior**: Delete all existing data, then insert new data
- **Result**: Clean database with only new data

### **2. Data Correction**
```json
{
  "cleanup": false,
  "forceUpdate": true
}
```
- **Use Case**: Adding missing records, correcting data, or maintaining history
- **Behavior**: Keep existing data, always insert new records
- **Result**: Complete history with all records

### **3. Regular Updates**
```json
{
  "cleanup": false,
  "forceUpdate": false
}
```
- **Use Case**: Regular data updates, avoiding duplicates
- **Behavior**: Check for duplicates, skip if already exist
- **Result**: Efficient updates without duplicates

### **4. Complete Reset and Force Update**
```json
{
  "cleanup": true,
  "forceUpdate": true
}
```
- **Use Case**: Complete data reset with forced insertion
- **Behavior**: Delete all data, then insert all new records
- **Result**: Clean database with all new records

## API Examples

### **Example 1: Complete Data Refresh**
```bash
curl -X POST http://localhost:3000/api/v1/market-data/historical-prices/update \
  -H "Content-Type: application/json" \
  -d '{
    "symbols": [{"symbol": "VFF", "assetType": "STOCK"}],
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "cleanup": true,
    "forceUpdate": false
  }'
```

**Result**: Deletes all existing data, then inserts new data for VFF

### **Example 2: Data Correction**
```bash
curl -X POST http://localhost:3000/api/v1/market-data/historical-prices/update \
  -H "Content-Type: application/json" \
  -d '{
    "symbols": [{"symbol": "VFF", "assetType": "STOCK"}],
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "cleanup": false,
    "forceUpdate": true
  }'
```

**Result**: Keeps existing data, adds new records for VFF (maintains history)

### **Example 3: Regular Update**
```bash
curl -X POST http://localhost:3000/api/v1/market-data/historical-prices/update \
  -H "Content-Type: application/json" \
  -d '{
    "symbols": [{"symbol": "VFF", "assetType": "STOCK"}],
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "cleanup": false,
    "forceUpdate": false
  }'
```

**Result**: Only inserts new records that don't already exist

## Database Impact

### **Cleanup Mode**
- **Before**: Database may contain old/corrupted data
- **After**: Clean database with only new data
- **Records Deleted**: All existing historical price records
- **Records Inserted**: All new records from API

### **Force Update Mode**
- **Before**: Database contains existing records
- **After**: Database contains existing + new records
- **Records Deleted**: None
- **Records Inserted**: All new records (including duplicates)

### **Normal Mode**
- **Before**: Database contains existing records
- **After**: Database contains existing + new unique records
- **Records Deleted**: None
- **Records Inserted**: Only new unique records

## Performance Considerations

### **Cleanup Mode**
- ⚠️ **High Impact**: Deletes all existing data
- ⚠️ **Slow**: Requires full database scan and delete
- ✅ **Clean Result**: Ensures clean database
- ✅ **Use Sparingly**: Only when necessary

### **Force Update Mode**
- ⚠️ **Medium Impact**: Always inserts all records
- ⚠️ **Potential Duplicates**: May create duplicate records
- ✅ **Complete History**: Maintains all records
- ✅ **Data Integrity**: Preserves existing data

### **Normal Mode**
- ✅ **Low Impact**: Only inserts new records
- ✅ **Efficient**: Skips duplicates
- ✅ **Fast**: Minimal database operations
- ✅ **Recommended**: For regular updates

## Error Handling

### **Cleanup Errors**
```json
{
  "statusCode": 500,
  "message": "Failed to cleanup historical price data",
  "error": "Internal Server Error"
}
```

### **Force Update Errors**
```json
{
  "statusCode": 500,
  "message": "Failed to insert price records",
  "error": "Internal Server Error"
}
```

### **Duplicate Check Errors**
```json
{
  "statusCode": 500,
  "message": "Failed to check existing records",
  "error": "Internal Server Error"
}
```

## Monitoring and Logging

### **Cleanup Mode Logs**
```
[INFO] Cleanup mode: Deleting all existing historical price data
[INFO] Deleted 1250 historical price records
[INFO] Successfully saved 500 new price records for VFF
```

### **Force Update Mode Logs**
```
[INFO] Force update enabled for VFF - always inserting new records to keep history
[INFO] Successfully force updated 500 price records for VFF (keeping history)
```

### **Normal Mode Logs**
```
[INFO] Successfully saved 250 new price records for VFF (250 duplicates skipped)
```

## Best Practices

### **When to Use Cleanup Mode**
- ✅ **Data Migration**: Moving to new data structure
- ✅ **Data Corruption**: Fixing corrupted data
- ✅ **Complete Refresh**: Starting fresh with new data
- ❌ **Regular Updates**: Not recommended for regular use

### **When to Use Force Update Mode**
- ✅ **Data Correction**: Adding missing records
- ✅ **History Maintenance**: Keeping complete history
- ✅ **Data Validation**: Ensuring data completeness
- ❌ **Regular Updates**: May create unnecessary duplicates

### **When to Use Normal Mode**
- ✅ **Regular Updates**: Daily/weekly data updates
- ✅ **Efficient Processing**: Avoiding duplicates
- ✅ **Production Use**: Recommended for production
- ✅ **Performance**: Optimal for large datasets

## Conclusion

The historical prices update logic provides flexible data management options:

- **Cleanup Mode**: For complete data refresh and migration
- **Force Update Mode**: For data correction and history maintenance
- **Normal Mode**: For efficient regular updates

Choose the appropriate mode based on your specific use case and requirements.
