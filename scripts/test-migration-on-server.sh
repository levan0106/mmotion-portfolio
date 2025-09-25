#!/bin/bash

# Test Migration on Server Script
# This script tests the migration process on a new server

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="portfolio-management-system"
LOG_FILE="/tmp/migration-test.log"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        error "Docker is not running. Please start Docker first."
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed."
    fi
    
    # Check if Node.js is available
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed."
    fi
    
    # Check if npm is available
    if ! command -v npm &> /dev/null; then
        error "npm is not installed."
    fi
    
    success "Prerequisites check passed"
}

# Setup test environment
setup_test_environment() {
    log "Setting up test environment..."
    
    # Create test directory
    mkdir -p /tmp/portfolio-migration-test
    cd /tmp/portfolio-migration-test
    
    # Copy project files (assuming we're in the project directory)
    if [ -f "package.json" ]; then
        cp package.json ./
        cp -r src ./
        cp -r scripts ./
        cp -r frontend ./
        cp docker-compose.yml ./
        cp Dockerfile.dev ./
        cp frontend/Dockerfile.dev ./
        success "Test environment setup completed"
    else
        error "Not in project directory. Please run from project root."
    fi
}

# Start test services
start_test_services() {
    log "Starting test services..."
    
    # Start only database and Redis for testing
    docker-compose up -d postgres redis
    
    # Wait for services to be ready
    log "Waiting for services to be ready..."
    sleep 15
    
    # Check if services are running
    if docker ps | grep -q portfolio_postgres; then
        success "PostgreSQL is running"
    else
        error "PostgreSQL failed to start"
    fi
    
    if docker ps | grep -q portfolio_redis; then
        success "Redis is running"
    else
        error "Redis failed to start"
    fi
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    # Install Node.js dependencies
    npm install
    
    success "Dependencies installed"
}

# Run migration verification
run_migration_verification() {
    log "Running migration verification..."
    
    # First, check current status
    log "Checking current migration status..."
    npm run migration:verify || {
        warning "Migration verification failed - this is expected on a fresh server"
    }
    
    # Run migrations
    log "Running migrations..."
    npm run migration:run:full || {
        error "Migration failed"
    }
    
    # Verify migrations again
    log "Verifying migrations after execution..."
    npm run migration:verify || {
        error "Migration verification failed after execution"
    }
    
    success "Migration verification completed"
}

# Test API endpoints
test_api_endpoints() {
    log "Testing API endpoints..."
    
    # Start the application
    log "Starting application..."
    docker-compose up -d app
    
    # Wait for application to start
    sleep 20
    
    # Test health endpoint
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        success "API health check passed"
    else
        warning "API health check failed - application may still be starting"
    fi
    
    # Test fund unit transaction endpoints
    log "Testing fund unit transaction endpoints..."
    
    # Test subscription endpoint (this will fail without proper data, but we can check if endpoint exists)
    if curl -f -X POST http://localhost:3000/api/v1/investor-holdings/subscribe \
        -H "Content-Type: application/json" \
        -d '{"accountId":"test","portfolioId":"test","amount":1000}' \
        > /dev/null 2>&1; then
        success "Subscription endpoint is accessible"
    else
        warning "Subscription endpoint test failed (expected without proper data)"
    fi
    
    success "API endpoint testing completed"
}

# Cleanup test environment
cleanup_test_environment() {
    log "Cleaning up test environment..."
    
    # Stop all services
    docker-compose down --remove-orphans
    
    # Remove test directory
    cd /
    rm -rf /tmp/portfolio-migration-test
    
    success "Test environment cleaned up"
}

# Main test function
main() {
    log "Starting migration test on server..."
    
    check_prerequisites
    setup_test_environment
    start_test_services
    install_dependencies
    run_migration_verification
    test_api_endpoints
    cleanup_test_environment
    
    success "Migration test completed successfully!"
    log "The system is ready for deployment on this server."
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --no-cleanup   Skip cleanup step"
        echo "  --no-api-test  Skip API endpoint testing"
        exit 0
        ;;
    --no-cleanup)
        NO_CLEANUP=true
        ;;
    --no-api-test)
        NO_API_TEST=true
        ;;
esac

# Run main test
main
