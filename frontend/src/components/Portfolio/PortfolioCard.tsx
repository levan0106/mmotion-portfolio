/**
 * Portfolio card component for displaying portfolio summary
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Visibility,
  ContentCopy,
  AccountBalanceWallet,
  Business,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Portfolio } from '../../types';
import { formatCurrency } from '../../utils/format';
import { CopyPortfolioModal } from './CopyPortfolioModal';
import './PortfolioCard.styles.css';

interface PortfolioCardProps {
  portfolio: Portfolio;
  onView: (portfolioId: string) => void;
  onEdit?: (portfolioId: string) => void;
  onDelete?: (portfolioId: string) => void;
  onPortfolioCopied?: (newPortfolio: Portfolio) => void;
}

const PortfolioCard: React.FC<PortfolioCardProps> = ({
  portfolio,
  onView,
  onEdit,
  onDelete,
  onPortfolioCopied,
}) => {
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
    e.stopPropagation(); // Prevent card click
    if (onEdit) {
      onEdit(portfolio.portfolioId);
    }
  };

  const handleViewButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    handleView();
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation(); // Prevent event bubbling
    setCopyModalOpen(true);
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
    setDeleteModalOpen(true);
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
              <h2 className="portfolio-card__title">{portfolio.name}</h2>
            </div>
            <div className="portfolio-card__type-badge">
              {isFund ? 'Fund' : 'Individual'}
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
              <div className="portfolio-card__total-value-amount">
                {formatCurrency(Number(portfolio.totalInvestValue) || 0, portfolio.baseCurrency)}
              </div>
              <div className="portfolio-card__total-value-label">Investment Value</div>
            </div>
          </div>

          <div className="portfolio-card__pl-section">
            <div className="portfolio-card__pl-item">
              <div className="portfolio-card__pl-header">
                {isPositivePL ? (
                  <TrendingUp className={`portfolio-card__pl-icon portfolio-card__pl-icon--positive`} />
                ) : (
                  <TrendingDown className={`portfolio-card__pl-icon portfolio-card__pl-icon--negative`} />
                )}
                <div className={`portfolio-card__pl-amount ${isPositivePL ? 'portfolio-card__pl-amount--positive' : 'portfolio-card__pl-amount--negative'}`}>
                  {formatCurrency(Number(portfolio.unrealizedInvestPnL) || 0, portfolio.baseCurrency)}
                </div>
              </div>
              <div className="portfolio-card__pl-label">Unrealized P&L</div>
            </div>

            <div className="portfolio-card__pl-item">
              <div className="portfolio-card__pl-header">
                {isPositiveRealizedPL ? (
                  <TrendingUp className={`portfolio-card__pl-icon portfolio-card__pl-icon--positive`} />
                ) : (
                  <TrendingDown className={`portfolio-card__pl-icon portfolio-card__pl-icon--negative`} />
                )}
                <div className={`portfolio-card__pl-amount ${isPositiveRealizedPL ? 'portfolio-card__pl-amount--positive' : 'portfolio-card__pl-amount--negative'}`}>
                  {formatCurrency(Number(portfolio.realizedInvestPnL) || 0, portfolio.baseCurrency)}
                </div>
              </div>
              <div className="portfolio-card__pl-label">Realized P&L</div>
            </div>
          </div>

          <div className="portfolio-card__cash-balance">
            <div className="portfolio-card__cash-label">Cash Balance</div>
            <div className="portfolio-card__cash-amount">
              {formatCurrency(Number(portfolio.cashBalance) || 0, portfolio.baseCurrency)}
            </div>
          </div>
        </div>
      </div>

      <div className="portfolio-card__actions">
        <button
          className="portfolio-card__view-btn"
          onClick={handleViewButtonClick}
        >
          <Visibility />
          View Details
        </button>
        {onEdit && (
          <button
            className="portfolio-card__edit-btn"
            onClick={handleEdit}
          >
            Edit
          </button>
        )}
        <button
          className="portfolio-card__copy-btn"
          onClick={handleCopy}
          onMouseDown={(e) => e.preventDefault()}
          onMouseUp={(e) => e.preventDefault()}
          title="Copy Portfolio"
          type="button"
        >
          <ContentCopy />
          Copy
        </button>
        {onDelete && (
          <button
            className="portfolio-card__delete-btn"
            onClick={handleDelete}
            onMouseDown={(e) => e.preventDefault()}
            onMouseUp={(e) => e.preventDefault()}
            title="Delete Portfolio"
            type="button"
          >
            <DeleteIcon />
            Delete
          </button>
        )}
      </div>

      <CopyPortfolioModal
        open={copyModalOpen}
        onClose={handleCopyModalClose}
        sourcePortfolio={portfolio}
        onPortfolioCopied={handlePortfolioCopied}
        onModalClose={handleCopyModalClose}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteModalOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <DeleteIcon color="error" />
            <Typography variant="h6">Delete Portfolio</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              This action cannot be undone!
            </Typography>
          </Alert>
          <Typography variant="body1" paragraph>
            Are you sure you want to delete the portfolio <strong>"{portfolio.name}"</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            This will permanently delete:
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0, mb: 3 }}>
            <Typography component="li" variant="body2" color="text.secondary">
              All trades and trade details
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              All cash flows and deposits
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              All performance snapshots and analytics data
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              All investor holdings (if this is a fund)
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              All historical data and reports
            </Typography>
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
                <Typography variant="body2" color="error" fontWeight="bold">
                  Tôi hiểu rằng hành động này không thể hoàn tác và sẽ xóa vĩnh viễn tất cả dữ liệu liên quan
                </Typography>
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleDeleteCancel}
            disabled={isDeleting}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            disabled={isDeleting || !deleteConfirmationChecked}
            color="error"
            variant="contained"
            startIcon={isDeleting ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {isDeleting ? 'Deleting...' : 'Delete Portfolio'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default PortfolioCard;
