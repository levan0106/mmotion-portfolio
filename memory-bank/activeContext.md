# Active Context - Portfolio Management System

## Current Session Focus
**Date**: October 29, 2025  
**Session Type**: Date Normalization Utility + TradeForm Date Handling Fix  
**Primary Goal**: Create unified date normalization utility and fix timezone issues in TradeForm DatePicker

## Recent Achievements

### ✅ Date Normalization Utility Implementation + TradeForm Date Fix (Current Session - October 29, 2025)
1. **Date Normalization Utility Creation**
   - **Unified Function**: Created single `normalizeDate()` function to handle all date conversion cases
   - **Auto Type Detection**: Automatically detects input type (string/Date/null) and returns appropriate output
   - **Timezone Safety**: Extracts YYYY-MM-DD directly from ISO strings to avoid timezone conversion issues
   - **Option Support**: Supports `{ output: 'iso-string' }` and `{ includeTime: true/false }` options
   - **Current Time Integration**: When formatting Date to ISO, includes current time (hours, minutes, seconds)
   - **Date-Only Support**: Option to format with 00:00:00 UTC for date-only operations
   - **Files Created**: date.utils.ts
   - **Files Updated**: utils/index.ts (export)

2. **TradeForm Date Handling Fix**
   - **Timezone Issue Resolution**: Fixed issue where selecting same date showed different results
   - **Date Normalization**: Applied normalizeDate utility throughout TradeForm for consistent date handling
   - **DatePicker Integration**: DatePicker value uses normalizeDate() for proper display
   - **Form Submission**: Form submission uses normalizeDate() with iso-string output option
   - **Initial Data Loading**: Initial data normalization with proper date parsing
   - **Consistent Behavior**: All date operations now use unified normalization function
   - **Files Updated**: TradeForm.tsx

3. **Code Optimization**
   - **Single Function Pattern**: Replaced multiple functions (normalizeDateToLocal, normalizeDateToISO, normalizeDateToISODateOnly) with one unified function
   - **Reduced Nesting**: Eliminated need for nested function calls (normalizeDate(normalizeDate(...)))
   - **Cleaner API**: Single function with options is easier to use and understand
   - **Type Safety**: Proper TypeScript types with union return types (Date | string)
   - **Documentation**: Comprehensive JSDoc comments with examples
   - **Files Updated**: date.utils.ts, TradeForm.tsx

4. **Date Format Handling**
   - **ISO String Parsing**: Direct extraction of YYYY-MM-DD from ISO strings prevents timezone conversion
   - **Local Date Creation**: Creates Date objects with local time at 00:00:00 for DatePicker compatibility
   - **Current Time Preservation**: Preserves selected date while using current time for ISO formatting
   - **Consistent Storage**: All dates stored in consistent ISO format with proper timezone handling

### ✅ Mobile UI Enhancement + Profile Form Accessibility (Previous Session - October 28, 2025)
1. **FloatingMenuButton Implementation**
   - **Mobile Navigation**: Created floating menu button for easy mobile navigation
   - **Position**: Bottom-left corner (16px from edges) for thumb-friendly access
   - **Responsive Design**: Only shows on mobile devices (breakpoints.down('md'))
   - **Visual Design**: Transparent background with gray icon for subtle appearance
   - **Animation**: Smooth fade-in, pulse animation when drawer closed, rotate on open
   - **Touch-Friendly**: 48x48px size optimized for mobile touch interaction
   - **Files Created**: FloatingMenuButton.tsx

2. **AppLayout Integration**
   - **Drawer Toggle**: Integrated FloatingMenuButton with existing drawer toggle logic
   - **State Management**: Connected to mobileOpen state for proper animation
   - **Z-Index Management**: Proper layering with theme.zIndex.speedDial
   - **Non-Intrusive**: Only appears on mobile, doesn't affect desktop experience
   - **Files Updated**: AppLayout.tsx

3. **PortfolioList Mobile Layout Fix**
   - **Header Layout**: Fixed mobile header to keep title and buttons on same row
   - **CSS Update**: Changed flex-direction from column to row for mobile screens
   - **Responsive Design**: Title on left, buttons on right for consistent mobile UX
   - **Touch-Friendly**: Maintained proper spacing and alignment on mobile
   - **Files Updated**: PortfolioList.styles.css

4. **Profile Form Accessibility Enhancement**
   - **Form Structure**: Added proper `<form>` elements around password fields
   - **Autocomplete Attributes**: Added appropriate autocomplete attributes for password fields
   - **Hidden Username Fields**: Added hidden username fields for password manager compatibility
   - **Show/Hide Password**: Implemented password visibility toggle for all password fields
   - **Accessibility Compliance**: Resolved DOM warnings for better accessibility
   - **Files Updated**: Profile.tsx

5. **Password Field Enhancements**
   - **Show/Hide Icons**: Added VisibilityIcon and VisibilityOffIcon for password fields
   - **State Management**: Individual state for each password field (showNewPassword, showCurrentPassword, showChangeNewPassword)
   - **InputAdornment**: Proper Material-UI InputAdornment implementation
   - **Mobile-Friendly**: Touch-friendly icon buttons for mobile users
   - **Security**: Default hidden state with user-controlled visibility
   - **Files Updated**: Profile.tsx

6. **DOM Compliance Fixes**
   - **Password Form Structure**: Fixed "Password field is not contained in a form" warning
   - **Autocomplete Attributes**: Added "new-password" and "current-password" autocomplete attributes
   - **Username Fields**: Added hidden username fields for password manager accessibility
   - **Form Submission**: Proper form submission with preventDefault() and type attributes
   - **Standards Compliance**: Full compliance with HTML5 and accessibility standards

### ✅ Global Asset Form Enhancement + Backend API Fixes (Previous Session - October 27, 2025)
1. **GlobalAssetForm Description Field Fix**
   - **Optional Description**: Fixed description field to be truly optional (allow null/empty values)
   - **Validation Schema Update**: Updated yup validation to use `.nullable()` for description field
   - **Form Submission Logic**: Enhanced form submission to handle empty description properly
   - **TypeScript Interface**: Updated GlobalAssetFormData interface to support `string | null` for description
   - **Files Updated**: GlobalAssetForm.tsx

2. **Asset Type Validation Simplification**
   - **Disabled Nation-Based Validation**: Simplified NationConfigService to always allow all asset types for all nations
   - **Removed Complex Logic**: Replaced complex validation logic with simple `return true` in `isAssetTypeEnabled` method
   - **Code Simplification**: Eliminated unnecessary validation complexity for better maintainability
   - **REALESTATE Support**: Fixed issue where REALESTATE assets were not allowed for VN nation
   - **Files Updated**: nation-config.service.ts

3. **Global Asset API Enhancement**
   - **PriceMode Field Support**: Added priceMode field to UpdateGlobalAssetDto for proper API updates
   - **Missing Field Fix**: Fixed issue where priceMode was not being updated in global asset API
   - **DTO Enhancement**: Added PriceMode enum import and validation to UpdateGlobalAssetDto
   - **API Testing**: Verified that priceMode updates work correctly (AUTOMATIC/MANUAL)
   - **Files Updated**: update-global-asset.dto.ts

4. **Nation Configuration Updates**
   - **Complete Asset Type Support**: Added all missing asset types (CRYPTO, COMMODITY, REALESTATE, OTHER) to all nations
   - **Consistent Configuration**: Updated VN, US, UK, JP, SG configurations to include all asset types
   - **Symbol Pattern Updates**: Ensured all nations have appropriate symbol patterns for all asset types
   - **Files Updated**: nation-config.service.ts

5. **API Testing and Verification**
   - **Backend Restart**: Successfully restarted backend container to apply changes
   - **API Response Verification**: Confirmed that priceMode and isActive fields are properly returned in API responses
   - **Real Estate Asset Testing**: Successfully tested REALESTATE asset creation and updates for VN nation
   - **Field Update Testing**: Verified that priceMode changes from MANUAL to AUTOMATIC work correctly

### ✅ UI Enhancement + Component System Development (Previous Session - October 26, 2025)
1. **ResponsiveCard Component System Implementation**
   - **Unified Card Component**: Created ResponsiveCard component for consistent card styling across application
   - **Multiple Variants**: Implemented default, transparent, outlined, and elevated variants
   - **Responsive Design**: Automatic mobile/desktop adaptation with breakpoint detection
   - **Size System**: Small, medium, large sizes with appropriate padding and spacing
   - **Hover Control**: Configurable hover effects with hoverable prop
   - **Click Support**: Clickable cards with transform animations
   - **Loading States**: Built-in loading and error state handling
   - **Files Created**: ResponsiveCard.tsx, ResponsiveCard.types.ts
   - **Files Updated**: index.ts (Common components export)

2. **ResponsiveCard Sub-Components**
   - **ResponsiveCardContent**: Standalone content component with configurable padding
   - **ResponsiveCardHeader**: Header component with title, subtitle, icon, and actions support
   - **ResponsiveCardActions**: Actions component with position and spacing control
   - **TypeScript Types**: Comprehensive type definitions for all components
   - **Consistent API**: Unified prop system across all sub-components

3. **InvestorReport UI Improvements**
   - **Hover Animation Removal**: Disabled hover effects on ResponsiveTable components
   - **Card Hover Fix**: Removed box shadow hover effects on summary cards
   - **ResponsiveCard Integration**: Migrated Asset Allocation section to use ResponsiveCard
   - **Transparent Design**: Applied transparent variant for cleaner appearance
   - **Consistent Spacing**: Unified spacing system across all sections
   - **Files Updated**: InvestorReport.tsx

4. **DepositSettlementModal Bug Fixes**
   - **Submit Button Fix**: Fixed non-working settlement confirmation button
   - **Form Submission**: Changed from type="submit" to onClick handler for proper form submission
   - **Layout Enhancement**: Converted Settlement Summary from card layout to list view
   - **UI Consistency**: Applied transparent cards with dividers for better visual separation
   - **Files Updated**: DepositSettlementModal.tsx

5. **PortfolioDetail Navigation Enhancement**
   - **Browser Back Integration**: Changed back button to use window.history.back() instead of hard-coded navigation
   - **Natural Navigation**: Users now return to previous page in browser history
   - **Code Cleanup**: Removed unused useNavigate import and navigate variable
   - **Better UX**: More intuitive navigation behavior
   - **Files Updated**: PortfolioDetail.tsx

6. **Code Quality Improvements**
   - **TypeScript Error Fixes**: Removed unused Divider import from TradeForm.tsx
   - **Build Success**: Frontend builds successfully without TypeScript errors
   - **Linting Clean**: All linting errors resolved
   - **Production Ready**: Clean, maintainable code ready for deployment
   - **Files Updated**: TradeForm.tsx

### ✅ Generic Form Modal Enhancement + Form Integration (Previous Session - October 26, 2025)
1. **Generic Form Modal Implementation**
   - **Centralized Form System**: Created GenericFormModal for unified form creation experience
   - **Tabbed Interface**: Implemented 3-tab layout (Mua/Bán, Nạp/Rút tiền, Tiền gửi)
   - **Auto Form Selection**: Automatic form rendering when tab changes without additional clicks
   - **Responsive Design**: Fullscreen on mobile, fixed width on desktop with Material-UI size system
   - **Form Integration**: Integrated TradeForm, CashFlowForm, and DepositForm into unified modal
   - **Files Created**: GenericFormModal.tsx

2. **Form Submission Handling**
   - **Centralized Submission**: GenericFormModal controls all form submissions with common buttons
   - **Form Reference System**: Implemented formRef system for programmatic form submission
   - **Fallback Logic**: Added fallback logic for forms without submit buttons (TradeForm, CashFlowForm)
   - **API Integration**: Fixed API calls to use effectivePortfolioId instead of empty selectedPortfolioId
   - **Error Handling**: Comprehensive error handling for all form types
   - **Files Updated**: GenericFormModal.tsx, TradeForm.tsx, CashFlowForm.tsx, DepositForm.tsx

3. **Responsive Design Enhancement**
   - **Mobile Optimization**: Fullscreen modal on mobile devices with touch-friendly interface
   - **Desktop Layout**: Fixed width modal using Material-UI size system (md/lg)
   - **Tab Styling**: Responsive tabs with icon hiding on mobile for cleaner interface
   - **Form Layout**: Consistent form layouts using md breakpoint for all forms
   - **Width Consistency**: Fixed modal width changes when switching between tabs
   - **Files Updated**: GenericFormModal.tsx, ModalWrapper.tsx, TradeForm.tsx, CashFlowForm.tsx, DepositForm.tsx

4. **Portfolio Management Integration**
   - **Context-Aware Logic**: Portfolio selection hidden when opened from portfolio detail page
   - **Auto Portfolio Selection**: Automatic portfolio selection when modal opens from general pages
   - **Effective Portfolio ID**: Unified logic using effectivePortfolioId for all API calls
   - **Portfolio Validation**: Error display when no portfolio is available
   - **Files Updated**: GenericFormModal.tsx

5. **Form Component Refactoring**
   - **CashFlowForm Extraction**: Extracted CashFlowForm from CashFlowFormModal for reuse
   - **Modal Component Separation**: Separated modals from CashFlowLayout into individual files
   - **Code Reuse**: Refactored CashFlowFormModal to use CashFlowForm internally
   - **Button Control**: Added hideButtons prop to control form button visibility
   - **Files Created**: CashFlowForm.tsx, CashFlowFormModal.tsx, TransferCashModal.tsx, CashflowDeleteConfirmationModal.tsx
   - **Files Updated**: CashFlowLayout.tsx

6. **Translation and i18n Support**
   - **Comprehensive Translations**: Added translation keys for all GenericFormModal components
   - **Portfolio Information**: Added portfolio selection and information display translations
   - **Error Messages**: Added error message translations for form validation
   - **Consistent Language**: Vietnamese and English translations for all new features
   - **Files Updated**: en.json, vi.json

### ✅ Asset Management Enhancement + Migration Consolidation (Previous Session - October 26, 2025)
1. **Enhanced Asset Creation Workflow**
   - **Global Asset Integration**: Automatic global asset data fetching when creating assets
   - **Symbol Input Validation**: Alphanumeric-only symbol input with automatic uppercase conversion
   - **Auto-fill Functionality**: Automatic population of asset details from global asset data
   - **Permission-Based Field Control**: Disable fields based on asset ownership (createdBy vs accountId)
   - **Focus Management**: Fixed symbol input focus loss during data fetching
   - **Helper Text System**: Dynamic helper text indicating symbol availability in system
   - **Field Reordering**: Symbol field moved before name field for better UX
   - **Blur-Based Fetching**: Global asset data fetched only on symbol field blur (not on every change)
   - **Files Updated**: AssetForm.tsx, AssetFormModal.tsx, Assets.tsx, global-asset.service.ts

2. **Backend API Enhancement**
   - **New API Endpoint**: GET /api/v1/global-assets/symbol/:symbol for symbol-based lookup
   - **Service Layer Enhancement**: findBySymbol method in GlobalAssetService
   - **DTO Enhancement**: Added createdBy field to GlobalAssetResponseDto
   - **Permission Integration**: createdBy field mapping for ownership validation
   - **Files Updated**: global-asset.controller.ts, global-asset.service.ts, global-asset-response.dto.ts

3. **Database Migration Consolidation**
   - **Migration Consolidation**: Merged 3 separate migrations into 1 comprehensive migration
   - **Unified Migration**: 1761449000001-AddPriceModeAndCreatedByToAssets.ts
   - **Comprehensive Changes**: Added price_mode to both assets and global_assets tables
   - **CreatedBy Field**: Added created_by column to global_assets table
   - **Enum Creation**: Created separate enums for assets and global_assets price_mode
   - **Rollback Support**: Complete rollback functionality for all changes
   - **Files Created**: 1761449000001-AddPriceModeAndCreatedByToAssets.ts
   - **Files Deleted**: 1735128000000-AddPriceModeToAssets.ts, 1735128000001-AddPriceModeToGlobalAssets.ts, 1761449000000-AddCreatedByToGlobalAssets.ts

4. **Asset Details Modal Enhancement**
   - **List View Redesign**: Converted from card-based to list-based layout
   - **Responsive Grid System**: 4 columns desktop, 2 columns mobile for optimal space usage
   - **Unified Grid Layout**: Single grid combining all asset information sections
   - **Border System**: Light borders (rgba(0, 0, 0, 0.08)) for item separation
   - **Asset ID Removal**: Removed Asset ID field for cleaner interface
   - **Text Truncation**: Ellipsis (...) for long labels with proper overflow handling
   - **Professional Styling**: Consistent typography and spacing throughout
   - **Files Updated**: AssetDetailsModal.tsx

5. **Code Cleanup and Optimization**
   - **Debug Log Removal**: Removed console.log statements from frontend and backend
   - **Unused Code Cleanup**: Removed commented-out code and unused imports
   - **TypeScript Fixes**: Resolved all linter errors and type mismatches
   - **Production Ready**: Clean, maintainable code ready for production deployment
   - **Files Cleaned**: AssetForm.tsx, AssetDetailsModal.tsx, Assets.tsx, global-asset.service.ts, asset-global-sync.service.ts

### ✅ Notification Fullscreen Enhancement + Floating Button Integration (Previous Session - October 25, 2025)
1. **NotificationBell Fullscreen Feature**
   - **Fullscreen Button**: Added fullscreen icon button in notification popover header
   - **Fullscreen Modal**: Implemented full-screen modal displaying all notifications
   - **Professional UI**: AppBar with notification count and fullscreen exit button
   - **Enhanced Display**: Larger, more readable notification cards in fullscreen mode
   - **Action Buttons**: Footer with bulk operations (Mark all as read, Close)
   - **Files Updated**: NotificationBell.tsx

2. **NotificationContext Enhancement**
   - **Global State Management**: Added `isFullscreenOpen` state to track fullscreen mode
   - **State Control**: Added `setFullscreenOpen` function for state management
   - **Context Integration**: Made fullscreen state accessible to all components
   - **Files Updated**: NotificationContext.tsx

3. **FloatingTradingButton Integration**
   - **Smart Hiding**: Floating button automatically hides when notifications are in fullscreen
   - **Clean UI Experience**: No tooltip interference during fullscreen notification viewing
   - **State Detection**: Uses NotificationContext to detect fullscreen state
   - **Seamless Transitions**: Button appears/disappears smoothly with fullscreen mode
   - **Files Updated**: FloatingTradingButton.tsx

4. **User Experience Improvements**
   - **Distraction-Free Fullscreen**: Clean notification viewing without UI interference
   - **Professional Interface**: Material-UI Dialog with proper AppBar and Toolbar
   - **Responsive Design**: Works well on all screen sizes and devices
   - **Intuitive Navigation**: Easy access to fullscreen mode with clear visual indicators

### ✅ Code Cleanup + Mobile UI Enhancement (Previous Session - October 25, 2025)
1. **Debug Logs Cleanup**
   - **Backend Cleanup**: Removed 24+ console.log statements from backend services
   - **Frontend Cleanup**: Removed 24+ console.log statements from frontend components
   - **Files Cleaned**: AssetService, CashFlowService, DepositService, NotificationGateway, PortfolioDetail, GlobalAssetTrackingDashboard, queryUtils, NotificationManager, NotificationContext, RoleForm, GoalCard, deviceTrustService, PortfolioForm
   - **Code Quality**: All debug logs removed while preserving error logging (console.error)
   - **Production Ready**: Code is now clean and professional for production deployment

2. **Mobile UI Enhancement**
   - **Admin Management Tabs**: Fixed mobile scroll issue for admin management tabs
   - **Scrollable Tabs**: Added `variant="scrollable"` and `scrollButtons="auto"` for horizontal scrolling
   - **Mobile Optimization**: Added `allowScrollButtonsMobile` for better mobile experience
   - **Responsive CSS**: Enhanced tab styling with mobile-specific padding and font sizes
   - **Touch-Friendly**: Improved touch interaction for mobile users
   - **Files Updated**: AdminManagement.tsx

3. **TypeScript Build Fixes**
   - **Unused Variables**: Fixed unused variable errors in queryUtils.ts
   - **Build Success**: Frontend build now completes without TypeScript errors
   - **Code Quality**: Removed unused imports and variables
   - **Linting**: All linter errors resolved

4. **Environment Configuration**
   - **ADMIN_USERNAME**: Added ADMIN_USERNAME configuration to all environment files
   - **Config Files**: Updated env.example, env.development.example, env.staging.example, production.env, docker-compose.yml
   - **Default Value**: Set default value to 'admin' for admin user lookup
   - **Docker Support**: Added environment variable support in docker-compose.yml

### ✅ Device Trust System Enhancement + Quick Login History Integration (Previous Session)
1. **Quick Login History Integration**
   - **Device Trust Integration**: When user removes themselves from quick login history, also revoke device trust
   - **Current Device Revocation**: Only revoke the current device, not all devices of the user
   - **Public API Endpoint**: Created public endpoint for device revocation without authentication
   - **Precise Device Matching**: Use both device fingerprint and username for accurate device identification
   - **Files Updated**: Login.tsx, deviceTrustService.ts, device-trust.service.ts, device-trust.controller.ts

2. **Public API Endpoints Implementation**
   - **Public Decorator**: Used @Public() decorator to bypass JWT authentication for specific endpoints
   - **Device Revocation Endpoint**: `DELETE /api/v1/device-trust/devices/fingerprint/:deviceFingerprint/username/:username`
   - **No Authentication Required**: Endpoint works without JWT token for quick login history removal
   - **User Context Resolution**: Find user by username, then find device by fingerprint and userId
   - **Files Updated**: device-trust.controller.ts, device-trust.service.ts

3. **Backend Service Enhancement**
   - **Method Separation**: Separated revokeDevice (authenticated) and revokeDeviceByFingerprintAndUsername (public)
   - **User Entity Fix**: Fixed user.id to user.userId for proper database field mapping
   - **Precise Device Matching**: Use both deviceFingerprint and userId for accurate device identification
   - **Error Handling**: Proper error handling for user not found and device not found scenarios
   - **Files Updated**: device-trust.service.ts

4. **Frontend Service Enhancement**
   - **Public Method**: Added revokeDeviceByFingerprintAndUsername method for public API calls
   - **Device Info Integration**: Get current device fingerprint for precise device identification
   - **Error Handling**: Graceful error handling if device trust revocation fails
   - **Files Updated**: deviceTrustService.ts, Login.tsx

5. **Code Cleanup and Optimization**
   - **Unused Code Removal**: Removed unused revokeDeviceByFingerprint method
   - **Method Simplification**: Simplified revokeDevice method to only handle deviceId (UUID)
   - **Clear Separation**: Clear separation between authenticated and public endpoints
   - **Files Updated**: device-trust.service.ts, deviceTrustService.ts

### ✅ Device Trust System Implementation & Enhancement (Previous Session)
1. **Device Trust Core System**
   - **Device Fingerprinting**: Advanced fingerprinting using Canvas, WebGL, Audio, Screen, User Agent
   - **Stable Fingerprints**: Removed timestamp to ensure consistent device identification
   - **Incognito Detection**: Comprehensive incognito/private mode detection with multiple methods
   - **Security Enhancement**: Incognito sessions generate random fingerprints (never trusted)
   - **Files Created**: deviceFingerprintService.ts, deviceTrustService.ts, device-trust.service.ts

2. **Backend Device Trust Infrastructure**
   - **TrustedDevice Entity**: Complete database schema with proper relationships and indexes
   - **Device Trust Service**: Full CRUD operations for trusted devices with expiration management
   - **Device Trust Controller**: RESTful API endpoints for device management
   - **Database Migration**: Comprehensive migration with proper foreign keys and indexes
   - **Files Created**: trusted-device.entity.ts, device-trust.service.ts, device-trust.controller.ts

3. **Authentication Integration**
   - **Login Flow Enhancement**: Integrated device trust into login-or-register API
   - **Progressive Authentication**: Device trust bypasses password for trusted devices
   - **Smart Logic**: Backend automatically handles device trust checking and device addition
   - **Error Handling**: Proper error responses for password requirements vs invalid credentials
   - **Files Updated**: auth.service.ts, auth.controller.ts, auth.dto.ts

4. **Frontend Device Management UI**
   - **Device Management Component**: Complete UI for viewing and managing trusted devices
   - **Settings Integration**: Added Security tab to Settings page with device management
   - **Device Statistics**: Real-time stats showing total, active, expired, and high-trust devices
   - **Revoke Functionality**: Individual device revocation and bulk device revocation
   - **Files Created**: DeviceManagement.tsx, updated Settings.tsx

5. **User Experience Enhancements**
   - **Smooth Login Flow**: No error messages when password is required (400 status)
   - **Error Display**: Proper error display for invalid credentials (401 status)
   - **Time Display**: Accurate time display for device last used (minutes/hours/days ago)
   - **Device Information**: Comprehensive device details with browser info and location
   - **Files Updated**: Login.tsx, deviceTrustService.ts, device-trust.service.ts

6. **Password Security Enhancement**
   - **Device Expiry on Password Change**: All trusted devices expire when user changes password
   - **Device Expiry on Password Set**: All trusted devices expire when user sets password for first time
   - **Security Enhancement**: Prevents unauthorized access from old trusted devices after password change
   - **Audit Trail**: Expired devices remain in database for security tracking
   - **Error Handling**: Graceful error handling if device expiry fails
   - **Files Updated**: auth.service.ts, device-trust.service.ts

### ✅ Frontend Build Error Fix & Code Cleanup (Current Session)
1. **TypeScript Build Error Resolution**
   - **Unused Import Cleanup**: Fixed 4 TypeScript errors for unused `Fab` imports
   - **Files Fixed**: GoalsList.tsx, AdminManagement.tsx, RoleManagement.tsx, Trading.tsx
   - **Solution**: Commented out unused `Fab` imports to resolve TS6133 errors
   - **Build Success**: Frontend build now completes successfully without errors
   - **Files Updated**: All 4 files with commented out `// Fab,` imports

2. **Auto Asset Creation Service Cleanup**
   - **Service Removal**: Deleted redundant `auto-asset-creation.service.ts` files
   - **Module Cleanup**: Removed `AutoAssetCreationService` from asset.module.ts
   - **Event-Driven Architecture**: Replaced with event-driven `AutoAssetCreationListener`
   - **Linting Fix**: Resolved linting errors after service removal
   - **Files Deleted**: `src/modules/shared/services/auto-asset-creation.service.ts`, `src/modules/asset/services/auto-asset-creation.service.ts`

3. **Build Process Verification**
   - **Frontend Build**: Successfully completed in 11.22s
   - **Backend Build**: Previously verified working
   - **No TypeScript Errors**: All compilation errors resolved
   - **Production Ready**: Both frontend and backend ready for deployment

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
- `frontend/src/components/Common/FloatingMenuButton.tsx` - Mobile floating menu button with animations and responsive design
- `frontend/src/components/Layout/AppLayout.tsx` - Integration of FloatingMenuButton and user profile click handlers
- `frontend/src/components/Portfolio/PortfolioList.styles.css` - Fixed mobile header layout to keep title and buttons on same row
- `frontend/src/pages/Profile.tsx` - Enhanced password forms with accessibility features and show/hide functionality

### Key Components Modified (Previous Session - Generic Form Modal)
- `frontend/src/services/deviceFingerprintService.ts` - Advanced device fingerprinting with incognito detection
- `frontend/src/services/deviceTrustService.ts` - Frontend device trust management service
- `frontend/src/components/Settings/DeviceManagement.tsx` - Complete device management UI with ResponsiveTypography/Button
- `frontend/src/pages/Login.tsx` - Enhanced login flow with device trust integration
- `frontend/src/pages/Settings.tsx` - Added Security tab with device management
- `src/modules/shared/entities/trusted-device.entity.ts` - Database entity for trusted devices
- `src/modules/shared/services/device-trust.service.ts` - Backend device trust service with expireAllDevices method
- `src/modules/shared/controllers/device-trust.controller.ts` - Device trust API endpoints
- `src/modules/shared/services/auth.service.ts` - Enhanced authentication with device trust and password security
- `src/migrations/1735123456789-CreateTrustedDeviceTable.ts` - Database migration for trusted devices

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
- **Mobile Navigation**: Floating menu button provides easy access to navigation on mobile devices
- **Touch-Friendly Design**: 48x48px floating button optimized for mobile thumb interaction
- **Consistent Mobile Layout**: Portfolio list header maintains title and buttons on same row on mobile
- **Password Visibility**: Show/hide password functionality for all password fields on mobile
- **Form Accessibility**: Proper form structure with autocomplete attributes and hidden username fields
- **Standards Compliance**: Full HTML5 and accessibility standards compliance
- **Visual Feedback**: Smooth animations and visual feedback for better user experience
- **Non-Intrusive Design**: Floating button only appears on mobile, doesn't affect desktop experience

### User Experience Improvements (Previous Session - Generic Form Modal)
- **Seamless Login Experience**: No error messages when password is required, smooth transition to password step
- **Device Trust Security**: Trusted devices bypass password requirements for faster login
- **Incognito Protection**: Incognito/private mode sessions are never trusted for security
- **Device Management**: Complete UI for viewing and managing trusted devices in Settings
- **Time Display**: Accurate and user-friendly time display (minutes/hours/days ago)
- **Error Handling**: Proper error display for invalid credentials while hiding password requirement messages
- **Device Information**: Comprehensive device details with browser info and trust levels
- **Revoke Functionality**: Easy device revocation with individual and bulk options
- **Password Security**: All trusted devices expire when password is changed for enhanced security
- **Responsive Design**: DeviceManagement component uses ResponsiveTypography and ResponsiveButton

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

### Device Trust System
- **Device Fingerprinting**: Advanced fingerprinting using Canvas, WebGL, Audio, Screen, User Agent
- **Incognito Detection**: Comprehensive detection of incognito/private mode with multiple methods
- **Trust Management**: Complete CRUD operations for trusted devices
- **Security Enhancement**: Incognito sessions generate random fingerprints (never trusted)
- **Time Display**: Accurate time display for device last used (minutes/hours/days ago)
- **Device Revocation**: Individual and bulk device revocation with proper database cleanup
- **Password Security**: All trusted devices expire when password is changed or set
- **Device Expiry**: New expireAllDevices method marks devices as expired but keeps audit trail

### Authentication & Security
- **Progressive Authentication**: Device trust bypasses password for trusted devices
- **Smart Login Flow**: No error messages for password requirements (400 status)
- **Error Handling**: Proper error display for invalid credentials (401 status)
- **Device Management**: Complete UI for viewing and managing trusted devices
- **Security Protection**: Incognito/private mode sessions are never trusted
- **Password Change Security**: All trusted devices expire when password is changed
- **Password Set Security**: All trusted devices expire when password is first set
- **Audit Trail**: Expired devices remain in database for security tracking

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
1. ✅ **FloatingMenuButton Implementation**: Created mobile floating menu button with animations and responsive design
2. ✅ **AppLayout Integration**: Integrated FloatingMenuButton with existing drawer toggle logic
3. ✅ **PortfolioList Mobile Layout Fix**: Fixed mobile header to keep title and buttons on same row
4. ✅ **Profile Form Accessibility**: Added proper form structure with autocomplete attributes
5. ✅ **Password Visibility Toggle**: Implemented show/hide password functionality for all password fields
6. ✅ **DOM Compliance Fixes**: Resolved all DOM warnings for better accessibility
7. ✅ **Hidden Username Fields**: Added hidden username fields for password manager compatibility
8. ✅ **Form Submission Enhancement**: Proper form submission with preventDefault() and type attributes
9. ✅ **Mobile UX Optimization**: Touch-friendly design optimized for mobile thumb interaction
10. ✅ **Standards Compliance**: Full HTML5 and accessibility standards compliance

### Completed Tasks (Previous Session)
1. ✅ **Device Trust System Implementation**: Complete backend and frontend implementation
2. ✅ **Device Fingerprinting**: Advanced fingerprinting with incognito detection
3. ✅ **Database Schema**: TrustedDevice entity with proper relationships and indexes
4. ✅ **Authentication Integration**: Enhanced login flow with device trust
5. ✅ **Frontend UI**: Complete device management interface in Settings
6. ✅ **User Experience**: Smooth login flow with proper error handling
7. ✅ **Security Enhancement**: Incognito mode protection and device revocation
8. ✅ **Time Display**: Accurate time display for device last used
9. ✅ **Password Security Enhancement**: Device expiry on password change/set
10. ✅ **Responsive Components**: DeviceManagement uses ResponsiveTypography/Button
11. ✅ **Frontend Build Error Fix**: Fixed TypeScript errors for unused imports
12. ✅ **Code Cleanup**: Removed redundant auto-asset-creation services
13. ✅ **Build Verification**: Both frontend and backend build successfully

### Future Enhancements (Current Session)
1. **Advanced Mobile Features**: Gesture-based navigation and mobile-specific interactions
2. **Enhanced Accessibility**: Screen reader optimization and keyboard navigation improvements
3. **Mobile Performance**: Optimized animations and touch response for better mobile performance
4. **Form Validation**: Enhanced validation rules and real-time validation for mobile forms
5. **Mobile Notifications**: Push notifications and mobile-specific notification handling
6. **Offline Support**: Offline form capabilities and data synchronization
7. **Mobile Analytics**: Track mobile usage patterns and user behavior
8. **Progressive Web App**: PWA features for mobile app-like experience
9. **Mobile Testing**: Comprehensive mobile device testing and optimization
10. **Accessibility Compliance**: WCAG 2.1 AA compliance and accessibility audit

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
│   ├── Login.tsx (Enhanced with device trust integration)
│   ├── Settings.tsx (Added Security tab with device management)
│   └── Profile.tsx (Enhanced with accessibility features and password visibility)
├── components/
│   ├── Common/
│   │   ├── GenericFormModal.tsx (Centralized form modal with tabbed interface)
│   │   ├── ModalWrapper.tsx (Enhanced with fullScreen support)
│   │   ├── FloatingTradingButton.tsx (Updated to open GenericFormModal)
│   │   ├── FloatingMenuButton.tsx (Mobile floating menu button)
│   │   ├── ResponsiveTable.tsx (Reusable table component)
│   │   ├── ResponsiveTableWithActions.tsx (Table with actions)
│   │   ├── PermissionBadge.tsx (Permission display)
│   │   └── ResponsiveTable.styles.css (Table styling)
│   ├── Layout/
│   │   └── AppLayout.tsx (Enhanced with FloatingMenuButton integration)
│   ├── Portfolio/
│   │   ├── PortfolioList.tsx (Enhanced mobile layout)
│   │   ├── PortfolioList.styles.css (Fixed mobile header layout)
│   │   ├── PortfolioPermissionModal.tsx (Permission management)
│   │   └── PortfolioCardWithPermissions.tsx (Card with permissions)
│   ├── Trading/
│   │   └── TradeForm.tsx (Updated for GenericFormModal integration)
│   ├── CashFlow/
│   │   ├── CashFlowForm.tsx (Extracted standalone form component)
│   │   ├── CashFlowFormModal.tsx (Refactored to use CashFlowForm)
│   │   ├── CashFlowLayout.tsx (Updated to use separated modals)
│   │   ├── TransferCashModal.tsx (Separated modal component)
│   │   └── CashflowDeleteConfirmationModal.tsx (Renamed modal component)
│   ├── Deposit/
│   │   └── DepositForm.tsx (Updated for GenericFormModal integration)
│   ├── Settings/
│   │   └── DeviceManagement.tsx (Complete device management UI)
│   └── Reports/
│       └── InvestorReport.tsx (Updated to use ResponsiveTable)
├── services/
│   ├── deviceFingerprintService.ts (Advanced device fingerprinting)
│   └── deviceTrustService.ts (Device trust management)
├── types/
│   └── table.types.ts (Table component types)
└── utils/
    └── queryUtils.ts (React Query utilities)
```

### Backend Structure
```
src/
├── modules/
│   ├── shared/
│   │   ├── entities/
│   │   │   └── trusted-device.entity.ts (Device trust database entity)
│   │   ├── services/
│   │   │   ├── device-trust.service.ts (Device trust management)
│   │   │   └── auth.service.ts (Enhanced with device trust)
│   │   ├── controllers/
│   │   │   ├── device-trust.controller.ts (Device trust API endpoints)
│   │   │   └── auth.controller.ts (Enhanced authentication)
│   │   └── decorators/
│   │       └── current-user.decorator.ts (Current user decorator)
│   ├── asset/
│   │   ├── services/
│   │   │   ├── scheduled-price-update.service.ts (Enhanced with fixed-time support)
│   │   │   └── auto-sync.service.ts (Updated for dual scheduling)
│   │   └── controllers/
│   │       └── auto-sync.controller.ts (Enhanced DTOs)
│   └── portfolio/ (Permission system)
├── migrations/
│   └── 1735123456789-CreateTrustedDeviceTable.ts (Device trust migration)
├── config/
│   ├── production.env (Fixed-time configuration)
│   ├── env.development.example (Updated examples)
│   └── .env (Docker container configuration)
└── package.json (Added moment-timezone dependencies)
```

## System Health
- ✅ **Database**: Fully operational with global asset system and all asset types supported
- ✅ **Authentication**: Enhanced with device trust integration and progressive authentication
- ✅ **Frontend**: Responsive with mobile enhancements and accessibility compliance
- ✅ **Backend**: Stable API endpoints with enhanced global asset management and simplified validation
- ✅ **Deployment**: Production-ready configuration with Docker
- ✅ **Global Asset System**: Complete support for all asset types (STOCK, BOND, GOLD, CRYPTO, COMMODITY, REALESTATE, OTHER)
- ✅ **API Field Support**: PriceMode and Status fields properly supported in all global asset operations
- ✅ **Form Validation**: Optional description field with proper null/empty value handling
- ✅ **Code Quality**: Clean TypeScript code with simplified validation logic and proper types
- ✅ **Build System**: Frontend and backend build successfully without errors
- ✅ **Asset Type Validation**: Simplified validation allowing all asset types for all nations
- ✅ **Device Trust System**: Complete implementation with incognito detection and quick login integration
- ✅ **Security**: Enhanced security with device fingerprinting, incognito protection, and public API security
- ✅ **User Experience**: Enhanced mobile experience with floating menu button and improved accessibility
- ✅ **Device Management**: Complete UI for viewing and managing trusted devices
- ✅ **Password Security**: Device expiry on password change/set for enhanced security
- ✅ **Responsive Design**: All components optimized for mobile and desktop with mobile-specific enhancements
- ✅ **Event-Driven Architecture**: Auto asset creation using event-driven pattern
- ✅ **Public API Endpoints**: Public device revocation endpoints working without authentication
- ✅ **Quick Login Integration**: Device trust revocation integrated with quick login history removal
- ✅ **Mobile Navigation**: Floating menu button provides easy mobile navigation access
- ✅ **Form Accessibility**: Full HTML5 and accessibility standards compliance with password visibility features
- ✅ **DOM Compliance**: All DOM warnings resolved for better accessibility and standards compliance

## Notes
- FloatingMenuButton provides easy mobile navigation with touch-friendly design and smooth animations
- Portfolio list header maintains consistent layout on mobile with title and buttons on same row
- Profile forms now have full accessibility compliance with proper form structure and autocomplete attributes
- Password visibility toggle implemented for all password fields with mobile-friendly touch interactions
- All DOM warnings resolved for better accessibility and HTML5 standards compliance
- Hidden username fields added for password manager compatibility and better user experience
- Form submission enhanced with proper preventDefault() and type attributes for better form handling
- Mobile user experience significantly improved with floating menu button and responsive design enhancements
- System maintains all previous functionality while adding mobile-specific improvements
- Device trust system and other core features remain fully functional with mobile enhancements
- Multi-account portfolio management system remains fully operational with mobile UI improvements
- Permission-based access control continues to work across all APIs with enhanced mobile support
- System is ready for production deployment with comprehensive mobile and accessibility enhancements