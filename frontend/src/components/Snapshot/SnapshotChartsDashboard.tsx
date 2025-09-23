// SnapshotChartsDashboard Component for CR-006 Asset Snapshot System

import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  Stack,
  CircularProgress,
  Alert,
} from '@mui/material';
import { SnapshotChart } from './SnapshotChart';
import { SnapshotPlChart } from './SnapshotPlChart';
import { SnapshotAllocationChart } from './SnapshotAllocationChart';
import { SnapshotPerformanceChart } from './SnapshotPerformanceChart';
import { useSnapshotAggregatedTimeline, useSnapshotTimeline } from '../../hooks/useSnapshots';
import { SnapshotGranularity } from '../../types/snapshot.types';

interface SnapshotChartsDashboardProps {
  portfolioId: string;
  startDate: string;
  endDate: string;
  granularity?: SnapshotGranularity;
}

export const SnapshotChartsDashboard: React.FC<SnapshotChartsDashboardProps> = ({
  portfolioId,
  startDate,
  endDate,
  granularity = SnapshotGranularity.DAILY,
}) => {
  const [selectedChart, setSelectedChart] = useState<string>('all');
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar' | 'pie' | 'composed'>('line');

  // Get aggregated timeline data for performance charts
  const {
    aggregatedData,
    loading: aggregatedLoading,
    error: aggregatedError,
  } = useSnapshotAggregatedTimeline(portfolioId, startDate, endDate, granularity);

  // Memoize timeline query to prevent unnecessary re-renders
  const timelineQuery = useMemo(() => ({
    portfolioId,
    startDate,
    endDate,
    granularity,
  }), [portfolioId, startDate, endDate, granularity]);

  // Get detailed timeline data for P&L charts
  const {
    timelineData,
    loading: timelineLoading,
    error: timelineError,
  } = useSnapshotTimeline(timelineQuery);

  const handleChartTypeChange = (type: 'line' | 'area' | 'bar' | 'pie' | 'composed') => {
    setChartType(type);
  };

  const handleChartSelect = (chart: string) => {
    setSelectedChart(chart);
  };

  if (aggregatedLoading || timelineLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Loading charts...
        </Typography>
      </Box>
    );
  }

  if (aggregatedError || timelineError) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Error loading charts: {aggregatedError || timelineError}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, border: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Portfolio Performance Charts
          </Typography>
          
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Chart Type</InputLabel>
              <Select
                value={chartType}
                onChange={(e) => handleChartTypeChange(e.target.value as any)}
                label="Chart Type"
              >
                <MenuItem value="line">Line Chart</MenuItem>
                <MenuItem value="area">Area Chart</MenuItem>
                <MenuItem value="bar">Bar Chart</MenuItem>
                <MenuItem value="pie">Pie Chart</MenuItem>
                <MenuItem value="composed">Composed Chart</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Show Charts</InputLabel>
              <Select
                value={selectedChart}
                onChange={(e) => handleChartSelect(e.target.value)}
                label="Show Charts"
              >
                <MenuItem value="all">All Charts</MenuItem>
                <MenuItem value="performance">Performance Only</MenuItem>
                <MenuItem value="pl">P&L Only</MenuItem>
                <MenuItem value="allocation">Allocation Only</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>
      </Paper>

      {/* Charts Grid */}
      <Grid container spacing={1} sx={{ mb: 1 }}>
        {/* Performance Chart */}
        {(selectedChart === 'all' || selectedChart === 'performance') && (
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ height: '100%', border: 1, borderColor: 'divider' }}>
              <CardContent sx={{ p: 1.5 }}>
                <SnapshotPerformanceChart
                  data={aggregatedData}
                  type={chartType === 'pie' ? 'line' : (chartType === 'bar' ? 'line' : chartType)}
                  height={200}
                  showLegend={true}
                  showGrid={true}
                  showReferenceLine={true}
                  showCumulativeReturn={true}
                  showDailyReturn={true}
                  showTotalValue={true}
                  showReturnPercentage={true}
                />
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* P&L Chart */}
        {(selectedChart === 'all' || selectedChart === 'pl') && (
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ height: '100%', border: 1, borderColor: 'divider' }}>
              <CardContent sx={{ p: 1.5 }}>
                <SnapshotPlChart
                  data={timelineData}
                  type={chartType === 'pie' ? 'line' : (chartType === 'bar' ? 'line' : chartType)}
                  height={200}
                  showLegend={true}
                  showGrid={true}
                  showRealizedPl={true}
                  showUnrealizedPl={true}
                  showTotalPl={true}
                />
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Allocation Chart */}
        {(selectedChart === 'all' || selectedChart === 'allocation') && (
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ height: '100%', border: 1, borderColor: 'divider' }}>
              <CardContent sx={{ p: 1.5 }}>
                <SnapshotAllocationChart
                  data={timelineData}
                  type={chartType === 'area' ? 'line' : (chartType === 'composed' ? 'line' : chartType)}
                  height={200}
                  showLegend={true}
                  showTooltip={true}
                  groupBy="asset"
                  maxItems={10}
                />
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Additional Charts - Only show when "All Charts" is selected */}
        {selectedChart === 'all' && (
          <>
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ height: '100%', border: 1, borderColor: 'divider' }}>
                <CardContent sx={{ p: 1.5 }}>
                  <SnapshotChart
                    data={aggregatedData}
                    type="area"
                    title="Portfolio Value Over Time"
                    height={200}
                    dataKey="totalValue"
                    xAxisKey="snapshotDate"
                    yAxisKey="totalValue"
                    colors={['#007bff']}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ height: '100%', border: 1, borderColor: 'divider' }}>
                <CardContent sx={{ p: 1.5 }}>
                  <SnapshotChart
                    data={aggregatedData}
                    type="bar"
                    title="Daily Returns"
                    height={200}
                    dataKey="totalReturn"
                    xAxisKey="snapshotDate"
                    yAxisKey="totalReturn"
                    colors={['#28a745', '#dc3545']}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ height: '100%', border: 1, borderColor: 'divider' }}>
                <CardContent sx={{ p: 1.5 }}>
                  <SnapshotAllocationChart
                    data={timelineData}
                    type="pie"
                    height={200}
                    groupBy="asset"
                    maxItems={8}
                    showLegend={true}
                    showTooltip={true}
                  />
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>

      {/* Summary Statistics */}
      <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600 }}>
          Portfolio Summary
        </Typography>
        
        <Grid container spacing={1}>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
              <Typography variant="h4" color="primary" sx={{ mb: 0.5, fontSize: '1.5rem' }}>
                📊
              </Typography>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.75rem' }}>
                Total Snapshots
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                {timelineData.length}
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
              <Typography variant="h4" color="primary" sx={{ mb: 0.5, fontSize: '1.5rem' }}>
                📅
              </Typography>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.75rem' }}>
                Date Range
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
              <Typography variant="h4" color="primary" sx={{ mb: 0.5, fontSize: '1.5rem' }}>
                📈
              </Typography>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.75rem' }}>
                Granularity
              </Typography>
              <Chip label={granularity} size="small" color="primary" variant="outlined" sx={{ fontSize: '0.7rem' }} />
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
              <Typography variant="h4" color="primary" sx={{ mb: 0.5, fontSize: '1.5rem' }}>
                💰
              </Typography>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.75rem' }}>
                Latest Value
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                {aggregatedData.length > 0 
                  ? new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(aggregatedData[aggregatedData.length - 1].totalAssetValue)
                  : 'N/A'
                }
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};
