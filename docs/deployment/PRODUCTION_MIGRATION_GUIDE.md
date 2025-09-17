# Production Migration Guide - CR-003

## Overview

This guide provides step-by-step instructions for running the asset management improvements migration on production.

## Prerequisites

- [ ] Production database backup created
- [ ] Application deployed to production
- [ ] Database access credentials configured
- [ ] Maintenance window scheduled
- [ ] Team notified of migration

## Migration Steps

### Step 1: Pre-Migration Checklist

1. **Create Database Backup**
   ```bash
   # Using provided backup script
   ./scripts/backup-production-db.sh
   
   # Or manual backup
   pg_dump -h localhost -U username -d database_name > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Verify Application Status**
   ```bash
   # Check if application is running
   curl -f http://localhost:3000/health || echo "Application not running"
   ```

3. **Check Database Connection**
   ```bash
   # Test database connection
   npm run typeorm -- query "SELECT 1" -d src/config/database.config.ts
   ```

### Step 2: Run Schema Migrations

Execute database schema changes:

```bash
# Run TypeORM migrations
npm run migration:run-schema
```

This will execute:
- `AddMigrationTrackingToAssets` - Add migration_status column
- `MigrateCodeToSymbol` - Copy code to symbol field
- `ResolveSymbolConflicts` - Resolve symbol conflicts
- `CleanupAssetSchema` - Remove code column, add constraints

### Step 3: Run Data Migration

Execute data migration:

```bash
# Run data migration
npm run migration:run-data
```

This will:
- Copy code values to symbol field where symbol is null
- Generate symbols for assets without code or symbol
- Resolve symbol conflicts within users
- Preserve all existing data

### Step 4: Verify Migration

1. **Check Migration Status**
   ```bash
   # Verify no pending migrations
   npm run typeorm -- migration:show -d src/config/database.config.ts
   ```

2. **Test Application**
   ```bash
   # Test API endpoints
   curl -f http://localhost:3000/api/v1/assets
   curl -f http://localhost:3000/api/v1/assets/types
   ```

3. **Verify Data Integrity**
   ```bash
   # Check asset data
   npm run typeorm -- query "SELECT COUNT(*) FROM assets WHERE symbol IS NULL" -d src/config/database.config.ts
   ```

### Step 5: Post-Migration Tasks

1. **Update Frontend**
   - Ensure frontend uses `symbol` field instead of `code`
   - Test asset creation/update functionality
   - Verify asset deletion workflow

2. **Monitor Application**
   - Check application logs for errors
   - Monitor database performance
   - Verify API responses

3. **Clean Up**
   - Remove migration scripts if no longer needed
   - Update documentation
   - Notify team of completion

## Rollback Procedure

If migration fails, follow these steps:

### 1. Stop Application
```bash
# Stop the application
pm2 stop portfolio-management-system
# or
systemctl stop portfolio-management-system
```

### 2. Restore Database
```bash
# Restore from backup
psql -h localhost -U username -d database_name < backup_YYYYMMDD_HHMMSS.sql
```

### 3. Restart Application
```bash
# Restart the application
pm2 start portfolio-management-system
# or
systemctl start portfolio-management-system
```

## Troubleshooting

### Common Issues

1. **Migration Fails**
   - Check database logs
   - Verify database permissions
   - Ensure sufficient disk space

2. **Application Errors**
   - Check application logs
   - Verify database connection
   - Test API endpoints

3. **Data Inconsistency**
   - Run validation queries
   - Check migration logs
   - Contact development team

### Emergency Contacts

- **Database Admin**: [Contact Info]
- **DevOps Team**: [Contact Info]
- **Development Team**: [Contact Info]

## Migration Scripts

### Available Scripts

- `npm run migration:run-schema` - Run schema migrations
- `npm run migration:run-data` - Run data migration
- `npm run migration:run:full` - Run complete migration
- `npm run migration:test:full` - Test migration on development

### Manual Commands

```bash
# Run specific migration
npm run typeorm -- migration:run -d src/config/database.config.ts

# Revert last migration
npm run typeorm -- migration:revert -d src/config/database.config.ts

# Show migration status
npm run typeorm -- migration:show -d src/config/database.config.ts
```

## Success Criteria

- [ ] All migrations executed successfully
- [ ] No pending migrations remaining
- [ ] Application starts without errors
- [ ] API endpoints respond correctly
- [ ] Asset data migrated properly
- [ ] No data loss occurred
- [ ] Performance acceptable

## Post-Migration Monitoring

Monitor the following for 24-48 hours after migration:

- Application response times
- Database query performance
- Error rates
- User feedback
- System resource usage

## Support

For issues or questions:
- Check application logs
- Review migration documentation
- Contact development team
- Create support ticket if needed
