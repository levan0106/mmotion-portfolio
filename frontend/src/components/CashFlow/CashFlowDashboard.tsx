import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { useAccount } from '../../contexts/AccountContext';
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
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import {
  AccountBalance as DepositIcon,
  AccountBalanceWallet as WithdrawIcon,
  TrendingUp as DividendIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as BalanceIcon,
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
  fundingSource?: string;
  createdAt: string;
  updatedAt: string;
}

interface CashFlowDashboardProps {
  portfolioId: string;
  onCashFlowUpdate?: () => void;
}

const CashFlowDashboard: React.FC<CashFlowDashboardProps> = ({
  portfolioId,
  onCashFlowUpdate,
}) => {
  const { accountId } = useAccount();
  const [cashFlows, setCashFlows] = useState<CashFlow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'deposit' | 'withdrawal' | 'dividend'>('deposit');
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    reference: '',
    fundingSource: '',
  });
  // const [tabValue, setTabValue] = useState(0); // Unused variable
  const [filterType, setFilterType] = useState<string>('ALL');
  const [speedDialOpen, setSpeedDialOpen] = useState(false);

  // Load cash flow history
  const loadCashFlows = async () => {
    try {
      setLoading(true);
      const data = await apiService.getPortfolioCashFlowHistory(portfolioId, accountId);
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
        fundingSource: formData.fundingSource || undefined,
      };

      await apiService.createCashFlow(portfolioId, accountId, dialogType, payload);

      // Reset form and close dialog
      setFormData({ amount: '', description: '', reference: '', fundingSource: '' });
      setDialogOpen(false);
      setSpeedDialOpen(false);
      
      // Reload data
      await loadCashFlows();
      onCashFlowUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create cash flow');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel cash flow
  const handleCancelCashFlow = async (cashFlowId: string) => {
    if (!window.confirm('Are you sure you want to cancel this cash flow?')) return;

    try {
      setLoading(true);
      await apiService.cancelCashFlow(portfolioId, accountId, cashFlowId);

      await loadCashFlows();
      onCashFlowUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel cash flow');
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

  const getTypeDescription = (type: string) => {
    switch (type) {
      case 'deposit': return 'Add money to your portfolio';
      case 'withdrawal': return 'Remove money from your portfolio';
      case 'dividend': return 'Record dividend income received';
      case 'interest': return 'Record interest income earned';
      case 'fee': return 'Record fees or charges';
      case 'tax': return 'Record tax payments';
      case 'adjustment': return 'Record balance adjustments';
      case 'buy_trade': return 'Record money spent on buying assets';
      case 'sell_trade': return 'Record money received from selling assets';
      default: return 'Add a new cash flow transaction';
    }
  };

  const formatTypeName = (type: string) => {
    return type.replace(/_/g, ' ');
  };

  const isCashFlowIn = (type: string) => {
    return ['DEPOSIT', 'DIVIDEND', 'INTEREST', 'SELL_TRADE'].includes(type);
  };

  const getCashFlowDirection = (type: string) => {
    return isCashFlowIn(type) ? 'IN' : 'OUT';
  };

  const getCashFlowDirectionColor = (type: string) => {
    return isCashFlowIn(type) ? 'success' : 'error';
  };

  const getCashFlowDirectionIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return <DepositIcon />;
      case 'WITHDRAWAL': return <WithdrawIcon />;
      case 'DIVIDEND': return <DividendIcon />;
      case 'INTEREST': return <TrendingUpIcon />;
      case 'FEE': return <CancelIcon />;
      case 'TAX': return <CancelIcon />;
      case 'ADJUSTMENT': return <BalanceIcon />;
      case 'BUY_TRADE': return <WithdrawIcon />;
      case 'SELL_TRADE': return <DepositIcon />;
      default: return isCashFlowIn(type) ? <TrendingUpIcon /> : <TrendingDownIcon />;
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

  const speedDialActions = [
    {
      icon: <DepositIcon />,
      name: 'Deposit',
      onClick: () => {
        setDialogType('deposit');
        setDialogOpen(true);
      },
    },
    {
      icon: <WithdrawIcon />,
      name: 'Withdraw',
      onClick: () => {
        setDialogType('withdrawal');
        setDialogOpen(true);
      },
    },
    {
      icon: <DividendIcon />,
      name: 'Dividend',
      onClick: () => {
        setDialogType('dividend');
        setDialogOpen(true);
      },
    },
  ];

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Deposits
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {formatCurrency(totalDeposits)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingDownIcon color="error" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Withdrawals
                  </Typography>
                  <Typography variant="h6" color="error.main">
                    {formatCurrency(totalWithdrawals)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <DividendIcon color="info" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Dividends
                  </Typography>
                  <Typography variant="h6" color="info.main">
                    {formatCurrency(totalDividends)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <BalanceIcon color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Net Cash Flow
                  </Typography>
                  <Typography 
                    variant="h6" 
                    color={netCashFlow >= 0 ? 'success.main' : 'error.main'}
                  >
                    {formatCurrency(netCashFlow)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Cash Flow Chart */}
      <CashFlowChart portfolioId={portfolioId} />

      {/* Main Content */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Cash Flow Management</Typography>
            <Box display="flex" gap={1}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Filter</InputLabel>
                <Select
                  value={filterType}
                  label="Filter"
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <MenuItem value="ALL">All Types</MenuItem>
                  <MenuItem value="DEPOSIT">Deposits</MenuItem>
                  <MenuItem value="WITHDRAWAL">Withdrawals</MenuItem>
                  <MenuItem value="DIVIDEND">Dividends</MenuItem>
                  <MenuItem value="INTEREST">Interest</MenuItem>
                  <MenuItem value="FEE">Fees</MenuItem>
                  <MenuItem value="TAX">Taxes</MenuItem>
                  <MenuItem value="BUY_TRADE">Buy Trades</MenuItem>
                  <MenuItem value="SELL_TRADE">Sell Trades</MenuItem>
                  <MenuItem value="TRADE_SETTLEMENT">Trade Settlements</MenuItem>
                </Select>
              </FormControl>
              <IconButton onClick={loadCashFlows} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell>Funding Source</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCashFlows.map((cashFlow) => (
                  <TableRow key={cashFlow.cashflowId}>
                    <TableCell>
                      <Chip
                        {...(getTypeIcon(cashFlow.type) && { icon: getTypeIcon(cashFlow.type) })}
                        label={formatTypeName(cashFlow.type)}
                        color={getTypeColor(cashFlow.type) as any}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        color={cashFlow.type === 'DEPOSIT' || cashFlow.type === 'DIVIDEND' ? 'success.main' : 'error.main'}
                        fontWeight="bold"
                      >
                        {formatCurrency(cashFlow.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>{cashFlow.description}</TableCell>
                    <TableCell>{cashFlow.reference || '-'}</TableCell>
                    <TableCell>{cashFlow.fundingSource || '-'}</TableCell>
                    <TableCell>{formatDate(cashFlow.flowDate)}</TableCell>
                    <TableCell>
                      <Chip
                        label={cashFlow.status}
                        color={cashFlow.status === 'COMPLETED' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {cashFlow.status === 'COMPLETED' && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleCancelCashFlow(cashFlow.cashflowId)}
                        >
                          <CancelIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Speed Dial for Quick Actions */}
      <SpeedDial
        ariaLabel="Cash flow actions"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
        onClose={() => setSpeedDialOpen(false)}
        onOpen={() => setSpeedDialOpen(true)}
        open={speedDialOpen}
      >
        {speedDialActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={action.onClick}
          />
        ))}
      </SpeedDial>

      {/* Cash Flow Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getTypeIcon(dialogType.toUpperCase())}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="h6" color={getTypeColor(dialogType.toUpperCase())}>
                  Create {dialogType.charAt(0).toUpperCase() + dialogType.slice(1)}
                </Typography>
                <Chip
                  icon={getCashFlowDirectionIcon(dialogType.toUpperCase())}
                  label={`${formatTypeName(dialogType.toUpperCase())} - ${getCashFlowDirection(dialogType.toUpperCase())}`}
                  color={getCashFlowDirectionColor(dialogType.toUpperCase()) as any}
                  size="small"
                  variant="filled"
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {getTypeDescription(dialogType)}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {/* Cash Flow Type Indicator */}
            <Alert 
              severity={getCashFlowDirectionColor(dialogType.toUpperCase()) === 'success' ? 'success' : 'error'}
              sx={{ 
                mb: 2, 
                borderLeft: `4px solid ${getCashFlowDirectionColor(dialogType.toUpperCase()) === 'success' ? '#4caf50' : '#f44336'}`,
                backgroundColor: getCashFlowDirectionColor(dialogType.toUpperCase()) === 'success' ? '#e8f5e8' : '#ffebee'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getTypeIcon(dialogType.toUpperCase())}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="body2" fontWeight="bold">
                      {dialogType.charAt(0).toUpperCase() + dialogType.slice(1)} Transaction
                    </Typography>
                    <Chip
                      icon={getCashFlowDirectionIcon(dialogType.toUpperCase())}
                      label={`${formatTypeName(dialogType.toUpperCase())} - ${getCashFlowDirection(dialogType.toUpperCase())}`}
                      color={getCashFlowDirectionColor(dialogType.toUpperCase()) as any}
                      size="small"
                      variant="filled"
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {getTypeDescription(dialogType)}
                  </Typography>
                </Box>
              </Box>
            </Alert>
            
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
              label="Funding Source (Optional)"
              value={formData.fundingSource}
              onChange={(e) => setFormData({ ...formData, fundingSource: e.target.value.toUpperCase() })}
              margin="normal"
              placeholder="e.g., VIETCOMBANK, BANK_ACCOUNT_001"
              inputProps={{
                style: { textTransform: 'uppercase' }
              }}
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Reference (Optional)"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              margin="normal"
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

export default CashFlowDashboard;
