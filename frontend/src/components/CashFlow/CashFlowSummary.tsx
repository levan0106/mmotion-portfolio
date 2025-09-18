import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  AccountBalance as DepositIcon,
  AccountBalanceWallet as WithdrawIcon,
  TrendingUp as DividendIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/format';

interface CashFlowSummaryProps {
  portfolioId: string;
  onRefresh?: () => void;
}

interface CashFlowStats {
  totalDeposits: number;
  totalWithdrawals: number;
  totalDividends: number;
  netCashFlow: number;
  recentTransactions: number;
}

const CashFlowSummary: React.FC<CashFlowSummaryProps> = ({
  portfolioId,
  onRefresh,
}) => {
  const [stats, setStats] = useState<CashFlowStats>({
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalDividends: 0,
    netCashFlow: 0,
    recentTransactions: 0,
  });
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/portfolios/${portfolioId}/cash-flow/history`);
      if (!response.ok) throw new Error('Failed to load cash flow stats');
      const data = await response.json();

      const totalDeposits = data
        .filter((cf: any) => (cf.type === 'DEPOSIT' || cf.type === 'SELL_TRADE') && cf.status === 'COMPLETED')
        .reduce((sum: number, cf: any) => sum + Math.abs(cf.amount), 0);

      const totalWithdrawals = data
        .filter((cf: any) => (cf.type === 'WITHDRAWAL' || cf.type === 'BUY_TRADE') && cf.status === 'COMPLETED')
        .reduce((sum: number, cf: any) => sum + Math.abs(cf.amount), 0);

      const totalDividends = data
        .filter((cf: any) => cf.type === 'DIVIDEND' && cf.status === 'COMPLETED')
        .reduce((sum: number, cf: any) => sum + cf.amount, 0);

      const netCashFlow = totalDeposits + totalDividends - totalWithdrawals;
      const recentTransactions = data.filter((cf: any) => {
        const transactionDate = new Date(cf.flowDate);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return transactionDate >= thirtyDaysAgo;
      }).length;

      setStats({
        totalDeposits,
        totalWithdrawals,
        totalDividends,
        netCashFlow,
        recentTransactions,
      });
    } catch (error) {
      console.error('Error loading cash flow stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [portfolioId]);

  const handleRefresh = () => {
    loadStats();
    onRefresh?.();
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" gutterBottom>
            Cash Flow Summary
          </Typography>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} disabled={loading} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
                <DepositIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="body2" color="textSecondary">
                  Deposits
                </Typography>
              </Box>
              <Typography variant="h6" color="success.main" fontWeight="bold">
                {formatCurrency(stats.totalDeposits)}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
                <WithdrawIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="body2" color="textSecondary">
                  Withdrawals
                </Typography>
              </Box>
              <Typography variant="h6" color="error.main" fontWeight="bold">
                {formatCurrency(stats.totalWithdrawals)}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
                <DividendIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="body2" color="textSecondary">
                  Dividends
                </Typography>
              </Box>
              <Typography variant="h6" color="info.main" fontWeight="bold">
                {formatCurrency(stats.totalDividends)}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box textAlign="center">
              <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
                {stats.netCashFlow >= 0 ? (
                  <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                ) : (
                  <TrendingDownIcon color="error" sx={{ mr: 1 }} />
                )}
                <Typography variant="body2" color="textSecondary">
                  Net Flow
                </Typography>
              </Box>
              <Typography 
                variant="h6" 
                color={stats.netCashFlow >= 0 ? 'success.main' : 'error.main'}
                fontWeight="bold"
              >
                {formatCurrency(stats.netCashFlow)}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box mt={2} display="flex" justifyContent="center">
          <Chip
            label={`${stats.recentTransactions} transactions in last 30 days`}
            color="primary"
            variant="outlined"
            size="small"
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default CashFlowSummary;
