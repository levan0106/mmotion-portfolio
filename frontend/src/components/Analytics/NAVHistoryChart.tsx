import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Chip,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  InfoOutlined,
  AccountBalance
} from '@mui/icons-material';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Legend,
  Bar
} from 'recharts';
import { formatCurrency, formatPercentage } from '../../utils/format';
import { apiService } from '../../services/api';
import { useAccount } from '../../contexts/AccountContext';
import ResponsiveTypography from '../Common/ResponsiveTypography';
import { ResponsiveFormSelect } from '../Common/ResponsiveFormControl';

interface NAVHistoryData {
  date: string;
  navValue: number;
  totalValue: number;
  cashBalance: number;
  assetValue: number;
  totalReturn: number;
  portfolioPnL: number;
  portfolioDailyReturn: number;
  portfolioWeeklyReturn: number;
  portfolioMonthlyReturn: number;
  portfolioYtdReturn: number;
}

interface NAVHistoryResponse {
  portfolioId: string;
  period: {
    startDate: string;
    endDate: string;
  };
  granularity: string;
  data: NAVHistoryData[];
  totalRecords: number;
  retrievedAt: string;
}

interface NAVHistoryChartProps {
  portfolioId: string;
  baseCurrency: string;
  compact?: boolean;
  getUltraSpacing?: (normal: number, compact: number) => number;
}

const NAVHistoryChart: React.FC<NAVHistoryChartProps> = ({
  portfolioId,
  baseCurrency,
  compact = false,
  getUltraSpacing = (normal) => normal
}) => {
  const { accountId } = useAccount();
  const [data, setData] = useState<NAVHistoryData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('12');
  const [granularity, setGranularity] = useState('DAILY');
  const [showReturn, setShowReturn] = useState(false);

  const timeframeOptions = [
    { value: '3', label: '3M' },
    { value: '6', label: '6M' },
    { value: '12', label: '12M' },
    { value: '24', label: '24M' },
    { value: '36', label: '36M' }
  ];

  const granularityOptions = [
    { value: 'DAILY', label: 'Daily' },
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'MONTHLY', label: 'Monthly' }
  ];

  const fetchNAVHistory = async () => {
    if (!portfolioId || !accountId) return;

    setLoading(true);
    setError(null);

    try {
      const result: NAVHistoryResponse = await apiService.getPortfolioNAVHistory(portfolioId, accountId, { months: parseInt(timeframe), granularity });
      setData(result.data || []);
    } catch (err) {
      console.error('Error fetching NAV history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load NAV history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNAVHistory();
  }, [portfolioId, accountId, timeframe, granularity]);

  const handleTimeframeChange = (event: any) => {
    setTimeframe(event.target.value);
  };

  const handleGranularityChange = (event: any) => {
    setGranularity(event.target.value);
  };

  const formatXAxisLabel = (tickItem: string) => {
    const date = new Date(tickItem);
    if (granularity === 'DAILY') {
      return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
    } else if (granularity === 'WEEKLY') {
      return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' });
    }
  };

  // Calculate summary metrics first
  const currentNAV = data.length > 0 ? data[data.length - 1]?.navValue : 0;
  const firstNAV = data.length > 0 ? data[0]?.navValue : 0;

  // Calculate Y-axis domains with balanced range
  const navValues = data.map(d => d.navValue);
  const pnlValues = data.map(d => d.portfolioPnL);
  
  const navMin = data.length > 0 ? Math.min(...navValues) : 0;
  const navMax = data.length > 0 ? Math.max(...navValues) : 0;
  const navRange = navMax - navMin;
  const navDomainMin = navMin - navRange / 2;
  const navDomainMax = navMax + navRange / 2;
  
  const pnlMin = data.length > 0 ? Math.min(...pnlValues) : 0;
  const pnlMax = data.length > 0 ? Math.max(...pnlValues) : 0;
  const pnlRange = pnlMax - pnlMin;
  const pnlDomainMin = pnlMin - pnlRange / 2;
  const pnlDomainMax = pnlMax + pnlRange / 2;

  // Calculate cumulative return for each data point
  const processedData = data.map((point) => {
    const cumulativeReturn = firstNAV > 0 ? ((point.navValue - firstNAV) / firstNAV) * 100 : 0;
    return {
      ...point,
      cumulativeReturn
    };
  });

  const formatTooltipLabel = (label: string) => {
    const date = new Date(label);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  const totalReturn = firstNAV > 0 ? ((currentNAV - firstNAV) / firstNAV) * 100 : 0;
  const isPositive = totalReturn >= 0;

  // Calculate peak and current drawdown
  let peak = firstNAV;
  let maxDrawdown = 0;
  data.forEach(point => {
    if (point.navValue > peak) {
      peak = point.navValue;
    }
    const drawdown = ((point.navValue - peak) / peak) * 100;
    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });

  return (
    <Card sx={{ 
      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
      borderRadius: 3,
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: '1px solid #e3f2fd',
      '&:hover': {
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        transform: 'translateY(-2px)',
        transition: 'all 0.3s ease-in-out'
      }
    }}>
      <CardContent sx={{ p: getUltraSpacing(3, 1.5) }}>
        {/* Professional Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: getUltraSpacing(3, 1.5),
          pb: getUltraSpacing(2, 1),
          borderBottom: '2px solid #f1f3f4'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: compact ? 1 : 1.5 }}>
            <Box sx={{ 
              p: compact ? 0.75 : 1, 
              borderRadius: 2, 
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AccountBalance sx={{ color: 'white', fontSize: compact ? 18 : 20 }} />
            </Box>
            <Box>
              <ResponsiveTypography variant="pageTitle" >
                NAV Performance History
              </ResponsiveTypography>
              {!compact && (
                <ResponsiveTypography variant="pageSubtitle" >
                  Net Asset Value evolution over time
                </ResponsiveTypography>
              )}
            </Box>
            <Tooltip title="Track portfolio value changes and performance metrics">
              <IconButton size="small" sx={{ ml: 1 }}>
                <InfoOutlined fontSize="small" sx={{ color: '#666' }} />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Professional Controls */}
          <Box sx={{ display: 'flex', gap: compact ? 1 : 1.5, alignItems: 'center' }}>
            <Chip
              label={showReturn ? "Return %" : "NAV Value"}
              onClick={() => setShowReturn(!showReturn)}
              color={showReturn ? "primary" : "default"}
              variant={showReturn ? "filled" : "outlined"}
              size={compact ? "small" : "medium"}
              sx={{ 
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: compact ? '0.7rem' : '0.8rem',
                '&:hover': {
                  backgroundColor: showReturn ? 'primary.dark' : 'primary.light',
                  color: showReturn ? 'white' : 'primary.main'
                }
              }}
            />
            
            <ResponsiveFormSelect
              compact={compact}
              size="small"
              options={timeframeOptions}
              value={timeframe}
              onChange={(value) => handleTimeframeChange({ target: { value: String(value) } })}
              formControlSx={{ minWidth: compact ? 70 : 85 }}
              selectSx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e0e0e0'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#1976d2'
                }
              }}
            />

            <ResponsiveFormSelect
              compact={compact}
              size="small"
              options={granularityOptions}
              value={granularity}
              onChange={(value) => handleGranularityChange({ target: { value: String(value) } })}
              formControlSx={{ minWidth: compact ? 80 : 95 }}
              selectSx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e0e0e0'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#1976d2'
                }
              }}
            />
          </Box>
        </Box>

        {/* Professional Summary Cards */}
        <Grid container spacing={getUltraSpacing(2, 1)} sx={{ mb: getUltraSpacing(3, 1.5) }}>
          <Grid item xs={6} sm={3}>
            <Card sx={{ 
              height: compact ? 70 : 90, 
              display: 'flex', 
              alignItems: 'center',
              background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
              border: '1px solid #e1f5fe',
              borderRadius: 2,
              '&:hover': {
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)',
                transform: 'translateY(-1px)',
                transition: 'all 0.2s ease-in-out'
              }
            }}>
              <CardContent sx={{ p: getUltraSpacing(2, 1), '&:last-child': { pb: getUltraSpacing(2, 1) }, textAlign: 'center', width: '100%' }}>
                <ResponsiveTypography variant="cardValueLarge" color="primary" fontWeight="bold" sx={{ mb: compact ? 0.25 : 0.5 }}>
                  {formatCurrency(currentNAV, baseCurrency)}
                </ResponsiveTypography>
                <ResponsiveTypography variant="cardLabel" color="text.secondary" fontWeight={500}>
                  Current NAV
                </ResponsiveTypography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Card sx={{ 
              height: compact ? 70 : 90, 
              display: 'flex', 
              alignItems: 'center',
              background: isPositive 
                ? 'linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%)'
                : 'linear-gradient(135deg, #ffebee 0%, #fce4ec 100%)',
              border: isPositive ? '1px solid #c8e6c9' : '1px solid #ffcdd2',
              borderRadius: 2,
              '&:hover': {
                boxShadow: isPositive 
                  ? '0 4px 12px rgba(76, 175, 80, 0.15)'
                  : '0 4px 12px rgba(244, 67, 54, 0.15)',
                transform: 'translateY(-1px)',
                transition: 'all 0.2s ease-in-out'
              }
            }}>
              <CardContent sx={{ p: getUltraSpacing(2, 1), '&:last-child': { pb: getUltraSpacing(2, 1) }, textAlign: 'center', width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: compact ? 0.25 : 0.5 }}>
                  {isPositive && <TrendingUp color="success" sx={{ fontSize: compact ? 16 : 18 }} />}
                  {!isPositive && <TrendingDown color="error" sx={{ fontSize: compact ? 16 : 18 }} />}
                  <ResponsiveTypography
                    variant="cardValueLarge"
                    color={isPositive ? 'success.main' : 'error.main'}
                    fontWeight="bold"
                  >
                    {formatPercentage(totalReturn)}
                  </ResponsiveTypography>
                </Box>
                <ResponsiveTypography variant="cardLabel" color="text.secondary" fontWeight={500}>
                  Total Return
                </ResponsiveTypography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Card sx={{ 
              height: compact ? 70 : 90, 
              display: 'flex', 
              alignItems: 'center',
              background: 'linear-gradient(135deg, #fff3e0 0%, #fce4ec 100%)',
              border: '1px solid #ffccbc',
              borderRadius: 2,
              '&:hover': {
                boxShadow: '0 4px 12px rgba(255, 152, 0, 0.15)',
                transform: 'translateY(-1px)',
                transition: 'all 0.2s ease-in-out'
              }
            }}>
              <CardContent sx={{ p: getUltraSpacing(2, 1), '&:last-child': { pb: getUltraSpacing(2, 1) }, textAlign: 'center', width: '100%' }}>
                <ResponsiveTypography variant="cardValueLarge" color="warning.main" fontWeight="bold" sx={{ mb: compact ? 0.25 : 0.5 }}>
                  {formatPercentage(maxDrawdown)}
                </ResponsiveTypography>
                <ResponsiveTypography variant="cardLabel" color="text.secondary" fontWeight={500}>
                  Max Drawdown
                </ResponsiveTypography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Card sx={{ 
              height: compact ? 70 : 90, 
              display: 'flex', 
              alignItems: 'center',
              background: 'linear-gradient(135deg, #e0f2f1 0%, #f1f8e9 100%)',
              border: '1px solid #b2dfdb',
              borderRadius: 2,
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0, 150, 136, 0.15)',
                transform: 'translateY(-1px)',
                transition: 'all 0.2s ease-in-out'
              }
            }}>
              <CardContent sx={{ p: getUltraSpacing(2, 1), '&:last-child': { pb: getUltraSpacing(2, 1) }, textAlign: 'center', width: '100%' }}>
                <ResponsiveTypography variant="cardValueLarge" color="info.main" fontWeight="bold" sx={{ mb: compact ? 0.25 : 0.5 }}>
                  {data.length}
                </ResponsiveTypography>
                <ResponsiveTypography variant="cardLabel" color="text.secondary" fontWeight={500}>
                  Data Points
                </ResponsiveTypography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Professional Chart */}
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" p={getUltraSpacing(6, 3)}>
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={compact ? 24 : 32} sx={{ color: '#1976d2', mb: getUltraSpacing(2, 1) }} />
              <ResponsiveTypography variant="cardLabel" color="text.secondary">
                Loading NAV history data...
              </ResponsiveTypography>
            </Box>
          </Box>
        ) : error ? (
          <Box sx={{ 
            textAlign: 'center', 
            p: getUltraSpacing(4, 2),
            background: 'linear-gradient(135deg, #ffebee 0%, #fce4ec 100%)',
            borderRadius: 2,
            border: '1px solid #ffcdd2'
          }}>
            <ResponsiveTypography color="error" variant="cardTitle" fontWeight={500}>
              {error}
            </ResponsiveTypography>
            <ResponsiveTypography color="error" variant="cardLabel" sx={{ mt: 1 }}>
              Unable to load NAV history data
            </ResponsiveTypography>
          </Box>
        ) : data.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            p: getUltraSpacing(4, 2),
            background: 'linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%)',
            borderRadius: 2,
            border: '1px solid #e0e0e0'
          }}>
            <ResponsiveTypography color="text.secondary" variant="cardTitle" fontWeight={500}>
              No NAV history data available
            </ResponsiveTypography>
            <ResponsiveTypography color="text.secondary" variant="cardLabel" sx={{ mt: 1 }}>
              Historical data will appear here once available
            </ResponsiveTypography>
          </Box>
        ) : (
          <Box sx={{ 
            height: compact ? 250 : 350,
            background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
            borderRadius: 2,
            p: getUltraSpacing(2, 1),
            border: '1px solid #e0e0e0'
          }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={processedData} margin={{ top: compact ? 15 : 20, right: compact ? 20 : 30, left: compact ? 15 : 20, bottom: compact ? 15 : 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" strokeOpacity={0.6} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxisLabel}
                  stroke="#666"
                  fontSize={compact ? 9 : 11}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#666' }}
                />
                <YAxis
                  yAxisId="nav"
                  tickFormatter={(value) => formatCurrency(value, baseCurrency)}
                  stroke="#1976d2"
                  fontSize={compact ? 9 : 11}
                  tickLine={false}
                  axisLine={false}
                  domain={[navDomainMin, navDomainMax]}
                  tick={{ fill: '#1976d2' }}
                />
                <YAxis
                  yAxisId="pnl"
                  orientation="right"
                  tickFormatter={(value) => formatCurrency(value, baseCurrency)}
                  stroke="#ff9800"
                  fontSize={compact ? 9 : 11}
                  tickLine={false}
                  axisLine={false}
                  domain={[pnlDomainMin, pnlDomainMax]}
                  tick={{ fill: '#ff9800' }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={compact ? 30 : 40}
                  formatter={(value) => {
                    if (value === 'navValue') return 'NAV Value';
                    if (value === 'portfolioPnL') return 'Portfolio P&L';
                    return value;
                  }}
                  wrapperStyle={{ fontSize: compact ? '10px' : '12px', fontWeight: 500 }}
                />
                <RechartsTooltip
                  formatter={(value, name) => {
                    if (name === 'navValue') {
                      return [formatCurrency(value as number, baseCurrency), 'NAV Value'];
                    } else if (name === 'portfolioPnL') {
                      return [formatCurrency(value as number, baseCurrency), 'Portfolio P&L'];
                    } else if (name === 'cumulativeReturn') {
                      return [formatPercentage(value as number), 'Cumulative Return'];
                    }
                    return [value, name];
                  }}
                  labelFormatter={formatTooltipLabel}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    fontSize: compact ? '10px' : '12px'
                  }}
                />
                
                {/* NAV Value Line */}
                <Line
                  yAxisId="nav"
                  type="monotone"
                  dataKey="navValue"
                  stroke="#1976d2"
                  strokeWidth={compact ? 2 : 3}
                  dot={false}
                  activeDot={{ r: compact ? 4 : 5, fill: '#1976d2', stroke: '#fff', strokeWidth: 2 }}
                  connectNulls={false}
                />
                
                {/* Portfolio P&L Bar */}
                <Bar
                  yAxisId="pnl"
                  dataKey="portfolioPnL"
                  fill="#ff9800"
                  fillOpacity={0.7}
                  radius={[compact ? 2 : 3, compact ? 2 : 3, 0, 0]}
                />
                
                {firstNAV > 0 && (
                  <ReferenceLine
                    yAxisId="nav"
                    y={firstNAV}
                    stroke="#666"
                    strokeDasharray="4 4"
                    strokeOpacity={0.6}
                    strokeWidth={1}
                  />
                )}
                
                {/* Zero line for P&L */}
                <ReferenceLine
                  yAxisId="pnl"
                  y={0}
                  stroke="#666"
                  strokeDasharray="2 2"
                  strokeOpacity={0.4}
                  strokeWidth={1}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default NAVHistoryChart;
