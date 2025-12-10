# CR-009: Financial Freedom Planning System - Product Requirements Document

## 1. Executive Summary

### 1.1 Overview
This document outlines the requirements for implementing a comprehensive Financial Freedom Planning System within the existing Portfolio Management System. The system will help users (individual investors and financial advisors) plan their path to financial freedom by calculating required investment parameters, suggesting optimal asset allocation, consolidating multiple financial goals, and tracking progress over time.

The system provides a flexible calculation engine that can determine any missing variable (return rate, investment years, periodic payment, future value, or initial investment) based on user inputs, making it adaptable to different planning scenarios.

### 1.2 Business Objectives
- Enable users to set clear financial freedom goals with realistic timelines
- Provide flexible financial calculations (calculate any variable based on others)
- Suggest optimal asset allocation based on required return rate and risk tolerance
- Consolidate multiple financial goals into a unified plan
- Track progress against financial freedom goals with real-time portfolio comparison
- Support financial advisors in creating comprehensive plans for clients
- Integrate seamlessly with existing Goals Management and Portfolio systems

### 1.3 Success Criteria
- Users can create financial freedom plans through an intuitive 3-step workflow
- System accurately calculates any missing financial variable (RRR, years, payment, FV, initial investment)
- Asset allocation suggestions align with required return rates and risk profiles
- Multiple goals can be consolidated into a unified plan view
- Real-time progress tracking compares actual portfolio performance against plans
- System integrates seamlessly with existing Goals and Portfolio modules
- All calculations handle edge cases and provide appropriate warnings
- UI is simple and user-friendly, supporting different user goals and scenarios

## 2. Product Context

### 2.1 Current System State
The Portfolio Management System is 100% complete with:
- ✅ Complete portfolio management with real-time calculations
- ✅ Trading system with FIFO/LIFO algorithms
- ✅ Goals Management System with portfolio linking
- ✅ Asset management with computed fields and multiple asset types
- ✅ Portfolio analytics and reporting (TWR, IRR, risk metrics)
- ✅ Asset allocation calculation and visualization
- ✅ Multi-account portfolio management with permissions
- ✅ Frontend React.js dashboard with Material-UI

### 2.2 Integration Points
- **Goals Management System**: Financial Freedom Plans can be linked to existing Goals, auto-create Goals from Plans
- **Portfolio Module**: Plans link to portfolios for progress tracking, compare actual vs suggested allocation
- **Asset Analytics Service**: Use existing asset allocation calculation for comparison
- **TWR/IRR Calculation Services**: Use existing calculation services for performance comparison
- **Risk Metrics Service**: Integrate risk assessment into allocation suggestions
- **Portfolio Snapshots**: Track plan progress using existing snapshot system
- **User Management**: Plans are account-specific, respect permission system

### 2.3 Reference Implementation
The system currently has:
- **Goals Management**: Complete CRUD operations, portfolio linking, priority tracking
- **Portfolio Analytics**: Asset allocation calculation, performance metrics
- **Calculation Services**: TWR, IRR, MWR calculation services with proven accuracy
- **Risk Metrics**: Sharpe ratio, volatility, VaR calculations

### 2.4 Design Approach: Flexible Calculation Engine
**Key Design Decision:** The system uses a flexible calculation engine that can determine any missing variable based on user inputs, rather than always calculating Required Return Rate (RRR).

**Rationale:**
- Different users have different planning scenarios:
  - Some know how much they can invest monthly and want to know how long it takes
  - Some have a fixed timeline and want to know required return rate
  - Some want to know how much to invest monthly to reach a goal
- Provides maximum flexibility and user-friendliness
- Mathematically sound: All variables are interconnected in the Future Value of Annuity formula
- Better user experience: Users only input what they know, system calculates what they need

**Implementation:**
- Detect which variable is missing from user inputs
- Use appropriate formula to calculate missing variable
- Validate feasibility (e.g., RRR < 50%, years > 0)
- Provide warnings for unrealistic scenarios

## 3. User Stories

### 3.1 Primary User Stories

#### US-001: Create Financial Freedom Plan - Step 1 (Goal Definition)
**As a** individual investor  
**I want to** define my financial freedom goal and investment parameters  
**So that** I can understand what I need to achieve financial independence

**Acceptance Criteria:**
- User can input target amount either as:
  - Direct amount (present value)
  - Calculated from monthly expenses and withdrawal rate (4% rule)
- User can input investment parameters (can leave one variable empty to calculate):
  - Initial investment amount
  - Periodic payment (monthly/quarterly/yearly)
  - Investment years
  - Expected return rate
- User can specify inflation rate (default: 3.5% for VN)
- User can select risk tolerance (conservative/moderate/aggressive)
- System automatically detects which variable is missing and calculates it
- System validates inputs and provides warnings for unrealistic scenarios
- System calculates future value required (with inflation adjustment)
- System displays calculation results clearly

#### US-002: Get Asset Allocation Suggestions - Step 2
**As a** individual investor  
**I want to** receive asset allocation suggestions based on my required return rate  
**So that** I know how to allocate my portfolio to achieve my goals

**Acceptance Criteria:**
- System suggests asset allocation based on:
  - Required return rate from Step 1
  - Risk tolerance selected
  - Investment timeline
- Suggestions include percentages for:
  - Stocks
  - Bonds
  - Gold
  - Real Estate
  - Cash
- System shows expected return for suggested allocation
- System compares with current portfolio allocation (if portfolio selected)
- System highlights adjustments needed (increase/decrease percentages)
- System validates if suggested allocation aligns with required return rate
- User can save suggested allocation to plan

#### US-003: View Consolidated Plan Overview - Step 3
**As a** individual investor  
**I want to** see a consolidated view of all my financial goals  
**So that** I have a complete picture of my financial plan

**Acceptance Criteria:**
- System consolidates multiple financial freedom plans
- System can also include goals from Goals Management System
- System shows:
  - Total target value across all goals
  - Weighted average required return rate
  - Combined asset allocation
  - Yearly projections (portfolio value over time)
- System provides scenario analysis:
  - Conservative scenario (lower returns)
  - Moderate scenario (expected returns)
  - Aggressive scenario (higher returns)
- System shows milestones and key dates
- System provides risk assessment and recommendations
- User can export plan as PDF

#### US-004: Flexible Financial Calculations
**As a** individual investor  
**I want to** calculate different financial variables based on what I know  
**So that** I can plan according to my specific situation

**Acceptance Criteria:**
- User can leave one variable empty, system calculates it:
  - Required Return Rate (if years, payment, initial investment, and target are known)
  - Investment Years (if return rate, payment, initial investment, and target are known)
  - Periodic Payment (if return rate, years, initial investment, and target are known)
  - Future Value (if return rate, years, payment, and initial investment are known)
  - Initial Investment (if return rate, years, payment, and target are known)
- System validates that exactly one variable is missing
- System provides clear indication of what is being calculated
- System shows calculation formula and steps (optional, for transparency)
- System handles edge cases (e.g., PMT = 0, initial investment = 0)

### 3.2 Secondary User Stories

#### US-006: Calculate from Monthly Expenses
**As a** individual investor  
**I want to** calculate my financial freedom goal from my monthly expenses  
**So that** I don't have to guess the total amount needed

**Acceptance Criteria:**
- User can input monthly expenses instead of total amount
- User can adjust withdrawal rate (default: 4% rule)
- System calculates required portfolio value using: `(monthlyExpenses × 12) / withdrawalRate`
- System then uses this value in financial calculations

#### US-007: Multiple Scenario Comparison
**As a** individual investor  
**I want to** compare different investment scenarios  
**So that** I can make informed decisions

**Acceptance Criteria:**
- System shows three scenarios side-by-side:
  - Conservative (6% return)
  - Moderate (10% return)
  - Aggressive (15% return)
- Each scenario shows:
  - Final portfolio value
  - Years to reach goal
  - Progress percentage
- User can switch between scenarios to see impact
- System highlights recommended scenario based on risk tolerance

#### US-008: Plan Management
**As a** individual investor  
**I want to** create, edit, and manage multiple financial freedom plans  
**So that** I can plan for different goals and scenarios

**Acceptance Criteria:**
- User can create multiple plans
- User can edit existing plans
- User can delete plans
- User can duplicate plans for scenario testing
- User can archive completed plans
- Plans are linked to user account
- Plans can be linked to multiple portfolios

#### US-009: Integration with Goals System
**As a** individual investor  
**I want to** link my financial freedom plans with my investment goals  
**So that** I have a unified view of all my financial objectives

**Acceptance Criteria:**
- Financial Freedom Plans can be linked to Goals from Goals Management System
- System can auto-create Goals from Plans
- Progress updates sync between Plans and Goals
- Consolidated view shows both Plans and Goals together
- User can navigate between Plans and linked Goals

#### US-010: Rebalancing Recommendations
**As a** individual investor  
**I want to** receive recommendations when my portfolio allocation deviates from plan  
**So that** I can maintain optimal allocation

**Acceptance Criteria:**
- System compares current portfolio allocation vs suggested allocation
- System alerts when any asset type deviates > 5% from target
- System provides specific recommendations:
  - Which assets to buy more
  - Which assets to sell
  - Exact amounts needed
- System considers current portfolio value and available cash
- Recommendations are actionable and specific

#### US-011: Use Planning Templates
**As a** individual investor  
**I want to** select from pre-configured planning templates  
**So that** I can quickly start planning without figuring out all the details myself

**Acceptance Criteria:**
- System provides multiple planning templates for common scenarios:
  - Savings & Investment (working, accumulating)
  - Retirement Withdrawal (retired, withdrawing)
  - Early Retirement (FIRE - Financial Independence Retire Early)
  - Home Purchase (buying property)
  - Education Fund (saving for children's education)
  - Emergency Fund (building safety net)
- Each template pre-fills appropriate values based on scenario
- User can select a template and customize values
- Templates include helpful descriptions and guidance
- System shows which variable will be calculated for each template
- User can save custom templates for future use

## 4. Functional Requirements

### 4.1 Step 1: Goal Definition and Investment Parameters

#### FR-001: Target Amount Input
- [FR-001.1] System shall allow users to input target amount directly (present value)
- [FR-001.2] System shall allow users to calculate target amount from monthly expenses
- [FR-001.3] When calculating from expenses, system shall use formula: `(monthlyExpenses × 12) / withdrawalRate`
- [FR-001.4] System shall support withdrawal rate input (default: 4%)
- [FR-001.5] System shall calculate future value with inflation: `FV = PV × (1 + inflation)^years`

#### FR-002: Investment Parameters Input
- [FR-002.1] System shall allow input of initial investment (can be 0)
- [FR-002.2] System shall allow input of periodic payment (can be 0)
- [FR-002.3] System shall support payment frequency: monthly, quarterly, yearly
- [FR-002.4] System shall support payment type: contribution or withdrawal
- [FR-002.5] System shall allow input of investment years (can be empty)
- [FR-002.6] System shall allow input of expected return rate (can be empty)
- [FR-002.7] System shall validate that exactly one variable is missing for calculation

#### FR-003: Flexible Calculation Engine
- [FR-003.1] System shall detect which variable is missing from inputs
- [FR-003.2] System shall calculate Required Return Rate if missing
- [FR-003.3] System shall calculate Investment Years if missing
- [FR-003.4] System shall calculate Periodic Payment if missing
- [FR-003.5] System shall calculate Future Value if missing
- [FR-003.6] System shall calculate Initial Investment if missing
- [FR-003.7] System shall use Future Value of Annuity formula: `FV = PV₀(1+r)^n + PMT[((1+r)^n-1)/r]`
- [FR-003.8] System shall use appropriate numerical methods (Newton-Raphson, binary search) for solving equations
- [FR-003.9] System shall handle edge cases (PMT = 0, initial investment = 0)

#### FR-004: Inflation and Risk Input
- [FR-004.1] System shall allow input of inflation rate (default: 3.5% for VN)
- [FR-004.2] System shall support risk tolerance selection: conservative, moderate, aggressive
- [FR-004.3] System shall validate inflation rate is between 0% and 20%

#### FR-005: Validation and Warnings
- [FR-005.1] System shall validate all inputs are positive numbers (except periodic payment can be negative for withdrawals)
- [FR-005.2] System shall warn if calculated RRR > 50% (unrealistic)
- [FR-005.3] System shall warn if calculated RRR < 0% (cannot achieve goal)
- [FR-005.4] System shall warn if calculated years < 1 (too short)
- [FR-005.5] System shall warn if calculated periodic payment is negative and payment type is contribution
- [FR-005.6] System shall validate feasibility of plan

#### FR-006: Planning Templates
- [FR-006.1] System shall provide pre-configured planning templates for common scenarios
- [FR-006.2] System shall include template: "Tiết kiệm và đầu tư" (Savings & Investment)
- [FR-006.3] System shall include template: "Đã nghỉ hưu, rút tiền" (Retirement Withdrawal)
- [FR-006.4] System shall include template: "Tự do tài chính sớm" (Early Retirement/FIRE)
- [FR-006.5] System shall include template: "Mua nhà" (Home Purchase)
- [FR-006.6] System shall include template: "Quỹ giáo dục" (Education Fund)
- [FR-006.7] System shall include template: "Quỹ khẩn cấp" (Emergency Fund)
- [FR-006.8] Each template shall pre-fill appropriate default values
- [FR-006.9] Each template shall indicate which variable will be calculated
- [FR-006.10] User can select template and customize values
- [FR-006.11] User can save custom templates
- [FR-006.12] Templates shall include helpful descriptions and guidance

### 4.2 Step 2: Asset Allocation Suggestions

#### FR-006: Allocation Calculation
- [FR-006.1] System shall suggest asset allocation based on required return rate
- [FR-006.2] System shall adjust allocation based on risk tolerance
- [FR-006.3] System shall provide allocation for: stocks, bonds, gold, real estate, cash
- [FR-006.4] System shall calculate expected return for suggested allocation
- [FR-006.5] System shall validate if suggested allocation aligns with required return rate
- [FR-006.6] System shall adjust allocation if RRR is higher than expected return

#### FR-007: Portfolio Comparison
- [FR-007.1] System shall allow selection of existing portfolio for comparison
- [FR-007.2] System shall fetch current allocation from selected portfolio
- [FR-007.3] System shall compare current vs suggested allocation
- [FR-007.4] System shall calculate adjustments needed (increase/decrease percentages)
- [FR-007.5] System shall highlight differences visually

#### FR-008: Allocation Strategies
- [FR-008.1] System shall provide conservative allocation (30-40% stocks, 40-50% bonds)
- [FR-008.2] System shall provide moderate allocation (60-70% stocks, 20-30% bonds)
- [FR-008.3] System shall provide aggressive allocation (70-80% stocks, 10-20% bonds)
- [FR-008.4] System shall adjust percentages based on required return rate
- [FR-008.5] System shall ensure allocation percentages sum to 100%

### 4.3 Step 3: Consolidated Plan Overview

#### FR-009: Plan Consolidation
- [FR-009.1] System shall consolidate multiple financial freedom plans
- [FR-009.2] System shall include goals from Goals Management System
- [FR-009.3] System shall calculate total target value across all goals
- [FR-009.4] System shall calculate weighted average required return rate
- [FR-009.5] System shall combine asset allocations from all plans
- [FR-009.6] System shall handle conflicting allocations (prioritize by goal priority)

#### FR-010: Yearly Projections
- [FR-010.1] System shall generate yearly projections for portfolio value
- [FR-010.2] System shall show contributions, returns, and cumulative value per year
- [FR-010.3] System shall calculate progress percentage per year
- [FR-010.4] System shall identify milestone years
- [FR-010.5] System shall display projections in chart format

#### FR-011: Scenario Analysis
- [FR-011.1] System shall provide conservative scenario (6% return)
- [FR-011.2] System shall provide moderate scenario (10% return)
- [FR-011.3] System shall provide aggressive scenario (15% return)
- [FR-011.4] System shall show final portfolio value for each scenario
- [FR-011.5] System shall show years to reach goal for each scenario
- [FR-011.6] System shall highlight recommended scenario based on risk tolerance

#### FR-012: Risk Assessment
- [FR-012.1] System shall assess overall risk level (low/medium/high)
- [FR-012.2] System shall calculate diversification score (0-100)
- [FR-012.3] System shall provide recommendations for risk mitigation
- [FR-012.4] System shall identify concentration risks

### 4.4 Data Management

#### FR-018: Plan CRUD Operations
- [FR-018.1] System shall support creating new financial freedom plans
- [FR-018.2] System shall support reading/viewing existing plans
- [FR-018.3] System shall support updating existing plans
- [FR-018.4] System shall support deleting plans
- [FR-018.5] System shall support duplicating plans
- [FR-018.6] System shall support archiving completed plans

#### FR-019: Data Persistence
- [FR-019.1] System shall persist all plan data to database
- [FR-019.2] System shall maintain plan history and versions
- [FR-019.3] System shall support plan export (PDF, Excel)
- [FR-019.4] System shall support plan import (future enhancement)

## 5. Non-Functional Requirements

### 5.1 Performance
- [NFR-001] Calculation response time < 1 second for single plan calculation
- [NFR-002] Consolidated plan calculation < 3 seconds for up to 10 plans
- [NFR-003] System shall handle up to 100 plans per user

### 5.2 Security
- [NFR-006] Plans shall be account-specific (users can only access their own plans)
- [NFR-007] System shall respect portfolio permissions when linking portfolios
- [NFR-008] All financial data shall be encrypted in transit (HTTPS)
- [NFR-009] Sensitive calculations shall be validated server-side

### 5.3 Usability
- [NFR-010] UI shall be intuitive with clear step-by-step workflow
- [NFR-011] System shall provide helpful tooltips and explanations
- [NFR-012] System shall show calculation formulas (optional, for transparency)
- [NFR-013] System shall provide clear error messages and warnings
- [NFR-014] System shall support both Vietnamese and English languages

### 5.4 Reliability
- [NFR-015] Calculation accuracy: Financial calculations shall be accurate to 6 decimal places
- [NFR-016] System shall handle edge cases gracefully (division by zero, negative values)
- [NFR-017] System shall provide fallback calculations if primary method fails
- [NFR-018] System shall log all calculation operations for audit

### 5.5 Scalability
- [NFR-019] System shall support 10,000+ concurrent users
- [NFR-020] System shall handle 100,000+ plans in database
- [NFR-021] Database queries shall be optimized with proper indexing

## 6. Constraints & Assumptions

### 6.1 Constraints
- **Technology Stack**: Must use existing NestJS backend and React.js frontend
- **Database**: Must use existing PostgreSQL database
- **Calculation Precision**: Financial calculations must use Decimal.js for precision
- **Integration**: Must integrate with existing Goals and Portfolio modules
- **UI Framework**: Must use Material-UI components for consistency
- **API Design**: Must follow existing RESTful API patterns

### 6.2 Assumptions
- Users have basic understanding of financial concepts (return rate, inflation, etc.)
- Users have at least one portfolio created before using progress tracking
- Inflation rates are annual and compound
- Return rates are annual and compound
- Periodic payments are made at the end of each period
- Users have internet connection for real-time portfolio value updates
- Portfolio values are updated regularly (at least daily)

## 7. Planning Templates

### 7.1 Template Definitions

#### Template 1: Tiết kiệm và đầu tư (Savings & Investment)
**Mô tả:** Dành cho người đang làm việc, muốn tích lũy và đầu tư để đạt mục tiêu tài chính trong tương lai.

**Thông số mẫu:**
- **Mục tiêu:** Tính từ chi phí sinh hoạt
  - Chi phí sinh hoạt hàng tháng: 50,000,000 VND
  - Tỷ lệ rút: 4% (4% rule)
  - → Tự động tính: 15,000,000,000 VND (hiện tại)
- **Vốn ban đầu:** 500,000,000 VND
- **Tiền bổ sung:** 10,000,000 VND/tháng
- **Tần suất:** Hàng tháng
- **Loại:** Bổ sung (contribution)
- **Thời gian đầu tư:** 15 năm
- **Tỉ suất lợi nhuận:** [Để trống - sẽ tính]
- **Lạm phát:** 3.5%/năm
- **Mức rủi ro:** Moderate (Cân bằng)

**Biến sẽ tính:** Required Return Rate (RRR)

**Hướng dẫn:** Template này phù hợp cho người đang làm việc, có thu nhập ổn định, muốn tích lũy để tự do tài chính. Hệ thống sẽ tính tỉ suất lợi nhuận cần thiết dựa trên số tiền bạn có thể đầu tư mỗi tháng.

---

#### Template 2: Đã nghỉ hưu, rút tiền (Retirement Withdrawal)
**Mô tả:** Dành cho người đã nghỉ hưu, có khoản tiết kiệm và muốn rút tiền định kỳ để chi tiêu.

**Thông số mẫu:**
- **Mục tiêu:** Tính từ chi phí sinh hoạt
  - Chi phí sinh hoạt hàng tháng: 30,000,000 VND
  - Tỷ lệ rút: 4% (4% rule)
  - → Tự động tính: 9,000,000,000 VND (hiện tại)
- **Vốn ban đầu:** 10,000,000,000 VND
- **Tiền rút:** 30,000,000 VND/tháng (âm vì là rút)
- **Tần suất:** Hàng tháng
- **Loại:** Rút tiền (withdrawal)
- **Thời gian đầu tư:** 25 năm
- **Tỉ suất lợi nhuận:** [Để trống - sẽ tính]
- **Lạm phát:** 3.5%/năm
- **Mức rủi ro:** Conservative (An toàn)

**Biến sẽ tính:** Required Return Rate (RRR) để duy trì portfolio trong 25 năm

**Hướng dẫn:** Template này phù hợp cho người đã nghỉ hưu, cần rút tiền hàng tháng để chi tiêu. Hệ thống sẽ tính tỉ suất lợi nhuận tối thiểu cần thiết để portfolio không bị cạn kiệt trong thời gian rút tiền.

---

#### Template 3: Tự do tài chính sớm (Early Retirement / FIRE)
**Mô tả:** Dành cho người muốn nghỉ hưu sớm (trước 50 tuổi), cần tích lũy nhanh để đạt tự do tài chính.

**Thông số mẫu:**
- **Mục tiêu:** Tính từ chi phí sinh hoạt
  - Chi phí sinh hoạt hàng tháng: 40,000,000 VND
  - Tỷ lệ rút: 3.5% (an toàn hơn cho thời gian dài)
  - → Tự động tính: 13,714,285,714 VND (hiện tại)
- **Vốn ban đầu:** 1,000,000,000 VND
- **Tiền bổ sung:** 20,000,000 VND/tháng
- **Tần suất:** Hàng tháng
- **Loại:** Bổ sung (contribution)
- **Thời gian đầu tư:** [Để trống - sẽ tính]
- **Tỉ suất lợi nhuận:** 12%/năm (kỳ vọng cao)
- **Lạm phát:** 3.5%/năm
- **Mức rủi ro:** Aggressive (Rủi ro cao)

**Biến sẽ tính:** Investment Years (số năm cần đầu tư)

**Hướng dẫn:** Template này phù hợp cho người muốn nghỉ hưu sớm, sẵn sàng đầu tư mạnh và chấp nhận rủi ro cao để đạt mục tiêu nhanh. Hệ thống sẽ tính số năm cần thiết để đạt mục tiêu với lợi nhuận kỳ vọng.

---

#### Template 4: Mua nhà (Home Purchase)
**Mô tả:** Dành cho người muốn tích lũy để mua nhà trong tương lai.

**Thông số mẫu:**
- **Mục tiêu:** Nhập số tiền tổng
  - Số tiền cần có (hiện tại): 3,000,000,000 VND (3 tỷ)
- **Vốn ban đầu:** 200,000,000 VND
- **Tiền bổ sung:** 15,000,000 VND/tháng
- **Tần suất:** Hàng tháng
- **Loại:** Bổ sung (contribution)
- **Thời gian đầu tư:** 5 năm
- **Tỉ suất lợi nhuận:** [Để trống - sẽ tính]
- **Lạm phát:** 3.5%/năm
- **Mức rủi ro:** Moderate (Cân bằng)

**Biến sẽ tính:** Required Return Rate (RRR)

**Hướng dẫn:** Template này phù hợp cho người muốn mua nhà trong 5 năm. Hệ thống sẽ tính tỉ suất lợi nhuận cần thiết để đạt mục tiêu với số tiền bạn có thể đầu tư mỗi tháng.

---

#### Template 5: Quỹ giáo dục (Education Fund)
**Mô tả:** Dành cho phụ huynh muốn tích lũy cho con cái đi học đại học hoặc du học.

**Thông số mẫu:**
- **Mục tiêu:** Nhập số tiền tổng
  - Số tiền cần có (hiện tại): 2,000,000,000 VND (2 tỷ)
- **Vốn ban đầu:** 100,000,000 VND
- **Tiền bổ sung:** 8,000,000 VND/tháng
- **Tần suất:** Hàng tháng
- **Loại:** Bổ sung (contribution)
- **Thời gian đầu tư:** [Để trống - sẽ tính]
- **Tỉ suất lợi nhuận:** 10%/năm (kỳ vọng vừa phải)
- **Lạm phát:** 3.5%/năm
- **Mức rủi ro:** Moderate (Cân bằng)

**Biến sẽ tính:** Investment Years (số năm cần tích lũy)

**Hướng dẫn:** Template này phù hợp cho phụ huynh muốn tích lũy cho con cái. Hệ thống sẽ tính số năm cần thiết để đạt mục tiêu với lợi nhuận kỳ vọng.

---

#### Template 6: Quỹ khẩn cấp (Emergency Fund)
**Mô tả:** Dành cho người muốn xây dựng quỹ khẩn cấp để đối phó với các tình huống bất ngờ.

**Thông số mẫu:**
- **Mục tiêu:** Tính từ chi phí sinh hoạt
  - Chi phí sinh hoạt hàng tháng: 30,000,000 VND
  - Số tháng cần duy trì: 6 tháng (quỹ khẩn cấp tiêu chuẩn)
  - → Tự động tính: 180,000,000 VND (hiện tại)
- **Vốn ban đầu:** 50,000,000 VND
- **Tiền bổ sung:** 10,000,000 VND/tháng
- **Tần suất:** Hàng tháng
- **Loại:** Bổ sung (contribution)
- **Thời gian đầu tư:** [Để trống - sẽ tính]
- **Tỉ suất lợi nhuận:** 5%/năm (an toàn, thanh khoản cao)
- **Lạm phát:** 3.5%/năm
- **Mức rủi ro:** Conservative (An toàn)

**Biến sẽ tính:** Investment Years (số tháng/năm cần tích lũy)

**Hướng dẫn:** Template này phù hợp cho người muốn xây dựng quỹ khẩn cấp. Quỹ khẩn cấp nên được đầu tư an toàn, thanh khoản cao. Hệ thống sẽ tính thời gian cần thiết để đạt mục tiêu.

---

#### Template 7: Tích lũy cho con cái (Children's Future Fund)
**Mô tả:** Dành cho phụ huynh muốn tích lũy dài hạn cho con cái (18-20 năm).

**Thông số mẫu:**
- **Mục tiêu:** Nhập số tiền tổng
  - Số tiền cần có (hiện tại): 5,000,000,000 VND (5 tỷ)
- **Vốn ban đầu:** 50,000,000 VND
- **Tiền bổ sung:** 10,000,000 VND/tháng
- **Tần suất:** Hàng tháng
- **Loại:** Bổ sung (contribution)
- **Thời gian đầu tư:** 18 năm (từ khi con sinh ra đến khi vào đại học)
- **Tỉ suất lợi nhuận:** [Để trống - sẽ tính]
- **Lạm phát:** 3.5%/năm
- **Mức rủi ro:** Moderate to Aggressive (Có thời gian dài, có thể chấp nhận rủi ro)

**Biến sẽ tính:** Required Return Rate (RRR)

**Hướng dẫn:** Template này phù hợp cho phụ huynh muốn tích lũy dài hạn cho con cái. Với thời gian dài (18 năm), có thể đầu tư mạnh hơn để tối đa hóa lợi nhuận.

---

### 7.2 Template Selection UI Flow

```
┌─────────────────────────────────────────────────────────┐
│ Bắt đầu kế hoạch tài chính                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ [●] Bắt đầu từ mẫu có sẵn                               │
│ [ ] Tự nhập thông tin                                    │
│                                                          │
│ Chọn mẫu phù hợp với bạn:                               │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [Template Card 1]                                    │ │
│ │ 💰 Tiết kiệm và đầu tư                               │ │
│ │ Dành cho người đang làm việc, muốn tích lũy...      │ │
│ │ [Chọn mẫu này]                                        │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [Template Card 2]                                    │ │
│ │ 🏖️ Đã nghỉ hưu, rút tiền                            │ │
│ │ Dành cho người đã nghỉ hưu, cần rút tiền...        │ │
│ │ [Chọn mẫu này]                                        │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ [Xem thêm mẫu khác...]                                  │
│                                                          │
│ [Bỏ qua, tự nhập]                                       │
└─────────────────────────────────────────────────────────┘
```

### 7.3 Template Data Structure

```typescript
interface PlanningTemplate {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  icon: string; // Icon name for UI
  category: 'savings' | 'retirement' | 'purchase' | 'education' | 'emergency';
  
  // Pre-filled values
  defaults: {
    // Target calculation method
    targetMethod: 'direct' | 'fromExpenses';
    
    // If fromExpenses
    monthlyExpenses?: number;
    withdrawalRate?: number;
    
    // If direct
    targetPresentValue?: number;
    
    // Investment parameters
    initialInvestment: number;
    periodicPayment: number;
    paymentFrequency: 'monthly' | 'quarterly' | 'yearly';
    paymentType: 'contribution' | 'withdrawal';
    investmentYears?: number; // null if to be calculated
    expectedReturnRate?: number; // null if to be calculated
    
    // Other parameters
    inflationRate: number;
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  };
  
  // Which variable to calculate
  calculateVariable: 'returnRate' | 'years' | 'periodicPayment' | 'futureValue' | 'initialInvestment';
  
  // Guidance text
  guidance: string;
  guidanceEn: string;
  
  // Tips and recommendations
  tips: string[];
  tipsEn: string[];
}
```

## 8. Business Rules

### BR-001: Future Value Calculation
- Future Value with inflation: `FV = PV × (1 + inflation)^years`
- Where PV is present value (target amount at current time)
- Inflation rate is annual percentage (e.g., 3.5% = 0.035)

### BR-002: Future Value of Annuity
- Formula: `FV = PV₀(1+r)^n + PMT[((1+r)^n-1)/r]`
- Where:
  - PV₀ = Initial investment
  - PMT = Periodic payment (positive for contributions, negative for withdrawals)
  - r = Return rate per period (annual rate / periods per year)
  - n = Number of periods (years × periods per year)

### BR-003: Required Return Rate Calculation
- Solve for r in: `FV = PV₀(1+r)^n + PMT[((1+r)^n-1)/r]`
- Use numerical methods (Newton-Raphson or binary search)
- Validate result: 0% ≤ r ≤ 50% (warn if outside range)

### BR-004: Investment Years Calculation
- Solve for n in: `FV = PV₀(1+r)^n + PMT[((1+r)^n-1)/r]`
- Use logarithms: `n = log((FV - PMT/r) / (PV₀ + PMT/r)) / log(1+r)`
- Validate result: n ≥ 1 year

### BR-005: Periodic Payment Calculation
- Formula: `PMT = (FV - PV₀(1+r)^n) / [((1+r)^n-1)/r]`
- Validate result: PMT > 0 for contributions, PMT < 0 for withdrawals

### BR-006: Initial Investment Calculation
- Formula: `PV₀ = (FV - PMT[((1+r)^n-1)/r]) / (1+r)^n`
- Validate result: PV₀ ≥ 0

### BR-007: Asset Allocation Strategies
- **Conservative**: 30-40% stocks, 40-50% bonds, 10-15% gold, 5-10% real estate, 5-10% cash
  - Expected return: 6-8%/year
- **Moderate**: 60-70% stocks, 20-30% bonds, 5-10% gold, 5-10% real estate, 0-5% cash
  - Expected return: 8-12%/year
- **Aggressive**: 70-80% stocks, 10-20% bonds, 5-10% gold, 5-10% real estate, 0-5% cash
  - Expected return: 12-15%/year

### BR-008: Allocation Adjustment
- If required return rate > expected return of risk level:
  - Increase stocks percentage by up to 10%
  - Decrease bonds percentage accordingly
  - Warn if adjustment still insufficient

### BR-009: 4% Withdrawal Rule
- Safe withdrawal rate: 4% of portfolio value per year
- Required portfolio value: `(monthlyExpenses × 12) / 0.04`
- This ensures portfolio can sustain expenses for 25+ years

### BR-010: Progress Calculation
- Progress percentage: `(currentPortfolioValue / targetFutureValue) × 100`
- Remaining years: Solve for n using current return rate
- Gap analysis: `requiredReturnRate - actualReturnRate`

### BR-011: Rebalancing Threshold
- Alert when allocation deviates > 5% from target
- Calculate adjustment: `(targetPercentage - currentPercentage) × portfolioValue`

## 8. Acceptance Criteria (Project Level)

### 8.1 Functional Completeness
- [AC-001] All 4 workflow steps are implemented and functional
- [AC-002] Flexible calculation engine can calculate any missing variable
- [AC-003] Asset allocation suggestions are accurate and aligned with RRR
- [AC-004] Plan consolidation works with multiple plans and goals
- [AC-005] Progress tracking accurately compares actual vs target
- [AC-006] All CRUD operations work correctly
- [AC-007] Integration with Goals and Portfolio systems is seamless

### 8.2 Quality Assurance
- [AC-008] All calculations are accurate to 6 decimal places
- [AC-009] Edge cases are handled gracefully
- [AC-010] All validations and warnings work correctly
- [AC-011] UI is intuitive and user-friendly
- [AC-012] Performance meets all NFR requirements
- [AC-013] Security requirements are met

### 8.3 Documentation
- [AC-014] API documentation is complete (Swagger)
- [AC-015] User guide is available
- [AC-016] Technical documentation is updated
- [AC-017] Memory Bank is updated with progress

### 8.4 Testing
- [AC-018] Unit tests cover all calculation functions (coverage > 90%)
- [AC-019] Integration tests cover all API endpoints
- [AC-020] E2E tests cover complete workflow
- [AC-021] All tests pass (pass rate > 95%)

## 9. Timeline Estimates

### Phase 1: Backend Foundation (2 weeks)
- Database schema and migrations
- Entity and DTO definitions
- Calculation service implementation
- Basic API endpoints
- Unit tests for calculations

### Phase 2: Backend Advanced Features (2 weeks)
- Asset allocation suggestion service
- Plan consolidation service
- Progress tracking service
- Integration with existing services
- API endpoints completion

### Phase 3: Frontend Step 1 & 2 (2 weeks)
- Step 1 UI implementation
- Step 2 UI implementation
- Calculation integration
- Form validation
- Error handling

### Phase 4: Frontend Step 3 & 4 (2 weeks)
- Step 3 UI implementation
- Step 4 UI implementation
- Charts and visualizations
- Progress tracking integration
- Responsive design

### Phase 5: Integration & Testing (1 week)
- Integration with Goals system
- Integration with Portfolio system
- End-to-end testing
- Bug fixes
- Performance optimization

### Phase 6: Documentation & Deployment (1 week)
- API documentation
- User guide
- Memory Bank updates
- Deployment preparation

**Total Estimated Time: 10 weeks**

## 10. Priority Rankings

### High Priority (Must Have)
- [P1] Step 1: Goal definition and flexible calculation engine
- [P1] Step 2: Asset allocation suggestions
- [P1] Step 4: Basic progress tracking
- [P1] Plan CRUD operations
- [P1] Integration with Portfolio system

### Medium Priority (Should Have)
- [P2] Step 3: Consolidated plan overview
- [P2] Scenario analysis (conservative/moderate/aggressive)
- [P2] Rebalancing alerts
- [P2] Milestone tracking
- [P2] Integration with Goals system

### Low Priority (Nice to Have)
- [P3] Plan export (PDF, Excel)
- [P3] Plan import functionality
- [P3] Advanced scenario modeling
- [P3] Monte Carlo simulation
- [P3] Sensitivity analysis

## 11. Dependencies

### External Dependencies
- Existing Goals Management System (for integration)
- Existing Portfolio Management System (for progress tracking)
- Existing Asset Analytics Service (for allocation comparison)
- Existing TWR/IRR Calculation Services (for performance comparison)
- Existing Risk Metrics Service (for risk assessment)

### Technical Dependencies
- Decimal.js library (for precise financial calculations)
- Material-UI components (for UI consistency)
- Recharts library (for chart visualizations)
- React Query (for data fetching and caching)

### Data Dependencies
- Portfolio data (for progress tracking)
- Asset allocation data (for comparison)
- Performance metrics (for return rate calculation)
- Goals data (for consolidation)

## 12. Risks & Mitigation

### Risk 1: Calculation Accuracy
- **Risk**: Financial calculations may have precision issues
- **Mitigation**: Use Decimal.js for all calculations, extensive unit testing

### Risk 2: Performance with Multiple Plans
- **Risk**: Consolidating many plans may be slow
- **Mitigation**: Optimize database queries, implement caching, pagination

### Risk 3: Complex UI/UX
- **Risk**: 4-step workflow may be overwhelming for users
- **Mitigation**: Clear step indicators, progress saving, helpful tooltips

### Risk 4: Integration Complexity
- **Risk**: Integrating with existing systems may cause conflicts
- **Mitigation**: Careful API design, thorough testing, backward compatibility

### Risk 5: Edge Cases in Calculations
- **Risk**: Some input combinations may not have solutions
- **Mitigation**: Comprehensive validation, clear error messages, fallback calculations

## 13. Success Metrics

### User Adoption
- [M-001] 80% of active users create at least one financial freedom plan within 3 months
- [M-002] Average of 2 plans per user
- [M-003] 60% of plans are linked to portfolios for tracking

### System Performance
- [M-004] Calculation response time < 1 second (95th percentile)
- [M-005] Progress tracking update < 2 seconds (95th percentile)
- [M-006] System uptime > 99.9%

### User Satisfaction
- [M-007] User satisfaction score > 4.0/5.0
- [M-008] Support tickets related to calculations < 5% of total tickets
- [M-009] Feature usage retention > 70% after 1 month

---

**Document Status**: Draft  
**Version**: 1.0  
**Last Updated**: November 27, 2025  
**Next Review**: After TDD approval

