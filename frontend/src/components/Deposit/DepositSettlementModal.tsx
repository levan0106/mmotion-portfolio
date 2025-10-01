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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
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
import MoneyInput from '../Common/MoneyInput';

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
  settlementDate: string;
  notes?: string;
}

const validationSchema = yup.object({
  actualInterest: yup
    .number()
    .required('Số tiền lãi thực tế là bắt buộc')
    .min(0, 'Số tiền lãi phải lớn hơn hoặc bằng 0'),
  settlementDate: yup
    .string()
    .required('Ngày tất toán là bắt buộc'),
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
      settlementDate: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const actualInterest = watch('actualInterest') || 0;

  // Reset form when opening/closing
  useEffect(() => {
    if (open && deposit) {
      reset({
        actualInterest: deposit.accruedInterest || 0,
        settlementDate: new Date().toISOString().split('T')[0],
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
                    <Paper sx={{ p: 1.5, bgcolor: 'white', borderRadius: 1, boxShadow: 1, mb: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2" fontWeight="bold" mb={1} color="text.primary" sx={{ fontSize: '0.85rem' }}>
                        Thông tin tiền gửi
                      </Typography>
                      
                      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', py: 1 }}>
                        {/* Bank & Term Information */}
                        <Box sx={{ mb: 2 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <BankIcon fontSize="small" color="primary" />
                                <Typography variant="body2" color="text.primary" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                  {deposit.bankName || 'N/A'}
                                </Typography>
                              </Box>
                              <Typography variant="body2" color="text.secondary" fontFamily="monospace" sx={{ fontSize: '0.75rem', ml: 3, mb: 1 }}>
                                {deposit.accountNumber || 'N/A'}
                              </Typography>
                            </Grid>
                            
                            <Grid item xs={12}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <ScheduleIcon fontSize="small" color="primary" />
                                <Typography variant="body2" color="text.primary" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                  {deposit.termDescription || 'N/A'}
                                </Typography>
                              </Box>
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', ml: 3 }}>
                                {formatDate(deposit.startDate, 'short')} - {formatDate(deposit.endDate, 'short')}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>
                        
                        {/* Financial Information */}
                        <Box>
                          <Grid container spacing={1.5}>
                            <Grid item xs={6}>
                              <Box sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem', mb: 0.5 }}>
                                  Gốc
                                </Typography>
                                <Typography variant="body2" color="text.primary" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                  {formatCurrency(Number(deposit.principal) || 0)}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem', mb: 0.5 }}>
                                  Lãi suất
                                </Typography>
                                <Typography variant="body2" color="text.primary" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                  {deposit.interestRate ? `${deposit.interestRate}%/năm` : 'N/A'}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem', mb: 0.5 }}>
                                  Lãi tích lũy
                                </Typography>
                                <Typography variant="body2" color="text.primary" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                  {formatCurrency(Number(deposit.accruedInterest) || 0)}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6}>
                              <Box sx={{ p: 1, bgcolor: 'success.light', borderRadius: 1, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.7rem', mb: 0.5 }}>
                                  Tổng
                                </Typography>
                                <Typography variant="body2" color="success.dark" sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
                                  {formatCurrency(Number(deposit.totalValue) || 0)}
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                  
                  {/* Settlement Form - Compact */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 1.5, bgcolor: 'white', borderRadius: 1, boxShadow: 1, mb: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2" fontWeight="bold" mb={1} color="text.primary" sx={{ fontSize: '0.85rem' }}>
                        Thông tin tất toán
                      </Typography>
                      
                      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', py: 1 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <Controller
                              name="actualInterest"
                              control={control}
                              render={({ field }) => (
                                <MoneyInput
                                  value={field.value || 0}
                                  onChange={(value) => field.onChange(value)}
                                  label="Lãi thực tế"
                                  placeholder="Nhập số tiền lãi thực tế"
                                  helperText={errors.actualInterest?.message}
                                  error={!!errors.actualInterest}
                                  currency="VND"
                                  showCurrency={true}
                                  align="right"
                                  required
                                  disabled={isSubmitting}
                                />
                              )}
                            />
                          </Grid>
                          
                          <Grid item xs={12}>
                            <Controller
                              name="settlementDate"
                              control={control}
                              render={({ field }) => (
                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                  <DatePicker
                                    label="Ngày tất toán"
                                    value={field.value ? new Date(field.value) : null}
                                    onChange={(date) => {
                                      const dateString = date ? date.toISOString().split('T')[0] : '';
                                      field.onChange(dateString);
                                    }}
                                    slotProps={{
                                      textField: {
                                        fullWidth: true,
                                        size: 'small',
                                        error: !!errors.settlementDate,
                                        helperText: errors.settlementDate?.message || 'Chọn ngày tất toán',
                                        required: true,
                                        sx: {
                                          '& .MuiOutlinedInput-root': {
                                            borderRadius: 1,
                                            bgcolor: 'white'
                                          }
                                        }
                                      },
                                    }}
                                  />
                                </LocalizationProvider>
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
                                  rows={2}
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
                      </Box>
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
