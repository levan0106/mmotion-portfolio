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

interface SnapshotAssetGroupPerformanceTabProps {
  assetGroupPerformanceData: PaginatedResponse<any>;
  performanceLoading: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

const SnapshotAssetGroupPerformanceTab: React.FC<SnapshotAssetGroupPerformanceTabProps> = ({
  assetGroupPerformanceData,
  performanceLoading,
  onPageChange,
  onLimitChange,
}) => {
  return (
    <Box>
      <ResponsiveTypography variant="pageTitle" sx={{ mb: 2, color: 'primary.main' }}>
        Asset Group Performance Snapshots
      </ResponsiveTypography>
      
      {performanceLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
      
      {assetGroupPerformanceData.data.length > 0 ? (
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
                <TableCell sx={{ py: 1, minWidth: 120, letterSpacing: '0.3px' }}><ResponsiveTypography variant="tableHeaderSmall" >Asset Type</ResponsiveTypography></TableCell>
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
        {/* <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Beta 1M</ResponsiveTypography></TableCell>
        <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Beta 3M</ResponsiveTypography></TableCell>
        <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Beta 6M</ResponsiveTypography></TableCell>
        <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Beta 1Y</ResponsiveTypography></TableCell>
        <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Beta YTD</ResponsiveTypography></TableCell> */}
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
              {assetGroupPerformanceData.data
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
                    <ResponsiveTypography variant="tableCellSmall" sx={{letterSpacing: '0.2px' }}>
                      {formatDate(snapshot.snapshotDate)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell sx={{ py: 0.5 }}>
                    <ResponsiveTypography variant="tableCellSmall" sx={{letterSpacing: '0.2px' }}>
                      {snapshot.assetType || 'Unknown Type'}
                    </ResponsiveTypography>
                  </TableCell>
                  {/* TWR Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.groupTWR1D && Number(snapshot.groupTWR1D) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.groupTWR1D && Number(snapshot.groupTWR1D) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupTWR1D)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.groupTWR1W && Number(snapshot.groupTWR1W) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.groupTWR1W && Number(snapshot.groupTWR1W) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupTWR1W)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.groupTWR1M && Number(snapshot.groupTWR1M) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.groupTWR1M && Number(snapshot.groupTWR1M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupTWR1M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.groupTWR3M && Number(snapshot.groupTWR3M) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.groupTWR3M && Number(snapshot.groupTWR3M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupTWR3M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.groupTWR6M && Number(snapshot.groupTWR6M) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.groupTWR6M && Number(snapshot.groupTWR6M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupTWR6M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.groupTWR1Y && Number(snapshot.groupTWR1Y) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.groupTWR1Y && Number(snapshot.groupTWR1Y) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupTWR1Y)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.groupTWRYTD && Number(snapshot.groupTWRYTD) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.groupTWRYTD && Number(snapshot.groupTWRYTD) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupTWRYTD)}
                    </ResponsiveTypography>
                  </TableCell>
                  {/* IRR Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.groupIRR1M && Number(snapshot.groupIRR1M) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.groupIRR1M && Number(snapshot.groupIRR1M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupIRR1M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.groupIRR3M && Number(snapshot.groupIRR3M) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.groupIRR3M && Number(snapshot.groupIRR3M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupIRR3M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.groupIRR6M && Number(snapshot.groupIRR6M) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.groupIRR6M && Number(snapshot.groupIRR6M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupIRR6M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.groupIRR1Y && Number(snapshot.groupIRR1Y) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.groupIRR1Y && Number(snapshot.groupIRR1Y) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupIRR1Y)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.groupIRRYTD && Number(snapshot.groupIRRYTD) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.groupIRRYTD && Number(snapshot.groupIRRYTD) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupIRRYTD)}
                    </ResponsiveTypography>
                  </TableCell>
                  {/* Alpha Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.groupAlpha1M && Number(snapshot.groupAlpha1M) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.groupAlpha1M && Number(snapshot.groupAlpha1M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupAlpha1M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.groupAlpha3M && Number(snapshot.groupAlpha3M) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.groupAlpha3M && Number(snapshot.groupAlpha3M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupAlpha3M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.groupAlpha6M && Number(snapshot.groupAlpha6M) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.groupAlpha6M && Number(snapshot.groupAlpha6M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupAlpha6M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.groupAlpha1Y && Number(snapshot.groupAlpha1Y) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.groupAlpha1Y && Number(snapshot.groupAlpha1Y) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupAlpha1Y)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.groupAlphaYTD && Number(snapshot.groupAlphaYTD) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.groupAlphaYTD && Number(snapshot.groupAlphaYTD) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupAlphaYTD)}
                    </ResponsiveTypography>
                  </TableCell>
                  {/* Beta Values */}
                  {/* Beta Metrics - REMOVED due to calculation issues */}
                  {/* <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography variant="tableCellSmall" >
                      {(parseFloat(snapshot.groupBeta1M) || 0).toFixed(2)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography variant="tableCellSmall" >
                      {(parseFloat(snapshot.groupBeta3M) || 0).toFixed(2)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography variant="tableCellSmall" >
                      {(parseFloat(snapshot.groupBeta6M) || 0).toFixed(2)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography variant="tableCellSmall" >
                      {(parseFloat(snapshot.groupBeta1Y) || 0).toFixed(2)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography variant="tableCellSmall" >
                      {(parseFloat(snapshot.groupBetaYTD) || 0).toFixed(2)}
                    </ResponsiveTypography>
                  </TableCell> */}
                  {/* Sharpe Ratio Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.groupSharpeRatio1M && Number(snapshot.groupSharpeRatio1M) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {(parseFloat(snapshot.groupSharpeRatio1M) || 0).toFixed(2)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.groupSharpeRatio3M && Number(snapshot.groupSharpeRatio3M) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {(parseFloat(snapshot.groupSharpeRatio3M) || 0).toFixed(2)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.groupSharpeRatio1Y && Number(snapshot.groupSharpeRatio1Y) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {(parseFloat(snapshot.groupSharpeRatio1Y) || 0).toFixed(2)}
                    </ResponsiveTypography>
                  </TableCell>
                  {/* Volatility Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography variant="tableCellSmall" >
                      {formatPercentage(snapshot.groupVolatility1M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography variant="tableCellSmall" >
                      {formatPercentage(snapshot.groupVolatility3M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography variant="tableCellSmall" >
                      {formatPercentage(snapshot.groupVolatility1Y)}
                    </ResponsiveTypography>
                  </TableCell>
                  {/* Max Drawdown Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      color="error.main"
                    >
                      -{formatPercentage(snapshot.groupMaxDrawdown1M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      color="error.main"
                    >
                      -{formatPercentage(snapshot.groupMaxDrawdown3M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      color="error.main"
                    >
                      -{formatPercentage(snapshot.groupMaxDrawdown1Y)}
                    </ResponsiveTypography>
                  </TableCell>
                  {/* Risk-Adjusted Return Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.groupRiskAdjustedReturn1M && Number(snapshot.groupRiskAdjustedReturn1M) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.groupRiskAdjustedReturn1M && Number(snapshot.groupRiskAdjustedReturn1M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupRiskAdjustedReturn1M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.groupRiskAdjustedReturn3M && Number(snapshot.groupRiskAdjustedReturn3M) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.groupRiskAdjustedReturn3M && Number(snapshot.groupRiskAdjustedReturn3M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupRiskAdjustedReturn3M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.groupRiskAdjustedReturn1Y && Number(snapshot.groupRiskAdjustedReturn1Y) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.groupRiskAdjustedReturn1Y && Number(snapshot.groupRiskAdjustedReturn1Y) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupRiskAdjustedReturn1Y)}
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
          <ResponsiveTypography variant="pageSubtitle" sx={{ fontWeight: 500, letterSpacing: '0.3px' }}>
            No asset group performance snapshots available
          </ResponsiveTypography>
        </Box>
      )}
      
      {/* Pagination Controls */}
      {assetGroupPerformanceData.data.length > 0 && (
        <PaginationControls
          page={assetGroupPerformanceData.page}
          limit={assetGroupPerformanceData.limit}
          total={assetGroupPerformanceData.total}
          totalPages={assetGroupPerformanceData.totalPages}
          hasNext={assetGroupPerformanceData.hasNext}
          hasPrev={assetGroupPerformanceData.hasPrev}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          limitOptions={[5, 10, 25, 50, 100]}
        />
      )}
    </Box>
  );
};

export default SnapshotAssetGroupPerformanceTab;
