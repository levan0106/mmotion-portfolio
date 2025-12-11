# CR-009: Financial Freedom Planning System - Task Breakdown

## Document Information
- **Document ID**: CR-009-TASK
- **Feature Name**: Financial Freedom Planning System
- **Version**: 1.1
- **Date**: December 2024
- **Author**: Development Team
- **Status**: In Progress
- **Related PRD**: CR-009-PRD-Financial-Freedom-Planning
- **Related TDD**: CR-009-TDD-Financial-Freedom-Planning

## Overview

This document breaks down the implementation of the Financial Freedom Planning System into actionable tasks. The system enables users to plan their path to financial freedom through a 3-step workflow with flexible calculation engine, asset allocation suggestions, and consolidated plan overview.

---

## Database/Data Layer

### Task 1: Create FinancialFreedomPlan Entity (High Priority) ✅ COMPLETED
- [x] Create `FinancialFreedomPlan` entity class in `backend/src/modules/financial-freedom/entities/financial-freedom-plan.entity.ts`
    - [x] Add TypeORM decorators (@Entity, @PrimaryGeneratedColumn)
    - [x] Define basic properties (id, accountId, name, createdAt, updatedAt, isActive)
    - [x] Add Step 1 properties (targetPresentValue, futureValueRequired, initialInvestment, periodicPayment, paymentFrequency, paymentType, investmentYears, requiredReturnRate, inflationRate, riskTolerance)
    - [x] Add Step 2 properties (suggestedAllocation as JSONB)
    - [x] Add Step 3 properties (yearlyProjections, scenarios as JSONB)
    - [x] Note: Step 4 has been removed - system now has 3 steps only
    - [x] Add relationship to Account entity (@ManyToOne)
    - [x] Add proper column types and constraints (decimal precision, enum types, JSONB)
    - [x] Add default values where appropriate

### Task 2: Create Database Migration (High Priority) ✅ COMPLETED
- [x] Create migration file `backend/src/migrations/1739000000000-CreateFinancialFreedomPlansTable.ts`
    - [x] Define `financial_freedom_plans` table structure
    - [x] Add all columns with correct types (uuid, decimal, varchar, enum, jsonb, timestamp, boolean)
    - [x] Set up primary key on `id` column
    - [x] Add foreign key constraint on `account_id` referencing `accounts` table with CASCADE delete
    - [x] Create enum types for `payment_frequency` and `payment_type`
    - [x] Create enum type for `risk_tolerance`
    - [x] Create enum type for `plan_status`
    - [x] Add default values for columns (paymentFrequency: 'monthly', paymentType: 'contribution', inflationRate: 4.5, riskTolerance: 'moderate', isActive: true)
    - [x] Add indexes:
        - [x] Index on `account_id` for query performance
        - [x] Index on `is_active` for filtering active plans
        - [x] Composite index on `account_id` and `is_active`
    - [x] Implement `up()` method to create table
    - [x] Implement `down()` method to drop table and enums
    - [ ] Test migration on local database (pending)

### Task 3: Create Repository Interface and Implementation ✅ COMPLETED (Using TypeORM Repository)
- [x] Using TypeORM Repository directly (no custom repository needed)
    - [x] TypeORM Repository provides all required methods (findById, findByAccountId, create, update, delete, findActivePlans)
    - [x] Repository injected via `@InjectRepository()` in service
    - [x] Query optimization handled by TypeORM with indexes

---

## Backend Services

### Task 4: Install and Configure Decimal.js (High Priority) ✅ COMPLETED
- [x] Install `decimal.js` package: `npm install decimal.js` (already in package.json v10.4.0)
- [ ] Install TypeScript types: `npm install --save-dev @types/decimal.js` (pending - may not be needed for v10.4.0)
- [ ] Create utility file for Decimal operations if needed (pending - can be added when calculation service is implemented)

### Task 5: Create Calculation Service - Core Engine (High Priority)
- [ ] Create `FinancialFreedomCalculationService` class in `backend/src/modules/financial-freedom/services/calculation.service.ts`
    - [ ] Add `@Injectable()` decorator
    - [ ] Implement `calculateMissingVariable()` method to detect which variable is missing
    - [ ] Implement `detectMissingVariable()` helper method
    - [ ] Implement `calculateReturnRate()` method using Newton-Raphson
    - [ ] Implement `calculateYears()` method using binary search or Newton-Raphson
    - [ ] Implement `calculatePeriodicPayment()` method
    - [ ] Implement `calculateFutureValue()` method
    - [ ] Implement `calculateInitialInvestment()` method
    - [ ] Implement `futureValueFunction()` helper for FV formula
    - [ ] Implement `futureValueDerivative()` helper for Newton-Raphson
    - [ ] Implement `solveReturnRate()` method using Newton-Raphson algorithm
    - [ ] Implement `getPeriodsPerYear()` helper to convert frequency to periods
    - [ ] Implement `calculateFutureValueWithInflation()` method
    - [ ] Implement `generateWarnings()` method for feasibility checks
    - [ ] Add error handling for edge cases (PMT = 0, initial investment = 0, division by zero)
    - [ ] Add validation for input parameters
    - [ ] Add logging for calculation operations

### Task 6: Create Calculation Service - Target Amount Calculation
- [ ] Implement `calculateTargetFromExpenses()` method
    - [ ] Calculate: `(monthlyExpenses × 12) / withdrawalRate`
    - [ ] Handle default withdrawal rate (4%)
    - [ ] Add validation for inputs
- [ ] Implement `calculateTargetFromDirectInput()` method
- [ ] Implement `calculateFutureValueWithInflation()` method
    - [ ] Formula: `FV = PV × (1 + inflation)^years`
    - [ ] Use Decimal.js for precision

### Task 7: Create Allocation Suggestion Service
- [ ] Create `AllocationSuggestionService` class in `backend/src/modules/financial-freedom/services/allocation-suggestion.service.ts`
    - [ ] Add `@Injectable()` decorator
    - [ ] Inject `AssetAnalyticsService` for current allocation comparison
    - [ ] Implement `suggestAllocation()` method
        - [ ] Get base allocation by risk tolerance
        - [ ] Calculate expected return for base allocation
        - [ ] Adjust allocation if RRR > expected return
    - [ ] Implement `getBaseAllocation()` private method
        - [ ] Define conservative strategy (35% stocks, 45% bonds, 12% gold, 5% real estate, 3% cash)
        - [ ] Define moderate strategy (65% stocks, 25% bonds, 5% gold, 5% real estate, 0% cash)
        - [ ] Define aggressive strategy (75% stocks, 15% bonds, 5% gold, 5% real estate, 0% cash)
    - [ ] Implement `calculateExpectedReturn()` method
        - [ ] Use historical averages: stocks 12%, bonds 6%, gold 5%, real estate 8%, cash 2%
        - [ ] Calculate weighted average return
    - [ ] Implement `adjustForHigherReturn()` method to increase stock allocation if needed
    - [ ] Implement `compareWithCurrentAllocation()` method
        - [ ] Fetch current allocation from portfolio if portfolioId provided
        - [ ] Calculate adjustments needed
        - [ ] Return comparison result with recommendations

### Task 8: Create Consolidation Service
- [ ] Create `ConsolidationService` class in `backend/src/modules/financial-freedom/services/consolidation.service.ts`
    - [ ] Add `@Injectable()` decorator
    - [ ] Inject `FinancialFreedomService` and `GoalsService`
    - [ ] Implement `consolidatePlans()` method
        - [ ] Fetch all plans by IDs
        - [ ] Calculate total target value
        - [ ] Calculate weighted average RRR
        - [ ] Combine allocations (weighted average)
        - [ ] Generate yearly projections for combined plan
        - [ ] Generate scenarios (conservative, moderate, aggressive)
        - [ ] Generate combined milestones
    - [ ] Implement `calculateWeightedAverageRRR()` helper
    - [ ] Implement `combineAllocations()` helper
    - [ ] Implement `generateYearlyProjections()` method
    - [ ] Implement `generateScenarios()` method
    - [ ] Implement `assessRisk()` method for overall risk assessment

### Task 9: Create Progress Tracking Service ✅ COMPLETED
- Progress Tracking has been implemented as a separate feature (not part of wizard workflow)
    - [x] Calculate progress percentage
    - [x] Calculate remaining years
    - [x] Check milestones achievement
    - [x] Generate alerts
    - [x] Implement `getCurrentPortfolioValue()` private method
        - [x] Sum values from all linked portfolios (direct + from goals)
        - [x] Include totalDepositValue in calculation
    - [x] Implement `getActualReturnRate()` private method
        - [x] Calculate weighted average TWR across portfolios
        - [x] Use 1-year TWR for comparison
    - [x] Implement `calculateRemainingYears()` method
    - [x] Implement `checkMilestones()` method
        - [x] Compare current value with milestone targets
        - [x] Mark achieved milestones
    - [x] Implement `generateAlerts()` method
        - [x] Check rebalancing needs (allocation deviation > 5%)
        - [x] Check performance gap (actual vs required return)
        - [x] Check milestone achievements
        - [x] Return alerts with severity levels (Vietnamese messages)
    - [x] Implement `getAllPortfolioIds()` method
        - [x] Combine direct linked portfolios with portfolios from linked goals
        - [x] Use GoalPortfolio repository to fetch portfolios from goals

### Task 10: Create Template Service
- [ ] Create `PlanningTemplateService` class in `backend/src/modules/financial-freedom/services/template.service.ts`
    - [ ] Add `@Injectable()` decorator
    - [ ] Create `FINANCIAL_FREEDOM_TEMPLATES` constant array with 7 templates
        - [ ] Template 1: Savings & Investment
        - [ ] Template 2: Retirement Withdrawal
        - [ ] Template 3: Early Retirement (FIRE)
        - [ ] Template 4: Home Purchase
        - [ ] Template 5: Education Fund
        - [ ] Template 6: Emergency Fund
        - [ ] Template 7: Children's Future Fund
    - [ ] Implement `getTemplates()` method to return all templates
    - [ ] Implement `getTemplateById()` method
    - [ ] Implement `applyTemplate()` method
        - [ ] Apply template defaults to calculation inputs
        - [ ] Allow customizations to override defaults
    - [ ] Implement `calculateTargetFromExpenses()` helper for emergency fund template

### Task 11: Create Main Financial Freedom Service ✅ PARTIALLY COMPLETED
- [x] Create `FinancialFreedomPlanService` class in `backend/src/modules/financial-freedom/services/financial-freedom-plan.service.ts`
    - [x] Add `@Injectable()` decorator
    - [x] Inject TypeORM Repository for `FinancialFreedomPlan`
    - [x] Implement `createPlan()` method
        - [x] Create plan entity
        - [x] Save to database
        - [x] Return created plan
    - [x] Implement `findPlanById()` method
    - [x] Implement `findAllPlans()` method (equivalent to getPlansByAccountId)
    - [x] Implement `updatePlan()` method
    - [x] Implement `deletePlan()` method (soft delete)
    - [x] Implement `duplicatePlan()` method
    - [x] Implement `linkToGoal()` method ✅ COMPLETED
    - [x] Implement `unlinkGoal()` method ✅ COMPLETED
    - [x] Implement `linkToPortfolio()` method ✅ COMPLETED
    - [x] Implement `unlinkPortfolio()` method ✅ COMPLETED
    - [x] Implement `calculateProgress()` method ✅ COMPLETED
    - [ ] Implement `autoCreateGoal()` method (pending - for future integration)
    - Note: Calculation, Allocation, Consolidation services will be added later when needed

### Task 12: Create Financial Freedom Module ✅ COMPLETED
- [x] Create `FinancialFreedomModule` class in `backend/src/modules/financial-freedom/financial-freedom.module.ts`
    - [x] Import TypeOrmModule with FinancialFreedomPlan entity
    - [x] Import required modules (GoalsModule, PortfolioModule, SharedModule) ✅ COMPLETED
    - [x] Import GoalPortfolio entity for repository injection ✅ COMPLETED
    - [x] Add services as providers (FinancialFreedomPlanService)
    - [x] Export services for use in other modules
    - [x] Add module to main AppModule

---

## API Layer

### Task 13: Create DTOs and Validation (High Priority) ✅ PARTIALLY COMPLETED
- [ ] Create `CalculateRequestDto` in `backend/src/modules/financial-freedom/dto/calculate-request.dto.ts` (pending - calculation done on frontend)
- [ ] Create `CalculateResponseDto` in `backend/src/modules/financial-freedom/dto/calculate-response.dto.ts` (pending - calculation done on frontend)
- [ ] Create `SuggestAllocationRequestDto` and `SuggestAllocationResponseDto` (pending)
- [ ] Create `ConsolidateRequestDto` and `ConsolidateResponseDto` (pending - consolidation done on frontend)
    - [x] Create `ProgressResponseDto` ✅ COMPLETED
    - [x] Create `LinkGoalRequestDto` and `LinkPortfolioRequestDto` ✅ COMPLETED
- [x] Create `CreatePlanDto`, `UpdatePlanDto`, `PlanResponseDto` ✅ COMPLETED
    - [x] CreatePlanDto with validation decorators
    - [x] UpdatePlanDto extends PartialType(CreatePlanDto)
    - [x] PlanResponseDto with Swagger documentation
- [ ] Create `TemplateResponseDto` (pending)

### Task 14: Create Financial Freedom Controller (High Priority) ✅ PARTIALLY COMPLETED
- [x] Create `FinancialFreedomController` class in `backend/src/modules/financial-freedom/financial-freedom.controller.ts`
    - [x] Add `@Controller('api/v1/financial-freedom')` decorator
    - [x] Add `@ApiTags('Financial Freedom')` for Swagger
    - [x] Inject `FinancialFreedomPlanService`
    - [ ] Add authentication guard (`@UseGuards(JwtAuthGuard)`) (pending - using accountId query param for now)
    - [ ] Implement `POST /api/v1/financial-freedom/calculate` endpoint (pending - calculation done on frontend)
    - [ ] Implement `POST /api/v1/financial-freedom/suggest-allocation` endpoint (pending)
    - [ ] Implement `POST /api/v1/financial-freedom/consolidate` endpoint (pending - consolidation done on frontend)
    - [ ] Implement `GET /api/v1/financial-freedom/templates` endpoint (pending)
    - [ ] Implement `GET /api/v1/financial-freedom/templates/:id` endpoint (pending)
    - [x] Implement `GET /api/v1/financial-freedom/plans` endpoint ✅ COMPLETED
        - [x] Get accountId from query parameter
        - [x] Return all plans for user
        - [x] Add Swagger documentation
    - [x] Implement `GET /api/v1/financial-freedom/plans/:id` endpoint ✅ COMPLETED
        - [x] Verify plan ownership (via accountId)
        - [x] Return plan by ID
        - [x] Add Swagger documentation
    - [x] Implement `POST /api/v1/financial-freedom/plans` endpoint ✅ COMPLETED
        - [x] Accept `CreatePlanDto`
        - [x] Create plan
        - [x] Return created plan
        - [x] Add Swagger documentation
    - [x] Implement `PUT /api/v1/financial-freedom/plans/:id` endpoint ✅ COMPLETED
        - [x] Verify plan ownership (via accountId)
        - [x] Accept `UpdatePlanDto`
        - [x] Update plan
        - [x] Return updated plan
        - [x] Add Swagger documentation
    - [x] Implement `DELETE /api/v1/financial-freedom/plans/:id` endpoint ✅ COMPLETED
        - [x] Verify plan ownership (via accountId)
        - [x] Delete plan (soft delete)
        - [x] Add Swagger documentation
    - [x] Implement `POST /api/v1/financial-freedom/plans/:id/duplicate` endpoint ✅ COMPLETED
        - [x] Duplicate plan
        - [x] Return duplicated plan
        - [x] Add Swagger documentation
    - [x] Implement `GET /api/v1/financial-freedom/plans/:id/progress` endpoint ✅ COMPLETED
    - [x] Implement `POST /api/v1/financial-freedom/plans/:id/link-goal` endpoint ✅ COMPLETED
    - [x] Implement `POST /api/v1/financial-freedom/plans/:id/unlink-goal` endpoint ✅ COMPLETED
    - [x] Implement `POST /api/v1/financial-freedom/plans/:id/link-portfolio` endpoint ✅ COMPLETED
    - [x] Implement `POST /api/v1/financial-freedom/plans/:id/unlink-portfolio` endpoint ✅ COMPLETED
    - [x] Add proper error handling for all endpoints ✅ COMPLETED
    - [x] Add Swagger/OpenAPI documentation for all endpoints ✅ COMPLETED

---

## Frontend/UI

### Task 15: Create TypeScript Types ✅ COMPLETED
- [x] Create `financialFreedom.types.ts` in `frontend/src/types/financialFreedom.types.ts`
    - [x] Define `CalculationInputs` interface
    - [x] Define `CalculationResult` interface
    - [x] Define `PlanningTemplate` interface
    - [x] Define `FinancialFreedomPlan` interface
    - [x] Define `AllocationSuggestion` interface
    - [x] Define `ConsolidationResult` interface
    - [x] Define `ProgressResult` interface
    - [x] Define `PlanData` interface for wizard state
    - [x] Define all enum types (PaymentFrequency, PaymentType, RiskTolerance, etc.)

### Task 16: Create API Service ✅ COMPLETED
- [x] Create `api.financial-freedom.ts` in `frontend/src/services/api.financial-freedom.ts`
    - [x] Import axios or fetch utility
    - [x] Implement `calculate()` method (with mock data support)
    - [x] Implement `suggestAllocation()` method (with mock data support)
    - [x] Implement `consolidate()` method (with mock data support)
    - [x] Implement `getTemplates()` method (with mock data support)
    - [x] Implement `getTemplateById()` method (with mock data support)
    - [x] Implement `getPlans()` method (with mock data support)
    - [x] Implement `getPlanById()` method (with mock data support)
    - [x] Implement `createPlan()` method (with mock data support)
    - [x] Implement `updatePlan()` method (with mock data support)
    - [x] Implement `deletePlan()` method (with mock data support)
    - [x] Implement `duplicatePlan()` method (with mock data support)
    - [x] Implement `getProgress()` method ✅ COMPLETED
    - [x] Implement `linkGoal()` method ✅ COMPLETED
    - [x] Implement `unlinkGoal()` method ✅ COMPLETED
    - [x] Implement `linkPortfolio()` method ✅ COMPLETED
    - [x] Implement `unlinkPortfolio()` method ✅ COMPLETED
    - [x] Add error handling for all methods
    - [x] Add TypeScript types for all methods
    - [x] Add `USE_MOCK_DATA` flag for frontend development

### Task 17: Create React Hooks ✅ COMPLETED
- [x] Create `useFinancialFreedomPlans.ts` hook in `frontend/src/hooks/useFinancialFreedomPlans.ts`
    - [x] Use React Query for data fetching
    - [x] Implement `useFinancialFreedomPlans()` hook
    - [x] Implement `useFinancialFreedomPlan(id)` hook
    - [x] Implement `useCreateFinancialFreedomPlan()` mutation
    - [x] Implement `useUpdateFinancialFreedomPlan()` mutation
    - [x] Implement `useDeleteFinancialFreedomPlan()` mutation
    - [x] Implement `useDuplicateFinancialFreedomPlan()` mutation
    - [x] Implement `useLinkGoalToPlan()` mutation ✅ COMPLETED
    - [x] Implement `useUnlinkGoalFromPlan()` mutation ✅ COMPLETED
    - [x] Implement `useLinkPortfolioToPlan()` mutation ✅ COMPLETED
    - [x] Implement `useUnlinkPortfolioFromPlan()` mutation ✅ COMPLETED
    - [x] Add proper error handling
    - [x] Auto-invalidate progress query on link/unlink ✅ COMPLETED
- [x] Create `useFinancialFreedomCalculation.ts` hook
    - [x] Implement `useFinancialFreedomCalculation()` mutation
    - [x] Handle loading and error states
- [x] Create `useProgressTracking.ts` hook ✅ COMPLETED
    - [x] Implement `useProgressTracking(planId)` query
    - [x] Set up polling for real-time updates (60s refetch interval)
    - [x] Auto-refresh on link/unlink operations
- [x] Create `usePlanningTemplates.ts` hook
    - [x] Implement `usePlanningTemplates()` query
    - [x] Implement `usePlanningTemplate(id)` query

### Task 18: Create Template Configuration ✅ COMPLETED
- [x] Create `planningTemplates.ts` in `frontend/src/config/planningTemplates.ts`
    - [x] Export `FINANCIAL_FREEDOM_TEMPLATES` constant
    - [x] Define all 7 templates with complete data (Savings & Investment, Retirement Withdrawal, Early Retirement/FIRE, Home Purchase, Education Fund, Emergency Fund, Children's Future Fund)
    - [x] Add TypeScript types
    - [x] Include default values, calculation targets, guidance, and tips for each template

### Task 19: Create Template Selection Components ✅ COMPLETED
- [x] Create `TemplateSelection.tsx` component in `frontend/src/components/FinancialFreedom/TemplateSelection.tsx`
    - [x] Use `usePlanningTemplates()` hook
    - [x] Display templates in grid layout
    - [x] Add template selection handler
    - [x] Add "Skip" button to allow manual entry
    - [x] Add responsive design
    - [x] Add loading and error states
- [x] Create `TemplateCard.tsx` component
    - [x] Display template icon, name, description
    - [x] Show category chip
    - [x] Show which variable will be calculated
    - [x] Add hover effects
    - [x] Make card clickable
    - [x] Add multi-language support

### Task 20: Create Calculation Form Component ✅ COMPLETED
- [x] Create `CalculationForm.tsx` component in `frontend/src/components/FinancialFreedom/CalculationForm.tsx`
    - [x] Create form with all input fields:
        - [x] Target amount (direct input or from expenses)
        - [x] Initial investment
        - [x] Periodic payment
        - [x] Payment frequency (monthly/quarterly/yearly)
        - [x] Payment type (contribution/withdrawal)
        - [x] Investment years
        - [x] Expected return rate
        - [x] Inflation rate
        - [x] Risk tolerance
    - [x] Add form validation
    - [x] Auto-calculation on input change (removed manual "Calculate" button)
    - [x] Use `useFinancialFreedomCalculation()` hook with frontend calculation logic
    - [x] Display calculation results (key-value list layout for optimal space)
    - [x] Display warnings and suggestions
    - [x] Add loading state during calculation
    - [x] Add error handling
    - [x] Support template pre-filling
    - [x] Add responsive design
    - [x] Apply MoneyInput and NumberInput components for better UX
    - [x] Add multi-language support (i18n)
    - [x] Implement 2-column layout (form left, results right) for optimal space usage
    - [x] Key-value list layout for results display
    - [x] Handle paymentType correctly (WITHDRAWAL = negative, CONTRIBUTION = positive)
    - [x] Calculate totalFutureValue when all 4 parameters are provided
    - [x] Default target method set to "direct" (số tiền trực tiếp)
    - [x] Monthly expenses calculation based on totalFutureValue instead of futureValueRequired
    - [x] Frontend calculation engine (moved from backend API to local utility)
    - [x] Always display results section (removed conditional rendering)
    - [x] Display "-" for fields without data (using optional chaining)
    - [x] Chart integration for asset value visualization over time

### Task 21: Create Step 1 Component - Goal Definition ✅ COMPLETED
- [x] Create `Step1GoalDefinition.tsx` component in `frontend/src/components/FinancialFreedom/Step1GoalDefinition.tsx`
    - [x] Show template selection first (if no template selected)
    - [x] Show template info banner if template is selected
    - [x] Integrate `CalculationForm` component
    - [x] Handle template application
    - [x] Store step data in parent wizard state
    - [x] Add "Next" and "Back" buttons
    - [x] Add form validation before proceeding
    - [x] Display calculation results clearly

### Task 22: Create Step 2 Component - Allocation Suggestions ✅ COMPLETED
- [x] Create `Step2AllocationSuggestions.tsx` component in `frontend/src/components/FinancialFreedom/Step2AllocationSuggestions.tsx`
    - [x] Call allocation suggestion API
    - [x] Display suggested allocation using `AllocationChart` component
    - [x] Show expected return
    - [x] Show comparison with current allocation (if portfolio linked)
    - [x] Display recommendations
    - [x] Allow user to accept or modify allocation
    - [x] Store allocation in wizard state
    - [x] Add "Next" and "Back" buttons
    - [x] Fix continuous reload issue (add type="button" to buttons)

### Task 23: Create Step 3 Component - Consolidated Overview ✅ COMPLETED
- [x] Create `Step3ConsolidatedOverview.tsx` component in `frontend/src/components/FinancialFreedom/Step3ConsolidatedOverview.tsx`
    - [x] Call consolidation API (if multiple plans/goals)
    - [x] Display yearly projections chart using `ProgressChart` component
    - [x] Display scenario comparison using `ScenarioComparison` component
    - [x] Show milestones
    - [x] Show risk assessment
    - [x] Display combined allocation
    - [x] Add "Back" button
    - [x] Add "Save Plan" button
    - [x] Remove "Next" button (Step 3 is final step)
    - [x] Fix continuous reload issue (add type="button" to buttons)

### Task 24: ~~Create Step 4 Component - Progress Tracking~~ CANCELLED
- Step 4 has been removed from the workflow. The system now has 3 steps only.

### Task 25: Create Chart Components ✅ COMPLETED
- [x] Create `AllocationChart.tsx` component in `frontend/src/components/FinancialFreedom/AllocationChart.tsx`
    - [x] Use Recharts PieChart
    - [x] Display asset allocation percentages
    - [x] Add labels and tooltips
    - [x] Add legend
    - [x] Add responsive design
- [x] Create `ProgressChart.tsx` component
    - [x] Use Recharts LineChart or AreaChart
    - [x] Display yearly projections
    - [x] Show target vs actual (if available)
    - [x] Add tooltips
    - [x] Add responsive design
- [x] Create `ScenarioComparison.tsx` component
    - [x] Display three scenarios side by side
    - [x] Show final value, years to goal, progress percentage
    - [x] Highlight recommended scenario
    - [x] Add responsive design

### Task 26: Create Main Wizard Component ✅ COMPLETED
- [x] Create `FinancialFreedomWizard.tsx` component in `frontend/src/components/FinancialFreedom/FinancialFreedomWizard.tsx`
    - [x] Use Material-UI Stepper component
    - [x] Manage active step state
    - [x] Manage plan data state across steps
    - [x] Handle template selection
    - [x] Integrate Step 1 component (Step1GoalDefinition)
    - [x] Add placeholders for Steps 2-4
    - [x] Handle step navigation (Next/Back)
    - [x] Handle form submission (ready for backend integration)
    - [x] Add loading states
    - [x] Add error handling

### Task 27: Create Plan Management Components ✅ COMPLETED
- [x] Create `PlanCard.tsx` component in `frontend/src/components/FinancialFreedom/PlanCard.tsx`
    - [x] Display plan name, target value, progress
    - [x] Show plan status
    - [x] Add action buttons (Edit, Delete, View Details)
    - [x] Add progress indicator
    - [x] Add responsive design
- [x] Create plan list view (can be part of main page)
    - [x] Display all plans in grid/list
    - [x] Add "Create New Plan" button
    - [x] Add filtering and sorting
    - [x] Add search functionality

### Task 28: Create Main Financial Freedom Page ✅ COMPLETED (RENAMED to PlansList)
- [x] Create `PlansList.tsx` page in `frontend/src/pages/PlansList.tsx` (renamed from FinancialFreedom.tsx)
    - [x] Add page header with title and description
    - [x] Add "Create New Plan" button
    - [x] Display plan list with comprehensive table
    - [x] Add financial summary section (total initial investment, total periodic payment by currency)
    - [x] Display plan progress, linked items count, completion year
    - [x] Add responsive table with horizontal scrolling
    - [x] Integrate `FinancialFreedomWizard` component
    - [x] Add routing integration (route: `/plans`)
    - [x] Add responsive design
    - [x] Add loading and error states
    - [x] Display startDate and description

### Task 29: Add Navigation and Routing ✅ COMPLETED
- [x] Add Financial Freedom route to router configuration
    - [x] Route: `/plans` (main page - renamed from `/financial-freedom`)
    - [x] Route: `/plans/new` for creating new plan (ready for implementation)
    - [x] Route: `/plans/:id` for viewing plan details (ready for implementation)
    - [x] Route: `/plans/:id/edit` for editing plan (ready for implementation)
- [x] Add navigation menu item
    - [x] Add to main navigation menu (AppLayout)
    - [x] Add appropriate icon (TrendingUp as PlansIcon)
    - [x] Add translation keys (vi.json and en.json)
    - [x] Add help icon button linking to GoalPlanExplanationModal

---

## Integration

### Task 30: Integrate with Goals Management System ✅ COMPLETED
- [x] Add goal linking functionality in `FinancialFreedomPlanService`
    - [x] Verify goal exists and user has access
    - [x] Update plan's linkedGoalIds array
    - [x] Return updated plan
- [x] Add goal unlinking functionality
    - [x] Verify goal is linked to plan
    - [x] Remove goal from linkedGoalIds array
- [x] Add UI for linking goals in plan management ✅ COMPLETED
    - [x] Add goal selection dropdown (PlanLinksSection component)
    - [x] Display linked goals with chips
    - [x] Allow unlinking goals with close icon
    - [x] Auto-refresh plan data after link/unlink
    - [x] Multi-language support

### Task 31: Integrate with Portfolio System ✅ COMPLETED
- [x] Add portfolio linking functionality in `FinancialFreedomPlanService`
    - [x] Verify portfolio access using permission system
    - [x] Update plan's linkedPortfolioIds array
    - [x] Return updated plan
- [x] Add portfolio unlinking functionality
    - [x] Verify portfolio is linked to plan
    - [x] Remove portfolio from linkedPortfolioIds array
- [x] Use `PortfolioValueCalculatorService` for getting portfolio values ✅ COMPLETED
    - [x] Call `calculateAllValues()` method
    - [x] Include `totalDepositValue` from `DepositCalculationService`
    - [x] Handle multiple portfolios (direct + from goals)
    - [x] Combine portfolios from goals with direct linked portfolios
- [x] Add UI for linking portfolios in plan management ✅ COMPLETED
    - [x] Add portfolio selection dropdown (PlanLinksSection component)
    - [x] Display linked portfolios with chips
    - [x] Allow unlinking portfolios with close icon
    - [x] Auto-refresh plan data after link/unlink
    - [x] Multi-language support

### Task 32: Integrate with Asset Analytics Service ✅ COMPLETED
- [x] Use `AssetAnalyticsService` for current allocation comparison
    - [x] Call `calculateAssetAllocation()` method
    - [x] Use `PortfolioCalculationService` to get actual asset values
    - [x] Compare with suggested allocation
    - [x] Calculate adjustments needed
    - [x] Handle portfolios from linked goals
- [x] Display allocation comparison in UI
    - [x] Show current vs suggested allocation charts
    - [x] Highlight differences in deviations table
    - [x] Show rebalancing recommendations
    - [x] Filter out asset types with 0 value
    - [x] Add third tab in PlanDetailModal for allocation comparison
    - [x] Auto-refresh data when tab is clicked

### Task 33: Integrate with TWR/IRR Services ✅ COMPLETED
- [x] Use `TWRCalculationService` for actual return rate
    - [x] Call `calculatePortfolioTWR()` method
    - [x] Use DAILY granularity for comparison
    - [x] Calculate weighted average across portfolios (direct + from goals)
    - [x] Handle portfolios from linked goals automatically

---

## Testing

### Task 34: Write Unit Tests for Calculation Service (High Priority)
- [ ] Create test file `backend/src/modules/financial-freedom/services/calculation.service.spec.ts`
    - [ ] Test `calculateReturnRate()` with standard inputs
    - [ ] Test `calculateReturnRate()` with edge cases (PMT = 0, initial = 0)
    - [ ] Test `calculateYears()` method
    - [ ] Test `calculatePeriodicPayment()` method
    - [ ] Test `calculateFutureValue()` method
    - [ ] Test `calculateInitialInvestment()` method
    - [ ] Test `calculateFutureValueWithInflation()` method
    - [ ] Test `detectMissingVariable()` method
    - [ ] Test `generateWarnings()` method
    - [ ] Test error handling for invalid inputs
    - [ ] Test Newton-Raphson convergence
    - [ ] Verify calculation accuracy with known test cases

### Task 35: Write Unit Tests for Allocation Suggestion Service
- [ ] Create test file `allocation-suggestion.service.spec.ts`
    - [ ] Test `suggestAllocation()` for conservative risk
    - [ ] Test `suggestAllocation()` for moderate risk
    - [ ] Test `suggestAllocation()` for aggressive risk
    - [ ] Test `calculateExpectedReturn()` method
    - [ ] Test `adjustForHigherReturn()` method
    - [ ] Test `compareWithCurrentAllocation()` method

### Task 36: ~~Write Unit Tests for Progress Tracking Service~~ CANCELLED
- Step 4 (Progress Tracking) has been removed from the workflow.

### Task 37: Write Unit Tests for Financial Freedom Service
- [ ] Create test file `financial-freedom.service.spec.ts`
    - [ ] Test `createPlan()` method
    - [ ] Test `updatePlan()` method
    - [ ] Test `deletePlan()` method
    - [ ] Test `linkToGoal()` method
    - [ ] Test `linkToPortfolio()` method
    - [ ] Test `autoCreateGoal()` method
    - [ ] Mock all dependencies

### Task 38: Write Integration Tests for API Endpoints
- [ ] Create test file `financial-freedom.controller.spec.ts`
    - [ ] Test `POST /calculate` endpoint
        - [ ] Test successful calculation
        - [ ] Test validation errors
        - [ ] Test invalid inputs
    - [ ] Test `POST /suggest-allocation` endpoint
    - [ ] Test `GET /templates` endpoint
    - [ ] Test `GET /plans` endpoint
    - [ ] Test `POST /plans` endpoint
    - [ ] Test `PUT /plans/:id` endpoint
    - [ ] Test `DELETE /plans/:id` endpoint
    - [ ] Test `GET /plans/:id/progress` endpoint
    - [ ] Test authentication requirements
    - [ ] Test authorization (user can only access own plans)

### Task 39: Write Frontend Component Tests
- [ ] Create tests for `CalculationForm` component
    - [ ] Test form rendering
    - [ ] Test input validation
    - [ ] Test calculation submission
    - [ ] Test result display
- [ ] Create tests for `TemplateSelection` component
    - [ ] Test template list rendering
    - [ ] Test template selection
    - [ ] Test skip functionality
- [ ] Create tests for wizard steps
    - [ ] Test Step 1 component
    - [ ] Test Step 2 component
    - [ ] Test Step 3 component
- [ ] Create tests for `FinancialFreedomWizard` component
    - [ ] Test step navigation
    - [ ] Test state management
    - [ ] Test form submission

### Task 40: Write End-to-End Tests
- [ ] Create E2E test for complete workflow
    - [ ] Test creating plan from template
    - [ ] Test manual plan creation
    - [ ] Test calculation flow
    - [ ] Test allocation suggestion
    - [ ] Test plan saving
    - [ ] Test plan editing
    - [ ] Test plan deletion

---

## Documentation

### Task 41: Update API Documentation
- [ ] Add Swagger/OpenAPI documentation for all endpoints
    - [ ] Add request/response examples
    - [ ] Add parameter descriptions
    - [ ] Add error response examples
    - [ ] Document authentication requirements
- [ ] Update API documentation file if separate file exists

### Task 42: Add Code Comments
- [ ] Add JSDoc comments to all service methods
    - [ ] Document parameters
    - [ ] Document return values
    - [ ] Document exceptions
- [ ] Add inline comments for complex calculations
    - [ ] Explain Newton-Raphson implementation
    - [ ] Explain formula derivations
- [ ] Add component documentation
    - [ ] Document component props
    - [ ] Document component usage

### Task 43: Create User Guide
- [ ] Create user guide document
    - [ ] Explain 4-step workflow
    - [ ] Explain template selection
    - [ ] Explain calculation options
    - [ ] Explain allocation suggestions
    - [ ] Add screenshots
    - [ ] Add FAQ section

---

## Security

### Task 44: Implement Access Control
- [ ] Verify plan ownership in all endpoints
    - [ ] Add middleware to check accountId
    - [ ] Prevent access to other users' plans
- [ ] Verify portfolio access when linking
    - [ ] Use existing permission system
    - [ ] Check VIEW permission
- [ ] Add input validation and sanitization
    - [ ] Validate all numeric inputs
    - [ ] Sanitize string inputs
    - [ ] Prevent SQL injection (TypeORM handles this, but verify)

### Task 45: Add Rate Limiting
- [ ] Add rate limiting to calculation endpoint
    - [ ] Prevent calculation abuse
    - [ ] Set reasonable limits
- [ ] Add rate limiting to plan creation
    - [ ] Prevent spam plan creation

---

## Performance

### Task 46: Add Caching
- [ ] Add caching for template data
    - [ ] Cache templates for 5 minutes
    - [ ] Use Redis or in-memory cache
- [ ] Add caching for allocation suggestions
    - [ ] Cache based on RRR and risk tolerance
    - [ ] Cache for 5 minutes
- [ ] Add caching for consolidation results
    - [ ] Cache for 1 minute (more dynamic)

### Task 47: Optimize Database Queries
- [ ] Add database indexes (already in migration, verify)
- [ ] Optimize queries for plan listing
    - [ ] Use pagination
    - [ ] Add filtering at database level

---

## Deployment

### Task 48: Environment Configuration
- [ ] Add environment variables
    - [ ] `FINANCIAL_FREEDOM_ENABLED=true`
    - [ ] `DEFAULT_INFLATION_RATE=3.5`
    - [ ] `DEFAULT_WITHDRAWAL_RATE=0.04`
    - [ ] `MAX_CALCULATION_ITERATIONS=100`
    - [ ] `CALCULATION_TOLERANCE=0.000001`
- [ ] Update `.env.example` file
- [ ] Update deployment configuration

### Task 49: Database Migration Deployment
- [ ] Test migration on staging environment
- [ ] Backup production database before migration
- [ ] Deploy migration to production
- [ ] Verify migration success
- [ ] Rollback plan ready if needed

### Task 50: Monitoring and Logging
- [ ] Add logging for calculation operations
    - [ ] Log calculation inputs and results
    - [ ] Log calculation errors
- [ ] Add monitoring for API endpoints
    - [ ] Track response times
    - [ ] Track error rates
- [ ] Add alerts for critical errors
    - [ ] Alert on calculation failures
    - [ ] Alert on database errors

---

## Task Dependencies Summary

**Critical Path (Must be completed in order):**
1. Task 1-3: Database setup (Entity, Migration, Repository)
2. Task 4: Install Decimal.js
3. Task 5-11: Backend services (Calculation, Allocation, Consolidation, Progress, Template, Main Service)
4. Task 12: Module setup
5. Task 13-14: API layer (DTOs, Controller)
6. Task 15-29: Frontend components
7. Task 30-33: Integration
8. Task 34-40: Testing
9. Task 41-43: Documentation
10. Task 44-50: Security, Performance, Deployment

**Can be done in parallel:**
- Backend services (Tasks 5-11) can be developed in parallel after Task 4
- Frontend components (Tasks 15-29) can be developed in parallel after Task 15
- Testing tasks (Tasks 34-40) can be done in parallel with development
- Documentation (Tasks 41-43) can be done alongside development

---

## Estimated Effort

**Total Tasks:** 50 tasks
**High Priority Tasks:** 5 tasks (Tasks 1, 2, 4, 5, 13, 14)

**Estimated Timeline:**
- Database & Backend Services: 2-3 weeks
- API Layer: 1 week
- Frontend Components: 2-3 weeks
- Integration: 1 week
- Testing: 2 weeks
- Documentation & Deployment: 1 week

**Total Estimated Time:** 9-11 weeks (with 1-2 developers)

---

**Document Status**: In Progress  
**Last Updated**: December 2024

## Recent Updates (December 2024)

### Integration & Progress Tracking (Latest - December 11, 2024)
- ✅ **Task 30 Completed**: Goals integration with link/unlink functionality
  - Backend: `linkToGoal()`, `unlinkGoal()` methods implemented
  - Frontend: `PlanLinksSection` component with goal selection and display
  - Auto-refresh: Progress query invalidated on link/unlink operations
- ✅ **Task 31 Completed**: Portfolio integration with link/unlink functionality
  - Backend: `linkToPortfolio()`, `unlinkPortfolio()` methods implemented
  - Frontend: `PlanLinksSection` component with portfolio selection and display
  - Auto-refresh: Progress query invalidated on link/unlink operations
- ✅ **Task 9 Completed**: Progress Tracking Service re-implemented
  - Backend: `calculateProgress()` method with portfolio combination logic
  - Logic: Automatically combines portfolios from linked goals with direct linked portfolios
  - Frontend: `PlanProgressSection` component with milestones timeline
  - Auto-refresh: Progress automatically updates after link/unlink
- ✅ **Task 32 Completed**: Asset Analytics Service integration
  - Backend: `compareAllocationWithCurrent()` method implemented
  - Uses `AssetAnalyticsService` to get current allocation from portfolios
  - Combines portfolios from linked goals with direct linked portfolios
  - Calculates deviations and generates rebalancing recommendations
  - Frontend: `AllocationComparisonSection` component with charts and table
  - Third tab in `PlanDetailModal` for allocation comparison
  - Auto-refresh when tab is clicked
  - Filters out asset types with 0 value
- ✅ **Task 33 Completed**: TWR/IRR Services integration
  - Weighted average TWR calculation across all portfolios (direct + from goals)
  - Proper handling of portfolios from linked goals
- ✅ **UI Enhancements**:
  - `PlanDetailModal`: Tabbed layout (Parameters & Projections, Progress & Links)
  - `PlansList`: Financial summary section, progress display, completion year
  - `PlanLinksSection`: Two-column layout (Portfolios left, Goals right)
  - `PlanProgressSection`: Timeline-based milestones display
  - Multi-language support for all new components
- ✅ **Additional Features**:
  - `startDate` and `description` fields for plans
  - Completion year calculation based on `startDate`
  - Route renamed from `/financial-freedom` to `/plans`
  - Component renamed from `FinancialFreedom` to `PlansList`
  - `GoalPlanExplanationModal` for system explanation

### Backend Implementation (Previous - December 2024)

### Backend Implementation (Latest)
- ✅ **Task 1 Completed**: FinancialFreedomPlan Entity created with all required fields
- ✅ **Task 2 Completed**: Database migration created with proper structure, enums, indexes, and constraints
- ✅ **Task 3 Completed**: Using TypeORM Repository directly (no custom repository needed)
- ✅ **Task 4 Completed**: Decimal.js already installed in package.json
- ✅ **Task 11 Partially Completed**: FinancialFreedomPlanService created with full CRUD operations
  - ✅ createPlan, findAllPlans, findPlanById, updatePlan, deletePlan, duplicatePlan
  - ⏳ linkToGoal, linkToPortfolio, autoCreateGoal (pending integration)
- ✅ **Task 12 Completed**: FinancialFreedomModule created and registered in AppModule
- ✅ **Task 13 Partially Completed**: Plan DTOs created (CreatePlanDto, UpdatePlanDto, PlanResponseDto)
  - ⏳ Calculation/Allocation/Consolidation DTOs (pending - currently done on frontend)
- ✅ **Task 14 Partially Completed**: FinancialFreedomController created with plan endpoints
  - ✅ GET /plans, GET /plans/:id, POST /plans, PUT /plans/:id, DELETE /plans/:id, POST /plans/:id/duplicate
  - ⏳ Calculation/Allocation/Consolidation/Template endpoints (pending - currently done on frontend)

### Frontend Implementation (Previous)
- ✅ **Task 20 Enhanced**: 
  - Moved calculation logic to frontend for better responsiveness
  - Implemented auto-calculation (removed manual "Calculate" button)
  - Fixed paymentType handling (WITHDRAWAL = negative, CONTRIBUTION = positive)
  - Fixed calculation when all 4 parameters are provided (totalFutureValue)
  - Changed default target method to "direct" (số tiền trực tiếp)
  - Updated monthly expenses calculation to use totalFutureValue instead of futureValueRequired
  - Improved results layout to key-value list format
  - **Always display results section**: Results section now always visible on the right side
  - **Null value handling**: Fields without data display "-" using optional chaining
  - **Chart integration**: Added AssetValueChart to visualize asset value over time
- ✅ **Task 22 Completed**: Step 2 Allocation Suggestions component fully implemented
- ✅ **Task 23 Completed**: Step 3 Consolidated Overview component fully implemented (removed "Next" button as it's the final step)
- ✅ **Task 25 Completed**: All chart components (AllocationChart, ProgressChart, ScenarioComparison, AssetValueChart) implemented
- ✅ **Translation**: Added `common.next` key to translation files

### Architecture Decision
- **Calculation/Allocation/Consolidation**: Currently implemented on frontend for better UX and responsiveness. Can be moved to backend later if needed for consistency or server-side validation.

## Progress Summary

### Completed Tasks (29/50)
- ✅ Task 1: Create FinancialFreedomPlan Entity
- ✅ Task 2: Create Database Migration
- ✅ Task 3: Create Repository (Using TypeORM Repository)
- ✅ Task 4: Install Decimal.js (already installed)
- ✅ Task 11: Create Main Financial Freedom Service (partially - plan CRUD completed)
- ✅ Task 12: Create Financial Freedom Module
- ✅ Task 13: Create DTOs (partially - plan DTOs completed)
- ✅ Task 14: Create Financial Freedom Controller (partially - plan endpoints completed)
- ✅ Task 15: Create TypeScript Types
- ✅ Task 16: Create API Service (with mock data support)
- ✅ Task 17: Create React Hooks
- ✅ Task 18: Create Template Configuration
- ✅ Task 19: Create Template Selection Components
- ✅ Task 20: Create Calculation Form Component (with frontend calculation, auto-calculation, paymentType handling, key-value results layout, always-visible results, null value handling, chart integration)
- ✅ Task 21: Create Step 1 Component - Goal Definition
- ✅ Task 22: Create Step 2 Component - Allocation Suggestions
- ✅ Task 23: Create Step 3 Component - Consolidated Overview
- ✅ Task 25: Create Chart Components (AllocationChart, ProgressChart, ScenarioComparison, AssetValueChart)
- ✅ Task 26: Create Main Wizard Component
- ✅ Task 27: Create Plan Management Components (PlanCard, plan list view)
- ✅ Task 28: Create Main Financial Freedom Page (Renamed to PlansList)
- ✅ Task 29: Add Navigation and Routing
- ✅ Task 30: Integrate with Goals Management System
- ✅ Task 31: Integrate with Portfolio System
- ✅ Task 32: Integrate with Asset Analytics Service
- ✅ Task 33: Integrate with TWR/IRR Services
- ✅ Task 9: Create Progress Tracking Service (Re-implemented)

### In Progress
- Integration with Goals & Portfolios: ✅ COMPLETED
- Progress Tracking: ✅ COMPLETED
- Auto-refresh on link/unlink: ✅ COMPLETED
- Portfolio combination from goals: ✅ COMPLETED
- Plan detail modal with tabs: ✅ COMPLETED
- Plans list with financial summary: ✅ COMPLETED
- startDate and description fields: ✅ COMPLETED
- Asset Analytics integration: ✅ COMPLETED
- UI/UX improvements (layout, progress display, wizard navigation): ✅ COMPLETED

### Pending
- Backend calculation/allocation/consolidation services (Tasks 5-10) - Note: Currently done on frontend, can be moved to backend later if needed
- Backend template service (Task 10)
- Backend calculation/allocation/consolidation endpoints (Task 14 - partially)
- Testing (Tasks 34-40)
- Documentation (Tasks 41-43)
- Security & Performance (Tasks 44-46)

