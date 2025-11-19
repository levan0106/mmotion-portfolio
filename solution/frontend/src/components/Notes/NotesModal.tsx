/**
 * Notes Modal Component
 * Displays a modal with note form at the top and notes list at the bottom
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  TextField,
  List,
  ListItem,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Notes as NotesIcon,
} from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Note, CreateNoteDto, UpdateNoteDto, Asset } from '../../types';
import { noteService } from '../../services/note.service';
import { useAccount } from '../../contexts/AccountContext';
import { usePortfolios } from '../../hooks/usePortfolios';
import { format } from 'date-fns';
import { ModalWrapper, ResponsiveTypography, ResponsiveButton } from '../Common';
import ConfirmModal from '../Common/ConfirmModal';

interface NotesModalProps {
  open: boolean;
  onClose: () => void;
  portfolioId?: string;
}

const NotesModal: React.FC<NotesModalProps> = ({ open, onClose, portfolioId }) => {
  const { t } = useTranslation();
  const { accountId } = useAccount();
  const { portfolios } = usePortfolios(accountId || '');
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>(portfolioId || '');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [assets, setAssets] = useState<Asset[]>([]);
  
  // Form state
  const [noteContent, setNoteContent] = useState('');
  const [noteDate, setNoteDate] = useState<Date | null>(new Date());
  const [formAssetId, setFormAssetId] = useState<string>('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize selected portfolio
  useEffect(() => {
    if (portfolioId) {
      setSelectedPortfolioId(portfolioId);
    } else if (portfolios && portfolios.length > 0) {
      setSelectedPortfolioId(portfolios[0].portfolioId);
    }
  }, [portfolioId, portfolios]);

  // Load assets for selected portfolio
  useEffect(() => {
    if (!selectedPortfolioId || !accountId) {
      setAssets([]);
      return;
    }
    
    // Get assets from portfolio's portfolioAssets
    const portfolio = portfolios?.find(p => p.portfolioId === selectedPortfolioId);
    if (portfolio?.portfolioAssets) {
      const portfolioAssets = portfolio.portfolioAssets
        .map(pa => pa.asset)
        .filter((asset): asset is Asset => asset !== undefined);
      setAssets(portfolioAssets);
    } else {
      setAssets([]);
    }
  }, [selectedPortfolioId, accountId, portfolios]);

  // Load notes
  const loadNotes = async () => {
    if (!selectedPortfolioId || !accountId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await noteService.getNotesByPortfolio(
        selectedPortfolioId,
        accountId,
        selectedAssetId || undefined
      );
      setNotes(data);
    } catch (err: any) {
      setError(err.response?.data?.message || t('notes.error.loadFailed') || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && selectedPortfolioId) {
      loadNotes();
    }
  }, [open, selectedPortfolioId, selectedAssetId, accountId]);

  const handleSubmit = async () => {
    if (!selectedPortfolioId || !accountId || !noteContent.trim() || !noteDate) {
      setError(t('notes.error.contentRequired') || 'Content and date are required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Format date with current time as ISO string in local timezone (not UTC)
      // User only selects date, time is automatically set to current time
      const formatLocalDateTime = (date: Date): string => {
        const now = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      };

      if (editingNote) {
        const updateData: UpdateNoteDto = {
          assetId: formAssetId || undefined,
          noteDate: formatLocalDateTime(noteDate),
          content: noteContent.trim(),
        };
        await noteService.updateNote(editingNote.noteId, updateData, accountId);
      } else {
        const createData: CreateNoteDto = {
          portfolioId: selectedPortfolioId,
          assetId: formAssetId || undefined,
          noteDate: formatLocalDateTime(noteDate),
          content: noteContent.trim(),
        };
        await noteService.createNote(createData, accountId);
      }

      // Reset form
      setNoteContent('');
      setNoteDate(new Date());
      setFormAssetId('');
      setEditingNote(null);
      
      // Reload notes
      await loadNotes();
    } catch (err: any) {
      setError(err.response?.data?.message || t('notes.error.saveFailed') || 'Failed to save note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setNoteContent(note.content);
    // Parse date-time string (YYYY-MM-DDTHH:mm:ss) to extract only date part
    // User only selects date, time is automatically added when saving
    const datePart = note.noteDate.includes('T') 
      ? note.noteDate.split('T')[0] 
      : note.noteDate;
    const [year, month, day] = datePart.split('-').map(Number);
    setNoteDate(new Date(year, month - 1, day));
    setFormAssetId(note.assetId || '');
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setNoteContent('');
    setNoteDate(new Date());
    setFormAssetId('');
  };

  const handleDeleteClick = (note: Note) => {
    setNoteToDelete(note);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!accountId || !noteToDelete) return;

    try {
      setIsDeleting(true);
      setError(null);
      await noteService.deleteNote(noteToDelete.noteId, accountId);
      setDeleteConfirmOpen(false);
      setNoteToDelete(null);
      await loadNotes();
    } catch (err: any) {
      setError(err.response?.data?.message || t('notes.error.deleteFailed') || 'Failed to delete note');
      setDeleteConfirmOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setNoteToDelete(null);
  };

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title={t('notes.title') || 'Ghi chú'}
      icon={<NotesIcon color="primary" />}
      maxWidth="lg"
      fullWidth
    >
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2, 
          py: 1,
          overflow: 'auto',
        //   maxHeight: 'calc(90vh - 200px)',
        }}
      >
        {/* Error Alert */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Note Form Section - Two column layout */}
        <Box 
          sx={{ 
            border: '0px solid', 
            borderColor: 'divider', 
            borderRadius: 2, 
            p: 0,
            display: 'flex',
            gap: 2,
            alignItems: 'flex-start',
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
          }}
        >
          {/* Left Column: Portfolio and Date (4/12) */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 1,
            width: { xs: '100%', sm: '33.333%' }, // 4/12 = 33.333%
            flexShrink: 0,
          }}>
            {/* Portfolio Selection */}
            {!portfolioId && portfolios && portfolios.length > 0 && (
              <FormControl fullWidth size="small">
                <InputLabel>{t('notes.portfolio') || 'Portfolio'}</InputLabel>
                <Select
                  value={selectedPortfolioId}
                  label={t('notes.portfolio') || 'Portfolio'}
                  onChange={(e) => setSelectedPortfolioId(e.target.value)}
                >
                  {portfolios.map((portfolio) => (
                    <MenuItem key={portfolio.portfolioId} value={portfolio.portfolioId}>
                      {portfolio.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label={t('notes.noteDate') || 'Ngày'}
                value={noteDate}
                onChange={(newValue) => setNoteDate(newValue)}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                  },
                }}
              />
            </LocalizationProvider>
          </Box>

          {/* Right Column: Asset, Note Content, and Buttons (8/12) */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 1,
            width: { xs: '100%', sm: '66.667%' }, // 8/12 = 66.667%
            flexGrow: 1,
          }}>
            {/* Asset Selection */}
            {assets.length > 0 && (
              <FormControl 
                size="small" 
                fullWidth
              >
                <InputLabel>{t('notes.asset') || 'Asset'}</InputLabel>
                <Select
                  value={formAssetId}
                  label={t('notes.asset') || 'Asset'}
                  onChange={(e) => setFormAssetId(e.target.value)}
                >
                  <MenuItem value="">{t('notes.noAsset') || 'Không có'}</MenuItem>
                  {assets.map((asset) => (
                    <MenuItem key={asset.id} value={asset.id}>
                      {asset.symbol || asset.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Note Content */}
            <TextField
              placeholder={t('notes.contentPlaceholder') || 'Nhập nội dung ghi chú...'}
              fullWidth
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              variant="outlined"
              size="medium"
              multiline
              rows={2}
            />

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
              {editingNote && (
                <ResponsiveButton
                  onClick={handleCancelEdit}
                  size="small"
                  variant="outlined"
                  mobileText={t('common.cancel') || 'Hủy'}
                  desktopText={t('common.cancel') || 'Hủy'}
                  sx={{ minWidth: 'auto', px: 1.5 }}
                >
                  {t('common.cancel') || 'Hủy'}
                </ResponsiveButton>
              )}
              <ResponsiveButton
                onClick={handleSubmit}
                variant="contained"
                disabled={!noteContent.trim() || !noteDate || isSubmitting}
                size="small"
                mobileText={
                  isSubmitting
                    ? t('common.processing') || 'Đang xử lý...'
                    : editingNote
                    ? t('common.update') || 'Sửa'
                    : t('common.create') || 'Thêm'
                }
                desktopText={
                  isSubmitting
                    ? t('common.processing') || 'Đang xử lý...'
                    : editingNote
                    ? t('common.update') || 'Cập nhật'
                    : t('common.create') || 'Thêm'
                }
                sx={{ minWidth: 'auto', px: 2 }}
              >
                {isSubmitting ? (
                  <CircularProgress size={16} />
                ) : editingNote ? (
                  t('common.update') || 'Sửa'
                ) : (
                  t('common.create') || 'Thêm'
                )}
              </ResponsiveButton>
            </Box>
          </Box>
        </Box>

        <Divider />

        {/* Notes List Section */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <ResponsiveTypography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {t('notes.list') || 'Danh sách ghi chú'}
            </ResponsiveTypography>
            {assets.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>{t('notes.filterByAsset') || 'Lọc theo Asset'}</InputLabel>
                <Select
                  value={selectedAssetId}
                  label={t('notes.filterByAsset') || 'Lọc theo Asset'}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                >
                  <MenuItem value="">{t('notes.allAssets') || 'Tất cả'}</MenuItem>
                  {assets.map((asset) => (
                    <MenuItem key={asset.id} value={asset.id}>
                      {asset.symbol || asset.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>

          {loading && notes.length === 0 ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress size={24} />
            </Box>
          ) : notes.length === 0 ? (
            <Alert severity="info">{t('notes.noNotes') || 'Chưa có ghi chú nào.'}</Alert>
          ) : (
            <List dense>
              {notes.map((note) => (
                <ListItem
                  key={note.noteId}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1.5,
                    mb: 1,
                    p: 1.5,
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                        {/* <ResponsiveTypography variant="caption" color="text.secondary">
                          {note.noteDate.includes('T')
                            ? format(parseISO(note.noteDate), 'dd/MM/yyyy HH:mm:ss')
                            : format(parseISO(note.noteDate + 'T00:00:00'), 'dd/MM/yyyy')}
                        </ResponsiveTypography> */}
                        {note.asset && (
                          <Chip
                            label={note.asset.symbol || note.asset.name}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                      <ResponsiveTypography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>
                        {note.content}
                      </ResponsiveTypography>
                      <ResponsiveTypography variant="caption" color="text.secondary">
                        {t('notes.createdAt', { date: format(new Date(note.noteDate), 'dd/MM/yyyy HH:mm') }) ||
                          `Tạo lúc: ${format(new Date(note.noteDate), 'dd/MM/yyyy HH:mm')}`}
                      </ResponsiveTypography>
                    </Box>
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleEdit(note)}
                        sx={{ mr: 0.5 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleDeleteClick(note)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Box>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={t('notes.delete.title') || 'Xóa ghi chú'}
        message={
          noteToDelete
            ? t('notes.delete.message', { 
                content: noteToDelete.content.length > 100 
                  ? noteToDelete.content.substring(0, 100) + '...' 
                  : noteToDelete.content 
              }) || 
              `Bạn có chắc chắn muốn xóa ghi chú này không?\n\n"${noteToDelete.content.length > 100 ? noteToDelete.content.substring(0, 100) + '...' : noteToDelete.content}"\n\nHành động này không thể hoàn tác.`
            : t('notes.confirmDelete') || 'Bạn có chắc chắn muốn xóa ghi chú này không?'
        }
        confirmText={t('common.delete') || 'Xóa'}
        cancelText={t('common.cancel') || 'Hủy'}
        type="delete"
        isLoading={isDeleting}
        confirmColor="error"
      />
    </ModalWrapper>
  );
};

export default NotesModal;

