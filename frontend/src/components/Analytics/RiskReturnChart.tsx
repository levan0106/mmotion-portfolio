/**
 * Risk-Return Scatter Plot component
 */

import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Box, Typography, Paper } from '@mui/material';
import { formatCurrency, formatPercentage } from '../../utils/format';

interface RiskReturnDataPoint {
  assetType: string;
  return: number;
  risk: number;
  value: number;
  color: string;
}

interface RiskReturnChartProps {
  data: RiskReturnDataPoint[];
  baseCurrency: string;
  title?: string;
}

const RiskReturnChart: React.FC<RiskReturnChartProps> = ({
  data,
  baseCurrency,
  title = 'Risk-Return Analysis',
}) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper sx={{ p: 2, boxShadow: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            {data.assetType.toUpperCase()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Return: {formatPercentage(data.return)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Risk: {formatPercentage(data.risk)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Value: {formatCurrency(data.value, baseCurrency)}
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No risk-return data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Risk vs Return analysis of portfolio assets
      </Typography>
      <Box sx={{ height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="risk"
              name="Risk"
              tickFormatter={(value) => formatPercentage(value)}
              label={{ value: 'Risk (Volatility)', position: 'insideBottom', offset: -10 }}
            />
            <YAxis
              type="number"
              dataKey="return"
              name="Return"
              tickFormatter={(value) => formatPercentage(value)}
              label={{ value: 'Return', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={data} fill="#1976d2">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default RiskReturnChart;
