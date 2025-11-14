import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Alert,
} from '@mui/material';
import {
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { ModalWrapper } from '../Common/ModalWrapper';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { ResponsiveButton } from '../Common/ResponsiveButton';
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

interface CashflowDeleteConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  cashFlowToDelete: CashFlow | null;
  loading: boolean;
  error: string | null;
}

const CashflowDeleteConfirmationModal: React.FC<CashflowDeleteConfirmationModalProps> = ({
  open,
  onClose,
  onConfirm,
  cashFlowToDelete,
  loading,
  error,
}) => {
  const { t } = useTranslation();

  return (
    <ModalWrapper
      open={open}
      onClose={() => {
        onClose();
      }}
      title={t('cashflow.delete.title')}
      icon={<DeleteIcon color="error" />}
      maxWidth="sm"
      fullWidth
      loading={loading}
      titleColor="error"
      actions={
        <Box sx={{ display: 'flex', gap: 1 }}>
          <ResponsiveButton 
            onClick={() => {
              onClose();
            }}
            mobileText={t('common.cancel')}
            desktopText={t('common.cancel')}
          >
            {t('common.cancel')}
          </ResponsiveButton>
          <ResponsiveButton 
            onClick={async () => {
              // Close modal immediately
              onClose();
              // Then execute delete in background
              try {
                await onConfirm();
              } catch (err) {
                // Error will be handled by parent component
                console.error('Failed to delete cashflow:', err);
              }
            }} 
            color="error" 
            variant="contained"
            icon={<DeleteIcon />}
            mobileText={t('cashflow.delete.delete')}
            desktopText={t('cashflow.delete.delete')}
            disabled={loading}
          >
            {t('cashflow.delete.delete')}
          </ResponsiveButton>
        </Box>
      }
    >
      <Box sx={{ pt: 1 }}>
        <ResponsiveTypography variant="tableCell">
          {t('cashflow.delete.message')}
        </ResponsiveTypography>
        
        {cashFlowToDelete?.status === 'CANCELLED' && (
          <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
            <ResponsiveTypography variant="tableCell">
              <strong>{t('cashflow.delete.warning')}:</strong> {t('cashflow.delete.cancelledWarning')}
            </ResponsiveTypography>
            <ResponsiveTypography variant="formHelper" sx={{ mt: 1, display: 'block' }}>
              {t('cashflow.delete.cancelledHelper')}
            </ResponsiveTypography>
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            <ResponsiveTypography variant="tableCell">
              <strong>{t('cashflow.delete.error')}:</strong> {error}
            </ResponsiveTypography>
            <ResponsiveTypography variant="formHelper" sx={{ mt: 1, display: 'block' }}>
              {t('cashflow.delete.errorHelper')}
            </ResponsiveTypography>
          </Alert>
        )}
        
        {cashFlowToDelete && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <ResponsiveTypography variant="tableCell">
              <strong>{t('cashflow.delete.type')}:</strong> {cashFlowToDelete.type}
            </ResponsiveTypography>
            <ResponsiveTypography variant="tableCell">
              <strong>{t('cashflow.delete.amount')}:</strong> {formatCurrency(cashFlowToDelete.amount, cashFlowToDelete.currency)}
            </ResponsiveTypography>
            <ResponsiveTypography variant="tableCell">
              <strong>{t('cashflow.delete.description')}:</strong> {cashFlowToDelete.description}
            </ResponsiveTypography>
            <ResponsiveTypography variant="tableCell">
              <strong>{t('cashflow.delete.status')}:</strong> {cashFlowToDelete.status}
            </ResponsiveTypography>
          </Box>
        )}
      </Box>
    </ModalWrapper>
  );
};

export default CashflowDeleteConfirmationModal;
