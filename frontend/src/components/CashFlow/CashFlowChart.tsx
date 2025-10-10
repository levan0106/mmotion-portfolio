import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { useAccount } from '../../contexts/AccountContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  Grid,
  Divider,
  Skeleton,
  Alert,
  IconButton,
  Tooltip as MuiTooltip,
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
  ReferenceLine,
} from 'recharts';
import { formatCurrency } from '../../utils/format';

// Add CSS for animations
const styles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
import {
  TrendingUp,
  AccountBalance,
  Timeline,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Refresh,
} from '@mui/icons-material';

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
  const { accountId } = useAccount();
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie'>('line');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('1y');
  const [lineData, setLineData] = useState<CashFlowData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const COLORS = {
    deposits: '#4caf50',
    withdrawals: '#f44336', 
    dividends: '#2196f3',
    interest: '#ff9800',
    netFlow: '#9c27b0',
    cumulative: '#ff5722',
    grid: '#e0e0e0',
    text: '#424242',
  };

  useEffect(() => {
    loadData();
  }, [portfolioId, timeRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load all data for chart (no pagination needed for chart)
      const responseData = await apiService.getPortfolioCashFlowHistory(portfolioId, accountId, { limit: 1000 });
      // Extract the actual data array from the new pagination format
      const data = responseData.data || [];
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
      new Date(cf.flowDate) >= startDate && (cf.status === 'COMPLETED' || !cf.status)
    );
    // Group by date
    const groupedData = filteredData.reduce((acc, cf) => {
      const date = cf.flowDate.split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, deposits: 0, withdrawals: 0, dividends: 0, netFlow: 0 };
      }
      
      const amount = parseFloat(cf.amount);
      if (cf.type === 'DEPOSIT' || cf.type === 'SELL_TRADE' || cf.type === 'DEPOSIT_SETTLEMENT') acc[date].deposits += Math.abs(amount);
      else if (cf.type === 'WITHDRAWAL' || cf.type === 'BUY_TRADE' || cf.type === 'DEPOSIT_CREATION') acc[date].withdrawals += Math.abs(amount);
      else if (cf.type === 'DIVIDEND') acc[date].dividends += amount;
      
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
    setLineData(result);
  };

  const processMonthlyData = (data: any[]) => {
    const monthsAgo = timeRange === '7d' ? 1 : timeRange === '30d' ? 3 : timeRange === '90d' ? 6 : 12;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsAgo);

    const filteredData = data.filter(cf => 
      new Date(cf.flowDate) >= startDate && (cf.status === 'COMPLETED' || !cf.status)
    );

    // Group by month
    const groupedData = filteredData.reduce((acc, cf) => {
      const date = new Date(cf.flowDate);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[month]) {
        acc[month] = { month, deposits: 0, withdrawals: 0, dividends: 0, netFlow: 0 };
      }
      
      const amount = parseFloat(cf.amount);
      if (cf.type === 'DEPOSIT' || cf.type === 'SELL_TRADE' || cf.type === 'DEPOSIT_SETTLEMENT') acc[month].deposits += Math.abs(amount);
      else if (cf.type === 'WITHDRAWAL' || cf.type === 'BUY_TRADE' || cf.type === 'DEPOSIT_CREATION') acc[month].withdrawals += Math.abs(amount);
      else if (cf.type === 'DIVIDEND') acc[month].dividends += amount;
      
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
      new Date(cf.flowDate) >= startDate && (cf.status === 'COMPLETED' || !cf.status)
    );

    const totals = filteredData.reduce((acc, cf) => {
      const amount = parseFloat(cf.amount);
      if (cf.type === 'DEPOSIT' || cf.type === 'SELL_TRADE' || cf.type === 'DEPOSIT_SETTLEMENT') acc.deposits += Math.abs(amount);
      else if (cf.type === 'WITHDRAWAL' || cf.type === 'BUY_TRADE' || cf.type === 'DEPOSIT_CREATION') acc.withdrawals += Math.abs(amount);
      else if (cf.type === 'DIVIDEND') acc.dividends += amount;
      else if (cf.type === 'INTEREST') acc.interest += amount;
      return acc;
    }, { deposits: 0, withdrawals: 0, dividends: 0, interest: 0 });

    const result = [
      { name: 'Deposits', value: totals.deposits, color: COLORS.deposits },
      { name: 'Withdrawals', value: totals.withdrawals, color: COLORS.withdrawals },
      { name: 'Dividends', value: totals.dividends, color: COLORS.dividends },
      { name: 'Interest', value: totals.interest, color: COLORS.interest },
    ].filter(item => item.value > 0);

    setPieData(result);
  };

  const renderChart = () => {
    if (loading) {
      return (
        <Box sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <Refresh sx={{ mr: 1, animation: 'spin 1s linear infinite' }} />
            <Typography variant="h6">Loading Chart Data</Typography>
          </Box>
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              Fetching cash flow data for portfolio {portfolioId}
            </Typography>
          </Box>
        </Box>
      );
    }

    if (lineData.length === 0 && monthlyData.length === 0 && pieData.length === 0) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Alert 
            severity="info" 
            icon={<Timeline />}
            sx={{ 
              mb: 2,
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
          >
            <Typography variant="h6" gutterBottom>
              No Cash Flow Data Available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No cash flow data found for the selected time range. Try selecting a longer time period.
            </Typography>
          </Alert>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary">
              Debug Info: Line data: {lineData.length}, Monthly data: {monthlyData.length}, Pie data: {pieData.length}
            </Typography>
          </Paper>
        </Box>
      );
    }

    switch (chartType) {
      case 'line':
        return (
          <Box>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart 
                data={lineData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="depositsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.deposits} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.deposits} stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="withdrawalsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.withdrawals} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.withdrawals} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={COLORS.grid}
                  opacity={0.3}
                />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fill: COLORS.text }}
                  axisLine={{ stroke: COLORS.grid }}
                  tickLine={{ stroke: COLORS.grid }}
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value)} 
                  tick={{ fontSize: 12, fill: COLORS.text }}
                  axisLine={{ stroke: COLORS.grid }}
                  tickLine={{ stroke: COLORS.grid }}
                />
                <Tooltip 
                  formatter={(value: any, name: any) => [formatCurrency(Number(value)), name]}
                  labelStyle={{ color: COLORS.text }}
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: `1px solid ${COLORS.grid}`,
                    borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: 20 }}
                />
                <ReferenceLine y={0} stroke={COLORS.grid} strokeDasharray="2 2" />
                <Line 
                  type="monotone" 
                  dataKey="deposits" 
                  stroke={COLORS.deposits} 
                  strokeWidth={3}
                  dot={{ fill: COLORS.deposits, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: COLORS.deposits, strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="withdrawals" 
                  stroke={COLORS.withdrawals} 
                  strokeWidth={3}
                  dot={{ fill: COLORS.withdrawals, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: COLORS.withdrawals, strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="dividends" 
                  stroke={COLORS.dividends} 
                  strokeWidth={3}
                  dot={{ fill: COLORS.dividends, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: COLORS.dividends, strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="netFlow" 
                  stroke={COLORS.netFlow} 
                  strokeWidth={4}
                  dot={{ fill: COLORS.netFlow, strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, stroke: COLORS.netFlow, strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="cumulative" 
                  stroke={COLORS.cumulative} 
                  strokeWidth={3} 
                  strokeDasharray="8 4"
                  dot={{ fill: COLORS.cumulative, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: COLORS.cumulative, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        );

      case 'bar':
        return (
          <Box>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="depositsBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.deposits} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.deposits} stopOpacity={0.4}/>
                  </linearGradient>
                  <linearGradient id="withdrawalsBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.withdrawals} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.withdrawals} stopOpacity={0.4}/>
                  </linearGradient>
                  <linearGradient id="dividendsBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.dividends} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.dividends} stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={COLORS.grid}
                  opacity={0.3}
                />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12, fill: COLORS.text }}
                  axisLine={{ stroke: COLORS.grid }}
                  tickLine={{ stroke: COLORS.grid }}
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value)} 
                  tick={{ fontSize: 12, fill: COLORS.text }}
                  axisLine={{ stroke: COLORS.grid }}
                  tickLine={{ stroke: COLORS.grid }}
                />
                <Tooltip 
                  formatter={(value: any, name: any) => [formatCurrency(Number(value)), name]}
                  labelStyle={{ color: COLORS.text }}
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: `1px solid ${COLORS.grid}`,
                    borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: 20 }}
                />
                <ReferenceLine y={0} stroke={COLORS.grid} strokeDasharray="2 2" />
                <Bar 
                  dataKey="deposits" 
                  fill="url(#depositsBar)" 
                  radius={[4, 4, 0, 0]}
                  stroke={COLORS.deposits}
                  strokeWidth={1}
                />
                <Bar 
                  dataKey="withdrawals" 
                  fill="url(#withdrawalsBar)" 
                  radius={[4, 4, 0, 0]}
                  stroke={COLORS.withdrawals}
                  strokeWidth={1}
                />
                <Bar 
                  dataKey="dividends" 
                  fill="url(#dividendsBar)" 
                  radius={[4, 4, 0, 0]}
                  stroke={COLORS.dividends}
                  strokeWidth={1}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        );

      case 'pie':
        return (
          <Box>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => 
                    `${name}: ${(percent * 100).toFixed(1)}%`
                  }
                  outerRadius={100}
                  innerRadius={40}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      stroke={entry.color}
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any, name: any) => [formatCurrency(Number(value)), name]}
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: `1px solid ${COLORS.grid}`,
                    borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  wrapperStyle={{ paddingTop: 20 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Card 
      sx={{ 
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h5" fontWeight="600" color="text.primary" gutterBottom>
              Cash Flow Analytics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track your portfolio's cash movements and trends
            </Typography>
          </Box>
          
          {/* Controls */}
          <Box display="flex" gap={2} alignItems="center">
            <MuiTooltip title="Refresh Data">
              <IconButton 
                onClick={loadData} 
                disabled={loading}
                sx={{ 
                  bgcolor: 'primary.50',
                  '&:hover': { bgcolor: 'primary.100' }
                }}
              >
                <Refresh />
              </IconButton>
            </MuiTooltip>
            
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Chart Type</InputLabel>
              <Select
                value={chartType}
                label="Chart Type"
                onChange={(e) => setChartType(e.target.value as any)}
              >
                <MenuItem value="line">
                  <Box display="flex" alignItems="center">
                    <Timeline sx={{ mr: 1, fontSize: 20 }} />
                    Line Chart
                  </Box>
                </MenuItem>
                <MenuItem value="bar">
                  <Box display="flex" alignItems="center">
                    <BarChartIcon sx={{ mr: 1, fontSize: 20 }} />
                    Bar Chart
                  </Box>
                </MenuItem>
                <MenuItem value="pie">
                  <Box display="flex" alignItems="center">
                    <PieChartIcon sx={{ mr: 1, fontSize: 20 }} />
                    Pie Chart
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 140 }}>
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

        <Divider sx={{ mb: 3 }} />

        {/* Chart */}
        {renderChart()}

        {/* Data Summary */}
        {lineData.length > 0 && (
          <Box mt={2}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Chip 
                  icon={<TrendingUp />}
                  label={`${lineData.length} data points`}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Chip 
                  icon={<AccountBalance />}
                  label={`${timeRange.toUpperCase()} view`}
                  color="secondary"
                  variant="outlined"
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default CashFlowChart;
