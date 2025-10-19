/**
 * Holding Detail Modal Component
 * Shows subscription/redemption history for a specific holding
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
  Divider,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import ResponsiveTypography from '../Common/ResponsiveTypography';
import {
  Close as CloseIcon,
  TrendingUp,
  TrendingDown,
  AccountBalanceWallet,
  MonetizationOn,
  Assessment,
  Refresh,
} from '@mui/icons-material';
import { ResponsiveButton } from '../Common';
import { apiService } from '../../services/api';
import { formatCurrency, formatNumberWithSeparators } from '../../utils/format';
import { format, parseISO } from 'date-fns';
import { HoldingDetail, FundUnitTransactionWithCashFlow } from '../../types';

interface HoldingDetailModalProps {
  open: boolean;
  onClose: () => void;
  holdingId: string | null;
  holdingName?: string;
}

const HoldingDetailModal: React.FC<HoldingDetailModalProps> = ({
  open,
  onClose,
  holdingId,
  holdingName = 'Holding Details'
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [holdingDetail, setHoldingDetail] = useState<HoldingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHoldingDetail = async () => {
    if (!holdingId) return;

    setIsLoading(true);
    setError(null);

    try {
      const detail = await apiService.getHoldingDetail(holdingId);
      setHoldingDetail(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('holdings.error.fetchDetailsFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && holdingId) {
      fetchHoldingDetail();
    }
  }, [open, holdingId]);

  const getTransactionIcon = (transaction: any) => {
    return transaction.holdingType === 'SUBSCRIBE' ? <TrendingUp /> : <TrendingDown />;
  };

  const getTransactionColor = (transaction: any) => {
    return transaction.holdingType === 'SUBSCRIBE' ? 'success' : 'error';
  };

  const getTransactionLabel = (transaction: any) => {
    return transaction.holdingType === 'SUBSCRIBE' ? t('holdings.transaction.subscription') : t('holdings.transaction.redemption');
  };

  const summaryMetrics = holdingDetail ? [
    {
      title: t('holdings.modal.totalTransactions'),
      value: holdingDetail.summary.totalTransactions,
      subtitle: t('holdings.modal.allTransactions'),
      icon: <Assessment />,
      color: 'primary' as const,
    },
    {
      title: t('holdings.modal.totalSubscriptions'),
      value: holdingDetail.summary.totalSubscriptions,
      subtitle: t('holdings.modal.subscriptionCount'),
      icon: <TrendingUp />,
      color: 'success' as const,
    },
    {
      title: t('holdings.modal.totalRedemptions'),
      value: holdingDetail.summary.totalRedemptions,
      subtitle: t('holdings.modal.redemptionCount'),
      icon: <TrendingDown />,
      color: 'error' as const,
    },
    {
      title: t('holdings.modal.totalInvested'),
      value: formatCurrency(holdingDetail.summary.totalAmountInvested, 'VND'),
      subtitle: t('holdings.modal.amountInvested'),
      icon: <MonetizationOn />,
      color: 'info' as const,
    },
  ] : [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
          backdropFilter: 'blur(10px)',
          border: `0.5px solid ${alpha(theme.palette.divider, 0.1)}`,
          maxHeight: '90vh',
          height: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <ResponsiveTypography variant="cardTitle" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1.25rem' }}>
              {holdingName}
            </ResponsiveTypography>
            <ResponsiveTypography variant="pageSubtitle" color="text.secondary">
              {t('holdings.modal.subtitle')}
            </ResponsiveTypography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title={t('common.refresh')}>
              <IconButton onClick={fetchHoldingDetail} size="small" disabled={isLoading}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, overflow: 'auto', flex: 1 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={60} thickness={4} />
          </Box>
        ) : error ? (
          <Alert 
            severity="error" 
            sx={{ m: 3, borderRadius: 2 }}
          >
            <ResponsiveTypography variant="cardTitle" gutterBottom>
              {t('holdings.error.loadDetailsFailed')}
            </ResponsiveTypography>
            <ResponsiveTypography variant="tableCell">
              {error}
            </ResponsiveTypography>
            <ResponsiveButton onClick={fetchHoldingDetail} sx={{ mt: 1 }}>
              {t('common.tryAgain')}
            </ResponsiveButton>
          </Alert>
        ) : holdingDetail ? (
          <Box>
            {/* Summary Metrics */}
            <Box sx={{ p: 3, pb: 2 }}>
              <ResponsiveTypography variant="cardTitle" sx={{ mb: 2, fontWeight: 600 }}>
                {t('holdings.modal.summary')}
              </ResponsiveTypography>
              <Grid container spacing={2}>
                {summaryMetrics.map((metric, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card sx={{ 
                      height: '100%',
                      background: `linear-gradient(135deg, ${alpha(theme.palette[metric.color].main, 0.06)} 0%, ${alpha(theme.palette[metric.color].main, 0.03)} 100%)`,
                      border: `0.5px solid ${alpha(theme.palette[metric.color].main, 0.15)}`,
                      borderRadius: 2,
                    }}>
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {/* Left Column - Icon */}
                          <Box
                            sx={{
                              borderRadius: '50%',
                              background: alpha(theme.palette[metric.color].main, 0.08),
                              color: `${metric.color}.main`,
                              width: 40,
                              height: 40,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {React.cloneElement(metric.icon, { sx: { fontSize: 20 } })}
                          </Box>
                          
                          {/* Right Column - Text/Value */}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <ResponsiveTypography variant="cardLabel" sx={{color: 'text.primary', mb: 0.5 }}>
                              {metric.title}
                            </ResponsiveTypography>
                            <ResponsiveTypography variant="cardValue" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                              {metric.value}
                            </ResponsiveTypography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Divider />

            {/* Transaction History */}
            <Box sx={{ p: 3 }}>
              <ResponsiveTypography variant="cardTitle" sx={{ mb: 2, fontWeight: 600 }}>
                {t('holdings.detail.transactionHistory')}
              </ResponsiveTypography>
              
              {holdingDetail.transactions.length === 0 ? (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 6,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.5)} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}>
                  <AccountBalanceWallet sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <ResponsiveTypography variant="cardTitle" color="text.secondary">
                    {t('holdings.modal.noTransactions')}
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="cardLabel" color="text.secondary">
                    {t('holdings.modal.noTransactionsMessage')}
                  </ResponsiveTypography>
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.02) }}>
                        <TableCell>
                          <ResponsiveTypography variant="tableHeader">{t('holdings.table.type')}</ResponsiveTypography>
                        </TableCell>
                        <TableCell>
                          <ResponsiveTypography variant="tableHeader">{t('holdings.table.units')}</ResponsiveTypography>
                        </TableCell>
                        <TableCell>
                          <ResponsiveTypography variant="tableHeader">{t('holdings.table.navPerUnit')}</ResponsiveTypography>
                        </TableCell>
                        <TableCell>
                          <ResponsiveTypography variant="tableHeader">{t('holdings.table.amount')}</ResponsiveTypography>
                        </TableCell>
                        <TableCell>
                          <ResponsiveTypography variant="tableHeader">{t('holdings.table.date')}</ResponsiveTypography>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {holdingDetail.transactions.map((item: FundUnitTransactionWithCashFlow) => (
                        <TableRow 
                          key={item.transaction.transactionId}
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
                                  background: alpha(theme.palette[getTransactionColor(item.transaction)].main, 0.1),
                                  color: `${getTransactionColor(item.transaction)}.main`,
                                  width: 32,
                                  height: 32,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {React.cloneElement(getTransactionIcon(item.transaction), { sx: { fontSize: 16 } })}
                              </Box>
                              <Box>
                                <ResponsiveTypography variant="tableCell" sx={{ fontWeight: 600 }}>
                                  {getTransactionLabel(item.transaction)}
                                </ResponsiveTypography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <ResponsiveTypography variant="tableCell" sx={{ fontWeight: 500 }}>
                              {formatNumberWithSeparators(Number(item.transaction.units), 2)}
                            </ResponsiveTypography>
                          </TableCell>
                          <TableCell>
                            <ResponsiveTypography variant="tableCell">
                              {formatCurrency(Number(item.transaction.navPerUnit), 'VND')}
                            </ResponsiveTypography>
                          </TableCell>
                          <TableCell>
                            <ResponsiveTypography 
                              variant="tableCell" 
                              sx={{ 
                                fontWeight: 600,
                                color: item.transaction.holdingType === 'SUBSCRIBE' ? 'success.main' : 'error.main'
                              }}
                            >
                              {formatCurrency(Number(item.transaction.amount), 'VND')}
                            </ResponsiveTypography>
                          </TableCell>
                          <TableCell>
                            <ResponsiveTypography variant="tableCell" sx={{ fontWeight: 500 }}>
                              {format(parseISO(item.transaction.createdAt), 'MMM dd, yyyy')}
                            </ResponsiveTypography>
                            {/* <ResponsiveTypography variant="labelSmall" color="text.secondary">
                              {format(parseISO(item.transaction.createdAt), 'HH:mm')}
                            </ResponsiveTypography> */}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
        <ResponsiveButton onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
          {t('common.close')}
        </ResponsiveButton>
      </DialogActions>
    </Dialog>
  );
};

export default HoldingDetailModal;
