import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Tooltip,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { PositionResponseDto } from '../../types/trading';
import { ResponsiveButton } from '../Common';

export interface PositionTableProps {
  positions: PositionResponseDto[];
  isLoading?: boolean;
  onViewDetails?: (position: PositionResponseDto) => void;
  onSetRiskTargets?: (position: PositionResponseDto) => void;
  onViewPerformance?: (position: PositionResponseDto) => void;
}

/**
 * PositionTable component for displaying portfolio positions.
 * Provides filtering, sorting, and action buttons for position management.
 */
export const PositionTable: React.FC<PositionTableProps> = ({
  positions,
  isLoading = false,
  onViewDetails,
  onSetRiskTargets,
  onViewPerformance,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [performanceFilter, setPerformanceFilter] = useState<string>('ALL');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPosition, setSelectedPosition] = useState<PositionResponseDto | null>(null);

  // Filter positions
  const filteredPositions = useMemo(() => {
    return positions.filter((position) => {
      const matchesSearch = 
        position.assetSymbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        position.assetName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === 'ALL' || position.assetType === typeFilter;
      
      let matchesPerformance = true;
      if (performanceFilter === 'PROFITABLE') {
        matchesPerformance = position.unrealizedPl > 0;
      } else if (performanceFilter === 'LOSING') {
        matchesPerformance = position.unrealizedPl < 0;
      } else if (performanceFilter === 'BREAKEVEN') {
        matchesPerformance = position.unrealizedPl === 0;
      }

      return matchesSearch && matchesType && matchesPerformance;
    });
  }, [positions, searchTerm, typeFilter, performanceFilter]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, position: PositionResponseDto) => {
    setAnchorEl(event.currentTarget);
    setSelectedPosition(position);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPosition(null);
  };

  const handleAction = (action: 'details' | 'risk' | 'performance') => {
    if (!selectedPosition) return;

    switch (action) {
      case 'details':
        onViewDetails?.(selectedPosition);
        break;
      case 'risk':
        onSetRiskTargets?.(selectedPosition);
        break;
      case 'performance':
        onViewPerformance?.(selectedPosition);
        break;
    }
    handleMenuClose();
  };

  const getPerformanceColor = (pl: number) => {
    if (pl > 0) return 'success';
    if (pl < 0) return 'error';
    return 'default';
  };

  const getPerformanceIcon = (pl: number) => {
    if (pl > 0) return <TrendingUpIcon />;
    if (pl < 0) return <TrendingDownIcon />;
    return null;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number, decimals: number = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const formatPercentage = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num / 100);
  };

  // Calculate totals
  const totalValue = filteredPositions.reduce((sum, pos) => sum + pos.marketValue, 0);
  const totalUnrealizedPL = filteredPositions.reduce((sum, pos) => sum + pos.unrealizedPl, 0);
  const totalRealizedPL = filteredPositions.reduce((sum, pos) => sum + pos.realizedPl, 0);

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h2">
            Portfolio Positions
          </Typography>
          <Box display="flex" gap={2}>
            <ResponsiveButton
              variant="outlined"
              icon={<FilterIcon />}
              mobileText="Filter"
              desktopText="Filters"
              onClick={() => {
                // Toggle filter visibility
              }}
            >
              Filters
            </ResponsiveButton>
          </Box>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  {formatCurrency(totalValue)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Value
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography
                  variant="h6"
                  color={totalUnrealizedPL >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatCurrency(totalUnrealizedPL)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Unrealized P&L
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography
                  variant="h6"
                  color={totalRealizedPL >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatCurrency(totalRealizedPL)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Realized P&L
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6">
                  {filteredPositions.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Positions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Filters */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search positions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Asset Type</InputLabel>
              <Select
                value={typeFilter}
                label="Asset Type"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Types</MenuItem>
                <MenuItem value="STOCK">Stock</MenuItem>
                <MenuItem value="BOND">Bond</MenuItem>
                <MenuItem value="COMMODITY">Commodity</MenuItem>
                <MenuItem value="CASH">Cash</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Performance</InputLabel>
              <Select
                value={performanceFilter}
                label="Performance"
                onChange={(e) => setPerformanceFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Positions</MenuItem>
                <MenuItem value="PROFITABLE">Profitable</MenuItem>
                <MenuItem value="LOSING">Losing</MenuItem>
                <MenuItem value="BREAKEVEN">Breakeven</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {filteredPositions.length} positions
            </Typography>
          </Grid>
        </Grid>

        {/* Positions Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Asset</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Avg Cost</TableCell>
                <TableCell align="right">Market Price</TableCell>
                <TableCell align="right">Market Value</TableCell>
                <TableCell align="right">Unrealized P&L</TableCell>
                <TableCell align="right">Realized P&L</TableCell>
                <TableCell align="right">Total P&L</TableCell>
                <TableCell align="right">Weight</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                    <Typography>Loading positions...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredPositions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No positions found matching your criteria.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPositions.map((position) => (
                  <TableRow key={position.assetId} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {position.assetSymbol}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {position.assetName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={position.assetType}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatNumber(position.quantity, 2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatCurrency(position.avgCost)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatCurrency(position.marketPrice)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(position.marketValue)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                        {getPerformanceIcon(position.unrealizedPl)}
                        <Typography
                          variant="body2"
                          color={getPerformanceColor(position.unrealizedPl)}
                          fontWeight="medium"
                        >
                          {formatCurrency(position.unrealizedPl)}
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        color={getPerformanceColor(position.unrealizedPl)}
                      >
                        {formatPercentage(position.unrealizedPlPercentage)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        color={getPerformanceColor(position.realizedPl)}
                        fontWeight="medium"
                      >
                        {formatCurrency(position.realizedPl)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        color={getPerformanceColor(position.totalPl)}
                        fontWeight="medium"
                      >
                        {formatCurrency(position.totalPl)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                    <Typography variant="body2">
                      {formatPercentage(position.portfolioWeight || 0)}
                    </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Actions">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, position)}
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

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleAction('details')}>
            <ListItemIcon>
              <TrendingUpIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleAction('risk')}>
            <ListItemIcon>
              <TrendingDownIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Set Risk Targets</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleAction('performance')}>
            <ListItemIcon>
              <TrendingUpIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Performance</ListItemText>
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
};

export default PositionTable;
