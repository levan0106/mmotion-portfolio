import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '../../utils/format';
import usePriceHistory, { UsePriceHistoryOptions } from '../../hooks/usePriceHistory';

interface PriceHistoryTableProps {
  assetId: string;
  initialQuery?: Partial<UsePriceHistoryOptions['query']>;
  showFilters?: boolean;
  showPagination?: boolean;
  pageSize?: number;
}

const PriceHistoryTable: React.FC<PriceHistoryTableProps> = ({
  assetId,
  initialQuery = {},
  showFilters = true,
  showPagination = true,
  pageSize = 10
}) => {
  const [query, setQuery] = useState<UsePriceHistoryOptions['query']>({
    limit: pageSize,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
    ...initialQuery
  });

  const {
    data,
    isLoading,
    error,
    refetch,
    goToPage,
    currentPage,
    totalPages,
    totalRecords
  } = usePriceHistory({ assetId, query });

  const handleFilterChange = (field: string, value: any) => {
    setQuery(prev => ({
      ...prev,
      [field]: value,
      offset: 0 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    goToPage(page);
  };

  const getPriceChangeIcon = (record: any, index: number) => {
    if (index === 0) return null; // No change for first record
    
    const currentPrice = record.price;
    const previousPrice = data?.data[index - 1]?.price;
    
    if (!previousPrice) return null;
    
    if (currentPrice > previousPrice) {
      return <TrendingUpIcon color="success" fontSize="small" />;
    } else if (currentPrice < previousPrice) {
      return <TrendingDownIcon color="error" fontSize="small" />;
    }
    return null;
  };

  const getPriceChangeColor = (record: any, index: number) => {
    if (index === 0) return 'default';
    
    const currentPrice = record.price;
    const previousPrice = data?.data[index - 1]?.price;
    
    if (!previousPrice) return 'default';
    
    if (currentPrice > previousPrice) return 'success';
    if (currentPrice < previousPrice) return 'error';
    return 'default';
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Error loading price history: {error.message}
      </Alert>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <HistoryIcon color="disabled" sx={{ fontSize: 48, mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No price history found
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Price History ({totalRecords} records)
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={() => refetch()}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Filters */}
      {showFilters && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Price Type</InputLabel>
                <Select
                  value={query?.priceType || ''}
                  onChange={(e) => handleFilterChange('priceType', e.target.value || undefined)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="MANUAL">Manual</MenuItem>
                  <MenuItem value="EXTERNAL">External</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Price Source</InputLabel>
                <Select
                  value={query?.priceSource || ''}
                  onChange={(e) => handleFilterChange('priceSource', e.target.value || undefined)}
                >
                  <MenuItem value="">All Sources</MenuItem>
                  <MenuItem value="USER_INPUT">User Input</MenuItem>
                  <MenuItem value="EXTERNAL_API">External API</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Start Date"
                type="date"
                value={query?.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="End Date"
                type="date"
                value={query?.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Reason</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.data.map((record, index) => (
              <TableRow key={record.id}>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(record.createdAt)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getPriceChangeIcon(record, index)}
                    <Chip
                      label={formatCurrency(record.price)}
                      color={getPriceChangeColor(record, index) as any}
                      size="small"
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={record.priceType}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={record.priceSource}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {record.changeReason || '-'}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination Controls */}
      {showPagination && (
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
              Showing {data.data.length} of {totalRecords} records
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Page {currentPage} of {totalPages}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Pagination Navigation */}
      {showPagination && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1, mb: 2 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            size="small"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  );
};

export default PriceHistoryTable;
