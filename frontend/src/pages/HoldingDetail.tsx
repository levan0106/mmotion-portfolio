import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  Button,
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
} from '@mui/material';
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

const HoldingDetail: React.FC = () => {
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
      setError('Failed to load holding details');
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
      setError('Failed to delete transaction');
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
      setError('Failed to recalculate NAV. Please try again.');
    } finally {
      setRecalculateLoading(false);
    }
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
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </Container>
    );
  }

  if (!holdingDetail) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="info">
          <ResponsiveTypography variant="tableCell">
            No holding details found
          </ResponsiveTypography>
        </Alert>
      </Container>
    );
  }

  const { holding, transactions, summary } = holdingDetail;

  return (
    <Container maxWidth="xl" sx={{ mt: 0.5, mb: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Button
          variant="text"
          startIcon={<ArrowBack />}
          onClick={handleBackNavigation}
          sx={{ mb: 1.5, textTransform: 'none' }}
        >
          Back to Portfolio
        </Button>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 1,
          p: { xs: 1.5, sm: 2 },
          borderRadius: 2,
          background: '#f8f9fa',
          border: '1px solid #e9ecef'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ 
              bgcolor: 'primary.main', 
              width: 48, 
              height: 48,
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }}>
              <AccountBalance />
            </Avatar>
            <Box>
              <ResponsiveTypography variant="pageTitle" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {holding.account?.name}
              </ResponsiveTypography>
              <ResponsiveTypography variant="pageSubtitle" color="text.secondary" sx={{ fontWeight: 500 }}>
                Investment in {holding.portfolio?.name}
              </ResponsiveTypography>
            </Box>
          </Box>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={recalculateLoading ? <CircularProgress size={20} /> : <ShowChart />}
            onClick={handleRecalculateNav}
            disabled={recalculateLoading}
            sx={{
              minWidth: '160px',
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
              }
            }}
          >
            {recalculateLoading ? 'Recalculating...' : 'Recalculate NAV'}
          </Button>
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
                  Portfolio Performance
                </ResponsiveTypography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ 
                      textAlign: 'center',
                      p: 1.5,
                      borderRadius: 2,
                    }}>
                      <ResponsiveTypography variant="cardValueLarge" sx={{ fontWeight: 700, color: 'primary.main', mb: 0.5 }}>
                        {formatCurrency(holding.currentValue, 'VND')}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="cardLabel" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        Current Value
                      </ResponsiveTypography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ 
                      textAlign: 'center',
                      p: 1.5,
                      borderRadius: 2,
                    }}>
                      <ResponsiveTypography variant="cardValueLarge" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                        {formatCurrency(holding.totalInvestment, 'VND')}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="cardLabel" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        Total Investment
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
                        <ResponsiveTypography variant="cardValueLarge" sx={{ fontWeight: 700, color: holding.unrealizedPnL >= 0 ? 'success.main' : 'error.main', ml: 0.5 }}>
                          {formatCurrency(holding.unrealizedPnL, 'VND')}
                        </ResponsiveTypography>
                      </Box>
                      <ResponsiveTypography variant="cardLabel" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        Unrealized P&L
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
                        <ResponsiveTypography variant="cardValueLarge" sx={{ fontWeight: 700, color: summary.returnPercentage >= 0 ? 'success.main' : 'error.main', ml: 0.5 }}>
                          {formatPercentage(summary.returnPercentage, 2)}
                        </ResponsiveTypography>
                      </Box>
                      <ResponsiveTypography variant="cardLabel" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        Return %
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
                  Transaction Summary
                </ResponsiveTypography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ 
                      textAlign: 'center',
                      p: 1.5,
                      borderRadius: 2,
                    }}>
                      <ResponsiveTypography variant="cardValueLarge" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {summary.totalTransactions}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="cardLabel" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        Total Transactions
                      </ResponsiveTypography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ 
                      textAlign: 'center',
                      p: 1.5,
                      borderRadius: 2,
                    }}>
                      <ResponsiveTypography variant="cardValueLarge" sx={{ fontWeight: 700, color: 'success.main' }}>
                        {summary.totalSubscriptions}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="cardLabel" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        Subscriptions
                      </ResponsiveTypography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ 
                      textAlign: 'center',
                      p: 1.5,
                      borderRadius: 2,
                    }}>
                      <ResponsiveTypography variant="cardValueLarge" sx={{ fontWeight: 700, color: 'warning.main' }}>
                        {summary.totalRedemptions}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="cardLabel" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        Redemptions
                      </ResponsiveTypography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ 
                      textAlign: 'center',
                      p: 1.5,
                      borderRadius: 2,
                    }}>
                      <ResponsiveTypography variant="cardValueLarge" sx={{ fontWeight: 700, color: 'info.main' }}>
                        {formatNumberWithSeparators(summary.totalUnitsSubscribed, 3)}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="cardLabel" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        Units Subscribed
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
                Holding Details
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
                    primary="Total Units"
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
                    primary="Avg Cost per Unit"
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
                      primary="Current NAV"
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
              Transaction History
            </ResponsiveTypography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  background: '#f8f9fa'
                }}>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                    <ResponsiveTypography variant="tableHeaderSmall">Date</ResponsiveTypography>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                    <ResponsiveTypography variant="tableHeaderSmall">Type</ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    <ResponsiveTypography variant="tableHeaderSmall">Units</ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    <ResponsiveTypography variant="tableHeaderSmall">NAV per Unit</ResponsiveTypography>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    <ResponsiveTypography variant="tableHeaderSmall">Amount</ResponsiveTypography>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                    <ResponsiveTypography variant="tableHeaderSmall">Description</ResponsiveTypography>
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    <ResponsiveTypography variant="tableHeaderSmall">Actions</ResponsiveTypography>
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
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditTransaction({ transaction, cashFlow })}
                          sx={{ 
                            minWidth: 'auto',
                            px: 1,
                            py: 0.5,
                            textTransform: 'none',
                            fontSize: '0.75rem!important'
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteTransaction({ transaction, cashFlow })}
                          sx={{ 
                            minWidth: 'auto',
                            px: 1,
                            py: 0.5,
                            textTransform: 'none',
                            fontSize: '0.75rem!important'
                          }}
                        >
                          Delete
                        </Button>
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
          Confirm Delete Transaction
        </DialogTitle>
        <DialogContent>
          <ResponsiveTypography variant="tableCell" sx={{ mb: 2 }}>
            Are you sure you want to delete this transaction? This action cannot be undone.
          </ResponsiveTypography>
          {transactionToDelete && (
            <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <ResponsiveTypography variant="cardLabel" sx={{ fontWeight: 600, mb: 1 }}>
                Transaction Details:
              </ResponsiveTypography>
              <ResponsiveTypography variant="labelSmall" color="text.secondary">
                <strong>Type:</strong> {transactionToDelete.transaction.holdingType}
              </ResponsiveTypography>
              <ResponsiveTypography variant="labelSmall" color="text.secondary">
                <strong>Units:</strong> {formatNumberWithSeparators(transactionToDelete.transaction.units, 3)}
              </ResponsiveTypography>
              <ResponsiveTypography variant="labelSmall" color="text.secondary">
                <strong>Amount:</strong> {formatCurrency(transactionToDelete.transaction.amount, 'VND')}
              </ResponsiveTypography>
              <ResponsiveTypography variant="labelSmall" color="text.secondary">
                <strong>Date:</strong> {format(new Date(transactionToDelete.transaction.createdAt), 'dd/MM/yyyy')}
              </ResponsiveTypography>
            </Card>
          )}

          {/* Date Awareness Notice */}
          <Alert severity="warning" sx={{ mt: 2 }}>
            <ResponsiveTypography variant="cardLabel" sx={{ fontWeight: 500 }}>
              ⚠️ Data Recalculation Impact
            </ResponsiveTypography>
            <ResponsiveTypography variant="labelSmall" sx={{ mt: 1 }}>
              Deleting this transaction will trigger automatic recalculation of:
            </ResponsiveTypography>
            <Box component="ul" sx={{ mt: 1, pl: 2, mb: 0 }}>
              <ResponsiveTypography component="li" variant="labelSmall">
                Portfolio NAV per unit and total outstanding units
              </ResponsiveTypography>
              <ResponsiveTypography component="li" variant="labelSmall">
                All holding metrics (units, investment, P&L) will be recalculated from remaining transactions
              </ResponsiveTypography>
              <ResponsiveTypography component="li" variant="labelSmall">
                Associated cash flow records will be removed
              </ResponsiveTypography>
            </Box>
            <ResponsiveTypography variant="labelSmall" sx={{ mt: 1, fontStyle: 'italic' }}>
              Recalculation will be based on the original transaction date: <strong>{transactionToDelete ? format(new Date(transactionToDelete.transaction.createdAt), 'dd/MM/yyyy') : 'N/A'}</strong>
            </ResponsiveTypography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCancelDelete} 
            disabled={deleteLoading}
            size="large"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={deleteLoading}
            size="large"
            startIcon={deleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deleteLoading ? 'Deleting...' : 'Delete Transaction'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default HoldingDetail;
