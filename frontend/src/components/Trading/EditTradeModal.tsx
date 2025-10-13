import React, { useRef } from 'react';
import {
  Box,
} from '@mui/material';
import { Edit as EditIcon, Close as CloseIcon } from '@mui/icons-material';
import TradeForm, { TradeFormData } from './TradeForm';
import { ModalWrapper } from '../Common/ModalWrapper';
import { ResponsiveButton } from '../Common';

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
 * Wraps TradeForm in a modal dialog with proper actions.
 */
export const EditTradeModal: React.FC<EditTradeModalProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
  error,
}) => {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (data: TradeFormData) => {
    try {
      await onSubmit(data);
      onClose();
    } catch (err) {
      console.error('Error updating trade:', err);
    }
  };

  const handleUpdateClick = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title="Edit Trade"
      icon={<EditIcon />}
      maxWidth="lg"
      loading={isLoading}
      actions={
        <Box sx={{ display: 'flex', gap: 2 }}>
          <ResponsiveButton 
            onClick={onClose} 
            disabled={isLoading}
            icon={<CloseIcon />}
            mobileText="Cancel"
            desktopText="Cancel"
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </ResponsiveButton>
          <ResponsiveButton
            onClick={handleUpdateClick}
            variant="contained"
            disabled={isLoading}
            icon={<EditIcon />}
            mobileText="Update"
            desktopText="Update Trade"
            sx={{ 
              textTransform: 'none',
              fontWeight: 600,
              px: 3
            }}
          >
            {isLoading ? 'Updating...' : 'Update Trade'}
          </ResponsiveButton>
        </Box>
      }
    >
      <TradeForm
        onSubmit={handleSubmit}
        initialData={initialData}
        isLoading={isLoading}
        error={error}
        mode="edit"
        showSubmitButton={false}
        formRef={formRef}
        isModal={true}
      />
    </ModalWrapper>
  );
};

export default EditTradeModal;
