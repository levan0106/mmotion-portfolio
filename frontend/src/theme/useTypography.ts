import { useTheme } from '@mui/material/styles';
import { customTypography, getResponsiveFontSize } from './customTheme';

/**
 * Custom hook for using responsive typography variants
 */
export const useTypography = () => {
  const theme = useTheme();
  
  // Helper function to get responsive font size for any variant
  const getFontSize = (variant: keyof typeof customTypography) => {
    return getResponsiveFontSize(variant);
  };
  
  // Helper function to get responsive sx prop for typography
  const getTypographySx = (variant: keyof typeof customTypography, overrides: any = {}) => {
    const fontSize = getFontSize(variant);
    return {
      fontSize: {
        xs: fontSize.xs,
        sm: fontSize.sm,
        md: fontSize.md,
        lg: fontSize.lg,
        xl: fontSize.xl,
      },
      ...overrides,
    };
  };
  
  // Predefined typography variants for common use cases
  const variants = {
    // Chart typography
    chartTitle: (overrides: any = {}) => getTypographySx('chartTitle', {
      fontWeight: 400,
      lineHeight: 1.7,
      color: 'text.primary',
      ...overrides,
    }),
    
    chartSubtitle: (overrides: any = {}) => getTypographySx('chartSubtitle', {
      fontWeight: 400,
      lineHeight: 1.3,
      color: 'rgb(156, 163, 175)',
      ...overrides,
    }),
    
    chartLegend: (overrides: any = {}) => getTypographySx('chartLegend', {
      fontWeight: 400,
      lineHeight: 1.0,
      color: 'rgb(156, 163, 175)',
      ...overrides,
    }),
    
    chartTooltip: (overrides: any = {}) => getTypographySx('chartTooltip', {
      fontWeight: 400,
      lineHeight: 1.3,
      color: 'rgb(156, 163, 175)',
      ...overrides,
    }),
    
    // Card typography
    cardTitle: (overrides: any = {}) => getTypographySx('cardTitle', {
      fontWeight: 600,
      lineHeight: 1.7,
      //color: 'text.primary',
      ...overrides,
    }),
    
    cardValue: (overrides: any = {}) => getTypographySx('cardValue', {
      fontWeight: 700,
      lineHeight: 1.7,
      wordBreak: 'break-word',
      ...overrides,
    }),

    cardValueLarge: (overrides: any = {}) => getTypographySx('cardValueLarge', {
      fontWeight: 700,
      lineHeight: 1.7,
      wordBreak: 'break-word',
      ...overrides,
    }),
    cardValueMedium: (overrides: any = {}) => getTypographySx('cardValueMedium', {
      fontWeight: 500,
      lineHeight: 1.7,
      wordBreak: 'break-word',
      ...overrides,
    }),
    cardValueSmall: (overrides: any = {}) => getTypographySx('cardValueSmall', {
      fontWeight: 500,
      lineHeight: 1.7,
      wordBreak: 'break-word',
      ...overrides,
    }),
    
    cardLabel: (overrides: any = {}) => getTypographySx('cardLabel', {
      fontWeight: 400,
      lineHeight: 1.7,
      color: 'rgb(156, 163, 175)',
      ...overrides,
    }),

    labelSmall: (overrides: any = {}) => getTypographySx('labelSmall', {
      fontWeight: 400,
      lineHeight: 1.6,
      color: 'rgb(156, 163, 175)',
      ...overrides,
    }),
    
    cardSubtitle: (overrides: any = {}) => getTypographySx('cardLabel', {
      fontWeight: 300,
      lineHeight: 1.3,
      color: 'rgb(156, 163, 175)',
      ...overrides,
    }),
    
    // Header typography
    pageHeader: (overrides: any = {}) => getTypographySx('header', {
      fontWeight: 300,
      lineHeight: 1.6,
      color: '#1a1a1a',
      ...overrides,
    }),
    
    pageTitle: (overrides: any = {}) => getTypographySx('title', {
      fontWeight: 600,
      lineHeight: 1.6,
      color: '#1a1a1a',
      ...overrides,
    }),
    
    pageSubtitle: (overrides: any = {}) => getTypographySx('subtitle', {
      fontWeight: 400,
      lineHeight: 1.4,
      color: 'rgb(156, 163, 175)',
      ...overrides,
    }),
    
    // Tab typography
    tabLabel: (overrides: any = {}) => getTypographySx('tab', {
      fontWeight: 600,
      textTransform: 'none',
      ...overrides,
    }),
    
    // Button typography
    buttonText: (overrides: any = {}) => getTypographySx('button', {
      fontWeight: 600,
      textTransform: 'none',
      ...overrides,
    }),
    
    // Form typography
    formLabel: (overrides: any = {}) => getTypographySx('small', {
      fontWeight: 500,
      lineHeight: 1.4,
      color: '#333333',
      ...overrides,
    }),
    
    formHelper: (overrides: any = {}) => getTypographySx('caption', {
      fontWeight: 400,
      lineHeight: 1.3,
      color: 'rgb(156, 163, 175)',
      ...overrides,
    }),
    
    // Table typography
    tableHeader: (overrides: any = {}) => getTypographySx('small', {
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#333333',
      ...overrides,
    }),
    
    tableCell: (overrides: any = {}) => getTypographySx('xSmall', {
      fontWeight: 400,
      lineHeight: 1.4,
      color: '#1a1a1a',
      ...overrides,
    }),
    
    // Responsive table typography for small screens
    tableHeaderSmall: (overrides: any = {}) => getTypographySx('caption', {
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#333333',
      fontSize: {
        xs: '0.6rem',
        sm: '0.65rem',
        md: '0.7rem',
        lg: '0.75rem',
        xl: '0.8rem',
      },
      ...overrides,
    }),
    
    tableCellSmall: (overrides: any = {}) => getTypographySx('caption', {
      fontWeight: 300,
      lineHeight: 1.4,
      color: '#1a1a1a',
      fontSize: {
        xs: '0.50rem',
        sm: '0.55rem',
        md: '0.60rem',
        lg: '0.65rem',
        xl: '0.70rem',
      },
      ...overrides,
    }),
    
    // Extra small table typography for very small screens
    tableHeaderXSmall: (overrides: any = {}) => getTypographySx('caption', {
      fontWeight: 600,
      lineHeight: 1.2,
      color: '#333333',
      fontSize: {
        xs: '0.55rem',
        sm: '0.6rem',
        md: '0.65rem',
        lg: '0.7rem',
        xl: '0.75rem',
      },
      ...overrides,
    }),
    
    tableCellXSmall: (overrides: any = {}) => getTypographySx('caption', {
      fontWeight: 400,
      lineHeight: 1.2,
      color: '#1a1a1a',
      fontSize: {
        xs: '0.55rem',
        sm: '0.6rem',
        md: '0.65rem',
        lg: '0.7rem',
        xl: '0.75rem',
      },
      ...overrides,
    }),
    
    // Status typography
    statusText: (overrides: any = {}) => getTypographySx('small', {
      fontWeight: 500,
      lineHeight: 1.3,
      ...overrides,
    }),
    
    // Error/Success typography
    errorText: (overrides: any = {}) => getTypographySx('small', {
      fontWeight: 400,
      lineHeight: 1.3,
      color: '#dc2626',
      ...overrides,
    }),
    
    successText: (overrides: any = {}) => getTypographySx('small', {
      fontWeight: 400,
      lineHeight: 1.3,
      color: '#059669',
      ...overrides,
    }),
  };
  
  return {
    getFontSize,
    getTypographySx,
    variants,
    theme,
  };
};

export default useTypography;
