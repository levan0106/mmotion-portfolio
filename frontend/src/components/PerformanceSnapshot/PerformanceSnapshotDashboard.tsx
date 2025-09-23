import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Refresh,
  Download,
  BarChart,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';
import { snapshotService } from '../../services/snapshot.service';
import {
  PortfolioPerformanceSummary,
  AssetPerformanceSummary,
  AssetGroupPerformanceSummary,
  PerformanceChartData,
  PerformanceComparisonData,
  RiskAnalysisData,
  TimePeriod,
  RiskLevel,
  PerformanceGrade,
} from '../../types/snapshot.types';

interface PerformanceSnapshotDashboardProps {
  portfolioId: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const PerformanceSnapshotDashboard: React.FC<PerformanceSnapshotDashboardProps> = ({
  portfolioId,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1Y');
  const [selectedGranularity, setSelectedGranularity] = useState<string>('DAILY');
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioPerformanceSummary | null>(null);
  const [assetSummary, setAssetSummary] = useState<AssetPerformanceSummary | null>(null);
  const [groupSummary, setGroupSummary] = useState<AssetGroupPerformanceSummary | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceChartData[]>([]);
  const [comparisonData, setComparisonData] = useState<PerformanceComparisonData[]>([]);
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysisData[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [portfolioId, selectedPeriod, selectedGranularity]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      console.log('Loading dashboard data for portfolio:', portfolioId, 'period:', selectedPeriod);
      
      const [portfolio, assets, groups, performance, comparison, risk] = await Promise.all([
        snapshotService.getPortfolioPerformanceSummary(portfolioId, selectedPeriod),
        snapshotService.getAssetPerformanceSummary(portfolioId, { period: selectedPeriod }),
        snapshotService.getAssetGroupPerformanceSummary(portfolioId, { period: selectedPeriod }),
        snapshotService.getPerformanceTrends(portfolioId, 'twr', selectedPeriod),
        snapshotService.getPerformanceComparison(portfolioId, 'default-benchmark', selectedPeriod),
        snapshotService.getRiskAnalysis(portfolioId, selectedPeriod),
      ]);

      console.log('Dashboard data loaded:', { portfolio, assets, groups, performance, comparison, risk });

      setPortfolioSummary(portfolio);
      setAssetSummary(assets);
      setGroupSummary(groups);
      setPerformanceData(performance);
      setComparisonData(comparison);
      setRiskAnalysis(risk);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set default values to prevent blank page
      setPortfolioSummary(null);
      setAssetSummary(null);
      setGroupSummary(null);
      setPerformanceData([]);
      setComparisonData([]);
      setRiskAnalysis([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0.00%';
    }
    return `${value.toFixed(2)}%`;
  };

  const getRiskLevelColor = (level: RiskLevel): 'success' | 'warning' | 'error' => {
    switch (level) {
      case 'Low': return 'success';
      case 'Medium': return 'warning';
      case 'High': return 'error';
      default: return 'warning';
    }
  };

  const getPerformanceGradeColor = (grade: PerformanceGrade): 'success' | 'info' | 'warning' | 'error' => {
    switch (grade) {
      case 'A': return 'success';
      case 'B': return 'info';
      case 'C': return 'warning';
      case 'D': return 'warning';
      case 'F': return 'error';
      default: return 'warning';
    }
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp color="success" />;
    if (value < 0) return <TrendingDown color="error" />;
    return <div />;
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  const handleExport = async () => {
    try {
      const exportData = await snapshotService.exportPerformanceSnapshots(portfolioId, {
        granularity: selectedGranularity as any,
      });
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `performance-snapshots-${portfolioId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="400px">
        <Box>
          <LinearProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading performance data...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Show fallback UI when no data is available
  if (!portfolioSummary && !assetSummary && !groupSummary && performanceData.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Card>
          <CardContent>
            <Box display="flex" flexDirection="column" alignItems="center" py={4}>
              <BarChart sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                No Performance Data Available
              </Typography>
              <Typography variant="body1" color="text.secondary" textAlign="center" mb={3}>
                No performance snapshots found for this portfolio. Please create some snapshots first.
              </Typography>
              <Box display="flex" gap={2}>
                <IconButton onClick={handleRefresh} color="primary">
                  <Refresh />
                </IconButton>
                <Typography variant="body2" color="text.secondary">
                  Portfolio ID: {portfolioId}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Performance Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Portfolio performance analysis and risk metrics
          </Typography>
        </Box>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={selectedPeriod}
              label="Period"
              onChange={(e) => setSelectedPeriod(e.target.value as TimePeriod)}
            >
              <MenuItem value="1D">1 Day</MenuItem>
              <MenuItem value="1W">1 Week</MenuItem>
              <MenuItem value="1M">1 Month</MenuItem>
              <MenuItem value="3M">3 Months</MenuItem>
              <MenuItem value="6M">6 Months</MenuItem>
              <MenuItem value="1Y">1 Year</MenuItem>
              <MenuItem value="YTD">YTD</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Granularity</InputLabel>
            <Select
              value={selectedGranularity}
              label="Granularity"
              onChange={(e) => setSelectedGranularity(e.target.value)}
            >
              <MenuItem value="DAILY">Daily</MenuItem>
              <MenuItem value="WEEKLY">Weekly</MenuItem>
              <MenuItem value="MONTHLY">Monthly</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export">
            <IconButton onClick={handleExport}>
              <Download />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Portfolio Summary Cards */}
      {portfolioSummary && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardHeader
                title="TWR"
                action={getTrendIcon(portfolioSummary?.twr || 0)}
                titleTypographyProps={{ variant: 'subtitle2' }}
              />
              <CardContent>
                <Typography variant="h4" component="div">
                  {formatPercentage(portfolioSummary?.twr)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Time-Weighted Return ({selectedPeriod})
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardHeader
                title="MWR"
                action={getTrendIcon(portfolioSummary?.mwr || 0)}
                titleTypographyProps={{ variant: 'subtitle2' }}
              />
              <CardContent>
                <Typography variant="h4" component="div">
                  {formatPercentage(portfolioSummary?.mwr)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Money-Weighted Return ({selectedPeriod})
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardHeader
                title="Alpha"
                action={getTrendIcon(portfolioSummary?.alpha || 0)}
                titleTypographyProps={{ variant: 'subtitle2' }}
              />
              <CardContent>
                <Typography variant="h4" component="div">
                  {formatPercentage(portfolioSummary?.alpha)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Excess Return vs Benchmark ({selectedPeriod})
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardHeader
                title="Beta"
                action={<BarChart color="action" />}
                titleTypographyProps={{ variant: 'subtitle2' }}
              />
              <CardContent>
                <Typography variant="h4" component="div">
                  {(portfolioSummary?.beta || 0).toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Systematic Risk vs Benchmark ({selectedPeriod})
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Main Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Overview" />
            <Tab label="Performance" />
            <Tab label="Risk Analysis" />
            <Tab label="Attribution" />
          </Tabs>
        </Box>

        {/* Overview Tab */}
        {tabValue === 0 && (
          <CardContent>
            {/* Performance Chart */}
            <Box mb={4}>
              <Typography variant="h6" gutterBottom>
                Performance Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip formatter={(value) => formatPercentage(Number(value))} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="portfolio"
                    stroke="#8884d8"
                    strokeWidth={2}
                    name="Portfolio"
                  />
                  <Line
                    type="monotone"
                    dataKey="benchmark"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    name="Benchmark"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>

            {/* Asset Group Performance */}
            {groupSummary && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Asset Group Performance
                </Typography>
                <Grid container spacing={2}>
                  {groupSummary?.groupSummaries?.map((group) => (
                    <Grid item xs={12} sm={6} md={4} key={group?.assetType}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {group?.assetType}
                            </Typography>
                            <Chip
                              label={group?.performanceGrade}
                              color={getPerformanceGradeColor(group?.performanceGrade || 'C')}
                              size="small"
                            />
                          </Box>
                          <Box display="flex" justifyContent="space-between" mb={1}>
                            <Typography variant="body2" color="text.secondary">
                              TWR:
                            </Typography>
                            <Typography 
                              variant="body2" 
                              fontWeight="medium"
                              color={group?.twr && Number(group.twr) >= 0 ? 'success.main' : 'error.main'}
                            >
                              {group?.twr && Number(group.twr) >= 0 ? '+' : ''}
                              {formatPercentage(group?.twr)}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between" mb={1}>
                            <Typography variant="body2" color="text.secondary">
                              Sharpe:
                            </Typography>
                            <Typography 
                              variant="body2" 
                              fontWeight="medium"
                              color={group?.sharpeRatio && Number(group.sharpeRatio) >= 0 ? 'success.main' : 'error.main'}
                            >
                              {(group?.sharpeRatio || 0).toFixed(2)}
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between" mb={1}>
                            <Typography variant="body2" color="text.secondary">
                              Allocation:
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {formatPercentage(group?.allocationPercentage)}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={group?.allocationPercentage || 0}
                            sx={{ mt: 1 }}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </CardContent>
        )}

        {/* Performance Tab */}
        {tabValue === 1 && (
          <CardContent>
            {/* Performance Comparison */}
            <Box mb={4}>
              <Typography variant="h6" gutterBottom>
                Performance vs Benchmark
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Metric</TableCell>
                      <TableCell align="right">Portfolio</TableCell>
                      <TableCell align="right">Benchmark</TableCell>
                      <TableCell align="right">Difference</TableCell>
                      <TableCell align="right">%</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {comparisonData?.map((item) => (
                      <TableRow key={item?.metric}>
                        <TableCell component="th" scope="row">
                          {item?.metric}
                        </TableCell>
                        <TableCell align="right">{formatPercentage(item?.portfolio)}</TableCell>
                        <TableCell align="right">{formatPercentage(item?.benchmark)}</TableCell>
                        <TableCell
                          align="right"
                          sx={{ color: (item?.difference || 0) >= 0 ? 'success.main' : 'error.main' }}
                        >
                          {formatPercentage(item?.difference)}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ color: (item?.percentage || 0) >= 0 ? 'success.main' : 'error.main' }}
                        >
                          {formatPercentage(item?.percentage)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* Asset Performance Table */}
            {assetSummary && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Asset Performance
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Asset</TableCell>
                        <TableCell align="right">TWR</TableCell>
                        <TableCell align="right">Volatility</TableCell>
                        <TableCell align="right">Sharpe Ratio</TableCell>
                        <TableCell align="right">Max Drawdown</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {assetSummary.assetSummaries.map((asset) => (
                        <TableRow key={asset?.assetId}>
                          <TableCell component="th" scope="row">
                            {asset?.assetSymbol}
                          </TableCell>
                          <TableCell align="right">{formatPercentage(asset?.twr)}</TableCell>
                          <TableCell align="right">{formatPercentage(asset?.volatility)}</TableCell>
                          <TableCell align="right">{(asset?.sharpeRatio || 0).toFixed(2)}</TableCell>
                          <TableCell align="right" sx={{ color: 'error.main' }}>
                            {formatPercentage(asset?.maxDrawdown)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </CardContent>
        )}

        {/* Risk Analysis Tab */}
        {tabValue === 2 && (
          <CardContent>
            <Grid container spacing={3}>
              {riskAnalysis.map((risk) => (
                <Grid item xs={12} sm={6} md={4} key={risk?.metric}>
                  <Card>
                    <CardHeader
                      title={risk?.metric}
                      action={
                        <Chip
                          label={risk?.level}
                          color={getRiskLevelColor(risk?.level || 'Medium')}
                          size="small"
                        />
                      }
                    />
                    <CardContent>
                      <Typography variant="h4" component="div" gutterBottom>
                        {formatPercentage(risk?.value)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {risk?.description}
                      </Typography>
                      {risk?.recommendation && (
                        <Box
                          sx={{
                            bgcolor: 'info.light',
                            p: 2,
                            borderRadius: 1,
                          }}
                        >
                          <Typography variant="body2">
                            <strong>Recommendation:</strong> {risk?.recommendation}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        )}

        {/* Attribution Tab */}
        {tabValue === 3 && (
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Performance Attribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={groupSummary?.groupSummaries || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ assetType, allocationPercentage }) => 
                    `${assetType} (${formatPercentage(allocationPercentage)})`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="allocationPercentage"
                >
                  {(groupSummary?.groupSummaries || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => formatPercentage(Number(value))} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        )}
      </Card>
    </Box>
  );
};

export default PerformanceSnapshotDashboard;