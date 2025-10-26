import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Edit as EditIcon,
} from '@mui/icons-material';
import { ModalWrapper } from '../Common/ModalWrapper';
import CashFlowForm from './CashFlowForm';

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

interface CashFlowFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
  dialogType: 'deposit' | 'withdrawal' | 'dividend' | 'interest' | 'fee' | 'tax' | 'adjustment';
  editingCashFlow: CashFlow | null;
  loading: boolean;
  error: string | null;
  portfolioFundingSource?: string;
}

const CashFlowFormModal: React.FC<CashFlowFormModalProps> = ({
  open,
  onClose,
  onSubmit,
  dialogType,
  editingCashFlow,
  loading,
  error,
  portfolioFundingSource = '',
}) => {
  const { t } = useTranslation();

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return '💰';
      case 'WITHDRAWAL': return '💸';
      case 'DIVIDEND': return '📈';
      case 'INTEREST': return '📊';
      case 'FEE': return '❌';
      case 'TAX': return '❌';
      case 'ADJUSTMENT': return '⚖️';
      case 'BUY_TRADE': return '💸';
      case 'SELL_TRADE': return '💰';
      case 'DEPOSIT_SETTLEMENT': return '💰';
      case 'DEPOSIT_CREATION': return '💸';
      default: return undefined;
    }
  };

  const isCashFlowIn = (type: string) => {
    return ['DEPOSIT', 'DIVIDEND', 'INTEREST', 'SELL_TRADE', 'DEPOSIT_SETTLEMENT'].includes(type);
  };

  const getCashFlowDirectionColor = (type: string) => {
    return isCashFlowIn(type) ? 'success' : 'error';
  };

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title={editingCashFlow ? t('cashflow.modal.editTitle') : t('cashflow.modal.createTitle', { type: dialogType.charAt(0).toUpperCase() + dialogType.slice(1) })}
      icon={editingCashFlow ? <EditIcon color="primary" /> : getTypeIcon(dialogType)}
      maxWidth="md"
      fullWidth
      loading={loading}
      titleColor={editingCashFlow ? 'primary' : getCashFlowDirectionColor(dialogType.toUpperCase()) === 'success' ? 'success' : 'error'}
    >
      <CashFlowForm
        onSubmit={onSubmit}
        onCancel={onClose}
        dialogType={dialogType}
        editingCashFlow={editingCashFlow}
        loading={loading}
        error={error}
        portfolioFundingSource={portfolioFundingSource}
        hideButtons={false}
      />
    </ModalWrapper>
  );
};

export default CashFlowFormModal;
