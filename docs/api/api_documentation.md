# Portfolio Management System - API Documentation

## Overview
This document provides comprehensive API documentation for the Portfolio Management System, including all available endpoints with sample requests and responses.

**Base URL**: `http://localhost:3000`
**API Version**: v1
**Documentation**: Available at `http://localhost:3000/api/docs` (Swagger UI)

## Authentication
Currently, authentication is not implemented as per stakeholder requirements. All endpoints are publicly accessible.

## Error Handling
All endpoints follow standard HTTP status codes and return consistent error responses:

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "name",
      "message": "Name is required"
    }
  ]
}
```

### Common HTTP Status Codes
- `200` - OK
- `201` - Created
- `204` - No Content
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

---

## Health & System APIs

### 1. Get Application Info
**GET** `/`

Returns basic application information.

#### Response (200 OK)
```json
{
  "name": "Portfolio Management System",
  "version": "1.0.0",
  "description": "Comprehensive portfolio tracking and analytics system",
  "status": "running",
  "timestamp": "2024-12-19T10:30:00.000Z"
}
```

### 2. Health Check
**GET** `/health`

Returns application health status.

#### Response (200 OK)
```json
{
  "status": "ok",
  "timestamp": "2024-12-19T10:30:00.000Z",
  "uptime": 86400,
  "database": "connected",
  "redis": "connected"
}
```

---

## Portfolio Management APIs

### 3. Get All Portfolios
**GET** `/api/v1/portfolios`

Retrieves all portfolios for a specific account.

#### Query Parameters
- `accountId` (string, required): Account ID to filter portfolios

#### Response (200 OK)
```json
[
  {
    "portfolio_id": "550e8400-e29b-41d4-a716-446655440000",
    "account_id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Growth Portfolio",
    "base_currency": "VND",
    "total_value": 1500000000,
    "cash_balance": 50000000,
    "unrealized_pl": 150000000,
    "realized_pl": 75000000,
    "created_at": "2024-01-15T08:00:00.000Z",
    "updated_at": "2024-12-19T10:30:00.000Z"
  },
  {
    "portfolio_id": "550e8400-e29b-41d4-a716-446655440002",
    "account_id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Conservative Portfolio",
    "base_currency": "USD",
    "total_value": 75000,
    "cash_balance": 5000,
    "unrealized_pl": 2500,
    "realized_pl": 1200,
    "created_at": "2024-03-20T09:15:00.000Z",
    "updated_at": "2024-12-19T10:25:00.000Z"
  }
]
```

### 4. Create Portfolio
**POST** `/api/v1/portfolios`

Creates a new portfolio.

#### Request Body
```json
{
  "name": "Tech Growth Portfolio",
  "base_currency": "USD",
  "account_id": "550e8400-e29b-41d4-a716-446655440001",
  "description": "Portfolio focused on technology stocks with growth potential"
}
```

#### Response (201 Created)
```json
{
  "portfolio_id": "550e8400-e29b-41d4-a716-446655440003",
  "account_id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Tech Growth Portfolio",
  "base_currency": "USD",
  "total_value": 0,
  "cash_balance": 0,
  "unrealized_pl": 0,
  "realized_pl": 0,
  "created_at": "2024-12-19T10:30:00.000Z",
  "updated_at": "2024-12-19T10:30:00.000Z"
}
```

### 5. Get Portfolio Details
**GET** `/api/v1/portfolios/{id}`

Retrieves detailed information about a specific portfolio.

#### Path Parameters
- `id` (string, required): Portfolio ID (UUID format)

#### Response (200 OK)
```json
{
  "portfolio_id": "550e8400-e29b-41d4-a716-446655440000",
  "account_id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Growth Portfolio",
  "base_currency": "VND",
  "total_value": 1500000000,
  "cash_balance": 50000000,
  "unrealized_pl": 150000000,
  "realized_pl": 75000000,
  "created_at": "2024-01-15T08:00:00.000Z",
  "updated_at": "2024-12-19T10:30:00.000Z",
  "account": {
    "account_id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "base_currency": "VND"
  }
}
```

### 6. Update Portfolio
**PUT** `/api/v1/portfolios/{id}`

Updates an existing portfolio.

#### Path Parameters
- `id` (string, required): Portfolio ID (UUID format)

#### Request Body
```json
{
  "name": "Updated Growth Portfolio",
  "base_currency": "USD"
}
```

#### Response (200 OK)
```json
{
  "portfolio_id": "550e8400-e29b-41d4-a716-446655440000",
  "account_id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Updated Growth Portfolio",
  "base_currency": "USD",
  "total_value": 1500000000,
  "cash_balance": 50000000,
  "unrealized_pl": 150000000,
  "realized_pl": 75000000,
  "created_at": "2024-01-15T08:00:00.000Z",
  "updated_at": "2024-12-19T10:35:00.000Z"
}
```

### 7. Delete Portfolio
**DELETE** `/api/v1/portfolios/{id}`

Deletes a portfolio and all associated data.

#### Path Parameters
- `id` (string, required): Portfolio ID (UUID format)

#### Response (204 No Content)
```
No response body
```

### 8. Get Current NAV
**GET** `/api/v1/portfolios/{id}/nav`

Retrieves the current Net Asset Value for a portfolio.

#### Path Parameters
- `id` (string, required): Portfolio ID (UUID format)

#### Response (200 OK)
```json
{
  "nav": 1500000000,
  "portfolio_id": "550e8400-e29b-41d4-a716-446655440000",
  "calculated_at": "2024-12-19T10:30:00.000Z"
}
```

### 9. Get NAV History
**GET** `/api/v1/portfolios/{id}/nav/history`

Retrieves historical NAV data for a portfolio.

#### Path Parameters
- `id` (string, required): Portfolio ID (UUID format)

#### Response (200 OK)
```json
{
  "portfolio_id": "550e8400-e29b-41d4-a716-446655440000",
  "nav_history": [
    {
      "date": "2024-12-19T00:00:00.000Z",
      "nav": 1500000000,
      "total_value": 1500000000,
      "cash_balance": 50000000
    },
    {
      "date": "2024-12-18T00:00:00.000Z",
      "nav": 1485000000,
      "total_value": 1485000000,
      "cash_balance": 50000000
    },
    {
      "date": "2024-12-17T00:00:00.000Z",
      "nav": 1472000000,
      "total_value": 1472000000,
      "cash_balance": 50000000
    }
  ],
  "period": {
    "start_date": "2024-11-19T00:00:00.000Z",
    "end_date": "2024-12-19T10:30:00.000Z"
  },
  "retrieved_at": "2024-12-19T10:30:00.000Z"
}
```

### 10. Get Performance Metrics
**GET** `/api/v1/portfolios/{id}/performance`

Retrieves performance metrics for a portfolio.

#### Path Parameters
- `id` (string, required): Portfolio ID (UUID format)

#### Response (200 OK)
```json
{
  "portfolio_id": "550e8400-e29b-41d4-a716-446655440000",
  "total_return": 0.125,
  "annualized_return": 0.148,
  "volatility": 0.18,
  "sharpe_ratio": 0.82,
  "max_drawdown": -0.08,
  "ytd_return": 0.095,
  "mtd_return": 0.015,
  "inception_date": "2024-01-15T08:00:00.000Z",
  "calculated_at": "2024-12-19T10:30:00.000Z"
}
```

### 11. Get Asset Allocation
**GET** `/api/v1/portfolios/{id}/allocation`

Retrieves asset allocation breakdown for a portfolio.

#### Path Parameters
- `id` (string, required): Portfolio ID (UUID format)

#### Response (200 OK)
```json
{
  "portfolio_id": "550e8400-e29b-41d4-a716-446655440000",
  "allocation": {
    "stock": 65.5,
    "bond": 20.0,
    "gold": 10.0,
    "cash": 4.5
  },
  "total_value": 1500000000,
  "calculated_at": "2024-12-19T10:30:00.000Z"
}
```

### 12. Get Current Positions
**GET** `/api/v1/portfolios/{id}/positions`

Retrieves current asset positions for a portfolio.

#### Path Parameters
- `id` (string, required): Portfolio ID (UUID format)

#### Response (200 OK)
```json
{
  "portfolio_id": "550e8400-e29b-41d4-a716-446655440000",
  "positions": [
    {
      "asset_id": "550e8400-e29b-41d4-a716-446655440100",
      "symbol": "HPG",
      "name": "Hoa Phat Group JSC",
      "type": "STOCK",
      "quantity": 10000,
      "average_cost": 25000,
      "current_price": 28500,
      "market_value": 285000000,
      "unrealized_pl": 35000000,
      "unrealized_pl_percent": 14.0,
      "weight": 19.0
    },
    {
      "asset_id": "550e8400-e29b-41d4-a716-446655440101",
      "symbol": "VCB",
      "name": "Joint Stock Commercial Bank for Foreign Trade of Vietnam",
      "type": "STOCK",
      "quantity": 5000,
      "average_cost": 85000,
      "current_price": 92000,
      "market_value": 460000000,
      "unrealized_pl": 35000000,
      "unrealized_pl_percent": 8.24,
      "weight": 30.67
    },
    {
      "asset_id": "550e8400-e29b-41d4-a716-446655440102",
      "symbol": "GOLD",
      "name": "Gold ETF",
      "type": "GOLD",
      "quantity": 2.5,
      "average_cost": 58000000,
      "current_price": 60000000,
      "market_value": 150000000,
      "unrealized_pl": 5000000,
      "unrealized_pl_percent": 3.45,
      "weight": 10.0
    }
  ],
  "summary": {
    "total_positions": 3,
    "total_market_value": 895000000,
    "total_unrealized_pl": 75000000,
    "total_unrealized_pl_percent": 9.15
  },
  "retrieved_at": "2024-12-19T10:30:00.000Z"
}
```

---

## Portfolio Analytics APIs

### 13. Get Performance Analytics
**GET** `/api/v1/portfolios/{id}/analytics/performance`

Retrieves detailed performance analytics for a specific period.

#### Path Parameters
- `id` (string, required): Portfolio ID (UUID format)

#### Query Parameters
- `period` (string, optional): Analysis period (`1M`, `3M`, `6M`, `1Y`). Default: `1Y`

#### Response (200 OK)
```json
{
  "portfolio_id": "550e8400-e29b-41d4-a716-446655440000",
  "period": "1Y",
  "period_start": "2023-12-19T10:30:00.000Z",
  "period_end": "2024-12-19T10:30:00.000Z",
  "total_return": 0.125,
  "annualized_return": 0.148,
  "volatility": 0.18,
  "sharpe_ratio": 0.82,
  "max_drawdown": -0.08,
  "period_roe": 0.095,
  "period_twr": 0.102,
  "alpha": 0.025,
  "beta": 1.15,
  "information_ratio": 0.45,
  "treynor_ratio": 0.089,
  "calculated_at": "2024-12-19T10:30:00.000Z"
}
```

### 14. Get Allocation Analytics
**GET** `/api/v1/portfolios/{id}/analytics/allocation`

Retrieves detailed asset allocation analytics.

#### Path Parameters
- `id` (string, required): Portfolio ID (UUID format)

#### Query Parameters
- `groupby` (string, optional): Group allocation by `type` or `class`. Default: `type`

#### Response (200 OK)
```json
{
  "portfolio_id": "550e8400-e29b-41d4-a716-446655440000",
  "total_value": 1500000000,
  "allocation": {
    "stock": {
      "percentage": 65.5,
      "value": 982500000
    },
    "bond": {
      "percentage": 20.0,
      "value": 300000000
    },
    "gold": {
      "percentage": 10.0,
      "value": 150000000
    },
    "cash": {
      "percentage": 4.5,
      "value": 67500000
    }
  },
  "group_by": "type",
  "calculated_at": "2024-12-19T10:30:00.000Z"
}
```

### 15. Get Historical Performance Data
**GET** `/api/v1/portfolios/{id}/analytics/history`

Retrieves historical performance data with flexible date ranges.

#### Path Parameters
- `id` (string, required): Portfolio ID (UUID format)

#### Query Parameters
- `start_date` (string, optional): Start date in YYYY-MM-DD format
- `end_date` (string, optional): End date in YYYY-MM-DD format
- `limit` (number, optional): Maximum number of records to return

#### Response (200 OK)
```json
{
  "portfolio_id": "550e8400-e29b-41d4-a716-446655440000",
  "period": {
    "start_date": "2024-11-19T00:00:00.000Z",
    "end_date": "2024-12-19T10:30:00.000Z"
  },
  "return_history": [
    {
      "date": "2024-12-19T00:00:00.000Z",
      "daily_return": 0.012,
      "cumulative_return": 0.125,
      "nav": 1500000000
    },
    {
      "date": "2024-12-18T00:00:00.000Z",
      "daily_return": -0.005,
      "cumulative_return": 0.111,
      "nav": 1485000000
    },
    {
      "date": "2024-12-17T00:00:00.000Z",
      "daily_return": 0.008,
      "cumulative_return": 0.117,
      "nav": 1472000000
    }
  ],
  "performance_summary": {
    "total_return": 0.125,
    "annualized_return": 0.148,
    "volatility": 0.18,
    "sharpe_ratio": 0.82,
    "max_drawdown": -0.08
  },
  "limit": 30,
  "retrieved_at": "2024-12-19T10:30:00.000Z"
}
```

### 16. Generate NAV Snapshot
**GET** `/api/v1/portfolios/{id}/analytics/snapshot`

Generates a NAV snapshot for a specific date.

#### Path Parameters
- `id` (string, required): Portfolio ID (UUID format)

#### Query Parameters
- `date` (string, optional): Snapshot date in YYYY-MM-DD format. Default: current date

#### Response (200 OK)
```json
{
  "portfolio_id": "550e8400-e29b-41d4-a716-446655440000",
  "snapshot": {
    "snapshot_id": "550e8400-e29b-41d4-a716-446655440200",
    "date": "2024-12-19T00:00:00.000Z",
    "nav": 1500000000,
    "total_value": 1500000000,
    "cash_balance": 50000000,
    "asset_positions": [
      {
        "asset_id": "550e8400-e29b-41d4-a716-446655440100",
        "symbol": "HPG",
        "quantity": 10000,
        "market_price": 28500,
        "market_value": 285000000
      },
      {
        "asset_id": "550e8400-e29b-41d4-a716-446655440101",
        "symbol": "VCB",
        "quantity": 5000,
        "market_price": 92000,
        "market_value": 460000000
      }
    ]
  },
  "generated_at": "2024-12-19T10:30:00.000Z"
}
```

### 17. Get Analytics Report
**GET** `/api/v1/portfolios/{id}/analytics/report`

Generates a comprehensive analytics report for a portfolio.

#### Path Parameters
- `id` (string, required): Portfolio ID (UUID format)

#### Response (200 OK)
```json
{
  "portfolio_id": "550e8400-e29b-41d4-a716-446655440000",
  "portfolio_name": "Growth Portfolio",
  "report_date": "2024-12-19T10:30:00.000Z",
  "performance": {
    "total_return": 0.125,
    "annualized_return": 0.148,
    "volatility": 0.18,
    "sharpe_ratio": 0.82,
    "max_drawdown": -0.08,
    "ytd_return": 0.095,
    "mtd_return": 0.015
  },
  "allocation": {
    "stock": 65.5,
    "bond": 20.0,
    "gold": 10.0,
    "cash": 4.5
  },
  "summary": {
    "total_value": 1500000000,
    "cash_balance": 50000000,
    "unrealized_pl": 150000000,
    "realized_pl": 75000000,
    "asset_count": 4
  }
}
```

---

## Data Models

### Portfolio Model
```json
{
  "portfolio_id": "string (UUID)",
  "account_id": "string (UUID)",
  "name": "string (max 255 chars)",
  "base_currency": "string (3 chars, e.g., VND, USD)",
  "total_value": "number (decimal 15,2)",
  "cash_balance": "number (decimal 15,2)",
  "unrealized_pl": "number (decimal 15,2)",
  "realized_pl": "number (decimal 15,2)",
  "created_at": "string (ISO 8601 datetime)",
  "updated_at": "string (ISO 8601 datetime)"
}
```

### Account Model
```json
{
  "account_id": "string (UUID)",
  "name": "string (max 255 chars)",
  "email": "string (max 255 chars, unique)",
  "base_currency": "string (3 chars, default: VND)",
  "created_at": "string (ISO 8601 datetime)",
  "updated_at": "string (ISO 8601 datetime)"
}
```

### Asset Model
```json
{
  "asset_id": "string (UUID)",
  "symbol": "string (max 20 chars, unique)",
  "name": "string (max 255 chars)",
  "type": "string (STOCK, BOND, GOLD, CASH)",
  "asset_class": "string (EQUITY, FIXED_INCOME, COMMODITY)",
  "currency": "string (3 chars, default: VND)",
  "is_active": "boolean (default: true)",
  "created_at": "string (ISO 8601 datetime)"
}
```

### Position Model
```json
{
  "asset_id": "string (UUID)",
  "symbol": "string",
  "name": "string",
  "type": "string",
  "quantity": "number",
  "average_cost": "number",
  "current_price": "number",
  "market_value": "number",
  "unrealized_pl": "number",
  "unrealized_pl_percent": "number",
  "weight": "number (percentage of portfolio)"
}
```

---

## Sample Data for Testing

### Sample Account
```json
{
  "account_id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "base_currency": "VND"
}
```

### Sample Assets
```json
[
  {
    "asset_id": "550e8400-e29b-41d4-a716-446655440100",
    "symbol": "HPG",
    "name": "Hoa Phat Group JSC",
    "type": "STOCK",
    "asset_class": "EQUITY",
    "currency": "VND"
  },
  {
    "asset_id": "550e8400-e29b-41d4-a716-446655440101",
    "symbol": "VCB",
    "name": "Joint Stock Commercial Bank for Foreign Trade of Vietnam",
    "type": "STOCK",
    "asset_class": "EQUITY",
    "currency": "VND"
  },
  {
    "asset_id": "550e8400-e29b-41d4-a716-446655440102",
    "symbol": "GOLD",
    "name": "Gold ETF",
    "type": "GOLD",
    "asset_class": "COMMODITY",
    "currency": "VND"
  }
]
```

---

## Usage Examples

### Create and Manage a Portfolio

1. **Create a new portfolio:**
```bash
curl -X POST http://localhost:3000/api/v1/portfolios \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Investment Portfolio",
    "base_currency": "VND",
    "account_id": "550e8400-e29b-41d4-a716-446655440001",
    "description": "Long-term investment portfolio"
  }'
```

2. **Get portfolio details:**
```bash
curl http://localhost:3000/api/v1/portfolios/550e8400-e29b-41d4-a716-446655440000
```

3. **Get performance analytics:**
```bash
curl "http://localhost:3000/api/v1/portfolios/550e8400-e29b-41d4-a716-446655440000/analytics/performance?period=1Y"
```

4. **Get asset allocation:**
```bash
curl http://localhost:3000/api/v1/portfolios/550e8400-e29b-41d4-a716-446655440000/allocation
```

---

## Rate Limiting
Currently, no rate limiting is implemented. In production, consider implementing rate limiting based on IP address or user authentication.

## Versioning
The API uses URL versioning (v1). Future versions will be available as v2, v3, etc., maintaining backward compatibility.

## Support
For API support and questions, please refer to the project documentation or contact the development team.

---

*Last updated: December 19, 2024*
*API Version: 1.0.0*
