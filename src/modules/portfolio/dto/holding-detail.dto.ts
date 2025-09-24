import { InvestorHolding } from '../entities/investor-holding.entity';
import { FundUnitTransaction } from '../entities/fund-unit-transaction.entity';
import { CashFlow } from '../entities/cash-flow.entity';

export class HoldingDetailDto {
  holding: InvestorHolding;
  transactions: FundUnitTransactionWithCashFlow[];
  summary: HoldingSummaryDto;
}

export class FundUnitTransactionWithCashFlow {
  transaction: FundUnitTransaction;
  cashFlow: CashFlow;
}

export class HoldingSummaryDto {
  totalTransactions: number;
  totalSubscriptions: number;
  totalRedemptions: number;
  totalUnitsSubscribed: number;
  totalUnitsRedeemed: number;
  totalAmountInvested: number;
  totalAmountReceived: number;
  netRealizedPnL: number;
  currentUnrealizedPnL: number;
  totalPnL: number;
  returnPercentage: number;
}
