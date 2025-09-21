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
} from '@mui/material';
import {
  AccountBalance as DepositIcon,
  AccountBalanceWallet as WithdrawIcon,
  TrendingUp as DividendIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '../../utils/format';

interface CashFlow {
  cashFlowId: string;
  type: string;
  amount: number;
  description: string;
  reference?: string;
  status: string;
  flowDate: string;
  effectiveDate?: string;
  fundingSource?: string;
}

interface CashFlowManagementProps {
  portfolioId: string;
  onCashFlowUpdate?: () => void;
}

const CashFlowManagement: React.FC<CashFlowManagementProps> = ({
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
    fundingSource: '',
  });

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
        fundingSource: formData.fundingSource || undefined,
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

      // Reset form and close dialog
      setFormData({ amount: '', description: '', reference: '', effectiveDate: '', fundingSource: '' });
      setDialogOpen(false);
      
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
      const response = await fetch(`/api/v1/portfolios/${portfolioId}/cash-flow/${cashFlowId}/cancel`, {
        method: 'PUT',
      });

      if (!response.ok) throw new Error('Failed to cancel cash flow');

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
      default: return 'default';
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return <DepositIcon />;
      case 'WITHDRAWAL': return <WithdrawIcon />;
      case 'DIVIDEND': return <DividendIcon />;
      default: return undefined;
    }
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Cash Flow Management</Typography>
            <Box>
              <Button
                variant="contained"
                color="success"
                startIcon={<DepositIcon />}
                onClick={() => {
                  setDialogType('deposit');
                  setDialogOpen(true);
                }}
                sx={{ mr: 1 }}
              >
                Deposit
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<WithdrawIcon />}
                onClick={() => {
                  setDialogType('withdrawal');
                  setDialogOpen(true);
                }}
                sx={{ mr: 1 }}
              >
                Withdraw
              </Button>
              <Button
                variant="contained"
                color="info"
                startIcon={<DividendIcon />}
                onClick={() => {
                  setDialogType('dividend');
                  setDialogOpen(true);
                }}
              >
                Dividend
              </Button>
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
                {cashFlows.map((cashFlow) => (
                  <TableRow key={cashFlow.cashFlowId}>
                    <TableCell>
                      <Chip
                        {...(getTypeIcon(cashFlow.type) && { icon: getTypeIcon(cashFlow.type) })}
                        label={cashFlow.type}
                        color={getTypeColor(cashFlow.type) as any}
                        size="small"
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
                          onClick={() => handleCancelCashFlow(cashFlow.cashFlowId)}
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

export default CashFlowManagement;
