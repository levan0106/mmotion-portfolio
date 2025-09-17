/**
 * Portfolio card component for displaying portfolio summary
 */

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Visibility,
} from '@mui/icons-material';
import { Portfolio } from '../../types';
import { formatCurrency } from '../../utils/format';
import './PortfolioCard.styles.css';

interface PortfolioCardProps {
  portfolio: Portfolio;
  onView: (portfolioId: string) => void;
  onEdit?: (portfolioId: string) => void;
}

const PortfolioCard: React.FC<PortfolioCardProps> = ({
  portfolio,
  onView,
  onEdit,
}) => {
  const isPositivePL = (Number(portfolio.unrealizedPl) || 0) >= 0;
  const isPositiveRealizedPL = (Number(portfolio.realizedPl) || 0) >= 0;

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

  return (
    <div className="portfolio-card" onClick={handleView}>
      <div className="portfolio-card__content">
        <div className="portfolio-card__header">
          <h2 className="portfolio-card__title">{portfolio.name}</h2>
          <span className={`portfolio-card__currency ${portfolio.baseCurrency === 'USD' ? 'portfolio-card__currency--primary' : ''}`}>
            {portfolio.baseCurrency}
          </span>
        </div>

        <div className="portfolio-card__metrics">
          <div className="portfolio-card__total-value">
            <AccountBalance className="portfolio-card__total-value-icon" />
            <div>
              <div className="portfolio-card__total-value-amount">
                {formatCurrency(Number(portfolio.totalValue) || 0, portfolio.baseCurrency)}
              </div>
              <div className="portfolio-card__total-value-label">Total Value</div>
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
                  {formatCurrency(Number(portfolio.unrealizedPl) || 0, portfolio.baseCurrency)}
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
                  {formatCurrency(Number(portfolio.realizedPl) || 0, portfolio.baseCurrency)}
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
      </div>
    </div>
  );
};

export default PortfolioCard;
