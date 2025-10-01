import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  Paper,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  AccountBalance as BankIcon,
  TrendingUp as InterestIcon,
  CheckCircle as SettledIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import DepositForm from '../components/Deposit/DepositForm';
import DepositList from '../components/Deposit/DepositList';
import DepositSettlementModal from '../components/Deposit/DepositSettlementModal';
import DepositDetailsModal from '../components/Deposit/DepositDetailsModal';
import { apiService } from '../services/api';
import { formatCurrency, formatPercentage } from '../utils/format';
import { useAccount } from '../contexts/AccountContext';

interface Deposit {
  depositId: string;
  portfolioId: string;
  bankName: string;
  accountNumber?: string;
  principal: number;
  interestRate: number;
  startDate: string;
  endDate: string;
  termMonths?: number;
  status: 'ACTIVE' | 'SETTLED';
  actualInterest?: number;
  notes?: string;
  accruedInterest: number;
  totalValue: number;
  isMatured: boolean;
  canBeEdited: boolean;
  canBeSettled: boolean;
  daysUntilMaturity: number;
  termDescription: string;
  createdAt: string;
  updatedAt: string;
  settledAt?: string;
}


interface Portfolio {
  portfolioId: string;
  name: string;
}

const DepositManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [depositFormOpen, setDepositFormOpen] = useState(false);
  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [editingDeposit, setEditingDeposit] = useState<Deposit | null>(null);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const queryClient = useQueryClient();
  const { accountId } = useAccount();

  // Fetch portfolios for dropdown
  const { data: portfolios = [] } = useQuery(
    ['portfolios', accountId],
    () => apiService.getPortfolios(accountId),
    {
      enabled: !!accountId,
    }
  );

  // Fetch deposits with filters
  const { data: depositsResponse, isLoading: depositsLoading, error: depositsError } = useQuery(
    ['deposits', { searchTerm, statusFilter, portfolioId: selectedPortfolioId }],
    () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('bankName', searchTerm);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (selectedPortfolioId !== 'ALL') {
        params.append('portfolioId', selectedPortfolioId);
      }
      
      return apiService.getDeposits({ portfolioId: selectedPortfolioId });
    },
    {
      enabled: true,
    }
  );

  // Extract deposits array from response
  // For /api/v1/deposits endpoint, response has structure { data: [...], pagination: {...} }
  const deposits = Array.isArray(depositsResponse) 
    ? depositsResponse 
    : Array.isArray(depositsResponse?.data) 
      ? depositsResponse.data 
      : [];

  // Fetch deposit analytics based on selected portfolio
  const { data: analytics } = useQuery(
    ['deposit-analytics', { portfolioId: selectedPortfolioId }],
    () => {
      const params = new URLSearchParams();
      if (selectedPortfolioId !== 'ALL') {
        params.append('portfolioId', selectedPortfolioId);
      }
      return apiService.getDepositAnalytics({ portfolioId: selectedPortfolioId });
    },
    {
      enabled: true,
    }
  );

  // Create deposit mutation
  const createDepositMutation = useMutation(
    (data: any) => apiService.createDeposit(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['deposits']);
        queryClient.invalidateQueries(['deposit-analytics-global']);
        toast.success('Tạo tiền gửi thành công!');
        setDepositFormOpen(false);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo tiền gửi');
      },
    }
  );

  // Update deposit mutation
  const updateDepositMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => apiService.updateDeposit(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['deposits']);
        queryClient.invalidateQueries(['deposit-analytics-global']);
        toast.success('Cập nhật tiền gửi thành công!');
        setDepositFormOpen(false);
        setEditingDeposit(null);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật tiền gửi');
      },
    }
  );

  // Settle deposit mutation
  const settleDepositMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => apiService.settleDeposit(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['deposits']);
        queryClient.invalidateQueries(['deposit-analytics-global']);
        toast.success('Tất toán tiền gửi thành công!');
        setSettlementModalOpen(false);
        setSelectedDeposit(null);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tất toán tiền gửi');
      },
    }
  );

  // Delete deposit mutation
  const deleteDepositMutation = useMutation(
    (id: string) => apiService.deleteDeposit(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['deposits']);
        queryClient.invalidateQueries(['deposit-analytics-global']);
        toast.success('Xóa tiền gửi thành công!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xóa tiền gửi');
      },
    }
  );

  const handleCreateDeposit = (data: any) => {
    createDepositMutation.mutate(data);
  };

  const handleUpdateDeposit = (data: any) => {
    if (editingDeposit) {
      updateDepositMutation.mutate({ id: editingDeposit.depositId, data });
    }
  };

  const handleSettleDeposit = (data: any) => {
    if (selectedDeposit) {
      settleDepositMutation.mutate({ id: selectedDeposit.depositId, data });
    }
  };

  const handleDeleteDeposit = (deposit: Deposit) => {
    deleteDepositMutation.mutate(deposit.depositId || '');
  };

  const handleEditDeposit = (deposit: Deposit) => {
    setEditingDeposit(deposit);
    setDepositFormOpen(true);
  };

  const handleSettleDepositClick = (deposit: Deposit) => {
    setSelectedDeposit(deposit);
    setSettlementModalOpen(true);
  };

  const handleViewDetails = (deposit: Deposit) => {
    setSelectedDeposit(deposit);
    setDetailsModalOpen(true);
  };


  const activeDeposits = deposits.filter((d: Deposit) => d.status === 'ACTIVE');
  const settledDeposits = deposits.filter((d: Deposit) => d.status === 'SETTLED');
  const maturedDeposits = deposits.filter((d: Deposit) => d.isMatured && d.status === 'ACTIVE');

  if (depositsError) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Alert severity="error">
          Có lỗi xảy ra khi tải dữ liệu tiền gửi
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Quản lý tiền gửi
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              queryClient.invalidateQueries(['deposits']);
              queryClient.invalidateQueries(['deposit-analytics']);
            }}
          >
            Làm mới
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDepositFormOpen(true)}
            disabled={createDepositMutation.isLoading || selectedPortfolioId === 'ALL'}
          >
            Tạo tiền gửi mới
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Tìm kiếm theo ngân hàng"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              select
              label="Trạng thái"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="ALL">Tất cả</MenuItem>
              <MenuItem value="ACTIVE">Đang hoạt động</MenuItem>
              <MenuItem value="SETTLED">Đã tất toán</MenuItem>
            </TextField>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              select
              label="Portfolio"
              value={selectedPortfolioId}
              onChange={(e) => setSelectedPortfolioId(e.target.value)}
            >
              <MenuItem value="ALL">Tất cả portfolios</MenuItem>
              {portfolios.map((portfolio: Portfolio) => (
                <MenuItem key={portfolio.portfolioId} value={portfolio.portfolioId}>
                  {portfolio.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
              }}
            >
              Xóa bộ lọc
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Analytics Cards */}
      {analytics && (
        <Grid container spacing={2} mb={3}>
          {/* Card 1: Tổng quan */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <BankIcon color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Tổng quan
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">Tổng số tiền gửi:</Typography>
                  <Typography variant="body2" fontWeight="medium">{analytics?.totalDeposits || 0}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">Đang hoạt động:</Typography>
                  <Typography variant="body2" fontWeight="medium" color="info.main">{analytics?.activeDeposits || 0}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Đã tất toán:</Typography>
                  <Typography variant="body2" fontWeight="medium" color="warning.main">{analytics?.settledDeposits || 0}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 2: Tổng giá trị */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <InterestIcon color="success" />
                  <Typography variant="h6" fontWeight="bold">
                    Tổng giá trị
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">Tổng giá trị:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    {formatCurrency(analytics?.totalValue)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">Tổng gốc:</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatCurrency(analytics?.totalPrincipal || 0)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Lãi suất TB:</Typography>
                  <Typography variant="body2" fontWeight="medium" color="secondary.main">
                    {analytics?.averageInterestRate ? `${formatPercentage(analytics.averageInterestRate)}` : 'N/A'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 3: Lãi đã tất toán */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <SettledIcon color="success" />
                  <Typography variant="h6" fontWeight="bold">
                    Lãi đã tất toán
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">Lãi đã tất toán:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="success.main">
                    {formatCurrency(analytics?.totalSettledInterest || 0)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">Số lượng:</Typography>
                  <Typography variant="body2" fontWeight="medium" color="warning.main">
                    {analytics?.settledDeposits || 0} deposits
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Trung bình:</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {analytics?.settledDeposits ? formatCurrency((analytics?.totalSettledInterest || 0) / analytics.settledDeposits) : 'N/A'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 4: Lãi chưa tất toán */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <TrendingUpIcon color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Lãi chưa tất toán
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">Lãi chưa tất toán:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="primary.main">
                    {formatCurrency(analytics?.totalAccruedInterest || 0)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">Số lượng:</Typography>
                  <Typography variant="body2" fontWeight="medium" color="info.main">
                    {analytics?.activeDeposits || 0} deposits
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Trung bình:</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {analytics?.activeDeposits ? formatCurrency((analytics?.totalAccruedInterest || 0) / analytics.activeDeposits) : 'N/A'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ px: 2 }}
        >
          <Tab label={`Tất cả (${deposits.length})`} />
          <Tab label={`Đang hoạt động (${activeDeposits.length})`} />
          <Tab label={`Đã tất toán (${settledDeposits.length})`} />
          <Tab label={`Đã đến hạn (${maturedDeposits.length})`} />
        </Tabs>
      </Paper>

      {/* Deposit List */}
      {depositsLoading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <DepositList
          deposits={
            tabValue === 0 ? deposits :
            tabValue === 1 ? activeDeposits :
            tabValue === 2 ? settledDeposits :
            maturedDeposits
          }
          onEdit={handleEditDeposit}
          onSettle={handleSettleDepositClick}
          onDelete={handleDeleteDeposit}
          onViewDetails={handleViewDetails}
        />
      )}

      {/* Deposit Form Modal */}
      <DepositForm
        open={depositFormOpen}
        onClose={() => {
          setDepositFormOpen(false);
          setEditingDeposit(null);
        }}
        onSubmit={editingDeposit ? handleUpdateDeposit : handleCreateDeposit}
        portfolioId={selectedPortfolioId !== 'ALL' ? selectedPortfolioId : portfolios[0]?.portfolioId || ''}
        initialData={editingDeposit ? {
          portfolioId: editingDeposit.portfolioId,
          bankName: editingDeposit.bankName,
          accountNumber: editingDeposit.accountNumber,
          principal: editingDeposit.principal,
          interestRate: editingDeposit.interestRate,
          startDate: editingDeposit.startDate,
          endDate: editingDeposit.endDate,
          termMonths: editingDeposit.termMonths,
          notes: editingDeposit.notes,
        } : undefined}
        isEdit={!!editingDeposit}
      />

      {/* Settlement Modal */}
      <DepositSettlementModal
        open={settlementModalOpen}
        onClose={() => {
          setSettlementModalOpen(false);
          setSelectedDeposit(null);
        }}
        onSubmit={handleSettleDeposit}
        deposit={selectedDeposit}
      />

      {/* Details Modal */}
      <DepositDetailsModal
        open={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedDeposit(null);
        }}
        deposit={selectedDeposit}
        onSettle={handleSettleDepositClick}
      />
    </Container>
  );
};

export default DepositManagement;
