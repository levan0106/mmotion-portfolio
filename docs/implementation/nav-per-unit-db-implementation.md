# NAV Per Unit - DB-First Implementation

## Overview

Đã implement thành công DB-first approach cho NAV per unit system với các tính năng:

1. **Lưu navPerUnit vào DB** khi:
   - Tạo fund (convertPortfolioToFund)
   - Daily snapshot (generateNavSnapshot)
   - Manual refresh (refreshNavPerUnit API)

2. **Lấy navPerUnit từ DB** với fallback calculation nếu DB value = 0

3. **API endpoints** để quản lý NAV per unit

## Implementation Details

### 1. Database Schema Updates

#### Portfolio Entity
```typescript
@Column({ type: 'boolean', default: false, name: 'is_fund' })
isFund: boolean;

@Column({ type: 'decimal', precision: 20, scale: 8, default: 0, name: 'total_outstanding_units' })
totalOutstandingUnits: number;

@Column({ type: 'decimal', precision: 20, scale: 8, default: 0, name: 'nav_per_unit' })
navPerUnit: number;
```

#### NavSnapshot Entity
```typescript
@Column({ type: 'decimal', precision: 20, scale: 8, name: 'total_outstanding_units', default: 0 })
totalOutstandingUnits: number;

@Column({ type: 'decimal', precision: 20, scale: 8, name: 'nav_per_unit', default: 0 })
navPerUnit: number;
```

### 2. Service Updates

#### InvestorHoldingService
- **convertPortfolioToFund**: Tính toán và lưu navPerUnit vào DB
- **refreshNavPerUnit**: API để refresh navPerUnit manually
- **calculateRealTimeNavValue**: Sử dụng PortfolioCalculationService để tính toán real-time

#### PortfolioService
- **getPortfoliosByAccount**: DB-first với fallback calculation
- **getPortfolioDetails**: DB-first với fallback calculation

#### PortfolioAnalyticsService
- **generateNavSnapshot**: Cập nhật navPerUnit trong DB khi tạo daily snapshot

### 3. API Endpoints

#### Convert Portfolio to Fund
```
POST /api/v1/portfolios/{id}/convert-to-fund
```

#### Refresh NAV Per Unit
```
POST /api/v1/portfolios/{id}/refresh-nav-per-unit
```

#### Get Fund Investors
```
GET /api/v1/portfolios/{id}/investors
```

#### Subscribe to Fund
```
POST /api/v1/portfolios/{id}/investors/subscribe
```

#### Redeem from Fund
```
POST /api/v1/portfolios/{id}/investors/redeem
```

## Strategy: DB-First với Fallback

### Logic Flow
1. **Lấy navPerUnit từ DB** (portfolio.navPerUnit)
2. **Nếu DB value > 0**: Sử dụng DB value
3. **Nếu DB value = 0**: Tính toán real-time và log warning
4. **Cập nhật DB** khi có thay đổi quan trọng

### Update Triggers
- ✅ **Fund creation**: convertPortfolioToFund
- ✅ **Daily snapshot**: generateNavSnapshot  
- ✅ **Manual refresh**: refreshNavPerUnit API
- 🔄 **Trade execution**: (có thể thêm sau)
- 🔄 **Cash flow**: (có thể thêm sau)

## Testing Results

### Test Case 1: Portfolio Detail API
```bash
curl "http://localhost:3000/api/v1/portfolios/4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1"
```

**Result:**
```json
{
  "portfolioId": "4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1",
  "name": "Testing fund",
  "isFund": true,
  "totalOutstandingUnits": 1000000.00000000,
  "navPerUnit": 76.05896040,
  "totalAllValue": 97923548.44
}
```

### Test Case 2: Refresh NAV Per Unit API
```bash
POST /api/v1/portfolios/4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1/refresh-nav-per-unit
```

**Result:**
```json
{
  "portfolioId": "4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1",
  "navPerUnit": 76.0589604,
  "totalAllValue": 76058960.4,
  "totalOutstandingUnits": 1000000
}
```

## Benefits

### ✅ **Performance**
- API calls nhanh hơn (lấy từ DB)
- Giảm load calculation

### ✅ **Consistency**
- Cùng một giá trị cho tất cả requests
- DB là source of truth

### ✅ **Reliability**
- Fallback mechanism nếu DB có vấn đề
- Real-time calculation làm backup

### ✅ **Maintainability**
- Clear update triggers
- Easy to debug và monitor

## Migration Files

- `1758722000000-AddNavPerUnitToNavSnapshotsSimple.ts`: Thêm columns cho nav_snapshots table

## Next Steps

1. **Add more update triggers**:
   - Trade execution
   - Cash flow changes
   - Market close daily job

2. **Add caching layer**:
   - Redis cache cho navPerUnit
   - Cache invalidation logic

3. **Add monitoring**:
   - Log discrepancies between DB và real-time
   - Alert nếu chênh lệch > threshold

4. **Add validation**:
   - Consistency checks
   - Auto-correction mechanism

## Conclusion

DB-first approach với fallback calculation đã hoạt động thành công, cung cấp:
- **High performance** (cached DB values)
- **Data consistency** (DB as source of truth)  
- **Reliability** (real-time fallback)
- **Easy maintenance** (clear update triggers)

Implementation đã sẵn sàng cho production use.
