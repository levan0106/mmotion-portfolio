import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit as EditIcon } from '@mui/icons-material';
import TradeForm, { TradeFormData } from './TradeForm';

export interface EditTradeModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TradeFormData) => Promise<void>;
  initialData?: Partial<TradeFormData>;
  isLoading?: boolean;
  error?: string;
}

/**
 * EditTradeModal component for editing existing trades.
 * Uses TradeForm's built-in modal functionality.
 */
export const EditTradeModal: React.FC<EditTradeModalProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
  error,
}) => {
  const { t } = useTranslation();

  const handleSubmit = async (data: TradeFormData) => {
    try {
      await onSubmit(data);
      onClose();
    } catch (err) {
      console.error('Error updating trade:', err);
    }
  };

  return (
    <TradeForm
      onSubmit={handleSubmit}
      initialData={initialData}
      isLoading={isLoading}
      error={error}
      mode="edit"
      showSubmitButton={false}
      isModal={true}
      // Modal props
      open={open}
      onClose={onClose}
      title={t('trading.modal.editTrade')}
      icon={<EditIcon />}
      maxWidth="md"
      size="medium"
    />
  );
};

export default EditTradeModal;
