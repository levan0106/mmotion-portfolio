/**
 * Example usage of TimelineChart component
 * Demonstrates various use cases for different types of data
 */

import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import TimelineChart, { TimelineDataPoint } from './TimelineChart';

// Sample data for different use cases
const allocationData: TimelineDataPoint[] = [
  { date: '2024-01-01', STOCK: 40, BOND: 30, CASH: 20, GOLD: 10 },
  { date: '2024-02-01', STOCK: 45, BOND: 25, CASH: 15, GOLD: 15 },
  { date: '2024-03-01', STOCK: 50, BOND: 20, CASH: 10, GOLD: 20 },
  { date: '2024-04-01', STOCK: 55, BOND: 15, CASH: 15, GOLD: 15 },
  { date: '2024-05-01', STOCK: 60, BOND: 10, CASH: 20, GOLD: 10 },
];

const performanceData: TimelineDataPoint[] = [
  { date: '2024-01-01', Portfolio: 1000000, Benchmark: 1000000, RiskFree: 1000000 },
  { date: '2024-02-01', Portfolio: 1050000, Benchmark: 1020000, RiskFree: 1002000 },
  { date: '2024-03-01', Portfolio: 1100000, Benchmark: 1040000, RiskFree: 1004000 },
  { date: '2024-04-01', Portfolio: 1080000, Benchmark: 1060000, RiskFree: 1006000 },
  { date: '2024-05-01', Portfolio: 1150000, Benchmark: 1080000, RiskFree: 1008000 },
];

const revenueData: TimelineDataPoint[] = [
  { date: '2024-01-01', Q1: 50000, Q2: 0, Q3: 0, Q4: 0 },
  { date: '2024-02-01', Q1: 75000, Q2: 0, Q3: 0, Q4: 0 },
  { date: '2024-03-01', Q1: 100000, Q2: 0, Q3: 0, Q4: 0 },
  { date: '2024-04-01', Q1: 100000, Q2: 60000, Q3: 0, Q4: 0 },
  { date: '2024-05-01', Q1: 100000, Q2: 80000, Q3: 0, Q4: 0 },
];

const TimelineChartExample: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Timeline Chart Examples
      </Typography>
      
      <Grid container spacing={3}>
        {/* Portfolio Allocation */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Portfolio Allocation Over Time
            </Typography>
            <TimelineChart
              data={allocationData}
              title="Asset Allocation"
              subtitle="Portfolio composition changes over time"
              yAxisFormatter={(value: number) => `${value}%`}
              tooltipFormatter={(value: number) => `${value.toFixed(1)}%`}
              yAxisDomain={[0, 100]}
            />
          </Paper>
        </Grid>

        {/* Performance Comparison */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Performance Comparison
            </Typography>
            <TimelineChart
              data={performanceData}
              title="Portfolio vs Benchmark"
              subtitle="Value comparison over time"
              yAxisFormatter={(value: number) => `${(value / 1000).toFixed(0)}K`}
              tooltipFormatter={(value: number) => `${(value / 1000).toFixed(1)}K VND`}
              yAxisDomain={[900000, 1200000]}
              colors={['#1976d2', '#dc004e', '#4caf50']}
              height={250}
            />
          </Paper>
        </Grid>

        {/* Revenue by Quarter */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quarterly Revenue
            </Typography>
            <TimelineChart
              data={revenueData}
              title="Revenue by Quarter"
              subtitle="Quarterly revenue breakdown"
              defaultChartType="bar"
              defaultBarType="side-by-side"
              yAxisFormatter={(value: number) => `${(value / 1000).toFixed(0)}K`}
              tooltipFormatter={(value: number) => `${(value / 1000).toFixed(1)}K VND`}
              yAxisDomain={[0, 120000]}
              colors={['#ff9800', '#4caf50', '#2196f3', '#9c27b0']}
              height={250}
            />
          </Paper>
        </Grid>

        {/* Compact Mode */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Compact View
            </Typography>
            <TimelineChart
              data={allocationData}
              title="Compact Allocation"
              compact={true}
              height={200}
              showBarTypeToggle={false}
              defaultChartType="line"
            />
          </Paper>
        </Grid>

        {/* Custom Styling */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Custom Styling
            </Typography>
            <TimelineChart
              data={allocationData}
              title="Custom Colors"
              colors={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']}
              height={200}
              lineStrokeWidth={3}
              barOpacity={0.8}
              sx={{
                backgroundColor: '#f8f9fa',
                borderRadius: 2,
                p: 1,
              }}
            />
          </Paper>
        </Grid>

        {/* Combo Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Combined View (Bar + Line)
            </Typography>
            <TimelineChart
              data={performanceData}
              title="Portfolio Performance Analysis"
              subtitle="Combined bar and line visualization"
              defaultChartType="combo"
              defaultBarType="stacked"
              yAxisFormatter={(value: number) => `${(value / 1000).toFixed(0)}K`}
              tooltipFormatter={(value: number) => `${(value / 1000).toFixed(1)}K VND`}
              yAxisDomain={[900000, 1200000]}
              height={300}
            />
          </Paper>
        </Grid>

        {/* Minimal Configuration */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Minimal Configuration
            </Typography>
            <TimelineChart
              data={allocationData}
              title="Simple Timeline"
              showLegend={false}
              showGrid={false}
              height={150}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TimelineChartExample;
