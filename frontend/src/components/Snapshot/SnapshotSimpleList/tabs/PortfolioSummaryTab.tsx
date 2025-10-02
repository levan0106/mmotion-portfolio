import React from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { formatCurrency, formatPercentage, formatDate } from '../../../../utils/format';
import { PaginationControls } from '../../../Common/PaginationControls';

interface PortfolioSummaryTabProps {
  portfolioSnapshots: any[];
  portfolioSnapshotsLoading: boolean;
  portfolioSnapshotsError: string | null;
  portfolioSnapshotsPagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null;
  baseCurrency: string;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

const PortfolioSummaryTab: React.FC<PortfolioSummaryTabProps> = ({
  portfolioSnapshots,
  portfolioSnapshotsLoading,
  portfolioSnapshotsError,
  portfolioSnapshotsPagination,
  baseCurrency,
  onPageChange,
  onLimitChange,
}) => {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Portfolio Summary Snapshots
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        Cash balance được lấy từ bảng portfolio_snapshots.cash_balance có thể khác với cách tính trong tab Portfolio Performance.
      </Typography>

      {portfolioSnapshotsLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
      
      {portfolioSnapshotsError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {portfolioSnapshotsError}
        </Alert>
      )}
      
      {portfolioSnapshots && portfolioSnapshots.length > 0 ? (
        <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 4880 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell sx={{ 
                  fontWeight: 600, 
                  fontSize: '0.7rem', 
                  py: 0.5, 
                  minWidth: 100,
                  position: 'sticky',
                  left: 0,
                  backgroundColor: 'grey.50',
                  zIndex: 1,
                  borderRight: '1px solid',
                  borderColor: 'divider'
                }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 120 }}>Portfolio</TableCell>
                {/* Portfolio Level (Assets + Deposits) */}
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 140 }} align="right">Total Portfolio Value</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 140 }} align="right">Total Portfolio Invested</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 120 }} align="right">Portfolio P&L</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 120 }} align="right">Portfolio Unrealized</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 120 }} align="right">Portfolio Realized</TableCell>
                {/* Asset Level (Assets Only) */}
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 140 }} align="right">Total Asset Value</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 140 }} align="right">Total Asset Invested</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 120 }} align="right">Asset P&L</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 120 }} align="right">Asset Unrealized</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 120 }} align="right">Asset Realized</TableCell>
                {/* Deposit Level */}
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Deposits</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 140 }} align="right">Deposit Value</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 140 }} align="right">Deposit Principal</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 140 }} align="right">Deposit Interest</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 140 }} align="right">Deposit Unrealized</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 140 }} align="right">Deposit Realized</TableCell>
                {/* Cash Level */}
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 140 }} align="right">Cash</TableCell>
                {/* Fund Management */}
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 120 }} align="right">Outstanding Units</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 100 }} align="right">NAV per Unit</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 100 }} align="right">Investors</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="center">Is Fund</TableCell>
                {/* Portfolio Performance Metrics (Assets + Deposits) */}
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Portfolio Daily %</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Portfolio Weekly %</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Portfolio Monthly %</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Portfolio YTD %</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 70 }} align="right">Portfolio Vol %</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 70 }} align="right">Portfolio Max DD</TableCell>
                {/* Asset Performance Metrics (Assets Only) */}
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Asset Daily %</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Asset Weekly %</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Asset Monthly %</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Asset YTD %</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 70 }} align="right">Asset Vol %</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 70 }} align="right">Asset Max DD</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 60 }} align="right">Assets</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 60 }} align="right">Active</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Type</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {portfolioSnapshots
                .sort((a, b) => new Date(b.snapshotDate).getTime() - new Date(a.snapshotDate).getTime())
                .map((snapshot) => (
                <TableRow key={snapshot.id} hover>
                  {/* Date */}
                  <TableCell sx={{ 
                    py: 0.5,
                    position: 'sticky',
                    left: 0,
                    backgroundColor: 'background.paper',
                    zIndex: 1,
                    borderRight: '1px solid',
                    borderColor: 'divider'
                  }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {formatDate(snapshot.snapshotDate)}
                    </Typography>
                  </TableCell>
                  
                  {/* Portfolio */}
                  <TableCell sx={{ py: 0.5 }}>
                    <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.7rem' }}>
                      {snapshot.portfolioName}
                    </Typography>
                  </TableCell>
                  
                  {/* Total Portfolio Value */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                      {formatCurrency(Number(snapshot.totalPortfolioValue || 0), baseCurrency)}
                    </Typography>
                  </TableCell>
                  
                  {/* Total Portfolio Invested */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                      {formatCurrency(Number(snapshot.totalPortfolioInvested || 0), baseCurrency)}
                    </Typography>
                  </TableCell>
                  
                  {/* Portfolio P&L */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      fontWeight={600}
                      sx={{ fontSize: '0.7rem' }}
                      color={snapshot.totalPortfolioPl && Number(snapshot.totalPortfolioPl) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.totalPortfolioPl && Number(snapshot.totalPortfolioPl) >= 0 ? '+' : ''}
                      {formatCurrency(Number(snapshot.totalPortfolioPl || 0), baseCurrency)}
                    </Typography>
                  </TableCell>
                  
                  {/* Portfolio Unrealized P&L */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      fontWeight={600}
                      sx={{ fontSize: '0.7rem' }}
                      color={snapshot.unrealizedPortfolioPl && Number(snapshot.unrealizedPortfolioPl) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.unrealizedPortfolioPl && Number(snapshot.unrealizedPortfolioPl) >= 0 ? '+' : ''}
                      {formatCurrency(Number(snapshot.unrealizedPortfolioPl || 0), baseCurrency)}
                    </Typography>
                  </TableCell>
                  
                  {/* Portfolio Realized P&L */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      fontWeight={600}
                      sx={{ fontSize: '0.7rem' }}
                      color={snapshot.realizedPortfolioPl && Number(snapshot.realizedPortfolioPl) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.realizedPortfolioPl && Number(snapshot.realizedPortfolioPl) >= 0 ? '+' : ''}
                      {formatCurrency(Number(snapshot.realizedPortfolioPl || 0), baseCurrency)}
                    </Typography>
                  </TableCell>
                  
                  {/* Total Asset Value */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                      {formatCurrency(Number(snapshot.totalAssetValue || 0), baseCurrency)}
                    </Typography>
                  </TableCell>
                  
                  {/* Total Asset Invested */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                      {formatCurrency(Number(snapshot.totalAssetInvested || 0), baseCurrency)}
                    </Typography>
                  </TableCell>
                  
                  {/* Asset P&L */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      fontWeight={600}
                      sx={{ fontSize: '0.7rem' }}
                      color={snapshot.totalAssetPl && Number(snapshot.totalAssetPl) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.totalAssetPl && Number(snapshot.totalAssetPl) >= 0 ? '+' : ''}
                      {formatCurrency(Number(snapshot.totalAssetPl || 0), baseCurrency)}
                    </Typography>
                  </TableCell>
                  
                  {/* Asset Unrealized P&L */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      fontWeight={600}
                      sx={{ fontSize: '0.7rem' }}
                      color={snapshot.unrealizedAssetPl && Number(snapshot.unrealizedAssetPl) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.unrealizedAssetPl && Number(snapshot.unrealizedAssetPl) >= 0 ? '+' : ''}
                      {formatCurrency(Number(snapshot.unrealizedAssetPl || 0), baseCurrency)}
                    </Typography>
                  </TableCell>
                  
                  {/* Asset Realized P&L */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      fontWeight={600}
                      sx={{ fontSize: '0.7rem' }}
                      color={snapshot.realizedAssetPl && Number(snapshot.realizedAssetPl) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.realizedAssetPl && Number(snapshot.realizedAssetPl) >= 0 ? '+' : ''}
                      {formatCurrency(Number(snapshot.realizedAssetPl || 0), baseCurrency)}
                    </Typography>
                  </TableCell>
                  
                  {/* Deposit Count */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                      {snapshot.totalDepositCount || 0}
                    </Typography>
                  </TableCell>
                  
                  {/* Deposit Value */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                      {formatCurrency(Number(snapshot.totalDepositValue || 0), baseCurrency)}
                    </Typography>
                  </TableCell>
                  
                  {/* Deposit Principal */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                      {formatCurrency(Number(snapshot.totalDepositPrincipal || 0), baseCurrency)}
                    </Typography>
                  </TableCell>
                  
                  {/* Deposit Interest */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      fontWeight={600}
                      sx={{ fontSize: '0.7rem' }}
                      color={snapshot.totalDepositInterest && Number(snapshot.totalDepositInterest) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.totalDepositInterest && Number(snapshot.totalDepositInterest) >= 0 ? '+' : ''}
                      {formatCurrency(Number(snapshot.totalDepositInterest || 0), baseCurrency)}
                    </Typography>
                  </TableCell>
                  
                  {/* Deposit Unrealized P&L */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      fontWeight={600}
                      sx={{ fontSize: '0.7rem' }}
                      color={snapshot.unrealizedDepositPnL && Number(snapshot.unrealizedDepositPnL) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.unrealizedDepositPnL && Number(snapshot.unrealizedDepositPnL) >= 0 ? '+' : ''}
                      {formatCurrency(Number(snapshot.unrealizedDepositPnL || 0), baseCurrency)}
                    </Typography>
                  </TableCell>
                  
                  {/* Deposit Realized P&L */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      fontWeight={600}
                      sx={{ fontSize: '0.7rem' }}
                      color={snapshot.realizedDepositPnL && Number(snapshot.realizedDepositPnL) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.realizedDepositPnL && Number(snapshot.realizedDepositPnL) >= 0 ? '+' : ''}
                      {formatCurrency(Number(snapshot.realizedDepositPnL || 0), baseCurrency)}
                    </Typography>
                  </TableCell>
                  
                  {/* Cash Balance */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                      {formatCurrency(Number(snapshot.cashBalance || 0), baseCurrency)}
                    </Typography>
                  </TableCell>
                  
                  {/* Fund Management */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                      {Number(snapshot.totalOutstandingUnits || 0).toLocaleString(undefined, { maximumFractionDigits: 3 })}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.7rem', color: 'primary.main' }}>
                      {formatCurrency(Number(snapshot.navPerUnit || 0), baseCurrency)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                      {Number(snapshot.numberOfInvestors || 0).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ py: 0.5 }}>
                    <Chip 
                      label={snapshot.isFund ? 'Yes' : 'No'} 
                      size="small" 
                      color={snapshot.isFund ? 'primary' : 'default'}
                      sx={{ fontSize: '0.6rem', height: 20 }}
                    />
                  </TableCell>
                  
                  {/* Portfolio Daily Return % */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      fontWeight={600}
                      sx={{ fontSize: '0.7rem' }}
                      color={snapshot.portfolioDailyReturn && Number(snapshot.portfolioDailyReturn) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.portfolioDailyReturn && Number(snapshot.portfolioDailyReturn) >= 0 ? '+' : ''}
                      {formatPercentage(Number(snapshot.portfolioDailyReturn || 0))}
                    </Typography>
                  </TableCell>
                  
                  {/* Portfolio Weekly Return % */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      fontWeight={600}
                      sx={{ fontSize: '0.7rem' }}
                      color={snapshot.portfolioWeeklyReturn && Number(snapshot.portfolioWeeklyReturn) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.portfolioWeeklyReturn && Number(snapshot.portfolioWeeklyReturn) >= 0 ? '+' : ''}
                      {formatPercentage(Number(snapshot.portfolioWeeklyReturn || 0))}
                    </Typography>
                  </TableCell>
                  
                  {/* Portfolio Monthly Return % */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      fontWeight={600}
                      sx={{ fontSize: '0.7rem' }}
                      color={snapshot.portfolioMonthlyReturn && Number(snapshot.portfolioMonthlyReturn) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.portfolioMonthlyReturn && Number(snapshot.portfolioMonthlyReturn) >= 0 ? '+' : ''}
                      {formatPercentage(Number(snapshot.portfolioMonthlyReturn || 0))}
                    </Typography>
                  </TableCell>
                  
                  {/* Portfolio YTD Return % */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      fontWeight={600}
                      sx={{ fontSize: '0.7rem' }}
                      color={snapshot.portfolioYtdReturn && Number(snapshot.portfolioYtdReturn) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.portfolioYtdReturn && Number(snapshot.portfolioYtdReturn) >= 0 ? '+' : ''}
                      {formatPercentage(Number(snapshot.portfolioYtdReturn || 0))}
                    </Typography>
                  </TableCell>
                  
                  {/* Portfolio Volatility % */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                      {formatPercentage(Number(snapshot.portfolioVolatility || 0))}
                    </Typography>
                  </TableCell>
                  
                  {/* Portfolio Max Drawdown % */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      fontWeight={600}
                      sx={{ fontSize: '0.7rem' }}
                      color="error.main"
                    >
                      -{formatPercentage(Number(snapshot.portfolioMaxDrawdown || 0))}
                    </Typography>
                  </TableCell>

                  {/* Asset Daily Return % */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      fontWeight={600}
                      sx={{ fontSize: '0.7rem' }}
                      color={snapshot.assetDailyReturn && Number(snapshot.assetDailyReturn) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.assetDailyReturn && Number(snapshot.assetDailyReturn) >= 0 ? '+' : ''}
                      {formatPercentage(Number(snapshot.assetDailyReturn || 0))}
                    </Typography>
                  </TableCell>
                  
                  {/* Asset Weekly Return % */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      fontWeight={600}
                      sx={{ fontSize: '0.7rem' }}
                      color={snapshot.assetWeeklyReturn && Number(snapshot.assetWeeklyReturn) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.assetWeeklyReturn && Number(snapshot.assetWeeklyReturn) >= 0 ? '+' : ''}
                      {formatPercentage(Number(snapshot.assetWeeklyReturn || 0))}
                    </Typography>
                  </TableCell>
                  
                  {/* Asset Monthly Return % */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      fontWeight={600}
                      sx={{ fontSize: '0.7rem' }}
                      color={snapshot.assetMonthlyReturn && Number(snapshot.assetMonthlyReturn) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.assetMonthlyReturn && Number(snapshot.assetMonthlyReturn) >= 0 ? '+' : ''}
                      {formatPercentage(Number(snapshot.assetMonthlyReturn || 0))}
                    </Typography>
                  </TableCell>
                  
                  {/* Asset YTD Return % */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      fontWeight={600}
                      sx={{ fontSize: '0.7rem' }}
                      color={snapshot.assetYtdReturn && Number(snapshot.assetYtdReturn) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.assetYtdReturn && Number(snapshot.assetYtdReturn) >= 0 ? '+' : ''}
                      {formatPercentage(Number(snapshot.assetYtdReturn || 0))}
                    </Typography>
                  </TableCell>
                  
                  {/* Asset Volatility % */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                      {formatPercentage(Number(snapshot.assetVolatility || 0))}
                    </Typography>
                  </TableCell>
                  
                  {/* Asset Max Drawdown % */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      fontWeight={600}
                      sx={{ fontSize: '0.7rem' }}
                      color="error.main"
                    >
                      -{formatPercentage(Number(snapshot.assetMaxDrawdown || 0))}
                    </Typography>
                  </TableCell>
                  
                  {/* Asset Count */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                      {snapshot.assetCount || 0}
                    </Typography>
                  </TableCell>
                  
                  {/* Active Asset Count */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                      {snapshot.activeAssetCount || 0}
                    </Typography>
                  </TableCell>
                  
                  {/* Granularity Type */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Chip 
                      label={snapshot.granularity} 
                      size="small" 
                      variant="outlined"
                      color="primary"
                      sx={{ fontSize: '0.65rem', height: 18 }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
          <Typography variant="body2">
            No portfolio snapshots available
          </Typography>
        </Box>
      )}
      
      {/* Pagination Controls */}
      {portfolioSnapshots && portfolioSnapshots.length > 0 && portfolioSnapshotsPagination && (
        <Box sx={{ mt: 2 }}>
          <PaginationControls
            page={portfolioSnapshotsPagination.page}
            limit={portfolioSnapshotsPagination.limit}
            total={portfolioSnapshotsPagination.total}
            totalPages={portfolioSnapshotsPagination.totalPages}
            hasNext={portfolioSnapshotsPagination.page < portfolioSnapshotsPagination.totalPages}
            hasPrev={portfolioSnapshotsPagination.page > 1}
            onPageChange={onPageChange}
            onLimitChange={onLimitChange}
          />
        </Box>
      )}
    </Box>
  );
};

export default PortfolioSummaryTab;
