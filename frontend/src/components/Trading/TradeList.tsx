import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Pagination,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { TradeSide, TradeType, TradeSource } from '../../types';
import { useTrades, useDeleteTrade, useTradeDetails, useUpdateTrade } from '../../hooks/useTrading';
import { formatCurrency, formatNumber } from '../../utils/format';
import EditTradeModal from './EditTradeModal';
import TradeDetailsModal from './TradeDetailsModal';
import ConfirmModal from '../Common/ConfirmModal';

export interface Trade {
  tradeId: string;
  portfolioId: string;
  assetId: string;
  assetSymbol?: string;
  assetName?: string;
  asset?: {
    id: string;
    symbol: string;
    name: string;
    type: string;
    assetClass: string;
    currency: string;
  };
  tradeDate: string;
  side: TradeSide;
  quantity: number;
  price: number;
  totalValue?: number;
  fee?: number;
  tax?: number;
  totalCost?: number;
  tradeType?: TradeType;
  source?: TradeSource;
  exchange?: string;
  fundingSource?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  realizedPl?: number;
  tradeDetailsCount?: number;
  remainingQuantity?: number;
}

export interface TradeListProps {
  trades: Trade[];
  isLoading?: boolean;
  error?: string;
  onEdit?: (trade: Trade) => void;
  onDelete?: (trade: Trade) => void;
  onView?: (trade: Trade) => void;
  onCreate?: () => void;
  onPageChange?: (page: number) => void;
  onFiltersChange?: (filters: any) => void;
  filters?: any;
  currentPage?: number;
  totalPages?: number;
  totalTrades?: number;
}

/**
 * TradeList component for displaying and managing trades.
 * Provides filtering, sorting, pagination, and action buttons.
 */
export const TradeList: React.FC<TradeListProps> = ({
  trades,
  isLoading = false,
  onEdit,
  onDelete,
  onView,
  onCreate,
  onPageChange,
  currentPage = 1,
  totalPages = 1,
  totalTrades = 0,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sideFilter, setSideFilter] = useState<TradeSide | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<TradeType | 'ALL'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<TradeSource | 'ALL'>('ALL');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  // Filter and search trades
  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      const matchesSearch = 
        trade.assetSymbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.assetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSide = sideFilter === 'ALL' || trade.side === sideFilter;
      const matchesType = typeFilter === 'ALL' || trade.tradeType === typeFilter;
      const matchesSource = sourceFilter === 'ALL' || trade.source === sourceFilter;

      return matchesSearch && matchesSide && matchesType && matchesSource;
    });
  }, [trades, searchTerm, sideFilter, typeFilter, sourceFilter]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, trade: Trade) => {
    event.stopPropagation(); // Prevent row click event
    setAnchorEl(event.currentTarget);
    setSelectedTrade(trade);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTrade(null);
  };

  const handleAction = (action: 'view' | 'edit' | 'delete') => {
    if (!selectedTrade) return;

    switch (action) {
      case 'view':
        onView?.(selectedTrade);
        break;
      case 'edit':
        onEdit?.(selectedTrade);
        break;
      case 'delete':
        onDelete?.(selectedTrade);
        break;
    }
    handleMenuClose();
  };

  const getSideColor = (side: TradeSide) => {
    return side === TradeSide.BUY ? 'success' : 'error';
  };

  const getSideIcon = (side: TradeSide) => {
    return side === TradeSide.BUY ? '↗' : '↘';
  };



  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h6" component="h2" gutterBottom>
            Trade History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and track all your trading activities
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => {
              // Toggle filter visibility
            }}
            sx={{ textTransform: 'none' }}
          >
            Filters
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreate}
            sx={{ textTransform: 'none' }}
          >
            New Trade
          </Button>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search trades by symbol, name, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Side</InputLabel>
              <Select
                value={sideFilter}
                label="Side"
                onChange={(e) => setSideFilter(e.target.value as TradeSide | 'ALL')}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="ALL">All Sides</MenuItem>
                <MenuItem value={TradeSide.BUY}>Buy</MenuItem>
                <MenuItem value={TradeSide.SELL}>Sell</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                label="Type"
                onChange={(e) => setTypeFilter(e.target.value as TradeType | 'ALL')}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="ALL">All Types</MenuItem>
                <MenuItem value={TradeType.MARKET}>Market</MenuItem>
                <MenuItem value={TradeType.LIMIT}>Limit</MenuItem>
                <MenuItem value={TradeType.STOP}>Stop</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Source</InputLabel>
              <Select
                value={sourceFilter}
                label="Source"
                onChange={(e) => setSourceFilter(e.target.value as TradeSource | 'ALL')}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="ALL">All Sources</MenuItem>
                <MenuItem value={TradeSource.MANUAL}>Manual</MenuItem>
                <MenuItem value={TradeSource.API}>API</MenuItem>
                <MenuItem value={TradeSource.IMPORT}>Import</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Box display="flex" alignItems="center" height="100%">
              <Chip
                label={`${filteredTrades.length} of ${totalTrades} trades`}
                color="primary"
                variant="outlined"
                size="small"
              />
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Trades Table */}
      <TableContainer 
        component={Paper} 
        variant="outlined"
        sx={{ 
          borderRadius: 2,
          mb: 3,
          boxShadow: 1,
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Asset</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Side</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Exchange</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Funding Source</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary' }}>Quantity</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary' }}>Price</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary' }}>Total Value</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary' }}>Fees</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary' }}>Total Cost</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary' }}>P&L</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, color: 'text.primary' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={12} align="center" sx={{ py: 6 }}>
                  <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                    <CircularProgress size={40} />
                    <Typography color="text.secondary">Loading trades...</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : filteredTrades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} align="center" sx={{ py: 6 }}>
                  <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                    <Typography variant="h6" color="text.secondary">
                      No trades found
                    </Typography>
                    <Typography color="text.secondary">
                      No trades match your current filter criteria.
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={onCreate}
                      sx={{ mt: 1 }}
                    >
                      Create First Trade
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredTrades.map((trade) => (
                <TableRow 
                  key={trade.tradeId} 
                  hover
                  onClick={() => onView?.(trade)}
                  sx={{ 
                    '&:hover': { 
                      bgcolor: 'action.hover',
                      cursor: 'pointer',
                    },
                    '&:last-child td': { borderBottom: 0 }
                  }}
                >
                    <TableCell>
                      <Typography variant="body2">
                        {format(parseISO(trade.tradeDate.toString()), 'MMM dd, yyyy')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(parseISO(trade.tradeDate.toString()), 'HH:mm')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {trade.assetSymbol || trade.asset?.symbol || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {trade.assetName || trade.asset?.name || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={trade.side}
                        color={getSideColor(trade.side)}
                        size="small"
                        icon={<span style={{ fontSize: '14px' }}>{getSideIcon(trade.side)}</span>}
                        sx={{
                          fontWeight: 600,
                          '& .MuiChip-icon': {
                            marginLeft: 0.5,
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {trade.exchange || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {trade.fundingSource || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatNumber(trade.quantity, 2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatCurrency(trade.price)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(Number(trade.totalValue) || (trade.quantity * trade.price))}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatCurrency((Number(trade.fee) || 0) + (Number(trade.tax) || 0))}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(Number(trade.totalCost) || ((trade.quantity * trade.price) + (Number(trade.fee) || 0) + (Number(trade.tax) || 0)))}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {trade.realizedPl !== undefined && (
                        <Typography
                          variant="body2"
                          color={trade.realizedPl >= 0 ? 'success.main' : 'error.main'}
                          fontWeight="medium"
                        >
                          {formatCurrency(Number(trade.realizedPl) || 0)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Actions">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, trade)}
                          sx={{
                            '&:hover': {
                              bgcolor: 'primary.main',
                              color: 'white',
                            },
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => onPageChange?.(page)}
            color="primary"
            shape="rounded"
            size="large"
          />
        </Box>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: 3,
            minWidth: 160,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem 
          onClick={() => handleAction('view')}
          sx={{ py: 1.5 }}
        >
          <ListItemIcon>
            <ViewIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => handleAction('edit')}
          sx={{ py: 1.5 }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText>Edit Trade</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => handleAction('delete')}
          sx={{ py: 1.5, color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Trade</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

// Wrapper component that uses the hook
export const TradeListContainer: React.FC<{ portfolioId: string; onCreate?: () => void; isCompactMode?: boolean }> = ({ portfolioId, onCreate, isCompactMode: _isCompactMode = false }) => {
  const [filters, setFilters] = useState({
    assetId: '',
    side: '',
    startDate: '',
    endDate: '',
  });
  
  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  
  const { data: trades, isLoading, error } = useTrades(portfolioId, filters);
  const deleteTradeMutation = useDeleteTrade();
  const updateTradeMutation = useUpdateTrade();
  const { data: tradeDetails, isLoading: detailsLoading, error: detailsError } = useTradeDetails(selectedTrade?.tradeId || '');

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleEdit = (trade: Trade) => {
    setSelectedTrade(trade);
    setEditModalOpen(true);
  };

  const handleView = (trade: Trade) => {
    setSelectedTrade(trade);
    setDetailsModalOpen(true);
  };

  const handleDelete = (trade: Trade) => {
    setSelectedTrade(trade);
    setConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTrade) return;
    
    try {
      await deleteTradeMutation.mutateAsync(selectedTrade.tradeId);
      setConfirmModalOpen(false);
      setSelectedTrade(null);
    } catch (error) {
      console.error('Error deleting trade:', error);
    }
  };

  const handleCloseModals = () => {
    setEditModalOpen(false);
    setDetailsModalOpen(false);
    setConfirmModalOpen(false);
    setSelectedTrade(null);
  };

  const handleCreate = () => {
    if (onCreate) {
      onCreate();
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading trades...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {(error as any)?.message || 'Failed to load trades'}
      </Alert>
    );
  }

  return (
    <Box>
      <TradeList
        trades={trades || []}
        isLoading={isLoading}
        error={(error as any)?.message}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        onCreate={handleCreate}
        onFiltersChange={handleFiltersChange}
        filters={filters}
        totalTrades={trades?.length || 0}
      />
      
      {/* Edit Trade Modal */}
      <EditTradeModal
        open={editModalOpen}
        onClose={handleCloseModals}
        onSubmit={async (data) => {
          if (selectedTrade) {
            try {
              await updateTradeMutation.mutateAsync({
                id: selectedTrade.tradeId,
                data: {
                  ...data,
                  tradeDate: typeof data.tradeDate === 'string' ? data.tradeDate : (data.tradeDate as Date).toISOString()
                }
              });
              handleCloseModals();
            } catch (error) {
              console.error('Error updating trade:', error);
            }
          }
        }}
        initialData={selectedTrade ? {
          ...selectedTrade,
          tradeDate: typeof selectedTrade.tradeDate === 'string' ? selectedTrade.tradeDate : (selectedTrade.tradeDate as Date).toISOString()
        } : undefined}
        isLoading={updateTradeMutation.isLoading}
        error={updateTradeMutation.error?.message}
      />
      
      {/* Trade Details Modal */}
      <TradeDetailsModal
        open={detailsModalOpen}
        onClose={handleCloseModals}
        onEdit={handleEdit}
        trade={selectedTrade}
        tradeDetails={tradeDetails?.tradeDetails || []}
        isLoading={detailsLoading}
        error={typeof detailsError === 'object' && detailsError !== null && 'message' in detailsError ? (detailsError as any).message : undefined}
      />
      
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={confirmModalOpen}
        onClose={handleCloseModals}
        onConfirm={handleConfirmDelete}
        title="Delete Trade"
        message={`Are you sure you want to delete this trade for ${selectedTrade?.assetSymbol || selectedTrade?.asset?.symbol || 'this asset'}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="delete"
        isLoading={deleteTradeMutation.isLoading}
        confirmColor="error"
      />
    </Box>
  );
};

export default TradeList;
