#!/bin/bash

# Portfolio Management System - Endpoint Testing Script
echo "🧪 Testing Portfolio Management System endpoints..."

BASE_URL="http://localhost:3000"

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    
    echo "Testing $method $endpoint..."
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "$expected_status" ]; then
        echo "✅ $method $endpoint - Status: $http_code"
        if [ -n "$body" ] && [ "$body" != "null" ]; then
            echo "   Response: $(echo "$body" | jq . 2>/dev/null || echo "$body")"
        fi
    else
        echo "❌ $method $endpoint - Expected: $expected_status, Got: $http_code"
        echo "   Response: $body"
    fi
    echo ""
}

# Wait for application to be ready
echo "⏳ Waiting for application to start..."
sleep 5

# Test health endpoint
test_endpoint "GET" "/health" "" "200"

# Test app info endpoint
test_endpoint "GET" "/" "" "200"

# Test Swagger endpoint
test_endpoint "GET" "/api" "" "200"

# Test portfolios endpoint (should return empty list)
test_endpoint "GET" "/api/v1/portfolios" "" "200"

# Test creating a portfolio (this will fail without proper accountId, but we can test the endpoint)
test_endpoint "POST" "/api/v1/portfolios" '{"name":"Test Portfolio","baseCurrency":"VND","accountId":"123e4567-e89b-12d3-a456-426614174000"}' "201"

echo "🎯 Endpoint testing completed!"
echo ""
echo "📝 Note: Some tests may fail due to missing data or validation."
echo "   This is expected for initial testing."
echo ""
echo "🔍 To test with real data:"
echo "1. Create an account first"
echo "2. Use the accountId in portfolio creation"
echo "3. Test other endpoints with valid portfolioId"
