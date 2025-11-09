# Historical Prices Frontend Implementation

## Overview

Frontend implementation for the historical prices update functionality in the Global Assets page. This implementation provides a user-friendly interface for updating historical price data with date range selection and asset management.

## Components Created

### 1. **HistoricalPricesService** (`frontend/src/services/historicalPrices.service.ts`)

**Purpose**: Service layer for API communication with historical prices endpoints

**Key Features**:
- ✅ **Update Historical Prices**: `updateHistoricalPrices()` method
- ✅ **Get Historical Prices**: `getHistoricalPrices()` method  
- ✅ **Asset Type Management**: `getAssetTypes()` and `getCommonSymbols()` methods
- ✅ **Type Safety**: Full TypeScript interfaces for requests and responses

**API Endpoints Used**:
- `POST /api/v1/market-data/historical-prices/update` - Update historical prices
- `GET /api/v1/market-data/historical-prices` - Get historical prices

### 2. **useHistoricalPrices Hook** (`frontend/src/hooks/useHistoricalPrices.ts`)

**Purpose**: Custom React hook for managing historical prices state and operations

**Key Features**:
- ✅ **React Query Integration**: Automatic caching and refetching
- ✅ **Mutation Management**: Handle update operations with loading states
- ✅ **Error Handling**: Comprehensive error management
- ✅ **Utility Functions**: Asset types and common symbols access

**Hook Interface**:
```typescript
interface UseHistoricalPricesReturn {
  // Query data
  historicalPrices: any[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;

  // Update mutation
  updateHistoricalPrices: (request: HistoricalPriceUpdateRequest) => Promise<HistoricalPriceUpdateResult>;
  isUpdating: boolean;
  updateError: Error | null;
  updateResult: HistoricalPriceUpdateResult | null;

  // Utility functions
  getAssetTypes: () => Array<{value: string, label: string}>;
  getCommonSymbols: () => Record<string, string[]>;
}
```

### 3. **HistoricalPricesUpdateDialog** (`frontend/src/components/HistoricalPrices/HistoricalPricesUpdateDialog.tsx`)

**Purpose**: Main modal dialog for historical prices update functionality

**Key Features**:
- ✅ **Date Range Selection**: Start and end date pickers with validation
- ✅ **Asset Management**: Add/remove assets with symbol and type selection
- ✅ **Common Symbols**: Quick-add buttons for common asset types
- ✅ **Advanced Options**: Force update and cleanup toggles
- ✅ **Form Validation**: Comprehensive validation before submission
- ✅ **Loading States**: Visual feedback during processing
- ✅ **Error Handling**: Display errors and success messages

**UI Components**:
- **Date Range Card**: Date pickers for start/end dates
- **Asset Selection Card**: Symbol input, type selection, and asset list
- **Advanced Options Card**: Force update and cleanup switches
- **Status Display**: Loading, error, and success messages

### 4. **HistoricalPricesButton** (`frontend/src/components/HistoricalPrices/HistoricalPricesButton.tsx`)

**Purpose**: Trigger button component for opening the historical prices dialog

**Key Features**:
- ✅ **Multiple Variants**: Button, icon, and text variants
- ✅ **Customizable**: Size, color, and icon options
- ✅ **Tooltip Support**: Helpful tooltips for icon variants
- ✅ **Success Callback**: Handle successful updates

**Variants**:
- **Button**: Standard button with text and icon
- **Icon**: Icon-only button with tooltip
- **Text**: Text-only button

### 5. **GlobalAssetsPage Integration** (`frontend/src/pages/GlobalAssetsPage.tsx`)

**Purpose**: Integration of historical prices functionality into the main Global Assets page

**Key Features**:
- ✅ **Button Placement**: Added next to existing "Update Price by Date" button
- ✅ **Success Handling**: Refresh assets after successful update
- ✅ **Consistent UI**: Matches existing design patterns

## User Interface Design

### **Modal Layout**
```
┌─────────────────────────────────────────────────────────┐
│ 📊 Cập nhật giá lịch sử                                 │
├─────────────────────────────────────────────────────────┤
│ 📅 Khoảng thời gian                                     │
│ [Start Date] [End Date]                                 │
├─────────────────────────────────────────────────────────┤
│ 📋 Danh sách tài sản                                    │
│ [Symbol Input] [Type Select] [Add Button]               │
│ Quick Add: [Stock] [Fund] [Gold] [Crypto]              │
│ Selected: [VFF (STOCK)] [HPG (STOCK)] [VCB (STOCK)]    │
├─────────────────────────────────────────────────────────┤
│ ⚙️ Tùy chọn nâng cao                                    │
│ ☐ Force Update - Luôn thêm record mới                  │
│ ☐ Cleanup - Xóa toàn bộ dữ liệu cũ                    │
├─────────────────────────────────────────────────────────┤
│ [Cancel] [Update]                                       │
└─────────────────────────────────────────────────────────┘
```

### **Button Placement**
```
┌─────────────────────────────────────────────────────────┐
│ Market Price Auto Sync                    [Update] [📊] │
│ ☐ Auto Sync Enabled                                     │
└─────────────────────────────────────────────────────────┘
```

## Usage Examples

### **Basic Usage**
```tsx
import { HistoricalPricesButton } from '../components/HistoricalPrices';

// Simple button
<HistoricalPricesButton />

// With success callback
<HistoricalPricesButton
  onSuccess={(result) => {
    console.log('Update completed:', result);
    // Refresh data or show notification
  }}
/>
```

### **Custom Variants**
```tsx
// Icon button with tooltip
<HistoricalPricesButton
  variant="icon"
  size="small"
  color="primary"
/>

// Text button
<HistoricalPricesButton
  variant="text"
  children="Update Historical Data"
/>
```

### **Advanced Configuration**
```tsx
// Custom button with specific styling
<HistoricalPricesButton
  variant="button"
  size="large"
  color="secondary"
  startIcon={<CustomIcon />}
  onSuccess={(result) => {
    // Handle success
    showNotification(`Updated ${result.totalRecords} records`);
    refreshData();
  }}
/>
```

## Form Validation

### **Required Fields**
- ✅ **Start Date**: Must be selected
- ✅ **End Date**: Must be selected and after start date
- ✅ **Assets**: At least one asset must be selected

### **Date Validation**
- ✅ **Start Date**: Cannot be in the future
- ✅ **End Date**: Must be after start date, cannot be in the future
- ✅ **Range**: Maximum 1 year range for performance

### **Asset Validation**
- ✅ **Symbol Format**: Uppercase, alphanumeric
- ✅ **Type Selection**: Must be valid asset type
- ✅ **Duplicate Check**: No duplicate symbol+type combinations

## Error Handling

### **API Errors**
```typescript
// Network errors
if (error.code === 'NETWORK_ERROR') {
  showError('Không thể kết nối đến server');
}

// Validation errors
if (error.status === 400) {
  showError('Dữ liệu không hợp lệ: ' + error.message);
}

// Server errors
if (error.status >= 500) {
  showError('Lỗi server, vui lòng thử lại sau');
}
```

### **Form Errors**
```typescript
// Date validation
if (!startDate || !endDate) {
  showError('Vui lòng chọn khoảng thời gian');
}

// Asset validation
if (symbols.length === 0) {
  showError('Vui lòng chọn ít nhất một tài sản');
}
```

## Success Handling

### **Update Results**
```typescript
interface UpdateResult {
  success: number;        // Number of successful assets
  failed: number;         // Number of failed assets
  errors: string[];       // Error messages
  totalRecords: number;   // Total records processed
  processedSymbols: Array<{
    symbol: string;
    recordCount: number;
    dateRange: { start: string; end: string; };
  }>;
}
```

### **Success Messages**
```typescript
// Success notification
showSuccess(`Cập nhật thành công: ${result.success} tài sản, ${result.totalRecords} bản ghi`);

// Partial success
if (result.failed > 0) {
  showWarning(`Cập nhật hoàn thành với ${result.failed} lỗi`);
}
```

## Performance Considerations

### **API Optimization**
- ✅ **Batch Processing**: Process multiple assets in single request
- ✅ **Date Range Limits**: Maximum 1 year range for performance
- ✅ **Asset Limits**: Maximum 50 assets per request

### **UI Optimization**
- ✅ **Lazy Loading**: Dialog only loads when opened
- ✅ **Debounced Input**: Symbol input with debouncing
- ✅ **Efficient Rendering**: Minimal re-renders with proper state management

### **Caching Strategy**
- ✅ **React Query**: Automatic caching with 5-minute stale time
- ✅ **Asset Types**: Cached asset types and common symbols
- ✅ **Form State**: Preserved form state during session

## Accessibility Features

### **Keyboard Navigation**
- ✅ **Tab Order**: Logical tab order through form elements
- ✅ **Enter Key**: Submit form with Enter key
- ✅ **Escape Key**: Close dialog with Escape key

### **Screen Reader Support**
- ✅ **ARIA Labels**: Proper labels for all form elements
- ✅ **Status Announcements**: Screen reader announcements for status changes
- ✅ **Error Messages**: Clear error messages for screen readers

### **Visual Accessibility**
- ✅ **High Contrast**: Sufficient color contrast for all elements
- ✅ **Focus Indicators**: Clear focus indicators for keyboard navigation
- ✅ **Loading States**: Visual feedback for all loading states

## Testing Considerations

### **Unit Tests**
- ✅ **Service Tests**: Test API calls and error handling
- ✅ **Hook Tests**: Test React Query integration
- ✅ **Component Tests**: Test form validation and user interactions

### **Integration Tests**
- ✅ **API Integration**: Test with real API endpoints
- ✅ **Form Submission**: Test complete form submission flow
- ✅ **Error Scenarios**: Test various error conditions

### **E2E Tests**
- ✅ **User Workflow**: Test complete user workflow
- ✅ **Success Scenarios**: Test successful update scenarios
- ✅ **Error Scenarios**: Test error handling and recovery

## Future Enhancements

### **Planned Features**
- ✅ **Bulk Import**: CSV/Excel file import for large asset lists
- ✅ **Scheduled Updates**: Schedule automatic historical price updates
- ✅ **Progress Tracking**: Real-time progress tracking for large updates
- ✅ **Export Results**: Export update results to CSV/Excel

### **UI Improvements**
- ✅ **Drag & Drop**: Drag and drop for asset management
- ✅ **Search & Filter**: Search and filter assets in the dialog
- ✅ **Templates**: Save and reuse common asset configurations
- ✅ **History**: View and manage update history

## Conclusion

The historical prices frontend implementation provides a comprehensive, user-friendly interface for managing historical price data updates. The implementation follows React best practices with proper state management, error handling, and accessibility features.

**Key Benefits**:
- ✅ **User-Friendly**: Intuitive interface with clear validation
- ✅ **Flexible**: Support for various update scenarios
- ✅ **Robust**: Comprehensive error handling and validation
- ✅ **Accessible**: Full accessibility support
- ✅ **Maintainable**: Clean, well-structured code
- ✅ **Testable**: Comprehensive testing support
