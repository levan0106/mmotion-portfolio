import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Box,
  Typography,
  Chip,
  Button,
  Alert,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Asset } from '../../types/asset.types';
import { useAssets } from '../../hooks/useAssets';
import { useAccount } from '../../hooks/useAccount';
import { formatCurrency } from '../../utils/format';

export interface AssetAutocompleteProps {
  value?: string;
  onChange: (assetId: string | null) => void;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  required?: boolean;
  showCreateOption?: boolean;
  onCreateAsset?: () => void;
  currency?: string; // Base currency for formatting
}

/**
 * AssetAutocomplete component with search and pagination support
 * Provides a searchable dropdown for selecting assets with load more functionality
 */
export const AssetAutocomplete: React.FC<AssetAutocompleteProps> = ({
  value,
  onChange,
  error = false,
  helperText,
  disabled = false,
  placeholder = "Search assets...",
  label = "Asset",
  required = false,
  showCreateOption = true,
  onCreateAsset,
  currency = 'VND', // Default to VND if not provided
}) => {
  const { accountId } = useAccount();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Refs to track previous values and prevent unnecessary updates
  const prevValueRef = useRef<string | undefined>(value);
  const prevSelectedAssetRef = useRef<Asset | null>(null);
  const hasInitializedRef = useRef(false);
  const prevSearchTermRef = useRef<string>('');

  // Use assets hook with search functionality
  const {
    assets,
    loading,
    error: assetsError,
    pagination,
    updateFilter,
  } = useAssets({
    initialFilters: {
      createdBy: accountId,
      limit: 50, // Load more assets initially
      page: 1,
      sortBy: 'name',
      sortOrder: 'ASC',
    },
    autoFetch: true,
  });

  // Use ref to avoid dependency issues
  const updateFilterRef = useRef(updateFilter);
  updateFilterRef.current = updateFilter;

  // Update search filter when search term changes
  useEffect(() => {
    // Don't call API if search term hasn't actually changed
    if (prevSearchTermRef.current === searchTerm) {
      return;
    }

    // Mark as initialized after first search
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
    }

    // Update previous search term
    prevSearchTermRef.current = searchTerm;

    const timeoutId = setTimeout(() => {
      // If search term is empty, reset to first page and clear search
      if (searchTerm.trim() === '') {
        updateFilterRef.current('search', '');
        updateFilterRef.current('page', 1);
      } else {
        updateFilterRef.current('search', searchTerm);
        updateFilterRef.current('page', 1); // Reset to first page for new search
      }
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Check if there are more assets to load
  useEffect(() => {
    setHasMore(pagination.page < pagination.totalPages);
  }, [pagination]);

  // Reset hasMore when search term is cleared
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setHasMore(pagination.page < pagination.totalPages);
    }
  }, [searchTerm, pagination]);

  // Find selected asset when value changes (only when value changes, not assets)
  useEffect(() => {
    // Only process if value actually changed
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      
      if (value && assets.length > 0) {
        const asset = assets.find(a => a.id === value);
        // Only update if the asset actually changed
        if (asset && asset.id !== prevSelectedAssetRef.current?.id) {
          setSelectedAsset(asset);
          prevSelectedAssetRef.current = asset;
        }
      } else if (!value && prevSelectedAssetRef.current) {
        setSelectedAsset(null);
        prevSelectedAssetRef.current = null;
      }
    }
  }, [value, assets]); // Re-add assets but with proper change detection

  // Effect to handle case when assets are loaded and we have a value but no selectedAsset
  // This handles the edit modal case where value is set before assets are loaded
  useEffect(() => {
    if (value && !selectedAsset && assets.length > 0 && !loading) {
      const asset = assets.find(a => a.id === value);
      if (asset) {
        setSelectedAsset(asset);
        prevSelectedAssetRef.current = asset;
      }
    }
  }, [value, selectedAsset, assets, loading]);



  // Load more assets
  const loadMore = useCallback(async () => {
    if (hasMore && !isLoadingMore) {
      setIsLoadingMore(true);
      try {
        updateFilterRef.current('page', pagination.page + 1);
      } finally {
        setIsLoadingMore(false);
      }
    }
  }, [hasMore, isLoadingMore, pagination.page]);

  // Handle asset selection
  const handleAssetChange = useCallback((_event: any, newValue: Asset | null) => {
    // Only update if the value actually changed
    if (newValue?.id !== selectedAsset?.id) {
      setSelectedAsset(newValue);
      onChange(newValue?.id || null);
    }
  }, [onChange, selectedAsset?.id]);

  // Handle input change for search
  const handleInputChange = useCallback((_event: any, newInputValue: string) => {
    setSearchTerm(newInputValue);
  }, []);

  // Stable load more option to prevent re-creation
  const loadMoreOption = useMemo(() => ({
    id: '__load_more__',
    symbol: '',
    name: 'Load more assets...',
    label: 'Load more assets...',
    type: 'LOAD_MORE',
    currentPrice: 0,
    currentQuantity: 0,
    totalValue: 0,
    unrealizedPl: 0,
    realizedPl: 0,
    performance: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any), []);

  // Memoize options to prevent unnecessary re-renders
  const options = useMemo(() => {
    const assetOptions = assets.map(asset => ({
      ...asset,
      label: `${asset.symbol || 'N/A'} - ${asset.name}`,
    }));

    // Add load more option if there are more assets
    if (hasMore) {
      assetOptions.push(loadMoreOption);
    }

    return assetOptions;
  }, [assets, hasMore, loadMoreOption]);

  // Handle option selection
  const handleOptionClick = useCallback((option: any) => {
    if (option.id === '__load_more__') {
      loadMore();
      return;
    }
    handleAssetChange(null, option);
  }, [loadMore, handleAssetChange]);

  return (
    <Box>
      <Autocomplete
        value={selectedAsset}
        onChange={handleAssetChange}
        inputValue={searchTerm}
        onInputChange={handleInputChange}
        options={options}
        getOptionLabel={(option) => (option as any).label || `${option.symbol || 'N/A'} - ${option.name}`}
        isOptionEqualToValue={(option, value) => option.id === value?.id}
        loading={loading}
        disabled={disabled}
        renderInput={(params) => (
          <TextField
            {...params}
            label={required ? `${label} *` : label}
            placeholder={placeholder}
            error={error}
            helperText={helperText}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        )}
        renderOption={(props, option) => {
          if (option.id === '__load_more__') {
            return (
              <li
                {...props}
                key="load-more"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px',
                  cursor: 'pointer',
                }}
                onClick={() => handleOptionClick(option)}
              >
                {isLoadingMore ? (
                  <CircularProgress size={20} />
                ) : (
                  <Button
                    variant="text"
                    startIcon={<ExpandMoreIcon />}
                    onClick={() => handleOptionClick(option)}
                    disabled={isLoadingMore}
                  >
                    Load more assets...
                  </Button>
                )}
              </li>
            );
          }

          return (
            <li
              {...props}
              key={option.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 16px',
              }}
            >
              <Box>
                <Typography variant="body1" fontWeight="medium">
                  {option.symbol || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {option.name}
                </Typography>
              </Box>
              <Box display="flex" flexDirection="column" alignItems="flex-end">
                <Chip
                  label={option.type}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                {option.currentPrice && option.currentPrice > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    {formatCurrency(option.currentPrice, currency)}
                  </Typography>
                )}
              </Box>
            </li>
          );
        }}
        noOptionsText={
          loading ? (
            <Box display="flex" alignItems="center" justifyContent="center" py={2}>
              <CircularProgress size={20} />
              <Typography variant="body2" sx={{ ml: 1 }}>
                Loading assets...
              </Typography>
            </Box>
          ) : searchTerm ? (
            <Box textAlign="center" py={2}>
              <Typography variant="body2" color="text.secondary">
                No assets found for "{searchTerm}"
              </Typography>
              {showCreateOption && onCreateAsset && (
                <Button
                  variant="text"
                  size="small"
                  onClick={onCreateAsset}
                  sx={{ mt: 1 }}
                >
                  Create new asset
                </Button>
              )}
            </Box>
          ) : (
            <Box textAlign="center" py={2}>
              <Typography variant="body2" color="text.secondary">
                No assets available
              </Typography>
              {showCreateOption && onCreateAsset && (
                <Button
                  variant="text"
                  size="small"
                  onClick={onCreateAsset}
                  sx={{ mt: 1 }}
                >
                  Create new asset
                </Button>
              )}
            </Box>
          )
        }
        ListboxProps={{
          style: {
            maxHeight: '300px',
          },
        }}
      />
      
      {assetsError && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {assetsError}
        </Alert>
      )}
      
      {selectedAsset && selectedAsset.currentPrice && selectedAsset.currentPrice > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Current Price: {formatCurrency(selectedAsset.currentPrice, currency)}
        </Typography>
      )}
    </Box>
  );
};

export default AssetAutocomplete;
