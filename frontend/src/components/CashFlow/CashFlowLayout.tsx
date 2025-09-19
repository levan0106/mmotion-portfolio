import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Alert,
  Grid,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Fab,
  Tooltip,
  LinearProgress,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Pagination,
  SelectChangeEvent,
} from '@mui/material';
import {
  AccountBalance as DepositIcon,
  AccountBalanceWallet as WithdrawIcon,
  TrendingUp as DividendIcon,
  TrendingUp,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  AccountBalance as BalanceIcon,
  Add as AddIcon,
  Download as DownloadIcon,
  Timeline as TimelineIcon,
  TableChart as TableIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '../../utils/format';
import CashFlowChart from './CashFlowChart';

interface CashFlow {
  cashflowId: string;
  type: string;
  amount: number;
  description: string;
  reference?: string;
  status: string;
  flowDate: string;
  effectiveDate?: string;
  currency?: string;
  createdAt: string;
  updatedAt: string;
}

interface CashFlowLayoutProps {
  portfolioId: string;
  onCashFlowUpdate?: () => void;
}

const CashFlowLayout: React.FC<CashFlowLayoutProps> = ({
  portfolioId,
  onCashFlowUpdate,
}) => {
  const [cashFlows, setCashFlows] = useState<CashFlow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'deposit' | 'withdrawal' | 'dividend' | 'interest' | 'fee' | 'tax' | 'adjustment'>('deposit');
  const [editingCashFlow, setEditingCashFlow] = useState<CashFlow | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cashFlowToDelete, setCashFlowToDelete] = useState<CashFlow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    reference: '',
    effectiveDate: '',
    currency: 'VND',
    flowDate: '',
    status: 'COMPLETED',
  });
  const [tabValue, setTabValue] = useState(0);
  const [filterTypes, setFilterTypes] = useState<string[]>(['ALL']);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Handler để xóa item từ filter
  const handleRemoveFilterType = (valueToRemove: string) => {
    const newTypes = filterTypes.filter(t => t !== valueToRemove);
    if (newTypes.length === 0) {
      setFilterTypes(['ALL']);
    } else {
      setFilterTypes(newTypes);
    }
  };

  // Load cash flow history
  const loadCashFlows = async (page: number = pagination?.page || 1, limit: number = pagination?.limit || 10) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/portfolios/${portfolioId}/cash-flow/history?page=${page}&limit=${limit}`);
      if (!response.ok) throw new Error('Failed to load cash flows');
      const result = await response.json();
      setCashFlows(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cash flows');
    } finally {
      setLoading(false);
    }
  };

  // Pagination handlers
  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    loadCashFlows(page, pagination?.limit || 10);
  };

  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    const newLimit = event.target.value as number;
    loadCashFlows(1, newLimit);
  };

  useEffect(() => {
    loadCashFlows();
  }, [portfolioId]);

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        portfolioId: portfolioId,
        amount: parseFloat(formData.amount),
        type: dialogType.toUpperCase(),
        description: formData.description,
        reference: formData.reference || undefined,
        flowDate: formData.flowDate ? new Date(formData.flowDate).toISOString() : undefined,
        effectiveDate: formData.effectiveDate ? new Date(formData.effectiveDate).toISOString() : undefined,
        currency: formData.currency,
        status: formData.status,
      };

      const isEdit = editingCashFlow !== null;
      const url = isEdit 
        ? `/api/v1/portfolios/${portfolioId}/cash-flow/${editingCashFlow.cashflowId}`
        : `/api/v1/portfolios/${portfolioId}/cash-flow`;
      
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = `Failed to ${isEdit ? 'update' : 'create'} cash flow`;
        
        if (errorData.message) {
          if (Array.isArray(errorData.message)) {
            errorMessage = errorData.message.join(', ');
          } else {
            errorMessage = errorData.message;
          }
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
        
        throw new Error(errorMessage);
      }

      // Reset form with auto-filled flowDate
      resetFormWithAutoFlowDate();
      setDialogOpen(false);
      setEditingCashFlow(null);
      setError(null); // Clear error on success
      
      await loadCashFlows();
      onCashFlowUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${editingCashFlow ? 'update' : 'create'} cash flow`);
    } finally {
      setLoading(false);
    }
  };

  // Get type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return 'success';
      case 'WITHDRAWAL': return 'error';
      case 'DIVIDEND': return 'info';
      case 'INTEREST': return 'warning';
      case 'FEE': return 'error';
      case 'TAX': return 'error';
      case 'TRADE_SETTLEMENT': return 'default';
      case 'BUY_TRADE': return 'error';
      case 'SELL_TRADE': return 'success';
      default: return 'default';
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return <DepositIcon />;
      case 'WITHDRAWAL': return <WithdrawIcon />;
      case 'DIVIDEND': return <DividendIcon />;
      case 'INTEREST': return <TrendingUp />;
      case 'FEE': return <CancelIcon />;
      case 'TAX': return <CancelIcon />;
      case 'ADJUSTMENT': return <BalanceIcon />;
      case 'BUY_TRADE': return <WithdrawIcon />;
      case 'SELL_TRADE': return <DepositIcon />;
      default: return undefined;
    }
  };

  // Calculate summary stats
  const totalDeposits = (cashFlows || [])
    .filter(cf => (cf.type === 'DEPOSIT' || cf.type === 'SELL_TRADE') && cf.status === 'COMPLETED')
    .reduce((sum, cf) => sum + Math.abs(cf.amount), 0);

  const totalWithdrawals = (cashFlows || [])
    .filter(cf => (cf.type === 'WITHDRAWAL' || cf.type === 'BUY_TRADE') && cf.status === 'COMPLETED')
    .reduce((sum, cf) => sum + Math.abs(cf.amount), 0);

  const totalDividends = (cashFlows || [])
    .filter(cf => cf.type === 'DIVIDEND' && cf.status === 'COMPLETED')
    .reduce((sum, cf) => sum + cf.amount, 0);

  const netCashFlow = totalDeposits + totalDividends - totalWithdrawals;

  // Filter cash flows
  const filteredCashFlows = (cashFlows || []).filter(cf => 
    filterTypes.includes('ALL') || filterTypes.includes(cf.type)
  );

  // Calculate total amount for filtered cash flows
  const filteredTotal = filteredCashFlows
    .filter(cf => cf.status === 'COMPLETED')
    .reduce((sum, cf) => {
      const isInflow = ['DEPOSIT', 'DIVIDEND', 'INTEREST', 'SELL_TRADE'].includes(cf.type);
      // For inflows: add positive amount, for outflows: subtract positive amount
      return sum + (isInflow ? Math.abs(cf.amount) : -Math.abs(cf.amount));
    }, 0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Helper function to get current local datetime for form
  const getCurrentLocalDateTime = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  // Helper function to reset form with auto-filled flowDate
  const resetFormWithAutoFlowDate = () => {
    setFormData({
      amount: '',
      description: '',
      reference: '',
      effectiveDate: '',
      currency: 'VND',
      flowDate: getCurrentLocalDateTime(),
      status: 'COMPLETED',
    });
  };

  const handleCreateCashFlow = (type: 'deposit' | 'withdrawal' | 'dividend' | 'interest' | 'fee' | 'tax' | 'adjustment') => {
    setDialogType(type);
    setEditingCashFlow(null);
    resetFormWithAutoFlowDate();
    setDialogOpen(true);
  };

  const handleEditCashFlow = (cashFlow: CashFlow) => {
    // Check if cash flow is cancelled
    if (cashFlow.status === 'CANCELLED') {
      setError('Cannot edit cancelled cash flow');
      return;
    }
    
    setEditingCashFlow(cashFlow);
    setDialogType(cashFlow.type.toLowerCase() as any);
    
    // Format dates for input
    const flowDate = new Date(cashFlow.flowDate);
    const effectiveDate = cashFlow.effectiveDate ? new Date(cashFlow.effectiveDate) : null;
    
    setFormData({
      amount: cashFlow.amount.toString(),
      description: cashFlow.description || '',
      reference: cashFlow.reference || '',
      effectiveDate: effectiveDate ? effectiveDate.toISOString().slice(0, 16) : '',
      currency: cashFlow.currency || 'VND',
      flowDate: flowDate.toISOString().slice(0, 16),
      status: cashFlow.status || 'COMPLETED',
    });
    
    setDialogOpen(true);
  };

  const handleDeleteCashFlow = (cashFlow: CashFlow) => {
    setCashFlowToDelete(cashFlow);
    setDeleteError(null); // Clear previous errors
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!cashFlowToDelete) return;
    
    try {
      setLoading(true);
      setDeleteError(null); // Clear previous errors
      
      const response = await fetch(`/api/v1/portfolios/${portfolioId}/cash-flow/${cashFlowToDelete.cashflowId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = 'Failed to delete cash flow';
        
        if (errorData.message) {
          if (Array.isArray(errorData.message)) {
            errorMessage = errorData.message.join(', ');
          } else {
            errorMessage = errorData.message;
          }
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
        
        throw new Error(errorMessage);
      }

      await loadCashFlows();
      setDeleteDialogOpen(false);
      setCashFlowToDelete(null);
      setDeleteError(null); // Clear error on success
      onCashFlowUpdate?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete cash flow';
      setDeleteError(errorMessage);
      console.error('Delete cash flow error:', err);
    } finally {
      setLoading(false);
    }
  };

  // CSV Export functions
  const generateCSV = (data: CashFlow[]) => {
    const headers = ['Date', 'Type', 'Amount', 'Currency', 'Description', 'Reference', 'Status'];
    const csvRows = [headers.join(',')];
    
    data.forEach(cf => {
      const row = [
        formatDate(cf.flowDate),
        cf.type.replace('_', ' '),
        cf.amount,
        'VND',
        `"${cf.description.replace(/"/g, '""')}"`,
        cf.reference || '',
        cf.status
      ];
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" fontWeight="bold" color="primary">
            Cash Flow Management
          </Typography>
          <Box display="flex" gap={1}>
            <Tooltip title="Refresh Data">
              <IconButton onClick={() => loadCashFlows()} disabled={loading} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleCreateCashFlow('deposit')}
              sx={{ borderRadius: 2 }}
            >
              Add Transaction
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="white" variant="body2" gutterBottom>
                    Total Inflows
                  </Typography>
                  <Typography variant="h5" color="white" fontWeight="bold">
                    {formatCurrency(totalDeposits + totalDividends)}
                  </Typography>
                </Box>
                <DepositIcon sx={{ color: 'white', fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="white" variant="body2" gutterBottom>
                    Total Outflows
                  </Typography>
                  <Typography variant="h5" color="white" fontWeight="bold">
                    {formatCurrency(totalWithdrawals)}
                  </Typography>
                </Box>
                <WithdrawIcon sx={{ color: 'white', fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="white" variant="body2" gutterBottom>
                    Net Cash Flow
                  </Typography>
                  <Typography 
                    variant="h5" 
                    color="white" 
                    fontWeight="bold"
                    sx={{ color: netCashFlow >= 0 ? 'white' : '#ffcdd2' }}
                  >
                    {formatCurrency(netCashFlow)}
                  </Typography>
                </Box>
                <BalanceIcon sx={{ color: 'white', fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="white" variant="body2" gutterBottom>
                    Total Transactions
                  </Typography>
                  <Typography variant="h5" color="white" fontWeight="bold">
                    {cashFlows?.length || 0}
                  </Typography>
                </Box>
                <TimelineIcon sx={{ color: 'white', fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="cash flow tabs">
            <Tab 
              icon={<TimelineIcon />} 
              label="Analytics" 
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
            <Tab 
              icon={<TableIcon />} 
              label="Transaction History" 
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
          </Tabs>
        </Box>

        <CardContent>
          {/* Analytics Tab */}
          {tabValue === 0 && (
            <Box>
              <CashFlowChart portfolioId={portfolioId} />
            </Box>
          )}

          {/* Transaction History Tab */}
          {tabValue === 1 && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight="600">
                  Transaction History
                </Typography>
                <Box display="flex" gap={2} alignItems="center">
                  <FormControl size="small" sx={{ minWidth: 200, maxWidth: 400 }}>
                    <InputLabel>Filter by Type</InputLabel>
                    <Select
                      multiple
                      value={filterTypes}
                      label="Filter by Type"
                      onChange={(e) => {
                        const value = e.target.value as string[];
                        
                        // If ALL is being selected, clear everything else
                        if (value.includes('ALL') && value.length === 1) {
                          setFilterTypes(['ALL']);
                        } 
                        // If nothing is selected, default to ALL
                        else if (value.length === 0) {
                          setFilterTypes(['ALL']);
                        }
                        // Normal selection - allow switching from ALL to specific types
                        else {
                          setFilterTypes(value);
                        }
                      }}
                      input={<OutlinedInput label="Filter by Type" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxHeight: 60, overflow: 'auto' }}>
                          {selected.map((value) => (
                            <Chip 
                              key={value} 
                              label={value} 
                              size="small"
                              onDelete={value === 'ALL' ? undefined : () => handleRemoveFilterType(value)}
                              onClick={(event) => {
                                if (value !== 'ALL') {
                                  event.stopPropagation();
                                }
                              }}
                            />
                          ))}
                        </Box>
                      )}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 300,
                            width: 250,
                          },
                        },
                      }}
                    >
                      <MenuItem value="ALL">
                        <Checkbox checked={filterTypes.includes('ALL')} />
                        <ListItemText primary="All Types" />
                      </MenuItem>
                      <MenuItem value="DEPOSIT">
                        <Checkbox checked={filterTypes.includes('DEPOSIT')} />
                        <ListItemText primary="Deposits" />
                      </MenuItem>
                      <MenuItem value="WITHDRAWAL">
                        <Checkbox checked={filterTypes.includes('WITHDRAWAL')} />
                        <ListItemText primary="Withdrawals" />
                      </MenuItem>
                      <MenuItem value="DIVIDEND">
                        <Checkbox checked={filterTypes.includes('DIVIDEND')} />
                        <ListItemText primary="Dividends" />
                      </MenuItem>
                      <MenuItem value="INTEREST">
                        <Checkbox checked={filterTypes.includes('INTEREST')} />
                        <ListItemText primary="Interest" />
                      </MenuItem>
                      <MenuItem value="FEE">
                        <Checkbox checked={filterTypes.includes('FEE')} />
                        <ListItemText primary="Fees" />
                      </MenuItem>
                      <MenuItem value="TAX">
                        <Checkbox checked={filterTypes.includes('TAX')} />
                        <ListItemText primary="Taxes" />
                      </MenuItem>
                      <MenuItem value="ADJUSTMENT">
                        <Checkbox checked={filterTypes.includes('ADJUSTMENT')} />
                        <ListItemText primary="Adjustments" />
                      </MenuItem>
                      <MenuItem value="BUY_TRADE">
                        <Checkbox checked={filterTypes.includes('BUY_TRADE')} />
                        <ListItemText primary="Buy Trades" />
                      </MenuItem>
                      <MenuItem value="SELL_TRADE">
                        <Checkbox checked={filterTypes.includes('SELL_TRADE')} />
                        <ListItemText primary="Sell Trades" />
                      </MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setFilterTypes(['ALL'])}
                    disabled={filterTypes.includes('ALL')}
                  >
                    All
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setFilterTypes(['DEPOSIT', 'WITHDRAWAL', 'DIVIDEND', 'INTEREST', 'FEE', 'TAX', 'ADJUSTMENT', 'BUY_TRADE', 'SELL_TRADE'])}
                    disabled={filterTypes.length === 9 && !filterTypes.includes('ALL')}
                  >
                    Reset
                  </Button>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Total:
                    </Typography>
                    <Typography 
                      variant="h6" 
                      color={filteredTotal >= 0 ? 'success.main' : 'error.main'}
                      sx={{ fontWeight: 'bold' }}
                    >
                      {formatCurrency(Math.abs(filteredTotal), 'VND')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ({filteredCashFlows.length} items)
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    size="small"
                    onClick={() => {
                      const csvContent = generateCSV(filteredCashFlows);
                      downloadCSV(csvContent, `cash-flow-${portfolioId}-${new Date().toISOString().split('T')[0]}.csv`);
                    }}
                  >
                    Export CSV
                  </Button>
                </Box>
              </Box>

              {loading ? (
                <Box sx={{ width: '100%', mb: 2 }}>
                  <LinearProgress />
                </Box>
              ) : (
                <>
                  <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'grey.50' }}>
                        <TableCell><strong>Type</strong></TableCell>
                        <TableCell><strong>Amount</strong></TableCell>
                        <TableCell><strong>Description</strong></TableCell>
                        <TableCell><strong>Reference</strong></TableCell>
                        <TableCell><strong>Date</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredCashFlows.map((cashFlow) => (
                        <TableRow key={cashFlow.cashflowId} hover>
                          <TableCell>
                            <Chip
                              {...(getTypeIcon(cashFlow.type) && { icon: getTypeIcon(cashFlow.type) })}
                              label={cashFlow.type.replace('_', ' ')}
                              color={getTypeColor(cashFlow.type) as any}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography
                              color={cashFlow.type === 'DEPOSIT' || cashFlow.type === 'SELL_TRADE' ? 'success.main' : 'error.main'}
                              fontWeight="bold"
                            >
                              {formatCurrency(cashFlow.amount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                              {cashFlow.description}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {cashFlow.reference || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(cashFlow.flowDate)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={cashFlow.status}
                              color={
                                cashFlow.status === 'COMPLETED' ? 'success' :
                                cashFlow.status === 'PENDING' ? 'warning' :
                                cashFlow.status === 'CANCELLED' ? 'error' : 'default'
                              }
                              size="small"
                              variant="filled"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title={cashFlow.status === 'CANCELLED' ? 'Cannot edit cancelled cash flow' : 'Edit'}>
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEditCashFlow(cashFlow)}
                                    color="primary"
                                    disabled={cashFlow.status === 'CANCELLED'}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteCashFlow(cashFlow)}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {/* Pagination */}
                {pagination?.totalPages && pagination.totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, px: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
                      </Typography>
                      <FormControl size="small" sx={{ minWidth: 80 }}>
                        <InputLabel>Per page</InputLabel>
                        <Select
                          value={pagination.limit}
                          onChange={handlePageSizeChange}
                          label="Per page"
                        >
                          <MenuItem value={5}>5</MenuItem>
                          <MenuItem value={10}>10</MenuItem>
                          <MenuItem value={25}>25</MenuItem>
                          <MenuItem value={50}>50</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    <Pagination
                      count={pagination.totalPages}
                      page={pagination.page}
                      onChange={handlePageChange}
                      color="primary"
                      showFirstButton
                      showLastButton
                    />
                  </Box>
                )}
                </>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Quick Action FABs */}
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Tooltip title="Add Deposit">
          <Fab
            color="success"
            size="medium"
            onClick={() => handleCreateCashFlow('deposit')}
            sx={{ boxShadow: 3 }}
          >
            <DepositIcon />
          </Fab>
        </Tooltip>
        <Tooltip title="Add Withdrawal">
          <Fab
            color="error"
            size="medium"
            onClick={() => handleCreateCashFlow('withdrawal')}
            sx={{ boxShadow: 3 }}
          >
            <WithdrawIcon />
          </Fab>
        </Tooltip>
        <Tooltip title="Add Dividend">
          <Fab
            color="info"
            size="medium"
            onClick={() => handleCreateCashFlow('dividend')}
            sx={{ boxShadow: 3 }}
          >
            <DividendIcon />
          </Fab>
        </Tooltip>
        <Tooltip title="Add Interest">
          <Fab
            color="warning"
            size="medium"
            onClick={() => handleCreateCashFlow('interest')}
            sx={{ boxShadow: 3 }}
          >
            <TrendingUp />
          </Fab>
        </Tooltip>
        <Tooltip title="Add Fee">
          <Fab
            color="secondary"
            size="medium"
            onClick={() => handleCreateCashFlow('fee')}
            sx={{ boxShadow: 3 }}
          >
            <CancelIcon />
          </Fab>
        </Tooltip>
      </Box>

      {/* Cash Flow Dialog */}
      <Dialog open={dialogOpen} onClose={() => {
        resetFormWithAutoFlowDate();
        setDialogOpen(false);
        setError(null);
      }} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {editingCashFlow ? (
              <>
                <EditIcon color="primary" />
                <Box>
                  <Typography variant="h6">Edit Cash Flow</Typography>
                  <Typography variant="body2" color="text.secondary">
                    ID: {editingCashFlow.cashflowId?.slice(0, 8)}...
                  </Typography>
                </Box>
              </>
            ) : (
              <>
                <AddIcon color="primary" />
                <Box>
                  <Typography variant="h6">Create {dialogType.charAt(0).toUpperCase() + dialogType.slice(1)} Cash Flow</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add a new cash flow transaction
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {editingCashFlow && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Editing:</strong> {editingCashFlow.description}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Original Amount: {formatCurrency(editingCashFlow.amount)} | 
                  Type: {editingCashFlow.type} | 
                  Status: {editingCashFlow.status}
                </Typography>
              </Alert>
            )}
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Error:</strong> {error}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Please check your input and try again.
                </Typography>
              </Alert>
            )}
            
            <Grid container spacing={2}>
              {/* Left Column */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, amount: value });
                  }}
                  margin="normal"
                  required
                  placeholder="0"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {formData.currency}
                      </InputAdornment>
                    ),
                  }}
                  helperText={
                    editingCashFlow 
                      ? `Original: ${formatCurrency(editingCashFlow.amount)} | New: ${formData.amount ? formatCurrency(parseFloat(formData.amount) || 0, formData.currency) : 'Enter amount'}`
                      : formData.amount ? formatCurrency(parseFloat(formData.amount) || 0, formData.currency) : 'Enter amount'
                  }
                  error={!!(formData.amount && (parseFloat(formData.amount) <= 0 || isNaN(parseFloat(formData.amount))))}
                />
                
                <FormControl fullWidth margin="normal">
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={formData.currency}
                    label="Currency"
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  >
                    <MenuItem value="VND">VND</MenuItem>
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="EUR">EUR</MenuItem>
                    <MenuItem value="GBP">GBP</MenuItem>
                    <MenuItem value="JPY">JPY</MenuItem>
                  </Select>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Select the currency for this transaction
                  </Typography>
                </FormControl>
                
                <FormControl fullWidth margin="normal">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <MenuItem value="COMPLETED">Completed</MenuItem>
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                  </Select>
                  {editingCashFlow && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Original Status: {editingCashFlow.status}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              
              {/* Right Column */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Flow Date"
                  type="datetime-local"
                  value={formData.flowDate}
                  onChange={(e) => setFormData({ ...formData, flowDate: e.target.value })}
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                  helperText="When this transaction occurred"
                />
                
                <TextField
                  fullWidth
                  label="Effective Date (Optional)"
                  type="datetime-local"
                  value={formData.effectiveDate}
                  onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                  helperText="When this transaction takes effect"
                />
                
                <TextField
                  fullWidth
                  label="Reference (Optional)"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  margin="normal"
                  helperText="External reference number or ID (optional)"
                />
              </Grid>
              
              {/* Full Width Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  margin="normal"
                  required
                  multiline
                  rows={3}
                  helperText={
                    editingCashFlow 
                      ? `Original: "${editingCashFlow.description}"`
                      : 'Enter a description for this cash flow'
                  }
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            resetFormWithAutoFlowDate();
            setDialogOpen(false);
            setError(null);
          }}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !formData.amount || !formData.description || parseFloat(formData.amount) <= 0 || isNaN(parseFloat(formData.amount))}
            startIcon={editingCashFlow ? <EditIcon /> : <AddIcon />}
          >
            {loading ? (editingCashFlow ? 'Updating Cash Flow...' : 'Creating Cash Flow...') : (editingCashFlow ? 'Update Cash Flow' : 'Create Cash Flow')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => {
        setDeleteDialogOpen(false);
        setDeleteError(null);
      }}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon color="error" />
            <Typography variant="h6">Delete Cash Flow</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this cash flow? This action cannot be undone.
          </Typography>
          
          {cashFlowToDelete?.status === 'CANCELLED' && (
            <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
              <Typography variant="body2">
                <strong>Warning:</strong> This cash flow is already cancelled and cannot be edited.
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                You can still delete it to remove it from the history.
              </Typography>
            </Alert>
          )}
          
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              <Typography variant="body2">
                <strong>Error:</strong> {deleteError}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Please try again or contact support if the problem persists.
              </Typography>
            </Alert>
          )}
          
          {cashFlowToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Type:</strong> {cashFlowToDelete.type}
              </Typography>
              <Typography variant="body2">
                <strong>Amount:</strong> {formatCurrency(cashFlowToDelete.amount, cashFlowToDelete.currency)}
              </Typography>
              <Typography variant="body2">
                <strong>Description:</strong> {cashFlowToDelete.description}
              </Typography>
              <Typography variant="body2">
                <strong>Status:</strong> {cashFlowToDelete.status}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDeleteDialogOpen(false);
            setDeleteError(null);
          }}>Cancel</Button>
          <Button 
            onClick={confirmDelete} 
            color="error" 
            variant="contained"
            disabled={loading}
            startIcon={loading ? null : <DeleteIcon />}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CashFlowLayout;
