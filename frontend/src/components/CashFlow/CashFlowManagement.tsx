import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { apiService } from '../../services/api';
import { useAccount } from '../../contexts/AccountContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
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
import { ResponsiveButton } from '../Common';
import { formatCurrency, formatDate } from '../../utils/format';

interface CashFlow {
  cashFlowId: string;
  type: string;
  amount: number;
  description: string;
  reference?: string;
  status: string;
  flowDate: string;
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
  const { t } = useTranslation();
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

  // Load cash flow history
  const loadCashFlows = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPortfolioCashFlowHistory(portfolioId, accountId);
      setCashFlows(response);
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
      
      // Reload data
      await loadCashFlows();
      onCashFlowUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('cashflow.error.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel cash flow
  const handleCancelCashFlow = async (cashFlowId: string) => {
    if (!window.confirm(t('cashflow.delete.confirm'))) return;

    try {
      setLoading(true);
      await apiService.cancelCashFlow(portfolioId, accountId, cashFlowId);

      await loadCashFlows();
      onCashFlowUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('cashflow.error.cancelFailed'));
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
            <Typography variant="h4" fontWeight="bold">{t('cashflow.management.title')}</Typography>
            <Box>
              <ResponsiveButton
                variant="contained"
                color="success"
                icon={<DepositIcon />}
                onClick={() => {
                  setDialogType('deposit');
                  setDialogOpen(true);
                }}
                mobileText={t('cashflow.deposit')}
                desktopText={t('cashflow.deposit')}
                sx={{ mr: 1 }}
              >
                {t('cashflow.deposit')}
              </ResponsiveButton>
              <ResponsiveButton
                variant="contained"
                color="error"
                icon={<WithdrawIcon />}
                onClick={() => {
                  setDialogType('withdrawal');
                  setDialogOpen(true);
                }}
                mobileText={t('cashflow.withdraw')}
                desktopText={t('cashflow.withdraw')}
                sx={{ mr: 1 }}
              >
                {t('cashflow.withdraw')}
              </ResponsiveButton>
              <ResponsiveButton
                variant="contained"
                color="info"
                icon={<DividendIcon />}
                onClick={() => {
                  setDialogType('dividend');
                  setDialogOpen(true);
                }}
                mobileText={t('cashflow.dividend')}
                desktopText={t('cashflow.dividend')}
              >
                {t('cashflow.dividend')}
              </ResponsiveButton>
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
                  <TableCell>{t('cashflow.table.type')}</TableCell>
                  <TableCell>{t('cashflow.table.amount')}</TableCell>
                  <TableCell>{t('cashflow.table.description')}</TableCell>
                  <TableCell>{t('cashflow.table.reference')}</TableCell>
                  <TableCell>{t('cashflow.table.fundingSource')}</TableCell>
                  <TableCell>{t('cashflow.table.date')}</TableCell>
                  <TableCell>{t('cashflow.table.status')}</TableCell>
                  <TableCell>{t('cashflow.table.actions')}</TableCell>
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
          {dialogType === 'deposit' && t('cashflow.modal.createDeposit')}
          {dialogType === 'withdrawal' && t('cashflow.modal.createWithdrawal')}
          {dialogType === 'dividend' && t('cashflow.modal.createDividend')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label={t('cashflow.form.amount')}
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label={t('cashflow.form.descriptionOptional')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label={t('cashflow.form.referenceOptional')}
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label={t('cashflow.form.fundingSourceOptional')}
              value={formData.fundingSource}
              onChange={(e) => setFormData({ ...formData, fundingSource: e.target.value.toUpperCase() })}
              margin="normal"
              placeholder={t('cashflow.form.fundingSourcePlaceholder')}
              inputProps={{
                style: { textTransform: 'uppercase' }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <ResponsiveButton onClick={() => setDialogOpen(false)} mobileText={t('common.cancel')} desktopText={t('common.cancel')}>
            {t('common.cancel')}
          </ResponsiveButton>
          <ResponsiveButton
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !formData.amount || !formData.description}
            mobileText={loading ? t('cashflow.modal.creating') : t('common.create')}
            desktopText={loading ? t('cashflow.modal.creating') : t('common.create')}
          >
            {loading ? t('cashflow.modal.creating') : t('common.create')}
          </ResponsiveButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CashFlowManagement;
