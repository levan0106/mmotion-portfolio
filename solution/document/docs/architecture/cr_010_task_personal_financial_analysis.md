# CR-010: Personal Financial Analysis System - Task Breakdown

## Document Information
- **Document ID**: CR-010-TASK
- **Feature Name**: Personal Financial Analysis System
- **Version**: 1.0
- **Date**: December 2024
- **Author**: Development Team
- **Status**: In Progress
- **Related PRD**: `cr_010_prd_personal_financial_analysis.md`
- **Related TDD**: `cr_010_tdd_personal_financial_analysis.md`

## Progress Summary

### Frontend Tasks Status
- ✅ **Task 12**: Create Frontend Type Definitions - COMPLETED
- ✅ **Task 13**: Create API Service - COMPLETED (with mock data for UI review)
- ✅ **Task 14**: Create React Hooks - COMPLETED
- ✅ **Task 15**: Create Calculation Utilities - COMPLETED
- ✅ **Task 16**: Create Main Page Component - COMPLETED
- ✅ **Task 17**: Create 4-Step Wizard Component - COMPLETED (converted from modal to full-page with tabs)
- ✅ **Task 18**: Create Step 1 - Cash Flow Survey Component - COMPLETED (table layout, portfolio linking modal, inline editing)
- ✅ **Task 19**: Create Step 2 - Financial Analysis Component - COMPLETED (summary metrics, charts, and notes implemented)
- ✅ **Task 20**: Create Step 3 - Asset Restructuring Component - COMPLETED (scenario management, comparison)
- ✅ **Task 21**: Create Step 4 - Financial Planning Component - PARTIALLY COMPLETED (basic UI done, Financial Freedom Plan integration pending)
- ✅ **Task 22**: Create Portfolio Linking Components - COMPLETED (PortfolioSelectorModal implemented)
- ✅ **Task 23**: Add Navigation and Routing - COMPLETED

### Backend Tasks Status
- ⏳ All backend tasks are pending (frontend implemented first for UI review)

### Current Status
Frontend implementation is nearly complete. Core functionality is working with mock data. Recent improvements:
- ✅ Converted wizard from modal to full-page with sticky tabs
- ✅ Implemented table-based input layout for Step 1
- ✅ Added portfolio linking modal (PortfolioSelectorModal)
- ✅ Implemented scenario management and comparison in Step 3
- ✅ Added name input field in wizard header
- ✅ Improved UI consistency with existing pages
- ✅ Implemented all charts in Step 2 (BalanceSheetChart, AssetStructureChart, AssetPyramidChart, IncomeByCategoryChart, ExpenseByCategoryChart)
- ✅ Added asset layer selection and emergency fund functionality in Step 1
- ✅ Added notes text box in Step 2
- ✅ Implemented responsive chart designs with custom SVG flow chart for Balance Sheet
- ✅ Added minWidth for all table columns for better layout stability
- ✅ **Step 3 Enhancements (Latest)**:
  - ✅ Redesigned scenario comparison layout with professional card-based design
  - ✅ Implemented inline editing for scenario name and description (TextField-based, no edit icon required)
  - ✅ Added "Edit Data" modal for editing scenario assets, income, expenses, and debts using Step1CashFlowSurvey component
  - ✅ Implemented visual indicators (arrows, colors, percentages) for metric differences in scenario comparison
  - ✅ Added chart comparison section (BalanceSheetChart and AssetPyramidChart) between current and selected scenarios
  - ✅ Auto-create and auto-select scenario when Step 3 is opened with only "current" scenario
  - ✅ Always display comparison layout (show only current scenario data when no scenario selected)
  - ✅ Optimized padding and spacing in scenario comparison section
- ✅ **Step 1 Performance Improvements**:
  - ✅ Implemented React.memo for individual table row components (AssetRow, IncomeRow, ExpenseRow, DebtRow)
  - ✅ Changed name field update logic to only update on blur (onBlur) instead of onChange to prevent continuous updates
  - ✅ Used useCallback for event handlers and useMemo for calculations to prevent unnecessary re-renders
  - ✅ Added Accordion with collapse/expand functionality for sections (default collapsed)
  - ✅ Auto-expand section when "Add" button is clicked within collapsed section
  - ✅ Added tooltips to section headers indicating "Click to expand/collapse"
  - ✅ Fixed border styling issues (overlapping borders, missing top borders)

Remaining frontend work:
- ⏳ Complete Financial Freedom Plan integration in Step 4 (Task 21 enhancement)
- ⏳ Backend implementation (all backend tasks)

## Overview

This document breaks down the implementation of the Personal Financial Analysis System into actionable tasks. The system enables users to conduct a complete financial health assessment through a 4-step workflow: cash flow survey, financial analysis, asset restructuring, and financial planning.

---

## Database/Data Layer

### Task 1: Create PersonalFinancialAnalysis Entity (High Priority)
- [ ] Create `PersonalFinancialAnalysis` entity class in `backend/src/modules/personal-financial-analysis/entities/personal-financial-analysis.entity.ts`
    - [ ] Add TypeORM decorators (@Entity, @PrimaryGeneratedColumn)
    - [ ] Define basic properties (id, accountId, name, analysisDate, baseCurrency, status, isActive, createdAt, updatedAt)
    - [ ] Add JSONB properties (assets, income, expenses, debts, summaryMetrics, incomeExpenseBreakdown, scenarios)
    - [ ] Add array property (linkedPortfolioIds: uuid[])
    - [ ] Add foreign key to FinancialFreedomPlan (linkedFinancialFreedomPlanId)
    - [ ] Add relationship to Account entity (@ManyToOne)
    - [ ] Add proper column types and constraints (decimal precision, JSONB, array types)
    - [ ] Add indexes for performance (accountId, accountId+isActive, analysisDate, linkedPortfolioIds GIN index)
    - [ ] Add default values where appropriate

### Task 2: Create Database Migration (High Priority)
- [ ] Create migration file `backend/src/migrations/[timestamp]-CreatePersonalFinancialAnalysesTable.ts`
    - [ ] Create `personal_financial_analyses` table with all columns
    - [ ] Add foreign key constraint to `accounts` table
    - [ ] Add foreign key constraint to `financial_freedom_plans` table (nullable)
    - [ ] Create indexes:
        - [ ] Index on `account_id`
        - [ ] Composite index on `(account_id, is_active)`
        - [ ] Index on `analysis_date`
        - [ ] GIN index on `linked_portfolio_ids` array
    - [ ] Add proper rollback functionality in `down()` method
    - [ ] Test migration up and down

### Task 3: Create TypeScript Type Definitions (High Priority)
- [ ] Create type definitions file `frontend/src/types/personalFinancialAnalysis.types.ts`
    - [ ] Define `AnalysisAsset` interface
    - [ ] Define `AnalysisIncome` interface
    - [ ] Define `AnalysisExpense` interface
    - [ ] Define `AnalysisDebt` interface
    - [ ] Define `AnalysisScenario` interface
    - [ ] Define `SummaryMetrics` interface
    - [ ] Define `IncomeExpenseBreakdown` interface
    - [ ] Define `PersonalFinancialAnalysis` interface
    - [ ] Define `CreateAnalysisRequest` interface
    - [ ] Define `UpdateAnalysisRequest` interface
    - [ ] Define `AnalysisResponse` interface
    - [ ] Define enums for categories (AssetCategory, IncomeCategory, ExpenseCategory)

---

## Backend Services

### Task 4: Create Personal Financial Analysis Module Structure (High Priority)
- [ ] Create module directory structure:
    - [ ] `backend/src/modules/personal-financial-analysis/`
    - [ ] `entities/`
    - [ ] `services/`
    - [ ] `controllers/`
    - [ ] `dto/`
    - [ ] `repositories/` (if needed)
- [ ] Create `personal-financial-analysis.module.ts`
    - [ ] Import TypeOrmModule with PersonalFinancialAnalysis entity
    - [ ] Import required modules (PortfolioModule, FinancialFreedomModule, SharedModule)
    - [ ] Register controllers
    - [ ] Register providers (services)
    - [ ] Export services for use in other modules

### Task 5: Create Personal Financial Analysis Service (High Priority)
- [ ] Create `backend/src/modules/personal-financial-analysis/services/personal-financial-analysis.service.ts`
    - [ ] Inject PersonalFinancialAnalysis repository
    - [ ] Inject PortfolioService (forwardRef)
    - [ ] Inject FinancialFreedomPlanService (forwardRef)
    - [ ] Inject PermissionCheckService
    - [ ] Inject PortfolioAnalyticsService
    - [ ] Implement `findAll(accountId: string)` method
    - [ ] Implement `findOne(id: string, accountId: string)` method with access control
    - [ ] Implement `create(createDto: CreateAnalysisDto, accountId: string)` method
    - [ ] Implement `update(id: string, updateDto: UpdateAnalysisDto, accountId: string)` method with access control
    - [ ] Implement `remove(id: string, accountId: string)` method with access control
    - [ ] Add error handling (NotFoundException, ForbiddenException)
    - [ ] Add logging for important operations

### Task 6: Create Portfolio Asset Loading Service (High Priority)
- [ ] Create `backend/src/modules/personal-financial-analysis/services/portfolio-asset-loading.service.ts`
    - [ ] Inject PortfolioService
    - [ ] Inject PortfolioAnalyticsService
    - [ ] Inject PermissionCheckService
    - [ ] Inject CurrencyService (if exists) or implement currency conversion logic
    - [ ] Implement `loadAssetsFromPortfolio(portfolioId: string, baseCurrency: string, accountId: string)` method
        - [ ] Verify portfolio access (VIEW permission or higher)
        - [ ] Get portfolio with assets
        - [ ] Get portfolio analytics for current values
        - [ ] Map portfolio assets to analysis assets
        - [ ] Handle currency conversion if needed
        - [ ] Map asset types to categories (STOCK/BOND → financial, REALESTATE → user choice, etc.)
    - [ ] Add error handling for access denied scenarios
    - [ ] Add logging for asset loading operations

### Task 7: Create Analysis Calculation Service (High Priority)
- [ ] Create `backend/src/modules/personal-financial-analysis/services/analysis-calculation.service.ts`
    - [ ] Implement `calculateSummaryMetrics(analysis: PersonalFinancialAnalysis)` method
        - [ ] Calculate total income by category (family, business, other)
        - [ ] Calculate total expenses by category (living, education, insurance, other)
        - [ ] Calculate total assets by category (consumer, business, financial)
        - [ ] Calculate total debt
        - [ ] Calculate debt-to-asset ratio
        - [ ] Calculate net worth
        - [ ] Calculate emergency fund recommendation (6 months expenses)
    - [ ] Implement `calculateIncomeExpenseBreakdown(analysis: PersonalFinancialAnalysis)` method
        - [ ] Calculate monthly and annual values
        - [ ] Calculate debt payments (principal + interest)
        - [ ] Calculate ratios (debt/income, expense/income, savings/income)
    - [ ] Add validation for division by zero
    - [ ] Use Decimal.js for precise calculations (optional)

### Task 8: Create Scenario Management Service (Medium Priority)
- [ ] Create `backend/src/modules/personal-financial-analysis/services/scenario-management.service.ts`
    - [ ] Implement `createScenario(id: string, scenarioDto: CreateScenarioDto, accountId: string)` method
    - [ ] Implement `updateScenario(id: string, scenarioId: string, scenarioDto: UpdateScenarioDto, accountId: string)` method
    - [ ] Implement `deleteScenario(id: string, scenarioId: string, accountId: string)` method
    - [ ] Implement `duplicateScenario(id: string, scenarioId: string, accountId: string)` method
    - [ ] Add validation to ensure scenario belongs to analysis
    - [ ] Add access control checks
    - [ ] Add error handling

### Task 9: Integrate Services into Main Service (High Priority)
- [ ] Update `PersonalFinancialAnalysisService` to use helper services
    - [ ] Inject PortfolioAssetLoadingService
    - [ ] Inject AnalysisCalculationService
    - [ ] Inject ScenarioManagementService
    - [ ] Update `linkPortfolio()` method to use PortfolioAssetLoadingService
    - [ ] Update `unlinkPortfolio()` method
    - [ ] Add methods for scenario management (delegate to ScenarioManagementService)
    - [ ] Add `linkFinancialFreedomPlan()` method
    - [ ] Add `unlinkFinancialFreedomPlan()` method
    - [ ] Add `calculateMetrics()` method (delegate to AnalysisCalculationService)

---

## API Layer

### Task 10: Create DTOs (High Priority)
- [ ] Create `backend/src/modules/personal-financial-analysis/dto/create-analysis.dto.ts`
    - [ ] Define CreateAnalysisDto class with validation decorators
    - [ ] Add optional name field with @IsOptional, @IsString, @MaxLength(255)
    - [ ] Add optional analysisDate field with @IsOptional, @IsDateString
    - [ ] Add optional baseCurrency field
    - [ ] Add optional arrays for assets, income, expenses, debts with @IsArray, @ValidateNested
    - [ ] Create nested DTOs: AssetDto, IncomeDto, ExpenseDto, DebtDto
- [ ] Create `backend/src/modules/personal-financial-analysis/dto/update-analysis.dto.ts`
    - [ ] Extend PartialType(CreateAnalysisDto)
    - [ ] Add validation decorators
- [ ] Create `backend/src/modules/personal-financial-analysis/dto/analysis-response.dto.ts`
    - [ ] Define AnalysisResponseDto class
    - [ ] Map all entity fields to DTO
    - [ ] Add @ApiProperty decorators for Swagger documentation
- [ ] Create `backend/src/modules/personal-financial-analysis/dto/link-portfolio.dto.ts`
    - [ ] Define LinkPortfolioDto with @IsUUID validation
- [ ] Create `backend/src/modules/personal-financial-analysis/dto/create-scenario.dto.ts`
    - [ ] Define CreateScenarioDto with name, description, and data arrays
- [ ] Create `backend/src/modules/personal-financial-analysis/dto/update-scenario.dto.ts`
    - [ ] Define UpdateScenarioDto
- [ ] Create `backend/src/modules/personal-financial-analysis/dto/link-plan.dto.ts`
    - [ ] Define LinkPlanDto with planId
- [ ] Create `backend/src/modules/personal-financial-analysis/dto/summary-metrics.dto.ts`
    - [ ] Define SummaryMetricsDto for metrics response

### Task 11: Create Personal Financial Analysis Controller (High Priority)
- [ ] Create `backend/src/modules/personal-financial-analysis/controllers/personal-financial-analysis.controller.ts`
    - [ ] Add @Controller decorator with route prefix
    - [ ] Add @UseGuards(JwtAuthGuard) for authentication
    - [ ] Add @ApiTags for Swagger documentation
    - [ ] Inject PersonalFinancialAnalysisService
    - [ ] Implement GET `/api/v1/personal-financial-analysis` endpoint
        - [ ] Get all analyses for current user
        - [ ] Add @Get() decorator
        - [ ] Add @CurrentUser() decorator
        - [ ] Add Swagger documentation
    - [ ] Implement GET `/api/v1/personal-financial-analysis/:id` endpoint
        - [ ] Get analysis by ID with access control
        - [ ] Add @Get(':id') decorator
        - [ ] Add @Param('id') decorator
        - [ ] Add error handling
    - [ ] Implement POST `/api/v1/personal-financial-analysis` endpoint
        - [ ] Create new analysis
        - [ ] Add @Post() decorator
        - [ ] Add @Body() decorator with CreateAnalysisDto
        - [ ] Add validation
    - [ ] Implement PUT `/api/v1/personal-financial-analysis/:id` endpoint
        - [ ] Update analysis with access control
        - [ ] Add @Put(':id') decorator
        - [ ] Add @Body() decorator with UpdateAnalysisDto
    - [ ] Implement DELETE `/api/v1/personal-financial-analysis/:id` endpoint
        - [ ] Delete analysis with access control
        - [ ] Add @Delete(':id') decorator
    - [ ] Implement POST `/api/v1/personal-financial-analysis/:id/link-portfolio` endpoint
        - [ ] Link portfolio and load assets
        - [ ] Add @Post(':id/link-portfolio') decorator
        - [ ] Add @Body() decorator with LinkPortfolioDto
    - [ ] Implement DELETE `/api/v1/personal-financial-analysis/:id/unlink-portfolio/:portfolioId` endpoint
        - [ ] Unlink portfolio
        - [ ] Add @Delete(':id/unlink-portfolio/:portfolioId') decorator
    - [ ] Implement POST `/api/v1/personal-financial-analysis/:id/scenarios` endpoint
        - [ ] Create new scenario
        - [ ] Add @Post(':id/scenarios') decorator
    - [ ] Implement PUT `/api/v1/personal-financial-analysis/:id/scenarios/:scenarioId` endpoint
        - [ ] Update scenario
        - [ ] Add @Put(':id/scenarios/:scenarioId') decorator
    - [ ] Implement DELETE `/api/v1/personal-financial-analysis/:id/scenarios/:scenarioId` endpoint
        - [ ] Delete scenario
        - [ ] Add @Delete(':id/scenarios/:scenarioId') decorator
    - [ ] Implement POST `/api/v1/personal-financial-analysis/:id/link-plan` endpoint
        - [ ] Link Financial Freedom Plan
        - [ ] Add @Post(':id/link-plan') decorator
    - [ ] Implement DELETE `/api/v1/personal-financial-analysis/:id/unlink-plan` endpoint
        - [ ] Unlink Financial Freedom Plan
        - [ ] Add @Delete(':id/unlink-plan') decorator
    - [ ] Implement GET `/api/v1/personal-financial-analysis/:id/calculate-metrics` endpoint
        - [ ] Calculate and return summary metrics
        - [ ] Add @Get(':id/calculate-metrics') decorator
    - [ ] Add comprehensive Swagger documentation for all endpoints
    - [ ] Add proper error responses documentation

---

## Frontend/UI

### Task 12: Create Frontend Type Definitions (High Priority) ✅ COMPLETED
- [x] Create `frontend/src/types/personalFinancialAnalysis.types.ts`
    - [x] Export all types from backend types (if shared)
    - [x] Add frontend-specific types if needed
    - [x] Add form data types
    - [x] Add component prop types

### Task 13: Create API Service (High Priority) ✅ COMPLETED (with mock data)
- [x] Create `frontend/src/services/api.personal-financial-analysis.ts`
    - [x] Import axios or fetch utility
    - [x] Implement `getAllAnalyses()` method
    - [x] Implement `getAnalysisById(id: string)` method
    - [x] Implement `createAnalysis(data: CreateAnalysisRequest)` method
    - [x] Implement `updateAnalysis(id: string, data: UpdateAnalysisRequest)` method
    - [x] Implement `deleteAnalysis(id: string)` method
    - [x] Implement `linkPortfolio(analysisId: string, portfolioId: string)` method
    - [x] Implement `unlinkPortfolio(analysisId: string, portfolioId: string)` method
    - [x] Implement `createScenario(analysisId: string, scenario: CreateScenarioRequest)` method
    - [x] Implement `updateScenario(analysisId: string, scenarioId: string, scenario: UpdateScenarioRequest)` method
    - [x] Implement `deleteScenario(analysisId: string, scenarioId: string)` method
    - [x] Implement `linkPlan(analysisId: string, planId: string)` method
    - [x] Implement `unlinkPlan(analysisId: string)` method
    - [x] Implement `calculateMetrics(analysisId: string)` method
    - [x] Add error handling for all methods
    - [x] Add TypeScript types for all requests and responses
    - **Note**: Currently using mock data (`USE_MOCK_DATA = true`) for UI review. Switch to real API when backend is ready.

### Task 14: Create React Hooks (High Priority) ✅ COMPLETED
- [x] Create `frontend/src/hooks/usePersonalFinancialAnalysis.ts`
    - [x] Use React Query for data fetching
    - [x] Implement `useAnalyses()` hook for listing analyses
    - [x] Implement `useAnalysis(id: string)` hook for single analysis
    - [x] Implement `useCreateAnalysis()` mutation hook
    - [x] Implement `useUpdateAnalysis()` mutation hook
    - [x] Implement `useDeleteAnalysis()` mutation hook
    - [x] Add proper query invalidation
    - [x] Add error handling
    - [x] Implement `useLinkPortfolio()` mutation hook
    - [x] Implement `useUnlinkPortfolio()` mutation hook
    - [x] Implement `useCreateScenario()` mutation hook
    - [x] Implement `useUpdateScenario()` mutation hook
    - [x] Implement `useDeleteScenario()` mutation hook
    - [x] Implement `useLinkPlan()` mutation hook
    - [x] Implement `useUnlinkPlan()` mutation hook
    - [x] Implement `useCalculateMetrics()` query hook
- [x] Create `frontend/src/hooks/useAnalysisCalculations.ts`
    - [x] Implement calculation utilities
    - [x] Export `useSummaryMetrics()` hook
    - [x] Export `useIncomeExpenseBreakdown()` hook
    - [x] Export `useScenarioMetrics()` hook
    - [x] Export `useScenarioBreakdown()` hook
    - [x] Use useMemo for performance optimization

### Task 15: Create Calculation Utilities (High Priority) ✅ COMPLETED
- [x] Create `frontend/src/utils/personalFinancialAnalysisCalculations.ts`
    - [x] Implement `calculateSummaryMetrics(data)` function
        - [x] Calculate total income by category
        - [x] Calculate total expenses by category
        - [x] Calculate total assets by category
        - [x] Calculate total debt
        - [x] Calculate debt-to-asset ratio
        - [x] Calculate net worth
        - [x] Calculate emergency fund recommendation
    - [x] Implement `calculateIncomeExpenseBreakdown(data)` function
        - [x] Calculate monthly and annual values
        - [x] Calculate debt payments
        - [x] Calculate ratios
    - [x] Add input validation
    - [x] Handle edge cases (division by zero, empty arrays)
    - [x] Add JSDoc comments
    - [x] Implement `calculateScenarioMetrics()` function
    - [x] Implement `calculateScenarioBreakdown()` function

### Task 16: Create Main Page Component (High Priority) ✅ COMPLETED
- [x] Create `frontend/src/pages/PersonalFinancialAnalysis.tsx`
    - [x] Display list of analyses in table/card layout
    - [x] Add "Create New Analysis" button
    - [x] Add analysis detail modal or navigation (via wizard)
    - [x] Add delete functionality with confirmation
    - [ ] Add filtering and sorting (TODO: Future enhancement)
    - [x] Use ResponsiveTable component for consistency
    - [x] Add loading and error states
    - [x] Add empty state when no analyses exist
    - [x] Add action menu (Edit/Delete)
    - [x] Display summary metrics in table (Total Assets, Total Debt, Net Worth, Status)

### Task 17: Create 4-Step Wizard Component (High Priority) ✅ COMPLETED
- [x] Create `frontend/src/pages/PersonalFinancialAnalysisWizard.tsx` (converted from modal to full-page)
    - [x] Use Material-UI Tabs component (replaced Stepper)
    - [x] Implement 4 steps as tabs: Cash Flow Survey, Financial Analysis, Asset Restructuring, Financial Planning
    - [x] Add state management for all steps
    - [x] Implement tab navigation
    - [x] Add auto-save on tab change
    - [x] Add sticky tabs with position: sticky
    - [x] Add name input field in header (replaces static title)
    - [x] Add Save button in header
    - [x] Add Back button navigation
    - [x] Handle loading and error states
    - [x] Integrate with React Query for data persistence
    - [x] Support edit mode (with route parameter :id)
    - [x] Add background for tab content
    - [x] Match HTML structure with other pages (/plans)

### Task 18: Create Step 1 - Cash Flow Survey Component (High Priority) ✅ COMPLETED
- [x] Create `frontend/src/components/PersonalFinancialAnalysis/Step1CashFlowSurvey.tsx`
    - [x] Create PortfolioLinkingSection component
        - [x] Display linked portfolios as chips
        - [x] Add "Link Portfolio" button
        - [x] Integrate PortfolioSelectorModal (Task 22)
        - [x] Display portfolio-loaded assets with badge/icon
        - [x] Add unlink portfolio functionality
    - [x] Create AssetManagementSection component
        - [x] Display assets in Material-UI Table (table layout)
        - [x] Add "Add Asset" button
        - [x] Implement inline editing within table cells
        - [x] Show portfolio badge for portfolio-loaded assets
        - [x] Add category dropdown (4 categories: Consumer, Business, Financial, Real Estate)
        - [x] Use MoneyInput component for value input
        - [x] Display total assets row
        - [x] Add empty state message
        - [x] Add Asset Layer column for pyramid chart categorization
        - [x] Add Emergency Fund checkbox column
        - [x] Add minWidth for all table columns for layout stability
        - [x] Wrap in Accordion with collapse/expand functionality (default collapsed)
        - [x] Add tooltip to section header indicating "Click to expand/collapse"
        - [x] Auto-expand section when "Add" button is clicked
        - [x] Fix border styling (remove overlapping borders, add missing top borders)
    - [x] Create IncomeManagementSection component
        - [x] Display income entries in Material-UI Table (table layout)
        - [x] Add "Add Income" button
        - [x] Implement inline editing within table cells
        - [x] Add category dropdown
        - [x] Use MoneyInput component for monthly value
        - [x] Display annual total row
        - [x] Add empty state message
        - [x] Wrap in Accordion with collapse/expand functionality (default collapsed)
        - [x] Add tooltip to section header
        - [x] Auto-expand section when "Add" button is clicked
    - [x] Create ExpenseManagementSection component
        - [x] Display expense entries in Material-UI Table (table layout)
        - [x] Add "Add Expense" button
        - [x] Implement inline editing within table cells
        - [x] Add category dropdown
        - [x] Use MoneyInput component for monthly value
        - [x] Display annual total row
        - [x] Add empty state message
        - [x] Wrap in Accordion with collapse/expand functionality (default collapsed)
        - [x] Add tooltip to section header
        - [x] Auto-expand section when "Add" button is clicked
    - [x] Create DebtManagementSection component
        - [x] Display debt entries in Material-UI Table (table layout)
        - [x] Add "Add Debt" button
        - [x] Implement inline editing within table cells
        - [x] Add all debt fields (name, principal, interest rate, term, monthly payment, remaining balance)
        - [x] Use MoneyInput for amounts, NumberInput for rates/terms
        - [x] Display annual debt payments row
        - [x] Add empty state message
        - [x] Wrap in Accordion with collapse/expand functionality (default collapsed)
        - [x] Add tooltip to section header
        - [x] Auto-expand section when "Add" button is clicked
    - [x] Performance optimizations ✅ COMPLETED
        - [x] Implemented React.memo for individual table row components (AssetRow, IncomeRow, ExpenseRow, DebtRow)
        - [x] Changed name field update logic to only update on blur (onBlur) instead of onChange
        - [x] Used useCallback for event handlers to prevent unnecessary re-renders
        - [x] Used useMemo for calculations (totals) to re-calculate only when dependencies change
    - [x] Add real-time totals calculation
    - [x] Add responsive design for mobile/tablet/desktop
    - [x] Use common components (MoneyInput, NumberInput, format.ts) for consistency
    - [x] Hide input labels for inline table editing

### Task 19: Create Step 2 - Financial Analysis Component (High Priority) ✅ COMPLETED
- [x] Create `frontend/src/components/PersonalFinancialAnalysis/Step2FinancialAnalysis.tsx`
    - [x] Create SummaryMetricsCards component
        - [x] Display all summary metrics in card layout
        - [x] Use Material-UI Card component
        - [x] Add currency formatting
        - [x] Highlight key metrics (Net Worth, Debt-to-Asset Ratio)
        - [x] Align labels with icons for better visual consistency
        - [ ] Add warning indicators for unhealthy metrics (TODO: Future enhancement)
    - [x] Create IncomeExpenseTable component
        - [x] Display income and expense breakdown in table
        - [x] Show monthly and annual values
        - [x] Display ratios with 1 decimal place
        - [x] Use Material-UI Card and Grid layout
        - [x] Add responsive design
        - [x] Add collapse/expand functionality for category breakdowns
        - [x] Display detailed breakdowns from Step 1 data
    - [x] Create BalanceSheetChart component ✅ COMPLETED
        - [x] Custom SVG-based flow chart implementation
        - [x] Display income, expenses, savings blocks
        - [x] Show assets (investment, consumer) and liabilities (debt, net assets)
        - [x] Show emergency fund as progress bar (current vs recommended)
        - [x] Dynamic block sizing based on percentages and values
        - [x] Responsive design with ResizeObserver
        - [x] Handle negative savings (deficit) scenario
        - [x] Use monthly values for all calculations
    - [x] Create AssetPyramidChart component ✅ COMPLETED
        - [x] Custom pyramid chart with trapezoidal/triangular shapes
        - [x] Display 4-layer pyramid (Risk, Growth, Income Generation, Protection)
        - [x] Show percentages and values
        - [x] Summary tooltip for entire chart area
        - [x] Color coding for layers
        - [x] Asset layer categorization logic implemented
    - [x] Create AssetStructureChart component ✅ COMPLETED
        - [x] Recharts DonutChart implementation
        - [x] Display 4 asset categories (Consumer, Business, Financial, Real Estate)
        - [x] Show percentages and absolute values
        - [x] Interactive tooltips
        - [x] Color coding
    - [x] Create IncomeByCategoryChart component ✅ COMPLETED
        - [x] Recharts PieChart implementation
        - [x] Display income breakdown by category
        - [x] Interactive tooltips and legend
    - [x] Create ExpenseByCategoryChart component ✅ COMPLETED
        - [x] Recharts PieChart implementation
        - [x] Display expense breakdown by category
        - [x] Interactive tooltips and legend
    - [x] Add Notes text box ✅ COMPLETED
        - [x] Resizable textarea for analysis notes
        - [x] Auto-save functionality
        - [x] Multi-language support
    - [x] Add loading states for calculations (via hooks)
    - [x] Add error handling for calculations
    - [x] Two-column layout for optimal space usage
    - [x] Professional layout with cards, icons, and color coding

### Task 20: Create Step 3 - Asset Restructuring Component (Medium Priority) ✅ COMPLETED
- [x] Create `frontend/src/components/PersonalFinancialAnalysis/Step3AssetRestructuring.tsx`
    - [x] Create ScenarioManagement component
        - [x] Display scenario dropdown/selector
        - [x] Add "Create Scenario" button
        - [x] Add scenario name and description inputs
        - [x] Implement scenario CRUD operations (create, update, delete)
        - [x] Add duplicate scenario functionality
        - [x] Show "Current" scenario (read-only)
        - [x] Auto-create and auto-select scenario when Step 3 is opened with only "current" scenario
    - [x] Create ScenarioComparison component
        - [x] Display side-by-side comparison with professional card-based layout
        - [x] Show "Current" vs selected scenario
        - [x] Display key metrics for comparison (Total Assets, Total Debt, Net Worth, Debt-to-Asset Ratio)
        - [x] Add visual indicators for metric differences (arrows, colors, percentages)
        - [x] Implement inline editing for scenario name and description (TextField-based)
        - [x] Always display comparison layout (show only current scenario when no scenario selected)
        - [x] Optimized padding and spacing for better visual hierarchy
    - [x] Reuse Step1CashFlowSurvey components for scenario data editing ✅ COMPLETED
        - [x] Allow editing assets, income, expenses, debts within scenario via modal
        - [x] Isolate changes to selected scenario
        - [x] Added "Edit Data" button with modal wrapper
        - [x] Sections default to collapsed state
    - [x] Add chart comparison section ✅ COMPLETED
        - [x] Display BalanceSheetChart comparison (current vs selected scenario)
        - [x] Display AssetPyramidChart comparison (current vs selected scenario)
        - [x] Always show current scenario charts, conditionally show selected scenario charts
    - [x] Add scenario switching functionality
    - [x] Add data persistence for scenarios (via API hooks)
- [ ] Create SystemSuggestions component (Optional - Low Priority)
    - [ ] Display optional suggestions card
    - [ ] Show debt consolidation recommendations
    - [ ] Show emergency fund recommendations
    - [ ] Show asset allocation suggestions
    - [ ] Show expense reduction opportunities
    - [ ] Add "Accept", "Modify", "Ignore" buttons
    - [ ] Mark suggestions as recommendations only

### Task 21: Create Step 4 - Financial Planning Component (High Priority) ✅ PARTIALLY COMPLETED
- [x] Create `frontend/src/components/PersonalFinancialAnalysis/Step4FinancialPlanning.tsx`
    - [x] Create FinancialFreedomPlanIntegration component
        - [x] Display linked plan status if plan is linked
        - [x] Add "Create New Plan" button
        - [x] Add "Link Existing Plan" button
        - [x] Add "Unlink Plan" button
        - [ ] Show plan progress if linked (TODO: Future enhancement)
    - [ ] Create PlanSelectionModal component (TODO: Future enhancement)
        - [ ] Display list of available Financial Freedom Plans
        - [ ] Add plan selection functionality
        - [ ] Show plan details in modal
    - [ ] Integrate with Financial Freedom Planning Wizard (TODO: Future enhancement)
        - [ ] Open FinancialFreedomWizard when "Create New Plan" is clicked
        - [ ] Pre-fill wizard data from analysis:
            - [ ] Initial investment from total financial assets
            - [ ] Monthly contribution from remaining savings
            - [ ] Target amount based on current expenses
        - [ ] Handle plan creation callback
        - [ ] Auto-link created plan to analysis
    - [ ] Add data calculation for pre-fill (TODO: Future enhancement)
    - [x] Add loading and error states (basic implementation)

### Task 22: Create Portfolio Linking Components (High Priority) ✅ COMPLETED
- [x] Create `frontend/src/components/PersonalFinancialAnalysis/PortfolioSelectorModal.tsx`
    - [x] Fetch accessible portfolios using usePortfolios hook
    - [x] Display portfolio list with selection
    - [x] Show portfolio details (name, total value)
    - [x] Add portfolio selection with visual feedback
    - [x] Handle loading states
    - [x] Handle empty state (no available portfolios)
    - [x] Integrate with Step1CashFlowSurvey for linking
- [x] Portfolio linking integrated in Step1CashFlowSurvey
    - [x] Display linked portfolios as chips
    - [x] Add unlink portfolio functionality
    - [x] Show portfolio-loaded assets with visual distinction
    - [x] Handle loading states during asset loading

### Task 23: Add Navigation and Routing (High Priority) ✅ COMPLETED
- [x] Update `frontend/src/App.tsx`
    - [x] Add route for `/personal-financial-analysis`
    - [ ] Add route for `/personal-financial-analysis/:id` (not needed - using wizard modal)
- [x] Update `frontend/src/components/Layout/AppLayout.tsx`
    - [x] Add "Personal Financial Analysis" menu item in "Investor" section
    - [x] Add appropriate icon (Assessment/ReportsIcon)
    - [x] Add translation keys for menu item
- [x] Update translation files
    - [x] Add keys to `frontend/src/i18n/locales/en.json`
    - [x] Add keys to `frontend/src/i18n/locales/vi.json`
    - [x] Add all component translation keys (title, subtitle, steps, table headers, form labels, etc.)

---

## Integration

### Task 24: Integrate with Portfolio Service (High Priority)
- [ ] Update PersonalFinancialAnalysisService
    - [ ] Verify PortfolioService is properly injected
    - [ ] Test portfolio access verification
    - [ ] Test portfolio asset loading
    - [ ] Handle currency conversion if portfolios use different currency
- [ ] Update PortfolioAssetLoadingService
    - [ ] Integrate with PortfolioAnalyticsService for asset values
    - [ ] Integrate with PermissionCheckService for access control
    - [ ] Test asset type to category mapping

### Task 25: Integrate with Financial Freedom Planning System (High Priority)
- [ ] Update PersonalFinancialAnalysisService
    - [ ] Verify FinancialFreedomPlanService is properly injected
    - [ ] Test plan linking functionality
    - [ ] Test plan unlinking functionality
    - [ ] Verify plan belongs to same account
- [ ] Update Step4FinancialPlanning component
    - [ ] Integrate with FinancialFreedomWizard component
    - [ ] Test pre-fill data calculation
    - [ ] Test plan creation and linking flow

### Task 26: Integrate with AccountContext (High Priority)
- [ ] Update all frontend components
    - [ ] Use baseCurrency from AccountContext
    - [ ] Use accountId from AccountContext
    - [ ] Format all currency values using baseCurrency
    - [ ] Ensure accountId is passed to all API calls

---

## Testing

### Task 27: Backend Unit Tests (High Priority)
- [ ] Create `backend/src/modules/personal-financial-analysis/services/personal-financial-analysis.service.spec.ts`
    - [ ] Test `findAll()` method
    - [ ] Test `findOne()` method with access control
    - [ ] Test `create()` method
    - [ ] Test `update()` method with access control
    - [ ] Test `remove()` method with access control
    - [ ] Test error scenarios (not found, forbidden)
- [ ] Create `backend/src/modules/personal-financial-analysis/services/portfolio-asset-loading.service.spec.ts`
    - [ ] Test `loadAssetsFromPortfolio()` method
    - [ ] Test portfolio access verification
    - [ ] Test asset type to category mapping
    - [ ] Test currency conversion
    - [ ] Test error scenarios
- [ ] Create `backend/src/modules/personal-financial-analysis/services/analysis-calculation.service.spec.ts`
    - [ ] Test `calculateSummaryMetrics()` method
    - [ ] Test `calculateIncomeExpenseBreakdown()` method
    - [ ] Test edge cases (empty data, division by zero)
    - [ ] Test calculation accuracy
- [ ] Create `backend/src/modules/personal-financial-analysis/controllers/personal-financial-analysis.controller.spec.ts`
    - [ ] Test all endpoints
    - [ ] Test authentication requirements
    - [ ] Test authorization scenarios
    - [ ] Test request/response validation

### Task 28: Backend Integration Tests (Medium Priority)
- [ ] Create integration test file for portfolio linking
    - [ ] Test portfolio linking end-to-end
    - [ ] Test asset loading from portfolio
    - [ ] Test currency conversion
    - [ ] Test access control
- [ ] Create integration test file for scenario management
    - [ ] Test scenario creation
    - [ ] Test scenario update
    - [ ] Test scenario deletion
    - [ ] Test scenario duplication
- [ ] Create integration test file for Financial Freedom Plan integration
    - [ ] Test plan linking
    - [ ] Test plan unlinking
    - [ ] Test plan validation

### Task 29: Frontend Unit Tests (Medium Priority)
- [ ] Create tests for calculation utilities
    - [ ] Test `calculateSummaryMetrics()` function
    - [ ] Test `calculateIncomeExpenseBreakdown()` function
    - [ ] Test edge cases
- [ ] Create tests for React hooks
    - [ ] Test `useAnalyses()` hook
    - [ ] Test `useAnalysis()` hook
    - [ ] Test mutation hooks
- [ ] Create component tests
    - [ ] Test Step1CashFlowSurvey component
    - [ ] Test SummaryMetricsCards component
    - [ ] Test chart components (mock Recharts)

### Task 30: E2E Tests (Low Priority)
- [ ] Create E2E test for complete wizard flow
    - [ ] Test creating new analysis
    - [ ] Test completing all 4 steps
    - [ ] Test data persistence
- [ ] Create E2E test for portfolio linking
    - [ ] Test linking portfolio
    - [ ] Test asset loading
    - [ ] Test unlinking portfolio
- [ ] Create E2E test for scenario management
    - [ ] Test creating scenario
    - [ ] Test comparing scenarios
    - [ ] Test deleting scenario

---

## Documentation

### Task 31: API Documentation (High Priority)
- [ ] Add Swagger/OpenAPI documentation for all endpoints
    - [ ] Document request/response schemas
    - [ ] Add example requests and responses
    - [ ] Document error responses
    - [ ] Document authentication requirements
- [ ] Update API documentation with Personal Financial Analysis endpoints

### Task 32: Code Documentation (Medium Priority)
- [ ] Add JSDoc comments to all service methods
- [ ] Add JSDoc comments to all controller endpoints
- [ ] Add inline comments for complex logic
- [ ] Document calculation formulas
- [ ] Document asset type to category mapping rules

### Task 33: User Documentation (Low Priority)
- [ ] Create user guide for Personal Financial Analysis feature
    - [ ] Document 4-step workflow
    - [ ] Document portfolio linking
    - [ ] Document scenario management
    - [ ] Document Financial Freedom Plan integration
- [ ] Add tooltips and help text in UI components
- [ ] Create FAQ section

---

## Security & Performance

### Task 34: Security Implementation (High Priority)
- [ ] Verify all endpoints require authentication
    - [ ] Test with missing JWT token
    - [ ] Test with invalid JWT token
- [ ] Verify data access control
    - [ ] Test users can only access their own analyses
    - [ ] Test portfolio access verification
    - [ ] Test plan access verification
- [ ] Verify input validation
    - [ ] Test all DTO validations
    - [ ] Test monetary value validations
    - [ ] Test percentage validations
- [ ] Verify SQL injection prevention
    - [ ] Review all database queries
    - [ ] Ensure parameterized queries are used

### Task 35: Performance Optimization (Medium Priority)
- [ ] Optimize database queries
    - [ ] Verify indexes are used
    - [ ] Test query performance with large datasets
    - [ ] Add query optimization if needed
- [ ] Optimize frontend calculations
    - [ ] Use useMemo for expensive calculations
    - [ ] Debounce auto-save operations
    - [ ] Lazy load chart components
- [ ] Optimize chart rendering
    - [ ] Limit data points for large datasets
    - [ ] Use React.memo for chart components
    - [ ] Test chart rendering performance

### Task 36: Error Handling & Logging (Medium Priority)
- [ ] Add comprehensive error handling
    - [ ] Add try-catch blocks in services
    - [ ] Add error handling in controllers
    - [ ] Add error handling in frontend components
- [ ] Add logging
    - [ ] Log important operations
    - [ ] Log errors with context
    - [ ] Log performance metrics
- [ ] Add user-friendly error messages
    - [ ] Translate error messages
    - [ ] Provide actionable error messages

---

## Deployment & Configuration

### Task 37: Module Registration (High Priority)
- [ ] Register PersonalFinancialAnalysisModule in main AppModule
    - [ ] Add import to `backend/src/app.module.ts`
    - [ ] Verify module dependencies are correct
- [ ] Verify module exports
    - [ ] Export services if needed by other modules
    - [ ] Test module initialization

### Task 38: Environment Configuration (Medium Priority)
- [ ] Review environment variables
    - [ ] Check if any new environment variables are needed
    - [ ] Document environment variables
- [ ] Update docker-compose.yml if needed
- [ ] Update deployment documentation

---

## Quality Assurance

### Task 39: Code Review Checklist (High Priority)
- [ ] Review all code for:
    - [ ] Code style consistency
    - [ ] TypeScript type safety
    - [ ] Error handling completeness
    - [ ] Security best practices
    - [ ] Performance considerations
    - [ ] Documentation completeness

### Task 40: Manual Testing (High Priority)
- [ ] Test complete 4-step wizard flow
- [ ] Test portfolio linking and asset loading
- [ ] Test scenario creation and comparison
- [ ] Test Financial Freedom Plan integration
- [ ] Test data persistence (save/load)
- [ ] Test responsive design (mobile/tablet/desktop)
- [ ] Test multi-language support
- [ ] Test error scenarios
- [ ] Test edge cases (empty data, large datasets)

---

## Summary

**Total Tasks**: 40 tasks
**High Priority**: 28 tasks
**Medium Priority**: 9 tasks
**Low Priority**: 3 tasks

**Estimated Timeline**:
- Phase 1: Backend Foundation (Tasks 1-11) - 2 weeks
- Phase 2: Frontend Page 1 & 2 (Tasks 12-19) - 2 weeks
- Phase 3: Frontend Page 3 & 4 (Tasks 20-23) - 1.5 weeks
- Phase 4: Integration & Testing (Tasks 24-30) - 1 week
- Phase 5: Polish & Deployment (Tasks 31-40) - 0.5 weeks

**Total Estimated Time**: 7 weeks

---

**End of Document**

