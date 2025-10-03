import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { usePortfolios } from './usePortfolios';
import { useAccount } from '../contexts/AccountContext';

export interface Transaction {
  id: string;
  type: 'TRADE' | 'CASH_FLOW' | 'FUND_UNIT';
  portfolioId: string;
  portfolioName: string;
  date: string;
  amount: number;
  currency: string;
  description: string;
  side?: 'BUY' | 'SELL';
  assetSymbol?: string;
  assetName?: string;
  quantity?: number;
  price?: number;
  units?: number;
  navPerUnit?: number;
  cashFlowType?: string;
  fundingSource?: string;
  createdAt: string;
}

interface UseTransactionsResult {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useTransactions = (): UseTransactionsResult => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { accountId } = useAccount();
  const { portfolios } = usePortfolios();

  const fetchTransactions = async () => {
    if (!accountId || !portfolios.length) {
      setTransactions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const allTransactions: Transaction[] = [];

      // Fetch trades for each portfolio
      for (const portfolio of portfolios) {
        try {
          const trades = await apiService.getTrades(portfolio.portfolioId, accountId);
          const tradeTransactions: Transaction[] = trades.map((trade: any) => ({
            id: trade.tradeId,
            type: 'TRADE' as const,
            portfolioId: portfolio.portfolioId,
            portfolioName: portfolio.name,
            date: trade.tradeDate,
            amount: trade.totalValue,
            currency: portfolio.baseCurrency,
            description: `${trade.side} ${trade.quantity} ${trade.assetSymbol || 'Asset'}`,
            side: trade.side,
            assetSymbol: trade.assetSymbol,
            assetName: trade.assetName,
            quantity: trade.quantity,
            price: trade.price,
            createdAt: trade.createdAt,
          }));
          allTransactions.push(...tradeTransactions);
        } catch (err) {
          console.warn(`Failed to fetch trades for portfolio ${portfolio.portfolioId}:`, err);
        }

        // Fetch cash flows for each portfolio
        try {
          const cashFlowResponse = await apiService.getCashFlowHistory(portfolio.portfolioId, accountId, {
            limit: 100 // Get more cash flows
          });
          const cashFlowTransactions: Transaction[] = cashFlowResponse.data.map((cashFlow: any) => ({
            id: cashFlow.cashflowId,
            type: 'CASH_FLOW' as const,
            portfolioId: portfolio.portfolioId,
            portfolioName: portfolio.name,
            date: cashFlow.flowDate,
            amount: cashFlow.amount,
            currency: cashFlow.currency,
            description: cashFlow.description || `${cashFlow.type} transaction`,
            cashFlowType: cashFlow.type,
            fundingSource: cashFlow.fundingSource,
            createdAt: cashFlow.createdAt,
          }));
          allTransactions.push(...cashFlowTransactions);
        } catch (err) {
          console.warn(`Failed to fetch cash flows for portfolio ${portfolio.portfolioId}:`, err);
        }
      }

      // Sort all transactions by date (newest first)
      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTransactions(allTransactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [accountId, portfolios]);

  return {
    transactions,
    isLoading,
    error,
    refetch: fetchTransactions,
  };
};
