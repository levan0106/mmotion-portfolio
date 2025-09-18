import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatCurrency } from '../../utils/format';

interface CashFlowChartProps {
  portfolioId: string;
}

interface CashFlowData {
  date: string;
  deposits: number;
  withdrawals: number;
  dividends: number;
  netFlow: number;
  cumulative: number;
}

interface MonthlyData {
  month: string;
  deposits: number;
  withdrawals: number;
  dividends: number;
  netFlow: number;
}

const CashFlowChart: React.FC<CashFlowChartProps> = ({ portfolioId }) => {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie'>('line');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [lineData, setLineData] = useState<CashFlowData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const COLORS = ['#4caf50', '#f44336', '#2196f3', '#ff9800'];

  useEffect(() => {
    loadData();
  }, [portfolioId, timeRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading cash flow data for portfolio:', portfolioId);
      
      const response = await fetch(`/api/v1/portfolios/${portfolioId}/cash-flow/history`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Raw API response:', data);

      // Process data for different chart types
      processLineData(data);
      processMonthlyData(data);
      processPieData(data);
    } catch (error) {
      console.error('Error loading cash flow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processLineData = (data: any[]) => {
    const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const filteredData = data.filter(cf => 
      new Date(cf.flowDate) >= startDate && cf.status === 'COMPLETED'
    );

    console.log(`Filtered ${filteredData.length} records for line chart`);

    // Group by date
    const groupedData = filteredData.reduce((acc, cf) => {
      const date = cf.flowDate.split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, deposits: 0, withdrawals: 0, dividends: 0, netFlow: 0 };
      }
      
      if (cf.type === 'DEPOSIT' || cf.type === 'SELL_TRADE') acc[date].deposits += Math.abs(cf.amount);
      else if (cf.type === 'WITHDRAWAL' || cf.type === 'BUY_TRADE') acc[date].withdrawals += Math.abs(cf.amount);
      else if (cf.type === 'DIVIDEND') acc[date].dividends += cf.amount;
      
      acc[date].netFlow = acc[date].deposits + acc[date].dividends - acc[date].withdrawals;
      
      return acc;
    }, {});

    // Calculate cumulative values
    let cumulative = 0;
    const result = Object.values(groupedData)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((item: any) => {
        cumulative += item.netFlow;
        return { ...item, cumulative };
      });

    console.log('Processed line data:', result);
    setLineData(result);
  };

  const processMonthlyData = (data: any[]) => {
    const monthsAgo = timeRange === '7d' ? 1 : timeRange === '30d' ? 3 : timeRange === '90d' ? 6 : 12;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsAgo);

    const filteredData = data.filter(cf => 
      new Date(cf.flowDate) >= startDate && cf.status === 'COMPLETED'
    );

    // Group by month
    const groupedData = filteredData.reduce((acc, cf) => {
      const date = new Date(cf.flowDate);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[month]) {
        acc[month] = { month, deposits: 0, withdrawals: 0, dividends: 0, netFlow: 0 };
      }
      
      if (cf.type === 'DEPOSIT' || cf.type === 'SELL_TRADE') acc[month].deposits += Math.abs(cf.amount);
      else if (cf.type === 'WITHDRAWAL' || cf.type === 'BUY_TRADE') acc[month].withdrawals += Math.abs(cf.amount);
      else if (cf.type === 'DIVIDEND') acc[month].dividends += cf.amount;
      
      acc[month].netFlow = acc[month].deposits + acc[month].dividends - acc[month].withdrawals;
      
      return acc;
    }, {});

    const result = Object.values(groupedData)
      .sort((a: any, b: any) => a.month.localeCompare(b.month)) as MonthlyData[];

    setMonthlyData(result);
  };

  const processPieData = (data: any[]) => {
    const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const filteredData = data.filter(cf => 
      new Date(cf.flowDate) >= startDate && cf.status === 'COMPLETED'
    );

    const totals = filteredData.reduce((acc, cf) => {
      if (cf.type === 'DEPOSIT' || cf.type === 'SELL_TRADE') acc.deposits += Math.abs(cf.amount);
      else if (cf.type === 'WITHDRAWAL' || cf.type === 'BUY_TRADE') acc.withdrawals += Math.abs(cf.amount);
      else if (cf.type === 'DIVIDEND') acc.dividends += cf.amount;
      else if (cf.type === 'INTEREST') acc.interest += cf.amount;
      return acc;
    }, { deposits: 0, withdrawals: 0, dividends: 0, interest: 0 });

    const result = [
      { name: 'Deposits', value: totals.deposits, color: COLORS[0] },
      { name: 'Withdrawals', value: totals.withdrawals, color: COLORS[1] },
      { name: 'Dividends', value: totals.dividends, color: COLORS[2] },
      { name: 'Interest', value: totals.interest, color: COLORS[3] },
    ].filter(item => item.value > 0);

    setPieData(result);
  };

  const renderChart = () => {
    if (loading) {
      return (
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height={400}>
          <Typography variant="h6" gutterBottom>Loading chart data...</Typography>
          <Typography variant="body2" color="text.secondary">
            Fetching cash flow data for portfolio {portfolioId}
          </Typography>
        </Box>
      );
    }

    if (lineData.length === 0 && monthlyData.length === 0 && pieData.length === 0) {
      return (
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height={400}>
          <Typography variant="h6" gutterBottom>No Data Available</Typography>
          <Typography variant="body2" color="text.secondary">
            No cash flow data found for the selected time range
          </Typography>
        </Box>
      );
    }

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
              <Legend />
              <Line type="monotone" dataKey="deposits" stroke={COLORS[0]} strokeWidth={2} />
              <Line type="monotone" dataKey="withdrawals" stroke={COLORS[1]} strokeWidth={2} />
              <Line type="monotone" dataKey="dividends" stroke={COLORS[2]} strokeWidth={2} />
              <Line type="monotone" dataKey="netFlow" stroke="#9c27b0" strokeWidth={3} />
              <Line type="monotone" dataKey="cumulative" stroke="#ff5722" strokeWidth={2} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
              <Legend />
              <Bar dataKey="deposits" fill={COLORS[0]} />
              <Bar dataKey="withdrawals" fill={COLORS[1]} />
              <Bar dataKey="dividends" fill={COLORS[2]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Cash Flow Analytics</Typography>
          <Box display="flex" gap={2}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Chart Type</InputLabel>
              <Select
                value={chartType}
                label="Chart Type"
                onChange={(e) => setChartType(e.target.value as any)}
              >
                <MenuItem value="line">Line Chart</MenuItem>
                <MenuItem value="bar">Bar Chart</MenuItem>
                <MenuItem value="pie">Pie Chart</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                label="Time Range"
                onChange={(e) => setTimeRange(e.target.value as any)}
              >
                <MenuItem value="7d">Last 7 days</MenuItem>
                <MenuItem value="30d">Last 30 days</MenuItem>
                <MenuItem value="90d">Last 90 days</MenuItem>
                <MenuItem value="1y">Last year</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {renderChart()}

        {chartType === 'line' && (
          <Box mt={2}>
            <Typography variant="body2" color="textSecondary">
              <strong>Purple line:</strong> Net cash flow per day | <strong>Orange dashed:</strong> Cumulative cash flow
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default CashFlowChart;
