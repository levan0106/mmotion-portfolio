/**
 * Asset List Component
 * Displays a list of assets with filtering, sorting, and pagination
 */

import React, { useState, useMemo } from 'react';
import { Asset, AssetFilters } from '../../types/asset.types';
import { useAssets } from '../../hooks/useAssets';
import { useAssetTypes } from '../../hooks/useAssetTypes';
import { useAccount } from '../../contexts/AccountContext';
import { 
  formatCurrency, 
  formatPercentage, 
  formatNumber
} from '../../utils/format';
import { 
  sortAssets, 
  calculateAssetPerformance 
} from '../../utils/asset.utils';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  TableSortLabel,
} from '@mui/material';
import { ResponsiveTypography } from '../Common';
import {
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import { ResponsiveButton } from '../Common';

export interface AssetListProps {
  portfolioId?: string;
  initialFilters?: AssetFilters;
  assets?: Asset[];
  loading?: boolean;
  error?: string | null;
  onAssetSelect?: (asset: Asset) => void;
  onAssetEdit?: (asset: Asset) => void;
  onAssetDelete?: (asset: Asset) => void;
  showActions?: boolean;
  className?: string;
}

export const AssetList: React.FC<AssetListProps> = ({
  portfolioId, // Keep for future use
  initialFilters = {},
  assets: propAssets = [],
  loading: propLoading = false,
  error: propError = null,
  onAssetSelect,
  onAssetEdit,
  onAssetDelete,
  showActions = true,
}) => {
  const { baseCurrency } = useAccount();
  
  // Use assets from props or fallback to hook
  const {
    assets: hookAssets,
    loading: hookLoading,
    error: hookError,
    refresh,
  } = useAssets({ 
    initialFilters: { 
      ...initialFilters, 
      ...(portfolioId && { portfolioId }) 
    }, 
    autoFetch: false
  });
  
  // Use props if provided, otherwise use hook
  const assets = propAssets.length > 0 ? propAssets : hookAssets;
  const loading = propLoading || hookLoading;
  const error = propError || hookError;

  // Use asset types hook
  const { assetTypes } = useAssetTypes();

  // Local state for UI
  // Local state for sorting only
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  // Process assets with local sorting only
  const processedAssets = useMemo(() => {
    return sortAssets(assets, sortBy, sortOrder);
  }, [assets, sortBy, sortOrder]);

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
    // Note: Sorting is handled locally, not via API
  };

  // Pagination functions removed - handled by parent component

  // Handle refresh
  const handleRefresh = () => {
    refresh();
  };

  // Render loading state
  if (loading && assets.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <ResponsiveTypography variant="body1" sx={{ mt: 2 }}>
          Loading assets...
        </ResponsiveTypography>
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Error: {error}
        </Alert>
        <ResponsiveButton
          onClick={handleRefresh}
          icon={<RefreshIcon />}
          mobileText="Retry"
          desktopText="Retry"
          variant="contained"
        >
          Retry
        </ResponsiveButton>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <ResponsiveTypography variant="h5" component="h2">
          Assets ({assets.length})
        </ResponsiveTypography>
        <ResponsiveButton
          onClick={handleRefresh}
          icon={<RefreshIcon />}
          mobileText="Refresh"
          desktopText="Refresh"
          variant="outlined"
          disabled={loading}
        >
          Refresh
        </ResponsiveButton>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'name'}
                  direction={sortBy === 'name' ? sortOrder.toLowerCase() as 'asc' | 'desc' : 'asc'}
                  onClick={() => handleSort('name')}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'type'}
                  direction={sortBy === 'type' ? sortOrder.toLowerCase() as 'asc' | 'desc' : 'asc'}
                  onClick={() => handleSort('type')}
                >
                  Type
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'totalValue'}
                  direction={sortBy === 'totalValue' ? sortOrder.toLowerCase() as 'asc' | 'desc' : 'asc'}
                  onClick={() => handleSort('totalValue')}
                >
                  Value
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'totalQuantity'}
                  direction={sortBy === 'totalQuantity' ? sortOrder.toLowerCase() as 'asc' | 'desc' : 'asc'}
                  onClick={() => handleSort('totalQuantity')}
                >
                  Quantity
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'currentPrice'}
                  direction={sortBy === 'currentPrice' ? sortOrder.toLowerCase() as 'asc' | 'desc' : 'asc'}
                  onClick={() => handleSort('currentPrice')}
                >
                  Market Price
                </TableSortLabel>
              </TableCell>
              <TableCell>Performance</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === 'updatedAt'}
                  direction={sortBy === 'updatedAt' ? sortOrder.toLowerCase() as 'asc' | 'desc' : 'asc'}
                  onClick={() => handleSort('updatedAt')}
                >
                  Updated
                </TableSortLabel>
              </TableCell>
              {showActions && <TableCell>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {processedAssets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showActions ? 8 : 7} sx={{ textAlign: 'center', py: 4 }}>
                  <ResponsiveTypography variant="tableCell" color="text.secondary">
                    No assets found
                  </ResponsiveTypography>
                </TableCell>
              </TableRow>
            ) : (
              processedAssets.map((asset) => {
                const performance = calculateAssetPerformance(asset);
                return (
                  <TableRow 
                    key={asset.id}
                    hover
                    onClick={() => onAssetSelect?.(asset)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Box>
                        <ResponsiveTypography variant="tableCell" fontWeight="medium">
                          {asset.name}
                        </ResponsiveTypography>
                        {asset.symbol && (
                          <ResponsiveTypography variant="caption" color="text.secondary">
                            {asset.symbol}
                          </ResponsiveTypography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={assetTypes.find(t => t.value === asset.type)?.label || asset.type}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <ResponsiveTypography variant="tableCell" fontWeight="medium">
                          {formatCurrency(Number(asset.totalValue) || 0)}
                        </ResponsiveTypography>
                        {asset.currentValue && asset.currentValue !== asset.initialValue && (
                          <ResponsiveTypography variant="caption" color="text.secondary">
                            Initial: {formatCurrency(asset.initialValue || 0)}
                          </ResponsiveTypography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <ResponsiveTypography variant="tableCell" fontWeight="medium">
                          {formatNumber(Number(asset.totalQuantity) || 0, 2)}
                        </ResponsiveTypography>
                        {asset.currentQuantity && asset.currentQuantity !== asset.initialQuantity && (
                          <ResponsiveTypography variant="caption" color="text.secondary">
                            Initial: {formatNumber(asset.initialQuantity || 0, 2)}
                          </ResponsiveTypography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <ResponsiveTypography variant="tableCell" fontWeight="medium">
                          {formatCurrency(Number(asset.currentPrice) || 0)}
                        </ResponsiveTypography>
                        {asset.avgCost !== undefined && asset.avgCost > 0 && asset.avgCost !== asset.currentPrice && (
                          <ResponsiveTypography variant="caption" color="text.secondary">
                            Avg: {formatCurrency(Number(asset.avgCost) || 0)}
                          </ResponsiveTypography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {performance.isGaining ? (
                          <TrendingUpIcon color="success" fontSize="small" />
                        ) : performance.isLosing ? (
                          <TrendingDownIcon color="error" fontSize="small" />
                        ) : (
                          <RemoveIcon color="disabled" fontSize="small" />
                        )}
                        <Box>
                          <ResponsiveTypography 
                            variant="tableCell" 
                            color={performance.isGaining ? 'success.main' : performance.isLosing ? 'error.main' : 'text.secondary'}
                            fontWeight="medium"
                          >
                            {formatCurrency(performance.valueChange, baseCurrency)}
                          </ResponsiveTypography>
                          <ResponsiveTypography 
                            variant="caption" 
                            color={performance.isGaining ? 'success.main' : performance.isLosing ? 'error.main' : 'text.secondary'}
                          >
                            {formatPercentage(performance.valueChangePercentage, 2)}
                          </ResponsiveTypography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <ResponsiveTypography variant="tableCell">
                        {new Date(asset.updatedAt).toLocaleDateString()}
                      </ResponsiveTypography>
                    </TableCell>
                    {showActions && (
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Edit Asset">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAssetEdit?.(asset);
                              }}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Asset">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAssetDelete?.(asset);
                              }}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination removed - handled by parent component */}
    </Box>
  );
};

export default AssetList;
