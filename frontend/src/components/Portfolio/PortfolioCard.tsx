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
} from '@mui/icons-material';
import { Portfolio } from '../../types';
import { formatCurrency } from '../../utils/format';
import { CopyPortfolioModal } from './CopyPortfolioModal';
import './PortfolioCard.styles.css';

interface PortfolioCardProps {
  portfolio: Portfolio;
  onView: (portfolioId: string) => void;
  onEdit?: (portfolioId: string) => void;
  onPortfolioCopied?: (newPortfolio: Portfolio) => void;
}

const PortfolioCard: React.FC<PortfolioCardProps> = ({
  portfolio,
  onView,
  onEdit,
  onPortfolioCopied,
}) => {
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const isPositivePL = (Number(portfolio.unrealizedInvestPnL) || 0) >= 0;
  const isPositiveRealizedPL = (Number(portfolio.realizedInvestPnL) || 0) >= 0;
  const isFund = portfolio.isFund || false;

  const handleView = () => {
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
  };

  const handlePortfolioCopied = (newPortfolio: Portfolio) => {
    if (onPortfolioCopied) {
      onPortfolioCopied(newPortfolio);
    }
    // Don't close modal here - let CopyPortfolioModal handle it
    // setCopyModalOpen(false);
  };

  return (
    <div className={`portfolio-card ${isFund ? 'portfolio-card--fund' : 'portfolio-card--individual'}`} onClick={handleView}>
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
      </div>

      <CopyPortfolioModal
        open={copyModalOpen}
        onClose={handleCopyModalClose}
        sourcePortfolio={portfolio}
        onPortfolioCopied={handlePortfolioCopied}
        onModalClose={handleCopyModalClose}
      />
    </div>
  );
};

export default PortfolioCard;
