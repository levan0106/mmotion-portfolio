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
} from '@mui/material';
import {
  AccountBalance as DepositIcon,
  AccountBalanceWallet as WithdrawIcon,
  TrendingUp as DividendIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  AccountBalance as BalanceIcon,
  Add as AddIcon,
  Download as DownloadIcon,
  Timeline as TimelineIcon,
  TableChart as TableIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
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
  const [dialogType, setDialogType] = useState<'deposit' | 'withdrawal' | 'dividend'>('deposit');
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    reference: '',
    effectiveDate: '',
  });
  const [tabValue, setTabValue] = useState(0);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie'>('line');

  // Load cash flow history
  const loadCashFlows = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/portfolios/${portfolioId}/cash-flow/history`);
      if (!response.ok) throw new Error('Failed to load cash flows');
      const data = await response.json();
      setCashFlows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cash flows');
    } finally {
      setLoading(false);
    }
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
        amount: parseFloat(formData.amount),
        description: formData.description,
        reference: formData.reference || undefined,
        effectiveDate: formData.effectiveDate ? new Date(formData.effectiveDate) : undefined,
      };

      const response = await fetch(`/api/v1/portfolios/${portfolioId}/cash-flow/${dialogType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create cash flow');
      }

      setFormData({ amount: '', description: '', reference: '', effectiveDate: '' });
      setDialogOpen(false);
      
      await loadCashFlows();
      onCashFlowUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create cash flow');
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
      case 'BUY_TRADE': return <WithdrawIcon />;
      case 'SELL_TRADE': return <DepositIcon />;
      default: return undefined;
    }
  };

  // Calculate summary stats
  const totalDeposits = cashFlows
    .filter(cf => (cf.type === 'DEPOSIT' || cf.type === 'SELL_TRADE') && cf.status === 'COMPLETED')
    .reduce((sum, cf) => sum + Math.abs(cf.amount), 0);

  const totalWithdrawals = cashFlows
    .filter(cf => (cf.type === 'WITHDRAWAL' || cf.type === 'BUY_TRADE') && cf.status === 'COMPLETED')
    .reduce((sum, cf) => sum + Math.abs(cf.amount), 0);

  const totalDividends = cashFlows
    .filter(cf => cf.type === 'DIVIDEND' && cf.status === 'COMPLETED')
    .reduce((sum, cf) => sum + cf.amount, 0);

  const netCashFlow = totalDeposits + totalDividends - totalWithdrawals;

  // Filter cash flows
  const filteredCashFlows = cashFlows.filter(cf => 
    filterType === 'ALL' || cf.type === filterType
  );

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateCashFlow = (type: 'deposit' | 'withdrawal' | 'dividend') => {
    setDialogType(type);
    setDialogOpen(true);
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
              <IconButton onClick={loadCashFlows} disabled={loading} color="primary">
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
                    {cashFlows.length}
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
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight="600">
                  Cash Flow Analytics
                </Typography>
                <Box display="flex" gap={2}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Chart Type</InputLabel>
                    <Select
                      value={chartType}
                      label="Chart Type"
                      onChange={(e) => setChartType(e.target.value as any)}
                    >
                      <MenuItem value="line">
                        <Box display="flex" alignItems="center" gap={1}>
                          <TimelineIcon fontSize="small" />
                          Line Chart
                        </Box>
                      </MenuItem>
                      <MenuItem value="bar">
                        <Box display="flex" alignItems="center" gap={1}>
                          <BarChartIcon fontSize="small" />
                          Bar Chart
                        </Box>
                      </MenuItem>
                      <MenuItem value="pie">
                        <Box display="flex" alignItems="center" gap={1}>
                          <PieChartIcon fontSize="small" />
                          Pie Chart
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

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
                <Box display="flex" gap={2}>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Filter by Type</InputLabel>
                    <Select
                      value={filterType}
                      label="Filter by Type"
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <MenuItem value="ALL">All Types</MenuItem>
                      <MenuItem value="DEPOSIT">Deposits</MenuItem>
                      <MenuItem value="WITHDRAWAL">Withdrawals</MenuItem>
                      <MenuItem value="DIVIDEND">Dividends</MenuItem>
                      <MenuItem value="BUY_TRADE">Buy Trades</MenuItem>
                      <MenuItem value="SELL_TRADE">Sell Trades</MenuItem>
                    </Select>
                  </FormControl>
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
                              color={cashFlow.status === 'COMPLETED' ? 'success' : 'default'}
                              size="small"
                              variant="filled"
                            />
                          </TableCell>
                          <TableCell>
                            {cashFlow.status === 'COMPLETED' && (
                              <Tooltip title="Cancel Transaction">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to cancel this transaction?')) {
                                      // Handle cancel logic
                                    }
                                  }}
                                >
                                  <CancelIcon />
                                </IconButton>
                              </Tooltip>
                            )}
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
      </Box>

      {/* Cash Flow Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'deposit' && 'Create Deposit'}
          {dialogType === 'withdrawal' && 'Create Withdrawal'}
          {dialogType === 'dividend' && 'Create Dividend'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              margin="normal"
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">₫</InputAdornment>,
              }}
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              required
              multiline
              rows={2}
            />
            <TextField
              fullWidth
              label="Reference (Optional)"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Effective Date (Optional)"
              type="datetime-local"
              value={formData.effectiveDate}
              onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !formData.amount || !formData.description}
          >
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CashFlowLayout;
