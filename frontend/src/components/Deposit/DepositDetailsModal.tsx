import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Grid,
  Chip,
  Card,
  CardContent,
  Stack,
  Divider,
} from '@mui/material';
import { ResponsiveButton } from '../Common';
import { ResponsiveTypography } from '../Common';
import { ModalWrapper } from '../Common';
import {
  AccountBalance as BankIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Notes as NotesIcon,
  Timer as TimerIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { formatCurrency, formatDate } from '../../utils/format';

interface Deposit {
  depositId: string;
  portfolioId: string;
  bankName: string;
  accountNumber?: string;
  principal: number;
  interestRate: number;
  startDate: string;
  endDate: string;
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
  termMonths?: number;
}

interface DepositDetailsModalProps {
  open: boolean;
  onClose: () => void;
  deposit: Deposit | null;
  onSettle?: (deposit: Deposit) => void;
  onEdit?: (deposit: Deposit) => void;
}

const DepositDetailsModal: React.FC<DepositDetailsModalProps> = ({
  open,
  onClose,
  deposit,
  onSettle,
  onEdit,
}) => {
  const { t } = useTranslation();
  
  if (!deposit) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'SETTLED':
        return 'primary';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <ScheduleIcon />;
      case 'SETTLED':
        return <CheckCircleIcon />;
      case 'CANCELLED':
        return <ScheduleIcon />;
      default:
        return <ScheduleIcon />;
    }
  };

  const modalTitle = `${t('deposit.details.title')} - ${deposit.bankName || t('common.na')}`;
  
  const modalActions = (
    <>
      <ResponsiveButton 
        onClick={onClose} 
        variant="outlined" 
        size="medium"
      >
        {t('common.close')}
      </ResponsiveButton>
      
      {deposit.canBeEdited && onEdit && (
        <ResponsiveButton 
          onClick={() => onEdit(deposit)} 
          variant="contained" 
          color="primary"
          size="medium"
          startIcon={<EditIcon />}
        >
          {t('common.edit')}
        </ResponsiveButton>
      )}
      
      {deposit.canBeSettled && onSettle && (
        <ResponsiveButton 
          onClick={() => onSettle(deposit)} 
          variant="contained" 
          color="success"
          size="medium"
          startIcon={<MoneyIcon />}
        >
          {t('deposit.depositActions.settle')}
        </ResponsiveButton>
      )}
    </>
  );

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title={modalTitle}
      icon={<BankIcon sx={{ fontSize: 20 }} />}
      actions={modalActions}
      maxWidth="md"
      fullWidth
      titleColor="primary"
      size="medium"
    >
      {/* Status Header */}
      <Box sx={{ mb: 3, mt: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Chip
            icon={getStatusIcon(deposit.status || 'ACTIVE')}
            label={deposit.status === 'ACTIVE' ? t('deposit.depositStatus.active') : 
                   deposit.status === 'SETTLED' ? t('deposit.depositStatus.settled') : t('deposit.depositStatus.cancelled')}
            color={getStatusColor(deposit.status || 'ACTIVE')}
            size="medium"
          />
          {deposit.daysUntilMaturity !== undefined && deposit.status === 'ACTIVE' && (
            <Chip
              icon={<TimerIcon />}
              label={t('deposit.details.daysUntilMaturity', { days: deposit.daysUntilMaturity })}
              color={deposit.daysUntilMaturity <= 30 ? 'warning' : 'info'}
              variant="outlined"
            />
          )}
        </Box>
        <ResponsiveTypography variant="cardTitle" color="text.primary">
          {deposit.termDescription || t('common.na')}
        </ResponsiveTypography>
      </Box>

      {/* Financial Summary */}
      <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 2 }}>
          <ResponsiveTypography variant="cardTitle" gutterBottom sx={{ mb: 2 }}>
            {t('deposit.details.financialInfo')}
          </ResponsiveTypography>
          
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <ResponsiveTypography variant="cardSubtitle" color="text.secondary" gutterBottom>
                  {t('deposit.details.principal')}
                </ResponsiveTypography>
                <ResponsiveTypography variant="cardTitle" color="primary" fontWeight="bold">
                  {formatCurrency(deposit.principal || 0)}
                </ResponsiveTypography>
              </Box>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <ResponsiveTypography variant="cardSubtitle" color="text.secondary" gutterBottom>
                  {t('deposit.details.interestRate')}
                </ResponsiveTypography>
                <ResponsiveTypography variant="cardTitle" color="success.main" fontWeight="bold">
                  {deposit.interestRate ? `${deposit.interestRate}%` : t('common.na')}
                </ResponsiveTypography>
              </Box>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <ResponsiveTypography variant="cardSubtitle" color="text.secondary" gutterBottom>
                  {t('deposit.details.accruedInterest')}
                </ResponsiveTypography>
                <ResponsiveTypography variant="cardTitle" color="info.main" fontWeight="bold">
                  {formatCurrency(deposit.accruedInterest || 0)}
                </ResponsiveTypography>
              </Box>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <ResponsiveTypography variant="cardSubtitle" color="text.secondary" gutterBottom>
                  {t('deposit.details.totalValue')}
                </ResponsiveTypography>
                <ResponsiveTypography variant="cardTitle" color="text.primary" fontWeight="bold">
                  {formatCurrency(deposit.totalValue || 0)}
                </ResponsiveTypography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Timeline Information */}
      <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 2 }}>
          <ResponsiveTypography variant="cardTitle" gutterBottom sx={{ mb: 2 }}>
            {t('deposit.details.timelineInfo')}
          </ResponsiveTypography>
          
          <Stack spacing={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <CalendarIcon color="primary" sx={{ fontSize: 20 }} />
              <Box flex={1}>
                <ResponsiveTypography variant="cardSubtitle" color="text.secondary">
                  {t('deposit.details.startDate')}
                </ResponsiveTypography>
                <ResponsiveTypography variant="cardSubtitle" fontWeight="medium">
                  {formatDate(deposit.startDate, 'short')}
                </ResponsiveTypography>
              </Box>
            </Box>
            
            <Divider />
            
            <Box display="flex" alignItems="center" gap={2}>
              <CheckCircleIcon color="success" sx={{ fontSize: 20 }} />
              <Box flex={1}>
                <ResponsiveTypography variant="cardSubtitle" color="text.secondary">
                  {t('deposit.details.endDate')}
                </ResponsiveTypography>
                <ResponsiveTypography variant="cardSubtitle" fontWeight="medium">
                  {formatDate(deposit.endDate, 'short')}
                </ResponsiveTypography>
              </Box>
            </Box>
            
            {deposit.settledAt && (
              <>
                <Divider />
                <Box display="flex" alignItems="center" gap={2}>
                  <CheckCircleIcon color="success" sx={{ fontSize: 20 }} />
                  <Box flex={1}>
                    <ResponsiveTypography variant="cardSubtitle" color="text.secondary">
                      {t('deposit.details.settlementDate')}
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="cardSubtitle" fontWeight="medium">
                      {formatDate(deposit.settledAt, 'short')}
                    </ResponsiveTypography>
                  </Box>
                </Box>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Additional Information */}
      {deposit.notes && (
        <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <NotesIcon color="primary" sx={{ fontSize: 20 }} />
              <ResponsiveTypography variant="cardTitle">
                {t('deposit.details.notes')}
              </ResponsiveTypography>
            </Box>
            <ResponsiveTypography variant="cardSubtitle" color="text.secondary">
              {deposit.notes}
            </ResponsiveTypography>
          </CardContent>
        </Card>
      )}
    </ModalWrapper>
  );
};

export default DepositDetailsModal;
