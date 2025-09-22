import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

interface DepositFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDepositDto) => void;
  portfolioId: string;
  initialData?: CreateDepositDto;
  isEdit?: boolean;
}

interface CreateDepositDto {
  portfolioId: string;
  bankName: string;
  accountNumber?: string;
  principal: number;
  interestRate: number;
  startDate: string;
  endDate: string;
  termMonths?: number;
  notes?: string;
}

const termOptions = [
  { value: '1M', label: '1 Tháng' },
  { value: '3M', label: '3 Tháng' },
  { value: '6M', label: '6 Tháng' },
  { value: '1Y', label: '1 Năm' },
  { value: '2Y', label: '2 Năm' },
  { value: '3Y', label: '3 Năm' },
  { value: '5Y', label: '5 Năm' },
];

const validationSchema = yup.object({
  portfolioId: yup.string().required('Portfolio ID là bắt buộc'),
  bankName: yup.string().required('Tên ngân hàng là bắt buộc').max(100, 'Tên ngân hàng không được quá 100 ký tự'),
  accountNumber: yup.string().optional().max(50, 'Số tài khoản không được quá 50 ký tự'),
  principal: yup.number().required('Số tiền gốc là bắt buộc').min(0, 'Số tiền gốc phải lớn hơn 0'),
  interestRate: yup.number().required('Lãi suất là bắt buộc').min(0, 'Lãi suất phải lớn hơn hoặc bằng 0').max(100, 'Lãi suất không được quá 100%'),
  startDate: yup.string().required('Ngày bắt đầu là bắt buộc'),
  endDate: yup.string().required('Ngày kết thúc là bắt buộc'),
  termMonths: yup.number().optional(),
  notes: yup.string().max(500, 'Ghi chú không được quá 500 ký tự'),
});

const DepositForm: React.FC<DepositFormProps> = ({
  open,
  onClose,
  onSubmit,
  portfolioId,
  initialData,
  isEdit = false,
}) => {
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [error, setError] = useState<string>('');

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateDepositDto>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      portfolioId: portfolioId || '',
      bankName: '',
      accountNumber: '',
      principal: 0,
      interestRate: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      termMonths: 0,
      notes: '',
    },
  });

  const startDate = watch('startDate');

  // Reset form when opening/closing
  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          ...initialData,
          portfolioId: initialData.portfolioId || portfolioId,
          bankName: initialData.bankName || '',
          accountNumber: initialData.accountNumber || '',
          principal: initialData.principal || 0,
          interestRate: initialData.interestRate || 0,
          startDate: initialData.startDate || new Date().toISOString().split('T')[0],
          endDate: initialData.endDate || '',
          termMonths: initialData.termMonths || 0,
          notes: initialData.notes || '',
        });
        // Calculate term from dates
        if (initialData.startDate && initialData.endDate) {
          const start = new Date(initialData.startDate);
          const end = new Date(initialData.endDate);
          const term = calculateTermFromDates(start, end);
          setSelectedTerm(term);
        }
      } else {
        reset({
          portfolioId: portfolioId || '',
          bankName: '',
          accountNumber: '',
          principal: 0,
          interestRate: 0,
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          termMonths: 0,
          notes: '',
        });
        setSelectedTerm('');
      }
      setError('');
    }
  }, [open, initialData, portfolioId, reset]);

  const calculateEndDate = (startDate: Date, term: string): Date => {
    const endDate = new Date(startDate);
    
    switch (term) {
      case '1M':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case '3M':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case '6M':
        endDate.setMonth(endDate.getMonth() + 6);
        break;
      case '1Y':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      case '2Y':
        endDate.setFullYear(endDate.getFullYear() + 2);
        break;
      case '3Y':
        endDate.setFullYear(endDate.getFullYear() + 3);
        break;
      case '5Y':
        endDate.setFullYear(endDate.getFullYear() + 5);
        break;
      default:
        break;
    }
    
    return endDate;
  };

  const calculateTermFromDates = (startDate: Date, endDate: Date): string => {
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 31) return '1M';
    if (diffDays <= 93) return '3M';
    if (diffDays <= 186) return '6M';
    if (diffDays <= 366) return '1Y';
    if (diffDays <= 732) return '2Y';
    if (diffDays <= 1098) return '3Y';
    if (diffDays <= 1830) return '5Y';
    
    return '';
  };

  const handleTermChange = (term: string) => {
    setSelectedTerm(term);
    if (startDate) {
      const start = new Date(startDate);
      const end = calculateEndDate(start, term);
      setValue('endDate', end.toISOString().split('T')[0]);
    }
  };

  const handleFormSubmit = async (data: CreateDepositDto) => {
    try {
      setError('');
      
      // Validate dates
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      
      if (start >= end) {
        setError('Ngày kết thúc phải sau ngày bắt đầu');
        return;
      }
      
      // Check if term is not too long (10 years)
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 3650) {
        setError('Kỳ hạn không được quá 10 năm');
        return;
      }
      
      // Clean up data before submitting
      const cleanedData = {
        ...data,
        accountNumber: data.accountNumber?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
      };
      
      await onSubmit(cleanedData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    }
  };


  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogTitle>
          {isEdit ? 'Chỉnh sửa tiền gửi' : 'Tạo tiền gửi mới'}
        </DialogTitle>
        
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="bankName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Tên ngân hàng"
                    error={!!errors.bankName}
                    helperText={errors.bankName?.message}
                    required
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Controller
                name="accountNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Số tài khoản (tùy chọn)"
                    error={!!errors.accountNumber}
                    helperText={errors.accountNumber?.message}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Controller
                name="principal"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Số tiền gốc (VND)"
                    type="number"
                    error={!!errors.principal}
                    helperText={errors.principal?.message}
                    required
                    onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Controller
                name="interestRate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Lãi suất (%/năm)"
                    type="number"
                    error={!!errors.interestRate}
                    helperText={errors.interestRate?.message}
                    required
                    onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Kỳ hạn"
                select
                value={selectedTerm}
                onChange={(e) => handleTermChange(e.target.value)}
                helperText="Chọn kỳ hạn để tự động tính ngày kết thúc"
              >
                {termOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Ngày bắt đầu"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.startDate}
                    helperText={errors.startDate?.message}
                    required
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Controller
                name="endDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Ngày kết thúc"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.endDate}
                    helperText={errors.endDate?.message}
                    required
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
                    rows={3}
                    error={!!errors.notes}
                    helperText={errors.notes?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang xử lý...' : (isEdit ? 'Cập nhật' : 'Tạo')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default DepositForm;
