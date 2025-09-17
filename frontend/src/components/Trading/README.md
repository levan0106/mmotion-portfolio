# Trading Components

This directory contains all trading-related components for the Portfolio Management System.

## Components Overview

### TradeListContainer
The main container component that manages the trade history display and interactions.

**Features:**
- Displays paginated list of trades
- Advanced filtering and search capabilities
- Edit and View Details actions
- Delete confirmation
- Real-time data updates

**Usage:**
```tsx
import { TradeListContainer } from './TradeList';

<TradeListContainer portfolioId="portfolio-123" />
```

### TradeDetailsModal
Modal component for viewing comprehensive trade details.

**Features:**
- Complete trade information display
- Trade matching details for sell trades
- P&L calculations
- Edit action integration
- Responsive design

**Usage:**
```tsx
import TradeDetailsModal from './TradeDetailsModal';

<TradeDetailsModal
  open={isOpen}
  onClose={handleClose}
  onEdit={handleEdit}
  trade={selectedTrade}
  tradeDetails={tradeDetails}
  isLoading={isLoading}
  error={error}
/>
```

### EditTradeModal
Modal component for editing existing trades.

**Features:**
- Pre-populated form with existing trade data
- Full validation
- Real-time calculations
- Integration with TradeForm component

**Usage:**
```tsx
import EditTradeModal from './EditTradeModal';

<EditTradeModal
  open={isOpen}
  onClose={handleClose}
  onSubmit={handleSubmit}
  initialData={tradeData}
  isLoading={isLoading}
  error={error}
/>
```

### TradeForm
Comprehensive form component for creating and editing trades.

**Features:**
- Support for both create and edit modes
- Real-time total value and cost calculations
- Asset selection with search
- Portfolio selection
- Comprehensive validation
- Date picker integration

**Usage:**
```tsx
import { TradeForm } from './TradeForm';

<TradeForm
  onSubmit={handleSubmit}
  initialData={initialData}
  mode="edit" // or "create"
  isLoading={isLoading}
  error={error}
  defaultPortfolioId="portfolio-123"
/>
```

## API Integration

### Hooks

#### useTrades
Fetches trades for a specific portfolio with optional filtering.

```tsx
const { data: trades, isLoading, error } = useTrades(portfolioId, filters);
```

#### useUpdateTrade
Mutation hook for updating existing trades.

```tsx
const updateTrade = useUpdateTrade();
await updateTrade.mutateAsync({ id: tradeId, data: updateData });
```

#### useDeleteTrade
Mutation hook for deleting trades.

```tsx
const deleteTrade = useDeleteTrade();
await deleteTrade.mutateAsync(tradeId);
```

#### useTradeDetails
Fetches detailed information about a specific trade including matching details.

```tsx
const { data: tradeDetails, isLoading, error } = useTradeDetails(tradeId);
```

### API Endpoints

#### GET /api/v1/trades/:id
Retrieves a specific trade by ID.

#### PUT /api/v1/trades/:id
Updates an existing trade.

#### DELETE /api/v1/trades/:id
Deletes a trade.

#### GET /api/v1/trades/:id/details
Retrieves trade details including matching information.

## User Workflows

### Editing a Trade

1. User clicks the "Actions" button (⋮) next to a trade in the trade list
2. User selects "Edit Trade" from the dropdown menu
3. EditTradeModal opens with the TradeForm pre-populated with existing data
4. User modifies the desired fields
5. User clicks "Update Trade" to save changes
6. Modal closes and trade list refreshes with updated data

### Viewing Trade Details

1. User clicks the "Actions" button (⋮) next to a trade in the trade list
2. User selects "View Details" from the dropdown menu
3. TradeDetailsModal opens showing comprehensive trade information
4. User can click "Edit" button to switch to edit mode
5. User can click "Close" to return to trade list

### Deleting a Trade

1. User clicks the "Actions" button (⋮) next to a trade in the trade list
2. User selects "Delete Trade" from the dropdown menu
3. Browser shows confirmation dialog
4. User confirms deletion
5. Trade is deleted and list refreshes

## Error Handling

All components include comprehensive error handling:

- **Network errors**: Displayed as user-friendly messages
- **Validation errors**: Shown inline with form fields
- **Loading states**: Proper loading indicators during async operations
- **Empty states**: Appropriate messages when no data is available

## Styling and Theming

Components use Material-UI theming system:

- Consistent color scheme based on trade side (Buy/Sell)
- Responsive design for mobile and desktop
- Accessible components with proper ARIA labels
- Loading states and error indicators

## Testing

Components include comprehensive test coverage:

- Unit tests for individual components
- Integration tests for user workflows
- Mock implementations for API calls
- Accessibility testing

Run tests with:
```bash
npm test
```

## Future Enhancements

- Bulk edit functionality
- Advanced filtering options
- Export capabilities
- Real-time updates via WebSocket
- Mobile-optimized interface
- Advanced analytics integration
