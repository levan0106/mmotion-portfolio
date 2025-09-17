/**
 * Portfolio list component for displaying multiple portfolios
 */

import React, { useState } from 'react';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Fab,
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import PortfolioCard from './PortfolioCard';
import { usePortfolios } from '../../hooks/usePortfolios';
import { useAccount } from '../../hooks/useAccount';
import './PortfolioList.styles.css';

interface PortfolioListProps {
  onViewPortfolio: (portfolioId: string) => void;
  onEditPortfolio?: (portfolioId: string) => void;
  onCreatePortfolio?: () => void;
}

const PortfolioList: React.FC<PortfolioListProps> = ({
  onViewPortfolio,
  onEditPortfolio,
  onCreatePortfolio,
}) => {
  const { accountId } = useAccount();
  const { portfolios, isLoading, error } = usePortfolios(accountId);
  const [searchTerm, setSearchTerm] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('');

  // Filter portfolios based on search term and currency
  const filteredPortfolios = portfolios.filter((portfolio) => {
    const matchesSearch = portfolio.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCurrency = !currencyFilter || portfolio.baseCurrency === currencyFilter;
    return matchesSearch && matchesCurrency;
  });

  // Get unique currencies for filter
  const currencies = Array.from(new Set(portfolios.map(p => p.baseCurrency)));

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
          Failed to load portfolios. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="portfolio-list">
      {/* Header */}
      <div className="portfolio-list__header">
        <h1 className="portfolio-list__title">Portfolios</h1>
        {onCreatePortfolio && (
          <button
            className="portfolio-list__create-btn"
            onClick={onCreatePortfolio}
          >
            <AddIcon />
            Create Portfolio
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="portfolio-list__filters">
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
      </div>

      {/* Portfolio Grid */}
      {filteredPortfolios.length === 0 ? (
        <div className="portfolio-list__empty">
          <div className="portfolio-list__empty-icon">📊</div>
          <h3 className="portfolio-list__empty-title">
            {portfolios.length === 0
              ? 'No portfolios found. Create your first portfolio to get started.'
              : 'No portfolios match your search criteria.'}
          </h3>
          {onCreatePortfolio && portfolios.length === 0 && (
            <button
              className="portfolio-list__empty-btn"
              onClick={onCreatePortfolio}
            >
              <AddIcon />
              Create Your First Portfolio
            </button>
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
