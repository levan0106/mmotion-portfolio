/**
 * Portfolio list component for displaying multiple portfolios
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CircularProgress,
  Fab,
  useTheme,
} from '@mui/material';
import { 
  Add as AddIcon, 
  AccountBalance as PortfolioIcon,
  TrendingUp as TrendingUpIcon,
  MonetizationOn as MonetizationOnIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { ResponsiveButton } from '../Common';
import PortfolioCard from './PortfolioCard';
import { usePortfolios } from '../../hooks/usePortfolios';
import { useAccount } from '../../contexts/AccountContext';
import './PortfolioList.styles.css';
import ResponsiveTypography from '../Common/ResponsiveTypography';

interface PortfolioListProps {
  onViewPortfolio: (portfolioId: string) => void;
  onEditPortfolio?: (portfolioId: string) => void;
  onDeletePortfolio?: (portfolioId: string) => void;
  onCreatePortfolio?: () => void;
}

const PortfolioList: React.FC<PortfolioListProps> = ({
  onViewPortfolio,
  onEditPortfolio,
  onDeletePortfolio,
  onCreatePortfolio,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { accountId } = useAccount();
  const { portfolios, isLoading, error } = usePortfolios(accountId);
  const [searchTerm] = useState('');
  const [currencyFilter] = useState('');

  // Filter portfolios based on search term and currency
  const filteredPortfolios = portfolios.filter((portfolio) => {
    const matchesSearch = portfolio.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCurrency = !currencyFilter || portfolio.baseCurrency === currencyFilter;
    return matchesSearch && matchesCurrency;
  });

  // Get unique currencies for filter (currently unused)
  // const currencies = Array.from(new Set(portfolios.map(p => p.baseCurrency)));

  if (isLoading) {
    return (
      <div className="portfolio-list">
        <div className="portfolio-list__loading">
          <CircularProgress />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="portfolio-list">
        <div className="portfolio-list__error">
          {t('portfolio.failedToLoad')}
        </div>
      </div>
    );
  }

  return (
    <div className="portfolio-list">
      {/* Header */}
      <div className="portfolio-list__header">
        <ResponsiveTypography variant="pageHeader"
        sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 1
        }}>{t('portfolio.title')}</ResponsiveTypography>
        {onCreatePortfolio && (
          <ResponsiveButton
            className="portfolio-list__create-btn"
            onClick={onCreatePortfolio}
            icon={<AddIcon />}
            mobileText={t('common.create')}
            desktopText={t('portfolio.create')}
          >
            {t('portfolio.create')}
          </ResponsiveButton>
        )}
      </div>

      {/* Filters */}
      {/* <div className="portfolio-list__filters">
        <TextField
          label="Search portfolios"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          className="portfolio-list__search"
        />
        <FormControl size="small" className="portfolio-list__currency-filter">
          <InputLabel>Currency</InputLabel>
          <Select
            value={currencyFilter}
            label="Currency"
            onChange={(e) => setCurrencyFilter(e.target.value)}
          >
            <MenuItem value="">All Currencies</MenuItem>
            {currencies.map((currency) => (
              <MenuItem key={currency} value={currency}>
                {currency}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div> */}

      {/* Portfolio Grid */}
      {filteredPortfolios.length === 0 ? (
        <div className="portfolio-list__empty">
          <div className="portfolio-list__empty-illustration">
            <div className="portfolio-list__empty-icon">
              <PortfolioIcon sx={{ fontSize: 60, color: '#3b82f6' }} />
            </div>
          </div>
          
          <div className="portfolio-list__empty-content">
            <h3 className="portfolio-list__empty-title">
              {portfolios.length === 0
                ? t('portfolio.startJourney')
                : t('portfolio.noMatch')}
            </h3>
            
            {portfolios.length === 0 ? (
              <>
                <p className="portfolio-list__empty-description">
                  {t('portfolio.createFirstDescription')}
                </p>
                
                <div className="portfolio-list__empty-features">
                  <div className="portfolio-list__empty-feature">
                    <div className="portfolio-list__empty-feature-icon">
                      <TrendingUpIcon sx={{ fontSize: 24, color: '#10b981' }} />
                    </div>
                    <span>{t('portfolio.trackPerformance')}</span>
                  </div>
                  <div className="portfolio-list__empty-feature">
                    <div className="portfolio-list__empty-feature-icon">
                      <MonetizationOnIcon sx={{ fontSize: 24, color: '#f59e0b' }} />
                    </div>
                    <span>{t('portfolio.monitorReturns')}</span>
                  </div>
                  <div className="portfolio-list__empty-feature">
                    <div className="portfolio-list__empty-feature-icon">
                      <AssessmentIcon sx={{ fontSize: 24, color: '#8b5cf6' }} />
                    </div>
                    <span>{t('portfolio.analyzeTrends')}</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="portfolio-list__empty-description">
                {t('portfolio.adjustSearch')}
              </p>
            )}
          </div>
          
          {onCreatePortfolio && portfolios.length === 0 && (
            <div className="portfolio-list__empty-actions">
              <ResponsiveButton
                className="portfolio-list__empty-btn portfolio-list__empty-btn--primary"
                onClick={onCreatePortfolio}
                icon={<AddIcon />}
                mobileText={t('common.create')}
                desktopText={t('portfolio.createFirst')}
              >
                {t('portfolio.createFirst')}
              </ResponsiveButton>
              <ResponsiveButton
                className="portfolio-list__empty-btn portfolio-list__empty-btn--secondary"
                onClick={() => {/* Add help/tutorial action */}}
              >
                {t('portfolio.learnMore')}
              </ResponsiveButton>
            </div>
          )}
        </div>
      ) : (
        <div className="portfolio-list__grid">
          {filteredPortfolios.map((portfolio) => (
            <PortfolioCard
              key={portfolio.portfolioId}
              portfolio={portfolio}
              onView={onViewPortfolio}
              onEdit={onEditPortfolio}
              onDelete={onDeletePortfolio}
            />
          ))}
        </div>
      )}

      {/* Floating Action Button for mobile */}
      {onCreatePortfolio && (
        <Fab
          color="primary"
          aria-label="add portfolio"
          onClick={onCreatePortfolio}
          className="portfolio-list__fab"
        >
          <AddIcon />
        </Fab>
      )}
    </div>
  );
};

export default PortfolioList;
