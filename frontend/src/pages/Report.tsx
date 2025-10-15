import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
        setError(t('report.error.loadFailed'));
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
                          sx={{
                            fontSize: '0.65rem'
                          }}
                        />
                      ) : column.key === 'pnl' ? (
                        <ResponsiveTypography 
                          variant="tableCell" 
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
                          variant="tableCell" 
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
                          variant="tableCell" 
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
                    {t('report.noData')}
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
        <Alert severity="info">{t('report.noReportData')}</Alert>
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
              {t('report.title')}
            </ResponsiveTypography>
          </Box>
          <Box sx={{ ml: 2 }}>
            <FormControl sx={{ minWidth: 200, '& .MuiOutlinedInput-root': { height: '40px' } }}>
              <InputLabel sx={{ fontSize: '0.875rem!important' }}>{t('report.portfolioFilter')}</InputLabel>
              <Select
                multiple
                value={selectedPortfolioIds}
                size="small"
                sx={{ fontSize: '0.875rem!important' }}
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
                label={t('report.portfolioFilter')}
                renderValue={(selected) => {
                  if (selected.includes('all')) {
                    return t('report.allPortfolios');
                  }
                  if (selected.length === 0) {
                    return t('report.allPortfolios');
                  }
                  if (selected.length === 1) {
                    const portfolio = portfolios.find(p => p.portfolioId === selected[0]);
                    return portfolio ? portfolio.name : selected[0];
                  }
                  return t('report.portfoliosSelected', { count: selected.length });
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
                    primary={t('report.allPortfolios')} 
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
          {t('report.subtitle')}
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
                  title={t('report.cashBalance.title')}
                  value={formatCurrency(reportData.cashBalance.total, baseCurrency)}
                  subtitle={t('report.cashBalance.subtitle')}
                  icon={<AccountBalance sx={{ fontSize: 24, color: 'white' }} />}
                  color="info"
                  change={t('report.cashBalance.change')}
                />
              </Box>
            </Box>

            <Box sx={{ flex: 1 }}>
              <DataTable
                title={t('report.cashBalance.byFundingSource')}
                data={reportData.cashBalance.byFundingSource}
                columns={[
                  { key: 'source', label: t('report.columns.fundingSource') },
                  { key: 'total', label: t('report.columns.totalAmount'), align: 'right' },
                  { key: 'percentage', label: t('report.columns.share'), align: 'right' },
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
                  title={t('report.deposits.title')}
                  value={formatCurrency(reportData.deposits.totalValue, baseCurrency)}
                  subtitle={t('report.deposits.subtitle', { count: reportData.deposits.total })}
                  icon={<Savings sx={{ fontSize: 24, color: 'white' }} />}
                  color="success"
                  change={t('report.deposits.change')}
                />
              </Box>
            </Box>

            <Box sx={{ flex: 1 }}>
              <DataTable
                title={t('report.deposits.byBank')}
                data={reportData.deposits.byExchange}
                columns={[
                  { key: 'exchange', label: t('report.columns.bank') },
                  { key: 'count', label: t('report.columns.count'), align: 'right' },
                  { key: 'total', label: t('report.columns.value'), align: 'right' },
                  { key: 'percentage', label: t('report.columns.share'), align: 'right' },
                ]}
              />
              
              <DataTable
                title={t('report.deposits.byTerm')}
                data={reportData.deposits.byFundingSource}
                columns={[
                  { key: 'source', label: t('report.columns.term') },
                  { key: 'count', label: t('report.columns.count'), align: 'right' },
                  { key: 'total', label: t('report.columns.value'), align: 'right' },
                  { key: 'percentage', label: t('report.columns.share'), align: 'right' },
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
                  title={t('report.assets.title')}
                  value={formatCurrency(reportData.assets.totalValue, baseCurrency)}
                  subtitle={t('report.assets.subtitle', { count: reportData.assets.total })}
                  icon={<AccountBalanceWallet sx={{ fontSize: 24, color: 'white' }} />}
                  color="primary"
                  change={t('report.assets.change')}
                />
              </Box>
            </Box>

            <Box sx={{ flex: 1 }}>
              <DataTable
                title={t('report.assets.byExchange')}
                data={reportData.assets.byExchange}
                columns={[
                  { key: 'exchange', label: t('report.columns.exchange') },
                  { key: 'count', label: t('report.columns.capitalValue'), align: 'right' },
                  { key: 'total', label: t('report.columns.currentValue'), align: 'right' },
                  { key: 'percentage', label: t('report.columns.share'), align: 'right' },
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
                        variant="tableCellSmall"
                        sx={{
                          color: 'text.secondary',
                          // Use extra small on very small screens
                          '@media (max-width: 600px)': {
                            fontSize: '0.5rem !important',
                            lineHeight: '1.1 !important'
                          }
                        }}
                      >
                        {t('report.columns.count')}: {formatNumber(value, 0)}
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
                        variant="tableCellSmall" 
                        sx={{ 
                          color: Number(value - row.capitalValue) >= 0 ? 'success.main' : 'error.main',
                          // Use extra small on very small screens
                          '@media (max-width: 600px)': {
                            fontSize: '0.5rem !important',
                            lineHeight: '1.1 !important'
                          }
                        }}
                      >
                        {t('report.columns.pnl')}: {formatCurrency(value - row.capitalValue, baseCurrency)}
                      </ResponsiveTypography>
                    </Box>
                  )
                }}
              />
              
              <DataTable
                title={t('report.assets.byGroup')}
                data={reportData.assets.byAssetGroup}
                columns={[
                  { key: 'group', label: t('report.columns.assetGroup') },
                  { key: 'count', label: t('report.columns.capitalValue'), align: 'right' },
                  { key: 'total', label: t('report.columns.currentValue'), align: 'right' },
                  { key: 'percentage', label: t('report.columns.share'), align: 'right' },
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
                        variant="tableCellSmall"
                        sx={{
                          color: 'text.secondary',
                          // Use extra small on very small screens
                          '@media (max-width: 600px)': {
                            fontSize: '0.5rem !important',
                            lineHeight: '1.1 !important'
                          }
                        }}
                      >
                        {t('report.columns.count')}: {formatNumber(value, 0)}
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
                        variant="tableCellSmall" 
                        sx={{ 
                          color: Number(value - row.capitalValue) >= 0 ? 'success.main' : 'error.main',
                          // Use extra small on very small screens
                          '@media (max-width: 600px)': {
                            fontSize: '0.5rem !important',
                            lineHeight: '1.1 !important'
                          }
                        }}
                      >
                        {t('report.columns.pnl')}: {formatCurrency(value - row.capitalValue, baseCurrency)}
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
