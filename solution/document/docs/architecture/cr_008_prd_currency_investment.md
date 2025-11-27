# CR-008: Currency Investment System - Product Requirements Document

## 1. Executive Summary

### 1.1 Overview
This document outlines the requirements for implementing a comprehensive currency investment system within the existing Portfolio Management System. The currency investment feature will allow users to invest in foreign currencies (USD, GBP, EUR, JPY, etc.) by holding them as investment assets, tracking exchange rate fluctuations, and calculating profit/loss based on currency appreciation/depreciation.

### 1.2 Business Objectives
- Enable users to invest in foreign currencies as a distinct asset class
- Track currency holdings with real-time exchange rate updates
- Calculate profit/loss based on currency value changes
- Integrate currency investments into portfolio analytics and reporting
- Support currency purchase/sale transactions with proper cash flow tracking
- Maintain historical currency price data for performance analysis

### 1.3 Success Criteria
- Users can create, view, edit, and sell currency holdings through intuitive UI
- Currency values are accurately calculated using real-time exchange rates
- Currency investments are integrated into portfolio total value calculations
- Currency P&L is properly tracked and displayed in portfolio analytics
- System maintains data consistency between currency holdings and portfolio calculations
- Historical currency price data is available for performance tracking

## 2. Product Context

### 2.1 Current System State
The Portfolio Management System is 100% complete with:
- ✅ Complete portfolio management with real-time calculations
- ✅ Trading system with FIFO/LIFO algorithms
- ✅ Asset management with computed fields
- ✅ Cash flow management system
- ✅ Portfolio analytics and reporting
- ✅ Exchange rate data fetching from external APIs (cafef.vn, vietcombank)
- ✅ Frontend React.js dashboard

### 2.2 Integration Points
- **Asset Module**: Currency will be implemented as a new AssetType (CURRENCY), using existing Asset entity
- **Portfolio Module**: Currency holdings integrated into total portfolio value through Asset system
- **Trading System**: Currency purchase/sale transactions using existing Trade entity (same as STOCK, BOND, etc.)
- **Cash Flow System**: Automatic cash flow creation for currency transactions
- **Market Data System**: Real-time exchange rate updates from existing ExchangeRateAPIClient
- **Portfolio Snapshots**: Currency holdings included in historical snapshots through Asset system
- **Asset Allocation**: Currencies shown as CURRENCY asset type in allocation charts
- **P&L Calculations**: Currency appreciation/depreciation included in portfolio P&L through existing asset P&L system

### 2.3 Reference Implementation
The system currently has exchange rate data fetching capabilities:
- **ExchangeRateAPIClient**: Fetches exchange rates from tygiausd.org
- **External Market Data Service**: Manages exchange rate data with caching
- **Currency Support**: USD, EUR, GBP, JPY, CNY, KRW, SGD, THB, and more

### 2.4 Design Approach: Currency as Asset Type
**Key Design Decision:** Currency will be implemented as a new AssetType (CURRENCY), using the existing Asset and Trade entities, rather than creating separate Currency-specific entities.

**Rationale:**
- Currency behaves like other assets (STOCK, BOND, GOLD): can be bought, sold, held, tracked
- Exchange rate = Asset price (updates automatically via price update system)
- Currency units = Asset quantity (tracked via Trade system)
- Reuses all existing infrastructure: Trade matching, P&L calculation, portfolio integration
- Minimal code changes: Only need to add CURRENCY to AssetType enum
- Consistent user experience: Currency management works exactly like other assets

**Implementation:**
- Add `CURRENCY = 'CURRENCY'` to AssetType enum
- Currency assets created with type = CURRENCY, symbol = currency code (USD, GBP, etc.)
- Currency trades use existing Trade entity (BUY/SELL)
- Exchange rates stored as asset prices (via AssetPrice entity)
- All existing asset management features automatically work with CURRENCY type

## 3. User Stories

### 3.1 Primary User Stories

#### US-001: Purchase Currency
**As a** portfolio manager  
**I want to** purchase foreign currency (USD, GBP, EUR, etc.)  
**So that** I can invest in currency markets

**Acceptance Criteria:**
- User can create a new Asset with type = CURRENCY (similar to creating STOCK or BOND asset)
- User can select currency code (USD, GBP, EUR, JPY, etc.) as asset symbol
- User can input currency name (e.g., "US Dollar", "British Pound")
- System automatically fetches current exchange rate from ExchangeRateAPIClient
- User can purchase currency through Trade entity (BUY trade) with quantity and price (exchange rate)
- System validates all required fields
- Currency asset is created and trade is recorded
- Cash flow entry is automatically created

#### US-002: View Currency Holdings
**As a** portfolio manager  
**I want to** view all my currency holdings  
**So that** I can monitor my currency investments

**Acceptance Criteria:**
- User can see list of all currency assets (filtered by AssetType.CURRENCY)
- List shows currency symbol, name, quantity held, average purchase price, current exchange rate, current value, P&L
- User can filter and sort currency assets (same as other asset types)
- User can access currency asset details (same as other assets)
- Real-time exchange rates are displayed and updated automatically

#### US-003: Sell Currency
**As a** portfolio manager  
**I want to** sell currency holdings  
**So that** I can realize profits or exit positions

**Acceptance Criteria:**
- User can sell currency through Trade entity (SELL trade) - same as selling STOCK or BOND
- User can select currency asset and input sell quantity
- System automatically uses current exchange rate or allows manual entry
- System validates sufficient currency quantity (same validation as other assets)
- Trade is recorded and asset quantity is updated
- Cash flow entry is automatically created
- Realized P&L is calculated using FIFO/LIFO (same as other assets)

#### US-004: View Currency Performance
**As a** portfolio manager  
**I want to** see currency investment performance  
**So that** I can evaluate my currency investment strategy

**Acceptance Criteria:**
- Currency holdings appear in portfolio analytics
- Currency values included in total portfolio value
- Currency P&L (realized and unrealized) displayed separately
- Currency allocation shown in asset allocation charts
- Historical currency price data available for analysis

#### US-005: Automatic Exchange Rate Updates
**As a** portfolio manager  
**I want to** have currency values updated automatically  
**So that** I can see real-time portfolio values

**Acceptance Criteria:**
- System fetches exchange rates from external APIs automatically
- Currency holdings values update based on latest exchange rates
- Exchange rate history is maintained for historical analysis
- Users can see exchange rate source and last update time

### 3.2 Secondary User Stories

#### US-006: Currency Management Tab
**As a** portfolio manager  
**I want to** access currency management from portfolio detail page  
**So that** I can manage currency investments within portfolio context

**Acceptance Criteria:**
- Currency tab added to portfolio detail page
- Tab shows currency-specific analytics and management tools
- Consistent UI with other portfolio tabs

#### US-007: Global Currency Management
**As a** portfolio manager  
**I want to** manage all currency holdings across portfolios  
**So that** I can have a centralized view

**Acceptance Criteria:**
- Menu item for "Currency Investment" in main navigation
- Global view of all currency holdings across all portfolios
- Filtering and search capabilities
- Currency performance summary across portfolios

#### US-008: Currency Price History
**As a** portfolio manager  
**I want to** view historical currency prices  
**So that** I can analyze currency trends

**Acceptance Criteria:**
- Historical exchange rate data available for each currency
- Price charts showing currency value over time
- Comparison between purchase price and current price
- Performance metrics (total return, annualized return)

## 4. Functional Requirements

### 4.1 Core Features

#### 4.1.1 Currency Asset Creation and Purchase
- **Asset Creation (First Time):**
  - Create Asset with type = CURRENCY
  - Symbol = Currency code (USD, GBP, EUR, JPY, etc.)
  - Name = Currency name (e.g., "US Dollar", "British Pound")
  - Price mode = AUTOMATIC (for exchange rate auto-updates)
  - Currency field = Currency code (USD, GBP, etc.)
  
- **Currency Purchase (Trade):**
  - Use existing Trade entity with side = BUY
  - Asset type = CURRENCY
  - Quantity = Currency units to purchase
  - Price = Exchange rate (auto-filled from ExchangeRateAPIClient or manual)
  - Trade date = Purchase date
  - Same validation and business logic as other asset trades

- **Validation Rules:**
  - Asset symbol (currency code) must be unique per user
  - Quantity must be positive
  - Exchange rate (price) must be positive
  - Trade date cannot be in the future
  - Sufficient cash balance in portfolio

- **Business Logic:**
  - Create or use existing Currency Asset
  - Create BUY Trade with quantity and exchange rate
  - Trade system automatically handles:
    - Cash flow entry (outflow)
    - Portfolio cash balance update
    - Portfolio total value update
    - Asset quantity update

#### 4.1.2 Currency Asset Management
- **Asset Display (Same as Other Assets):**
  - Currency symbol (asset symbol) and name (asset name)
  - Quantity held (asset currentQuantity)
  - Average purchase price (calculated from trades)
  - Current exchange rate (asset currentPrice from price updates)
  - Current value (quantity × currentPrice)
  - Unrealized P&L (calculated by portfolio system)
  - Asset creation date
  - Last price update time

- **CRUD Operations (Same as Other Assets):**
  - Create: Create Asset with type = CURRENCY
  - Read: View currency assets (filtered by AssetType.CURRENCY)
  - Update: Edit asset name, description (same as other assets)
  - Delete: Only if no trades exist (same validation as other assets)

#### 4.1.3 Currency Sale (Trade)
- **Sale Process (Same as Other Assets):**
  - Use existing Trade entity with side = SELL
  - Select Currency Asset (same as selecting STOCK or BOND)
  - Quantity = Currency units to sell
  - Price = Exchange rate (auto-filled from current rate or manual)
  - Trade date = Sale date
  - Notes (optional)

- **Validation Rules (Same as Other Assets):**
  - Asset must exist
  - Quantity must be positive
  - Quantity cannot exceed available units (currentQuantity)
  - Exchange rate (price) must be positive
  - Trade date cannot be in the future

- **Business Logic (Handled by Trade System):**
  - Create SELL Trade with quantity and exchange rate
  - Trade system automatically handles:
    - Calculate proceeds: Proceeds = Sale Units × Exchange Rate
    - Update asset quantity (reduce currentQuantity)
    - Calculate realized P&L using FIFO/LIFO (same as other assets)
    - Create cash flow entry (inflow)
    - Update portfolio cash balance
    - Update portfolio total value
    - Record realized P&L in portfolio

#### 4.1.4 Exchange Rate Management
- **Rate Sources:**
  - Primary: ExchangeRateAPIClient (tygiausd.org)
  - Secondary: Vietcombank API
  - Fallback: Manual entry

- **Rate Updates:**
  - Automatic updates via scheduled job (using existing price update system)
  - Manual refresh option for users
  - Rate history maintained for each currency

- **Rate Display:**
  - Current buy rate
  - Current sell rate
  - Rate source (bank/API)
  - Last update timestamp

### 4.2 Integration Features

#### 4.2.1 Portfolio Integration
- **Total Value Calculation:**
  - Total Value = Investment Value + Currency Value + Cash Balance
  - Currency Value = Sum of (Currency Units × Current Exchange Rate) for all holdings

- **Asset Allocation:**
  - Currencies shown as special asset type "CURRENCY"
  - Percentage calculation based on total portfolio value
  - Grouped by currency type in allocation charts

#### 4.2.2 Trading System Integration
- **Trade Entity Usage:**
  - Currency purchases/sales use existing Trade entity (NO changes needed)
  - Asset type: CURRENCY (new AssetType enum value)
  - Trade side: BUY (purchase) or SELL (sale)
  - Same trade processing as STOCK, BOND, GOLD, etc.

- **FIFO/LIFO Support:**
  - Currency sales automatically use FIFO or LIFO cost basis (same as other assets)
  - Cost basis method configured per portfolio (same for all asset types)
  - Realized P&L calculation handled by existing trade matching system

#### 4.2.3 Cash Flow Integration
- **Automatic Cash Flow:**
  - Currency Purchase: Negative cash flow (money out)
  - Currency Sale: Positive cash flow (money in)
  - Cash flow currency matches base currency
  - Reference to trade ID for traceability

#### 4.2.4 Portfolio Snapshot Integration
- **New Fields in PortfolioSnapshot:**
  - `totalCurrencyValue`: Total value of all currency holdings
  - `totalCurrencyUnits`: Total units across all currencies
  - `currencyCount`: Number of different currencies held
  - `currencyUnrealizedPnL`: Total unrealized P&L from currencies
  - `currencyRealizedPnL`: Total realized P&L from currencies

#### 4.2.5 P&L Integration
- **Unrealized P&L:**
  - Calculated as: (Current Value - Purchase Value) for all holdings
  - Current Value = Units × Current Exchange Rate
  - Purchase Value = Units × Average Purchase Price

- **Realized P&L:**
  - Calculated on currency sale
  - Realized P&L = Sale Proceeds - (Sale Units × Average Purchase Price)
  - Accumulated in portfolio realized P&L

- **Automatic Calculation:**
  - Integrated into existing P&L calculations
  - Displayed separately in portfolio analytics
  - Included in performance reports

### 4.3 UI/UX Features

#### 4.3.1 Portfolio Detail Page
- **New Tab:** "Currencies" tab added to portfolio detail page
- **Tab Content:**
  - Currency holdings list with key information
  - Purchase currency button
  - Currency analytics and summary
  - Exchange rate display
  - Performance charts

#### 4.3.2 Global Currency Management
- **Navigation Menu:** "Currency Investment" menu item
- **Global View:** All currency holdings across all portfolios
- **Management Tools:**
  - Purchase, sell, edit currency holdings
  - Filter by portfolio, currency type, date range
  - Search functionality
  - Performance summary

#### 4.3.3 Currency Form
- **Responsive Design:** Works on desktop and mobile
- **Validation Feedback:** Real-time validation with clear error messages
- **Auto-calculation:** Currency units and proceeds automatically calculated
- **Currency Formatting:** Proper formatting for amounts and exchange rates
- **Exchange Rate Display:** Current rates shown with source and timestamp

#### 4.3.4 Currency Holdings List
- **Table Display:**
  - Currency symbol and name
  - Units held
  - Average purchase price
  - Current exchange rate
  - Current value
  - Unrealized P&L (color-coded: green for profit, red for loss)
  - Actions (sell, edit, delete)

- **Sorting and Filtering:**
  - Sort by currency, value, P&L, date
  - Filter by currency type, portfolio, date range
  - Search by currency symbol or name

## 5. Non-Functional Requirements

### 5.1 Performance
- **Response Time:** Currency operations complete within 2 seconds
- **Concurrent Users:** Support up to 100 concurrent users
- **Data Volume:** Handle up to 1,000 currency holdings per portfolio
- **Exchange Rate Updates:** Rate updates complete within 5 seconds

### 5.2 Reliability
- **Uptime:** 99.9% availability
- **Data Integrity:** All currency calculations must be accurate
- **Error Handling:** Graceful error handling with user-friendly messages
- **Exchange Rate Fallback:** Manual entry option if API fails

### 5.3 Security
- **Data Validation:** All input data validated on both client and server
- **Access Control:** Users can only access their own currency holdings
- **Audit Trail:** All currency operations logged for audit purposes
- **Exchange Rate Validation:** Exchange rates validated against reasonable ranges

### 5.4 Usability
- **User Interface:** Intuitive and consistent with existing system
- **Mobile Support:** Responsive design for mobile devices
- **Accessibility:** WCAG 2.1 AA compliance
- **Multi-language:** Support for Vietnamese and English

## 6. Technical Requirements

### 6.1 Database Schema
- **AssetType Enum Update:** Add new enum value:
  - `CURRENCY = 'CURRENCY'` to AssetType enum
  - Update AssetTypeLabels and AssetTypeDescriptions
  - Migration: ALTER TYPE asset_type_enum ADD VALUE 'CURRENCY'

- **Asset Entity:** NO changes needed - Currency uses existing Asset entity
  - Type = CURRENCY (new enum value)
  - Symbol = Currency code (USD, GBP, EUR, etc.)
  - Name = Currency name
  - Price = Exchange rate (updated via price update system)
  - Quantity = Currency units held

- **Trade Entity:** NO changes needed - Currency uses existing Trade entity
  - Asset type = CURRENCY
  - Price = Exchange rate
  - Quantity = Currency units

- **Asset Price History:** Exchange rates stored in existing AssetPrice/AssetPriceHistory
  - Price = Exchange rate
  - Source = Exchange rate source (VIETCOMBANK, CAFEF, etc.)
  - Same price history tracking as other assets

- **Portfolio Snapshot:** NO changes needed - Currency included through Asset system
- **Migration Scripts:** Only enum update migration needed

### 6.2 API Endpoints
- **Asset Endpoints (Existing - No Changes):**
  - `POST /api/v1/assets` - Create currency asset (type = CURRENCY)
  - `GET /api/v1/assets?type=CURRENCY` - Get currency assets
  - `GET /api/v1/assets/:assetId` - Get currency asset details
  - `PUT /api/v1/assets/:assetId` - Update currency asset
  - `DELETE /api/v1/assets/:assetId` - Delete currency asset

- **Trade Endpoints (Existing - No Changes):**
  - `POST /api/v1/portfolios/:portfolioId/trades` - Purchase/sell currency (same as other assets)
  - `GET /api/v1/portfolios/:portfolioId/trades?assetType=CURRENCY` - Get currency trades

- **Exchange Rate Endpoints (New):**
  - `GET /api/v1/market-data/exchange-rates` - Get current exchange rates (existing endpoint)
  - `GET /api/v1/market-data/exchange-rates/:currencyCode` - Get rate for specific currency
  - `POST /api/v1/assets/:assetId/prices/refresh` - Refresh currency price (exchange rate)

- **Analytics Endpoints (Existing - Filter by AssetType):**
  - `GET /api/v1/portfolios/:portfolioId/analytics?assetType=CURRENCY` - Currency analytics
  - `GET /api/v1/portfolios/:portfolioId/assets?type=CURRENCY` - Currency holdings

### 6.3 Frontend Components
- **AssetForm (Enhanced):** Support for CURRENCY asset type creation
- **TradeForm (Existing):** Use existing form for currency purchase/sale (no changes needed)
- **AssetList (Enhanced):** Filter by AssetType.CURRENCY to show currency holdings
- **AssetDetails (Existing):** Display currency asset details (same as other assets)
- **CurrencyManagement:** Main management component (wrapper around Asset/Trade components)
- **CurrencyAnalytics:** Analytics component (filtered asset analytics)
- **ExchangeRateDisplay:** Component for displaying current exchange rates

### 6.4 Backend Services
- **AssetService (Existing - No Changes):** Handles currency asset CRUD
- **TradeService (Existing - No Changes):** Handles currency trades
- **AssetPriceService (Enhanced):** Support exchange rate updates for CURRENCY assets
- **ExchangeRateAPIClient (Existing):** Fetches exchange rates from external APIs
- **ExternalMarketDataService (Enhanced):** Integrate exchange rates into price update system
- **Integration with Existing Services (No Changes):**
  - CashFlowService: Automatic cash flow creation (via Trade system)
  - PortfolioService: Portfolio value updates (via Asset system)
  - PriceUpdateService: Exchange rate updates (via AssetPrice system)

## 7. Acceptance Criteria

### 7.1 Functional Acceptance
- [ ] AssetType.CURRENCY is added to enum and available in system
- [ ] Users can create Currency assets (same as creating STOCK or BOND assets)
- [ ] Users can purchase currencies through Trade system (BUY trade)
- [ ] Currency quantity is calculated correctly based on exchange rate
- [ ] Currency assets are displayed with accurate current values (same as other assets)
- [ ] Users can sell currency through Trade system (SELL trade) with proper validation
- [ ] Realized and unrealized P&L are calculated correctly (via existing trade system)
- [ ] Currency values are integrated into portfolio total value (via Asset system)
- [ ] Currency data is included in portfolio snapshots (via Asset system)
- [ ] Exchange rates are updated automatically via price update system
- [ ] Currency assets can be filtered and viewed separately
- [ ] All existing asset management features work with CURRENCY type

### 7.2 Technical Acceptance
- [ ] AssetType enum updated with CURRENCY value
- [ ] All existing Asset/Trade APIs work with CURRENCY type
- [ ] Exchange rate API integration works reliably
- [ ] Price update system supports CURRENCY assets
- [ ] Frontend components support CURRENCY asset type
- [ ] Integration with existing systems works correctly (no breaking changes)
- [ ] Performance requirements are met (same as other assets)
- [ ] Error handling is comprehensive
- [ ] Database migration for enum update completed successfully

### 7.3 User Experience Acceptance
- [ ] UI is intuitive and consistent with existing system
- [ ] Error messages are clear and helpful
- [ ] Mobile experience is satisfactory
- [ ] Exchange rates are displayed clearly with source information
- [ ] Currency P&L is clearly visible and color-coded
- [ ] All user stories are satisfied

## 8. Dependencies

### 8.1 Internal Dependencies
- **Asset Module:** Add CURRENCY to AssetType enum (minimal change)
- **Trading System:** Use existing Trade entity (NO changes needed)
- **Cash Flow System:** Automatic via Trade system (NO changes needed)
- **Portfolio Snapshot System:** Automatic via Asset system (NO changes needed)
- **Market Data System:** Enhance ExchangeRateAPIClient integration with AssetPrice system
- **Price Update System:** Support CURRENCY assets in scheduled price updates
- **Asset Management System:** Support CURRENCY type in all asset operations

### 8.2 External Dependencies
- **Database:** PostgreSQL for data storage
- **Frontend Framework:** React.js for UI components
- **Backend Framework:** NestJS for API development
- **Exchange Rate APIs:** tygiausd.org, Vietcombank API for rate data
- **Price Update System:** Existing scheduled price update infrastructure

## 9. Risks and Mitigation

### 9.1 Technical Risks
- **Risk:** Exchange rate API reliability and availability
- **Mitigation:** Multiple API sources, caching, manual entry fallback (same as other price sources)

- **Risk:** AssetType enum migration complexity
- **Mitigation:** Careful PostgreSQL enum migration, test in development first

- **Risk:** Price update system needs to handle exchange rates differently
- **Mitigation:** Enhance price update service to support CURRENCY assets with ExchangeRateAPIClient

- **Risk:** Exchange rate data accuracy
- **Mitigation:** Data validation, source verification, user confirmation (same as other market data)

### 9.2 Business Risks
- **Risk:** User adoption of new feature
- **Mitigation:** Intuitive UI design and user training

- **Risk:** Data accuracy in currency calculations
- **Mitigation:** Comprehensive testing and validation

- **Risk:** Exchange rate volatility affecting user experience
- **Mitigation:** Clear display of rate sources and update times

## 10. Success Metrics

### 10.1 User Adoption
- **Target:** 60% of active users create at least one currency holding within 30 days
- **Measurement:** User activity tracking and analytics

### 10.2 System Performance
- **Target:** All currency operations complete within 2 seconds
- **Measurement:** Performance monitoring and logging

### 10.3 Data Accuracy
- **Target:** 100% accuracy in currency calculations
- **Measurement:** Automated testing and validation

### 10.4 Exchange Rate Updates
- **Target:** 99% success rate for automatic exchange rate updates
- **Measurement:** API call success rate monitoring

## 11. Future Enhancements

### 11.1 Phase 2 Features
- **Currency Conversion:** Convert between different currencies
- **Currency Alerts:** Notifications for significant exchange rate changes
- **Currency Forecasting:** Predict future exchange rates
- **Multi-currency Portfolios:** Support portfolios with multiple base currencies

### 11.2 Advanced Features
- **Currency Hedging:** Hedge currency exposure
- **Currency Options:** Support for currency derivatives
- **Currency Arbitrage:** Identify arbitrage opportunities
- **Currency Correlation Analysis:** Analyze correlations between currencies
- **Currency Risk Management:** Risk metrics for currency exposure

### 11.3 Integration Enhancements
- **Bank Integration:** Direct integration with bank APIs for currency transactions
- **Real-time Trading:** Real-time currency trading capabilities
- **Currency Lending:** Support for currency lending/borrowing
- **International Transfers:** Integration with international money transfer services

---

**Document Version:** 1.0  
**Created Date:** November 27, 2025  
**Author:** AI Assistant  
**Status:** Draft  
**Next Review:** After Technical Design Document completion

