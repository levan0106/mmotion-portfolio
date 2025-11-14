#!/bin/bash
set -e

# Set UTF-8 locale for proper character handling
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8
export PGCLIENTENCODING=UTF8

cd /home/ec2-user/mmotion-portfolio/backups
echo "Extracting backup..."
gunzip -f portfolio_full_backup_20251110_104835.sql.gz

echo "Terminating active connections to database..."
docker exec portfolio-postgres psql -U postgres -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'portfolio_db' AND pid <> pg_backend_pid();" || true

echo "Dropping and recreating database..."
docker exec portfolio-postgres psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS portfolio_db;" || true
docker exec portfolio-postgres psql -U postgres -d postgres -c "CREATE DATABASE portfolio_db;"

echo "Restoring full database (schema + data, UTF-8)..."
# Restore with proper UTF-8 handling
# Note: pg_dump already includes encoding info in the SQL file
# We also set client_encoding via psql option and environment variable
cat portfolio_full_backup_20251110_104835.sql | docker exec -i -e PGCLIENTENCODING=UTF8 portfolio-postgres psql -U postgres -d portfolio_db --set client_encoding=UTF8 --set ON_ERROR_STOP=on

echo "Verifying database..."
docker exec -i portfolio-postgres psql -U postgres -d portfolio_db -c "\dt" || true

echo "Cleaning up extracted file..."
rm -f portfolio_full_backup_20251110_104835.sql || true

echo "Full database restore completed successfully."