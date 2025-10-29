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
      lineHeight: 1.3,
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
      lineHeight: 1.3,
      //color: 'text.primary',
      ...overrides,
    }),
    
    cardValue: (overrides: any = {}) => getTypographySx('cardValue', {
      fontWeight: 600,
      lineHeight: 1.2,
      ...overrides,
    }),

    cardValueLarge: (overrides: any = {}) => getTypographySx('cardValueLarge', {
      fontWeight: 700,
      lineHeight: 1.2,
      ...overrides,
    }),
    cardValueMedium: (overrides: any = {}) => getTypographySx('cardValueMedium', {
      fontWeight: 500,
      lineHeight: 1.3,
      ...overrides,
    }),
    cardValueSmall: (overrides: any = {}) => getTypographySx('cardValueSmall', {
      fontWeight: 500,
      lineHeight: 1.3,
      ...overrides,
    }),
    
    cardLabel: (overrides: any = {}) => getTypographySx('cardLabel', {
      fontWeight: 400,
      lineHeight: 1.3,
      color: 'rgb(156, 163, 175)',
      ...overrides,
    }),

    labelMedium: (overrides: any = {}) => getTypographySx('medium', {
      fontWeight: 400,
      lineHeight: 1.3,
      color: 'text.primary',
      ...overrides,
    }),

    labelSmall: (overrides: any = {}) => getTypographySx('labelSmall', {
      fontWeight: 400,
      lineHeight: 1.3,
      color: 'rgb(156, 163, 175)',
      ...overrides,
    }),

    labelXSmall: (overrides: any = {}) => getTypographySx('xSmall', {
      fontWeight: 400,
      lineHeight: 1.3,
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
      lineHeight: 1.3,
      color: '#1a1a1a',
      ...overrides,
    }),
    
    pageTitle: (overrides: any = {}) => getTypographySx('title', {
      fontWeight: 600,
      lineHeight: 1.3,
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
      fontWeight: 500,
      lineHeight: 1.4,
      color: '#333333',
      ...overrides,
    }),
    
    tableCell: (overrides: any = {}) => getTypographySx('small', {
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
        xs: '0.625rem', // 10px (mobile readable)
        sm: '0.7rem',   // 11.2px
        md: '0.75rem',  // 12px
        lg: '0.8rem',   // 12.8px
        xl: '0.875rem', // 14px
      },
      ...overrides,
    }),
    
    tableCellSmall: (overrides: any = {}) => getTypographySx('xSmall', {
      fontWeight: 300,
      lineHeight: 1.4,
      color: '#1a1a1a',
      fontSize: {
        xs: '0.625rem', // 10px (mobile readable)
        sm: '0.7rem',   // 11.2px
        md: '0.75rem',  // 12px
        lg: '0.8rem',   // 12.8px
        xl: '0.875rem', // 14px
      },
      ...overrides,
    }),
    
    // Extra small table typography for very small screens
    tableHeaderXSmall: (overrides: any = {}) => getTypographySx('caption', {
      fontWeight: 600,
      lineHeight: 1.2,
      color: '#333333',
      fontSize: {
        xs: '0.625rem', // 10px (mobile readable)
        sm: '0.7rem',   // 11.2px
        md: '0.75rem',  // 12px
        lg: '0.8rem',   // 12.8px
        xl: '0.875rem', // 14px
      },
      ...overrides,
    }),
    
    tableCellXSmall: (overrides: any = {}) => getTypographySx('caption', {
      fontWeight: 400,
      lineHeight: 1.2,
      color: '#1a1a1a',
      fontSize: {
        xs: '0.625rem', // 10px (mobile readable)
        sm: '0.7rem',   // 11.2px
        md: '0.75rem',  // 12px
        lg: '0.8rem',   // 12.8px
        xl: '0.875rem', // 14px
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
