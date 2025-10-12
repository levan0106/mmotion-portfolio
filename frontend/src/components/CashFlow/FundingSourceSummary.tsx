import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Divider,
  Alert,
  Skeleton,
  Button,
  ButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import {
  AccountBalance as BankIcon,
  AccountBalanceWallet as WalletIcon,
  Business as BusinessIcon,
  CreditCard as CreditCardIcon,
  Savings as SavingsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/format';

interface CashFlow {
  cashflowId: string;
  type: string;
  amount: number;
  description: string;
  reference?: string;
  status: string;
  flowDate: string;
  currency?: string;
  fundingSource?: string;
  createdAt: string;
  updatedAt: string;
}

interface FundingSourceSummaryProps {
  cashFlows: CashFlow[];
  loading?: boolean;
  isCompactMode?: boolean;
  getUltraSpacing?: (normal: number, ultra: number) => number;
}

interface FundingSourceData {
  source: string;
  totalInflow: number;
  totalOutflow: number;
  netAmount: number;
  transactionCount: number;
  lastTransactionDate: string;
}

const FundingSourceSummary: React.FC<FundingSourceSummaryProps> = ({
  cashFlows,
  loading = false,
  isCompactMode = false,
  getUltraSpacing = (normal) => normal,
}) => {
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('list');
  // Calculate funding source summary data
  const calculateFundingSourceData = (): FundingSourceData[] => {
    const sourceMap = new Map<string, {
      totalInflow: number;
      totalOutflow: number;
      transactionCount: number;
      lastTransactionDate: string;
    }>();

    // Process all completed cash flows
    const completedCashFlows = cashFlows.filter(cf => cf.status === 'COMPLETED');
    
    completedCashFlows.forEach(cf => {
      const source = cf.fundingSource || 'UNKNOWN';
      const isInflow = ['DEPOSIT', 'DIVIDEND', 'INTEREST', 'SELL_TRADE', 'DEPOSIT_SETTLEMENT'].includes(cf.type);
      
      if (!sourceMap.has(source)) {
        sourceMap.set(source, {
          totalInflow: 0,
          totalOutflow: 0,
          transactionCount: 0,
          lastTransactionDate: cf.flowDate,
        });
      }

      const sourceData = sourceMap.get(source)!;
      sourceData.transactionCount += 1;
      
      if (isInflow) {
        sourceData.totalInflow += Math.abs(cf.amount);
      } else {
        sourceData.totalOutflow += Math.abs(cf.amount);
      }
      
      // Update last transaction date
      if (new Date(cf.flowDate) > new Date(sourceData.lastTransactionDate)) {
        sourceData.lastTransactionDate = cf.flowDate;
      }
    });

    // Convert to array and calculate net amounts
    return Array.from(sourceMap.entries()).map(([source, data]) => ({
      source,
      totalInflow: data.totalInflow,
      totalOutflow: data.totalOutflow,
      netAmount: data.totalInflow - data.totalOutflow,
      transactionCount: data.transactionCount,
      lastTransactionDate: data.lastTransactionDate,
    })).sort((a, b) => Math.abs(b.netAmount) - Math.abs(a.netAmount)); // Sort by absolute net amount
  };

  const fundingSourceData = calculateFundingSourceData();

  // Get icon for funding source
  const getFundingSourceIcon = (source: string) => {
    const lowerSource = source.toLowerCase();
    if (lowerSource.includes('bank') || lowerSource.includes('vietcombank') || lowerSource.includes('vcb')) {
      return <BankIcon />;
    } else if (lowerSource.includes('wallet') || lowerSource.includes('cash')) {
      return <WalletIcon />;
    } else if (lowerSource.includes('business') || lowerSource.includes('company')) {
      return <BusinessIcon />;
    } else if (lowerSource.includes('card') || lowerSource.includes('credit')) {
      return <CreditCardIcon />;
    } else if (lowerSource.includes('savings') || lowerSource.includes('deposit')) {
      return <SavingsIcon />;
    } else {
      return <WalletIcon />;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Box sx={{ mb: getUltraSpacing(3, 1.5) }}>
        <Typography 
          variant={isCompactMode ? "h6" : "h5"} 
          gutterBottom 
          sx={{ 
            fontWeight: 600, 
            color: '#4a5568', 
            mb: getUltraSpacing(2, 1),
            fontSize: isCompactMode ? '0.9rem' : undefined,
          }}
        >
          Funding Source Summary
        </Typography>
        <Grid container spacing={getUltraSpacing(2, 1)}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card>
                <CardContent>
                  <Skeleton variant="rectangular" height={60} />
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (fundingSourceData.length === 0) {
    return (
      <Box sx={{ mb: getUltraSpacing(3, 1.5) }}>
        <Typography 
          variant={isCompactMode ? "h6" : "h5"} 
          gutterBottom 
          sx={{ 
            fontWeight: 600, 
            color: '#4a5568', 
            mb: getUltraSpacing(2, 1),
            fontSize: isCompactMode ? '0.9rem' : undefined,
          }}
        >
          Funding Source Summary
        </Typography>
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          <Typography variant="body2">
            No funding source data available. Add funding sources to your cash flows to see the summary.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: getUltraSpacing(4, 2) }}>
      <Card sx={{ 
        background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
        border: '0.5px solid rgba(160, 174, 192, 0.1)',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',
        borderRadius: 2,
        overflow: 'hidden'
      }}>
        <CardContent sx={{ 
          px: isCompactMode ? 2 : 3, 
          py: isCompactMode ? 1.5 : 3 
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: getUltraSpacing(3, 1.5),
            pb: isCompactMode ? 1 : 2,
            borderBottom: '1px solid rgba(160, 174, 192, 0.08)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: isCompactMode ? 1 : 2 }}>
              <Box sx={{ 
                p: isCompactMode ? 1 : 1.5, 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #4a5568 0%, #718096 100%)',
                boxShadow: '0 4px 12px rgba(74, 85, 104, 0.2)',
                width: isCompactMode ? 36 : 48,
                height: isCompactMode ? 36 : 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <WalletIcon sx={{ color: 'white', fontSize: isCompactMode ? 18 : 24 }} />
              </Box>
              <Box>
                <Typography 
                  variant={isCompactMode ? "subtitle1" : "h5"} 
                  sx={{ 
                    fontWeight: 500, 
                    color: '#4a5568',
                    fontSize: isCompactMode ? '0.9rem' : '1.4rem',
                    letterSpacing: '-0.01em'
                  }}
                >
                  Funding Source Summary
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: isCompactMode ? '0.7rem' : undefined }}
                >
                  Track cash flows by funding source
                </Typography>
              </Box>
            </Box>
            
            <ButtonGroup 
              size={isCompactMode ? "small" : "small"} 
              variant="outlined"
              sx={{
                '& .MuiButton-root': {
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 400,
                  px: isCompactMode ? 1 : 2,
                  py: isCompactMode ? 0.5 : 1,
                  fontSize: isCompactMode ? '0.7rem' : undefined,
                  borderColor: 'rgba(160, 174, 192, 0.25)',
                  '&:hover': {
                    borderColor: '#4a5568',
                    backgroundColor: 'rgba(74, 85, 104, 0.05)'
                  }
                }
              }}
            >
              <Button
                startIcon={<GridViewIcon />}
                onClick={() => setViewMode('grid')}
                variant={viewMode === 'grid' ? 'contained' : 'outlined'}
                sx={{
                  backgroundColor: viewMode === 'grid' ? '#4a5568' : 'transparent',
                  color: viewMode === 'grid' ? 'white' : '#718096',
                  '&:hover': {
                    backgroundColor: viewMode === 'grid' ? '#4a5568 !important' : 'transparent !important',
                    color: viewMode === 'grid' ? 'white !important' : '#718096 !important',
                    transform: 'none !important',
                    boxShadow: 'none !important'
                  }
                }}
              >
                {isCompactMode ? "Grid" : "Grid View"}
              </Button>
              <Button
                startIcon={<ListViewIcon />}
                onClick={() => setViewMode('list')}
                variant={viewMode === 'list' ? 'contained' : 'outlined'}
                sx={{
                  backgroundColor: viewMode === 'list' ? '#4a5568' : 'transparent',
                  color: viewMode === 'list' ? 'white' : '#718096',
                  '&:hover': {
                    backgroundColor: viewMode === 'list' ? '#4a5568 !important' : 'transparent !important',
                    color: viewMode === 'list' ? 'white !important' : '#718096 !important',
                    transform: 'none !important',
                    boxShadow: 'none !important'
                  }
                }}
              >
                {isCompactMode ? "List" : "List View"}
              </Button>
            </ButtonGroup>
          </Box>
      
      {viewMode === 'grid' ? (
        <Grid container spacing={getUltraSpacing(2, 1)}>
          {fundingSourceData.map((sourceData) => (
            <Grid item xs={12} sm={6} md={4} key={sourceData.source}>
              <Card 
                sx={{ 
                  height: '100%',
                  background: sourceData.netAmount >= 0 
                    ? 'linear-gradient(135deg, #e8f5e8 0%, #f1f8e9 100%)'
                    : 'linear-gradient(135deg, #ffebee 0%, #fce4ec 100%)',
                  border: `1px solid ${sourceData.netAmount >= 0 ? '#c8e6c9' : '#ffcdd2'}`,
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                  }
                }}
              >
                <CardContent sx={{ p: getUltraSpacing(2, 1.5) }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: getUltraSpacing(1.5, 1) }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: sourceData.netAmount >= 0 ? 'success.main' : 'error.main',
                        mr: 1,
                        width: isCompactMode ? 32 : 40,
                        height: isCompactMode ? 32 : 40,
                      }}
                    >
                      {getFundingSourceIcon(sourceData.source)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant={isCompactMode ? "body2" : "body1"} 
                        fontWeight="bold" 
                        noWrap
                        sx={{ 
                          color: '#4a5568',
                          fontSize: isCompactMode ? '0.8rem' : undefined,
                        }}
                      >
                        {sourceData.source}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ fontSize: isCompactMode ? '0.7rem' : undefined }}
                      >
                        {sourceData.transactionCount} transactions
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ mb: getUltraSpacing(1.5, 1) }} />

                  {/* Net Amount */}
                  <Box sx={{ mb: getUltraSpacing(1, 0.5) }}>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ fontSize: isCompactMode ? '0.7rem' : undefined }}
                    >
                      Net Amount
                    </Typography>
                    <Typography 
                      variant={isCompactMode ? "h6" : "h5"} 
                      fontWeight="bold"
                      sx={{ 
                        color: sourceData.netAmount >= 0 ? 'success.main' : 'error.main',
                        fontSize: isCompactMode ? '1rem' : undefined,
                      }}
                    >
                      {formatCurrency(sourceData.netAmount)}
                    </Typography>
                  </Box>

                  {/* Inflow/Outflow */}
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                          <TrendingUpIcon sx={{ color: 'success.main', fontSize: isCompactMode ? 16 : 20, mr: 0.5 }} />
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ fontSize: isCompactMode ? '0.7rem' : undefined }}
                          >
                            Inflow
                          </Typography>
                        </Box>
                        <Typography 
                          variant={isCompactMode ? "body2" : "body1"} 
                          fontWeight="bold"
                          color="success.main"
                          sx={{ fontSize: isCompactMode ? '0.8rem' : undefined }}
                        >
                          {formatCurrency(sourceData.totalInflow)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                          <TrendingDownIcon sx={{ color: 'error.main', fontSize: isCompactMode ? 16 : 20, mr: 0.5 }} />
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ fontSize: isCompactMode ? '0.7rem' : undefined }}
                          >
                            Outflow
                          </Typography>
                        </Box>
                        <Typography 
                          variant={isCompactMode ? "body2" : "body1"} 
                          fontWeight="bold"
                          color="error.main"
                          sx={{ fontSize: isCompactMode ? '0.8rem' : undefined }}
                        >
                          {formatCurrency(sourceData.totalOutflow)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Last Transaction */}
                  <Box sx={{ mt: getUltraSpacing(1, 0.5), pt: getUltraSpacing(1, 0.5), borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ fontSize: isCompactMode ? '0.7rem' : undefined }}
                    >
                      Last Transaction: {formatDate(sourceData.lastTransactionDate)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell><strong>Funding Source</strong></TableCell>
                <TableCell align="right"><strong>Net Amount</strong></TableCell>
                <TableCell align="right"><strong>Inflow</strong></TableCell>
                <TableCell align="right"><strong>Outflow</strong></TableCell>
                <TableCell align="center"><strong>Transactions</strong></TableCell>
                <TableCell><strong>Last Transaction</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fundingSourceData.map((sourceData) => (
                <TableRow key={sourceData.source} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: sourceData.netAmount >= 0 ? 'success.main' : 'error.main',
                          mr: 2,
                          width: 32,
                          height: 32,
                        }}
                      >
                        {getFundingSourceIcon(sourceData.source)}
                      </Avatar>
                      <Typography variant="body2" fontWeight="bold">
                        {sourceData.source}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color={sourceData.netAmount >= 0 ? 'success.main' : 'error.main'}
                    >
                      {formatCurrency(sourceData.netAmount)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="success.main" fontWeight="bold">
                      {formatCurrency(sourceData.totalInflow)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="error.main" fontWeight="bold">
                      {formatCurrency(sourceData.totalOutflow)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={sourceData.transactionCount}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(sourceData.lastTransactionDate)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default FundingSourceSummary;
