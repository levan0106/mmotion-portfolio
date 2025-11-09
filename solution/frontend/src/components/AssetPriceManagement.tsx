import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Pagination,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { ResponsiveButton, ActionButton } from './Common';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useQueryClient } from 'react-query';
import { usePriceHistory } from '../hooks/usePriceHistory';

// Types
interface AssetPrice {
  id: string;
  assetId: string;
  currentPrice: number;
  priceType: string;
  priceSource: string;
  lastPriceUpdate: string;
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
    .oneOf(['MANUAL', 'EXTERNAL'], 'Invalid price type'),
  priceSource: yup
    .string()
    .required('Price source is required')
    .oneOf(['USER_INPUT', 'EXTERNAL_API'], 'Invalid price source'),
  changeReason: yup
    .string()
    .max(200, 'Change reason must be at most 200 characters'),
});

// Price types
const PRICE_TYPES = [
  { value: 'MANUAL', label: 'Manual Entry', color: '#1976d2' },
  { value: 'EXTERNAL', label: 'External Source', color: '#f57c00' },
];

// Price sources
const PRICE_SOURCES = [
  { value: 'USER_INPUT', label: 'User Input', color: '#1976d2' },
  { value: 'EXTERNAL_API', label: 'External API', color: '#f57c00' },
];

const AssetPriceManagement: React.FC<AssetPriceManagementProps> = ({
  asset,
  onPriceUpdate,
  onPriceHistoryRefresh,
  loading = false,
  error,
}) => {
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const queryClient = useQueryClient();
  
  // Use new pagination-enabled hook for price history
  const { 
    data: priceHistoryData, 
    isLoading: historyLoading, 
    error: historyError,
    refetch: refetchPriceHistory,
    goToPage,
    totalPages,
    totalRecords
  } = usePriceHistory({
    assetId: asset.id,
    query: {
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
      sortBy: 'createdAt',
      sortOrder: 'DESC'
    }
  });
  
  const priceHistory = priceHistoryData?.data || [];

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
      priceSource: asset.assetPrice?.priceSource || 'USER_INPUT',
      changeReason: '',
    },
  });

  // Calculate price change
  const priceChange = useMemo(() => {
    if (priceHistory.length < 2) return 0;
    const currentPrice = typeof priceHistory[0].price === 'string' ? parseFloat(priceHistory[0].price) : priceHistory[0].price;
    const previousPrice = typeof priceHistory[1].price === 'string' ? parseFloat(priceHistory[1].price) : priceHistory[1].price;
    return ((currentPrice - previousPrice) / previousPrice) * 100;
  }, [priceHistory]);

  const formatPrice = (price: number | string, currency: string) => {
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericPrice);
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
      // Invalidate and refetch price history data
      queryClient.invalidateQueries(['priceHistory', asset.id]);
      await refetchPriceHistory();
    } catch (error) {
      console.error('Price update error:', error);
    }
  };

  const handlePriceHistoryRefresh = async () => {
    try {
      await onPriceHistoryRefresh(asset.id);
      // Invalidate and refetch price history data
      queryClient.invalidateQueries(['priceHistory', asset.id]);
      await refetchPriceHistory();
    } catch (error) {
      console.error('Price history refresh error:', error);
    }
  };


  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    goToPage(page);
  };

  const handlePageSizeChange = (event: any) => {
    const newPageSize = event.target.value as number;
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
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

  // Determine last update time and a simple next run estimate (last update + 24h)
  const lastUpdateAt: string | null = asset.assetPrice?.lastPriceUpdate
    || (priceHistory.length > 0 ? priceHistory[0].createdAt : null);
  const nextRunAt: string | null = lastUpdateAt
    ? new Date(new Date(lastUpdateAt).getTime() + 24 * 60 * 60 * 1000).toISOString()
    : null;

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ 
        overflow: 'auto',
        py: 2,
        px: 0
      }}>
        {/* Enhanced Current Price Display */}
        <Card sx={{ 
          mb: 3,
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          overflow: 'hidden'
        }}>
          <CardContent sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h3" sx={{ 
                    fontWeight: 700,
                    mb: 2,
                  }}>
                    {formatPrice(asset.assetPrice?.currentPrice || 0, asset.currency)}
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 400,
                    mb: 2
                  }}>
                    {asset.symbol} • {asset.name}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {getPriceChangeIcon()}
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: priceChange > 0 ? '#4caf50' : priceChange < 0 ? '#f44336' : 'rgba(255,255,255,0.8)'
                    }}
                  >
                    {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.8 }}>
                    vs previous
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 1, justifyContent: 'flex-end' }}>
                  {asset.assetPrice && (
                    <>
                      <Chip
                        label={asset.assetPrice.priceType}
                        size="small"
                        sx={{ 
                          backgroundColor: 'rgba(255,255,255,0.2)', 
                          color: 'white',
                          border: '1px solid rgba(255,255,255,0.3)'
                        }}
                      />
                      <Chip
                        label={asset.assetPrice.priceSource}
                        size="small"
                        sx={{ 
                          backgroundColor: 'rgba(255,255,255,0.2)', 
                          color: 'white',
                          border: '1px solid rgba(255,255,255,0.3)'
                        }}
                      />
                      <Chip
                        label={getPriceAge(asset.assetPrice.lastPriceUpdate)}
                        size="small"
                        sx={{
                          backgroundColor: getPriceAgeColor(asset.assetPrice.lastPriceUpdate) === 'success' ? 'rgba(76,175,80,0.8)' :
                                         getPriceAgeColor(asset.assetPrice.lastPriceUpdate) === 'warning' ? 'rgba(255,152,0,0.8)' :
                                         'rgba(244,67,54,0.8)',
                          color: 'white',
                        }}
                      />
                    </>
                  )}
                  <Typography variant="subtitle2" sx={{ 
                    fontWeight: 500
                  }}>
                    Last updated: {asset.assetPrice ? formatDate(asset.assetPrice.lastPriceUpdate) : 'N/A'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Price History Section */}
        <Box sx={{ py: 2, px: 0 }}>
            <Box>
                {/* Controls Row (no header) */}
                <Box sx={{ 
                  mb: 2
                }} />

                {/* Stats Bar */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  mb: 3,
                  p: 2,
                  backgroundColor: 'rgba(102,126,234,0.05)',
                  borderRadius: 2,
                  border: '1px solid rgba(102,126,234,0.1)'
                }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#667eea' }}>
                      {priceHistory.length} Price Records
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 3, mt: 0.5, flexWrap: 'wrap' }}>
                      <Typography variant="body2" color="text.secondary">
                        Last update: {lastUpdateAt ? formatDate(lastUpdateAt) : 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Next run: {nextRunAt ? formatDate(nextRunAt) : 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <ResponsiveButton
                      variant="outlined"
                      icon={<RefreshIcon />}
                      onClick={handlePriceHistoryRefresh}
                      disabled={historyLoading}
                      mobileText="Refresh"
                      desktopText="Refresh"
                      sx={{
                        borderColor: '#667eea',
                        color: '#667eea',
                        fontWeight: 600,
                        '&:hover': {
                          borderColor: '#5a6fd8',
                          backgroundColor: 'rgba(102,126,234,0.05)'
                        }
                      }}
                    >
                      Refresh
                    </ResponsiveButton>
                    <ActionButton
                      onClick={() => setUpdateDialogOpen(true)}
                      variant="contained"
                      icon={<EditIcon />}
                      disabled={loading}
                      mobileText="Update"
                      desktopText="Update Price"
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        fontWeight: 600,
                        px: 3,
                        py: 1.5,
                        borderRadius: 2,
                        boxShadow: '0 4px 16px rgba(102,126,234,0.3)',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(102,126,234,0.4)',
                        }
                      }}
                    >
                      Update Price
                    </ActionButton>
                  </Box>
                </Box>

                {historyError ? (
                  <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    Failed to load price history: {historyError instanceof Error ? historyError.message : 'Unknown error'}
                  </Alert>
                ) : null}

                {historyLoading ? (
                  <Box sx={{ mb: 3 }}>
                    <LinearProgress sx={{ borderRadius: 1, height: 6 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                      Loading price history...
                    </Typography>
                  </Box>
                ) : priceHistory.length === 0 ? (
                  <Card sx={{ 
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}>
                    <CardContent sx={{ p: 4, textAlign: 'center' }}>
                      <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                        No Price History Available
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        This asset doesn't have any price history records yet.
                      </Typography>
                    </CardContent>
                  </Card>
                ) : (
                  <Card sx={{ 
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(0,0,0,0.05)',
                    overflow: 'hidden'
                  }}>
                    <TableContainer sx={{ 
                      '&::-webkit-scrollbar': {
                        height: 8,
                      },
                      '&::-webkit-scrollbar-track': {
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        borderRadius: 4,
                      },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(102,126,234,0.3)',
                        borderRadius: 4,
                        '&:hover': {
                          backgroundColor: 'rgba(102,126,234,0.5)',
                        },
                      },
                    }}>
                      <Table sx={{ minWidth: 600 }}>
                        <TableHead sx={{ backgroundColor: 'rgba(102,126,234,0.05)' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, color: '#667eea', width: '18%', fontSize: '0.875rem' }}>Price</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#667eea', width: '12%', fontSize: '0.875rem' }}>Type</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#667eea', width: '12%', fontSize: '0.875rem' }}>Source</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#667eea', width: '28%', fontSize: '0.875rem' }}>Reason</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#667eea', width: '30%', fontSize: '0.875rem' }}>Date</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {priceHistory.map((history) => (
                            <TableRow 
                              key={history.id}
                              sx={{ 
                                '&:hover': { 
                                  backgroundColor: 'rgba(102,126,234,0.02)' 
                                },
                                '&:nth-of-type(even)': {
                                  backgroundColor: 'rgba(0,0,0,0.02)'
                                }
                              }}
                            >
                              <TableCell sx={{ py: 1.5 }}>
                                <Typography variant="body2" fontWeight="600" sx={{ color: '#667eea', fontSize: '0.875rem' }}>
                                  {formatPrice(history.price, asset.currency)}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ py: 1.5 }}>
                                <Chip
                                  label={history.priceType}
                                  size="small"
                                  sx={{ 
                                    backgroundColor: getPriceTypeColor(history.priceType), 
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: '0.7rem',
                                    height: 22,
                                    '& .MuiChip-label': {
                                      fontSize: '0.7rem',
                                      padding: '0 8px'
                                    }
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ py: 1.5 }}>
                                <Chip
                                  label={history.priceSource}
                                  size="small"
                                  sx={{ 
                                    backgroundColor: getPriceSourceColor(history.priceSource), 
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: '0.7rem',
                                    height: 22,
                                    '& .MuiChip-label': {
                                      fontSize: '0.7rem',
                                      padding: '0 8px'
                                    }
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ py: 1.5 }}>
                                <Typography variant="body2" sx={{ 
                                  fontSize: '0.7rem',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: '100%'
                                }}>
                                  {history.changeReason || 'N/A'}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ py: 1.5 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ 
                                  fontSize: '0.7rem',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {formatDate(history.createdAt)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    {/* Pagination Controls */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      mt: 2, 
                      mb: 1, 
                      px: 2,
                      py: 1,
                      backgroundColor: 'grey.50',
                      borderRadius: 1
                    }}>
                      {/* Page Info */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Showing {priceHistory.length} of {totalRecords || 0} records
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Page {currentPage} of {totalPages || 1}
                        </Typography>
                      </Box>
                      
                      {/* Page Size Dropdown */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Rows per page:
                        </Typography>
                        <FormControl size="small" sx={{ minWidth: 80 }}>
                          <Select
                            value={pageSize}
                            onChange={handlePageSizeChange}
                            variant="outlined"
                          >
                            <MenuItem value={10}>10</MenuItem>
                            <MenuItem value={20}>20</MenuItem>
                            <MenuItem value={50}>50</MenuItem>
                            <MenuItem value={100}>100</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </Box>
                    
                    {/* Pagination Navigation */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1, mb: 2 }}>
                      <Pagination
                        count={totalPages || 1}
                        page={currentPage}
                        onChange={handlePageChange}
                        color="primary"
                        size="small"
                        showFirstButton
                        showLastButton
                        disabled={totalPages <= 1}
                      />
                    </Box>
                  </Card>
                )}
              </Box>
        </Box>

        {/* Enhanced Price Update Dialog */}
        <Dialog 
          open={updateDialogOpen} 
          onClose={() => setUpdateDialogOpen(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }
          }}
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 700,
            fontSize: '1.5rem',
            py: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Box>
              Update Price - {asset.symbol}
            </Box>
            <ResponsiveButton
              onClick={() => setUpdateDialogOpen(false)}
              icon={<CloseIcon />}
              forceIconOnly={true}
              mobileText=""
              desktopText=""
              sx={{
                color: 'white',
                minWidth: 'auto',
                p: 1,
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }
              }}
            >
              Close
            </ResponsiveButton>
          </DialogTitle>
          <form onSubmit={handleSubmit(handlePriceUpdate)}>
            <DialogContent sx={{ p: 4 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Update the current price for <strong>{asset.name}</strong>
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Controller
                    name="price"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="New Price"
                        type="number"
                        fullWidth
                        error={!!errors.price}
                        helperText={errors.price?.message}
                        InputProps={{
                          startAdornment: <Typography sx={{ mr: 1, fontWeight: 600, color: '#667eea' }}>{asset.currency}</Typography>,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#667eea',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#667eea',
                              borderWidth: 2,
                            },
                          }
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
                        <Select 
                          {...field} 
                          label="Price Type"
                          sx={{
                            borderRadius: 2,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#667eea',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#667eea',
                              borderWidth: 2,
                            },
                          }}
                        >
                          {PRICE_TYPES.map((type) => (
                            <MenuItem key={type.value} value={type.value}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ 
                                  width: 12, 
                                  height: 12, 
                                  borderRadius: '50%', 
                                  backgroundColor: type.color 
                                }} />
                                {type.label}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.priceType && (
                          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
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
                        <Select 
                          {...field} 
                          label="Price Source"
                          sx={{
                            borderRadius: 2,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#667eea',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#667eea',
                              borderWidth: 2,
                            },
                          }}
                        >
                          {PRICE_SOURCES.map((source) => (
                            <MenuItem key={source.value} value={source.value}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ 
                                  width: 12, 
                                  height: 12, 
                                  borderRadius: '50%', 
                                  backgroundColor: source.color 
                                }} />
                                {source.label}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.priceSource && (
                          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
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
                        label="Change Reason (Optional)"
                        fullWidth
                        multiline
                        rows={3}
                        error={!!errors.changeReason}
                        helperText={errors.changeReason?.message}
                        placeholder="Enter a reason for this price change..."
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#667eea',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#667eea',
                              borderWidth: 2,
                            },
                          }
                        }}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ 
              p: 3, 
              pt: 2,
              gap: 2,
              borderTop: '1px solid rgba(0,0,0,0.1)',
              justifyContent: 'flex-end'
            }}>
              <ActionButton
                type="submit"
                variant="contained"
                disabled={loading}
                icon={loading ? <CircularProgress size={20} /> : <EditIcon />}
                mobileText={loading ? 'Updating...' : 'Update'}
                desktopText={loading ? 'Updating...' : 'Update Price'}
                forceTextOnly={true}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontWeight: 700,
                  minWidth: 140,
                  borderRadius: 2,
                  boxShadow: '0 4px 16px rgba(102,126,234,0.3)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(102,126,234,0.4)',
                  }
                }}
              >
                {loading ? 'Updating...' : 'Update Price'}
              </ActionButton>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default AssetPriceManagement;
