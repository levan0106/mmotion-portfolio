import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { PositionResponseDto } from '../../types/trading';

export interface PositionChartProps {
  positions: PositionResponseDto[];
  chartType?: 'pie' | 'bar' | 'line';
  dataType?: 'value' | 'weight' | 'pnl';
  height?: number;
}

/**
 * PositionChart component for visualizing position data.
 * Supports pie charts, bar charts, and line charts with different data types.
 */
export const PositionChart: React.FC<PositionChartProps> = ({
  positions,
  chartType = 'pie',
  dataType = 'value',
  height = 400,
}) => {
  const [selectedChartType, setSelectedChartType] = React.useState(chartType);
  const [selectedDataType, setSelectedDataType] = React.useState(dataType);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!positions || positions.length === 0) return [];

    switch (selectedDataType) {
      case 'value':
        return positions.map((position) => ({
          name: position.assetSymbol,
          value: position.marketValue,
          fullName: position.assetName,
          type: position.assetType,
        }));

      case 'weight':
        return positions.map((position) => ({
          name: position.assetSymbol,
          value: position.portfolioWeight,
          fullName: position.assetName,
          type: position.assetType,
        }));

      case 'pnl':
        return positions.map((position) => ({
          name: position.assetSymbol,
          value: position.unrealizedPl,
          fullName: position.assetName,
          type: position.assetType,
        }));

      default:
        return [];
    }
  }, [positions, selectedDataType]);

  // Color palette for charts
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
    '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0',
    '#FFB347', '#87CEEB', '#DDA0DD', '#F0E68C', '#98FB98',
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(num / 100);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            p: 2,
            borderRadius: 1,
            boxShadow: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            {data.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {data.fullName}
          </Typography>
          <Typography variant="body2">
            {selectedDataType === 'weight' 
              ? formatPercentage(data.value)
              : formatCurrency(data.value)
            }
          </Typography>
        </Box>
      );
    }
    return null;
  };

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          tickFormatter={selectedDataType === 'weight' ? formatPercentage : formatCurrency}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar 
          dataKey="value" 
          fill="#8884d8"
          name={selectedDataType === 'weight' ? 'Portfolio Weight' : 'Value'}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          tickFormatter={selectedDataType === 'weight' ? formatPercentage : formatCurrency}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke="#8884d8" 
          strokeWidth={2}
          name={selectedDataType === 'weight' ? 'Portfolio Weight' : 'Value'}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderChart = () => {
    switch (selectedChartType) {
      case 'pie':
        return renderPieChart();
      case 'bar':
        return renderBarChart();
      case 'line':
        return renderLineChart();
      default:
        return renderPieChart();
    }
  };

  const getChartTitle = () => {
    const typeMap = {
      value: 'Market Value',
      weight: 'Portfolio Weight',
      pnl: 'Unrealized P&L',
    };
    return `Position ${typeMap[selectedDataType]} Distribution`;
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" component="h3">
            {getChartTitle()}
          </Typography>
          <Box display="flex" gap={2}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Chart Type</InputLabel>
              <Select
                value={selectedChartType}
                label="Chart Type"
                onChange={(e) => setSelectedChartType(e.target.value as any)}
              >
                <MenuItem value="pie">Pie Chart</MenuItem>
                <MenuItem value="bar">Bar Chart</MenuItem>
                <MenuItem value="line">Line Chart</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Data Type</InputLabel>
              <Select
                value={selectedDataType}
                label="Data Type"
                onChange={(e) => setSelectedDataType(e.target.value as any)}
              >
                <MenuItem value="value">Market Value</MenuItem>
                <MenuItem value="weight">Portfolio Weight</MenuItem>
                <MenuItem value="pnl">Unrealized P&L</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {chartData.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height={height}
            color="text.secondary"
          >
            <Typography>No position data available</Typography>
          </Box>
        ) : (
          renderChart()
        )}

        {/* Summary Stats */}
        {chartData.length > 0 && (
          <Box mt={3}>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">
                  Total Positions
                </Typography>
                <Typography variant="h6">
                  {chartData.length}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">
                  Total Value
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(chartData.reduce((sum, item) => sum + (Number(item.value) || 0), 0))}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">
                  Largest Position
                </Typography>
                <Typography variant="h6">
                  {chartData.length > 0 
                    ? chartData.reduce((max, item) => (Number(item.value) || 0) > (Number(max.value) || 0) ? item : max).name
                    : 'N/A'
                  }
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default PositionChart;
