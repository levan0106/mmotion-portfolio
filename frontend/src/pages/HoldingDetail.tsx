import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Container,
  Card,
  CardContent,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import { ResponsiveButton } from '../components/Common';
import ResponsiveTypography from '../components/Common/ResponsiveTypography';
import {
  ArrowBack,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  ShowChart,
  MonetizationOn,
  Assessment,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { apiService } from '../services/api';
import { HoldingDetail as HoldingDetailType, FundUnitTransactionWithCashFlow } from '../types';
import { 
  formatCurrency, 
  formatNumberWithSeparators, 
  formatPercentage 
} from '../utils/format';
import EditHoldingTransactionModal from '../components/NAVUnit/EditHoldingTransactionModal';
import SubscriptionModal from '../components/NAVUnit/SubscriptionModal';
import RedemptionModal from '../components/NAVUnit/RedemptionModal';

const HoldingDetail: React.FC = () => {
  const { t } = useTranslation();
  const { holdingId } = useParams<{ holdingId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [holdingDetail, setHoldingDetail] = useState<HoldingDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<FundUnitTransactionWithCashFlow | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<FundUnitTransactionWithCashFlow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [recalculateLoading, setRecalculateLoading] = useState(false);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [redemptionModalOpen, setRedemptionModalOpen] = useState(false);

  useEffect(() => {
    if (holdingId) {
      fetchHoldingDetail();
    }
  }, [holdingId]);

  const fetchHoldingDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getHoldingDetail(holdingId!);
      data.summary.returnPercentage = (data.holding.currentValue - data.holding.totalInvestment) / data.holding.totalInvestment * 100;
      setHoldingDetail(data);
    } catch (err) {
      console.error('Error fetching holding detail:', err);
      setError(t('holdings.error.loadDetailsFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleBackNavigation = () => {
    // Check if we came from NAV Holdings tab
    const fromNav = new URLSearchParams(location.search).get('from') === 'nav';
    
    if (fromNav && holdingDetail?.holding?.portfolioId) {
      // Navigate back to portfolio detail with NAV Holdings tab active (tab index 5)
      navigate(`/portfolios/${holdingDetail.holding.portfolioId}?tab=5`);
    } else {
      // Fallback to previous page
      navigate(-1);
    }
  };

  const handleEditTransaction = (transaction: FundUnitTransactionWithCashFlow) => {
    setSelectedTransaction(transaction);
    setEditModalOpen(true);
  };

  const handleTransactionUpdated = () => {
    // Refresh the holding detail data
    fetchHoldingDetail();
    
    // Show success message with recalculation info
    // Note: This could be enhanced with a toast notification
  };

  const handleDeleteTransaction = (transaction: FundUnitTransactionWithCashFlow) => {
    setTransactionToDelete(transaction);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;

    try {
      setDeleteLoading(true);
      await apiService.deleteHoldingTransaction(transactionToDelete.transaction.transactionId);
      
      // Close modal and refresh data
      setDeleteModalOpen(false);
      setTransactionToDelete(null);
      await fetchHoldingDetail();
      
      // Show success message with recalculation info
    } catch (err) {
      console.error('Error deleting transaction:', err);
      setError(t('holdings.error.deleteTransactionFailed'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setTransactionToDelete(null);
  };

  const handleRecalculateNav = async () => {
    if (!holdingDetail?.holding?.portfolioId) return;
    
    try {
      setRecalculateLoading(true);
      
      // Step 1: Refresh NAV per unit
      await apiService.refreshNavPerUnit(holdingDetail.holding.portfolioId);
      // Step 2: Recalculate all investor holdings with new NAV
      await apiService.recalculateAllHoldings(holdingDetail.holding.portfolioId);
      // Refresh holding detail to show updated values
      await fetchHoldingDetail();
    } catch (err: any) {
      console.error('Error recalculating NAV:', err);
      setError(t('holdings.error.recalculateNavFailed'));
    } finally {
      setRecalculateLoading(false);
    }
  };

  const handleSubscriptionSuccess = () => {
    setSubscriptionModalOpen(false);
    fetchHoldingDetail();
  };

  const handleRedemptionSuccess = () => {
    setRedemptionModalOpen(false);
    fetchHoldingDetail();
  };

  const getPnLIcon = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return null;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return null;
    return num >= 0 ? <TrendingUp /> : <TrendingDown />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <ResponsiveTypography variant="tableCell">
            {error}
          </ResponsiveTypography>
        </Alert>
        <ResponsiveButton
          variant="outlined"
          icon={<ArrowBack />}
          onClick={() => navigate(-1)}
          mobileText="Back"
          desktopText="Go Back"
        >
          Go Back
        </ResponsiveButton>
      </Container>
    );
  }

  if (!holdingDetail) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="info">
          <ResponsiveTypography variant="tableCell">
            {t('holdings.error.noDetailsFound')}
          </ResponsiveTypography>
        </Alert>
      </Container>
    );
  }

  const { holding, transactions, summary } = holdingDetail;

  return (
    <Container maxWidth="xl" sx={{ mt: 0.5, mb: 1 }}>
      {/* Header */}
      <Box sx={{ 
        mb: 2,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: '#ffffff',
        pt: 1,
        pb: 1,
        backdropFilter: 'blur(8px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <ResponsiveButton
          variant="text"
          icon={<ArrowBack />}
          onClick={handleBackNavigation}
          mobileText={t('common.back')}
          desktopText={t('holdings.actions.backToPortfolio')}
          sx={{ mb: 1.5, textTransform: 'none' }}
        >
          {t('holdings.actions.backToPortfolio')}
        </ResponsiveButton>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mx: {xs: 1, sm: 2},
          p: { xs: 1.5, sm: 2 },
          borderRadius: 2,
          backgroundColor: '#f8f9fa',
          border: '1px solid #e9ecef',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ 
              bgcolor: 'primary.main', 
              width: 48, 
              height: 48,
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              display: { xs: 'none', sm: 'flex' },
            }}>
              <AccountBalance />
            </Avatar>
            <Box>
              <ResponsiveTypography variant="pageTitle" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {holding.account?.name}
              </ResponsiveTypography>
              <ResponsiveTypography variant="pageSubtitle" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                {t('holdings.detail.investmentIn', { portfolioName: holding.portfolio?.name })}
              </ResponsiveTypography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <ResponsiveButton
              size="small"
              variant="contained"
              color="success"
              icon={<AddIcon />}
              onClick={() => setSubscriptionModalOpen(true)}
              mobileText={t('nav.holdings.newSubscription')}
              desktopText={t('nav.holdings.newSubscription')}
              sx={{
                minWidth: '120px',
                textTransform: 'none',
                boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)',
                }
              }}
            >
              {t('nav.holdings.newSubscription')}
            </ResponsiveButton>
            
            <ResponsiveButton
              size="small"
              variant="contained"
              color="warning"
              icon={<RemoveIcon />}
              onClick={() => setRedemptionModalOpen(true)}
              mobileText={t('nav.holdings.processRedemption')}
              desktopText={t('nav.holdings.processRedemption')}
              sx={{
                minWidth: '120px',
                textTransform: 'none',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
                }
              }}
            >
              {t('nav.holdings.processRedemption')}
            </ResponsiveButton>
            
            <ResponsiveButton
              size="small"
              variant="contained"
              color="primary"
              icon={recalculateLoading ? <CircularProgress size={20} /> : <ShowChart />}
              onClick={handleRecalculateNav}
              disabled={recalculateLoading}
              mobileText={recalculateLoading ? t('holdings.actions.recalculating') : t('holdings.actions.recalculate')}
              desktopText={recalculateLoading ? t('holdings.actions.recalculating') : t('holdings.actions.recalculateNav')}
              sx={{
                minWidth: '160px',
                textTransform: 'none',
                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
                }
              }}
            >
              {recalculateLoading ? t('holdings.actions.recalculating') : t('holdings.actions.recalculateNav')}
            </ResponsiveButton>
          </Box>
        </Box>
      </Box>

      {/* Main Content Layout - 2 Columns */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Left Column - Portfolio Performance + Transaction Summary */}
        <Grid item xs={12} md={8}>
          <Stack spacing={2}>
            {/* Portfolio Performance */}
            <Card sx={{ 
              background: 'white',
              border: '1px solid #e9ecef',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <CardContent sx={{ p: 2 }}>
                <ResponsiveTypography variant="cardTitle" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                  {t('holdings.detail.portfolioPerformance')}
                </ResponsiveTypography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ 
                      textAlign: 'center',
                      p: 1.5,
                      borderRadius: 2,
                    }}>
                      <ResponsiveTypography variant="cardValue" sx={{ fontWeight: 700, color: 'primary.main', mb: 0.5 }}>
                        {formatCurrency(holding.currentValue, 'VND')}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="cardLabel" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        {t('holdings.detail.currentValue')}
                      </ResponsiveTypography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ 
                      textAlign: 'center',
                      p: 1.5,
                      borderRadius: 2,
                    }}>
                      <ResponsiveTypography variant="cardValue" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                        {formatCurrency(holding.totalInvestment, 'VND')}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="cardLabel" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        {t('holdings.detail.totalInvestment')}
                      </ResponsiveTypography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ 
                      textAlign: 'center',
                      p: 1.5,
                      borderRadius: 2,
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                        {getPnLIcon(holding.unrealizedPnL)}
                        <ResponsiveTypography variant="cardValue" sx={{ fontWeight: 700, color: holding.unrealizedPnL >= 0 ? 'success.main' : 'error.main', ml: 0.5 }}>
                          {formatCurrency(holding.unrealizedPnL, 'VND')}
                        </ResponsiveTypography>
                      </Box>
                      <ResponsiveTypography variant="cardLabel" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        {t('holdings.detail.unrealizedPnL')}
                      </ResponsiveTypography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ 
                      textAlign: 'center',
                      p: 1.5,
                      borderRadius: 2,
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                        {getPnLIcon(summary.returnPercentage)}
                        <ResponsiveTypography variant="cardValue" sx={{ fontWeight: 700, color: summary.returnPercentage >= 0 ? 'success.main' : 'error.main', ml: 0.5 }}>
                          {formatPercentage(summary.returnPercentage, 2)}
                        </ResponsiveTypography>
                      </Box>
                      <ResponsiveTypography variant="cardLabel" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        {t('holdings.detail.returnPercent')}
                      </ResponsiveTypography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Transaction Summary */}
            <Card sx={{ 
              background: 'white',
              border: '1px solid #e9ecef',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <CardContent sx={{ p: 2 }}>
                <ResponsiveTypography variant="cardTitle" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                  {t('holdings.detail.transactionSummary')}
                </ResponsiveTypography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ 
                      textAlign: 'center',
                      p: 1.5,
                      borderRadius: 2,
                    }}>
                      <ResponsiveTypography variant="cardValue" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {summary.totalTransactions}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="cardLabel" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        {t('holdings.detail.totalTransactions')}
                      </ResponsiveTypography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ 
                      textAlign: 'center',
                      p: 1.5,
                      borderRadius: 2,
                    }}>
                      <ResponsiveTypography variant="cardValue" sx={{ fontWeight: 700, color: 'success.main' }}>
                        {summary.totalSubscriptions}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="cardLabel" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        {t('holdings.detail.subscriptions')}
                      </ResponsiveTypography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ 
                      textAlign: 'center',
                      p: 1.5,
                      borderRadius: 2,
                    }}>
                      <ResponsiveTypography variant="cardValue" sx={{ fontWeight: 700, color: 'warning.main' }}>
                        {summary.totalRedemptions}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="cardLabel" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        {t('holdings.detail.redemptions')}
                      </ResponsiveTypography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ 
                      textAlign: 'center',
                      p: 1.5,
                      borderRadius: 2,
                    }}>
                      <ResponsiveTypography variant="cardValue" sx={{ fontWeight: 700, color: 'info.main' }}>
                        {formatNumberWithSeparators(summary.totalUnitsSubscribed, 3)}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="cardLabel" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        {t('holdings.detail.unitsSubscribed')}
                      </ResponsiveTypography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Right Column - Holding Details */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '100%',
            background: 'white',
            border: '1px solid #e9ecef',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <CardContent sx={{ p: 2 }}>
              <ResponsiveTypography variant="cardTitle" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
                {t('holdings.detail.holdingDetails')}
              </ResponsiveTypography>
              <List dense>
                <ListItem sx={{ 
                  px: 0, 
                  py: 1,
                  mb: 1
                }}>
                  <ListItemIcon>
                    <ShowChart color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('holdings.detail.totalUnits')}
                    secondary={formatNumberWithSeparators(holding.totalUnits, 3)}
                    primaryTypographyProps={{ sx: { color: 'text.primary', fontWeight: 600 } }}
                    secondaryTypographyProps={{ sx: { color: 'text.secondary' } }}
                  />
                </ListItem>
                <ListItem sx={{ 
                  px: 0, 
                  py: 1,
                  mb: 1
                }}>
                  <ListItemIcon>
                    <MonetizationOn color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('holdings.detail.avgCostPerUnit')}
                    secondary={formatCurrency(holding.avgCostPerUnit, 'VND')}
                    primaryTypographyProps={{ sx: { color: 'text.primary', fontWeight: 600 } }}
                    secondaryTypographyProps={{ sx: { color: 'text.secondary' } }}
                  />
                </ListItem>
                <ListItem sx={{ 
                  px: 0, 
                  py: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <ListItemIcon>
                      <Assessment color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={t('holdings.detail.currentNav')}
                      secondary={
                        holding.portfolio?.navPerUnit 
                          ? formatCurrency(holding.portfolio.navPerUnit, 'VND')
                          : holding.totalUnits > 0 
                            ? formatCurrency(holding.currentValue / holding.totalUnits, 'VND')
                            : 'N/A'
                      }
                      primaryTypographyProps={{ sx: { color: 'text.primary', fontWeight: 600 } }}
                      secondaryTypographyProps={{ sx: { color: 'text.secondary' } }}
                    />
                  </Box>
                  
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Transaction History - Clean Table */}
      <Card sx={{ 
        background: 'white',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2, pb: 0 }}>
            <ResponsiveTypography variant="cardTitle" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {t('holdings.detail.transactionHistory')}
            </ResponsiveTypography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  background: '#f8f9fa'
                }}>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                    <ResponsiveTypography variant="tableHeaderSmall">{t('holdings.table.date')}</ResponsiveTypography>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                    <ResponsiveTypography variant="tableHeaderSmall">{t('holdings.table.type')}</ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    <ResponsiveTypography variant="tableHeaderSmall">{t('holdings.table.units')}</ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    <ResponsiveTypography variant="tableHeaderSmall">{t('holdings.table.navPerUnit')}</ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    <ResponsiveTypography variant="tableHeaderSmall">{t('holdings.table.amount')}</ResponsiveTypography>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                    <ResponsiveTypography variant="tableHeaderSmall">{t('holdings.table.description')}</ResponsiveTypography>
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    <ResponsiveTypography variant="tableHeaderSmall">{t('common.actions')}</ResponsiveTypography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map(({ transaction, cashFlow }, index) => (
                  <TableRow 
                    key={transaction.transactionId}
                    sx={{ 
                      '&:hover': { 
                        background: '#f8f9fa'
                      },
                      background: index % 2 === 0 ? 'white' : '#fafbfc'
                    }}
                  >
                    <TableCell sx={{ fontWeight: 500, color: 'text.primary' }}>
                      <ResponsiveTypography variant="tableCellSmall">
                        {format(new Date(transaction.createdAt), 'dd/MM/yyyy')}
                      </ResponsiveTypography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.holdingType}
                        color={transaction.holdingType === 'SUBSCRIBE' ? 'success' : 'warning'}
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 500, color: 'text.primary' }}>
                      <ResponsiveTypography variant="tableCellSmall">
                        {formatNumberWithSeparators(transaction.units, 3)}
                      </ResponsiveTypography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 500, color: 'text.primary' }}>
                      <ResponsiveTypography variant="tableCellSmall">
                        {formatCurrency(transaction.navPerUnit, 'VND')}
                      </ResponsiveTypography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      <ResponsiveTypography variant="tableCellSmall">
                        {formatCurrency(transaction.amount, 'VND')}
                      </ResponsiveTypography>
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      <ResponsiveTypography variant="tableCellSmall">
                        {cashFlow?.description || 'N/A'}
                      </ResponsiveTypography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <IconButton
                          size="small"
                          onClick={() => handleEditTransaction({ transaction, cashFlow })}
                          sx={{ 
                            width: 50, 
                            height: 50,
                            border: '1px solid',
                            borderColor: 'primary.main',
                            color: 'primary.main',
                            '&:hover': {
                              backgroundColor: 'primary.light',
                              color: 'white'
                            }
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteTransaction({ transaction, cashFlow })}
                          sx={{ 
                            width: 50, 
                            height: 50,
                            border: '1px solid',
                            borderColor: 'error.main',
                            color: 'error.main',
                            '&:hover': {
                              backgroundColor: 'error.light',
                              color: 'white'
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Edit Transaction Modal */}
      <EditHoldingTransactionModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        onTransactionUpdated={handleTransactionUpdated}
      />

      {/* Subscription Modal */}
      <SubscriptionModal
        open={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        portfolio={holding?.portfolio || null}
        onSubscriptionSuccess={handleSubscriptionSuccess}
        preselectedAccountId={holding?.account?.accountId}
      />

      {/* Redemption Modal */}
      <RedemptionModal
        open={redemptionModalOpen}
        onClose={() => setRedemptionModalOpen(false)}
        portfolio={holding?.portfolio || null}
        onRedemptionSuccess={handleRedemptionSuccess}
        preselectedAccountId={holding?.account?.accountId}
      />

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteModalOpen}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: 'error.main',
          fontWeight: 600
        }}>
          <DeleteIcon color="error" />
          {t('holdings.delete.title')}
        </DialogTitle>
        <DialogContent>
          <ResponsiveTypography variant="tableCell" sx={{ mb: 2 }}>
            {t('holdings.delete.message')}
          </ResponsiveTypography>
          {transactionToDelete && (
            <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <ResponsiveTypography variant="cardLabel" sx={{ fontWeight: 600, mb: 1 }}>
                {t('holdings.delete.transactionDetails')}:
              </ResponsiveTypography>
              <ResponsiveTypography variant="labelSmall" color="text.secondary">
                <strong>{t('holdings.table.type')}:</strong> {transactionToDelete.transaction.holdingType}
              </ResponsiveTypography>
              <ResponsiveTypography variant="labelSmall" color="text.secondary">
                <strong>{t('holdings.table.units')}:</strong> {formatNumberWithSeparators(transactionToDelete.transaction.units, 3)}
              </ResponsiveTypography>
              <ResponsiveTypography variant="labelSmall" color="text.secondary">
                <strong>{t('holdings.table.amount')}:</strong> {formatCurrency(transactionToDelete.transaction.amount, 'VND')}
              </ResponsiveTypography>
              <ResponsiveTypography variant="labelSmall" color="text.secondary">
                <strong>{t('holdings.table.date')}:</strong> {format(new Date(transactionToDelete.transaction.createdAt), 'dd/MM/yyyy')}
              </ResponsiveTypography>
            </Card>
          )}

          {/* Date Awareness Notice */}
          <Alert severity="warning" sx={{ mt: 2 }}>
            <ResponsiveTypography variant="cardLabel" sx={{ fontWeight: 500 }}>
              {t('holdings.delete.recalculationImpact')}
            </ResponsiveTypography>
            <ResponsiveTypography variant="labelSmall" sx={{ mt: 1 }}>
              {t('holdings.delete.recalculationMessage')}
            </ResponsiveTypography>
            <Box component="ul" sx={{ mt: 1, pl: 2, mb: 0 }}>
              <ResponsiveTypography component="li" variant="labelSmall">
                {t('holdings.delete.recalculationItem1')}
              </ResponsiveTypography>
              <ResponsiveTypography component="li" variant="labelSmall">
                {t('holdings.delete.recalculationItem2')}
              </ResponsiveTypography>
              <ResponsiveTypography component="li" variant="labelSmall">
                {t('holdings.delete.recalculationItem3')}
              </ResponsiveTypography>
            </Box>
            <ResponsiveTypography variant="labelSmall" sx={{ mt: 1, fontStyle: 'italic' }}>
              {t('holdings.delete.recalculationDate', { date: transactionToDelete ? format(new Date(transactionToDelete.transaction.createdAt), 'dd/MM/yyyy') : 'N/A' })}
            </ResponsiveTypography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <ResponsiveButton 
            onClick={handleCancelDelete} 
            disabled={deleteLoading}
            size="large"
            mobileText={t('common.cancel')}
            desktopText={t('common.cancel')}
          >
            {t('common.cancel')}
          </ResponsiveButton>
          <ResponsiveButton
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={deleteLoading}
            size="large"
            icon={deleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
            mobileText={deleteLoading ? t('holdings.delete.deleting') : t('common.delete')}
            desktopText={deleteLoading ? t('holdings.delete.deleting') : t('holdings.delete.deleteTransaction')}
          >
            {deleteLoading ? t('holdings.delete.deleting') : t('holdings.delete.deleteTransaction')}
          </ResponsiveButton>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default HoldingDetail;
