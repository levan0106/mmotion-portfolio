// SnapshotDashboard Component for CR-006 Asset Snapshot System

import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
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
import { useSnapshotStatistics, useSnapshotAggregatedTimeline } from '../../hooks/useSnapshots';
import { usePortfolioSnapshots } from '../../hooks/usePortfolioSnapshots';
import { SnapshotGranularity } from '../../types/snapshot.types';
import { formatCurrency, formatPercentage, formatDate } from '../../utils/format';
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
    aggregatedData, 
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
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    granularity: selectedGranularity,
    autoFetch: true,
  });

  // Debug logging
  console.log('SnapshotDashboard Debug:', {
    portfolioId,
    portfolioSnapshots,
    portfolioSnapshotsLoading,
    portfolioSnapshotsError,
    portfolioSnapshotsLength: portfolioSnapshots?.length
  });



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
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={onSnapshotCreate}
              sx={{ textTransform: 'none' }}
            >
              Create Snapshot
            </Button>
            <Button
              variant="outlined"
              startIcon={<TimelineIcon />}
              onClick={onSnapshotManage}
              sx={{ textTransform: 'none' }}
            >
              Manage Snapshots
            </Button>
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

      {/* Timeline Data - Compact */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, border: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 'bold', fontSize: '1rem' }}>
          Recent Performance
        </Typography>
        {aggregatedData.length > 0 ? (
          <Box sx={{ overflow: 'auto', maxHeight: 200 }}>
            <Box sx={{ minWidth: 500 }}>
              <Box sx={{ display: 'flex', fontWeight: 'bold', p: 0.5, borderBottom: 1, borderColor: 'divider', fontSize: '0.75rem' }}>
                <Box sx={{ flex: 1, px: 0.5 }}>Date</Box>
                <Box sx={{ flex: 1, px: 0.5 }}>Value</Box>
                <Box sx={{ flex: 1, px: 0.5 }}>P&L</Box>
                <Box sx={{ flex: 1, px: 0.5 }}>Return</Box>
                <Box sx={{ flex: 1, px: 0.5 }}>Assets</Box>
              </Box>
              
              {aggregatedData.slice(0, 5).map((item, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    display: 'flex', 
                    p: 0.5, 
                    borderBottom: 1, 
                    borderColor: 'divider',
                    fontSize: '0.75rem',
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }
                  }}
                >
                  <Box sx={{ flex: 1, px: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}>
                      {formatDate(item.snapshotDate)}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, px: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}>
                      {formatCurrency(item.totalValue, baseCurrency)}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, px: 0.5 }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontWeight: 'bold',
                        fontSize: '0.7rem',
                        color: item.totalPl >= 0 ? 'success.main' : 'error.main'
                      }}
                    >
                      {formatCurrency(item.totalPl, baseCurrency)}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, px: 0.5 }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontWeight: 'bold',
                        fontSize: '0.7rem',
                        color: item.totalReturn >= 0 ? 'success.main' : 'error.main'
                      }}
                    >
                      {formatPercentage(item.totalReturn)}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, px: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}>
                      {item.assetCount}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
              No timeline data available for the selected period
            </Typography>
          </Box>
        )}
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
          <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 500 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>Portfolio</TableCell>
                  <TableCell sx={{ fontWeight: 500 }} align="right">Total Value</TableCell>
                  <TableCell sx={{ fontWeight: 500 }} align="right">Total P&L</TableCell>
                  <TableCell sx={{ fontWeight: 500 }} align="right">Unrealized P&L</TableCell>
                  <TableCell sx={{ fontWeight: 500 }} align="right">Realized P&L</TableCell>
                  <TableCell sx={{ fontWeight: 500 }} align="right">Cash Balance</TableCell>
                  <TableCell sx={{ fontWeight: 500 }} align="right">Daily Return</TableCell>
                  <TableCell sx={{ fontWeight: 500 }} align="right">Assets</TableCell>
                  <TableCell sx={{ fontWeight: 500 }} align="right">Granularity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {portfolioSnapshots.map((snapshot) => (
                  <TableRow key={snapshot.id} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(snapshot.snapshotDate).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {snapshot.portfolioName}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(Number(snapshot.totalValue || 0), baseCurrency)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        fontWeight={600}
                        color={snapshot.totalPl && Number(snapshot.totalPl) >= 0 ? 'success.main' : 'error.main'}
                      >
                        {snapshot.totalPl && Number(snapshot.totalPl) >= 0 ? '+' : ''}
                        {formatCurrency(Number(snapshot.totalPl || 0), baseCurrency)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        fontWeight={600}
                        color={snapshot.unrealizedPl && Number(snapshot.unrealizedPl) >= 0 ? 'success.main' : 'error.main'}
                      >
                        {snapshot.unrealizedPl && Number(snapshot.unrealizedPl) >= 0 ? '+' : ''}
                        {formatCurrency(Number(snapshot.unrealizedPl || 0), baseCurrency)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        fontWeight={600}
                        color={snapshot.realizedPl && Number(snapshot.realizedPl) >= 0 ? 'success.main' : 'error.main'}
                      >
                        {snapshot.realizedPl && Number(snapshot.realizedPl) >= 0 ? '+' : ''}
                        {formatCurrency(Number(snapshot.realizedPl || 0), baseCurrency)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(Number(snapshot.cashBalance || 0), baseCurrency)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        fontWeight={600}
                        color={snapshot.dailyReturn && Number(snapshot.dailyReturn) >= 0 ? 'success.main' : 'error.main'}
                      >
                        {snapshot.dailyReturn && Number(snapshot.dailyReturn) >= 0 ? '+' : ''}
                        {formatPercentage(Number(snapshot.dailyReturn || 0))}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {snapshot.assetCount || 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={snapshot.granularity} 
                        size="small" 
                        variant="outlined"
                        color="primary"
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
