import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Box,
  Typography,
  Chip,
  Alert,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ResponsiveButton } from './ResponsiveButton';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { GlobalAsset } from '../../types/global-asset.types';
import { useAccount } from '../../contexts/AccountContext';
import { formatCurrency } from '../../utils/format';
import { globalAssetService } from '../../services/global-asset.service';

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
  portfolioId?: string; // Optional portfolio ID to include assets used in that portfolio
}

/**
 * AssetAutocomplete component with search and pagination support
 * Provides a searchable dropdown for selecting global assets with load more functionality
 * Uses the new global assets API with smart filtering based on price mode and portfolio
 */
export const AssetAutocomplete: React.FC<AssetAutocompleteProps> = ({
  value,
  onChange,
  error = false,
  helperText,
  disabled = false,
  placeholder,
  label,
  required = false,
  showCreateOption = true,
  onCreateAsset,
  currency = 'VND', // Default to VND if not provided
  portfolioId,
}) => {
  const { t } = useTranslation();
  const { accountId } = useAccount();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<GlobalAsset | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Global assets state
  const [globalAssets, setGlobalAssets] = useState<GlobalAsset[]>([]);
  const [globalAssetsLoading, setGlobalAssetsLoading] = useState(false);
  const [globalAssetsError, setGlobalAssetsError] = useState<string | null>(null);
  const [globalAssetsPagination, setGlobalAssetsPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  
  // Refs to track previous values and prevent unnecessary updates
  const prevValueRef = useRef<string | undefined>(value);
  const prevSelectedAssetRef = useRef<GlobalAsset | null>(null);
  const hasInitializedRef = useRef(false);
  const prevSearchTermRef = useRef<string>('');
  const prevPortfolioIdRef = useRef<string | undefined>(portfolioId);
  const hasInitialFetchRef = useRef(false); // Track if initial fetch has been done

  // Fetch global assets
  const fetchGlobalAssets = useCallback(async (pageNum: number = 1, search: string = '') => {
    if (!accountId) return;
    
    setGlobalAssetsLoading(true);
    setGlobalAssetsError(null);
    
    try {
      const response = await globalAssetService.getGlobalAssetsForAutocomplete(
        accountId,
        portfolioId,
        {
          search,
          limit: 50, // Fixed limit for autocomplete
          page: pageNum,
          sortBy: 'symbol',
          sortOrder: 'ASC',
        }
      );
      
      if (pageNum === 1) {
        setGlobalAssets(response.data);
      } else {
        setGlobalAssets(prev => [...prev, ...response.data]);
      }
      
      setGlobalAssetsPagination({
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages,
      });
    } catch (err) {
      setGlobalAssetsError(err instanceof Error ? err.message : 'Failed to fetch global assets');
      console.error('Failed to fetch global assets:', err);
    } finally {
      setGlobalAssetsLoading(false);
    }
  }, [accountId, portfolioId]);

  // Initial fetch - when component mounts or portfolioId changes
  useEffect(() => {
    if (accountId) {
      // Reset fetch flag when portfolioId changes to allow re-fetch
      if (portfolioId !== prevPortfolioIdRef.current) {
        hasInitialFetchRef.current = false;
        prevPortfolioIdRef.current = portfolioId;
      }
      
      if (!hasInitialFetchRef.current) {
        hasInitialFetchRef.current = true;
        fetchGlobalAssets(1, '');
      }
    }
  }, [accountId, portfolioId, fetchGlobalAssets]);

  // Update search filter when search term changes
  useEffect(() => {
    // Skip if this is the initial empty search (already handled by initial fetch)
    if (searchTerm === '' && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      prevSearchTermRef.current = '';
      return;
    }

    // Don't call API if search term hasn't actually changed
    if (prevSearchTermRef.current === searchTerm) {
      return;
    }

    // Only search if search term has at least 2 characters
    const trimmedSearch = searchTerm.trim();
    const shouldSearch = trimmedSearch.length >= 2;

    // If search term is less than 2 characters, reset to initial state
    if (!shouldSearch) {
      // Reset to initial fetch if search is cleared
      if (trimmedSearch === '') {
        prevSearchTermRef.current = '';
        fetchGlobalAssets(1, '');
      } else {
        // If less than 2 chars but not empty, just update ref without searching
        prevSearchTermRef.current = searchTerm;
      }
      return;
    }

    // Mark as initialized after first search
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
    }

    // Update previous search term
    prevSearchTermRef.current = searchTerm;

    const timeoutId = setTimeout(() => {
      // Fetch global assets with search (only if >= 2 characters)
      if (shouldSearch) {
        fetchGlobalAssets(1, trimmedSearch);
      }
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, fetchGlobalAssets]);

  // Check if there are more assets to load
  useEffect(() => {
    setHasMore(globalAssetsPagination.page < globalAssetsPagination.totalPages);
  }, [globalAssetsPagination]);

  // Reset hasMore when search term is cleared
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setHasMore(globalAssetsPagination.page < globalAssetsPagination.totalPages);
    }
  }, [searchTerm, globalAssetsPagination]);

  // Find selected asset when value changes (only when value changes, not assets)
  useEffect(() => {
    // Only process if value actually changed
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      
      if (value && globalAssets.length > 0) {
        const asset = globalAssets.find(a => a.id === value);
        if (asset && asset.id !== prevSelectedAssetRef.current?.id) {
          setSelectedAsset(asset);
          prevSelectedAssetRef.current = asset;
        }
      } else if (!value && prevSelectedAssetRef.current) {
        setSelectedAsset(null);
        prevSelectedAssetRef.current = null;
      }
    }
  }, [value, globalAssets]);

  // Effect to handle case when assets are loaded and we have a value but no selectedAsset
  // This handles the edit modal case where value is set before assets are loaded
  useEffect(() => {
    if (value && !selectedAsset && globalAssets.length > 0 && !globalAssetsLoading) {
      const asset = globalAssets.find(a => a.id === value);
      if (asset) {
        setSelectedAsset(asset);
        prevSelectedAssetRef.current = asset;
      }
    }
  }, [value, selectedAsset, globalAssets, globalAssetsLoading]);

  // Load more assets
  const loadMore = useCallback(async () => {
    if (hasMore && !isLoadingMore) {
      setIsLoadingMore(true);
      try {
        await fetchGlobalAssets(globalAssetsPagination.page + 1, searchTerm);
      } finally {
        setIsLoadingMore(false);
      }
    }
  }, [hasMore, isLoadingMore, globalAssetsPagination.page, fetchGlobalAssets, searchTerm]);

  // Handle asset selection
  const handleAssetChange = useCallback((_event: any, newValue: GlobalAsset | null) => {
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
    name: t('asset.autocomplete.loadMore'),
    label: t('asset.autocomplete.loadMore'),
    type: 'LOAD_MORE',
    currentPrice: 0,
    currentQuantity: 0,
    totalValue: 0,
    unrealizedPl: 0,
    realizedPl: 0,
    performance: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any), [t]);

  // Memoize options to prevent unnecessary re-renders
  const options = useMemo(() => {
    const assetOptions = globalAssets.map(asset => ({
      ...asset,
      label: `${asset.symbol || 'N/A'} - ${asset.name}`,
    }));

    // Add load more option if there are more assets
    if (hasMore) {
      assetOptions.push(loadMoreOption);
    }

    return assetOptions;
  }, [globalAssets, hasMore, loadMoreOption]);

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
        value={selectedAsset as any}
        onChange={handleAssetChange}
        inputValue={searchTerm}
        onInputChange={handleInputChange}
        options={options}
        getOptionLabel={(option) => (option as any).label || `${option.symbol || 'N/A'} - ${option.name}`}
        isOptionEqualToValue={(option, value) => option.id === value?.id}
        loading={globalAssetsLoading}
        disabled={disabled}
        renderInput={(params) => (
          <TextField
            {...params}
            label={required ? `${label || t('asset.autocomplete.label')} *` : (label || t('asset.autocomplete.label'))}
            placeholder={placeholder || t('asset.autocomplete.placeholder')}
            error={error}
            helperText={helperText}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {globalAssetsLoading ? <CircularProgress color="inherit" size={20} /> : null}
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
                  <ResponsiveButton
                    variant="text"
                    icon={<ExpandMoreIcon />}
                    onClick={() => handleOptionClick(option)}
                    disabled={isLoadingMore}
                    mobileText={t('asset.autocomplete.loadMore')}
                    desktopText={t('asset.autocomplete.loadMore')}
                  >
                    {t('asset.autocomplete.loadMore')}
                  </ResponsiveButton>
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
                {option.assetPrice?.currentPrice && option.assetPrice.currentPrice > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    {formatCurrency(option.assetPrice.currentPrice, currency)}
                  </Typography>
                )}
              </Box>
            </li>
          );
        }}
        noOptionsText={
          globalAssetsLoading ? (
            <Box display="flex" alignItems="center" justifyContent="center" py={2}>
              <CircularProgress size={20} />
              <Typography variant="body2" sx={{ ml: 1 }}>
                {t('asset.autocomplete.loading')}
              </Typography>
            </Box>
          ) : searchTerm ? (
            <Box textAlign="center" py={2}>
              <Typography variant="body2" color="text.secondary">
                {t('asset.autocomplete.noResults', { searchTerm })}
              </Typography>
              {showCreateOption && onCreateAsset && (
                <ResponsiveButton
                  variant="text"
                  size="small"
                  onClick={onCreateAsset}
                  icon={<ExpandMoreIcon />}
                  mobileText={t('asset.autocomplete.create')}
                  desktopText={t('asset.autocomplete.createNew')}
                  sx={{ mt: 1 }}
                >
                  {t('asset.autocomplete.createNew')}
                </ResponsiveButton>
              )}
            </Box>
          ) : (
            <Box textAlign="center" py={2}>
              <Typography variant="body2" color="text.secondary">
                {t('asset.autocomplete.noAssets')}
              </Typography>
              {showCreateOption && onCreateAsset && (
                <ResponsiveButton
                  variant="text"
                  size="small"
                  onClick={onCreateAsset}
                  icon={<ExpandMoreIcon />}
                  mobileText={t('asset.autocomplete.create')}
                  desktopText={t('asset.autocomplete.createNew')}
                  sx={{ mt: 1 }}
                >
                  {t('asset.autocomplete.createNew')}
                </ResponsiveButton>
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
      
      {globalAssetsError && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {globalAssetsError}
        </Alert>
      )}
      
      {selectedAsset?.assetPrice?.currentPrice && selectedAsset.assetPrice.currentPrice > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {t('asset.autocomplete.currentPrice')}: {formatCurrency(
            selectedAsset.assetPrice.currentPrice,
            currency
          )}
        </Typography>
      )}
    </Box>
  );
};

export default AssetAutocomplete;
