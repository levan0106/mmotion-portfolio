import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { apiService } from '../../services/api';
import { useAccount } from '../../contexts/AccountContext';
import { usePortfolio } from '../../hooks/usePortfolios';
import {
  Box,
  Card,
  CardContent,
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
import CashFlowFormModal from './CashFlowFormModal';
import CashflowDeleteConfirmationModal from './CashflowDeleteConfirmationModal';
import TransferCashModal from './TransferCashModal';
import {
  AccountBalance as DepositIcon,
  AccountBalanceWallet as WithdrawIcon,
  TrendingUp as DividendIcon,
  TrendingUp,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  AccountBalance as BalanceIcon,
  Timeline as TimelineIcon,
  TableChart as TableIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SwapHoriz as TransferIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
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
  const { t } = useTranslation();
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
  const [tabValue, setTabValue] = useState(1);
  const [filterTypes, setFilterTypes] = useState<string[]>(['ALL']);
  
  // Row click edit modal state
  const [rowClickEditModalOpen, setRowClickEditModalOpen] = useState(false);
  const [rowClickEditingCashFlow, setRowClickEditingCashFlow] = useState<CashFlow | null>(null);
  const [dateFilters, setDateFilters] = useState({
    startDate: null as Date | null,
    endDate: null as Date | null,
  });
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const [groupByDate, setGroupByDate] = useState<boolean>(true);
  const [showFilters, setShowFilters] = useState<boolean>(false);

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
      setError(t('cashflow.validation.invalidDates'));
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
      setError(err instanceof Error ? err.message : t('cashflow.error.loadFailed'));
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


  const formatTypeName = (type: string) => {
    return type.replace(/_/g, ' ');
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



  const handleCreateCashFlow = (type: 'deposit' | 'withdrawal' | 'dividend' | 'interest' | 'fee' | 'tax' | 'adjustment') => {
    setDialogType(type);
    setEditingCashFlow(null);
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
    setDialogOpen(true);
  };

  const handleDeleteCashFlow = (cashFlow: CashFlow) => {
    setCashFlowToDelete(cashFlow);
    setDeleteError(null); // Clear previous errors
    setDeleteDialogOpen(true);
  };

  // Handler for row click to open edit modal
  const handleCashFlowRowClick = (cashFlow: CashFlow) => {
    // Check if cash flow is cancelled
    if (cashFlow.status === 'CANCELLED') {
      return; // Don't open edit modal for cancelled cash flows
    }
    
    setRowClickEditingCashFlow(cashFlow);
    setRowClickEditModalOpen(true);
  };

  // Handler to close row click edit modal
  const handleRowClickEditModalClose = () => {
    setRowClickEditModalOpen(false);
    setRowClickEditingCashFlow(null);
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
            {t('cashflow.title')}
          </ResponsiveTypography>
          <Box display="flex" gap={1}>
            <Tooltip title={t('cashflow.refresh')}>
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
              mobileText={t('cashflow.deposit')}
              desktopText={t('cashflow.deposit')}
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
              {compact ? t('cashflow.deposit') : t('cashflow.createDeposit')}
            </ResponsiveButton>
            <ResponsiveButton
              variant="contained"
              color="error"
              icon={<WithdrawIcon />}
              startIcon={<WithdrawIcon />}
              onClick={() => handleCreateCashFlow('withdrawal')}
              size={compact ? "small" : "medium"}
              mobileText={t('cashflow.withdraw')}
              desktopText={t('cashflow.withdrawal')}
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
              {compact ? t('cashflow.withdraw') : t('cashflow.createWithdrawal')}
            </ResponsiveButton>
            <ResponsiveButton
              variant="contained"
              color="info"
              icon={<DividendIcon />}
              startIcon={<DividendIcon />}
              onClick={() => handleCreateCashFlow('dividend')}
              size={compact ? "small" : "medium"}
              mobileText={t('cashflow.dividend')}
              desktopText={t('cashflow.dividend')}
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
              {compact ? t('cashflow.dividend') : t('cashflow.createDividend')}
            </ResponsiveButton>
            <ResponsiveButton
              variant="contained"
              color="secondary"
              icon={<TransferIcon />}
              mobileText={t('cashflow.transfer')}
              desktopText={t('cashflow.transferCash')}
              onClick={() => {
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
              {compact ? t('cashflow.transfer') : t('cashflow.transferCash')}
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
                    {t('cashflow.summary.totalInflows')}
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
                    {t('cashflow.summary.totalOutflows')}
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
                    {t('cashflow.summary.netCashFlow')}
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
                    {t('cashflow.summary.transactions')}
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
              label={t('cashflow.tabs.analytics')} 
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
              label={t('cashflow.tabs.history')} 
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
              {/* Simplified Filter Section */}
              <Box sx={{ mb: compact ? 1.5 : 3 }}>
                {/* Header with Filter Toggle */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={compact ? 0.5 : 2}>
                  <ResponsiveTypography variant="pageTitle" sx={{ fontSize: compact ? '0.9rem' : undefined }}>
                    {t('cashflow.history.title')}
                  </ResponsiveTypography>
                  <Box display="flex" gap={1} alignItems="center">
                    <ResponsiveTypography variant="formHelper">
                      {t('cashflow.history.transactionCount', { count: filteredCashFlows.length })}
                    </ResponsiveTypography>
                    <ResponsiveButton
                      size="small"
                      variant="outlined"
                      icon={<FilterIcon />}
                      mobileText={t('cashflow.filter')}
                      desktopText={t('cashflow.filter')}
                      onClick={() => setShowFilters(!showFilters)}
                      color={showFilters ? 'primary' : 'inherit'}
                    >
                      {t('cashflow.filter')}
                    </ResponsiveButton>
                    <ResponsiveButton
                      size="small"
                      variant="outlined"
                      icon={<RefreshIcon />}
                      mobileText={t('cashflow.refresh')}
                      desktopText={t('cashflow.refresh')}
                      onClick={() => { loadCashFlows(); loadAllCashFlows(); }}
                      disabled={loading}
                    >
                      {t('cashflow.refresh')}
                    </ResponsiveButton>
                  </Box>
                </Box>

                {/* Collapsible Filter Section */}
                {showFilters && (
                  <Box sx={{ 
                    mb: 2, 
                    p: 2, 
                    border: '1px solid', 
                    borderColor: 'divider', 
                    borderRadius: 2,
                    backgroundColor: 'background.paper'
                  }}>
                    <Grid container spacing={2}>
                      {/* Date Filters */}
                      <Grid item xs={12} md={6}>
                        <Box>
                          <ResponsiveTypography variant="formLabel" sx={{ mb: 1, display: 'block' }}>
                            {t('cashflow.filters.dateRange')}
                          </ResponsiveTypography>
                          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                            <DatePicker
                              label={t('cashflow.filters.from')}
                              value={dateFilters.startDate}
                              onChange={(date) => setDateFilters(prev => ({ ...prev, startDate: date }))}
                              slotProps={{ 
                                textField: { 
                                  size: 'small',
                                  sx: { minWidth: 160 },
                                  error: false,
                                  helperText: ''
                                } 
                              }}
                              format="dd/MM/yyyy"
                            />
                            <DatePicker
                              label={t('cashflow.filters.to')}
                              value={dateFilters.endDate}
                              onChange={(date) => setDateFilters(prev => ({ ...prev, endDate: date }))}
                              slotProps={{ 
                                textField: { 
                                  size: 'small',
                                  sx: { minWidth: 160 },
                                  error: false,
                                  helperText: ''
                                } 
                              }}
                              format="dd/MM/yyyy"
                            />
                          </Box>
                        </Box>
                      </Grid>

                      {/* Type Filter */}
                      <Grid item xs={12} md={6}>
                        <Box>
                          <ResponsiveTypography variant="formLabel" sx={{ mb: 1, display: 'block' }}>
                            {t('cashflow.filters.transactionTypes')}
                          </ResponsiveTypography>
                          <FormControl fullWidth size="small">
                            <InputLabel>{t('cashflow.filters.type')}</InputLabel>
                            <Select
                              multiple
                              value={filterTypes}
                              label={t('cashflow.filters.type')}
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
                              input={<OutlinedInput label={t('cashflow.filters.type')} />}
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
                                <ListItemText primary={t('cashflow.filters.allTypes')} />
                              </MenuItem>
                              <MenuItem value="DEPOSIT">
                                <Checkbox checked={filterTypes.includes('DEPOSIT')} />
                                <ListItemText primary={t('cashflow.filters.deposits')} />
                              </MenuItem>
                              <MenuItem value="WITHDRAWAL">
                                <Checkbox checked={filterTypes.includes('WITHDRAWAL')} />
                                <ListItemText primary={t('cashflow.filters.withdrawals')} />
                              </MenuItem>
                              <MenuItem value="DIVIDEND">
                                <Checkbox checked={filterTypes.includes('DIVIDEND')} />
                                <ListItemText primary={t('cashflow.filters.dividends')} />
                              </MenuItem>
                              <MenuItem value="INTEREST">
                                <Checkbox checked={filterTypes.includes('INTEREST')} />
                                <ListItemText primary={t('cashflow.filters.interest')} />
                              </MenuItem>
                              <MenuItem value="FEE">
                                <Checkbox checked={filterTypes.includes('FEE')} />
                                <ListItemText primary={t('cashflow.filters.fees')} />
                              </MenuItem>
                              <MenuItem value="TAX">
                                <Checkbox checked={filterTypes.includes('TAX')} />
                                <ListItemText primary={t('cashflow.filters.taxes')} />
                              </MenuItem>
                              <MenuItem value="ADJUSTMENT">
                                <Checkbox checked={filterTypes.includes('ADJUSTMENT')} />
                                <ListItemText primary={t('cashflow.filters.adjustments')} />
                              </MenuItem>
                              <MenuItem value="BUY_TRADE">
                                <Checkbox checked={filterTypes.includes('BUY_TRADE')} />
                                <ListItemText primary={t('cashflow.filters.buyTrades')} />
                              </MenuItem>
                              <MenuItem value="SELL_TRADE">
                                <Checkbox checked={filterTypes.includes('SELL_TRADE')} />
                                <ListItemText primary={t('cashflow.filters.sellTrades')} />
                              </MenuItem>
                              <MenuItem value="DEPOSIT_SETTLEMENT">
                                <Checkbox checked={filterTypes.includes('DEPOSIT_SETTLEMENT')} />
                                <ListItemText primary={t('cashflow.filters.depositSettlements')} />
                              </MenuItem>
                              <MenuItem value="DEPOSIT_CREATION">
                                <Checkbox checked={filterTypes.includes('DEPOSIT_CREATION')} />
                                <ListItemText primary={t('cashflow.filters.depositCreations')} />
                              </MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Filter Actions */}
                    <Box display="flex" gap={1} mt={2} justifyContent="flex-end" alignItems="center">
                      <ResponsiveButton
                        size="small"
                        variant="contained"
                        icon={<SearchIcon />}
                        mobileText={t('cashflow.filters.apply')}
                        desktopText={t('cashflow.filters.applyFilters')}
                        onClick={handleApplyFilters}
                        disabled={loading}
                      >
                        {t('cashflow.filters.applyFilters')}
                      </ResponsiveButton>
                    </Box>
                  </Box>
                )}


                {/* Active Filters Display */}
                {((dateFilters.startDate && !isNaN(dateFilters.startDate.getTime())) || (dateFilters.endDate && !isNaN(dateFilters.endDate.getTime())) || (filterTypes.length > 0 && !filterTypes.includes('ALL'))) && (
                  <Box sx={{ mb: 2, p: 1, backgroundColor: 'grey.100', borderRadius: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <ResponsiveTypography variant="formHelper">
                        {t('cashflow.filters.activeFilters')}:
                      </ResponsiveTypography>
                      <ResponsiveButton
                        size="small"
                        variant="text"
                        icon={<ClearIcon />}
                        mobileText={t('cashflow.filters.reset')}
                        desktopText={t('cashflow.filters.resetAll')}
                        onClick={() => {
                          setFilterTypes(['ALL']);
                          setDateFilters({ startDate: null, endDate: null });
                        }}
                        sx={{ 
                          fontSize: '0.75rem',
                          minWidth: 'auto',
                          px: 1,
                          py: 0.5,
                          color: 'text.secondary',
                          '&:hover': {
                            backgroundColor: 'action.hover',
                            color: 'text.primary'
                          }
                        }}
                      >
                        {t('cashflow.filters.resetAll')}
                      </ResponsiveButton>
                    </Box>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {dateFilters.startDate && !isNaN(dateFilters.startDate.getTime()) && (
                        <Chip
                          label={`${t('cashflow.filters.from')}: ${formatDate(dateFilters.startDate.toISOString())}`}
                          size="small"
                          onDelete={() => setDateFilters(prev => ({ ...prev, startDate: null }))}
                        />
                      )}
                      {dateFilters.endDate && !isNaN(dateFilters.endDate.getTime()) && (
                        <Chip
                          label={`${t('cashflow.filters.to')}: ${formatDate(dateFilters.endDate.toISOString())}`}
                          size="small"
                          onDelete={() => setDateFilters(prev => ({ ...prev, endDate: null }))}
                        />
                      )}
                      {filterTypes.length > 0 && !filterTypes.includes('ALL') && (
                        <Chip
                          label={`${t('cashflow.filters.types')}: ${filterTypes.join(', ')}`}
                          size="small"
                          onDelete={() => setFilterTypes(['ALL'])}
                        />
                      )}
                    </Box>
                  </Box>
                )}
                
              </Box>

              {/* Table Controls */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap">
                <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                  <ResponsiveButton
                    variant="text"
                    icon={<CalendarIcon />}
                    mobileText={t('cashflow.table.group')}
                    desktopText={t('cashflow.table.groupByDate')}
                    onClick={() => setGroupByDate(!groupByDate)}
                    size="small"
                    sx={{ 
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      minWidth: 'auto',
                      px: 1,
                      py: 0.5,
                      color: groupByDate ? 'primary.main' : 'text.secondary',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        color: groupByDate ? 'primary.dark' : 'text.primary'
                      }
                    }}
                  >
                    {t('cashflow.table.groupByDate')}
                  </ResponsiveButton>
                  
                  {groupByDate && Object.keys(groupedCashFlows).length > 1 && (
                    <ResponsiveButton
                      size="small"
                      variant="text"
                      icon={collapsedDates.size === Object.keys(groupedCashFlows).length ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                      mobileText={collapsedDates.size === Object.keys(groupedCashFlows).length ? t('cashflow.table.expand') : t('cashflow.table.collapse')}
                      desktopText={collapsedDates.size === Object.keys(groupedCashFlows).length ? t('cashflow.table.expandAll') : t('cashflow.table.collapseAll')}
                      onClick={toggleAllDatesCollapse}
                      sx={{ 
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        minWidth: 'auto',
                        px: 1,
                        py: 0.5,
                        color: 'text.secondary',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          color: 'text.primary'
                        }
                      }}
                    >
                      {collapsedDates.size === Object.keys(groupedCashFlows).length ? t('cashflow.table.expandAll') : t('cashflow.table.collapseAll')}
                    </ResponsiveButton>
                  )}
                </Box>
                
                <ResponsiveTypography variant="formHelper">
                  {t('cashflow.table.total')}: <strong>{formatCurrency(filteredTotal, 'VND')}</strong> ({t('cashflow.table.items', { count: filteredCashFlows.length })})
                </ResponsiveTypography>
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
                            {t('cashflow.table.type')}
                          </ResponsiveTypography>
                        </TableCell>
                        <TableCell>
                          <ResponsiveTypography variant="tableHeaderSmall" sx={{ fontWeight: 600 }}>
                            {t('cashflow.table.amount')}
                          </ResponsiveTypography>
                        </TableCell>
                        <TableCell>
                          <ResponsiveTypography variant="tableHeaderSmall" sx={{ fontWeight: 600 }}>
                            {t('cashflow.table.description')}
                          </ResponsiveTypography>
                        </TableCell>
                        <TableCell>
                          <ResponsiveTypography variant="tableHeaderSmall" sx={{ fontWeight: 600 }}>
                            {t('cashflow.table.reference')}
                          </ResponsiveTypography>
                        </TableCell>
                        <TableCell>
                          <ResponsiveTypography variant="tableHeaderSmall" sx={{ fontWeight: 600 }}>
                            {t('cashflow.table.fundingSource')}
                          </ResponsiveTypography>
                        </TableCell>
                        <TableCell>
                          <ResponsiveTypography variant="tableHeaderSmall" sx={{ fontWeight: 600 }}>
                            {t('cashflow.table.date')}
                          </ResponsiveTypography>
                        </TableCell>
                        <TableCell>
                          <ResponsiveTypography variant="tableHeaderSmall" sx={{ fontWeight: 600 }}>
                            {t('cashflow.table.status')}
                          </ResponsiveTypography>
                        </TableCell>
                        <TableCell>
                          <ResponsiveTypography variant="tableHeaderSmall" sx={{ fontWeight: 600 }}>
                            {t('cashflow.table.actions')}
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
                                      ({t('cashflow.table.transactionCount', { count: cashFlows.length })})
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
                            <TableRow 
                              key={cashFlow.cashflowId} 
                              hover
                              onClick={() => handleCashFlowRowClick(cashFlow)}
                              sx={{ 
                                cursor: cashFlow.status === 'CANCELLED' ? 'default' : 'pointer',
                                '&:hover': {
                                  backgroundColor: cashFlow.status === 'CANCELLED' ? 'inherit' : 'action.hover'
                                }
                              }}
                            >
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
                                  variant="tableCell"
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
                                  <Tooltip title={cashFlow.status === 'CANCELLED' ? t('cashflow.tooltips.cannotEditCancelled') : t('cashflow.tooltips.edit')}>
                                    <span>
                                      <IconButton
                                        size="small"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditCashFlow(cashFlow);
                                        }}
                                        color="primary"
                                        disabled={cashFlow.status === 'CANCELLED'}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                  <Tooltip title={t('cashflow.tooltips.delete')}>
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteCashFlow(cashFlow);
                                      }}
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
                        {t('cashflow.pagination.showing', { 
                          start: ((pagination.page - 1) * pagination.limit) + 1, 
                          end: Math.min(pagination.page * pagination.limit, pagination.total), 
                          total: pagination.total 
                        })}
                      </ResponsiveTypography>
                      <FormControl size="small" sx={{ minWidth: 80 }}>
                        <InputLabel>{t('cashflow.pagination.perPage')}</InputLabel>
                        <Select
                          value={pagination.limit}
                          onChange={handlePageSizeChange}
                          label={t('cashflow.pagination.perPage')}
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
      <CashFlowFormModal
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setError(null);
        }}
        onSubmit={async (formData) => {
          try {
            setLoading(true);
                setError(null);

            const payload = {
              portfolioId: portfolioId,
              amount: parseFloat(formData.amount),
              type: dialogType.toUpperCase(),
              description: formData.description,
              reference: formData.reference || undefined,
              flowDate: formData.flowDate ? formData.flowDate : undefined,
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
            setDialogOpen(false);
            setEditingCashFlow(null);
            setError(null); // Clear error on success
            
            await loadCashFlows();
            await loadAllCashFlows(); // Reload all cash flows for summary
            onCashFlowUpdate?.();
          } catch (err) {
            setError(err instanceof Error ? err.message : t('cashflow.error.createFailed', { action: editingCashFlow ? 'update' : 'create' }));
          } finally {
            setLoading(false);
          }
        }}
        dialogType={dialogType}
        editingCashFlow={editingCashFlow}
        loading={loading}
        error={error}
        portfolioFundingSource={portfolio?.fundingSource || ''}
      />

      {/* Delete Confirmation Dialog */}
      <CashflowDeleteConfirmationModal
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeleteError(null);
        }}
        onConfirm={async () => {
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
        }}
        cashFlowToDelete={cashFlowToDelete}
        loading={loading}
        error={deleteError}
      />

      {/* Transfer Cash Dialog */}
      <TransferCashModal
        open={transferDialogOpen}
        onClose={() => {
          setTransferDialogOpen(false);
          setError(null);
        }}
        onSubmit={async (transferData) => {
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
              // Fix timezone issue: handle both ISO string and date string formats
              transferDate: (() => {
                let dateStr = transferData.transferDate;
                if (dateStr.includes('T')) {
                  // If it's already an ISO string, extract date part
                  dateStr = dateStr.split('T')[0];
                }
                // Append 'T12:00:00' to ensure local time interpretation
                return new Date(dateStr + 'T12:00:00').toISOString();
              })(),
            };

            await apiService.transferCashFlow(portfolioId, accountId, payload);

            // Reset form and close dialog
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
        }}
        loading={loading}
        error={error}
        portfolioId={portfolioId}
      />

      {/* Row Click Edit Modal */}
      <CashFlowFormModal
        open={rowClickEditModalOpen}
        onClose={handleRowClickEditModalClose}
        onSubmit={async (formData) => {
          try {
            setLoading(true);
            setError(null);

            const payload = {
              portfolioId: portfolioId,
              amount: parseFloat(formData.amount),
              type: rowClickEditingCashFlow?.type || 'DEPOSIT',
              description: formData.description,
              reference: formData.reference || undefined,
              flowDate: formData.flowDate ? formData.flowDate : undefined,
              currency: formData.currency,
              status: formData.status,
              fundingSource: formData.fundingSource || undefined,
            };

            if (rowClickEditingCashFlow) {
              await apiService.updateCashFlow(portfolioId, accountId, rowClickEditingCashFlow.cashflowId, payload);
            }

            // Close modal and refresh data
            handleRowClickEditModalClose();
            setError(null);
            
            await loadCashFlows();
            await loadAllCashFlows();
            onCashFlowUpdate?.();
          } catch (err) {
            setError(err instanceof Error ? err.message : t('cashflow.error.updateFailed'));
          } finally {
            setLoading(false);
          }
        }}
        dialogType={rowClickEditingCashFlow?.type.toLowerCase() as any || 'deposit'}
        editingCashFlow={rowClickEditingCashFlow}
        loading={loading}
        error={error}
        portfolioFundingSource={portfolio?.fundingSource || ''}
      />
    </Box>
    </LocalizationProvider>
  );
};

export default CashFlowLayout;
