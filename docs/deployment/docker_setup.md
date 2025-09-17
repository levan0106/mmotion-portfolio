# Portfolio Management System - Docker Setup

## Docker Configuration

### Multi-stage Dockerfile for Backend
```dockerfile
# Backend Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy the built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

USER nestjs

EXPOSE 3000

ENV PORT=3000

CMD ["node", "dist/main.js"]
```

### Frontend Dockerfile
```dockerfile
# Frontend Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run nginx
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

# Copy the built application
COPY --from=builder /app/dist .

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose for Development
```yaml
# docker-compose.yml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:14-alpine
    container_name: portfolio-postgres
    environment:
      POSTGRES_DB: portfolio_db
      POSTGRES_USER: portfolio_user
      POSTGRES_PASSWORD: portfolio_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - portfolio-network

  # Redis Cache
  redis:
    image: redis:6-alpine
    container_name: portfolio-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - portfolio-network

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: portfolio-backend
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://portfolio_user:portfolio_password@postgres:5432/portfolio_db
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your-jwt-secret-key
      PORT: 3000
    ports:
      - "3000:3000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis
    networks:
      - portfolio-network
    command: npm run start:dev

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: portfolio-frontend
    ports:
      - "80:80"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend
    networks:
      - portfolio-network

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: portfolio-nginx
    ports:
      - "8080:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/conf.d:/etc/nginx/conf.d
    depends_on:
      - backend
      - frontend
    networks:
      - portfolio-network

volumes:
  postgres_data:
  redis_data:

networks:
  portfolio-network:
    driver: bridge
```

### Production Docker Compose
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:14-alpine
    container_name: portfolio-postgres-prod
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - portfolio-network
    restart: unless-stopped

  # Redis Cache
  redis:
    image: redis:6-alpine
    container_name: portfolio-redis-prod
    volumes:
      - redis_data:/data
    networks:
      - portfolio-network
    restart: unless-stopped

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: portfolio-backend-prod
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      JWT_SECRET: ${JWT_SECRET}
      PORT: 3000
    volumes:
      - ./logs:/app/logs
    depends_on:
      - postgres
      - redis
    networks:
      - portfolio-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: portfolio-frontend-prod
    depends_on:
      - backend
    networks:
      - portfolio-network
    restart: unless-stopped

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: portfolio-nginx-prod
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    networks:
      - portfolio-network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  portfolio-network:
    driver: bridge
```

## Nginx Configuration

### Main Nginx Configuration
```nginx
# nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 16M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    # Include server configurations
    include /etc/nginx/conf.d/*.conf;
}
```

### Server Configuration
```nginx
# nginx/conf.d/default.conf
upstream backend {
    server backend:3000;
}

upstream frontend {
    server frontend:80;
}

server {
    listen 80;
    server_name localhost;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # API routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket routes
    location /ws/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend routes
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://frontend;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

## Environment Configuration

### Development Environment
```bash
# .env.development
NODE_ENV=development
DATABASE_URL=postgresql://portfolio_user:portfolio_password@localhost:5432/portfolio_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=development-jwt-secret-key
JWT_EXPIRES_IN=7d
PORT=3000

# External APIs
CAFEF_API_URL=https://s.cafef.vn
VNDIRECT_API_URL=https://api.vndirect.com.vn
VIETCOMBANK_API_URL=https://portal.vietcombank.com.vn

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password

# Logging
LOG_LEVEL=debug
LOG_FILE=./logs/app.log
```

### Production Environment
```bash
# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://portfolio_user:secure_password@postgres:5432/portfolio_db
REDIS_URL=redis://redis:6379
JWT_SECRET=production-jwt-secret-key-very-secure
JWT_EXPIRES_IN=1d
PORT=3000

# External APIs
CAFEF_API_URL=https://s.cafef.vn
VNDIRECT_API_URL=https://api.vndirect.com.vn
VIETCOMBANK_API_URL=https://portal.vietcombank.com.vn

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=production-email@gmail.com
SMTP_PASS=production-password

# Logging
LOG_LEVEL=info
LOG_FILE=/app/logs/app.log

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000
```

## Database Initialization

### Database Schema
```sql
-- database/init.sql
-- Create database and user
CREATE DATABASE portfolio_db;
CREATE USER portfolio_user WITH PASSWORD 'portfolio_password';
GRANT ALL PRIVILEGES ON DATABASE portfolio_db TO portfolio_user;

-- Connect to portfolio_db
\c portfolio_db;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create tables
-- (Include all table creation scripts from system_design.md)

-- Create indexes
CREATE INDEX CONCURRENTLY idx_trades_portfolio_date ON trades(portfolio_id, trade_date);
CREATE INDEX CONCURRENTLY idx_trades_asset_date ON trades(asset_id, trade_date);
CREATE INDEX CONCURRENTLY idx_prices_asset_date ON prices(asset_id, price_date DESC);
CREATE INDEX CONCURRENTLY idx_portfolio_assets_portfolio ON portfolio_assets(portfolio_id);
CREATE INDEX CONCURRENTLY idx_nav_snapshots_portfolio_date ON nav_snapshots(portfolio_id, nav_date DESC);

-- Insert initial data
INSERT INTO assets (asset_id, symbol, name, type, asset_class, currency) VALUES
    (uuid_generate_v4(), 'VN30', 'VN30 Index', 'INDEX', 'Equities', 'VND'),
    (uuid_generate_v4(), 'HPG', 'Hoa Phat Group', 'STOCK', 'Equities', 'VND'),
    (uuid_generate_v4(), 'VCB', 'Vietcombank', 'STOCK', 'Equities', 'VND'),
    (uuid_generate_v4(), 'GOLD', 'Gold', 'COMMODITY', 'Commodities', 'VND');
```

## Docker Commands

### Development Commands
```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down

# Rebuild services
docker-compose up --build

# Execute commands in containers
docker-compose exec backend npm run migration:run
docker-compose exec postgres psql -U portfolio_user -d portfolio_db
```

### Production Commands
```bash
# Start production environment
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down

# Backup database
docker-compose exec postgres pg_dump -U portfolio_user portfolio_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U portfolio_user portfolio_db < backup.sql
```

## Health Checks

### Backend Health Check
```typescript
// backend/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }
}
```

### Docker Health Check
```dockerfile
# Add to Dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

## Monitoring Setup

### Prometheus Configuration
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'portfolio-backend'
    static_configs:
      - targets: ['backend:3000']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
```

### Grafana Dashboard
```json
{
  "dashboard": {
    "title": "Portfolio Management System",
    "panels": [
      {
        "title": "API Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "title": "Database Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_stat_database_numbackends"
          }
        ]
      }
    ]
  }
}
```
