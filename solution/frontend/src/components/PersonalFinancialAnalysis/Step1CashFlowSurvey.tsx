/**
 * Step 1: Cash Flow Survey Component
 */

import React, { useState } from 'react';
import {
  Box,
  Divider,
  IconButton,
  TextField,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { ResponsiveButton } from '../Common';
import MoneyInput from '../Common/MoneyInput';
import NumberInput from '../Common/NumberInput';
import { PortfolioSelectorModal } from './PortfolioSelectorModal';
import { Step1CashFlowSurveyProps } from '../../types/personalFinancialAnalysis.types';
import {
  AssetCategory,
  AssetLayer,
  IncomeCategory,
  ExpenseCategory,
  AnalysisAsset,
  AnalysisIncome,
  AnalysisExpense,
  AnalysisDebt,
} from '../../types/personalFinancialAnalysis.types';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../utils/format';
import { useAccount } from '../../contexts/AccountContext';
import { useLinkPortfolio, useUnlinkPortfolio } from '../../hooks/usePersonalFinancialAnalysis';
import { usePortfolios } from '../../hooks/usePortfolios';
// Helper to generate UUID
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const Step1CashFlowSurvey: React.FC<Step1CashFlowSurveyProps> = ({
  analysis,
  onUpdate,
  onPortfolioLink,
  onPortfolioUnlink,
}) => {
  const { t } = useTranslation();
  const { baseCurrency, accountId } = useAccount();
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);
  const linkPortfolioMutation = useLinkPortfolio();
  const unlinkPortfolioMutation = useUnlinkPortfolio();
  const { portfolios } = usePortfolios(accountId);

  const handleAddAsset = () => {
    const newAsset: AnalysisAsset = {
      id: generateId(),
      name: '',
      value: 0,
      category: AssetCategory.CONSUMER,
      layer: AssetLayer.PROTECTION,
      source: 'custom',
    };
    onUpdate({
      assets: [...(analysis.assets || []), newAsset],
    });
  };

  const handleUpdateAsset = (id: string, updates: Partial<AnalysisAsset>) => {
    const updated = analysis.assets.map((a) =>
      a.id === id ? { ...a, ...updates } : a
    );
    onUpdate({ assets: updated });
  };

  const handleDeleteAsset = (id: string) => {
    const updated = analysis.assets.filter((a) => a.id !== id);
    onUpdate({ assets: updated });
  };

  const handleAddIncome = () => {
    const newIncome: AnalysisIncome = {
      id: generateId(),
      name: '',
      monthlyValue: 0,
      category: IncomeCategory.FAMILY,
    };
    onUpdate({
      income: [...(analysis.income || []), newIncome],
    });
  };

  const handleUpdateIncome = (id: string, updates: Partial<AnalysisIncome>) => {
    const updated = analysis.income.map((i) =>
      i.id === id ? { ...i, ...updates } : i
    );
    onUpdate({ income: updated });
  };

  const handleDeleteIncome = (id: string) => {
    const updated = analysis.income.filter((i) => i.id !== id);
    onUpdate({ income: updated });
  };

  const handleAddExpense = () => {
    const newExpense: AnalysisExpense = {
      id: generateId(),
      name: '',
      monthlyValue: 0,
      category: ExpenseCategory.LIVING,
    };
    onUpdate({
      expenses: [...(analysis.expenses || []), newExpense],
    });
  };

  const handleUpdateExpense = (id: string, updates: Partial<AnalysisExpense>) => {
    const updated = analysis.expenses.map((e) =>
      e.id === id ? { ...e, ...updates } : e
    );
    onUpdate({ expenses: updated });
  };

  const handleDeleteExpense = (id: string) => {
    const updated = analysis.expenses.filter((e) => e.id !== id);
    onUpdate({ expenses: updated });
  };

  const handleAddDebt = () => {
    const newDebt: AnalysisDebt = {
      id: generateId(),
      name: '',
      principalAmount: 0,
      interestRate: 0,
      term: 0,
      monthlyPayment: 0,
    };
    onUpdate({
      debts: [...(analysis.debts || []), newDebt],
    });
  };

  const handleUpdateDebt = (id: string, updates: Partial<AnalysisDebt>) => {
    const updated = analysis.debts.map((d) =>
      d.id === id ? { ...d, ...updates } : d
    );
    onUpdate({ debts: updated });
  };

  const handleDeleteDebt = (id: string) => {
    const updated = analysis.debts.filter((d) => d.id !== id);
    onUpdate({ debts: updated });
  };

  // Get portfolio names for display
  const getPortfolioName = (portfolioId: string): string => {
    const portfolio = portfolios.find((p) => p.portfolioId === portfolioId);
    return portfolio?.name || portfolioId;
  };

  const handleLinkPortfolio = async (portfolioId: string) => {
    if (!analysis.id) return;
    try {
      await linkPortfolioMutation.mutateAsync({
        analysisId: analysis.id,
        portfolioId,
      });
      if (onPortfolioLink) {
        await onPortfolioLink(portfolioId);
      }
    } catch (error) {
      console.error('Error linking portfolio:', error);
    }
  };

  const handleUnlinkPortfolio = async (portfolioId: string) => {
    if (!analysis.id) return;
    try {
      await unlinkPortfolioMutation.mutateAsync({
        analysisId: analysis.id,
        portfolioId,
      });
      if (onPortfolioUnlink) {
        await onPortfolioUnlink(portfolioId);
      }
    } catch (error) {
      console.error('Error unlinking portfolio:', error);
    }
  };

  // Calculate totals
  const totalAssets = analysis.assets.reduce((sum, a) => sum + a.value, 0);
  const totalAnnualIncome = analysis.income.reduce((sum, i) => sum + i.monthlyValue * 12, 0);
  const totalAnnualExpenses = analysis.expenses.reduce((sum, e) => sum + e.monthlyValue * 12, 0);
  const totalMonthlyDebtPayments = analysis.debts.reduce((sum, d) => sum + d.monthlyPayment, 0);
  const totalAnnualDebtPayments = totalMonthlyDebtPayments * 12;

  return (
    <Box>
      {/* <ResponsiveTypography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        {t('personalFinancialAnalysis.steps.step1.title')}
      </ResponsiveTypography> */}

      {/* Portfolio Linking Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2, gap: 2 }}>
          {/* <ResponsiveTypography variant="h6">
            {t('personalFinancialAnalysis.portfolioLinking.title')}
          </ResponsiveTypography> */} 
          <ResponsiveButton
            variant="text"
            icon={<LinkIcon />}
            onClick={() => setPortfolioModalOpen(true)}
          >
            {t('personalFinancialAnalysis.portfolioLinking.linkPortfolio')}
          </ResponsiveButton>
          {analysis.linkedPortfolioIds && analysis.linkedPortfolioIds.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {analysis.linkedPortfolioIds.map((portfolioId) => (
                <Chip
                  key={portfolioId}
                  label={getPortfolioName(portfolioId)}
                  onDelete={() => handleUnlinkPortfolio(portfolioId)}
                  color="primary"
                  variant="outlined"
                  disabled={unlinkPortfolioMutation.isLoading}
                />
              ))}
            </Box>
          )}
        
        </Box>
      </Box>

      {/* Portfolio Selector Modal */}
      {analysis.id && (
        <PortfolioSelectorModal
          open={portfolioModalOpen}
          onClose={() => setPortfolioModalOpen(false)}
          onSelect={handleLinkPortfolio}
          excludePortfolioIds={analysis.linkedPortfolioIds || []}
          loading={linkPortfolioMutation.isLoading}
        />
      )}

      <Divider sx={{ mb: 4 }} />

      {/* Assets Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <ResponsiveTypography variant="h6">
            {t('personalFinancialAnalysis.assets.title')}
          </ResponsiveTypography>
          <ResponsiveButton variant="outlined" startIcon={<AddIcon />} onClick={handleAddAsset}>
            {t('personalFinancialAnalysis.assets.add')}
          </ResponsiveButton>
        </Box>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>
                  {t('personalFinancialAnalysis.assets.name')}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, minWidth: 150 }}>
                  {t('personalFinancialAnalysis.assets.value')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 150 }}>
                  {t('personalFinancialAnalysis.assets.category')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 150 }}>
                  {t('personalFinancialAnalysis.assets.layer')}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, minWidth: 120 }}>
                  {t('personalFinancialAnalysis.assets.emergencyFund')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>
                  {t('personalFinancialAnalysis.assets.source')}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, width: 100 }}>
                  {t('common.actions')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analysis.assets.map((asset) => (
                <TableRow key={asset.id} hover>
                  <TableCell sx={{ minWidth: 200 }}>
                    <TextField
                      value={asset.name}
                      onChange={(e) => handleUpdateAsset(asset.id, { name: e.target.value })}
                      size="small"
                      fullWidth
                      variant="standard"
                      placeholder={t('personalFinancialAnalysis.assets.name')}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ minWidth: 150 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Box sx={{ width: 150 }}>
                        <MoneyInput
                          value={asset.value}
                          onChange={(value) => handleUpdateAsset(asset.id, { value })}
                          currency={baseCurrency}
                          showCurrency={false}
                          showIcon={false}
                          size="small"
                          fullWidth
                          variant="standard"
                          label=""
                          InputLabelProps={{ shrink: false }}
                        />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ minWidth: 150 }}>
                    <TextField
                      select
                      value={asset.category}
                      onChange={(e) => handleUpdateAsset(asset.id, { category: e.target.value as AssetCategory })}
                      size="small"
                      variant="standard"
                      fullWidth
                    >
                      <MenuItem value={AssetCategory.CONSUMER}>
                        {t('personalFinancialAnalysis.assets.categories.consumer')}
                      </MenuItem>
                      <MenuItem value={AssetCategory.BUSINESS}>
                        {t('personalFinancialAnalysis.assets.categories.business')}
                      </MenuItem>
                      <MenuItem value={AssetCategory.FINANCIAL}>
                        {t('personalFinancialAnalysis.assets.categories.financial')}
                      </MenuItem>
                      <MenuItem value={AssetCategory.REAL_ESTATE}>
                        {t('personalFinancialAnalysis.assets.categories.realEstate')}
                      </MenuItem>
                    </TextField>
                  </TableCell>
                  <TableCell sx={{ minWidth: 150 }}>
                    <TextField
                      select
                      value={asset.layer || AssetLayer.PROTECTION}
                      onChange={(e) => handleUpdateAsset(asset.id, { layer: e.target.value as AssetLayer })}
                      size="small"
                      variant="standard"
                      fullWidth
                    >
                      <MenuItem value={AssetLayer.PROTECTION}>
                        {t('personalFinancialAnalysis.assetLayers.protection')}
                      </MenuItem>
                      <MenuItem value={AssetLayer.INCOME_GENERATION}>
                        {t('personalFinancialAnalysis.assetLayers.incomeGeneration')}
                      </MenuItem>
                      <MenuItem value={AssetLayer.GROWTH}>
                        {t('personalFinancialAnalysis.assetLayers.growth')}
                      </MenuItem>
                      <MenuItem value={AssetLayer.RISK}>
                        {t('personalFinancialAnalysis.assetLayers.risk')}
                      </MenuItem>
                    </TextField>
                  </TableCell>
                  <TableCell align="center" sx={{ minWidth: 120 }}>
                    <Checkbox
                      checked={asset.isEmergencyFund || false}
                      onChange={(e) => handleUpdateAsset(asset.id, { isEmergencyFund: e.target.checked })}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: 120 }}>
                    {asset.source === 'portfolio' ? (
                      <Chip label={t('personalFinancialAnalysis.assets.fromPortfolio')} size="small" color="primary" />
                    ) : (
                      <Chip label={t('personalFinancialAnalysis.assets.custom')} size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton onClick={() => handleDeleteAsset(asset.id)} color="error" size="small">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {analysis.assets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    {t('personalFinancialAnalysis.assets.empty')}
                  </TableCell>
                </TableRow>
              )}
              {analysis.assets.length > 0 && (
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {t('personalFinancialAnalysis.assets.total')}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {formatCurrency(totalAssets, baseCurrency)}
                  </TableCell>
                  <TableCell colSpan={5} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* Income Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <ResponsiveTypography variant="h6">
            {t('personalFinancialAnalysis.income.title')}
          </ResponsiveTypography>
          <ResponsiveButton variant="outlined" startIcon={<AddIcon />} onClick={handleAddIncome}>
            {t('personalFinancialAnalysis.income.add')}
          </ResponsiveButton>
        </Box>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>
                  {t('personalFinancialAnalysis.income.name')}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, minWidth: 150 }}>
                  {t('personalFinancialAnalysis.income.monthlyValue')}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, minWidth: 150 }}>
                  {t('personalFinancialAnalysis.income.annualValue')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 150 }}>
                  {t('personalFinancialAnalysis.income.category')}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, width: 100 }}>
                  {t('common.actions')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analysis.income.map((income) => (
                <TableRow key={income.id} hover>
                  <TableCell sx={{ minWidth: 200 }}>
                    <TextField
                      value={income.name}
                      onChange={(e) => handleUpdateIncome(income.id, { name: e.target.value })}
                      size="small"
                      fullWidth
                      variant="standard"
                      placeholder={t('personalFinancialAnalysis.income.name')}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ minWidth: 150 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Box sx={{ width: 150 }}>
                        <MoneyInput
                          value={income.monthlyValue}
                          onChange={(value) => handleUpdateIncome(income.id, { monthlyValue: value })}
                          currency={baseCurrency}
                          showCurrency={false}
                          showIcon={false}
                          size="small"
                          fullWidth
                          variant="standard"
                          label=""
                          InputLabelProps={{ shrink: false }}
                        />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ minWidth: 150 }}>
                    {formatCurrency(income.monthlyValue * 12, baseCurrency)}
                  </TableCell>
                  <TableCell sx={{ minWidth: 150 }}>
                    <TextField
                      select
                      value={income.category}
                      onChange={(e) => handleUpdateIncome(income.id, { category: e.target.value as IncomeCategory })}
                      size="small"
                      variant="standard"
                      fullWidth
                    >
                      <MenuItem value={IncomeCategory.FAMILY}>
                        {t('personalFinancialAnalysis.income.categories.family')}
                      </MenuItem>
                      <MenuItem value={IncomeCategory.BUSINESS}>
                        {t('personalFinancialAnalysis.income.categories.business')}
                      </MenuItem>
                      <MenuItem value={IncomeCategory.OTHER}>
                        {t('personalFinancialAnalysis.income.categories.other')}
                      </MenuItem>
                    </TextField>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton onClick={() => handleDeleteIncome(income.id)} color="error" size="small">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {analysis.income.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    {t('personalFinancialAnalysis.income.empty')}
                  </TableCell>
                </TableRow>
              )}
              {analysis.income.length > 0 && (
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {t('personalFinancialAnalysis.income.totalAnnual')}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {formatCurrency(totalAnnualIncome / 12, baseCurrency)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {formatCurrency(totalAnnualIncome, baseCurrency)}
                  </TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* Expenses Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <ResponsiveTypography variant="h6">
            {t('personalFinancialAnalysis.expenses.title')}
          </ResponsiveTypography>
          <ResponsiveButton variant="outlined" startIcon={<AddIcon />} onClick={handleAddExpense}>
            {t('personalFinancialAnalysis.expenses.add')}
          </ResponsiveButton>
        </Box>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>
                  {t('personalFinancialAnalysis.expenses.name')}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, minWidth: 150 }}>
                  {t('personalFinancialAnalysis.expenses.monthlyValue')}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, minWidth: 150 }}>
                  {t('personalFinancialAnalysis.expenses.annualValue')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 150 }}>
                  {t('personalFinancialAnalysis.expenses.category')}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, width: 100 }}>
                  {t('common.actions')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analysis.expenses.map((expense) => (
                <TableRow key={expense.id} hover>
                  <TableCell sx={{ minWidth: 200 }}>
                    <TextField
                      value={expense.name}
                      onChange={(e) => handleUpdateExpense(expense.id, { name: e.target.value })}
                      size="small"
                      fullWidth
                      variant="standard"
                      placeholder={t('personalFinancialAnalysis.expenses.name')}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ minWidth: 150 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Box sx={{ width: 150 }}>
                        <MoneyInput
                          value={expense.monthlyValue}
                          onChange={(value) => handleUpdateExpense(expense.id, { monthlyValue: value })}
                          currency={baseCurrency}
                          showCurrency={false}
                          showIcon={false}
                          size="small"
                          fullWidth
                          variant="standard"
                          label=""
                          InputLabelProps={{ shrink: false }}
                        />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ minWidth: 150 }}>
                    {formatCurrency(expense.monthlyValue * 12, baseCurrency)}
                  </TableCell>
                  <TableCell sx={{ minWidth: 150 }}>
                    <TextField
                      select
                      value={expense.category}
                      onChange={(e) => handleUpdateExpense(expense.id, { category: e.target.value as ExpenseCategory })}
                      size="small"
                      variant="standard"
                      fullWidth
                    >
                      <MenuItem value={ExpenseCategory.LIVING}>
                        {t('personalFinancialAnalysis.expenses.categories.living')}
                      </MenuItem>
                      <MenuItem value={ExpenseCategory.EDUCATION}>
                        {t('personalFinancialAnalysis.expenses.categories.education')}
                      </MenuItem>
                      <MenuItem value={ExpenseCategory.INSURANCE}>
                        {t('personalFinancialAnalysis.expenses.categories.insurance')}
                      </MenuItem>
                      <MenuItem value={ExpenseCategory.OTHER}>
                        {t('personalFinancialAnalysis.expenses.categories.other')}
                      </MenuItem>
                    </TextField>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton onClick={() => handleDeleteExpense(expense.id)} color="error" size="small">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {analysis.expenses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    {t('personalFinancialAnalysis.expenses.empty')}
                  </TableCell>
                </TableRow>
              )}
              {analysis.expenses.length > 0 && (
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {t('personalFinancialAnalysis.expenses.totalAnnual')}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {formatCurrency(totalAnnualExpenses / 12, baseCurrency)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {formatCurrency(totalAnnualExpenses, baseCurrency)}
                  </TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* Debts Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <ResponsiveTypography variant="h6">
            {t('personalFinancialAnalysis.debts.title')}
          </ResponsiveTypography>
          <ResponsiveButton variant="outlined" startIcon={<AddIcon />} onClick={handleAddDebt}>
            {t('personalFinancialAnalysis.debts.add')}
          </ResponsiveButton>
        </Box>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>
                  {t('personalFinancialAnalysis.debts.name')}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, minWidth: 150 }}>
                  {t('personalFinancialAnalysis.debts.principalAmount')}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, minWidth: 120 }}>
                  {t('personalFinancialAnalysis.debts.interestRate')}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, minWidth: 120 }}>
                  {t('personalFinancialAnalysis.debts.term')}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, minWidth: 150 }}>
                  {t('personalFinancialAnalysis.debts.monthlyPayment')}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, minWidth: 150 }}>
                  {t('personalFinancialAnalysis.debts.annualPayment')}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, width: 100 }}>
                  {t('common.actions')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analysis.debts.map((debt) => (
                <TableRow key={debt.id} hover>
                  <TableCell sx={{ minWidth: 200 }}>
                    <TextField
                      value={debt.name}
                      onChange={(e) => handleUpdateDebt(debt.id, { name: e.target.value })}
                      size="small"
                      fullWidth
                      variant="standard"
                      placeholder={t('personalFinancialAnalysis.debts.name')}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ minWidth: 150 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Box sx={{ width: 150 }}>
                        <MoneyInput
                          value={debt.principalAmount}
                          onChange={(value) => handleUpdateDebt(debt.id, { principalAmount: value })}
                          currency={baseCurrency}
                          showCurrency={false}
                          showIcon={false}
                          size="small"
                          fullWidth
                          variant="standard"
                          label=""
                          InputLabelProps={{ shrink: false }}
                        />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ minWidth: 120 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Box sx={{ width: 100 }}>
                        <NumberInput
                          value={debt.interestRate}
                          onChange={(value) => handleUpdateDebt(debt.id, { interestRate: value })}
                          min={0}
                          max={100}
                          step={0.1}
                          decimalPlaces={2}
                          showThousandsSeparator={false}
                          suffix="%"
                          showIcon={false}
                          size="small"
                          fullWidth
                          variant="standard"
                          label=""
                          InputLabelProps={{ shrink: false }}
                        />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ minWidth: 120 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Box sx={{ width: 120 }}>
                        <NumberInput
                          value={debt.term}
                          onChange={(value) => handleUpdateDebt(debt.id, { term: Math.round(value) })}
                          min={0}
                          step={1}
                          decimalPlaces={0}
                          showThousandsSeparator={false}
                          suffix={` ${t('personalFinancialAnalysis.debts.months')}`}
                          showIcon={false}
                          size="small"
                          fullWidth
                          variant="standard"
                          label=""
                          InputLabelProps={{ shrink: false }}
                        />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ minWidth: 150 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Box sx={{ width: 150 }}>
                        <MoneyInput
                          value={debt.monthlyPayment}
                          onChange={(value) => handleUpdateDebt(debt.id, { monthlyPayment: value })}
                          currency={baseCurrency}
                          showCurrency={false}
                          showIcon={false}
                          size="small"
                          fullWidth
                          variant="standard"
                          label=""
                          InputLabelProps={{ shrink: false }}
                        />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ minWidth: 150 }}>
                    {formatCurrency(debt.monthlyPayment * 12, baseCurrency)}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton onClick={() => handleDeleteDebt(debt.id)} color="error" size="small">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {analysis.debts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    {t('personalFinancialAnalysis.debts.empty')}
                  </TableCell>
                </TableRow>
              )}
              {analysis.debts.length > 0 && (
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {t('personalFinancialAnalysis.debts.totalAnnualPayments')}
                  </TableCell>
                  <TableCell colSpan={3} />
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {formatCurrency(totalMonthlyDebtPayments, baseCurrency)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {formatCurrency(totalAnnualDebtPayments, baseCurrency)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

