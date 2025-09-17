#!/bin/bash
# run with powershell: & "C:\Program Files\Git\bin\bash.exe" scripts/verify-local-setup.sh


# Portfolio Management System - Local Setup Verification Script
echo "🔍 Verifying Portfolio Management System local setup..."

BASE_URL="http://localhost:3000"
SUCCESS_COUNT=0
TOTAL_TESTS=0

# Function to test endpoint and count results
test_endpoint() {
    local test_name=$1
    local method=$2
    local endpoint=$3
    local expected_status=$4
    local data=$5
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo "🧪 Test $TOTAL_TESTS: $test_name"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" 2>/dev/null)
    fi
    
    if [ $? -eq 0 ]; then
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | head -n -1)
        
        if [ "$http_code" = "$expected_status" ]; then
            echo "   ✅ PASS - Status: $http_code"
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        else
            echo "   ❌ FAIL - Expected: $expected_status, Got: $http_code"
        fi
    else
        echo "   ❌ FAIL - Connection error"
    fi
    echo ""
}

# Check if application is running
echo "🔍 Checking if application is running..."
if curl -s "$BASE_URL/health" > /dev/null 2>&1; then
    echo "✅ Application is running on $BASE_URL"
else
    echo "❌ Application is not running. Please start it with: npm run start:dev"
    exit 1
fi

echo ""
echo "🧪 Running verification tests..."
echo ""

# Test 1: Health check
test_endpoint "Health Check" "GET" "/health" "200"

# Test 2: Application info
test_endpoint "Application Info" "GET" "/" "200"

# Test 3: Swagger documentation
test_endpoint "Swagger Documentation" "GET" "/api" "200"

# Test 4: Portfolios endpoint (should return empty list or 200)
test_endpoint "List Portfolios" "GET" "/api/v1/portfolios" "200"

# Test 5: Create portfolio (will fail validation but endpoint should be accessible)
test_endpoint "Create Portfolio (Validation Test)" "POST" "/api/v1/portfolios" "400" '{"name":"Test Portfolio","baseCurrency":"VND"}'

# Test 6: Create portfolio with valid data (if account exists)
test_endpoint "Create Portfolio (Valid Data)" "POST" "/api/v1/portfolios" "201" '{"name":"Portfolio 1","baseCurrency":"VND","accountId":"123e4567-e89b-12d3-a456-426614174000"}'

# Test 7: Check frontend accessibility
echo "🧪 Test 7: Frontend Accessibility"
if curl -s "http://localhost:3001" > /dev/null 2>&1; then
    echo "   ✅ PASS - Frontend is accessible"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
    echo "   ❌ FAIL - Frontend is not accessible"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

echo "📊 Test Results:"
echo "   Total Tests: $TOTAL_TESTS"
echo "   Passed: $SUCCESS_COUNT"
echo "   Failed: $((TOTAL_TESTS - SUCCESS_COUNT))"
echo "   Success Rate: $(( (SUCCESS_COUNT * 100) / TOTAL_TESTS ))%"
echo ""

if [ $SUCCESS_COUNT -eq $TOTAL_TESTS ]; then
    echo "🎉 All tests passed! Local setup is working correctly."
    echo ""
    echo "🎯 Next steps:"
    echo "1. Seed the database: npm run seed:dev"
    echo "2. Test with real data using Swagger UI: $BASE_URL/api"
    echo "3. Check the README.md for more information"
else
    echo "⚠️  Some tests failed. Please check the application logs and configuration."
    echo ""
    echo "🔧 Troubleshooting:"
    echo "1. Check if all services are running: docker-compose ps"
    echo "2. Check application logs: docker-compose logs app"
    echo "3. Verify database connection: docker-compose exec postgres pg_isready -U postgres"
    echo "4. Verify Redis connection: docker-compose exec redis redis-cli ping"
fi

echo ""
echo "📚 Useful URLs:"
echo "   - Backend API: $BASE_URL"
echo "   - Frontend App: http://localhost:3001"
echo "   - Swagger UI: $BASE_URL/api"
echo "   - Health Check: $BASE_URL/health"
echo "   - API Documentation: $BASE_URL/api-json"
