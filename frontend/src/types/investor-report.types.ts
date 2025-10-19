export interface InvestorReportData {
  portfolioId: string;
  portfolioName: string;
  totalValue: number;
  cashBalance: number;
  assetValue: number;
  assetAllocation: Array<{
    assetType: string;
    percentage: number;
    value: number;
    count: number;
  }>;
  assetDetails: Array<{
    symbol: string;
    name: string;
    assetType: string;
    quantity: number;
    currentPrice: number;
    currentValue: number;
    percentage: number;
    unrealizedPl: number;
  }>;
  summary: {
    totalAssets: number;
    totalCash: number;
    totalValue: number;
    cashPercentage: number;
    assetPercentage: number;
    depositsValue?: number;
    depositsPercentage?: number;
  };
  deposits?: Array<{
    depositId: string;
    bankName: string;
    accountNumber: string;
    principal: number;
    interestRate: number;
    totalValue: number;
    status: string;
    startDate: string;
    endDate: string;
  }>;
  performance?: {
    totalReturn: number;
    totalReturnPercentage: number;
    unrealizedPl: number;
    realizedPl: number;
    dailyGrowth: number;
    monthlyGrowth: number;
    ytdGrowth: number;
  };
  lastUpdated: string;
}
