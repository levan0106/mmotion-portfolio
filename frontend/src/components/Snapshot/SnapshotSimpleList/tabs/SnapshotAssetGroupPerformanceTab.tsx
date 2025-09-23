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

interface SnapshotAssetGroupPerformanceTabProps {
  assetGroupPerformanceData: any[];
  performanceLoading: boolean;
}

const SnapshotAssetGroupPerformanceTab: React.FC<SnapshotAssetGroupPerformanceTabProps> = ({
  assetGroupPerformanceData,
  performanceLoading,
}) => {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Asset Group Performance Snapshots
      </Typography>
      
      {performanceLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
      
      {assetGroupPerformanceData.length > 0 ? (
        <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 1500 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 100 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 120 }}>Asset Type</TableCell>
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
              {assetGroupPerformanceData
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
                      {snapshot.assetType || 'Unknown Type'}
                    </Typography>
                  </TableCell>
                  {/* TWR Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.groupTWR1D && Number(snapshot.groupTWR1D) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.groupTWR1D && Number(snapshot.groupTWR1D) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupTWR1D)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.groupTWR1W && Number(snapshot.groupTWR1W) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.groupTWR1W && Number(snapshot.groupTWR1W) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupTWR1W)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.groupTWR1M && Number(snapshot.groupTWR1M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.groupTWR1M && Number(snapshot.groupTWR1M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupTWR1M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.groupTWR3M && Number(snapshot.groupTWR3M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.groupTWR3M && Number(snapshot.groupTWR3M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupTWR3M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.groupTWR6M && Number(snapshot.groupTWR6M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.groupTWR6M && Number(snapshot.groupTWR6M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupTWR6M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.groupTWR1Y && Number(snapshot.groupTWR1Y) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.groupTWR1Y && Number(snapshot.groupTWR1Y) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupTWR1Y)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.groupTWRYTD && Number(snapshot.groupTWRYTD) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.groupTWRYTD && Number(snapshot.groupTWRYTD) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupTWRYTD)}
                    </Typography>
                  </TableCell>
                  {/* MWR Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.groupMWR1M && Number(snapshot.groupMWR1M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.groupMWR1M && Number(snapshot.groupMWR1M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupMWR1M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.groupMWR3M && Number(snapshot.groupMWR3M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.groupMWR3M && Number(snapshot.groupMWR3M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupMWR3M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.groupMWR6M && Number(snapshot.groupMWR6M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.groupMWR6M && Number(snapshot.groupMWR6M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupMWR6M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.groupMWR1Y && Number(snapshot.groupMWR1Y) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.groupMWR1Y && Number(snapshot.groupMWR1Y) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupMWR1Y)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.groupMWRYTD && Number(snapshot.groupMWRYTD) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.groupMWRYTD && Number(snapshot.groupMWRYTD) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupMWRYTD)}
                    </Typography>
                  </TableCell>
                  {/* IRR Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.groupIRR1M && Number(snapshot.groupIRR1M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.groupIRR1M && Number(snapshot.groupIRR1M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupIRR1M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.groupIRR3M && Number(snapshot.groupIRR3M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.groupIRR3M && Number(snapshot.groupIRR3M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupIRR3M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.groupIRR6M && Number(snapshot.groupIRR6M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.groupIRR6M && Number(snapshot.groupIRR6M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupIRR6M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.groupIRR1Y && Number(snapshot.groupIRR1Y) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.groupIRR1Y && Number(snapshot.groupIRR1Y) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupIRR1Y)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.groupIRRYTD && Number(snapshot.groupIRRYTD) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.groupIRRYTD && Number(snapshot.groupIRRYTD) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupIRRYTD)}
                    </Typography>
                  </TableCell>
                  {/* Alpha Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.groupAlpha1M && Number(snapshot.groupAlpha1M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.groupAlpha1M && Number(snapshot.groupAlpha1M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupAlpha1M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.groupAlpha3M && Number(snapshot.groupAlpha3M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.groupAlpha3M && Number(snapshot.groupAlpha3M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupAlpha3M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.groupAlpha6M && Number(snapshot.groupAlpha6M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.groupAlpha6M && Number(snapshot.groupAlpha6M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupAlpha6M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.groupAlpha1Y && Number(snapshot.groupAlpha1Y) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.groupAlpha1Y && Number(snapshot.groupAlpha1Y) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupAlpha1Y)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.groupAlphaYTD && Number(snapshot.groupAlphaYTD) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.groupAlphaYTD && Number(snapshot.groupAlphaYTD) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupAlphaYTD)}
                    </Typography>
                  </TableCell>
                  {/* Beta Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {(parseFloat(snapshot.groupBeta1M) || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {(parseFloat(snapshot.groupBeta3M) || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {(parseFloat(snapshot.groupBeta6M) || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {(parseFloat(snapshot.groupBeta1Y) || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {(parseFloat(snapshot.groupBetaYTD) || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  {/* Sharpe Ratio Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.groupSharpeRatio1M && Number(snapshot.groupSharpeRatio1M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {(parseFloat(snapshot.groupSharpeRatio1M) || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.groupSharpeRatio3M && Number(snapshot.groupSharpeRatio3M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {(parseFloat(snapshot.groupSharpeRatio3M) || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.groupSharpeRatio1Y && Number(snapshot.groupSharpeRatio1Y) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {(parseFloat(snapshot.groupSharpeRatio1Y) || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  {/* Volatility Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {formatPercentage(snapshot.groupVolatility1M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {formatPercentage(snapshot.groupVolatility3M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      {formatPercentage(snapshot.groupVolatility1Y)}
                    </Typography>
                  </TableCell>
                  {/* Max Drawdown Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color="error.main"
                    >
                      -{formatPercentage(snapshot.groupMaxDrawdown1M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color="error.main"
                    >
                      -{formatPercentage(snapshot.groupMaxDrawdown3M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color="error.main"
                    >
                      -{formatPercentage(snapshot.groupMaxDrawdown1Y)}
                    </Typography>
                  </TableCell>
                  {/* Risk-Adjusted Return Values */}
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.groupRiskAdjustedReturn1M && Number(snapshot.groupRiskAdjustedReturn1M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.groupRiskAdjustedReturn1M && Number(snapshot.groupRiskAdjustedReturn1M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupRiskAdjustedReturn1M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.groupRiskAdjustedReturn3M && Number(snapshot.groupRiskAdjustedReturn3M) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.groupRiskAdjustedReturn3M && Number(snapshot.groupRiskAdjustedReturn3M) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupRiskAdjustedReturn3M)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      color={snapshot.groupRiskAdjustedReturn1Y && Number(snapshot.groupRiskAdjustedReturn1Y) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {snapshot.groupRiskAdjustedReturn1Y && Number(snapshot.groupRiskAdjustedReturn1Y) >= 0 ? '+' : ''}
                      {formatPercentage(snapshot.groupRiskAdjustedReturn1Y)}
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
            No asset group performance snapshots available
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SnapshotAssetGroupPerformanceTab;
