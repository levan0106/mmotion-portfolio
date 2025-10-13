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
  Chip,
  CircularProgress,
} from '@mui/material';
import { formatPercentage, formatDate } from '../../../../utils/format';
import { PaginationControls } from '../../../Common/PaginationControls';
import { PaginatedResponse } from '../../../../hooks/usePagination';
import { ResponsiveTypography } from '../../../Common/ResponsiveTypography';

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
      <ResponsiveTypography variant="pageTitle" sx={{ mb: 2, color: 'primary.main' }}>
        Asset Performance Snapshots
      </ResponsiveTypography>
      
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
                <TableCell sx={{ 
                  py: 1, 
                  minWidth: 100,
                  position: 'sticky',
                  left: 0,
                  backgroundColor: 'grey.50',
                  zIndex: 1,
                  borderRight: '1px solid',
                  borderColor: 'divider',
                  letterSpacing: '0.5px'
                }}><ResponsiveTypography variant="tableHeaderSmall" >Date</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 1, minWidth: 120, letterSpacing: '0.3px' }}><ResponsiveTypography variant="tableHeaderSmall" >Asset Symbol</ResponsiveTypography></TableCell>
                {/* TWR Metrics */}
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >TWR 1D</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >TWR 1W</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >TWR 1M</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >TWR 3M</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >TWR 6M</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >TWR 1Y</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >TWR YTD</ResponsiveTypography></TableCell>
                {/* IRR Metrics */}
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >IRR 1M</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >IRR 3M</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >IRR 6M</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >IRR 1Y</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >IRR YTD</ResponsiveTypography></TableCell>
                {/* Alpha Metrics */}
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Alpha 1M</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Alpha 3M</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Alpha 6M</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Alpha 1Y</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Alpha YTD</ResponsiveTypography></TableCell>
        {/* Beta Metrics - REMOVED due to calculation issues */}
        {/* <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right">Beta 1M</TableCell>
        <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right">Beta 3M</TableCell>
        <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right">Beta 6M</TableCell>
        <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right">Beta 1Y</TableCell>
        <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right">Beta YTD</TableCell> */}
                {/* Sharpe Ratio */}
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Sharpe 1M</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Sharpe 3M</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Sharpe 1Y</ResponsiveTypography></TableCell>
                {/* Volatility */}
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Volatility 1M</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Volatility 3M</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Volatility 1Y</ResponsiveTypography></TableCell>
                {/* Max Drawdown */}
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Max DD 1M</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Max DD 3M</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Max DD 1Y</ResponsiveTypography></TableCell>
                {/* Risk-Adjusted Return */}
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Risk Adj 1M</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Risk Adj 3M</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Risk Adj 1Y</ResponsiveTypography></TableCell>
                {/* Granularity moved to end */}
                <TableCell sx={{ py: 0.5, minWidth: 80 }}><ResponsiveTypography variant="tableHeaderSmall" >Granularity</ResponsiveTypography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assetPerformanceData.data
                .sort((a, b) => new Date(b.snapshotDate).getTime() - new Date(a.snapshotDate).getTime())
                .map((snapshot) => (
                <TableRow key={snapshot.id} hover>
                  <TableCell sx={{ 
                    py: 0.5,
                    position: 'sticky',
                    left: 0,
                    backgroundColor: 'background.paper',
                    zIndex: 1,
                    borderRight: '1px solid',
                    borderColor: 'divider'
                  }}>
                    <ResponsiveTypography variant="tableCellSmall" sx={{ letterSpacing: '0.2px' }}>
                      {formatDate(snapshot.snapshotDate)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell sx={{ py: 0.5 }}>
                    <ResponsiveTypography variant="tableCellSmall" sx={{ letterSpacing: '0.2px' }}>
                      {snapshot.assetSymbol || 'Unknown'}
                    </ResponsiveTypography>
                  </TableCell>
                  {/* TWR Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.assetTWR1D && Number(snapshot.assetTWR1D) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.assetTWR1D && Number(snapshot.assetTWR1D) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetTWR1D)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.assetTWR1W && Number(snapshot.assetTWR1W) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.assetTWR1W && Number(snapshot.assetTWR1W) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetTWR1W)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.assetTWR1W && Number(snapshot.assetTWR1W) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.assetTWR1M && Number(snapshot.assetTWR1M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetTWR1M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.assetTWR1W && Number(snapshot.assetTWR1W) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.assetTWR3M && Number(snapshot.assetTWR3M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetTWR3M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.assetTWR1W && Number(snapshot.assetTWR1W) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.assetTWR6M && Number(snapshot.assetTWR6M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetTWR6M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.assetTWR1W && Number(snapshot.assetTWR1W) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.assetTWR1Y && Number(snapshot.assetTWR1Y) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetTWR1Y)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.assetTWR1W && Number(snapshot.assetTWR1W) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.assetTWRYTD && Number(snapshot.assetTWRYTD) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetTWRYTD)}
                    </ResponsiveTypography>
                  </TableCell>
                  {/* IRR Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.assetTWR1W && Number(snapshot.assetTWR1W) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.assetIRR1M && Number(snapshot.assetIRR1M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetIRR1M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.assetTWR1W && Number(snapshot.assetTWR1W) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.assetIRR3M && Number(snapshot.assetIRR3M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetIRR3M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.assetTWR1W && Number(snapshot.assetTWR1W) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.assetIRR6M && Number(snapshot.assetIRR6M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetIRR6M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.assetTWR1W && Number(snapshot.assetTWR1W) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.assetIRR1Y && Number(snapshot.assetIRR1Y) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetIRR1Y)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.assetTWR1W && Number(snapshot.assetTWR1W) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.assetIRRYTD && Number(snapshot.assetIRRYTD) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetIRRYTD)}
                    </ResponsiveTypography>
                  </TableCell>
                  {/* Alpha Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.assetTWR1W && Number(snapshot.assetTWR1W) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.assetAlpha1M && Number(snapshot.assetAlpha1M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetAlpha1M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.assetTWR1W && Number(snapshot.assetTWR1W) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.assetAlpha3M && Number(snapshot.assetAlpha3M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetAlpha3M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.assetTWR1W && Number(snapshot.assetTWR1W) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.assetAlpha6M && Number(snapshot.assetAlpha6M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetAlpha6M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.assetTWR1W && Number(snapshot.assetTWR1W) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.assetAlpha1Y && Number(snapshot.assetAlpha1Y) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetAlpha1Y)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.assetTWR1W && Number(snapshot.assetTWR1W) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.assetAlphaYTD && Number(snapshot.assetAlphaYTD) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetAlphaYTD)}
                    </ResponsiveTypography>
                  </TableCell>
                  {/* Beta Values */}
                  {/* Beta Metrics - REMOVED due to calculation issues */}
                  {/* <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography variant="tableCellSmall" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {(parseFloat(snapshot.assetBeta1M) || 0).toFixed(2)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography variant="tableCellSmall" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {(parseFloat(snapshot.assetBeta3M) || 0).toFixed(2)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography variant="tableCellSmall" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {(parseFloat(snapshot.assetBeta6M) || 0).toFixed(2)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography variant="tableCellSmall" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {(parseFloat(snapshot.assetBeta1Y) || 0).toFixed(2)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography variant="tableCellSmall" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {(parseFloat(snapshot.assetBetaYTD) || 0).toFixed(2)}
                    </ResponsiveTypography>
                  </TableCell> */}
                  {/* Sharpe Ratio Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.assetTWR1W && Number(snapshot.assetTWR1W) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {(parseFloat(snapshot.assetSharpeRatio1M) || 0).toFixed(2)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.assetTWR1W && Number(snapshot.assetTWR1W) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {(parseFloat(snapshot.assetSharpeRatio3M) || 0).toFixed(2)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.assetTWR1W && Number(snapshot.assetTWR1W) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {(parseFloat(snapshot.assetSharpeRatio1Y) || 0).toFixed(2)}
                    </ResponsiveTypography>
                  </TableCell>
                  {/* Volatility Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography variant="tableCellSmall" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {formatPercentage(snapshot.assetVolatility1M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography variant="tableCellSmall" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {formatPercentage(snapshot.assetVolatility3M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography variant="tableCellSmall" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {formatPercentage(snapshot.assetVolatility1Y)}
                    </ResponsiveTypography>
                  </TableCell>
                  {/* Max Drawdown Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: 'error.main' }}
                    >
                      -{formatPercentage(snapshot.assetMaxDrawdown1M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: 'error.main' }}
                    >
                      -{formatPercentage(snapshot.assetMaxDrawdown3M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: 'error.main' }}
                    >
                      -{formatPercentage(snapshot.assetMaxDrawdown1Y)}
                    </ResponsiveTypography>
                  </TableCell>
                  {/* Risk-Adjusted Return Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.assetTWR1W && Number(snapshot.assetTWR1W) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.assetRiskAdjustedReturn1M && Number(snapshot.assetRiskAdjustedReturn1M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetRiskAdjustedReturn1M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.assetTWR1W && Number(snapshot.assetTWR1W) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.assetRiskAdjustedReturn3M && Number(snapshot.assetRiskAdjustedReturn3M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetRiskAdjustedReturn3M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.assetTWR1W && Number(snapshot.assetTWR1W) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.assetRiskAdjustedReturn1Y && Number(snapshot.assetRiskAdjustedReturn1Y) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.assetRiskAdjustedReturn1Y)}
                    </ResponsiveTypography>
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
        <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
          <ResponsiveTypography variant="pageSubtitle" sx={{ letterSpacing: '0.3px' }}>
            No asset performance snapshots available
          </ResponsiveTypography>
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
