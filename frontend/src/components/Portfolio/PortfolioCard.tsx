/**
 * Portfolio card component for displaying portfolio summary
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Edit,
  ContentCopy,
  AccountBalanceWallet,
  Business,
  Delete as DeleteIcon,
  Public,
} from '@mui/icons-material';
import {
  Box,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
} from '@mui/material';
import { ResponsiveButton, ModalWrapper } from '../Common';
import { Portfolio } from '../../types';
import { formatCurrency } from '../../utils/format';
import { CopyPortfolioModal } from './CopyPortfolioModal';
import ResponsiveTypography from '../Common/ResponsiveTypography';
import './PortfolioCard.styles.css';

interface PortfolioCardProps {
  portfolio: Portfolio;
  onView: (portfolioId: string) => void;
  onEdit?: (portfolioId: string) => void;
  onDelete?: (portfolioId: string) => void;
  onPortfolioCopied?: (newPortfolio: Portfolio) => void;
  hideActions?: boolean;
}

const PortfolioCard: React.FC<PortfolioCardProps> = ({
  portfolio,
  onView,
  onEdit,
  onDelete,
  onPortfolioCopied,
  hideActions = false,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [modalJustClosed, setModalJustClosed] = useState(false);
  const [deleteConfirmationChecked, setDeleteConfirmationChecked] = useState(false);
  const isPositivePL = (Number(portfolio.unrealizedInvestPnL) || 0) >= 0;
  const isPositiveRealizedPL = (Number(portfolio.realizedInvestPnL) || 0) >= 0;
  const isFund = portfolio.isFund || false;

  const handleView = () => {
    // Don't navigate if portfolio is being deleted, already deleted, modal is open, or modal just closed
    if (isDeleting || isDeleted || deleteModalOpen || copyModalOpen || modalJustClosed) return;
    onView(portfolio.portfolioId);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent card click
    if (onEdit && !hideActions) {
      onEdit(portfolio.portfolioId);
    }
  };


  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation(); // Prevent event bubbling
    if (!hideActions) {
      setCopyModalOpen(true);
    }
  };

  const handleCopyModalClose = () => {
    setCopyModalOpen(false);
    setModalJustClosed(true);
    // Reset the flag after a short delay to allow normal clicking
    setTimeout(() => {
      setModalJustClosed(false);
    }, 200);
  };

  const handlePortfolioCopied = (newPortfolio: Portfolio) => {
    if (onPortfolioCopied) {
      onPortfolioCopied(newPortfolio);
    }
    // Don't close modal here - let CopyPortfolioModal handle it
    // setCopyModalOpen(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hideActions) {
      setDeleteModalOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!onDelete || !deleteConfirmationChecked) return;
    
    setIsDeleting(true);
    try {
      await onDelete(portfolio.portfolioId);
      setIsDeleted(true); // Mark as deleted to prevent navigation
      setDeleteModalOpen(false);
      setDeleteConfirmationChecked(false); // Reset confirmation checkbox
    } catch (error) {
      console.error('Failed to delete portfolio:', error);
      // Error handling is done in the parent component
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setDeleteConfirmationChecked(false); // Reset confirmation checkbox
    setModalJustClosed(true);
    // Reset the flag after a short delay to allow normal clicking
    setTimeout(() => {
      setModalJustClosed(false);
    }, 200);
  };

  return (
    <div 
      className={`portfolio-card ${isFund ? 'portfolio-card--fund' : 'portfolio-card--individual'} ${isDeleted ? 'portfolio-card--deleted' : ''}`} 
      onClick={handleView}
      style={{ 
        opacity: isDeleted ? 0.5 : 1,
        pointerEvents: isDeleted ? 'none' : 'auto',
        transition: 'opacity 0.3s ease'
      }}
    >
      <div className="portfolio-card__content">
        <div className="portfolio-card__header">
          <div className="portfolio-card__title-section">
            <div className="portfolio-card__title-wrapper">
              {isFund ? (
                <Business className="portfolio-card__type-icon portfolio-card__type-icon--fund" />
              ) : (
                <AccountBalanceWallet className="portfolio-card__type-icon portfolio-card__type-icon--individual" />
              )}
              <ResponsiveTypography variant="cardTitle" className="portfolio-card__title">
                {portfolio.name}
              </ResponsiveTypography>
              {portfolio.visibility === 'PUBLIC' && (
                <Tooltip title={t('portfolio.publicTooltip') || 'Public Portfolio'}>
                  <Public 
                    className="portfolio-card__public-icon" 
                    style={{ 
                      color: '#1976d2', 
                      marginLeft: '8px',
                      fontSize: '18px'
                    }} 
                  />
                </Tooltip>
              )}
            </div>
            <div className="portfolio-card__type-badge" style={{ display: isMobile ? 'none' : 'block' }}>
              {isFund ? t('portfolio.fund') : t('portfolio.individual')}
            </div>
          </div>
          <span className={`portfolio-card__currency ${portfolio.baseCurrency === 'USD' ? 'portfolio-card__currency--primary' : ''}`}>
            {portfolio.baseCurrency}
          </span>
        </div>

        <div className="portfolio-card__metrics">
          <div className="portfolio-card__total-value">
            <AccountBalance className="portfolio-card__total-value-icon" />
            <div>
              <ResponsiveTypography variant="cardValue" className="portfolio-card__total-value-amount">
                {formatCurrency(Number(portfolio.totalAllValue) || 0, portfolio.baseCurrency)}
              </ResponsiveTypography>
              <ResponsiveTypography variant="cardLabel" className="portfolio-card__total-value-label">
                {t('portfolio.investmentValue')}
              </ResponsiveTypography>
            </div>
          </div>

          <div className="portfolio-card__pl-section">
            <div className="portfolio-card__pl-item" >
              <div className="portfolio-card__pl-header">
                {isPositivePL ? (
                  <TrendingUp className={`portfolio-card__pl-icon portfolio-card__pl-icon--positive`} />
                ) : (
                  <TrendingDown className={`portfolio-card__pl-icon portfolio-card__pl-icon--negative`} />
                )}
                <ResponsiveTypography 
                  variant="cardValueMedium" 
                  sx={{ fontWeight: 600 }}
                  className={`portfolio-card__pl-amount ${isPositivePL ? 'portfolio-card__pl-amount--positive' : 'portfolio-card__pl-amount--negative'}`}
                >
                  {formatCurrency(Number(portfolio.unrealizedInvestPnL) || 0, portfolio.baseCurrency)}
                </ResponsiveTypography>
              </div>
              <ResponsiveTypography variant="cardLabel" className="portfolio-card__total-value-label">
                {t('portfolio.unrealizedPL')}
              </ResponsiveTypography>
            </div>

            <div className="portfolio-card__pl-item">
              <div className="portfolio-card__pl-header">
                {isPositiveRealizedPL ? (
                  <TrendingUp className={`portfolio-card__pl-icon portfolio-card__pl-icon--positive`} />
                ) : (
                  <TrendingDown className={`portfolio-card__pl-icon portfolio-card__pl-icon--negative`} />
                )}
                <ResponsiveTypography 
                  variant="cardValueMedium" 
                  sx={{ fontWeight: 600 }}
                  className={`portfolio-card__pl-amount ${isPositiveRealizedPL ? 'portfolio-card__pl-amount--positive' : 'portfolio-card__pl-amount--negative'}`}
                >
                  {formatCurrency(Number(portfolio.realizedInvestPnL) || 0, portfolio.baseCurrency)}
                </ResponsiveTypography>
              </div>
              <ResponsiveTypography variant="cardLabel" className="portfolio-card__total-value-label">
                {t('portfolio.realizedPL')}
              </ResponsiveTypography>
            </div>
          </div>

          <div className="portfolio-card__cash-balance">
            <ResponsiveTypography variant="cardLabel" className="portfolio-card__total-value-label">
              {t('portfolio.cashBalance')}
            </ResponsiveTypography>
            <ResponsiveTypography 
                  variant="cardValueMedium" 
                  sx={{ fontWeight: 600 }} className="portfolio-card__cash-amount">
              {formatCurrency(Number(portfolio.cashBalance) || 0, portfolio.baseCurrency)}
            </ResponsiveTypography>
          </div>
        </div>
      </div>

      {!hideActions && (
        <div className="portfolio-card__actions">
          {onEdit && (
            <Tooltip title={t('common.edit') || 'Edit'}>
              <IconButton
                onClick={handleEdit}
                color="primary"
                size="small"
                sx={{
                  '&:hover': {
                    backgroundColor: 'primary.light',
                    color: 'white',
                  },
                }}
              >
                <Edit />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={t('common.copy') || 'Copy'}>
            <IconButton
              onClick={handleCopy}
              color="secondary"
              size="small"
              sx={{
                '&:hover': {
                  backgroundColor: 'secondary.light',
                  color: 'white',
                },
              }}
            >
              <ContentCopy />
            </IconButton>
          </Tooltip>
          {onDelete && (
            <Tooltip title={t('common.delete') || 'Delete'}>
              <IconButton
                onClick={handleDelete}
                color="error"
                size="small"
                sx={{
                  '&:hover': {
                    backgroundColor: 'error.light',
                    color: 'white',
                  },
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </div>
      )}

      <CopyPortfolioModal
        open={copyModalOpen}
        onClose={handleCopyModalClose}
        sourcePortfolio={portfolio}
        onPortfolioCopied={handlePortfolioCopied}
        onModalClose={handleCopyModalClose}
      />

      {/* Delete Confirmation Modal */}
      <ModalWrapper
        open={deleteModalOpen}
        onClose={handleDeleteCancel}
        title={t('portfolio.delete')}
        icon={<DeleteIcon color="error" />}
        loading={isDeleting}
        maxWidth="sm"
        fullWidth={true}
        titleColor="error"
        actions={
          <>
            <ResponsiveButton
              onClick={handleDeleteCancel}
              disabled={isDeleting}
              color="inherit"
            >
              {t('common.cancel')}
            </ResponsiveButton>
            <ResponsiveButton
              onClick={handleDeleteConfirm}
              disabled={isDeleting || !deleteConfirmationChecked}
              color="error"
              variant="contained"
              icon={isDeleting ? <CircularProgress size={16} /> : <DeleteIcon />}
              mobileText={t('common.delete')}
              desktopText={t('portfolio.delete')}
            >
              {isDeleting ? t('portfolio.deleting') : t('portfolio.delete')}
            </ResponsiveButton>
          </>
        }
      >
        <Alert severity="warning" sx={{ mb: 2, mt: 2 }}>
          <ResponsiveTypography variant="body2" fontWeight="bold">
            {t('portfolio.cannotUndo')}
          </ResponsiveTypography>
        </Alert>
        
        <ResponsiveTypography variant="body1" paragraph>
          {t('portfolio.confirmDelete', { name: portfolio.name })}
        </ResponsiveTypography>
        
        <ResponsiveTypography variant="body2" color="text.secondary" paragraph>
          {t('portfolio.willPermanentlyDelete')}:
        </ResponsiveTypography>
        
        <Box component="ul" sx={{ pl: 2, m: 0, mb: 3 }}>
          <ResponsiveTypography component="li" variant="body2" color="text.secondary">
            {t('portfolio.deleteTrades')}
          </ResponsiveTypography>
          <ResponsiveTypography component="li" variant="body2" color="text.secondary">
            {t('portfolio.deleteCashFlows')}
          </ResponsiveTypography>
          <ResponsiveTypography component="li" variant="body2" color="text.secondary">
            {t('portfolio.deleteSnapshots')}
          </ResponsiveTypography>
          <ResponsiveTypography component="li" variant="body2" color="text.secondary">
            {t('portfolio.deleteHoldings')}
          </ResponsiveTypography>
          <ResponsiveTypography component="li" variant="body2" color="text.secondary">
            {t('portfolio.deleteHistorical')}
          </ResponsiveTypography>
        </Box>
        
        {/* Confirmation Checkbox */}
        <Box sx={{ 
          border: '1px solid #e0e0e0', 
          borderRadius: 1, 
          p: 2, 
          backgroundColor: '#fafafa',
          mb: 2 
        }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={deleteConfirmationChecked}
                onChange={(e) => setDeleteConfirmationChecked(e.target.checked)}
                color="error"
              />
            }
            label={
              <ResponsiveTypography variant="formHelper" 
              sx={{  color: "error.main", fontWeight: "bold" }}
              ellipsis={false}
              >
                Tôi hiểu rằng hành động này không thể hoàn tác và sẽ xóa vĩnh viễn tất cả dữ liệu liên quan
              </ResponsiveTypography>
            }
          />
        </Box>
      </ModalWrapper>
    </div>
  );
};

export default PortfolioCard;
