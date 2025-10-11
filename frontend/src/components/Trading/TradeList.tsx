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
  Card,
  CardContent,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
  AccountBalance as ExchangeIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  ShowChart as ChartIcon,
  AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material';
import { FIFOTooltip } from '../Common';
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
  isCompactMode?: boolean;
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
  isCompactMode = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sideFilter, setSideFilter] = useState<TradeSide | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<TradeType | 'ALL'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<TradeSource | 'ALL'>('ALL');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [exchangeViewMode, setExchangeViewMode] = useState<'grid' | 'list'>('list');

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
    return side === TradeSide.BUY ? 
      <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} /> : 
      <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />;
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={isCompactMode ? 1 : 3}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0 }}>
            <Typography variant={isCompactMode ? "h6" : "h4"} fontWeight="bold" component="h2">
              Trade Summary
            </Typography>
            <FIFOTooltip 
              placement="top" 
              size="small" 
              color="primary"
            />
          </Box>
          {!isCompactMode && (
            <Typography variant="body1" color="text.secondary">
              Manage and track all your trading activities
            </Typography>
          )}
        </Box>
        <Box display="flex" gap={0.5}>
          <Button
            variant={exchangeViewMode === 'grid' ? 'contained' : 'outlined'}
            size="small"
            startIcon={<GridViewIcon />}
            onClick={() => setExchangeViewMode('grid')}
            sx={{ 
              textTransform: 'none',
              minWidth: isCompactMode ? 60 : 80,
              px: isCompactMode ? 1 : 2
            }}
          >
            {isCompactMode ? 'G' : 'Grid'}
          </Button>
          <Button
            variant={exchangeViewMode === 'list' ? 'contained' : 'outlined'}
            size="small"
            startIcon={<ListViewIcon />}
            onClick={() => setExchangeViewMode('list')}
            sx={{ 
              textTransform: 'none',
              minWidth: isCompactMode ? 60 : 80,
              px: isCompactMode ? 1 : 2
            }}
          >
            {isCompactMode ? 'L' : 'List'}
          </Button>
        </Box>
      </Box>

      {/* Exchange Summary Section */}
      <Box sx={{ mb: isCompactMode ? 1 : 4 }}>
        
        {/* Calculate exchange statistics */}
        {(() => {
          const exchangeStats = filteredTrades.reduce((acc, trade) => {
            const exchange = trade.exchange || 'Unknown';
            if (!acc[exchange]) {
              acc[exchange] = {
                exchange,
                totalTrades: 0,
                totalVolume: 0,
                totalFees: 0,
                totalRealizedPL: 0,
                buyVolume: 0,
                sellVolume: 0,
                buyTrades: 0,
                sellTrades: 0,
              };
            }
            
            const tradeValue = Number(trade.totalValue) || 0;
            const tradeFees = (Number(trade.fee) || 0) + (Number(trade.tax) || 0);
            const tradePL = Number(trade.realizedPl) || 0;
            
            acc[exchange].totalTrades += 1;
            acc[exchange].totalVolume += tradeValue;
            acc[exchange].totalFees += tradeFees;
            acc[exchange].totalRealizedPL += tradePL;
            
            if (trade.side === TradeSide.BUY) {
              acc[exchange].buyVolume += tradeValue;
              acc[exchange].buyTrades += 1;
            } else {
              acc[exchange].sellVolume += tradeValue;
              acc[exchange].sellTrades += 1;
            }
            
            return acc;
          }, {} as Record<string, any>);
          
          const exchangeList = Object.values(exchangeStats).sort((a, b) => b.totalVolume - a.totalVolume);
          
          return exchangeViewMode === 'grid' ? (
            // Grid View
            <Grid container spacing={isCompactMode ? 1 : 3}>
              {exchangeList.map((exchange: any) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={exchange.exchange}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      height: '100%',
                      background: 'rgba(255, 255, 255, 0.6)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: 'text.primary',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        background: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(15px)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                      },
                      transition: 'all 0.3s ease-in-out',
                    }}
                  >
                    <CardContent sx={{ p: isCompactMode ? 1 : 2 }}>
                      {/* Exchange Name */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: isCompactMode ? 0.5 : 1 }}>
                        <ExchangeIcon sx={{ 
                          mr: isCompactMode ? 0.5 : 1, 
                          color: '#1e40af',
                          fontSize: isCompactMode ? 18 : 22,
                          filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
                        }} />
                        <Typography variant={isCompactMode ? "body1" : "h6"} fontWeight="600" sx={{ 
                          color: '#1e293b',
                          textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                          letterSpacing: '0.025em'
                        }}>
                          {exchange.exchange}
                        </Typography>
                      </Box>
                      
                      {/* Total Volume */}
                      <Box sx={{ mb: isCompactMode ? 1 : 2, textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: isCompactMode ? 0.5 : 1 }}>
                          <Typography variant={isCompactMode ? "h6" : "h5"} fontWeight="700" sx={{ 
                            color: '#1e293b',
                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                            letterSpacing: '-0.025em'
                          }}>
                            {formatCurrency(exchange.totalVolume)}
                          </Typography>
                        </Box>
                        <Typography variant={isCompactMode ? "caption" : "body2"} sx={{ 
                          color: '#64748b',
                          fontWeight: 500,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          fontSize: isCompactMode ? '0.65rem' : '0.75rem'
                        }}>
                          Total Volume
                        </Typography>
                      </Box>
                      
                      {/* Stats Grid - Compact */}
                      <Box sx={{ mt: isCompactMode ? 1 : 2, display: 'flex', flexDirection: 'column', gap: isCompactMode ? 1 : 1.5 }}>
                        {/* Row 1: Trades & Fees */}
                        <Box sx={{ display: 'flex', gap: isCompactMode ? 1 : 1.5 }}>
                          {/* Trades */}
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: isCompactMode ? 0.5 : 1,
                            p: isCompactMode ? 1 : 1.5,
                            background: 'rgba(255, 255, 255, 0.8)',
                            backdropFilter: 'blur(5px)',
                            borderRadius: 2,
                            flex: 1,
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                          }}>
                            <AssessmentIcon sx={{ color: '#3b82f6', fontSize: 16, filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1))' }} />
                            <Box>
                              <Typography variant="caption" sx={{ 
                                color: '#64748b',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                fontSize: '0.7rem',
                                lineHeight: 1.2
                              }}>
                                Trades
                              </Typography>
                              <Typography variant="body2" sx={{ 
                                color: '#1e293b',
                                fontWeight: 700,
                                lineHeight: 1.2,
                                textShadow: '0 1px 1px rgba(0, 0, 0, 0.1)'
                              }}>
                                {exchange.totalTrades}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Fees */}
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: isCompactMode ? 0.5 : 1,
                            p: isCompactMode ? 1 : 1.5,
                            background: 'rgba(255, 255, 255, 0.8)',
                            backdropFilter: 'blur(5px)',
                            borderRadius: 2,
                            flex: 1,
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                          }}>
                            <WalletIcon sx={{ color: '#f59e0b', fontSize: 16, filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1))' }} />
                            <Box>
                              <Typography variant="caption" sx={{ 
                                color: '#64748b',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                fontSize: '0.7rem',
                                lineHeight: 1.2
                              }}>
                                Fees
                              </Typography>
                              <Typography variant="body2" sx={{ 
                                color: '#1e293b',
                                fontWeight: 700,
                                lineHeight: 1.2,
                                textShadow: '0 1px 1px rgba(0, 0, 0, 0.1)'
                              }}>
                                {formatCurrency(exchange.totalFees)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        {/* Row 2: P&L & Return */}
                        <Box sx={{ display: 'flex', gap: isCompactMode ? 1 : 1.5 }}>
                          {/* P&L */}
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: isCompactMode ? 0.5 : 1,
                            p: isCompactMode ? 1 : 1.5,
                            background: 'rgba(255, 255, 255, 0.8)',
                            backdropFilter: 'blur(5px)',
                            borderRadius: 2,
                            flex: 1,
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                          }}>
                            {exchange.totalRealizedPL >= 0 ? (
                              <TrendingUpIcon sx={{ color: '#16a34a', fontSize: 16, filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1))' }} />
                            ) : (
                              <TrendingDownIcon sx={{ color: '#dc2626', fontSize: 16, filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1))' }} />
                            )}
                            <Box>
                              <Typography variant="caption" sx={{ 
                                color: '#64748b',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                fontSize: '0.7rem',
                                lineHeight: 1.2
                              }}>
                                P&L
                              </Typography>
                              <Typography variant="body2" sx={{ 
                                color: exchange.totalRealizedPL >= 0 ? '#16a34a' : '#dc2626',
                                fontWeight: 700,
                                lineHeight: 1.2,
                                textShadow: '0 1px 1px rgba(0, 0, 0, 0.1)'
                              }}>
                                {formatCurrency(exchange.totalRealizedPL)}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Return */}
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: isCompactMode ? 0.5 : 1,
                            p: isCompactMode ? 1 : 1.5,
                            background: 'rgba(255, 255, 255, 0.8)',
                            backdropFilter: 'blur(5px)',
                            borderRadius: 2,
                            flex: 1,
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                          }}>
                            <ChartIcon sx={{ color: '#8b5cf6', fontSize: 16, filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1))' }} />
                            <Box>
                              <Typography variant="caption" sx={{ 
                                color: '#64748b',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                fontSize: '0.7rem',
                                lineHeight: 1.2
                              }}>
                                Return
                              </Typography>
                              <Typography variant="body2" sx={{ 
                                color: '#1e293b',
                                fontWeight: 700,
                                lineHeight: 1.2,
                                textShadow: '0 1px 1px rgba(0, 0, 0, 0.1)'
                              }}>
                                {exchange.totalVolume > 0 ? (exchange.totalRealizedPL / exchange.totalVolume * 100).toFixed(1) : 0}%
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                      
                      {/* Buy/Sell Breakdown - Compact */}
                      <Box sx={{ mt: isCompactMode ? 1 : 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: isCompactMode ? 1 : 2 }}>
                        {/* Buy Section */}
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1,
                          p: 1.5,
                          background: 'rgba(255, 255, 255, 0.8)',
                          backdropFilter: 'blur(5px)',
                          borderRadius: 2,
                          flex: 1,
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }}>
                          <TrendingUpIcon sx={{ color: '#16a34a', fontSize: 16, filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1))' }} />
                          <Box>
                            <Typography variant="body2" sx={{ 
                              color: '#16a34a',
                              fontWeight: 700,
                              lineHeight: 1.2,
                              textShadow: '0 1px 1px rgba(0, 0, 0, 0.1)'
                            }}>
                              {exchange.buyTrades} Buy
                            </Typography>
                            <Typography variant="caption" sx={{ 
                              color: '#64748b',
                              fontWeight: 500,
                              fontSize: '0.7rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em'
                            }}>
                              {formatCurrency(exchange.buyVolume)}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Sell Section */}
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1,
                          p: 1.5,
                          background: 'rgba(255, 255, 255, 0.8)',
                          backdropFilter: 'blur(5px)',
                          borderRadius: 2,
                          flex: 1,
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }}>
                          <TrendingDownIcon sx={{ color: '#dc2626', fontSize: 16, filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1))' }} />
                          <Box>
                            <Typography variant="body2" sx={{ 
                              color: '#dc2626',
                              fontWeight: 700,
                              lineHeight: 1.2,
                              textShadow: '0 1px 1px rgba(0, 0, 0, 0.1)'
                            }}>
                              {exchange.sellTrades} Sell
                            </Typography>
                            <Typography variant="caption" sx={{ 
                              color: '#64748b',
                              fontWeight: 500,
                              fontSize: '0.7rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em'
                            }}>
                              {formatCurrency(exchange.sellVolume)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              
              {/* No exchanges message */}
              {exchangeList.length === 0 && (
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="text.secondary">
                      No exchange data available
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Exchange information will appear here when trades are recorded
                    </Typography>
                  </Card>
                </Grid>
              )}
            </Grid>
          ) : (
            // List View
            <Box>
              {exchangeList.length === 0 ? (
                <Card variant="outlined" sx={{ textAlign: 'center', py: isCompactMode ? 2 : 4 }}>
                  <Typography variant={isCompactMode ? "body1" : "h6"} color="text.secondary">
                    No exchange data available
                  </Typography>
                  <Typography variant={isCompactMode ? "caption" : "body2"} color="text.secondary">
                    Exchange information will appear here when trades are recorded
                  </Typography>
                </Card>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size={isCompactMode ? "small" : "medium"}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: isCompactMode ? 0.5 : 1 }}>Exchange</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary', py: isCompactMode ? 0.5 : 1 }}>Total Volume</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary', py: isCompactMode ? 0.5 : 1 }}>Trades</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary', py: isCompactMode ? 0.5 : 1 }}>Fees</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary', py: isCompactMode ? 0.5 : 1 }}>P&L</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary', py: isCompactMode ? 0.5 : 1 }}>Return %</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, color: 'text.primary', py: isCompactMode ? 0.5 : 1 }}>Buy</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, color: 'text.primary', py: isCompactMode ? 0.5 : 1 }}>Sell</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {exchangeList.map((exchange: any) => (
                        <TableRow 
                          key={exchange.exchange} 
                          hover
                          sx={{ 
                            '&:hover': { 
                              bgcolor: 'action.hover',
                            },
                            '&:last-child td': { borderBottom: 0 }
                          }}
                        >
                          <TableCell sx={{ py: isCompactMode ? 0.5 : 1 }}>
                            <Box>
                              <Typography variant={isCompactMode ? "body2" : "body1"} fontWeight="medium">
                                {exchange.exchange}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ py: isCompactMode ? 0.5 : 1 }}>
                            <Typography variant={isCompactMode ? "body2" : "body1"} fontWeight="medium">
                              {formatCurrency(exchange.totalVolume)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ py: isCompactMode ? 0.5 : 1 }}>
                            <Typography variant={isCompactMode ? "body2" : "body1"}>
                              {exchange.totalTrades}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ py: isCompactMode ? 0.5 : 1 }}>
                            <Typography variant={isCompactMode ? "body2" : "body1"}>
                              {formatCurrency(exchange.totalFees)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ py: isCompactMode ? 0.5 : 1 }}>
                            <Typography 
                              variant={isCompactMode ? "body2" : "body1"} 
                              fontWeight="medium"
                              color={exchange.totalRealizedPL >= 0 ? 'success.main' : 'error.main'}
                            >
                              {formatCurrency(exchange.totalRealizedPL)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ py: isCompactMode ? 0.5 : 1 }}>
                            <Typography variant={isCompactMode ? "body2" : "body1"} fontWeight="medium">
                              {exchange.totalVolume > 0 ? (exchange.totalRealizedPL / exchange.totalVolume * 100).toFixed(1) : 0}%
                            </Typography>
                          </TableCell>
                          <TableCell align="center" sx={{ py: isCompactMode ? 0.5 : 1 }}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant={isCompactMode ? "caption" : "body2"} fontWeight="medium">
                                {exchange.buyTrades}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: isCompactMode ? '0.65rem' : '0.75rem' }}>
                                {formatCurrency(exchange.buyVolume)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center" sx={{ py: isCompactMode ? 0.5 : 1 }}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant={isCompactMode ? "caption" : "body2"} fontWeight="medium">
                                {exchange.sellTrades}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: isCompactMode ? '0.65rem' : '0.75rem' }}>
                                {formatCurrency(exchange.sellVolume)}
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          );
        })()}
      </Box>

      {/* Search and Filters */}
      <Box sx={{ mb: isCompactMode ? 2 : 3 }}>
        {/* Title and Action Buttons */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={isCompactMode ? 2 : 3}>
          <Typography variant={isCompactMode ? "h6" : "h5"} fontWeight="600" color="text.primary">
            Trade List
          </Typography>
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
        
        <Grid container spacing={isCompactMode ? 1 : 2} mb={isCompactMode ? 2 : 3}>
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
                label={`${filteredTrades.length} trades`}
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
          mb: isCompactMode ? 2 : 3,
          boxShadow: 1,
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: isCompactMode ? 1 : 2 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: isCompactMode ? 1 : 2 }}>Asset</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: isCompactMode ? 1 : 2 }}>Side</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: isCompactMode ? 1 : 2 }}>Exchange</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.primary', py: isCompactMode ? 1 : 2 }}>Funding Source</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary', py: isCompactMode ? 1 : 2 }}>Quantity</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary', py: isCompactMode ? 1 : 2 }}>Price</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary', py: isCompactMode ? 1 : 2 }}>Total Value</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary', py: isCompactMode ? 1 : 2 }}>Fees</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary', py: isCompactMode ? 1 : 2 }}>Total Cost</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary', py: isCompactMode ? 1 : 2 }}>P&L</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, color: 'text.primary', py: isCompactMode ? 1 : 2 }}>Actions</TableCell>
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
                    <TableCell sx={{ py: isCompactMode ? 1 : 2 }}>
                      <Typography variant={isCompactMode ? "caption" : "body2"}>
                        {format(parseISO(trade.tradeDate.toString()), 'MMM dd, yyyy')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(parseISO(trade.tradeDate.toString()), 'HH:mm')}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: isCompactMode ? 1 : 2 }}>
                      <Box>
                        <Typography variant={isCompactMode ? "caption" : "body2"} fontWeight="medium">
                          {trade.assetSymbol || trade.asset?.symbol || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {trade.assetName || trade.asset?.name || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: isCompactMode ? 1 : 2 }}>
                      <Chip
                        label={trade.side}
                        color={getSideColor(trade.side)}
                        size={isCompactMode ? "small" : "medium"}
                        icon={<span style={{ fontSize: '14px' }}>{getSideIcon(trade.side)}</span>}
                        sx={{
                          fontWeight: 600,
                          '& .MuiChip-icon': {
                            marginLeft: 0.5,
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: isCompactMode ? 1 : 2 }}>
                      <Typography variant={isCompactMode ? "caption" : "body2"} color="text.secondary">
                        {trade.exchange || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: isCompactMode ? 1 : 2 }}>
                      <Typography variant={isCompactMode ? "caption" : "body2"} color="text.secondary">
                        {trade.fundingSource || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: isCompactMode ? 1 : 2 }}>
                      <Typography variant={isCompactMode ? "caption" : "body2"}>
                        {formatNumber(trade.quantity, 2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: isCompactMode ? 1 : 2 }}>
                      <Typography variant={isCompactMode ? "caption" : "body2"}>
                        {formatCurrency(trade.price)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: isCompactMode ? 1 : 2 }}>
                      <Typography variant={isCompactMode ? "caption" : "body2"} fontWeight="medium">
                        {formatCurrency(Number(trade.totalValue) || (trade.quantity * trade.price))}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: isCompactMode ? 1 : 2 }}>
                      <Typography variant={isCompactMode ? "caption" : "body2"}>
                        {formatCurrency((Number(trade.fee) || 0) + (Number(trade.tax) || 0))}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: isCompactMode ? 1 : 2 }}>
                      <Typography variant={isCompactMode ? "caption" : "body2"} fontWeight="medium">
                        {formatCurrency(Number(trade.totalCost) || ((trade.quantity * trade.price) + (Number(trade.fee) || 0) + (Number(trade.tax) || 0)))}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: isCompactMode ? 1 : 2 }}>
                      {trade.realizedPl !== undefined && (
                        <Typography
                          variant={isCompactMode ? "caption" : "body2"}
                          color={trade.realizedPl >= 0 ? 'success.main' : 'error.main'}
                          fontWeight="medium"
                        >
                          {formatCurrency(Number(trade.realizedPl) || 0)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ py: isCompactMode ? 1 : 2 }}>
                      <Tooltip title="Actions">
                        <IconButton
                          size={isCompactMode ? "small" : "medium"}
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
        <Box display="flex" justifyContent="center" mt={isCompactMode ? 2 : 3}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => onPageChange?.(page)}
            color="primary"
            shape="rounded"
            size={isCompactMode ? "medium" : "large"}
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
export const TradeListContainer: React.FC<{ portfolioId: string; onCreate?: () => void; isCompactMode?: boolean }> = ({ portfolioId, onCreate, isCompactMode = false }) => {
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
        isCompactMode={isCompactMode}
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
