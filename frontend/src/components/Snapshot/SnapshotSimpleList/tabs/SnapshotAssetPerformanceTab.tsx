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
  CircularProgress,
} from '@mui/material';
import { formatPercentage, formatDate } from '../../../../utils/format';
import { PaginationControls } from '../../../Common/PaginationControls';
import { PaginatedResponse } from '../../../../hooks/usePagination';

interface SnapshotAssetPerformanceTabProps {
  assetPerformanceData: PaginatedResponse<any>;
  performanceLoading: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

const SnapshotAssetPerformanceTab: React.FC<SnapshotAssetPerformanceTabProps> = ({
  assetPerformanceData,
  performanceLoading,
  onPageChange,
  onLimitChange,
}) => {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Asset Performance Snapshots
      </Typography>
      
      {performanceLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
      
      {assetPerformanceData.data.length > 0 ? (
        <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 1000 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 100 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 120 }}>Asset Symbol</TableCell>
                {/* TWR Metrics */}
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">TWR 1D</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">TWR 1W</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">TWR 1M</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">TWR 3M</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">TWR 6M</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">TWR 1Y</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">TWR YTD</TableCell>
                {/* IRR Metrics */}
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">IRR 1M</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">IRR 3M</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">IRR 6M</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">IRR 1Y</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">IRR YTD</TableCell>
                {/* Alpha Metrics */}
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Alpha 1M</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Alpha 3M</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Alpha 6M</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Alpha 1Y</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Alpha YTD</TableCell>
        {/* Beta Metrics - REMOVED due to calculation issues */}
        {/* <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Beta 1M</TableCell>
        <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Beta 3M</TableCell>
        <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Beta 6M</TableCell>
        <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Beta 1Y</TableCell>
        <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Beta YTD</TableCell> */}
                {/* Sharpe Ratio */}
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Sharpe 1M</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Sharpe 3M</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Sharpe 1Y</TableCell>
                {/* Volatility */}
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Volatility 1M</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Volatility 3M</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Volatility 1Y</TableCell>
                {/* Max Drawdown */}
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Max DD 1M</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Max DD 3M</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Max DD 1Y</TableCell>
                {/* Risk-Adjusted Return */}
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Risk Adj 1M</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Risk Adj 3M</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Risk Adj 1Y</TableCell>
                {/* Granularity moved to end */}
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }}>Granularity</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assetPerformanceData.data
                .sort((a, b) => new Date(b.snapshotDate).getTime() - new Date(a.snapshotDate).getTime())
                .map((snapshot) => (
                <TableRow key={snapshot.id} hover>
                  <TableCell sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {formatDate(snapshot.snapshotDate)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {snapshot.assetSymbol || 'Unknown'}
                    </Typography>
                  </TableCell>
                  {/* TWR Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.assetTWR1D && Number(snapshot.assetTWR1D) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.assetTWR1D && Number(snapshot.assetTWR1D) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetTWR1D)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.assetTWR1W && Number(snapshot.assetTWR1W) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.assetTWR1W && Number(snapshot.assetTWR1W) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetTWR1W)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.assetTWR1M && Number(snapshot.assetTWR1M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.assetTWR1M && Number(snapshot.assetTWR1M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetTWR1M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.assetTWR3M && Number(snapshot.assetTWR3M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.assetTWR3M && Number(snapshot.assetTWR3M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetTWR3M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.assetTWR6M && Number(snapshot.assetTWR6M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.assetTWR6M && Number(snapshot.assetTWR6M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetTWR6M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.assetTWR1Y && Number(snapshot.assetTWR1Y) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.assetTWR1Y && Number(snapshot.assetTWR1Y) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetTWR1Y)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.assetTWRYTD && Number(snapshot.assetTWRYTD) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.assetTWRYTD && Number(snapshot.assetTWRYTD) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetTWRYTD)}
                    </Typography>
                  </TableCell>
                  {/* IRR Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.assetIRR1M && Number(snapshot.assetIRR1M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.assetIRR1M && Number(snapshot.assetIRR1M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetIRR1M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.assetIRR3M && Number(snapshot.assetIRR3M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.assetIRR3M && Number(snapshot.assetIRR3M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetIRR3M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.assetIRR6M && Number(snapshot.assetIRR6M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.assetIRR6M && Number(snapshot.assetIRR6M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetIRR6M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.assetIRR1Y && Number(snapshot.assetIRR1Y) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.assetIRR1Y && Number(snapshot.assetIRR1Y) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetIRR1Y)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.assetIRRYTD && Number(snapshot.assetIRRYTD) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.assetIRRYTD && Number(snapshot.assetIRRYTD) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetIRRYTD)}
                    </Typography>
                  </TableCell>
                  {/* Alpha Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.assetAlpha1M && Number(snapshot.assetAlpha1M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.assetAlpha1M && Number(snapshot.assetAlpha1M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetAlpha1M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.assetAlpha3M && Number(snapshot.assetAlpha3M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.assetAlpha3M && Number(snapshot.assetAlpha3M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetAlpha3M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.assetAlpha6M && Number(snapshot.assetAlpha6M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.assetAlpha6M && Number(snapshot.assetAlpha6M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetAlpha6M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.assetAlpha1Y && Number(snapshot.assetAlpha1Y) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.assetAlpha1Y && Number(snapshot.assetAlpha1Y) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetAlpha1Y)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.assetAlphaYTD && Number(snapshot.assetAlphaYTD) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.assetAlphaYTD && Number(snapshot.assetAlphaYTD) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetAlphaYTD)}
                    </Typography>
                  </TableCell>
                  {/* Beta Values */}
                  {/* Beta Metrics - REMOVED due to calculation issues */}
                  {/* <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {(parseFloat(snapshot.assetBeta1M) || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {(parseFloat(snapshot.assetBeta3M) || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {(parseFloat(snapshot.assetBeta6M) || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {(parseFloat(snapshot.assetBeta1Y) || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {(parseFloat(snapshot.assetBetaYTD) || 0).toFixed(2)}
                    </Typography>
                  </TableCell> */}
                  {/* Sharpe Ratio Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.assetSharpeRatio1M && Number(snapshot.assetSharpeRatio1M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {(parseFloat(snapshot.assetSharpeRatio1M) || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.assetSharpeRatio3M && Number(snapshot.assetSharpeRatio3M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {(parseFloat(snapshot.assetSharpeRatio3M) || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.assetSharpeRatio1Y && Number(snapshot.assetSharpeRatio1Y) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {(parseFloat(snapshot.assetSharpeRatio1Y) || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  {/* Volatility Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {formatPercentage(snapshot.assetVolatility1M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {formatPercentage(snapshot.assetVolatility3M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {formatPercentage(snapshot.assetVolatility1Y)}
                    </Typography>
                  </TableCell>
                  {/* Max Drawdown Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color="error.main"
                    >
                      -{formatPercentage(snapshot.assetMaxDrawdown1M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color="error.main"
                    >
                      -{formatPercentage(snapshot.assetMaxDrawdown3M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color="error.main"
                    >
                      -{formatPercentage(snapshot.assetMaxDrawdown1Y)}
                    </Typography>
                  </TableCell>
                  {/* Risk-Adjusted Return Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.assetRiskAdjustedReturn1M && Number(snapshot.assetRiskAdjustedReturn1M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.assetRiskAdjustedReturn1M && Number(snapshot.assetRiskAdjustedReturn1M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetRiskAdjustedReturn1M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.assetRiskAdjustedReturn3M && Number(snapshot.assetRiskAdjustedReturn3M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.assetRiskAdjustedReturn3M && Number(snapshot.assetRiskAdjustedReturn3M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetRiskAdjustedReturn3M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.assetRiskAdjustedReturn1Y && Number(snapshot.assetRiskAdjustedReturn1Y) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.assetRiskAdjustedReturn1Y && Number(snapshot.assetRiskAdjustedReturn1Y) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetRiskAdjustedReturn1Y)}
                    </Typography>
                  </TableCell>
                  {/* Granularity moved to end */}
                  <TableCell sx={{ py: 0.5 }}>
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
            No asset performance snapshots available
          </Typography>
        </Box>
      )}
      
      {/* Pagination Controls */}
      {assetPerformanceData.data.length > 0 && (
        <PaginationControls
          page={assetPerformanceData.page}
          limit={assetPerformanceData.limit}
          total={assetPerformanceData.total}
          totalPages={assetPerformanceData.totalPages}
          hasNext={assetPerformanceData.hasNext}
          hasPrev={assetPerformanceData.hasPrev}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          limitOptions={[5, 10, 25, 50, 100]}
        />
      )}
    </Box>
  );
};

export default SnapshotAssetPerformanceTab;
