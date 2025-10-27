import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
} from '@mui/material';
import {
  SwapHoriz as TransferIcon,
} from '@mui/icons-material';
import { ModalWrapper } from '../Common/ModalWrapper';
import { ResponsiveButton } from '../Common/ResponsiveButton';
import TransferCashForm, { TransferCashData } from './TransferCashForm';

interface TransferCashModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (transferData: TransferCashData) => Promise<void>;
  loading: boolean;
  error: string | null;
  portfolioId?: string; // Portfolio ID from parent
}

const TransferCashModal: React.FC<TransferCashModalProps> = ({
  open,
  onClose,
  onSubmit,
  loading,
  error,
  portfolioId,
}) => {
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);
  const [transferData, setTransferData] = useState<TransferCashData>({
    fromSource: '',
    toSource: '',
    amount: 0,
    description: '',
    transferDate: '',
  });

  const handleSubmit = async () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  const isFormValid = () => {
    return transferData.fromSource && 
           transferData.toSource &&
           transferData.amount > 0 && 
           transferData.fromSource !== transferData.toSource;
  };

  return (
    <ModalWrapper
      open={open}
      onClose={() => {
        onClose();
      }}
      title={t('cashflow.transfer.title')}
      icon={<TransferIcon color="secondary" />}
      maxWidth="md"
      fullWidth
      loading={loading}
      titleColor="secondary"
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
            onClick={handleSubmit}
            variant="contained"
            color="secondary"
            icon={<TransferIcon />}
            mobileText={loading ? t('cashflow.transfer.transferring') : t('cashflow.transfer.transfer')}
            desktopText={loading ? t('cashflow.transfer.transferring') : t('cashflow.transfer.transferCash')}
            disabled={loading || !isFormValid()}
          >
            {loading ? t('cashflow.transfer.transferring') : t('cashflow.transfer.transferCash')}
          </ResponsiveButton>
        </Box>
      }
    >
      <Box ref={formRef}>
        <TransferCashForm
          onSubmit={onSubmit}
          loading={loading}
          error={error}
          onDataChange={setTransferData}
          hideSubmitButton={true}
          showActions={false}
          portfolioId={portfolioId}
        />
      </Box>
    </ModalWrapper>
  );
};

export default TransferCashModal;
