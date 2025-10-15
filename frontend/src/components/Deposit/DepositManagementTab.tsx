import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import { ResponsiveTypography, ResponsiveButton } from '../Common';
import {
  Add as AddIcon,
  AccountBalance as BankIcon,
  TrendingUp as InterestIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as SettledIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import DepositForm from './DepositForm';
import DepositList from './DepositList';
import DepositSettlementModal from './DepositSettlementModal';
import DepositDetailsModal from './DepositDetailsModal';
import { apiService } from '../../services/api';
import { formatCurrency, formatPercentage } from '../../utils/format';

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

interface DepositManagementTabProps {
  portfolioId: string;
  compact?: boolean;
}

const DepositManagementTab: React.FC<DepositManagementTabProps> = ({ portfolioId, compact = false }) => {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const [depositFormOpen, setDepositFormOpen] = useState(false);
  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [editingDeposit, setEditingDeposit] = useState<Deposit | null>(null);

  const queryClient = useQueryClient();

  // Fetch deposits
  const { data: depositsResponse, isLoading: depositsLoading, error: depositsError } = useQuery(
    ['deposits', portfolioId],
    () => apiService.getPortfolioDeposits(portfolioId),
    {
      enabled: !!portfolioId,
    }
  );

  // Extract deposits array from response
  const deposits = Array.isArray(depositsResponse) ? depositsResponse : [];

  // Fetch deposit analytics
  const { data: analytics } = useQuery(
    ['deposit-analytics', portfolioId],
    () => apiService.getPortfolioDepositAnalytics(portfolioId),
    {
      enabled: !!portfolioId,
    }
  );

  // Create deposit mutation
  const createDepositMutation = useMutation(
    (data: any) => apiService.createDeposit(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['deposits', portfolioId]);
        queryClient.invalidateQueries(['deposit-analytics', portfolioId]);
        toast.success(t('deposit.createSuccess'));
        setDepositFormOpen(false);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || t('deposit.createError'));
      },
    }
  );

  // Update deposit mutation
  const updateDepositMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => apiService.updateDeposit(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['deposits', portfolioId]);
        queryClient.invalidateQueries(['deposit-analytics', portfolioId]);
        toast.success(t('deposit.updateSuccess'));
        setDepositFormOpen(false);
        setEditingDeposit(null);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || t('deposit.updateError'));
      },
    }
  );

  // Settle deposit mutation
  const settleDepositMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => apiService.settleDeposit(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['deposits', portfolioId]);
        queryClient.invalidateQueries(['deposit-analytics', portfolioId]);
        toast.success(t('deposit.settleSuccess'));
        setSettlementModalOpen(false);
        setSelectedDeposit(null);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || t('deposit.settleError'));
      },
    }
  );

  // Delete deposit mutation
  const deleteDepositMutation = useMutation(
    (id: string) => apiService.deleteDeposit(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['deposits', portfolioId]);
        queryClient.invalidateQueries(['deposit-analytics', portfolioId]);
        toast.success(t('deposit.deleteSuccess'));
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || t('deposit.deleteError'));
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
      <Alert severity="error" sx={{ mt: 2 }}>
        {t('deposit.loadError')}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={compact ? 2 : 3}>
        <ResponsiveTypography variant={compact ? "h5" : "h4"} fontWeight="bold" sx={{ fontSize: compact ? '1.1rem' : undefined }}>
          {t('deposit.management')}
        </ResponsiveTypography>
        <ResponsiveButton
          variant="contained"
          icon={<AddIcon />}
          mobileText={t('deposit.createNew')}
          desktopText={t('deposit.createNewDeposit')}
          onClick={() => setDepositFormOpen(true)}
          disabled={createDepositMutation.isLoading}
          size={compact ? "small" : "medium"}
          sx={{
            px: compact ? 1.5 : 2,
            py: compact ? 0.5 : 1,
            fontSize: compact ? '0.8rem' : undefined
          }}
        >
          {compact ? t('deposit.createNew') : t('deposit.createNewDeposit')}
        </ResponsiveButton>
      </Box>

      {/* Analytics Cards */}
      {analytics && (
        <Grid container spacing={compact ? 1.5 : 2} mb={compact ? 2 : 3}>
          {/* Card 1: Tổng quan */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ 
                px: compact ? 1.5 : 2, 
                py: compact ? 1 : 2 
              }}>
                <Box display="flex" alignItems="center" gap={compact ? 0.5 : 1} mb={compact ? 1 : 2}>
                  <BankIcon color="primary" sx={{ fontSize: compact ? 18 : 24 }} />
                  <ResponsiveTypography variant={compact ? "subtitle1" : "h6"} fontWeight="bold" sx={{ fontSize: compact ? '0.9rem' : undefined }}>
                    {t('deposit.overview')}
                  </ResponsiveTypography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <ResponsiveTypography variant="body2" color="text.secondary">{t('deposit.totalDeposits')}:</ResponsiveTypography>
                  <ResponsiveTypography variant="body2" fontWeight="medium">{analytics?.totalDeposits || 0}</ResponsiveTypography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <ResponsiveTypography variant="body2" color="text.secondary">{t('deposit.activeDeposits')}:</ResponsiveTypography>
                  <ResponsiveTypography variant="body2" fontWeight="medium" color="info.main">{analytics?.activeDeposits || 0}</ResponsiveTypography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <ResponsiveTypography variant="body2" color="text.secondary">{t('deposit.settledDeposits')}:</ResponsiveTypography>
                  <ResponsiveTypography variant="body2" fontWeight="medium" color="warning.main">{analytics?.settledDeposits || 0}</ResponsiveTypography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 2: Tổng giá trị */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ 
                px: compact ? 1.5 : 2, 
                py: compact ? 1 : 2 
              }}>
                <Box display="flex" alignItems="center" gap={compact ? 0.5 : 1} mb={compact ? 1 : 2}>
                  <InterestIcon color="success" sx={{ fontSize: compact ? 18 : 24 }} />
                  <ResponsiveTypography variant={compact ? "subtitle1" : "h6"} fontWeight="bold" sx={{ fontSize: compact ? '0.9rem' : undefined }}>
                    {t('deposit.totalValue')}
                  </ResponsiveTypography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <ResponsiveTypography variant="body2" color="text.secondary">{t('deposit.totalValue')}:</ResponsiveTypography>
                  <ResponsiveTypography variant="body2" fontWeight="bold" color="success.main">
                    {formatCurrency(analytics?.totalValue)}
                  </ResponsiveTypography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <ResponsiveTypography variant="body2" color="text.secondary">{t('deposit.totalPrincipal')}:</ResponsiveTypography>
                  <ResponsiveTypography variant="body2" fontWeight="medium">
                    {formatCurrency(analytics?.totalPrincipal || 0)}
                  </ResponsiveTypography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <ResponsiveTypography variant="body2" color="text.secondary">{t('deposit.averageInterestRate')}:</ResponsiveTypography>
                  <ResponsiveTypography variant="body2" fontWeight="medium" color="secondary.main">
                    {analytics?.averageInterestRate ? `${formatPercentage(analytics.averageInterestRate)}` : 'N/A'}
                  </ResponsiveTypography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 3: Lãi đã tất toán */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ 
                px: compact ? 1.5 : 2, 
                py: compact ? 1 : 2 
              }}>
                <Box display="flex" alignItems="center" gap={compact ? 0.5 : 1} mb={compact ? 1 : 2}>
                  <SettledIcon color="success" sx={{ fontSize: compact ? 18 : 24 }} />
                  <ResponsiveTypography variant={compact ? "subtitle1" : "h6"} fontWeight="bold" sx={{ fontSize: compact ? '0.9rem' : undefined }}>
                    {t('deposit.settledInterest')}
                  </ResponsiveTypography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <ResponsiveTypography variant="body2" color="text.secondary">{t('deposit.settledInterest')}:</ResponsiveTypography>
                  <ResponsiveTypography variant="body2" fontWeight="bold" color="success.main">
                    {formatCurrency(analytics?.totalSettledInterest || 0)}
                  </ResponsiveTypography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <ResponsiveTypography variant="body2" color="text.secondary">{t('common.quantity')}:</ResponsiveTypography>
                  <ResponsiveTypography variant="body2" fontWeight="medium" color="warning.main">
                    {analytics?.settledDeposits || 0} deposits
                  </ResponsiveTypography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <ResponsiveTypography variant="body2" color="text.secondary">{t('deposit.average')}:</ResponsiveTypography>
                  <ResponsiveTypography variant="body2" fontWeight="medium">
                    {analytics?.settledDeposits ? formatCurrency((analytics?.totalSettledInterest || 0) / analytics.settledDeposits) : 'N/A'}
                  </ResponsiveTypography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 4: Lãi chưa tất toán */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ 
                px: compact ? 1.5 : 2, 
                py: compact ? 1 : 2 
              }}>
                <Box display="flex" alignItems="center" gap={compact ? 0.5 : 1} mb={compact ? 1 : 2}>
                  <TrendingUpIcon color="primary" sx={{ fontSize: compact ? 18 : 24 }} />
                  <ResponsiveTypography variant={compact ? "subtitle1" : "h6"} fontWeight="bold" sx={{ fontSize: compact ? '0.9rem' : undefined }}>
                    {t('deposit.accruedInterest')}
                  </ResponsiveTypography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <ResponsiveTypography variant="body2" color="text.secondary">{t('deposit.accruedInterest')}:</ResponsiveTypography>
                  <ResponsiveTypography variant="body2" fontWeight="bold" color="primary.main">
                    {formatCurrency(analytics?.totalAccruedInterest || 0)}
                  </ResponsiveTypography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <ResponsiveTypography variant="body2" color="text.secondary">{t('common.quantity')}:</ResponsiveTypography>
                  <ResponsiveTypography variant="body2" fontWeight="medium" color="info.main">
                    {analytics?.activeDeposits || 0} deposits
                  </ResponsiveTypography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <ResponsiveTypography variant="body2" color="text.secondary">{t('deposit.average')}:</ResponsiveTypography>
                  <ResponsiveTypography variant="body2" fontWeight="medium">
                    {analytics?.activeDeposits ? formatCurrency((analytics?.totalAccruedInterest || 0) / analytics.activeDeposits) : 'N/A'}
                  </ResponsiveTypography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: compact ? 1.5 : 2 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ 
            px: compact ? 1.5 : 2,
            '& .MuiTab-root': {
              fontSize: compact ? '0.8rem' : undefined,
              py: compact ? 1 : 1.5,
              px: compact ? 1 : 2
            }
          }}
        >
          <Tab label={`${t('deposit.all')} (${deposits.length})`} />
          <Tab label={`${t('deposit.active')} (${activeDeposits.length})`} />
          <Tab label={`${t('deposit.settled')} (${settledDeposits.length})`} />
          <Tab label={`${t('deposit.matured')} (${maturedDeposits.length})`} />
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
        portfolioId={portfolioId}
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
        onEdit={handleEditDeposit}
      />
    </Box>
  );
};

export default DepositManagementTab;
