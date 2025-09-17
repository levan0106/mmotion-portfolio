#!/bin/bash

echo "🔍 Portfolio Management System - Complete Setup Verification"
echo "============================================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if Docker is running
print_info "Checking Docker..."
docker --version > /dev/null 2>&1
print_status $? "Docker is installed and running"

# Check if Docker Compose is available
docker-compose --version > /dev/null 2>&1
print_status $? "Docker Compose is available"

# Check project structure
print_info "Verifying project structure..."

# Backend files
files_to_check=(
    "src/app.module.ts"
    "src/main.ts"
    "src/config/database.config.ts"
    "src/modules/portfolio/portfolio.module.ts"
    "src/modules/portfolio/entities/portfolio.entity.ts"
    "src/modules/portfolio/controllers/portfolio.controller.ts"
    "src/modules/portfolio/services/portfolio.service.ts"
    "package.json"
    "tsconfig.json"
    "nest-cli.json"
    "docker-compose.yml"
    "Dockerfile.dev"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        print_status 0 "Backend file: $file"
    else
        print_status 1 "Backend file: $file"
    fi
done

# Frontend files
frontend_files=(
    "frontend/package.json"
    "frontend/src/App.tsx"
    "frontend/src/services/api.ts"
    "frontend/Dockerfile.dev"
)

for file in "${frontend_files[@]}"; do
    if [ -f "$file" ]; then
        print_status 0 "Frontend file: $file"
    else
        print_status 1 "Frontend file: $file"
    fi
done

# Check Node.js and npm versions
print_info "Checking Node.js environment..."
node --version > /dev/null 2>&1
print_status $? "Node.js is installed ($(node --version))"

npm --version > /dev/null 2>&1
print_status $? "npm is installed ($(npm --version))"

# Check if dependencies are installed
if [ -d "node_modules" ]; then
    print_status 0 "Backend dependencies installed"
else
    print_status 1 "Backend dependencies not installed"
    print_warning "Run: npm install"
fi

if [ -d "frontend/node_modules" ]; then
    print_status 0 "Frontend dependencies installed"
else
    print_status 1 "Frontend dependencies not installed"
    print_warning "Run: cd frontend && npm install"
fi

# Check Docker services status
print_info "Checking Docker services..."
docker-compose ps --format "table" 2>/dev/null

# Test database connection
print_info "Testing database connection..."
if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    print_status 0 "PostgreSQL is ready"
else
    print_status 1 "PostgreSQL is not ready"
fi

# Test Redis connection
print_info "Testing Redis connection..."
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    print_status 0 "Redis is ready"
else
    print_status 1 "Redis is not ready"
fi

# Check if services are responding
print_info "Testing service endpoints..."

# Wait a bit for services to be ready
sleep 2

# Test backend health endpoint
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    print_status 0 "Backend health endpoint responding"
else
    print_status 1 "Backend health endpoint not responding"
    print_warning "Backend may still be starting up..."
fi

# Test Swagger documentation
if curl -s http://localhost:3000/api > /dev/null 2>&1; then
    print_status 0 "Swagger documentation available"
else
    print_status 1 "Swagger documentation not available"
fi

# Test frontend
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    print_status 0 "Frontend responding"
else
    print_status 1 "Frontend not responding"
    print_warning "Frontend may still be starting up..."
fi

echo ""
echo "============================================================"
print_info "Setup verification complete!"
echo ""
print_info "🌐 Access points:"
echo "   • Backend API: http://localhost:3000"
echo "   • Swagger Docs: http://localhost:3000/api"
echo "   • Health Check: http://localhost:3000/health"
echo "   • Frontend: http://localhost:3001"
echo ""
print_info "🐳 Docker commands:"
echo "   • View logs: docker-compose logs"
echo "   • Stop services: docker-compose down"
echo "   • Restart: docker-compose restart"
echo ""
print_info "🔧 Development commands:"
echo "   • Backend dev: npm run start:dev"
echo "   • Frontend dev: cd frontend && npm start"
echo "   • Run tests: npm test"
echo ""
