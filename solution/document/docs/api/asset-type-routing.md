# Asset Type Routing - Market Data Service

## Overview
The Market Data Service now supports routing to different external providers based on asset type. This allows the system to fetch historical data from the most appropriate source for each type of financial instrument.

## Asset Type to Provider Mapping

### 📊 **Stock & ETF Data**
- **Asset Types**: `STOCK`, `ETF`
- **Provider**: CAFEF API
- **Method**: `getStockHistoricalDataFromCAFEF()`
- **Data Source**: `https://cafef.vn/du-lieu/Ajax/PageNew/DataHistory/PriceHistory.ashx`

### 💰 **Fund Data**
- **Asset Types**: `FUND`
- **Provider**: FMarket API
- **Method**: `getFundHistoricalDataFromFMarket()`
- **Data Source**: `https://api.fmarket.vn`

### 🥇 **Gold Data**
- **Asset Types**: `GOLD`
- **Provider**: Doji API
- **Method**: `getGoldHistoricalDataFromDoji()`
- **Data Source**: Doji Gold API

### 💱 **Exchange Rate Data**
- **Asset Types**: `EXCHANGE_RATE`
- **Provider**: Vietcombank API
- **Method**: `getExchangeRateHistoricalDataFromVietcombank()`
- **Data Source**: Vietcombank Exchange Rate API

### 🪙 **Cryptocurrency Data**
- **Asset Types**: `CRYPTO`
- **Provider**: CoinGecko API
- **Method**: `getCryptoHistoricalDataFromCoinGecko()`
- **Data Source**: `https://api.coingecko.com`

## API Usage Examples

### Example 1: Mixed Asset Types
```typescript
const symbols = [
  { symbol: 'VFF', assetType: 'STOCK' },      // → CAFEF API
  { symbol: 'VESAF', assetType: 'FUND' },     // → FMarket API
  { symbol: 'DOJI', assetType: 'GOLD' },      // → Doji API
  { symbol: 'USD', assetType: 'EXCHANGE_RATE' }, // → Vietcombank API
  { symbol: 'BTC', assetType: 'CRYPTO' }      // → CoinGecko API
];

const result = await marketDataService.getHistoricalPricesForDateRangeFromAPI(
  symbols,
  new Date('2024-01-01'),
  new Date('2024-01-31')
);
```

### Example 2: Single Asset Type
```typescript
// Get stock data from CAFEF
const stockData = await marketDataService.getHistoricalMarketDataFromAPI(
  'VFF',
  'STOCK',
  '01/01/2024',
  '01/31/2024'
);

// Get fund data from FMarket
const fundData = await marketDataService.getHistoricalMarketDataFromAPI(
  'VESAF',
  'FUND',
  '01/01/2024',
  '01/31/2024'
);
```

### Example 3: Bulk Operations
```typescript
const symbols = [
  { symbol: 'VFF', assetType: 'STOCK' },
  { symbol: 'HPG', assetType: 'STOCK' },
  { symbol: 'VCB', assetType: 'STOCK' }
];

const result = await marketDataService.fetchHistoricalPricesFromAPIAndStoreInDB(
  symbols,
  new Date('2024-01-01'),
  new Date('2024-01-31'),
  'asset-id-123'
);
```

## HTTP API Endpoints

### POST /api/v1/market-data/bulk-historical-prices
```json
{
  "symbols": [
    { "symbol": "VFF", "assetType": "STOCK" },
    { "symbol": "VESAF", "assetType": "FUND" },
    { "symbol": "DOJI", "assetType": "GOLD" }
  ],
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "assetId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### POST /api/v1/market-data/historical-prices
```json
{
  "symbols": [
    { "symbol": "VFF", "assetType": "STOCK" },
    { "symbol": "HPG", "assetType": "STOCK" }
  ],
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

## Provider Implementation Status

### ✅ **Implemented Providers**

#### CAFEF API (Stock/ETF)
- **Status**: ✅ Fully Implemented
- **Features**: Historical price data, volume, value
- **Rate Limits**: Standard HTTP rate limits
- **Data Format**: Vietnamese date format (DD/MM/YYYY)

#### FMarket API (Fund)
- **Status**: 🚧 Placeholder Implementation
- **Features**: Fund price history (to be implemented)
- **Rate Limits**: TBD
- **Data Format**: TBD

#### Doji API (Gold)
- **Status**: 🚧 Placeholder Implementation
- **Features**: Gold price history (to be implemented)
- **Rate Limits**: TBD
- **Data Format**: TBD

#### Vietcombank API (Exchange Rate)
- **Status**: 🚧 Placeholder Implementation
- **Features**: Exchange rate history (to be implemented)
- **Rate Limits**: TBD
- **Data Format**: TBD

#### CoinGecko API (Crypto)
- **Status**: 🚧 Placeholder Implementation
- **Features**: Cryptocurrency price history (to be implemented)
- **Rate Limits**: TBD
- **Data Format**: TBD

### 🔄 **Fallback Strategy**
- **Unknown Asset Types**: Falls back to CAFEF API
- **Provider Failures**: Individual symbol failures don't break bulk operations
- **Error Handling**: Comprehensive error logging and reporting

## Data Transformation

### Common Data Format
All providers return data in the standardized `MarketDataPoint` format:

```typescript
interface MarketDataPoint {
  date: string;           // ISO date format (YYYY-MM-DD)
  closePrice: number;     // Closing price
  change: number;         // Price change
  changePercent: number;  // Percentage change
  volume: number;         // Trading volume
  value: number;         // Trading value
}
```

### Provider-Specific Transformations

#### CAFEF API Transformation
```typescript
// Raw CAFEF data → MarketDataPoint
{
  Ngay: "15/01/2024",           // → date: "2024-01-15"
  GiaDongCua: 34000,           // → closePrice: 34000
  ThayDoi: "1000(2.94%)",      // → change: 1000, changePercent: 2.94
  KhoiLuongKhopLenh: 1000000,  // → volume: 1000000
  GiaTriKhopLenh: 34000000000  // → value: 34000000000
}
```

#### FMarket API Transformation (To be implemented)
```typescript
// Raw FMarket data → MarketDataPoint
// TODO: Implement transformation logic
```

## Error Handling

### Provider-Specific Errors
```typescript
// CAFEF API Errors
"VFF CAFEF API error: Invalid symbol"
"VFF CAFEF API error: Date range too large"

// FMarket API Errors (Future)
"VESAF FMarket API error: Fund not found"
"VESAF FMarket API error: Rate limit exceeded"

// Doji API Errors (Future)
"DOJI Doji API error: Gold type not supported"
"DOJI Doji API error: Service unavailable"
```

### Bulk Operation Error Handling
```typescript
// Individual symbol failures don't break bulk operations
const result = {
  success: 3,           // 3 symbols processed successfully
  failed: 1,              // 1 symbol failed
  errors: [               // Detailed error messages
    "Failed to fetch data for DOJI (GOLD): Service unavailable"
  ],
  totalRecords: 750,      // Total records fetched
  processedSymbols: [...] // Successfully processed symbols
};
```

## Performance Considerations

### Concurrency Control
- **Parallel Processing**: 5 symbols processed concurrently
- **Provider Rate Limits**: Each provider has its own rate limits
- **Chunked Processing**: Large symbol lists are processed in chunks

### Caching Strategy
- **API Data**: No caching (always fresh data)
- **Database Data**: Cached for fast retrieval
- **Real-time Data**: In-memory cache with periodic updates

### Memory Management
- **Streaming Processing**: Large datasets processed in chunks
- **Garbage Collection**: Automatic cleanup of processed data
- **Memory Monitoring**: Logs memory usage for large operations

## Future Enhancements

### Planned Implementations
1. **FMarket API Integration**: Complete fund historical data
2. **Doji API Integration**: Complete gold historical data
3. **Vietcombank API Integration**: Complete exchange rate data
4. **CoinGecko API Integration**: Complete cryptocurrency data

### Additional Providers
1. **SSI API**: Alternative stock data source
2. **Vietcombank Securities**: Additional fund data
3. **SJC API**: Alternative gold data source
4. **Binance API**: Additional crypto data source

### Advanced Features
1. **Provider Failover**: Automatic fallback to alternative providers
2. **Data Validation**: Cross-provider data validation
3. **Performance Metrics**: Provider response time monitoring
4. **Cost Optimization**: Provider cost analysis and optimization

## Testing Strategy

### Unit Tests
```typescript
// Test individual provider methods
describe('CAFEF API', () => {
  it('should fetch stock data correctly', async () => {
    const data = await service.getStockHistoricalDataFromCAFEF('VFF', '01/01/2024', '01/31/2024');
    expect(data).toBeDefined();
    expect(data.length).toBeGreaterThan(0);
  });
});

// Test asset type routing
describe('Asset Type Routing', () => {
  it('should route STOCK to CAFEF', async () => {
    const data = await service.getHistoricalMarketDataFromAPI('VFF', 'STOCK', '01/01/2024', '01/31/2024');
    expect(data).toBeDefined();
  });
});
```

### Integration Tests
```typescript
// Test bulk operations
describe('Bulk Historical Data', () => {
  it('should process mixed asset types', async () => {
    const symbols = [
      { symbol: 'VFF', assetType: 'STOCK' },
      { symbol: 'VESAF', assetType: 'FUND' }
    ];
    const result = await service.getBulkHistoricalMarketDataFromAPI(symbols, startDate, endDate);
    expect(result.size).toBe(2);
  });
});
```

## Monitoring and Logging

### Log Messages
```
[MarketDataService] Fetching VFF (STOCK) data from 2024-01-01 to 2024-01-31
[MarketDataService] Fetching stock data from CAFEF for VFF
[MarketDataService] Successfully fetched 22 stock data points from CAFEF for VFF
[MarketDataService] Fetching VESAF (FUND) data from 2024-01-01 to 2024-01-31
[MarketDataService] FMarket historical data not yet implemented for VESAF
```

### Metrics to Monitor
- Provider response times
- Success/failure rates per provider
- Data quality metrics
- Rate limit usage
- Error frequency by provider

This asset type routing system provides a flexible and extensible foundation for fetching historical market data from multiple specialized providers.
