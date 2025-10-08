# Scripts Directory

## Overview

This directory contains all utility scripts for the Portfolio Management System, optimized for Windows PowerShell environment.

## Deployment Scripts

### 🚀 [deploy-to-aws.ps1](./deploy-to-aws.ps1)
**Production deployment script** - Deploy the entire system to AWS (Paid services)
- Infrastructure provisioning (ECS, ALB, RDS, ElastiCache)
- Docker image building and pushing
- ECS service deployment
- Database migration
- Health checks

**Usage:**
```powershell
# Deploy to staging
.\deploy-to-aws.ps1 -Environment staging

# Deploy to production
.\deploy-to-aws.ps1 -Environment production
```

### 💰 [deploy-free-tier.ps1](./deploy-free-tier.ps1)
**Free Tier deployment script** - Deploy to AWS Free Tier (ZERO COST)
- Infrastructure provisioning (EC2, RDS, ElastiCache, S3, CloudFront)
- Docker image building
- EC2 deployment
- S3 static hosting
- CloudFront CDN

**Usage:**
```powershell
# Deploy to staging (Free Tier)
.\deploy-free-tier.ps1 -Environment staging

# Deploy to production (Free Tier)
.\deploy-free-tier.ps1 -Environment production
```


### 🔍 [validate-database-config.ps1](./validate-database-config.ps1)
**Database configuration validator** - Validate all database configurations
- Check environment variables
- Verify Docker Compose configurations
- Validate deployment scripts
- Security password checks

**Usage:**
```powershell
.\validate-database-config.ps1
```

## Database Scripts

### 💾 [backup-production-db.ps1](./backup-production-db.ps1)
**Database backup script** - Backup production database
- Automated backup creation
- S3 storage
- Backup verification
- Retention management

### 🗄️ Database Management Scripts
- `check-database-structure.ts` - Database structure validation
- `check-trade-data.ts` - Trade data validation
- `run-sql.ts` - SQL execution utility
- `run-typeorm-migrations.ts` - Migration runner

## Data Management Scripts

### 📊 Data Creation Scripts
- `create-historical-trades.ts` - Historical trade data
- `create-performance-snapshot-test-data.ts` - Performance test data
- `create-sample-sell-trades.ts` - Sample sell trades
- `create-simple-historical-data.sql` - Simple historical data
- `create-test-snapshots.sql` - Test snapshots

### 🔧 Data Fix Scripts
- `fix-asset-values.ts` - Asset value corrections
- `fix-asset-values-v2.ts` - Asset value corrections v2
- `fix-database-constraints.ts` - Database constraint fixes
- `fix-database-constraints-v2.ts` - Database constraint fixes v2
- `fix-trade-details-pnl.ts` - Trade P&L corrections

### 🧹 Data Cleanup Scripts
- `cleanup-fund-data.ts` - Fund data cleanup
- `fix-nan-holdings.sql` - NaN holdings fix
- `optimize-asset-update.ts` - Asset update optimization

## Testing Scripts

### 🧪 [run-tests.ps1](./run-tests.ps1)
**Test execution script** - Run all tests
- Unit tests
- Integration tests
- E2E tests
- Test reporting

### 🐳 [test-docker.ps1](./test-docker.ps1)
**Docker testing script** - Test Docker setup
- Container health checks
- Service connectivity
- Port availability
- Volume mounting

### 🐳 [test-docker.bat](./test-docker.bat)
**Docker testing script (Batch)** - Alternative Docker testing
- Windows batch file
- Quick Docker validation
- Service status checks

## Utility Scripts

### 🔧 [fix-docker-deps.ps1](./fix-docker-deps.ps1)
**Docker dependency fixer** - Fix Docker dependencies
- Dependency resolution
- Version conflicts
- Cleanup procedures

### 🗂️ [toggle-cache.ps1](./toggle-cache.ps1)
**Cache management** - Toggle caching features
- Enable/disable cache
- Cache configuration
- Performance monitoring

### 🔍 Verification Scripts
- `verify-migration-simple.ps1` - Simple migration verification
- `verify-migration-status.ts` - Migration status check
- `verify-setup-complete.sh` - Setup verification (Linux/Mac)

## SQL Scripts

### 📊 Data Creation SQL
- `create-benchmark-data.sql` - Benchmark data creation
- `create-current-month-trades.ts` - Current month trades
- `create-historical-snapshots-with-varying-prices.sql` - Historical snapshots
- `create-simple-historical-data.sql` - Simple historical data
- `create-test-snapshots.sql` - Test snapshots

### 🔧 Data Fix SQL
- `fix-nan-holdings.sql` - NaN holdings fix
- `update-all-portfolio-realized-pl.ts` - Portfolio P&L updates
- `update-portfolio-snapshots-with-varying-values.sql` - Snapshot updates

### 📈 Performance SQL
- `add-irr-alpha-beta-to-asset-performance.sql` - Performance metrics
- `insert-benchmark-data.sql` - Benchmark data insertion
- `insert-default-benchmark.sql` - Default benchmark
- `insert-simple-data.sql` - Simple data insertion

### 🔍 Verification SQL
- `verify-database-precision.sql` - Database precision verification

## Documentation

### 📚 [FUND_CLEANUP_GUIDE.md](./FUND_CLEANUP_GUIDE.md)
**Fund cleanup guide** - Comprehensive guide for fund data cleanup
- Cleanup procedures
- Data validation
- Quality assurance

## Script Categories

### 🚀 **Deployment & Infrastructure**
- `deploy-to-aws.ps1` - Main deployment
- `validate-database-config.ps1` - Configuration validation
- `backup-production-db.ps1` - Database backup

### 🗄️ **Database Management**
- `check-database-structure.ts` - Structure validation
- `run-sql.ts` - SQL execution
- `run-typeorm-migrations.ts` - Migration runner

### 📊 **Data Management**
- `create-*.ts` - Data creation scripts
- `fix-*.ts` - Data correction scripts
- `cleanup-*.ts` - Data cleanup scripts

### 🧪 **Testing & Validation**
- `run-tests.ps1` - Test execution
- `test-docker.ps1` - Docker testing
- `verify-*.ps1` - Verification scripts

### 🔧 **Utilities**
- `fix-docker-deps.ps1` - Dependency fixes
- `toggle-cache.ps1` - Cache management
- `optimize-*.ts` - Optimization scripts

## Usage Guidelines

### PowerShell Scripts
```powershell
# Run with parameters
.\script-name.ps1 -Parameter value

# Run with help
.\script-name.ps1 -Help

# Run with verbose output
.\script-name.ps1 -Verbose
```

### TypeScript Scripts
```powershell
# Run TypeScript scripts
npx ts-node script-name.ts

# Run with environment variables
$env:NODE_ENV="production"; npx ts-node script-name.ts
```

### SQL Scripts
```powershell
# Run SQL scripts
psql -h localhost -U postgres -d portfolio_db -f script-name.sql

# Run with parameters
psql -h localhost -U postgres -d portfolio_db -f script-name.sql -v param=value
```

## Environment Requirements

### PowerShell Scripts
- PowerShell 5.1 or later
- AWS CLI configured
- Docker installed
- Node.js and npm

### TypeScript Scripts
- Node.js 18+
- TypeScript
- Database connection
- Required npm packages

### SQL Scripts
- PostgreSQL client
- Database access
- Appropriate permissions

## Security Considerations

### Script Security
- All scripts use secure passwords
- AWS credentials managed properly
- Database connections encrypted
- No hardcoded secrets

### Data Security
- Sensitive data handling
- Backup encryption
- Access control
- Audit logging

## Maintenance

### Regular Tasks
- Update script dependencies
- Review security configurations
- Test script functionality
- Update documentation

### Script Updates
- Version control
- Change documentation
- Testing procedures
- Rollback plans

## Support

### Common Issues
- Check PowerShell execution policy
- Verify AWS credentials
- Test database connectivity
- Review script permissions

### Debugging
- Use `-Verbose` flag for detailed output
- Check CloudWatch logs
- Verify environment variables
- Test individual components

## Conclusion

This scripts directory provides a comprehensive set of utilities for deploying, managing, and maintaining the Portfolio Management System. All scripts are optimized for Windows PowerShell environment and follow security best practices.
