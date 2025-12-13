/**
 * Default Items Suggestion Modal Component
 * Allows users to select default income and expense items to add to their analysis
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Stack,
  Checkbox,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  Paper,
} from '@mui/material';
import { Lightbulb as LightbulbIcon } from '@mui/icons-material';
import { ModalWrapper } from '../Common/ModalWrapper';
import { ResponsiveTypography } from '../Common/ResponsiveTypography';
import { ResponsiveButton } from '../Common/ResponsiveButton';
import { useTranslation } from 'react-i18next';
import {
  AnalysisIncome,
  AnalysisExpense,
  IncomeCategory,
  ExpenseCategory,
} from '../../types/personalFinancialAnalysis.types';

interface DefaultItem {
  id: string;
  name: string;
  category: IncomeCategory | ExpenseCategory;
}

interface CategoryGroup {
  title: string;
  category: IncomeCategory | ExpenseCategory;
  items: DefaultItem[];
}

interface DefaultItemsSuggestionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (selectedIncome: AnalysisIncome[], selectedExpenses: AnalysisExpense[]) => void;
}

// Helper to generate UUID
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Default income items
const defaultIncomeItems: DefaultItem[] = [
  { id: 'income-1', name: 'Tiền lương', category: IncomeCategory.FAMILY },
  { id: 'income-2', name: 'Tiền kinh doanh', category: IncomeCategory.BUSINESS },
];

// Default expense items grouped by category
const defaultExpenseItems: DefaultItem[] = [
  // Nhu cầu sinh hoạt (LIVING)
  { id: 'expense-1', name: 'Ăn uống', category: ExpenseCategory.LIVING },
  { id: 'expense-2', name: 'Tiền thuê nhà', category: ExpenseCategory.LIVING },
  { id: 'expense-3', name: 'Chi phí căn hộ chung cư', category: ExpenseCategory.LIVING },
  { id: 'expense-4', name: 'Tiền điện', category: ExpenseCategory.LIVING },
  { id: 'expense-5', name: 'Tiền nước', category: ExpenseCategory.LIVING },
  { id: 'expense-6', name: 'Xăng xe', category: ExpenseCategory.LIVING },
  { id: 'expense-7', name: 'Đi lại', category: ExpenseCategory.LIVING },
  { id: 'expense-8', name: 'Mua sắm quần áo', category: ExpenseCategory.LIVING },
  { id: 'expense-9', name: 'Mua sắm đồ dùng gia đình', category: ExpenseCategory.LIVING },
  // Nhu cầu bảo vệ (INSURANCE)
  { id: 'expense-10', name: 'Bảo hiểm nhân thọ', category: ExpenseCategory.INSURANCE },
  { id: 'expense-11', name: 'Bảo hiểm phương tiện', category: ExpenseCategory.INSURANCE },
  // Nhu cầu sinh hoạt giải trí (OTHER)
  { id: 'expense-12', name: 'Ăn uống ngoài gia đình', category: ExpenseCategory.OTHER },
  { id: 'expense-13', name: 'Sở thích cá nhân', category: ExpenseCategory.OTHER },
  { id: 'expense-14', name: 'Thể thao', category: ExpenseCategory.OTHER },
  { id: 'expense-15', name: 'Du lịch', category: ExpenseCategory.OTHER },
  { id: 'expense-16', name: 'Xem phim', category: ExpenseCategory.OTHER },
  { id: 'expense-17', name: 'Hội họp', category: ExpenseCategory.OTHER },
  // Nhu cầu học tập sức khỏe (EDUCATION)
  { id: 'expense-18', name: 'Thuốc và dịch vụ y tế', category: ExpenseCategory.EDUCATION },
  { id: 'expense-19', name: 'Dịch vụ giáo dục', category: ExpenseCategory.EDUCATION },
];

export const DefaultItemsSuggestionModal: React.FC<DefaultItemsSuggestionModalProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();
  
  // Auto-select: Tiền lương (income-1) and all LIVING expenses
  const autoSelectedIncomeIds = useMemo(() => {
    return new Set(['income-1']); // Tiền lương
  }, []);

  const autoSelectedExpenseIds = useMemo(() => {
    // All expenses with category LIVING
    return new Set(
      defaultExpenseItems
        .filter((item) => item.category === ExpenseCategory.LIVING)
        .map((item) => item.id)
    );
  }, []);

  const [selectedIncomeIds, setSelectedIncomeIds] = useState<Set<string>>(autoSelectedIncomeIds);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<Set<string>>(autoSelectedExpenseIds);

  // Reset selections when modal opens
  useEffect(() => {
    if (open) {
      setSelectedIncomeIds(new Set(autoSelectedIncomeIds));
      setSelectedExpenseIds(new Set(autoSelectedExpenseIds));
    }
  }, [open, autoSelectedIncomeIds, autoSelectedExpenseIds]);

  // Group expenses by category
  const expenseGroups: CategoryGroup[] = useMemo(() => {
    const groups: Record<string, CategoryGroup> = {};

    defaultExpenseItems.forEach((item) => {
      const categoryKey = item.category;
      if (!groups[categoryKey]) {
        let title = '';
        switch (item.category) {
          case ExpenseCategory.LIVING:
            title = 'Nhu cầu sinh hoạt';
            break;
          case ExpenseCategory.INSURANCE:
            title = 'Nhu cầu bảo vệ';
            break;
          case ExpenseCategory.OTHER:
            title = 'Nhu cầu sinh hoạt giải trí';
            break;
          case ExpenseCategory.EDUCATION:
            title = 'Nhu cầu học tập sức khỏe';
            break;
        }
        groups[categoryKey] = {
          title,
          category: item.category,
          items: [],
        };
      }
      groups[categoryKey].items.push(item);
    });

    return Object.values(groups);
  }, []);

  // Group income by category
  const incomeGroups: CategoryGroup[] = useMemo(() => {
    const groups: Record<string, CategoryGroup> = {};

    defaultIncomeItems.forEach((item) => {
      const categoryKey = item.category;
      if (!groups[categoryKey]) {
        let title = '';
        switch (item.category) {
          case IncomeCategory.FAMILY:
            title = 'Thu nhập gia đình';
            break;
          case IncomeCategory.BUSINESS:
            title = 'Thu nhập kinh doanh';
            break;
          case IncomeCategory.OTHER:
            title = 'Thu nhập khác';
            break;
        }
        groups[categoryKey] = {
          title,
          category: item.category,
          items: [],
        };
      }
      groups[categoryKey].items.push(item);
    });

    return Object.values(groups);
  }, []);

  const handleIncomeToggle = (itemId: string) => {
    setSelectedIncomeIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleExpenseToggle = (itemId: string) => {
    setSelectedExpenseIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAllIncome = (checked: boolean) => {
    if (checked) {
      setSelectedIncomeIds(new Set(defaultIncomeItems.map((item) => item.id)));
    } else {
      setSelectedIncomeIds(new Set());
    }
  };

  const handleSelectAllExpenses = (checked: boolean) => {
    if (checked) {
      setSelectedExpenseIds(new Set(defaultExpenseItems.map((item) => item.id)));
    } else {
      setSelectedExpenseIds(new Set());
    }
  };

  const handleConfirm = () => {
    // Convert selected items to AnalysisIncome and AnalysisExpense
    const selectedIncome: AnalysisIncome[] = defaultIncomeItems
      .filter((item) => selectedIncomeIds.has(item.id))
      .map((item) => ({
        id: generateId(),
        name: item.name,
        monthlyValue: 0,
        category: item.category as IncomeCategory,
      }));

    const selectedExpenses: AnalysisExpense[] = defaultExpenseItems
      .filter((item) => selectedExpenseIds.has(item.id))
      .map((item) => ({
        id: generateId(),
        name: item.name,
        monthlyValue: 0,
        category: item.category as ExpenseCategory,
      }));

    onConfirm(selectedIncome, selectedExpenses);
    onClose();
  };

  const allIncomeSelected = selectedIncomeIds.size === defaultIncomeItems.length;
  const allExpensesSelected = selectedExpenseIds.size === defaultExpenseItems.length;

  return (
    <ModalWrapper
      open={open}
      onClose={onClose}
      title={t('personalFinancialAnalysis.defaultItems.title', 'Gợi ý các mục mặc định')}
      icon={<LightbulbIcon />}
      maxWidth="md"
      fullWidth
      actions={
        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ width: '100%' }}>
          <ResponsiveButton variant="text" onClick={onClose}>
            {t('common.cancel')}
          </ResponsiveButton>
          <ResponsiveButton variant="contained" onClick={handleConfirm}>
            {t('common.confirm')}
          </ResponsiveButton>
        </Stack>
      }
    >
      <Stack spacing={3}>
        <ResponsiveTypography variant="body2" color="text.secondary" ellipsis={false}>
          {t(
            'personalFinancialAnalysis.defaultItems.description',
            'Chọn các mục thu nhập và chi tiêu phù hợp với bạn. Bạn có thể chỉnh sửa sau khi thêm vào phân tích.'
          )}
        </ResponsiveTypography>

        {/* Income Section */}
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <ResponsiveTypography variant="h6" sx={{ fontWeight: 600 }}>
              {t('personalFinancialAnalysis.income.title')}
            </ResponsiveTypography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={allIncomeSelected}
                  indeterminate={selectedIncomeIds.size > 0 && !allIncomeSelected}
                  onChange={(e) => handleSelectAllIncome(e.target.checked)}
                />
              }
              label={t('common.selectAll')}
            />
          </Stack>

          <Stack spacing={2}>
            {incomeGroups.map((group) => (
              <Paper
                key={group.category}
                variant="outlined"
                sx={{
                  p: 2,
                  backgroundColor: 'background.default',
                }}
              >
                <ResponsiveTypography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                  {group.title}
                </ResponsiveTypography>
                <List dense>
                  {group.items.map((item) => (
                    <ListItem key={item.id} disablePadding>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedIncomeIds.has(item.id)}
                            onChange={() => handleIncomeToggle(item.id)}
                            size="small"
                          />
                        }
                        label={item.name}
                        sx={{ width: '100%' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            ))}
          </Stack>
        </Stack>

        <Divider />

        {/* Expenses Section */}
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <ResponsiveTypography variant="h6" sx={{ fontWeight: 600 }}>
              {t('personalFinancialAnalysis.expenses.title')}
            </ResponsiveTypography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={allExpensesSelected}
                  indeterminate={selectedExpenseIds.size > 0 && !allExpensesSelected}
                  onChange={(e) => handleSelectAllExpenses(e.target.checked)}
                />
              }
              label={t('common.selectAll')}
            />
          </Stack>

          <Stack spacing={2}>
            {expenseGroups.map((group) => (
              <Paper
                key={group.category}
                variant="outlined"
                sx={{
                  p: 2,
                  backgroundColor: 'background.default',
                }}
              >
                <ResponsiveTypography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                  {group.title}
                </ResponsiveTypography>
                <List dense>
                  {group.items.map((item) => (
                    <ListItem key={item.id} disablePadding>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedExpenseIds.has(item.id)}
                            onChange={() => handleExpenseToggle(item.id)}
                            size="small"
                          />
                        }
                        label={item.name}
                        sx={{ width: '100%' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </ModalWrapper>
  );
};

