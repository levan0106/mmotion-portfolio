#!/bin/bash
# Full Database Restore Script
# Generated on 10/27/2025 14:54:57

echo "=== Restoring Full Database ==="
echo "Database: portfolio_db"
echo "Container: portfolio-postgres"
echo "Backup file: portfolio_full_backup_20251027_145432.sql.gz"
echo ""

# Check if backup file exists
if [ ! -f "portfolio_full_backup_20251027_145432.sql.gz" ]; then
    echo "Error: Backup file portfolio_full_backup_20251027_145432.sql.gz not found!"
    exit 1
fi

# Extract backup file
echo "Extracting backup file..."
gunzip -c portfolio_full_backup_20251027_145432.sql.gz > portfolio_full_backup_20251027_145432.sql

# Drop and recreate database
echo "Dropping and recreating database..."
docker exec portfolio-postgres psql -U postgres -c "DROP DATABASE IF EXISTS portfolio_db;"
docker exec portfolio-postgres psql -U postgres -c "CREATE DATABASE portfolio_db;"

# Restore database
echo "Restoring database..."
docker exec -i portfolio-postgres psql -U postgres -d portfolio_db -f portfolio_full_backup_20251027_145432.sql

if [ $? -eq 0 ]; then
    echo "Database restored successfully!"
    echo "Cleaning up extracted file..."
    rm portfolio_full_backup_20251027_145432.sql
    echo "Restore completed!"
else
    echo "Database restore failed!"
    exit 1
fi
