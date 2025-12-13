# CR-010: Personal Financial Analysis System - Product Requirements Document

## Document Information
- **Document ID**: CR-010
- **Project Name**: Personal Financial Analysis System
- **Version**: 1.0
- **Date**: December 2024
- **Author**: System Architect
- **Status**: Draft - Pending Approval
- **Related Files**: 
  - `cr_010_tdd_personal_financial_analysis.md` (To be created)
  - `cr_010_task_personal_financial_analysis.md` (To be created)

## 1. Overview

### 1.1 Purpose
This document outlines the requirements for implementing a comprehensive Personal Financial Analysis System within the existing Portfolio Management System. The system enables users to conduct a complete financial health assessment through a 4-step workflow: cash flow survey, financial analysis, asset restructuring, and financial planning.

The system helps users understand their current financial situation, identify areas for improvement, restructure their assets and cash flow, and create actionable financial plans to achieve their goals.

### 1.2 Target Users
- **Primary Users**: Individual investors who want to analyze and improve their personal financial situation
- **Secondary Users**: Financial advisors who need to analyze client financial situations
- **Access Control**: All authenticated users can use this feature; each user can only view their own analysis data

### 1.3 Business Value
- **For Users**: 
  - Comprehensive understanding of current financial health
  - Clear visualization of income, expenses, assets, and debts
  - Actionable insights for financial improvement
  - Integration with Financial Freedom Planning for goal achievement
- **For Business**:
  - Increased user engagement through comprehensive financial tools
  - Differentiation from competitors with advanced analysis capabilities
  - Foundation for future financial advisory services

## 2. Goals & Non-Goals

### 2.1 Goals
- [G-1] Enable users to input and manage their personal financial data (assets, income, expenses, debts) with flexible categorization
- [G-2] Provide comprehensive financial analysis with key metrics and visualizations
- [G-3] Support multiple restructuring scenarios for "what-if" analysis
- [G-4] Integrate with Financial Freedom Planning System for seamless goal setting
- [G-5] Store analysis data in database for historical tracking and comparison
- [G-6] Provide export capabilities for reports (PDF/Excel) - Future enhancement
- [G-7] Implement validation rules and business logic for financial health warnings

### 2.2 Non-Goals
- **Not in Scope**: 
  - Real-time bank account integration (manual input only)
  - Automatic categorization of transactions (user must categorize manually)
  - Multi-currency support beyond baseCurrency from AccountContext
  - Sharing analysis with other users (each user sees only their own data)
  - Historical trend analysis (only current snapshot in Phase 1)
  - Mobile app version (web-only in Phase 1)

## 3. Functional Requirements

### 3.1 Page 1: Cash Flow Survey (Khảo sát dòng tiền)

#### FR-1.1: Asset Management
- [FR-1.1.1] Users can add custom assets with name, value, and category
- [FR-1.1.2] Each asset entry includes: name (text), value (number), category (dropdown: Tài sản tiêu dùng, Tài sản kinh doanh, Tài sản tài chính)
- [FR-1.1.3] Users can add unlimited asset entries (both custom and from Portfolio)
- [FR-1.1.4] Users can edit and delete existing asset entries (both custom and from Portfolio)
- [FR-1.1.5] Asset values are stored in baseCurrency from AccountContext
- [FR-1.1.6] Assets can be loaded from linked Portfolios (see FR-1.5) or added manually
- [FR-1.1.7] Portfolio-loaded assets can be edited but maintain link to source Portfolio

#### FR-1.2: Income Management
- [FR-1.2.1] Users can add custom income sources with name, monthly value, and category
- [FR-1.2.2] Each income entry includes: name (text), monthly value (number), category (dropdown: Thu nhập gia đình, Thu nhập kinh doanh, Thu nhập khác)
- [FR-1.2.3] Users can add unlimited income entries
- [FR-1.2.4] Users can edit and delete existing income entries
- [FR-1.2.5] System calculates annual income automatically (monthly × 12)

#### FR-1.3: Expense Management
- [FR-1.3.1] Users can add custom expenses with name, monthly value, and category
- [FR-1.3.2] Each expense entry includes: name (text), monthly value (number), category (dropdown: Chi phí sinh hoạt, Giáo dục, Bảo hiểm, Chi tiêu khác)
- [FR-1.3.3] Users can add unlimited expense entries
- [FR-1.3.4] Users can edit and delete existing expense entries
- [FR-1.3.5] System calculates annual expenses automatically (monthly × 12)

#### FR-1.4: Debt Management
- [FR-1.4.1] Users can add debt entries with comprehensive information
- [FR-1.4.2] Each debt entry includes:
  - Name (text)
  - Principal amount (number) - Số tiền vay
  - Interest rate (number, percentage) - Lãi suất
  - Term (number, months) - Thời hạn
  - Monthly payment (number) - Số tiền trả hàng tháng
  - Remaining balance (number, optional) - Số tiền còn lại
- [FR-1.4.3] Users can add unlimited debt entries
- [FR-1.4.4] Users can edit and delete existing debt entries
- [FR-1.4.5] System calculates annual debt payments automatically (monthly × 12)
- [FR-1.4.6] System calculates annual interest payments from debt entries

#### FR-1.5: Portfolio Linking and Asset Loading
- [FR-1.5.1] Users can link one or more Portfolios to the analysis
- [FR-1.5.2] Portfolio selection shows only portfolios accessible to the user (VIEW permission or higher)
- [FR-1.5.3] When a Portfolio is linked, system automatically loads all assets from that Portfolio
- [FR-1.5.4] Loaded assets include:
  - Asset name (from Portfolio asset)
  - Asset value (current market value from Portfolio)
  - Asset type (STOCK, BOND, GOLD, CRYPTO, etc. from Portfolio)
  - Asset symbol (from Portfolio asset)
- [FR-1.5.5] System automatically maps Portfolio asset types to analysis categories:
  - STOCK, BOND, GOLD, CRYPTO, COMMODITY, CURRENCY, DEPOSITS → Tài sản tài chính (Financial Assets)
  - REALESTATE → Tài sản tiêu dùng (Consumer Assets) or Tài sản kinh doanh (Business Assets) - user can choose
  - OTHER → User must select category manually
- [FR-1.5.6] Users can modify loaded assets:
  - Edit asset name
  - Edit asset value (overrides Portfolio value)
  - Change asset category
  - Delete asset (removes from analysis, does not affect Portfolio)
- [FR-1.5.7] Users can add custom assets in addition to Portfolio assets
- [FR-1.5.8] Portfolio assets are visually distinguished from custom assets (e.g., icon or badge)
- [FR-1.5.9] Users can unlink Portfolio (removes all assets from that Portfolio, but keeps custom assets)
- [FR-1.5.10] When Portfolio is unlinked and re-linked, system re-loads assets (may create duplicates if user added them manually)
- [FR-1.5.11] System shows Portfolio name for each loaded asset (for tracking)
- [FR-1.5.12] Asset values from Portfolio are converted to baseCurrency if Portfolio uses different currency
- [FR-1.5.13] Portfolio linking is optional - users can create analysis without linking any Portfolio

### 3.2 Page 2: Financial Analysis (Phân tích thông tin)

#### FR-2.1: Summary Metrics Section
- [FR-2.1.1] Display calculated summary metrics from Page 1 data:
  - Total Family Income (Thu nhập gia đình)
  - Total Business Income (Thu nhập kinh doanh)
  - Total Living Expenses (Chi phí sinh hoạt)
  - Total Education Expenses (Giáo dục)
  - Total Insurance Expenses (Bảo hiểm)
  - Total Other Expenses (Chi tiêu khác)
  - Total Consumer Assets (Tài sản tiêu dùng)
  - Total Business Assets (Tài sản kinh doanh)
  - Total Financial Assets (Tài sản tài chính)
  - Total Assets (Tổng tài sản)
  - Emergency Fund (Dự phòng khẩn cấp)
  - Total Debt (Nợ)
  - Debt-to-Asset Ratio (Nợ/tài sản)
  - Net Worth (Tài sản thuần)
- [FR-2.1.2] All metrics are calculated automatically from Page 1 data
- [FR-2.1.3] Metrics are displayed in a clear, organized card layout
- [FR-2.1.4] Currency formatting uses baseCurrency from AccountContext

#### FR-2.2: Income and Expense Table
- [FR-2.2.1] Display income and expense breakdown in table format
- [FR-2.2.2] Table shows monthly and annual values:
  - Principal payment (Gốc vay)
  - Interest payment (Lãi vay)
  - Total debt payment (Gốc + Lãi)
  - Debt payment to income ratio (Chi phí vay/thu nhập)
  - Total income (Tổng thu nhập)
  - Total expenses (Chi tiêu)
  - Expense to income ratio (Chi tiêu/thu nhập)
  - Remaining savings (Tích luỹ còn lại)
  - Savings to income ratio (Tích luỹ/thu nhập)
- [FR-2.2.3] All values calculated from Page 1 data
- [FR-2.2.4] Percentages calculated and displayed with 1 decimal place

#### FR-2.3: Balance Sheet Visualization
- [FR-2.3.1] Display balance sheet chart showing:
  - Total income
  - Expenses and savings
  - Net assets and liabilities
  - Consumer assets vs investment assets
  - Emergency fund (current amount and recommended amount)
- [FR-2.3.2] Chart is interactive with hover tooltips
- [FR-2.3.3] Chart uses appropriate visualization (bar chart, waterfall chart, or similar)
- [FR-2.3.4] Emergency fund recommendation: 6 months of total expenses (configurable)

#### FR-2.4: Asset Pyramid Chart
- [FR-2.4.1] Display asset pyramid visualization with 4 layers:
  - Risk layer (Lớp rủi ro)
  - Growth layer (Lớp tăng trưởng)
  - Income generation layer (Lớp tạo thu nhập)
  - Protection layer (Lớp bảo vệ)
- [FR-2.4.2] Each layer shows percentage and value
- [FR-2.4.3] Chart is interactive with hover tooltips showing detailed information
- [FR-2.4.4] Chart uses pyramid/stacked visualization

#### FR-2.5: Asset Structure Chart
- [FR-2.5.1] Display asset structure pie/donut chart showing:
  - Consumer assets (Tài sản tiêu dùng)
  - Financial assets (Tài sản tài chính)
  - Business assets (Tài sản kinh doanh)
- [FR-2.5.2] Chart shows percentage and absolute values
- [FR-2.5.3] Chart is interactive with hover tooltips
- [FR-2.5.4] Chart uses color coding for different asset types

### 3.3 Page 3: Asset Restructuring (Tái cấu trúc tài sản)

#### FR-3.1: Scenario Management
- [FR-3.1.1] Users can create multiple restructuring scenarios
- [FR-3.1.2] Each scenario has a name and description
- [FR-3.1.3] Users can save, edit, and delete scenarios
- [FR-3.1.4] Users can duplicate existing scenarios
- [FR-3.1.5] System maintains a default "Current" scenario based on Page 1 data

#### FR-3.2: Data Modification
- [FR-3.2.1] Users can modify all data from Page 1 within a scenario:
  - Assets (add, edit, delete, modify values)
  - Income (add, edit, delete, modify values)
  - Expenses (add, edit, delete, modify values)
  - Debts (add, edit, delete, modify values)
- [FR-3.2.2] Changes are isolated to the selected scenario
- [FR-3.2.3] Original Page 1 data remains unchanged

#### FR-3.3: Before/After Comparison
- [FR-3.3.1] Display side-by-side comparison of "Current" vs selected scenario
- [FR-3.3.2] Comparison shows:
  - All summary metrics (from FR-2.1)
  - Income and expense breakdown
  - Asset structure changes
  - Debt reduction/increase
  - Improvement indicators (arrows, color coding)
- [FR-3.3.3] Comparison is visual and easy to understand
- [FR-3.3.4] Users can switch between scenarios to compare

#### FR-3.4: System Suggestions (Optional)
- [FR-3.4.1] System can provide optional suggestions for restructuring:
  - Debt consolidation recommendations
  - Emergency fund recommendations
  - Asset allocation suggestions
  - Expense reduction opportunities
- [FR-3.4.2] Suggestions are based on best practices and financial rules
- [FR-3.4.3] Users can accept, modify, or ignore suggestions
- [FR-3.4.4] Suggestions are clearly marked as recommendations, not requirements

### 3.4 Page 4: Financial Planning (Kế hoạch tài chính)

#### FR-4.1: Financial Freedom Plan Integration
- [FR-4.1.1] Users can create a new Financial Freedom Plan from current analysis
- [FR-4.1.2] Users can link to an existing Financial Freedom Plan
- [FR-4.1.3] When creating new plan, pre-fill data from analysis:
  - Initial investment from total financial assets
  - Monthly contribution from remaining savings
  - Target amount based on current expenses and desired lifestyle
- [FR-4.1.4] Integration opens Financial Freedom Planning Wizard (existing component)
- [FR-4.1.5] Users can return to analysis after creating/linking plan

#### FR-4.2: Plan Selection and Management
- [FR-4.2.1] Display list of available Financial Freedom Plans
- [FR-4.2.2] Users can select plan to link
- [FR-4.2.3] Users can unlink plan from analysis
- [FR-4.2.4] System shows linked plan status and progress

### 3.5 Data Persistence

#### FR-5.1: Database Storage
- [FR-5.1.1] All analysis data is stored in database
- [FR-5.1.2] Each user can have multiple analysis records (historical tracking)
- [FR-5.1.3] Analysis records include:
  - Analysis date
  - Step 1 data (assets, income, expenses, debts)
  - Linked Portfolio IDs (for asset loading)
  - Asset source tracking (Portfolio vs custom)
  - Step 2 calculated metrics
  - Step 3 scenarios
  - Step 4 linked plan ID
- [FR-5.1.4] Users can save analysis as draft or final
- [FR-5.1.5] Users can load previous analysis records
- [FR-5.1.6] Portfolio links are stored with analysis (for re-loading assets)

#### FR-5.2: Data Access Control
- [FR-5.2.1] Each analysis record is associated with accountId
- [FR-5.2.2] Users can only view their own analysis records
- [FR-5.2.3] No sharing or multi-user access in Phase 1

### 3.6 Navigation and Workflow

#### FR-6.1: Wizard Navigation
- [FR-6.1.1] 4-step wizard with Material-UI Stepper component
- [FR-6.1.2] Users can navigate forward/backward between steps
- [FR-6.1.3] Step validation before allowing next step
- [FR-6.1.4] Progress saved automatically on each step
- [FR-6.1.5] Users can exit and resume later

#### FR-6.2: Menu Integration
- [FR-6.2.1] New menu item "Personal Financial Analysis" in navigation
- [FR-6.2.2] Menu item accessible to all authenticated users
- [FR-6.2.3] Menu item placed in appropriate section (suggest: "Investor" section)

## 4. Non-Functional Requirements

### 4.1 Performance
- [NFR-1] Page load time < 2 seconds for analysis with 100+ entries
- [NFR-2] Chart rendering time < 1 second
- [NFR-3] Database queries optimized with proper indexes
- [NFR-4] Frontend calculations performed client-side for responsiveness

### 4.2 Security
- [NFR-5] All API endpoints require authentication
- [NFR-6] Data access restricted by accountId (users see only their data)
- [NFR-7] Input validation on both frontend and backend
- [NFR-8] SQL injection prevention through parameterized queries
- [NFR-9] XSS prevention through proper data sanitization

### 4.3 Scalability
- [NFR-10] System supports 1000+ analysis records per user
- [NFR-11] Database schema designed for efficient querying
- [NFR-12] Frontend pagination for large data sets
- [NFR-13] Lazy loading for charts and visualizations

### 4.4 Usability
- [NFR-14] Responsive design for mobile, tablet, and desktop
- [NFR-15] Multi-language support (Vietnamese and English)
- [NFR-16] Consistent UI/UX with existing system
- [NFR-17] Clear error messages and validation feedback
- [NFR-18] Tooltips and help text for complex metrics

### 4.5 Reliability
- [NFR-19] Data auto-save on each step to prevent data loss
- [NFR-20] Error handling with user-friendly messages
- [NFR-21] Graceful degradation if charts fail to load
- [NFR-22] Offline capability for viewing saved analysis (future)

## 5. Constraints & Assumptions

### 5.1 Constraints
- **Technology Stack**: Must use existing React.js + NestJS + PostgreSQL stack
- **Currency**: Single currency per analysis (baseCurrency from AccountContext)
- **Data Input**: Manual entry only (no bank integration)
- **Browser Support**: Modern browsers only (Chrome, Firefox, Safari, Edge)
- **Database**: PostgreSQL with JSONB support for flexible data storage

### 5.2 Assumptions
- Users have basic understanding of financial concepts
- Users will input accurate financial data
- Users have stable internet connection
- baseCurrency is set correctly in AccountContext
- Financial Freedom Planning System (CR-009) is available for integration

## 6. Success Metrics

### 6.1 User Adoption
- [SM-1] 50% of active users create at least one analysis within 3 months
- [SM-2] Average of 2 scenarios created per analysis
- [SM-3] 30% of analyses result in linked Financial Freedom Plans

### 6.2 System Performance
- [SM-4] 95% of page loads complete in < 2 seconds
- [SM-5] Chart rendering success rate > 99%
- [SM-6] Data save success rate > 99.9%

### 6.3 Data Quality
- [SM-7] Average of 10+ entries per analysis (assets + income + expenses + debts)
- [SM-8] 80% of analyses include at least one debt entry
- [SM-9] 90% of analyses complete all 4 steps

## 7. User Stories

### Epic 1: Cash Flow Survey

#### Story 1.1: Input Personal Assets
**As a** user  
**I want to** input my personal assets with name, value, and category  
**So that** the system can analyze my total asset value and structure

**Acceptance Criteria:**
- [AC-1.1.1] I can add a new asset entry with name, value, and category
- [AC-1.1.2] I can edit existing asset entries
- [AC-1.1.3] I can delete asset entries
- [AC-1.1.4] Asset values are validated (positive numbers only)
- [AC-1.1.5] Category dropdown includes: Tài sản tiêu dùng, Tài sản kinh doanh, Tài sản tài chính
- [AC-1.1.6] I can add unlimited asset entries
- [AC-1.1.7] Total assets are calculated and displayed in real-time

#### Story 1.5: Link Portfolio to Load Assets
**As a** user  
**I want to** link my Portfolio to automatically load assets  
**So that** I don't have to manually enter all my investment assets

**Acceptance Criteria:**
- [AC-1.5.1] I can see a "Link Portfolio" button/section in Page 1
- [AC-1.5.2] I can select from my accessible Portfolios (VIEW permission or higher)
- [AC-1.5.3] When I link a Portfolio, all assets from that Portfolio are automatically loaded
- [AC-1.5.4] Loaded assets show Portfolio name and are visually distinguished
- [AC-1.5.5] Asset types from Portfolio are automatically mapped to correct categories (STOCK/BOND → Financial, etc.)
- [AC-1.5.6] I can still add custom assets in addition to Portfolio assets
- [AC-1.5.7] I can edit Portfolio-loaded assets (name, value, category)
- [AC-1.5.8] I can delete Portfolio-loaded assets (removes from analysis only, not from Portfolio)
- [AC-1.5.9] I can unlink Portfolio (removes all assets from that Portfolio)
- [AC-1.5.10] I can link multiple Portfolios
- [AC-1.5.11] Asset values are converted to baseCurrency if Portfolio uses different currency

#### Story 1.2: Input Monthly Income
**As a** user  
**I want to** input my monthly income sources with name, amount, and category  
**So that** the system can calculate my total income and income structure

**Acceptance Criteria:**
- [AC-1.2.1] I can add income entries with name, monthly value, and category
- [AC-1.2.2] Category dropdown includes: Thu nhập gia đình, Thu nhập kinh doanh, Thu nhập khác
- [AC-1.2.3] System calculates annual income automatically
- [AC-1.2.4] I can add unlimited income entries
- [AC-1.2.5] Total income is calculated and displayed in real-time

#### Story 1.3: Input Monthly Expenses
**As a** user  
**I want to** input my monthly expenses with name, amount, and category  
**So that** the system can analyze my spending patterns

**Acceptance Criteria:**
- [AC-1.3.1] I can add expense entries with name, monthly value, and category
- [AC-1.3.2] Category dropdown includes: Chi phí sinh hoạt, Giáo dục, Bảo hiểm, Chi tiêu khác
- [AC-1.3.3] System calculates annual expenses automatically
- [AC-1.3.4] I can add unlimited expense entries
- [AC-1.3.5] Total expenses are calculated and displayed in real-time

#### Story 1.4: Input Debt Information
**As a** user  
**I want to** input my debt information with all required details  
**So that** the system can calculate my debt burden and payment schedule

**Acceptance Criteria:**
- [AC-1.4.1] I can add debt entries with: name, principal, interest rate, term, monthly payment, remaining balance
- [AC-1.4.2] Interest rate is input as percentage (e.g., 12% = 12)
- [AC-1.4.3] Term is input in months
- [AC-1.4.4] System calculates annual principal and interest payments
- [AC-1.4.5] I can add unlimited debt entries
- [AC-1.4.6] Total debt payments are calculated and displayed in real-time

### Epic 2: Financial Analysis

#### Story 2.1: View Summary Metrics
**As a** user  
**I want to** see comprehensive summary metrics calculated from my financial data  
**So that** I can understand my overall financial health

**Acceptance Criteria:**
- [AC-2.1.1] All summary metrics are displayed in organized card layout
- [AC-2.1.2] Metrics are calculated automatically from Page 1 data
- [AC-2.1.3] Currency formatting uses baseCurrency
- [AC-2.1.4] Metrics update automatically when Page 1 data changes
- [AC-2.1.5] Key metrics are highlighted (Net Worth, Debt-to-Asset Ratio)

#### Story 2.2: View Income and Expense Analysis
**As a** user  
**I want to** see detailed income and expense breakdown  
**So that** I can understand my cash flow situation

**Acceptance Criteria:**
- [AC-2.2.1] Table displays monthly and annual values
- [AC-2.2.2] All ratios are calculated and displayed (debt/income, expense/income, savings/income)
- [AC-2.2.3] Percentages are formatted with 1 decimal place
- [AC-2.2.4] Table is responsive and scrollable on mobile

#### Story 2.3: View Balance Sheet Chart
**As a** user  
**I want to** see a visual balance sheet representation  
**So that** I can quickly understand my financial position

**Acceptance Criteria:**
- [AC-2.3.1] Chart displays all balance sheet components
- [AC-2.3.2] Emergency fund shows current vs recommended amount
- [AC-2.3.3] Chart is interactive with hover tooltips
- [AC-2.3.4] Chart is responsive and works on mobile

#### Story 2.4: View Asset Pyramid
**As a** user  
**I want to** see my asset allocation in pyramid format  
**So that** I can understand my risk distribution

**Acceptance Criteria:**
- [AC-2.4.1] Pyramid shows 4 layers with percentages and values
- [AC-2.4.2] Hover tooltips show detailed information
- [AC-2.4.3] Pyramid is visually clear and easy to understand
- [AC-2.4.4] Chart is responsive

#### Story 2.5: View Asset Structure
**As a** user  
**I want to** see my asset structure breakdown  
**So that** I can understand asset type distribution

**Acceptance Criteria:**
- [AC-2.5.1] Pie/donut chart shows 3 asset types
- [AC-2.5.2] Chart shows percentages and absolute values
- [AC-2.5.3] Hover tooltips show detailed information
- [AC-2.5.4] Chart uses color coding for different types

### Epic 3: Asset Restructuring

#### Story 3.1: Create Restructuring Scenarios
**As a** user  
**I want to** create multiple "what-if" scenarios  
**So that** I can explore different financial restructuring options

**Acceptance Criteria:**
- [AC-3.1.1] I can create a new scenario with name and description
- [AC-3.1.2] I can save multiple scenarios
- [AC-3.1.3] I can edit and delete scenarios
- [AC-3.1.4] I can duplicate existing scenarios
- [AC-3.1.5] Default "Current" scenario is always available

#### Story 3.2: Modify Financial Data in Scenario
**As a** user  
**I want to** modify my financial data within a scenario  
**So that** I can see how changes affect my financial health

**Acceptance Criteria:**
- [AC-3.2.1] I can modify all data types (assets, income, expenses, debts) in a scenario
- [AC-3.2.2] Changes are isolated to the selected scenario
- [AC-3.2.3] Original Page 1 data remains unchanged
- [AC-3.2.4] I can add, edit, and delete entries within a scenario

#### Story 3.3: Compare Scenarios
**As a** user  
**I want to** compare "Current" vs selected scenario  
**So that** I can see the impact of proposed changes

**Acceptance Criteria:**
- [AC-3.3.1] Side-by-side comparison is displayed
- [AC-3.3.2] All key metrics are compared
- [AC-3.3.3] Visual indicators show improvements (arrows, colors)
- [AC-3.3.4] I can switch between scenarios easily

#### Story 3.4: Receive System Suggestions (Optional)
**As a** user  
**I want to** receive optional suggestions for financial improvement  
**So that** I can learn best practices and optimize my finances

**Acceptance Criteria:**
- [AC-3.4.1] Suggestions are clearly marked as optional recommendations
- [AC-3.4.2] Suggestions are based on financial best practices
- [AC-3.4.3] I can accept, modify, or ignore suggestions
- [AC-3.4.4] Suggestions don't override my data automatically

### Epic 4: Financial Planning Integration

#### Story 4.1: Create Financial Freedom Plan
**As a** user  
**I want to** create a Financial Freedom Plan from my analysis  
**So that** I can set concrete goals based on my current situation

**Acceptance Criteria:**
- [AC-4.1.1] I can click "Create Plan" button from Page 4
- [AC-4.1.2] Financial Freedom Planning Wizard opens with pre-filled data
- [AC-4.1.3] Pre-filled data includes: initial investment, monthly contribution, target amount
- [AC-4.1.4] I can modify pre-filled data in the wizard
- [AC-4.1.5] Created plan is automatically linked to my analysis

#### Story 4.2: Link Existing Plan
**As a** user  
**I want to** link an existing Financial Freedom Plan to my analysis  
**So that** I can track progress from my analysis context

**Acceptance Criteria:**
- [AC-4.2.1] I can see list of my existing Financial Freedom Plans
- [AC-4.2.2] I can select a plan to link
- [AC-4.2.3] Linked plan status is displayed
- [AC-4.2.4] I can unlink a plan if needed

## 8. Business Rules

### 8.1 Calculation Rules
- **Annual Income**: Sum of all monthly income entries × 12
- **Annual Expenses**: Sum of all monthly expense entries × 12
- **Annual Debt Principal**: Sum of all monthly principal payments × 12
- **Annual Debt Interest**: Sum of all monthly interest payments × 12
- **Total Assets**: Sum of all asset values
- **Total Debt**: Sum of all debt principal amounts (or remaining balances if provided)
- **Net Worth**: Total Assets - Total Debt
- **Debt-to-Asset Ratio**: (Total Debt / Total Assets) × 100%
- **Debt Payment to Income Ratio**: (Annual Debt Payments / Annual Income) × 100%
- **Expense to Income Ratio**: (Annual Expenses / Annual Income) × 100%
- **Savings Rate**: (Remaining Savings / Annual Income) × 100%
- **Emergency Fund Recommendation**: 6 months of total monthly expenses

### 8.2 Validation Rules
- [BR-1] All monetary values must be positive numbers (≥ 0)
- [BR-2] Interest rate must be between 0% and 100%
- [BR-3] Debt term must be positive (≥ 1 month)
- [BR-4] Monthly payment cannot exceed principal amount
- [BR-5] Remaining balance cannot exceed principal amount
- [BR-6] Warning shown if expense > income (negative savings)
- [BR-7] Warning shown if debt-to-asset ratio > 50%
- [BR-8] Warning shown if debt payment to income ratio > 40%
- [BR-9] Warning shown if emergency fund < recommended amount
- [BR-10] Warning shown if savings rate < 10%

### 8.3 Asset Categorization Rules
- **Consumer Assets (Tài sản tiêu dùng)**: House, car, furniture, electronics, etc.
- **Business Assets (Tài sản kinh doanh)**: Business equipment, inventory, business property, etc.
- **Financial Assets (Tài sản tài chính)**: Stocks, bonds, savings, investments, etc.

### 8.6 Portfolio Asset Mapping Rules
- **Automatic Mapping from Portfolio Asset Types:**
  - STOCK, BOND, GOLD, CRYPTO, COMMODITY, CURRENCY, DEPOSITS → Tài sản tài chính (Financial Assets)
  - REALESTATE → User must choose: Tài sản tiêu dùng (Consumer) or Tài sản kinh doanh (Business)
  - OTHER → User must choose category manually
- **Asset Value Source:**
  - Portfolio assets use current market value from Portfolio calculation
  - Users can override Portfolio value by editing the asset
  - Custom assets use user-entered value
- **Currency Conversion:**
  - If Portfolio baseCurrency differs from analysis baseCurrency, convert asset values using current exchange rates
  - Conversion happens at load time, not real-time

### 8.4 Income Categorization Rules
- **Family Income (Thu nhập gia đình)**: Salary, wages, pension, etc.
- **Business Income (Thu nhập kinh doanh)**: Business profits, rental income, etc.
- **Other Income (Thu nhập khác)**: Investment returns, gifts, etc.

### 8.5 Expense Categorization Rules
- **Living Expenses (Chi phí sinh hoạt)**: Food, utilities, transportation, etc.
- **Education (Giáo dục)**: School fees, tuition, books, etc.
- **Insurance (Bảo hiểm)**: Health, life, property insurance, etc.
- **Other Expenses (Chi tiêu khác)**: Entertainment, travel, miscellaneous, etc.

## 9. Acceptance Criteria (Project Level)

### 9.1 Functional Completeness
- [AC-P1] All 4 pages are fully functional and accessible
- [AC-P2] All data input forms work correctly with validation
- [AC-P3] All calculations are accurate and match business rules
- [AC-P4] All charts render correctly with interactive tooltips
- [AC-P5] Scenario management works correctly
- [AC-P6] Integration with Financial Freedom Planning works correctly
- [AC-P7] Data persistence works correctly (save/load)

### 9.2 Integration
- [AC-P8] Menu item added to navigation
- [AC-P9] Route added to App.tsx
- [AC-P10] Integration with Financial Freedom Planning System works
- [AC-P11] Uses baseCurrency from AccountContext correctly

### 9.3 Quality
- [AC-P12] All pages are responsive (mobile, tablet, desktop)
- [AC-P13] Multi-language support works (Vietnamese and English)
- [AC-P14] Error handling is comprehensive
- [AC-P15] Loading states are displayed appropriately
- [AC-P16] No console errors or warnings

### 9.4 Security
- [AC-P17] All API endpoints require authentication
- [AC-P18] Users can only access their own data
- [AC-P19] Input validation on frontend and backend
- [AC-P20] SQL injection prevention verified

### 9.5 Performance
- [AC-P21] Page load time < 2 seconds
- [AC-P22] Chart rendering < 1 second
- [AC-P23] Database queries optimized

## 10. Timeline Estimates

### Phase 1: Backend Foundation (2 weeks)
- Database schema design and migration
- Entity and DTO creation
- Service layer implementation
- API endpoints development
- Basic validation and business rules

### Phase 2: Frontend Page 1 & 2 (2 weeks)
- Page 1: Cash Flow Survey UI
- Page 2: Financial Analysis UI
- Chart components (Balance Sheet, Asset Pyramid, Asset Structure)
- Calculation logic implementation
- Data persistence integration

### Phase 3: Frontend Page 3 & 4 (1.5 weeks)
- Page 3: Asset Restructuring UI
- Scenario management
- Before/After comparison
- Page 4: Financial Planning integration
- Optional system suggestions

### Phase 4: Integration & Testing (1 week)
- Menu and routing integration
- End-to-end testing
- Bug fixes
- Performance optimization
- Documentation

### Phase 5: Polish & Deployment (0.5 weeks)
- UI/UX refinements
- Multi-language translations
- Final testing
- Deployment preparation

**Total Estimated Time**: 7 weeks

## 11. Priority Rankings

### High Priority (Must Have)
- [P1] Page 1: Cash Flow Survey (all input forms)
- [P2] Page 1: Portfolio linking and asset loading
- [P3] Page 2: Summary Metrics and Income/Expense Table
- [P4] Page 2: Balance Sheet Chart
- [P5] Page 2: Asset Structure Chart
- [P6] Data persistence (save/load)
- [P7] Basic validation and business rules
- [P8] Integration with Financial Freedom Planning (create new plan)

### Medium Priority (Should Have)
- [P2] Page 2: Asset Pyramid Chart
- [P3] Page 3: Scenario management
- [P4] Page 3: Before/After comparison
- [P5] Page 4: Link existing plan
- [P6] System suggestions (optional)
- [P7] Advanced validation warnings

### Low Priority (Nice to Have)
- [P3] Export to PDF/Excel
- [P4] Historical trend analysis
- [P5] Advanced chart interactions
- [P6] Data import from CSV
- [P7] Sharing capabilities

## 12. Dependencies

### 12.1 Internal Dependencies
- **Financial Freedom Planning System (CR-009)**: Required for Page 4 integration
- **Portfolio Management System**: Required for Portfolio linking and asset loading
- **Portfolio Analytics Service**: Required for getting asset values from Portfolio
- **Asset Service**: Required for asset information and current prices
- **AccountContext**: Required for baseCurrency and accountId
- **Chart Library (Recharts)**: Required for visualizations
- **Material-UI Components**: Required for UI consistency

### 12.2 External Dependencies
- **React 18+**: Frontend framework
- **NestJS**: Backend framework
- **PostgreSQL**: Database with JSONB support
- **TypeORM**: ORM for database operations

## 13. Risks & Mitigation

### 13.1 Technical Risks
- **Risk**: Complex calculations may have performance issues
  - **Mitigation**: Client-side calculations with memoization, optimize database queries
- **Risk**: Chart rendering may be slow with large datasets
  - **Mitigation**: Data aggregation, lazy loading, pagination
- **Risk**: JSONB data structure may be complex to query
  - **Mitigation**: Proper indexing, denormalized fields for common queries

### 13.2 User Experience Risks
- **Risk**: Users may find 4-step workflow too complex
  - **Mitigation**: Clear progress indicators, auto-save, ability to skip steps
- **Risk**: Financial terminology may be confusing
  - **Mitigation**: Tooltips, help text, multi-language support

### 13.3 Data Quality Risks
- **Risk**: Users may input incorrect data
  - **Mitigation**: Comprehensive validation, warnings, data review before final save

## 14. Future Enhancements

### 14.1 Phase 2 Features
- Historical trend analysis (compare analyses over time)
- Export to PDF/Excel functionality
- Data import from CSV/Excel
- Advanced chart interactions (drill-down, filtering)
- Sharing capabilities (read-only sharing with advisors)

### 14.2 Phase 3 Features
- Bank account integration (read-only)
- Automatic transaction categorization
- Budget planning and tracking
- Goal-based savings recommendations
- Financial health score calculation

---

## Document Approval

- **Status**: Draft
- **Next Steps**: 
  1. Review and approval from stakeholders
  2. Create Technical Design Document (TDD)
  3. Create Task Breakdown Document
  4. Begin implementation

---

**End of Document**

