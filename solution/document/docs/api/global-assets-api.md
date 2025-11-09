# Global Assets System API Documentation

## Overview

The Global Assets System provides a comprehensive API for managing financial assets across multiple nations and markets. This system supports multi-national asset management with separate pricing, nation-specific configurations, and system resilience.

## Base URL

```
/api/assets
```

## Authentication

All API endpoints require authentication. Include the authentication token in the request header:

```
Authorization: Bearer <your-token>
```

## Global Assets API

### 1. Get All Global Assets

**Endpoint:** `GET /api/assets/global`

**Description:** Retrieve a paginated list of global assets with optional filtering and sorting.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number for pagination |
| limit | number | No | 10 | Number of items per page |
| symbol | string | No | - | Filter by asset symbol |
| nation | string | No | - | Filter by nation code |
| type | string | No | - | Filter by asset type |
| isActive | boolean | No | - | Filter by active status |
| sortBy | string | No | createdAt | Sort field |
| sortOrder | string | No | DESC | Sort order (ASC/DESC) |

**Response:**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "symbol": "HPG",
      "name": "Hoa Phat Group",
      "type": "STOCK",
      "nation": "VN",
      "marketCode": "HOSE",
      "currency": "VND",
      "timezone": "Asia/Ho_Chi_Minh",
      "isActive": true,
      "description": "Leading steel manufacturer in Vietnam",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "globalIdentifier": "HPG.VN",
      "displayName": "Hoa Phat Group (HPG.VN)",
      "marketDisplayName": "HOSE (VN)",
      "hasTrades": false,
      "isAvailableForTrading": true,
      "marketInfo": {
        "nation": "VN",
        "marketCode": "HOSE",
        "currency": "VND",
        "timezone": "Asia/Ho_Chi_Minh"
      },
      "canModify": true
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### 2. Get Global Asset by ID

**Endpoint:** `GET /api/assets/global/{id}`

**Description:** Retrieve a specific global asset by its ID.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | UUID of the global asset |

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "symbol": "HPG",
  "name": "Hoa Phat Group",
  "type": "STOCK",
  "nation": "VN",
  "marketCode": "HOSE",
  "currency": "VND",
  "timezone": "Asia/Ho_Chi_Minh",
  "isActive": true,
  "description": "Leading steel manufacturer in Vietnam",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "globalIdentifier": "HPG.VN",
  "displayName": "Hoa Phat Group (HPG.VN)",
  "marketDisplayName": "HOSE (VN)",
  "hasTrades": false,
  "isAvailableForTrading": true,
  "marketInfo": {
    "nation": "VN",
    "marketCode": "HOSE",
    "currency": "VND",
    "timezone": "Asia/Ho_Chi_Minh"
  },
  "canModify": true
}
```

### 3. Create Global Asset

**Endpoint:** `POST /api/assets/global`

**Description:** Create a new global asset.

**Request Body:**

```json
{
  "symbol": "HPG",
  "name": "Hoa Phat Group",
  "type": "STOCK",
  "nation": "VN",
  "marketCode": "HOSE",
  "currency": "VND",
  "timezone": "Asia/Ho_Chi_Minh",
  "description": "Leading steel manufacturer in Vietnam"
}
```

**Validation Rules:**

- `symbol`: Required, uppercase alphanumeric with dashes allowed, max 50 characters
- `name`: Required, max 255 characters
- `type`: Required, must be one of: STOCK, BOND, GOLD, DEPOSIT, CASH
- `nation`: Required, 2-letter ISO country code
- `marketCode`: Required, uppercase alphanumeric with dashes allowed, max 20 characters
- `currency`: Required, 3-letter ISO currency code
- `timezone`: Required, IANA timezone format
- `description`: Optional, max 1000 characters

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "symbol": "HPG",
  "name": "Hoa Phat Group",
  "type": "STOCK",
  "nation": "VN",
  "marketCode": "HOSE",
  "currency": "VND",
  "timezone": "Asia/Ho_Chi_Minh",
  "isActive": true,
  "description": "Leading steel manufacturer in Vietnam",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "globalIdentifier": "HPG.VN",
  "displayName": "Hoa Phat Group (HPG.VN)",
  "marketDisplayName": "HOSE (VN)",
  "hasTrades": false,
  "isAvailableForTrading": true,
  "marketInfo": {
    "nation": "VN",
    "marketCode": "HOSE",
    "currency": "VND",
    "timezone": "Asia/Ho_Chi_Minh"
  },
  "canModify": true
}
```

### 4. Update Global Asset

**Endpoint:** `PUT /api/assets/global/{id}`

**Description:** Update an existing global asset. Note: `symbol` and `nation` cannot be modified after creation.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | UUID of the global asset |

**Request Body:**

```json
{
  "name": "Hoa Phat Group JSC",
  "type": "STOCK",
  "marketCode": "HOSE",
  "currency": "VND",
  "timezone": "Asia/Ho_Chi_Minh",
  "isActive": true,
  "description": "Updated description"
}
```

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "symbol": "HPG",
  "name": "Hoa Phat Group JSC",
  "type": "STOCK",
  "nation": "VN",
  "marketCode": "HOSE",
  "currency": "VND",
  "timezone": "Asia/Ho_Chi_Minh",
  "isActive": true,
  "description": "Updated description",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:30:00.000Z",
  "globalIdentifier": "HPG.VN",
  "displayName": "Hoa Phat Group JSC (HPG.VN)",
  "marketDisplayName": "HOSE (VN)",
  "hasTrades": false,
  "isAvailableForTrading": true,
  "marketInfo": {
    "nation": "VN",
    "marketCode": "HOSE",
    "currency": "VND",
    "timezone": "Asia/Ho_Chi_Minh"
  },
  "canModify": true
}
```

### 5. Delete Global Asset

**Endpoint:** `DELETE /api/assets/global/{id}`

**Description:** Delete a global asset. Only assets without associated trades can be deleted.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | UUID of the global asset |

**Response:**

```json
{
  "message": "Global asset deleted successfully"
}
```

### 6. Get Supported Nations

**Endpoint:** `GET /api/assets/global/nations`

**Description:** Get list of supported nation codes.

**Response:**

```json
{
  "nations": ["VN", "US", "UK", "JP", "SG"]
}
```

### 7. Get Nation Configuration

**Endpoint:** `GET /api/assets/global/nations/{code}/config`

**Description:** Get configuration for a specific nation.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| code | string | Yes | Nation code (e.g., VN, US) |

**Response:**

```json
{
  "code": "VN",
  "name": "Vietnam",
  "currency": "VND",
  "timezone": "Asia/Ho_Chi_Minh",
  "marketCodes": [
    {
      "code": "HOSE",
      "displayName": "Ho Chi Minh Stock Exchange"
    }
  ],
  "defaultPriceSource": "MARKET_DATA_SERVICE",
  "assetTypes": {
    "STOCK": {
      "enabled": true,
      "symbolPattern": "^[A-Z0-9]{3}$",
      "defaultMarketCode": "HOSE"
    }
  }
}
```

### 8. Validate Symbol Format

**Endpoint:** `GET /api/assets/global/validate-symbol`

**Description:** Validate if a symbol format is valid for a specific nation and asset type.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| nation | string | Yes | Nation code |
| type | string | Yes | Asset type |
| symbol | string | Yes | Symbol to validate |

**Response:**

```json
{
  "valid": true,
  "message": "Symbol format is valid"
}
```

## Asset Prices API

### 1. Get All Asset Prices

**Endpoint:** `GET /api/assets/prices`

**Description:** Retrieve a paginated list of asset prices with optional filtering.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number for pagination |
| limit | number | No | 10 | Number of items per page |
| assetId | string | No | - | Filter by asset ID |
| priceType | string | No | - | Filter by price type |
| priceSource | string | No | - | Filter by price source |
| sortBy | string | No | lastPriceUpdate | Sort field |
| sortOrder | string | No | DESC | Sort order (ASC/DESC) |

**Response:**

```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "assetId": "550e8400-e29b-41d4-a716-446655440000",
      "currentPrice": 50000,
      "priceType": "MARKET_DATA",
      "priceSource": "MARKET_DATA_SERVICE",
      "lastPriceUpdate": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "priceChange": 0,
      "priceChangePercentage": 0,
      "isUpToDate": true
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### 2. Get Asset Price by ID

**Endpoint:** `GET /api/assets/prices/{id}`

**Description:** Retrieve a specific asset price by its ID.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | UUID of the asset price |

**Response:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "assetId": "550e8400-e29b-41d4-a716-446655440000",
  "currentPrice": 50000,
  "priceType": "MARKET_DATA",
  "priceSource": "MARKET_DATA_SERVICE",
  "lastPriceUpdate": "2024-01-15T10:30:00.000Z",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "priceChange": 0,
  "priceChangePercentage": 0,
  "isUpToDate": true
}
```

### 3. Get Asset Price by Asset ID

**Endpoint:** `GET /api/assets/prices/asset/{assetId}`

**Description:** Retrieve the current price for a specific asset.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| assetId | string | Yes | UUID of the global asset |

**Response:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "assetId": "550e8400-e29b-41d4-a716-446655440000",
  "currentPrice": 50000,
  "priceType": "MARKET_DATA",
  "priceSource": "MARKET_DATA_SERVICE",
  "lastPriceUpdate": "2024-01-15T10:30:00.000Z",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "priceChange": 0,
  "priceChangePercentage": 0,
  "isUpToDate": true
}
```

### 4. Create Asset Price

**Endpoint:** `POST /api/assets/prices`

**Description:** Create a new asset price record.

**Request Body:**

```json
{
  "assetId": "550e8400-e29b-41d4-a716-446655440000",
  "currentPrice": 50000,
  "priceType": "MARKET_DATA",
  "priceSource": "MARKET_DATA_SERVICE",
  "lastPriceUpdate": "2024-01-15T10:30:00.000Z"
}
```

**Validation Rules:**

- `assetId`: Required, must be a valid UUID of an existing global asset
- `currentPrice`: Required, must be a positive number
- `priceType`: Required, must be one of: MANUAL, MARKET_DATA, EXTERNAL, CALCULATED
- `priceSource`: Required, must be one of: USER, MARKET_DATA_SERVICE, EXTERNAL_API, CALCULATED
- `lastPriceUpdate`: Required, must be a valid ISO 8601 date string

**Response:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "assetId": "550e8400-e29b-41d4-a716-446655440000",
  "currentPrice": 50000,
  "priceType": "MARKET_DATA",
  "priceSource": "MARKET_DATA_SERVICE",
  "lastPriceUpdate": "2024-01-15T10:30:00.000Z",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "priceChange": 0,
  "priceChangePercentage": 0,
  "isUpToDate": true
}
```

### 5. Update Asset Price

**Endpoint:** `PUT /api/assets/prices/{id}`

**Description:** Update an existing asset price record.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | UUID of the asset price |

**Request Body:**

```json
{
  "currentPrice": 51000,
  "priceType": "MARKET_DATA",
  "priceSource": "MARKET_DATA_SERVICE",
  "lastPriceUpdate": "2024-01-15T11:30:00.000Z"
}
```

**Response:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "assetId": "550e8400-e29b-41d4-a716-446655440000",
  "currentPrice": 51000,
  "priceType": "MARKET_DATA",
  "priceSource": "MARKET_DATA_SERVICE",
  "lastPriceUpdate": "2024-01-15T11:30:00.000Z",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:30:00.000Z",
  "priceChange": 1000,
  "priceChangePercentage": 2,
  "isUpToDate": true
}
```

### 6. Delete Asset Price

**Endpoint:** `DELETE /api/assets/prices/{id}`

**Description:** Delete an asset price record.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | UUID of the asset price |

**Response:**

```json
{
  "message": "Asset price deleted successfully"
}
```

### 7. Get Price History

**Endpoint:** `GET /api/assets/prices/{assetId}/history`

**Description:** Get price history for a specific asset.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| assetId | string | Yes | UUID of the global asset |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number for pagination |
| limit | number | No | 10 | Number of items per page |
| startDate | string | No | - | Start date filter (ISO 8601) |
| endDate | string | No | - | End date filter (ISO 8601) |

**Response:**

```json
{
  "data": [
    {
      "id": "b2c3d4e5-f6g7-8901-2345-678901bcdefg",
      "assetId": "550e8400-e29b-41d4-a716-446655440000",
      "price": 51000,
      "priceType": "MARKET_DATA",
      "priceSource": "MARKET_DATA_SERVICE",
      "changeReason": "Market data update",
      "metadata": {
        "provider": "Yahoo Finance",
        "timestamp": "2024-01-15T11:30:00.000Z"
      },
      "createdAt": "2024-01-15T11:30:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### 8. Get Price Statistics

**Endpoint:** `GET /api/assets/prices/statistics`

**Description:** Get price statistics for assets.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| assetId | string | No | - | Filter by asset ID |
| startDate | string | No | - | Start date filter (ISO 8601) |
| endDate | string | No | - | End date filter (ISO 8601) |

**Response:**

```json
{
  "totalAssets": 10,
  "assetsWithPrices": 8,
  "averagePrice": 45000,
  "highestPrice": 100000,
  "lowestPrice": 10000,
  "priceChanges": {
    "positive": 5,
    "negative": 2,
    "unchanged": 1
  },
  "lastUpdated": "2024-01-15T11:30:00.000Z"
}
```

### 9. Bulk Update Prices

**Endpoint:** `POST /api/assets/prices/bulk-update`

**Description:** Update multiple asset prices in a single request.

**Request Body:**

```json
{
  "updates": [
    {
      "assetId": "550e8400-e29b-41d4-a716-446655440000",
      "currentPrice": 51000,
      "priceType": "MARKET_DATA",
      "priceSource": "MARKET_DATA_SERVICE",
      "lastPriceUpdate": "2024-01-15T11:30:00.000Z"
    },
    {
      "assetId": "660f9511-f3c7-52e5-b827-557991551111",
      "currentPrice": 25000,
      "priceType": "MARKET_DATA",
      "priceSource": "MARKET_DATA_SERVICE",
      "lastPriceUpdate": "2024-01-15T11:30:00.000Z"
    }
  ]
}
```

**Response:**

```json
{
  "updated": 2,
  "failed": 0,
  "results": [
    {
      "assetId": "550e8400-e29b-41d4-a716-446655440000",
      "success": true,
      "message": "Price updated successfully"
    },
    {
      "assetId": "660f9511-f3c7-52e5-b827-557991551111",
      "success": true,
      "message": "Price updated successfully"
    }
  ]
}
```

## Error Responses

All API endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "symbol",
      "message": "Symbol must contain only uppercase letters, numbers, and dashes"
    }
  ]
}
```

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Global asset with ID 550e8400-e29b-41d4-a716-446655440000 not found",
  "error": "Not Found"
}
```

### 409 Conflict

```json
{
  "statusCode": 409,
  "message": "Asset with symbol HPG and nation VN already exists",
  "error": "Conflict"
}
```

### 500 Internal Server Error

```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

## Rate Limiting

API requests are rate limited to prevent abuse:

- **Global Assets API**: 100 requests per minute per user
- **Asset Prices API**: 200 requests per minute per user
- **Bulk Operations**: 10 requests per minute per user

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248000
```

## Pagination

All list endpoints support pagination with the following parameters:

- `page`: Page number (1-based)
- `limit`: Number of items per page (max 100)
- `sortBy`: Field to sort by
- `sortOrder`: Sort order (ASC/DESC)

Pagination metadata is included in responses:

```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

## Filtering

List endpoints support filtering with query parameters:

- **Exact match**: `?symbol=HPG`
- **Partial match**: `?name=Hoa Phat`
- **Range**: `?createdAt[gte]=2024-01-01&createdAt[lte]=2024-12-31`
- **Multiple values**: `?nation=VN,US,UK`

## Sorting

List endpoints support sorting with the `sortBy` and `sortOrder` parameters:

- **Single field**: `?sortBy=createdAt&sortOrder=DESC`
- **Multiple fields**: `?sortBy=createdAt,updatedAt&sortOrder=DESC,ASC`

## Examples

### Create a Vietnamese Stock

```bash
curl -X POST "https://api.example.com/api/assets/global" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "HPG",
    "name": "Hoa Phat Group",
    "type": "STOCK",
    "nation": "VN",
    "marketCode": "HOSE",
    "currency": "VND",
    "timezone": "Asia/Ho_Chi_Minh",
    "description": "Leading steel manufacturer in Vietnam"
  }'
```

### Get All US Stocks

```bash
curl -X GET "https://api.example.com/api/assets/global?nation=US&type=STOCK" \
  -H "Authorization: Bearer <token>"
```

### Update Asset Price

```bash
curl -X PUT "https://api.example.com/api/assets/prices/a1b2c3d4-e5f6-7890-1234-567890abcdef" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPrice": 51000,
    "lastPriceUpdate": "2024-01-15T11:30:00.000Z"
  }'
```

### Get Price History

```bash
curl -X GET "https://api.example.com/api/assets/prices/550e8400-e29b-41d4-a716-446655440000/history?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer <token>"
```

## Changelog

### Version 1.0.0 (2024-01-15)

- Initial release of Global Assets System API
- Support for multi-national asset management
- Separate pricing system with history tracking
- Nation-specific configuration support
- System resilience with graceful degradation
