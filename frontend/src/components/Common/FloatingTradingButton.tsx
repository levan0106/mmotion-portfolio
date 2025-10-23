import React, { useState } from 'react';
import {
  Fab,
  Tooltip,
  alpha,
  Zoom,
} from '@mui/material';
import {
  Add as AddIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '../../contexts/AccountContext';
import { TradeForm } from '../Trading/TradeForm';
import { CreateTradeDto, TradeFormData } from '../../types';
import { useCreateTrade } from '../../hooks/useTrading';
import { usePortfolios } from '../../hooks/usePortfolios';

interface FloatingTradingButtonProps {
  portfolioId?: string;
}

const FloatingTradingButton: React.FC<FloatingTradingButtonProps> = ({ 
  portfolioId 
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentAccount } = useAccount();
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [isCreatingPortfolio, setIsCreatingPortfolio] = useState(false);
  
  const createTradeMutation = useCreateTrade();
  const { portfolios, createPortfolio, isCreating: isCreatingPortfolioHook } = usePortfolios(currentAccount?.accountId);

  const handleCreateTrade = async (data: CreateTradeDto) => {
    try {
      await createTradeMutation.mutateAsync(data);
      setShowTradeForm(false);
    } catch (error) {
      console.error('Error creating trade:', error);
    }
  };

  const handleCreateTradeFromForm = async (data: TradeFormData) => {
    // Convert TradeFormData to CreateTradeDto
    const createTradeData: CreateTradeDto = {
      ...data,
      tradeDate: data.tradeDate,
    };
    await handleCreateTrade(createTradeData);
  };

  const handleCloseForm = () => {
    setShowTradeForm(false);
  };

  const handleAssetCreated = async () => {
    // Refresh any relevant queries if needed
    // This could be expanded to refresh portfolio data, etc.
  };

  const handleButtonClick = async () => {
    if (!currentAccount?.accountId) {
      // Redirect to login if not authenticated
      navigate('/login');
      return;
    }

    // If no portfolios exist, auto-create one
    if (!portfolios || portfolios.length === 0) {
      try {
        setIsCreatingPortfolio(true);
        await createPortfolio({
          name: t('trading.autoCreatePortfolio.name', 'My Portfolio'),
          baseCurrency: 'VND',
          fundingSource: '',
          accountId: currentAccount.accountId,
        });
        // Portfolio will be created and portfolios list will be updated
        // The modal will open with the new portfolio available
      } catch (error) {
        console.error('Failed to auto-create portfolio:', error);
        // Still open the modal, let user handle the error
      } finally {
        setIsCreatingPortfolio(false);
      }
    }

    // Open trade form modal - user can select portfolio in the modal
    setShowTradeForm(true);
  };

  // Don't show the button if user is not authenticated or is investor
  if (!currentAccount?.accountId || currentAccount?.isInvestor) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <Zoom in={true}>
        <Tooltip 
          title={
            isCreatingPortfolio || isCreatingPortfolioHook 
              ? t('trading.floatingButton.creatingPortfolio', 'Đang tạo danh mục...')
              : t('trading.floatingButton.tooltip', 'Tạo giao dịch nhanh')
          }
          placement="left"
          arrow
        >
          <Fab
            color="secondary"
            aria-label={t('trading.floatingButton.ariaLabel', 'Tạo giao dịch')}
            onClick={handleButtonClick}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1300,
              boxShadow: `0 8px 32px ${alpha('#ff6b35', 0.3)}`,
              background: `linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)`,
              '&:hover': {
                boxShadow: `0 12px 40px ${alpha('#ff6b35', 0.4)}`,
                transform: 'scale(1.05)',
                background: `linear-gradient(135deg, #f7931e 0%, #ff6b35 100%)`,
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              width: 56,
              height: 56,
            }}
          >
            <AddIcon sx={{ fontSize: 28 }} />
          </Fab>
        </Tooltip>
      </Zoom>

      {/* Trade Form Modal */}
      <TradeForm
        open={showTradeForm}
        onClose={handleCloseForm}
        onSubmit={handleCreateTradeFromForm}
        defaultPortfolioId={portfolioId || (portfolios?.length === 1 ? portfolios[0].portfolioId : undefined)}
        isLoading={createTradeMutation.isLoading}
        error={createTradeMutation.error?.message}
        onAssetCreated={handleAssetCreated}
        mode="create"
        isModal={true}
        showSubmitButton={false}
      />
    </>
  );
};

export default FloatingTradingButton;
