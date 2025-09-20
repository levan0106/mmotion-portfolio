// SnapshotList Component for CR-006 Asset Snapshot System

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  LinearProgress,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useSnapshots } from '../../hooks/useSnapshots';
import { SnapshotResponse, SnapshotQueryParams, SnapshotGranularity } from '../../types/snapshot.types';

interface SnapshotListProps {
  portfolioId?: string;
  onSnapshotSelect?: (snapshot: SnapshotResponse) => void;
  onSnapshotEdit?: (snapshot: SnapshotResponse) => void;
  onSnapshotDelete?: (snapshot: SnapshotResponse) => void;
  showActions?: boolean;
  showFilters?: boolean;
  pageSize?: number;
}

export const SnapshotList: React.FC<SnapshotListProps> = ({
  portfolioId,
  onSnapshotSelect,
  onSnapshotEdit,
  onSnapshotDelete,
  showActions = true,
  showFilters = true,
  pageSize = 10,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<SnapshotQueryParams>({
    portfolioId,
    page: currentPage,
    limit: pageSize,
  });

  const {
    snapshots,
    loading,
    error,
    pagination,
    fetchSnapshotsPaginated,
    deleteSnapshot,
    recalculateSnapshot,
    clearError,
  } = useSnapshots(filters);

  // Fetch data when component mounts or filters change
  useEffect(() => {
    if (portfolioId) {
      fetchSnapshotsPaginated(filters);
    }
  }, [filters, portfolioId]);

  const handleFilterChange = (newFilters: Partial<SnapshotQueryParams>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    setFilters(updatedFilters);
    setCurrentPage(1);
    fetchSnapshotsPaginated(updatedFilters);
  };


  const handleDelete = async (snapshot: SnapshotResponse) => {
    if (window.confirm(`Are you sure you want to delete snapshot for ${snapshot.assetSymbol}?`)) {
      try {
        await deleteSnapshot(snapshot.id);
        onSnapshotDelete?.(snapshot);
      } catch (error) {
        console.error('Failed to delete snapshot:', error);
      }
    }
  };

  const handleRecalculate = async (snapshot: SnapshotResponse) => {
    try {
      await recalculateSnapshot(snapshot.id);
    } catch (error) {
      console.error('Failed to recalculate snapshot:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const theme = useTheme();

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary" align="center">
          Loading snapshots...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={clearError}>
              Dismiss
            </Button>
          }
        >
          Error: {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Filters */}
      {showFilters && (
        <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, border: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <FilterIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Filters
            </Typography>
          </Box>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <TextField
              size="small"
              label="Asset Symbol"
              placeholder="Filter by symbol"
              value={filters.assetSymbol || ''}
              onChange={(e) => handleFilterChange({ assetSymbol: e.target.value || undefined })}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
            
            <FormControl size="small">
              <InputLabel>Granularity</InputLabel>
              <Select
                value={filters.granularity || ''}
                onChange={(e) => handleFilterChange({ 
                  granularity: e.target.value as SnapshotGranularity || undefined 
                })}
                label="Granularity"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value={SnapshotGranularity.DAILY}>Daily</MenuItem>
                <MenuItem value={SnapshotGranularity.WEEKLY}>Weekly</MenuItem>
                <MenuItem value={SnapshotGranularity.MONTHLY}>Monthly</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              type="date"
              label="Start Date"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange({ startDate: e.target.value || undefined })}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              size="small"
              type="date"
              label="End Date"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange({ endDate: e.target.value || undefined })}
              InputLabelProps={{ shrink: true }}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label="Active Only"
                color={filters.isActive ? 'primary' : 'default'}
                onClick={() => handleFilterChange({ isActive: !filters.isActive })}
                variant={filters.isActive ? 'filled' : 'outlined'}
              />
            </Box>
          </Box>
        </Paper>
      )}

      {/* Table */}
      <Paper elevation={0} sx={{ flexGrow: 1, borderRadius: 2, border: 1, borderColor: 'divider', overflow: 'hidden' }}>
        <TableContainer sx={{ height: '100%' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                  Date
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                  Asset
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                  Granularity
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                  Quantity
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                  Price
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                  Value
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                  P&L
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                  Return %
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                  Allocation %
                </TableCell>
                {showActions && (
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                    Actions
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {snapshots.map((snapshot) => (
                <TableRow
                  key={snapshot.id}
                  hover
                  onClick={() => onSnapshotSelect?.(snapshot)}
                  sx={{
                    cursor: 'pointer',
                    opacity: snapshot.isActive ? 1 : 0.6,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                    },
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {formatDate(snapshot.snapshotDate)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {snapshot.assetSymbol}
                      </Typography>
                      {snapshot.notes && (
                        <Tooltip title={snapshot.notes}>
                          <Chip label="📝" size="small" />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={snapshot.granularity}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {snapshot.quantity.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(snapshot.currentPrice)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(snapshot.currentValue)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: snapshot.totalPl >= 0 ? 'success.main' : 'error.main'
                      }}
                    >
                      {formatCurrency(snapshot.totalPl)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: snapshot.returnPercentage >= 0 ? 'success.main' : 'error.main'
                      }}
                    >
                      {formatPercentage(snapshot.returnPercentage)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {formatPercentage(snapshot.allocationPercentage)}
                    </Typography>
                  </TableCell>
                  {showActions && (
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Edit snapshot">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSnapshotEdit?.(snapshot);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Recalculate snapshot">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRecalculate(snapshot);
                            }}
                          >
                            <RefreshIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete snapshot">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(snapshot);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {snapshots.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No snapshots found
            </Typography>
          </Box>
        )}

        {/* Pagination */}
        {pagination && (
          <TablePagination
            component="div"
            count={pagination.total}
            page={pagination.page - 1}
            onPageChange={(_, newPage) => {
              setCurrentPage(newPage + 1);
              handleFilterChange({ page: newPage + 1 });
            }}
            rowsPerPage={pagination.limit}
            onRowsPerPageChange={(e) => {
              const newLimit = parseInt(e.target.value, 10);
              setCurrentPage(1);
              handleFilterChange({ limit: newLimit, page: 1 });
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Rows per page:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
            }
          />
        )}
      </Paper>
    </Box>
  );
};
