#!/bin/bash
set -e

# Set UTF-8 locale for proper character handling
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8
export PGCLIENTENCODING=UTF8

cd /home/ec2-user/mmotion-portfolio/backups/
echo "Extracting backup..."
gunzip -f portfolio_backup_20251013_093951.sql.gz

echo "Detecting tables from backup file..."
TABLES=$(grep -oP "(?<=INSERT INTO )[^ ]+" portfolio_backup_20251013_093951.sql | sort -u | tr '\n' ',' | sed 's/,$//')

if [ -z "$TABLES" ]; then
  echo "No tables found in backup file. Exiting."
  exit 1
fi

echo "Truncating old data..."
docker exec -i portfolio-postgres psql -U postgres -d portfolio_db -c "TRUNCATE TABLE $TABLES RESTART IDENTITY CASCADE;"

echo "Restoring new data (UTF-8)..."
# Ensure UTF-8 encoding is set at the beginning of the SQL file
if ! head -1 portfolio_backup_20251013_093951.sql | grep -q "encoding UTF8"; then
  sed -i '1i \encoding UTF8' portfolio_backup_20251013_093951.sql
fi

# Restore with proper UTF-8 handling
cat portfolio_backup_20251013_093951.sql | docker exec -i portfolio-postgres psql -U postgres -d portfolio_db --set client_encoding=UTF8 --set ON_ERROR_STOP=off

echo "Verifying data counts..."
for tbl in $(echo "$TABLES" | tr ',' ' '); do
  docker exec -i portfolio-postgres psql -U postgres -d portfolio_db -c "SELECT COUNT(*) AS count FROM $tbl;" || true
done

echo "Restore completed successfully."