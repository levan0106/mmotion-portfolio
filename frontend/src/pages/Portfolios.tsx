/**
 * Portfolios page component
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Alert } from '@mui/material';
import PortfolioList from '../components/Portfolio/PortfolioList';
import PortfolioForm from '../components/Portfolio/PortfolioForm';
import { CreatePortfolioDto, UpdatePortfolioDto } from '../types';
import { usePortfolios } from '../hooks/usePortfolios';
import { useAccount } from '../hooks/useAccount';

const Portfolios: React.FC = () => {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<string | null>(null);
  const [formError, setFormError] = useState<string>('');

  const { accountId } = useAccount();
  const {
    portfolios,
    createPortfolio,
    updatePortfolio,
    isCreating,
    isUpdating,
    isDeleting,
  } = usePortfolios(accountId);

  const handleViewPortfolio = (portfolioId: string) => {
    navigate(`/portfolios/${portfolioId}`);
  };

  const handleEditPortfolio = (portfolioId: string) => {
    setEditingPortfolio(portfolioId);
    setIsFormOpen(true);
  };

  const handleCreatePortfolio = () => {
    setEditingPortfolio(null);
    setFormError('');
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingPortfolio(null);
    setFormError('');
  };

  const handleSubmitForm = async (data: CreatePortfolioDto | UpdatePortfolioDto) => {
    try {
      setFormError('');
      
      if (editingPortfolio) {
        await updatePortfolio({ id: editingPortfolio, data: data as UpdatePortfolioDto });
      } else {
        await createPortfolio(data as CreatePortfolioDto);
      }
      
      handleCloseForm();
    } catch (error: any) {
      setFormError(error.response?.data?.message || 'An error occurred. Please try again.');
    }
  };

  // Get the portfolio data for editing
  const getEditingPortfolioData = (): Partial<CreatePortfolioDto> | undefined => {
    if (!editingPortfolio) return undefined;
    
    const portfolio = portfolios.find(p => p.portfolioId === editingPortfolio);
    if (!portfolio) return undefined;
    
    return {
      name: portfolio.name,
      baseCurrency: portfolio.baseCurrency,
      accountId: portfolio.accountId,
    };
  };

  // const handleDeletePortfolio = async (portfolioId: string) => {
  //   if (window.confirm('Are you sure you want to delete this portfolio? This action cannot be undone.')) {
  //     try {
  //       await deletePortfolio(portfolioId);
  //     } catch (error: any) {
  //       console.error('Failed to delete portfolio:', error);
  //       // You might want to show a toast notification here
  //     }
  //   }
  // };

  return (
    <Box>
      <PortfolioList
        onViewPortfolio={handleViewPortfolio}
        onEditPortfolio={handleEditPortfolio}
        onCreatePortfolio={handleCreatePortfolio}
      />

      <PortfolioForm
        open={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmitForm}
        initialData={getEditingPortfolioData()}
        isEditing={!!editingPortfolio}
        isLoading={isCreating || isUpdating}
        error={formError}
      />

      {(isCreating || isUpdating || isDeleting) && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {isCreating && 'Creating portfolio...'}
          {isUpdating && 'Updating portfolio...'}
          {isDeleting && 'Deleting portfolio...'}
        </Alert>
      )}
    </Box>
  );
};

export default Portfolios;
