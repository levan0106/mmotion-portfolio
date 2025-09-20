# Portfolio Management System - Technical Context

## Technologies Used
### Frontend Stack - **IMPLEMENTED**
- **React.js 18**: UI framework với hooks và functional components
- **TypeScript**: Type safety và better developer experience
- **Material-UI (MUI)**: Component library cho consistent UI
- **Recharts**: Data visualization cho portfolio analytics
- **React Query**: Data fetching và caching
- **React Router**: Client-side routing
- **WebSocket**: Real-time updates cho market data
- **React Hook Form + Yup**: Form handling và validation

### Backend Stack - **FULLY IMPLEMENTED ✅**
- **NestJS**: Node.js framework với decorators và dependency injection ✅
- **PostgreSQL**: Primary database với ACID compliance ✅
- **Redis**: In-memory cache và session storage ✅
- **TypeORM**: ORM cho database operations với custom repositories ✅
- **JWT**: Authentication và authorization (planned for future)
- **Swagger/OpenAPI**: API documentation với comprehensive examples ✅
- **class-validator**: DTO validation với custom validation rules ✅
- **class-transformer**: Data transformation và serialization ✅
- **Jest**: Unit testing framework với comprehensive test coverage ✅
- **Winston**: Advanced logging với multiple transports ✅
- **Socket.io**: WebSocket support cho real-time updates ✅
- **Asset Computed Fields**: Portfolio filtering và market data integration ✅
- **Market Data Service**: Mock service với real-time price updates ✅
- **Frontend Data Mapping**: Proper API data flow to UI components ✅
- **Real-time Calculations**: Trade Details with accurate financial calculations ✅
- **Data Transparency**: Alert system for database vs calculated values ✅
- **Portfolio Analytics**: 8 advanced charts with comprehensive analysis ✅
- **Compact Mode**: Ultra compact mode with global toggle for maximum data density ✅
- **Global Assets System**: CR-005 documentation complete (PRD, TDD, TBD) ✅
- **Module Separation**: Asset Module (Core) + Market Data Module (Optional) ✅
- **System Resilience**: Core functionality always available, enhanced features optional ✅
- **Portfolio Calculation Consistency**: All services use centralized helper services for calculations ✅
- **Helper Service Integration**: PortfolioCalculationService and AssetValueCalculatorService integration ✅
- **Real P&L Calculations**: Unrealized P&L from actual cost basis instead of mock values ✅
- **Interface Consistency**: Updated interfaces with currentPrice field for compatibility ✅
- **AssetAutocomplete Integration**: Advanced searchable dropdown with pagination and currency formatting ✅
- **Edit Modal Support**: Proper asset selection when opening trade edit modal ✅
- **Force Re-render Pattern**: Key-based re-render mechanism for component reset ✅
- **Asset Loading Optimization**: Handle value setting before data loading ✅
- **Cash Flow Pagination**: Server-side pagination with TypeORM skip/take methods ✅
- **API Response Format**: Updated to structured format with data array and pagination metadata ✅
- **Frontend Pagination UI**: Material-UI Pagination component with page navigation and size selection ✅
- **Chart API Integration**: Updated CashFlowChart to use new pagination format ✅
- **Performance Optimization**: Server-side pagination reduces data transfer and improves response times ✅
- **Error Handling**: Fixed undefined property access errors with comprehensive null checks ✅
- **Test Status**: 1,036 tests passing (91% pass rate) ⚠️
- **Database Status**: Fully operational with computed fields ✅
- **Compilation Status**: All TypeScript errors fixed ✅

### Infrastructure & DevOps
- **Docker**: Containerization cho all services - **PROJECT RUNS WITH DOCKER** ✅
- **Docker Compose**: Local development environment - **PRIMARY DEPLOYMENT METHOD** ✅
- **Containerized Services**: PostgreSQL, Redis, Backend, Frontend all run in Docker containers ✅
- **Development Setup**: `docker-compose up -d` for complete containerized development ✅
- **Kubernetes**: Production orchestration
- **GitHub Actions**: CI/CD pipeline
- **AWS/GCP**: Cloud hosting
- **Nginx**: Reverse proxy và load balancer

## Development Setup
### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose

### Local Development - **IMPLEMENTED WITH DOCKER** ✅
```bash
# Clone repository
git clone <repo-url>
cd portfolio-management-system

# Quick setup (automated with Docker)
chmod +x scripts/setup-local.sh
./scripts/setup-local.sh

# Or manual setup with Docker
npm install
cd frontend && npm install && cd ..
cp env.example .env
docker-compose up -d postgres redis
npm run typeorm:migration:run
npm run seed:dev
npm run start:dev  # Backend
cd frontend && npm start  # Frontend

# **RECOMMENDED: Full Docker setup**
docker-compose up -d  # Runs all services in Docker containers
```

### Local Run Checklist - **IMPLEMENTED WITH DOCKER ✅**
- [x] Copy `.env.example` to `.env` and set database/redis URLs
- [x] **DOCKER SETUP**: Run `docker-compose up -d` for full containerized setup (RECOMMENDED)
- [x] **Database Services**: PostgreSQL and Redis run in Docker containers
- [x] **Backend Service**: NestJS backend runs in Docker container
- [x] **Frontend Service**: React.js frontend runs in Docker container
- [x] Run migrations `npm run typeorm:migration:run`
- [x] Seed minimal data (assets, sample portfolio)
- [x] Verify Swagger at `http://localhost:3000/api`
- [x] Check health endpoint `/health`
- [x] Access frontend at `http://localhost:5173`
- [x] **All Services Containerized**: Complete Docker-based development environment
- [x] Automated verification scripts available
- [x] Complete setup documentation in README.md
- [x] Database fully seeded with comprehensive test data
- [x] All 17+ trading analysis API endpoints operational
- [x] Trading analysis with accurate P&L calculations
- [x] Complete documentation and troubleshooting guides

### Updated Requirements (Based on Stakeholder Feedback) - **IMPLEMENTATION READY**
- **Authentication**: Tạm thời bỏ qua (sẽ implement sau) - **Task 185 in scratchpad**
- **Mobile App**: Không cần (chỉ web application) - **Task 183 in scratchpad**
- **Trading Platform Integration**: Không cần - **Task 186 in scratchpad**
- **Budget Constraints**: Không có limitations - **Task 187 in scratchpad**

### Current Technical Issues - **IMMEDIATE PRIORITY**
- **Global Assets System Implementation**: Ready to start Phase 1 (Foundation Setup) - **CURRENT FOCUS**
  - **Next Task**: Task 1.1 - Create GlobalAsset entity with TypeORM decorators
  - **Priority**: High - Core functionality implementation
  - **Status**: Ready to implement with complete documentation
- **Test Failures**: 103 tests failing (9% failure rate) - **DEFERRED**
  - **Root Cause**: Logging module dependency injection issues
  - **Impact**: Affects CI/CD pipeline and test coverage
  - **Priority**: Medium - can be addressed after Global Assets System
- **Entity Metadata Issues**: Some TypeORM entity metadata problems in tests
  - **Impact**: Integration tests may fail
  - **Priority**: Low - affects test reliability

### Technical Decisions Made - **IMPLEMENTED IN TRADING SYSTEM ✅**
- **Caching Strategy**: Redis with 5-minute TTL, separate instances ✅
- **Real-time Updates**: WebSocket for bidirectional communication ✅
- **Performance Metrics**: Support TWR, IRR, XIRR calculations ✅
- **Multi-currency**: Convert to base currency ✅
- **Data Retention**: 5 years for NAV snapshots, latest prices only ✅
- **FIFO/LIFO**: Support both methods with configurable default ✅
  - **FIFOEngine**: First In, First Out trade matching algorithm ✅
  - **LIFOEngine**: Last In, First Out trade matching algorithm ✅
- **Position Updates**: Immediate updates when possible ✅
- **Risk Alerts**: Risk monitoring and alert system ✅
- **Trade Cancellation**: Support implemented ✅
- **DTO Validation**: Comprehensive validation with class-validator ✅
- **Testing Strategy**: Unit tests with Jest and comprehensive mocking ✅
- **Test Coverage**: 1,036 tests passing (91% pass rate) ⚠️
- **Trading Analysis**: Complete P&L calculations and risk metrics ✅
- **Documentation**: Comprehensive API docs and troubleshooting guides ✅

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/portfolio_db
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# External APIs
CAFEF_API_URL=https://s.cafef.vn
VNDIRECT_API_URL=https://api.vndirect.com.vn
```

## Technical Constraints
### Performance Requirements
- API response time < 500ms
- Market data refresh every 5 minutes
- Support 1000+ concurrent users
- Database queries < 100ms

### Security Requirements
- HTTPS only
- JWT token authentication
- Input validation và sanitization
- SQL injection prevention
- Rate limiting

### Data Constraints
- Financial data precision (decimal places)
- Historical data retention (5+ years)
- GDPR compliance cho user data
- Audit trail cho all transactions

## Dependencies - **IMPLEMENTATION TASKS DEFINED**
### Production Dependencies - **Tasks 38, 53-54, 55-56**
```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "@nestjs/cache-manager": "^10.0.0",
    "@nestjs/schedule": "^10.0.0",
    "@nestjs/websockets": "^10.0.0",
    "@nestjs/platform-socket.io": "^10.0.0",
    "@nestjs/axios": "^10.0.0",
    "typeorm": "^0.3.17",
    "pg": "^8.11.0",
    "redis": "^4.6.0",
    "cache-manager-redis-store": "^3.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "decimal.js": "^10.4.0",
    "moment": "^2.29.0",
    "date-fns": "^2.30.0",
    "lodash": "^4.17.0",
    "axios": "^1.6.0",
    "node-cron": "^3.0.0",
    "socket.io": "^4.7.0"
  }
}
```

### Development Dependencies
```json
{
  "devDependencies": {
    "@nestjs/testing": "^10.0.0",
    "jest": "^29.0.0",
    "supertest": "^6.3.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
```

## Database Relationship Structure - **UPDATED SEPTEMBER 14, 2025**
### New Relationship Model
- **User** → **Portfolio** (1:many) - User owns multiple portfolios
- **User** → **Asset** (1:many) - User creates and manages assets
- **Portfolio** → **Trade** (1:many) - Portfolio contains multiple trades
- **Trade** → **Asset** (1:1) - Each trade is for one specific asset
- **Trade** → **TradeDetail** (1:many) - Trade details for FIFO/LIFO matching

### Removed Components
- ❌ **PortfolioAsset Entity**: Completely removed
- ❌ **portfolio_assets Table**: Dropped from database
- ❌ **Direct Portfolio-Asset Relationship**: No longer exists

### Benefits of New Structure
- **Simplified Data Model**: Cleaner relationship structure
- **Better Performance**: Fewer joins required for queries
- **Easier Maintenance**: Less complex entity relationships
- **Trade-Centric**: All portfolio positions calculated through trades

## External Integrations - **IMPLEMENTATION TASKS DEFINED**
### Market Data Sources - **Tasks 6-9 in Market Data Module**
- **Cafef**: Stock prices, gold prices (CafefAPIClient - Task 6)
- **VnDirect**: Real-time stock data (VnDirectAPIClient - Task 7)
- **Vietcombank**: Exchange rates (VietcombankAPIClient - Task 8)
- **Manual Input**: Fallback cho missing data (PriceInputForm - Task 33)

### Third-party Services - **Tasks 6-9, 29-38 in Market Data Module**
- **Email Service**: SendGrid/AWS SES cho notifications (AlertManager - Task 13)
- **File Storage**: AWS S3 cho document storage (Future implementation)
- **Monitoring**: Prometheus + Grafana (Tasks 33-35, 48-49)
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana) (Tasks 36-37, 51-52, 53-54)
