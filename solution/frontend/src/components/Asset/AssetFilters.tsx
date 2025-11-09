/**
 * Asset Filters Component
 * Provides filtering options for asset management
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AssetType, AssetFilters as AssetFiltersType } from '../../types/asset.types';
import { AssetTypeLabels } from '../../types/asset.types';
import { usePortfolios } from '../../hooks/usePortfolios';
import { useAccount } from '../../contexts/AccountContext';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Paper,
  Divider,
} from '@mui/material';
import { ResponsiveTypography } from '../Common';
import {
  ExpandMore as ExpandMoreIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { ResponsiveButton } from '../Common';

export interface AssetFiltersProps {
  filters: AssetFiltersType;
  onFiltersChange: (filters: AssetFiltersType) => void;
  onClearFilters: () => void;
  className?: string;
  showAdvanced?: boolean;
  onToggleAdvanced?: (show: boolean) => void;
}

export const AssetFilters: React.FC<AssetFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  showAdvanced = false,
  onToggleAdvanced,
}) => {
  // Get account and portfolios
  const { accountId } = useAccount();
  const { portfolios, isLoading: portfoliosLoading } = usePortfolios(accountId);

  // Local state for form inputs
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [selectedType, setSelectedType] = useState<AssetType | 'ALL'>(filters.type || 'ALL');
  const [selectedPortfolio, setSelectedPortfolio] = useState<string | 'ALL'>(filters.portfolioId || 'ALL');
  const [sortBy, setSortBy] = useState(filters.sortBy || 'name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>(filters.sortOrder || 'ASC');
  const [valueRange, setValueRange] = useState({
    min: filters.minValue?.toString() || '',
    max: filters.maxValue?.toString() || '',
  });
  const [limit, setLimit] = useState(filters.limit || 10);
  const [hasTrades, setHasTrades] = useState<boolean | undefined>(filters.hasTrades);

  // Update local state when filters prop changes
  useEffect(() => {
    setSearchTerm(filters.search || '');
    setSelectedType(filters.type || 'ALL');
    setSelectedPortfolio(filters.portfolioId || 'ALL');
    setSortBy(filters.sortBy || 'name');
    setSortOrder(filters.sortOrder || 'ASC');
    setValueRange({
      min: filters.minValue?.toString() || '',
      max: filters.maxValue?.toString() || '',
    });
    setLimit(filters.limit || 10);
    setHasTrades(filters.hasTrades);
  }, [filters]);

  // Handle search input with immediate update
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    onFiltersChange({
      ...filters,
      search: value || undefined,
    });
  }, [filters, onFiltersChange]);

  // Handle type filter
  const handleTypeChange = useCallback((type: AssetType | 'ALL') => {
    setSelectedType(type);
    onFiltersChange({
      ...filters,
      type: type === 'ALL' ? undefined : type,
    });
  }, [filters, onFiltersChange]);

  // Handle portfolio filter
  const handlePortfolioChange = useCallback((portfolioId: string | 'ALL') => {
    setSelectedPortfolio(portfolioId);
    onFiltersChange({
      ...filters,
      portfolioId: portfolioId === 'ALL' ? undefined : portfolioId,
    });
  }, [filters, onFiltersChange]);

  // Handle has trades filter
  const handleHasTradesChange = useCallback((value: boolean | undefined) => {
    setHasTrades(value);
    const newFilters = {
      ...filters,
      hasTrades: value,
    };
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange, hasTrades]);

  // Handle value range changes
  const handleValueRangeChange = useCallback((field: 'min' | 'max', value: string) => {
    const newValueRange = { ...valueRange, [field]: value };
    setValueRange(newValueRange);
    
    const minValue = newValueRange.min ? parseFloat(newValueRange.min) : undefined;
    const maxValue = newValueRange.max ? parseFloat(newValueRange.max) : undefined;
    
    onFiltersChange({
      ...filters,
      minValue,
      maxValue,
    });
  }, [filters, onFiltersChange, valueRange]);

  // Handle limit change
  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    onFiltersChange({
      ...filters,
      limit: newLimit,
    });
  }, [filters, onFiltersChange]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedType('ALL');
    setSelectedPortfolio('ALL');
    setHasTrades(undefined);
    setSortBy('name');
    setSortOrder('ASC');
    setValueRange({ min: '', max: '' });
    setLimit(10);
    onClearFilters();
  }, [onClearFilters]);

  // Toggle advanced filters
  const handleToggleAdvanced = useCallback(() => {
    onToggleAdvanced?.(!showAdvanced);
  }, [showAdvanced, onToggleAdvanced]);

  // Check if any filters are active
  const hasActiveFilters = searchTerm || selectedType !== 'ALL' || selectedPortfolio !== 'ALL' || hasTrades !== undefined || valueRange.min || valueRange.max;

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      {/* Basic Filters */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              endAdornment: searchTerm && (
                <ResponsiveButton
                  size="small"
                  onClick={() => handleSearchChange('')}
                  sx={{ minWidth: 'auto', p: 0.5 }}
                  icon={<ClearIcon fontSize="small" />}
                  mobileText=""
                  desktopText=""
                >
                  <ClearIcon fontSize="small" />
                </ResponsiveButton>
              ),
            }}
            size="small"
          />
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Asset Type</InputLabel>
              <Select
                value={selectedType}
                onChange={(e) => handleTypeChange(e.target.value as AssetType | 'ALL')}
                label="Asset Type"
              >
                <MenuItem value="ALL">All Types</MenuItem>
                {Object.entries(AssetTypeLabels).map(([type, label]) => (
                  <MenuItem key={type} value={type}>
                    {label as string}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Portfolio</InputLabel>
              <Select
                value={selectedPortfolio}
                onChange={(e) => handlePortfolioChange(e.target.value)}
                label="Portfolio"
                disabled={portfoliosLoading}
              >
                <MenuItem value="ALL">All Portfolios</MenuItem>
                {portfolios?.map((portfolio) => (
                  <MenuItem key={portfolio.portfolioId} value={portfolio.portfolioId}>
                    {portfolio.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={hasTrades === true}
                  onChange={(e) => handleHasTradesChange(e.target.checked ? true : undefined)}
                />
              }
              label="Has Trades"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order as 'ASC' | 'DESC');
                  onFiltersChange({
                    ...filters,
                    sortBy: field,
                    sortOrder: order as 'ASC' | 'DESC',
                  });
                }}
                label="Sort By"
              >
                <MenuItem value="name-ASC">Name A-Z</MenuItem>
                <MenuItem value="name-DESC">Name Z-A</MenuItem>
                <MenuItem value="totalValue-ASC">Value Low-High</MenuItem>
                <MenuItem value="totalValue-DESC">Value High-Low</MenuItem>
                <MenuItem value="totalQuantity-ASC">Quantity Low-High</MenuItem>
                <MenuItem value="totalQuantity-DESC">Quantity High-Low</MenuItem>
                <MenuItem value="updatedAt-ASC">Oldest First</MenuItem>
                <MenuItem value="updatedAt-DESC">Newest First</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Per Page</InputLabel>
              <Select
                value={limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                label="Per Page"
              >
                <MenuItem value={10}>10 per page</MenuItem>
                <MenuItem value={25}>25 per page</MenuItem>
                <MenuItem value={50}>50 per page</MenuItem>
                <MenuItem value={100}>100 per page</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ResponsiveButton
            onClick={handleToggleAdvanced}
            icon={<FilterListIcon />}
            mobileText={showAdvanced ? 'Hide' : 'Show'}
            desktopText={showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
            variant="outlined"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </ResponsiveButton>
          
          {hasActiveFilters && (
            <ResponsiveButton
              onClick={handleClearFilters}
              icon={<ClearIcon />}
              mobileText="Clear"
              desktopText="Clear All"
              variant="outlined"
            >
              Clear All
            </ResponsiveButton>
          )}
        </Box>
      </Box>

      {/* Advanced Filters */}
      {showAdvanced && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <ResponsiveTypography variant="h6">Advanced Filters</ResponsiveTypography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <ResponsiveTypography variant="subtitle2" gutterBottom>
                  Value Range
                </ResponsiveTypography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <TextField
                    type="number"
                    placeholder="Min value"
                    value={valueRange.min}
                    onChange={(e) => handleValueRangeChange('min', e.target.value)}
                    size="small"
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                  <ResponsiveTypography variant="body2">to</ResponsiveTypography>
                  <TextField
                    type="number"
                    placeholder="Max value"
                    value={valueRange.max}
                    onChange={(e) => handleValueRangeChange('max', e.target.value)}
                    size="small"
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <ResponsiveTypography variant="subtitle2" gutterBottom>
                  Sort Options
                </ResponsiveTypography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Sort by</InputLabel>
                      <Select
                        value={sortBy}
                        onChange={(e) => {
                          setSortBy(e.target.value);
                          onFiltersChange({
                            ...filters,
                            sortBy: e.target.value,
                          });
                        }}
                        label="Sort by"
                      >
                        <MenuItem value="name">Name</MenuItem>
                        <MenuItem value="type">Type</MenuItem>
                        <MenuItem value="totalValue">Total Value</MenuItem>
                        <MenuItem value="totalQuantity">Total Quantity</MenuItem>
                        <MenuItem value="createdAt">Created Date</MenuItem>
                        <MenuItem value="updatedAt">Updated Date</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Order</InputLabel>
                      <Select
                        value={sortOrder}
                        onChange={(e) => {
                          setSortOrder(e.target.value as 'ASC' | 'DESC');
                          onFiltersChange({
                            ...filters,
                            sortOrder: e.target.value as 'ASC' | 'DESC',
                          });
                        }}
                        label="Order"
                      >
                        <MenuItem value="ASC">Ascending</MenuItem>
                        <MenuItem value="DESC">Descending</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12} md={6}>
                <ResponsiveTypography variant="subtitle2" gutterBottom>
                  Results per page
                </ResponsiveTypography>
                <FormControl fullWidth size="small">
                  <InputLabel>Per Page</InputLabel>
                  <Select
                    value={limit}
                    onChange={(e) => handleLimitChange(Number(e.target.value))}
                    label="Per Page"
                  >
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={25}>25</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                    <MenuItem value={100}>100</MenuItem>
                    <MenuItem value={250}>250</MenuItem>
                    <MenuItem value={500}>500</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <Box sx={{ mt: 2 }}>
          <Divider sx={{ mb: 2 }} />
          <ResponsiveTypography variant="subtitle2" gutterBottom>
            Active filters:
          </ResponsiveTypography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {searchTerm && (
              <Chip
                label={`Search: "${searchTerm}"`}
                onDelete={() => handleSearchChange('')}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {selectedType !== 'ALL' && (
              <Chip
                label={`Type: ${AssetTypeLabels[selectedType]}`}
                onDelete={() => handleTypeChange('ALL')}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {selectedPortfolio !== 'ALL' && (
              <Chip
                label={`Portfolio: ${portfolios?.find(p => p.id === selectedPortfolio)?.name || selectedPortfolio}`}
                onDelete={() => handlePortfolioChange('ALL')}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {hasTrades !== undefined && (
              <Chip
                label={`Has Trades: ${hasTrades ? 'Yes' : 'No'}`}
                onDelete={() => handleHasTradesChange(undefined)}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {valueRange.min && (
              <Chip
                label={`Min: ${valueRange.min}`}
                onDelete={() => handleValueRangeChange('min', '')}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {valueRange.max && (
              <Chip
                label={`Max: ${valueRange.max}`}
                onDelete={() => handleValueRangeChange('max', '')}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default AssetFilters;
