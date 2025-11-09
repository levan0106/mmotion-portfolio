import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Box,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Language as LanguageIcon } from '@mui/icons-material';

interface LanguageSwitcherProps {
  variant?: 'select' | 'buttons';
  size?: 'small' | 'medium';
  showLabel?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'select',
  size = 'small',
  showLabel = true,
}) => {
  const { i18n, t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleLanguageChange = (event: SelectChangeEvent) => {
    const newLanguage = event.target.value;
    i18n.changeLanguage(newLanguage);
    localStorage.setItem('i18nextLng', newLanguage);
  };

  const languages = [
    { code: 'en', name: t('language.english'), flag: '🇺🇸' },
    { code: 'vi', name: t('language.vietnamese'), flag: '🇻🇳' },
  ];

  // Hide on mobile
  if (isMobile) {
    return null;
  }

  if (variant === 'buttons') {
    return (
      <Box display="flex" gap={1}>
        {languages.map((lang) => (
          <Box
            key={lang.code}
            onClick={() => {
              i18n.changeLanguage(lang.code);
              localStorage.setItem('i18nextLng', lang.code);
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              padding: '4px 8px',
              borderRadius: 1,
              cursor: 'pointer',
              backgroundColor: i18n.language === lang.code ? 'primary.main' : 'transparent',
              color: i18n.language === lang.code ? 'primary.contrastText' : 'text.primary',
              '&:hover': {
                backgroundColor: i18n.language === lang.code ? 'primary.dark' : 'action.hover',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <Typography variant="body2">{lang.flag}</Typography>
            <Typography variant="body2" fontSize="0.75rem">
              {lang.name}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <FormControl size={size} sx={{ minWidth: 120 }}>
      {showLabel && (
        <InputLabel id="language-select-label">
          <Box display="flex" alignItems="center" gap={0.5}>
            <LanguageIcon fontSize="small" />
            {t('navigation.language')}
          </Box>
        </InputLabel>
      )}
      <Select
        labelId="language-select-label"
        value={i18n.language}
        onChange={handleLanguageChange}
        label={showLabel ? t('navigation.language') : undefined}
        sx={{
          '& .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          },
        }}
      >
        {languages.map((lang) => (
          <MenuItem key={lang.code} value={lang.code}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Typography variant="body2">{lang.flag}</Typography>
              <Typography variant="body2">{lang.name}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
