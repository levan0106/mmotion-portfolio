import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  Alert,
  Card,
  CardContent,
  Avatar,
  Paper,
} from '@mui/material';
import {
  AccountBalance as BankIcon,
  TrendingUp as InterestIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
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

interface DepositSettlementModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: SettleDepositDto) => void;
  deposit: Deposit | null;
}

interface SettleDepositDto {
  actualInterest: number;
  notes?: string;
}

const validationSchema = yup.object({
  actualInterest: yup
    .number()
    .required('Số tiền lãi thực tế là bắt buộc')
    .min(0, 'Số tiền lãi phải lớn hơn hoặc bằng 0'),
  notes: yup.string().max(500, 'Ghi chú không được quá 500 ký tự'),
});

const DepositSettlementModal: React.FC<DepositSettlementModalProps> = ({
  open,
  onClose,
  onSubmit,
  deposit,
}) => {
  const [error, setError] = useState<string>('');

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SettleDepositDto>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      actualInterest: 0,
      notes: '',
    },
  });

  const actualInterest = watch('actualInterest') || 0;

  // Reset form when opening/closing
  useEffect(() => {
    if (open && deposit) {
      reset({
        actualInterest: deposit.accruedInterest || 0,
        notes: '',
      });
      setError('');
    }
  }, [open, deposit, reset]);

  const handleFormSubmit = async (data: SettleDepositDto) => {
    try {
      setError('');
      await onSubmit(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    }
  };


  const calculateTotalSettlement = (principal: number, actualInterest: number): number => {
    return principal + actualInterest;
  };

  if (!deposit) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          p: 2,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 36, height: 36 }}>
              <InterestIcon sx={{ color: 'white', fontSize: 20 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Tất toán tiền gửi
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                Xác nhận và hoàn tất việc tất toán
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 1 }}>
                {error}
              </Alert>
            )}

            {/* Combined Information and Form Card */}
            <Card sx={{ 
              mb: 2, 
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
              borderRadius: 2,
              overflow: 'hidden'
            }}>
              <CardContent sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                    <BankIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1rem' }}>
                      Thông tin tất toán
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      Chi tiết tiền gửi và thông tin tất toán
                    </Typography>
                  </Box>
                </Box>
                
                <Grid container spacing={2}>
                  {/* Deposit Info - Compact */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 1.5, bgcolor: 'white', borderRadius: 1, boxShadow: 1, mb: 2 }}>
                      <Typography variant="body2" fontWeight="bold" mb={1} color="text.primary" sx={{ fontSize: '0.85rem' }}>
                        Thông tin tiền gửi
                      </Typography>
                      
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                            <BankIcon fontSize="small" color="primary" />
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              {deposit.bankName || 'N/A'}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" fontFamily="monospace" sx={{ fontSize: '0.65rem' }}>
                            {deposit.accountNumber || 'N/A'}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                            <ScheduleIcon fontSize="small" color="primary" />
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              {deposit.termDescription || 'N/A'}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                            {formatDate(deposit.startDate, 'short')} - {formatDate(deposit.endDate, 'short')}
                          </Typography>
                        </Grid>
                      </Grid>
                      
                      <Grid container spacing={1} sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                            Gốc: {formatCurrency(Number(deposit.principal) || 0)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                            Lãi suất: {deposit.interestRate ? `${deposit.interestRate}%/năm` : 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                            Lãi tích lũy: {formatCurrency(Number(deposit.accruedInterest) || 0)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                            Tổng: {formatCurrency(Number(deposit.totalValue) || 0)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                  
                  {/* Settlement Form - Compact */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 1.5, bgcolor: 'white', borderRadius: 1, boxShadow: 1, mb: 2 }}>
                      <Typography variant="body2" fontWeight="bold" mb={1} color="text.primary" sx={{ fontSize: '0.85rem' }}>
                        Thông tin tất toán
                      </Typography>
                      
                      <Grid container spacing={1}>
                        <Grid item xs={12}>
                          <Controller
                            name="actualInterest"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Lãi thực tế (VND)"
                                type="number"
                                error={!!errors.actualInterest}
                                helperText={errors.actualInterest?.message}
                                required
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                size="small"
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 1,
                                    bgcolor: 'white'
                                  }
                                }}
                              />
                            )}
                          />
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Controller
                            name="notes"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label="Ghi chú"
                                multiline
                                rows={1}
                                error={!!errors.notes}
                                helperText={errors.notes?.message}
                                size="small"
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 1,
                                    bgcolor: 'white'
                                  }
                                }}
                              />
                            )}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Settlement Summary - Compact */}
            <Paper sx={{ 
              p: 2, 
              bgcolor: 'success.main', 
              borderRadius: 1, 
              boxShadow: 2,
              textAlign: 'center',
              mb: 2
            }}>
              <Box display="flex" alignItems="center" justifyContent="center" gap={1.5}>
                <Box>
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.5rem', mb: 0.5 }}>
                      Tổng nhận được
                    </Typography>
                    <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold', fontSize: '2rem', mb: 1 }}>
                      {formatCurrency(calculateTotalSettlement(Number(deposit.principal) || 0, Number(actualInterest) || 0))}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'white', opacity: 0.8, fontSize: '0.7rem' }}>
                      (Gốc: {formatCurrency(Number(deposit.principal) || 0)} + Lãi: {formatCurrency(Number(actualInterest) || 0)})
                    </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 2, bgcolor: 'grey.50', gap: 1.5 }}>
          <Button 
            onClick={onClose} 
            disabled={isSubmitting}
            variant="outlined"
            size="medium"
            sx={{ 
              minWidth: 100, 
              borderRadius: 1, 
              textTransform: 'none', 
              fontWeight: 'bold' 
            }}
          >
            Hủy
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="success"
            disabled={isSubmitting || (actualInterest || 0) < 0}
            size="medium"
            startIcon={isSubmitting ? undefined : <CheckIcon />}
            sx={{ 
              minWidth: 160, 
              borderRadius: 1, 
              textTransform: 'none', 
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #388e3c 0%, #1b5e20 100%)',
              }
            }}
          >
            {isSubmitting ? 'Đang tất toán...' : 'Xác nhận tất toán'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default DepositSettlementModal;
