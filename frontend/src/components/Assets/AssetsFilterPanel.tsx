import React, { useState, useCallback, useMemo, useEffect, useRef, memo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Chip,
  IconButton,
  Collapse,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { AssetFilters as AssetFiltersType } from '../../types/asset.types';
import { usePortfolios } from '../../hooks/usePortfolios';
import { useAccount } from '../../contexts/AccountContext';

interface AssetsFilterPanelProps {
  filters: AssetFiltersType;
  onFiltersChange: (filters: AssetFiltersType) => void;
  onClearFilters: () => void;
}

// Internal component that never re-renders
const AssetsFilterPanelInternal: React.FC<AssetsFilterPanelProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
}) => {
  const theme = useTheme();
  const { accountId } = useAccount();
  const { portfolios, isLoading: portfoliosLoading } = usePortfolios(accountId);
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [localFilters, setLocalFilters] = useState(filters);
  const isUserTypingRef = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Force component to not re-render by using refs for critical state
  const stableStateRef = useRef({
    searchTerm: filters.search || '',
    localFilters: filters,
    isTyping: false
  });

  // Sync local filters with props when they change
  // But preserve the searchTerm input value when user is typing
  useEffect(() => {
    setLocalFilters(filters);
    // Only update searchTerm if user is not actively typing and it's a significant change
    if (!isUserTypingRef.current && filters.search !== searchTerm && 
        (filters.search === '' || Math.abs((filters.search || '').length - searchTerm.length) > 2)) {
      setSearchTerm(filters.search || '');
    }
  }, [filters, searchTerm]);

  // Debounce search input to prevent excessive API calls
  // Only search when user types at least 3 characters
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== localFilters.search) {
        // Only update filters if search term is empty or has at least 3 characters
        if (searchTerm === '' || searchTerm.length >= 3) {
          setLocalFilters(prev => ({ ...prev, search: searchTerm }));
        }
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, localFilters.search]);

  // Batch update filters to parent component
  // Only trigger when there are actual meaningful changes
  useEffect(() => {
    const hasChanges = Object.keys(localFilters).some(key => 
      localFilters[key as keyof typeof localFilters] !== filters[key as keyof typeof filters]
    );
    
    if (hasChanges) {
      // Debounce the filter change to prevent excessive updates
      const timeoutId = setTimeout(() => {
        onFiltersChange(localFilters);
      }, 300); // Increased debounce to prevent focus loss
      
      return () => clearTimeout(timeoutId);
    }
  }, [localFilters, filters, onFiltersChange]);

  const handleSearchChange = useCallback((value: string) => {
    isUserTypingRef.current = true;
    setSearchTerm(value);
    stableStateRef.current.searchTerm = value;
    stableStateRef.current.isTyping = true;
    
    // Reset typing flag after a delay
    setTimeout(() => {
      isUserTypingRef.current = false;
      stableStateRef.current.isTyping = false;
    }, 1000); // Increased delay to maintain focus longer
  }, []);

  // Maintain focus on search input when component re-renders
  useEffect(() => {
    if (isUserTypingRef.current && searchInputRef.current) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 0);
    }
  }, [searchTerm]);

  const handleTypeChange = useCallback((type: string) => {
    setLocalFilters(prev => ({
      ...prev,
      type: type === 'ALL' ? undefined : type as any,
    }));
  }, []);

  const handlePortfolioChange = useCallback((portfolioId: string) => {
    setLocalFilters(prev => ({
      ...prev,
      portfolioId: portfolioId === 'ALL' ? undefined : portfolioId,
    }));
  }, []);

  const handleSortChange = useCallback((sortBy: string) => {
    setLocalFilters(prev => ({
      ...prev,
      sortBy,
    }));
  }, []);

  const handleSortOrderChange = useCallback((sortOrder: 'ASC' | 'DESC') => {
    setLocalFilters(prev => ({
      ...prev,
      sortOrder,
    }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setLocalFilters({
      search: '',
      type: undefined,
      portfolioId: undefined,
      sortBy: 'name',
      sortOrder: 'ASC',
      limit: 100,
      createdBy: accountId,
    });
    onClearFilters();
  }, [onClearFilters, accountId]);

  const toggleAdvanced = useCallback(() => {
    setShowAdvanced(!showAdvanced);
  }, [showAdvanced]);

  const hasActiveFilters = useMemo(() => 
    (localFilters.search && localFilters.search.length >= 3) || localFilters.type || localFilters.portfolioId,
    [localFilters.search, localFilters.type, localFilters.portfolioId]
  );

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        borderRadius: 2, 
        boxShadow: 1,
        border: `0.5px solid ${alpha(theme.palette.divider, 0.5)}`,
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Filters
            </Typography>
            {hasActiveFilters && (
              <Chip
                label="Active"
                size="small"
                color="primary"
                sx={{ ml: 1 }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {hasActiveFilters && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
                sx={{ textTransform: 'none' }}
              >
                Clear All
              </Button>
            )}
            <IconButton
              onClick={toggleAdvanced}
              sx={{ 
                color: 'text.secondary',
                transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease-in-out'
              }}
            >
              {showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* Basic Filters */}
        <Grid container spacing={3}>
          {/* Search */}
          <Grid item xs={12} md={4}>
            <TextField
              ref={searchInputRef}
              fullWidth
              label="Search Assets"
              placeholder="Type at least 3 characters to search..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                endAdornment: searchTerm && (
                  <IconButton
                    size="small"
                    onClick={() => handleSearchChange('')}
                    sx={{ mr: -1 }}
                  >
                    <ClearIcon />
                  </IconButton>
                ),
              }}
              helperText={
                searchTerm.length > 0 && searchTerm.length < 3 
                  ? `Type ${3 - searchTerm.length} more character${3 - searchTerm.length === 1 ? '' : 's'} to search`
                  : undefined
              }
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
          </Grid>

          {/* Asset Type */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Asset Type</InputLabel>
              <Select
                value={localFilters.type || 'ALL'}
                onChange={(e) => handleTypeChange(e.target.value)}
                label="Asset Type"
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="ALL">All Types</MenuItem>
                <MenuItem value="STOCK">Stock</MenuItem>
                <MenuItem value="BOND">Bond</MenuItem>
                <MenuItem value="GOLD">Gold</MenuItem>
                <MenuItem value="CRYPTO">Cryptocurrency</MenuItem>
                <MenuItem value="COMMODITY">Commodity</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Portfolio */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Portfolio</InputLabel>
              <Select
                value={localFilters.portfolioId || 'ALL'}
                onChange={(e) => handlePortfolioChange(e.target.value)}
                label="Portfolio"
                disabled={portfoliosLoading}
                sx={{ borderRadius: 2 }}
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
        </Grid>

        {/* Advanced Filters */}
        <Collapse in={showAdvanced}>
          <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.secondary' }}>
              Advanced Options
            </Typography>
            
            <Grid container spacing={3}>
              {/* Sort By */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={localFilters.sortBy || 'name'}
                    onChange={(e) => handleSortChange(e.target.value)}
                    label="Sort By"
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="name">Name</MenuItem>
                    <MenuItem value="symbol">Symbol</MenuItem>
                    <MenuItem value="type">Type</MenuItem>
                    <MenuItem value="totalValue">Total Value</MenuItem>
                    <MenuItem value="createdAt">Created Date</MenuItem>
                    <MenuItem value="updatedAt">Updated Date</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Sort Order */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Sort Order</InputLabel>
                  <Select
                    value={localFilters.sortOrder || 'ASC'}
                    onChange={(e) => handleSortOrderChange(e.target.value as 'ASC' | 'DESC')}
                    label="Sort Order"
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="ASC">Ascending</MenuItem>
                    <MenuItem value="DESC">Descending</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Limit */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Items Per Page</InputLabel>
                  <Select
                    value={localFilters.limit || 100}
                    onChange={(e) => setLocalFilters(prev => ({ ...prev, limit: Number(e.target.value) }))}
                    label="Items Per Page"
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={25}>25</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                    <MenuItem value={100}>100</MenuItem>
                    <MenuItem value={200}>200</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Has Trades */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Trading Status</InputLabel>
                  <Select
                    value={localFilters.hasTrades === undefined ? 'ALL' : localFilters.hasTrades ? 'YES' : 'NO'}
                    onChange={(e) => {
                      const value = e.target.value;
                      setLocalFilters(prev => ({
                        ...prev,
                        hasTrades: value === 'ALL' ? undefined : value === 'YES',
                      }));
                    }}
                    label="Trading Status"
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="ALL">All Assets</MenuItem>
                    <MenuItem value="YES">With Trades</MenuItem>
                    <MenuItem value="NO">Without Trades</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

// Wrapper component that completely prevents re-renders
const AssetsFilterPanel: React.FC<AssetsFilterPanelProps> = memo((props) => {
  return <AssetsFilterPanelInternal {...props} />;
}, () => {
  // Completely block re-renders - component will manage its own state
  // This ensures the search input never loses focus
  return true;
});

AssetsFilterPanel.displayName = 'AssetsFilterPanel';

export default AssetsFilterPanel;
