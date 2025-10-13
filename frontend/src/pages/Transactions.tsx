/**
 * Transactions page component - Shows all transactions for the current account
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  alpha,
  useTheme,
  Fade,
  Slide,
  InputAdornment,
} from '@mui/material';
import { ResponsiveButton } from '../components/Common';
import {
  AccountBalanceWallet,
  TrendingUp,
  TrendingDown,
  Refresh,
  Visibility,
  Assessment,
  MonetizationOn,
  AccountBalance,
  Search,
} from '@mui/icons-material';
import { useTransactions } from '../hooks/useTransactions';
import { formatCurrency, formatNumberWithSeparators } from '../utils/format';
import { format, parseISO } from 'date-fns';

const Transactions: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { transactions, isLoading, error, refetch } = useTransactions();

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [portfolioFilter, setPortfolioFilter] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<string>('ALL');

  // Get unique portfolios for filter
  const uniquePortfolios = useMemo(() => {
    const portfolios = transactions.map(t => ({ id: t.portfolioId, name: t.portfolioName }));
    return portfolios.filter((portfolio, index, self) => 
      index === self.findIndex(p => p.id === portfolio.id)
    );
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Search filter
      const matchesSearch = 
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.assetSymbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.assetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.portfolioName.toLowerCase().includes(searchTerm.toLowerCase());

      // Type filter
      const matchesType = typeFilter === 'ALL' || transaction.type === typeFilter;

      // Portfolio filter
      const matchesPortfolio = portfolioFilter === 'ALL' || transaction.portfolioId === portfolioFilter;

      // Date range filter
      let matchesDate = true;
      if (dateRange !== 'ALL') {
        const transactionDate = new Date(transaction.date);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (dateRange) {
          case '7D':
            matchesDate = daysDiff <= 7;
            break;
          case '30D':
            matchesDate = daysDiff <= 30;
            break;
          case '90D':
            matchesDate = daysDiff <= 90;
            break;
          case '1Y':
            matchesDate = daysDiff <= 365;
            break;
        }
      }

      return matchesSearch && matchesType && matchesPortfolio && matchesDate;
    });
  }, [transactions, searchTerm, typeFilter, portfolioFilter, dateRange]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const totalTransactions = filteredTransactions.length;
    const totalAmount = filteredTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const tradeCount = filteredTransactions.filter(t => t.type === 'TRADE').length;
    const cashFlowCount = filteredTransactions.filter(t => t.type === 'CASH_FLOW').length;
    const fundUnitCount = filteredTransactions.filter(t => t.type === 'FUND_UNIT').length;

    return {
      totalTransactions,
      totalAmount,
      tradeCount,
      cashFlowCount,
      fundUnitCount,
    };
  }, [filteredTransactions]);

  const handleViewPortfolio = (portfolioId: string) => {
    navigate(`/portfolios/${portfolioId}`);
  };

  const handleRefresh = () => {
    refetch();
  };

  const getTransactionIcon = (transaction: any) => {
    switch (transaction.type) {
      case 'TRADE':
        return transaction.side === 'BUY' ? <TrendingUp /> : <TrendingDown />;
      case 'CASH_FLOW':
        return <AccountBalance />;
      case 'FUND_UNIT':
        return <AccountBalanceWallet />;
      default:
        return <Assessment />;
    }
  };

  const getTransactionColor = (transaction: any): 'success' | 'error' | 'info' | 'primary' => {
    switch (transaction.type) {
      case 'TRADE':
        return transaction.side === 'BUY' ? 'success' : 'error';
      case 'CASH_FLOW':
        return transaction.amount > 0 ? 'success' : 'error';
      case 'FUND_UNIT':
        return 'info';
      default:
        return 'primary';
    }
  };

  const getTransactionTypeLabel = (transaction: any) => {
    switch (transaction.type) {
      case 'TRADE':
        return `${transaction.side} ${transaction.assetSymbol || 'Asset'}`;
      case 'CASH_FLOW':
        return transaction.cashFlowType || 'Cash Flow';
      case 'FUND_UNIT':
        return 'Fund Unit Transaction';
      default:
        return 'Transaction';
    }
  };

  if (isLoading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
        sx={{ 
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
          borderRadius: 3,
          p: 4
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
          Loading your transactions...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ 
          mb: 2,
          borderRadius: 2,
          '& .MuiAlert-message': {
            fontSize: '1rem'
          }
        }}
      >
        <Typography variant="h6" gutterBottom>
          Failed to load transactions
        </Typography>
        <Typography variant="body2">
          {error}
        </Typography>
        <ResponsiveButton onClick={handleRefresh} mobileText="Try Again" desktopText="Try Again" sx={{ mt: 1 }}>
          Try Again
        </ResponsiveButton>
      </Alert>
    );
  }

  // Summary metrics cards
  const metricsCards = [
    {
      title: 'Total Transactions',
      value: summaryMetrics.totalTransactions.toLocaleString(),
      subtitle: 'All transaction types',
      icon: <Assessment />,
      color: 'primary' as const,
      gradient: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
    },
    {
      title: 'Total Amount',
      value: formatCurrency(summaryMetrics.totalAmount, 'VND'),
      subtitle: 'Absolute transaction value',
      icon: <MonetizationOn />,
      color: 'info' as const,
      gradient: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.06)} 0%, ${alpha(theme.palette.info.main, 0.03)} 100%)`,
    },
    {
      title: 'Trading Transactions',
      value: summaryMetrics.tradeCount.toLocaleString(),
      subtitle: 'Buy/Sell trades',
      icon: <TrendingUp />,
      color: 'success' as const,
      gradient: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.06)} 0%, ${alpha(theme.palette.success.main, 0.03)} 100%)`,
    },
    {
      title: 'Cash Flows',
      value: summaryMetrics.cashFlowCount.toLocaleString(),
      subtitle: 'Cash transactions',
      icon: <AccountBalance />,
      color: 'secondary' as const,
      gradient: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.06)} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
    },
  ];

  return (
    <Fade in timeout={800}>
      <Box>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography 
                variant="h3" 
                component="h1" 
                sx={{ 
                  fontWeight: 300,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
              >
                Transaction History
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 300 }}>
                Complete transaction history across all your portfolios
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <ResponsiveButton
                variant="outlined"
                icon={<Refresh />}
                onClick={handleRefresh}
                mobileText="Refresh"
                desktopText="Refresh"
                sx={{ borderRadius: 2 }}
              >
                Refresh
              </ResponsiveButton>
            </Box>
          </Box>
        </Box>

        {/* Summary Metrics Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {metricsCards.map((metric, index) => (
            <Grid item xs={12} sm={6} lg={3} key={index}>
              <Slide direction="up" in timeout={600 + index * 100}>
                <Card 
                  sx={{ 
                    height: '100%',
                    background: metric.gradient,
                    border: `0.5px solid ${alpha(theme.palette[metric.color].main, 0.15)}`,
                    borderRadius: 2,
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette[metric.color].main, 0.1)}`,
                      border: `0.5px solid ${alpha(theme.palette[metric.color].main, 0.2)}`,
                    }
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                      <Box
                        sx={{
                          borderRadius: '50%',
                          background: alpha(theme.palette[metric.color].main, 0.08),
                          color: `${metric.color}.main`,
                          width: 36,
                          height: 36,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: `0 2px 4px ${alpha(theme.palette[metric.color].main, 0.15)}`,
                        }}
                      >
                        {React.cloneElement(metric.icon, { sx: { fontSize: 20 } })}
                      </Box>
                    </Box>
                    
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontWeight: 600,
                        color: 'text.primary',
                        mb: 0.5,
                        lineHeight: 1.2
                      }}
                    >
                      {metric.value}
                    </Typography>
                    
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: 'text.secondary',
                        fontWeight: 500,
                        mb: 0.5
                      }}
                    >
                      {metric.title}
                    </Typography>
                    
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'text.secondary',
                        opacity: 0.8,
                        fontWeight: 400
                      }}
                    >
                      {metric.subtitle}
                    </Typography>
                  </CardContent>
                </Card>
              </Slide>
            </Grid>
          ))}
        </Grid>

        {/* Filters Section */}
        <Card sx={{ mb: 3, borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Filters & Search
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ borderRadius: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    label="Type"
                  >
                    <MenuItem value="ALL">All Types</MenuItem>
                    <MenuItem value="TRADE">Trades</MenuItem>
                    <MenuItem value="CASH_FLOW">Cash Flows</MenuItem>
                    <MenuItem value="FUND_UNIT">Fund Units</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Portfolio</InputLabel>
                  <Select
                    value={portfolioFilter}
                    onChange={(e) => setPortfolioFilter(e.target.value)}
                    label="Portfolio"
                  >
                    <MenuItem value="ALL">All Portfolios</MenuItem>
                    {uniquePortfolios.map((portfolio) => (
                      <MenuItem key={portfolio.id} value={portfolio.id}>
                        {portfolio.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Date Range</InputLabel>
                  <Select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    label="Date Range"
                  >
                    <MenuItem value="ALL">All Time</MenuItem>
                    <MenuItem value="7D">Last 7 Days</MenuItem>
                    <MenuItem value="30D">Last 30 Days</MenuItem>
                    <MenuItem value="90D">Last 90 Days</MenuItem>
                    <MenuItem value="1Y">Last Year</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Transactions Table Section */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" component="h2" sx={{ fontWeight: 300, mb: 1 }}>
                Transaction History
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} found
              </Typography>
            </Box>
          </Box>
          
          {filteredTransactions.length === 0 ? (
            <Card sx={{ 
              p: 6, 
              textAlign: 'center',
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              borderRadius: 3
            }}>
              <Box sx={{ 
                p: 3,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                display: 'inline-flex',
                mb: 3
              }}>
                <Assessment sx={{ fontSize: 80, color: 'primary.main' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 300, mb: 2, color: 'text.primary' }}>
                No Transactions Found
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
                {transactions.length === 0 
                  ? "You don't have any transactions yet. Start by creating trades or adding cash flows to your portfolios."
                  : "No transactions match your current filters. Try adjusting your search criteria."
                }
              </Typography>
            </Card>
          ) : (
            <Card sx={{ 
              borderRadius: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
              border: `0.5px solid ${alpha(theme.palette.divider, 0.08)}`,
              backdropFilter: 'blur(10px)'
            }}>
              <CardContent sx={{ p: 0 }}>
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 0 }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.02) }}>
                        <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Portfolio</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Description</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Amount</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredTransactions.map((transaction, index) => (
                        <Slide direction="up" in timeout={800 + index * 50} key={transaction.id}>
                          <TableRow 
                            sx={{ 
                              '&:hover': { 
                                backgroundColor: alpha(theme.palette.primary.main, 0.02) 
                              } 
                            }}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box
                                  sx={{
                                    borderRadius: '50%',
                                    background: alpha(theme.palette[getTransactionColor(transaction)].main, 0.1),
                                    color: `${getTransactionColor(transaction)}.main`,
                                    width: 32,
                                    height: 32,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  {React.cloneElement(getTransactionIcon(transaction), { sx: { fontSize: 16 } })}
                                </Box>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {getTransactionTypeLabel(transaction)}
                                  </Typography>
                                  <Chip
                                    label={transaction.type}
                                    size="small"
                                    color={getTransactionColor(transaction)}
                                    sx={{ fontSize: '0.7rem', height: 20 }}
                                  />
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                  {transaction.portfolioName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {transaction.currency}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {transaction.description}
                              </Typography>
                              {transaction.assetSymbol && (
                                <Typography variant="body2" color="text.secondary">
                                  {transaction.assetSymbol} {transaction.quantity && `(${formatNumberWithSeparators(transaction.quantity)})`}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography 
                                variant="body1" 
                                sx={{ 
                                  fontWeight: 600,
                                  color: transaction.amount >= 0 ? 'success.main' : 'error.main'
                                }}
                              >
                                {formatCurrency(Math.abs(transaction.amount), transaction.currency)}
                              </Typography>
                              {transaction.price && (
                                <Typography variant="body2" color="text.secondary">
                                  @ {formatCurrency(transaction.price, transaction.currency)}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {format(parseISO(transaction.date), 'MMM dd, yyyy')}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {format(parseISO(transaction.date), 'HH:mm')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Tooltip title="View Portfolio">
                                <IconButton
                                  onClick={() => handleViewPortfolio(transaction.portfolioId)}
                                  size="small"
                                  sx={{ color: 'primary.main' }}
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        </Slide>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
    </Fade>
  );
};

export default Transactions;
