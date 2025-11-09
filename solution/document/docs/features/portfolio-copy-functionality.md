# Portfolio Copy Functionality

## Overview
The Portfolio Copy functionality allows users to create a complete duplicate of an existing portfolio, including all related data such as trades, cash flows, deposits, and snapshots. This feature is useful for creating template portfolios or testing scenarios.

## Features

### Backend Implementation
- **API Endpoint**: `POST /api/v1/portfolios/copy`
- **Complete Data Duplication**: Copies all portfolio data including:
  - Portfolio basic information (name, currency, settings)
  - All trades and trade details
  - Cash flows and transactions
  - Deposits and interest settings
  - Portfolio snapshots and performance data
- **Data Integrity**: Maintains referential integrity across all related tables
- **Validation**: Ensures unique portfolio names and proper data validation

### Frontend Implementation
- **Copy Button**: Integrated into portfolio cards with intuitive UI
- **Modal Interface**: Clean, user-friendly copy modal with form validation
- **Event Handling**: Proper event propagation prevention to avoid conflicts
- **Navigation**: Automatic redirect to newly created portfolio after copy
- **Error Handling**: Comprehensive error handling and user feedback

## API Reference

### Copy Portfolio Endpoint
```http
POST /api/v1/portfolios/copy
Content-Type: application/json

{
  "sourcePortfolioId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "New Portfolio Name"
}
```

**Response:**
```json
{
  "portfolioId": "new-portfolio-uuid",
  "name": "New Portfolio Name",
  "accountId": "account-uuid",
  "baseCurrency": "VND",
  "totalValue": "0.00",
  "cashBalance": "8937522.96",
  "unrealizedPl": "0.00",
  "realizedPl": "0.00",
  "createdAt": "2025-09-29T02:15:47.255Z",
  "updatedAt": "2025-09-29T02:15:47.255Z"
}
```

## Data Cleanup Scripts

### Portfolio Cleanup Script
```bash
# List all portfolios
npm run portfolio:list

# Cleanup specific portfolio
npm run portfolio:cleanup <portfolioId>

# Get help for portfolio cleanup
npm run portfolio:cleanup:help

# Example
npm run portfolio:cleanup 550e8400-e29b-41d4-a716-446655440001
```

### Script Features
- **Complete Data Removal**: Deletes all related data in correct order
- **Foreign Key Handling**: Properly handles foreign key constraints
- **Error Reporting**: Detailed error reporting and success metrics
- **Safe Operation**: Validates portfolio existence before deletion

## Implementation Details

### Backend Service
```typescript
// Portfolio Service - Copy Method
async copyPortfolio(sourcePortfolioId: string, newName: string): Promise<Portfolio> {
  // 1. Validate source portfolio exists
  // 2. Create new portfolio with copied data
  // 3. Copy all trades and trade details
  // 4. Copy cash flows and deposits
  // 5. Copy portfolio snapshots
  // 6. Clear cache and return new portfolio
}
```

### Frontend Components
```typescript
// CopyPortfolioModal Component
interface CopyPortfolioModalProps {
  open: boolean;
  onClose: () => void;
  sourcePortfolio: Portfolio | null;
  onPortfolioCopied: (newPortfolio: Portfolio) => void;
  onModalClose?: () => void;
}
```

### Database Tables Affected
- `portfolios` - Main portfolio data
- `trades` - All trade records
- `trade_details` - Matched trade details
- `cash_flows` - Cash flow transactions
- `deposits` - Deposit records
- `portfolio_snapshots` - Portfolio snapshots
- `nav_snapshots` - NAV snapshots

## Usage Examples

### Basic Copy Operation
1. Navigate to portfolio dashboard
2. Click "Copy" button on desired portfolio
3. Enter new portfolio name in modal
4. Click "Copy Portfolio" button
5. System creates complete copy and redirects to new portfolio

### Cleanup Operation
1. List all portfolios: `npm run portfolio:list`
2. Identify portfolio to cleanup
3. Run cleanup: `npm run portfolio:cleanup <portfolioId>`
4. Verify cleanup completion

## Error Handling

### Common Errors
- **Portfolio Not Found**: Source portfolio doesn't exist
- **Duplicate Name**: Portfolio name already exists
- **Database Constraints**: Foreign key constraint violations
- **Validation Errors**: Invalid input data

### Error Responses
```json
{
  "statusCode": 404,
  "message": "Portfolio with ID {id} not found",
  "error": "Not Found"
}
```

## Performance Considerations

### Optimization Features
- **Batch Operations**: Efficient database operations
- **Transaction Management**: Atomic operations for data integrity
- **Cache Management**: Automatic cache clearing after copy
- **Memory Management**: Efficient handling of large datasets

### Performance Metrics
- **Copy Time**: Typically < 2 seconds for portfolios with 100+ trades
- **Memory Usage**: Minimal memory overhead during copy operation
- **Database Impact**: Optimized queries with proper indexing

## Security Considerations

### Data Protection
- **Input Validation**: Comprehensive input sanitization
- **Access Control**: Portfolio ownership validation
- **Data Integrity**: Referential integrity maintenance
- **Audit Trail**: Complete operation logging

## Testing

### Test Coverage
- **Unit Tests**: Service method testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Complete user workflow testing
- **Error Scenarios**: Comprehensive error handling tests

### Test Commands
```bash
# Backend tests
npm run test -- --testPathPattern=portfolio

# Frontend tests
cd frontend && npm run test -- --testPathPattern=CopyPortfolio

# E2E tests
npm run test:e2e -- --testNamePattern="portfolio copy"
```

## Future Enhancements

### Planned Features
- **Bulk Copy**: Copy multiple portfolios at once
- **Template System**: Save portfolios as templates
- **Version Control**: Track portfolio versions
- **Selective Copy**: Choose which data to copy

### Technical Improvements
- **Async Processing**: Background copy operations for large portfolios
- **Progress Tracking**: Real-time copy progress indication
- **Rollback Capability**: Undo copy operations
- **Advanced Filtering**: Copy with data filters

## Troubleshooting

### Common Issues
1. **Copy Fails**: Check portfolio permissions and data integrity
2. **Navigation Issues**: Verify frontend routing configuration
3. **Data Inconsistency**: Run database integrity checks
4. **Performance Issues**: Monitor database query performance

### Debug Commands
```bash
# Check portfolio data
npm run portfolio:list

# Get help for portfolio cleanup
npm run portfolio:cleanup:help

# Verify database integrity
npm run typeorm:schema:log

# Check application logs
tail -f logs/app.log
```

## Support

For issues or questions regarding the Portfolio Copy functionality:
- Check the [API Documentation](../api/portfolio-api.md)
- Review the [Troubleshooting Guide](../development/troubleshooting.md)
- Open an issue on GitHub with detailed error information
