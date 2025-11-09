import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  MoreVert as MoreVertIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { PositionResponseDto } from '../../types/trading';

export interface PositionCardProps {
  position: PositionResponseDto;
  onViewDetails?: (position: PositionResponseDto) => void;
  onSetRiskTargets?: (position: PositionResponseDto) => void;
  onViewPerformance?: (position: PositionResponseDto) => void;
  compact?: boolean;
}

/**
 * PositionCard component for displaying individual position information.
 * Shows key metrics in a card format with action buttons.
 */
export const PositionCard: React.FC<PositionCardProps> = ({
  position,
  onViewDetails,
  onSetRiskTargets,
  onViewPerformance,
  compact = false,
}) => {
  const getPerformanceColor = (pl: number): 'success' | 'error' | 'primary' => {
    if (pl > 0) return 'success';
    if (pl < 0) return 'error';
    return 'primary';
  };

  const getPerformanceIcon = (pl: number) => {
    if (pl > 0) return <TrendingUpIcon />;
    if (pl < 0) return <TrendingDownIcon />;
    return null;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number, decimals: number = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const formatPercentage = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num / 100);
  };

  const getPerformanceProgress = () => {
    const maxValue = Math.max(Math.abs(position.unrealizedPl), position.marketValue * 0.1);
    const progress = Math.min(Math.abs(position.unrealizedPl) / maxValue, 1);
    return progress * 100;
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: compact ? 1 : 2 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h6" component="h3" gutterBottom>
              {position.assetSymbol}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {position.assetName}
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Chip
              label={position.assetType}
              size="small"
              variant="outlined"
              color="primary"
            />
            <Tooltip title="Actions">
              <IconButton size="small">
                <MoreVertIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Performance Indicator */}
        <Box mb={2}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            {getPerformanceIcon(position.unrealizedPl)}
            <Typography
              variant="h5"
              color={getPerformanceColor(position.unrealizedPl)}
              fontWeight="bold"
            >
              {formatCurrency(position.unrealizedPl)}
            </Typography>
            <Typography
              variant="body2"
              color={getPerformanceColor(position.unrealizedPl)}
            >
              ({formatPercentage(position.unrealizedPlPercentage)})
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={getPerformanceProgress()}
            color={getPerformanceColor(position.unrealizedPl)}
            sx={{ height: 4, borderRadius: 2 }}
          />
        </Box>

        {/* Key Metrics */}
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Market Value
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {formatCurrency(position.marketValue)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Quantity
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {formatNumber(position.quantity, 2)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Avg Cost
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {formatCurrency(position.avgCost)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Market Price
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {formatCurrency(position.marketPrice)}
            </Typography>
          </Grid>
        </Grid>

        {/* Portfolio Weight */}
        <Box mt={2} mb={compact ? 1 : 2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Portfolio Weight
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {formatPercentage(position.portfolioWeight || 0)}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={position.portfolioWeight || 0}
            color="primary"
            sx={{ height: 3, borderRadius: 1.5 }}
          />
        </Box>

        {/* Additional Info (if not compact) */}
        {!compact && (
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Realized P&L
                </Typography>
                <Typography
                  variant="body2"
                  color={getPerformanceColor(position.realizedPl)}
                  fontWeight="medium"
                >
                  {formatCurrency(position.realizedPl)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Total P&L
                </Typography>
                <Typography
                  variant="body2"
                  color={getPerformanceColor(position.totalPl)}
                  fontWeight="medium"
                >
                  {formatCurrency(position.totalPl)}
                </Typography>
              </Grid>
            </Grid>

            {/* Trade Counts */}
            <Box mt={2} display="flex" gap={2}>
              {position.openTradesCount !== undefined && (
                <Typography variant="caption" color="text.secondary">
                  {position.openTradesCount} open trades
                </Typography>
              )}
              {position.closedTradesCount !== undefined && (
                <Typography variant="caption" color="text.secondary">
                  {position.closedTradesCount} closed trades
                </Typography>
              )}
            </Box>
          </Box>
        )}

        {/* Action Buttons */}
        {!compact && (
          <Box display="flex" gap={1} mt={2}>
            <Tooltip title="View Details">
              <IconButton
                size="small"
                onClick={() => onViewDetails?.(position)}
              >
                <TrendingUpIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Set Risk Targets">
              <IconButton
                size="small"
                onClick={() => onSetRiskTargets?.(position)}
              >
                <SecurityIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="View Performance">
              <IconButton
                size="small"
                onClick={() => onViewPerformance?.(position)}
              >
                <TrendingDownIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default PositionCard;
