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

interface SnapshotPortfolioPerformanceTabProps {
  portfolioPerformanceData: any[];
  performanceLoading: boolean;
  baseCurrency: string;
}

const SnapshotPortfolioPerformanceTab: React.FC<SnapshotPortfolioPerformanceTabProps> = ({
  portfolioPerformanceData,
  performanceLoading,
  baseCurrency,
}) => {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Portfolio Performance Snapshots
      </Typography>
      
      {performanceLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
      
      {portfolioPerformanceData.length > 0 ? (
        <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 2000 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 100 }}>Date</TableCell>
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
              {portfolioPerformanceData
                .sort((a, b) => new Date(b.snapshotDate).getTime() - new Date(a.snapshotDate).getTime())
                .map((snapshot) => (
                <TableRow key={snapshot.id} hover>
                  <TableCell sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {formatDate(snapshot.snapshotDate)}
                    </Typography>
                  </TableCell>
                  {/* TWR Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {formatPercentage(snapshot.portfolioTWR1D)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {formatPercentage(snapshot.portfolioTWR1W)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {formatPercentage(snapshot.portfolioTWR1M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {formatPercentage(snapshot.portfolioTWR3M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {formatPercentage(snapshot.portfolioTWR6M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {formatPercentage(snapshot.portfolioTWR1Y)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {formatPercentage(snapshot.portfolioTWRYTD)}
                    </Typography>
                  </TableCell>
                  {/* MWR Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {formatPercentage(snapshot.portfolioMWR1M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {formatPercentage(snapshot.portfolioMWR3M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {formatPercentage(snapshot.portfolioMWR6M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {formatPercentage(snapshot.portfolioMWR1Y)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {formatPercentage(snapshot.portfolioMWRYTD)}
                    </Typography>
                  </TableCell>
                  {/* IRR Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {formatPercentage(snapshot.portfolioIRR1M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {formatPercentage(snapshot.portfolioIRR3M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {formatPercentage(snapshot.portfolioIRR6M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {formatPercentage(snapshot.portfolioIRR1Y)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {formatPercentage(snapshot.portfolioIRRYTD)}
                    </Typography>
                  </TableCell>
                  {/* Alpha Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {formatPercentage(snapshot.portfolioAlpha1M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {formatPercentage(snapshot.portfolioAlpha3M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {formatPercentage(snapshot.portfolioAlpha6M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {formatPercentage(snapshot.portfolioAlpha1Y)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {formatPercentage(snapshot.portfolioAlphaYTD)}
                    </Typography>
                  </TableCell>
                  {/* Beta Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {(parseFloat(snapshot.portfolioBeta1M) || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {(parseFloat(snapshot.portfolioBeta3M) || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {(parseFloat(snapshot.portfolioBeta6M) || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {(parseFloat(snapshot.portfolioBeta1Y) || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {(parseFloat(snapshot.portfolioBetaYTD) || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  {/* Information Ratio Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {(parseFloat(snapshot.portfolioInformationRatio1M) || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {(parseFloat(snapshot.portfolioInformationRatio3M) || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {(parseFloat(snapshot.portfolioInformationRatio1Y) || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  {/* Tracking Error Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {formatPercentage(snapshot.portfolioTrackingError1M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {formatPercentage(snapshot.portfolioTrackingError3M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {formatPercentage(snapshot.portfolioTrackingError1Y)}
                    </Typography>
                  </TableCell>
                  {/* Cash Flow Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {formatCurrency(snapshot.totalCashInflows || 0, baseCurrency)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                      {formatCurrency(snapshot.totalCashOutflows || 0, baseCurrency)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
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
    </Box>
  );
};

export default SnapshotPortfolioPerformanceTab;
