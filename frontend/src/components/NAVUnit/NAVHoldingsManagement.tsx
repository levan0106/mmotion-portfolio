/**
 * NAV Holdings Management Component
 * Manages fund subscriptions, redemptions, and investor holdings
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { 
  formatCurrency, 
  formatPercentage, 
  formatNumberWithSeparators
} from '../../utils/format';
import { 
  SubscribeToFundDto, 
  RedeemFromFundDto,
  Portfolio 
} from '../../types';
import { useNAVHoldings } from '../../hooks/useNAVHoldings';

interface NAVHoldingsManagementProps {
  portfolio: Portfolio;
  isCompactMode?: boolean;
  getUltraSpacing?: (normal: number, compact: number) => number;
  onPortfolioUpdate?: () => void;
}

interface SubscriptionDialogData {
  accountId: string;
  amount: number;
  description: string;
}

interface RedemptionDialogData {
  accountId: string;
  units: number;
  description: string;
}

const NAVHoldingsManagement: React.FC<NAVHoldingsManagementProps> = ({
  portfolio,
  getUltraSpacing = (normal) => normal,
  onPortfolioUpdate
}) => {
  const navigate = useNavigate();
  const { holdings, loading, error, refetch, subscribeToFund, redeemFromFund, convertToFund } = useNAVHoldings(
    portfolio.portfolioId,
    portfolio.isFund || false
  );
  
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [redemptionDialogOpen, setRedemptionDialogOpen] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionDialogData>({
    accountId: '',
    amount: 0,
    description: ''
  });
  const [subscriptionErrors, setSubscriptionErrors] = useState<{
    accountId?: string;
    amount?: string;
  }>({});
  const [redemptionData, setRedemptionData] = useState<RedemptionDialogData>({
    accountId: '',
    units: 0,
    description: ''
  });

  // Calculate expected units based on amount and NAV per unit
  const calculateExpectedUnits = (amount: number): number => {
    if (!amount || !portfolio.navPerUnit || portfolio.navPerUnit <= 0) {
      return 0;
    }
    return Math.round((amount / portfolio.navPerUnit) * 1000) / 1000; // Round to 3 decimal places
  };

  // Validate subscription data
  const validateSubscriptionData = (): boolean => {
    const errors: { accountId?: string; amount?: string } = {};
    
    if (!subscriptionData.accountId.trim()) {
      errors.accountId = 'Account ID is required';
    }
    
    if (!subscriptionData.amount || subscriptionData.amount <= 0) {
      errors.amount = 'Amount must be greater than 0';
    } else if (subscriptionData.amount < 1000) {
      errors.amount = 'Minimum amount is 1,000 VND';
    }
    
    setSubscriptionErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubscription = async () => {
    if (!validateSubscriptionData()) {
      return;
    }

    try {
      const subscriptionDto: SubscribeToFundDto = {
        accountId: subscriptionData.accountId,
        portfolioId: portfolio.portfolioId,
        amount: subscriptionData.amount,
        description: subscriptionData.description
      };
      await subscribeToFund(subscriptionDto);
      
      setSubscriptionDialogOpen(false);
      setSubscriptionData({ accountId: '', amount: 0, description: '' });
      setSubscriptionErrors({});
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleRedemption = async () => {
    try {
      const redemptionDto: RedeemFromFundDto = {
        accountId: redemptionData.accountId,
        portfolioId: portfolio.portfolioId,
        units: redemptionData.units,
        description: redemptionData.description
      };
      await redeemFromFund(redemptionDto);
      
      setRedemptionDialogOpen(false);
      setRedemptionData({ accountId: '', units: 0, description: '' });
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const totalInvestment = holdings.reduce((sum, holding) => sum + holding.totalInvestment, 0);
  const totalCurrentValue = holdings.reduce((sum, holding) => sum + holding.currentValue, 0);
  const totalPnL = totalCurrentValue - totalInvestment;

  if (!portfolio.isFund) {
    return (
      <Card sx={{ mb: getUltraSpacing(3, 1) }}>
        <CardContent sx={{ p: getUltraSpacing(2, 1.5), textAlign: 'center' }}>
          <AccountBalanceIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Portfolio is not a Fund
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This portfolio is not configured as a fund. Convert it to a fund to enable NAV/Unit management.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AccountBalanceIcon />}
            onClick={async () => {
              try {
                await convertToFund(portfolio.portfolioId);
                // Refresh portfolio data without reloading page
                if (onPortfolioUpdate) {
                  onPortfolioUpdate();
                }
              } catch (err) {
                // Error is handled by the hook
              }
            }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Convert to Fund'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Fund Summary */}
      <Card sx={{ mb: getUltraSpacing(3, 1) }}>
        <CardContent sx={{ p: getUltraSpacing(2, 1.5) }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Fund Summary
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Refresh Holdings & Fund Summary">
                <IconButton onClick={async () => {
                  await refetch();
                  // Also refresh portfolio data (Fund Summary)
                  if (onPortfolioUpdate) {
                    onPortfolioUpdate();
                  }
                }} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Grid container spacing={getUltraSpacing(2, 1)}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Box sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  NAV per Unit
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {formatCurrency(portfolio.navPerUnit || 0, portfolio.baseCurrency)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Box sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Total Outstanding Units
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {formatNumberWithSeparators(portfolio.totalOutstandingUnits || 0, 0)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Box sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Number of Investors
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {formatNumberWithSeparators(holdings.length, 0)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Box sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Total P&L
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    color: totalPnL >= 0 ? 'success.main' : 'error.main'
                  }}
                >
                  {formatCurrency(totalPnL, portfolio.baseCurrency)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Box sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Last NAV Update
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  {portfolio.lastNavDate 
                    ? new Date(portfolio.lastNavDate).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'N/A'
                  }
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card sx={{ mb: getUltraSpacing(3, 1) }}>
        <CardContent sx={{ p: getUltraSpacing(2, 1.5) }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setSubscriptionDialogOpen(true)}
              sx={{ minWidth: 150 }}
            >
              New Subscription
            </Button>
            <Button
              variant="outlined"
              startIcon={<RemoveIcon />}
              onClick={() => setRedemptionDialogOpen(true)}
              sx={{ minWidth: 150 }}
            >
              Process Redemption
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: getUltraSpacing(2, 1) }}>
          {error}
        </Alert>
      )}

      {/* Investor Holdings Table */}
      <Card>
        <CardContent sx={{ p: getUltraSpacing(2, 1.5) }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Investor Holdings
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : holdings.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No investor holdings found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Create the first subscription to start tracking investor holdings
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Investor</TableCell>
                    <TableCell align="right">Units</TableCell>
                    <TableCell align="right">Avg Cost</TableCell>
                    <TableCell align="right">Total Investment</TableCell>
                    <TableCell align="right">Current Value</TableCell>
                    <TableCell align="right">Unrealized P&L</TableCell>
                    <TableCell align="right">Return %</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {holdings.map((holding) => {
                    const returnPercentage = holding.totalInvestment > 0 
                      ? ((holding.currentValue - holding.totalInvestment) / holding.totalInvestment) * 100 
                      : 0;
                    
                    return (
                      <TableRow key={holding.holdingId}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {holding.account?.name || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {holding.account?.email || 'No email'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {formatNumberWithSeparators(holding.totalUnits, 3)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(holding.avgCostPerUnit, portfolio.baseCurrency)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(holding.totalInvestment, portfolio.baseCurrency)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(holding.currentValue, portfolio.baseCurrency)}
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                            {holding.unrealizedPnL >= 0 ? (
                              <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                            ) : (
                              <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
                            )}
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: holding.unrealizedPnL >= 0 ? 'success.main' : 'error.main',
                                fontWeight: 600
                              }}
                            >
                              {formatCurrency(holding.unrealizedPnL, portfolio.baseCurrency)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={formatPercentage(returnPercentage, 2)}
                            color={returnPercentage >= 0 ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small"
                              onClick={() => navigate(`/holdings/${holding.holdingId}?from=nav`)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Subscription Dialog */}
      <Dialog open={subscriptionDialogOpen} onClose={() => setSubscriptionDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddIcon color="primary" />
            <Typography variant="h6">New Fund Subscription</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {/* Fund Information */}
            <Card variant="outlined" sx={{ mb: 3, p: 2, backgroundColor: 'grey.50' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Fund Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    NAV per Unit
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(portfolio.navPerUnit || 0, portfolio.baseCurrency, { precision: 3 })}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Outstanding Units
                  </Typography>
                  <Typography variant="h6">
                    {formatNumberWithSeparators(portfolio.totalOutstandingUnits || 0, 0)}
                  </Typography>
                </Grid>
              </Grid>
            </Card>

            {/* Subscription Form */}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Account ID"
                  value={subscriptionData.accountId}
                  onChange={(e) => {
                    setSubscriptionData({ ...subscriptionData, accountId: e.target.value });
                    if (subscriptionErrors.accountId) {
                      setSubscriptionErrors({ ...subscriptionErrors, accountId: undefined });
                    }
                  }}
                  error={!!subscriptionErrors.accountId}
                  helperText={subscriptionErrors.accountId}
                  placeholder="Enter investor account ID"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Investment Amount"
                  type="number"
                  value={subscriptionData.amount || ''}
                  onChange={(e) => {
                    const amount = Number(e.target.value);
                    setSubscriptionData({ ...subscriptionData, amount });
                    if (subscriptionErrors.amount) {
                      setSubscriptionErrors({ ...subscriptionErrors, amount: undefined });
                    }
                  }}
                  error={!!subscriptionErrors.amount}
                  helperText={
                    subscriptionErrors.amount || 
                    `Minimum: ${formatCurrency(1000, portfolio.baseCurrency)}. Current NAV: ${formatCurrency(portfolio.navPerUnit, portfolio.baseCurrency)} per unit${subscriptionData.amount > 0 ? `. Note: Subscription fee may apply to amount of ${formatCurrency(subscriptionData.amount, portfolio.baseCurrency)}` : ''}`
                  }
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>{portfolio.baseCurrency}</Typography>
                  }}
                  placeholder="Enter investment amount"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Expected Units to Receive"
                  value={formatNumberWithSeparators(calculateExpectedUnits(subscriptionData.amount), 3)}
                  disabled
                  helperText="Based on current NAV per unit"
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>Units</Typography>
                  }}
                  sx={{
                    '& .MuiInputBase-input.Mui-disabled': {
                      color: 'primary.main',
                      fontWeight: 600,
                      fontSize: '1.1rem'
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description (Optional)"
                  value={subscriptionData.description}
                  onChange={(e) => setSubscriptionData({ ...subscriptionData, description: e.target.value })}
                  multiline
                  rows={2}
                  placeholder="Add a description for this subscription"
                />
              </Grid>
            </Grid>

          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => {
              setSubscriptionDialogOpen(false);
              setSubscriptionData({ accountId: '', amount: 0, description: '' });
              setSubscriptionErrors({});
            }}
            size="large"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubscription} 
            variant="contained" 
            disabled={loading || !subscriptionData.accountId || !subscriptionData.amount}
            size="large"
            startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
          >
            {loading ? 'Processing...' : 'Subscribe to Fund'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Redemption Dialog */}
      <Dialog open={redemptionDialogOpen} onClose={() => setRedemptionDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RemoveIcon color="error" />
            <Typography variant="h6">Process Fund Redemption</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {/* Fund Information */}
            <Card variant="outlined" sx={{ mb: 3, p: 2, backgroundColor: 'grey.50' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Fund Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    NAV per Unit
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(portfolio.navPerUnit || 0, portfolio.baseCurrency, { precision: 3 })}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Outstanding Units
                  </Typography>
                  <Typography variant="h6">
                    {formatNumberWithSeparators(portfolio.totalOutstandingUnits || 0, 0)}
                  </Typography>
                </Grid>
              </Grid>
            </Card>

            {/* Redemption Form */}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Account ID"
                  value={redemptionData.accountId}
                  onChange={(e) => setRedemptionData({ ...redemptionData, accountId: e.target.value })}
                  margin="normal"
                  helperText="Enter the account ID of the investor to redeem from"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Units to Redeem"
                  type="number"
                  value={redemptionData.units}
                  onChange={(e) => setRedemptionData({ ...redemptionData, units: Number(e.target.value) })}
                  margin="normal"
                  helperText={`Current NAV: ${formatCurrency(portfolio.navPerUnit || 0, portfolio.baseCurrency, { precision: 3 })} per unit. Expected amount: ${formatCurrency((redemptionData.units || 0) * (portfolio.navPerUnit || 0), portfolio.baseCurrency)}`}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={redemptionData.description}
                  onChange={(e) => setRedemptionData({ ...redemptionData, description: e.target.value })}
                  margin="normal"
                  multiline
                  rows={2}
                  helperText="Optional description for this redemption transaction"
                />
              </Grid>
            </Grid>

            {/* Redemption Summary */}
            <Card variant="outlined" sx={{ mt: 3, p: 2, backgroundColor: 'error.50', borderColor: 'error.200' }}>
              <Typography variant="subtitle2" color="error.main" gutterBottom>
                Redemption Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    Units to Redeem
                  </Typography>
                  <Typography variant="h6" color="error.main">
                    {redemptionData.units > 0 ? formatNumberWithSeparators(redemptionData.units, 3) : '0.000'}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    Expected Amount
                  </Typography>
                  <Typography variant="h6" color="error.main">
                    {redemptionData.units > 0 ? formatCurrency(redemptionData.units * (portfolio.navPerUnit || 0), portfolio.baseCurrency) : formatCurrency(0, portfolio.baseCurrency)}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    Remaining Units
                  </Typography>
                  <Typography variant="h6" color="text.primary">
                    {(() => {
                      const currentHolding = holdings.find(h => h.accountId === redemptionData.accountId);
                      if (currentHolding) {
                        const remaining = currentHolding.totalUnits - (redemptionData.units || 0);
                        return formatNumberWithSeparators(Math.max(0, remaining), 3);
                      }
                      return 'N/A';
                    })()}
                  </Typography>
                </Grid>
              </Grid>
              {(() => {
                const currentHolding = holdings.find(h => h.accountId === redemptionData.accountId);
                if (currentHolding && redemptionData.units > currentHolding.totalUnits) {
                  return (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        Warning: Redeeming {formatNumberWithSeparators(redemptionData.units, 3)} units, but investor only has {formatNumberWithSeparators(currentHolding.totalUnits, 3)} units available.
                      </Typography>
                    </Alert>
                  );
                }
                return null;
              })()}
            </Card>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setRedemptionDialogOpen(false)} size="large">
            Cancel
          </Button>
          <Button 
            onClick={handleRedemption} 
            variant="contained" 
            color="error"
            disabled={loading || !redemptionData.accountId || !redemptionData.units}
            size="large"
            startIcon={loading ? <CircularProgress size={20} /> : <RemoveIcon />}
          >
            {loading ? 'Processing...' : 'Process Redemption'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NAVHoldingsManagement;
