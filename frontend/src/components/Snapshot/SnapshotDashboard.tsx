// SnapshotDashboard Component for CR-006 Asset Snapshot System

import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  LinearProgress,
  Alert,
  alpha,
  useTheme,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Refresh as RefreshIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { ResponsiveButton } from '../Common';
import { useSnapshotStatistics, useSnapshotAggregatedTimeline } from '../../hooks/useSnapshots';
import { usePortfolioSnapshots } from '../../hooks/usePortfolioSnapshots';
import { SnapshotGranularity } from '../../types/snapshot.types';
import { formatCurrency, formatPercentage } from '../../utils/format';
import { SnapshotChartsDashboard } from './SnapshotChartsDashboard';
import { SnapshotTimelineView } from './SnapshotTimelineView';
import { usePortfolios } from '../../hooks/usePortfolios';

interface SnapshotDashboardProps {
  portfolioId: string;
  onSnapshotCreate?: () => void;
  onSnapshotManage?: () => void;
}

export const SnapshotDashboard: React.FC<SnapshotDashboardProps> = ({
  portfolioId,
  onSnapshotCreate,
  onSnapshotManage,
}) => {
  const [selectedGranularity, setSelectedGranularity] = useState<SnapshotGranularity>(SnapshotGranularity.DAILY);
  const { portfolios } = usePortfolios();
  const baseCurrency = portfolios.find(p => p.portfolioId === portfolioId)?.baseCurrency || 'VND';
  const initialDateRange = useMemo(() => ({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0], // today
  }), []);
  
  const [dateRange, setDateRange] = useState(initialDateRange);

  const { statistics, loading: statsLoading, error: statsError } = useSnapshotStatistics(portfolioId);
  
  const { 
    loading: timelineLoading, 
    error: timelineError 
  } = useSnapshotAggregatedTimeline(
    portfolioId,
    dateRange.startDate,
    dateRange.endDate,
    selectedGranularity
  );

  // Portfolio Snapshots
  const { 
    portfolioSnapshots, 
    loading: portfolioSnapshotsLoading, 
    error: portfolioSnapshotsError 
  } = usePortfolioSnapshots({
    portfolioId,
    autoFetch: true,
  });

  // Debug logging
  const getGranularityIcon = (granularity: SnapshotGranularity) => {
    switch (granularity) {
      case SnapshotGranularity.DAILY:
        return '📅';
      case SnapshotGranularity.WEEKLY:
        return '📊';
      case SnapshotGranularity.MONTHLY:
        return '📈';
      default:
        return '📋';
    }
  };

  const theme = useTheme();

  if (statsLoading || timelineLoading || portfolioSnapshotsLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary" align="center">
          Loading snapshot dashboard...
        </Typography>
      </Box>
    );
  }

  if (statsError || timelineError || portfolioSnapshotsError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading dashboard: {statsError || timelineError || portfolioSnapshotsError}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
          border: 1,
          borderColor: alpha(theme.palette.primary.main, 0.1),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              }}
            >
              <AssessmentIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                Snapshot Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Portfolio performance overview and analytics
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <ResponsiveButton
              variant="contained"
              icon={<RefreshIcon />}
              mobileText="Create"
              desktopText="Create Snapshot"
              onClick={onSnapshotCreate}
              sx={{ textTransform: 'none' }}
            >
              Create Snapshot
            </ResponsiveButton>
            <ResponsiveButton
              variant="outlined"
              icon={<TimelineIcon />}
              mobileText="Manage"
              desktopText="Manage Snapshots"
              onClick={onSnapshotManage}
              sx={{ textTransform: 'none' }}
            >
              Manage Snapshots
            </ResponsiveButton>
          </Box>
        </Box>
      </Paper>

      {/* Statistics Cards - Compact Layout */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="caption" sx={{ fontSize: '0.75rem' }}>
                    Total
                  </Typography>
                  <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
                    {statistics?.totalSnapshots || 0}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 0.5,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                  }}
                >
                  <AssessmentIcon sx={{ fontSize: '1.2rem' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="caption" sx={{ fontSize: '0.75rem' }}>
                    Daily
                  </Typography>
                  <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
                    {statistics?.dailySnapshots || 0}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 0.5,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    color: theme.palette.info.main,
                  }}
                >
                  <CalendarIcon sx={{ fontSize: '1.2rem' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="caption" sx={{ fontSize: '0.75rem' }}>
                    Weekly
                  </Typography>
                  <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
                    {statistics?.weeklySnapshots || 0}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 0.5,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    color: theme.palette.success.main,
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: '1.2rem' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="caption" sx={{ fontSize: '0.75rem' }}>
                    Monthly
                  </Typography>
                  <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
                    {statistics?.monthlySnapshots || 0}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 0.5,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    color: theme.palette.warning.main,
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: '1.2rem' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Controls - Compact */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, border: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Granularity</InputLabel>
            <Select
              value={selectedGranularity}
              onChange={(e) => setSelectedGranularity(e.target.value as SnapshotGranularity)}
              label="Granularity"
            >
              <MenuItem value={SnapshotGranularity.DAILY}>Daily</MenuItem>
              <MenuItem value={SnapshotGranularity.WEEKLY}>Weekly</MenuItem>
              <MenuItem value={SnapshotGranularity.MONTHLY}>Monthly</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            type="date"
            label="Start Date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 140 }}
          />

          <TextField
            size="small"
            type="date"
            label="End Date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 140 }}
          />

          <Chip
            label={`${getGranularityIcon(selectedGranularity)} ${selectedGranularity}`}
            color="primary"
            variant="outlined"
            size="small"
            sx={{ fontSize: '0.75rem' }}
          />
        </Box>
      </Paper>

      {/* Portfolio Snapshots Grid */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', fontSize: '1rem' }}>
          Portfolio Snapshots
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
            <Table size="small" sx={{ minWidth: 4500 }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem', py: 0.5, minWidth: 80 }}>Date</TableCell>
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
                {(portfolioSnapshots as any[]).map((snapshot: any) => (
                  <TableRow key={snapshot.id} hover>
                    {/* Date */}
                    <TableCell sx={{ py: 0.5 }}>
                      <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                        {new Date(snapshot.snapshotDate).toLocaleDateString()}
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
      </Paper>

      {/* Charts Dashboard */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, border: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', fontSize: '1rem' }}>
          Performance Charts
        </Typography>
        <SnapshotChartsDashboard
          portfolioId={portfolioId}
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          granularity={selectedGranularity}
        />
      </Paper>

      {/* Timeline View */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 'bold', fontSize: '1rem' }}>
          Timeline View
        </Typography>
        <SnapshotTimelineView
          portfolioId={portfolioId}
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          granularity={selectedGranularity}
          showDetails={true}
          showFilters={true}
          maxItems={50}
        />
      </Paper>
    </Box>
  );
};
