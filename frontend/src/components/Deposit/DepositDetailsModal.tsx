import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Chip,
  IconButton,
  Card,
  CardContent,
  Avatar,
  Stack,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  AccountBalance as BankIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Notes as NotesIcon,
  Timer as TimerIcon,
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
}

const DepositDetailsModal: React.FC<DepositDetailsModalProps> = ({
  open,
  onClose,
  deposit,
  onSettle,
}) => {
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
        return <CloseIcon />;
      default:
        return <ScheduleIcon />;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 3,
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.12)',
          minHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        p: 2,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ 
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              width: 48,
              height: 48
            }}>
              <BankIcon sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h5" component="div" fontWeight="bold">
                Chi tiết tiền gửi
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {deposit.bankName || 'N/A'} - {deposit.accountNumber || 'N/A'}
              </Typography>
            </Box>
          </Box>
          <IconButton 
            onClick={onClose} 
            size="large"
            sx={{ 
              color: 'white',
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.2)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        {/* Decorative elements */}
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
          }}
        />
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 2 }}>
          {/* Status and Key Metrics */}
          <Card sx={{ mb: 2, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
            <CardContent sx={{ p: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Chip
                      icon={getStatusIcon(deposit.status || 'ACTIVE')}
                      label={deposit.status === 'ACTIVE' ? 'Đang hoạt động' : 
                             deposit.status === 'SETTLED' ? 'Đã tất toán' : 'Đã hủy'}
                      color={getStatusColor(deposit.status || 'ACTIVE')}
                      size="medium"
                      sx={{ fontWeight: 'bold', fontSize: '0.9rem', height: 32 }}
                    />
                    {deposit.daysUntilMaturity !== undefined && deposit.status === 'ACTIVE' && (
                      <Chip
                        icon={<TimerIcon />}
                        label={`${deposit.daysUntilMaturity} ngày đến hạn`}
                        color={deposit.daysUntilMaturity <= 30 ? 'warning' : 'info'}
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Typography variant="h6" gutterBottom>
                    {deposit.termDescription || 'N/A'}
                  </Typography>
                  {deposit.status === 'ACTIVE' && deposit.daysUntilMaturity !== undefined && (
                    <Box sx={{ mt: 1 }}>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" color="text.secondary">
                          Tiến độ đến hạn
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {Math.max(0, 100 - (deposit.daysUntilMaturity / 365) * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.max(0, 100 - (deposit.daysUntilMaturity / 365) * 100)}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Grid container spacing={2}>
            {/* Financial Overview */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', boxShadow: 2 }}>
                <CardContent sx={{ p: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <MoneyIcon color="primary" />
                    <Typography variant="h6" color="primary" fontWeight="bold">
                      Thông tin tài chính
                    </Typography>
                  </Box>
                  
                  <Stack spacing={2}>
                    <Paper sx={{ p: 1.5, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Số tiền gốc
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {formatCurrency(deposit.principal || 0)}
                      </Typography>
                    </Paper>

                    <Box display="flex" gap={1.5}>
                      <Paper sx={{ p: 1.5, flex: 1, textAlign: 'center' }}>
                        <TrendingUpIcon color="success" sx={{ fontSize: 28, mb: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">
                          Lãi suất
                        </Typography>
                        <Typography variant="h5" color="success.main" fontWeight="bold">
                          {deposit.interestRate ? `${deposit.interestRate}%/năm` : 'N/A'}
                        </Typography>
                      </Paper>
                      <Paper sx={{ p: 1.5, flex: 1, textAlign: 'center' }}>
                        <MoneyIcon color="info" sx={{ fontSize: 28, mb: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">
                          Lãi tích lũy
                        </Typography>
                        <Typography variant="h5" color="info.main" fontWeight="bold">
                          {formatCurrency(deposit.accruedInterest || 0)}
                        </Typography>
                      </Paper>
                    </Box>

                    <Box display="flex" gap={1.5}>
                      <Paper sx={{ p: 1.5, flex: 1, background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: 'white' }}>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Tổng giá trị
                        </Typography>
                        <Typography variant="h4" fontWeight="bold">
                          {formatCurrency(deposit.totalValue || 0)}
                        </Typography>
                      </Paper>

                      {deposit.actualInterest && (
                        <Paper sx={{ p: 1.5, flex: 1, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Lãi thực tế (đã tất toán)
                          </Typography>
                          <Typography variant="h4" fontWeight="bold">
                            {formatCurrency(deposit.actualInterest)}
                          </Typography>
                        </Paper>
                      )}
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Timeline and Details */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', boxShadow: 2 }}>
                <CardContent sx={{ p: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <CalendarIcon color="primary" />
                    <Typography variant="h6" color="primary" fontWeight="bold">
                      Thông tin thời gian
                    </Typography>
                  </Box>
                  
                  <Stack spacing={1.5}>
                    <Box display="flex" alignItems="center" gap={1.5} p={1.5} sx={{ bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                        <CalendarIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Ngày bắt đầu
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {formatDate(deposit.startDate, 'short')}
                        </Typography>
                      </Box>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1.5} p={1.5} sx={{ bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Avatar sx={{ bgcolor: 'success.main', width: 36, height: 36 }}>
                        <CheckCircleIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Ngày kết thúc
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {formatDate(deposit.endDate, 'short')}
                        </Typography>
                      </Box>
                    </Box>


                    {deposit.settledAt && (
                      <Box display="flex" alignItems="center" gap={1.5} p={1.5} sx={{ bgcolor: 'success.light', borderRadius: 2 }}>
                        <Avatar sx={{ bgcolor: 'success.main', width: 36, height: 36 }}>
                          <CheckCircleIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Ngày tất toán
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {formatDate(deposit.settledAt, 'short')}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Additional Information */}
            {(deposit.notes || deposit.daysUntilMaturity !== undefined) && (
              <Grid item xs={12}>
                <Card sx={{ boxShadow: 2 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <NotesIcon color="primary" />
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        Thông tin bổ sung
                      </Typography>
                    </Box>
                    
                    <Grid container spacing={2}>
                      {deposit.notes && (
                        <Grid item xs={12}>
                          <Paper sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Ghi chú
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {deposit.notes}
                            </Typography>
                          </Paper>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: 'grey.50', gap: 1 }}>
        <Button 
          onClick={onClose} 
          variant="outlined" 
          size="large"
          sx={{ 
            minWidth: 120,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 'bold'
          }}
        >
          Đóng
        </Button>
        
        {deposit.canBeSettled && onSettle && (
          <Button 
            onClick={() => onSettle(deposit)} 
            variant="contained" 
            color="success"
            size="large"
            startIcon={<MoneyIcon />}
            sx={{ 
              minWidth: 140,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 'bold'
            }}
          >
            Tất toán
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DepositDetailsModal;
