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
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  LinearProgress,
  Pagination,
  SelectChangeEvent,
  OutlinedInput,
  Checkbox,
  ListItemText,
} from '@mui/material';
import {
  AccountBalance as DepositIcon,
  AccountBalanceWallet as WithdrawIcon,
  TrendingUp as DividendIcon,
  TrendingUp,
  TrendingDown,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  AccountBalance as BalanceIcon,
  Add as AddIcon,
  Download as DownloadIcon,
  Timeline as TimelineIcon,
  TableChart as TableIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SwapHoriz as TransferIcon,
  DateRange as DateRangeIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { formatCurrency, formatDate } from '../../utils/format';
import CashFlowChart from './CashFlowChart';
import FundingSourceSummary from './FundingSourceSummary';
import MoneyInput from '../Common/MoneyInput';
import FundingSourceInput from '../Common/FundingSourceInput';

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
  fundingSource?: string;
  createdAt: string;
  updatedAt: string;
}

interface TransferCashData {
  fromSource: string;
  toSource: string;
  amount: number;
  description: string;
  transferDate: string;
}

interface CashFlowLayoutProps {
  portfolioId: string;
  onCashFlowUpdate?: () => void;
  compact?: boolean;
}

const CashFlowLayout: React.FC<CashFlowLayoutProps> = ({
  portfolioId,
  onCashFlowUpdate,
  compact = false,
}) => {
  const { accountId } = useAccount();
  const [cashFlows, setCashFlows] = useState<CashFlow[]>([]);
  const [allCashFlows, setAllCashFlows] = useState<CashFlow[]>([]); // All cash flows for summary calculations
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'deposit' | 'withdrawal' | 'dividend' | 'interest' | 'fee' | 'tax' | 'adjustment'>('deposit');
  const [editingCashFlow, setEditingCashFlow] = useState<CashFlow | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cashFlowToDelete, setCashFlowToDelete] = useState<CashFlow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferData, setTransferData] = useState<TransferCashData>({
    fromSource: '',
    toSource: '',
    amount: 0,
    description: '',
    transferDate: '',
  });
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    reference: '',
    effectiveDate: '',
    currency: 'VND',
    flowDate: '',
    status: 'COMPLETED',
    fundingSource: '',
  });
  const [tabValue, setTabValue] = useState(1);
  const [filterTypes, setFilterTypes] = useState<string[]>(['ALL']);
  const [dateFilters, setDateFilters] = useState({
    startDate: null as Date | null,
    endDate: null as Date | null,
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

  // Handler để apply filters
  const handleApplyFilters = () => {
    // Validate dates before applying filters
    const hasValidStartDate = dateFilters.startDate && !isNaN(dateFilters.startDate.getTime());
    const hasValidEndDate = dateFilters.endDate && !isNaN(dateFilters.endDate.getTime());
    
    // If user has entered dates but they're invalid, show error
    if ((dateFilters.startDate && !hasValidStartDate) || (dateFilters.endDate && !hasValidEndDate)) {
      setError('Please enter valid dates');
      return;
    }
    
    loadCashFlows();
    loadAllCashFlows();
  };
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });


  // Get unique funding sources from cash flows
  const getFundingSources = () => {
    const sources = new Set<string>();
    allCashFlows.forEach(cf => {
      if (cf.fundingSource && cf.fundingSource.trim()) {
        sources.add(cf.fundingSource);
      }
    });
    return Array.from(sources).sort();
  };

  // Load all cash flows for summary calculations
  const loadAllCashFlows = async () => {
    try {
      const response = await apiService.getPortfolioCashFlowHistory(portfolioId, accountId, { limit: 100000 });
      setAllCashFlows(response.data || []);
    } catch (err) {
      console.error('Failed to load all cash flows:', err);
    }
  };

  // Load cash flow history (paginated)
  const loadCashFlows = async (page: number = pagination?.page || 1, limit: number = pagination?.limit || 50) => {
    try {
      setLoading(true);
      const filters = {
        page,
        limit,
        startDate: dateFilters.startDate ? dateFilters.startDate.toISOString() : undefined,
        endDate: dateFilters.endDate ? dateFilters.endDate.toISOString() : undefined,
        types: filterTypes.includes('ALL') ? undefined : filterTypes,
      };
      const response = await apiService.getPortfolioCashFlowHistory(portfolioId, accountId, filters);
      setCashFlows(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cash flows');
    } finally {
      setLoading(false);
    }
  };

  // Pagination handlers
  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    loadCashFlows(page, pagination?.limit || 50);
  };

  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    const newLimit = event.target.value as number;
    loadCashFlows(1, newLimit);
  };

  useEffect(() => {
    loadCashFlows();
    loadAllCashFlows();
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
        fundingSource: formData.fundingSource || undefined,
      };

      const isEdit = editingCashFlow !== null;
      
      if (isEdit) {
        await apiService.updateCashFlow(portfolioId, accountId, editingCashFlow.cashflowId, payload);
      } else {
        await apiService.createCashFlow(portfolioId, accountId, 'deposit', payload);
      }

      // Reset form with auto-filled flowDate
      resetFormWithAutoFlowDate();
      setDialogOpen(false);
      setEditingCashFlow(null);
      setError(null); // Clear error on success
      
      await loadCashFlows();
      await loadAllCashFlows(); // Reload all cash flows for summary
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
      case 'DEPOSIT_SETTLEMENT': return 'success';
      case 'DEPOSIT_CREATION': return 'error';
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
      case 'DEPOSIT_SETTLEMENT': return <DepositIcon />;
      case 'DEPOSIT_CREATION': return <WithdrawIcon />;
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
      case 'deposit_settlement': return 'Record money received from deposit settlement';
      case 'deposit_creation': return 'Record money spent on deposit creation';
      default: return 'Add a new cash flow transaction';
    }
  };

  const formatTypeName = (type: string) => {
    return type.replace(/_/g, ' ');
  };

  const isCashFlowIn = (type: string) => {
    return ['DEPOSIT', 'DIVIDEND', 'INTEREST', 'SELL_TRADE', 'DEPOSIT_SETTLEMENT'].includes(type);
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
      case 'INTEREST': return <TrendingUp />;
      case 'FEE': return <CancelIcon />;
      case 'TAX': return <CancelIcon />;
      case 'ADJUSTMENT': return <BalanceIcon />;
      case 'BUY_TRADE': return <WithdrawIcon />;
      case 'SELL_TRADE': return <DepositIcon />;
      case 'DEPOSIT_SETTLEMENT': return <DepositIcon />;
      case 'DEPOSIT_CREATION': return <WithdrawIcon />;
      default: return isCashFlowIn(type) ? <TrendingUp /> : <TrendingDown />;
    }
  };

  // Calculate summary stats using all cash flows (not paginated data)
  let totalDeposits = (allCashFlows || [])
    .filter(cf => (cf.type === 'DEPOSIT' || cf.type === 'SELL_TRADE' || cf.type === 'DEPOSIT_SETTLEMENT' || cf.type === 'DIVIDEND') && cf.status === 'COMPLETED')
    .reduce((sum, cf) => sum + Math.abs(cf.amount), 0);

  const totalWithdrawals = (allCashFlows || [])
    .filter(cf => (cf.type === 'WITHDRAWAL' || cf.type === 'BUY_TRADE' || cf.type === 'DEPOSIT_CREATION') && cf.status === 'COMPLETED')
    .reduce((sum, cf) => sum + Math.abs(cf.amount), 0);

  const netCashFlow = totalDeposits - totalWithdrawals;

  // Cash flows are already filtered by server
  const filteredCashFlows = cashFlows || [];

  // Calculate total amount for filtered cash flows
  const filteredTotal = filteredCashFlows
    .filter(cf => cf.status === 'COMPLETED')
    .reduce((sum, cf) => {
      const isInflow = ['DEPOSIT', 'DIVIDEND', 'INTEREST', 'SELL_TRADE', 'DEPOSIT_SETTLEMENT'].includes(cf.type);
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
      fundingSource: '',
    });
  };

  const handleCreateCashFlow = (type: 'deposit' | 'withdrawal' | 'dividend' | 'interest' | 'fee' | 'tax' | 'adjustment') => {
    setDialogType(type);
    setEditingCashFlow(null);
    resetFormWithAutoFlowDate();
    setDialogOpen(true);
  };

  // Handle transfer cash
  const handleTransferCash = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!transferData.fromSource || !transferData.toSource) {
        throw new Error('Please select both source and destination funding sources');
      }

      if (transferData.fromSource === transferData.toSource) {
        throw new Error('Source and destination cannot be the same');
      }

      if (transferData.amount <= 0) {
        throw new Error('Transfer amount must be greater than 0');
      }

      const payload = {
        portfolioId: portfolioId,
        fromSource: transferData.fromSource,
        toSource: transferData.toSource,
        amount: transferData.amount,
        description: transferData.description || `Transfer from ${transferData.fromSource} to ${transferData.toSource}`,
        transferDate: new Date(transferData.transferDate).toISOString(),
      };

      await apiService.transferCashFlow(portfolioId, accountId, payload);

      // Reset form and close dialog
      setTransferData({
        fromSource: '',
        toSource: '',
        amount: 0,
        description: '',
        transferDate: getCurrentLocalDateTime(),
      });
      setTransferDialogOpen(false);
      setError(null);
      
      // Reload data
      await loadCashFlows();
      await loadAllCashFlows();
      onCashFlowUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transfer cash');
    } finally {
      setLoading(false);
    }
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
      fundingSource: cashFlow.fundingSource || '',
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
      
      await apiService.deleteCashFlow(portfolioId, accountId, cashFlowToDelete.cashflowId);

      await loadCashFlows();
      await loadAllCashFlows(); // Reload all cash flows for summary
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
    const headers = ['Date', 'Type', 'Amount', 'Currency', 'Description', 'Reference', 'Funding Source', 'Status'];
    const csvRows = [headers.join(',')];
    
    data.forEach(cf => {
      const row = [
        formatDate(cf.flowDate),
        formatTypeName(cf.type),
        cf.amount,
        'VND',
        `"${cf.description.replace(/"/g, '""')}"`,
        cf.reference || '',
        cf.fundingSource || '',
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
    <LocalizationProvider dateAdapter={AdapterDateFns}>
    <Box>
      {/* Header Section */}
      <Box sx={{ mb: compact ? 1 : 3 }}>
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center" 
          mb={compact ? 0.5 : 2}
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            backgroundColor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
            px: compact ? 1.5 : 3,
            py: compact ? 0.5 : 2,
            boxShadow: 2,
            transition: 'all 0.3s ease-in-out'
          }}
        >
          <Typography variant={compact ? "h6" : "h4"} fontWeight="bold" color="primary" sx={{ fontSize: compact ? '1rem' : undefined }}>
            Cash Flow Management
          </Typography>
          <Box display="flex" gap={1}>
            <Tooltip title="Refresh Data">
              <IconButton onClick={() => { loadCashFlows(); loadAllCashFlows(); }} disabled={loading} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              color="success"
              startIcon={<DepositIcon />}
              onClick={() => handleCreateCashFlow('deposit')}
              size={compact ? "small" : "medium"}
              sx={{ 
                borderRadius: 2, 
                mr: compact ? 0.5 : 1,
                px: compact ? 1 : 2,
                py: compact ? 0.5 : 1,
                fontSize: compact ? '0.7rem' : undefined
              }}
            >
              {compact ? "Deposit" : "Create Deposit"}
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<WithdrawIcon />}
              onClick={() => handleCreateCashFlow('withdrawal')}
              size={compact ? "small" : "medium"}
              sx={{ 
                borderRadius: 2, 
                mr: compact ? 0.5 : 1,
                px: compact ? 1 : 2,
                py: compact ? 0.5 : 1,
                fontSize: compact ? '0.7rem' : undefined
              }}
            >
              {compact ? "Withdraw" : "Create Withdrawal"}
            </Button>
            <Button
              variant="contained"
              color="info"
              startIcon={<DividendIcon />}
              onClick={() => handleCreateCashFlow('dividend')}
              size={compact ? "small" : "medium"}
              sx={{ 
                borderRadius: 2, 
                mr: compact ? 0.5 : 1,
                px: compact ? 1 : 2,
                py: compact ? 0.5 : 1,
                fontSize: compact ? '0.7rem' : undefined
              }}
            >
              {compact ? "Dividend" : "Create Dividend"}
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<TransferIcon />}
              onClick={() => {
                setTransferData({
                  fromSource: '',
                  toSource: '',
                  amount: 0,
                  description: '',
                  transferDate: getCurrentLocalDateTime(),
                });
                setTransferDialogOpen(true);
              }}
              size={compact ? "small" : "medium"}
              sx={{ 
                borderRadius: 2,
                px: compact ? 1 : 2,
                py: compact ? 0.5 : 1,
                fontSize: compact ? '0.7rem' : undefined
              }}
            >
              {compact ? "Transfer" : "Transfer Cash"}
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </Box>

      {/* Soft & Gentle Financial Summary Cards */}
      <Grid container spacing={compact ? 1.5 : 3} sx={{ mb: compact ? 1.5 : 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ 
            height: '100%', 
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)',
            boxShadow: '0 2px 12px rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.1)',
            borderRadius: 3,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 20px rgba(59, 130, 246, 0.12)',
            }
          }}>
            <CardContent sx={{ 
              px: compact ? 1.5 : 3, 
              py: compact ? 1 : 3 
            }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box sx={{ 
                  p: compact ? 0.5 : 1.5, 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)',
                  width: compact ? 32 : 48,
                  height: compact ? 32 : 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <DepositIcon sx={{ color: 'white', fontSize: compact ? 16 : 24 }} />
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography color="#1e40af" variant="caption" sx={{ 
                    fontSize: compact ? '0.6rem' : '0.75rem',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Total Inflows
                  </Typography>
                  <Typography variant="h4" color="#1e40af" fontWeight="600" sx={{ 
                    fontSize: compact ? '1rem' : '1.5rem',
                    mt: 0.5
                  }}>
                    {formatCurrency(totalDeposits)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ 
            height: '100%', 
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 50%, #fecaca 100%)',
            boxShadow: '0 2px 12px rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.1)',
            borderRadius: 3,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 20px rgba(239, 68, 68, 0.12)',
            }
          }}>
            <CardContent sx={{ 
              px: compact ? 1.5 : 3, 
              py: compact ? 1 : 3 
            }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box sx={{ 
                  p: compact ? 0.5 : 1.5, 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)',
                  width: compact ? 32 : 48,
                  height: compact ? 32 : 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <WithdrawIcon sx={{ color: 'white', fontSize: compact ? 16 : 24 }} />
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography color="#dc2626" variant="caption" sx={{ 
                    fontSize: compact ? '0.6rem' : '0.75rem',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Total Outflows
                  </Typography>
                  <Typography variant="h4" color="#dc2626" fontWeight="600" sx={{ 
                    fontSize: compact ? '1rem' : '1.5rem',
                    mt: 0.5
                  }}>
                    {formatCurrency(totalWithdrawals)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ 
            height: '100%', 
            background: netCashFlow >= 0 
              ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)'
              : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 50%, #fecaca 100%)',
            boxShadow: netCashFlow >= 0 
              ? '0 2px 12px rgba(34, 197, 94, 0.08)'
              : '0 2px 12px rgba(239, 68, 68, 0.08)',
            border: netCashFlow >= 0 
              ? '1px solid rgba(34, 197, 94, 0.1)'
              : '1px solid rgba(239, 68, 68, 0.1)',
            borderRadius: 3,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: netCashFlow >= 0 
                ? '0 4px 20px rgba(34, 197, 94, 0.12)'
                : '0 4px 20px rgba(239, 68, 68, 0.12)',
            }
          }}>
            <CardContent sx={{ 
              px: compact ? 1.5 : 3, 
              py: compact ? 1 : 3 
            }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box sx={{ 
                  p: compact ? 0.5 : 1.5, 
                  borderRadius: '50%', 
                  background: netCashFlow >= 0 
                    ? 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)'
                    : 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
                  boxShadow: netCashFlow >= 0 
                    ? '0 2px 8px rgba(34, 197, 94, 0.2)'
                    : '0 2px 8px rgba(239, 68, 68, 0.2)',
                  width: compact ? 32 : 48,
                  height: compact ? 32 : 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <BalanceIcon sx={{ color: 'white', fontSize: compact ? 16 : 24 }} />
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography color={netCashFlow >= 0 ? "#15803d" : "#dc2626"} variant="caption" sx={{ 
                    fontSize: compact ? '0.6rem' : '0.75rem',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Net Cash Flow
                  </Typography>
                  <Typography variant="h4" color={netCashFlow >= 0 ? "#15803d" : "#dc2626"} fontWeight="600" sx={{ 
                    fontSize: compact ? '1rem' : '1.5rem',
                    mt: 0.5
                  }}>
                    {formatCurrency(netCashFlow)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ 
            height: '100%', 
            background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 50%, #e9d5ff 100%)',
            boxShadow: '0 2px 12px rgba(168, 85, 247, 0.08)',
            border: '1px solid rgba(168, 85, 247, 0.1)',
            borderRadius: 3,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 20px rgba(168, 85, 247, 0.12)',
            }
          }}>
            <CardContent sx={{ 
              px: compact ? 1.5 : 3, 
              py: compact ? 1 : 3 
            }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box sx={{ 
                  p: compact ? 0.5 : 1.5, 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #a855f7 0%, #c084fc 100%)',
                  boxShadow: '0 2px 8px rgba(168, 85, 247, 0.2)',
                  width: compact ? 32 : 48,
                  height: compact ? 32 : 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <TimelineIcon sx={{ color: 'white', fontSize: compact ? 16 : 24 }} />
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography color="#7c3aed" variant="caption" sx={{ 
                    fontSize: compact ? '0.6rem' : '0.75rem',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Total Transactions
                  </Typography>
                  <Typography variant="h4" color="#7c3aed" fontWeight="600" sx={{ 
                    fontSize: compact ? '1rem' : '1.5rem',
                    mt: 0.5
                  }}>
                    {allCashFlows?.length || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Funding Source Summary */}
      <FundingSourceSummary 
        cashFlows={allCashFlows}
        loading={loading}
      />

      {/* Main Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="cash flow tabs">
            <Tab 
              icon={<TimelineIcon />} 
              label="Analytics" 
              iconPosition="start"
              sx={{ 
                textTransform: 'none', 
                fontWeight: 600,
                fontSize: compact ? '0.75rem' : '0.875rem',
                py: compact ? 0.5 : 1.5,
                px: compact ? 1 : 2
              }}
            />
            <Tab 
              icon={<TableIcon />} 
              label="Cash Flow History" 
              iconPosition="start"
              sx={{ 
                textTransform: 'none', 
                fontWeight: 600,
                fontSize: compact ? '0.75rem' : '0.875rem',
                py: compact ? 0.5 : 1.5,
                px: compact ? 1 : 2
              }}
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
              {/* Simple Filters Section */}
              <Box sx={{ mb: compact ? 1.5 : 3 }}>
                {/* Header */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={compact ? 0.5 : 2}>
                  <Typography variant={compact ? "subtitle2" : "h6"} fontWeight="600" sx={{ fontSize: compact ? '0.9rem' : undefined }}>
                    Cash Flow History
                  </Typography>
                  <Box display="flex" gap={1} alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      {filteredCashFlows.length} transactions
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      onClick={() => { loadCashFlows(); loadAllCashFlows(); }}
                      disabled={loading}
                    >
                      Refresh
                    </Button>
                  </Box>
                </Box>
                
                {/* Simple Filter Row */}
                <Box display="flex" gap={2} alignItems="center" flexWrap="wrap" mb={2}>
                  {/* Date Filters */}
                  <Box display="flex" gap={1} alignItems="center">
                    <DateRangeIcon color="action" />
                    <DatePicker
                      label="From"
                      value={dateFilters.startDate}
                      onChange={(date) => setDateFilters(prev => ({ ...prev, startDate: date }))}
                      slotProps={{ 
                        textField: { 
                          size: 'small',
                          sx: { minWidth: 140 },
                          error: false,
                          helperText: ''
                        } 
                      }}
                      format="dd/MM/yyyy"
                    />
                    <DatePicker
                      label="To"
                      value={dateFilters.endDate}
                      onChange={(date) => setDateFilters(prev => ({ ...prev, endDate: date }))}
                      slotProps={{ 
                        textField: { 
                          size: 'small',
                          sx: { minWidth: 140 },
                          error: false,
                          helperText: ''
                        } 
                      }}
                      format="dd/MM/yyyy"
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setDateFilters({ startDate: null, endDate: null })}
                      disabled={!dateFilters.startDate && !dateFilters.endDate}
                    >
                      Clear
                    </Button>
                  </Box>
                  
                  {/* Quick Date Buttons */}
                  <Box display="flex" gap={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        const today = new Date();
                        const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                        setDateFilters({ startDate: last7Days, endDate: today });
                      }}
                    >
                      7 days
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        const today = new Date();
                        const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                        setDateFilters({ startDate: last30Days, endDate: today });
                      }}
                    >
                      30 days
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        const today = new Date();
                        const last90Days = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
                        setDateFilters({ startDate: last90Days, endDate: today });
                      }}
                    >
                      90 days
                    </Button>
                  </Box>
                  
                  {/* Type Filter */}
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Type</InputLabel>
                    <Select
                      multiple
                      value={filterTypes}
                      label="Type"
                      onChange={(e) => {
                        const value = e.target.value as string[];
                        if (value.includes('ALL') && value.length === 1) {
                          setFilterTypes(['ALL']);
                        } else if (value.length === 0) {
                          setFilterTypes(['ALL']);
                        } else {
                          setFilterTypes(value);
                        }
                      }}
                      input={<OutlinedInput label="Type" />}
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
                      <MenuItem value="DEPOSIT_SETTLEMENT">
                        <Checkbox checked={filterTypes.includes('DEPOSIT_SETTLEMENT')} />
                        <ListItemText primary="Deposit Settlements" />
                      </MenuItem>
                      <MenuItem value="DEPOSIT_CREATION">
                        <Checkbox checked={filterTypes.includes('DEPOSIT_CREATION')} />
                        <ListItemText primary="Deposit Creations" />
                      </MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setFilterTypes(['ALL'])}
                      disabled={filterTypes.includes('ALL')}
                    >
                      All Types
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setFilterTypes(['DEPOSIT', 'WITHDRAWAL', 'DIVIDEND', 'INTEREST', 'FEE', 'TAX', 'ADJUSTMENT', 'BUY_TRADE', 'SELL_TRADE', 'DEPOSIT_SETTLEMENT', 'DEPOSIT_CREATION'])}
                      disabled={filterTypes.length === 11 && !filterTypes.includes('ALL')}
                    >
                      Reset
                    </Button>
                  
                  {/* Actions */}
                  <Box display="flex" gap={1}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<FilterIcon />}
                      onClick={handleApplyFilters}
                      disabled={loading}
                    >
                      Filter
                    </Button>
                    
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      size="small"
                      onClick={() => {
                        const csvContent = generateCSV(filteredCashFlows);
                        downloadCSV(csvContent, `cash-flow-${portfolioId}-${new Date().toISOString().split('T')[0]}.csv`);
                      }}
                    >
                      Export
                    </Button>
                  </Box>
                </Box>
                
                {/* Active Filters */}
                {((dateFilters.startDate && !isNaN(dateFilters.startDate.getTime())) || (dateFilters.endDate && !isNaN(dateFilters.endDate.getTime())) || (filterTypes.length > 0 && !filterTypes.includes('ALL'))) && (
                  <Box sx={{ mb: 2, p: 1, backgroundColor: 'grey.100', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Active filters:
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {dateFilters.startDate && !isNaN(dateFilters.startDate.getTime()) && (
                        <Chip
                          label={`From: ${formatDate(dateFilters.startDate.toISOString())}`}
                          size="small"
                          onDelete={() => setDateFilters(prev => ({ ...prev, startDate: null }))}
                        />
                      )}
                      {dateFilters.endDate && !isNaN(dateFilters.endDate.getTime()) && (
                        <Chip
                          label={`To: ${formatDate(dateFilters.endDate.toISOString())}`}
                          size="small"
                          onDelete={() => setDateFilters(prev => ({ ...prev, endDate: null }))}
                        />
                      )}
                      {filterTypes.length > 0 && !filterTypes.includes('ALL') && (
                        <Chip
                          label={`Types: ${filterTypes.join(', ')}`}
                          size="small"
                          onDelete={() => setFilterTypes(['ALL'])}
                        />
                      )}
                    </Box>
                  </Box>
                )}
                
                {/* Summary */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Total: <strong>{formatCurrency(filteredTotal, 'VND')}</strong> ({filteredCashFlows.length} items)
                  </Typography>
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
                        <TableCell><strong>Funding Source</strong></TableCell>
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
                              label={formatTypeName(cashFlow.type)}
                              color={getTypeColor(cashFlow.type) as any}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography
                              color={cashFlow.type === 'DEPOSIT' || cashFlow.type === 'DIVIDEND' || cashFlow.type === 'SELL_TRADE' || cashFlow.type === 'DEPOSIT_SETTLEMENT' ? 'success.main' : 'error.main'}
                              
                            >
                              {formatCurrency(cashFlow.type === 'DEPOSIT' || cashFlow.type === 'DIVIDEND' || cashFlow.type === 'SELL_TRADE' || cashFlow.type === 'DEPOSIT_SETTLEMENT' ? cashFlow.amount : -cashFlow.amount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 220 }}>
                              {cashFlow.description}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
                              {cashFlow.reference || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
                              {cashFlow.fundingSource || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: '12px' }}>
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
      {/* <Box sx={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 2 }}>
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
      </Box> */}

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
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="h6">Edit Cash Flow</Typography>
                    <Chip
                      icon={getCashFlowDirectionIcon(editingCashFlow.type)}
                      label={`${formatTypeName(editingCashFlow.type)} - ${getCashFlowDirection(editingCashFlow.type)}`}
                      color={getCashFlowDirectionColor(editingCashFlow.type) as any}
                      size="small"
                      variant="filled"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    ID: {editingCashFlow.cashflowId?.slice(0, 8)}... | Type: {formatTypeName(editingCashFlow.type)}
                  </Typography>
                </Box>
              </>
            ) : (
              <>
                {getTypeIcon(dialogType)}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="h6" color={getTypeColor(dialogType)}>
                      Create {dialogType.charAt(0).toUpperCase() + dialogType.slice(1)} Cash Flow
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
            
            {/* Cash Flow Type Indicator */}
            {!editingCashFlow && (
              <Alert 
                severity={getCashFlowDirectionColor(dialogType.toUpperCase()) === 'success' ? 'success' : 'error'}
                sx={{ 
                  mb: 2, 
                  borderLeft: `4px solid ${getCashFlowDirectionColor(dialogType.toUpperCase()) === 'success' ? '#4caf50' : '#f44336'}`,
                  backgroundColor: getCashFlowDirectionColor(dialogType.toUpperCase()) === 'success' ? '#e8f5e8' : '#ffebee'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getTypeIcon(dialogType)}
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
            )}
            
            <Grid container spacing={2}>
              {/* Left Column */}
              <Grid item xs={12} md={6}>
                <MoneyInput
                  value={parseFloat(formData.amount) || 0}
                  onChange={(amount) => setFormData({ ...formData, amount: amount.toString() })}
                  label="Amount"
                  placeholder="Enter amount (e.g., 1,000,000)"
                  required
                  currency={formData.currency}
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
                
                <TextField
                  fullWidth
                  label="Funding Source (Optional)"
                  value={formData.fundingSource}
                  onChange={(e) => setFormData({ ...formData, fundingSource: e.target.value.toUpperCase() })}
                  margin="normal"
                  placeholder="e.g., VIETCOMBANK, BANK_ACCOUNT_001"
                  helperText="Source of funding for this transaction (optional)"
                  inputProps={{
                    style: { textTransform: 'uppercase' }
                  }}
                />
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
                
                <TextField
                  fullWidth
                  label="Description (Optional)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  margin="normal"
                  multiline
                  rows={3}
                  helperText={
                    editingCashFlow 
                      ? `Original: "${editingCashFlow.description}"`
                      : 'Enter a description for this cash flow (optional)'
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
            disabled={loading || !formData.amount || parseFloat(formData.amount) <= 0 || isNaN(parseFloat(formData.amount))}
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

      {/* Transfer Cash Dialog */}
      <Dialog open={transferDialogOpen} onClose={() => {
        setTransferDialogOpen(false);
        setError(null);
      }} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TransferIcon color="secondary" />
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="h6">Transfer Cash Between Sources</Typography>
                <Chip
                  icon={<TransferIcon />}
                  label="Internal Transfer"
                  color="secondary"
                  size="small"
                  variant="filled"
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Move cash from one funding source to another
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
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
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>From Source</InputLabel>
                  <Select
                    value={transferData.fromSource}
                    label="From Source"
                    onChange={(e) => setTransferData({ ...transferData, fromSource: e.target.value })}
                  >
                    {getFundingSources().map((source) => (
                      <MenuItem key={source} value={source}>
                        {source}
                      </MenuItem>
                    ))}
                  </Select>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Select the source to transfer from
                  </Typography>
                </FormControl>
                
                <FundingSourceInput
                  value={transferData.toSource}
                  onChange={(toSource) => setTransferData({ ...transferData, toSource })}
                  existingSources={getFundingSources()}
                  label="To Source"
                  placeholder="Type or select funding source..."
                  required
                  allowNew={true}
                />
                
                <MoneyInput
                  value={transferData.amount}
                  onChange={(amount) => setTransferData({ ...transferData, amount })}
                  label="Transfer Amount"
                  placeholder="Enter amount (e.g., 1,000,000)"
                  required
                  error={!!(transferData.amount && transferData.amount <= 0)}
                  helperText={
                    transferData.amount > 0 
                      ? `Transferring ${formatCurrency(transferData.amount)}` 
                      : 'Enter the amount to transfer'
                  }
                />
              </Grid>
              
              {/* Right Column */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Transfer Date"
                  type="datetime-local"
                  value={transferData.transferDate}
                  onChange={(e) => setTransferData({ ...transferData, transferDate: e.target.value })}
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                  helperText="When this transfer occurred"
                />
                
                <TextField
                  fullWidth
                  label="Description (Optional)"
                  value={transferData.description}
                  onChange={(e) => setTransferData({ ...transferData, description: e.target.value })}
                  margin="normal"
                  multiline
                  rows={3}
                  placeholder={`Transfer from ${transferData.fromSource || 'Source'} to ${transferData.toSource || 'Destination'}`}
                  helperText="Enter a description for this transfer (optional)"
                />
              </Grid>
            </Grid>

            {/* Transfer Summary */}
            {transferData.fromSource && transferData.toSource && transferData.amount > 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  Transfer Summary:
                </Typography>
                <Typography variant="body2">
                  Moving <strong>{formatCurrency(transferData.amount)}</strong> from <strong>{transferData.fromSource}</strong> to <strong>{transferData.toSource}</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  This will create two cash flow records: one withdrawal from source and one deposit to destination.
                </Typography>
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setTransferDialogOpen(false);
            setError(null);
          }}>Cancel</Button>
          <Button
            onClick={handleTransferCash}
            variant="contained"
            color="secondary"
            disabled={
              loading || 
              !transferData.fromSource || 
              !transferData.toSource ||
              transferData.amount <= 0 || 
              transferData.fromSource === transferData.toSource
            }
            startIcon={<TransferIcon />}
          >
            {loading ? 'Transferring...' : 'Transfer Cash'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </LocalizationProvider>
  );
};

export default CashFlowLayout;
