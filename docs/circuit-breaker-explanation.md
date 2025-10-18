# Circuit Breaker Pattern - Cách Hoạt Động

## 🔄 **Tổng Quan**

Circuit Breaker là một design pattern giúp ngăn chặn cascade failures trong hệ thống phân tán. Nó hoạt động như một "cầu dao điện" - tự động ngắt kết nối khi phát hiện lỗi liên tục.

## 🏗️ **Kiến Trúc Hệ Thống**

```
┌─────────────────────────────────────────────────────────────┐
│                    Portfolio Management System              │
├─────────────────────────────────────────────────────────────┤
│  Auto Sync Service                                          │
│  ├── Circuit: auto-sync-operation                          │
│  └── Calls ExternalMarketDataService                       │
│                                                             │
│  External Market Data Service                              │
│  ├── FundPriceAPIClient     → Circuit: fund-price-api      │
│  ├── GoldPriceAPIClient     → Circuit: gold-price-api      │
│  ├── ExchangeRateAPIClient  → Circuit: exchange-rate-api   │
│  ├── StockPriceAPIClient    → Circuit: stock-price-api     │
│  └── CryptoPriceAPIClient   → Circuit: crypto-price-api    │
│                                                             │
│  Circuit Breaker Service (Global)                         │
│  ├── Manages all circuits                                  │
│  ├── Tracks statistics                                     │
│  └── Provides API endpoints                               │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 **3 Trạng Thái Circuit Breaker**

### 1. **CLOSED (Đóng) - Normal Operation**
```
┌─────────────┐    Success    ┌─────────────┐
│   CLOSED    │ ────────────► │   CLOSED    │
│             │               │             │
│ • Allow all │               │ • Continue  │
│   requests  │               │   normal    │
│ • Count     │               │   operation │
│   failures  │               │             │
└─────────────┘               └─────────────┘
```

### 2. **OPEN (Mở) - Fail Fast**
```
┌─────────────┐    Failures   ┌─────────────┐
│   CLOSED    │ ────────────► │    OPEN     │
│             │   (threshold) │             │
│ • Allow all │               │ • Reject    │
│   requests  │               │   all calls │
│ • Count     │               │ • Fast fail │
│   failures  │               │ • Wait for  │
└─────────────┘               │   timeout   │
                              └─────────────┘
```

### 3. **HALF_OPEN (Nửa Mở) - Testing Recovery**
```
┌─────────────┐    Timeout    ┌─────────────┐
│    OPEN     │ ────────────► │  HALF_OPEN  │
│             │               │             │
│ • Reject    │               │ • Allow     │
│   all calls │               │   limited   │
│ • Wait for  │               │   requests  │
│   timeout   │               │ • Test if   │
└─────────────┘               │   service   │
                              │   recovered │
                              └─────────────┘
```

## ⚙️ **Cấu Hình Circuit Breaker**

### **Default Configuration:**
```typescript
{
  failureThreshold: 5,        // Mở circuit sau 5 lỗi
  timeout: 60000,            // Chờ 60 giây trước khi thử lại
  successThreshold: 3,       // Cần 3 thành công để đóng circuit
  monitoringPeriod: 300000    // Cửa sổ giám sát 5 phút
}
```

### **API Client Configuration:**
```typescript
// Fund Price API
{
  failureThreshold: 3,        // Mở sau 3 lỗi
  timeout: 30000,            // Chờ 30 giây
  successThreshold: 2,       // Cần 2 thành công
  monitoringPeriod: 300000   // 5 phút giám sát
}
```

## 🔄 **Flow Hoạt Động Chi Tiết**

### **Scenario 1: Normal Operation**
```
1. Request → FundPriceAPIClient.getAllFundPrices()
2. Circuit: fund-price-api (CLOSED)
3. Execute API call to FMarket
4. Success → Update statistics
5. Return data to caller
```

### **Scenario 2: API Failure**
```
1. Request → FundPriceAPIClient.getAllFundPrices()
2. Circuit: fund-price-api (CLOSED)
3. Execute API call to FMarket
4. FAILURE → Increment failure count
5. Check: failureCount >= threshold?
6. YES → Move to OPEN state
7. Future requests → Fast fail immediately
```

### **Scenario 3: Recovery Process**
```
1. Circuit: fund-price-api (OPEN)
2. Wait for timeout (30 seconds)
3. Move to HALF_OPEN state
4. Allow limited requests
5. Success → Increment success count
6. Check: successCount >= threshold?
7. YES → Move to CLOSED state
8. NO → Move back to OPEN state
```

## 📊 **Statistics Tracking**

### **Per Circuit Statistics:**
```typescript
interface CircuitBreakerStats {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;        // Current failure count
  successCount: number;        // Current success count
  lastFailureTime: Date;       // Last failure timestamp
  lastSuccessTime: Date;       // Last success timestamp
  totalRequests: number;       // Total requests made
  totalFailures: number;       // Total failures
  totalSuccesses: number;      // Total successes
}
```

### **Example Statistics:**
```json
{
  "fund-price-api": {
    "state": "CLOSED",
    "failureCount": 0,
    "successCount": 0,
    "lastFailureTime": null,
    "lastSuccessTime": "2024-01-15T10:30:00.000Z",
    "totalRequests": 150,
    "totalFailures": 3,
    "totalSuccesses": 147
  }
}
```

## 🛡️ **Protection Mechanisms**

### **1. API Protection**
```typescript
// FundPriceAPIClient
async getAllFundPrices(): Promise<FundData[]> {
  return this.circuitBreakerService.execute(
    'fund-price-api',
    async () => {
      // Actual API call to FMarket
      const response = await this.httpService.post(url, data);
      return this.parseFundData(response.data);
    },
    {
      failureThreshold: 3,
      timeout: 30000,
      successThreshold: 2,
      monitoringPeriod: 300000
    }
  );
}
```

### **2. Auto Sync Protection**
```typescript
// AutoSyncService
private async performSync(): Promise<void> {
  return this.circuitBreakerService.execute(
    'auto-sync-operation',
    async () => {
      // Sync all global assets
      const globalAssets = await this.globalAssetRepository.find();
      // Update prices for each asset
    },
    {
      failureThreshold: 3,
      timeout: 120000,
      successThreshold: 2,
      monitoringPeriod: 600000
    }
  );
}
```

## 🔧 **API Endpoints**

### **Monitor Circuit Breakers:**
```bash
# Get all circuit breaker statistics
GET /api/v1/circuit-breaker/stats

# Get specific circuit statistics
GET /api/v1/circuit-breaker/stats/fund-price-api

# Check circuit health
GET /api/v1/circuit-breaker/health/fund-price-api
```

### **Control Circuit Breakers:**
```bash
# Reset specific circuit
POST /api/v1/circuit-breaker/reset/fund-price-api

# Reset all circuits
POST /api/v1/circuit-breaker/reset-all
```

## 🎯 **Benefits**

### **1. Fault Tolerance**
- Ngăn chặn cascade failures
- Fast fail khi service down
- Automatic recovery

### **2. Performance**
- Giảm latency khi service unavailable
- Tránh timeout chờ đợi
- Resource protection

### **3. Monitoring**
- Real-time statistics
- Health monitoring
- Manual control

### **4. Resilience**
- Self-healing system
- Graceful degradation
- Service isolation

## 🔍 **Real-World Example**

### **Scenario: FMarket API Down**
```
1. 10:00 AM - Normal operation (CLOSED)
2. 10:05 AM - FMarket API starts failing
3. 10:08 AM - 3 failures → Circuit OPEN
4. 10:08-10:38 AM - All requests fast fail
5. 10:38 AM - Timeout reached → HALF_OPEN
6. 10:38 AM - Test request succeeds
7. 10:39 AM - 2 successes → Circuit CLOSED
8. 10:39 AM - Normal operation resumes
```

### **Fallback Strategy:**
```
ExternalMarketDataService.getPriceBySymbol()
├── Try FundPriceAPIClient (circuit: fund-price-api)
├── Try GoldPriceAPIClient (circuit: gold-price-api)
├── Try ExchangeRateAPIClient (circuit: exchange-rate-api)
├── Try StockPriceAPIClient (circuit: stock-price-api)
└── Try CryptoPriceAPIClient (circuit: crypto-price-api)
```

## 🚀 **Best Practices**

### **1. Configuration Tuning**
- Adjust thresholds based on service reliability
- Set appropriate timeouts
- Monitor and adjust based on metrics

### **2. Monitoring**
- Track circuit breaker statistics
- Set up alerts for circuit state changes
- Monitor recovery times

### **3. Testing**
- Test circuit breaker behavior
- Simulate service failures
- Verify recovery mechanisms

### **4. Documentation**
- Document circuit breaker configurations
- Train team on monitoring
- Create runbooks for troubleshooting
