#!/bin/bash

# Backup Production Database Script
# This script creates a full backup of the production database before migration

set -e  # Exit on any error

# Configuration
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"portfolio_production"}
DB_USER=${DB_USER:-"postgres"}
BACKUP_DIR=${BACKUP_DIR:-"./backups"}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/portfolio_production_backup_${TIMESTAMP}.sql"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Production Database Backup${NC}"
echo "================================================"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if pg_dump is available
if ! command -v pg_dump &> /dev/null; then
    echo -e "${RED}❌ Error: pg_dump command not found. Please install PostgreSQL client tools.${NC}"
    exit 1
fi

# Check database connection
echo -e "${YELLOW}🔍 Checking database connection...${NC}"
if ! pg_dump --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" --dbname="$DB_NAME" --schema-only --no-owner --no-privileges > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Cannot connect to database. Please check your connection parameters.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Database connection successful${NC}"

# Create full backup
echo -e "${YELLOW}📦 Creating full database backup...${NC}"
echo "Backup file: $BACKUP_FILE"

pg_dump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --verbose \
    --clean \
    --create \
    --if-exists \
    --format=plain \
    --file="$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database backup completed successfully${NC}"
    
    # Get backup file size
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "Backup size: $BACKUP_SIZE"
    echo "Backup location: $BACKUP_FILE"
    
    # Create backup info file
    INFO_FILE="${BACKUP_DIR}/backup_info_${TIMESTAMP}.txt"
    cat > "$INFO_FILE" << EOF
Backup Information
==================
Date: $(date)
Database: $DB_NAME
Host: $DB_HOST:$DB_PORT
User: $DB_USER
Backup File: $BACKUP_FILE
Backup Size: $BACKUP_SIZE
Purpose: Pre-migration backup for Asset Management Improvements (CR-003)

Migration Details:
- Task: 1.4 - Backup Production Database
- Migration: Code to Symbol field standardization
- Risk Level: Medium (data transformation)

Restore Command:
psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" --dbname="postgres" < "$BACKUP_FILE"
EOF
    
    echo -e "${GREEN}📋 Backup info saved to: $INFO_FILE${NC}"
    
else
    echo -e "${RED}❌ Database backup failed${NC}"
    exit 1
fi

# Test backup integrity
echo -e "${YELLOW}🔍 Testing backup integrity...${NC}"
if pg_restore --list "$BACKUP_FILE" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backup integrity verified${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: Could not verify backup integrity (this is normal for plain SQL dumps)${NC}"
fi

echo -e "${GREEN}🎉 Production database backup completed successfully!${NC}"
echo "================================================"
echo "Next steps:"
echo "1. Verify backup file: $BACKUP_FILE"
echo "2. Test restore on development environment"
echo "3. Proceed with migration when ready"
echo "4. Keep backup file safe until migration is confirmed successful"
