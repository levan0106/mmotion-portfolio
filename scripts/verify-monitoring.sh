#!/bin/bash
# Portfolio Management System - Monitoring Services Verification Script

echo "🔍 Verifying Portfolio Management System monitoring services..."

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to test service
test_service() {
    local service_name=$1
    local url=$2
    local expected_status=$3
    
    echo -n "🧪 Testing $service_name... "
    
    if curl -f -s "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        return 1
    fi
}

# Function to test service with specific endpoint
test_service_endpoint() {
    local service_name=$1
    local url=$2
    local endpoint=$3
    
    echo -n "🧪 Testing $service_name ($endpoint)... "
    
    if curl -f -s "$url$endpoint" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        return 1
    fi
}

echo ""
echo "📊 Application Services:"
test_service "Frontend React" "http://localhost:3001"
test_service "Backend API" "http://localhost:3000"
test_service_endpoint "Swagger UI" "http://localhost:3000" "/api"
test_service_endpoint "Health Check" "http://localhost:3000" "/health"

echo ""
echo "📈 Monitoring Services:"
test_service "Prometheus" "http://localhost:9090"
test_service "Grafana" "http://localhost:3002"
test_service "Kibana" "http://localhost:5601"
test_service "Elasticsearch" "http://localhost:9200"

echo ""
echo "🔗 Service URLs:"
echo "  • Frontend: http://localhost:3001"
echo "  • Backend API: http://localhost:3000"
echo "  • Swagger UI: http://localhost:3000/api"
echo "  • Health Check: http://localhost:3000/health"
echo "  • Prometheus: http://localhost:9090"
echo "  • Grafana: http://localhost:3002 (admin/admin)"
echo "  • Kibana: http://localhost:5601"
echo "  • Elasticsearch: http://localhost:9200"

echo ""
echo "✅ Monitoring services verification complete!"
