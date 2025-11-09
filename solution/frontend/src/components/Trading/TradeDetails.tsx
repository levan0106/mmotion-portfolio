import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import {
  Box,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
} from '@mui/material';
import ResponsiveTypography from '../Common/ResponsiveTypography';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { TradeSide, TradeType, TradeSource } from '../../types/trading';
import { formatCurrency, formatDate, formatNumber } from '../../utils/format';

export interface TradeDetail {
  detailId: string;
  buyTradeId: string;
  sellTradeId: string;
  matchedQty: number;
  buyPrice: number;
  sellPrice: number;
  pnl: number;
  createdAt: Date;
}

export interface Trade {
  tradeId: string;
  portfolioId: string;
  assetId: string;
  assetSymbol?: string;
  assetName?: string;
  tradeDate: Date;
  side: TradeSide;
  quantity: number;
  price: number;
  totalValue: number;
  fee: number;
  tax: number;
  totalCost: number;
  tradeType: TradeType;
  source: TradeSource;
  exchange?: string;
  fundingSource?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  realizedPl?: number;
  tradeDetailsCount?: number;
  remainingQuantity?: number;
}

export interface TradeDetailsProps {
  trade: Trade;
  tradeDetails?: TradeDetail[];
  isLoading?: boolean;
}

/**
 * TradeDetails component for displaying comprehensive trade information.
 * Shows trade data, matched details, and P&L calculations.
 */
export const TradeDetails: React.FC<TradeDetailsProps> = ({
  trade,
  tradeDetails = [],
  isLoading = false,
}) => {
  const { t } = useTranslation();

  const getSideColor = (side: TradeSide) => {
    return side === TradeSide.BUY ? 'success' : 'error';
  };

  const getSideIcon = (side: TradeSide) => {
    return side === TradeSide.BUY ? <TrendingUpIcon /> : <TrendingDownIcon />;
  };


  const translateTradeSide = (side: TradeSide): string => {
    return t(`trading.${side.toLowerCase()}`);
  };

  const totalMatchedQuantity = tradeDetails.reduce((sum, detail) => sum + detail.matchedQty, 0);
  const totalRealizedPL = tradeDetails.reduce((sum, detail) => sum + detail.pnl, 0);
  
  // Calculate real-time values
  const calculatedTotalValue = trade.quantity * trade.price;
  const calculatedFeesAndTaxes = (Number(trade.fee) || 0) + (Number(trade.tax) || 0);
  const calculatedTotalCost = calculatedTotalValue + calculatedFeesAndTaxes;

  return (
    <Box>
      {/* Header */}
      <Box 
        sx={{ 
          bgcolor: 'grey.50', 
          p: 1.5, 
          borderRadius: 1, 
          mb: 2,
          border: 1,
          borderColor: 'grey.200'
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Box display="flex" alignItems="center" gap={1.5}>
            {/* <ResponsiveTypography variant="cardTitle" component="h2" fontWeight="bold" color="primary">
              {t('trading.tradeDetails.title')}
            </ResponsiveTypography> */}
            <Box display="flex" gap={0.5}>
              <Chip
                label={trade.assetSymbol}
                color="primary"
                variant="outlined"
                size="small"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                label={translateTradeSide(trade.side)}
                color={getSideColor(trade.side)}
                icon={getSideIcon(trade.side)}
                size="small"
                sx={{ fontWeight: 600 }}
              />
              {/* <Chip
                label={translateTradeType(trade.tradeType)}
                color={getTypeColor(trade.tradeType)}
                variant="outlined"
                size="small"
                sx={{ fontWeight: 600 }}
              /> */}
            </Box>
          </Box>
        </Box>
        <ResponsiveTypography variant="labelSmall" color="text.secondary">
          {trade.assetName} • {formatDate(trade.tradeDate, 'HH:mm dd/MM/yyyy')}
        </ResponsiveTypography>
      </Box>

      {/* Trade Information - Simplified Layout */}
      <Box sx={{ mb: 2 }}>
        <ResponsiveTypography variant="cardTitle" gutterBottom color="primary" fontWeight="bold" sx={{ mb: 1.5 }}>
          {t('trading.tradeDetails.tradeInformation')}
        </ResponsiveTypography>
        <Grid container spacing={2}>
          {/* Basic Info */}
          {/* <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, border: 1, borderColor: 'grey.200' }}>
              <ResponsiveTypography variant="cardLabel" gutterBottom color="text.secondary" fontWeight="bold">
                {t('trading.tradeDetails.basicInformation')}
              </ResponsiveTypography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <ResponsiveTypography variant="labelSmall" color="text.secondary">
                    {t('trading.tradeDetails.tradeId')}
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="labelSmall" fontFamily="monospace" fontWeight="medium">
                    {trade.tradeId.slice(0, 8)}...
                  </ResponsiveTypography>
                </Grid>
                <Grid item xs={6}>
                  <ResponsiveTypography variant="labelSmall" color="text.secondary">
                    {t('trading.tradeDetails.dateTime')}
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="labelSmall" fontWeight="medium">
                    {format(parseISO(trade.tradeDate.toString()), 'MMM dd, yyyy HH:mm')}
                  </ResponsiveTypography>
                </Grid>
                <Grid item xs={12}>
                  <ResponsiveTypography variant="labelSmall" color="text.secondary">
                    {t('trading.tradeDetails.asset')}
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="labelSmall" fontWeight="medium">
                    {trade.assetSymbol} - {trade.assetName}
                  </ResponsiveTypography>
                </Grid>
                <Grid item xs={6}>
                  <ResponsiveTypography variant="labelSmall" color="text.secondary">
                    {t('trading.tradeDetails.type')}
                  </ResponsiveTypography>
                  <Chip
                    label={translateTradeType(trade.tradeType)}
                    color={getTypeColor(trade.tradeType)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <ResponsiveTypography variant="labelSmall" color="text.secondary">
                    {t('trading.tradeDetails.source')}
                  </ResponsiveTypography>
                  <Chip
                    label={translateTradeSource(trade.source)}
                    color={getSourceColor(trade.source)}
                    size="small"
                  />
                </Grid>
              </Grid>
            </Box>
          </Grid> */}

            {/* Financial Info */}
            <Grid item xs={12} md={12}>
              <Box sx={(theme) => ({ 
                border: `1px solid ${theme.palette.divider}`, 
                borderRadius: 1,
                overflow: 'hidden'
              })}>
                <Grid container>
                  {/* Left Column */}
                  <Grid item xs={12} md={6}>
                    <Box sx={(theme) => ({
                      borderRight: { xs: 'none', md: `1px solid ${theme.palette.divider}` }
                    })}>
                      {/* Quantity */}
                      <Box sx={(theme) => ({ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        p: 2,
                        borderBottom: `1px solid ${theme.palette.divider}`
                      })}>
                        <ResponsiveTypography variant="cardLabel">
                          {t('trading.tradeDetails.quantity')}
                        </ResponsiveTypography>
                        <ResponsiveTypography variant="cardValue">
                          {formatNumber(trade.quantity, 2)}
                        </ResponsiveTypography>
                      </Box>

                      {/* Price Per Unit */}
                      <Box sx={(theme) => ({ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        p: 2,
                        borderBottom: `1px solid ${theme.palette.divider}`
                      })}>
                        <ResponsiveTypography variant="cardLabel">
                          {t('trading.tradeDetails.pricePerUnit')}
                        </ResponsiveTypography>
                        <ResponsiveTypography variant="cardValue">
                          {formatCurrency(trade.price)}
                        </ResponsiveTypography>
                      </Box>

                      {/* Total Value */}
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        p: 2
                      }}>
                        <ResponsiveTypography variant="cardLabel">
                          {t('trading.tradeDetails.totalValue')}
                        </ResponsiveTypography>
                        <ResponsiveTypography variant="cardValue">
                          {formatCurrency(calculatedTotalValue)}
                        </ResponsiveTypography>
                      </Box>
                    </Box>
                  </Grid>

                  {/* Right Column */}
                  <Grid item xs={12} md={6}>
                    {/* Fees & Taxes */}
                    <Box sx={(theme) => ({ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      p: 2,
                      borderBottom: `1px solid ${theme.palette.divider}`
                    })}>
                      <ResponsiveTypography variant="cardLabel">
                        {t('trading.tradeDetails.feesTaxes')}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="cardValue">
                        {formatCurrency(calculatedFeesAndTaxes)}
                      </ResponsiveTypography>
                    </Box>

                    {/* Total Cost */}
                    <Box sx={(theme) => ({ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      p: 2,
                      borderBottom: `1px solid ${theme.palette.divider}`
                    })}>
                      <ResponsiveTypography variant="cardLabel">
                        {t('trading.tradeDetails.totalCost')}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="cardValue">
                        {formatCurrency(calculatedTotalCost)}
                      </ResponsiveTypography>
                    </Box>

                    {/* Realized P&L */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      p: 2
                    }}>
                      <ResponsiveTypography variant="cardLabel">
                        {t('trading.tradeDetails.realizedPL')}
                      </ResponsiveTypography>
                      <ResponsiveTypography
                        variant="cardValue"
                        fontWeight="bold"
                        color={trade.realizedPl && trade.realizedPl >= 0 ? 'success.main' : 'error.main'}
                      >
                        {trade.realizedPl ? formatCurrency(Number(trade.realizedPl) || 0) : t('common.na')}
                      </ResponsiveTypography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
        </Grid>
      </Box>

        {/* Notes */}
        {trade.notes && (
          <Box mb={2}>
            <ResponsiveTypography variant="cardTitle" gutterBottom color="primary" fontWeight="bold" sx={{ mb: 1 }}>
              {t('trading.tradeDetails.notes')}
            </ResponsiveTypography>
            <Box sx={{ p: 1.5, bgcolor: 'info.50', borderRadius: 1, border: 1, borderColor: 'info.200' }}>
              <ResponsiveTypography variant="labelSmall">
                {trade.notes}
              </ResponsiveTypography>
            </Box>
          </Box>
        )}

        {/* Trade Matching Details */}
        {trade.side === TradeSide.SELL && tradeDetails.length > 0 && (
          <Box mb={2}>
            <ResponsiveTypography variant="cardTitle" gutterBottom color="primary" fontWeight="bold" sx={{ mb: 1.5 }}>
              {t('trading.tradeDetails.tradeMatchingDetails')}
            </ResponsiveTypography>
            <Grid container spacing={1.5} mb={2}>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center" p={1.5} sx={{ bgcolor: 'success.50', borderRadius: 1, border: 1, borderColor: 'success.200' }}>
                  <ResponsiveTypography variant="labelSmall" color="text.secondary" gutterBottom>
                    {t('trading.tradeDetails.totalMatched')}
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="cardValue" fontWeight="bold" color="success.main">
                    {formatNumber(totalMatchedQuantity, 2)}
                  </ResponsiveTypography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center" p={1.5} sx={{ bgcolor: 'warning.50', borderRadius: 1, border: 1, borderColor: 'warning.200' }}>
                  <ResponsiveTypography variant="labelSmall" color="text.secondary" gutterBottom>
                    {t('trading.tradeDetails.remaining')}
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="cardValue" fontWeight="bold" color="warning.main">
                    {formatNumber(trade.remainingQuantity || 0, 2)}
                  </ResponsiveTypography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center" p={1.5} sx={{ 
                  bgcolor: totalRealizedPL >= 0 ? 'success.50' : 'error.50', 
                  borderRadius: 1,
                  border: 1,
                  borderColor: totalRealizedPL >= 0 ? 'success.200' : 'error.200'
                }}>
                  <ResponsiveTypography variant="labelSmall" color="text.secondary" gutterBottom>
                    {t('trading.tradeDetails.totalRealizedPL')}
                  </ResponsiveTypography>
                  <ResponsiveTypography
                    variant="cardValue"
                    fontWeight="bold"
                    color={totalRealizedPL >= 0 ? 'success.main' : 'error.main'}
                  >
                    {formatCurrency(totalRealizedPL)}
                  </ResponsiveTypography>
                </Box>
              </Grid>
            </Grid>

            <TableContainer 
              component={Paper} 
              variant="outlined"
              sx={{ 
                borderRadius: 1,
                boxShadow: 1
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600 }}>{t('trading.tradeDetails.buyTradeId')}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{t('trading.tradeDetails.matchedQty')}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{t('trading.tradeDetails.buyPrice')}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{t('trading.tradeDetails.sellPrice')}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{t('trading.tradeDetails.pl')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('trading.tradeDetails.matchedDate')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tradeDetails.map((detail) => (
                    <TableRow 
                      key={detail.detailId}
                      sx={{ 
                        '&:nth-of-type(odd)': { bgcolor: 'grey.25' },
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <TableCell>
                        <ResponsiveTypography variant="labelSmall" fontFamily="monospace" fontWeight="medium">
                          {detail.buyTradeId.slice(0, 8)}...
                        </ResponsiveTypography>
                      </TableCell>
                      <TableCell align="right">
                        <ResponsiveTypography variant="labelSmall" fontWeight="medium">
                          {formatNumber(detail.matchedQty, 2)}
                        </ResponsiveTypography>
                      </TableCell>
                      <TableCell align="right">
                        <ResponsiveTypography variant="labelSmall" fontWeight="medium">
                          {formatCurrency(detail.buyPrice)}
                        </ResponsiveTypography>
                      </TableCell>
                      <TableCell align="right">
                        <ResponsiveTypography variant="labelSmall" fontWeight="medium">
                          {formatCurrency(detail.sellPrice)}
                        </ResponsiveTypography>
                      </TableCell>
                      <TableCell align="right">
                        <ResponsiveTypography
                          variant="labelSmall"
                          color={detail.pnl >= 0 ? 'success.main' : 'error.main'}
                          fontWeight="bold"
                        >
                          {formatCurrency(detail.pnl)}
                        </ResponsiveTypography>
                      </TableCell>
                      <TableCell>
                        <ResponsiveTypography variant="labelSmall" fontWeight="medium">
                          {format(parseISO(detail.createdAt.toString()), 'MMM dd, yyyy')}
                        </ResponsiveTypography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Unmatched Trade Alert */}
        {trade.side === TradeSide.SELL && (trade.remainingQuantity || 0) > 0 && (
          <Box mb={2}>
            <Alert 
              severity="warning" 
              variant="outlined"
              sx={{ 
                borderRadius: 1,
                '& .MuiAlert-message': {
                  width: '100%'
                }
              }}
            >
              <ResponsiveTypography variant="labelSmall" fontWeight="medium">
                <Trans
                  i18nKey="trading.tradeDetails.unmatchedTradeWarning"
                  values={{ quantity: formatNumber(trade.remainingQuantity || 0, 2) }}
                  components={{ strong: <strong /> }}
                />
              </ResponsiveTypography>
            </Alert>
          </Box>
        )}

        {/* Loading State */}
        {isLoading && (
          <Box display="flex" justifyContent="center" py={4}>
            <ResponsiveTypography variant="labelSmall">{t('trading.tradeDetails.loadingTradeDetails')}</ResponsiveTypography>
          </Box>
        )}
    </Box>
  );
};

export default TradeDetails;
