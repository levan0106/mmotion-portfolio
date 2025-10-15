import { useTranslation } from 'react-i18next';

/**
 * Custom hook for internationalization
 * Provides easy access to translation functions and language utilities
 */
export const useI18n = () => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    localStorage.setItem('i18nextLng', language);
  };

  const getCurrentLanguage = () => {
    return i18n.language;
  };

  const getAvailableLanguages = () => {
    return [
      { code: 'vi', name: t('language.vietnamese'), flag: '🇻🇳' },
      { code: 'en', name: t('language.english'), flag: '🇺🇸' },
    ];
  };

  const isRTL = () => {
    // Add RTL language support if needed
    return false;
  };

  return {
    t,
    changeLanguage,
    getCurrentLanguage,
    getAvailableLanguages,
    isRTL,
    i18n,
  };
};
