# Bulk Historical Prices API Documentation

## Overview
This API allows fetching historical market prices for multiple symbols within a specified date range and optionally storing them in the database for future calculations.

## Endpoints

### 1. Fetch Bulk Historical Prices (with DB storage)
**POST** `/api/v1/market-data/bulk-historical-prices`

Fetches historical prices for multiple symbols and stores them in the database.

#### Request Body
```json
{
  "symbols": ["VFF", "VESAF", "DOJI", "HPG", "VCB"],
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "assetId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Response
```json
{
  "success": 5,
  "failed": 0,
  "errors": [],
  "totalRecords": 1250,
  "processedSymbols": [
    {
      "symbol": "VFF",
      "recordCount": 250,
      "dateRange": {
        "start": "2024-01-01",
        "end": "2024-01-31"
      }
    },
    {
      "symbol": "VESAF",
      "recordCount": 250,
      "dateRange": {
        "start": "2024-01-01",
        "end": "2024-01-31"
      }
    }
  ]
}
```

### 2. Get Historical Prices (without DB storage)
**POST** `/api/v1/market-data/historical-prices`

Fetches historical prices for multiple symbols without storing them in the database.

#### Request Body
```json
{
  "symbols": ["VFF", "VESAF", "DOJI"],
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

#### Response
Same format as above, but without database storage.

## Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbols` | string[] | Yes | Array of market symbols to fetch |
| `startDate` | string | Yes | Start date in YYYY-MM-DD format |
| `endDate` | string | Yes | End date in YYYY-MM-DD format |
| `assetId` | string | No | Asset ID to associate with prices (only for bulk-historical-prices endpoint) |

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | number | Number of symbols successfully processed |
| `failed` | number | Number of symbols that failed to process |
| `errors` | string[] | Array of error messages for failed symbols |
| `totalRecords` | number | Total number of price records fetched |
| `processedSymbols` | object[] | Array of processed symbol details |

### ProcessedSymbol Object
| Field | Type | Description |
|-------|------|-------------|
| `symbol` | string | Market symbol |
| `recordCount` | number | Number of price records for this symbol |
| `dateRange` | object | Date range of the data |
| `dateRange.start` | string | Start date of the data |
| `dateRange.end` | string | End date of the data |

## Usage Examples

### Example 1: Fetch Historical Prices for Portfolio
```bash
curl -X POST "http://localhost:3000/api/v1/market-data/bulk-historical-prices" \
  -H "Content-Type: application/json" \
  -d '{
    "symbols": ["VFF", "VESAF", "DOJI", "HPG", "VCB"],
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "assetId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

### Example 2: Get Historical Prices for Analysis
```bash
curl -X POST "http://localhost:3000/api/v1/market-data/historical-prices" \
  -H "Content-Type: application/json" \
  -d '{
    "symbols": ["VFF", "VESAF"],
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }'
```

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Invalid date format",
  "error": "Bad Request"
}
```

#### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Failed to fetch market data",
  "error": "Internal Server Error"
}
```

## Performance Considerations

### Concurrency Limits
- Maximum 5 symbols processed concurrently
- Rate limiting to prevent API overload
- Chunked processing for large symbol lists

### Database Storage
- Batch insertion for better performance
- Duplicate detection and handling
- Transaction management for data integrity

### Memory Management
- Streaming processing for large datasets
- Garbage collection optimization
- Memory monitoring and limits

## Data Storage Format

When storing to database, the following format is used:

```typescript
{
  assetId: string,
  price: number,
  priceType: 'MARKET_DATA',
  priceSource: 'EXTERNAL_API',
  changeReason: 'Historical price data for {symbol}',
  metadata: {
    symbol: string,
    date: string,
    change: number,
    changePercent: number,
    volume: number,
    value: number,
    source: 'Market Data Service'
  },
  createdAt: Date
}
```

## Best Practices

### 1. Date Range Selection
- Keep date ranges reasonable (max 1 year per request)
- Use business days for better data quality
- Consider market holidays and weekends

### 2. Symbol Selection
- Limit to 10-20 symbols per request
- Use relevant symbols for your use case
- Consider symbol availability and data quality

### 3. Error Handling
- Always check the `failed` count in response
- Handle errors gracefully in your application
- Implement retry logic for failed symbols

### 4. Performance Optimization
- Use the appropriate endpoint (with/without DB storage)
- Batch requests when possible
- Monitor API rate limits

## Integration Examples

### JavaScript/TypeScript
```typescript
const response = await fetch('/api/v1/market-data/bulk-historical-prices', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    symbols: ['VFF', 'VESAF', 'DOJI'],
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    assetId: 'your-asset-id'
  })
});

const result = await response.json();
console.log(`Processed ${result.success} symbols with ${result.totalRecords} total records`);
```

### Python
```python
import requests

response = requests.post(
    'http://localhost:3000/api/v1/market-data/bulk-historical-prices',
    json={
        'symbols': ['VFF', 'VESAF', 'DOJI'],
        'startDate': '2024-01-01',
        'endDate': '2024-01-31',
        'assetId': 'your-asset-id'
    }
)

result = response.json()
print(f"Processed {result['success']} symbols with {result['totalRecords']} total records")
```

## Monitoring and Logging

### Log Messages
- `Starting bulk historical price fetch for {count} symbols`
- `Successfully fetched {count} data points for {symbol}`
- `Bulk fetch completed. Success: {success}, Errors: {errors}`
- `Saving {count} price records for {symbol} to asset {assetId}`

### Metrics to Monitor
- API response times
- Success/failure rates
- Database insertion performance
- Memory usage during bulk operations
- External API rate limits

## Troubleshooting

### Common Issues

1. **No data returned for symbols**
   - Check if symbols are valid and available
   - Verify date range includes trading days
   - Check external API availability

2. **Database insertion failures**
   - Verify assetId exists in database
   - Check database connection and permissions
   - Review duplicate detection logic

3. **Performance issues**
   - Reduce number of symbols per request
   - Use smaller date ranges
   - Check system resources and limits

### Debug Information
- Enable debug logging for detailed information
- Check external API status and rate limits
- Monitor database performance and connections
- Review error messages in response
