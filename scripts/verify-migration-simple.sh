#!/bin/bash

# Simple Migration Verification Script
# This script verifies the migration status and precision without TypeScript compilation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker ps > /dev/null 2>&1; then
        error "Docker is not running. Please start Docker first."
        exit 1
    fi
    success "Docker is running"
}

# Check if PostgreSQL container is running
check_postgres() {
    if ! docker ps | grep -q portfolio_postgres; then
        error "PostgreSQL container is not running. Please start it first."
        exit 1
    fi
    success "PostgreSQL container is running"
}

# Run SQL verification
run_verification() {
    log "Running database precision verification..."
    
    # Run the SQL verification script
    docker exec portfolio_postgres psql -U postgres -d portfolio_db -f /dev/stdin < scripts/verify-database-precision.sql
}

# Check specific tables
check_tables() {
    log "Checking table existence..."
    
    # Check fund_unit_transactions table
    local table_exists=$(docker exec portfolio_postgres psql -U postgres -d portfolio_db -t -c "
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'fund_unit_transactions'
        )
    " | tr -d ' \n')
    
    if [ "$table_exists" = "t" ]; then
        success "fund_unit_transactions table exists"
    else
        error "fund_unit_transactions table does not exist"
    fi
}

# Check precision for specific columns
check_precision() {
    log "Checking precision for key columns..."
    
    # Check investor_holdings precision
    local holding_precision=$(docker exec portfolio_postgres psql -U postgres -d portfolio_db -t -c "
        SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_name = 'investor_holdings' 
        AND column_name IN ('total_units', 'avg_cost_per_unit', 'total_investment', 'current_value', 'unrealized_pnl', 'realized_pnl')
        AND numeric_scale = 3
    " | tr -d ' \n')
    
    if [ "$holding_precision" = "6" ]; then
        success "investor_holdings precision is correct (3 decimal places)"
    else
        error "investor_holdings precision is incorrect. Expected 6 columns with scale 3, found $holding_precision"
    fi
    
    # Check fund_unit_transactions precision
    local fund_precision=$(docker exec portfolio_postgres psql -U postgres -d portfolio_db -t -c "
        SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_name = 'fund_unit_transactions' 
        AND column_name IN ('units', 'nav_per_unit', 'amount')
        AND numeric_scale = 3
    " | tr -d ' \n')
    
    if [ "$fund_precision" = "3" ]; then
        success "fund_unit_transactions precision is correct (3 decimal places)"
    else
        error "fund_unit_transactions precision is incorrect. Expected 3 columns with scale 3, found $fund_precision"
    fi
}

# Check migration status
check_migrations() {
    log "Checking migration status..."
    
    # Get executed migrations
    local migrations=$(docker exec portfolio_postgres psql -U postgres -d portfolio_db -t -c "
        SELECT COUNT(*) FROM migrations 
        WHERE name LIKE '%Nav%' OR name LIKE '%Fund%' OR name LIKE '%Precision%'
    " | tr -d ' \n')
    
    if [ "$migrations" -ge "6" ]; then
        success "All required migrations have been executed ($migrations found)"
    else
        warning "Some migrations may be missing. Found $migrations migrations, expected at least 6"
    fi
}

# Main function
main() {
    log "Starting migration verification..."
    
    check_docker
    check_postgres
    check_tables
    check_precision
    check_migrations
    
    log "Running detailed verification..."
    run_verification
    
    success "Migration verification completed!"
    
    echo ""
    log "Summary:"
    log "✅ Database precision verification completed"
    log "✅ Table structure verification completed"
    log "✅ Migration status verification completed"
    log ""
    log "If all checks passed, the system is ready for use with 3 decimal places precision."
}

# Run main function
main
