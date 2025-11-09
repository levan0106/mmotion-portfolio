// RecalculateConfirmModal Component for CR-006 Asset Snapshot System

import React from 'react';
import {
  Button,
  Alert,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { ModalWrapper } from '../Common/ModalWrapper';
import { useTranslation } from 'react-i18next';

interface RecalculateConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isRecalculating: boolean;
}

export const RecalculateConfirmModal: React.FC<RecalculateConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
  isRecalculating,
}) => {
  const { t } = useTranslation();

  const modalIcon = (
    <Box
      sx={{
        p: 1.5,
        borderRadius: '50%',
        bgcolor: 'warning.light',
        color: 'warning.contrastText',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <WarningIcon fontSize="medium" />
    </Box>
  );

  const modalActions = (
    <>
      <Button
        onClick={onClose}
        variant="outlined"
        disabled={isRecalculating}
        sx={{ 
          textTransform: 'none',
          minWidth: 100
        }}
      >
        {t('common.cancel')}
      </Button>
      <Button
        onClick={onConfirm}
        variant="contained"
        color="warning"
        disabled={isRecalculating}
        startIcon={isRecalculating ? <CircularProgress size={20} /> : <RefreshIcon />}
        sx={{ 
          textTransform: 'none',
          minWidth: 140
        }}
      >
        {isRecalculating ? t('snapshots.recalculating') : t('snapshots.recalculateAll')}
      </Button>
    </>
  );

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title={t('snapshots.recalculateConfirmTitle')}
      icon={modalIcon}
      actions={modalActions}
      loading={isRecalculating}
      maxWidth="sm"
      titleColor="warning"
      size="medium"
    >
      <ResponsiveTypography variant="labelMedium" ellipsis={false} 
      sx={{ mb: 3, mt: 3 
      }}>
        {t('snapshots.recalculateConfirm')}
      </ResponsiveTypography>
      <Alert 
        severity="warning" 
        sx={{ 
            '& .MuiAlert-message': {
                color: 'text.primary',
                width: '100%'
            }
        }}
      >
        {t('snapshots.recalculateWarning')}
      </Alert>
    </ModalWrapper>
  );
};

export default RecalculateConfirmModal;
