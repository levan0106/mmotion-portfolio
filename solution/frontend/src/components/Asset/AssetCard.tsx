/**
 * Asset Card Component
 * Displays individual asset information in a card format
 */

import React from 'react';
import { Asset } from '../../types/asset.types';
import { 
  formatCurrency, 
  formatPercentage,
  formatNumber
} from '../../utils/format';
import { AssetTypeLabels } from '../../types/asset.types';
import { useAccount } from '../../contexts/AccountContext';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import { ResponsiveButton, ActionButton } from '../Common';

export interface AssetCardProps {
  asset: Asset;
  onEdit?: (asset: Asset) => void;
  onDelete?: (asset: Asset) => void;
  onView?: (asset: Asset) => void;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

export const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  onEdit,
  onDelete,
  onView,
  showActions = true,
  compact = false,
}) => {
  const { baseCurrency } = useAccount();
  const performance = {
    valueChange: (Number(asset.totalValue) || 0) - (Number(asset.initialValue) || 0),
    valueChangePercentage: asset.initialValue ? (((Number(asset.totalValue) || 0) - (Number(asset.initialValue) || 0)) / (Number(asset.initialValue) || 1)) * 100 : 0,
    isGaining: (Number(asset.totalValue) || 0) > (Number(asset.initialValue) || 0),
    isLosing: (Number(asset.totalValue) || 0) < (Number(asset.initialValue) || 0),
  };

  const handleCardClick = () => {
    onView?.(asset);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(asset);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(asset);
  };

  return (
    <Card 
      sx={{ 
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3,
        },
        ...(compact && {
          '& .MuiCardContent-root': {
            padding: 1.5,
          },
        }),
      }}
      onClick={handleCardClick}
    >
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            {asset.symbol && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {asset.symbol}
              </Typography>
            )}
            <Typography variant="h6" component="h3" sx={{ fontWeight: 'medium' }}>
              {asset.name}
            </Typography>
          </Box>
          
          <Chip 
            label={AssetTypeLabels[asset.type as keyof typeof AssetTypeLabels] || asset.type}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>

        {/* Content */}
        <Box sx={{ mb: 2 }}>
          {/* Value Information */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Total Value
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(Number(asset.totalValue) || 0, baseCurrency)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Current Price
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {formatCurrency(asset.currentPrice || 0, baseCurrency)}
                </Typography>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Quantity
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {formatNumber(Number(asset.totalQuantity) || 0, 2)}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Performance */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Performance
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {performance.isGaining ? (
                <TrendingUpIcon color="success" fontSize="small" />
              ) : performance.isLosing ? (
                <TrendingDownIcon color="error" fontSize="small" />
              ) : (
                <RemoveIcon color="disabled" fontSize="small" />
              )}
              <Box>
                <Typography 
                  variant="body2" 
                  color={performance.isGaining ? 'success.main' : performance.isLosing ? 'error.main' : 'text.secondary'}
                  sx={{ fontWeight: 'medium' }}
                >
                  {formatCurrency(performance.valueChange, baseCurrency)}
                </Typography>
                <Typography 
                  variant="caption" 
                  color={performance.isGaining ? 'success.main' : performance.isLosing ? 'error.main' : 'text.secondary'}
                >
                  {formatPercentage(performance.valueChangePercentage, 2)}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Additional Info - Compact */}
          {!compact && (
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Updated
                </Typography>
                <Typography variant="body2">
                  {new Date(asset.updatedAt).toLocaleDateString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Trades
                </Typography>
                <Chip
                  label={asset.hasTrades ? 'Yes' : 'No'}
                  size="small"
                  color={asset.hasTrades ? 'success' : 'default'}
                  variant="outlined"
                />
              </Box>
            </Box>
          )}
        </Box>
      </CardContent>

      {/* Actions */}
      {showActions && (
        <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
          <ResponsiveButton
            onClick={handleEditClick}
            icon={<EditIcon />}
            mobileText="Edit"
            desktopText="Edit"
            variant="outlined"
            size="small"
          >
            Edit
          </ResponsiveButton>
          <ActionButton
            onClick={handleDeleteClick}
            icon={<DeleteIcon />}
            mobileText="Delete"
            desktopText="Delete"
            variant="outlined"
            color="error"
            size="small"
            forceTextOnly={true}
          >
            Delete
          </ActionButton>
        </CardActions>
      )}

      {/* Status Indicators */}
      <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 0.5 }}>
        {asset.hasTrades && (
          <Tooltip title="Has trading activity">
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: 'success.main',
              }}
            />
          </Tooltip>
        )}
        {performance.isGaining && (
          <Tooltip title="Positive performance">
            <TrendingUpIcon color="success" fontSize="small" />
          </Tooltip>
        )}
        {performance.isLosing && (
          <Tooltip title="Negative performance">
            <TrendingDownIcon color="error" fontSize="small" />
          </Tooltip>
        )}
        {!performance.isGaining && !performance.isLosing && (
          <Tooltip title="Neutral performance">
            <RemoveIcon color="disabled" fontSize="small" />
          </Tooltip>
        )}
      </Box>
    </Card>
  );
};

export default AssetCard;
