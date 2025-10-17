// RefreshConfirmModal Component for CR-006 Asset Snapshot System

import React from 'react';
import {
  Button,
  Alert,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { ModalWrapper } from '../Common/ModalWrapper';
import { useTranslation } from 'react-i18next';

interface RefreshConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isRefreshing: boolean;
}

export const RefreshConfirmModal: React.FC<RefreshConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
  isRefreshing,
}) => {
  const { t } = useTranslation();

  const modalIcon = (
    <Box
      sx={{
        p: 1.5,
        borderRadius: '50%',
        bgcolor: 'info.light',
        color: 'info.contrastText',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <InfoIcon fontSize="medium" />
    </Box>
  );

  const modalActions = (
    <>
      <Button
        onClick={onClose}
        variant="outlined"
        disabled={isRefreshing}
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
        color="primary"
        disabled={isRefreshing}
        startIcon={isRefreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
        sx={{ 
          textTransform: 'none',
          minWidth: 140
        }}
      >
        {isRefreshing ? t('snapshots.refreshing') : t('snapshots.refreshData')}
      </Button>
    </>
  );

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title={t('snapshots.refreshConfirmTitle')}
      icon={modalIcon}
      actions={modalActions}
      loading={isRefreshing}
      maxWidth="sm"
      titleColor="primary"
      size="medium"
    >
      <ResponsiveTypography variant="cardLabel" ellipsis={true} sx={{ mb: 3 }}>
        {t('snapshots.refreshConfirm')}
      </ResponsiveTypography>
      <Alert 
        severity="info" 
        sx={{ 
          '& .MuiAlert-message': {
            width: '100%'
          }
        }}
      >
        <ResponsiveTypography variant="cardLabel" ellipsis={false}>
          {t('snapshots.refreshWarning')}
        </ResponsiveTypography>
      </Alert>
    </ModalWrapper>
  );
};

export default RefreshConfirmModal;
