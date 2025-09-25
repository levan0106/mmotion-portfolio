# Fund Data Cleanup Guide

## Overview
This guide explains how to clean up fund data for testing purposes. The cleanup script will remove all fund-related data and reset portfolios to a clean state.

## Script Location
- **Main Script**: `scripts/cleanup-fund-data.ts`
- **NPM Command**: `npm run cleanup:fund-data`

## What Gets Cleaned Up

### 1. Fund Unit Transactions
- All records in `fund_unit_transactions` table
- Both SUBSCRIBE and REDEEM transactions

### 2. Investor Holdings
- All records in `investor_holdings` table
- All holding data including units, investments, P&L

### 3. Cash Flows
- Only cash flows related to fund unit transactions (via `cash_flow_id` reference)
- Preserves other cash flows not related to fund operations

### 4. Portfolio Reset
- Set `is_fund = false`
- Set `total_outstanding_units = 0`
- Set `nav_per_unit = 0`
- Set `last_nav_date = NULL`

## Usage

### Option 1: Clean All Funds
```bash
# Using npm script
npm run cleanup:fund-data

# Using direct command
npx ts-node scripts/cleanup-fund-data.ts
```

### Option 2: Clean Specific Portfolio
```bash
# Using npm script with portfolio ID
npm run cleanup:fund-data -- 1ec02079-71ac-42f3-b62d-5e1de1d1d750

# Using direct command with portfolio ID
npx ts-node scripts/cleanup-fund-data.ts 1ec02079-71ac-42f3-b62d-5e1de1d1d750
```

## Example Output

```
🧹 Starting Fund Data Cleanup...

📊 Processing portfolio: Testing fund (4aaa1f57-2a0b-4a8b-8d9a-b29f05df96a1)
   📈 Before cleanup:
      - Fund Unit Transactions: 5
      - Investor Holdings: 1
      - Cash Flows: 3
      - Is Fund: true
      - Total Outstanding Units: 1000
      - NAV per Unit: 10000
   ✅ After cleanup:
      - Fund Unit Transactions: 0 (deleted 5)
      - Investor Holdings: 0 (deleted 1)
      - Cash Flows: 0 (deleted 3)
      - Is Fund: false
      - Total Outstanding Units: 0
      - NAV per Unit: 0
   🎉 Portfolio Testing fund cleaned successfully!

📋 CLEANUP SUMMARY
==================
Total portfolios processed: 1
Total fund unit transactions deleted: 5
Total investor holdings deleted: 1
Total cash flows deleted: 3
Total portfolios reset: 1

🎯 Next Steps:
1. Convert portfolio to fund: POST /api/v1/portfolios/{portfolioId}/convert-to-fund
2. Test subscription: POST /api/v1/investor-holdings/subscribe
3. Test redemption: POST /api/v1/investor-holdings/redeem
4. Check holding details: GET /api/v1/investor-holdings/{holdingId}/detail

✅ Fund data cleanup completed successfully!
```

## Testing Workflow

### 1. Clean Up Data
```bash
npm run cleanup:fund-data
```

### 2. Convert Portfolio to Fund
```bash
curl -X POST http://localhost:3000/api/v1/portfolios/{portfolioId}/convert-to-fund
```

### 3. Test Subscription
```bash
curl -X POST http://localhost:3000/api/v1/investor-holdings/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "86c2ae61-8f69-4608-a5fd-8fecb44ed2c5",
    "portfolioId": "{portfolioId}",
    "amount": 1000000,
    "description": "Test subscription"
  }'
```

### 4. Test Redemption
```bash
curl -X POST http://localhost:3000/api/v1/investor-holdings/redeem \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "86c2ae61-8f69-4608-a5fd-8fecb44ed2c5",
    "portfolioId": "{portfolioId}",
    "units": 50,
    "description": "Test redemption"
  }'
```

### 5. Check Holding Details
```bash
curl http://localhost:3000/api/v1/investor-holdings/{holdingId}/detail
```

## Safety Features

### 1. Confirmation
- Script shows detailed before/after status
- Clear summary of what was deleted
- No silent operations

### 2. Error Handling
- Graceful error handling
- Clear error messages
- Rollback on failure

### 3. Logging
- Detailed logging of all operations
- Clear success/failure indicators
- Step-by-step progress

## Notes

- **Backup**: Always backup your database before running cleanup
- **Testing Only**: This script is designed for testing environments
- **Production**: Do not run in production without proper backup
- **Dependencies**: Requires NestJS application context to be running

## Troubleshooting

### Common Issues

1. **"Portfolio not found"**
   - Check portfolio ID is correct
   - Ensure portfolio exists in database

2. **"Database connection error"**
   - Ensure database is running
   - Check connection settings

3. **"Permission denied"**
   - Ensure proper database permissions
   - Check user has DELETE privileges

### Getting Help

If you encounter issues:
1. Check the error message
2. Verify database connection
3. Ensure all dependencies are installed
4. Check portfolio ID format (UUID)
