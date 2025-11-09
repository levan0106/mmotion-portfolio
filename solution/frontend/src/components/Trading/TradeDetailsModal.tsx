import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Alert,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { ResponsiveButton, ModalWrapper } from '../Common';
import ResponsiveTypography from '../Common/ResponsiveTypography';
import TradeDetails from './TradeDetails';

export interface TradeDetailsModalProps {
  open: boolean;
  onClose: () => void;
  onEdit?: (trade: any) => void;
  trade: any | null;
  tradeDetails?: any[];
  isLoading?: boolean;
  error?: string;
}

/**
 * TradeDetailsModal component for viewing trade details in a modal.
 * Wraps TradeDetails component in a modal dialog.
 */
export const TradeDetailsModal: React.FC<TradeDetailsModalProps> = ({
  open,
  onClose,
  onEdit,
  trade,
  tradeDetails = [],
  isLoading = false,
  error,
}) => {
  const { t } = useTranslation();
  
  if (!trade) return null;

  // Build modal title with trade info
  const modalTitle = (
    <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
      <ResponsiveTypography variant="cardTitle" fontWeight="bold">
        {t('trading.tradeDetails.modal.title')}
      </ResponsiveTypography>
      {/* {trade && (
        <ResponsiveTypography variant="labelSmall" color="text.secondary">
          {trade.assetSymbol} - {trade.assetName}
        </ResponsiveTypography>
      )} */}
    </Box>
  );

  // Build actions
  const modalActions = (
    <Box display="flex" justifyContent="flex-end" gap={1} width="100%">
      <ResponsiveButton 
        onClick={onClose}
        variant="text"
        mobileText={t('common.close')}
        desktopText={t('common.close')}
        sx={{ textTransform: 'none', px: 3 }}
      >
        {t('common.close')}
      </ResponsiveButton>
      {onEdit && (
        <ResponsiveButton 
          onClick={() => onEdit(trade)}
          variant="contained"
          icon={<EditIcon />}
          mobileText={t('common.edit')}
          desktopText={t('trading.tradeDetails.modal.editTrade')}
          sx={{ textTransform: 'none', px: 3 }}
          forceTextOnly={true}
        >
          {t('trading.tradeDetails.modal.editTrade')}
        </ResponsiveButton>
      )}
    </Box>
  );

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title={modalTitle}
      maxWidth="lg"
      loading={isLoading}
      actions={modalActions}
    >
      <Box>
        {error && (
          <Alert severity="error" sx={{ m: 2, mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ overflow: 'auto' }}>
          {!isLoading && (
            <TradeDetails
              trade={trade}
              tradeDetails={tradeDetails}
              isLoading={isLoading}
            />
          )}
        </Box>
      </Box>
    </ModalWrapper>
  );
};

export default TradeDetailsModal;
