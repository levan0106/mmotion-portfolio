# Active Context - Portfolio Management System

## Current Session Focus
**Date**: October 23, 2025  
**Session Type**: Goals Management System Implementation & Enhancement  
**Primary Goal**: Implement comprehensive goals management system with portfolio linking, UI improvements, and navigation integration

## Recent Achievements

### ✅ Goals Management System Implementation & Enhancement (Current Session)
1. **Goals Navigation Integration**
   - **Menu Restructuring**: Moved Goals menu from "Quản lý quỹ" to "Nhà đầu tư" section
   - **Translation Updates**: Updated vi.json with navigation.investor.goals key
   - **User Experience**: Goals now accessible to all users under investor section
   - **Files Updated**: AppLayout.tsx, vi.json

2. **Portfolio Linking System Enhancement**
   - **Multiple Portfolio Support**: Removed unique constraint allowing portfolios to link to multiple goals
   - **Database Migration**: Created migration to remove UQ_goal_portfolios_portfolio_id constraint
   - **API Endpoint Fix**: Updated /api/v1/goals/portfolios/available to return portfolios with UPDATE/VIEW permissions
   - **Permission-Based Access**: Endpoint now respects portfolio permissions for proper access control
   - **Files Updated**: goal.service.ts, RemovePortfolioUniqueConstraint migration

3. **UI/UX Improvements**
   - **Progress Display Enhancement**: Simplified progress UI for better readability
   - **Priority Display**: Added priority slider with color coding and tooltips
   - **Status Integration**: Harmonized status and priority display in single row
   - **Date Input Enhancement**: Replaced DatePicker with TextField type="date" for better cursor control
   - **Portfolio Selection Fix**: Fixed portfolio filtering logic in GoalForm
   - **Files Updated**: GoalCard.tsx, GoalForm.tsx, GoalsList.tsx

4. **Data Management & Sorting**
   - **Priority-Based Sorting**: Goals sorted by priority (highest first) then by creation date
   - **Portfolio Filtering**: Fixed available portfolios loading in GoalForm
   - **Form Validation**: Enhanced form validation for portfolio selection
   - **Files Updated**: GoalsList.tsx, GoalForm.tsx

### ✅ Global Asset Tracking Cleanup Endpoint Fix (Previous Session)
1. **HTTP Method Mismatch Resolution**
   - **Root Cause Analysis**: Backend controller used POST method with @Body('days') while frontend service used GET method with query parameter
   - **Solution Implementation**: Updated backend controller to use POST method with @Body('days') parameter
   - **Frontend Service Update**: Updated frontend service to use POST method with body parameter { days }
   - **Swagger Documentation**: Updated API documentation from @ApiQuery to @ApiBody for proper parameter handling
   - **Files Updated**: global-asset-tracking.controller.ts, api.global-asset-tracking.ts

2. **Endpoint Testing & Verification**
   - **Container Restart**: Restarted backend container to apply changes
   - **API Testing**: Successfully tested POST endpoint with PowerShell Invoke-WebRequest
   - **Response Verification**: Confirmed endpoint returns correct response format
   - **Error Resolution**: Fixed 404 NotFoundException error completely
   - **Production Ready**: Endpoint now works correctly with POST method

3. **Code Quality & Standards**
   - **HTTP Method Appropriateness**: POST method is more appropriate for cleanup/delete operations
   - **Security Enhancement**: Body parameters are more secure than query parameters for sensitive operations
   - **RESTful Design**: POST method follows RESTful principles for operations with side effects
   - **Data Integrity**: Body parameters provide better data integrity for cleanup operations
   - **No Linting Errors**: All changes pass linting checks

### ✅ SystemGuide Component Enhancement & Navigation System (Previous Session)
1. **Table of Contents Navigation Fixes**
   - Fixed expand/collapse functionality for parent sections
   - Implemented accordion behavior (only one section expanded at a time)
   - Added proper state management with `expandedSections` Set
   - Created `handleSectionClick` function for manual expand/collapse control

2. **Active Highlighting Improvements**
   - Fixed active section highlighting to work correctly with manual clicks
   - Added immediate active section update for better UX
   - Implemented conflict prevention between manual clicks and scroll detection
   - Added `isManualClick` state to prevent scroll detection conflicts

3. **Scroll Detection Enhancement**
   - Improved scroll detection algorithm to find closest section to viewport top
   - Added preference for main sections over subsections when distances are similar
   - Implemented debounced scroll detection (50ms) for better performance
   - Added manual click protection to prevent scroll detection conflicts

4. **Navigation System Architecture**
   - Enhanced `handleSectionClick` with immediate active section setting
   - Updated `handleSubsectionClick` with proper active section management
   - Improved scroll detection logic with distance-based section selection
   - Added auto-expand functionality for subsections with accordion behavior

5. **User Experience Improvements**
   - Smooth accordion behavior with proper expand/collapse
   - Immediate visual feedback on section clicks
   - Accurate scroll-based highlighting
   - Conflict-free navigation between manual clicks and scroll detection
   - Responsive design for both desktop and mobile TOC

### ✅ Price Update Configuration & Auto Sync Service Enhancement (Previous Session)
1. **Fixed-Time Price Update Scheduling**
   - Modified `PRICE_UPDATE_INTERVAL_MINUTES=180` to support fixed-time scheduling
   - Implemented `PRICE_UPDATE_SCHEDULE_TYPE=fixed_times` configuration
   - Added support for multiple fixed times: `PRICE_UPDATE_FIXED_TIMES=09:01,15:01,18:50`
   - Integrated timezone support: `PRICE_UPDATE_TIMEZONE=Asia/Ho_Chi_Minh`
   - Updated `scheduled-price-update.service.ts` to support both interval and fixed-time scheduling

2. **Auto Sync Service Configuration Enhancement**
   - Enhanced `AutoSyncService` to support fixed-time scheduling alongside interval-based scheduling
   - Updated `AutoSyncConfig` interface with new fields: `scheduleType`, `fixedTimes`, `timezone`
   - Implemented `generateFixedTimesCronExpression()` method for fixed-time cron generation
   - Added `shouldRunAtFixedTime()` method to validate execution timing
   - Updated `getNextFixedTimeSync()` method for accurate next execution time calculation

3. **API Controller Updates**
   - Enhanced `AutoSyncController` DTOs to support new configuration options
   - Updated `UpdateConfigDto` with `scheduleType`, `fixedTimes`, `timezone` fields
   - Modified `AutoSyncStatusDto` to display fixed-time configuration information
   - Added proper validation for new configuration parameters

4. **Configuration Management**
   - Updated `.env` file with new price update configuration
   - Fixed Docker container configuration loading issues
   - Resolved TypeScript compilation errors with `moment-timezone` package
   - Ensured backward compatibility with existing interval-based configuration

5. **Service Integration**
   - Updated `loadConfiguration()` method to handle both schedule types
   - Enhanced `updateConfig()` method to support dynamic configuration updates
   - Improved `getStatus()` method to return appropriate configuration details
   - Fixed API response to correctly show `scheduleType: "fixed_times"` instead of `"interval"`

### ✅ Multi-Account Portfolio Management System (Previous Session)
1. **Permission-Based Access Control**
   - Implemented OWNER, UPDATE, VIEW permission levels
   - Created PortfolioPermission entity with proper relationships
   - Added PermissionCheckService for centralized permission logic
   - Context-aware permissions (investor vs portfolios pages)

2. **Database Schema Updates**
   - Created portfolio_permissions table with proper indexes
   - Added foreign key relationships between Portfolio, Account, and PortfolioPermission
   - Migration script to populate existing portfolios with OWNER permissions
   - Unique constraint on (portfolio_id, account_id) combination

3. **API Integration & Permission Checks**
   - Updated all portfolio-related APIs to use permission system
   - Fixed Trading, Cash Flow, and Convert-to-Portfolio APIs
   - Added userPermission to API responses
   - Implemented proper 403 handling for unauthorized access

4. **Frontend Permission Management**
   - Created PortfolioPermissionModal for managing permissions
   - Added PermissionBadge component to display user permissions
   - Updated PortfolioCard to show permission stats for owners
   - Implemented owner-only permission management UI

5. **ResponsiveTable Component System**
   - Created reusable ResponsiveTable component with consistent styling
   - Added ResponsiveTableWithActions for tables with action menus
   - Implemented light borders for better text visibility
   - Created comprehensive TypeScript types for table components

6. **Investor Report Table Enhancement**
   - Migrated all InvestorReport tables to use ResponsiveTable
   - Fixed table header visibility issues
   - Implemented consistent styling across all tables
   - Added responsive design for mobile devices

## Technical Context

### Current System State
- **Frontend**: React 18 + TypeScript + Material-UI + Vite
- **Backend**: NestJS + TypeScript + PostgreSQL
- **Authentication**: JWT-based with role-based access control
- **Database**: PostgreSQL with proper foreign key relationships
- **Deployment**: Docker containerization
- **Global Asset Tracking**: Comprehensive sync operation monitoring system
- **Migration Management**: Consolidated and optimized database migrations

### Key Components Modified (Current Session)
- `frontend/src/components/Layout/AppLayout.tsx` - Moved Goals menu to investor section
- `frontend/src/i18n/locales/vi.json` - Added navigation.investor.goals translation
- `src/modules/goal/services/goal.service.ts` - Enhanced getAvailablePortfolios with permission checks
- `src/migrations/1738000000003-RemovePortfolioUniqueConstraint.ts` - Removed portfolio unique constraint
- `frontend/src/components/Goals/GoalCard.tsx` - Enhanced UI with priority slider and simplified progress
- `frontend/src/components/Goals/GoalForm.tsx` - Fixed portfolio filtering and date input
- `frontend/src/components/Goals/GoalsList.tsx` - Added priority-based sorting

### Key Components Modified (Previous Session)
- `src/modules/portfolio/entities/portfolio-permission.entity.ts` - New permission entity
- `src/modules/portfolio/services/portfolio-permission.service.ts` - Permission management service
- `src/modules/shared/services/permission-check.service.ts` - Centralized permission logic
- `frontend/src/components/Common/ResponsiveTable.tsx` - Reusable table component
- `frontend/src/components/Common/ResponsiveTableWithActions.tsx` - Table with actions
- `frontend/src/components/Common/PermissionBadge.tsx` - Permission display component
- `frontend/src/components/Portfolio/PortfolioPermissionModal.tsx` - Permission management UI
- `frontend/src/components/Reports/InvestorReport.tsx` - Updated to use ResponsiveTable

### User Experience Improvements (Current Session)
- **Goals Navigation**: Goals menu now accessible under investor section for all users
- **Portfolio Linking**: Multiple portfolios can now be linked to single goals
- **Permission-Based Access**: Portfolio selection respects user permissions
- **Priority Visualization**: Clear priority display with color-coded sliders and tooltips
- **Progress Display**: Simplified and professional progress UI
- **Date Input**: Better date input experience with native HTML5 date picker
- **Goal Sorting**: Goals automatically sorted by priority (highest first)
- **Form Validation**: Enhanced form validation for better user guidance

### User Experience Improvements (Previous Session)
- **Multi-Account Access**: Users can access portfolios they have permissions for
- **Permission-Based UI**: Different interface based on permission level (OWNER/UPDATE/VIEW)
- **Consistent Table Styling**: All tables use ResponsiveTable with light borders
- **Permission Management**: Easy permission management for portfolio owners
- **Visual Permission Indicators**: Clear badges showing user permission level
- **Responsive Design**: Optimized for all devices with consistent styling

## System Architecture

### Price Update & Auto Sync System
- **ScheduledPriceUpdateService**: Enhanced with fixed-time scheduling support
- **AutoSyncService**: Updated to support both interval and fixed-time scheduling
- **Fixed-Time Scheduling**: Support for multiple daily execution times with timezone handling
- **Interval Scheduling**: Backward compatible interval-based scheduling
- **Configuration Management**: Dynamic configuration loading from environment variables

### Permission System
- **OWNER**: Full access to portfolio, can manage permissions
- **UPDATE**: Can view and modify portfolio data, cannot manage permissions
- **VIEW**: Can only view portfolio data via investor page

### Configuration Schema (Current Session)
- **PRICE_UPDATE_SCHEDULE_TYPE**: Schedule type (interval/fixed_times)
- **PRICE_UPDATE_FIXED_TIMES**: Comma-separated fixed times (09:01,15:01,18:50)
- **PRICE_UPDATE_TIMEZONE**: Timezone for fixed times (Asia/Ho_Chi_Minh)
- **PRICE_UPDATE_INTERVAL_MINUTES**: Interval in minutes for interval type
- **AUTO_SYNC_ENABLED**: Enable/disable auto sync functionality

### Database Schema (Previous Session)
- **portfolios**: Main portfolio table with account_id (owner)
- **portfolio_permissions**: Permission relationships with unique constraint
- **accounts**: User accounts with portfolio relationships

### Price Update Flow
1. **Configuration Loading**: Load schedule type and parameters from environment
2. **Schedule Type Detection**: Determine if using interval or fixed-time scheduling
3. **Cron Expression Generation**: Create appropriate cron expression based on schedule type
4. **Execution Validation**: Check if current time matches scheduled execution time
5. **Price Update Execution**: Run price update if conditions are met

### Table Component System
- **ResponsiveTable**: Base table with consistent styling
- **ResponsiveTableWithActions**: Table with action menus
- **Light Borders**: Better text visibility with subtle borders
- **Responsive Design**: Mobile-optimized layouts

## Current Capabilities

### Price Update & Auto Sync System
- **Fixed-Time Scheduling**: Price updates run at specific times (9:01 AM, 3:01 PM, 6:50 PM)
- **Interval Scheduling**: Backward compatible interval-based scheduling (every N minutes)
- **Timezone Support**: Proper timezone handling for Vietnam time (Asia/Ho_Chi_Minh)
- **Configuration Management**: Dynamic configuration loading and updates
- **API Status Display**: Real-time status showing current schedule type and next execution time

### Multi-Account Portfolio Management
- **Permission-Based Access**: OWNER, UPDATE, VIEW permission levels
- **Portfolio Sharing**: Share portfolios with other accounts
- **Permission Management**: Easy permission management for owners
- **Context-Aware Access**: Different permissions for different pages

### Portfolio Management
- **Portfolio Creation**: Create and manage investment portfolios
- **Performance Tracking**: Real-time performance metrics
- **Analytics**: Comprehensive portfolio analytics
- **Reporting**: Professional investor reports

### Trading Management
- **Trade Execution**: Buy/sell transactions with permission checks
- **P&L Tracking**: Realized and unrealized P&L
- **Position Management**: Portfolio position tracking
- **Cash Flow**: Deposit and withdrawal management

### Table System
- **ResponsiveTable**: Consistent table styling across the app
- **Action Menus**: Tables with action buttons and menus
- **Light Borders**: Better text visibility with subtle borders
- **Mobile Optimization**: Responsive design for all devices

### User Management
- **Account Switching**: Seamless account switching
- **Permission-Based Access**: Different interfaces based on permissions
- **Multi-Language Support**: English and Vietnamese translations
- **Responsive Design**: Optimized for all devices

## Next Steps

### Completed Tasks (Current Session)
1. ✅ **Table of Contents Navigation**: Fixed expand/collapse functionality for parent sections
2. ✅ **Accordion Behavior**: Implemented proper accordion behavior (only one section expanded at a time)
3. ✅ **Active Highlighting**: Fixed active section highlighting to work correctly with manual clicks
4. ✅ **Scroll Detection**: Enhanced scroll detection algorithm with distance-based section selection
5. ✅ **Conflict Prevention**: Added manual click protection to prevent scroll detection conflicts
6. ✅ **ID Verification**: Verified all navigation IDs match between TOC and components

### Future Enhancements (Current Session)
1. **Advanced Navigation Features**: Search functionality in table of contents
2. **Smooth Animations**: Add smooth expand/collapse animations for better UX
3. **Keyboard Navigation**: Support for keyboard navigation in table of contents
4. **Breadcrumb Navigation**: Add breadcrumb navigation for better context
5. **Section Progress**: Show reading progress for each section
6. **Mobile Gestures**: Support for swipe gestures on mobile devices

### Future Enhancements (Previous Session)
1. **Advanced Permissions**: More granular permission levels
2. **Bulk Permission Management**: Manage multiple portfolios at once
3. **Permission History**: Track permission changes over time
4. **Mobile App**: React Native mobile application
5. **API Documentation**: Comprehensive API documentation
6. **Testing Coverage**: Unit and integration tests for permission system

## Key Files and Components

### Frontend Structure
```
frontend/src/
├── pages/
│   └── SystemGuide.tsx (Enhanced navigation and scroll detection)
├── components/
│   ├── SystemGuide/
│   │   ├── OverviewSection.tsx (Overview with workflow, features, use-cases, permissions)
│   │   ├── FeaturesSection.tsx (Main features section)
│   │   ├── UseCasesSection.tsx (Use cases section)
│   │   ├── PermissionsSection.tsx (Permissions section)
│   │   ├── DetailedGuideSection.tsx (Portfolio creation, transactions, trading, cash flow)
│   │   ├── AdvancedFeaturesSection.tsx (Performance analysis, risk management, sharing)
│   │   └── GettingStartedSection.tsx (For managers, for customers)
│   ├── Common/
│   │   ├── ResponsiveTable.tsx (Reusable table component)
│   │   ├── ResponsiveTableWithActions.tsx (Table with actions)
│   │   ├── PermissionBadge.tsx (Permission display)
│   │   └── ResponsiveTable.styles.css (Table styling)
│   ├── Portfolio/
│   │   ├── PortfolioPermissionModal.tsx (Permission management)
│   │   └── PortfolioCardWithPermissions.tsx (Card with permissions)
│   └── Reports/
│       └── InvestorReport.tsx (Updated to use ResponsiveTable)
├── types/
│   └── table.types.ts (Table component types)
└── utils/
    └── queryUtils.ts (React Query utilities)
```

### Backend Structure
```
src/
├── modules/
│   ├── asset/
│   │   ├── services/
│   │   │   ├── scheduled-price-update.service.ts (Enhanced with fixed-time support)
│   │   │   └── auto-sync.service.ts (Updated for dual scheduling)
│   │   └── controllers/
│   │       └── auto-sync.controller.ts (Enhanced DTOs)
│   ├── portfolio/ (Permission system)
│   └── shared/ (Permission checks)
├── config/
│   ├── production.env (Fixed-time configuration)
│   ├── env.development.example (Updated examples)
│   └── .env (Docker container configuration)
└── package.json (Added moment-timezone dependencies)
```

## System Health
- ✅ **Database**: Fully operational with price update and auto sync systems
- ✅ **Authentication**: Working with permission-based access control
- ✅ **Frontend**: Responsive with enhanced SystemGuide navigation
- ✅ **Backend**: Stable API endpoints with enhanced scheduling system
- ✅ **Deployment**: Production-ready configuration with Docker
- ✅ **Global Asset Tracking**: Cleanup endpoint now working correctly with POST method
- ✅ **API Endpoints**: All endpoints operational including cleanup functionality
- ✅ **HTTP Method Standards**: Proper RESTful design for all operations
- ✅ **Security**: Enhanced security with body parameters for sensitive operations

## Notes
- Global asset tracking cleanup endpoint fixed with proper POST method implementation
- HTTP method mismatch resolved between frontend GET and backend POST
- Endpoint now works correctly with POST method and body parameters
- Security enhanced with body parameters instead of query parameters
- RESTful design principles properly implemented for cleanup operations
- All API endpoints now operational including cleanup functionality
- SystemGuide component continues to have fully functional accordion navigation
- Table of contents expand/collapse works correctly with proper state management
- Active section highlighting works immediately on click and accurately on scroll
- Scroll detection algorithm improved with distance-based section selection
- Manual click conflicts resolved with proper state management
- All navigation IDs verified and working correctly across all sections
- Mobile table of contents drawer works seamlessly with desktop sidebar
- Accordion behavior ensures only one section expanded at a time
- Auto-expand functionality works when scrolling to subsections
- SystemGuide navigation system is production-ready and user-friendly
- Price update system continues to support fixed-time scheduling (9:01 AM, 3:01 PM, 6:50 PM Vietnam time)
- Auto sync service enhanced to support both interval and fixed-time scheduling
- Multi-account portfolio management system remains fully operational
- Permission-based access control continues to work across all APIs
- ResponsiveTable component system provides consistent styling
- System is ready for production deployment with enhanced navigation, scheduling, and API functionality