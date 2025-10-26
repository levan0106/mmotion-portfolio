/**
 * Generic Form Modal Component
 * Centralized modal for creating different types of data (Assets, Deposits, Cash Flows, etc.)
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  useTheme,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery,
} from '@mui/material';
import {
  AccountBalanceWallet as DepositIcon,
  TrendingUp as CashFlowIcon,
  SwapHoriz as TradeIcon,
  Add as AddIcon,
  TrendingUp as BuyIcon,
  AccountBalance as DepositCashIcon,
} from '@mui/icons-material';
import { ModalWrapper } from './ModalWrapper';
import { ResponsiveTypography } from './ResponsiveTypography';
import { ResponsiveButton } from './ResponsiveButton';
import DepositForm from '../Deposit/DepositForm';
import { TradeForm } from '../Trading/TradeForm';
import CashFlowForm from '../CashFlow/CashFlowForm';
import { TradeFormData, TradeSide } from '../../types';
import { useAccount } from '../../contexts/AccountContext';
import { usePortfolios } from '../../hooks/usePortfolios';
import { apiService } from '../../services/api';

interface GenericFormModalProps {
  open: boolean;
  onClose: () => void;
  portfolioId?: string;
}

type FormType = 'buy' | 'sell' | 'deposit_cash' | 'withdraw_cash' | 'bank_deposit';

const GenericFormModal: React.FC<GenericFormModalProps> = ({
  open,
  onClose,
  portfolioId,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { accountId } = useAccount();
  const { portfolios } = usePortfolios(accountId);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [selectedForm, setSelectedForm] = useState<FormType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [autoSelectedForm, setAutoSelectedForm] = useState<FormType | null>(null);
  const [formRef, setFormRef] = useState<HTMLFormElement | null>(null);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedForm(null);
      setError(null);
      setActiveTab(0);
      setAutoSelectedForm(null);
      setFormRef(null);
      setSelectedPortfolioId('');
    }
  }, [open]);

  // Auto-select first form when tab changes
  useEffect(() => {
    if (open && tabConfigs[activeTab]?.forms?.length > 0) {
      const firstForm = tabConfigs[activeTab].forms[0];
      setAutoSelectedForm(firstForm.id);
      setSelectedForm(firstForm.id);
      setError(null);
    }
  }, [activeTab, open]);

  // Auto-select portfolio when modal opens (if not from portfolio detail)
  useEffect(() => {
    if (open && !portfolioId && portfolios?.length > 0 && !selectedPortfolioId) {
      setSelectedPortfolioId(portfolios[0].portfolioId);
    }
  }, [open, portfolioId, portfolios, selectedPortfolioId]);

  // Form options configuration by tabs
  const tabConfigs = [
    {
      id: 'trading',
      label: t('genericForm.tabs.trading', 'Mua/Bán'),
      icon: <TradeIcon />,
      forms: [
        {
          id: 'buy' as FormType,
          title: t('genericForm.options.buy.title', 'Mua tài sản'),
          description: t('genericForm.options.buy.description', 'Mua cổ phiếu, trái phiếu, vàng...'),
          icon: <BuyIcon />,
          color: '#2e7d32',
          category: 'trading',
        }
      ],
    },
    {
      id: 'cashflow',
      label: t('genericForm.tabs.cashflow', 'Nạp/Rút tiền'),
      icon: <CashFlowIcon />,
      forms: [
        {
          id: 'deposit_cash' as FormType,
          title: t('genericForm.options.depositCash.title', 'Nạp tiền'),
          description: t('genericForm.options.depositCash.description', 'Nạp tiền vào danh mục'),
          icon: <DepositCashIcon />,
          color: '#2e7d32',
          category: 'cashflow',
        }
      ],
    },
    {
      id: 'deposit',
      label: t('genericForm.tabs.deposit', 'Tiền gửi'),
      icon: <DepositIcon />,
      forms: [
        {
          id: 'bank_deposit' as FormType,
          title: t('genericForm.options.bankDeposit.title', 'Tiền gửi ngân hàng'),
          description: t('genericForm.options.bankDeposit.description', 'Tạo tiền gửi ngân hàng với lãi suất'),
          icon: <DepositIcon />,
          color: '#1976d2',
          category: 'deposit',
        },
      ],
    },
  ];

  const handleFormSelect = (formType: FormType) => {
    setSelectedForm(formType);
    setError(null);
  };


  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleDepositSubmit = async (depositData: any) => {
    try {
      setLoading(true);
      setError(null);
      
      await apiService.createDeposit(depositData);
      
      // Close modal on success
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create deposit');
    } finally {
      setLoading(false);
    }
  };

  const handleTradeSubmit = async (tradeData: TradeFormData) => {
    try {
      setLoading(true);
      setError(null);
      
      await apiService.createTrade(tradeData, accountId);
      
      // Close modal on success
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create trade');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = () => {
    if (!selectedForm) return;
    
    if (formRef) {
      const submitButton = formRef.querySelector('button[type="submit"]') as HTMLButtonElement;
      if (submitButton) {
        submitButton.click();
        return;
      }
    }
    
    // Fallback: Call form submit handlers directly
    switch (selectedForm) {
      case 'buy':
        // TradeForm doesn't have a submit button, we need to trigger its internal submit
        const tradeFormElement = formRef?.querySelector('form');
        if (tradeFormElement) {
          const formEvent = new Event('submit', { bubbles: true, cancelable: true });
          tradeFormElement.dispatchEvent(formEvent);
        }
        break;
      case 'deposit_cash':
      case 'withdraw_cash':
        // CashFlowForm doesn't have a submit button, we need to trigger its internal submit
        const cashFlowFormElement = formRef?.querySelector('form');
        if (cashFlowFormElement) {
          const formEvent = new Event('submit', { bubbles: true, cancelable: true });
          cashFlowFormElement.dispatchEvent(formEvent);
        }
        break;
      case 'bank_deposit':
        // DepositForm has hidden submit button, should work with the querySelector above
        break;
    }
  };

  const renderFormSelection = () => {
    // If we have an auto-selected form, render it directly
    if (autoSelectedForm) {
      return renderSelectedForm();
    }

    return (
      <Box>
        <Box sx={{ mb: 3 }}>
          <ResponsiveTypography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            {t('genericForm.title', 'Tạo giao dịch mới')}
          </ResponsiveTypography>
          <ResponsiveTypography variant="body2" color="text.secondary">
            {t('genericForm.subtitle', 'Chọn loại giao dịch bạn muốn thực hiện')}
          </ResponsiveTypography>
        </Box>

        {/* Tab Content */}
        <Grid container spacing={isMobile ? 1 : 2}>
          {tabConfigs[activeTab].forms.map((form) => (
            <Grid item xs={12} sm={6} key={form.id}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                  },
                }}
              >
                <CardActionArea
                  onClick={() => handleFormSelect(form.id)}
                  sx={{ height: '100%', p: isMobile ? 1.5 : 2 }}
                >
                  <CardContent sx={{ textAlign: 'center', p: 0 }}>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        backgroundColor: `${form.color}20`,
                        color: form.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                      }}
                    >
                      {form.icon}
                    </Box>
                    <ResponsiveTypography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {form.title}
                    </ResponsiveTypography>
                    <ResponsiveTypography variant="body2" color="text.secondary">
                      {form.description}
                    </ResponsiveTypography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  const renderSelectedForm = () => {
    if (!selectedForm) return null;

    // Find form option from all tabs
    const formOption = tabConfigs
      .flatMap(tab => tab.forms)
      .find(f => f.id === selectedForm);
    
    if (!formOption) return null;

    // Portfolio logic based on context:
    // - If portfolioId is provided (from portfolio detail page) → use it and hide portfolio selection
    // - If no portfolioId → show portfolio selection for user to choose
    const isFromPortfolioDetail = !!portfolioId;
    const effectivePortfolioId = portfolioId || selectedPortfolioId;

    // Show error if no portfolio is available
    if (!effectivePortfolioId) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <ResponsiveTypography variant="h6" color="error" sx={{ mb: 2 }}>
            {t('genericForm.error.noPortfolio', 'Không tìm thấy danh mục')}
          </ResponsiveTypography>
          <ResponsiveTypography variant="body2" color="text.secondary">
            {t('genericForm.error.noPortfolioDescription', 'Vui lòng tạo danh mục trước khi thực hiện giao dịch')}
          </ResponsiveTypography>
        </Box>
      );
    }

    return (
      <Box>
        {/* Error Display */}
        {error && (
          <Box sx={{ mb: 3, p: 2, backgroundColor: 'error.light', borderRadius: 1 }}>
            <ResponsiveTypography variant="body2" color="error.main">
              {error}
            </ResponsiveTypography>
          </Box>
        )}

        {/* Portfolio Info Display - Only show when not from portfolio detail */}
        {!isFromPortfolioDetail && (
          <Box>            
            {/* Portfolio Selection */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="portfolio-select-label">
                {t('genericForm.portfolioInfo.selectPortfolio', 'Chọn danh mục')} *
              </InputLabel>
              <Select
                labelId="portfolio-select-label"
                value={effectivePortfolioId}
                onChange={(e) => setSelectedPortfolioId(e.target.value)}
                label={`${t('genericForm.portfolioInfo.selectPortfolio', 'Chọn danh mục')} *`}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">
                  <em>{t('genericForm.portfolioInfo.selectPortfolio', 'Chọn danh mục')}</em>
                </MenuItem>
                {portfolios?.map((portfolio) => (
                  <MenuItem key={portfolio.portfolioId} value={portfolio.portfolioId}>
                    {portfolio.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Render Selected Form */}
        {selectedForm === 'buy' && (
          <Box ref={(el) => setFormRef(el as HTMLFormElement)}>
            <TradeForm
              onSubmit={handleTradeSubmit}
              defaultPortfolioId={effectivePortfolioId}
              mode="create"
              isLoading={loading}
              showSubmitButton={false}
              isModal={true}
              initialData={{ side: TradeSide.BUY }}
            />
          </Box>
        )}

        {selectedForm === 'deposit_cash' && (
          <Box ref={(el) => setFormRef(el as HTMLFormElement)}>
            <CashFlowForm
              onSubmit={async (formData) => {
                try {
                  setLoading(true);
                  setError(null);

                  const payload = {
                    portfolioId: effectivePortfolioId,
                    amount: parseFloat(formData.amount),
                    type: 'DEPOSIT',
                    description: formData.description,
                    reference: formData.reference || undefined,
                    flowDate: formData.flowDate ? formData.flowDate : undefined,
                    currency: formData.currency,
                    status: formData.status,
                    fundingSource: formData.fundingSource || undefined,
                  };

                  await apiService.createCashFlow(effectivePortfolioId, accountId, 'deposit', payload);
                  
                  setError(null);
                  onClose(); // Close the generic modal
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Failed to create deposit');
                } finally {
                  setLoading(false);
                }
              }}
              onCancel={() => {}} // No-op since we handle cancel at modal level
              dialogType="deposit"
              editingCashFlow={null}
              loading={loading}
              error={error}
              portfolioFundingSource={portfolios?.find(p => p.portfolioId === effectivePortfolioId)?.fundingSource || ''}
              hideButtons={true}
            />
          </Box>
        )}

        {selectedForm === 'withdraw_cash' && (
          <Box ref={(el) => setFormRef(el as HTMLFormElement)}>
            <CashFlowForm
              onSubmit={async (formData) => {
                try {
                  setLoading(true);
                  setError(null);

                  const payload = {
                    portfolioId: effectivePortfolioId,
                    amount: parseFloat(formData.amount),
                    type: 'WITHDRAWAL',
                    description: formData.description,
                    reference: formData.reference || undefined,
                    flowDate: formData.flowDate ? formData.flowDate : undefined,
                    currency: formData.currency,
                    status: formData.status,
                    fundingSource: formData.fundingSource || undefined,
                  };

                  await apiService.createCashFlow(effectivePortfolioId, accountId, 'withdrawal', payload);
                  
                  setError(null);
                  onClose(); // Close the generic modal
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Failed to create withdrawal');
                } finally {
                  setLoading(false);
                }
              }}
              onCancel={() => {}} // No-op since we handle cancel at modal level
              dialogType="withdrawal"
              editingCashFlow={null}
              loading={loading}
              error={error}
              portfolioFundingSource={portfolios?.find(p => p.portfolioId === effectivePortfolioId)?.fundingSource || ''}
              hideButtons={true}
            />
          </Box>
        )}

        {selectedForm === 'bank_deposit' && (
          <Box ref={(el) => setFormRef(el as HTMLFormElement)}>
            <DepositForm
              open={true}
              onClose={() => {}} // No-op since we handle close in parent
              onSubmit={handleDepositSubmit}
              portfolioId={effectivePortfolioId}
              isEdit={false}
              standalone={false}
              hideButtons={true}
            />
          </Box>
        )}
      </Box>
    );
  };

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title={selectedForm ? tabConfigs.flatMap(tab => tab.forms).find(f => f.id === selectedForm)?.title || t('genericForm.title', 'Tạo giao dịch mới') : t('genericForm.title', 'Tạo giao dịch mới')}
      icon={<AddIcon />}
      maxWidth={isMobile ? false : "lg"}
      fullWidth={isMobile}
      fullScreen={isMobile}
      loading={loading}
      showCloseButton={!selectedForm}
      actions={
        selectedForm ? (
          <>
            <ResponsiveButton 
              variant="outlined"
              onClick={onClose}
              disabled={loading}
            >
              {t('common.cancel', 'Hủy')}
            </ResponsiveButton>
            <ResponsiveButton 
              variant="contained"
              onClick={handleFormSubmit}
              disabled={loading}
            >
              {loading ? t('common.processing', 'Đang xử lý...') : t('genericForm.create', 'Tạo')}
            </ResponsiveButton>
          </>
        ) : (
          <ResponsiveButton onClick={onClose}>
            {t('common.close', 'Đóng')}
          </ResponsiveButton>
        )
      }
    >
      {/* Always show tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: isMobile ? 2 : 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          aria-label="transaction tabs"
          variant={isMobile ? "fullWidth" : "standard"}
          scrollButtons={isMobile ? false : true}
        >
          {tabConfigs.map((tab) => (
            <Tab
              key={tab.id}
              icon={isMobile ? undefined : tab.icon}
              label={tab.label}
              iconPosition={isMobile ? "top" : "start"}
              sx={{ 
                textTransform: 'none', 
                fontWeight: 600,
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                py: isMobile ? 1 : 1.5,
                px: isMobile ? 1 : 2,
                minHeight: isMobile ? 48 : 'auto'
              }}
            />
          ))}
        </Tabs>
      </Box>

      {/* Render form content */}
      {selectedForm ? renderSelectedForm() : renderFormSelection()}
    </ModalWrapper>
  );
};

export default GenericFormModal;
