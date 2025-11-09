# CR-007: Deposit Management System - Product Requirements Document

## 1. Executive Summary

### 1.1 Overview
This document outlines the requirements for implementing a comprehensive deposit management system within the existing Portfolio Management System. The deposit management feature will allow users to track and manage bank deposits as a special asset type, with automatic interest calculations and integration with portfolio analytics.

### 1.2 Business Objectives
- Enable users to track bank deposits as a special asset type in their portfolio
- Provide simple interest calculation (lãi đơn) for deposit management
- Integrate deposit values into portfolio total value calculations
- Support early deposit settlement with manual interest input
- Maintain deposit data in portfolio snapshots for historical analysis

### 1.3 Success Criteria
- Users can create, view, edit, and settle deposits through intuitive UI
- Deposit values are accurately calculated and integrated into portfolio analytics
- Deposit data is properly tracked in portfolio snapshots
- System maintains data consistency between deposits and portfolio calculations

## 2. Product Context

### 2.1 Current System State
The Portfolio Management System is 100% complete with:
- ✅ Complete portfolio management with real-time calculations
- ✅ Trading system with FIFO/LIFO algorithms
- ✅ Asset management with computed fields
- ✅ Cash flow management system
- ✅ Portfolio analytics and reporting
- ✅ Frontend React.js dashboard

### 2.2 Integration Points
- **Portfolio Module**: Deposit values integrated into total portfolio value
- **Cash Flow System**: Automatic cash flow creation for deposit transactions
- **Portfolio Snapshots**: Deposit data included in historical snapshots
- **Asset Allocation**: Deposits shown as special asset type in allocation charts

## 3. User Stories

### 3.1 Primary User Stories

#### US-001: Create New Deposit
**As a** portfolio manager  
**I want to** create a new bank deposit  
**So that** I can track my fixed-term investments

**Acceptance Criteria:**
- User can select deposit term from dropdown (1 month, 3 months, 6 months, 1 year, 2 years, 3 years, 5 years)
- User can input start date and system automatically calculates end date
- User can input principal amount, interest rate, and bank information
- System validates all required fields
- Deposit is created and integrated into portfolio

#### US-002: View Deposit List
**As a** portfolio manager  
**I want to** view all my deposits  
**So that** I can monitor my deposit portfolio

**Acceptance Criteria:**
- User can see list of all deposits with key information
- List shows deposit status (active, settled)
- User can filter and sort deposits
- User can access deposit details

#### US-003: Edit Deposit Information
**As a** portfolio manager  
**I want to** edit deposit information before settlement  
**So that** I can correct any mistakes or update details

**Acceptance Criteria:**
- User can edit deposit details before settlement
- System prevents editing after settlement
- Changes are reflected in portfolio calculations

#### US-004: Settle Deposit
**As a** portfolio manager  
**I want to** settle a deposit when it matures or early  
**So that** I can complete the investment cycle

**Acceptance Criteria:**
- User can settle deposit at maturity or early
- User can input actual interest received for early settlement
- System creates appropriate cash flow entries
- Deposit status changes to settled

#### US-005: View Deposit in Portfolio Analytics
**As a** portfolio manager  
**I want to** see deposits in my portfolio analytics  
**So that** I can understand my complete investment allocation

**Acceptance Criteria:**
- Deposits appear as special asset type in allocation charts
- Deposit values included in total portfolio value
- Deposit interest included in realized/unrealized P&L calculations

### 3.2 Secondary User Stories

#### US-006: Deposit Management Tab
**As a** portfolio manager  
**I want to** access deposit management from portfolio detail page  
**So that** I can manage deposits within portfolio context

**Acceptance Criteria:**
- Deposit tab added to portfolio detail page
- Tab shows deposit-specific analytics and management tools
- Consistent UI with other portfolio tabs

#### US-007: Global Deposit Management
**As a** portfolio manager  
**I want to** manage all deposits across portfolios  
**So that** I can have a centralized view

**Acceptance Criteria:**
- Menu item for "Deposit Management" in main navigation
- Global view of all deposits across all portfolios
- Filtering and search capabilities

## 4. Functional Requirements

### 4.1 Core Features

#### 4.1.1 Deposit Creation
- **Deposit Form Fields:**
  - Bank Name (text input)
  - Account Number (text input)
  - Principal Amount (currency input, default VND)
  - Interest Rate (percentage input)
  - Term Selection (dropdown: 1M, 3M, 6M, 1Y, 2Y, 3Y, 5Y)
  - Start Date (date picker)
  - End Date (auto-calculated, editable)
  - Notes (optional text area)

- **Validation Rules:**
  - All fields except notes are required
  - Principal amount must be positive
  - Interest rate must be between 0-100%
  - End date must be after start date
  - No validation for maximum term length

#### 4.1.2 Interest Calculation
- **Calculation Method:** Simple Interest (lãi đơn)
- **Formula:** Interest = Principal × Interest Rate × (Days / 365)
- **Real-time Calculation:** Interest calculated based on current date
- **Settlement Calculation:** User can input actual interest received

#### 4.1.3 Deposit Management
- **CRUD Operations:**
  - Create new deposit
  - Read deposit details
  - Update deposit (before settlement only)
  - Delete deposit (before settlement only)

- **Status Management:**
  - Active: Deposit is ongoing
  - Settled: Deposit has been completed

#### 4.1.4 Settlement Process
- **Maturity Settlement:**
  - Automatic interest calculation based on term
  - Cash flow entry for principal + interest

- **Early Settlement:**
  - User inputs actual interest received
  - User can add settlement notes
  - Cash flow entry for principal + actual interest

### 4.2 Integration Features

#### 4.2.1 Portfolio Integration
- **Total Value Calculation:**
  - Total Value = Investment Value + Deposit Value + Cash Balance
  - Deposit Value = Principal + Accrued Interest

- **Asset Allocation:**
  - Deposits shown as special asset type
  - Percentage calculation based on total portfolio value

#### 4.2.2 Cash Flow Integration
- **Deposit Creation:** Negative cash flow (money out)
- **Deposit Settlement:** Positive cash flow (money + interest in)
- **Automatic Integration:** No manual cash flow entry required

#### 4.2.3 Portfolio Snapshot Integration
- **New Fields in PortfolioSnapshot:**
  - `totalDepositPrincipal`: Total principal of active deposits
  - `totalDepositInterest`: Total accrued interest of active deposits
  - `totalDepositValue`: Total value (principal + interest)
  - `totalDepositCount`: Number of active deposits

#### 4.2.4 P&L Integration
- **Unrealized P&L:** Accrued interest from active deposits
- **Realized P&L:** Interest received from settled deposits
- **Automatic Calculation:** Integrated into existing P&L calculations

### 4.3 UI/UX Features

#### 4.3.1 Portfolio Detail Page
- **New Tab:** "Deposits" tab added to portfolio detail page
- **Tab Content:**
  - Deposit list with key information
  - Create new deposit button
  - Deposit analytics and summary

#### 4.3.2 Global Deposit Management
- **Navigation Menu:** "Deposit Management" menu item
- **Global View:** All deposits across all portfolios
- **Management Tools:**
  - Create, edit, delete deposits
  - Filter by portfolio, status, bank
  - Search functionality

#### 4.3.3 Deposit Form
- **Responsive Design:** Works on desktop and mobile
- **Validation Feedback:** Real-time validation with clear error messages
- **Auto-calculation:** End date automatically calculated from term selection
- **Currency Formatting:** Proper VND formatting for amounts

## 5. Non-Functional Requirements

### 5.1 Performance
- **Response Time:** Deposit operations complete within 2 seconds
- **Concurrent Users:** Support up to 100 concurrent users
- **Data Volume:** Handle up to 10,000 deposits per portfolio

### 5.2 Reliability
- **Uptime:** 99.9% availability
- **Data Integrity:** All deposit calculations must be accurate
- **Error Handling:** Graceful error handling with user-friendly messages

### 5.3 Security
- **Data Validation:** All input data validated on both client and server
- **Access Control:** Users can only access their own deposits
- **Audit Trail:** All deposit operations logged for audit purposes

### 5.4 Usability
- **User Interface:** Intuitive and consistent with existing system
- **Mobile Support:** Responsive design for mobile devices
- **Accessibility:** WCAG 2.1 AA compliance

## 6. Technical Requirements

### 6.1 Database Schema
- **Deposit Entity:** New entity with all required fields
- **Portfolio Snapshot Updates:** Add 4 new fields for deposit tracking
- **Migration Scripts:** Database migration for new tables and fields

### 6.2 API Endpoints
- **CRUD Operations:** Full REST API for deposit management
- **Integration Endpoints:** Endpoints for portfolio and cash flow integration
- **Analytics Endpoints:** Endpoints for deposit analytics and reporting

### 6.3 Frontend Components
- **DepositForm:** Form component for creating/editing deposits
- **DepositList:** List component for displaying deposits
- **DepositManagement:** Main management component
- **DepositAnalytics:** Analytics and reporting component

## 7. Acceptance Criteria

### 7.1 Functional Acceptance
- [ ] Users can create deposits with all required fields
- [ ] Interest is calculated correctly using simple interest formula
- [ ] Deposits are integrated into portfolio total value
- [ ] Deposit data is included in portfolio snapshots
- [ ] Users can settle deposits with actual interest input
- [ ] Deposit management tab is accessible from portfolio detail page
- [ ] Global deposit management menu is available

### 7.2 Technical Acceptance
- [ ] All API endpoints return correct data
- [ ] Database schema supports all required fields
- [ ] Frontend components are responsive and accessible
- [ ] Integration with existing systems works correctly
- [ ] Performance requirements are met

### 7.3 User Experience Acceptance
- [ ] UI is intuitive and consistent with existing system
- [ ] Error messages are clear and helpful
- [ ] Mobile experience is satisfactory
- [ ] All user stories are satisfied

## 8. Dependencies

### 8.1 Internal Dependencies
- **Portfolio Module:** For integration with portfolio calculations
- **Cash Flow System:** For automatic cash flow creation
- **Portfolio Snapshot System:** For historical data tracking
- **Asset Management System:** For asset type integration

### 8.2 External Dependencies
- **Database:** PostgreSQL for data storage
- **Frontend Framework:** React.js for UI components
- **Backend Framework:** NestJS for API development

## 9. Risks and Mitigation

### 9.1 Technical Risks
- **Risk:** Integration complexity with existing systems
- **Mitigation:** Thorough testing and incremental implementation

- **Risk:** Performance impact on portfolio calculations
- **Mitigation:** Efficient database queries and caching

### 9.2 Business Risks
- **Risk:** User adoption of new feature
- **Mitigation:** Intuitive UI design and user training

- **Risk:** Data accuracy in interest calculations
- **Mitigation:** Comprehensive testing and validation

## 10. Success Metrics

### 10.1 User Adoption
- **Target:** 80% of active users create at least one deposit within 30 days
- **Measurement:** User activity tracking and analytics

### 10.2 System Performance
- **Target:** All deposit operations complete within 2 seconds
- **Measurement:** Performance monitoring and logging

### 10.3 Data Accuracy
- **Target:** 100% accuracy in interest calculations
- **Measurement:** Automated testing and validation

## 11. Future Enhancements

### 11.1 Phase 2 Features
- **Compound Interest:** Support for compound interest calculations
- **Deposit Renewal:** Automatic renewal options
- **Interest Rate History:** Historical interest rate tracking
- **Deposit Alerts:** Notifications for maturity dates

### 11.2 Advanced Features
- **Deposit Comparison:** Compare different deposit options
- **Interest Rate Forecasting:** Predict future interest rates
- **Deposit Optimization:** Suggest optimal deposit strategies
- **Multi-currency Support:** Support for different currencies

---

**Document Version:** 1.0  
**Created Date:** December 21, 2024  
**Author:** AI Assistant  
**Status:** Draft  
**Next Review:** After Technical Design Document completion
