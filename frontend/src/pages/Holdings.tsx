/**
 * Holdings page component - Shows investor holdings for the current account
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
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
  alpha,
  useTheme,
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
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import { useInvestorHoldings } from '../hooks/useInvestorHoldings';
import { useAccount } from '../contexts/AccountContext';
import { formatCurrency, formatPercentage, formatNumberWithSeparators } from '../utils/format';
import HoldingDetailModal from '../components/Holdings/HoldingDetailModal';
import ResponsiveTypography from '../components/Common/ResponsiveTypography';

const Holdings: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { accountId } = useAccount();
  const { holdings, isLoading, error, refetch } = useInvestorHoldings(accountId);

  // Modal state
  const [selectedHoldingId, setSelectedHoldingId] = useState<string | null>(null);
  const [selectedHoldingName, setSelectedHoldingName] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calculate summary metrics
  const totalHoldings = holdings.length;
  const totalInvestment = holdings.reduce((sum, holding) => sum + Number(holding.totalInvestment), 0);
  const totalCurrentValue = holdings.reduce((sum, holding) => sum + Number(holding.currentValue), 0);
  const totalUnrealizedPnL = holdings.reduce((sum, holding) => sum + Number(holding.unrealizedPnL), 0);
  const totalRealizedPnL = holdings.reduce((sum, holding) => sum + Number(holding.realizedPnL), 0);
  const totalPnL = totalUnrealizedPnL + totalRealizedPnL;
  const totalReturnPercentage = totalInvestment > 0 ? (totalPnL / totalInvestment) * 100 : 0;

  // Determine display currency (use first holding's portfolio currency or VND as default)
  const displayCurrency = holdings.find(h => h.portfolio?.baseCurrency)?.portfolio?.baseCurrency || 'VND';

  const handleViewPortfolio = (portfolioId: string) => {
    navigate(`/portfolios/${portfolioId}`);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleViewHoldingDetail = (holdingId: string, holdingName: string) => {
    setSelectedHoldingId(holdingId);
    setSelectedHoldingName(holdingName);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedHoldingId(null);
    setSelectedHoldingName('');
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
        <ResponsiveTypography variant="pageSubtitle" sx={{ mt: 2 }}>
          Loading your investment holdings...
        </ResponsiveTypography>
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
        <ResponsiveTypography variant="cardTitle" gutterBottom>
          Failed to load holdings data
        </ResponsiveTypography>
        <ResponsiveTypography variant="formHelper">
          {error}
        </ResponsiveTypography>
        <ResponsiveButton onClick={handleRefresh} mobileText="Try Again" desktopText="Try Again" sx={{ mt: 1 }}>
          Try Again
        </ResponsiveButton>
      </Alert>
    );
  }

  // Summary metrics cards
  const summaryMetrics = [
    {
      title: 'Total Investment',
      value: formatCurrency(totalInvestment, displayCurrency),
      subtitle: `${totalHoldings} Holding${totalHoldings !== 1 ? 's' : ''}`,
      icon: <AccountBalanceWallet />,
      color: 'primary' as const,
      gradient: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
    },
    {
      title: 'Current Value',
      value: formatCurrency(totalCurrentValue, displayCurrency),
      subtitle: 'Market value',
      icon: <Assessment />,
      color: 'info' as const,
      gradient: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.06)} 0%, ${alpha(theme.palette.info.main, 0.03)} 100%)`,
    },
    {
      title: 'Total P&L',
      value: formatCurrency(totalPnL, displayCurrency),
      subtitle: totalPnL >= 0 ? 'Profitable' : 'Loss',
      icon: totalPnL >= 0 ? <TrendingUp /> : <TrendingDown />,
      color: totalPnL >= 0 ? 'success' as const : 'error' as const,
      gradient: totalPnL >= 0 
        ? `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.06)} 0%, ${alpha(theme.palette.success.main, 0.03)} 100%)`
        : `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.06)} 0%, ${alpha(theme.palette.error.main, 0.03)} 100%)`,
    },
    {
      title: 'Total Return',
      value: formatPercentage(totalReturnPercentage),
      subtitle: 'Performance',
      icon: <MonetizationOn />,
      color: 'secondary' as const,
      gradient: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.06)} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
    },
  ];

  return (
    <Box>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <ResponsiveTypography 
                variant="pageHeader" 
                component="h1" 
                sx={{ 
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
              >
                Investment Holdings
              </ResponsiveTypography>
              <ResponsiveTypography variant="pageSubtitle">
                Your investment portfolio holdings and performance
              </ResponsiveTypography>
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
          {summaryMetrics.map((metric, index) => (
            <Grid item xs={12} sm={6} lg={3} key={index}>
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {metric.title === 'Total P&L' && totalPnL >= 0 && <ArrowUpward sx={{ color: 'success.main', fontSize: 20 }} />}
                        {metric.title === 'Total P&L' && totalPnL < 0 && <ArrowDownward sx={{ color: 'error.main', fontSize: 20 }} />}
                      </Box>
                    </Box>
                    
                    <ResponsiveTypography 
                      variant="cardValueLarge" 
                      sx={{ 
                        color: 'text.primary',
                        mb: 0.5,
                        lineHeight: 1.2
                      }}
                    >
                      {metric.value}
                    </ResponsiveTypography>
                    
                    <ResponsiveTypography 
                      variant="cardTitle" 
                      sx={{ 
                        mb: 0.5,
                        color: 'text.secondary'
                      }}
                    >
                      {metric.title}
                    </ResponsiveTypography>
                    
                    <ResponsiveTypography 
                      variant="cardLabel" 
                      sx={{ 
                        opacity: 0.8
                      }}
                    >
                      {metric.subtitle}
                    </ResponsiveTypography>
                  </CardContent>
                </Card>
            </Grid>
          ))}
        </Grid>

        {/* Holdings Table Section */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <ResponsiveTypography variant="pageTitle" component="h2" sx={{ mb: 1 }}>
                Investment Holdings
              </ResponsiveTypography>
              <ResponsiveTypography variant="pageSubtitle">
                Detailed view of your investment holdings across all portfolios
              </ResponsiveTypography>
            </Box>
          </Box>
          
          {holdings.length === 0 ? (
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
                <AccountBalance sx={{ fontSize: 80, color: 'primary.main' }} />
              </Box>
              <ResponsiveTypography variant="pageTitle" sx={{ mb: 2, color: 'text.primary' }}>
                No Holdings Found
              </ResponsiveTypography>
              <ResponsiveTypography variant="pageSubtitle" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
                You don't have any investment holdings yet. Start investing by subscribing to available funds.
              </ResponsiveTypography>
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
                        <TableCell><ResponsiveTypography variant="tableCell" sx={{ fontWeight: 600 }}>Portfolio</ResponsiveTypography></TableCell>
                        <TableCell><ResponsiveTypography variant="tableCell" sx={{ fontWeight: 600 }}>Units</ResponsiveTypography></TableCell>
                        <TableCell><ResponsiveTypography variant="tableCell" sx={{ fontWeight: 600 }}>Avg Cost/Unit</ResponsiveTypography></TableCell>
                        <TableCell><ResponsiveTypography variant="tableCell" sx={{ fontWeight: 600 }}>Total Investment</ResponsiveTypography></TableCell>
                        <TableCell><ResponsiveTypography variant="tableCell" sx={{ fontWeight: 600 }}>Current Value</ResponsiveTypography></TableCell>
                        <TableCell><ResponsiveTypography variant="tableCell" sx={{ fontWeight: 600 }}>Unrealized P&L</ResponsiveTypography></TableCell>
                        <TableCell><ResponsiveTypography variant="tableCell" sx={{ fontWeight: 600 }}>Realized P&L</ResponsiveTypography></TableCell>
                        <TableCell><ResponsiveTypography variant="tableCell" sx={{ fontWeight: 600 }}>Return %</ResponsiveTypography></TableCell>
                        <TableCell><ResponsiveTypography variant="tableCell" sx={{ fontWeight: 600 }}>Actions</ResponsiveTypography></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {holdings.map((holding) => {
                        const totalReturn = Number(holding.totalInvestment) > 0 
                          ? ((Number(holding.currentValue) - Number(holding.totalInvestment)) / Number(holding.totalInvestment)) * 100 
                          : 0;
                        
                        return (
                          <TableRow
                            key={holding.holdingId} 
                              sx={{ 
                                cursor: 'pointer',
                                '&:hover': { 
                                  backgroundColor: alpha(theme.palette.primary.main, 0.02) 
                                } 
                              }}
                              onClick={() => handleViewHoldingDetail(holding.holdingId, holding.portfolio?.name || 'Unknown Portfolio')}
                            >
                              <TableCell>
                                <Box>
                                  <ResponsiveTypography variant="tableCell" sx={{ fontWeight: 600 }}>
                                    {holding.portfolio?.name || 'Unknown Portfolio'}
                                  </ResponsiveTypography>
                                  <ResponsiveTypography variant="formHelper">
                                    {holding.portfolio?.baseCurrency || 'VND'}
                                  </ResponsiveTypography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <ResponsiveTypography variant="tableCell" sx={{ fontWeight: 500 }}>
                                  {formatNumberWithSeparators(Number(holding.totalUnits), 3)}
                                </ResponsiveTypography>
                              </TableCell>
                              <TableCell>
                                <ResponsiveTypography variant="tableCell">
                                  {formatCurrency(Number(holding.avgCostPerUnit), displayCurrency)}
                                </ResponsiveTypography>
                              </TableCell>
                              <TableCell>
                                <ResponsiveTypography variant="tableCell" sx={{ fontWeight: 500 }}>
                                  {formatCurrency(Number(holding.totalInvestment), displayCurrency)}
                                </ResponsiveTypography>
                              </TableCell>
                              <TableCell>
                                <ResponsiveTypography variant="tableCell" sx={{ fontWeight: 500 }}>
                                  {formatCurrency(Number(holding.currentValue), displayCurrency)}
                                </ResponsiveTypography>
                              </TableCell>
                              <TableCell>
                                <ResponsiveTypography 
                                  variant="tableCell" 
                                  sx={{ 
                                    fontWeight: 500,
                                    color: Number(holding.unrealizedPnL) >= 0 ? 'success.main' : 'error.main'
                                  }}
                                >
                                  {formatCurrency(Number(holding.unrealizedPnL), displayCurrency)}
                                </ResponsiveTypography>
                              </TableCell>
                              <TableCell>
                                <ResponsiveTypography 
                                  variant="tableCell" 
                                  sx={{ 
                                    fontWeight: 500,
                                    color: Number(holding.realizedPnL) >= 0 ? 'success.main' : 'error.main'
                                  }}
                                >
                                  {formatCurrency(Number(holding.realizedPnL), displayCurrency)}
                                </ResponsiveTypography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={formatPercentage(totalReturn)}
                                  color={totalReturn >= 0 ? 'success' : 'error'}
                                  size="small"
                                  sx={{ fontWeight: 600 }}
                                />
                              </TableCell>
                              <TableCell>
                                <Tooltip title="View Portfolio">
                                  <IconButton
                                    onClick={() => handleViewPortfolio(holding.portfolioId)}
                                    size="small"
                                    sx={{ color: 'primary.main' }}
                                  >
                                    <Visibility />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Holding Detail Modal */}
        <HoldingDetailModal
          open={isModalOpen}
          onClose={handleCloseModal}
          holdingId={selectedHoldingId}
          holdingName={selectedHoldingName}
        />
      </Box>
  );
};

export default Holdings;
