# NAV Per Unit Strategy - Hybrid Approach

## Current State Analysis

### ✅ What's Working:
1. **InvestorHoldingService** cập nhật `navPerUnit` vào DB sau mỗi subscription/redemption
2. **PortfolioService** tính toán real-time cho API calls
3. **Database migration** đã có columns cần thiết

### ❌ Issues:
1. **Inconsistency**: DB có thể không sync với real-time calculation
2. **Performance**: Real-time calculation mỗi API call
3. **Missing triggers**: Không cập nhật khi có trade/cash flow

## Recommended Strategy: Enhanced Hybrid Approach

### 1. **Database as Source of Truth**
- Lưu `navPerUnit` trong DB
- Cập nhật khi có thay đổi quan trọng

### 2. **Real-time as Fallback**
- Tính toán real-time nếu DB value = 0 hoặc quá cũ
- Cache kết quả trong thời gian ngắn

### 3. **Update Triggers**
- **Trade execution**: Cập nhật khi có buy/sell
- **Cash flow**: Cập nhật khi có deposit/withdrawal
- **Market close**: Cập nhật hàng ngày
- **Manual refresh**: API để force update

## Implementation Plan

### Phase 1: Enhanced DB Updates
```typescript
// Cập nhật navPerUnit trong các scenarios:
1. Trade execution (buy/sell assets)
2. Cash flow (deposit/withdrawal)
3. Fund subscription/redemption
4. Daily market close
5. Manual refresh API
```

### Phase 2: Smart Caching
```typescript
// Cache strategy:
1. Cache navPerUnit trong Redis (5 phút)
2. Fallback to real-time nếu cache miss
3. Invalidate cache khi có updates
```

### Phase 3: Consistency Checks
```typescript
// Validation:
1. So sánh DB value vs real-time calculation
2. Log discrepancies
3. Auto-correct nếu chênh lệch > threshold
```

## Benefits

### ✅ **Performance**
- API calls nhanh hơn (lấy từ DB/cache)
- Giảm load calculation

### ✅ **Consistency**
- Cùng một giá trị cho tất cả requests
- DB là source of truth

### ✅ **Reliability**
- Fallback mechanism nếu DB có vấn đề
- Real-time calculation làm backup

### ✅ **Scalability**
- Có thể handle nhiều concurrent requests
- Cache giảm database load

## Migration Strategy

### Step 1: Add Update Triggers
- Cập nhật `navPerUnit` trong trade execution
- Cập nhật trong cash flow processing

### Step 2: Implement Caching
- Redis cache cho `navPerUnit`
- Cache invalidation logic

### Step 3: Add Validation
- Consistency checks
- Auto-correction mechanism

### Step 4: Performance Monitoring
- Monitor API response times
- Track cache hit rates
- Log calculation discrepancies

## Conclusion

Hybrid approach với DB storage + smart caching + real-time fallback sẽ cho:
- **Best performance** (cached DB values)
- **High reliability** (real-time fallback)
- **Data consistency** (DB as source of truth)
- **Easy maintenance** (clear update triggers)
