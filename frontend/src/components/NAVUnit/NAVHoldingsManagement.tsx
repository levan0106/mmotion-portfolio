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
  CircularProgress,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Calculate as CalculateIcon,
  Transform as ConvertIcon,
} from '@mui/icons-material';
import { 
  formatCurrency, 
  formatPercentage, 
  formatNumberWithSeparators
} from '../../utils/format';
import { apiService } from '../../services/api';
import { 
  Portfolio 
} from '../../types';
import { useNAVHoldings } from '../../hooks/useNAVHoldings';
import { useAccount } from '../../contexts/AccountContext';
import { ConvertToFundModal } from '../Portfolio/ConvertToFundModal';
import ConvertToPortfolioModal from '../Portfolio/ConvertToPortfolioModal';
import SubscriptionModal from './SubscriptionModal';
import RedemptionModal from './RedemptionModal';

interface NAVHoldingsManagementProps {
  portfolio: Portfolio;
  isCompactMode?: boolean;
  getUltraSpacing?: (normal: number, compact: number) => number;
  onPortfolioUpdate?: () => void;
}


const NAVHoldingsManagement: React.FC<NAVHoldingsManagementProps> = ({
  portfolio,
  getUltraSpacing = (normal) => normal,
  onPortfolioUpdate
}) => {
  const navigate = useNavigate();
  const { accountId } = useAccount();
  const { holdings, loading, error, refetch, convertToFund } = useNAVHoldings(
    portfolio.portfolioId,
    portfolio.isFund || false
  );
  
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [redemptionModalOpen, setRedemptionModalOpen] = useState(false);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [convertToPortfolioModalOpen, setConvertToPortfolioModalOpen] = useState(false);
  const [recalculateLoading, setRecalculateLoading] = useState(false);

  const handleRecalculateNav = async () => {
    try {
      setRecalculateLoading(true);
      
      // Step 1: Refresh NAV per unit
      const navResult = await apiService.refreshNavPerUnit(portfolio.portfolioId);
      console.log('NAV recalculated successfully:', navResult);
      
      // Step 2: Recalculate all investor holdings with new NAV
      const holdingsResult = await apiService.recalculateAllHoldings(portfolio.portfolioId);
      console.log('Holdings recalculated successfully:', holdingsResult);
      
      // Refresh portfolio data
      if (onPortfolioUpdate) {
        onPortfolioUpdate();
      }
      
      // Also refresh holdings data
      await refetch();
    } catch (err: any) {
      console.error('Error recalculating NAV and holdings:', err);
      // You could add error state handling here if needed
    } finally {
      setRecalculateLoading(false);
    }
  };


  const handleConvertToFund = async (snapshotDate?: string) => {
    try {
      await convertToFund(portfolio.portfolioId, snapshotDate);
      // Refresh portfolio data without reloading page
      if (onPortfolioUpdate) {
        onPortfolioUpdate();
      }
    } catch (err) {
      // Error is handled by the hook
      throw err; // Re-throw to let the modal handle the error display
    }
  };

  const handleConvertToPortfolio = async () => {
    try {
      await apiService.convertFundToPortfolio(portfolio.portfolioId, accountId);
      // Refresh portfolio data without reloading page
      if (onPortfolioUpdate) {
        onPortfolioUpdate();
      }
      setConvertToPortfolioModalOpen(false);
    } catch (err) {
      console.error('Error converting fund to portfolio:', err);
      // Error handling can be added here
      throw err;
    }
  };

  const totalInvestment = holdings.reduce((sum, holding) => sum + Number(holding.totalInvestment), 0);
  const totalCurrentValue = holdings.reduce((sum, holding) => sum + Number(holding.currentValue), 0);
  const totalPnL = Number(totalCurrentValue) - Number(totalInvestment);

  if (!portfolio.isFund) {
    return (
      <>
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
              onClick={() => setConvertModalOpen(true)}
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : 'Convert to Fund'}
            </Button>
          </CardContent>
        </Card>

        {/* Convert to Fund Modal */}
        <ConvertToFundModal
          open={convertModalOpen}
          onClose={() => setConvertModalOpen(false)}
          portfolio={portfolio}
          onConvert={handleConvertToFund}
          loading={loading}
        />
      </>
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
              <Tooltip title="Recalculate NAV per Unit">
                <IconButton 
                  onClick={handleRecalculateNav} 
                  disabled={recalculateLoading || loading}
                  color="primary"
                  sx={{
                    '&:hover': {
                      backgroundColor: 'primary.light',
                      color: 'white',
                    }
                  }}
                >
                  {recalculateLoading ? <CircularProgress size={20} /> : <CalculateIcon />}
                </IconButton>
              </Tooltip>
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
                  {formatNumberWithSeparators(portfolio.totalOutstandingUnits || 0, 3)}
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
                  Total P&L (current value - capital)
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setSubscriptionModalOpen(true)}
                sx={{ minWidth: 150 }}
              >
                New Subscription
              </Button>
              <Button
                variant="outlined"
                startIcon={<RemoveIcon />}
                onClick={() => setRedemptionModalOpen(true)}
                sx={{ minWidth: 150 }}
              >
                Process Redemption
              </Button>
            </Box>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<ConvertIcon />}
              onClick={() => setConvertToPortfolioModalOpen(true)}
              sx={{ minWidth: 150 }}
            >
              Convert to Portfolio
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

      {/* Subscription Modal */}
      <SubscriptionModal
        open={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        portfolio={portfolio}
        onSubscriptionSuccess={() => {
          setSubscriptionModalOpen(false);
          refetch();
          onPortfolioUpdate?.();
        }}
      />

      {/* Redemption Modal */}
      <RedemptionModal
        open={redemptionModalOpen}
        onClose={() => setRedemptionModalOpen(false)}
        portfolio={portfolio}
        onRedemptionSuccess={() => {
          setRedemptionModalOpen(false);
          refetch();
          onPortfolioUpdate?.();
        }}
      />

      {/* Convert to Portfolio Modal */}
      <ConvertToPortfolioModal
        open={convertToPortfolioModalOpen}
        onClose={() => setConvertToPortfolioModalOpen(false)}
        portfolio={portfolio}
        onConvert={handleConvertToPortfolio}
      />
    </Box>
  );
};

export default NAVHoldingsManagement;
