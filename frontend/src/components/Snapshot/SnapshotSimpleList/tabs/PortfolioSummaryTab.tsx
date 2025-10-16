import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { formatCurrency, formatPercentage, formatDate, formatNumber } from '../../../../utils/format';
import { PaginationControls } from '../../../Common/PaginationControls';
import { ResponsiveTypography } from '../../../Common/ResponsiveTypography';

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
  const { t } = useTranslation();
  return (
    <Box>
      <ResponsiveTypography 
        variant="pageTitle" 
        sx={{ mb: 2, color: 'primary.main' }}
      >
        {t('portfolio.summarySnapshots')}
      </ResponsiveTypography>
      <ResponsiveTypography 
        variant="pageSubtitle" 
        sx={{ mb: 2, color: 'text.secondary', lineHeight: 1.6 }}
      >
        {t('portfolio.cashBalanceNote')}
      </ResponsiveTypography>

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
                  py: 1, 
                  minWidth: 100,
                  position: 'sticky',
                  left: 0,
                  zIndex: 1,
                  borderRight: '1px solid',
                  borderColor: 'divider',
                  letterSpacing: '0.5px',
                  backgroundColor: 'background.paper'
                }}><ResponsiveTypography variant="tableHeaderSmall" >Date</ResponsiveTypography></TableCell>
                <TableCell sx={{  py: 1, minWidth: 120, letterSpacing: '0.3px' }}><ResponsiveTypography variant="tableHeaderSmall" >Portfolio</ResponsiveTypography></TableCell>
                {/* Portfolio Level (Assets + Deposits) */}
                <TableCell sx={{  py: 1, minWidth: 140, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Total Portfolio Value</ResponsiveTypography></TableCell>
                <TableCell sx={{  py: 1, minWidth: 140, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Total Portfolio Invested</ResponsiveTypography></TableCell>
                <TableCell sx={{  py: 1, minWidth: 120, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Portfolio P&L</ResponsiveTypography></TableCell>
                <TableCell sx={{  py: 1, minWidth: 120, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Portfolio Unrealized</ResponsiveTypography></TableCell>
                <TableCell sx={{  py: 1, minWidth: 120, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Portfolio Realized</ResponsiveTypography></TableCell>
                {/* Asset Level (Assets Only) */}
                <TableCell sx={{  py: 1, minWidth: 140, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Total Asset Value</ResponsiveTypography></TableCell>
                <TableCell sx={{  py: 1, minWidth: 140, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Total Asset Invested</ResponsiveTypography></TableCell>
                <TableCell sx={{  py: 1, minWidth: 120, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Asset P&L</ResponsiveTypography></TableCell>
                <TableCell sx={{  py: 1, minWidth: 120, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Asset Unrealized</ResponsiveTypography></TableCell>
                <TableCell sx={{  py: 1, minWidth: 120, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Asset Realized</ResponsiveTypography></TableCell>
                {/* Deposit Level */}
                <TableCell sx={{  py: 1, minWidth: 80, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Deposits</ResponsiveTypography></TableCell>
                <TableCell sx={{  py: 1, minWidth: 140, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Deposit Value</ResponsiveTypography></TableCell>
                <TableCell sx={{  py: 1, minWidth: 140, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Deposit Principal</ResponsiveTypography></TableCell>
                <TableCell sx={{  py: 1, minWidth: 140, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Deposit Interest</ResponsiveTypography></TableCell>
                <TableCell sx={{  py: 1, minWidth: 140, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Deposit Unrealized</ResponsiveTypography></TableCell>
                <TableCell sx={{  py: 1, minWidth: 140, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Deposit Realized</ResponsiveTypography></TableCell>
                {/* Cash Level */}
                <TableCell sx={{  py: 1, minWidth: 140, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Cash</ResponsiveTypography></TableCell>
                {/* Fund Management */}
                <TableCell sx={{  py: 1, minWidth: 120, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Outstanding Units</ResponsiveTypography></TableCell>
                <TableCell sx={{  py: 1, minWidth: 100, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >NAV per Unit</ResponsiveTypography></TableCell>
                <TableCell sx={{  py: 1, minWidth: 100, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Investors</ResponsiveTypography></TableCell>
                <TableCell sx={{  py: 1, minWidth: 80, letterSpacing: '0.3px' }} align="center"><ResponsiveTypography variant="tableHeaderSmall" >Is Fund</ResponsiveTypography></TableCell>
                {/* Portfolio Performance Metrics (Assets + Deposits) - HIDDEN */}
                {/* Asset Performance Metrics (Assets Only) - HIDDEN */}
                {/* Return Metrics */}
                <TableCell sx={{  py: 1, minWidth: 80, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Daily Return %</ResponsiveTypography></TableCell>
                <TableCell sx={{  py: 1, minWidth: 80, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Weekly Return %</ResponsiveTypography></TableCell>
                <TableCell sx={{  py: 1, minWidth: 80, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Monthly Return %</ResponsiveTypography></TableCell>
                <TableCell sx={{  py: 1, minWidth: 80, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >YTD Return %</ResponsiveTypography></TableCell>
                <TableCell sx={{  py: 1, minWidth: 80, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Total Return %</ResponsiveTypography></TableCell>
                <TableCell sx={{  py: 1, minWidth: 60, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Assets</ResponsiveTypography></TableCell>
                <TableCell sx={{  py: 1, minWidth: 60, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Active</ResponsiveTypography></TableCell>
                <TableCell sx={{  py: 1, minWidth: 80, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Type</ResponsiveTypography></TableCell>
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
                    zIndex: 1,
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: 'background.paper'
                  }}>
                     <ResponsiveTypography variant="tableCellSmall" sx={{ letterSpacing: '0.2px' }}>
                       {formatDate(snapshot.snapshotDate)}
                     </ResponsiveTypography>
                  </TableCell>
                  
                  {/* Portfolio */}
                  <TableCell sx={{ py: 1 }}>
                    <ResponsiveTypography variant="tableCellSmall" sx={{ letterSpacing: '0.2px' }}>
                      {snapshot.portfolioName}
                    </ResponsiveTypography>
                  </TableCell>
                  
                  {/* Total Portfolio Value */}
                  <TableCell align="right" sx={{ py: 1 }}>
                    <ResponsiveTypography variant="tableCellSmall" sx={{ letterSpacing: '0.1px' }}>
                      {formatCurrency(Number(snapshot.totalPortfolioValue || 0), baseCurrency)}
                    </ResponsiveTypography>
                  </TableCell>
                  
                  {/* Total Portfolio Invested */}
                  <TableCell align="right" sx={{ py: 1 }}>
                    <ResponsiveTypography variant="tableCellSmall" >
                      {formatCurrency(Number(snapshot.totalPortfolioInvested || 0), baseCurrency)}
                    </ResponsiveTypography>
                  </TableCell>
                  
                  {/* Portfolio P&L */}
                  <TableCell align="right" sx={{ py: 1 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall"
                      sx={{ color: snapshot.totalPortfolioPl && Number(snapshot.totalPortfolioPl) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.totalPortfolioPl && Number(snapshot.totalPortfolioPl) >= 0 ? '+' : ''}
                      {formatCurrency(Number(snapshot.totalPortfolioPl || 0), baseCurrency)}
                    </ResponsiveTypography>
                  </TableCell>
                  
                  {/* Portfolio Unrealized P&L */}
                  <TableCell align="right" sx={{ py: 1 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall"
                      sx={{ color: snapshot.unrealizedPortfolioPl && Number(snapshot.unrealizedPortfolioPl) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.unrealizedPortfolioPl && Number(snapshot.unrealizedPortfolioPl) >= 0 ? '+' : ''}
                      {formatCurrency(Number(snapshot.unrealizedPortfolioPl || 0), baseCurrency)}
                    </ResponsiveTypography>
                  </TableCell>
                  
                  {/* Portfolio Realized P&L */}
                  <TableCell align="right" sx={{ py: 1 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.realizedPortfolioPl && Number(snapshot.realizedPortfolioPl) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.realizedPortfolioPl && Number(snapshot.realizedPortfolioPl) >= 0 ? '+' : ''}
                      {formatCurrency(Number(snapshot.realizedPortfolioPl || 0), baseCurrency)}
                    </ResponsiveTypography>
                  </TableCell>
                  
                  {/* Total Asset Value */}
                  <TableCell align="right" sx={{ py: 1 }}>
                    <ResponsiveTypography variant="tableCellSmall">
                      {formatCurrency(Number(snapshot.totalAssetValue || 0), baseCurrency)}
                    </ResponsiveTypography>
                  </TableCell>
                  
                  {/* Total Asset Invested */}
                  <TableCell align="right" sx={{ py: 1 }}>
                    <ResponsiveTypography variant="tableCellSmall" >
                      {formatCurrency(Number(snapshot.totalAssetInvested || 0), baseCurrency)}
                    </ResponsiveTypography>
                  </TableCell>
                  
                  {/* Asset P&L */}
                  <TableCell align="right" sx={{ py: 1 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.totalAssetPl && Number(snapshot.totalAssetPl) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.totalAssetPl && Number(snapshot.totalAssetPl) >= 0 ? '+' : ''}
                      {formatCurrency(Number(snapshot.totalAssetPl || 0), baseCurrency)}
                    </ResponsiveTypography>
                  </TableCell>
                  
                  {/* Asset Unrealized P&L */}
                  <TableCell align="right" sx={{ py: 1 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.unrealizedAssetPl && Number(snapshot.unrealizedAssetPl) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.unrealizedAssetPl && Number(snapshot.unrealizedAssetPl) >= 0 ? '+' : ''}
                      {formatCurrency(Number(snapshot.unrealizedAssetPl || 0), baseCurrency)}
                    </ResponsiveTypography>
                  </TableCell>
                  
                  {/* Asset Realized P&L */}
                  <TableCell align="right" sx={{ py: 1 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.realizedAssetPl && Number(snapshot.realizedAssetPl) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.realizedAssetPl && Number(snapshot.realizedAssetPl) >= 0 ? '+' : ''}
                      {formatCurrency(Number(snapshot.realizedAssetPl || 0), baseCurrency)}
                    </ResponsiveTypography>
                  </TableCell>
                  
                  {/* Deposit Count */}
                  <TableCell align="right" sx={{ py: 1 }}>
                    <ResponsiveTypography variant="tableCellSmall" >
                      {snapshot.totalDepositCount || 0}
                    </ResponsiveTypography>
                  </TableCell>
                  
                  {/* Deposit Value */}
                  <TableCell align="right" sx={{ py: 1 }}>
                    <ResponsiveTypography variant="tableCellSmall" >
                      {formatCurrency(Number(snapshot.totalDepositValue || 0), baseCurrency)}
                    </ResponsiveTypography>
                  </TableCell>
                  
                  {/* Deposit Principal */}
                  <TableCell align="right" sx={{ py: 1 }}>
                    <ResponsiveTypography variant="tableCellSmall" >
                      {formatCurrency(Number(snapshot.totalDepositPrincipal || 0), baseCurrency)}
                    </ResponsiveTypography>
                  </TableCell>
                  
                  {/* Deposit Interest */}
                  <TableCell align="right" sx={{ py: 1 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.totalDepositInterest && Number(snapshot.totalDepositInterest) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.totalDepositInterest && Number(snapshot.totalDepositInterest) >= 0 ? '+' : ''}
                      {formatCurrency(Number(snapshot.totalDepositInterest || 0), baseCurrency)}
                    </ResponsiveTypography>
                  </TableCell>
                  
                  {/* Deposit Unrealized P&L */}
                  <TableCell align="right" sx={{ py: 1 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.unrealizedDepositPnL && Number(snapshot.unrealizedDepositPnL) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.unrealizedDepositPnL && Number(snapshot.unrealizedDepositPnL) >= 0 ? '+' : ''}
                      {formatCurrency(Number(snapshot.unrealizedDepositPnL || 0), baseCurrency)}
                    </ResponsiveTypography>
                  </TableCell>
                  
                  {/* Deposit Realized P&L */}
                  <TableCell align="right" sx={{ py: 1 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.realizedDepositPnL && Number(snapshot.realizedDepositPnL) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.realizedDepositPnL && Number(snapshot.realizedDepositPnL) >= 0 ? '+' : ''}
                      {formatCurrency(Number(snapshot.realizedDepositPnL || 0), baseCurrency)}
                    </ResponsiveTypography>
                  </TableCell>
                  
                  {/* Cash Balance */}
                  <TableCell align="right" sx={{ py: 1 }}>
                    <ResponsiveTypography variant="tableCellSmall" >
                      {formatCurrency(Number(snapshot.cashBalance || 0), baseCurrency)}
                    </ResponsiveTypography>
                  </TableCell>
                  
                  {/* Fund Management */}
                  <TableCell align="right" sx={{ py: 1 }}>
                    <ResponsiveTypography variant="tableCellSmall" >
                      {formatNumber(Number(snapshot.totalOutstandingUnits || 0))}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 1 }}>
                    <ResponsiveTypography variant="tableCellSmall" sx={{ color: 'primary.main' }}>
                      {formatCurrency(Number(snapshot.navPerUnit || 0), baseCurrency)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 1 }}>
                    <ResponsiveTypography variant="tableCellSmall" >
                      {formatNumber(Number(snapshot.numberOfInvestors || 0),0)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="center" sx={{ py: 1 }}>
                    <Chip 
                      label={snapshot.isFund ? 'Yes' : 'No'} 
                      size="small" 
                      color={snapshot.isFund ? 'primary' : 'default'}
                      sx={{ fontSize: '0.6rem', height: 20 }}
                    />
                  </TableCell>
                  
                  {/* Portfolio Performance Metrics - HIDDEN */}
                  {/* Asset Performance Metrics - HIDDEN */}
                  
                  {/* Daily Return % */}
                  <TableCell align="right" sx={{ py: 1 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.dailyReturn && Number(snapshot.dailyReturn) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.dailyReturn && Number(snapshot.dailyReturn) >= 0 ? '+' : ''}
                      {formatPercentage(Number(snapshot.dailyReturn || 0))}
                    </ResponsiveTypography>
                  </TableCell>
                  
                  {/* Weekly Return % */}
                  <TableCell align="right" sx={{ py: 1 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.weeklyReturn && Number(snapshot.weeklyReturn) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.weeklyReturn && Number(snapshot.weeklyReturn) >= 0 ? '+' : ''}
                      {formatPercentage(Number(snapshot.weeklyReturn || 0))}
                    </ResponsiveTypography>
                  </TableCell>
                  
                  {/* Monthly Return % */}
                  <TableCell align="right" sx={{ py: 1 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.monthlyReturn && Number(snapshot.monthlyReturn) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.monthlyReturn && Number(snapshot.monthlyReturn) >= 0 ? '+' : ''}
                      {formatPercentage(Number(snapshot.monthlyReturn || 0))}
                    </ResponsiveTypography>
                  </TableCell>
                  
                  {/* YTD Return % */}
                  <TableCell align="right" sx={{ py: 1 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.ytdReturn && Number(snapshot.ytdReturn) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.ytdReturn && Number(snapshot.ytdReturn) >= 0 ? '+' : ''}
                      {formatPercentage(Number(snapshot.ytdReturn || 0))}
                    </ResponsiveTypography>
                  </TableCell>
                  
                  {/* Total Return % */}
                  <TableCell align="right" sx={{ py: 1 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.totalReturn && Number(snapshot.totalReturn) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.totalReturn && Number(snapshot.totalReturn) >= 0 ? '+' : ''}
                      {formatPercentage(Number(snapshot.totalReturn || 0))}
                    </ResponsiveTypography>
                  </TableCell>
                  
                  {/* Asset Count */}
                  <TableCell align="right" sx={{ py: 1 }}>
                    <ResponsiveTypography variant="tableCellSmall" >
                      {snapshot.assetCount || 0}
                    </ResponsiveTypography>
                  </TableCell>
                  
                  {/* Active Asset Count */}
                  <TableCell align="right" sx={{ py: 1 }}>
                    <ResponsiveTypography variant="tableCellSmall" >
                      {snapshot.activeAssetCount || 0}
                    </ResponsiveTypography>
                  </TableCell>
                  
                  {/* Granularity Type */}
                  <TableCell align="right" sx={{ py: 1 }}>
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
        <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
          <ResponsiveTypography variant="pageSubtitle" sx={{ fontWeight: 500, letterSpacing: '0.3px' }}>
            No portfolio snapshots available
          </ResponsiveTypography>
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
