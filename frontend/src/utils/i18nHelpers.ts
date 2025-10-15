/**
 * i18n Helper Utilities
 * Provides common i18n patterns and utilities for the application
 */

import { useTranslation } from 'react-i18next';

/**
 * Hook for common form translations
 */
export const useFormI18n = () => {
  const { t } = useTranslation();
  
  return {
    labels: {
      name: t('common.name'),
      description: t('common.description'),
      email: t('common.email'),
      phone: t('common.phone'),
      address: t('common.address'),
      date: t('common.date'),
      time: t('common.time'),
      amount: t('common.amount'),
      quantity: t('common.quantity'),
      price: t('common.price'),
      total: t('common.total'),
      currency: t('common.currency'),
      type: t('common.type'),
      status: t('common.status'),
      notes: t('common.notes'),
    },
    buttons: {
      save: t('forms.save'),
      cancel: t('forms.cancel'),
      delete: t('forms.delete'),
      edit: t('forms.edit'),
      create: t('forms.create'),
      update: t('forms.update'),
      close: t('forms.close'),
      confirm: t('forms.confirm'),
      submit: t('forms.submit'),
      loading: t('forms.loading'),
      saving: t('forms.saving'),
      deleting: t('forms.deleting'),
    },
    validation: {
      required: t('validation.required'),
      email: t('validation.email'),
      number: t('validation.number'),
      minLength: (min: number) => t('validation.minLength', { min }),
      maxLength: (max: number) => t('validation.maxLength', { max }),
      min: (min: number) => t('validation.min', { min }),
      max: (max: number) => t('validation.max', { max }),
    },
    messages: {
      success: t('forms.success'),
      error: t('forms.error'),
      warning: t('forms.warning'),
      info: t('forms.info'),
    }
  };
};

/**
 * Hook for table translations
 */
export const useTableI18n = () => {
  const { t } = useTranslation();
  
  return {
    noData: t('tables.noData'),
    loading: t('tables.loading'),
    search: t('tables.search'),
    filter: t('tables.filter'),
    sort: t('tables.sort'),
    export: t('tables.export'),
    import: t('tables.import'),
    refresh: t('tables.refresh'),
    rowsPerPage: t('tables.rowsPerPage'),
    of: t('tables.of'),
    actions: t('tables.actions'),
    view: t('tables.view'),
    edit: t('tables.edit'),
    delete: t('tables.delete'),
    copy: t('tables.copy'),
    download: t('tables.download'),
  };
};

/**
 * Hook for notification translations
 */
export const useNotificationI18n = () => {
  const { t } = useTranslation();
  
  return {
    success: t('notifications.success'),
    error: t('notifications.error'),
    warning: t('notifications.warning'),
    info: t('notifications.info'),
    portfolioCreated: t('notifications.portfolioCreated'),
    portfolioUpdated: t('notifications.portfolioUpdated'),
    portfolioDeleted: t('notifications.portfolioDeleted'),
    assetAdded: t('notifications.assetAdded'),
    assetUpdated: t('notifications.assetUpdated'),
    assetDeleted: t('notifications.assetDeleted'),
    tradeExecuted: t('notifications.tradeExecuted'),
    depositAdded: t('notifications.depositAdded'),
    settingsSaved: t('notifications.settingsSaved'),
    operationFailed: t('notifications.operationFailed'),
    networkError: t('notifications.networkError'),
    unauthorized: t('notifications.unauthorized'),
    forbidden: t('notifications.forbidden'),
  };
};

/**
 * Hook for error translations
 */
export const useErrorI18n = () => {
  const { t } = useTranslation();
  
  return {
    general: t('errors.general'),
    network: t('errors.network'),
    server: t('errors.server'),
    notFound: t('errors.notFound'),
    unauthorized: t('errors.unauthorized'),
    forbidden: t('errors.forbidden'),
    timeout: t('errors.timeout'),
    validation: t('errors.validation'),
    unknown: t('errors.unknown'),
  };
};

/**
 * Common i18n patterns for forms
 */
export const getFormI18nPatterns = (t: any) => ({
  // Common field labels
  name: t('common.name'),
  description: t('common.description'),
  email: t('common.email'),
  phone: t('common.phone'),
  address: t('common.address'),
  date: t('common.date'),
  time: t('common.time'),
  amount: t('common.amount'),
  quantity: t('common.quantity'),
  price: t('common.price'),
  total: t('common.total'),
  currency: t('common.currency'),
  type: t('common.type'),
  status: t('common.status'),
  notes: t('common.notes'),
  
  // Form buttons
  save: t('forms.save'),
  cancel: t('forms.cancel'),
  delete: t('forms.delete'),
  edit: t('forms.edit'),
  create: t('forms.create'),
  update: t('forms.update'),
  close: t('forms.close'),
  confirm: t('forms.confirm'),
  submit: t('forms.submit'),
  
  // Loading states
  loading: t('forms.loading'),
  saving: t('forms.saving'),
  deleting: t('forms.deleting'),
  
  // Messages
  success: t('forms.success'),
  error: t('forms.error'),
  warning: t('forms.warning'),
  info: t('forms.info'),
});

/**
 * Common i18n patterns for tables
 */
export const getTableI18nPatterns = (t: any) => ({
  noData: t('tables.noData'),
  loading: t('tables.loading'),
  search: t('tables.search'),
  filter: t('tables.filter'),
  sort: t('tables.sort'),
  export: t('tables.export'),
  import: t('tables.import'),
  refresh: t('tables.refresh'),
  rowsPerPage: t('tables.rowsPerPage'),
  of: t('tables.of'),
  actions: t('tables.actions'),
  view: t('tables.view'),
  edit: t('tables.edit'),
  delete: t('tables.delete'),
  copy: t('tables.copy'),
  download: t('tables.download'),
});

/**
 * Common i18n patterns for notifications
 */
export const getNotificationI18nPatterns = (t: any) => ({
  success: t('notifications.success'),
  error: t('notifications.error'),
  warning: t('notifications.warning'),
  info: t('notifications.info'),
  portfolioCreated: t('notifications.portfolioCreated'),
  portfolioUpdated: t('notifications.portfolioUpdated'),
  portfolioDeleted: t('notifications.portfolioDeleted'),
  assetAdded: t('notifications.assetAdded'),
  assetUpdated: t('notifications.assetUpdated'),
  assetDeleted: t('notifications.assetDeleted'),
  tradeExecuted: t('notifications.tradeExecuted'),
  depositAdded: t('notifications.depositAdded'),
  settingsSaved: t('notifications.settingsSaved'),
  operationFailed: t('notifications.operationFailed'),
  networkError: t('notifications.networkError'),
  unauthorized: t('notifications.unauthorized'),
  forbidden: t('notifications.forbidden'),
});

/**
 * Common i18n patterns for errors
 */
export const getErrorI18nPatterns = (t: any) => ({
  general: t('errors.general'),
  network: t('errors.network'),
  server: t('errors.server'),
  notFound: t('errors.notFound'),
  unauthorized: t('errors.unauthorized'),
  forbidden: t('errors.forbidden'),
  timeout: t('errors.timeout'),
  validation: t('errors.validation'),
  unknown: t('errors.unknown'),
});
