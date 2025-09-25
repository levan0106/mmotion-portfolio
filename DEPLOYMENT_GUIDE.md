# Portfolio Management System - Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the Portfolio Management System with 3 decimal places precision to a new server.

## Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+ or CentOS 8+ (recommended)
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 20GB free space
- **CPU**: 2+ cores

### Software Requirements
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Node.js**: 18+ (for running scripts)
- **npm**: 8+
- **Git**: Latest version

## Quick Deployment

### 1. Clone Repository
```bash
git clone <repository-url>
cd mmotion-portfolio
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Migration Test (Optional but Recommended)
```bash
# Test migration process on the server
./scripts/test-migration-on-server.sh
```

### 4. Deploy Application
```bash
# Start all services
docker-compose up -d

# Wait for services to be ready
sleep 30

# Run database migrations
npm run migration:run:full

# Verify migration status
npm run migration:verify
```

### 5. Verify Deployment
```bash
# Check service status
docker-compose ps

# Verify migration status and precision
npm run migration:verify:simple

# Test API endpoints
curl http://localhost:3000/health
curl http://localhost:3001
```

## Detailed Migration Process

### Migration Scripts Available

#### 1. Schema Migrations
```bash
npm run migration:run-schema
```
**What it does:**
- Creates `fund_unit_transactions` table
- Updates precision to 3 decimal places for:
  - `investor_holdings`: `total_units`, `avg_cost_per_unit`, `total_investment`, `current_value`, `unrealized_pnl`, `realized_pnl`
  - `fund_unit_transactions`: `units`, `nav_per_unit`, `amount`
  - `portfolios`: `total_outstanding_units`, `nav_per_unit`
  - `nav_snapshots`: `total_outstanding_units`, `nav_per_unit`

#### 2. Data Migrations
```bash
npm run migration:run-data
```
**What it does:**
- Migrates existing data to new schema
- Updates precision for existing records

#### 3. Full Migration
```bash
npm run migration:run:full
```
**What it does:**
- Runs both schema and data migrations
- Includes safety checks and confirmations

#### 4. Migration Verification
```bash
# TypeScript version (may have compilation issues)
npm run migration:verify

# PowerShell version (recommended for Windows)
npm run migration:verify:simple
```
**What it does:**
- Checks migration status
- Verifies 3 decimal places precision
- Validates table structures
- Provides recommendations

### Migration Files Included

1. **`1734567890123-AddNavUnitSystem.ts`**
   - Adds NAV unit system fields to portfolios
   - Creates initial fund structure

2. **`1758722000000-AddNavPerUnitToNavSnapshotsSimple.ts`**
   - Adds NAV per unit tracking to snapshots

3. **`1758723000000-AddLastNavDateToPortfolio.ts`**
   - Adds last NAV date tracking

4. **`1758731000000-CreateFundUnitTransactions.ts`**
   - Creates fund unit transactions table
   - Sets up relationships and constraints

5. **`1758732000000-UpdateNavPrecisionTo3Decimals.ts`**
   - Updates NAV precision from 8 to 3 decimal places

6. **`1758733000000-UpdateCurrencyPrecisionTo3Decimals.ts`**
   - Updates currency precision from 8 to 3 decimal places

## Environment Configuration

### Required Environment Variables
```bash
# Database
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-secure-password
DB_DATABASE=portfolio_db

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Application
NODE_ENV=production
PORT=3000

# Frontend
REACT_APP_API_URL=http://localhost:3000
```

### Optional Environment Variables
```bash
# Logging
LOG_LEVEL=info
LOG_FILE_ENABLED=true
LOG_RETENTION_DAYS=90

# Monitoring
GRAFANA_PASSWORD=admin
```

## Service URLs

After successful deployment, the following services will be available:

- **API**: http://localhost:3000
- **Frontend**: http://localhost:3001
- **Grafana**: http://localhost:3002
- **Kibana**: http://localhost:5601
- **Prometheus**: http://localhost:9090

## Verification Checklist

### ✅ Database Schema
- [ ] `fund_unit_transactions` table exists
- [ ] All precision fields use 3 decimal places
- [ ] Foreign key constraints are in place
- [ ] Indexes are created

### ✅ API Endpoints
- [ ] Health check: `GET /health`
- [ ] Fund subscription: `POST /api/v1/investor-holdings/subscribe`
- [ ] Fund redemption: `POST /api/v1/investor-holdings/redeem`
- [ ] Holding detail: `GET /api/v1/investor-holdings/:id/detail`

### ✅ Frontend
- [ ] Application loads without errors
- [ ] NAV Holdings tab displays correctly
- [ ] Holding detail page shows 3 decimal places
- [ ] Navigation between pages works

### ✅ Data Precision
- [ ] Units display with 3 decimal places (e.g., `16522.917`)
- [ ] Currency amounts display with 3 decimal places (e.g., `1000000.000`)
- [ ] NAV per unit displays with 3 decimal places (e.g., `60.522`)

## Troubleshooting

### Common Issues

#### 1. Migration Fails
```bash
# Check migration status
npm run migration:verify

# Check database connection
docker-compose logs postgres

# Reset and retry
docker-compose down
docker-compose up -d postgres redis
npm run migration:run:full
```

#### 2. Precision Issues
```bash
# Verify precision in database
docker exec portfolio_postgres psql -U postgres -d portfolio_db -c "
SELECT column_name, data_type, numeric_precision, numeric_scale 
FROM information_schema.columns 
WHERE table_name = 'investor_holdings' 
AND column_name IN ('total_units', 'avg_cost_per_unit', 'total_investment', 'current_value', 'unrealized_pnl', 'realized_pnl');"
```

#### 3. API Errors
```bash
# Check application logs
docker-compose logs app

# Restart application
docker-compose restart app
```

### Rollback Instructions

If you need to rollback migrations:

```bash
# Rollback last migration
npm run typeorm:migration:revert

# Or restore from backup
docker exec portfolio_postgres psql -U postgres -d portfolio_db < backup.sql
```

## Support

For issues or questions:
1. Check the logs: `docker-compose logs`
2. Verify migration status: `npm run migration:verify`
3. Test API endpoints: `curl http://localhost:3000/health`
4. Check database schema: Use the verification script

## Security Notes

- Change default passwords in production
- Use environment variables for sensitive data
- Enable SSL/TLS for production deployments
- Regularly backup the database
- Monitor logs for security events
