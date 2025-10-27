import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Grid,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  SwapHoriz as TransferIcon,
} from '@mui/icons-material';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { ResponsiveButton } from '../Common/ResponsiveButton';
import MoneyInput from '../Common/MoneyInput';
import FundingSourceInput from '../Common/FundingSourceInput';
import { formatCurrency } from '../../utils/format';
import { useAccount } from '../../contexts/AccountContext';
import { usePortfolios } from '../../hooks/usePortfolios';
import { apiService } from '../../services/api';
import { CashFlow } from '../../types';

export interface TransferCashData {
  fromSource: string;
  toSource: string;
  amount: number;
  description: string;
  transferDate: string;
}

interface TransferCashFormProps {
  onSubmit: (transferData: TransferCashData) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  initialData?: Partial<TransferCashData>;
  onDataChange?: (data: TransferCashData) => void;
  hideSubmitButton?: boolean;
  showActions?: boolean;
  onCancel?: () => void;
  portfolioId?: string; // Portfolio ID from parent
}

const TransferCashForm: React.FC<TransferCashFormProps> = ({
  onSubmit,
  loading = false,
  // error = null,
  initialData,
  onDataChange,
  hideSubmitButton = false,
  showActions = false,
  onCancel,
  portfolioId,
}) => {
  const { t } = useTranslation();
  const { accountId } = useAccount();
  const { portfolios, isLoading: portfoliosLoading } = usePortfolios(accountId);
  const formRef = useRef<HTMLFormElement>(null);
  
  // State for cashflow data and funding sources
  const [cashFlows, setCashFlows] = useState<CashFlow[]>([]);
  const [isLoadingCashFlows, setIsLoadingCashFlows] = useState(false);
  const [, setCashFlowsError] = useState<string | null>(null);
  const hasLoadedCashFlows = useRef(false);
  const lastPortfolioId = useRef<string>('');
  
  // Extract funding sources from cashflow data and remove duplicates
  const fundingSources = useMemo(() => {
    const sources = cashFlows
      .map(cf => cf.fundingSource)
      .filter((source): source is string => source !== undefined && source !== null && source.trim() !== '');
    // Remove duplicates and sort
    return Array.from(new Set(sources)).sort();
  }, [cashFlows]);
  
  // Fallback funding sources from portfolios if cashflow API fails
  const fallbackFundingSources = useMemo(() => {
    const sources = portfolios?.flatMap(p => p.fundingSource ? [p.fundingSource] : []) || [];
    return Array.from(new Set(sources.filter(source => source !== null && source !== undefined && source.trim() !== ''))).sort();
  }, [portfolios]);
  
  // Use cashflow sources if available, otherwise fallback to portfolio sources
  const finalFundingSources = fundingSources.length > 0 ? fundingSources : fallbackFundingSources;
  
  // Load cashflow data for specific portfolio
  useEffect(() => {
    const portfolioChanged = portfolioId !== lastPortfolioId.current;
    
    if (accountId && portfolioId && (!hasLoadedCashFlows.current || portfolioChanged)) {
      hasLoadedCashFlows.current = true;
      lastPortfolioId.current = portfolioId;
      
      const loadCashFlows = async () => {
        setIsLoadingCashFlows(true);
        setCashFlowsError(null);
        
        try {
          const portfolioCashFlows = await apiService.getCashFlowHistory(portfolioId, accountId);
          setCashFlows(portfolioCashFlows.data);
        } catch (error) {
          console.error('Failed to load cashflows:', error);
          setCashFlowsError(error instanceof Error ? error.message : 'Failed to load funding sources');
          setCashFlows([]); // Clear cashflows on error
        } finally {
          setIsLoadingCashFlows(false);
        }
      };
      
      loadCashFlows();
    }
  }, [accountId, portfolioId]);
  
  // Show loading if portfolios or cashflows are loading
  const isLoading = loading || portfoliosLoading || isLoadingCashFlows;
  
  // Show error if there's a form error, portfolios error, or cashflows error
  // const displayError = error || portfoliosError || cashFlowsError || null;
  
  const [transferData, setTransferData] = useState<TransferCashData>({
    fromSource: '',
    toSource: '',
    amount: 0,
    description: '',
    transferDate: '',
  });

  // Helper function to get current local date for form
  const getCurrentLocalDate = () => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  };

  // Initialize form data
  useEffect(() => {
    const defaultData = {
      fromSource: '',
      toSource: '',
      amount: 0,
      description: '',
      transferDate: getCurrentLocalDate(),
    };
    
    const data = { ...defaultData, ...initialData };
    setTransferData(data);
    
    if (onDataChange) {
      onDataChange(data);
    }
  }, [initialData, onDataChange]);

  // Notify parent of data changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange(transferData);
    }
  }, [transferData, onDataChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(transferData);
  };

  const updateTransferData = (updates: Partial<TransferCashData>) => {
    const newData = { ...transferData, ...updates };
    setTransferData(newData);
  };

  const isFormValid = () => {
    return transferData.fromSource && 
           transferData.toSource &&
           transferData.amount > 0 && 
           transferData.fromSource !== transferData.toSource;
  };

  const handleFormSubmit = async () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  return (
    <Box component="form" ref={formRef} onSubmit={handleSubmit} sx={{ pt: 0 }}>
      {/* Hidden submit button for external trigger */}
      {!hideSubmitButton && <button type="submit" style={{ display: 'none' }} />}
                  
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={6}>
          <Box sx={{ pr: { md: 1.5 } }}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>{t('cashflow.transfer.fromSource')}</InputLabel>
              <Select
                value={transferData.fromSource}
                label={t('cashflow.transfer.fromSource')}
                onChange={(e) => updateTransferData({ fromSource: e.target.value })}
                disabled={isLoading}
              >
                {finalFundingSources.map((source) => (
                  <MenuItem key={source} value={source}>
                    {source}
                  </MenuItem>
                ))}
              </Select>
              {/* <ResponsiveTypography variant="formHelper" sx={{ mt: 0.5, display: 'block' }}>
                {t('cashflow.transfer.fromSourceHelper')}
              </ResponsiveTypography> */}
            </FormControl>
            
            <FundingSourceInput
              value={transferData.toSource}
              onChange={(toSource) => updateTransferData({ toSource })}
              existingSources={finalFundingSources}
              label={t('cashflow.transfer.toSource')}
              placeholder={t('cashflow.transfer.toSourcePlaceholder')}
              required
              allowNew={true}
              disabled={isLoading}
            />
            
            <TextField
              fullWidth
              label={t('cashflow.transfer.date')}
              type="date"
              value={transferData.transferDate}
              onChange={(e) => updateTransferData({ transferDate: e.target.value })}
              margin="normal"
              InputLabelProps={{ shrink: true }}
              // helperText={t('cashflow.transfer.dateHelper')}
              disabled={isLoading}
            />
          </Box>
        </Grid>
        
        {/* Right Column */}
        <Grid item xs={12} md={6}>
          <Box sx={{ pl: { md: 1.5 } }}>
            <MoneyInput
              value={transferData.amount}
              onChange={(amount) => updateTransferData({ amount })}
              label={t('cashflow.transfer.amount')}
              placeholder={t('cashflow.transfer.amountPlaceholder')}
              required
              margin="normal"
              error={!!(transferData.amount && transferData.amount <= 0)}
              disabled={isLoading}
            />
            
            <TextField
              fullWidth
              label={t('cashflow.transfer.description')}
              value={transferData.description}
              onChange={(e) => updateTransferData({ description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
              placeholder={t('cashflow.transfer.descriptionPlaceholder', { 
                from: transferData.fromSource || t('cashflow.transfer.source'), 
                to: transferData.toSource || t('cashflow.transfer.destination') 
              })}
              // helperText={t('cashflow.transfer.descriptionHelper')}
              disabled={isLoading}
            />
          </Box>
        </Grid>
      </Grid>

      {/* Transfer Summary */}
      {transferData.fromSource && transferData.toSource && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <ResponsiveTypography variant="tableCell" sx={{ fontWeight: 'bold' }}>
            {t('cashflow.transfer.summary')}:
          </ResponsiveTypography>
          <ResponsiveTypography variant="tableCell">
            {t('cashflow.transfer.summaryText', { 
              amount: formatCurrency(transferData.amount), 
              from: transferData.fromSource, 
              to: transferData.toSource 
            })}
          </ResponsiveTypography>
          <ResponsiveTypography variant="formHelper" sx={{ mt: 1, display: 'block' }}>
            {t('cashflow.transfer.summaryHelper')}
          </ResponsiveTypography>
        </Alert>
      )}

      {/* Action Buttons */}
      {showActions && (
        <Box sx={{ display: 'flex', gap: 1, mt: 3, justifyContent: 'flex-end' }}>
          {onCancel && (
            <ResponsiveButton 
              onClick={onCancel}
              mobileText={t('common.cancel')}
              desktopText={t('common.cancel')}
            >
              {t('common.cancel')}
            </ResponsiveButton>
          )}
          <ResponsiveButton
            onClick={handleFormSubmit}
            variant="contained"
            color="secondary"
            icon={<TransferIcon />}
            mobileText={isLoading ? t('cashflow.transfer.transferring') : t('cashflow.transfer.transfer')}
            desktopText={isLoading ? t('cashflow.transfer.transferring') : t('cashflow.transfer.transferCash')}
            disabled={isLoading || !isFormValid()}
          >
            {isLoading ? t('cashflow.transfer.transferring') : t('cashflow.transfer.transferCash')}
          </ResponsiveButton>
        </Box>
      )}
    </Box>
  );
};

export default TransferCashForm;
