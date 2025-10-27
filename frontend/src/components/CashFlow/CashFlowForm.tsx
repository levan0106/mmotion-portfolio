import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Grid,
  Alert,
  TextField,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
} from '@mui/icons-material';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { ResponsiveButton } from '../Common/ResponsiveButton';
import MoneyInput from '../Common/MoneyInput';
import { formatCurrency } from '../../utils/format';

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

interface CashFlowFormProps {
  onSubmit: (formData: any) => Promise<void>;
  onCancel: () => void;
  dialogType: 'deposit' | 'withdrawal' | 'dividend' | 'interest' | 'fee' | 'tax' | 'adjustment';
  editingCashFlow: CashFlow | null;
  loading: boolean;
  error: string | null;
  portfolioFundingSource?: string;
  hideButtons?: boolean;
  showToggle?: boolean; // New prop to show/hide toggle
  onTypeChange?: (newType: 'deposit' | 'withdrawal') => void; // Callback for type change
}

const CashFlowForm: React.FC<CashFlowFormProps> = ({
  onSubmit,
  onCancel,
  dialogType,
  editingCashFlow,
  loading,
  error,
  portfolioFundingSource = '',
  hideButtons = false,
  showToggle = false,
  onTypeChange,
}) => {
  const { t } = useTranslation();
  
  // State for toggle between deposit/withdrawal
  const [isDeposit, setIsDeposit] = useState(dialogType === 'deposit');
  
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    reference: '',
    currency: 'VND',
    flowDate: '',
    status: 'COMPLETED',
    fundingSource: '',
  });

  // Helper function to get current local date for form
  const getCurrentLocalDate = () => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  };

  // Helper function to reset form with auto-filled flowDate and portfolio funding source
  const resetFormWithAutoFlowDate = () => {
    setFormData({
      amount: '',
      description: '',
      reference: '',
      currency: 'VND',
      flowDate: getCurrentLocalDate(),
      status: 'COMPLETED',
      fundingSource: portfolioFundingSource,
    });
  };

  // Handle toggle change
  const handleToggleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newIsDeposit = event.target.checked;
    setIsDeposit(newIsDeposit);
    
    // Call parent callback if provided
    if (onTypeChange) {
      onTypeChange(newIsDeposit ? 'deposit' : 'withdrawal');
    }
  };

  // Reset form when component mounts or editingCashFlow changes
  useEffect(() => {
    if (editingCashFlow) {
      // Format dates for input - Fix timezone issue
      const flowDate = editingCashFlow.flowDate.includes('T') 
        ? editingCashFlow.flowDate.split('T')[0] 
        : editingCashFlow.flowDate;
      
      setFormData({
        amount: editingCashFlow.amount.toString(),
        description: editingCashFlow.description || '',
        reference: editingCashFlow.reference || '',
        currency: editingCashFlow.currency || 'VND',
        flowDate: flowDate,
        status: editingCashFlow.status || 'COMPLETED',
        fundingSource: editingCashFlow.fundingSource || '',
      });
      
      // Set toggle state based on cash flow type
      setIsDeposit(editingCashFlow.type === 'DEPOSIT');
    } else {
      resetFormWithAutoFlowDate();
      // Reset toggle state based on dialogType
      setIsDeposit(dialogType === 'deposit');
    }
  }, [editingCashFlow, portfolioFundingSource, dialogType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Add type to formData based on current toggle state
    const submitData = {
      ...formData,
      type: isDeposit ? 'DEPOSIT' : 'WITHDRAWAL'
    };
    await onSubmit(submitData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ pt: 0 }}>
      {/* Hidden submit button for external trigger */}
      {hideButtons && (
        <button type="submit" style={{ display: 'none' }} />
      )}
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
      {/* {!editingCashFlow && (
        <Alert 
          severity={getCashFlowDirectionColor(dialogType.toUpperCase()) === 'success' ? 'success' : 'error'}
          sx={{ 
            mb: 2, 
            borderLeft: `4px solid ${getCashFlowDirectionColor(dialogType.toUpperCase()) === 'success' ? '#4caf50' : '#f44336'}`,
            backgroundColor: getCashFlowDirectionColor(dialogType.toUpperCase()) === 'success' ? '#e8f5e8' : '#ffebee'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ fontSize: '1.2rem' }}>{getTypeIcon(dialogType)}</Box>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <ResponsiveTypography variant="tableCell" sx={{ fontWeight: 'bold' }}>
                {dialogType.charAt(0).toUpperCase() + dialogType.slice(1)} Transaction
              </ResponsiveTypography>
                <Chip
                  icon={<Box sx={{ fontSize: '0.8rem' }}>{getCashFlowDirectionIcon(dialogType.toUpperCase())}</Box>}
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
      )} */}
      
      {/* Simple Toggle Button for Deposit/Withdrawal */}
      {showToggle && !editingCashFlow && (
        <Box sx={{ 
          mb: 0, 
          display: 'flex', 
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 1
        }}>
          <ResponsiveTypography variant="tableCell" color="text.secondary">
            {isDeposit ? t('cashflow.deposit', 'Nạp') : t('cashflow.withdrawal', 'Rút')}
          </ResponsiveTypography>
          <Switch
            checked={isDeposit}
            onChange={handleToggleChange}
            size="medium"
            sx={{
              '& .MuiSwitch-thumb': {
                backgroundColor: isDeposit ? '#4caf50' : '#f44336',
                width: 20,
                height: 20,
              },
              '& .MuiSwitch-track': {
                backgroundColor: isDeposit ? '#4caf50' : '#f44336',
                opacity: 0.3,
                height: 14,
              },
            }}
          />
        </Box>
      )}
      
      <Grid container spacing={1}>
        {/* Left Column */}
        <Grid item xs={12} md={6}>
          <Box sx={{ pr: { md: 1 } }}>
            <MoneyInput
              value={parseFloat(formData.amount) || 0}
              onChange={(amount) => setFormData({ ...formData, amount: amount.toString() })}
              label={t('cashflow.form.amount')}
              placeholder={t('cashflow.form.amountPlaceholder')}
              required
              currency={formData.currency}
              margin="normal"
              error={!!(formData.amount && (parseFloat(formData.amount) <= 0 || isNaN(parseFloat(formData.amount))))}
            />
            
            <TextField
              fullWidth
              label={t('cashflow.form.fundingSource')}
              value={formData.fundingSource}
              onChange={(e) => setFormData({ ...formData, fundingSource: e.target.value.toUpperCase() })}
              margin="normal"
              placeholder={t('cashflow.form.fundingSourcePlaceholder')}
              inputProps={{
                style: { textTransform: 'uppercase' }
              }}
            />
          </Box>
        </Grid>
        
        {/* Right Column */}
        <Grid item xs={12} md={6}>
          <Box sx={{ pl: { md: 1 } }}>
            <TextField
              fullWidth
              label={t('cashflow.form.flowDate')}
              type="date"
              value={formData.flowDate}
              onChange={(e) => setFormData({ ...formData, flowDate: e.target.value })}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
                            
            <TextField
              fullWidth
              label={t('cashflow.form.description')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              multiline
              rows={1}
            />
          </Box>
        </Grid>
        
      </Grid>

      {!hideButtons && (
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          justifyContent: 'flex-end', 
          mt: 4,
          pt: 2,
          borderTop: 1,
          borderColor: 'divider'
        }}>
          {onCancel && (
            <ResponsiveButton
              type="button"
              variant="outlined"
              onClick={onCancel}
              size="large"
              forceTextOnly={true}
              mobileText={t('common.cancel')}
              desktopText={t('common.cancel')}
            >
              {t('common.cancel')}
            </ResponsiveButton>
          )}
          <ResponsiveButton
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            icon={loading ? <AddIcon /> : undefined}
            forceTextOnly={true}
            mobileText={loading ? t('common.processing') : (editingCashFlow ? t('common.update') : t('common.create'))}
            desktopText={loading ? t('common.processing') : (editingCashFlow ? t('common.update') : t('common.create'))}
          >
            {loading ? t('common.processing') : (editingCashFlow ? t('common.update') : t('common.create'))}
          </ResponsiveButton>
        </Box>
      )}
    </Box>
  );
};

export default CashFlowForm;
