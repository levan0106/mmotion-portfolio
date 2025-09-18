# Cash Flow Management Components

This directory contains components for managing cash flows in the portfolio management system.

## Components

### 1. CashFlowDashboard
Main dashboard component that provides a comprehensive view of cash flow management.

**Features:**
- Summary cards showing total deposits, withdrawals, dividends, and net cash flow
- Interactive data table with filtering and sorting
- Quick action buttons for creating deposits, withdrawals, and dividends
- Real-time data refresh
- Modern Material-UI design with Speed Dial for quick actions

**Props:**
- `portfolioId: string` - Portfolio ID to manage cash flows for
- `onCashFlowUpdate?: () => void` - Callback when cash flow is updated

### 2. CashFlowSummary
Compact summary component for displaying cash flow statistics.

**Features:**
- Key metrics display (deposits, withdrawals, dividends, net flow)
- Recent transaction count
- Refresh functionality
- Compact card layout

**Props:**
- `portfolioId: string` - Portfolio ID to show summary for
- `onRefresh?: () => void` - Callback for refresh action

### 3. CashFlowChart
Advanced charting component for cash flow analytics.

**Features:**
- Multiple chart types: Line, Bar, Pie
- Time range selection (7d, 30d, 90d, 1y)
- Interactive tooltips and legends
- Responsive design
- Real-time data updates

**Props:**
- `portfolioId: string` - Portfolio ID to chart data for

## API Integration

All components integrate with the following API endpoints:

- `GET /api/v1/portfolios/:id/cash-flow/history` - Get cash flow history
- `GET /api/v1/portfolios/:id/cash-flow/balance` - Get current cash balance
- `POST /api/v1/portfolios/:id/cash-flow/deposit` - Create deposit
- `POST /api/v1/portfolios/:id/cash-flow/withdrawal` - Create withdrawal
- `POST /api/v1/portfolios/:id/cash-flow/dividend` - Create dividend
- `PUT /api/v1/portfolios/:id/cash-flow/:cashFlowId/cancel` - Cancel cash flow

## Usage

### In Portfolio Detail Page
```tsx
import CashFlowDashboard from '../components/CashFlow/CashFlowDashboard';

<CashFlowDashboard 
  portfolioId={portfolioId} 
  onCashFlowUpdate={() => {
    // Refresh portfolio data
    refetchPortfolio();
  }}
/>
```

### As Summary Widget
```tsx
import CashFlowSummary from '../components/CashFlow/CashFlowSummary';

<CashFlowSummary 
  portfolioId={portfolioId} 
  onRefresh={() => {
    // Handle refresh
  }}
/>
```

### For Analytics
```tsx
import CashFlowChart from '../components/CashFlow/CashFlowChart';

<CashFlowChart portfolioId={portfolioId} />
```

## Features

### Cash Flow Types
- **DEPOSIT**: Money added to portfolio
- **WITHDRAWAL**: Money removed from portfolio
- **DIVIDEND**: Dividend payments received
- **INTEREST**: Interest earned
- **FEE**: Fees paid
- **TAX**: Taxes paid
- **TRADE_SETTLEMENT**: Cash movements from trades

### Status Types
- **COMPLETED**: Successfully processed
- **PENDING**: Awaiting processing
- **CANCELLED**: Cancelled by user
- **FAILED**: Processing failed

### Key Features
- Real-time balance updates
- Transaction history tracking
- Advanced filtering and search
- Interactive charts and analytics
- Quick action buttons
- Responsive design
- Error handling and loading states

## Styling

Components use Material-UI theming and follow the application's design system:
- Consistent color scheme
- Responsive breakpoints
- Loading states
- Error handling
- Accessibility features

## Dependencies

- React 18+
- Material-UI 5+
- Recharts for charting
- TypeScript for type safety
