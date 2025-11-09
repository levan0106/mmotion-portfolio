import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Grid,
  Card,
  CardContent,
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
  useMediaQuery,
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
import ResponsiveTable from '../components/Common/ResponsiveTable';

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
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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

  // Removed inline DataTable in favor of shared ResponsiveTable

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
            }}
            ellipsis={false}>
              {t('report.title')}
            </ResponsiveTypography>
          </Box>
          <Box sx={{ ml: 2 }}>
            <FormControl sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { height: '40px' } }}>
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
        {!isMobile && ( <ResponsiveTypography variant="pageSubtitle">
          {t('report.subtitle')}
        </ResponsiveTypography> )}
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
              <Box sx={{background: 'white', borderRadius:2}}>
                <Box sx={{ p: 2}}>
                  <ResponsiveTypography variant="chartTitle">
                    {t('report.cashBalance.byFundingSource')}
                  </ResponsiveTypography>
                </Box>
                <ResponsiveTable
                  data={reportData.cashBalance.byFundingSource}
                  columns={[
                    {
                      key: 'source',
                      header: t('report.columns.fundingSource'),
                    },
                    {
                      key: 'total',
                      header: t('report.columns.totalAmount'),
                      align: 'right',
                      render: (row: any) => (
                        <ResponsiveTypography 
                          variant="tableCell" 
                          sx={{ 
                            color: Number(row.total) >= 0 ? 'success.main' : 'error.main',
                            '@media (max-width: 600px)': {
                              lineHeight: '1.1 !important'
                            }
                          }}
                        >
                          {formatCurrency(row.total, baseCurrency)}
                        </ResponsiveTypography>
                      )
                    },
                    {
                      key: 'percentage',
                      header: t('report.columns.share'),
                      align: 'right',
                      render: (row: any) => (
                        <Chip
                          label={formatPercentageValue(row.percentage, 1)}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontSize: '0.65rem' }}
                        />
                      )
                    },
                  ]}
                />
              </Box>
            </Box>
          </Box>
        </Grid>

        {/* Column 2: Deposits */}
        <Grid item xs={12} md={4}>
          <Box sx={{ p: 0.2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            
            <Box sx={{ mb: 3, height: '180px', display: 'flex', alignItems: 'stretch'}}>
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
              <Box sx={{background: 'white', borderRadius:2}}>
                <Box sx={{ p: 2}}>
                  <ResponsiveTypography variant="chartTitle">
                    {t('report.deposits.byBank')}
                  </ResponsiveTypography>
                </Box>
              <ResponsiveTable
                data={reportData.deposits.byExchange}
                columns={[
                  { key: 'exchange', header: t('report.columns.bank') },
                  { 
                    key: 'count', 
                    header: t('report.columns.count'), 
                    align: 'right',
                    render: (row: any) => (
                      <ResponsiveTypography 
                        variant="tableCell" 
                        sx={{ 
                          '@media (max-width: 600px)': {
                            lineHeight: '1.1 !important'
                          }
                        }}
                      >
                        {formatNumber(row.count, 0)}
                      </ResponsiveTypography>
                    )
                  },
                  { 
                    key: 'total', 
                    header: t('report.columns.value'), 
                    align: 'right',
                    render: (row: any) => (
                      <ResponsiveTypography 
                        variant="tableCell" 
                        sx={{ 
                          color: Number(row.total) >= 0 ? 'success.main' : 'error.main',
                          '@media (max-width: 600px)': {
                            lineHeight: '1.1 !important'
                          }
                        }}
                      >
                        {formatCurrency(row.total, baseCurrency)}
                      </ResponsiveTypography>
                    )
                  },
                  { 
                    key: 'percentage', 
                    header: t('report.columns.share'), 
                    align: 'right',
                    render: (row: any) => (
                      <Chip
                        label={formatPercentageValue(row.percentage, 1)}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    )
                  },
                ]}
              />
              </Box>

              <Box sx={{background: 'white', borderRadius:2, mt: 3}}>
                <Box sx={{ p: 2}}>
                  <ResponsiveTypography variant="chartTitle">
                    {t('report.deposits.byTerm')}
                  </ResponsiveTypography>
                </Box>
              <ResponsiveTable
                data={reportData.deposits.byFundingSource}
                columns={[
                  { key: 'source', header: t('report.columns.term') },
                  { 
                    key: 'count', 
                    header: t('report.columns.count'), 
                    align: 'right',
                    render: (row: any) => (
                      <ResponsiveTypography 
                        variant="tableCell" 
                        sx={{ 
                          '@media (max-width: 600px)': {
                            lineHeight: '1.1 !important'
                          }
                        }}
                      >
                        {formatNumber(row.count, 0)}
                      </ResponsiveTypography>
                    )
                  },
                  { 
                    key: 'total', 
                    header: t('report.columns.value'), 
                    align: 'right',
                    render: (row: any) => (
                      <ResponsiveTypography 
                        variant="tableCell" 
                        sx={{ 
                          color: Number(row.total) >= 0 ? 'success.main' : 'error.main',
                          '@media (max-width: 600px)': {
                            lineHeight: '1.1 !important'
                          }
                        }}
                      >
                        {formatCurrency(row.total, baseCurrency)}
                      </ResponsiveTypography>
                    )
                  },
                  { 
                    key: 'percentage', 
                    header: t('report.columns.share'), 
                    align: 'right',
                    render: (row: any) => (
                      <Chip
                        label={formatPercentageValue(row.percentage, 1)}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    )
                  },
                ]}
              />
              </Box>
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
              <Box sx={{background: 'white', borderRadius:2}}>
                <Box sx={{ p: 2}}>
                  <ResponsiveTypography variant="chartTitle">
                    {t('report.assets.byExchange')}
                  </ResponsiveTypography>
                </Box>
              <ResponsiveTable
                data={reportData.assets.byExchange}
                columns={[
                  { key: 'exchange', header: t('report.columns.exchange') },
                  { 
                    key: 'count', 
                    header: t('report.columns.capitalValue'), 
                    align: 'right',
                    render: (row: any) => (
                    <Box>
                      <ResponsiveTypography 
                        variant="tableCell" 
                        sx={{ 
                          color: Number(row.capitalValue) >= 0 ? 'success.main' : 'error.main',
                          '@media (max-width: 600px)': {
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
                          '@media (max-width: 600px)': {
                            lineHeight: '1.1 !important'
                          }
                        }}
                      >
                          {t('report.columns.count')}: {formatNumber(row.count, 0)}
                      </ResponsiveTypography>
                    </Box>
                    )
                  },
                  { 
                    key: 'total', 
                    header: t('report.columns.currentValue'), 
                    align: 'right',
                    render: (row: any) => (
                    <Box>
                      <ResponsiveTypography 
                        variant="tableCell" 
                        sx={{ 
                            color: Number(row.total) >= 0 ? 'success.main' : 'error.main',
                          '@media (max-width: 600px)': {
                            lineHeight: '1.1 !important'
                          }
                        }}
                      >
                          {formatCurrency(row.total, baseCurrency)}
                      </ResponsiveTypography>
                      <ResponsiveTypography 
                        variant="tableCellSmall" 
                        sx={{ 
                            color: Number(row.total - row.capitalValue) >= 0 ? 'success.main' : 'error.main',
                          '@media (max-width: 600px)': {
                            lineHeight: '1.1 !important'
                          }
                        }}
                      >
                          {t('report.columns.pnl')}: {formatCurrency(row.total - row.capitalValue, baseCurrency)}
                      </ResponsiveTypography>
                    </Box>
                  )
                  },
                  { 
                    key: 'percentage', 
                    header: t('report.columns.share'), 
                    align: 'right',
                    render: (row: any) => (
                      <Chip
                        label={formatPercentageValue(row.percentage, 1)}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    )
                  },
                ]}
              />
              </Box>

              <Box sx={{background: 'white', borderRadius:2, mt: 3}}>
                <Box sx={{ p: 2}}>
                  <ResponsiveTypography variant="chartTitle">
                    {t('report.assets.byGroup')}
                  </ResponsiveTypography>
                </Box>
              <ResponsiveTable
                data={reportData.assets.byAssetGroup}
                columns={[
                  { key: 'group', header: t('report.columns.assetGroup') },
                  { 
                    key: 'count', 
                    header: t('report.columns.capitalValue'), 
                    align: 'right',
                    render: (row: any) => (
                    <Box>
                      <ResponsiveTypography 
                        variant="tableCell" 
                        sx={{ 
                          color: Number(row.capitalValue) >= 0 ? 'success.main' : 'error.main',
                          '@media (max-width: 600px)': {
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
                          '@media (max-width: 600px)': {
                            lineHeight: '1.1 !important'
                          }
                        }}
                      >
                          {t('report.columns.count')}: {formatNumber(row.count, 0)}
                      </ResponsiveTypography>
                    </Box>
                    )
                  },
                  { 
                    key: 'total', 
                    header: t('report.columns.currentValue'), 
                    align: 'right',
                    render: (row: any) => (
                    <Box>
                      <ResponsiveTypography 
                        variant="tableCell" 
                        sx={{ 
                            color: Number(row.total) >= 0 ? 'success.main' : 'error.main',
                          '@media (max-width: 600px)': {
                            lineHeight: '1.1 !important'
                          }
                        }}
                      >
                          {formatCurrency(row.total, baseCurrency)}
                      </ResponsiveTypography>
                      <ResponsiveTypography 
                        variant="tableCellSmall" 
                        sx={{ 
                            color: Number(row.total - row.capitalValue) >= 0 ? 'success.main' : 'error.main',
                          '@media (max-width: 600px)': {
                            lineHeight: '1.1 !important'
                          }
                        }}
                      >
                          {t('report.columns.pnl')}: {formatCurrency(row.total - row.capitalValue, baseCurrency)}
                      </ResponsiveTypography>
                    </Box>
                  )
                  },
                  { 
                    key: 'percentage', 
                    header: t('report.columns.share'), 
                    align: 'right',
                    render: (row: any) => (
                      <Chip
                        label={formatPercentageValue(row.percentage, 1)}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    )
                  },
                ]}
              />
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Report;
