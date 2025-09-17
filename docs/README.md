# Portfolio Management System - Documentation

Welcome to the comprehensive documentation for the MMotion Portfolio Management System. This documentation is organized to help developers, contributors, and users understand and work with the system effectively.

## 📚 Documentation Structure

### 🚀 [Getting Started](./getting-started/)
Quick start guides and setup instructions for new users and developers.

- [Trading Setup Guide](./getting-started/TRADING_SETUP_GUIDE.md) - Complete trading system setup

### 🏗️ [Architecture](./architecture/)
System design, database schema, and technical architecture documentation.

- [Database Schema](./architecture/database-schema.md) - Complete database structure
- [System Design](./architecture/system_design.md) - Overall system architecture
- [Tech Stack](./architecture/tech_stack.md) - Technology choices and rationale
- [FIFO Engine](./architecture/FIFO_ENGINE.md) - Trade matching algorithms
- [Trade Matching](./architecture/TRADE_MATCHING.md) - Trading logic documentation

#### Technical Design Documents (TDD)
- [Portfolio Management TDD](./architecture/tdd_portfolio_management.md)
- [Trading System TDD](./architecture/tdd_trading_system.md)
- [Market Data Integration TDD](./architecture/tdd_market_data_integration.md)

#### Task Breakdowns
- [Portfolio Management Tasks](./architecture/task_breakdown_portfolio_management.md)
- [Trading System Tasks](./architecture/task_breakdown_trading_system.md)
- [Market Data Integration Tasks](./architecture/task_breakdown_market_data_integration.md)

#### Product Requirements (PRD)
- [Asset Management PRD](./architecture/cr_001_prd_asset_management.md)
- [Logging System PRD](./architecture/cr_001_prd_logging_system.md)

### 🔌 [API Documentation](./api/)
Complete API reference, examples, and integration guides.

- [API Reference](./api/api_documentation.md) - Complete API documentation
- [API Examples](./api/examples.md) - Practical usage examples
- [Trading Analysis API](./api/TRADING_ANALYSIS_API.md) - Trading-specific endpoints
- [Postman Collection](./api/postman_collection.json) - Ready-to-use API collection
- [Frontend Integration](./api/frontend_account_integration_summary.md) - Frontend integration guide
- [Swagger Updates](./api/swagger-updates-summary.md) - API documentation updates

### 🛠️ [Development](./development/)
Development guides, testing, debugging, and utilities.

#### Testing
- [Testing Guide](./development/testing/TESTING.md) - Comprehensive testing documentation
- [Unit Test Guide](./development/testing/UNIT_TEST_GUIDE.md) - Unit testing best practices
- [Test Templates](./development/testing/testing_templates.md) - Reusable test templates
- [Testing Guidelines](./development/testing/testing_guidelines.md) - Testing standards
- [How to Run Tests](./development/testing/HOW_TO_RUN_TESTS.md) - Test execution guide

#### Debugging
- [Debug Guide](./development/debugging/DEBUG_GUIDE.md) - Debugging tools and techniques

#### Utilities
- [Utils Guide](./development/utils/UTILS_GUIDE.md) - Utility functions documentation
- [Formatting Utils](./development/utils/FORMATTING_UTILS.md) - Data formatting utilities
- [Validation Utils](./development/utils/VALIDATION_UTILS.md) - Input validation utilities
- [Calculation Utils](./development/utils/CALCULATION_UTILS.md) - Financial calculations
- [Testing Utils](./development/utils/TESTING_UTILS.md) - Test helper utilities
- [Error Handling Utils](./development/utils/ERROR_HANDLING_UTILS.md) - Error management

#### Troubleshooting
- [Troubleshooting Guide](./development/troubleshooting.md) - Common issues and solutions

### 🚀 [Deployment](./deployment/)
Deployment guides, CI/CD, and production setup.

- [Docker Setup](./deployment/docker_setup.md) - Container deployment
- [Local Run](./deployment/local_run.md) - Local development setup
- [CI/CD Pipeline](./deployment/ci_cd_pipeline.md) - Continuous integration

### 📋 [Project Management](./project-management/)
Project status, changelog, and contribution guidelines.

- [Project Status](./project-management/status.md) - Current project status and progress
- [Changelog](./project-management/changelog.md) - Version history and changes
- [Contributing Guide](./project-management/contributing.md) - How to contribute

## 🎯 Quick Navigation

### For New Developers
1. Start with [Getting Started](./getting-started/)
2. Review [Architecture](./architecture/) overview
3. Check [Development Setup](./deployment/local_run.md)
4. Read [Testing Guide](./development/testing/TESTING.md)

### For API Users
1. Check [API Reference](./api/api_documentation.md)
2. Try [API Examples](./api/examples.md)
3. Use [Postman Collection](./api/postman_collection.json)

### For Contributors
1. Read [Contributing Guide](./project-management/contributing.md)
2. Review [Development Guidelines](./development/)
3. Check [Project Status](./project-management/status.md)

### For Troubleshooting
1. Check [Troubleshooting Guide](./development/troubleshooting.md)
2. Review [Debug Guide](./development/debugging/DEBUG_GUIDE.md)
3. Look at [Changelog](./project-management/changelog.md) for recent changes

## 🔗 Related Resources

- **Main Repository**: [Portfolio Management System](../README.md)
- **Memory Bank**: [Project Context](../memory-bank/) - Internal project tracking
- **Source Code**: [src/](../src/) - Application source code
- **Frontend**: [frontend/](../frontend/) - React frontend application

## 📞 Support

- **Documentation Issues**: Create an issue in the repository
- **Technical Questions**: Check troubleshooting guides first
- **Feature Requests**: Follow the contributing guidelines

---

**Last Updated**: September 15, 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
