/**
 * Cash Flow Analysis component
 */

import React from 'react';
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import { Box, Typography, Paper, Grid, Card, CardContent } from '@mui/material';
import { formatCurrency, formatDateFns as formatDate } from '../../utils/format';
import { TrendingUp, TrendingDown, AccountBalance } from '@mui/icons-material';

interface CashFlowDataPoint {
  date: string;
  inflow: number;
  outflow: number;
  netFlow: number;
  cumulativeBalance: number;
}

interface CashFlowAnalysisProps {
  data: CashFlowDataPoint[];
  baseCurrency: string;
  title?: string;
}

const CashFlowAnalysis: React.FC<CashFlowAnalysisProps> = ({
  data,
  baseCurrency,
  title = 'Cash Flow Analysis',
}) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, boxShadow: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            {formatDate(label)}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography key={index} variant="body2" color={entry.color}>
              {entry.name}: {formatCurrency(entry.value, baseCurrency)}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  const formatXAxisLabel = (tickItem: string) => {
    const date = new Date(tickItem);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Calculate summary metrics
  const totalInflow = data.reduce((sum, item) => sum + item.inflow, 0);
  const totalOutflow = data.reduce((sum, item) => sum + item.outflow, 0);
  const netFlow = totalInflow - totalOutflow;
  const currentBalance = data.length > 0 ? data[data.length - 1].cumulativeBalance : 0;

  if (data.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No cash flow data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Portfolio cash flow analysis and balance tracking
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TrendingUp color="success" />
                <Typography variant="subtitle2" color="text.secondary">
                  Total Inflow
                </Typography>
              </Box>
              <Typography variant="h6" color="success.main" fontWeight="bold">
                {formatCurrency(totalInflow, baseCurrency)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TrendingDown color="error" />
                <Typography variant="subtitle2" color="text.secondary">
                  Total Outflow
                </Typography>
              </Box>
              <Typography variant="h6" color="error.main" fontWeight="bold">
                {formatCurrency(totalOutflow, baseCurrency)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <AccountBalance color={netFlow >= 0 ? "success" : "error"} />
                <Typography variant="subtitle2" color="text.secondary">
                  Net Flow
                </Typography>
              </Box>
              <Typography 
                variant="h6" 
                color={netFlow >= 0 ? "success.main" : "error.main"} 
                fontWeight="bold"
              >
                {formatCurrency(netFlow, baseCurrency)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <AccountBalance color="primary" />
                <Typography variant="subtitle2" color="text.secondary">
                  Current Balance
                </Typography>
              </Box>
              <Typography variant="h6" color="primary.main" fontWeight="bold">
                {formatCurrency(currentBalance, baseCurrency)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Cash Flow Chart */}
      <Box sx={{ height: 400, mb: 3 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxisLabel}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(value) => formatCurrency(value, baseCurrency, { compact: true })}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="inflow" fill="#4caf50" name="Inflow" />
            <Bar dataKey="outflow" fill="#f44336" name="Outflow" />
            <Line 
              type="monotone" 
              dataKey="netFlow" 
              stroke="#1976d2" 
              strokeWidth={3}
              name="Net Flow"
              dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>

      {/* Balance Timeline */}
      <Box sx={{ height: 300 }}>
        <Typography variant="h6" gutterBottom>
          Cumulative Balance
        </Typography>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxisLabel}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(value) => formatCurrency(value, baseCurrency, { compact: true })}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="cumulativeBalance"
              stroke="#1976d2"
              fill="#1976d2"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default CashFlowAnalysis;
