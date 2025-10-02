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
import { formatCurrency, formatPercentage, formatDate } from '../../../../utils/format';
import { PaginationControls } from '../../../Common/PaginationControls';

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
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Portfolio Performance Snapshots
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
        Cash Inflows | Cash Outflows | Net Cash Flow được tính từ Cash Flows và filter theo ngày snapshot
      </Typography>
      
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
                {/* TWR Metrics */}
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">TWR 1D</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">TWR 1W</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">TWR 1M</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">TWR 3M</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">TWR 6M</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">TWR 1Y</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">TWR YTD</TableCell>
                {/* MWR Metrics */}
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">MWR 1M</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">MWR 3M</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">MWR 6M</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">MWR 1Y</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">MWR YTD</TableCell>
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
                {/* Beta Metrics */}
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Beta 1M</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Beta 3M</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Beta 6M</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Beta 1Y</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Beta YTD</TableCell>
                {/* Information Ratio */}
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Info Ratio 1M</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Info Ratio 3M</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Info Ratio 1Y</TableCell>
                {/* Tracking Error */}
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Track Error 1M</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Track Error 3M</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }} align="right">Track Error 1Y</TableCell>
                {/* Cash Flow */}
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 120 }} align="right">Cash Inflows</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 120 }} align="right">Cash Outflows</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 120 }} align="right">Net Cash Flow</TableCell>
                {/* Granularity moved to end */}
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }}>Granularity</TableCell>
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
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {formatDate(snapshot.snapshotDate)}
                    </Typography>
                  </TableCell>
                  {/* TWR Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.portfolioTWR1D && Number(snapshot.portfolioTWR1D) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.portfolioTWR1D && Number(snapshot.portfolioTWR1D) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioTWR1D)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.portfolioTWR1W && Number(snapshot.portfolioTWR1W) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.portfolioTWR1W && Number(snapshot.portfolioTWR1W) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioTWR1W)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.portfolioTWR1M && Number(snapshot.portfolioTWR1M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.portfolioTWR1M && Number(snapshot.portfolioTWR1M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioTWR1M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.portfolioTWR3M && Number(snapshot.portfolioTWR3M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.portfolioTWR3M && Number(snapshot.portfolioTWR3M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioTWR3M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.portfolioTWR6M && Number(snapshot.portfolioTWR6M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.portfolioTWR6M && Number(snapshot.portfolioTWR6M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioTWR6M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.portfolioTWR1Y && Number(snapshot.portfolioTWR1Y) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.portfolioTWR1Y && Number(snapshot.portfolioTWR1Y) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioTWR1Y)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.portfolioTWRYTD && Number(snapshot.portfolioTWRYTD) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.portfolioTWRYTD && Number(snapshot.portfolioTWRYTD) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioTWRYTD)}
                    </Typography>
                  </TableCell>
                  {/* MWR Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.portfolioMWR1M && Number(snapshot.portfolioMWR1M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.portfolioMWR1M && Number(snapshot.portfolioMWR1M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioMWR1M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.portfolioMWR3M && Number(snapshot.portfolioMWR3M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.portfolioMWR3M && Number(snapshot.portfolioMWR3M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioMWR3M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.portfolioMWR6M && Number(snapshot.portfolioMWR6M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.portfolioMWR6M && Number(snapshot.portfolioMWR6M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioMWR6M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.portfolioMWR1Y && Number(snapshot.portfolioMWR1Y) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.portfolioMWR1Y && Number(snapshot.portfolioMWR1Y) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioMWR1Y)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.portfolioMWRYTD && Number(snapshot.portfolioMWRYTD) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.portfolioMWRYTD && Number(snapshot.portfolioMWRYTD) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioMWRYTD)}
                    </Typography>
                  </TableCell>
                  {/* IRR Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.portfolioIRR1M && Number(snapshot.portfolioIRR1M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.portfolioIRR1M && Number(snapshot.portfolioIRR1M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioIRR1M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.portfolioIRR3M && Number(snapshot.portfolioIRR3M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.portfolioIRR3M && Number(snapshot.portfolioIRR3M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioIRR3M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.portfolioIRR6M && Number(snapshot.portfolioIRR6M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.portfolioIRR6M && Number(snapshot.portfolioIRR6M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioIRR6M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.portfolioIRR1Y && Number(snapshot.portfolioIRR1Y) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.portfolioIRR1Y && Number(snapshot.portfolioIRR1Y) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioIRR1Y)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.portfolioIRRYTD && Number(snapshot.portfolioIRRYTD) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.portfolioIRRYTD && Number(snapshot.portfolioIRRYTD) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioIRRYTD)}
                    </Typography>
                  </TableCell>
                  {/* Alpha Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.portfolioAlpha1M && Number(snapshot.portfolioAlpha1M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.portfolioAlpha1M && Number(snapshot.portfolioAlpha1M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioAlpha1M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.portfolioAlpha3M && Number(snapshot.portfolioAlpha3M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.portfolioAlpha3M && Number(snapshot.portfolioAlpha3M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioAlpha3M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.portfolioAlpha6M && Number(snapshot.portfolioAlpha6M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.portfolioAlpha6M && Number(snapshot.portfolioAlpha6M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioAlpha6M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.portfolioAlpha1Y && Number(snapshot.portfolioAlpha1Y) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.portfolioAlpha1Y && Number(snapshot.portfolioAlpha1Y) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioAlpha1Y)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.portfolioAlphaYTD && Number(snapshot.portfolioAlphaYTD) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.portfolioAlphaYTD && Number(snapshot.portfolioAlphaYTD) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.portfolioAlphaYTD)}
                    </Typography>
                  </TableCell>
                  {/* Beta Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {(parseFloat(snapshot.portfolioBeta1M) || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {(parseFloat(snapshot.portfolioBeta3M) || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {(parseFloat(snapshot.portfolioBeta6M) || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {(parseFloat(snapshot.portfolioBeta1Y) || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {(parseFloat(snapshot.portfolioBetaYTD) || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  {/* Information Ratio Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.portfolioInformationRatio1M && Number(snapshot.portfolioInformationRatio1M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {(parseFloat(snapshot.portfolioInformationRatio1M) || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.portfolioInformationRatio3M && Number(snapshot.portfolioInformationRatio3M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {(parseFloat(snapshot.portfolioInformationRatio3M) || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.portfolioInformationRatio1Y && Number(snapshot.portfolioInformationRatio1Y) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {(parseFloat(snapshot.portfolioInformationRatio1Y) || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  {/* Tracking Error Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {formatPercentage(snapshot.portfolioTrackingError1M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {formatPercentage(snapshot.portfolioTrackingError3M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {formatPercentage(snapshot.portfolioTrackingError1Y)}
                    </Typography>
                  </TableCell>
                  {/* Cash Flow Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {formatCurrency(snapshot.totalCashInflows || 0, baseCurrency)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {formatCurrency(snapshot.totalCashOutflows || 0, baseCurrency)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.netCashFlow && Number(snapshot.netCashFlow) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.netCashFlow && Number(snapshot.netCashFlow) >= 0 ? '+' : ''}
                      {formatCurrency(snapshot.netCashFlow || 0, baseCurrency)}
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
            No portfolio performance snapshots available
          </Typography>
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
