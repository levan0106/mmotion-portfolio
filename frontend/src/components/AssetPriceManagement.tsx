import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// Types
interface AssetPrice {
  id: string;
  assetId: string;
  currentPrice: number;
  priceType: string;
  priceSource: string;
  lastPriceUpdate: string;
}

interface PriceHistory {
  id: string;
  assetId: string;
  price: number;
  priceType: string;
  priceSource: string;
  changeReason?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

interface AssetPriceManagementProps {
  asset: {
    id: string;
    symbol: string;
    name: string;
    currency: string;
    assetPrice?: AssetPrice;
  };
  onPriceUpdate: (assetId: string, price: number, priceType: string, priceSource: string, changeReason?: string) => Promise<void>;
  onPriceHistoryRefresh: (assetId: string) => Promise<void>;
  loading?: boolean;
  error?: string;
}

interface PriceUpdateFormData {
  price: number;
  priceType: string;
  priceSource: string;
  changeReason?: string;
}

// Validation schema
const validationSchema = yup.object({
  price: yup
    .number()
    .required('Price is required')
    .positive('Price must be positive')
    .min(0.01, 'Price must be at least 0.01'),
  priceType: yup
    .string()
    .required('Price type is required')
    .oneOf(['MANUAL', 'MARKET_DATA', 'EXTERNAL', 'CALCULATED'], 'Invalid price type'),
  priceSource: yup
    .string()
    .required('Price source is required')
    .oneOf(['USER', 'MARKET_DATA_SERVICE', 'EXTERNAL_API', 'CALCULATED'], 'Invalid price source'),
  changeReason: yup
    .string()
    .max(200, 'Change reason must be at most 200 characters'),
});

// Price types
const PRICE_TYPES = [
  { value: 'MANUAL', label: 'Manual Entry', color: '#1976d2' },
  { value: 'MARKET_DATA', label: 'Market Data', color: '#388e3c' },
  { value: 'EXTERNAL', label: 'External Source', color: '#f57c00' },
  { value: 'CALCULATED', label: 'Calculated', color: '#7b1fa2' },
];

// Price sources
const PRICE_SOURCES = [
  { value: 'USER', label: 'User Input', color: '#1976d2' },
  { value: 'MARKET_DATA_SERVICE', label: 'Market Data Service', color: '#388e3c' },
  { value: 'EXTERNAL_API', label: 'External API', color: '#f57c00' },
  { value: 'CALCULATED', label: 'Calculated', color: '#7b1fa2' },
];

// Mock price history data
const mockPriceHistory: PriceHistory[] = [
  {
    id: '1',
    assetId: 'asset-1',
    price: 150000,
    priceType: 'MARKET_DATA',
    priceSource: 'MARKET_DATA_SERVICE',
    changeReason: 'Market data update',
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    assetId: 'asset-1',
    price: 148500,
    priceType: 'MARKET_DATA',
    priceSource: 'MARKET_DATA_SERVICE',
    changeReason: 'Market data update',
    createdAt: '2024-01-15T09:30:00Z',
  },
  {
    id: '3',
    assetId: 'asset-1',
    price: 152000,
    priceType: 'MANUAL',
    priceSource: 'USER',
    changeReason: 'Manual correction',
    createdAt: '2024-01-14T16:45:00Z',
  },
];

const AssetPriceManagement: React.FC<AssetPriceManagementProps> = ({
  asset,
  onPriceUpdate,
  onPriceHistoryRefresh,
  loading = false,
  error,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [priceHistory] = useState<PriceHistory[]>(mockPriceHistory);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PriceUpdateFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      price: asset.assetPrice?.currentPrice || 0,
      priceType: asset.assetPrice?.priceType || 'MANUAL',
      priceSource: asset.assetPrice?.priceSource || 'USER',
      changeReason: '',
    },
  });


  // Calculate price change
  const priceChange = useMemo(() => {
    if (priceHistory.length < 2) return 0;
    const currentPrice = priceHistory[0].price;
    const previousPrice = priceHistory[1].price;
    return ((currentPrice - previousPrice) / previousPrice) * 100;
  }, [priceHistory]);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getPriceChangeIcon = () => {
    if (priceChange > 0.1) return <TrendingUpIcon color="success" />;
    if (priceChange < -0.1) return <TrendingDownIcon color="error" />;
    return <RemoveIcon color="disabled" />;
  };

  const getPriceTypeColor = (type: string) => {
    const priceType = PRICE_TYPES.find(pt => pt.value === type);
    return priceType?.color || '#666';
  };

  const getPriceSourceColor = (source: string) => {
    const priceSource = PRICE_SOURCES.find(ps => ps.value === source);
    return priceSource?.color || '#666';
  };

  const handlePriceUpdate = async (data: PriceUpdateFormData) => {
    try {
      
      await onPriceUpdate(
        asset.id,
        data.price,
        data.priceType,
        data.priceSource,
        data.changeReason
      );
      
      setUpdateDialogOpen(false);
      reset();
      // Refresh price history
      handlePriceHistoryRefresh();
    } catch (error) {
      console.error('Price update error:', error);
    }
  };

  const handlePriceHistoryRefresh = async () => {
    setHistoryLoading(true);
    try {
      await onPriceHistoryRefresh(asset.id);
      // In real app, this would update the priceHistory state
      setHistoryLoading(false);
    } catch (error) {
      console.error('Price history refresh error:', error);
      setHistoryLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getPriceAge = (lastUpdate: string) => {
    const now = new Date();
    const updateTime = new Date(lastUpdate);
    const diffInHours = Math.floor((now.getTime() - updateTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getPriceAgeColor = (lastUpdate: string) => {
    const now = new Date();
    const updateTime = new Date(lastUpdate);
    const diffInHours = Math.floor((now.getTime() - updateTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'success';
    if (diffInHours < 24) return 'warning';
    return 'error';
  };

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Current Price Display */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <Typography variant="h4" component="div">
                  {formatPrice(asset.assetPrice?.currentPrice || 0, asset.currency)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  {getPriceChangeIcon()}
                  <Typography
                    variant="body2"
                    color={priceChange > 0 ? 'success.main' : priceChange < 0 ? 'error.main' : 'text.secondary'}
                  >
                    {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    vs previous
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {asset.assetPrice && (
                    <>
                      <Chip
                        label={asset.assetPrice.priceType}
                        size="small"
                        sx={{ backgroundColor: getPriceTypeColor(asset.assetPrice.priceType), color: 'white' }}
                      />
                      <Chip
                        label={asset.assetPrice.priceSource}
                        size="small"
                        sx={{ backgroundColor: getPriceSourceColor(asset.assetPrice.priceSource), color: 'white' }}
                      />
                      <Chip
                        label={getPriceAge(asset.assetPrice.lastPriceUpdate)}
                        size="small"
                        color={getPriceAgeColor(asset.assetPrice.lastPriceUpdate) as any}
                      />
                    </>
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Last updated: {asset.assetPrice ? formatDate(asset.assetPrice.lastPriceUpdate) : 'Never'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Price Settings" />
              <Tab label="Price History" />
            </Tabs>
          </Box>

          <CardContent>
            {tabValue === 0 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Price Management</Typography>
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => setUpdateDialogOpen(true)}
                    disabled={loading}
                  >
                    Update Price
                  </Button>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Current Price"
                      value={formatPrice(asset.assetPrice?.currentPrice || 0, asset.currency)}
                      fullWidth
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Price Type"
                      value={asset.assetPrice?.priceType || 'N/A'}
                      fullWidth
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Price Source"
                      value={asset.assetPrice?.priceSource || 'N/A'}
                      fullWidth
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Last Update"
                      value={asset.assetPrice ? formatDate(asset.assetPrice.lastPriceUpdate) : 'Never'}
                      fullWidth
                      disabled
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {tabValue === 1 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Price History</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={handlePriceHistoryRefresh}
                    disabled={historyLoading}
                  >
                    Refresh
                  </Button>
                </Box>

                {historyLoading ? (
                  <LinearProgress />
                ) : (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Price</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Source</TableCell>
                          <TableCell>Reason</TableCell>
                          <TableCell>Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {priceHistory.map((history) => (
                          <TableRow key={history.id}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {formatPrice(history.price, asset.currency)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={history.priceType}
                                size="small"
                                sx={{ backgroundColor: getPriceTypeColor(history.priceType), color: 'white' }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={history.priceSource}
                                size="small"
                                sx={{ backgroundColor: getPriceSourceColor(history.priceSource), color: 'white' }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {history.changeReason || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {formatDate(history.createdAt)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Price Update Dialog */}
        <Dialog open={updateDialogOpen} onClose={() => setUpdateDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Update Price</DialogTitle>
          <form onSubmit={handleSubmit(handlePriceUpdate)}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Controller
                    name="price"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Price"
                        type="number"
                        fullWidth
                        error={!!errors.price}
                        helperText={errors.price?.message}
                        InputProps={{
                          startAdornment: <Typography sx={{ mr: 1 }}>{asset.currency}</Typography>,
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="priceType"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.priceType}>
                        <InputLabel>Price Type</InputLabel>
                        <Select {...field} label="Price Type">
                          {PRICE_TYPES.map((type) => (
                            <MenuItem key={type.value} value={type.value}>
                              {type.label}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.priceType && (
                          <Typography variant="caption" color="error">
                            {errors.priceType.message}
                          </Typography>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="priceSource"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.priceSource}>
                        <InputLabel>Price Source</InputLabel>
                        <Select {...field} label="Price Source">
                          {PRICE_SOURCES.map((source) => (
                            <MenuItem key={source.value} value={source.value}>
                              {source.label}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.priceSource && (
                          <Typography variant="caption" color="error">
                            {errors.priceSource.message}
                          </Typography>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="changeReason"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Change Reason"
                        fullWidth
                        multiline
                        rows={2}
                        error={!!errors.changeReason}
                        helperText={errors.changeReason?.message}
                        placeholder="Optional reason for price change"
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setUpdateDialogOpen(false)}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Updating...' : 'Update Price'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default AssetPriceManagement;
