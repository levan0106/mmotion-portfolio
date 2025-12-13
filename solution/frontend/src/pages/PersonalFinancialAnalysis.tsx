/**
 * Personal Financial Analysis Main Page
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  useTheme,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { ResponsiveTypography } from '../components/Common/ResponsiveTypography';
import { ResponsiveButton } from '../components/Common';
import { ConfirmModal } from '../components/Common/ConfirmModal';
import { useNavigate } from 'react-router-dom';
import {
  useAnalyses,
  useDeleteAnalysis,
} from '../hooks/usePersonalFinancialAnalysis';
import { useTranslation } from 'react-i18next';
import { PersonalFinancialAnalysis, AnalysisStatus } from '../types/personalFinancialAnalysis.types';
import { formatCurrency } from '../utils/format';

const PersonalFinancialAnalysisPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { data: analyses, isLoading, error } = useAnalyses();
  const deleteAnalysisMutation = useDeleteAnalysis();
  const [analysisToDelete, setAnalysisToDelete] = useState<PersonalFinancialAnalysis | null>(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<{
    element: HTMLElement;
    analysis: PersonalFinancialAnalysis;
  } | null>(null);

  const handleCreateNew = () => {
    navigate('/personal-financial-analysis/new');
  };

  const handleEdit = (analysis: PersonalFinancialAnalysis) => {
    navigate(`/personal-financial-analysis/${analysis.id}`);
    setActionMenuAnchor(null);
  };

  const handleDelete = (analysis: PersonalFinancialAnalysis) => {
    setAnalysisToDelete(analysis);
    setActionMenuAnchor(null);
  };

  const handleConfirmDelete = async () => {
    if (analysisToDelete) {
      try {
        await deleteAnalysisMutation.mutateAsync(analysisToDelete.id);
        setAnalysisToDelete(null);
      } catch (error) {
        console.error('Error deleting analysis:', error);
      }
    }
  };

  const handleRowClick = (analysis: PersonalFinancialAnalysis, event: React.MouseEvent) => {
    // Prevent opening menu when clicking row
    if ((event.target as HTMLElement).closest('button')) {
      return;
    }
    handleEdit(analysis);
  };

  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, analysis: PersonalFinancialAnalysis) => {
    event.stopPropagation();
    setActionMenuAnchor({ element: event.currentTarget, analysis });
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
  };


  if (isLoading) {
    return (
      <Box>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <ResponsiveTypography sx={{ mt: 2 }}>Loading analyses...</ResponsiveTypography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>{t('personalFinancialAnalysis.error.loading')}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <ResponsiveTypography 
              variant="pageHeader" 
              sx={{ 
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              {t('personalFinancialAnalysis.title')}
            </ResponsiveTypography>
            <ResponsiveTypography 
              variant="pageSubtitle" 
              color="text.secondary"
              sx={{
                display: { xs: 'none', md: 'block' }
              }}
            >
              {t('personalFinancialAnalysis.subtitle')}
            </ResponsiveTypography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <ResponsiveButton
              variant="contained"
              icon={<AddIcon />}
              onClick={handleCreateNew}
              mobileText={t('personalFinancialAnalysis.createNew')}
              desktopText={t('personalFinancialAnalysis.createNew')}
              breakpoint="sm"
              sx={{ borderRadius: 2 }}
            >
              {t('personalFinancialAnalysis.createNew')}
            </ResponsiveButton>
          </Box>
        </Box>
      </Box>
      <Box sx={{ px: { xs: 0, sm: 4 } }}>

        {/* Analyses List */}
        {analyses && analyses.length > 0 ? (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <ResponsiveTypography variant="tableCellSmall" sx={{ fontWeight: 600 }}>
                      {t('personalFinancialAnalysis.table.name')}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell>
                    <ResponsiveTypography variant="tableCellSmall" sx={{ fontWeight: 600 }}>
                      {t('personalFinancialAnalysis.table.analysisDate')}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell>
                    <ResponsiveTypography variant="tableCellSmall" sx={{ fontWeight: 600 }}>
                      {t('personalFinancialAnalysis.table.totalAssets')}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell>
                    <ResponsiveTypography variant="tableCellSmall" sx={{ fontWeight: 600 }}>
                      {t('personalFinancialAnalysis.table.totalDebt')}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell>
                    <ResponsiveTypography variant="tableCellSmall" sx={{ fontWeight: 600 }}>
                      {t('personalFinancialAnalysis.table.netWorth')}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell>
                    <ResponsiveTypography variant="tableCellSmall" sx={{ fontWeight: 600 }}>
                      {t('personalFinancialAnalysis.table.status')}
                    </ResponsiveTypography>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', width: 80 }}>
                    <ResponsiveTypography variant="tableCellSmall" sx={{ fontWeight: 600 }}>
                      {t('common.actions')}
                    </ResponsiveTypography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analyses.map((analysis) => {
                  // Calculate totals for display
                  const totalAssets = analysis.assets.reduce((sum, a) => sum + a.value, 0);
                  const totalDebt = analysis.debts.reduce(
                    (sum, d) => sum + (d.remainingBalance ?? d.principalAmount),
                    0
                  );
                  const netWorth = totalAssets - totalDebt;

                  return (
                    <TableRow
                      key={analysis.id}
                      hover
                      onClick={(e) => handleRowClick(analysis, e)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <ResponsiveTypography variant="body2" sx={{ fontWeight: 500 }}>
                          {analysis.name || t('personalFinancialAnalysis.unnamed')}
                        </ResponsiveTypography>
                      </TableCell>
                      <TableCell>
                        <ResponsiveTypography variant="body2">
                          {new Date(analysis.analysisDate).toLocaleDateString()}
                        </ResponsiveTypography>
                      </TableCell>
                      <TableCell>
                        <ResponsiveTypography variant="body2">
                          {formatCurrency(totalAssets, analysis.baseCurrency)}
                        </ResponsiveTypography>
                      </TableCell>
                      <TableCell>
                        <ResponsiveTypography variant="body2">
                          {formatCurrency(totalDebt, analysis.baseCurrency)}
                        </ResponsiveTypography>
                      </TableCell>
                      <TableCell>
                        <ResponsiveTypography
                          variant="body2"
                          sx={{
                            color: netWorth >= 0 ? theme.palette.success.main : theme.palette.error.main,
                            fontWeight: 500,
                          }}
                        >
                          {formatCurrency(netWorth, analysis.baseCurrency)}
                        </ResponsiveTypography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={t(`personalFinancialAnalysis.status.${analysis.status}`)}
                          size="small"
                          color={analysis.status === AnalysisStatus.FINAL ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={(e) => handleActionMenuOpen(e, analysis)}
                          sx={{ color: theme.palette.text.secondary }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
            <ResponsiveTypography variant="h6" sx={{ mb: 2 }}>
              {t('personalFinancialAnalysis.noAnalyses')}
            </ResponsiveTypography>
            <ResponsiveTypography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('personalFinancialAnalysis.noAnalysesDescription')}
            </ResponsiveTypography>
            <ResponsiveButton variant="contained" onClick={handleCreateNew}>
              {t('personalFinancialAnalysis.createFirst')}
            </ResponsiveButton>
          </Paper>
        )}
      </Box>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor?.element}
        open={!!actionMenuAnchor}
        onClose={handleActionMenuClose}
      >
        <MenuItem
          onClick={() => {
            if (actionMenuAnchor) {
              handleEdit(actionMenuAnchor.analysis);
            }
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('common.edit')}</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (actionMenuAnchor) {
              handleDelete(actionMenuAnchor.analysis);
            }
          }}
          sx={{ color: theme.palette.error.main }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
          </ListItemIcon>
          <ListItemText>{t('common.delete')}</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={!!analysisToDelete}
        title={t('personalFinancialAnalysis.delete.title')}
        message={t('personalFinancialAnalysis.delete.message', {
          name: analysisToDelete?.name || t('personalFinancialAnalysis.unnamed'),
        })}
        onConfirm={handleConfirmDelete}
        onClose={() => setAnalysisToDelete(null)}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        confirmColor="error"
        isLoading={deleteAnalysisMutation.isLoading}
      />
    </Box>
  );
};

export default PersonalFinancialAnalysisPage;

