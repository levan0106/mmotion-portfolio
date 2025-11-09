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
import { formatCurrency, formatPercentage, formatDate } from '../../../../utils/format';
import { PaginationControls } from '../../../Common/PaginationControls';
import { ResponsiveTypography } from '../../../Common/ResponsiveTypography';

interface SnapshotPortfolioPerformanceTabProps {
  portfolioPerformanceData: {
    data: any[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  performanceLoading: boolean;
  baseCurrency: string;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

const SnapshotPortfolioPerformanceTab: React.FC<SnapshotPortfolioPerformanceTabProps> = ({
  portfolioPerformanceData,
  performanceLoading,
  baseCurrency,
  onPageChange,
  onLimitChange,
}) => {
  return (
    <Box>
      {/* <ResponsiveTypography variant="pageTitle" sx={{ mb: 2, color: 'primary.main' }}>
        Portfolio Performance Snapshots
      </ResponsiveTypography> */}
      <ResponsiveTypography variant="pageSubtitle" sx={{ mb: 2, color: 'text.secondary', lineHeight: 1.6 }}>
        Cash Inflows | Cash Outflows | Net Cash Flow được tính từ Cash Flows và filter theo ngày snapshot
      </ResponsiveTypography>
      
      {performanceLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
      
      {portfolioPerformanceData.data && portfolioPerformanceData.data.length > 0 ? (
        <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 2000 }}>
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
                {/* TWR Metrics */}
                <TableCell sx={{ py: 1, minWidth: 80, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >TWR 1D</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 1, minWidth: 80, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >TWR 1W</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 1, minWidth: 80, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >TWR 1M</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 1, minWidth: 80, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >TWR 3M</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 1, minWidth: 80, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >TWR 6M</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 1, minWidth: 80, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >TWR 1Y</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 1, minWidth: 80, letterSpacing: '0.3px' }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >TWR YTD</ResponsiveTypography></TableCell>
                {/* MWR Metrics */}
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >MWR 1M</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >MWR 3M</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >MWR 6M</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >MWR 1Y</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >MWR YTD</ResponsiveTypography></TableCell>
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
                {/* Beta Metrics */}
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Beta 1M</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Beta 3M</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Beta 6M</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Beta 1Y</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Beta YTD</ResponsiveTypography></TableCell>
                {/* Information Ratio */}
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Info Ratio 1M</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Info Ratio 3M</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Info Ratio 1Y</ResponsiveTypography></TableCell>
                {/* Tracking Error */}
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Track Error 1M</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Track Error 3M</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 80 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Track Error 1Y</ResponsiveTypography></TableCell>
                {/* Cash Flow */}
                <TableCell sx={{ py: 0.5, minWidth: 120 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Cash Inflows</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 120 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Cash Outflows</ResponsiveTypography></TableCell>
                <TableCell sx={{ py: 0.5, minWidth: 120 }} align="right"><ResponsiveTypography variant="tableHeaderSmall" >Net Cash Flow</ResponsiveTypography></TableCell>
                {/* Granularity moved to end */}
                <TableCell sx={{ py: 0.5, minWidth: 80 }}><ResponsiveTypography variant="tableHeaderSmall" >Granularity</ResponsiveTypography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {portfolioPerformanceData.data
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
                    <ResponsiveTypography variant="tableCellSmall" sx={{ fontWeight: 500, letterSpacing: '0.2px' }}>
                      {formatDate(snapshot.snapshotDate)}
                    </ResponsiveTypography>
                  </TableCell>
                  {/* TWR Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.portfolioTWR1D && Number(snapshot.portfolioTWR1D) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.portfolioTWR1D && Number(snapshot.portfolioTWR1D) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioTWR1D)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.portfolioTWR1W && Number(snapshot.portfolioTWR1W) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.portfolioTWR1W && Number(snapshot.portfolioTWR1W) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioTWR1W)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.portfolioTWR1M && Number(snapshot.portfolioTWR1M) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.portfolioTWR1M && Number(snapshot.portfolioTWR1M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioTWR1M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.portfolioTWR3M && Number(snapshot.portfolioTWR3M) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.portfolioTWR3M && Number(snapshot.portfolioTWR3M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioTWR3M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.portfolioTWR6M && Number(snapshot.portfolioTWR6M) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.portfolioTWR6M && Number(snapshot.portfolioTWR6M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioTWR6M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.portfolioTWR1Y && Number(snapshot.portfolioTWR1Y) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.portfolioTWR1Y && Number(snapshot.portfolioTWR1Y) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioTWR1Y)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.portfolioTWRYTD && Number(snapshot.portfolioTWRYTD) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.portfolioTWRYTD && Number(snapshot.portfolioTWRYTD) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioTWRYTD)}
                    </ResponsiveTypography>
                  </TableCell>
                  {/* MWR Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.portfolioMWR1M && Number(snapshot.portfolioMWR1M) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.portfolioMWR1M && Number(snapshot.portfolioMWR1M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioMWR1M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.portfolioMWR3M && Number(snapshot.portfolioMWR3M) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.portfolioMWR3M && Number(snapshot.portfolioMWR3M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioMWR3M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.portfolioMWR6M && Number(snapshot.portfolioMWR6M) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.portfolioMWR6M && Number(snapshot.portfolioMWR6M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioMWR6M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.portfolioMWR1Y && Number(snapshot.portfolioMWR1Y) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.portfolioMWR1Y && Number(snapshot.portfolioMWR1Y) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioMWR1Y)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.portfolioMWRYTD && Number(snapshot.portfolioMWRYTD) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.portfolioMWRYTD && Number(snapshot.portfolioMWRYTD) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioMWRYTD)}
                    </ResponsiveTypography>
                  </TableCell>
                  {/* IRR Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.portfolioIRR1M && Number(snapshot.portfolioIRR1M) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.portfolioIRR1M && Number(snapshot.portfolioIRR1M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioIRR1M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.portfolioIRR3M && Number(snapshot.portfolioIRR3M) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.portfolioIRR3M && Number(snapshot.portfolioIRR3M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioIRR3M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.portfolioIRR6M && Number(snapshot.portfolioIRR6M) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.portfolioIRR6M && Number(snapshot.portfolioIRR6M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioIRR6M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.portfolioIRR1Y && Number(snapshot.portfolioIRR1Y) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.portfolioIRR1Y && Number(snapshot.portfolioIRR1Y) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioIRR1Y)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.portfolioIRRYTD && Number(snapshot.portfolioIRRYTD) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.portfolioIRRYTD && Number(snapshot.portfolioIRRYTD) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioIRRYTD)}
                    </ResponsiveTypography>
                  </TableCell>
                  {/* Alpha Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.portfolioAlpha1M && Number(snapshot.portfolioAlpha1M) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.portfolioAlpha1M && Number(snapshot.portfolioAlpha1M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioAlpha1M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.portfolioAlpha3M && Number(snapshot.portfolioAlpha3M) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.portfolioAlpha3M && Number(snapshot.portfolioAlpha3M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioAlpha3M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.portfolioAlpha6M && Number(snapshot.portfolioAlpha6M) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.portfolioAlpha6M && Number(snapshot.portfolioAlpha6M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioAlpha6M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.portfolioAlpha1Y && Number(snapshot.portfolioAlpha1Y) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.portfolioAlpha1Y && Number(snapshot.portfolioAlpha1Y) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioAlpha1Y)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.portfolioAlphaYTD && Number(snapshot.portfolioAlphaYTD) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.portfolioAlphaYTD && Number(snapshot.portfolioAlphaYTD) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioAlphaYTD)}
                    </ResponsiveTypography>
                  </TableCell>
                  {/* Beta Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography variant="tableCellSmall" >
                      {(parseFloat(snapshot.portfolioBeta1M) || 0).toFixed(2)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography variant="tableCellSmall" >
                      {(parseFloat(snapshot.portfolioBeta3M) || 0).toFixed(2)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography variant="tableCellSmall" >
                      {(parseFloat(snapshot.portfolioBeta6M) || 0).toFixed(2)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography variant="tableCellSmall" >
                      {(parseFloat(snapshot.portfolioBeta1Y) || 0).toFixed(2)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography variant="tableCellSmall" >
                      {(parseFloat(snapshot.portfolioBetaYTD) || 0).toFixed(2)}
                    </ResponsiveTypography>
                  </TableCell>
                  {/* Information Ratio Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.portfolioInformationRatio1M && Number(snapshot.portfolioInformationRatio1M) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {(parseFloat(snapshot.portfolioInformationRatio1M) || 0).toFixed(2)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.portfolioInformationRatio3M && Number(snapshot.portfolioInformationRatio3M) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {(parseFloat(snapshot.portfolioInformationRatio3M) || 0).toFixed(2)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.portfolioInformationRatio1Y && Number(snapshot.portfolioInformationRatio1Y) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {(parseFloat(snapshot.portfolioInformationRatio1Y) || 0).toFixed(2)}
                    </ResponsiveTypography>
                  </TableCell>
                  {/* Tracking Error Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography variant="tableCellSmall" >
                      {formatPercentage(snapshot.portfolioTrackingError1M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography variant="tableCellSmall" >
                      {formatPercentage(snapshot.portfolioTrackingError3M)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography variant="tableCellSmall" >
                      {formatPercentage(snapshot.portfolioTrackingError1Y)}
                    </ResponsiveTypography>
                  </TableCell>
                  {/* Cash Flow Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography variant="tableCellSmall" >
                      {formatCurrency(snapshot.totalCashInflows || 0, baseCurrency)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography variant="tableCellSmall" >
                      {formatCurrency(snapshot.totalCashOutflows || 0, baseCurrency)}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <ResponsiveTypography 
                      variant="tableCellSmall" 
                      sx={{ color: snapshot.netCashFlow && Number(snapshot.netCashFlow) >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {snapshot.netCashFlow && Number(snapshot.netCashFlow) >= 0 ? '+' : ''}
                      {formatCurrency(snapshot.netCashFlow || 0, baseCurrency)}
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
            No portfolio performance snapshots available
          </ResponsiveTypography>
        </Box>
      )}
      
      {/* Pagination Controls */}
      {portfolioPerformanceData.data && portfolioPerformanceData.data.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <PaginationControls
            page={portfolioPerformanceData.page}
            limit={portfolioPerformanceData.limit}
            total={portfolioPerformanceData.total}
            totalPages={portfolioPerformanceData.totalPages}
            hasNext={portfolioPerformanceData.hasNext}
            hasPrev={portfolioPerformanceData.hasPrev}
            onPageChange={onPageChange}
            onLimitChange={onLimitChange}
          />
        </Box>
      )}
    </Box>
  );
};

export default SnapshotPortfolioPerformanceTab;
