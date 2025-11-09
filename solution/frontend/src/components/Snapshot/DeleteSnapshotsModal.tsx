// DeleteSnapshotsModal Component for CR-006 Asset Snapshot System

import React, { useState } from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  LinearProgress,
  Chip,
  Stack,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Warning as WarningIcon,
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material';
import { ResponsiveButton, ActionButton } from '../Common';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { ModalWrapper } from '../Common/ModalWrapper';
import { SnapshotGranularity } from '../../types/snapshot.types';
import { snapshotService } from '../../services/snapshot.service';
import { useTranslation } from 'react-i18next';

interface DeleteSnapshotsModalProps {
  open: boolean;
  onClose: () => void;
  portfolioId: string;
  portfolioName?: string;
  onSuccess?: (deletedCount: number, message: string) => void;
  onError?: (error: string) => void;
}

type DeleteMode = 'date' | 'dateRange' | 'granularity';

const DeleteSnapshotsModal: React.FC<DeleteSnapshotsModalProps> = ({
  open,
  onClose,
  portfolioId,
  portfolioName,
  onSuccess,
  onError,
}) => {
  const { t } = useTranslation();
  const [deleteMode, setDeleteMode] = useState<DeleteMode>('date');
  const [snapshotDate, setSnapshotDate] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [granularity, setGranularity] = useState<SnapshotGranularity>(SnapshotGranularity.DAILY);
  const [isDeleting, setIsDeleting] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleClose = () => {
    if (!isDeleting) {
      setStatus({ type: null, message: '' });
      setSnapshotDate('');
      setStartDate('');
      setEndDate('');
      setGranularity(SnapshotGranularity.DAILY);
      setDeleteMode('date');
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!portfolioId) {
      setStatus({ type: 'error', message: t('snapshots.modals.deleteSnapshots.portfolioIdRequired') });
      return;
    }

    setIsDeleting(true);
    setStatus({ type: null, message: '' });

    try {
      let result: { deletedCount: number; message: string };

      switch (deleteMode) {
        case 'date':
          if (!snapshotDate) {
            setStatus({ type: 'error', message: t('snapshots.modals.deleteSnapshots.selectSnapshotDate') });
            setIsDeleting(false);
            return;
          }
          result = await snapshotService.deleteSnapshotsByDate(
            portfolioId,
            snapshotDate,
            granularity
          );
          break;

        case 'dateRange':
          if (!startDate || !endDate) {
            setStatus({ type: 'error', message: t('snapshots.modals.deleteSnapshots.selectBothDates') });
            setIsDeleting(false);
            return;
          }
          if (new Date(startDate) > new Date(endDate)) {
            setStatus({ type: 'error', message: t('snapshots.modals.deleteSnapshots.startDateBeforeEndDate') });
            setIsDeleting(false);
            return;
          }
          result = await snapshotService.deleteSnapshotsByDateRange(
            portfolioId,
            startDate,
            endDate,
            granularity
          );
          break;

        case 'granularity':
          result = await snapshotService.deleteSnapshotsByGranularity(
            portfolioId,
            granularity
          );
          break;

        default:
          throw new Error(t('snapshots.modals.deleteSnapshots.invalidDeleteMode'));
      }

      setStatus({
        type: 'success',
        message: result.message,
      });

      onSuccess?.(result.deletedCount, result.message);

      // Close modal after a short delay
      setTimeout(() => {
        handleClose();
      }, 500);

    } catch (error: any) {
      console.error('Failed to delete snapshots:', error);
      const errorMessage = error.response?.data?.message || error.message || t('snapshots.modals.deleteSnapshots.failedToDelete');
      
      setStatus({
        type: 'error',
        message: errorMessage,
      });

      onError?.(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const getModeDescription = () => {
    switch (deleteMode) {
      case 'date':
        return t('snapshots.modals.deleteSnapshots.specificDateDescription');
      case 'dateRange':
        return t('snapshots.modals.deleteSnapshots.dateRangeDescription');
      case 'granularity':
        return t('snapshots.modals.deleteSnapshots.granularityDescription');
      default:
        return '';
    }
  };

  const modalIcon = (
    <Box
      sx={{
        p: 1.5,
        borderRadius: '50%',
        bgcolor: 'error.light',
        color: 'error.contrastText',
      }}
    >
      <DeleteIcon fontSize="medium" />
    </Box>
  );

  const modalActions = (
    <>
      <ResponsiveButton
        variant="text"
        onClick={handleClose}
        disabled={isDeleting}
        sx={{ textTransform: 'none' }}
      >
        {t('snapshots.modals.deleteSnapshots.cancel')}
      </ResponsiveButton>
      <ActionButton
        variant="contained"
        color="error"
        icon={isDeleting ? undefined : <DeleteIcon />}
        mobileText={t('snapshots.modals.deleteSnapshots.delete')}
        desktopText={t('snapshots.modals.deleteSnapshots.deleteSnapshots')}
        onClick={handleDelete}
        disabled={isDeleting}
        forceTextOnly={true}
        sx={{ textTransform: 'none', minWidth: 140 }}
      >
        {isDeleting ? t('snapshots.modals.deleteSnapshots.deleting') : t('snapshots.modals.deleteSnapshots.deleteSnapshots')}
      </ActionButton>
    </>
  );

  return (
    <ModalWrapper
      open={open}
      onClose={handleClose}
      title={`${t('snapshots.modals.deleteSnapshots.title')}${portfolioName ? ` - ${portfolioName}` : ''}`}
      icon={modalIcon}
      actions={modalActions}
      loading={isDeleting}
      maxWidth="sm"
      titleColor="error"
      size="medium"
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
          {isDeleting && <LinearProgress sx={{ mb: 2 }} />}

          {status.type && (
            <Alert 
              severity={status.type} 
              icon={status.type === 'error' ? <WarningIcon /> : undefined}
              onClose={() => setStatus({ type: null, message: '' })}
            >
              {status.message}
            </Alert>
          )}

          {/* Delete Mode Selection */}
          <Box>
            <ResponsiveTypography 
              variant="formLabel" 
              sx={{ 
                mb: 2, 
                fontWeight: 600
              }}
            >
              {t('snapshots.modals.deleteSnapshots.deleteMode')}
            </ResponsiveTypography>
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
              <Chip
                label={t('snapshots.modals.deleteSnapshots.specificDate')}
                onClick={() => setDeleteMode('date')}
                color={deleteMode === 'date' ? 'primary' : 'default'}
                icon={<CalendarIcon />}
                clickable
                size="medium"
                sx={{ mb: 1 }}
              />
              <Chip
                label={t('snapshots.modals.deleteSnapshots.dateRange')}
                onClick={() => setDeleteMode('dateRange')}
                color={deleteMode === 'dateRange' ? 'primary' : 'default'}
                icon={<DateRangeIcon />}
                clickable
                size="medium"
                sx={{ mb: 1 }}
              />
              <Chip
                label={t('snapshots.modals.deleteSnapshots.byGranularity')}
                onClick={() => setDeleteMode('granularity')}
                color={deleteMode === 'granularity' ? 'primary' : 'default'}
                icon={<ScheduleIcon />}
                clickable
                size="medium"
                sx={{ mb: 1 }}
              />
            </Stack>
            <ResponsiveTypography 
              variant="formHelper" 
              color="text.secondary"
            >
              {getModeDescription()}
            </ResponsiveTypography>
          </Box>

          {/* Granularity Selection */}
          {deleteMode === 'granularity' && (
            <FormControl fullWidth>
              <InputLabel>{t('snapshots.modals.deleteSnapshots.granularity')}</InputLabel>
              <Select
                value={granularity}
                onChange={(e) => setGranularity(e.target.value as SnapshotGranularity)}
                label={t('snapshots.modals.deleteSnapshots.granularity')}
                disabled={isDeleting}
                size="medium"
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  },
                  '& .MuiFormLabel-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              >
                <MenuItem 
                  value={SnapshotGranularity.DAILY}
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  {t('snapshots.modals.deleteSnapshots.daily')}
                </MenuItem>
                <MenuItem 
                  value={SnapshotGranularity.WEEKLY}
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  {t('snapshots.modals.deleteSnapshots.weekly')}
                </MenuItem>
                <MenuItem 
                  value={SnapshotGranularity.MONTHLY}
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  {t('snapshots.modals.deleteSnapshots.monthly')}
                </MenuItem>
              </Select>
            </FormControl>
          )}

          {/* Date Inputs */}
          {deleteMode === 'date' && (
            <TextField
              fullWidth
              type="date"
              label={t('snapshots.modals.deleteSnapshots.snapshotDate')}
              value={snapshotDate}
              onChange={(e) => setSnapshotDate(e.target.value)}
              disabled={isDeleting}
              InputLabelProps={{ shrink: true }}
              required
              helperText={t('snapshots.modals.deleteSnapshots.selectDate')}
              size="medium"
              sx={{
                '& .MuiInputBase-input': {
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                },
                '& .MuiFormLabel-root': {
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                },
                '& .MuiFormHelperText-root': {
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }
              }}
            />
          )}

          {deleteMode === 'dateRange' && (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                type="date"
                label={t('snapshots.modals.deleteSnapshots.startDate')}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isDeleting}
                InputLabelProps={{ shrink: true }}
                required
                helperText={t('snapshots.modals.deleteSnapshots.startDateHelper')}
                size="medium"
                sx={{ 
                  flex: 1, 
                  minWidth: 200,
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  },
                  '& .MuiFormLabel-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  },
                  '& .MuiFormHelperText-root': {
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }
                }}
              />
              <TextField
                type="date"
                label={t('snapshots.modals.deleteSnapshots.endDate')}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isDeleting}
                InputLabelProps={{ shrink: true }}
                required
                helperText={t('snapshots.modals.deleteSnapshots.endDateHelper')}
                size="medium"
                sx={{ 
                  flex: 1, 
                  minWidth: 200,
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  },
                  '& .MuiFormLabel-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  },
                  '& .MuiFormHelperText-root': {
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }
                }}
              />
            </Box>
          )}

          {/* Warning */}
          <Alert 
            severity="warning" 
            icon={<WarningIcon />}
            sx={{
              '& .MuiAlert-message': {
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }
            }}
          >
            <ResponsiveTypography 
              variant="formLabel" 
              sx={{ 
                fontWeight: 600
              }}
            >
              {t('snapshots.modals.deleteSnapshots.warning')}
            </ResponsiveTypography>
            <ResponsiveTypography 
              variant="formHelper"
            >
              {t('snapshots.modals.deleteSnapshots.warningDescription')}
            </ResponsiveTypography>
          </Alert>

      </Box>
    </ModalWrapper>
  );
};

export default DeleteSnapshotsModal;
