import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../../services/api';
import { useAccount } from '../../contexts/AccountContext';
import { usePortfolio } from '../../hooks/usePortfolios';
import {
  Box,
  Card,
  CardContent,
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
import ResponsiveTypography from '../Common/ResponsiveTypography';
import { ResponsiveButton } from '../Common';
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
  CalendarToday as CalendarIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Clear as ClearIcon,
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
  const { portfolio } = usePortfolio(portfolioId);
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
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const [groupByDate, setGroupByDate] = useState<boolean>(true);

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
        currency: formData.currency,
        status: formData.status,
        fundingSource: formData.fundingSource || undefined,
      };

      const isEdit = editingCashFlow !== null;
      
      if (isEdit) {
        await apiService.updateCashFlow(portfolioId, accountId, editingCashFlow.cashflowId, payload);
      } else {
        await apiService.createCashFlow(portfolioId, accountId, dialogType, payload);
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

  // Group cash flows by date
  const groupedCashFlows = useMemo(() => {
    if (!groupByDate) {
      return { 'All Transactions': filteredCashFlows };
    }

    const groups: Record<string, CashFlow[]> = {};
    filteredCashFlows.forEach((cashFlow) => {
      const date = new Date(cashFlow.flowDate);
      const dateKey = date.toISOString().split('T')[0]; // yyyy-MM-dd format
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(cashFlow);
    });

    // Sort dates in descending order (newest first)
    const sortedGroups: Record<string, CashFlow[]> = {};
    Object.keys(groups)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .forEach(dateKey => {
        const date = new Date(dateKey);
        const displayDate = date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: '2-digit' 
        });
        sortedGroups[displayDate] = groups[dateKey];
      });

    return sortedGroups;
  }, [filteredCashFlows, groupByDate]);

  // Toggle date collapse
  const toggleDateCollapse = (dateKey: string) => {
    const newCollapsed = new Set(collapsedDates);
    if (newCollapsed.has(dateKey)) {
      newCollapsed.delete(dateKey);
    } else {
      newCollapsed.add(dateKey);
    }
    setCollapsedDates(newCollapsed);
  };

  // Toggle all dates collapse
  const toggleAllDatesCollapse = () => {
    if (collapsedDates.size === Object.keys(groupedCashFlows).length) {
      setCollapsedDates(new Set());
    } else {
      setCollapsedDates(new Set(Object.keys(groupedCashFlows)));
    }
  };

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

  // Helper function to reset form with auto-filled flowDate and portfolio funding source
  const resetFormWithAutoFlowDate = () => {
    setFormData({
      amount: '',
      description: '',
      reference: '',
      currency: 'VND',
      flowDate: getCurrentLocalDateTime(),
      status: 'COMPLETED',
      fundingSource: portfolio?.fundingSource || '',
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
    
    setFormData({
      amount: cashFlow.amount.toString(),
      description: cashFlow.description || '',
      reference: cashFlow.reference || '',
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
          <ResponsiveTypography 
            variant="pageTitle" 
          >
            Cash Flow Management
          </ResponsiveTypography>
          <Box display="flex" gap={1}>
            <Tooltip title="Refresh Data">
              <IconButton onClick={() => { loadCashFlows(); loadAllCashFlows(); }} disabled={loading} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <ResponsiveButton
              variant="contained"
              color="success"
              icon={<DepositIcon />}
              startIcon={<DepositIcon />}
              onClick={() => handleCreateCashFlow('deposit')}
              size={compact ? "small" : "medium"}
              mobileText="Deposit"
              desktopText="Create Deposit"
              sx={{ 
                borderRadius: 2, 
                mr: compact ? 0.5 : 1,
                px: compact ? 1 : 2,
                py: compact ? 0.5 : 1,
                ...(compact ? { fontSize: '0.7rem!important' } : {
                  fontSize:{
                  xs: '0.65rem!important',
                  sm: '0.65rem!important',
                  md: '0.7rem!important',
                  lg: '0.75rem!important',
                  xl: '0.8rem!important'
                }
                })
              }}
            >
              {compact ? "Deposit" : "Create Deposit"}
            </ResponsiveButton>
            <ResponsiveButton
              variant="contained"
              color="error"
              icon={<WithdrawIcon />}
              startIcon={<WithdrawIcon />}
              onClick={() => handleCreateCashFlow('withdrawal')}
              size={compact ? "small" : "medium"}
              mobileText="Withdraw"
              desktopText="Create Withdrawal"
              sx={{ 
                borderRadius: 2, 
                mr: compact ? 0.5 : 1,
                px: compact ? 1 : 2,
                py: compact ? 0.5 : 1,
                ...(compact ? { fontSize: '0.7rem!important' } : {
                  fontSize:{
                  xs: '0.65rem!important',
                  sm: '0.65rem!important',
                  md: '0.7rem!important',
                  lg: '0.75rem!important',
                  xl: '0.8rem!important'
                }
                })
              }}
            >
              {compact ? "Withdraw" : "Create Withdrawal"}
            </ResponsiveButton>
            <ResponsiveButton
              variant="contained"
              color="info"
              icon={<DividendIcon />}
              startIcon={<DividendIcon />}
              onClick={() => handleCreateCashFlow('dividend')}
              size={compact ? "small" : "medium"}
              mobileText="Dividend"
              desktopText="Create Dividend"
              sx={{ 
                borderRadius: 2, 
                mr: compact ? 0.5 : 1,
                px: compact ? 1 : 2,
                py: compact ? 0.5 : 1,
                ...(compact ? { fontSize: '0.7rem!important' } : {
                  fontSize:{
                  xs: '0.65rem!important',
                  sm: '0.65rem!important',
                  md: '0.7rem!important',
                  lg: '0.75rem!important',
                  xl: '0.8rem!important'
                }
                })
                }}
              
            >
              {compact ? "Dividend" : "Create Dividend"}
            </ResponsiveButton>
            <ResponsiveButton
              variant="contained"
              color="secondary"
              icon={<TransferIcon />}
              mobileText="Transfer"
              desktopText="Transfer Cash"
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
                ...(compact ? { fontSize: '0.7rem!important' } : {
                  fontSize:{
                  xs: '0.65rem!important',
                  sm: '0.65rem!important',
                  md: '0.7rem!important',
                  lg: '0.75rem!important',
                  xl: '0.8rem!important'
                }
                })
              }}
            >
              {compact ? "Transfer" : "Transfer Cash"}
            </ResponsiveButton>
          </Box>
        </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                <ResponsiveTypography variant="tableCell">
                  {error}
                </ResponsiveTypography>
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
                  maxWidth: {
                    xs: compact ? 28 : 40,
                    sm: compact ? 32 : 42,
                    md: compact ? 36 : 44,
                    lg: compact ? 40 : 45,
                    xl: compact ? 44 : 50
                  },
                  height: {
                    xs: compact ? 28 : 40,
                    sm: compact ? 32 : 42,
                    md: compact ? 36 : 44,
                    lg: compact ? 40 : 45,
                    xl: compact ? 44 : 50
                  },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <DepositIcon sx={{ 
                    color: 'white', 
                    fontSize: {
                      xs: compact ? 14 : 18,
                      sm: compact ? 16 : 20,
                      md: compact ? 18 : 22,
                      lg: compact ? 20 : 24,
                      xl: compact ? 22 : 26
                    }
                  }} />
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <ResponsiveTypography variant="cardLabel" sx={{ 
                    color: '#1e40af',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Total Inflows
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="cardValueLarge" sx={{ 
                    color: '#1e40af',
                    fontSize: compact ? '1rem' : '1.5rem',
                    mt: 0.5
                  }}>
                    {formatCurrency(totalDeposits)}
                  </ResponsiveTypography>
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
                  width: {
                    xs: compact ? 28 : 40,
                    sm: compact ? 32 : 42,
                    md: compact ? 36 : 44,
                    lg: compact ? 40 : 45,
                    xl: compact ? 44 : 50
                  },
                  height: {
                    xs: compact ? 28 : 40,
                    sm: compact ? 32 : 42,
                    md: compact ? 36 : 44,
                    lg: compact ? 40 : 45,
                    xl: compact ? 44 : 50
                  },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <WithdrawIcon sx={{ 
                    color: 'white', 
                    fontSize: {
                      xs: compact ? 14 : 18,
                      sm: compact ? 16 : 20,
                      md: compact ? 18 : 22,
                      lg: compact ? 20 : 24,
                      xl: compact ? 22 : 26
                    }
                  }} />
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <ResponsiveTypography variant="cardLabel" sx={{ 
                    color: '#dc2626',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Total Outflows
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="cardValueLarge" sx={{ 
                    color: '#dc2626',
                    fontSize: compact ? '1rem' : '1.5rem',
                    mt: 0.5
                  }}>
                    {formatCurrency(totalWithdrawals)}
                  </ResponsiveTypography>
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
                    width: {
                      xs: compact ? 28 : 40,
                      sm: compact ? 32 : 42,
                      md: compact ? 36 : 44,
                      lg: compact ? 40 : 45,
                      xl: compact ? 44 : 50
                    },
                    height: {
                      xs: compact ? 28 : 40,
                      sm: compact ? 32 : 42,
                      md: compact ? 36 : 44,
                      lg: compact ? 40 : 45,
                      xl: compact ? 44 : 50
                    },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <BalanceIcon sx={{ 
                    color: 'white', 
                    fontSize: {
                      xs: compact ? 14 : 18,
                      sm: compact ? 16 : 20,
                      md: compact ? 18 : 22,
                      lg: compact ? 20 : 24,
                      xl: compact ? 22 : 26
                    }
                  }} />
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <ResponsiveTypography variant="cardLabel" sx={{ 
                    color: netCashFlow >= 0 ? "#15803d" : "#dc2626",
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Net Cash Flow
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="cardValueLarge" sx={{ 
                    color: netCashFlow >= 0 ? "#15803d" : "#dc2626",
                    fontSize: compact ? '1rem' : '1.5rem',
                    mt: 0.5
                  }}>
                    {formatCurrency(netCashFlow)}
                  </ResponsiveTypography>
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
                  width: {
                    xs: compact ? 28 : 40,
                    sm: compact ? 32 : 42,
                    md: compact ? 36 : 44,
                    lg: compact ? 40 : 45,
                    xl: compact ? 44 : 50
                  },
                  height: {
                    xs: compact ? 28 : 40,
                    sm: compact ? 32 : 42,
                    md: compact ? 36 : 44,
                    lg: compact ? 40 : 45,
                    xl: compact ? 44 : 50
                  },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <TimelineIcon sx={{ 
                    color: 'white', 
                    fontSize: {
                      xs: compact ? 14 : 18,
                      sm: compact ? 16 : 20,
                      md: compact ? 18 : 22,
                      lg: compact ? 20 : 24,
                      xl: compact ? 22 : 26
                    }
                  }} />
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <ResponsiveTypography variant="cardLabel" sx={{ 
                    color: '#7c3aed',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Total Transactions
                  </ResponsiveTypography>
                  <ResponsiveTypography variant="cardValueLarge" sx={{ 
                    color: '#7c3aed',
                    fontSize: compact ? '1rem' : '1.5rem',
                    mt: 0.5
                  }}>
                    {allCashFlows?.length || 0}
                  </ResponsiveTypography>
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
                ...(compact ? { fontSize: '0.75rem' } : { fontSize: '0.875rem' }),
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
                ...(compact ? { fontSize: '0.75rem' } : { fontSize: '0.875rem' }),
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
                  <ResponsiveTypography variant="pageTitle" sx={{ fontSize: compact ? '0.9rem' : undefined }}>
                    Cash Flow History
                  </ResponsiveTypography>
                  <Box display="flex" gap={1} alignItems="center">
                    <ResponsiveTypography variant="formHelper">
                      {filteredCashFlows.length} transactions
                    </ResponsiveTypography>
                    <ResponsiveButton
                      size="small"
                      variant="outlined"
                      icon={<RefreshIcon />}
                      mobileText="Refresh"
                      desktopText="Refresh"
                      onClick={() => { loadCashFlows(); loadAllCashFlows(); }}
                      disabled={loading}
                    >
                      Refresh
                    </ResponsiveButton>
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
                    <ResponsiveButton
                      size="small"
                      variant="outlined"
                      icon={<ClearIcon />}
                      mobileText="Clear"
                      desktopText="Clear"
                      onClick={() => setDateFilters({ startDate: null, endDate: null })}
                      disabled={!dateFilters.startDate && !dateFilters.endDate}
                    >
                      Clear
                    </ResponsiveButton>
                  </Box>
                  
                  {/* Quick Date Buttons */}
                  <Box display="flex" gap={1}>
                    <ResponsiveButton
                      size="small"
                      variant="outlined"
                      icon={<CalendarIcon />}
                      mobileText="7d"
                      desktopText="7 days"
                      onClick={() => {
                        const today = new Date();
                        const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                        setDateFilters({ startDate: last7Days, endDate: today });
                      }}
                    >
                      7 days
                    </ResponsiveButton>
                    <ResponsiveButton
                      size="small"
                      variant="outlined"
                      icon={<CalendarIcon />}
                      mobileText="30d"
                      desktopText="30 days"
                      onClick={() => {
                        const today = new Date();
                        const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                        setDateFilters({ startDate: last30Days, endDate: today });
                      }}
                    >
                      30 days
                    </ResponsiveButton>
                    <ResponsiveButton
                      size="small"
                      variant="outlined"
                      icon={<CalendarIcon />}
                      mobileText="90d"
                      desktopText="90 days"
                      onClick={() => {
                        const today = new Date();
                        const last90Days = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
                        setDateFilters({ startDate: last90Days, endDate: today });
                      }}
                    >
                      90 days
                    </ResponsiveButton>
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
                  <ResponsiveButton
                      size="small"
                      variant="outlined"
                      icon={<FilterIcon />}
                      mobileText="All"
                      desktopText="All Types"
                      onClick={() => setFilterTypes(['ALL'])}
                      disabled={filterTypes.includes('ALL')}
                    >
                      All Types
                    </ResponsiveButton>
                    <ResponsiveButton
                      size="small"
                      variant="outlined"
                      icon={<ClearIcon />}
                      mobileText="Reset"
                      desktopText="Reset"
                      onClick={() => setFilterTypes(['DEPOSIT', 'WITHDRAWAL', 'DIVIDEND', 'INTEREST', 'FEE', 'TAX', 'ADJUSTMENT', 'BUY_TRADE', 'SELL_TRADE', 'DEPOSIT_SETTLEMENT', 'DEPOSIT_CREATION'])}
                      disabled={filterTypes.length === 11 && !filterTypes.includes('ALL')}
                    >
                      Reset
                    </ResponsiveButton>
                    
                    <ResponsiveButton
                      size="small"
                      variant="contained"
                      icon={<FilterIcon />}
                      mobileText="Search"
                      desktopText="Search"
                      onClick={handleApplyFilters}
                      disabled={loading}
                    >
                      Search
                    </ResponsiveButton>
                  
                  {/* Actions */}
                  <Box display="flex" gap={1}>
                    
                    <ResponsiveButton
                      variant={groupByDate ? 'contained' : 'outlined'}
                      icon={<CalendarIcon />}
                      mobileText="Group"
                      desktopText="Group by Date"
                      onClick={() => setGroupByDate(!groupByDate)}
                      size="small"
                      sx={{ textTransform: 'none' }}
                    >
                      Group by Date
                    </ResponsiveButton>
                    
                    {groupByDate && Object.keys(groupedCashFlows).length > 1 && (
                      <ResponsiveButton
                        size="small"
                        variant="outlined"
                        icon={collapsedDates.size === Object.keys(groupedCashFlows).length ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                        mobileText={collapsedDates.size === Object.keys(groupedCashFlows).length ? 'Expand' : 'Collapse'}
                        desktopText={collapsedDates.size === Object.keys(groupedCashFlows).length ? 'Expand All' : 'Collapse All'}
                        onClick={toggleAllDatesCollapse}
                        sx={{ textTransform: 'none' }}
                      >
                        {collapsedDates.size === Object.keys(groupedCashFlows).length ? 'Expand All' : 'Collapse All'}
                      </ResponsiveButton>
                    )}
                    
                    <ResponsiveButton
                      variant="outlined"
                      icon={<DownloadIcon />}
                      mobileText="Export"
                      desktopText="Export"
                      size="small"
                      onClick={() => {
                        const csvContent = generateCSV(filteredCashFlows);
                        downloadCSV(csvContent, `cash-flow-${portfolioId}-${new Date().toISOString().split('T')[0]}.csv`);
                      }}
                    >
                      Export
                    </ResponsiveButton>
                  </Box>
                </Box>
                
                {/* Active Filters */}
                {((dateFilters.startDate && !isNaN(dateFilters.startDate.getTime())) || (dateFilters.endDate && !isNaN(dateFilters.endDate.getTime())) || (filterTypes.length > 0 && !filterTypes.includes('ALL'))) && (
                  <Box sx={{ mb: 2, p: 1, backgroundColor: 'grey.100', borderRadius: 1 }}>
                    <ResponsiveTypography variant="formHelper" sx={{ mb: 1 }}>
                      Active filters:
                    </ResponsiveTypography>
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
                  <ResponsiveTypography variant="formHelper">
                    Total: <strong>{formatCurrency(filteredTotal, 'VND')}</strong> ({filteredCashFlows.length} items)
                  </ResponsiveTypography>
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
                        <TableCell>
                          <ResponsiveTypography variant="tableHeaderSmall" sx={{ fontWeight: 600 }}>
                            Type
                          </ResponsiveTypography>
                        </TableCell>
                        <TableCell>
                          <ResponsiveTypography variant="tableHeaderSmall" sx={{ fontWeight: 600 }}>
                            Amount
                          </ResponsiveTypography>
                        </TableCell>
                        <TableCell>
                          <ResponsiveTypography variant="tableHeaderSmall" sx={{ fontWeight: 600 }}>
                            Description
                          </ResponsiveTypography>
                        </TableCell>
                        <TableCell>
                          <ResponsiveTypography variant="tableHeaderSmall" sx={{ fontWeight: 600 }}>
                            Reference
                          </ResponsiveTypography>
                        </TableCell>
                        <TableCell>
                          <ResponsiveTypography variant="tableHeaderSmall" sx={{ fontWeight: 600 }}>
                            Funding Source
                          </ResponsiveTypography>
                        </TableCell>
                        <TableCell>
                          <ResponsiveTypography variant="tableHeaderSmall" sx={{ fontWeight: 600 }}>
                            Date
                          </ResponsiveTypography>
                        </TableCell>
                        <TableCell>
                          <ResponsiveTypography variant="tableHeaderSmall" sx={{ fontWeight: 600 }}>
                            Status
                          </ResponsiveTypography>
                        </TableCell>
                        <TableCell>
                          <ResponsiveTypography variant="tableHeaderSmall" sx={{ fontWeight: 600 }}>
                            Actions
                          </ResponsiveTypography>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(groupedCashFlows).map(([dateKey, cashFlows]) => (
                        <React.Fragment key={dateKey}>
                          {/* Date Header Row */}
                          {groupByDate && (
                            <TableRow 
                              sx={{ 
                                bgcolor: 'grey.100',
                                '&:hover': { bgcolor: 'grey.200' },
                                cursor: 'pointer'
                              }}
                              onClick={() => toggleDateCollapse(dateKey)}
                            >
                              <TableCell 
                                colSpan={8} 
                                sx={{ 
                                  py: compact ? 1 : 1.5,
                                  borderBottom: '2px solid',
                                  borderBottomColor: 'primary.main'
                                }}
                              >
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <CalendarIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                    <ResponsiveTypography variant="cardTitle" fontWeight="600" color="primary.main">
                                      {dateKey}
                                    </ResponsiveTypography>
                                    <ResponsiveTypography variant="labelSmall" color="text.secondary">
                                      ({cashFlows.length} {cashFlows.length === 1 ? 'transaction' : 'transactions'})
                                    </ResponsiveTypography>
                                  </Box>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    {collapsedDates.has(dateKey) ? (
                                      <ExpandMoreIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                                    ) : (
                                      <ExpandLessIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                                    )}
                                  </Box>
                                </Box>
                              </TableCell>
                            </TableRow>
                          )}
                          
                          {/* Cash Flow Rows */}
                          {!collapsedDates.has(dateKey) && cashFlows.map((cashFlow) => (
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
                                <ResponsiveTypography
                                  variant="tableCellSmall"
                                  sx={{
                                    color: cashFlow.type === 'DEPOSIT' || cashFlow.type === 'DIVIDEND' || cashFlow.type === 'SELL_TRADE' || cashFlow.type === 'DEPOSIT_SETTLEMENT' ? 'success.main' : 'error.main'
                                  }}
                                >
                                  {formatCurrency(cashFlow.type === 'DEPOSIT' || cashFlow.type === 'DIVIDEND' || cashFlow.type === 'SELL_TRADE' || cashFlow.type === 'DEPOSIT_SETTLEMENT' ? cashFlow.amount : -cashFlow.amount)}
                                </ResponsiveTypography>
                              </TableCell>
                              <TableCell>
                                <ResponsiveTypography variant="tableCellSmall" noWrap sx={{ maxWidth: 220 }}>
                                  {cashFlow.description}
                                </ResponsiveTypography>
                              </TableCell>
                              <TableCell>
                                <ResponsiveTypography variant="tableCellSmall" sx={{ color: 'text.secondary' }}>
                                  {cashFlow.reference || '-'}
                                </ResponsiveTypography>
                              </TableCell>
                              <TableCell>
                                <ResponsiveTypography variant="tableCellSmall" sx={{ color: 'text.secondary' }}>
                                  {cashFlow.fundingSource || '-'}
                                </ResponsiveTypography>
                              </TableCell>
                              <TableCell>
                                <ResponsiveTypography variant="tableCellSmall">
                                  {formatDate(cashFlow.flowDate)}
                                </ResponsiveTypography>
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
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {/* Pagination */}
                {pagination?.totalPages && pagination.totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, px: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <ResponsiveTypography variant="formHelper">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
                      </ResponsiveTypography>
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
                    <ResponsiveTypography variant="pageTitle">Edit Cash Flow</ResponsiveTypography>
                    <Chip
                      icon={getCashFlowDirectionIcon(editingCashFlow.type)}
                      label={`${formatTypeName(editingCashFlow.type)} - ${getCashFlowDirection(editingCashFlow.type)}`}
                      color={getCashFlowDirectionColor(editingCashFlow.type) as any}
                      size="small"
                      variant="filled"
                    />
                  </Box>
                  <ResponsiveTypography variant="formHelper">
                    ID: {editingCashFlow.cashflowId?.slice(0, 8)}... | Type: {formatTypeName(editingCashFlow.type)}
                  </ResponsiveTypography>
                </Box>
              </>
            ) : (
              <>
                {getTypeIcon(dialogType)}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <ResponsiveTypography variant="pageTitle" sx={{ color: getTypeColor(dialogType) }}>
                      Create {dialogType.charAt(0).toUpperCase() + dialogType.slice(1)} Cash Flow
                    </ResponsiveTypography>
                    <Chip
                      icon={getCashFlowDirectionIcon(dialogType.toUpperCase())}
                      label={`${formatTypeName(dialogType.toUpperCase())} - ${getCashFlowDirection(dialogType.toUpperCase())}`}
                      color={getCashFlowDirectionColor(dialogType.toUpperCase()) as any}
                      size="small"
                      variant="filled"
                    />
                  </Box>
                  <ResponsiveTypography variant="formHelper">
                    {getTypeDescription(dialogType)}
                  </ResponsiveTypography>
                </Box>
              </>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {editingCashFlow && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <ResponsiveTypography variant="tableCell">
                  <strong>Editing:</strong> {editingCashFlow.description}
                </ResponsiveTypography>
                <ResponsiveTypography variant="formHelper">
                  Original Amount: {formatCurrency(editingCashFlow.amount)} | 
                  Type: {editingCashFlow.type} | 
                  Status: {editingCashFlow.status}
                </ResponsiveTypography>
              </Alert>
            )}
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <ResponsiveTypography variant="tableCell">
                  <strong>Error:</strong> {error}
                </ResponsiveTypography>
                <ResponsiveTypography variant="formHelper" sx={{ mt: 1, display: 'block' }}>
                  Please check your input and try again.
                </ResponsiveTypography>
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
                    <ResponsiveTypography variant="tableCell" sx={{ fontWeight: 'bold' }}>
                      {dialogType.charAt(0).toUpperCase() + dialogType.slice(1)} Transaction
                    </ResponsiveTypography>
                      <Chip
                        icon={getCashFlowDirectionIcon(dialogType.toUpperCase())}
                        label={`${formatTypeName(dialogType.toUpperCase())} - ${getCashFlowDirection(dialogType.toUpperCase())}`}
                        color={getCashFlowDirectionColor(dialogType.toUpperCase()) as any}
                        size="small"
                        variant="filled"
                      />
                    </Box>
                    <ResponsiveTypography variant="formHelper">
                      {getTypeDescription(dialogType)}
                    </ResponsiveTypography>
                  </Box>
                </Box>
              </Alert>
            )}
            
            <Grid container spacing={3}>
              {/* Left Column */}
              <Grid item xs={12} md={6}>
                <Box sx={{ pr: { md: 1.5 } }}>
                  <MoneyInput
                    value={parseFloat(formData.amount) || 0}
                    onChange={(amount) => setFormData({ ...formData, amount: amount.toString() })}
                    label="Amount"
                    placeholder="Enter amount (e.g., 1,000,000)"
                    required
                    currency={formData.currency}
                    margin="normal"
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
                    <ResponsiveTypography variant="formHelper" sx={{ mt: 0.5, display: 'block' }}>
                      Select the currency for this transaction
                    </ResponsiveTypography>
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
                      <ResponsiveTypography variant="formHelper" sx={{ mt: 0.5, display: 'block' }}>
                        Original Status: {editingCashFlow.status}
                      </ResponsiveTypography>
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
                </Box>
              </Grid>
              
              {/* Right Column */}
              <Grid item xs={12} md={6}>
                <Box sx={{ pl: { md: 1.5 } }}>
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
                </Box>
              </Grid>
              
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <ResponsiveButton 
            onClick={() => {
              resetFormWithAutoFlowDate();
              setDialogOpen(false);
              setError(null);
            }}
            icon={<CancelIcon />}
            mobileText="Cancel"
            desktopText="Cancel"
          >
            Cancel
          </ResponsiveButton>
          <ResponsiveButton
            onClick={handleSubmit}
            variant="contained"
            icon={editingCashFlow ? <EditIcon /> : <AddIcon />}
            mobileText={loading ? (editingCashFlow ? 'Updating...' : 'Creating...') : (editingCashFlow ? 'Update' : 'Create')}
            desktopText={loading ? (editingCashFlow ? 'Updating Cash Flow...' : 'Creating Cash Flow...') : (editingCashFlow ? 'Update Cash Flow' : 'Create Cash Flow')}
            disabled={loading || !formData.amount || parseFloat(formData.amount) <= 0 || isNaN(parseFloat(formData.amount))}
          >
            {loading ? (editingCashFlow ? 'Updating Cash Flow...' : 'Creating Cash Flow...') : (editingCashFlow ? 'Update Cash Flow' : 'Create Cash Flow')}
          </ResponsiveButton>
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
            <ResponsiveTypography variant="pageTitle">Delete Cash Flow</ResponsiveTypography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <ResponsiveTypography variant="tableCell">
            Are you sure you want to delete this cash flow? This action cannot be undone.
          </ResponsiveTypography>
          
          {cashFlowToDelete?.status === 'CANCELLED' && (
            <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
              <ResponsiveTypography variant="tableCell">
                <strong>Warning:</strong> This cash flow is already cancelled and cannot be edited.
              </ResponsiveTypography>
              <ResponsiveTypography variant="formHelper" sx={{ mt: 1, display: 'block' }}>
                You can still delete it to remove it from the history.
              </ResponsiveTypography>
            </Alert>
          )}
          
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              <ResponsiveTypography variant="tableCell">
                <strong>Error:</strong> {deleteError}
              </ResponsiveTypography>
              <ResponsiveTypography variant="formHelper" sx={{ mt: 1, display: 'block' }}>
                Please try again or contact support if the problem persists.
              </ResponsiveTypography>
            </Alert>
          )}
          
          {cashFlowToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <ResponsiveTypography variant="tableCell">
                <strong>Type:</strong> {cashFlowToDelete.type}
              </ResponsiveTypography>
              <ResponsiveTypography variant="tableCell">
                <strong>Amount:</strong> {formatCurrency(cashFlowToDelete.amount, cashFlowToDelete.currency)}
              </ResponsiveTypography>
              <ResponsiveTypography variant="tableCell">
                <strong>Description:</strong> {cashFlowToDelete.description}
              </ResponsiveTypography>
              <ResponsiveTypography variant="tableCell">
                <strong>Status:</strong> {cashFlowToDelete.status}
              </ResponsiveTypography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <ResponsiveButton 
            onClick={() => {
              setDeleteDialogOpen(false);
              setDeleteError(null);
            }}
            icon={<CancelIcon />}
            mobileText="Cancel"
            desktopText="Cancel"
          >
            Cancel
          </ResponsiveButton>
          <ResponsiveButton 
            onClick={confirmDelete} 
            color="error" 
            variant="contained"
            icon={loading ? null : <DeleteIcon />}
            mobileText={loading ? 'Deleting...' : 'Delete'}
            desktopText={loading ? 'Deleting...' : 'Delete'}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </ResponsiveButton>
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
                <ResponsiveTypography variant="pageTitle">Transfer Cash Between Sources</ResponsiveTypography>
                <Chip
                  icon={<TransferIcon />}
                  label="Internal Transfer"
                  color="secondary"
                  size="small"
                  variant="filled"
                />
              </Box>
              <ResponsiveTypography variant="formHelper">
                Move cash from one funding source to another
              </ResponsiveTypography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <ResponsiveTypography variant="tableCell">
                  <strong>Error:</strong> {error}
                </ResponsiveTypography>
                <ResponsiveTypography variant="formHelper" sx={{ mt: 1, display: 'block' }}>
                  Please check your input and try again.
                </ResponsiveTypography>
              </Alert>
            )}
            
            <Grid container spacing={3}>
              {/* Left Column */}
              <Grid item xs={12} md={6}>
                <Box sx={{ pr: { md: 1.5 } }}>
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
                    <ResponsiveTypography variant="formHelper" sx={{ mt: 0.5, display: 'block' }}>
                      Select the source to transfer from
                    </ResponsiveTypography>
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
                    margin="normal"
                    error={!!(transferData.amount && transferData.amount <= 0)}
                    helperText={
                      transferData.amount > 0 
                        ? `Transferring ${formatCurrency(transferData.amount)}` 
                        : 'Enter the amount to transfer'
                    }
                  />
                </Box>
              </Grid>
              
              {/* Right Column */}
              <Grid item xs={12} md={6}>
                <Box sx={{ pl: { md: 1.5 } }}>
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
                </Box>
              </Grid>
            </Grid>

            {/* Transfer Summary */}
            {transferData.fromSource && transferData.toSource && transferData.amount > 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <ResponsiveTypography variant="tableCell" sx={{ fontWeight: 'bold' }}>
                  Transfer Summary:
                </ResponsiveTypography>
                <ResponsiveTypography variant="tableCell">
                  Moving <strong>{formatCurrency(transferData.amount)}</strong> from <strong>{transferData.fromSource}</strong> to <strong>{transferData.toSource}</strong>
                </ResponsiveTypography>
                <ResponsiveTypography variant="formHelper" sx={{ mt: 1, display: 'block' }}>
                  This will create two cash flow records: one withdrawal from source and one deposit to destination.
                </ResponsiveTypography>
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <ResponsiveButton 
            onClick={() => {
              setTransferDialogOpen(false);
              setError(null);
            }}
            icon={<CancelIcon />}
            mobileText="Cancel"
            desktopText="Cancel"
          >
            Cancel
          </ResponsiveButton>
          <ResponsiveButton
            onClick={handleTransferCash}
            variant="contained"
            color="secondary"
            icon={<TransferIcon />}
            mobileText={loading ? 'Transferring...' : 'Transfer'}
            desktopText={loading ? 'Transferring...' : 'Transfer Cash'}
            disabled={
              loading || 
              !transferData.fromSource || 
              !transferData.toSource ||
              transferData.amount <= 0 || 
              transferData.fromSource === transferData.toSource
            }
          >
            {loading ? 'Transferring...' : 'Transfer Cash'}
          </ResponsiveButton>
        </DialogActions>
      </Dialog>
    </Box>
    </LocalizationProvider>
  );
};

export default CashFlowLayout;
