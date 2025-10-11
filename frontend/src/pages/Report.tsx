import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
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
import ResponsiveTypography from '../components/Common/ResponsiveTypography';

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
            <ResponsiveTypography variant="cardTitle" sx={{ color: '#1a1a1a' }}>
              {title}
            </ResponsiveTypography>
          </Box>
          <ResponsiveTypography variant="cardValue" sx={{ 
            mb: 1, 
            color: '#212529' 
          }}>
            {value}
          </ResponsiveTypography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <ResponsiveTypography variant="cardLabel" sx={{ color: '#6c757d' }}>
              {subtitle}
            </ResponsiveTypography>
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
        <ResponsiveTypography variant="chartTitle">
          {title}
        </ResponsiveTypography>
      </Box>
      <TableContainer sx={{ 
        overflowX: 'auto',
        '&::-webkit-scrollbar': {
          height: '6px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: '#f1f1f1',
          borderRadius: '3px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#c1c1c1',
          borderRadius: '3px',
          '&:hover': {
            backgroundColor: '#a8a8a8',
          },
        },
      }}>
        <Table sx={{ 
          width: '100%',
          tableLayout: 'auto'
        }}>
          <TableHead>
            <TableRow>
              {columns.map((column, colIndex) => (
                <TableCell 
                  key={`header-${colIndex}-${column.key}`} 
                  align={column.align || 'left'}
                  sx={{
                    padding: { xs: '4px 8px', sm: '8px 12px', md: '12px 16px' },
                    whiteSpace: 'nowrap',
                    width: 'auto',
                    minWidth: 'fit-content',
                    // Flexible width based on content
                    ...(column.key === 'percentage' ? {
                      minWidth: '50px',
                      maxWidth: '80px'
                    } : {}),
                    ...(column.key === 'count' ? {
                      minWidth: '50px',
                      maxWidth: '80px'
                    } : {}),
                    ...(column.key.includes('value') || column.key.includes('total') ? {
                      minWidth: '50px',
                      maxWidth: '200px'
                    } : {}),
                    ...(column.key === 'source' || column.key === 'exchange' || column.key === 'group' ? {
                      minWidth: '50px',
                      maxWidth: '80px'
                    } : {})
                  }}
                >
                  <ResponsiveTypography 
                    variant="tableHeaderSmall" 
                    sx={{ 
                      fontWeight: 600,
                      // Use extra small on very small screens
                      '@media (max-width: 600px)': {
                        fontSize: '0.55rem !important',
                        lineHeight: '1.1 !important'
                      }
                    }}
                  >
                    {column.label}
                  </ResponsiveTypography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length > 0 ? (
              data.map((row, index) => (
                <TableRow key={index} hover>
                  {columns.map((column, colIndex) => (
                    <TableCell 
                      key={`${index}-${colIndex}-${column.key}`} 
                      align={column.align || 'left'}
                      sx={{
                        padding: { xs: '4px 8px', sm: '8px 12px', md: '12px 16px' },
                        whiteSpace: 'nowrap',
                        width: 'auto',
                        minWidth: 'fit-content',
                        // Flexible width based on content
                        ...(column.key === 'percentage' ? {
                          minWidth: '50px',
                          maxWidth: '80px'
                        } : {}),
                        ...(column.key === 'count' ? {
                          minWidth: '50px',
                          maxWidth: '80px'
                        } : {}),
                        ...(column.key.includes('value') || column.key.includes('total') ? {
                          minWidth: '50px',
                          maxWidth: '200px'
                        } : {}),
                        ...(column.key === 'source' || column.key === 'exchange' || column.key === 'group' ? {
                          minWidth: '50px',
                          maxWidth: '80px'
                        } : {})
                      }}
                    >
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
                        <ResponsiveTypography 
                          variant="tableCellSmall" 
                          sx={{ 
                            fontWeight: 400,
                            color: Number(row.total - row.capitalValue) >= 0 ? 'success.main' : 'error.main',
                            // Use extra small on very small screens
                            '@media (max-width: 600px)': {
                              fontSize: '0.55rem !important',
                              lineHeight: '1.1 !important'
                            }
                          }}
                        >
                          {formatCurrency(row.total - row.capitalValue, baseCurrency)}
                        </ResponsiveTypography>
                      ) : column.key.includes('value') || column.key.includes('total') || column.key === 'capitalValue' ? (
                        <ResponsiveTypography 
                          variant="tableCellSmall" 
                          sx={{ 
                            fontWeight: 400,
                            color: Number(row[column.key]) >= 0 ? 'success.main' : 'error.main',
                            // Use extra small on very small screens
                            '@media (max-width: 600px)': {
                              fontSize: '0.55rem !important',
                              lineHeight: '1.1 !important'
                            }
                          }}
                        >
                          {formatCurrency(row[column.key], baseCurrency)}
                        </ResponsiveTypography>
                      ) : column.key === 'count' ? (
                        <ResponsiveTypography 
                          variant="tableCellSmall" 
                          sx={{ 
                            fontWeight: 400,
                            // Use extra small on very small screens
                            '@media (max-width: 600px)': {
                              fontSize: '0.55rem !important',
                              lineHeight: '1.1 !important'
                            }
                          }}
                        >
                          {formatNumber(row[column.key], 0)}
                        </ResponsiveTypography>
                      ) : (
                        <ResponsiveTypography 
                          variant="tableCellSmall"
                          sx={{
                            // Use extra small on very small screens
                            '@media (max-width: 600px)': {
                              fontSize: '0.55rem !important',
                              lineHeight: '1.1 !important'
                            }
                          }}
                        >
                          {row[column.key]}
                        </ResponsiveTypography>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  <ResponsiveTypography variant="formHelper">
                    No data available
                  </ResponsiveTypography>
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
      <Box>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!reportData) {
    return (
      <Box>
        <Alert severity="info">No report data available</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, m: 0 }}>
          <Box sx={{ flex: 1 }}>
            <ResponsiveTypography variant="pageHeader"
            sx={{ 
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
              filter: 'none'
            }}>
              Financial Report
            </ResponsiveTypography>
          </Box>
          <Box sx={{ ml: 2 }}>
            <FormControl sx={{ minWidth: 200, '& .MuiOutlinedInput-root': { height: '40px' } }}>
              <InputLabel sx={{ fontSize: '0.875rem' }}>Portfolio Filter</InputLabel>
            <Select
              multiple
              value={selectedPortfolioIds}
              size="small"
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
                    maxHeight: 250,
                    width: 250,
                  },
                },
              }}
            >
              <MenuItem key="all" value="all" sx={{ display: 'flex', alignItems: 'center', py: 0.5, minHeight: '32px' }}>
                <Checkbox 
                  checked={selectedPortfolioIds.includes('all')} 
                  color="primary"
                  size="small"
                />
                <ListItemText 
                  primary="All Portfolios" 
                  sx={{ ml: 1, '& .MuiListItemText-primary': { fontSize: '0.875rem' } }}
                />
              </MenuItem>
              {portfolios.map((portfolio, index) => {

                // Only render if portfolio has valid portfolioId
                if (portfolio.portfolioId) {
                  return (
                    <MenuItem 
                      key={`portfolio-${index}-${portfolio.portfolioId}`} 
                      value={portfolio.portfolioId}
                      sx={{ display: 'flex', alignItems: 'center', py: 0.5, minHeight: '32px' }}
                    >
                      <Checkbox 
                        checked={selectedPortfolioIds.includes(portfolio.portfolioId)} 
                        color="primary"
                        size="small"
                      />
                      <ListItemText 
                        primary={portfolio.name} 
                        sx={{ ml: 1, '& .MuiListItemText-primary': { fontSize: '0.875rem' } }}
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
        </Box>
        <ResponsiveTypography variant="pageSubtitle">
          Comprehensive overview of cash balance, deposits, and assets by category
        </ResponsiveTypography>
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
                      <ResponsiveTypography 
                        variant="tableCellSmall" 
                        sx={{ 
                          fontWeight: 600, 
                          color: Number(row.capitalValue) >= 0 ? 'success.main' : 'error.main',
                          // Use extra small on very small screens
                          '@media (max-width: 600px)': {
                            fontSize: '0.55rem !important',
                            lineHeight: '1.1 !important'
                          }
                        }}
                      >
                        {formatCurrency(row.capitalValue, baseCurrency)}
                      </ResponsiveTypography>
                      <ResponsiveTypography 
                        variant="formHelper"
                        sx={{
                          // Use extra small on very small screens
                          '@media (max-width: 600px)': {
                            fontSize: '0.5rem !important',
                            lineHeight: '1.1 !important'
                          }
                        }}
                      >
                        Count: {formatNumber(value, 0)}
                      </ResponsiveTypography>
                    </Box>
                  ),
                  total: (value, row) => (
                    <Box>
                      <ResponsiveTypography 
                        variant="tableCellSmall" 
                        sx={{ 
                          fontWeight: 600, 
                          color: Number(value) >= 0 ? 'success.main' : 'error.main',
                          // Use extra small on very small screens
                          '@media (max-width: 600px)': {
                            fontSize: '0.55rem !important',
                            lineHeight: '1.1 !important'
                          }
                        }}
                      >
                        {formatCurrency(value, baseCurrency)}
                      </ResponsiveTypography>
                      <ResponsiveTypography 
                        variant="formHelper" 
                        sx={{ 
                          color: Number(value - row.capitalValue) >= 0 ? 'success.main' : 'error.main',
                          // Use extra small on very small screens
                          '@media (max-width: 600px)': {
                            fontSize: '0.5rem !important',
                            lineHeight: '1.1 !important'
                          }
                        }}
                      >
                        P&L: {formatCurrency(value - row.capitalValue, baseCurrency)}
                      </ResponsiveTypography>
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
                      <ResponsiveTypography 
                        variant="tableCellSmall" 
                        sx={{ 
                          fontWeight: 600, 
                          color: Number(row.capitalValue) >= 0 ? 'success.main' : 'error.main',
                          // Use extra small on very small screens
                          '@media (max-width: 600px)': {
                            fontSize: '0.55rem !important',
                            lineHeight: '1.1 !important'
                          }
                        }}
                      >
                        {formatCurrency(row.capitalValue, baseCurrency)}
                      </ResponsiveTypography>
                      <ResponsiveTypography 
                        variant="formHelper"
                        sx={{
                          // Use extra small on very small screens
                          '@media (max-width: 600px)': {
                            fontSize: '0.5rem !important',
                            lineHeight: '1.1 !important'
                          }
                        }}
                      >
                        Count: {formatNumber(value, 0)}
                      </ResponsiveTypography>
                    </Box>
                  ),
                  total: (value, row) => (
                    <Box>
                      <ResponsiveTypography 
                        variant="tableCellSmall" 
                        sx={{ 
                          fontWeight: 600, 
                          color: Number(value) >= 0 ? 'success.main' : 'error.main',
                          // Use extra small on very small screens
                          '@media (max-width: 600px)': {
                            fontSize: '0.55rem !important',
                            lineHeight: '1.1 !important'
                          }
                        }}
                      >
                        {formatCurrency(value, baseCurrency)}
                      </ResponsiveTypography>
                      <ResponsiveTypography 
                        variant="formHelper" 
                        sx={{ 
                          color: Number(value - row.capitalValue) >= 0 ? 'success.main' : 'error.main',
                          // Use extra small on very small screens
                          '@media (max-width: 600px)': {
                            fontSize: '0.5rem !important',
                            lineHeight: '1.1 !important'
                          }
                        }}
                      >
                        P&L: {formatCurrency(value - row.capitalValue, baseCurrency)}
                      </ResponsiveTypography>
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
