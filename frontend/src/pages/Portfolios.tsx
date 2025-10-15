/**
 * Portfolios page component
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Alert } from '@mui/material';
import PortfolioList from '../components/Portfolio/PortfolioList';
import PortfolioForm from '../components/Portfolio/PortfolioForm';
import { PublicPortfolioSelector } from '../components/Portfolio/PublicPortfolioSelector';
import { CreatePortfolioDto, UpdatePortfolioDto, Portfolio } from '../types';
import { usePortfolios } from '../hooks/usePortfolios';
import { useAccount } from '../contexts/AccountContext';
import ResponsiveTypography from '../components/Common/ResponsiveTypography';
import { apiService } from '../services/api';

const Portfolios: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<string | null>(null);
  const [formError, setFormError] = useState<string>('');
  const [isPublicTemplateSelectorOpen, setIsPublicTemplateSelectorOpen] = useState(false);

  const { accountId } = useAccount();

  const {
    portfolios,
    createPortfolio,
    updatePortfolio,
    deletePortfolio,
    refetch,
    isCreating,
    isUpdating,
    isDeleting,
    isLoading,
  } = usePortfolios(accountId);

  // Auto-open form when navigating to /portfolios/new
  useEffect(() => {
    if (location.pathname === '/portfolios/new') {
      setEditingPortfolio(null);
      setFormError('');
      setIsFormOpen(true);
      // Navigate back to /portfolios to clean up URL
      navigate('/portfolios', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Auto-open public template selector when tab=templates and no portfolios
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tab = urlParams.get('tab');
    
    if (tab === 'templates' && portfolios.length === 0 && !isLoading) {
      setIsPublicTemplateSelectorOpen(true);
    }
  }, [location.search, portfolios.length, isLoading]);

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

  const handleDeletePortfolio = async (portfolioId: string) => {
    try {
      await deletePortfolio(portfolioId);
      // Clear any form errors on successful deletion
      setFormError('');
    } catch (error: any) {
      console.error('Failed to delete portfolio:', error);
      setFormError(error.response?.data?.message || t('portfolio.error.deleteFailed'));
    }
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
      console.error('Portfolio form error:', error);
      
      // Handle specific error cases
      if (error.response?.data?.message) {
        const errorMessage = error.response.data.message;
        
        // Format duplicate name error for better UX
        if (errorMessage.includes('already exists for this account')) {
          setFormError(t('portfolio.error.nameAlreadyExists', { name: data.name }));
        } else {
          setFormError(errorMessage);
        }
      } else {
        setFormError(t('portfolio.error.saveFailed'));
      }
    }
  };

  const handleCopyFromPublic = async (sourcePortfolioId: string, name: string) => {
    try {
      setFormError('');
      
      await apiService.copyFromPublicPortfolio({
        sourcePortfolioId,
        targetAccountId: accountId!,
        name
      });
      
      // Refetch portfolios to show the new copied portfolio
      await refetch();
      
      handleCloseForm();
    } catch (error: any) {
      console.error('Copy from public error:', error);
      
      // Handle specific error cases
      if (error.response?.data?.message) {
        const errorMessage = error.response.data.message;
        
        // Format duplicate name error for better UX
        if (errorMessage.includes('already exists for this account')) {
          setFormError(t('portfolio.error.nameAlreadyExists', { name }));
        } else {
          setFormError(errorMessage);
        }
      } else {
        setFormError(t('portfolio.error.copyTemplateFailed'));
      }
    }
  };

  const handleSelectPublicTemplate = async (portfolio: Portfolio) => {
    try {
      setFormError('');
      
      const portfolioName = `${portfolio.templateName || portfolio.name} (Copy)`;
      
      await apiService.copyFromPublicPortfolio({
        sourcePortfolioId: portfolio.portfolioId,
        targetAccountId: accountId!,
        name: portfolioName
      });
      
      // Refetch portfolios to show the new copied portfolio
      await refetch();
      
      setIsPublicTemplateSelectorOpen(false);
    } catch (error: any) {
      console.error('Select public template error:', error);
      
      // Handle specific error cases
      if (error.response?.data?.message) {
        const errorMessage = error.response.data.message;
        
        // Format duplicate name error for better UX
        if (errorMessage.includes('already exists for this account')) {
          setFormError(t('portfolio.error.templateNameAlreadyExists', { name: `${portfolio.templateName || portfolio.name} (Copy)` }));
        } else {
          setFormError(errorMessage);
        }
      } else {
        setFormError(t('portfolio.error.copyTemplateFailed'));
      }
    }
  };

  const handleClosePublicTemplateSelector = () => {
    setIsPublicTemplateSelectorOpen(false);
  };

  // Get the portfolio data for editing
  const getEditingPortfolioData = (): Partial<CreatePortfolioDto> | undefined => {
    if (!editingPortfolio) return undefined;
    
    const portfolio = portfolios.find(p => p.portfolioId === editingPortfolio);
    if (!portfolio) return undefined;
    
    return {
      name: portfolio.name,
      baseCurrency: portfolio.baseCurrency,
      fundingSource: portfolio.fundingSource || '',
      accountId: portfolio.accountId,
      visibility: portfolio.visibility,
      templateName: portfolio.templateName,
      description: portfolio.description,
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
        onDeletePortfolio={handleDeletePortfolio}
        onCreatePortfolio={handleCreatePortfolio}
      />

      <PortfolioForm
        open={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmitForm}
        onCopyFromPublic={handleCopyFromPublic}
        initialData={getEditingPortfolioData()}
        isEditing={!!editingPortfolio}
        isLoading={isCreating || isUpdating}
        error={formError}
      />

      <PublicPortfolioSelector
        open={isPublicTemplateSelectorOpen}
        onClose={handleClosePublicTemplateSelector}
        onSelect={handleSelectPublicTemplate}
      />

      {(isCreating || isUpdating || isDeleting) && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <ResponsiveTypography variant="formHelper">
            {isCreating && t('portfolio.creating')}
            {isUpdating && t('portfolio.updating')}
            {isDeleting && t('portfolio.deleting')}
          </ResponsiveTypography>
        </Alert>
      )}
    </Box>
  );
};

export default Portfolios;
