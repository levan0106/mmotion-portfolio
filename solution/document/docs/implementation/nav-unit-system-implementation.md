# NAV/Unit System Implementation Document

## 📋 Overview

This document outlines the implementation of NAV/Unit system for the Portfolio Management System, enabling fund management capabilities with multiple investors.

## 🎯 Requirements

### Core Features
1. **Fund Management**: Convert Portfolio to Fund with multiple investors
2. **NAV/Unit Calculation**: Calculate Net Asset Value per unit
3. **Investor Holdings**: Track individual investor holdings
4. **Subscription/Redemption**: Allow investors to buy/sell fund units
5. **Audit Trail**: Complete transaction history via CashFlow

### Business Logic
- **NAV/Unit = NAV Tổng ÷ Tổng số đơn vị quỹ đang lưu hành**
- **Investor Holdings**: Track units, average cost, P&L
- **Cash Flow Integration**: Link fund transactions to existing CashFlow system

## 🏗️ Database Schema

### 1. Portfolio Entity Extensions
```sql
ALTER TABLE portfolios ADD COLUMN is_fund BOOLEAN DEFAULT false;
ALTER TABLE portfolios ADD COLUMN total_outstanding_units DECIMAL(20,8) DEFAULT 0;
ALTER TABLE portfolios ADD COLUMN nav_per_unit DECIMAL(20,8) DEFAULT 0;
```

### 2. Account Entity Extensions
```sql
ALTER TABLE accounts ADD COLUMN is_investor BOOLEAN DEFAULT false;
```

### 3. InvestorHolding Entity (New)
```sql
CREATE TABLE investor_holdings (
  holding_id UUID PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES accounts(account_id),
  portfolio_id UUID NOT NULL REFERENCES portfolios(portfolio_id),
  total_units DECIMAL(20,8) DEFAULT 0,
  avg_cost_per_unit DECIMAL(20,8) DEFAULT 0,
  total_investment DECIMAL(20,8) DEFAULT 0,
  current_value DECIMAL(20,8) DEFAULT 0,
  unrealized_pnl DECIMAL(20,8) DEFAULT 0,
  realized_pnl DECIMAL(20,8) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(account_id, portfolio_id)
);
```

### 4. PortfolioSnapshot Extensions
```sql
ALTER TABLE portfolio_snapshots ADD COLUMN total_outstanding_units DECIMAL(20,8) DEFAULT 0;
ALTER TABLE portfolio_snapshots ADD COLUMN nav_per_unit DECIMAL(20,8) DEFAULT 0;
```

## 🔧 Implementation Plan

### Phase 1: Database & Entities ✅
- [x] Create migration scripts
- [x] Extend Portfolio entity
- [x] Extend Account entity
- [x] Create InvestorHolding entity
- [x] Extend PortfolioSnapshot entity

### Phase 2: Services Implementation 🚧
- [ ] Create InvestorHoldingService
- [ ] Extend PortfolioService with NAV/Unit calculations
- [ ] Create FundManagementService
- [ ] Update CashFlowService integration

### Phase 3: API Endpoints 📋
- [ ] Create InvestorController
- [ ] Extend PortfolioController with fund endpoints
- [ ] Create FundManagementController
- [ ] Add NAV/Unit calculation endpoints

### Phase 4: Frontend Updates 📋
- [ ] Update NAVSummary component
- [ ] Create FundDashboard component
- [ ] Create InvestorHoldings component
- [ ] Update PortfolioDetail page

## 📊 Business Logic

### NAV/Unit Calculation
```typescript
async calculateNavPerUnit(portfolioId: string): Promise<number> {
  const portfolio = await this.portfolioRepository.findOne({ where: { portfolioId } });
  
  if (!portfolio.isFund || portfolio.totalOutstandingUnits <= 0) {
    return 0;
  }
  
  const navValue = portfolio.totalPortfolioValue;
  return navValue / portfolio.totalOutstandingUnits;
}
```

### Subscription Process
1. Calculate current NAV/Unit
2. Calculate units to be issued
3. Create CashFlow record (DEPOSIT)
4. Create/Update InvestorHolding
5. Update Portfolio totalOutstandingUnits

### Redemption Process
1. Validate sufficient units
2. Calculate current NAV/Unit
3. Calculate redemption amount
4. Create CashFlow record (WITHDRAWAL)
5. Update InvestorHolding
6. Update Portfolio totalOutstandingUnits

## 🔗 Integration Points

### CashFlow Integration
- Use existing CashFlowType.DEPOSIT/WITHDRAWAL
- Link via referenceId field
- No changes to CashFlow entity required

### PortfolioSnapshot Integration
- Extend existing snapshot system
- Add NAV/Unit fields to snapshots
- Maintain historical NAV/Unit data

## 📈 Success Metrics

### Technical Metrics
- [ ] All unit tests passing
- [ ] API endpoints responding correctly
- [ ] Database migrations successful
- [ ] Frontend components rendering

### Business Metrics
- [ ] NAV/Unit calculations accurate
- [ ] Investor holdings tracking correctly
- [ ] Subscription/redemption working
- [ ] Audit trail complete

## 🚀 Deployment Plan

### Development Environment
1. Run database migrations
2. Deploy backend services
3. Deploy frontend updates
4. Run integration tests

### Production Environment
1. Backup existing data
2. Run migrations during maintenance window
3. Deploy services
4. Verify functionality
5. Monitor system performance

## 📝 Testing Strategy

### Unit Tests
- NAV/Unit calculation logic
- Investor holding updates
- Subscription/redemption processes
- Portfolio fund conversion

### Integration Tests
- End-to-end subscription flow
- End-to-end redemption flow
- CashFlow integration
- PortfolioSnapshot updates

### E2E Tests
- Complete investor journey
- Fund management workflows
- NAV/Unit display accuracy

## 🔍 Monitoring & Alerting

### Key Metrics to Monitor
- NAV/Unit calculation accuracy
- Investor holding updates
- Subscription/redemption volumes
- System performance

### Alerts
- NAV/Unit calculation errors
- Investor holding inconsistencies
- High subscription/redemption volumes
- System performance degradation

## 📚 Documentation Updates

### API Documentation
- Update Swagger/OpenAPI specs
- Document new endpoints
- Provide examples

### User Documentation
- Fund management guide
- Investor onboarding process
- NAV/Unit explanation

### Developer Documentation
- Architecture decisions
- Implementation details
- Testing guidelines

## 🎯 Future Enhancements

### Phase 2 Features
- Fund performance reporting
- Investor statements
- Dividend distribution
- Fee management

### Phase 3 Features
- Multi-currency support
- Advanced fund types
- Regulatory compliance
- Risk management

---

**Status**: 🚧 In Progress  
**Last Updated**: 2024-12-19  
**Next Review**: 2024-12-20
