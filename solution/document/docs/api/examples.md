# API Examples

This document provides practical examples of how to use the MMotion Portfolio Management System API.

## Prerequisites

- API running on `http://localhost:3000`
- Valid portfolio ID: `f9cf6de3-36ef-4581-8b29-1aa872ed9658`
- Sample data loaded (run the sample data scripts)

## Trading Analysis Examples

### 1. Get Comprehensive Trading Analysis

```bash
curl -X GET "http://localhost:3000/api/v1/trades/analysis/portfolio?portfolioId=f9cf6de3-36ef-4581-8b29-1aa872ed9658" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "statistics": {
    "total_trades": 20,
    "buy_trades": 10,
    "sell_trades": 10,
    "total_volume": 327646000,
    "total_value": 327646000,
    "average_price": 6514200,
    "total_fees": 467000,
    "total_taxes": 223000
  },
  "pnlSummary": {
    "totalPnl": -12168611.2,
    "totalVolume": 327646000,
    "averagePnl": -3042152.8,
    "winCount": 4,
    "lossCount": 5,
    "winRate": 44.44
  },
  "risk_metrics": {
    "sharpe_ratio": -0.01,
    "volatility": 22465273.16,
    "var_95": -35627000,
    "max_drawdown": 37569000
  }
}
```

### 2. Get Analysis for Specific Asset

```bash
curl -X GET "http://localhost:3000/api/v1/trades/analysis/portfolio?portfolioId=f9cf6de3-36ef-4581-8b29-1aa872ed9658&assetId=195c429b-66be-4a65-87cc-0929cf35ad3c" \
  -H "Content-Type: application/json"
```

### 3. Get Analysis for Date Range

```bash
curl -X GET "http://localhost:3000/api/v1/trades/analysis/portfolio?portfolioId=f9cf6de3-36ef-4581-8b29-1aa872ed9658&startDate=2024-01-01&endDate=2024-06-30" \
  -H "Content-Type: application/json"
```

## Portfolio Management Examples

### 1. Get Portfolio Positions

```bash
curl -X GET "http://localhost:3000/api/v1/portfolios/f9cf6de3-36ef-4581-8b29-1aa872ed9658/positions" \
  -H "Content-Type: application/json"
```

**Response:**
```json
[
  {
    "asset_id": "0de842f3-eefc-41f1-aaae-04655ce6b4b6",
    "symbol": "GOLD",
    "name": "Gold",
    "quantity": "121.700000",
    "avg_cost": "1532903.49",
    "market_value": "188635000.00",
    "unrealized_pl": "2080645.58"
  },
  {
    "asset_id": "195c429b-66be-4a65-87cc-0929cf35ad3c",
    "symbol": "VCB",
    "name": "Vietcombank",
    "quantity": "290.000000",
    "avg_cost": "86868.64",
    "market_value": "24650000.00",
    "unrealized_pl": "-541906.78"
  }
]
```

### 2. Get Portfolio Analytics

```bash
curl -X GET "http://localhost:3000/api/v1/portfolios/f9cf6de3-36ef-4581-8b29-1aa872ed9658/analytics/performance" \
  -H "Content-Type: application/json"
```

### 3. Get Portfolio Allocation

```bash
curl -X GET "http://localhost:3000/api/v1/portfolios/f9cf6de3-36ef-4581-8b29-1aa872ed9658/analytics/allocation" \
  -H "Content-Type: application/json"
```

## Trade Management Examples

### 1. Get All Trades

```bash
curl -X GET "http://localhost:3000/api/v1/trades?portfolioId=f9cf6de3-36ef-4581-8b29-1aa872ed9658" \
  -H "Content-Type: application/json"
```

### 2. Create a New Trade

```bash
curl -X POST "http://localhost:3000/api/v1/trades" \
  -H "Content-Type: application/json" \
  -d '{
    "portfolio_id": "f9cf6de3-36ef-4581-8b29-1aa872ed9658",
    "asset_id": "195c429b-66be-4a65-87cc-0929cf35ad3c",
    "trade_date": "2024-09-12",
    "side": "BUY",
    "quantity": 100,
    "price": 95000,
    "fee": 5000,
    "tax": 2500,
    "trade_type": "NORMAL",
    "source": "MANUAL",
    "notes": "Test trade"
  }'
```

**Response:**
```json
{
  "trade_id": "new-uuid-here",
  "portfolio_id": "f9cf6de3-36ef-4581-8b29-1aa872ed9658",
  "asset_id": "195c429b-66be-4a65-87cc-0929cf35ad3c",
  "trade_date": "2024-09-12T00:00:00.000Z",
  "side": "BUY",
  "quantity": "100.00000000",
  "price": "95000.00000000",
  "fee": "5000.00000000",
  "tax": "2500.00000000",
  "trade_type": "NORMAL",
  "source": "MANUAL",
  "notes": "Test trade",
  "created_at": "2024-09-12T14:30:00.000Z",
  "updated_at": "2024-09-12T14:30:00.000Z"
}
```

### 3. Process Trade Matching

```bash
curl -X POST "http://localhost:3000/api/v1/trades/{trade-id}/match" \
  -H "Content-Type: application/json"
```

### 4. Get Trade Details

```bash
curl -X GET "http://localhost:3000/api/v1/trades/{trade-id}" \
  -H "Content-Type: application/json"
```

## JavaScript/TypeScript Examples

### 1. Fetch Trading Analysis

```javascript
async function getTradingAnalysis(portfolioId) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/v1/trades/analysis/portfolio?portfolioId=${portfolioId}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching trading analysis:', error);
    throw error;
  }
}

// Usage
const analysis = await getTradingAnalysis('f9cf6de3-36ef-4581-8b29-1aa872ed9658');
console.log('Total P&L:', analysis.pnlSummary.totalPnl);
console.log('Win Rate:', analysis.pnlSummary.winRate);
```

### 2. Create Trade with Error Handling

```javascript
async function createTrade(tradeData) {
  try {
    const response = await fetch('http://localhost:3000/api/v1/trades', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tradeData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.message}`);
    }
    
    const trade = await response.json();
    return trade;
  } catch (error) {
    console.error('Error creating trade:', error);
    throw error;
  }
}

// Usage
const newTrade = await createTrade({
  portfolio_id: 'f9cf6de3-36ef-4581-8b29-1aa872ed9658',
  asset_id: '195c429b-66be-4a65-87cc-0929cf35ad3c',
  trade_date: '2024-09-12',
  side: 'BUY',
  quantity: 100,
  price: 95000,
  fee: 5000,
  tax: 2500,
  trade_type: 'NORMAL',
  source: 'MANUAL',
  notes: 'Test trade'
});
```

### 3. Get Portfolio Positions

```javascript
async function getPortfolioPositions(portfolioId) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/v1/portfolios/${portfolioId}/positions`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const positions = await response.json();
    return positions;
  } catch (error) {
    console.error('Error fetching portfolio positions:', error);
    throw error;
  }
}

// Usage
const positions = await getPortfolioPositions('f9cf6de3-36ef-4581-8b29-1aa872ed9658');
positions.forEach(position => {
  console.log(`${position.symbol}: ${position.quantity} @ ${position.avg_cost}`);
});
```

## Python Examples

### 1. Trading Analysis with Requests

```python
import requests
import json

def get_trading_analysis(portfolio_id):
    url = f"http://localhost:3000/api/v1/trades/analysis/portfolio"
    params = {"portfolioId": portfolio_id}
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching trading analysis: {e}")
        raise

# Usage
analysis = get_trading_analysis("f9cf6de3-36ef-4581-8b29-1aa872ed9658")
print(f"Total P&L: {analysis['pnlSummary']['totalPnl']}")
print(f"Win Rate: {analysis['pnlSummary']['winRate']}%")
```

### 2. Create Trade with Python

```python
def create_trade(trade_data):
    url = "http://localhost:3000/api/v1/trades"
    headers = {"Content-Type": "application/json"}
    
    try:
        response = requests.post(url, json=trade_data, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error creating trade: {e}")
        raise

# Usage
trade_data = {
    "portfolio_id": "f9cf6de3-36ef-4581-8b29-1aa872ed9658",
    "asset_id": "195c429b-66be-4a65-87cc-0929cf35ad3c",
    "trade_date": "2024-09-12",
    "side": "BUY",
    "quantity": 100,
    "price": 95000,
    "fee": 5000,
    "tax": 2500,
    "trade_type": "NORMAL",
    "source": "MANUAL",
    "notes": "Test trade"
}

new_trade = create_trade(trade_data)
print(f"Created trade: {new_trade['trade_id']}")
```

## Error Handling Examples

### 1. Handle API Errors

```javascript
async function handleApiCall(apiCall) {
  try {
    const result = await apiCall();
    return result;
  } catch (error) {
    if (error.response) {
      // API returned an error response
      const { status, data } = error.response;
      console.error(`API Error ${status}:`, data.message);
      
      switch (status) {
        case 400:
          console.error('Bad Request:', data.message);
          break;
        case 404:
          console.error('Not Found:', data.message);
          break;
        case 500:
          console.error('Server Error:', data.message);
          break;
        default:
          console.error('Unknown Error:', data.message);
      }
    } else if (error.request) {
      // Network error
      console.error('Network Error:', error.message);
    } else {
      // Other error
      console.error('Error:', error.message);
    }
    throw error;
  }
}
```

### 2. Retry Logic

```javascript
async function retryApiCall(apiCall, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      console.log(`Attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

// Usage
const analysis = await retryApiCall(() => 
  getTradingAnalysis('f9cf6de3-36ef-4581-8b29-1aa872ed9658')
);
```

## Testing Examples

### 1. Unit Test Example

```javascript
describe('Trading Analysis API', () => {
  test('should return trading analysis for valid portfolio', async () => {
    const portfolioId = 'f9cf6de3-36ef-4581-8b29-1aa872ed9658';
    const analysis = await getTradingAnalysis(portfolioId);
    
    expect(analysis).toHaveProperty('statistics');
    expect(analysis).toHaveProperty('pnlSummary');
    expect(analysis).toHaveProperty('risk_metrics');
    expect(analysis.statistics.total_trades).toBeGreaterThan(0);
  });
  
  test('should handle invalid portfolio ID', async () => {
    const invalidPortfolioId = 'invalid-id';
    
    await expect(getTradingAnalysis(invalidPortfolioId))
      .rejects.toThrow('HTTP error! status: 404');
  });
});
```

### 2. Integration Test Example

```javascript
describe('Trade Creation Flow', () => {
  test('should create trade and update portfolio', async () => {
    const tradeData = {
      portfolio_id: 'f9cf6de3-36ef-4581-8b29-1aa872ed9658',
      asset_id: '195c429b-66be-4a65-87cc-0929cf35ad3c',
      trade_date: '2024-09-12',
      side: 'BUY',
      quantity: 100,
      price: 95000,
      fee: 5000,
      tax: 2500,
      trade_type: 'NORMAL',
      source: 'MANUAL',
      notes: 'Test trade'
    };
    
    // Create trade
    const trade = await createTrade(tradeData);
    expect(trade.trade_id).toBeDefined();
    
    // Verify portfolio positions updated
    const positions = await getPortfolioPositions(tradeData.portfolio_id);
    const assetPosition = positions.find(p => p.asset_id === tradeData.asset_id);
    expect(assetPosition).toBeDefined();
  });
});
```

## Performance Testing

### 1. Load Testing with Artillery

```yaml
# artillery-config.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Trading Analysis API"
    requests:
      - get:
          url: "/api/v1/trades/analysis/portfolio?portfolioId=f9cf6de3-36ef-4581-8b29-1aa872ed9658"
```

```bash
# Run load test
artillery run artillery-config.yml
```

### 2. Response Time Monitoring

```javascript
async function monitorApiPerformance(apiCall, iterations = 100) {
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await apiCall();
    const end = Date.now();
    times.push(end - start);
  }
  
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const maxTime = Math.max(...times);
  const minTime = Math.min(...times);
  
  console.log(`Average response time: ${avgTime}ms`);
  console.log(`Max response time: ${maxTime}ms`);
  console.log(`Min response time: ${minTime}ms`);
}

// Usage
monitorApiPerformance(() => 
  getTradingAnalysis('f9cf6de3-36ef-4581-8b29-1aa872ed9658')
);
```

## Troubleshooting

### Common Issues and Solutions

1. **Connection Refused**
   ```bash
   # Check if server is running
   curl http://localhost:3000/health
   ```

2. **Invalid Portfolio ID**
   ```bash
   # Get available portfolios
   curl http://localhost:3000/api/v1/trades/test-data
   ```

3. **Database Connection Issues**
   ```bash
   # Check database status
   pg_ctl status
   ```

4. **CORS Issues**
   - Ensure proper CORS headers are set
   - Check if requests are coming from allowed origins

5. **Rate Limiting**
   - Implement exponential backoff
   - Use connection pooling
   - Cache frequently accessed data
