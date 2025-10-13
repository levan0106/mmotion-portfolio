// SnapshotListFilters Component for CR-006 Asset Snapshot System

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as PortfolioIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { SnapshotGranularity } from '../../types/snapshot.types';
import { ResponsiveButton } from '../Common';

export interface SnapshotListFilters {
  viewMode: 'portfolio' | 'asset' | 'assetType';
  portfolioId?: string;
  assetId?: string;
  assetSymbol?: string;
  assetType?: string;
  granularity?: SnapshotGranularity;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
}

interface SnapshotListFiltersProps {
  filters: SnapshotListFilters;
  onFiltersChange: (filters: SnapshotListFilters) => void;
  portfolios: Array<{ portfolioId: string; name: string }>;
  assets: Array<{ id: string; symbol: string; type?: string }>;
  loading?: boolean;
}

const SnapshotListFilters: React.FC<SnapshotListFiltersProps> = ({
  filters,
  onFiltersChange,
  portfolios,
  assets,
  loading = false,
}) => {
  const [localFilters, setLocalFilters] = useState<SnapshotListFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof SnapshotListFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters: SnapshotListFilters = {
      viewMode: 'portfolio',
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  // const getViewModeIcon = (mode: string) => {
  //   switch (mode) {
  //     case 'portfolio':
  //       return <PortfolioIcon />;
  //     case 'asset':
  //       return <SearchIcon />;
  //     case 'assetType':
  //       return <CategoryIcon />;
  //     default:
  //       return <FilterIcon />;
  //   }
  // };

  const getViewModeDescription = (mode: string) => {
    switch (mode) {
      case 'portfolio':
        return 'View snapshots grouped by portfolio';
      case 'asset':
        return 'View snapshots for specific assets';
      case 'assetType':
        return 'View snapshots grouped by asset type';
      default:
        return '';
    }
  };

  // Get unique asset types from assets
  const assetTypes = Array.from(new Set(assets.map(asset => asset.type).filter(Boolean)));

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Filter & View Options
          </Typography>
        </Box>
        <ResponsiveButton
          variant="outlined"
          size="small"
          icon={<ClearIcon />}
          mobileText="Clear"
          desktopText="Clear All"
          onClick={handleClearFilters}
          disabled={loading}
          sx={{ textTransform: 'none' }}
        >
          Clear All
        </ResponsiveButton>
      </Box>

      {/* View Mode Selection */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
          View Mode
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <Chip
            label="By Portfolio"
            onClick={() => handleFilterChange('viewMode', 'portfolio')}
            color={localFilters.viewMode === 'portfolio' ? 'primary' : 'default'}
            icon={<PortfolioIcon />}
            clickable
            disabled={loading}
          />
          <Chip
            label="By Asset"
            onClick={() => handleFilterChange('viewMode', 'asset')}
            color={localFilters.viewMode === 'asset' ? 'primary' : 'default'}
            icon={<SearchIcon />}
            clickable
            disabled={loading}
          />
          <Chip
            label="By Asset Type"
            onClick={() => handleFilterChange('viewMode', 'assetType')}
            color={localFilters.viewMode === 'assetType' ? 'primary' : 'default'}
            icon={<CategoryIcon />}
            clickable
            disabled={loading}
          />
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {getViewModeDescription(localFilters.viewMode)}
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Filter Controls */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
        {/* Portfolio Filter */}
        {localFilters.viewMode === 'portfolio' && (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Portfolio</InputLabel>
            <Select
              value={localFilters.portfolioId || ''}
              onChange={(e) => handleFilterChange('portfolioId', e.target.value)}
              label="Portfolio"
              disabled={loading}
            >
              <MenuItem value="">
                <em>All Portfolios</em>
              </MenuItem>
              {portfolios.map((portfolio) => (
                <MenuItem key={portfolio.portfolioId} value={portfolio.portfolioId}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PortfolioIcon fontSize="small" />
                    <Box>
                      <Typography variant="body2">{portfolio.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {portfolio.portfolioId.substring(0, 8)}...
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Asset Filter */}
        {localFilters.viewMode === 'asset' && (
          <>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Asset Symbol</InputLabel>
              <Select
                value={localFilters.assetSymbol || ''}
                onChange={(e) => handleFilterChange('assetSymbol', e.target.value)}
                label="Asset Symbol"
                disabled={loading}
              >
                <MenuItem value="">
                  <em>All Assets</em>
                </MenuItem>
                {assets.map((asset) => (
                  <MenuItem key={asset.id} value={asset.symbol}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUpIcon fontSize="small" />
                      <Box>
                        <Typography variant="body2">{asset.symbol}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {asset.type || 'Unknown Type'}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        )}

        {/* Asset Type Filter */}
        {localFilters.viewMode === 'assetType' && (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Asset Type</InputLabel>
            <Select
              value={localFilters.assetType || ''}
              onChange={(e) => handleFilterChange('assetType', e.target.value)}
              label="Asset Type"
              disabled={loading}
            >
              <MenuItem value="">
                <em>All Types</em>
              </MenuItem>
              {assetTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CategoryIcon fontSize="small" />
                    <Typography variant="body2">{type}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Granularity Filter */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Granularity</InputLabel>
          <Select
            value={localFilters.granularity || ''}
            onChange={(e) => handleFilterChange('granularity', e.target.value)}
            label="Granularity"
            disabled={loading}
          >
            <MenuItem value="">
              <em>All</em>
            </MenuItem>
            <MenuItem value={SnapshotGranularity.DAILY}>Daily</MenuItem>
            <MenuItem value={SnapshotGranularity.WEEKLY}>Weekly</MenuItem>
            <MenuItem value={SnapshotGranularity.MONTHLY}>Monthly</MenuItem>
          </Select>
        </FormControl>

        {/* Date Range Filters */}
        <TextField
          size="small"
          type="date"
          label="Start Date"
          value={localFilters.startDate || ''}
          onChange={(e) => handleFilterChange('startDate', e.target.value)}
          disabled={loading}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 150 }}
        />
        <TextField
          size="small"
          type="date"
          label="End Date"
          value={localFilters.endDate || ''}
          onChange={(e) => handleFilterChange('endDate', e.target.value)}
          disabled={loading}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 150 }}
        />

        {/* Search Term */}
        <TextField
          size="small"
          label="Search"
          placeholder="Search snapshots..."
          value={localFilters.searchTerm || ''}
          onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
          disabled={loading}
          InputProps={{
            startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{ minWidth: 200 }}
        />
      </Box>

      {/* Active Filters Display */}
      {(localFilters.portfolioId || localFilters.assetSymbol || localFilters.assetType || 
        localFilters.granularity || localFilters.startDate || localFilters.endDate || 
        localFilters.searchTerm) && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Active Filters:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {localFilters.portfolioId && (
              <Chip
                label={`Portfolio: ${portfolios.find(p => p.portfolioId === localFilters.portfolioId)?.name || 'Unknown'}`}
                onDelete={() => handleFilterChange('portfolioId', '')}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {localFilters.assetSymbol && (
              <Chip
                label={`Asset: ${localFilters.assetSymbol}`}
                onDelete={() => handleFilterChange('assetSymbol', '')}
                size="small"
                color="secondary"
                variant="outlined"
              />
            )}
            {localFilters.assetType && (
              <Chip
                label={`Type: ${localFilters.assetType}`}
                onDelete={() => handleFilterChange('assetType', '')}
                size="small"
                color="info"
                variant="outlined"
              />
            )}
            {localFilters.granularity && (
              <Chip
                label={`Granularity: ${localFilters.granularity}`}
                onDelete={() => handleFilterChange('granularity', '')}
                size="small"
                color="warning"
                variant="outlined"
              />
            )}
            {localFilters.startDate && (
              <Chip
                label={`From: ${localFilters.startDate}`}
                onDelete={() => handleFilterChange('startDate', '')}
                size="small"
                color="default"
                variant="outlined"
              />
            )}
            {localFilters.endDate && (
              <Chip
                label={`To: ${localFilters.endDate}`}
                onDelete={() => handleFilterChange('endDate', '')}
                size="small"
                color="default"
                variant="outlined"
              />
            )}
            {localFilters.searchTerm && (
              <Chip
                label={`Search: "${localFilters.searchTerm}"`}
                onDelete={() => handleFilterChange('searchTerm', '')}
                size="small"
                color="default"
                variant="outlined"
              />
            )}
          </Stack>
        </Box>
      )}
    </Paper>
  );
};

export default SnapshotListFilters;
