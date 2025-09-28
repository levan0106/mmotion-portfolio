// DeleteSnapshotsModal Component for CR-006 Asset Snapshot System

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  LinearProgress,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Warning as WarningIcon,
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material';
import { SnapshotGranularity } from '../../types/snapshot.types';
import { snapshotService } from '../../services/snapshot.service';

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
      setStatus({ type: 'error', message: 'Portfolio ID is required' });
      return;
    }

    setIsDeleting(true);
    setStatus({ type: null, message: '' });

    try {
      let result: { deletedCount: number; message: string };

      switch (deleteMode) {
        case 'date':
          if (!snapshotDate) {
            setStatus({ type: 'error', message: 'Please select a snapshot date' });
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
            setStatus({ type: 'error', message: 'Please select both start and end dates' });
            setIsDeleting(false);
            return;
          }
          if (new Date(startDate) > new Date(endDate)) {
            setStatus({ type: 'error', message: 'Start date must be before end date' });
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
          throw new Error('Invalid delete mode');
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
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete snapshots';
      
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
        return 'Delete all snapshots for a specific date';
      case 'dateRange':
        return 'Delete all snapshots within a date range';
      case 'granularity':
        return 'Delete all snapshots of a specific granularity (daily/weekly/monthly)';
      default:
        return '';
    }
  };

  // const getModeIcon = () => {
  //   switch (deleteMode) {
  //     case 'date':
  //       return <CalendarIcon />;
  //     case 'dateRange':
  //       return <DateRangeIcon />;
  //     case 'granularity':
  //       return <ScheduleIcon />;
  //     default:
  //       return <DeleteIcon />;
  //   }
  // };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteIcon color="error" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Delete Snapshots
          </Typography>
        </Box>
        {portfolioName && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Portfolio: {portfolioName}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent>
        {isDeleting && <LinearProgress sx={{ mb: 2 }} />}

        {status.type && (
          <Alert 
            severity={status.type} 
            icon={status.type === 'error' ? <WarningIcon /> : undefined}
            onClose={() => setStatus({ type: null, message: '' })}
            sx={{ mb: 2 }}
          >
            {status.message}
          </Alert>
        )}

        {/* Delete Mode Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            Delete Mode
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Chip
              label="Specific Date"
              onClick={() => setDeleteMode('date')}
              color={deleteMode === 'date' ? 'primary' : 'default'}
              icon={<CalendarIcon />}
              clickable
            />
            <Chip
              label="Date Range"
              onClick={() => setDeleteMode('dateRange')}
              color={deleteMode === 'dateRange' ? 'primary' : 'default'}
              icon={<DateRangeIcon />}
              clickable
            />
            <Chip
              label="By Granularity"
              onClick={() => setDeleteMode('granularity')}
              color={deleteMode === 'granularity' ? 'primary' : 'default'}
              icon={<ScheduleIcon />}
              clickable
            />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {getModeDescription()}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Granularity Selection */}
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Granularity</InputLabel>
            <Select
              value={granularity}
              onChange={(e) => setGranularity(e.target.value as SnapshotGranularity)}
              label="Granularity"
              disabled={isDeleting}
            >
              <MenuItem value={SnapshotGranularity.DAILY}>Daily</MenuItem>
              <MenuItem value={SnapshotGranularity.WEEKLY}>Weekly</MenuItem>
              <MenuItem value={SnapshotGranularity.MONTHLY}>Monthly</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Date Inputs */}
        {deleteMode === 'date' && (
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              type="date"
              label="Snapshot Date"
              value={snapshotDate}
              onChange={(e) => setSnapshotDate(e.target.value)}
              disabled={isDeleting}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Box>
        )}

        {deleteMode === 'dateRange' && (
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isDeleting}
                InputLabelProps={{ shrink: true }}
                required
              />
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isDeleting}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Stack>
          </Box>
        )}

        {/* Warning */}
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Warning: This action cannot be undone!
          </Typography>
          <Typography variant="body2">
            All selected snapshots will be permanently deleted from the database.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={handleClose}
          disabled={isDeleting}
          sx={{ textTransform: 'none' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          variant="contained"
          color="error"
          startIcon={<DeleteIcon />}
          disabled={isDeleting}
          sx={{ textTransform: 'none' }}
        >
          {isDeleting ? 'Deleting...' : 'Delete Snapshots'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteSnapshotsModal;
