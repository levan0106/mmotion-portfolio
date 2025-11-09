# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the MMotion Portfolio Management System.

## Table of Contents

1. [Common Issues](#common-issues)
2. [Database Issues](#database-issues)
3. [API Issues](#api-issues)
4. [Performance Issues](#performance-issues)
5. [Data Issues](#data-issues)
6. [Development Issues](#development-issues)
7. [Debugging Tools](#debugging-tools)

## Common Issues

### 1. Server Won't Start

#### Issue: Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (Windows)
taskkill /PID <PID> /F

# Or use kill-port utility
npx kill-port 3000
```

#### Issue: Database Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
```bash
# Check PostgreSQL status
pg_ctl status

# Start PostgreSQL
pg_ctl start

# Check if PostgreSQL is listening
netstat -an | grep 5432
```

### 2. API Returns 404

#### Issue: Endpoint Not Found
```
{"statusCode":404,"message":"Cannot GET /api/trading/analysis","error":"NotFoundException"}
```

**Solution:**
- Check the correct endpoint: `/api/v1/trades/analysis/portfolio`
- Verify the server is running
- Check the API documentation for correct endpoints

### 3. Invalid Portfolio ID

#### Issue: Portfolio Not Found
```
{"statusCode":404,"message":"Portfolio not found","error":"NotFoundException"}
```

**Solution:**
```bash
# Get available portfolios
curl http://localhost:3000/api/v1/trades/test-data

# Use the correct portfolio ID from the response
```

## Database Issues

### 1. Connection Issues

#### Issue: Database Connection Timeout
```
Error: Connection timeout
```

**Solution:**
```bash
# Check PostgreSQL configuration
psql -h localhost -U postgres -c "SELECT version();"

# Check connection limits
psql -h localhost -U postgres -c "SHOW max_connections;"

# Restart PostgreSQL
pg_ctl restart
```

#### Issue: Authentication Failed
```
Error: password authentication failed for user "postgres"
```

**Solution:**
```bash
# Reset PostgreSQL password
sudo -u postgres psql
ALTER USER postgres PASSWORD 'new_password';

# Update .env file
DATABASE_PASSWORD=new_password
```

### 2. Migration Issues

#### Issue: Migration Failed
```
Error: relation "trades" does not exist
```

**Solution:**
```bash
# Run migrations
npm run migration:run

# Check migration status
npm run migration:show

# Reset database (WARNING: This will delete all data)
npm run migration:revert
npm run migration:run
```

### 3. Data Issues

#### Issue: NaN Values in P&L
```
P&L: NaN
```

**Solution:**
```bash
# Fix existing data
npx ts-node scripts/fix-trade-details-pnl.ts

# Check data integrity
npx ts-node scripts/debug-trade-details.ts
```

## API Issues

### 1. Response Issues

#### Issue: Empty Response
```json
{
  "statistics": {},
  "pnlSummary": {},
  "topTrades": [],
  "worstTrades": []
}
```

**Solution:**
- Check if portfolio has trades
- Verify portfolio ID is correct
- Check database for data

#### Issue: Incorrect P&L Calculations
```
Total P&L: 14395579000.00
```

**Solution:**
```bash
# Fix P&L calculations
npx ts-node scripts/fix-trade-details-pnl.ts

# Verify calculations
npx ts-node scripts/debug-trade-details.ts
```

### 2. Error Responses

#### Issue: 500 Internal Server Error
```
{"statusCode":500,"message":"Internal server error","error":"InternalServerError"}
```

**Solution:**
```bash
# Check server logs
npm run start:dev

# Check database connection
curl http://localhost:3000/health

# Verify environment variables
echo $DATABASE_HOST
echo $DATABASE_PORT
```

#### Issue: 400 Bad Request
```
{"statusCode":400,"message":"Invalid query parameters","error":"BadRequestException"}
```

**Solution:**
- Check query parameters
- Verify parameter types
- Check API documentation

## Performance Issues

### 1. Slow API Responses

#### Issue: API Takes Too Long
```
Response time: 5+ seconds
```

**Solution:**
```bash
# Check database performance
psql -h localhost -U postgres -d mmotion_portfolio -c "EXPLAIN ANALYZE SELECT * FROM trades WHERE portfolio_id = 'f9cf6de3-36ef-4581-8b29-1aa872ed9658';"

# Check indexes
psql -h localhost -U postgres -d mmotion_portfolio -c "\d trades"

# Add missing indexes
CREATE INDEX idx_trades_portfolio_asset ON trades(portfolio_id, asset_id);
CREATE INDEX idx_trades_date ON trades(trade_date);
```

#### Issue: High Memory Usage
```
Memory usage: 1GB+
```

**Solution:**
```bash
# Check memory usage
ps aux | grep node

# Optimize queries
# Use LIMIT for large result sets
# Implement pagination
# Use streaming for large data
```

### 2. Database Performance

#### Issue: Slow Queries
```
Query time: 2+ seconds
```

**Solution:**
```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM trades WHERE portfolio_id = 'f9cf6de3-36ef-4581-8b29-1aa872ed9658';

-- Add indexes
CREATE INDEX idx_trades_portfolio_asset_date ON trades(portfolio_id, asset_id, trade_date);

-- Update table statistics
ANALYZE trades;
```

## Data Issues

### 1. P&L Calculation Issues

#### Issue: Incorrect P&L Values
```
P&L: -35584000.00000000
```

**Solution:**
```bash
# Check trade details
npx ts-node scripts/debug-trade-details.ts

# Fix calculations
npx ts-node scripts/fix-trade-details-pnl.ts

# Verify results
curl http://localhost:3000/api/v1/trades/analysis/portfolio?portfolioId=f9cf6de3-36ef-4581-8b29-1aa872ed9658
```

#### Issue: Missing Trade Details
```
Top Trades: []
Worst Trades: []
```

**Solution:**
```bash
# Check if trades have been matched
psql -h localhost -U postgres -d mmotion_portfolio -c "SELECT COUNT(*) FROM trade_details;"

# Process trade matching
curl -X POST "http://localhost:3000/api/v1/trades/{trade-id}/match"
```

### 2. Data Consistency

#### Issue: Inconsistent Portfolio Values
```
Portfolio value doesn't match trades
```

**Solution:**
```bash
# Update portfolio positions
curl -X GET "http://localhost:3000/api/v1/portfolios/f9cf6de3-36ef-4581-8b29-1aa872ed9658/positions/update-all"

# Check portfolio assets
psql -h localhost -U postgres -d mmotion_portfolio -c "SELECT * FROM portfolio_assets WHERE portfolio_id = 'f9cf6de3-36ef-4581-8b29-1aa872ed9658';"
```

## Development Issues

### 1. Build Issues

#### Issue: TypeScript Compilation Errors
```
error TS2304: Cannot find name 'Trade'
```

**Solution:**
```bash
# Install dependencies
npm install

# Check TypeScript configuration
npx tsc --noEmit

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Issue: Test Failures
```
Test suite failed to run
```

**Solution:**
```bash
# Run tests with verbose output
npm run test -- --verbose

# Check test database
npm run test:e2e

# Clear test cache
npm run test -- --clearCache
```

### 2. Environment Issues

#### Issue: Environment Variables Not Loaded
```
process.env.DATABASE_HOST is undefined
```

**Solution:**
```bash
# Check .env file exists
ls -la .env

# Check .env file content
cat .env

# Load environment variables
source .env
```

## Debugging Tools

### 1. Database Debugging

#### Check Database Status
```bash
# PostgreSQL status
pg_ctl status

# Database connection
psql -h localhost -U postgres -d mmotion_portfolio -c "SELECT version();"

# Table information
psql -h localhost -U postgres -d mmotion_portfolio -c "\d trades"
```

#### Debug Queries
```sql
-- Check trade data
SELECT trade_id, side, quantity, price, fee, tax FROM trades LIMIT 5;

-- Check trade details
SELECT detail_id, matched_qty, buy_price, sell_price, fee_tax, pnl FROM trade_details LIMIT 5;

-- Check portfolio assets
SELECT asset_id, quantity, avg_cost, market_value, unrealized_pl FROM portfolio_assets;
```

### 2. API Debugging

#### Check API Health
```bash
# Health check
curl http://localhost:3000/health

# API status
curl http://localhost:3000/api/v1/trades/test-data

# Specific endpoint
curl http://localhost:3000/api/v1/trades/analysis/portfolio?portfolioId=f9cf6de3-36ef-4581-8b29-1aa872ed9658
```

#### Debug Scripts
```bash
# Debug trade details
npx ts-node scripts/debug-trade-details.ts

# Check trade data
npx ts-node scripts/check-trade-data.ts

# Fix P&L calculations
npx ts-node scripts/fix-trade-details-pnl.ts
```

### 3. Logging

#### Enable Debug Logging
```bash
# Set log level
export LOG_LEVEL=debug

# Start with debug logging
LOG_LEVEL=debug npm run start:dev
```

#### Check Logs
```bash
# Application logs
tail -f logs/app.log

# Error logs
tail -f logs/error.log

# Combined logs
tail -f logs/combined.log
```

## Performance Monitoring

### 1. Database Monitoring

#### Check Query Performance
```sql
-- Enable query logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_duration = on;
SELECT pg_reload_conf();

-- Check slow queries
SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

#### Monitor Database Size
```sql
-- Database size
SELECT pg_size_pretty(pg_database_size('mmotion_portfolio'));

-- Table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 2. API Monitoring

#### Response Time Monitoring
```bash
# Time API calls
time curl http://localhost:3000/api/v1/trades/analysis/portfolio?portfolioId=f9cf6de3-36ef-4581-8b29-1aa872ed9658

# Monitor with ab (Apache Bench)
ab -n 100 -c 10 http://localhost:3000/api/v1/trades/analysis/portfolio?portfolioId=f9cf6de3-36ef-4581-8b29-1aa872ed9658
```

#### Memory Usage
```bash
# Check Node.js memory usage
ps aux | grep node

# Monitor with htop
htop

# Check memory leaks
node --inspect app.js
```

## Getting Help

### 1. Check Documentation
- [API Documentation](./TRADING_ANALYSIS_API.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [FIFO Engine](./FIFO_ENGINE.md)

### 2. Common Solutions
- Restart the application
- Check database connection
- Verify environment variables
- Run migration scripts
- Check logs for errors

### 3. Escalation
If issues persist:
1. Check the logs for detailed error messages
2. Verify all prerequisites are met
3. Test with sample data
4. Contact the development team with:
   - Error messages
   - Steps to reproduce
   - Environment details
   - Log files

## Prevention

### 1. Regular Maintenance
- Monitor database performance
- Check logs regularly
- Update dependencies
- Backup data regularly

### 2. Best Practices
- Use proper error handling
- Implement logging
- Test thoroughly
- Monitor performance
- Keep documentation updated

### 3. Monitoring
- Set up health checks
- Monitor response times
- Track error rates
- Monitor resource usage
