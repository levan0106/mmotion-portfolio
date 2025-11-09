# API Documentation

This section contains complete API reference, examples, and integration guides for the Portfolio Management System.

## 📋 API Reference

- [API Documentation](./api_documentation.md) - Complete API reference with all endpoints
- [API Examples](./examples.md) - Practical usage examples and sample requests
- [Trading Analysis API](./TRADING_ANALYSIS_API.md) - Trading-specific API endpoints

## 🔧 Integration

- [Postman Collection](./postman_collection.json) - Ready-to-use API collection for testing
- [Frontend Integration](./frontend_account_integration_summary.md) - Frontend integration guide
- [Swagger Updates](./swagger-updates-summary.md) - API documentation updates and changes

## 🚀 Quick Start

1. **API Base URL**: `http://localhost:3000`
2. **Swagger UI**: `http://localhost:3000/api/docs`
3. **Health Check**: `http://localhost:3000/health`
4. **Postman Collection**: Import `postman_collection.json`

## 📚 Available Endpoints

### Portfolio Management
- `GET /api/v1/portfolios` - Get portfolios by account
- `POST /api/v1/portfolios` - Create portfolio
- `GET /api/v1/portfolios/:id` - Get portfolio details
- `PUT /api/v1/portfolios/:id` - Update portfolio
- `DELETE /api/v1/portfolios/:id` - Delete portfolio

### Portfolio Analytics
- `GET /api/v1/portfolios/:id/nav` - Current NAV
- `GET /api/v1/portfolios/:id/performance` - Performance metrics
- `GET /api/v1/portfolios/:id/allocation` - Asset allocation
- `GET /api/v1/portfolios/:id/positions` - Current positions

### Trading Analysis
- `GET /api/v1/trades/analysis/portfolio` - Comprehensive trading analysis
- `GET /api/v1/trades/analysis/performance` - Performance analysis
- `GET /api/v1/trades/analysis/risk` - Risk metrics

## 🔗 Related Documentation

- [Architecture](../architecture/) - System design and technical details
- [Development](../development/) - Development guides and utilities
- [Getting Started](../getting-started/) - Setup and quick start guides