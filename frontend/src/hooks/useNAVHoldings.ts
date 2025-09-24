/**
 * Custom hook for managing NAV Holdings data
 */

import { useState, useEffect } from 'react';
import { InvestorHolding, SubscribeToFundDto, RedeemFromFundDto, SubscriptionResult, RedemptionResult } from '../types';
import { apiService } from '../services/api';

interface UseNAVHoldingsReturn {
  holdings: InvestorHolding[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  subscribeToFund: (dto: SubscribeToFundDto) => Promise<SubscriptionResult>;
  redeemFromFund: (dto: RedeemFromFundDto) => Promise<RedemptionResult>;
  convertToFund: (portfolioId: string) => Promise<void>;
}

export const useNAVHoldings = (portfolioId: string | undefined, isFund: boolean = false): UseNAVHoldingsReturn => {
  const [holdings, setHoldings] = useState<InvestorHolding[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHoldings = async () => {
    if (!portfolioId || !isFund) {
      setHoldings([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getFundInvestors(portfolioId);
      setHoldings(response);
    } catch (err) {
      setError('Failed to load investor holdings');
      console.error('Error loading holdings:', err);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToFund = async (dto: SubscribeToFundDto): Promise<SubscriptionResult> => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiService.subscribeToFund(dto);
      await loadHoldings(); // Refresh holdings after subscription
      return result;
    } catch (err) {
      setError('Failed to process subscription');
      console.error('Error processing subscription:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const redeemFromFund = async (dto: RedeemFromFundDto): Promise<RedemptionResult> => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiService.redeemFromFund(dto);
      await loadHoldings(); // Refresh holdings after redemption
      return result;
    } catch (err) {
      setError('Failed to process redemption');
      console.error('Error processing redemption:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const convertToFund = async (portfolioId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await apiService.convertPortfolioToFund(portfolioId);
      // Portfolio will be refreshed by parent component
    } catch (err) {
      setError('Failed to convert portfolio to fund');
      console.error('Error converting to fund:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHoldings();
  }, [portfolioId, isFund]);

  return {
    holdings,
    loading,
    error,
    refetch: loadHoldings,
    subscribeToFund,
    redeemFromFund,
    convertToFund,
  };
};
