/**
 * NAV Holdings Management Component
 * Manages fund subscriptions, redemptions, and investor holdings
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { ResponsiveButton } from '../Common';
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
import ResponsiveTypography from '../Common/ResponsiveTypography';

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
  const { t } = useTranslation();
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
      await apiService.refreshNavPerUnit(portfolio.portfolioId);
      // Step 2: Recalculate all investor holdings with new NAV
      await apiService.recalculateAllHoldings(portfolio.portfolioId);
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
            <ResponsiveTypography variant="cardTitle" gutterBottom>
              {t('nav.holdings.notFund')}
            </ResponsiveTypography>
            <ResponsiveTypography variant="cardLabel" color="text.secondary" sx={{ mb: 3 }}>
              {t('nav.holdings.notFundMessage')}
            </ResponsiveTypography>
            <ResponsiveButton 
              variant="contained" 
              icon={<AccountBalanceIcon />}
              mobileText={t('nav.holdings.convert')}
              desktopText={t('nav.holdings.convertToFund')}
              onClick={() => setConvertModalOpen(true)}
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : t('nav.holdings.convertToFund')}
            </ResponsiveButton>
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
            <ResponsiveTypography variant="pageTitle" sx={{ fontWeight: 600 }}>
              {t('nav.holdings.fundSummary')}
            </ResponsiveTypography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title={t('nav.holdings.recalculateNav')}>
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
              <Tooltip title={t('nav.holdings.refreshHoldings')}>
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
            <Grid item xs={6} sm={6} md={2.4}>
              <Box sx={{ textAlign: 'center', p: 1 }}>
                <ResponsiveTypography variant="labelSmall" color="text.secondary">
                  {t('nav.holdings.navPerUnit')}
                </ResponsiveTypography>
                <ResponsiveTypography variant="cardValue" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {formatCurrency(portfolio.navPerUnit || 0, portfolio.baseCurrency)}
                </ResponsiveTypography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={6} md={2.4}>
              <Box sx={{ textAlign: 'center', p: 1 }}>
                <ResponsiveTypography variant="labelSmall" color="text.secondary">
                  {t('nav.holdings.totalOutstandingUnits')}
                </ResponsiveTypography>
                <ResponsiveTypography variant="cardValue" sx={{ fontWeight: 600 }}>
                  {formatNumberWithSeparators(portfolio.totalOutstandingUnits || 0, 3)}
                </ResponsiveTypography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={6} md={2.4} sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Box sx={{ textAlign: 'center', p: 1 }}>
                <ResponsiveTypography variant="labelSmall" color="text.secondary">
                  {t('nav.holdings.numberOfInvestors')}
                </ResponsiveTypography>
                <ResponsiveTypography variant="cardValue" sx={{ fontWeight: 600 }}>
                  {formatNumberWithSeparators(holdings.length, 0)}
                </ResponsiveTypography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={6} md={2.4}>
              <Box sx={{ textAlign: 'center', p: 1 }}>
                <ResponsiveTypography variant="labelSmall" color="text.secondary">
                  {t('nav.holdings.totalPnL')}
                </ResponsiveTypography>
                <ResponsiveTypography 
                  variant="cardValue" 
                  sx={{ 
                    fontWeight: 600,
                    color: totalPnL >= 0 ? 'success.main' : 'error.main'
                  }}
                >
                  {formatCurrency(totalPnL, portfolio.baseCurrency)}
                </ResponsiveTypography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={6} md={2.4}>
              <Box sx={{ textAlign: 'center', p: 1 }}>
                <ResponsiveTypography variant="labelSmall" color="text.secondary">
                  {t('nav.holdings.lastNavUpdate')}
                </ResponsiveTypography>
                <ResponsiveTypography variant="cardValue" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
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
                </ResponsiveTypography>
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
              <ResponsiveButton
                variant="contained"
                icon={<AddIcon />}
                mobileText={t('nav.holdings.new')}
                desktopText={t('nav.holdings.newSubscription')}
                onClick={() => setSubscriptionModalOpen(true)}
                sx={{ minWidth: 150 }}
              >
                {t('nav.holdings.newSubscription')}
              </ResponsiveButton>
              <ResponsiveButton
                variant="outlined"
                icon={<RemoveIcon />}
                mobileText={t('nav.holdings.process')}
                desktopText={t('nav.holdings.processRedemption')}
                onClick={() => setRedemptionModalOpen(true)}
                sx={{ minWidth: 150 }}
              >
                {t('nav.holdings.processRedemption')}
              </ResponsiveButton>
            </Box>
            <ResponsiveButton
              variant="outlined"
              color="warning"
              icon={<ConvertIcon />}
              mobileText={t('nav.holdings.convert')}
              desktopText={t('nav.holdings.convertToPortfolio')}
              onClick={() => setConvertToPortfolioModalOpen(true)}
              sx={{ minWidth: 150 }}
            >
              {t('nav.holdings.convertToPortfolio')}
            </ResponsiveButton>
          </Box>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: getUltraSpacing(2, 1) }}>
          <ResponsiveTypography variant="tableCell">
            {error}
          </ResponsiveTypography>
        </Alert>
      )}

      {/* Investor Holdings Table */}
      <Card>
        <CardContent sx={{ p: getUltraSpacing(2, 1.5) }}>
          <ResponsiveTypography variant="cardTitle" sx={{ fontWeight: 600, mb: 2 }}>
            {t('nav.holdings.investorHoldings')}
          </ResponsiveTypography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : holdings.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <ResponsiveTypography variant="tableCell" color="text.secondary">
                {t('nav.holdings.noHoldings')}
              </ResponsiveTypography>
              <ResponsiveTypography variant="labelSmall" color="text.secondary" sx={{ mt: 1 }}>
                {t('nav.holdings.noHoldingsMessage')}
              </ResponsiveTypography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <ResponsiveTypography variant="tableHeaderSmall">{t('nav.holdings.investor')}</ResponsiveTypography>
                    </TableCell>
                    <TableCell align="right">
                      <ResponsiveTypography variant="tableHeaderSmall">{t('nav.holdings.units')}</ResponsiveTypography>
                    </TableCell>
                    <TableCell align="right">
                      <ResponsiveTypography variant="tableHeaderSmall">{t('nav.holdings.avgCost')}</ResponsiveTypography>
                    </TableCell>
                    <TableCell align="right">
                      <ResponsiveTypography variant="tableHeaderSmall">{t('nav.holdings.totalInvestment')}</ResponsiveTypography>
                    </TableCell>
                    <TableCell align="right">
                      <ResponsiveTypography variant="tableHeaderSmall">{t('nav.holdings.currentValue')}</ResponsiveTypography>
                    </TableCell>
                    <TableCell align="right">
                      <ResponsiveTypography variant="tableHeaderSmall">{t('nav.holdings.unrealizedPnL')}</ResponsiveTypography>
                    </TableCell>
                    <TableCell align="right">
                      <ResponsiveTypography variant="tableHeaderSmall">{t('nav.holdings.returnPercent')}</ResponsiveTypography>
                    </TableCell>
                    <TableCell align="center">
                      <ResponsiveTypography variant="tableHeaderSmall">{t('common.actions')}</ResponsiveTypography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {holdings.map((holding) => {
                    const returnPercentage = holding.totalInvestment > 0 
                      ? ((holding.currentValue - holding.totalInvestment) / holding.totalInvestment) * 100 
                      : 0;
                    
                    return (
                      <TableRow 
                        key={holding.holdingId}
                        onClick={() => navigate(`/holdings/${holding.holdingId}?from=nav`)}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                          '&:active': {
                            backgroundColor: 'action.selected',
                          }
                        }}
                      >
                        <TableCell>
                          <Box>
                            <ResponsiveTypography variant="tableCell" sx={{ fontWeight: 600 }}>
                              {holding.account?.name || 'Unknown'}
                            </ResponsiveTypography>
                            <ResponsiveTypography variant="labelSmall" color="text.secondary">
                              {holding.account?.email || 'No email'}
                            </ResponsiveTypography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <ResponsiveTypography variant="tableCell">
                            {formatNumberWithSeparators(holding.totalUnits, 3)}
                          </ResponsiveTypography>
                        </TableCell>
                        <TableCell align="right">
                          <ResponsiveTypography variant="tableCell">
                            {formatCurrency(holding.avgCostPerUnit, portfolio.baseCurrency)}
                          </ResponsiveTypography>
                        </TableCell>
                        <TableCell align="right">
                          <ResponsiveTypography variant="tableCell">
                            {formatCurrency(holding.totalInvestment, portfolio.baseCurrency)}
                          </ResponsiveTypography>
                        </TableCell>
                        <TableCell align="right">
                          <ResponsiveTypography variant="tableCell">
                            {formatCurrency(holding.currentValue, portfolio.baseCurrency)}
                          </ResponsiveTypography>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                            {holding.unrealizedPnL >= 0 ? (
                              <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                            ) : (
                              <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
                            )}
                            <ResponsiveTypography 
                              variant="tableCell" 
                              sx={{ 
                                color: holding.unrealizedPnL >= 0 ? 'success.main' : 'error.main',
                                fontWeight: 600
                              }}
                            >
                              {formatCurrency(holding.unrealizedPnL, portfolio.baseCurrency)}
                            </ResponsiveTypography>
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
                          <Tooltip title={t('nav.holdings.viewDetails')}>
                            <IconButton 
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/holdings/${holding.holdingId}?from=nav`);
                              }}
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
