import React from 'react';
import {
  Box,
  Typography,
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
  Button,
} from '@mui/material';
import {
  Edit as EditIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { TradeSide, TradeType, TradeSource } from '../../types/trading';
import { formatCurrency, formatNumber } from '../../utils/format';

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
  onEdit?: (trade: Trade) => void;
  isLoading?: boolean;
}

/**
 * TradeDetails component for displaying comprehensive trade information.
 * Shows trade data, matched details, and P&L calculations.
 */
export const TradeDetails: React.FC<TradeDetailsProps> = ({
  trade,
  tradeDetails = [],
  onEdit,
  isLoading = false,
}) => {
  const getSideColor = (side: TradeSide) => {
    return side === TradeSide.BUY ? 'success' : 'error';
  };

  const getSideIcon = (side: TradeSide) => {
    return side === TradeSide.BUY ? <TrendingUpIcon /> : <TrendingDownIcon />;
  };

  const getTypeColor = (type: TradeType) => {
    switch (type) {
      case TradeType.MARKET:
        return 'primary';
      case TradeType.LIMIT:
        return 'secondary';
      case TradeType.STOP:
        return 'warning';
      default:
        return 'default';
    }
  };

  const getSourceColor = (source: TradeSource) => {
    switch (source) {
      case TradeSource.MANUAL:
        return 'info';
      case TradeSource.API:
        return 'success';
      case TradeSource.IMPORT:
        return 'warning';
      default:
        return 'default';
    }
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
            <Typography variant="h6" component="h2" fontWeight="bold" color="primary">
              Trade Details
            </Typography>
            <Box display="flex" gap={0.5}>
              <Chip
                label={trade.assetSymbol}
                color="primary"
                variant="outlined"
                size="small"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                label={trade.side}
                color={getSideColor(trade.side)}
                icon={getSideIcon(trade.side)}
                size="small"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                label={trade.tradeType}
                color={getTypeColor(trade.tradeType)}
                variant="outlined"
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            {onEdit && (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => onEdit(trade)}
                size="small"
                sx={{ 
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 2,
                  py: 0.5
                }}
              >
                Edit Trade
              </Button>
            )}
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {trade.assetName} • {format(parseISO(trade.tradeDate.toString()), 'MMM dd, yyyy HH:mm')}
        </Typography>
      </Box>

      {/* Trade Information - Simplified Layout */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom color="primary" fontWeight="bold" sx={{ mb: 1.5 }}>
          Trade Information
        </Typography>
        <Grid container spacing={2}>
          {/* Basic Info */}
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, border: 1, borderColor: 'grey.200' }}>
              <Typography variant="subtitle2" gutterBottom color="text.secondary" fontWeight="bold">
                Basic Information
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Trade ID
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace" fontWeight="medium">
                    {trade.tradeId.slice(0, 8)}...
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Date & Time
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {format(parseISO(trade.tradeDate.toString()), 'MMM dd, yyyy HH:mm')}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Asset
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {trade.assetSymbol} - {trade.assetName}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Type
                  </Typography>
                  <Chip
                    label={trade.tradeType}
                    color={getTypeColor(trade.tradeType)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Source
                  </Typography>
                  <Chip
                    label={trade.source}
                    color={getSourceColor(trade.source)}
                    size="small"
                  />
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* Financial Info */}
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, border: 1, borderColor: 'grey.200' }}>
              <Typography variant="subtitle2" gutterBottom color="text.secondary" fontWeight="bold">
                Financial Details
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Quantity
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatNumber(trade.quantity, 2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Price per Unit
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatCurrency(trade.price)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Value
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" color="info.main">
                    {formatCurrency(calculatedTotalValue)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Fees & Taxes
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" color="warning.main">
                    {formatCurrency(calculatedFeesAndTaxes)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Cost
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" color="primary.main">
                    {formatCurrency(calculatedTotalCost)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Realized P&L
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    color={trade.realizedPl && trade.realizedPl >= 0 ? 'success.main' : 'error.main'}
                  >
                    {trade.realizedPl ? formatCurrency(Number(trade.realizedPl) || 0) : 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Box>

        {/* Notes */}
        {trade.notes && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom color="primary" fontWeight="bold" sx={{ mb: 1 }}>
              Notes
            </Typography>
            <Box sx={{ p: 1.5, bgcolor: 'info.50', borderRadius: 1, border: 1, borderColor: 'info.200' }}>
              <Typography variant="body2">
                {trade.notes}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Trade Matching Details */}
        {trade.side === TradeSide.SELL && tradeDetails.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle1" gutterBottom color="primary" fontWeight="bold" sx={{ mb: 1.5 }}>
              Trade Matching Details
            </Typography>
            <Grid container spacing={1.5} mb={2}>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center" p={1.5} sx={{ bgcolor: 'success.50', borderRadius: 1, border: 1, borderColor: 'success.200' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Matched
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    {formatNumber(totalMatchedQuantity, 2)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center" p={1.5} sx={{ bgcolor: 'warning.50', borderRadius: 1, border: 1, borderColor: 'warning.200' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Remaining
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="warning.main">
                    {formatNumber(trade.remainingQuantity || 0, 2)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box textAlign="center" p={1.5} sx={{ 
                  bgcolor: totalRealizedPL >= 0 ? 'success.50' : 'error.50', 
                  borderRadius: 1,
                  border: 1,
                  borderColor: totalRealizedPL >= 0 ? 'success.200' : 'error.200'
                }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Realized P&L
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    color={totalRealizedPL >= 0 ? 'success.main' : 'error.main'}
                  >
                    {formatCurrency(totalRealizedPL)}
                  </Typography>
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
                    <TableCell sx={{ fontWeight: 600 }}>Buy Trade ID</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Matched Qty</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Buy Price</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Sell Price</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>P&L</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Matched Date</TableCell>
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
                        <Typography variant="body2" fontFamily="monospace" fontWeight="medium">
                          {detail.buyTradeId.slice(0, 8)}...
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatNumber(detail.matchedQty, 2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(detail.buyPrice)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(detail.sellPrice)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          color={detail.pnl >= 0 ? 'success.main' : 'error.main'}
                          fontWeight="bold"
                        >
                          {formatCurrency(detail.pnl)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {format(parseISO(detail.createdAt.toString()), 'MMM dd, yyyy')}
                        </Typography>
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
              <Typography variant="body2" fontWeight="medium">
                ⚠️ This sell trade has <strong>{formatNumber(trade.remainingQuantity || 0, 2)} units</strong> remaining unmatched.
                Consider matching with available buy trades to realize P&L.
              </Typography>
            </Alert>
          </Box>
        )}

        {/* Loading State */}
        {isLoading && (
          <Box display="flex" justifyContent="center" py={4}>
            <Typography>Loading trade details...</Typography>
          </Box>
        )}
    </Box>
  );
};

export default TradeDetails;
