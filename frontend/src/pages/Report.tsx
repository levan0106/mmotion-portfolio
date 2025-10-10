import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
} from '@mui/material';
import {
  AccountBalance,
  AccountBalanceWallet,
  Savings,
} from '@mui/icons-material';
import { useAccount } from '../contexts/AccountContext';
import { apiService } from '../services/api';
import { formatCurrency, formatNumber, formatPercentageValue } from '../utils/format';

interface ReportData {
  cashBalance: {
    total: number;
    byExchange: Array<{ exchange: string; total: number; count: number; percentage: number }>;
    byFundingSource: Array<{ source: string; total: number; count: number; percentage: number }>;
    byAssetGroup: Array<{ group: string; total: number; count: number; percentage: number }>;
  };
  deposits: {
    total: number;
    totalValue: number;
    byExchange: Array<{ exchange: string; total: number; count: number; percentage: number }>;
    byFundingSource: Array<{ source: string; total: number; count: number; percentage: number }>;
    byAssetGroup: Array<{ group: string; total: number; count: number; percentage: number }>;
  };
  assets: {
    total: number;
    totalValue: number;
    byExchange: Array<{ exchange: string; total: number; count: number; percentage: number }>;
    byFundingSource: Array<{ source: string; total: number; count: number; percentage: number }>;
    byAssetGroup: Array<{ group: string; total: number; count: number; percentage: number }>;
  };
}

const Report: React.FC = () => {
  const theme = useTheme();
  const { accountId, baseCurrency } = useAccount();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portfolios, setPortfolios] = useState<Array<{ portfolioId: string; name: string }>>([]);
  const [selectedPortfolioIds, setSelectedPortfolioIds] = useState<string[]>(['all']);
  // Fetch portfolios
  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        const portfoliosData = await apiService.getPortfolios(accountId);

        setPortfolios(portfoliosData);
        // Keep default "All Portfolios" selection - no auto-selection

      } catch (err) {
        console.error('Failed to load portfolios:', err);
      }
    };

    if (accountId) {
      fetchPortfolios();
    }
  }, [accountId]);

  // Fetch report data
  useEffect(() => {

    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // If "all" is selected or no specific portfolios selected, fetch all data
        const portfolioId = selectedPortfolioIds.includes('all') || selectedPortfolioIds.length === 0 
          ? undefined 
          : selectedPortfolioIds.join(',');

        const data = await apiService.getReportData(accountId, portfolioId);

        setReportData(data);
      } catch (err) {
        setError('Failed to load report data');
        console.error('Error fetching report data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (accountId) {
      fetchReportData();
    }
  }, [accountId, selectedPortfolioIds]);

  const SummaryCard = ({ 
    title, 
    value, 
    subtitle, 
    icon, 
    color = 'primary',
    trend = 'neutral',
    change
  }: {
    title: string;
    value: string;
    subtitle: string;
    icon: React.ReactNode;
    color?: 'primary' | 'success' | 'error' | 'info' | 'warning';
    trend?: 'positive' | 'negative' | 'neutral';
    change?: string;
  }) => {
    const colorMap = {
      primary: theme.palette.primary.main,
      success: theme.palette.success.main,
      error: theme.palette.error.main,
      info: theme.palette.info.main,
      warning: theme.palette.warning.main,
    };

    const gradient = `linear-gradient(135deg, ${alpha(colorMap[color], 0.06)} 0%, ${alpha(colorMap[color], 0.03)} 100%)`;

    return (
      <Card 
        sx={{ 
          height: '100%',
          background: gradient,
          border: `1px solid ${alpha(colorMap[color], 0.1)}`,
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 25px ${alpha(colorMap[color], 0.15)}`,
          },
          transition: 'all 0.3s ease',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ 
              p: 1.5, 
              backgroundColor: colorMap[color], 
              borderRadius: 2,
              mr: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {icon}
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
              {title}
            </Typography>
          </Box>
          <Typography variant="h4" sx={{ 
            fontWeight: 700, 
            mb: 1, 
            color: '#212529' 
          }}>
            {value}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: '#6c757d' }}>
              {subtitle}
            </Typography>
            {change && (
              <Chip
                label={change}
                size="small"
                color={trend === 'positive' ? 'success' : trend === 'negative' ? 'error' : 'default'}
                variant={trend === 'neutral' ? 'outlined' : 'filled'}
                sx={{ fontSize: '0.75rem' }}
              />
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  const DataTable = ({ 
    title, 
    data, 
    columns,
    customRender
  }: {
    title: string;
    data: any[];
    columns: Array<{ key: string; label: string; align?: 'left' | 'right' | 'center' }>;
    customRender?: Record<string, (value: any, row: any) => React.ReactNode>;
  }) => (
    <Paper sx={{ mb: 3 }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column, colIndex) => (
                <TableCell key={`header-${colIndex}-${column.key}`} align={column.align || 'left'} sx={{ fontWeight: 600 }}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length > 0 ? (
              data.map((row, index) => (
                <TableRow key={index} hover>
                  {columns.map((column, colIndex) => (
                    <TableCell key={`${index}-${colIndex}-${column.key}`} align={column.align || 'left'}>
                      {customRender && customRender[column.key] ? (
                        customRender[column.key](row[column.key], row)
                      ) : column.key === 'percentage' ? (
                        <Chip
                          label={formatPercentageValue(row[column.key], 1)}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ) : column.key === 'pnl' ? (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600,
                            color: Number(row.total - row.capitalValue) >= 0 ? 'success.main' : 'error.main'
                          }}
                        >
                          {formatCurrency(row.total - row.capitalValue, baseCurrency)}
                        </Typography>
                      ) : column.key.includes('value') || column.key.includes('total') || column.key === 'capitalValue' ? (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600,
                            color: Number(row[column.key]) >= 0 ? 'success.main' : 'error.main'
                          }}
                        >
                          {formatCurrency(row[column.key], baseCurrency)}
                        </Typography>
                      ) : column.key === 'count' ? (
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatNumber(row[column.key], 0)}
                        </Typography>
                      ) : (
                        <Typography variant="body2">
                          {row[column.key]}
                        </Typography>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No data available
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!reportData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">No report data available</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Financial Report
          </Typography>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Portfolio Filter</InputLabel>
            <Select
              multiple
              value={selectedPortfolioIds}
              onChange={(event) => {
                const value = event.target.value as string[];

                // Handle "All Portfolios" selection
                if (value.includes('all')) {
                  if (value.length === 1) {
                    // Only "all" selected, keep it
                    setSelectedPortfolioIds(['all']);
                  } else {
                    // "all" + others selected, remove "all"
                    setSelectedPortfolioIds(value.filter(id => id !== 'all'));
                  }
                } else {
                  // No "all" selected, use the selected portfolios
                  setSelectedPortfolioIds(value.length > 0 ? value : ['all']);
                }
              }}
              label="Portfolio Filter"
              renderValue={(selected) => {
                if (selected.includes('all')) {
                  return 'All Portfolios';
                }
                if (selected.length === 0) {
                  return 'All Portfolios';
                }
                if (selected.length === 1) {
                  const portfolio = portfolios.find(p => p.portfolioId === selected[0]);
                  return portfolio ? portfolio.name : selected[0];
                }
                return `${selected.length} portfolios selected`;
              }}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300,
                    width: 250,
                  },
                },
              }}
            >
              <MenuItem key="all" value="all" sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                <Checkbox 
                  checked={selectedPortfolioIds.includes('all')} 
                  color="primary"
                  size="small"
                />
                <ListItemText 
                  primary="All Portfolios" 
                  sx={{ ml: 1 }}
                />
              </MenuItem>
              {portfolios.map((portfolio, index) => {

                // Only render if portfolio has valid portfolioId
                if (portfolio.portfolioId) {
                  return (
                    <MenuItem 
                      key={`portfolio-${index}-${portfolio.portfolioId}`} 
                      value={portfolio.portfolioId}
                      sx={{ display: 'flex', alignItems: 'center', py: 1 }}
                    >
                      <Checkbox 
                        checked={selectedPortfolioIds.includes(portfolio.portfolioId)} 
                        color="primary"
                        size="small"
                      />
                      <ListItemText 
                        primary={portfolio.name} 
                        sx={{ ml: 1 }}
                      />
                    </MenuItem>
                  );
                } else {
                  console.warn(`Portfolio ${index} has invalid portfolioId:`, portfolio);
                  return null;
                }
              })}
            </Select>
          </FormControl>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Comprehensive overview of cash balance, deposits, and assets by category
        </Typography>
      </Box>

      {/* 3-Column Layout */}
      <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
        {/* Column 1: Cash Balance */}
        <Grid item xs={12} md={4}>
          <Box sx={{ p: 0.2, height: '100%', display: 'flex', flexDirection: 'column' }}>

            <Box sx={{ mb: 3, height: '180px', display: 'flex', alignItems: 'stretch' }}>
              <Box sx={{ width: '100%' }}>
                <SummaryCard
                  title="Total Cash Balance"
                  value={formatCurrency(reportData.cashBalance.total, baseCurrency)}
                  subtitle="Available liquidity"
                  icon={<AccountBalance sx={{ fontSize: 24, color: 'white' }} />}
                  color="info"
                  change="Liquid"
                />
              </Box>
            </Box>

            <Box sx={{ flex: 1 }}>
              <DataTable
                title="By Funding Source"
                data={reportData.cashBalance.byFundingSource}
                columns={[
                  { key: 'source', label: 'Funding Source' },
                  { key: 'total', label: 'Total Amount', align: 'right' },
                  { key: 'percentage', label: 'Share', align: 'right' },
                ]}
              />
            </Box>
          </Box>
        </Grid>

        {/* Column 2: Deposits */}
        <Grid item xs={12} md={4}>
          <Box sx={{ p: 0.2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            
            <Box sx={{ mb: 3, height: '180px', display: 'flex', alignItems: 'stretch' }}>
              <Box sx={{ width: '100%' }}>
                <SummaryCard
                  title="Total Deposits"
                  value={formatCurrency(reportData.deposits.totalValue, baseCurrency)}
                  subtitle={`${reportData.deposits.total} deposit${reportData.deposits.total !== 1 ? 's' : ''}`}
                  icon={<Savings sx={{ fontSize: 24, color: 'white' }} />}
                  color="success"
                  change="Active"
                />
              </Box>
            </Box>

            <Box sx={{ flex: 1 }}>
              <DataTable
                title="By Bank"
                data={reportData.deposits.byExchange}
                columns={[
                  { key: 'exchange', label: 'Bank' },
                  { key: 'count', label: 'Count', align: 'right' },
                  { key: 'total', label: 'Value', align: 'right' },
                  { key: 'percentage', label: 'Share', align: 'right' },
                ]}
              />
              
              <DataTable
                title="By Deposit Term"
                data={reportData.deposits.byFundingSource}
                columns={[
                  { key: 'source', label: 'Term' },
                  { key: 'count', label: 'Count', align: 'right' },
                  { key: 'total', label: 'Value', align: 'right' },
                  { key: 'percentage', label: 'Share', align: 'right' },
                ]}
              />
            </Box>
          </Box>
        </Grid>

        {/* Column 3: Assets */}
        <Grid item xs={12} md={4}>
          <Box sx={{ p: 0.2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            
            <Box sx={{ mb: 3, height: '180px', display: 'flex', alignItems: 'stretch' }}>
              <Box sx={{ width: '100%' }}>
                <SummaryCard
                  title="Total Assets"
                  value={formatCurrency(reportData.assets.totalValue, baseCurrency)}
                  subtitle={`${reportData.assets.total} asset${reportData.assets.total !== 1 ? 's' : ''}`}
                  icon={<AccountBalanceWallet sx={{ fontSize: 24, color: 'white' }} />}
                  color="primary"
                  change="Diversified"
                />
              </Box>
            </Box>

            <Box sx={{ flex: 1 }}>
              <DataTable
                title="By Exchange/Platform"
                data={reportData.assets.byExchange}
                columns={[
                  { key: 'exchange', label: 'Exchange/Platform' },
                  { key: 'count', label: 'Capital Value', align: 'right' },
                  { key: 'total', label: 'Current Value', align: 'right' },
                  { key: 'percentage', label: 'Share', align: 'right' },
                ]}
                customRender={{
                  count: (value, row) => (
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: Number(row.capitalValue) >= 0 ? 'success.main' : 'error.main' }}>
                        {formatCurrency(row.capitalValue, baseCurrency)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Count: {formatNumber(value, 0)}
                      </Typography>
                    </Box>
                  ),
                  total: (value, row) => (
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: Number(value) >= 0 ? 'success.main' : 'error.main' }}>
                        {formatCurrency(value, baseCurrency)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: Number(value - row.capitalValue) >= 0 ? 'success.main' : 'error.main' }}>
                        P&L: {formatCurrency(value - row.capitalValue, baseCurrency)}
                      </Typography>
                    </Box>
                  )
                }}
              />
              
              <DataTable
                title="By Group"
                data={reportData.assets.byAssetGroup}
                columns={[
                  { key: 'group', label: 'Asset Group' },
                  { key: 'count', label: 'Capital Value', align: 'right' },
                  { key: 'total', label: 'Current Value', align: 'right' },
                  { key: 'percentage', label: 'Share', align: 'right' },
                ]}
                customRender={{
                  count: (value, row) => (
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: Number(row.capitalValue) >= 0 ? 'success.main' : 'error.main' }}>
                        {formatCurrency(row.capitalValue, baseCurrency)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Count: {formatNumber(value, 0)}
                      </Typography>
                    </Box>
                  ),
                  total: (value, row) => (
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: Number(value) >= 0 ? 'success.main' : 'error.main' }}>
                        {formatCurrency(value, baseCurrency)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: Number(value - row.capitalValue) >= 0 ? 'success.main' : 'error.main' }}>
                        P&L: {formatCurrency(value - row.capitalValue, baseCurrency)}
                      </Typography>
                    </Box>
                  )
                }}
              />
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Report;
