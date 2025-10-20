import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Paper,
  TableSortLabel,
  Grid,
  InputAdornment,
  Menu,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
  Refresh as RefreshIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { ResponsiveButton } from './Common';
import { formatDate } from '@/utils/format';

// Types
interface GlobalAsset {
  id: string;
  symbol: string;
  name: string;
  type: string;
  nation: string;
  marketCode: string;
  currency: string;
  timezone: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
  assetPrice?: {
    currentPrice: number;
    priceType: string;
    priceSource: string;
    lastPriceUpdate: string;
  };
}

interface GlobalAssetListProps {
  assets: GlobalAsset[];
  loading?: boolean;
  onEdit: (asset: GlobalAsset) => void;
  onDelete: (asset: GlobalAsset) => void;
  onView: (asset: GlobalAsset) => void;
  onRefresh: () => void;
  error?: string;
}

// Asset type colors
const ASSET_TYPE_COLORS: Record<string, string> = {
  STOCK: '#1976d2',
  BOND: '#388e3c',
  CRYPTO: '#f57c00',
  COMMODITY: '#7b1fa2',
  CURRENCY: '#d32f2f',
  ETF: '#0288d1',
  MUTUAL_FUND: '#5d4037',
};

// Nation display names
const NATION_NAMES: Record<string, string> = {
  VN: 'Vietnam',
  US: 'United States',
  UK: 'United Kingdom',
  JP: 'Japan',
  SG: 'Singapore',
  AU: 'Australia',
  CA: 'Canada',
  DE: 'Germany',
  FR: 'France',
  CN: 'China',
};

// Market code display names (unused currently)
// const MARKET_NAMES: Record<string, string> = {
//   HOSE: 'Ho Chi Minh Stock Exchange',
//   HNX: 'Hanoi Stock Exchange',
//   UPCOM: 'Unlisted Public Company Market',
//   NYSE: 'New York Stock Exchange',
//   NASDAQ: 'NASDAQ',
//   AMEX: 'American Stock Exchange',
//   LSE: 'London Stock Exchange',
//   AIM: 'Alternative Investment Market',
//   TSE: 'Tokyo Stock Exchange',
//   SGX: 'Singapore Exchange',
//   ASX: 'Australian Securities Exchange',
//   TSX: 'Toronto Stock Exchange',
//   XETRA: 'XETRA',
//   EPA: 'Euronext Paris',
//   SSE: 'Shanghai Stock Exchange',
//   SZSE: 'Shenzhen Stock Exchange',
// };

type SortField = 'symbol' | 'name' | 'type' | 'nation' | 'marketCode' | 'createdAt';
type SortDirection = 'asc' | 'desc';

const GlobalAssetList: React.FC<GlobalAssetListProps> = ({
  assets,
  loading = false,
  onEdit,
  onDelete,
  onView,
  onRefresh,
  error,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [nationFilter, setNationFilter] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('symbol');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAsset, setSelectedAsset] = useState<GlobalAsset | null>(null);

  // Get unique values for filters
  const uniqueTypes = useMemo(() => {
    const types = [...new Set(assets.map(asset => asset.type))];
    return types.sort();
  }, [assets]);

  const uniqueNations = useMemo(() => {
    const nations = [...new Set(assets.map(asset => asset.nation))];
    return nations.sort();
  }, [assets]);

  // Filter and sort assets
  const filteredAndSortedAssets = useMemo(() => {
    let filtered = assets.filter(asset => {
      const matchesSearch = 
        asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = !typeFilter || asset.type === typeFilter;
      const matchesNation = !nationFilter || asset.nation === nationFilter;
      
      return matchesSearch && matchesType && matchesNation;
    });

    // Sort assets
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [assets, searchTerm, typeFilter, nationFilter, sortField, sortDirection]);

  // Pagination
  const paginatedAssets = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredAndSortedAssets.slice(start, start + rowsPerPage);
  }, [filteredAndSortedAssets, page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, asset: GlobalAsset) => {
    setAnchorEl(event.currentTarget);
    setSelectedAsset(asset);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAsset(null);
  };

  const handleAction = (action: 'view' | 'edit' | 'delete') => {
    if (selectedAsset) {
      switch (action) {
        case 'view':
          onView(selectedAsset);
          break;
        case 'edit':
          onEdit(selectedAsset);
          break;
        case 'delete':
          onDelete(selectedAsset);
          break;
      }
    }
    handleMenuClose();
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const getPriceChangeIcon = (asset: GlobalAsset) => {
    if (!asset.assetPrice) return <RemoveIcon color="disabled" />;
    
    // Mock price change logic - in real app, this would come from price history
    const change = Math.random() - 0.5;
    if (change > 0.1) return <TrendingUpIcon color="success" />;
    if (change < -0.1) return <TrendingDownIcon color="error" />;
    return <RemoveIcon color="disabled" />;
  };

  const getAssetTypeColor = (type: string) => {
    return ASSET_TYPE_COLORS[type] || '#666';
  };

  const getNationDisplayName = (code: string) => {
    return NATION_NAMES[code] || code;
  };

  // const getMarketDisplayName = (code: string) => {
  //   return MARKET_NAMES[code] || code;
  // };

  if (error) {
    return (
      <Alert severity="error" action={
        <ResponsiveButton color="inherit" size="small" onClick={onRefresh} mobileText="Retry" desktopText="Retry">
          Retry
        </ResponsiveButton>
      }>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                label="Type"
              >
                <MenuItem value="">All Types</MenuItem>
                {uniqueTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Nation</InputLabel>
              <Select
                value={nationFilter}
                onChange={(e) => setNationFilter(e.target.value)}
                label="Nation"
              >
                <MenuItem value="">All Nations</MenuItem>
                {uniqueNations.map((nation) => (
                  <MenuItem key={nation} value={nation}>
                    {getNationDisplayName(nation)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <ResponsiveButton
              fullWidth
              variant="outlined"
              icon={<RefreshIcon />}
              onClick={onRefresh}
              disabled={loading}
              mobileText="Refresh"
              desktopText="Refresh"
            >
              Refresh
            </ResponsiveButton>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'symbol'}
                    direction={sortField === 'symbol' ? sortDirection : 'asc'}
                    onClick={() => handleSort('symbol')}
                  >
                    Symbol
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'name'}
                    direction={sortField === 'name' ? sortDirection : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'type'}
                    direction={sortField === 'type' ? sortDirection : 'asc'}
                    onClick={() => handleSort('type')}
                  >
                    Type
                  </TableSortLabel>
                </TableCell>
                  {/* <TableCell>
                    <TableSortLabel
                      active={sortField === 'nation'}
                      direction={sortField === 'nation' ? sortDirection : 'asc'}
                      onClick={() => handleSort('nation')}
                    >
                      Nation
                    </TableSortLabel>
                  </TableCell> */}
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'marketCode'}
                    direction={sortField === 'marketCode' ? sortDirection : 'asc'}
                    onClick={() => handleSort('marketCode')}
                  >
                    Market
                  </TableSortLabel>
                </TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : paginatedAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No assets found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAssets.map((asset) => (
                  <Tooltip 
                    key={asset.id}
                    title="Click to view asset details"
                    placement="top"
                    arrow
                  >
                    <TableRow 
                      hover 
                      onClick={() => onView(asset)}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        }
                      }}
                    >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {asset.symbol}
                        </Typography>
                        <OpenInNewIcon 
                          fontSize="small" 
                          color="action" 
                          sx={{ opacity: 0.6 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {asset.name}
                      </Typography>
                      {asset.description && (
                        <Typography variant="caption" color="text.secondary">
                          {asset.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={asset.type}
                        size="small"
                        sx={{
                          backgroundColor: getAssetTypeColor(asset.type),
                          color: 'white',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getNationDisplayName(asset.nation)}
                      </Typography>
                    </TableCell>
                    {/* <TableCell>
                      <Typography variant="body2">
                        {getMarketDisplayName(asset.marketCode)}
                      </Typography>
                    </TableCell> */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getPriceChangeIcon(asset)}
                        <Typography variant="body2">
                          {asset.assetPrice
                            ? formatPrice(asset.assetPrice.currentPrice, asset.currency)
                            : 'No price data'
                          }
                        </Typography>
                      </Box>
                      {asset.assetPrice && (
                        <Typography variant="caption" color="text.secondary">
                          {asset.assetPrice.priceSource} • {formatDate(asset.assetPrice.lastPriceUpdate, 'medium')}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={asset.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={asset.isActive ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuOpen(e, asset);
                        }}
                        size="small"
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  </Tooltip>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredAndSortedAssets.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleAction('view')}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction('edit')}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction('delete')}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default GlobalAssetList;
