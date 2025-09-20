# Cache Management for Development

## Overview

Hệ thống sử dụng 2 loại cache:
1. **NestJS Cache Manager** (Redis-based) - cho portfolio, trading services
2. **AssetCacheService** (in-memory) - cho asset computed fields

## Tắt Cache cho Development Testing

### Cách 1: Sử dụng Script (Khuyến nghị)

#### Windows (PowerShell)
```powershell
# Tắt cache
.\scripts\toggle-cache.ps1 off

# Bật cache
.\scripts\toggle-cache.ps1 on

# Xem trạng thái hiện tại
.\scripts\toggle-cache.ps1
```

#### Linux/Mac (Bash)
```bash
# Tắt cache
./scripts/toggle-cache.sh off

# Bật cache
./scripts/toggle-cache.sh on

# Xem trạng thái hiện tại
./scripts/toggle-cache.sh
```

### Cách 2: Cập nhật Environment Variables

#### Tạo file .env.local
```bash
# Tạo file .env.local để override .env
echo "CACHE_ENABLED=false" > .env.local
```

#### Hoặc cập nhật .env
```bash
# Sửa file .env
CACHE_ENABLED=false
```

#### Hoặc cập nhật docker-compose.yml
```yaml
environment:
  - CACHE_ENABLED=false
```

## Restart Application

Sau khi thay đổi cache settings, restart application:

```bash
# Docker Compose
docker-compose down && docker-compose up -d

# Hoặc local development
npm run start:dev
```

## Kiểm tra Cache Status

### Xem Environment Variables
```bash
# Windows
Get-Content .env | Select-String CACHE_ENABLED
Get-Content docker-compose.yml | Select-String CACHE_ENABLED

# Linux/Mac
grep CACHE_ENABLED .env
grep CACHE_ENABLED docker-compose.yml
```

### Xem Logs
Khi cache bị tắt, bạn sẽ thấy logs:
```
Cache disabled - skipping cache operations
```

## Cache Configuration

### Environment Variables
- `CACHE_ENABLED=true/false` - Bật/tắt cache toàn bộ hệ thống
- `CACHE_TTL=300000` - Cache TTL (5 phút)
- `CACHE_MAX_ITEMS=1000` - Số lượng items tối đa trong cache

### Services Affected
- `PortfolioService` - Portfolio data caching
- `PortfolioAnalyticsService` - Analytics data caching  
- `TradingService` - Trading data caching
- `AssetCacheService` - Asset computed fields caching

## Development Best Practices

1. **Tắt cache khi development** để thấy data changes ngay lập tức
2. **Bật cache khi testing performance** để kiểm tra cache behavior
3. **Sử dụng script** để dễ dàng toggle cache on/off
4. **Restart application** sau khi thay đổi cache settings

## Troubleshooting

### Cache không tắt
1. Kiểm tra environment variables
2. Restart application
3. Kiểm tra logs để confirm cache disabled

### Performance Issues
1. Bật cache cho production
2. Tối ưu cache TTL
3. Monitor cache hit rates

### Data không update
1. Tắt cache để force fresh data
2. Clear cache manually nếu cần
3. Kiểm tra cache invalidation logic
