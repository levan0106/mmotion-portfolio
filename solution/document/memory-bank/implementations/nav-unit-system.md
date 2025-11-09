# NAV/Unit System Implementation - Memory Bank

## 📋 Project Context

**Project**: Portfolio Management System  
**Feature**: NAV/Unit System Implementation  
**Status**: 🚧 In Progress  
**Start Date**: 2024-12-19  

## 🎯 Objective

Implement NAV/Unit system to enable fund management capabilities, allowing portfolios to operate as funds with multiple investors.

## 🏗️ Architecture Decisions

### Database Design
- **Reuse existing tables**: Portfolio, Account, CashFlow, PortfolioSnapshot
- **Minimal new tables**: Only InvestorHolding
- **No changes to CashFlow**: Link via referenceId field

### Key Entities
1. **Portfolio** (extended): +isFund, +totalOutstandingUnits, +navPerUnit
2. **Account** (extended): +isInvestor
3. **InvestorHolding** (new): Track investor holdings in funds
4. **CashFlow** (unchanged): Link fund transactions via referenceId

## 🔧 Implementation Status

### ✅ Completed
- [x] Requirements analysis
- [x] Database schema design
- [x] Entity design optimization
- [x] Implementation document creation

### 🚧 In Progress
- [ ] Database migrations
- [ ] Entity implementations
- [ ] Service layer development

### 📋 Pending
- [ ] API endpoints
- [ ] Frontend components
- [ ] Testing
- [ ] Documentation

## 📊 Business Logic

### NAV/Unit Formula
```
NAV/Unit = NAV Tổng ÷ Tổng số đơn vị quỹ đang lưu hành
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

## 📈 Success Criteria

### Technical
- [ ] All unit tests passing
- [ ] API endpoints responding correctly
- [ ] Database migrations successful
- [ ] Frontend components rendering

### Business
- [ ] NAV/Unit calculations accurate
- [ ] Investor holdings tracking correctly
- [ ] Subscription/redemption working
- [ ] Audit trail complete

## 🚀 Next Steps

1. **Create database migrations**
2. **Implement InvestorHolding entity**
3. **Extend Portfolio and Account entities**
4. **Create InvestorHoldingService**
5. **Extend PortfolioService with NAV/Unit calculations**
6. **Create API endpoints**
7. **Update frontend components**

## 📝 Notes

### Key Decisions
- **Simplified design**: Only essential fields, no complex fund types
- **Reuse existing**: Maximize use of current architecture
- **Audit trail**: Complete transaction history via CashFlow
- **Performance**: Real-time NAV/Unit calculations

### Risks & Mitigations
- **Data consistency**: Use database transactions
- **Performance**: Cache NAV/Unit calculations
- **User experience**: Clear error messages
- **Testing**: Comprehensive test coverage

---

**Last Updated**: 2024-12-19  
**Next Review**: 2024-12-20
